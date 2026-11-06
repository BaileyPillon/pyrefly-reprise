#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Sanctuary Keeper chapter (FFX only): plays the one fight on the real engine with scripted players (no god mode) and prints the table that
 * `docs/handoff/ch-sanctuary-keeper.md` carries. The harness is `tests/unit/helpers/sanctuaryBot.ts` (the same one `tests/unit/chapters/sanctuary-keeper-bench.test.ts` pins), so what is printed is what is tested.
 * **No boss number is ever touched**: a line is a plan among the party's own commands, a lever is the party's own estimate (Luck, the bag, the front line).
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/sanctuary-keeper-bench.mjs [--seeds 200] [--front tidus,yuna,lulu] [--lines advisor,careless] [--luck 18] [--bag echo-screen=30,remedy=10]
 *
 *   --seeds   fights a line plays (seeds 1 to N); the committed table used 200
 *   --front   the three in front (the preflight's SK2: tidus,yuna,lulu or tidus,yuna,auron)
 *   --lines   any of careless, plain, advisor, no-reflect, no-poison, no-shell, no-haste, no-dispel (comma-separated); default all
 *   --luck    every member's Luck (a lever; the preset's cells are 13 to 18)
 *   --bag     item=count pairs that replace the bag's counts (the other lever)
 *
 * It prints one markdown row per line and a JSON line per row. A machine that is not busy takes about 0.03 seconds a fight.
 */

import { LINES, bench, buildWith, winRate, withBag, withLuck } from '../tests/unit/helpers/sanctuaryBot.ts';

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
const front = (args.get('--front') ?? 'tidus,yuna,lulu').split(',');
const names = (args.get('--lines') ?? Object.keys(LINES).join(',')).split(',');
let party = buildWith(front);
if (args.has('--luck')) party = withLuck(party, Number(args.get('--luck')));
if (args.has('--bag')) party = withBag(party, Object.fromEntries(args.get('--bag').split(',').map((p) => p.split('=')).map(([k, v]) => [k, Number(v)])));

console.log(`Front line ${front.join(', ')}; seeds 1 to ${seeds}; no god mode.\n`);
console.log('| Line | Wins | Win rate | Defeats | Stalled | Keeper HP at the end (median) | Lowest it reached (median) | Ticks (median) | Sweeps a fight | KOs a fight |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
for (const name of names) {
  const line = LINES[name];
  if (!line) throw new Error(`no line ${name}`);
  const runs = bench(line, seeds, party);
  const wins = runs.filter((r) => r.outcome === 'victory').length;
  const defeats = runs.filter((r) => r.outcome === 'defeat').length;
  const stalled = runs.filter((r) => r.outcome === 'stalled').length;
  const mean = (f) => (runs.reduce((a, r) => a + f(r), 0) / runs.length).toFixed(2);
  console.log(`| ${name} | ${wins} / ${runs.length} | ${winRate(runs)}% | ${defeats} | ${stalled} | ${median(runs.map((r) => r.hp))} | ${median(runs.map((r) => r.lowestHp))} | ${median(runs.map((r) => r.ticks))} | ${mean((r) => r.sweeps)} | ${mean((r) => r.koCount)} |`);
  console.log(JSON.stringify({ front, line: name, seeds, wins, defeats, stalled, winRate: winRate(runs) }));
}
