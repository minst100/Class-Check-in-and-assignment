import { getPrivacySafeFingerprint } from '../services/fingerprint';

export function buildVerificationPayload({ token, location, biometricResult }) {
  return {
    one_time_token: token,
    location,
    fingerprint: getPrivacySafeFingerprint(),
    biometric_result: biometricResult || null,
    verification_meta: {
      captured_at: new Date().toISOString(),
      local_biometric_only: true
    }
  };
}
