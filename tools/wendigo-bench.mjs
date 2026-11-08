#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Wendigo chapter (FFX only): plays the one fight on the real engine with scripted players (no god mode) and prints the table that `docs/handoff/ch-wendigo.md` carries. The harness is
 * `tests/unit/helpers/wendigoBot.ts` (the same one `tests/unit/chapters/wendigo-bench.test.ts` pins), so what is printed is what the test measures. **No boss number is ever touched**: a line is a plan among the party's own
 * commands, the levers are the front line and the bag.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/wendigo-bench.mjs [--seeds 200] [--front tidus,yuna,rikku] [--lines advisor,careless] [--tactic]
 *
 *   --seeds   fights a line plays (seeds 1 to N); the committed table used 200
 *   --front   the three in front (the preflight's CW3: tidus,yuna,rikku or tidus,auron,rikku; the chapter ships the first)
 *   --lines   any of careless, plain, advisor, no-petrify, no-steal, no-power-break, no-blind, no-protect, no-stance, front-line-only, aeon (comma-separated); default all
 *   --tactic  also play the line the game ships (`src/engine/tactics/wendigo.ts`) through the generic ladder, the way the card and the auto-battler do
 *
 * It prints one markdown row per line and a JSON line per row. A machine that is not busy takes a few hundredths of a second a fight.
 */

import { LINES, bench, benchTactic, buildWith, winRate } from '../tests/unit/helpers/wendigoBot.ts';

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
const front = (args.get('--front') ?? 'tidus,yuna,rikku').split(',');
const names = (args.get('--lines') ?? Object.keys(LINES).join(',')).split(',');
const party = buildWith(front);

console.log(`Front line ${front.join(', ')}; seeds 1 to ${seeds}; no god mode.\n`);
console.log('| Line | Wins | Win rate | Defeats | Stalled | Wendigo HP at the end (median) | Lowest it reached (median) | Ticks (median) | Wendigo turns a fight | KOs a fight (median) |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const rows = names.map((name) => {
  const line = LINES[name];
  if (!line) throw new Error(`no line ${name}`);
  return [name, bench(line, seeds, party)];
});
if (args.has('--tactic')) rows.push(['tactic (the shipped line)', benchTactic(seeds, party)]);
for (const [name, runs] of rows) {
  const wins = runs.filter((r) => r.outcome === 'victory').length;
  const defeats = runs.filter((r) => r.outcome === 'defeat').length;
  const stalled = runs.filter((r) => r.outcome === 'stalled').length;
  const turns = (runs.reduce((a, r) => a + Object.values(r.wendigoActs).reduce((x, y) => x + y, 0), 0) / runs.length).toFixed(1);
  console.log(`| ${name} | ${wins} / ${runs.length} | ${winRate(runs)}% | ${defeats} | ${stalled} | ${median(runs.map((r) => r.hp))} | ${median(runs.map((r) => r.lowestHp))} | ${median(runs.map((r) => r.ticks))} | ${turns} | ${median(runs.map((r) => r.koCount))} |`);
  console.log(JSON.stringify({ front, line: name, seeds, wins, defeats, stalled, winRate: winRate(runs) }));
}
