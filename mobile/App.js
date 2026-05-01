import React, { useMemo, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import CheckInScreen from './src/screens/CheckInScreen';
import AttendanceSummaryScreen from './src/screens/AttendanceSummaryScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const TABS = ['checkin', 'summary', 'notifications'];

function MainApp() {
  const [tab, setTab] = useState('checkin');
  const { t, lang, setLang } = useLanguage();

  const content = useMemo(() => {
    if (tab === 'summary') return <AttendanceSummaryScreen />;
    if (tab === 'notifications') return <NotificationsScreen />;
    return <CheckInScreen />;
  }, [tab]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('appTitle')}</Text>
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLang(lang === 'en' ? 'th' : 'en')}
        >
          <Text style={styles.langText}>{lang.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        {TABS.map((item) => (
          <TouchableOpacity key={item} style={styles.tab} onPress={() => setTab(item)}>
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{t(item)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{content}</View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1d2a44' },
  langButton: { backgroundColor: '#1d2a44', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  langText: { color: '#fff', fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e4e8ef' },
  tab: { flex: 1, padding: 10 },
  tabText: { textAlign: 'center', color: '#7082a3' },
  tabTextActive: { color: '#2e62ff', fontWeight: '700' },
  content: { flex: 1, padding: 12 }
});
