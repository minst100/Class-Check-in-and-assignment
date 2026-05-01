import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_sync_queue_v1';

export async function getQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addToQueue(payload) {
  const queue = await getQueue();
  const record = { ...payload, localId: `${Date.now()}_${Math.random()}` };
  queue.push(record);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return record;
}

export async function syncQueue(simulatedServerVersion = Date.now()) {
  const queue = await getQueue();
  const resolved = [];
  const conflicts = [];

  queue.forEach((item) => {
    const isConflict = item.clientVersion && item.clientVersion < simulatedServerVersion;
    if (isConflict) {
      conflicts.push({ ...item, status: 'conflict', action: 'server_wins_then_retry' });
      return;
    }
    resolved.push({ ...item, status: 'synced' });
  });

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(conflicts));
  return { resolved, conflicts };
}
