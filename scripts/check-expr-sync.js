#!/usr/bin/env node
/*
 * Guards the canonical mini-DSL evaluator against drift.
 *
 * The flight-validation rule evaluator is intentionally duplicated (this repo
 * is not an npm workspace) so backend, frontend and the future desktop engine
 * all interpret rule expressions identically. This script fails if the copies
 * are not byte-identical. Run it in CI / pre-push.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const copies = [
  'backend/src/common/expr/expr-eval.ts',
  'frontend/src/lib/expr/expr-eval.ts',
  'desktop/src/lib/expr/expr-eval.ts',
];

const hashes = copies.map((rel) => {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`✗ Missing canonical evaluator copy: ${rel}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(abs);
  return { rel, hash: crypto.createHash('sha256').update(buf).digest('hex') };
});

const unique = new Set(hashes.map((h) => h.hash));
if (unique.size !== 1) {
  console.error('✗ Canonical expr-eval copies are OUT OF SYNC:');
  hashes.forEach((h) => console.error(`   ${h.hash.slice(0, 12)}  ${h.rel}`));
  console.error(
    '\nMake the copies byte-identical (edit one, then copy it over the other).',
  );
  process.exit(1);
}

console.log(`✓ expr-eval copies in sync (${hashes.length} files, ${[...unique][0].slice(0, 12)})`);
