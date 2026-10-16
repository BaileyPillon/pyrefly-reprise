#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Mirror Aeons chapter (FFX only): plays the chapter's cells on the real engine with the advisor's line and a careless one and prints the table that
 * `docs/plans/ch-mirror-aeons-bench.md` carries. The harness is `tests/unit/helpers/mirrorAeonsBench.ts` (the same one `tests/unit/chapters/mirror-aeons-bench.test.ts` pins), so what is printed is what is tested.
 * **No boss row is ever touched**: a cell is a choice among the game's own formations, a preset is the party's own estimate.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/mirror-aeons-bench.mjs [--seeds 100] [--phoenix 17] [--cells kino01_72:nagi05_71,kino00_70:nagi05_70] [--acts] [--luck 60] [--lines advisor,careless]
 *
 *   --seeds    fights a line plays in a cell (seeds 1 to N); the committed table used 100 or more
 *   --phoenix  Phoenix Downs in the bag (the main lever; the chapter ships `ENDGAME_PHOENIX_DOWNS`)
 *   --luck     every member's Luck (a lever the bench measured; the chapter ships 60)
 *   --stat     Strength, Defense, Magic and Magic Defense at this fraction of the caps (the chapter ships 1)
 *   --cells    `actI:actII` chains to play (default: the three Act I cells against the three Act II tiers)
 *   --acts     also play each act alone (Act I from the fresh preset; Act II from the fresh preset, no carry)
 *   --ablate   the advisor's line with one rule taken away at a time, on the first of --cells (`all` or a comma list of: shield-on-full, heal-45, no-auto-life, no-cheer, story-aeons-first, items-only)
 *   --lines    `advisor`, `careless` or both (default both)
 *
 * It prints one markdown row per cell and a JSON line per row for the document's builder. A machine that is busy takes about 0.1 to 0.2 seconds a fight.
 */

import {
  ACT_I_CELLS,
  ABLATIONS,
  ACT_II_CELLS,
  ablatedLine,
  advisorLine,
  carelessLine,
  rateOf,
  share,
  withLuck,
  withPhoenixDowns,
  withStatFraction,
} from '../tests/unit/helpers/mirrorAeonsBench.ts';
import { ENDGAME_PHOENIX_DOWNS, mirrorAeonsBuild } from '../src/data/ffx/builds/mirror-aeons.ts';

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

const seeds = Number(args.get('--seeds') ?? 100);
const phoenix = Number(args.get('--phoenix') ?? ENDGAME_PHOENIX_DOWNS);
const luck = args.has('--luck') ? Number(args.get('--luck')) : undefined;
const stat = args.has('--stat') ? Number(args.get('--stat')) : undefined;
const lines = (args.get('--lines') ?? 'advisor,careless').split(',');
const withActs = args.has('--acts');
let party = withPhoenixDowns(mirrorAeonsBuild, phoenix);
if (luck !== undefined) party = withLuck(party, luck);
if (stat !== undefined) party = withStatFraction(party, stat);

const chains = args.has('--cells')
  ? args.get('--cells').split(',').map((c) => c.split(':'))
  : ACT_I_CELLS.flatMap((a) => ACT_II_CELLS.map((b) => [a, b]));

const pct = (r) => `${(100 * share(r)).toFixed(0)}%`;
const detail = (r) => `${r.wins}/${r.seeds}${r.lostFirst + r.lostSecond > 0 ? ` (lost in I ${r.lostFirst}, in II ${r.lostSecond})` : ''}${r.unfinished > 0 ? ` UNFINISHED ${r.unfinished}` : ''}`;

console.log(`# Phoenix Downs ${phoenix}${luck !== undefined ? `, Luck ${luck}` : ''}${stat !== undefined ? `, stats x${stat}` : ''}, ${seeds} seeds a line`);
console.log('| Act I | Act II | advisor (whole chapter) | careless (whole chapter) |');
console.log('|---|---|---|---|');
for (const [actI, actII] of chains) {
  const row = {};
  for (const line of lines) row[line] = rateOf(seeds, actI, actII, line === 'advisor' ? advisorLine : carelessLine, party);
  console.log(`| ${actI} | ${actII} | ${row.advisor ? `${pct(row.advisor)} ${detail(row.advisor)}` : '-'} | ${row.careless ? `${pct(row.careless)} ${detail(row.careless)}` : '-'} |`);
  console.log(JSON.stringify({ phoenix, luck: luck ?? null, stat: stat ?? null, seeds, actI, actII, ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v])) }));
}

if (withActs) {
  console.log('\n| Act alone | advisor | careless |');
  console.log('|---|---|---|');
  for (const cell of [...new Set(chains.flat())]) {
    const row = {};
    for (const line of lines) row[line] = rateOf(seeds, cell, null, line === 'advisor' ? advisorLine : carelessLine, party);
    console.log(`| ${cell} | ${row.advisor ? `${pct(row.advisor)} ${detail(row.advisor)}` : '-'} | ${row.careless ? `${pct(row.careless)} ${detail(row.careless)}` : '-'} |`);
    console.log(JSON.stringify({ phoenix, luck: luck ?? null, stat: stat ?? null, seeds, act: cell, ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v])) }));
  }
}

if (args.has('--ablate')) {
  const asked = args.get('--ablate') === 'true' || args.get('--ablate') === 'all' ? Object.keys(ABLATIONS) : args.get('--ablate').split(',');
  const [actI, actII] = chains[0];
  console.log(`
| the line, ${actI} then ${actII} | whole chapter |`);
  console.log('|---|---|');
  for (const name of ['(shipped)', ...asked]) {
    const r = rateOf(seeds, actI, actII, name === '(shipped)' ? advisorLine : ablatedLine(name), party);
    console.log(`| ${name} | ${pct(r)} ${detail(r)} |`);
    console.log(JSON.stringify({ phoenix, seeds, actI, actII, ablation: name, advisor: r }));
  }
}
