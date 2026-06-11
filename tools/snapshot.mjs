#!/usr/bin/env node
// Visual verification: serves web-app/, walks the deck and reference
// surfaces in light + dark with a seeded profile, writes to /tmp/snaps/.
// Usage: node tools/snapshot.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
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

const browser = await chromium.launch();

async function snapTheme(theme) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  // Returning user: due cards + a skill profile so every surface has data.
  await page.addInitScript(([th]) => {
    const now = Date.now();
    const cards = {};
    for (const ch of ['好', '不', '人', '我', '你', '大', '小', '是']) cards[ch] = { level: 2, due: now - 1000, seen: 5 };
    cards['水'] = { level: 7, due: now + 8.64e8, seen: 14 };
    localStorage.setItem('hanzi-trainer-srs-v1', JSON.stringify({
      cards, lastStudyDay: new Date().toDateString(), streak: 6,
      newDay: { date: new Date().toDateString(), count: 10 },
    }));
    localStorage.setItem('hanzi-trainer-profile-v1', JSON.stringify({
      version: 1,
      skills: {
        recognition: { attempts: 24, correct: 21, ewma: 0.88 },
        pronunciation: { attempts: 12, correct: 8, ewma: 0.64 },
        listening: { attempts: 9, correct: 4, ewma: 0.42 },
        production: { attempts: 15, correct: 11, ewma: 0.71 },
        writing: { attempts: 4, correct: 3, ewma: 0.75 },
      },
      daily: { date: new Date().toDateString(), done: 6, goal: 10 },
      prefs: { theme: th },
    }));
  }, [theme]);

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:8087/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Deck: card front (whatever skill the engine dealt)
  await page.screenshot({ path: `${OUT}/deck-front-${theme}.png` });
  // Flip → back with story + components
  await page.click('#quiz-card', { position: { x: 25, y: 25 } });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/deck-back-${theme}.png` });

  // Detail sheet from the card back
  await page.click('#back-char');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/sheet-${theme}.png` });
  await page.click('#sheet-scrim', { position: { x: 10, y: 10 } });
  await page.waitForTimeout(300);

  // Characters
  await page.click('.tab[data-view="chars"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/chars-${theme}.png` });

  // Me
  await page.click('.tab[data-view="me"]');
  await page.waitForTimeout(500);
  await page.click('#insights summary');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/me-${theme}.png`, fullPage: true });

  await ctx.close();
  return errors;
}

const lightErrors = await snapTheme('light');
const darkErrors = await snapTheme('dark');

await browser.close();
server.close();

const allErrors = [...new Set([...lightErrors, ...darkErrors])]
  // TTS isn't available headless; CDN failures exercise the offline path.
  .filter((e) => !/speech/i.test(e) && !/ERR_CERT|ERR_FAILED|Failed to load resource/i.test(e));
if (allErrors.length) {
  console.log('⚠️ page errors:');
  for (const e of allErrors) console.log('  -', e);
  process.exitCode = 1;
} else {
  console.log('no page errors ✅');
}
console.log(`screenshots written to ${OUT}/`);
