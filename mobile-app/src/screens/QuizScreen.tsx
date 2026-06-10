import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { Character, CHARACTERS } from '../data/characters';
import { SrsState, seenChars, shuffle } from '../srs';
import { colors } from '../theme';

type Mode = 'char2meaning' | 'char2pinyin' | 'meaning2char';
const QUIZ_LEN = 10;

interface Props {
  srs: SrsState;
}

interface QuizRun {
  mode: Mode;
  questions: Character[];
  index: number;
  score: number;
  picked: string | null; // answer text the user tapped, locks the question
}

const answerOf = (mode: Mode, c: Character) =>
  mode === 'char2meaning' ? c.meaning : mode === 'char2pinyin' ? c.pinyin : c.char;

export default function QuizScreen({ srs }: Props) {
  const [run, setRun] = useState<QuizRun | null>(null);
  const [options, setOptions] = useState<Character[]>([]);
  const [finished, setFinished] = useState<QuizRun | null>(null);

  const start = (mode: Mode) => {
    const seen = seenChars(srs, CHARACTERS);
    const pool = seen.length >= 8 ? seen : CHARACTERS;
    const questions = shuffle(pool).slice(0, QUIZ_LEN);
    const r: QuizRun = { mode, questions, index: 0, score: 0, picked: null };
    setFinished(null);
    setRun(r);
    setOptions(buildOptions(r));
  };

  const buildOptions = (r: QuizRun): Character[] => {
    const q = r.questions[r.index];
    const distractors = shuffle(
      CHARACTERS.filter((c) => c.char !== q.char && answerOf(r.mode, c) !== answerOf(r.mode, q))
    ).slice(0, 3);
    return shuffle([q, ...distractors]);
  };

  const pick = (opt: Character) => {
    if (!run || run.picked !== null) return;
    const q = run.questions[run.index];
    const correct = opt.char === q.char;
    Speech.speak(q.char, { language: 'zh-CN', rate: 0.8 });
    const next: QuizRun = {
      ...run,
      score: run.score + (correct ? 1 : 0),
      picked: answerOf(run.mode, opt),
    };
    setRun(next);
    setTimeout(() => {
      if (next.index + 1 >= next.questions.length) {
        setFinished(next);
        setRun(null);
      } else {
        const advanced = { ...next, index: next.index + 1, picked: null };
        setRun(advanced);
        setOptions(buildOptions(advanced));
      }
    }, correct ? 700 : 1500);
  };

  if (finished) {
    const pct = finished.score / finished.questions.length;
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.bigEmoji}>{pct === 1 ? '🏆' : pct >= 0.7 ? '🎉' : pct >= 0.4 ? '💪' : '📖'}</Text>
        <Text style={styles.finalText}>
          You scored {finished.score} / {finished.questions.length}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setFinished(null)}>
          <Text style={styles.primaryBtnText}>Play again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!run) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz yourself</Text>
        <Text style={styles.subtitle}>10 multiple-choice questions from the characters you've seen.</Text>
        <ModeBtn label="字 → meaning" onPress={() => start('char2meaning')} />
        <ModeBtn label="字 → pīnyīn" onPress={() => start('char2pinyin')} />
        <ModeBtn label="meaning → 字" onPress={() => start('meaning2char')} />
      </View>
    );
  }

  const q = run.questions[run.index];
  const correctAnswer = answerOf(run.mode, q);
  const isCharQuestion = run.mode.startsWith('char');

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        {run.index + 1} / {run.questions.length} · score {run.score}
      </Text>
      <Text style={isCharQuestion ? styles.questionChar : styles.questionText}>
        {isCharQuestion ? q.char : q.meaning}
      </Text>
      {options.map((opt) => {
        const text = answerOf(run.mode, opt);
        const isPicked = run.picked === text;
        const showCorrect = run.picked !== null && text === correctAnswer;
        const showWrong = isPicked && text !== correctAnswer;
        return (
          <TouchableOpacity
            key={opt.char}
            style={[
              styles.option,
              showCorrect && styles.optionCorrect,
              showWrong && styles.optionWrong,
            ]}
            onPress={() => pick(opt)}
          >
            <Text style={[styles.optionText, run.mode === 'meaning2char' && styles.optionChar]}>{text}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ModeBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.modeBtn} onPress={onPress}>
      <Text style={styles.modeBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  modeBtn: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  modeBtnText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  progress: { textAlign: 'center', color: colors.muted, fontSize: 13, marginBottom: 8 },
  questionChar: { fontSize: 72, textAlign: 'center', marginVertical: 24, color: colors.ink },
  questionText: { fontSize: 26, textAlign: 'center', marginVertical: 32, color: colors.ink, fontWeight: '600' },
  option: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  optionCorrect: { backgroundColor: colors.greenBg, borderColor: colors.green },
  optionWrong: { backgroundColor: colors.redBg, borderColor: colors.red },
  optionText: { fontSize: 17, fontWeight: '600', color: colors.ink },
  optionChar: { fontSize: 30 },
  bigEmoji: { fontSize: 52, marginBottom: 12 },
  finalText: { fontSize: 19, color: colors.ink, marginBottom: 20 },
  primaryBtn: { backgroundColor: colors.red, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
