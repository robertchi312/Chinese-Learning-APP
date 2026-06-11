// 汉字 Trainer — "The Deck".
// One learning channel: open the app, a card is already there.
// Tap to flip, judge yourself, next card. Close whenever.
// Characters (list) and Me (dashboard) are reference surfaces only.

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

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function dailyCharacter() {
  return CHARACTERS[dayOfYear() % CHARACTERS.length];
}

function componentChips(c) {
  return c.components
    .map(p => `<span class="comp-chip"><span class="hanzi">${p.c}</span>${p.gloss}</span>`)
    .join('<span class="comp-chip comp-plus">+</span>');
}

const byChar = Object.fromEntries(CHARACTERS.map(c => [c.char, c]));

/* ---------- theme ---------- */
UI.applyTheme(Adaptive.getPref('theme') || 'auto');
$('theme-toggle').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme === 'dark';
  const next = dark ? 'light' : 'dark';
  Adaptive.setPref('theme', next);
  UI.applyTheme(next);
});

/* ---------- tabs ---------- */
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));

function showView(name) {
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
  if (name === 'learn') showNext();
  if (name === 'chars') renderBrowse($('browse-search').value);
  if (name === 'me') renderMe();
}

/* ---------- header chips ---------- */
function updateChips() {
  const { done, goal } = Adaptive.dailyProgress();
  $('daily-done').textContent = done;
  $('daily-goal').textContent = goal;
  $('daily-chip').classList.toggle('goal-met', done >= goal);
  $('streak-count').textContent = SRS.stats(CHARACTERS).streak;
}

$('daily-chip').addEventListener('click', () => {
  const current = Adaptive.dailyProgress().goal;
  const input = prompt('Daily goal (cards per day):', current);
  if (input === null) return;
  const n = parseInt(input, 10);
  if (!isNaN(n)) {
    Adaptive.setGoal(n);
    updateChips();
  }
});

/* ============================================================
   THE DECK
   ============================================================ */
const SKILL_FRONTS = {
  recognition: { tag: '👀 what does it mean?' },
  pronunciation: { tag: '🗣️ how do you say it?' },
  listening: { tag: '👂 what did you hear?' },
  production: { tag: '💡 picture the character' },
};

let current = null; // { c, skill } — skill === 'meet' for first encounters
let lastChar = null;

function availableSkills() {
  const skills = ['recognition', 'pronunciation', 'production'];
  if ('speechSynthesis' in window) skills.push('listening');
  return skills;
}

// The SRS state is the stream — no session queue.
function pickNext() {
  const queue = SRS.buildQueue(CHARACTERS);
  const due = queue.filter(c => SRS.getCard(c.char));
  const fresh = queue.filter(c => !SRS.getCard(c.char));
  if (due.length) {
    // Random among due, avoiding an immediate repeat when there's a choice.
    const pool = due.length > 1 ? due.filter(c => c.char !== lastChar) : due;
    return { c: pool[Math.floor(Math.random() * pool.length)], isNew: false };
  }
  // New characters arrive in dataset order — a sensible gentle progression.
  if (fresh.length) return { c: fresh[0], isNew: true };
  return null;
}

function showNext() {
  $('meet-card').hidden = true;
  $('quiz-card').hidden = true;
  $('judge').hidden = true;
  $('caught-up').hidden = true;

  const next = pickNext();
  if (!next) {
    current = null;
    renderCaughtUp();
    return;
  }
  if (next.isNew) renderMeet(next.c);
  else renderQuiz(next.c, Adaptive.pickSkill(availableSkills()));
}

/* --- meet card: first encounter, no quiz --- */
function renderMeet(c) {
  current = { c, skill: 'meet' };
  $('meet-char').textContent = c.char;
  $('meet-pinyin').textContent = c.pinyin;
  $('meet-meaning').textContent = c.meaning;
  $('meet-components').innerHTML = componentChips(c);
  $('meet-mnemonic').textContent = c.mnemonic;
  $('meet-example').textContent = `${c.example} (${c.examplePinyin}) — ${c.exampleMeaning}`;
  $('meet-card').hidden = false;
}

$('meet-speak').addEventListener('click', () => current && speak(current.c.char));
$('meet-next').addEventListener('click', () => {
  if (!current) return;
  // 'again' leaves the card due immediately, so the first real retrieval
  // happens right after meeting it — encode, then test.
  SRS.grade(current.c.char, 'again');
  Adaptive.bumpDaily();
  lastChar = null; // allow the just-met card to come straight back as a quiz
  afterProgress();
  showNext();
});

/* --- quiz card: tap-flip-judge, varied fronts --- */
function renderQuiz(c, skill) {
  current = { c, skill };
  const card = $('quiz-card');

  // Reset the flip without animating backwards in view.
  const inner = card.querySelector('.flashcard-inner');
  inner.style.transition = 'none';
  card.classList.remove('flipped');
  void inner.offsetWidth;
  inner.style.transition = '';

  $('front-tag').textContent = SKILL_FRONTS[skill].tag;
  $('front-char').hidden = true;
  $('front-audio').hidden = true;
  $('front-fallback').hidden = true;
  $('front-text').hidden = true;

  if (skill === 'listening') {
    $('front-audio').hidden = false;
    $('front-fallback').hidden = hasZhVoice();
    $('front-fallback').textContent = `Can't hear it? It reads: ${c.pinyin}`;
    speak(c.char);
  } else if (skill === 'production') {
    $('front-text').textContent = c.meaning;
    $('front-text').hidden = false;
  } else {
    $('front-char').textContent = c.char;
    $('front-char').hidden = false;
  }

  $('back-char').textContent = c.char;
  $('back-pinyin').textContent = c.pinyin;
  $('back-meaning').textContent = c.meaning;
  $('back-example').textContent = `${c.example} (${c.examplePinyin}) — ${c.exampleMeaning}`;
  $('back-components').innerHTML = componentChips(c);
  $('back-mnemonic').textContent = c.mnemonic;

  card.hidden = false;
}

$('front-audio').addEventListener('click', (e) => {
  e.stopPropagation();
  if (current) speak(current.c.char);
});

$('quiz-card').addEventListener('click', () => {
  const card = $('quiz-card');
  if (!card.classList.contains('flipped')) {
    card.classList.add('flipped');
    $('judge').hidden = false;
    // Hearing the word on reveal reinforces every card type except
    // listening (where it would just repeat the question).
    if (current && current.skill !== 'listening') speak(current.c.char);
  }
});

$('back-char').addEventListener('click', (e) => {
  e.stopPropagation();
  if (current) openSheet(current.c);
});
$('back-speak').addEventListener('click', (e) => {
  e.stopPropagation();
  if (current) speak(current.c.char);
});

document.querySelectorAll('#judge .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!current || current.skill === 'meet') return;
    const good = btn.dataset.judge === 'good';
    SRS.grade(current.c.char, good ? 'good' : 'again');
    Adaptive.record(current.skill, good ? 1 : 0);
    lastChar = current.c.char;
    afterProgress();
    showNext();
  });
});

/* --- caught up: the app tells you to leave --- */
function renderCaughtUp() {
  const d = dailyCharacter();
  $('caught-up-mascot').innerHTML = UI.mascot('sleepy', 92);
  $('cu-daily-char').textContent = d.char;
  $('cu-daily-pinyin').textContent = d.pinyin;
  $('cu-daily-meaning').textContent = d.meaning;
  $('caught-up').hidden = false;
}

$('caught-up-daily').addEventListener('click', () => openSheet(dailyCharacter()));

/* --- floating moments --- */
let prevDoneGoal = Adaptive.dailyProgress();
let prevStreak = SRS.stats(CHARACTERS).streak;
let momentTimer = null;

function afterProgress() {
  updateChips();
  const { done, goal } = Adaptive.dailyProgress();
  if (prevDoneGoal.done < prevDoneGoal.goal && done >= goal) {
    showMoment('cheering', "🎯 That's your daily bite! Keep tapping, or go live your life — both count.");
    UI.confetti();
  }
  prevDoneGoal = { done, goal };

  const streak = SRS.stats(CHARACTERS).streak;
  if (streak !== prevStreak && [7, 30, 100].includes(streak)) {
    showMoment('cheering', `🔥 ${streak}-day streak! The panda is genuinely impressed.`);
    UI.confetti();
  }
  prevStreak = streak;
}

function showMoment(expression, text) {
  $('moment-mascot').innerHTML = UI.mascot(expression, 84);
  $('moment-text').textContent = text;
  $('moment').hidden = false;
  clearTimeout(momentTimer);
  momentTimer = setTimeout(() => { $('moment').hidden = true; }, 2600);
}
$('moment').addEventListener('click', () => {
  clearTimeout(momentTimer);
  $('moment').hidden = true;
});

/* ============================================================
   CHARACTERS (reference list)
   ============================================================ */
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
      </span>
      <span class="browse-level ${level}">${level === 'mastered' ? '印' : level}</span>`;
    item.addEventListener('click', () => openSheet(c));
    list.appendChild(item);
  }
}

$('browse-search').addEventListener('input', (e) => renderBrowse(e.target.value));

/* ============================================================
   ME (dashboard)
   ============================================================ */
const BUBBLE_LINES = [
  'One character at a time. 加油!',
  'Small steps, big 汉字 energy.',
  'Panda believes in you. Panda is rarely wrong.',
  'The deck is always ready when you are.',
];

function renderMe() {
  const d = dailyCharacter();
  $('daily-card').dataset.watermark = d.char;
  $('daily-char').textContent = d.char;
  $('daily-pinyin').textContent = d.pinyin;
  $('daily-meaning').textContent = d.meaning;
  $('daily-example').textContent = `${d.example} (${d.examplePinyin}) — ${d.exampleMeaning}`;
  $('widget-mini-char').textContent = d.char;

  const s = SRS.stats(CHARACTERS);
  UI.countUp($('stat-streak'), s.streak);
  UI.countUp($('stat-learned'), s.learning);
  UI.countUp($('stat-mastered'), s.mastered);
  $('stat-total').textContent = s.total;

  const due = SRS.buildQueue(CHARACTERS).length;
  $('mascot-me').innerHTML = UI.mascot(due === 0 ? 'sleepy' : 'happy', 78);
  $('mascot-bubble').textContent = due === 0
    ? 'All caught up — nap time!'
    : due > 0 && s.learning + s.mastered === 0
      ? 'No setup, no pressure — the Learn tab is already dealing cards.'
      : BUBBLE_LINES[Math.floor(Math.random() * BUBBLE_LINES.length)];

  renderInsights();
}

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

$('daily-card').addEventListener('click', () => openSheet(dailyCharacter()));

/* ============================================================
   DETAIL SHEET (story, components, strokes, audio)
   ============================================================ */
let writer = null;
let sheetChar = null;
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

async function openSheet(c) {
  sheetChar = c;
  $('sheet-char').textContent = c.char;
  $('sheet-pinyin').textContent = c.pinyin;
  $('sheet-meaning').textContent = c.meaning;
  $('sheet-example').textContent = `${c.example} (${c.examplePinyin}) — ${c.exampleMeaning}`;
  $('sheet-components').innerHTML = componentChips(c);
  $('sheet-mnemonic').textContent = c.mnemonic;
  $('write-info').textContent = '';
  $('sheet-scrim').hidden = false;
  $('sheet').hidden = false;

  const dark = document.documentElement.dataset.theme === 'dark';
  try {
    await loadHanziWriter();
    if (sheetChar !== c) return; // sheet changed while loading
    $('writer-target').innerHTML = '';
    writer = HanziWriter.create('writer-target', c.char, {
      width: 240,
      height: 240,
      padding: 10,
      strokeColor: dark ? '#ece4d4' : '#2b2622',
      outlineColor: dark ? '#3a332c' : '#e3d9c6',
      drawingColor: '#c0392b',
      showCharacter: false,
      showOutline: true,
    });
  } catch {
    writer = null;
    $('writer-target').innerHTML = `<p style="color:var(--ink-soft);padding:20px;text-align:center">Stroke practice needs an internet connection the first time.</p>`;
  }
}

function closeSheet() {
  $('sheet').hidden = true;
  $('sheet-scrim').hidden = true;
  $('writer-target').innerHTML = '';
  writer = null;
  sheetChar = null;
}

$('sheet-scrim').addEventListener('click', closeSheet);
$('sheet').querySelector('.sheet-handle').addEventListener('click', closeSheet);
$('sheet-speak').addEventListener('click', () => sheetChar && speak(sheetChar.char));

$('write-quiz').addEventListener('click', () => {
  if (!writer) return;
  $('write-info').textContent = '';
  writer.quiz({
    onComplete: (summaryData) => {
      const mistakes = summaryData.totalMistakes ?? 0;
      Adaptive.record('writing', mistakes === 0 ? 1 : mistakes <= 2 ? 0.7 : 0.3);
      updateChips();
      $('write-info').textContent = mistakes === 0
        ? '✅ Flawless strokes!'
        : `✅ Done — ${mistakes} slip${mistakes === 1 ? '' : 's'}. Practice makes perfect.`;
    },
  });
});
$('write-animate').addEventListener('click', () => writer && writer.animateCharacter());

/* ============================================================
   PWA install + service worker
   ============================================================ */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
  $('install-btn').hidden = false;
});
$('install-btn').addEventListener('click', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  $('install-btn').hidden = true;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ---------- init: a card is already there ---------- */
updateChips();
showNext();
// Manifest shortcuts can deep-link to the reference surfaces; anything else
// (including old pre-rebuild hashes) is ignored and lands on the deck.
const hash = location.hash.replace('#', '');
if (['chars', 'me'].includes(hash)) showView(hash);
