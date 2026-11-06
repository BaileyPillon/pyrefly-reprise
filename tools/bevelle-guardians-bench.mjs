#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Bevelle Guardians chapter (FFX-2 only): plays each act on the real engine with the lines of `tests/unit/helpers/bevelleGuardiansDrive.ts` (the same harness
 * `tests/unit/chapters/bevelle-guardians-bench.test.ts` pins, so what is printed is what is tested) and prints the table that `docs/handoff/ch-bevelle-guardians.md` carries.
 * **No boss row is ever touched**: a line is a test input standing in for a player, the party is the Bahamut chapter's own estimate.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/bevelle-guardians-bench.mjs [--seeds 100] [--acts 0,1,2] [--lines careful,counter] [--from 1]
 *
 *   --seeds  fights a line plays in an act (seeds from to from + N - 1); the committed table used 100 or more
 *   --acts   0 = Georapella, 1 = the Precepts Guard, 2 = Baralai
 *   --lines  any of defend, attack, careful, counter, change, changeCount (comma-separated); default: every line that applies to the act
 *
 * It prints one markdown row per act and line, and a JSON line per row for the document's builder. A machine that is busy takes about 0.1 to 0.3 seconds a fight.
 */

import { fight } from '../tests/unit/helpers/bevelleGuardiansDrive.ts';

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

const SEEDS = Number(args.get('--seeds') ?? 100);
const FROM = Number(args.get('--from') ?? 1);
const ACTS = (args.get('--acts') ?? '0,1,2').split(',').map(Number);
const NAMES = ['Georapella (floor 3)', 'Precepts Guard (floor 3)', 'Baralai (floor 7)'];
const DEFAULT_LINES = { 0: ['defend', 'attack', 'careful'], 1: ['defend', 'attack', 'careful', 'change'], 2: ['defend', 'attack', 'careful', 'counter', 'change', 'changeCount'] };

console.log('| Act | Line | Seeds | Wins | Defeats | Unresolved | Girl KOs a fight | Minutes a fight | Drill Shots a fight | on Yuna / Rikku / Paine |');
console.log('|---|---|---:|---:|---:|---:|---:|---:|---:|---|');
for (const act of ACTS) {
  const lines = (args.has('--lines') ? args.get('--lines').split(',') : DEFAULT_LINES[act]).filter((l) => (l !== 'counter' && l !== 'changeCount') || act === 2); // the counting line is about Baralai's count alone
  for (const line of lines) {
    let wins = 0;
    let defeats = 0;
    let unresolved = 0;
    let kos = 0;
    let minutes = 0;
    let shots = 0;
    const on = { yuna: 0, rikku: 0, paine: 0 };
    for (let seed = FROM; seed < FROM + SEEDS; seed++) {
      const r = fight(act, seed, line, { maxDecisions: 60_000 });
      if (r.outcome === 'victory') wins++;
      else if (r.outcome === 'defeat') defeats++;
      else unresolved++;
      kos += r.kos;
      minutes += r.ticks / 29.97 / 60;
      shots += r.drillShots.length;
      for (const who of r.drillShots) if (who in on) on[who]++;
    }
    const row = { act, line, seeds: SEEDS, wins, defeats, unresolved, kosPerFight: +(kos / SEEDS).toFixed(2), minutesPerFight: +(minutes / SEEDS).toFixed(2), drillShotsPerFight: +(shots / SEEDS).toFixed(2), drillOn: on };
    console.log(`| ${NAMES[act]} | ${line} | ${SEEDS} | ${wins} | ${defeats} | ${unresolved} | ${row.kosPerFight} | ${row.minutesPerFight} | ${row.drillShotsPerFight} | ${on.yuna} / ${on.rikku} / ${on.paine} |`);
    console.log(JSON.stringify(row));
  }
}
