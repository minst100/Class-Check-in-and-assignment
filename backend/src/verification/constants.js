const VerificationReasonCodes = Object.freeze({
  VERIFIED: 'verified',
  SESSION_NOT_FOUND: 'session_not_found',
  SESSION_NOT_OPEN: 'session_not_open',
  OUTSIDE_TIME_WINDOW: 'outside_time_window',
  INVALID_TOKEN: 'invalid_token',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_MISMATCH: 'token_mismatch',
  GEO_REQUIRED: 'geo_required',
  OUTSIDE_GEOFENCE: 'outside_geofence',
  DUPLICATE_CHECKIN: 'duplicate_checkin',
  DEVICE_MISMATCH: 'device_mismatch',
  FINGERPRINT_MISSING: 'fingerprint_missing',
  BIOMETRIC_UNAVAILABLE: 'biometric_unavailable',
  BIOMETRIC_FAILED: 'biometric_failed'
});

module.exports = { VerificationReasonCodes };
