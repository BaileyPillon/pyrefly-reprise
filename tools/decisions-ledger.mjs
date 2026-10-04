#!/usr/bin/env node
/**
 * node tools/decisions-ledger.mjs            writes DECISIONS.md at the repo root
 * node tools/decisions-ledger.mjs --check    exits 1 when DECISIONS.md is stale, 2 when the data is invalid
 * node tools/decisions-ledger.mjs --stdout   prints the ledger instead of writing it
 *
 * The central ledger of every decision Bailey made on this game, rendered from docs/target/decisions.json,
 * docs/target/decisions-early.json and docs/target/targets.json (read-only). Add a decision to the data, then run this.
 * Node built-ins only, same as the other tools.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { loadModel, render } from './decisions-ledger-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'DECISIONS.md');
const args = process.argv.slice(2);

let text;
try {
  text = render(loadModel(root));
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
}

if (args.includes('--stdout')) {
  process.stdout.write(text);
} else if (args.includes('--check')) {
  const have = existsSync(target) ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : null;
  if (have === text) {
    process.stdout.write('DECISIONS.md is up to date.\n');
  } else {
    process.stderr.write(`DECISIONS.md is ${have === null ? 'missing' : 'stale'}: run  node tools/decisions-ledger.mjs  and commit it with the data change.\n`);
    process.exit(1);
  }
} else {
  writeFileSync(target, text);
  process.stdout.write(`Wrote DECISIONS.md (${text.length} characters, ${text.split('\n').length - 1} lines).\n`);
}
