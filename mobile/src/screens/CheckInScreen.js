import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import { useLanguage } from '../context/LanguageContext';
import { addToQueue, getQueue, syncQueue } from '../services/syncQueue';
import { buildVerificationPayload } from '../hooks/useVerificationPayload';

export default function CheckInScreen() {
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [location, setLocation] = useState(null);
  const [token, setToken] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  async function reloadQueue() {
    setQueue(await getQueue());
  }

  useEffect(() => {
    reloadQueue();
  }, []);

  async function captureLocationOnce() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location denied', 'Check-in requires one-time location capture.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude, at: new Date().toISOString() });
  }

  async function pushItem(type) {
    if (!location) {
      Alert.alert('Missing location', 'Please capture location before submitting.');
      return;
    }

    await addToQueue({
      type,
      ...buildVerificationPayload({ token, location, biometricResult: null }),
      clientVersion: Date.now(),
      createdAt: new Date().toISOString()
    });
    setToken('');
    await reloadQueue();
  }

  async function processSync() {
    const result = await syncQueue();
    Alert.alert(
      'Sync Complete',
      `Synced: ${result.resolved.length}, conflicts: ${result.conflicts.length}. Conflicts stay queued for review.`
    );
    await reloadQueue();
  }

  if (scannerOpen) {
    return (
      <BarCodeScanner
        onBarCodeScanned={({ data }) => {
          setToken(data);
          setScannerOpen(false);
        }}
        style={StyleSheet.absoluteFillObject}
      />
    );
  }

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={captureLocationOnce}><Text style={styles.btnText}>{t('captureLocation')}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => setScannerOpen(true)}><Text style={styles.btnText}>{t('scanQr')}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => pushItem('checkin')}><Text style={styles.btnText}>{t('makeCheckIn')}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => pushItem('leave')}><Text style={styles.btnText}>{t('makeLeave')}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.syncBtn} onPress={processSync}><Text style={styles.btnText}>{t('syncNow')}</Text></TouchableOpacity>

      <Text style={styles.sectionTitle}>{t('pendingQueue')} ({queue.length})</Text>
      <FlatList
        data={queue}
        keyExtractor={(item) => item.localId}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.type} • {item.createdAt}</Text>
            <Text style={styles.itemSub}>{item.status || 'pending'} | {item.fingerprint?.signalId} | {item.verification_meta?.local_biometric_only ? 'local-biometric' : 'no-biometric'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: '#2e62ff', marginBottom: 8, borderRadius: 8, padding: 12 },
  syncBtn: { backgroundColor: '#16a34a', marginBottom: 8, borderRadius: 8, padding: 12 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  sectionTitle: { marginTop: 12, marginBottom: 8, fontWeight: '700', color: '#334155' },
  item: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8 },
  itemText: { color: '#1f2937', fontWeight: '600' },
  itemSub: { color: '#64748b', fontSize: 12, marginTop: 4 }
});
