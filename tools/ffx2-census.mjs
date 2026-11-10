// FFX-2 flag-off census: plays every FFX-2 chapter on fixed seeds in two source trees and compares what happened. FFX-2 only.
//
// WHAT IT PROVES
//   That a switch which is off, or a shared-table fix, changed no shipped FFX-2 chapter. Every FFX-2 chapter record (the listed, the
//   unlisted and the experimental ones) is played from its first formation to its last through the shipped bot
//   (`tests/unit/helpers/ffx2ChapterDrive.ts`, flags at their defaults) in THIS tree and in a BASE tree, on the same seeds, once with no
//   thinking time at the menus (the auto-battler control) and once with a modelled human decision time. For each run it keeps the
//   outcome, the game ticks, the event count and a hash of every event of every link, and it compares the two trees run by run.
//
// HOW TO MAKE THE OTHER TREE
//   The base is the source as it stood before the change, for example the branch you are merging into (any git ref):
//     mkdir <dir>
//     git archive <ref> src tests/unit/helpers package.json | tar -x -C <dir>
//   It needs no node_modules and no art. This tool never writes into it.
//
// HOW TO RUN IT (from the repository root, Node 24; about 35 seconds per tree)
//   node --experimental-transform-types tools/ffx2-census.mjs --base <dir>
//   Options: --only <id,id>  --seeds <n,n>  --ms <n,n> (decision times, default 0,1500)  --out <file.json> (every run of both trees)
//            --quiet (totals and differences only)
//   Exit code 0 = every chapter on both sides is identical; 1 = any difference (see below); 2 = the command line or the base is wrong.
//
// WHAT A DIFFERENCE MEANS
//   A chapter whose outcome, ticks, event count or event hash differs between the trees is a chapter the change reaches. If the change
//   was meant to be inert for FFX-2 (a switch that is off), that is a defect: find the first event that differs before anything ships.
//   If it was a shared-table fix, the chapters that differ must be exactly the ones the fix is allowed to move; check the list against
//   the change's intent and say so. A run that throws counts as a failure too (an error on both sides is not evidence of sameness), and
//   so does a chapter that is in the base but gone from this tree. A chapter that exists only here (a new one) has nothing to compare
//   with: it is listed, and not compared.
//
// It imports only this repository's source (relative to this file) and the base tree's same two files; no other path is written here.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = 'usage: node --experimental-transform-types tools/ffx2-census.mjs --base <dir> [--only id,id] [--seeds 1,2,3,4,5] [--ms 0,1500] [--out file.json] [--quiet]';
const SPECIALS = ['floral-fallal', 'machina-maw', 'full-throttle'];

/** @returns {{ base: string, only: string[] | null, seeds: number[], ms: number[], out: string | null, quiet: boolean }} */
function parseArgs(argv) {
  const o = { base: '', only: null, seeds: [1, 2, 3, 4, 5], ms: [0, 1500], out: null, quiet: false };
  const nums = (s, flag) => {
    const list = s.split(',').map((x) => Number(x.trim()));
    if (list.length === 0 || list.some((n) => !Number.isFinite(n))) fail(`${flag} wants a comma list of numbers, got "${s}"`);
    return list;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined) fail(`${a} wants a value`);
      return v;
    };
    if (a === '--base') o.base = val();
    else if (a === '--only') o.only = val().split(',').map((x) => x.trim()).filter(Boolean);
    else if (a === '--seeds') o.seeds = nums(val(), a);
    else if (a === '--ms') o.ms = nums(val(), a);
    else if (a === '--out') o.out = val();
    else if (a === '--quiet') o.quiet = true;
    else fail(`unknown argument "${a}"`);
  }
  if (!o.base) fail('--base <dir> is required');
  return o;
}

function fail(message) {
  console.error(`ffx2-census: ${message}\n${USAGE}`);
  process.exit(2);
}

/** Load the chapter records and the drive helper of one tree; `rootUrl` ends in a slash. */
async function loadTree(rootUrl) {
  const imp = (rel) => import(new URL(rel, rootUrl).href);
  const [enc, drive, setup, data] = await Promise.all([
    imp('src/data/encounters.ts'),
    imp('tests/unit/helpers/ffx2ChapterDrive.ts'),
    imp('src/battle/ffx2/setup.ts'),
    imp('src/data/ffx2/index.ts'),
  ]);
  const byId = new Map();
  for (const c of [...enc.CHAPTERS, ...(enc.UNLISTED_CHAPTERS ?? []), ...(enc.EXPERIMENT_CHAPTERS ?? [])]) {
    if (c.game === 'ffx2' && !byId.has(c.id)) byId.set(c.id, c);
  }
  return { chapters: byId, drive, setup, data };
}

/** Which of the Specials a chapter's party can reach at the defaults (in a grid node or worn): the "switch is off" check, per tree. */
function specialsReachable(tree) {
  try {
    const found = [];
    for (const c of tree.chapters.values()) {
      for (const m of c.buildRef?.members ?? []) {
        const grid = tree.data.GARMENT_GRIDS[m.garmentGrid?.id ?? ''] ?? Object.values(tree.data.GARMENT_GRIDS).find((g) => g.id === m.garmentGrid?.id);
        const contents = tree.setup.gridNodeContents(m, grid?.nodes ?? 6);
        if (contents.some((d) => d !== null && SPECIALS.includes(d))) found.push(`${c.id}:${m.id ?? m.characterId} (node)`);
        if (SPECIALS.includes(m.currentDressphere)) found.push(`${c.id}:${m.id ?? m.characterId} (worn)`);
      }
    }
    return found;
  } catch (e) {
    return null; // this tree has no such probe (older source)
  }
}

function playAll(tree, ids, opts, label) {
  const runs = new Map();
  for (const id of ids) {
    for (const ms of opts.ms) {
      for (const seed of opts.seeds) {
        const t0 = Date.now();
        let run;
        try {
          const r = tree.drive.driveChapterRecord(tree.chapters.get(id), seed, ms);
          run = { chapter: id, seed, ms, outcome: r.outcome, ticks: r.ticks, events: r.logs.reduce((a, l) => a + l.length, 0), hash: tree.drive.logHash(r) };
        } catch (e) {
          run = { chapter: id, seed, ms, error: String(e?.message ?? e).slice(0, 200) };
        }
        run.sec = Math.round((Date.now() - t0) / 100) / 10;
        runs.set(`${id}|${seed}|${ms}`, run);
      }
    }
    if (!opts.quiet) console.log(`  ${label}: ${id} played (${opts.ms.length * opts.seeds.length} runs)`);
  }
  return runs;
}

const sameRun = (a, b) => a.hash === b.hash && a.ticks === b.ticks && a.events === b.events && a.outcome === b.outcome && a.error === b.error;
const show = (r) => (r.error ? `ERROR ${r.error}` : `${r.outcome} ticks ${r.ticks} events ${r.events} hash ${r.hash}`);

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const baseRoot = path.resolve(opts.base);
  for (const rel of ['src/data/encounters.ts', 'tests/unit/helpers/ffx2ChapterDrive.ts']) {
    if (!fs.existsSync(path.join(baseRoot, rel))) fail(`the base tree has no ${rel}: make it with git archive (see the header of this file)`);
  }
  const here = await loadTree(new URL('../', import.meta.url));
  const base = await loadTree(pathToFileURL(baseRoot + path.sep));

  const wanted = (id) => !opts.only || opts.only.includes(id);
  const both = [...here.chapters.keys()].filter((id) => base.chapters.has(id) && wanted(id));
  const onlyHere = [...here.chapters.keys()].filter((id) => !base.chapters.has(id) && wanted(id));
  const onlyBase = [...base.chapters.keys()].filter((id) => !here.chapters.has(id) && wanted(id));
  if (opts.only) for (const id of opts.only) if (!here.chapters.has(id) && !base.chapters.has(id)) fail(`no FFX-2 chapter "${id}" in either tree`);

  const sp = (t) => specialsReachable(t);
  const spHere = sp(here);
  const spBase = sp(base);
  const spText = (l) => (l === null ? 'not probed (older source)' : l.length ? l.join(', ') : 'none');
  console.log(`Specials reachable at the defaults: this tree ${spText(spHere)}; base ${spText(spBase)}`);
  console.log(`Chapters: ${both.length} on both sides (compared), ${onlyHere.length} only here (not compared), ${onlyBase.length} only in the base (a failure). Seeds ${opts.seeds.join(',')}, decision times ${opts.ms.join(',')} ms.`);

  const baseRuns = playAll(base, both, opts, 'base');
  const hereRuns = playAll(here, both, opts, 'here');

  let identical = 0;
  let errors = 0;
  const differences = [];
  const perChapter = new Map();
  for (const [key, b] of baseRuns) {
    const h = hereRuns.get(key);
    const e = perChapter.get(b.chapter) ?? { n: 0, same: 0 };
    e.n += 1;
    errors += (b.error ? 1 : 0) + (h.error ? 1 : 0);
    if (sameRun(b, h)) {
      identical += 1;
      e.same += 1;
    } else differences.push({ key, base: b, here: h });
    perChapter.set(b.chapter, e);
  }
  if (!opts.quiet) for (const [id, e] of perChapter) console.log(`${id.padEnd(30)}${e.same} / ${e.n} identical${e.same < e.n ? '   DIFFERENT' : ''}`);
  if (onlyHere.length) console.log(`Only in this tree (listed, not compared): ${onlyHere.join(', ')}`);
  if (onlyBase.length) console.log(`Only in the base (a chapter is gone from this tree): ${onlyBase.join(', ')}`);
  for (const d of differences.slice(0, 12)) console.log(`DIFFERENT ${d.key}\n  base: ${show(d.base)}\n  here: ${show(d.here)}`);
  if (differences.length > 12) console.log(`... and ${differences.length - 12} more different runs`);

  if (opts.out) fs.writeFileSync(path.resolve(opts.out), JSON.stringify({ seeds: opts.seeds, ms: opts.ms, base: [...baseRuns.values()], here: [...hereRuns.values()], onlyHere, onlyBase }, null, 1));

  const failed = differences.length > 0 || errors > 0 || onlyBase.length > 0;
  console.log(`\nchapters compared ${both.length}; runs ${baseRuns.size}; identical ${identical}; different ${differences.length}; runs that threw ${errors}; only here ${onlyHere.length}; only in the base ${onlyBase.length}`);
  console.log(failed ? 'RESULT: DIFFERENCE (exit 1)' : 'RESULT: identical on every chapter both trees hold (exit 0)');
  process.exit(failed ? 1 : 0);
}

await main();
