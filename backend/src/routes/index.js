const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { auth, authorize } = require('../middleware/auth');
const { User, Class, Enrollment, ClassSession, AttendanceRecord, LeaveRequest, AttendanceWeight } = require('../models');
const { logAction } = require('../services/audit');

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
router.patch('/classes/:id', auth, authorize('admin', 'teacher'), async (req, res) => { const c = await Class.findByPk(req.params.id); await c.update(req.body); res.json(c); });
router.delete('/classes/:id', auth, authorize('admin'), async (req, res) => { const c = await Class.findByPk(req.params.id); await c.destroy(); res.status(204).send(); });

router.post('/classes/:id/roster', auth, authorize('admin', 'teacher'), async (req, res) => res.status(201).json(await Enrollment.create({ class_id: req.params.id, ...req.body })));
router.post('/classes/:id/archive', auth, authorize('admin'), async (req, res) => { const c = await Class.findByPk(req.params.id); await c.update({ status: 'archived', archived_at: new Date() }); res.json(c); });

router.post('/classes/:id/sessions/recurring', auth, authorize('admin', 'teacher'), async (req, res) => {
  const s = await ClassSession.create({ class_id: req.params.id, ...req.body, status: 'scheduled' });
  res.status(201).json(s);
});
router.post('/sessions/:id/open', auth, authorize('admin', 'teacher'), async (req, res) => {
  const s = await ClassSession.findByPk(req.params.id); const token = uuid(); await s.update({ status: 'open', one_time_token: token });
  await logAction(req.user.sub, 'session_open', 'class_session', s.id, { token }); res.json({ ...s.toJSON(), qr_session_id: token });
});
router.post('/sessions/:id/close', auth, authorize('admin', 'teacher'), async (req, res) => { const s = await ClassSession.findByPk(req.params.id); await s.update({ status: 'closed' }); await logAction(req.user.sub, 'session_close', 'class_session', s.id); res.json(s); });

router.post('/sessions/:id/check-in', auth, authorize('student'), async (req, res) => {
  const s = await ClassSession.findByPk(req.params.id);
  if (!s || s.status !== 'open' || s.one_time_token !== req.body.one_time_token) return res.status(400).json({ error: 'Session unavailable' });
  const lateThreshold = new Date(new Date(s.starts_at).getTime() + s.grace_minutes * 60000);
  const now = new Date();
  const status = now > lateThreshold ? 'late' : 'present';
  const rec = await AttendanceRecord.create({ class_session_id: s.id, student_id: req.user.sub, checked_in_at: now, status, verification_meta: req.body.verification_meta, location_snapshot: req.body.location || null });
  res.status(201).json(rec);
});

router.post('/leave-requests', auth, authorize('student'), async (req, res) => { const leave = LeaveRequest.build({ ...req.body, student_id: req.user.sub }); leave.setReason(req.body.reason); await leave.save(); await logAction(req.user.sub, 'leave_submit', 'leave_request', leave.id); res.status(201).json(leave); });
router.post('/leave-requests/:id/review', auth, authorize('admin', 'teacher'), async (req, res) => { const leave = await LeaveRequest.findByPk(req.params.id); await leave.update({ status: req.body.status, reviewed_by: req.user.sub, reviewed_at: new Date() }); await logAction(req.user.sub, `leave_${req.body.status}`, 'leave_request', leave.id); res.json(leave); });

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

module.exports = router;
