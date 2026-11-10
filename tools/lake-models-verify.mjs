#!/usr/bin/env node
/**
 * Proof that a build (or the source tree) carries the hidden Wendigo chapter's models, whole (ch-wendigo, 2026-11-07; Chapter 49, FFX only).
 *
 * The 28 models (fourteen Meshy bodies, nine weapons, five props: `LAKE_SHIPPED_FILES`, `src/data/ffx/lake-models.ts`) are local files, gitignored like the paintings (`public/models-exp/lake/`), so a release cut from a tree that
 * lacks them ships a chapter whose figures are neutral capsules and nothing else in the deploy notices. This is the check that notices (the deploy runs it next to the 3D Bahamut's, before the build is hashed):
 *
 *   node tools/lake-models-verify.mjs --dir <build>        a BUILD (`dist/`, `dist-release/`): exactly the 28 files in `models-exp/lake`, no other file of that folder, each whole, under the host's per-file limit, its size and sha256 the recorded ones
 *   node tools/lake-models-verify.mjs --source [<public>]  the SOURCE `public/`: the 28 files are there and whole (extras are expected there)
 *
 * "Whole" means a binary glTF whose header says version 2 and its own length (a copy cut short fails), and, in a build, whose JSON chunk names no place on the PC that built it (a drive path, a user-profile path, the
 * scratch folder). The recorded list is `tools/lake/lake-models.json` (`tools/lake-models.mjs record`); it must name exactly the files the code asks for, so a model added to the chapter and not recorded fails here.
 * Exit 0 = PASS, 1 = FAIL (every problem is printed). To ship the chapter on capsules ON PURPOSE, set `PYREFLY_LAKE_MODELS=capsules` for that one run: a build with NO `models-exp/lake` folder then passes with a warning; a
 * build with some of the files and not all still fails.
 * Reads files only; never writes or deletes. Game case: FFX only (the chapter's); the check is delivery plumbing.
 */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { LAKE_SHIPPED_FILES } from '../src/data/ffx/lake-models.ts';
import { CLOUDFLARE_LIMITS } from './deploy-host.mjs';
import { LAKE_DIR } from './dist-filter.mjs';
import { readList } from './lake-models.mjs';
import { glbProblem, listFiles, localPathProblem } from './yrp-models-verify.mjs';

/** Every file the set contains, as a path under the root with forward slashes. */
export function expectedLakeFiles() {
  return LAKE_SHIPPED_FILES.map((f) => `${LAKE_DIR}/${f}`);
}

const MIB = 1048576;

/**
 * Check `root` (a build's root, or `public/`). `mode` is 'build' (the exact set) or 'source' (the set is present; more is fine). `limits.maxFileBytes` is the host's per-file limit; `list` is the recorded list
 * (`[{ path, bytes, sha256 }]`, paths under `models-exp/lake`).
 * @returns {{ ok: boolean, problems: string[], files: number, bytes: number }}
 */
export function verifyLakeModels(root, { mode = 'build', limits = CLOUDFLARE_LIMITS, list = readList() } = {}) {
  const problems = [];
  const want = expectedLakeFiles();
  const listed = new Map(list.map((f) => [`${LAKE_DIR}/${f.path}`, f]));
  // The recorded list and the code's list must be the same set (a model added to the chapter and not recorded would pass every other check).
  for (const rel of want) if (!listed.has(rel)) problems.push(`${rel}: the chapter loads it but tools/lake/lake-models.json does not record it (node tools/lake-models.mjs record)`);
  for (const rel of listed.keys()) if (!want.includes(rel)) problems.push(`${rel}: recorded but not in LAKE_SHIPPED_FILES (src/data/ffx/lake-models.ts)`);
  let bytes = 0;
  for (const rel of want) {
    const full = join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      problems.push(`${rel}: missing`);
      continue;
    }
    const size = lstatSync(full).size;
    bytes += size;
    if (size === 0) problems.push(`${rel}: empty`);
    if (size > limits.maxFileBytes) problems.push(`${rel}: ${size} bytes is over the host's ${limits.maxFileBytes}-byte limit for one file`);
    const why = glbProblem(full);
    if (why) problems.push(`${rel}: ${why}`);
    if (mode === 'build') {
      const local = localPathProblem(full, true);
      if (local) problems.push(`${rel}: ${local}`);
    }
    const rec = listed.get(rel);
    if (rec && (size !== rec.bytes || createHash('sha256').update(readFileSync(full)).digest('hex') !== rec.sha256)) problems.push(`${rel}: is not the recorded file (size or sha256 differs from tools/lake/lake-models.json)`);
  }
  if (mode === 'build') {
    const extra = listFiles(join(root, LAKE_DIR)).map((f) => `${LAKE_DIR}/${f}`).filter((f) => !want.includes(f));
    for (const rel of extra.slice(0, 20)) problems.push(`${rel}: ships but is not in the set`);
    if (extra.length > 20) problems.push(`... and ${extra.length - 20} more file(s) that are not in the set`);
  }
  return { ok: problems.length === 0, problems, files: want.length, bytes };
}

/** The one environment value that lets a build with no models folder through (see the header). */
export const CAPSULES_ENV = 'PYREFLY_LAKE_MODELS';
export const CAPSULES_OK = 'capsules';

function main(argv) {
  const source = argv.includes('--source');
  const flag = source ? '--source' : '--dir';
  const at = argv.indexOf(flag);
  const given = at >= 0 && argv[at + 1] && !argv[at + 1].startsWith('--') ? argv[at + 1] : null;
  const dir = resolve(given ?? (source ? 'public' : 'dist'));
  const result = verifyLakeModels(dir, { mode: source ? 'source' : 'build' });
  const absent = !source && !existsSync(join(dir, LAKE_DIR));
  if (!result.ok && absent && process.env[CAPSULES_ENV] === CAPSULES_OK) {
    console.log(`lake-models-verify build ${dir}: WARNING, no ${LAKE_DIR} folder: the hidden Wendigo chapter (Chapter 49) will play on grey capsules (${CAPSULES_ENV}=${CAPSULES_OK} was set on purpose)`);
    return 0;
  }
  if (result.ok) {
    console.log(`lake-models-verify ${source ? 'source' : 'build'} ${dir}: PASS, ${result.files} files, ${(result.bytes / MIB).toFixed(1)} MiB${source ? '' : ', nothing else of models-exp/lake'}`);
    return 0;
  }
  console.log(`lake-models-verify ${source ? 'source' : 'build'} ${dir}: FAIL`);
  if (!absent) for (const p of result.problems) console.log(`  ${p}`); // an absent folder is one line below, not 24 "missing"
  if (absent) {
    console.log(`  this build holds no ${LAKE_DIR} folder: it was cut from a tree without public/models-exp/lake (the folder is gitignored, like the paintings), so the hidden Wendigo chapter would ship on grey capsules.`);
    console.log(`  run "node tools/lake-models.mjs ensure" in the release tree (it restores the files from the models store) and build again (docs/handoff/ch-wendigo.md section P4); to ship the chapter on capsules on purpose, set ${CAPSULES_ENV}=${CAPSULES_OK} for this run.`);
  }
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
