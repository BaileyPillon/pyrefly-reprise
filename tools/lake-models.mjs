#!/usr/bin/env node
/**
 * The hidden Wendigo chapter's models (Chapter 49, FFX only): `public/models-exp/lake/` (ten bodies, nine weapons, five props: 24 Meshy files).
 *
 * They are made outside the repo (a picture, then Meshy, then Blender and the retarget job), large (about 128 MiB) and the repo is public, so they are gitignored like `public/art`, `public/fx` and the Wind Waker
 * folder: only their names, sizes and sha256 are in git, in `tools/lake/lake-models.json`. The production build SHIPS them (`tools/dist-filter.mjs` `isLakeModelFile`, an allow-list of exactly these files); a build
 * made from a clean worktree has none, and the chapter then stands a capsule in every slot with no error, so a release must restore them before the build and verify them after it (`tools/vite-lake-models.mjs` does
 * both inside `vite build`; `tools/lake-models-verify.mjs` is the deploy's gate).
 *
 *   node tools/lake-models.mjs record               write tools/lake/lake-models.json from public/models-exp/lake
 *   node tools/lake-models.mjs verify [--dir <d>]   every listed file present in <d> (default public/models-exp/lake) with its size and sha256; a release checks <build>/models-exp/lake
 *   node tools/lake-models.mjs backup               copy the folder to every backup place that is reachable, then verify each copy
 *   node tools/lake-models.mjs restore              copy what is missing or different from the first backup that verifies, then verify
 *   node tools/lake-models.mjs ensure [--warn]      verify the folder; restore from the backup when it fails; verify again (--warn: print the failure and go on, the chapter draws capsules)
 *
 * The backups (`backupPlaces`): the models store's dated folder and the second disk's copy of it, both shaped like a `public/` folder (`<store>/<date>/models-exp/lake/...`, with `hashes.json` and `SHA256SUMS.txt` beside
 * `models-exp/`, as the earlier chapters' are). `PYREFLY_LAKE_BACKUP` names one folder (already `.../models-exp/lake`-shaped) instead.
 * Exit 0 = PASS, 1 = FAIL (the reason is printed). Copies only; this tool never deletes a file.
 * Game case: FFX only (the files are the Wendigo chapter's); the tool is delivery plumbing.
 */

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LAKE_MODELS_SRC = join(ROOT, 'public', 'models-exp', 'lake');
export const LAKE_MODELS_LIST = join(ROOT, 'tools', 'lake', 'lake-models.json');
/** The dated folder of the models store and of the second disk's copy of it that hold this chapter's files (`<place>/<date>/models-exp/lake`). */
export const LAKE_BACKUP_DATE = '2026-11-07';
export const LAKE_BACKUP_ROOTS = Object.freeze(['D:/Tools/pyrefly-models-exp-store', 'F:/pyrefly-models-backup']);
/** The backup folders `restore` and `ensure` read and `backup` writes, in order (the store first, then the second disk). */
export function backupPlaces(env = process.env) {
  const one = (env.PYREFLY_LAKE_BACKUP ?? '').trim();
  return one ? [resolve(one)] : LAKE_BACKUP_ROOTS.map((r) => join(r, LAKE_BACKUP_DATE, 'models-exp', 'lake'));
}

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, root, out);
    else out.push(relative(root, p).replace(/\\/g, '/'));
  }
  return out.sort();
}

/** The committed list: `[{ path, bytes, sha256 }]`, paths relative to `public/models-exp/lake`. */
export function readList(list = LAKE_MODELS_LIST) {
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
    console.log(`lake-models ${label}: FAIL (${bad.length})`);
    return 1;
  }
  console.log(`lake-models ${label}: PASS`);
  return 0;
}

/** The first backup place that holds every listed file whole, or null. */
export function firstGoodBackup(files, places = backupPlaces()) {
  return places.find((p) => existsSync(p) && check(p, files).length === 0) ?? null;
}

function main(argv) {
  const cmd = argv[0];
  const dirArg = argv.indexOf('--dir');
  const dir = dirArg >= 0 ? resolve(argv[dirArg + 1]) : LAKE_MODELS_SRC;
  if (cmd === 'record') {
    const files = recordOf(LAKE_MODELS_SRC);
    mkdirSync(dirname(LAKE_MODELS_LIST), { recursive: true });
    const what = "The hidden Wendigo chapter's models (public/models-exp/lake, gitignored): name, size and sha256 only. tools/lake-models.mjs verifies, backs up and restores them.";
    writeFileSync(LAKE_MODELS_LIST, `${JSON.stringify({ what, files }, null, 1)}\n`);
    console.log(`lake-models record: ${files.length} files`);
    return 0;
  }
  if (cmd === 'verify') return report(`verify ${dir}`, check(dir));
  if (cmd === 'backup') {
    const files = readList();
    const own = check(LAKE_MODELS_SRC, files);
    if (own.length) return report('backup (source)', own);
    let code = 0;
    let reached = 0;
    for (const place of backupPlaces()) {
      if (!existsSync(dirname(dirname(dirname(place)))) && !process.env.PYREFLY_LAKE_BACKUP) {
        console.log(`lake-models backup: ${place} is not reachable (its disk or store folder is not there); skipped`);
        continue;
      }
      reached++;
      console.log(`lake-models backup: ${copyTree(LAKE_MODELS_SRC, place, files)} copied to ${place}`);
      code |= report(`verify ${place}`, check(place, files));
    }
    if (reached === 0) {
      console.log('lake-models backup: FAIL, no backup place is reachable');
      return 1;
    }
    return code;
  }
  if (cmd === 'restore' || cmd === 'ensure') {
    const files = readList();
    if (cmd === 'ensure' && !check(LAKE_MODELS_SRC, files).length) return report('ensure', []);
    const from = firstGoodBackup(files);
    if (!from) return report(`restore (no backup holds all ${files.length} files: ${backupPlaces().join(', ')})`, [`no whole copy of the ${files.length} files`]);
    console.log(`lake-models ${cmd}: ${copyTree(from, LAKE_MODELS_SRC, files)} restored from ${from}`);
    return report(`verify ${LAKE_MODELS_SRC}`, check(LAKE_MODELS_SRC, files));
  }
  console.log('usage: node tools/lake-models.mjs record | verify [--dir <d>] | backup | restore | ensure [--warn]');
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const warn = () => console.log("lake-models: WARNING, continuing without the Wendigo chapter's models (it draws capsules)");
  try {
    const code = main(argv);
    if (code && argv.includes('--warn')) warn();
    process.exit(argv.includes('--warn') ? 0 : code);
  } catch (error) {
    console.log(`lake-models: FAIL: ${error?.message ?? error}`);
    if (argv.includes('--warn')) warn();
    process.exit(argv.includes('--warn') ? 0 : 1);
  }
}
