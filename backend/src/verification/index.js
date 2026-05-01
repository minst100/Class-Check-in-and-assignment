const { AttendanceRecord } = require('../models');
const { validateGeofence } = require('./geo');
const { verifySessionToken } = require('./token');
const { VerificationReasonCodes } = require('./constants');
const { logAction } = require('../services/audit');

async function verifyCheckIn({ session, studentId, oneTimeToken, location, fingerprint, biometricResult, now = new Date() }) {
  if (!session) return { ok: false, reasonCode: VerificationReasonCodes.SESSION_NOT_FOUND };
  if (session.status !== 'open') return { ok: false, reasonCode: VerificationReasonCodes.SESSION_NOT_OPEN };

  const openAt = new Date(session.opens_at || session.starts_at);
  const closeAt = new Date(session.closes_at || session.ends_at);
  if (now < openAt || now > closeAt) return { ok: false, reasonCode: VerificationReasonCodes.OUTSIDE_TIME_WINDOW };

  const tokenValidation = verifySessionToken(oneTimeToken, session.id);
  if (!tokenValidation.ok) return { ok: false, reasonCode: tokenValidation.reasonCode };

  const existing = await AttendanceRecord.findOne({ where: { class_session_id: session.id, student_id: studentId } });
  if (existing) return { ok: false, reasonCode: VerificationReasonCodes.DUPLICATE_CHECKIN };

  const geoResult = validateGeofence(session, location);
  if (!geoResult.ok) return { ok: false, reasonCode: geoResult.reasonCode, distanceMeters: geoResult.distanceMeters };

  if (!fingerprint || !fingerprint.signalId) {
    return { ok: false, reasonCode: VerificationReasonCodes.FINGERPRINT_MISSING };
  }

  const anomalies = [];
  if (session.expected_device_signal_id && session.expected_device_signal_id !== fingerprint.signalId) {
    anomalies.push('device_signal_id_mismatch');
  }

  if (biometricResult && biometricResult.match === false) {
    return { ok: false, reasonCode: VerificationReasonCodes.BIOMETRIC_FAILED, anomalies };
  }

  const lateThreshold = new Date(new Date(session.starts_at).getTime() + session.grace_minutes * 60000);
  const status = now > lateThreshold ? 'late' : 'present';

  return {
    ok: true,
    status,
    anomalies,
    distanceMeters: geoResult.distanceMeters,
    reasonCode: VerificationReasonCodes.VERIFIED
  };
}

async function auditVerificationDecision({ actorUserId, sessionId, decision, metadata }) {
  await logAction(actorUserId, 'verification_decision', 'class_session', sessionId, {
    reason_code: decision.reasonCode,
    ok: decision.ok,
    ...metadata
  });
}

module.exports = { verifyCheckIn, auditVerificationDecision, VerificationReasonCodes };
