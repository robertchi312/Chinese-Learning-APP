// Lightweight spaced-repetition scheduler (simplified SM-2 ladder),
// mirroring web-app/js/srs.js so progress logic behaves identically.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from './data/characters';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const INTERVALS = [0, 4 * HOUR, 8 * HOUR, 1 * DAY, 2 * DAY, 4 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
export const MASTERED_LEVEL = 6;
const NEW_PER_SESSION = 10;
const STORAGE_KEY = 'hanzi-trainer-srs-v1';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  level: number;
  due: number;
  seen: number;
}

export interface SrsState {
  cards: Record<string, CardState>;
  lastStudyDay: string | null;
  streak: number;
}

export const emptyState = (): SrsState => ({ cards: {}, lastStudyDay: null, streak: 0 });

export async function loadState(): Promise<SrsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : emptyState();
  } catch {
    return emptyState();
  }
}

export async function saveState(state: SrsState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function dueCards(state: SrsState, all: Character[], now = Date.now()): Character[] {
  return all.filter((c) => {
    const card = state.cards[c.char];
    return card && card.due <= now;
  });
}

export function newCards(state: SrsState, all: Character[], limit = NEW_PER_SESSION): Character[] {
  return all.filter((c) => !state.cards[c.char]).slice(0, limit);
}

export function buildQueue(state: SrsState, all: Character[]): Character[] {
  return [...dueCards(state, all), ...newCards(state, all)];
}

export function grade(state: SrsState, char: string, g: Grade, now = Date.now()): SrsState {
  const prev = state.cards[char] ?? { level: 0, due: now, seen: 0 };
  const card: CardState = { ...prev, seen: prev.seen + 1 };
  if (g === 'again') card.level = Math.max(0, Math.min(card.level, 1) - 1);
  else if (g === 'hard') card.level = Math.max(1, card.level);
  else if (g === 'good') card.level = Math.min(INTERVALS.length - 1, card.level + 1);
  else card.level = Math.min(INTERVALS.length - 1, card.level + 2);
  card.due = now + INTERVALS[card.level];

  const next: SrsState = { ...state, cards: { ...state.cards, [char]: card } };
  // Streak: count distinct study days; consecutive days increment it.
  const today = new Date(now).toDateString();
  if (next.lastStudyDay !== today) {
    const yesterday = new Date(now - DAY).toDateString();
    next.streak = next.lastStudyDay === yesterday ? next.streak + 1 : 1;
    next.lastStudyDay = today;
  }
  return next;
}

export function stats(state: SrsState, all: Character[]) {
  let learning = 0;
  let mastered = 0;
  for (const c of all) {
    const card = state.cards[c.char];
    if (!card) continue;
    if (card.level >= MASTERED_LEVEL) mastered++;
    else learning++;
  }
  return {
    due: dueCards(state, all).length,
    learning,
    mastered,
    total: all.length,
    streak: state.streak,
  };
}

export function levelOf(state: SrsState, char: string): 'new' | 'learning' | 'mastered' {
  const card = state.cards[char];
  if (!card) return 'new';
  return card.level >= MASTERED_LEVEL ? 'mastered' : 'learning';
}

export function seenChars(state: SrsState, all: Character[]): Character[] {
  return all.filter((c) => state.cards[c.char]);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}
