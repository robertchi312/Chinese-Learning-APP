import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { CHARACTERS } from '../data/characters';
import { SrsState, stats, dayOfYear } from '../srs';
import { colors } from '../theme';

interface Props {
  srs: SrsState;
  onStartReview: () => void;
}

export default function HomeScreen({ srs, onStartReview }: Props) {
  const daily = CHARACTERS[dayOfYear() % CHARACTERS.length];
  const s = stats(srs, CHARACTERS);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.dailyCard}>
        <Text style={styles.label}>CHARACTER OF THE DAY</Text>
        <Text style={styles.dailyChar}>{daily.char}</Text>
        <Text style={styles.dailyPinyin}>{daily.pinyin}</Text>
        <Text style={styles.dailyMeaning}>{daily.meaning}</Text>
        <Text style={styles.dailyExample}>
          {daily.example} ({daily.examplePinyin}) — {daily.exampleMeaning}
        </Text>
        <TouchableOpacity onPress={() => Speech.speak(daily.char, { language: 'zh-CN', rate: 0.8 })}>
          <Text style={styles.speakBtn}>🔊 Listen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatBox num={s.due} label="due now" />
        <StatBox num={s.learning} label="learning" />
        <StatBox num={s.mastered} label="mastered" />
        <StatBox num={s.total} label="total" />
      </View>

      <TouchableOpacity style={styles.reviewBtn} onPress={onStartReview}>
        <Text style={styles.reviewBtnText}>Start review session</Text>
      </TouchableOpacity>

      <Text style={styles.streak}>🔥 {s.streak}-day streak</Text>
    </ScrollView>
  );
}

function StatBox({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18 },
  dailyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  label: { fontSize: 11, letterSpacing: 1.5, color: colors.muted, marginBottom: 6 },
  dailyChar: { fontSize: 88, color: colors.ink, lineHeight: 100 },
  dailyPinyin: { fontSize: 24, color: colors.red, fontWeight: '600' },
  dailyMeaning: { fontSize: 17, color: colors.ink, marginTop: 2 },
  dailyExample: { fontSize: 14, color: colors.muted, marginTop: 8, textAlign: 'center' },
  speakBtn: { color: colors.red, fontWeight: '600', marginTop: 12, fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.red },
  statLabel: { fontSize: 11, color: colors.muted },
  reviewBtn: {
    backgroundColor: colors.red,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  reviewBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  streak: { textAlign: 'center', marginTop: 16, fontSize: 15, color: colors.ink },
});
