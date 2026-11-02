#!/usr/bin/env node
/**
 * Proof that a build (or the source tree) carries the hidden 3D Bahamut's models, whole (ch-yrp, 2026-11-02; FFX-2 only).
 *
 * The models are local files, gitignored like the paintings (`public/models-exp/`), so a release cut from a tree that lacks them ships a chapter whose figures are neutral capsules and nothing in the
 * deploy notices. This is the check that notices: the set `tools/dist-filter.mjs` ships (`src/data/yrp-ids.ts` `YRP_SHIPPED_*`) must be there, each file whole, and nothing else of the models folder with it.
 *
 *   node tools/yrp-models-verify.mjs --dir <build>      a BUILD (`dist/`, `dist-release/`): the exact set, no extra file, the shipped manifest (14 folders, `hd` off), every file under the host's per-file limit
 *   node tools/yrp-models-verify.mjs --source [<public>] the SOURCE `public/`: every file of the set is there and whole (extras and the full manifest are expected there)
 *
 * "Whole" means a binary glTF whose header says version 2 and its own length (a copy cut short fails), or a JSON file that parses. Exit 0 = PASS, 1 = FAIL (every problem is printed).
 * Reads files only; never writes or deletes. Game case: FFX-2 only (the models are the game's own Yuna, Rikku, Paine and Bahamut); the check is shared delivery plumbing.
 */
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { YRP_MODEL_DIRS, YRP_SHIPPED_BASE_FILES, YRP_SHIPPED_DRESS_FOLDERS, YRP_SHIPPED_HD_FILES } from '../src/data/yrp-ids.ts';
import { CLOUDFLARE_LIMITS } from './deploy-host.mjs';
import { shippedDressIndex } from './dist-filter.mjs';

/** Every file the set contains, as a path under the root with forward slashes. */
export function expectedYrpFiles() {
  return [
    ...YRP_SHIPPED_BASE_FILES.map((f) => `${YRP_MODEL_DIRS.base}/${f}`),
    ...YRP_SHIPPED_HD_FILES.map((f) => `${YRP_MODEL_DIRS.hd}/${f}`),
    `${YRP_MODEL_DIRS.base}/dress/index.json`,
    ...YRP_SHIPPED_DRESS_FOLDERS.flatMap((d) => [`${YRP_MODEL_DIRS.base}/dress/${d}/anims.glb`, `${YRP_MODEL_DIRS.base}/dress/${d}/clipmap.json`]),
  ];
}

/** Why a binary glTF at `path` is not whole, or null: the magic, version 2 and a length field equal to the file's. */
function glbProblem(path) {
  const b = readFileSync(path);
  if (b.length < 20 || b.toString('latin1', 0, 4) !== 'glTF') return 'is not a binary glTF';
  if (b.readUInt32LE(4) !== 2) return `is glTF version ${b.readUInt32LE(4)}, not 2`;
  if (b.readUInt32LE(8) !== b.length) return `says ${b.readUInt32LE(8)} bytes in its header and has ${b.length} (cut short or padded)`;
  return null;
}

/** Every file under `dir` as a path relative to it with forward slashes (links are not followed). */
function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      const st = lstatSync(full);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) walk(full);
      else out.push(relative(dir, full).split(sep).join('/'));
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

/**
 * Check `root` (a build's root, or `public/`). `mode` is 'build' (the exact set, the trimmed manifest) or 'source' (the set is present; more is fine). `limits.maxFileBytes` is the host's per-file limit.
 * @returns {{ ok: boolean, problems: string[], files: number, bytes: number }}
 */
export function verifyYrpModels(root, { mode = 'build', limits = CLOUDFLARE_LIMITS } = {}) {
  const problems = [];
  const want = expectedYrpFiles();
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
    if (rel.endsWith('.glb')) {
      const why = glbProblem(full);
      if (why) problems.push(`${rel}: ${why}`);
    } else {
      try {
        JSON.parse(readFileSync(full, 'utf8'));
      } catch {
        problems.push(`${rel}: is not JSON`);
      }
    }
  }
  if (mode === 'build') {
    const extra = listFiles(join(root, 'models-exp')).map((f) => `models-exp/${f}`).filter((f) => !want.includes(f));
    for (const rel of extra.slice(0, 20)) problems.push(`${rel}: ships but is not in the set`);
    if (extra.length > 20) problems.push(`... and ${extra.length - 20} more file(s) that are not in the set`);
    const index = join(root, ...`${YRP_MODEL_DIRS.base}/dress/index.json`.split('/'));
    if (existsSync(index)) {
      try {
        const json = JSON.parse(readFileSync(index, 'utf8'));
        const trimmed = shippedDressIndex(json);
        const folders = Array.isArray(json?.entries) ? json.entries.map((e) => e?.folder) : [];
        if (!trimmed) problems.push(`${YRP_MODEL_DIRS.base}/dress/index.json: is not a dress manifest`);
        else if ([...folders].sort().join() !== [...YRP_SHIPPED_DRESS_FOLDERS].sort().join()) problems.push(`${YRP_MODEL_DIRS.base}/dress/index.json: lists ${folders.length} folder(s), not the ${YRP_SHIPPED_DRESS_FOLDERS.length} that ship`);
        else if (json.entries.some((e) => e.hd !== false)) problems.push(`${YRP_MODEL_DIRS.base}/dress/index.json: an entry still asks for an HD file, which does not ship`);
      } catch {
        /* already reported as not JSON */
      }
    }
  }
  return { ok: problems.length === 0, problems, files: want.length, bytes };
}

const MIB = 1048576;

function main(argv) {
  const source = argv.includes('--source');
  const flag = source ? '--source' : '--dir';
  const at = argv.indexOf(flag);
  const given = at >= 0 && argv[at + 1] && !argv[at + 1].startsWith('--') ? argv[at + 1] : null;
  const dir = resolve(given ?? (source ? 'public' : 'dist'));
  const result = verifyYrpModels(dir, { mode: source ? 'source' : 'build' });
  if (result.ok) {
    console.log(`yrp-models-verify ${source ? 'source' : 'build'} ${dir}: PASS, ${result.files} files, ${(result.bytes / MIB).toFixed(1)} MiB${source ? '' : ', nothing else of models-exp'}`);
    return 0;
  }
  console.log(`yrp-models-verify ${source ? 'source' : 'build'} ${dir}: FAIL`);
  for (const p of result.problems) console.log(`  ${p}`);
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
