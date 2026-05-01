import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const notifications = [
  { id: '1', msg: 'Check-in opens at 08:50', at: '07:30' },
  { id: '2', msg: 'Leave request approved', at: 'Yesterday' }
];

export default function NotificationsScreen() {
  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.msg}>{item.msg}</Text>
          <Text style={styles.at}>{item.at}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
  msg: { fontWeight: '600', color: '#0f172a' },
  at: { fontSize: 12, color: '#64748b', marginTop: 4 }
});
