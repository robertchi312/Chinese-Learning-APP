// 汉字 Trainer — main app logic.
// Views: Today, Learn (SRS flashcards), Quiz, Write (stroke practice), Browse.

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

/* ---------- navigation ---------- */
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(`view-${name}`).classList.add('active');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.view === name));
  if (name === 'today') renderToday();
  if (name === 'learn') startSession();
  if (name === 'browse') renderBrowse($('browse-search').value);
  if (name === 'write') initWriter();
}

/* ---------- Today ---------- */
function dailyCharacter() {
  return CHARACTERS[dayOfYear() % CHARACTERS.length];
}

function renderToday() {
  const d = dailyCharacter();
  $('daily-char').textContent = d.char;
  $('daily-pinyin').textContent = d.pinyin;
  $('daily-meaning').textContent = d.meaning;
  $('daily-example').textContent = `${d.example} (${d.examplePinyin}) — ${d.exampleMeaning}`;

  const s = SRS.stats(CHARACTERS);
  $('stat-due').textContent = s.due;
  $('stat-learned').textContent = s.learning;
  $('stat-mastered').textContent = s.mastered;
  $('stat-total').textContent = s.total;
  $('streak-count').textContent = s.streak;
}

$('daily-speak').addEventListener('click', () => speak(dailyCharacter().char));
$('start-review').addEventListener('click', () => showView('learn'));

/* ---------- Learn (flashcards) ---------- */
let queue = [];
let current = null;
let sessionTotal = 0;

function startSession() {
  queue = shuffle(SRS.buildQueue(CHARACTERS));
  sessionTotal = queue.length;
  $('session-done').hidden = queue.length > 0;
  $('flashcard').style.display = queue.length ? '' : 'none';
  nextCard();
}

function nextCard() {
  $('grade-buttons').hidden = true;
  const fc = $('flashcard');
  fc.classList.remove('flipped');
  if (!queue.length) {
    fc.style.display = 'none';
    $('session-done').hidden = false;
    $('session-progress').textContent = '';
    renderToday();
    return;
  }
  fc.style.display = '';
  $('session-done').hidden = true;
  current = queue.shift();
  $('session-progress').textContent = `${sessionTotal - queue.length} / ${sessionTotal}`;
  // Delay back-face update so the answer doesn't flash mid-flip.
  setTimeout(() => {
    $('fc-char').textContent = current.char;
    $('fc-char-back').textContent = current.char;
    $('fc-pinyin').textContent = current.pinyin;
    $('fc-meaning').textContent = current.meaning;
    $('fc-example').textContent = `${current.example} (${current.examplePinyin}) — ${current.exampleMeaning}`;
  }, 230);
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
    if (!current) return;
    const g = btn.dataset.grade;
    const card = SRS.grade(current.char, g);
    // "Again" puts the card back into this session a few cards later.
    if (g === 'again') {
      const pos = Math.min(3, queue.length);
      queue.splice(pos, 0, current);
      sessionTotal++;
    }
    nextCard();
  });
});

$('fc-speak').addEventListener('click', (e) => {
  e.stopPropagation();
  if (current) speak(current.char);
});
$('back-to-today').addEventListener('click', () => showView('today'));

/* ---------- Quiz ---------- */
const QUIZ_LEN = 10;
let quiz = null;

document.querySelectorAll('.quiz-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => startQuiz(btn.dataset.mode));
});

function quizPool() {
  const seen = SRS.seenChars(CHARACTERS);
  // Need at least 8 characters for sensible distractors; fall back to the full set.
  return seen.length >= 8 ? seen : CHARACTERS;
}

function startQuiz(mode) {
  const pool = quizPool();
  quiz = {
    mode,
    questions: shuffle(pool).slice(0, QUIZ_LEN),
    index: 0,
    score: 0,
    locked: false,
  };
  $('quiz-setup').hidden = true;
  $('quiz-result').hidden = true;
  $('quiz-play').hidden = false;
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.questions[quiz.index];
  quiz.locked = false;
  $('quiz-progress').textContent = `${quiz.index + 1} / ${quiz.questions.length}`;
  $('quiz-score').textContent = quiz.score;

  const questionEl = $('quiz-question');
  const isCharQuestion = quiz.mode.startsWith('char');
  questionEl.textContent = isCharQuestion ? q.char : q.meaning;
  questionEl.classList.toggle('text-question', !isCharQuestion);

  const answerOf = (c) =>
    quiz.mode === 'char2meaning' ? c.meaning :
    quiz.mode === 'char2pinyin' ? c.pinyin : c.char;

  const distractors = shuffle(CHARACTERS.filter(c => c.char !== q.char && answerOf(c) !== answerOf(q))).slice(0, 3);
  const options = shuffle([q, ...distractors]);

  const wrap = $('quiz-options');
  wrap.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option' + (quiz.mode === 'meaning2char' ? ' char-option' : '');
    btn.textContent = answerOf(opt);
    btn.addEventListener('click', () => answer(btn, opt === q, q));
    wrap.appendChild(btn);
  });
}

function answer(btn, correct, q) {
  if (quiz.locked) return;
  quiz.locked = true;
  if (correct) {
    quiz.score++;
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
    // Highlight the right answer.
    const answerText =
      quiz.mode === 'char2meaning' ? q.meaning :
      quiz.mode === 'char2pinyin' ? q.pinyin : q.char;
    [...document.querySelectorAll('.quiz-option')]
      .find(b => b.textContent === answerText)?.classList.add('correct');
  }
  speak(q.char);
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
  $('quiz-result-emoji').textContent = pct === 1 ? '🏆' : pct >= 0.7 ? '🎉' : pct >= 0.4 ? '💪' : '📖';
  $('quiz-final').textContent = `You scored ${quiz.score} / ${quiz.questions.length}`;
}

$('quiz-again').addEventListener('click', () => {
  $('quiz-result').hidden = true;
  $('quiz-setup').hidden = false;
});

/* ---------- Write (stroke practice via Hanzi Writer) ---------- */
let writer = null;
let writeIndex = 0;
let hanziWriterLoaded = false;
let hanziWriterLoading = null;

function loadHanziWriter() {
  if (hanziWriterLoaded) return Promise.resolve();
  if (hanziWriterLoading) return hanziWriterLoading;
  hanziWriterLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
    s.onload = () => { hanziWriterLoaded = true; resolve(); };
    s.onerror = () => { hanziWriterLoading = null; reject(new Error('offline')); };
    document.head.appendChild(s);
  });
  return hanziWriterLoading;
}

async function initWriter() {
  const c = CHARACTERS[writeIndex];
  $('write-current').textContent = c.char;
  $('write-info').textContent = `${c.pinyin} — ${c.meaning}`;
  try {
    await loadHanziWriter();
    $('write-offline-note').hidden = true;
    $('writer-target').innerHTML = '';
    writer = HanziWriter.create('writer-target', c.char, {
      width: 260,
      height: 260,
      padding: 10,
      strokeColor: '#1f2937',
      outlineColor: '#e5e7eb',
      drawingColor: '#b91c1c',
      showCharacter: false,
      showOutline: true,
    });
  } catch {
    writer = null;
    $('write-offline-note').hidden = false;
    $('writer-target').innerHTML = `<p style="color:#6b7280;padding:20px;text-align:center">Stroke data needs an internet connection.<br><br><span style="font-size:4rem;color:#1f2937">${c.char}</span></p>`;
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
  writer.quiz({
    onComplete: () => { $('write-info').textContent = '✅ Perfect! Try the next one.'; },
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
      </span>
      <span class="browse-level ${level}">${level}</span>`;
    item.addEventListener('click', () => speak(c.char));
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
// Support deep links from the manifest shortcut (e.g. index.html#learn).
const hash = location.hash.replace('#', '');
if (['learn', 'quiz', 'write', 'browse'].includes(hash)) showView(hash);
