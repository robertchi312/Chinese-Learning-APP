import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import FlashcardsScreen from './src/screens/FlashcardsScreen';
import QuizScreen from './src/screens/QuizScreen';
import WriteScreen from './src/screens/WriteScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import { SrsState, loadState, saveState, emptyState } from './src/srs';
import { colors } from './src/theme';

type Tab = 'today' | 'learn' | 'quiz' | 'write' | 'browse';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'today', icon: '🏠', label: 'Today' },
  { key: 'learn', icon: '🎴', label: 'Learn' },
  { key: 'quiz', icon: '❓', label: 'Quiz' },
  { key: 'write', icon: '✍️', label: 'Write' },
  { key: 'browse', icon: '📚', label: 'Browse' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [srs, setSrs] = useState<SrsState | null>(null);

  useEffect(() => {
    loadState().then(setSrs);
  }, []);

  const updateSrs = (next: SrsState) => {
    setSrs(next);
    saveState(next).catch(() => {});
  };

  if (!srs) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator size="large" color={colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" backgroundColor={colors.red} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Text style={styles.headerLogo}>学 </Text>汉字 Trainer
        </Text>
      </View>

      <View style={styles.body}>
        {tab === 'today' && <HomeScreen srs={srs} onStartReview={() => setTab('learn')} />}
        {tab === 'learn' && <FlashcardsScreen srs={srs} onUpdate={updateSrs} onDone={() => setTab('today')} />}
        {tab === 'quiz' && <QuizScreen srs={srs} />}
        {tab === 'write' && <WriteScreen />}
        {tab === 'browse' && <BrowseScreen srs={srs} />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.red, paddingVertical: 14, paddingHorizontal: 18 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerLogo: { fontSize: 18 },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 6,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: colors.muted },
  tabLabelActive: { color: colors.red, fontWeight: '700' },
});
