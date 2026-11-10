#!/usr/bin/env node
/**
 * The winnability bench of the hidden Fiend Arena Superbosses chapter (FFX-2 only): plays each act (Almighty Shinra; the Major Numerus) on the real engine on named lines, kits and paces, and prints the tables that
 * `docs/handoff/ch-fiend-superbosses.md` and `docs/plans/ch-fiend-superbosses-options.md` carry. The harness is `tests/unit/helpers/fiendSuperbossBench.ts` and the cells are `fiendSuperbossBenchCells.ts` (the ones
 * `tests/unit/chapters/fiend-superbosses-bench.test.ts` pins), so what is printed is what is tested. **No enemy row is ever touched**: a line is a plan among the party's own commands, a kit is a rig on the party.
 * Measure, never tune; a result goes to Bailey.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/fiend-superbosses-bench.mjs --group base|whatif|rig|all [--act 1|2] [--continuation] [--shard 0/4] [--cells a,b] [--seeds 20] [--out <dir>]
 *   node --experimental-transform-types tools/fiend-superbosses-bench.mjs --table <dir>
 *
 *   --group   the cells of a group (default all); --cells names cells exactly (`whatif/miracle/act1/bench`)
 *   --act     only the cells of one act
 *   --continuation  MEASUREMENT ONLY: act 2 opened as the engine opens a plain chained link (every wait whole, no trim), the way the chapter opened it before the fix pass of lane w53 (the options sheet's alternative)
 *   --shard   i/n: only the cells whose index is i modulo n, so n processes can split the table
 *   --seeds   overrides the seed count of every chosen cell (a smoke run); unset, a cell uses its own (200 at bench speed, 40 at each human pace)
 *   --out     a directory: one JSON file per cell (the tally and the wall time); --table reads such a directory and prints the markdown tables
 */

import fs from 'node:fs';
import path from 'node:path';
import { CELLS } from '../tests/unit/helpers/fiendSuperbossBenchCells.ts';
import { runCell } from '../tests/unit/helpers/fiendSuperbossBench.ts';

const args = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const next = argv[i + 1];
  if (next === undefined || next.startsWith('--')) args.set(argv[i], 'true');
  else {
    args.set(argv[i], next);
    i++;
  }
}

const KITS = (kit = {}) => Object.entries(kit).map(([k, v]) => (v === true ? k : `${k} ${v}`)).join(', ') || 'as built';
const fixed = (n, seeds, d = 2) => (n / seeds).toFixed(d);

function rowOf(cell, t, ms) {
  const s = t.seeds;
  return `| ${cell.name} | ${cell.line} | ${KITS(cell.kit)} | ${cell.pace} | ${t.wins}/${s} | ${t.defeats} | ${t.caps} | ${fixed(t.kos, s)} | ${fixed(t.seconds, s, 1)} | ${fixed(t.foeLeft * 100, s, 1)} % | ${fixed(t.headsDown, s)} | ${fixed(t.commands, s)} / ${fixed(t.commandsClean, s)} | ${fixed(t.miracles, s)} | ${fixed(t.drinks, s)} | ${fixed(t.stoned, s)} |${ms === undefined ? '' : ` ${(ms / 1000).toFixed(0)} s |`}`;
}

const HEAD =
  '| cell | line | kit | pace | wins | defeats | cap | girl KOs a fight | seconds a fight | foe HP left | heads down | Commands cast / left every girl standing | Miracle Drinks | Hero Drinks | stoned |\n|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|';

if (args.has('--table')) {
  const dir = args.get('--table');
  const lines = [HEAD];
  for (const cell of CELLS) {
    const file = path.join(dir, `${cell.name.replaceAll('/', '__')}.json`);
    if (!fs.existsSync(file)) continue;
    const r = JSON.parse(fs.readFileSync(file, 'utf8'));
    lines.push(rowOf(cell, r.tally));
  }
  console.log(lines.join('\n'));
  process.exit(0);
}

let chosen = CELLS;
if (args.has('--cells')) {
  const names = args.get('--cells').split(',');
  chosen = names.map((n) => CELLS.find((c) => c.name === n) ?? (() => { throw new Error(`no cell ${n}`); })());
} else if (args.get('--group') && args.get('--group') !== 'all') chosen = CELLS.filter((c) => c.group === args.get('--group'));
if (args.has('--act')) chosen = chosen.filter((c) => c.act === Number(args.get('--act')));
if (args.has('--shard')) {
  const [i, n] = args.get('--shard').split('/').map(Number);
  chosen = chosen.filter((_, k) => k % n === i);
}
const out = args.get('--out');
if (out) fs.mkdirSync(out, { recursive: true });
const t0 = Date.now();
console.log(HEAD.replace('| stoned |\n', '| stoned | time |\n').replace(/---:\|$/, '---:|---:|'));
for (const cell of chosen) {
  const started = Date.now();
  const seeds = args.has('--seeds') ? Number(args.get('--seeds')) : cell.seeds;
  const tally = runCell(args.has('--continuation') ? { ...cell, continuation: true } : cell, seeds);
  const ms = Date.now() - started;
  console.log(rowOf(cell, tally, ms));
  if (out) fs.writeFileSync(path.join(out, `${cell.name.replaceAll('/', '__')}.json`), JSON.stringify({ name: cell.name, seeds, tally, ms }, null, 1));
}
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(0)} s)`);
