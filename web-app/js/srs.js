// Lightweight spaced-repetition scheduler (simplified SM-2 ladder).
// Each character has a level; the level maps to a review interval.
// "Again" drops back, "Hard" repeats sooner, "Good" climbs one rung,
// "Easy" skips a rung. Level >= MASTERED_LEVEL counts as mastered.

const SRS = (() => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  // Interval per level: level 0 = brand new (due immediately).
  const INTERVALS = [0, 4 * HOUR, 8 * HOUR, 1 * DAY, 2 * DAY, 4 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
  const MASTERED_LEVEL = 6;
  const NEW_PER_SESSION = 10;
  const STORAGE_KEY = 'hanzi-trainer-srs-v1';

  let state = load();

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { cards: {}, lastStudyDay: null, streak: 0 };
    } catch {
      return { cards: {}, lastStudyDay: null, streak: 0 };
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getCard(char) {
    return state.cards[char] || null;
  }

  function dueCards(allChars, now = Date.now()) {
    return allChars.filter(c => {
      const card = state.cards[c.char];
      return card && card.level < INTERVALS.length && card.due <= now && card.level < 99;
    });
  }

  function newCards(allChars, limit = NEW_PER_SESSION) {
    return allChars.filter(c => !state.cards[c.char]).slice(0, limit);
  }

  // Build a review queue: everything due, plus up to `limit` unseen cards.
  function buildQueue(allChars) {
    const due = dueCards(allChars);
    const fresh = newCards(allChars);
    return [...due, ...fresh];
  }

  function grade(char, grade, now = Date.now()) {
    const card = state.cards[char] || { level: 0, due: now, seen: 0 };
    card.seen += 1;
    if (grade === 'again') {
      card.level = Math.max(0, Math.min(card.level, 1) - 1);
    } else if (grade === 'hard') {
      card.level = Math.max(1, card.level); // stay put, but at least level 1
    } else if (grade === 'good') {
      card.level = Math.min(INTERVALS.length - 1, card.level + 1);
    } else if (grade === 'easy') {
      card.level = Math.min(INTERVALS.length - 1, card.level + 2);
    }
    card.due = now + INTERVALS[card.level];
    state.cards[char] = card;
    touchStreak(now);
    save();
    return card;
  }

  function touchStreak(now = Date.now()) {
    const today = new Date(now).toDateString();
    if (state.lastStudyDay === today) return;
    const yesterday = new Date(now - DAY).toDateString();
    state.streak = state.lastStudyDay === yesterday ? state.streak + 1 : 1;
    state.lastStudyDay = today;
  }

  function stats(allChars) {
    let learning = 0, mastered = 0;
    for (const c of allChars) {
      const card = state.cards[c.char];
      if (!card) continue;
      if (card.level >= MASTERED_LEVEL) mastered++;
      else learning++;
    }
    return {
      due: dueCards(allChars).length,
      learning,
      mastered,
      total: allChars.length,
      streak: state.streak,
    };
  }

  function levelOf(char) {
    const card = state.cards[char];
    if (!card) return 'new';
    return card.level >= MASTERED_LEVEL ? 'mastered' : 'learning';
  }

  // Characters the user has at least seen once (for quizzes).
  function seenChars(allChars) {
    return allChars.filter(c => state.cards[c.char]);
  }

  return { buildQueue, grade, stats, levelOf, seenChars, getCard, MASTERED_LEVEL };
})();
