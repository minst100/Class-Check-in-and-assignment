import * as Device from 'expo-device';
import { Platform } from 'react-native';

function hashCode(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash)}`;
}

export function getPrivacySafeFingerprint() {
  const raw = [
    Platform.OS,
    Device.osVersion || 'unknown',
    Device.brand || 'generic',
    Device.modelName || 'model',
    Device.deviceType || 'type'
  ].join('|');

  return {
    signalId: hashCode(raw),
    source: 'coarse-device-signal',
    note: 'No unique hardware IDs, contacts, or biometric data are collected.'
  };
}
