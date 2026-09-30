#!/usr/bin/env node
/**
 * Eye-candy D's derived files (B's depth maps, `public/fx/<room>/depth.png` + `depth.json`).
 *
 * They are derived from the approved paintings, so they are gitignored like `public/art` (the repo
 * is public, and `public/art` never goes to main): only their names, sizes and sha256 are in git,
 * in `tools/fx/fx-assets.json`. The files live on this disk, with a copy in
 * `D:/Tools/pyrefly-art-backup/fx/`, and the deploy refuses a build that does not ship them intact.
 *
 *   node tools/fx-assets.mjs record              write tools/fx/fx-assets.json from public/fx
 *   node tools/fx-assets.mjs verify [--dir <d>]  every listed file present in <d> (default public/fx) with its sha256
 *   node tools/fx-assets.mjs backup              copy public/fx to the backup, then verify the copy
 *   node tools/fx-assets.mjs restore             copy what is missing or different from the backup, then verify
 *   node tools/fx-assets.mjs ensure [--warn]     verify public/fx; restore from the backup when it fails; verify again
 *                                                (--warn: `npm run dev` / `npm run build` print the failure and go on,
 *                                                B then draws its weather with no depth plates; the deploy never warns)
 *
 * Exit 0 = PASS, 1 = FAIL (the reason is printed). Copies only; this tool never deletes a file.
 * Game case: both (shared plumbing; the maps are for FFX and FFX-2 rooms).
 */

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public', 'fx');
const LIST = join(ROOT, 'tools', 'fx', 'fx-assets.json');
export const FX_BACKUP = process.env.PYREFLY_FX_BACKUP ?? 'D:/Tools/pyrefly-art-backup/fx';

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, root, out);
    else out.push(relative(root, p).replace(/\\/g, '/'));
  }
  return out.sort();
}

/** The committed list: `[{ path, bytes, sha256 }]`, paths relative to `public/fx`. */
export function readList() {
  return JSON.parse(readFileSync(LIST, 'utf8')).files;
}

/** Problems with `dir` against the list (empty = PASS). */
export function check(dir, files = readList()) {
  const bad = [];
  for (const f of files) {
    const p = join(dir, f.path);
    if (!existsSync(p)) bad.push(`missing ${f.path}`);
    else if (statSync(p).size !== f.bytes || sha256(p) !== f.sha256) bad.push(`differs ${f.path}`);
  }
  return bad;
}

function copyTree(from, to, files) {
  let n = 0;
  for (const f of files) {
    const dst = join(to, f.path);
    if (existsSync(dst) && sha256(dst) === f.sha256) continue;
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(join(from, f.path), dst);
    n++;
  }
  return n;
}

function report(label, bad) {
  if (bad.length) {
    for (const b of bad) console.log(`  ${b}`);
    console.log(`fx-assets ${label}: FAIL (${bad.length})`);
    return 1;
  }
  console.log(`fx-assets ${label}: PASS`);
  return 0;
}

function main(argv) {
  const cmd = argv[0];
  const dirArg = argv.indexOf('--dir');
  const dir = dirArg >= 0 ? resolve(argv[dirArg + 1]) : SRC;
  if (cmd === 'record') {
    const files = walk(SRC).map((path) => ({ path, bytes: statSync(join(SRC, path)).size, sha256: sha256(join(SRC, path)) }));
    mkdirSync(dirname(LIST), { recursive: true });
    const what = 'Eye-candy D derived files (public/fx, gitignored): name, size and sha256 only. tools/fx-assets.mjs verifies, backs up and restores them.';
    writeFileSync(LIST, `${JSON.stringify({ what, backup: FX_BACKUP, files }, null, 1)}\n`);
    console.log(`fx-assets record: ${files.length} files`);
    return 0;
  }
  if (cmd === 'verify') return report(`verify ${dir}`, check(dir));
  if (cmd === 'backup') {
    const files = readList();
    const own = check(SRC, files);
    if (own.length) return report('backup (source)', own);
    console.log(`fx-assets backup: ${copyTree(SRC, FX_BACKUP, files)} copied to ${FX_BACKUP}`);
    return report(`verify ${FX_BACKUP}`, check(FX_BACKUP, files));
  }
  if (cmd === 'restore' || cmd === 'ensure') {
    const files = readList();
    if (cmd === 'ensure' && !check(SRC, files).length) return report('ensure', []);
    const back = check(FX_BACKUP, files);
    if (back.length) return report(`restore (backup ${FX_BACKUP})`, back);
    console.log(`fx-assets ${cmd}: ${copyTree(FX_BACKUP, SRC, files)} restored from ${FX_BACKUP}`);
    return report(`verify ${SRC}`, check(SRC, files));
  }
  console.log('usage: node tools/fx-assets.mjs record | verify [--dir <d>] | backup | restore | ensure');
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const code = main(argv);
  if (code && argv.includes('--warn')) console.log('fx-assets: WARNING, continuing without the eye-candy D depth maps (B draws no depth plates)');
  process.exit(argv.includes('--warn') ? 0 : code);
}
