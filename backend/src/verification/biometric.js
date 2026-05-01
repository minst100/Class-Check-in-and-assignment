class BiometricProvider {
  // provider should return { match: boolean, score?: number, vendor?: string }
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  async matchTemplate({ studentId, probeTemplate, claimedTemplateRef }) {
    throw new Error('Biometric provider not implemented');
  }
}

class LocalOnlyBiometricProvider extends BiometricProvider {
  async matchTemplate({ localResult }) {
    if (!localResult) return { match: false, reasonCode: 'biometric_unavailable', mode: 'on_device' };
    return { match: !!localResult.match, score: localResult.score || null, mode: 'on_device' };
  }
}

module.exports = { BiometricProvider, LocalOnlyBiometricProvider };
