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
 * `verify`, `backup` and `ensure` check two things. The recorded list above, and the room registry (`ROOMS` in
 * `src/engine/fx/b/ambient/index.ts`: every backdrop the game draws depth plates for): each listed backdrop must have
 * `<key>/depth.png` (a real PNG) and `<key>/depth.json` in the folder checked, whether or not `fx-assets.json` knows the
 * room. `public/fx` is untracked, so a build from a clean worktree has no depth maps and the game asks for
 * `fx/<backdrop>/depth.png` and gets a 404 (found by the independent fidelity check of release 39, 2026-10-04); a room added
 * to the registry but never recorded would slip the same way. The deploy runs `verify --dir <build>/fx` after the build for
 * every host (`tools/deploy-pages.mjs`, GitHub Pages and Cloudflare alike), so a build without them cannot ship.
 *
 * Exit 0 = PASS, 1 = FAIL (the reason is printed). Copies only; this tool never deletes a file.
 * Game case: both (shared plumbing; the maps are for FFX and FFX-2 rooms, and a message names the room's game).
 */

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

/** The room registry: every backdrop the game draws depth plates for (`ROOMS`, one entry per scene key). */
export const ROOM_REGISTRY = join(ROOT, 'src', 'engine', 'fx', 'b', 'ambient', 'index.ts');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * The backdrops the game asks a depth map for: every registry entry that has plates, as `{ key, game }`, sorted by key. Read by
 * importing the registry itself (Node strips the types), so a room added to the game is checked the day it is added. A registry
 * that cannot be read throws: a check that cannot run must not pass.
 */
export async function plateRooms(registry = ROOM_REGISTRY) {
  const { ROOMS } = await import(pathToFileURL(registry).href);
  const rooms = Object.values(ROOMS ?? {}).filter((r) => r && r.plates).map((r) => ({ key: r.key, game: r.game }));
  if (!rooms.length) throw new Error(`${registry} lists no room with depth plates: the depth-map check has nothing to read`);
  return rooms.sort((a, b) => (a.key < b.key ? -1 : 1));
}

/**
 * Problems with `dir` (a `fx` folder: `public/fx`, or `fx` inside a build) against `rooms` (`plateRooms()`): each backdrop needs its
 * `depth.png` (a PNG, not empty) and `depth.json`. It does not read `fx-assets.json`, so a room the list never recorded, or a `dir`
 * that is not there at all (a clean worktree: `public/fx` is untracked), is caught. It reads files under `dir` and no address, so
 * it is the same for GitHub Pages and for Cloudflare. Empty = PASS.
 */
export function checkPlateRooms(dir, rooms) {
  const bad = [];
  for (const { key, game } of rooms) {
    const label = `${game === 'ffx2' ? 'FFX-2' : 'FFX'} backdrop ${key}`;
    for (const name of ['depth.png', 'depth.json']) {
      const p = join(dir, key, name);
      if (!existsSync(p) || !statSync(p).isFile()) bad.push(`no depth map for ${label}: ${key}/${name} is missing`);
      else if (statSync(p).size === 0) bad.push(`empty ${key}/${name} (${label})`);
      else if (name === 'depth.png' && !readFileSync(p).subarray(0, 8).equals(PNG_SIGNATURE)) bad.push(`${key}/depth.png is not a PNG (${label})`);
    }
  }
  return bad;
}

/** The list check and the room check together; a file both report is named once (the list's line wins). */
export async function checkAll(dir, files = readList(), rooms = null) {
  const listed = check(dir, files);
  const reported = [...new Set(listed.map((m) => m.replace(/^(missing|differs) /, '')))];
  const roomProblems = checkPlateRooms(dir, rooms ?? await plateRooms()).filter((m) => !reported.some((path) => m.includes(path)));
  return [...listed, ...roomProblems];
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

async function main(argv) {
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
  if (cmd === 'verify') return report(`verify ${dir}`, await checkAll(dir));
  if (cmd === 'backup') {
    const files = readList();
    const own = await checkAll(SRC, files);
    if (own.length) return report('backup (source)', own);
    console.log(`fx-assets backup: ${copyTree(SRC, FX_BACKUP, files)} copied to ${FX_BACKUP}`);
    return report(`verify ${FX_BACKUP}`, check(FX_BACKUP, files));
  }
  if (cmd === 'restore' || cmd === 'ensure') {
    const files = readList();
    if (cmd === 'ensure' && !(await checkAll(SRC, files)).length) return report('ensure', []);
    const back = check(FX_BACKUP, files);
    if (back.length) return report(`restore (backup ${FX_BACKUP})`, back);
    console.log(`fx-assets ${cmd}: ${copyTree(FX_BACKUP, SRC, files)} restored from ${FX_BACKUP}`);
    return report(`verify ${SRC}`, await checkAll(SRC, files));
  }
  console.log('usage: node tools/fx-assets.mjs record | verify [--dir <d>] | backup | restore | ensure');
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const warn = () => console.log('fx-assets: WARNING, continuing without the eye-candy D depth maps (B draws no depth plates)');
  main(argv).then((code) => {
    if (code && argv.includes('--warn')) warn();
    process.exit(argv.includes('--warn') ? 0 : code);
  }, (error) => {
    console.log(`fx-assets: FAIL: ${error?.message ?? error}`);
    if (argv.includes('--warn')) warn();
    process.exit(argv.includes('--warn') ? 0 : 1);
  });
}
