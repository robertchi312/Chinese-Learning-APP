import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { Character, CHARACTERS } from '../data/characters';
import { SrsState, Grade, buildQueue, grade, shuffle } from '../srs';
import { colors } from '../theme';

interface Props {
  srs: SrsState;
  onUpdate: (next: SrsState) => void;
  onDone: () => void;
}

export default function FlashcardsScreen({ srs, onUpdate, onDone }: Props) {
  const [queue, setQueue] = useState<Character[]>([]);
  const [total, setTotal] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const q = shuffle(buildQueue(srs, CHARACTERS));
    setQueue(q);
    setTotal(q.length);
    setRevealed(false);
    // Build the queue once when the screen opens — not on every grade,
    // otherwise freshly graded cards would re-enter immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = queue[0];

  if (!current) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneText}>All done for now! Come back when more cards are due.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryBtnText}>Back to Today</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleGrade = (g: Grade) => {
    onUpdate(grade(srs, current.char, g));
    setRevealed(false);
    setQueue((q) => {
      const rest = q.slice(1);
      if (g === 'again') {
        // Re-insert a failed card a few positions later in this session.
        const pos = Math.min(3, rest.length);
        const next = [...rest];
        next.splice(pos, 0, current);
        setTotal((t) => t + 1);
        return next;
      }
      return rest;
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        {total - queue.length + 1} / {total}
      </Text>
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => setRevealed(true)}>
        {!revealed ? (
          <>
            <Text style={styles.bigChar}>{current.char}</Text>
            <Text style={styles.hint}>tap to reveal</Text>
          </>
        ) : (
          <>
            <Text style={styles.medChar}>{current.char}</Text>
            <Text style={styles.pinyin}>{current.pinyin}</Text>
            <Text style={styles.meaning}>{current.meaning}</Text>
            <Text style={styles.example}>
              {current.example} ({current.examplePinyin}) — {current.exampleMeaning}
            </Text>
            <TouchableOpacity onPress={() => Speech.speak(current.char, { language: 'zh-CN', rate: 0.8 })}>
              <Text style={styles.speak}>🔊</Text>
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>
      {revealed && (
        <View style={styles.gradeRow}>
          <GradeBtn label="Again" bg={colors.redBg} fg={colors.red} onPress={() => handleGrade('again')} />
          <GradeBtn label="Hard" bg={colors.orangeBg} fg={colors.orange} onPress={() => handleGrade('hard')} />
          <GradeBtn label="Good" bg={colors.greenBg} fg={colors.green} onPress={() => handleGrade('good')} />
          <GradeBtn label="Easy" bg={colors.blueBg} fg={colors.blue} onPress={() => handleGrade('easy')} />
        </View>
      )}
    </View>
  );
}

function GradeBtn({ label, bg, fg, onPress }: { label: string; bg: string; fg: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.gradeBtn, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={[styles.gradeBtnText, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  center: { justifyContent: 'center', alignItems: 'center' },
  progress: { textAlign: 'center', color: colors.muted, marginBottom: 12, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 18,
  },
  bigChar: { fontSize: 96, color: colors.ink },
  medChar: { fontSize: 52, color: colors.ink },
  hint: { color: colors.muted, fontSize: 13, marginTop: 8 },
  pinyin: { fontSize: 26, color: colors.red, fontWeight: '700', marginTop: 6 },
  meaning: { fontSize: 18, color: colors.ink, marginTop: 4 },
  example: { fontSize: 14, color: colors.muted, marginTop: 10, textAlign: 'center' },
  speak: { fontSize: 22, marginTop: 12 },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  gradeBtnText: { fontWeight: '700', fontSize: 15 },
  doneEmoji: { fontSize: 48, marginBottom: 12 },
  doneText: { fontSize: 16, color: colors.ink, textAlign: 'center', marginBottom: 20 },
  primaryBtn: { backgroundColor: colors.red, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
