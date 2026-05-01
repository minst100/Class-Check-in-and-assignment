const express = require('express');
const jwt = require('jsonwebtoken');
const { auth, authorize } = require('../middleware/auth');
const { User, Class, Enrollment, ClassSession, AttendanceRecord, LeaveRequest, AttendanceWeight, GuardianLink, NotificationPreference } = require('../models');
const { logAction } = require('../services/audit');
const { signSessionToken } = require('../verification/token');
const { verifyCheckIn, auditVerificationDecision } = require('../verification');
const { queueAndDeliver } = require('../notifications');
const { NOTIFICATION_EVENTS } = require('../notifications/constants');

const router = express.Router();

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
  return res.json({ access_token: token, token_type: 'Bearer' });
});

router.post('/users', async (req, res) => {
  const user = User.build(req.body); await user.setPassword(req.body.password); await user.save(); res.status(201).json(user);
});

router.post('/classes', auth, authorize('admin', 'teacher'), async (req, res) => res.status(201).json(await Class.create({ ...req.body, teacher_id: req.user.sub })));
router.get('/classes', auth, async (req, res) => res.json(await Class.findAll()));
router.patch('/classes/:id', auth, authorize('admin', 'teacher'), async (req, res) => { const c = await Class.findByPk(req.params.id); await c.update(req.body);
  if (req.body.name || req.body.semester || req.body.status) {
    const enrollments = await Enrollment.findAll({ where: { class_id: c.id } });
    for (const e of enrollments) {
      await queueAndDeliver({ eventType: NOTIFICATION_EVENTS.SCHEDULE_CHANGED, userId: e.student_id, subject: 'Class schedule updated', placeholders: { class_name: c.name, message: 'Class details were updated', date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), teacher_contact: req.user.email || 'N/A' } });
    }
  }
  res.json(c); });
router.delete('/classes/:id', auth, authorize('admin'), async (req, res) => { const c = await Class.findByPk(req.params.id); await c.destroy(); res.status(204).send(); });

router.post('/classes/:id/roster', auth, authorize('admin', 'teacher'), async (req, res) => res.status(201).json(await Enrollment.create({ class_id: req.params.id, ...req.body })));
router.post('/classes/:id/archive', auth, authorize('admin'), async (req, res) => { const c = await Class.findByPk(req.params.id); await c.update({ status: 'archived', archived_at: new Date() }); res.json(c); });

router.post('/classes/:id/sessions/recurring', auth, authorize('admin', 'teacher'), async (req, res) => {
  const s = await ClassSession.create({ class_id: req.params.id, ...req.body, status: 'scheduled' });
  res.status(201).json(s);
});
router.post('/sessions/:id/open', auth, authorize('admin', 'teacher'), async (req, res) => {
  const s = await ClassSession.findByPk(req.params.id);
  const token = signSessionToken(s.id);
  const tokenExpiresAt = new Date(Date.now() + 120000);
  await s.update({
    status: 'open',
    one_time_token: token,
    token_expires_at: tokenExpiresAt,
    opens_at: s.opens_at || s.starts_at,
    closes_at: s.closes_at || s.ends_at
  });
  await logAction(req.user.sub, 'session_open', 'class_session', s.id, { token_expires_at: tokenExpiresAt });
  res.json({ ...s.toJSON(), qr_payload: token, token_expires_at: tokenExpiresAt });
});
router.post('/sessions/:id/close', auth, authorize('admin', 'teacher'), async (req, res) => { const s = await ClassSession.findByPk(req.params.id); await s.update({ status: 'closed' }); await logAction(req.user.sub, 'session_close', 'class_session', s.id); res.json(s); });

router.post('/sessions/:id/check-in', auth, authorize('student'), async (req, res) => {
  const s = await ClassSession.findByPk(req.params.id);
  const now = new Date();
  const decision = await verifyCheckIn({
    session: s,
    studentId: req.user.sub,
    oneTimeToken: req.body.one_time_token,
    location: req.body.location,
    fingerprint: req.body.fingerprint,
    biometricResult: req.body.biometric_result,
    now
  });

  await auditVerificationDecision({
    actorUserId: req.user.sub,
    sessionId: s ? s.id : null,
    decision,
    metadata: { location: req.body.location || null, fingerprint: req.body.fingerprint || null }
  });

  if (!decision.ok) return res.status(400).json({ error: 'Verification failed', reason_code: decision.reasonCode, anomalies: decision.anomalies || [] });

  const rec = await AttendanceRecord.create({
    class_session_id: s.id,
    student_id: req.user.sub,
    checked_in_at: now,
    status: decision.status,
    verification_meta: {
      ...req.body.verification_meta,
      reason_code: decision.reasonCode,
      anomalies: decision.anomalies,
      distance_meters: decision.distanceMeters || null,
      fingerprint: req.body.fingerprint || null,
      biometric_result: req.body.biometric_result || null
    },
    location_snapshot: req.body.location || null
  });
  if (['late', 'absent'].includes(rec.status)) {
    await queueAndDeliver({
      eventType: NOTIFICATION_EVENTS.ATTENDANCE_LATE_ABSENT,
      userId: req.user.sub,
      subject: 'Attendance alert',
      placeholders: { student_name: req.user.email, status: rec.status, class_name: 'Your class session', date: now.toLocaleDateString(), time: now.toLocaleTimeString(), teacher_contact: 'Teacher via portal' }
    });
  }
  res.status(201).json(rec);
});

router.post('/leave-requests', auth, authorize('student'), async (req, res) => { const leave = LeaveRequest.build({ ...req.body, student_id: req.user.sub }); leave.setReason(req.body.reason); await leave.save(); await logAction(req.user.sub, 'leave_submit', 'leave_request', leave.id); res.status(201).json(leave); });
router.post('/leave-requests/:id/review', auth, authorize('admin', 'teacher'), async (req, res) => { const leave = await LeaveRequest.findByPk(req.params.id); await leave.update({ status: req.body.status, reviewed_by: req.user.sub, reviewed_at: new Date() }); await logAction(req.user.sub, `leave_${req.body.status}`, 'leave_request', leave.id);
  await queueAndDeliver({ eventType: NOTIFICATION_EVENTS.LEAVE_REQUEST_DECISION, userId: leave.student_id, subject: 'Leave request decision', placeholders: { class_name: 'Class', date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), status: leave.status, teacher_contact: 'Teacher via portal' } });
  res.json(leave); });

router.get('/classes/:id/attendance-summary', auth, authorize('admin', 'teacher'), async (req, res) => {
  const records = await AttendanceRecord.findAll({ include: [{ model: ClassSession, where: { class_id: req.params.id } }] });
  const total = records.length || 1;
  const presentLike = records.filter((r) => ['present', 'late', 'excused'].includes(r.status)).length;
  res.json({ class_id: req.params.id, total_records: records.length, attendance_percentage: (presentLike / total) * 100 });
});
router.post('/classes/:id/attendance-weight', auth, authorize('admin', 'teacher'), async (req, res) => res.status(201).json(await AttendanceWeight.create({ class_id: req.params.id, percentage_weight: req.body.percentage_weight })));
router.get('/classes/:id/grade-contribution/:studentId', auth, authorize('admin', 'teacher', 'student'), async (req, res) => {
  const weight = await AttendanceWeight.findOne({ where: { class_id: req.params.id } });
  const records = await AttendanceRecord.findAll({ where: { student_id: req.params.studentId }, include: [{ model: ClassSession, where: { class_id: req.params.id } }] });
  const base = records.length ? (records.filter((r) => ['present', 'late', 'excused'].includes(r.status)).length / records.length) : 0;
  const contribution = base * ((weight && weight.percentage_weight) || 0);
  res.json({ student_id: req.params.studentId, class_id: req.params.id, contribution });
});

router.post('/retention/run', auth, authorize('admin'), async (req, res) => {
  const before = new Date(Date.now() - (req.body.days || 30) * 24 * 60 * 60 * 1000);
  const [count] = await AttendanceRecord.update({ location_snapshot: null }, { where: { created_at: { [require('sequelize').Op.lt]: before } } });
  await logAction(req.user.sub, 'retention_cleanup', 'attendance_records', null, { redacted_locations: count });
  res.json({ redacted_locations: count });
});


router.post('/classes/:id/announcements', auth, authorize('admin', 'teacher'), async (req, res) => {
  const c = await Class.findByPk(req.params.id);
  const enrollments = await Enrollment.findAll({ where: { class_id: c.id } });
  for (const e of enrollments) {
    await queueAndDeliver({ eventType: NOTIFICATION_EVENTS.TEACHER_ANNOUNCEMENT, userId: e.student_id, subject: `Announcement: ${c.name}`, placeholders: { class_name: c.name, message: req.body.message, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), teacher_contact: req.user.email || 'N/A' } });
  }
  res.status(201).json({ delivered_to: enrollments.length });
});

router.post('/students/:id/guardians', auth, authorize('admin', 'teacher'), async (req, res) => {
  const link = await GuardianLink.create({ student_id: req.params.id, guardian_id: req.body.guardian_id, relationship: req.body.relationship, can_receive_notifications: req.body.can_receive_notifications !== false, linked_by: req.user.sub });
  res.status(201).json(link);
});

router.get('/students/:id/guardians', auth, async (req, res) => {
  res.json(await GuardianLink.findAll({ where: { student_id: req.params.id } }));
});

router.put('/users/:id/notification-preferences', auth, async (req, res) => {
  if (req.user.sub !== req.params.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const prefs = Array.isArray(req.body.preferences) ? req.body.preferences : [];
  await NotificationPreference.destroy({ where: { user_id: req.params.id } });
  const created = await NotificationPreference.bulkCreate(prefs.map((p, idx) => ({ user_id: req.params.id, channel: p.channel, opted_in: p.opted_in !== false, priority: p.priority || (idx + 1) })));
  res.json(created);
});

router.get('/users/:id/notification-preferences', auth, async (req, res) => {
  if (req.user.sub !== req.params.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  res.json(await NotificationPreference.findAll({ where: { user_id: req.params.id }, order: [['priority', 'ASC']] }));
});

module.exports = router;
