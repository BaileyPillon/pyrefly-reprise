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
 *   --act2     play ONLY Act II alone, the three tiers (nagi05_70 to _72), one row a tier, for the lines asked (the driver's first order after RE's follow-up: Act II does not need the Act I answer)
 *   --ablate   the advisor's line with one rule taken away at a time, on the first of --cells (`all` or a comma list of: shield-on-full, heal-45, no-auto-life, no-cheer, story-aeons-first, items-only, no-pay, no-yojimbo)
 *   --lines    any of `advisor` (the shipped line: Yojimbo paid), `careless`, `nopay` (Yojimbo sent in first but never paid: **Pay off**, his own free attacks only) and `noyojimbo` (he is never sent in), comma-separated;
 *              default `advisor,careless`. **Pay on is provisional until RE's Zanmato fix lands** (a Pay can roll a Zanmato that today kills a Dark Aeon the game's rules would not), so Act II is read with `nopay` beside `advisor`.
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

/** The lines a table can ask for. */
const LINES = {
  advisor: advisorLine,
  careless: carelessLine,
  nopay: ablatedLine('no-pay'),
  noyojimbo: ablatedLine('no-yojimbo'),
};
for (const line of lines) if (LINES[line] === undefined) throw new Error(`no line '${line}' (advisor, careless, nopay, noyojimbo)`);

const chains = args.has('--cells')
  ? args.get('--cells').split(',').map((c) => c.split(':'))
  : ACT_I_CELLS.flatMap((a) => ACT_II_CELLS.map((b) => [a, b]));

const pct = (r) => `${(100 * share(r)).toFixed(0)}%`;
if (args.has('--act2')) {
  console.log(`# Act II alone (the three Dark Yojimbo tiers), Phoenix Downs ${phoenix}${luck !== undefined ? `, Luck ${luck}` : ''}${stat !== undefined ? `, stats x${stat}` : ''}, ${seeds} seeds a line`);
  console.log(`| Act II tier | ${lines.join(' | ')} |\n|---|${lines.map(() => '---').join('|')}|`);
  for (const tier of ACT_II_CELLS) {
    const row = {};
    for (const line of lines) row[line] = rateOf(seeds, tier, null, LINES[line], party);
    console.log(`| ${tier} | ${lines.map((l) => `${pct(row[l])} (${row[l].wins}/${row[l].seeds}${row[l].unfinished > 0 ? `, UNFINISHED ${row[l].unfinished}` : ''})`).join(' | ')} |`);
    console.log(JSON.stringify({ phoenix, luck: luck ?? null, stat: stat ?? null, seeds, act: tier, ...row }));
  }
  process.exit(0);
}
const detail = (r) => `${r.wins}/${r.seeds}${r.lostFirst + r.lostSecond > 0 ? ` (lost in I ${r.lostFirst}, in II ${r.lostSecond})` : ''}${r.unfinished > 0 ? ` UNFINISHED ${r.unfinished}` : ''}`;
const cell = (r) => (r ? `${pct(r)} ${detail(r)}` : '-');
const head = (what) => `| ${what} | ${lines.join(' | ')} |\n|---|${lines.map(() => '---').join('|')}|`;

console.log(`# Phoenix Downs ${phoenix}${luck !== undefined ? `, Luck ${luck}` : ''}${stat !== undefined ? `, stats x${stat}` : ''}, ${seeds} seeds a line`);
console.log(head('Act I then Act II (the whole chapter)'));
for (const [actI, actII] of chains) {
  const row = {};
  for (const line of lines) row[line] = rateOf(seeds, actI, actII, LINES[line], party);
  console.log(`| ${actI} then ${actII} | ${lines.map((l) => cell(row[l])).join(' | ')} |`);
  console.log(JSON.stringify({ phoenix, luck: luck ?? null, stat: stat ?? null, seeds, actI, actII, ...row }));
}

if (withActs) {
  console.log(`\n${head('Act alone')}`);
  for (const cellName of [...new Set(chains.flat())]) {
    const row = {};
    for (const line of lines) row[line] = rateOf(seeds, cellName, null, LINES[line], party);
    console.log(`| ${cellName} | ${lines.map((l) => cell(row[l])).join(' | ')} |`);
    console.log(JSON.stringify({ phoenix, luck: luck ?? null, stat: stat ?? null, seeds, act: cellName, ...row }));
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
