#!/usr/bin/env node
// Regenerates web-app/js/data.js from shared/characters.json.
// Usage: node tools/build-data.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'shared/characters.json'), 'utf8'));

const REQUIRED = ['char', 'pinyin', 'meaning', 'example', 'examplePinyin', 'exampleMeaning', 'components', 'mnemonic'];
for (const c of data.characters) {
  for (const field of REQUIRED) {
    if (c[field] === undefined || c[field] === '') {
      throw new Error(`character ${c.char ?? '?'} is missing field "${field}"`);
    }
  }
  if (!Array.isArray(c.components) || c.components.length === 0 || c.components.some((p) => !p.c || !p.gloss)) {
    throw new Error(`character ${c.char} has malformed components`);
  }
}

const seen = new Set(data.characters.map((c) => c.char));
if (seen.size !== data.characters.length) throw new Error('duplicate characters in dataset');

const out =
  '// Generated from shared/characters.json — do not edit by hand.\n' +
  '// Regenerate with: node tools/build-data.mjs\n' +
  'const CHARACTERS = ' +
  JSON.stringify(data.characters, null, 2) +
  ';\n';

writeFileSync(join(root, 'web-app/js/data.js'), out);
console.log(`wrote web-app/js/data.js (${data.characters.length} characters, schema v${data.version})`);
