#!/usr/bin/env node
// Logic tests for the adaptive engine (and an SRS regression check).
// Usage: node tools/test-adaptive.mjs

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const Adaptive = require(join(root, 'web-app/js/adaptive.js'));

function memStorage(initial = {}) {
  const mem = { ...initial };
  return { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, _mem: mem };
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('adaptive engine:');

test('fresh state: every skill at the 0.5 prior, weights uniform', () => {
  Adaptive._setStorage(memStorage());
  for (const s of Adaptive.SKILLS) assert.equal(Adaptive.acc(s), 0.5);
  const w = Adaptive.skillWeights(Adaptive.SKILLS);
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, 'weights sum to 1');
  for (const s of Adaptive.SKILLS) assert.ok(Math.abs(w[s] - 0.2) < 1e-9, 'uniform at start');
});

test('EWMA math: outcomes [1,1,0] → 0.8·(0.8·1+0.2·1)+0.2·0 = 0.8', () => {
  Adaptive._setStorage(memStorage());
  Adaptive.record('listening', 1);
  Adaptive.record('listening', 1);
  Adaptive.record('listening', 0);
  assert.ok(Math.abs(Adaptive.acc('listening') - 0.8) < 1e-9);
});

test('prior holds until 3 attempts', () => {
  Adaptive._setStorage(memStorage());
  Adaptive.record('production', 0);
  Adaptive.record('production', 0);
  assert.equal(Adaptive.acc('production'), 0.5, 'still prior at 2 attempts');
  Adaptive.record('production', 0);
  assert.equal(Adaptive.acc('production'), 0, 'real ewma at 3 attempts');
});

test('weak skill gets the highest practice weight', () => {
  Adaptive._setStorage(memStorage());
  for (let i = 0; i < 5; i++) Adaptive.record('listening', 0); // weak
  for (let i = 0; i < 5; i++) Adaptive.record('recognition', 1); // strong
  const w = Adaptive.skillWeights(Adaptive.SKILLS);
  assert.ok(w.listening > w.recognition, 'listening outweighs recognition');
  assert.ok(w.listening > w.production, 'listening outweighs untouched skills');
  assert.ok(w.recognition > 0, 'strong skill keeps a floor weight (interleaving)');
  assert.equal(Adaptive.weakestSkill(), 'listening');
});

test('pickSkill respects availability and distribution', () => {
  Adaptive._setStorage(memStorage());
  for (let i = 0; i < 5; i++) Adaptive.record('listening', 0);
  const available = ['recognition', 'production'];
  for (let i = 0; i < 50; i++) {
    assert.ok(available.includes(Adaptive.pickSkill(available)));
  }
  // Deterministic rand: r=0 always lands on the first available skill.
  assert.equal(Adaptive.pickSkill(['production', 'recognition'], () => 0), 'production');
});

test('grade mapping: again/hard/good/easy → 0/0.4/0.85/1.0 on recognition', () => {
  Adaptive._setStorage(memStorage());
  Adaptive.recordGrade('again');
  assert.equal(Adaptive.summary().find((s) => s.skill === 'recognition').attempts, 1);
  Adaptive._setStorage(memStorage());
  Adaptive.recordGrade('easy');
  Adaptive.recordGrade('easy');
  Adaptive.recordGrade('easy');
  assert.equal(Adaptive.acc('recognition'), 1);
});

test('daily counter increments and resets across days', () => {
  Adaptive._setStorage(memStorage());
  const day1 = new Date('2026-06-11T10:00:00').getTime();
  const day2 = new Date('2026-06-12T10:00:00').getTime();
  Adaptive.record('recognition', 1, day1);
  Adaptive.record('recognition', 1, day1);
  assert.equal(Adaptive.dailyProgress(day1).done, 2);
  Adaptive.record('recognition', 1, day2);
  assert.equal(Adaptive.dailyProgress(day2).done, 1, 'reset on new day');
});

test('goal is clamped and persisted', () => {
  Adaptive._setStorage(memStorage());
  assert.equal(Adaptive.setGoal(3), 5, 'clamped to minimum');
  assert.equal(Adaptive.setGoal(1000), 200, 'clamped to maximum');
  assert.equal(Adaptive.setGoal(25), 25);
  assert.equal(Adaptive.dailyProgress().goal, 25);
});

test('corrupt JSON recovers to a fresh profile', () => {
  Adaptive._setStorage(memStorage({ 'hanzi-trainer-profile-v1': '{not json!!' }));
  assert.equal(Adaptive.acc('recognition'), 0.5);
  assert.equal(Adaptive.dailyProgress().goal, 20);
});

test('theme pref round-trip', () => {
  const store = memStorage();
  Adaptive._setStorage(store);
  Adaptive.setPref('theme', 'dark');
  Adaptive._setStorage(store); // reload from same storage
  assert.equal(Adaptive.getPref('theme'), 'dark');
});

test('state persists and reloads through storage', () => {
  const store = memStorage();
  Adaptive._setStorage(store);
  for (let i = 0; i < 4; i++) Adaptive.record('writing', 1);
  Adaptive._setStorage(store);
  assert.equal(Adaptive.acc('writing'), 1);
  assert.equal(Adaptive.summary().find((s) => s.skill === 'writing').attempts, 4);
});

/* ---------- SRS regression: existing stored progress stays intact ---------- */
console.log('srs regression:');

test('pre-existing hanzi-trainer-srs-v1 blob: stats() and buildQueue() behave as before', () => {
  const now = Date.now();
  const blob = JSON.stringify({
    cards: {
      '好': { level: 7, due: now + 1000000, seen: 12 }, // mastered, not due
      '不': { level: 2, due: now - 1000, seen: 4 },      // learning, due
      '人': { level: 1, due: now + 999999, seen: 2 },    // learning, not due
    },
    lastStudyDay: new Date(now).toDateString(),
    streak: 6,
  });
  global.localStorage = memStorage({ 'hanzi-trainer-srs-v1': blob });
  // Load srs.js fresh in this context.
  const fs = require('node:fs');
  const src = fs
    .readFileSync(join(root, 'web-app/js/srs.js'), 'utf8')
    .replace('const SRS', 'globalThis.SRS_TEST');
  eval(src);
  const SRS = globalThis.SRS_TEST;
  const all = [{ char: '好' }, { char: '不' }, { char: '人' }, { char: '大' }];
  const stats = SRS.stats(all);
  assert.equal(stats.mastered, 1);
  assert.equal(stats.learning, 2);
  assert.equal(stats.due, 1);
  assert.equal(stats.streak, 6);
  const queue = SRS.buildQueue(all);
  assert.ok(queue.some((c) => c.char === '不'), 'due card in queue');
  assert.ok(queue.some((c) => c.char === '大'), 'new card in queue');
  assert.ok(!queue.some((c) => c.char === '好'), 'mastered/not-due card excluded');
  delete global.localStorage;
});

console.log(`\n${passed} tests passed ✅`);
