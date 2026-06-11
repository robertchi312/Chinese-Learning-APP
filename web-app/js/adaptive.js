// Adaptive learning engine.
//
// Tracks accuracy per skill (recognition, pronunciation, listening,
// production, writing) with an exponentially-weighted moving average, and
// weights smart-session practice toward the skills you're weakest at —
// while keeping every skill in the mix (interleaving).
//
// Storage is separate from the SRS scheduler: key 'hanzi-trainer-profile-v1'.

const Adaptive = (() => {
  const STORAGE_KEY = 'hanzi-trainer-profile-v1';
  const SKILLS = ['recognition', 'pronunciation', 'listening', 'production', 'writing'];
  const ALPHA = 0.2; // EWMA weight of the newest outcome
  const MIN_ATTEMPTS = 3; // below this, accuracy falls back to the 0.5 prior
  const WEIGHT_FLOOR = 0.15; // keeps strong skills in rotation
  const DEFAULT_GOAL = 10; // deliberately small — one tiny session a day

  const SKILL_LABELS = {
    recognition: { label: 'Recognizing', icon: '👀', desc: 'character → meaning' },
    pronunciation: { label: 'Pronouncing', icon: '🗣️', desc: 'character → pinyin' },
    listening: { label: 'Listening', icon: '👂', desc: 'sound → character' },
    production: { label: 'Recalling', icon: '💡', desc: 'meaning → character' },
    writing: { label: 'Writing', icon: '✍️', desc: 'stroke order' },
  };

  // Friendly explanations of the learning science behind the app.
  const SCIENCE_TIPS = [
    'Cards you wobble on come back sooner — that’s spaced repetition, the most replicated effect in learning science.',
    'Guessing before you peek strengthens memory more than re-reading ever could. That’s retrieval practice — it’s why we quiz you.',
    'Mixing question types feels harder but sticks better. Scientists call it interleaving; the panda calls it keeping you on your toes.',
    'Stories and component pictures give your brain a second hook for each character — that’s dual coding.',
    'Smart sessions lean toward your weakest skill, so practice goes where it pays off most.',
    'Short daily sessions beat rare marathons — spacing practice out is half the magic.',
  ];

  // Injectable storage so Node tests can run without a browser.
  let storage =
    typeof localStorage !== 'undefined'
      ? localStorage
      : (() => {
          const mem = {};
          return { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
        })();

  function freshState() {
    const skills = {};
    for (const s of SKILLS) skills[s] = { attempts: 0, correct: 0, ewma: null };
    return {
      version: 1,
      skills,
      daily: { date: todayStr(), done: 0, goal: DEFAULT_GOAL },
      prefs: { theme: 'auto' },
    };
  }

  function todayStr(now = Date.now()) {
    return new Date(now).toDateString();
  }

  let state = load();

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.skills) return freshState();
      // Fill in any skills added after the profile was created.
      for (const s of SKILLS) {
        if (!parsed.skills[s]) parsed.skills[s] = { attempts: 0, correct: 0, ewma: null };
      }
      return parsed;
    } catch {
      return freshState();
    }
  }

  function save() {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function rolloverDaily(now = Date.now()) {
    const today = todayStr(now);
    if (state.daily.date !== today) {
      state.daily.date = today;
      state.daily.done = 0;
    }
  }

  /* ---------- recording ---------- */

  // outcome ∈ [0, 1]: 1 = nailed it, 0 = missed it.
  function record(skill, outcome, now = Date.now()) {
    if (!SKILLS.includes(skill)) throw new Error(`unknown skill: ${skill}`);
    outcome = Math.max(0, Math.min(1, outcome));
    const st = state.skills[skill];
    st.attempts += 1;
    if (outcome >= 0.5) st.correct += 1;
    st.ewma = st.ewma === null ? outcome : (1 - ALPHA) * st.ewma + ALPHA * outcome;
    rolloverDaily(now);
    state.daily.done += 1;
    save();
    return st;
  }

  // Map a flashcard SRS grade to an outcome for the recognition skill.
  const GRADE_OUTCOME = { again: 0, hard: 0.4, good: 0.85, easy: 1.0 };
  function recordGrade(grade, now = Date.now()) {
    return record('recognition', GRADE_OUTCOME[grade] ?? 0.5, now);
  }

  /* ---------- accuracy & weighting ---------- */

  function acc(skill) {
    const st = state.skills[skill];
    return st.attempts >= MIN_ATTEMPTS && st.ewma !== null ? st.ewma : 0.5;
  }

  // Normalized practice weights over the available skills.
  function skillWeights(available = SKILLS) {
    const weights = {};
    let total = 0;
    for (const s of available) {
      const w = 1 - acc(s) + WEIGHT_FLOOR;
      weights[s] = w;
      total += w;
    }
    for (const s of available) weights[s] /= total;
    return weights;
  }

  function pickSkill(available, rand = Math.random) {
    const weights = skillWeights(available);
    let r = rand();
    for (const s of available) {
      r -= weights[s];
      if (r <= 0) return s;
    }
    return available[available.length - 1];
  }

  // The skill with the lowest effective accuracy (for summary copy).
  // Only considers skills with real data.
  function weakestSkill() {
    let weakest = null;
    for (const s of SKILLS) {
      if (state.skills[s].attempts < MIN_ATTEMPTS) continue;
      if (weakest === null || acc(s) < acc(weakest)) weakest = s;
    }
    return weakest;
  }

  /* ---------- daily goal ---------- */

  function dailyProgress(now = Date.now()) {
    rolloverDaily(now);
    save();
    return { done: state.daily.done, goal: state.daily.goal };
  }

  function setGoal(n) {
    state.daily.goal = Math.max(5, Math.min(200, Math.round(n)));
    save();
    return state.daily.goal;
  }

  /* ---------- prefs ---------- */

  function getPref(key) {
    return state.prefs[key];
  }

  function setPref(key, value) {
    state.prefs[key] = value;
    save();
  }

  /* ---------- insights ---------- */

  function summary() {
    return SKILLS.map((s) => ({
      skill: s,
      ...SKILL_LABELS[s],
      attempts: state.skills[s].attempts,
      accuracy: acc(s),
      hasData: state.skills[s].attempts >= MIN_ATTEMPTS,
    }));
  }

  function scienceTip() {
    // Rotate by day so the tip feels fresh but stable within a day.
    const day = Math.floor(Date.now() / 86400000);
    return SCIENCE_TIPS[day % SCIENCE_TIPS.length];
  }

  /* ---------- test hooks ---------- */

  function _setStorage(s) {
    storage = s;
    state = load();
  }

  function _reset() {
    state = freshState();
    save();
  }

  return {
    SKILLS,
    record,
    recordGrade,
    acc,
    skillWeights,
    pickSkill,
    weakestSkill,
    dailyProgress,
    setGoal,
    getPref,
    setPref,
    summary,
    scienceTip,
    _setStorage,
    _reset,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Adaptive;
}
