#!/usr/bin/env node
/**
 * The hidden Wind Waker chapter's models (Chapter 32, FFX-2 only): `public/models-exp/windwaker/` (the girls, the boss, the swappable weapons and temple pieces).
 *
 * They are made outside the repo (a picture, then Meshy, then Blender), large (about 33 MB) and the repo is public, so they are gitignored like `public/art` and `public/fx`: only their names, sizes and
 * sha256 are in git, in `tools/ww/ww-models.json`. The files live on this disk, with a copy in `D:/Tools/pyrefly-models-backup/windwaker` (`PYREFLY_WW_BACKUP` overrides it). The production build SHIPS
 * them (`tools/dist-filter.mjs` names `models-exp/windwaker/**` as shipped); a build made from a clean worktree has none, and the chapter then stands a capsule in every slot, so a release must verify the
 * build it is about to publish.
 *
 *   node tools/ww-models.mjs record               write tools/ww/ww-models.json from public/models-exp/windwaker
 *   node tools/ww-models.mjs verify [--dir <d>]   every listed file present in <d> (default public/models-exp/windwaker) with its sha256; a release checks <build>/models-exp/windwaker
 *   node tools/ww-models.mjs backup               copy the folder to the backup, then verify the copy
 *   node tools/ww-models.mjs restore              copy what is missing or different from the backup, then verify
 *   node tools/ww-models.mjs ensure [--warn]      verify the folder; restore from the backup when it fails; verify again (--warn: print the failure and go on, the chapter draws capsules)
 *
 * Exit 0 = PASS, 1 = FAIL (the reason is printed). Copies only; this tool never deletes a file.
 * Game case: FFX-2 only (the files are the Wind Waker chapter's, which is hidden chapter 24's Valefor fight); the tool is delivery plumbing.
 */

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WW_MODELS_SRC = join(ROOT, 'public', 'models-exp', 'windwaker');
export const WW_MODELS_LIST = join(ROOT, 'tools', 'ww', 'ww-models.json');
export const WW_MODELS_BACKUP = process.env.PYREFLY_WW_BACKUP ?? 'D:/Tools/pyrefly-models-backup/windwaker';

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, root, out);
    else out.push(relative(root, p).replace(/\\/g, '/'));
  }
  return out.sort();
}

/** The committed list: `[{ path, bytes, sha256 }]`, paths relative to `public/models-exp/windwaker`. */
export function readList(list = WW_MODELS_LIST) {
  return JSON.parse(readFileSync(list, 'utf8')).files;
}

/** Problems with `dir` against the list (empty = PASS). A folder that is not there at all is every file missing. */
export function check(dir, files = readList()) {
  const bad = [];
  for (const f of files) {
    const p = join(dir, f.path);
    if (!existsSync(p)) bad.push(`missing ${f.path}`);
    else if (statSync(p).size !== f.bytes || sha256(p) !== f.sha256) bad.push(`differs ${f.path}`);
  }
  return bad;
}

/** Copy the listed files that are missing or different from one folder to another; returns how many were copied. */
export function copyTree(from, to, files) {
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

/** The list of a folder as the file records it. */
export function recordOf(dir) {
  return walk(dir).map((path) => ({ path, bytes: statSync(join(dir, path)).size, sha256: sha256(join(dir, path)) }));
}

function report(label, bad) {
  if (bad.length) {
    for (const b of bad) console.log(`  ${b}`);
    console.log(`ww-models ${label}: FAIL (${bad.length})`);
    return 1;
  }
  console.log(`ww-models ${label}: PASS`);
  return 0;
}

function main(argv) {
  const cmd = argv[0];
  const dirArg = argv.indexOf('--dir');
  const dir = dirArg >= 0 ? resolve(argv[dirArg + 1]) : WW_MODELS_SRC;
  if (cmd === 'record') {
    const files = recordOf(WW_MODELS_SRC);
    mkdirSync(dirname(WW_MODELS_LIST), { recursive: true });
    const what = "The hidden Wind Waker chapter's models (public/models-exp/windwaker, gitignored): name, size and sha256 only. tools/ww-models.mjs verifies, backs up and restores them.";
    writeFileSync(WW_MODELS_LIST, `${JSON.stringify({ what, backup: WW_MODELS_BACKUP, files }, null, 1)}\n`);
    console.log(`ww-models record: ${files.length} files`);
    return 0;
  }
  if (cmd === 'verify') return report(`verify ${dir}`, check(dir));
  if (cmd === 'backup') {
    const files = readList();
    const own = check(WW_MODELS_SRC, files);
    if (own.length) return report('backup (source)', own);
    console.log(`ww-models backup: ${copyTree(WW_MODELS_SRC, WW_MODELS_BACKUP, files)} copied to ${WW_MODELS_BACKUP}`);
    return report(`verify ${WW_MODELS_BACKUP}`, check(WW_MODELS_BACKUP, files));
  }
  if (cmd === 'restore' || cmd === 'ensure') {
    const files = readList();
    if (cmd === 'ensure' && !check(WW_MODELS_SRC, files).length) return report('ensure', []);
    const back = check(WW_MODELS_BACKUP, files);
    if (back.length) return report(`restore (backup ${WW_MODELS_BACKUP})`, back);
    console.log(`ww-models ${cmd}: ${copyTree(WW_MODELS_BACKUP, WW_MODELS_SRC, files)} restored from ${WW_MODELS_BACKUP}`);
    return report(`verify ${WW_MODELS_SRC}`, check(WW_MODELS_SRC, files));
  }
  console.log('usage: node tools/ww-models.mjs record | verify [--dir <d>] | backup | restore | ensure [--warn]');
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const warn = () => console.log('ww-models: WARNING, continuing without the Wind Waker chapter\'s models (it draws capsules)');
  try {
    const code = main(argv);
    if (code && argv.includes('--warn')) warn();
    process.exit(argv.includes('--warn') ? 0 : code);
  } catch (error) {
    console.log(`ww-models: FAIL: ${error?.message ?? error}`);
    if (argv.includes('--warn')) warn();
    process.exit(argv.includes('--warn') ? 0 : 1);
  }
}
