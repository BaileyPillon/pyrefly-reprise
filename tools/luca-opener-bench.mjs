#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Luca Opener chapter (FFX-2 only): plays both links on the real engine with the lines of `tests/unit/helpers/lucaOpenerDrive.ts` (the same harness
 * `tests/unit/chapters/luca-opener-bench.test.ts` pins, so what is printed is what is tested) and prints the table that `docs/handoff/ch-luca-opener.md` carries.
 * **No boss row is ever touched**: a line is a test input standing in for a player, the party is the chapter's own estimate (Lv 2 / 2 / 3) with the Chapter 2 and Chateau presets as the harder what-ifs.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/luca-opener-bench.mjs [--seeds 200] [--from 1] [--lines advisor,naive,ormiFirst]
 *
 *   --seeds  chapter runs a cell plays (seeds from to from + N - 1)
 *
 * It prints one markdown row per cell and a JSON line per row. A machine that is busy takes about 0.1 to 0.3 seconds a run.
 */

import { atLevels, driveLuca, templatesAt } from '../tests/unit/helpers/lucaOpenerDrive.ts';
import { bevelleBuild } from '../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../src/data/ffx2/builds/chateau.ts';
import { lucaOpenerBuild } from '../src/data/ffx2/builds/luca-opener.ts';

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
const LINES = (args.get('--lines') ?? 'advisor,naive,ormiFirst').split(',');
const PACES = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
  ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
];

const CELLS = [
  ['shipped Lv 2 / 2 / 3', {}],
  ['Lv 1 / 1 / 1', templatesAt([1, 1, 1])],
  ['Lv 4 / 4 / 4', templatesAt([4, 4, 4])],
  ['Lv 6 / 6 / 6', templatesAt([6, 6, 6])],
  ['Chateau preset (20 / 21 / 22), no Songstress hold', { build: structuredClone(chateauBuild), songstress: structuredClone(chateauBuild) }],
  ['Chapter 2 preset (23 / 24 / 25), no Songstress hold', { build: structuredClone(bevelleBuild), songstress: structuredClone(bevelleBuild) }],
];

console.log('| party | line | pace | seeds | runs won | link 1 won | link 2 won | minutes | girl KOs | HP lost | Potions thrown | steals | longest (their actions) |');
console.log('|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const [name, build] of CELLS) {
  for (const line of LINES) {
    for (const [pace, paceOpts] of PACES) {
      if (name !== CELLS[0][0] && pace !== PACES[0][0]) continue; // the presets and the other levels run at bench speed only
      const t = { seeds: SEEDS, run: 0, l1: 0, l2: 0, minutes: 0, kos: 0, hp: 0, potions: 0, steals: 0, longest: 0, unfinished: 0 };
      for (let seed = FROM; seed < FROM + SEEDS; seed++) {
        const r = driveLuca(line, seed, { ...paceOpts, ...build });
        if (r.outcome === undefined) t.unfinished++;
        if (r.won >= 1) t.l1++;
        if (r.won >= 2) t.l2++;
        if (r.won >= 2 && r.outcome === 'victory') t.run++;
        t.minutes += r.ticks / 29.97 / 60;
        t.kos += r.kos;
        t.hp += r.damageTaken;
        t.potions += r.moves['x2-luca-logos-potion'] ?? 0;
        t.steals += r.steals;
        t.longest = Math.max(t.longest, r.order.length);
      }
      const f = (n) => (n / SEEDS).toFixed(2);
      console.log(`| ${name} | ${line} | ${pace} | ${SEEDS} | ${t.run} | ${t.l1} | ${t.l2} | ${f(t.minutes)} | ${f(t.kos)} | ${Math.round(t.hp / SEEDS)} | ${f(t.potions)} | ${f(t.steals)} | ${t.longest} |`);
      console.log(JSON.stringify({ party: name, line, pace, ...t }));
    }
  }
}

void atLevels;
void lucaOpenerBuild;
