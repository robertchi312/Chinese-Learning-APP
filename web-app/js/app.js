// 汉字 Trainer — main app logic.
// Views: Today, Learn (smart session / classic flashcards), Quiz, Write, Browse.

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.8;
  const zhVoice = speechSynthesis.getVoices().find(v => v.lang.startsWith('zh'));
  if (zhVoice) utter.voice = zhVoice;
  speechSynthesis.speak(utter);
}

// Voices load asynchronously in most browsers — check at use time.
function hasZhVoice() {
  if (!('speechSynthesis' in window)) return false;
  return speechSynthesis.getVoices().some(v => v.lang.startsWith('zh'));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function componentChips(c) {
  return c.components
    .map(p => `<span class="comp-chip"><span class="hanzi">${p.c}</span>${p.gloss}</span>`)
    .join('<span class="comp-chip" style="border:none;background:none;padding:0 2px">+</span>');
}

/* ---------- navigation ---------- */
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));

function showView(name, opts = {}) {
  const swap = () => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $(`view-${name}`).classList.add('active');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.view === name));
  };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(swap);
  } else {
    swap();
  }
  if (name === 'today') renderToday();
  if (name === 'learn') startSession(opts.smart ?? true);
  if (name === 'browse') renderBrowse($('browse-search').value);
  if (name === 'write') initWriter();
}

/* ---------- theme ---------- */
UI.applyTheme(Adaptive.getPref('theme') || 'auto');
$('theme-toggle').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  const next = dark ? 'light' : 'dark';
  Adaptive.setPref('theme', next);
  UI.applyTheme(next);
});

/* ---------- Today ---------- */
const BUBBLE_LINES = [
  'Ready when you are!',
  'One character at a time. 加油!',
  'Your brain loves a good challenge.',
  'Small steps, big 汉字 energy.',
  'The best time to review was yesterday. The second best is now!',
  'Panda believes in you. Panda is rarely wrong.',
];

function dailyCharacter() {
  return CHARACTERS[dayOfYear() % CHARACTERS.length];
}

function renderToday() {
  const d = dailyCharacter();
  $('daily-card').dataset.watermark = d.char;
  $('daily-char').textContent = d.char;
  $('daily-pinyin').textContent = d.pinyin;
  $('daily-meaning').textContent = d.meaning;
  $('daily-example').textContent = `${d.example} (${d.examplePinyin}) — ${d.exampleMeaning}`;

  const s = SRS.stats(CHARACTERS);
  UI.countUp($('stat-due'), s.due);
  UI.countUp($('stat-learned'), s.learning);
  UI.countUp($('stat-mastered'), s.mastered);
  $('stat-total').textContent = s.total;
  $('streak-count').textContent = s.streak;

  // mascot + bubble — first-time users get a "this is easy" welcome
  const queueEmpty = SRS.buildQueue(CHARACTERS).length === 0;
  const isNewUser = s.learning + s.mastered === 0;
  $('mascot-today').innerHTML = UI.mascot(queueEmpty ? 'sleepy' : 'happy', 78);
  $('mascot-bubble').textContent = queueEmpty
    ? 'Nothing due — nap time! Come back later.'
    : isNewUser
      ? 'No setup, no pressure. Tap the red button and you\'re learning — two minutes.'
      : s.due > 0
        ? `${s.due} card${s.due === 1 ? '' : 's'} ready for review — let's go!`
        : BUBBLE_LINES[Math.floor(Math.random() * BUBBLE_LINES.length)];
  $('start-smart').textContent = isNewUser ? '▶ Start learning · ~2 min' : '✨ Smart session · ~2 min';
  $('start-smart').classList.toggle('pulse', isNewUser);

  renderGoalRing();
  renderInsights();
}

function renderGoalRing() {
  const { done, goal } = Adaptive.dailyProgress();
  const C = 2 * Math.PI * 40;
  const frac = Math.min(1, done / goal);
  $('goal-ring-fill').style.strokeDashoffset = C * (1 - frac);
  $('goal-done').textContent = done;
  $('goal-target').textContent = goal;
}

$('goal-ring-wrap').addEventListener('click', () => {
  const current = Adaptive.dailyProgress().goal;
  const input = prompt('Daily goal (cards per day):', current);
  if (input === null) return;
  const n = parseInt(input, 10);
  if (!isNaN(n)) {
    Adaptive.setGoal(n);
    renderGoalRing();
  }
});

function renderInsights() {
  const rows = Adaptive.summary().map(s => {
    const pct = Math.round(s.accuracy * 100);
    return `
      <div class="skill-row" title="${s.desc}">
        <span class="skill-name">${s.icon} ${s.label}</span>
        <div class="skill-bar"><div class="skill-bar-fill ${s.accuracy >= 0.75 ? 'strong' : ''}"
             style="width:${s.hasData ? pct : 0}%"></div></div>
        <span class="skill-pct">${s.hasData ? pct + '%' : '· · ·'}</span>
      </div>`;
  }).join('');
  $('skill-rows').innerHTML = rows;
  $('science-tip').textContent = '🔬 ' + Adaptive.scienceTip();
}

$('daily-speak').addEventListener('click', () => speak(dailyCharacter().char));
$('start-smart').addEventListener('click', () => showView('learn', { smart: true }));

/* ---------- Learn (smart session / classic flashcards) ---------- */
const SKILL_TAGS = {
  pronunciation: '🗣️ how is it said?',
  listening: '👂 what did you hear?',
  production: '💡 which character?',
};

let session = null;

// Sessions are deliberately bite-sized: a couple of minutes, then a clean
// stopping point. If more cards are waiting, the summary offers another round.
const SESSION_CAP = 15;

function startSession(smart) {
  const queue = shuffle(SRS.buildQueue(CHARACTERS)).slice(0, SESSION_CAP);
  session = {
    smart,
    queue,
    total: queue.length,
    attempts: 0,
    correct: 0,
    locked: false,
    goalAtStart: Adaptive.dailyProgress(),
    streakAtStart: SRS.stats(CHARACTERS).streak,
  };
  nextItem();
}

function availableSkills() {
  const skills = ['recognition', 'pronunciation', 'production'];
  if ('speechSynthesis' in window) skills.push('listening');
  return skills;
}

function nextItem() {
  $('grade-buttons').hidden = true;
  $('flashcard').hidden = true;
  $('smart-question').hidden = true;
  $('flashcard').classList.remove('flipped');

  if (!session || !session.queue.length) {
    finishSession();
    return;
  }
  $('session-done').hidden = true;
  const current = session.queue[0];
  $('session-progress').textContent = `${session.total - session.queue.length + 1} / ${session.total}`;

  const card = SRS.getCard(current.char);
  // Unseen characters always start as a flashcard so there's something to learn from.
  const skill = session.smart && card ? Adaptive.pickSkill(availableSkills()) : 'recognition';

  if (skill === 'recognition') showFlashcard(current);
  else showSmartQuestion(current, skill);
}

/* --- flashcard presentation --- */
function showFlashcard(c) {
  const fc = $('flashcard');
  fc.hidden = false;
  fc.classList.remove('flipped');
  // Delay back-face update so the answer doesn't flash mid-flip.
  setTimeout(() => {
    $('fc-char').textContent = c.char;
    $('fc-char-back').textContent = c.char;
    $('fc-pinyin').textContent = c.pinyin;
    $('fc-meaning').textContent = c.meaning;
    $('fc-example').textContent = `${c.example} (${c.examplePinyin}) — ${c.exampleMeaning}`;
    $('fc-components').innerHTML = componentChips(c);
    $('fc-mnemonic').textContent = c.mnemonic;
  }, 60);
}

$('flashcard').addEventListener('click', () => {
  const fc = $('flashcard');
  if (!fc.classList.contains('flipped')) {
    fc.classList.add('flipped');
    $('grade-buttons').hidden = false;
  }
});

document.querySelectorAll('#grade-buttons .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!session || !session.queue.length) return;
    const current = session.queue.shift();
    const g = btn.dataset.grade;
    SRS.grade(current.char, g);
    Adaptive.recordGrade(g);
    session.attempts++;
    if (g === 'good' || g === 'easy') session.correct++;
    if (g === 'again') requeue(current);
    checkGoalCrossed();
    nextItem();
  });
});

$('fc-speak').addEventListener('click', (e) => {
  e.stopPropagation();
  if (session && session.queue.length) speak(session.queue[0].char);
});

/* --- inline smart question --- */
function answerTextOf(skill, c) {
  return skill === 'pronunciation' ? c.pinyin : c.char;
}

function showSmartQuestion(q, skill) {
  const wrap = $('smart-question');
  wrap.hidden = false;
  session.locked = false;
  $('smart-skill-tag').textContent = SKILL_TAGS[skill];

  const questionEl = $('smart-q-text');
  const audioWrap = $('smart-q-audio-wrap');
  questionEl.classList.remove('text-question');
  audioWrap.hidden = true;

  if (skill === 'pronunciation') {
    questionEl.textContent = q.char;
  } else if (skill === 'production') {
    questionEl.textContent = q.meaning;
    questionEl.classList.add('text-question');
  } else { // listening
    questionEl.textContent = '';
    audioWrap.hidden = false;
    $('smart-q-fallback').hidden = hasZhVoice();
    $('smart-q-fallback').textContent = `Can't hear it? It reads: ${q.pinyin}`;
    $('smart-q-audio').onclick = () => speak(q.char);
    speak(q.char);
  }

  const distractors = shuffle(
    CHARACTERS.filter(c => c.char !== q.char && answerTextOf(skill, c) !== answerTextOf(skill, q))
  ).slice(0, 3);
  const options = shuffle([q, ...distractors]);

  const optWrap = $('smart-q-options');
  optWrap.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option' + (skill !== 'pronunciation' ? ' char-option' : '');
    btn.textContent = answerTextOf(skill, opt);
    btn.addEventListener('click', () => answerSmart(btn, opt === q, q, skill));
    optWrap.appendChild(btn);
  });
}

function answerSmart(btn, correct, q, skill) {
  if (session.locked) return;
  session.locked = true;
  const current = session.queue.shift();
  Adaptive.record(skill, correct ? 1 : 0);
  session.attempts++;
  if (correct) {
    session.correct++;
    SRS.grade(current.char, 'good');
    btn.classList.add('correct');
  } else {
    SRS.grade(current.char, 'again');
    btn.classList.add('wrong');
    const answer = answerTextOf(skill, q);
    [...document.querySelectorAll('#smart-q-options .quiz-option')]
      .find(b => b.textContent === answer)?.classList.add('correct');
    requeue(current);
  }
  if (skill !== 'listening') speak(q.char);
  checkGoalCrossed();
  setTimeout(nextItem, correct ? 650 : 1500);
}

function requeue(card) {
  // Failed cards come back a few items later in the same session.
  const pos = Math.min(3, session.queue.length);
  session.queue.splice(pos, 0, card);
  session.total++;
}

function checkGoalCrossed() {
  const { done, goal } = Adaptive.dailyProgress();
  if (!session.goalCelebrated && session.goalAtStart.done < session.goalAtStart.goal && done >= goal) {
    session.goalCelebrated = true;
    UI.confetti();
  }
}

/* --- session end --- */
function finishSession() {
  $('session-progress').textContent = '';
  $('session-done').hidden = false;

  const reviewed = session ? session.attempts : 0;
  const acc = reviewed ? Math.round((session.correct / reviewed) * 100) : null;
  $('summary-count').textContent = reviewed;
  $('summary-acc').textContent = acc === null ? '–' : acc + '%';
  $('summary-title').textContent = reviewed === 0 ? 'All caught up!' : 'Session complete!';
  $('mascot-done').innerHTML = UI.mascot(reviewed === 0 ? 'sleepy' : 'cheering', 90);

  // Re-trigger the seal stamp animation.
  const seal = $('summary-seal');
  seal.style.animation = 'none';
  void seal.offsetWidth;
  seal.style.animation = '';

  const weakest = Adaptive.weakestSkill();
  const { done, goal } = Adaptive.dailyProgress();
  if (reviewed === 0) {
    $('summary-tip').textContent = 'Nothing due right now — the spacing is doing its job. Come back later!';
  } else if (done >= goal) {
    $('summary-title').textContent = 'Daily goal hit! 🎯';
    $('summary-tip').textContent = 'That\'s genuinely enough for today — short and regular beats long and rare. See you tomorrow!';
  } else if (weakest) {
    const label = Adaptive.summary().find(s => s.skill === weakest).label.toLowerCase();
    $('summary-tip').textContent = `Your wobbliest skill right now is ${label} — the next smart session will lean into it. 💪`;
  } else {
    $('summary-tip').textContent = 'Great start! As you practice, sessions will tune themselves to how you learn.';
  }

  // More cards waiting? Offer one more bite — never demand it.
  $('another-round').hidden = SRS.buildQueue(CHARACTERS).length === 0 || reviewed === 0;

  const streakNow = SRS.stats(CHARACTERS).streak;
  if (session && streakNow !== session.streakAtStart && [7, 30, 100].includes(streakNow)) {
    UI.confetti();
  }
  renderToday();
}

$('back-to-today').addEventListener('click', () => showView('today'));
$('another-round').addEventListener('click', () => startSession(true));

/* ---------- Quiz ---------- */
const QUIZ_LEN = 10;
const QUIZ_SKILL = {
  char2meaning: 'recognition',
  char2pinyin: 'pronunciation',
  audio2char: 'listening',
  meaning2char: 'production',
};
let quiz = null;

if (!('speechSynthesis' in window)) $('quiz-mode-audio').hidden = true;

document.querySelectorAll('.quiz-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => startQuiz(btn.dataset.mode));
});

function quizPool() {
  const seen = SRS.seenChars(CHARACTERS);
  // Need a sensible pool for distractors; fall back to the full set early on.
  return seen.length >= 8 ? seen : CHARACTERS;
}

function startQuiz(mode) {
  quiz = {
    mode,
    questions: shuffle(quizPool()).slice(0, QUIZ_LEN),
    index: 0,
    score: 0,
    locked: false,
  };
  $('quiz-setup').hidden = true;
  $('quiz-result').hidden = true;
  $('quiz-play').hidden = false;
  renderQuestion();
}

function quizAnswerOf(c) {
  return quiz.mode === 'char2meaning' ? c.meaning :
         quiz.mode === 'char2pinyin' ? c.pinyin : c.char;
}

function renderQuestion() {
  const q = quiz.questions[quiz.index];
  quiz.locked = false;
  $('quiz-progress').textContent = `${quiz.index + 1} / ${quiz.questions.length}`;
  $('quiz-score').textContent = quiz.score;

  const questionEl = $('quiz-question');
  const audioWrap = $('quiz-audio-wrap');
  questionEl.classList.remove('text-question');
  audioWrap.hidden = true;

  if (quiz.mode === 'audio2char') {
    questionEl.textContent = '';
    audioWrap.hidden = false;
    $('quiz-audio-fallback').hidden = hasZhVoice();
    $('quiz-audio-fallback').textContent = `Can't hear it? It reads: ${q.pinyin}`;
    $('quiz-audio-btn').onclick = () => speak(q.char);
    speak(q.char);
  } else if (quiz.mode.startsWith('char')) {
    questionEl.textContent = q.char;
  } else {
    questionEl.textContent = q.meaning;
    questionEl.classList.add('text-question');
  }

  const distractors = shuffle(
    CHARACTERS.filter(c => c.char !== q.char && quizAnswerOf(c) !== quizAnswerOf(q))
  ).slice(0, 3);
  const options = shuffle([q, ...distractors]);

  const wrap = $('quiz-options');
  wrap.innerHTML = '';
  const charOptions = quiz.mode === 'meaning2char' || quiz.mode === 'audio2char';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option' + (charOptions ? ' char-option' : '');
    btn.textContent = quizAnswerOf(opt);
    btn.addEventListener('click', () => answer(btn, opt === q, q));
    wrap.appendChild(btn);
  });
}

function answer(btn, correct, q) {
  if (quiz.locked) return;
  quiz.locked = true;
  Adaptive.record(QUIZ_SKILL[quiz.mode], correct ? 1 : 0);
  if (correct) {
    quiz.score++;
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
    const answerText = quizAnswerOf(q);
    [...document.querySelectorAll('#quiz-options .quiz-option')]
      .find(b => b.textContent === answerText)?.classList.add('correct');
  }
  if (quiz.mode !== 'audio2char') speak(q.char);
  setTimeout(() => {
    quiz.index++;
    if (quiz.index >= quiz.questions.length) finishQuiz();
    else renderQuestion();
  }, correct ? 700 : 1500);
}

function finishQuiz() {
  $('quiz-play').hidden = true;
  $('quiz-result').hidden = false;
  const pct = quiz.score / quiz.questions.length;
  $('mascot-quiz').innerHTML = UI.mascot(pct >= 0.7 ? 'cheering' : 'thinking', 90);
  $('quiz-final').textContent =
    pct === 1 ? `Perfect! ${quiz.score} / ${quiz.questions.length} 🏆` :
    pct >= 0.7 ? `Nice! You scored ${quiz.score} / ${quiz.questions.length}` :
    `You scored ${quiz.score} / ${quiz.questions.length} — we'll get them next time!`;
  if (pct === 1) UI.confetti();
}

$('quiz-again').addEventListener('click', () => {
  $('quiz-result').hidden = true;
  $('quiz-setup').hidden = false;
});

/* ---------- Write (stroke practice via Hanzi Writer) ---------- */
let writer = null;
let writeIndex = 0;
let hanziWriterLoading = null;

function loadHanziWriter() {
  if (window.HanziWriter) return Promise.resolve();
  if (hanziWriterLoading) return hanziWriterLoading;
  hanziWriterLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
    s.onload = resolve;
    s.onerror = () => { hanziWriterLoading = null; reject(new Error('offline')); };
    document.head.appendChild(s);
  });
  return hanziWriterLoading;
}

async function initWriter() {
  const c = CHARACTERS[writeIndex];
  $('write-current').textContent = c.char;
  $('write-info').textContent = `${c.pinyin} — ${c.meaning}`;
  const dark = document.documentElement.dataset.theme === 'dark';
  try {
    await loadHanziWriter();
    $('write-offline-note').hidden = true;
    $('writer-target').innerHTML = '';
    writer = HanziWriter.create('writer-target', c.char, {
      width: 260,
      height: 260,
      padding: 10,
      strokeColor: dark ? '#ece4d4' : '#2b2622',
      outlineColor: dark ? '#3a332c' : '#e3d9c6',
      drawingColor: '#c0392b',
      showCharacter: false,
      showOutline: true,
    });
  } catch {
    writer = null;
    $('write-offline-note').hidden = false;
    $('writer-target').innerHTML = `<p style="color:var(--ink-soft);padding:20px;text-align:center">Stroke data needs an internet connection.<br><br><span class="hanzi" style="font-size:4rem;color:var(--ink)">${c.char}</span></p>`;
  }
}

$('write-prev').addEventListener('click', () => {
  writeIndex = (writeIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
  initWriter();
});
$('write-next').addEventListener('click', () => {
  writeIndex = (writeIndex + 1) % CHARACTERS.length;
  initWriter();
});
$('write-quiz').addEventListener('click', () => {
  if (!writer) return;
  $('write-info').textContent = '';
  writer.quiz({
    onComplete: (summaryData) => {
      const mistakes = summaryData.totalMistakes ?? 0;
      Adaptive.record('writing', mistakes === 0 ? 1 : mistakes <= 2 ? 0.7 : 0.3);
      $('write-info').textContent = mistakes === 0
        ? '✅ Flawless strokes! Try the next one.'
        : `✅ Done — ${mistakes} slip${mistakes === 1 ? '' : 's'}. Practice makes perfect.`;
    },
  });
});
$('write-animate').addEventListener('click', () => writer && writer.animateCharacter());

/* ---------- Browse ---------- */
function renderBrowse(filter = '') {
  const f = filter.trim().toLowerCase();
  const list = $('browse-list');
  list.innerHTML = '';
  const matches = CHARACTERS.filter(c =>
    !f ||
    c.char.includes(f) ||
    c.pinyin.toLowerCase().includes(f) ||
    c.meaning.toLowerCase().includes(f) ||
    c.example.includes(f)
  );
  for (const c of matches) {
    const level = SRS.levelOf(c.char);
    const item = document.createElement('div');
    item.className = 'browse-item';
    item.innerHTML = `
      <span class="browse-char">${c.char}</span>
      <span class="browse-detail">
        <span class="browse-pinyin">${c.pinyin}</span>
        <span class="browse-meaning"> · ${c.meaning}</span><br>
        <span class="browse-meaning">${c.example} (${c.examplePinyin}) — ${c.exampleMeaning}</span>
        <span class="browse-mnemonic">💭 ${c.mnemonic}</span>
      </span>
      <span class="browse-level ${level}">${level === 'mastered' ? '印' : level}</span>`;
    item.addEventListener('click', () => {
      item.classList.toggle('expanded');
      speak(c.char);
    });
    list.appendChild(item);
  }
}

$('browse-search').addEventListener('input', (e) => renderBrowse(e.target.value));

/* ---------- PWA install ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
  $('install-hint').hidden = false;
  $('install-btn').hidden = false;
});
$('install-btn').addEventListener('click', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  $('install-hint').hidden = true;
});
// On iOS Safari there is no install prompt — show the manual hint instead.
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone) {
  $('install-hint').hidden = false;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ---------- init ---------- */
renderToday();
// Support deep links from the manifest shortcuts (e.g. index.html#learn).
const hash = location.hash.replace('#', '');
if (['learn', 'quiz', 'write', 'browse'].includes(hash)) showView(hash);
