import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { Character, CHARACTERS } from '../data/characters';
import { SrsState, levelOf } from '../srs';
import { colors } from '../theme';

interface Props {
  srs: SrsState;
}

export default function BrowseScreen({ srs }: Props) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const f = query.trim().toLowerCase();
    if (!f) return CHARACTERS;
    return CHARACTERS.filter(
      (c) =>
        c.char.includes(f) ||
        c.pinyin.toLowerCase().includes(f) ||
        c.meaning.toLowerCase().includes(f) ||
        c.example.includes(f)
    );
  }, [query]);

  const renderItem = ({ item }: { item: Character }) => {
    const level = levelOf(srs, item.char);
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => Speech.speak(item.char, { language: 'zh-CN', rate: 0.8 })}
      >
        <Text style={styles.char}>{item.char}</Text>
        <View style={styles.detail}>
          <Text>
            <Text style={styles.pinyin}>{item.pinyin}</Text>
            <Text style={styles.meaning}> · {item.meaning}</Text>
          </Text>
          <Text style={styles.example}>
            {item.example} ({item.examplePinyin}) — {item.exampleMeaning}
          </Text>
        </View>
        <Text style={[styles.badge, level === 'learning' && styles.badgeLearning, level === 'mastered' && styles.badgeMastered]}>
          {level}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search character, pinyin or meaning…"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      <FlatList data={matches} keyExtractor={(c) => c.char} renderItem={renderItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: colors.ink,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  char: { fontSize: 30, width: 44, textAlign: 'center', color: colors.ink },
  detail: { flex: 1 },
  pinyin: { color: colors.red, fontWeight: '600', fontSize: 15 },
  meaning: { color: colors.muted, fontSize: 13 },
  example: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: {
    fontSize: 11,
    color: colors.muted,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeLearning: { backgroundColor: colors.orangeBg, color: colors.orange },
  badgeMastered: { backgroundColor: colors.greenBg, color: colors.green },
});
