#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Oblitzerator chapter (FFX only): plays the one fight on the real engine with scripted players (no god mode) and prints the table that `docs/handoff/ch-oblitzerator.md` carries. It uses
 * `tests/unit/helpers/oblitzeratorBot.ts` (the same one `tests/unit/chapters/oblitzerator-bench.test.ts` pins), so what is printed is what the test measures. **No boss number is ever touched**: a line is a plan of
 * commands, the levers are the build fraction and the bag.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/oblitzerator-bench.mjs [--seeds 200] [--from 1] [--stop 3] [--lines crane,slog] [--tactic]
 *
 *   --seeds   fights a line plays (seeds FROM to FROM + N - 1); the committed table used 200
 *   --from    the first seed (default 1)
 *   --stop    the build's stop on the road, of ten (3 is the shipped Luca build; 0 is the raw start records, the lower bound)
 *   --lines   any of careless, naive, slog, crane, crane-no-care, crane-no-haste, wrong-spells, no-thunder (comma-separated); default all
 *   --tactic  also play the line the game ships (`src/engine/tactics/oblitzerator.ts`) through the generic ladder, the way the card and the auto-battler do
 *
 * It prints one markdown row per line and a JSON line per row. A machine that is not busy takes a few hundredths of a second a fight.
 */

import { LINES, bench, benchTactic, winRate } from '../tests/unit/helpers/oblitzeratorBot.ts';
import { lucaBuildAt } from '../src/data/ffx/builds/luca.ts';

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
const stop = Number(args.get('--stop') ?? 3);
const names = (args.get('--lines') ?? Object.keys(LINES).join(',')).split(',');
const party = lucaBuildAt(stop);

console.log(`Luca build at stop ${stop} of 10; seeds ${from} to ${from + seeds - 1}; no god mode.\n`);
console.log('| Line | Wins | Win rate | Defeats | Stalled | Decisions (median) | Rushes a fight | Balls a fight | KOs a fight | Oblitzerator HP at the end (median) |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const mean = (xs) => (xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)).toFixed(2);
const rows = names.map((name) => {
  const line = LINES[name];
  if (!line) throw new Error(`no line ${name}`);
  return [name, bench(line, seeds, party, from)];
});
if (args.has('--tactic')) rows.push(['tactic (the shipped line)', benchTactic(seeds, party, from)]);
for (const [name, runs] of rows) {
  const wins = runs.filter((r) => r.outcome === 'victory').length;
  const defeats = runs.filter((r) => r.outcome === 'defeat').length;
  const stalled = runs.filter((r) => r.outcome === 'stalled').length;
  console.log(`| ${name} | ${wins} / ${runs.length} | ${winRate(runs)}% | ${defeats} | ${stalled} | ${median(runs.map((r) => r.decisions))} | ${mean(runs.map((r) => r.rushes))} | ${mean(runs.map((r) => r.balls))} | ${mean(runs.map((r) => r.koCount))} | ${median(runs.map((r) => r.hp))} |`);
  console.log(JSON.stringify({ stop, line: name, seeds, from, wins, defeats, stalled, winRate: winRate(runs) }));
}
