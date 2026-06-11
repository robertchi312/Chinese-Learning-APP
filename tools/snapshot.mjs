#!/usr/bin/env node
// Visual verification: serves web-app/, walks every view in light + dark
// theme with a seeded profile, and writes screenshots to /tmp/snaps/.
// Usage: node tools/snapshot.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'web-app');
const OUT = '/tmp/snaps';
mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  const file = join(root, path === '/' ? 'index.html' : path);
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((r) => server.listen(8087, r));

// Seeded profile: enough data that skill bars and the goal ring render.
const PROFILE = {
  version: 1,
  skills: {
    recognition: { attempts: 24, correct: 21, ewma: 0.88 },
    pronunciation: { attempts: 12, correct: 8, ewma: 0.64 },
    listening: { attempts: 9, correct: 4, ewma: 0.42 },
    production: { attempts: 15, correct: 11, ewma: 0.71 },
    writing: { attempts: 4, correct: 3, ewma: 0.75 },
  },
  daily: { date: new Date().toDateString(), done: 13, goal: 20 },
  prefs: { theme: 'auto' },
};
const now = Date.now();
const SRS_STATE = {
  cards: {
    '好': { level: 7, due: now + 8.64e8, seen: 14 },
    '不': { level: 2, due: now - 1000, seen: 4 },
    '人': { level: 3, due: now - 5000, seen: 6 },
    '我': { level: 6, due: now + 8.64e8, seen: 10 },
    '你': { level: 1, due: now - 100, seen: 2 },
  },
  lastStudyDay: new Date().toDateString(),
  streak: 6,
};

const browser = await chromium.launch();

async function snapTheme(theme) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(([profile, srs, th]) => {
    profile.prefs.theme = th;
    localStorage.setItem('hanzi-trainer-profile-v1', JSON.stringify(profile));
    localStorage.setItem('hanzi-trainer-srs-v1', JSON.stringify(srs));
  }, [PROFILE, SRS_STATE, theme]);

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:8087/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  // Today (with insights open)
  await page.click('#insights summary');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/today-${theme}.png`, fullPage: true });

  // Learn: smart session — capture whichever item type appears
  await page.click('#start-smart');
  await page.waitForTimeout(700);
  const flashVisible = await page.isVisible('#flashcard');
  if (flashVisible) {
    await page.click('#flashcard'); // flip to back (mnemonic, components)
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: `${OUT}/learn-${theme}.png`, fullPage: true });

  // Quiz: menu, then a question with an answer selected
  await page.click('.tab[data-view="quiz"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/quiz-menu-${theme}.png`, fullPage: true });
  await page.click('.quiz-mode-btn[data-mode="char2meaning"]');
  await page.waitForTimeout(400);
  await page.click('#quiz-options .quiz-option');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/quiz-question-${theme}.png`, fullPage: true });

  // Write
  await page.click('.tab[data-view="write"]');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/write-${theme}.png`, fullPage: true });

  // Browse (expand the first item)
  await page.click('.tab[data-view="browse"]');
  await page.waitForTimeout(400);
  await page.click('.browse-item');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/browse-${theme}.png`, fullPage: false });

  await ctx.close();
  return errors;
}

const lightErrors = await snapTheme('light');
const darkErrors = await snapTheme('dark');

await browser.close();
server.close();

const allErrors = [...new Set([...lightErrors, ...darkErrors])]
  // TTS isn't available headless; CDN errors are expected offline-path noise.
  .filter((e) => !/speech/i.test(e));
if (allErrors.length) {
  console.log('⚠️ page errors:');
  for (const e of allErrors) console.log('  -', e);
  process.exitCode = 1;
} else {
  console.log('no page errors ✅');
}
console.log(`screenshots written to ${OUT}/`);
