#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Spherimorph chapter (FFX only): plays the one fight on the real engine with scripted players (no god mode) and prints the table that `docs/handoff/ch-spherimorph.md` carries. The
 * harness is `tests/unit/helpers/spherimorphBot.ts` (the same one `tests/unit/chapters/spherimorph-bench.test.ts` pins), so what is printed is what is tested. **No boss number is ever touched**: a line is a plan among
 * the party's own commands, a lever is the party's own preset (the front line).
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/spherimorph-bench.mjs [--seeds 200] [--from 1] [--front tidus,yuna,lulu] [--lines advisor,blind] [--bag woods|temple]
 *
 *   --seeds   fights a line plays; the committed table used 200
 *   --from    the first seed (1 by default; other blocks of seeds show the spread)
 *   --front   the three in front (the preflight's SP2: tidus,yuna,lulu or tidus,auron,lulu)
 *   --lines   any of careless, blind, advisor, no-reprobe, no-care, no-protect, poison, poison-no-care, brute (comma-separated); default all
 *   --bag     woods (the shipped bag, no Poison Fangs; the default) or temple (the Macalania Temple's bag as it is, with its two Poison Fangs: what the bag lever is measured against)
 *
 * It prints one markdown row per line and a JSON line per row. A machine that is not busy takes about 0.03 seconds a fight.
 */

import { LINES, play } from '../tests/unit/helpers/spherimorphBot.ts';

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

const seeds = Number(args.get('--seeds') ?? 200);
const from = Number(args.get('--from') ?? 1);
const front = (args.get('--front') ?? 'tidus,yuna,lulu').split(',');
const bag = args.get('--bag') ?? 'woods';
const names = (args.get('--lines') ?? Object.keys(LINES).join(',')).split(',');

console.log(`Front line ${front.join(', ')}; bag ${bag}; seeds ${from} to ${from + seeds - 1}; no god mode.\n`);
console.log('| Line | Wins | Win rate | Defeats | Stalled | Decisions (median) | Shifts a fight | Spells it took in a fight | KOs a fight |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
for (const name of names) {
  if (!LINES[name]) throw new Error(`no line ${name}`);
  const runs = [];
  for (let seed = from; seed < from + seeds; seed++) runs.push(play(seed, name, front, 4_000, bag));
  const wins = runs.filter((r) => r.outcome === 'victory').length;
  const defeats = runs.filter((r) => r.outcome === 'defeat').length;
  const stalled = runs.filter((r) => r.outcome === 'stalled').length;
  const mean = (f) => (runs.reduce((a, r) => a + f(r), 0) / runs.length).toFixed(2);
  const rate = ((wins / runs.length) * 100).toFixed(1);
  console.log(`| ${name} | ${wins} / ${runs.length} | ${rate}% | ${defeats} | ${stalled} | ${median(runs.map((r) => r.decisions))} | ${mean((r) => r.shifts)} | ${mean((r) => r.absorbed)} | ${mean((r) => r.koCount)} |`);
  console.log(JSON.stringify({ front, bag, line: name, from, seeds, wins, defeats, stalled, winRate: Number(rate) }));
}
