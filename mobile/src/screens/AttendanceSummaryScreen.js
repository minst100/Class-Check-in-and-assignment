import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AttendanceSummaryScreen() {
  const data = [
    { label: 'Present', count: 18 },
    { label: 'Late', count: 2 },
    { label: 'Leave', count: 1 },
    { label: 'Absent', count: 0 }
  ];

  return (
    <View>
      {data.map((d) => (
        <View key={d.label} style={styles.card}>
          <Text style={styles.label}>{d.label}</Text>
          <Text style={styles.count}>{d.count}</Text>
        </View>
      ))}
      <Text style={styles.tip}>Low-bandwidth mode: no heavy charts, compact cards, no remote images.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#334155', fontWeight: '700' },
  count: { color: '#2563eb', fontWeight: '700' },
  tip: { marginTop: 12, color: '#64748b', fontSize: 12 }
});
