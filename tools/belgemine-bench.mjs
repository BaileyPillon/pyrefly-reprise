#!/usr/bin/env node
/**
 * The winnability bench of the hidden Belgemine's Challenge chapter (FFX only): plays each of the eight aeon duels, and the eight chained, on the real engine with the shipped tactic's line and a careless one, and prints the
 * table that `docs/handoff/ch-belgemine.md` carries. The harness is `tests/unit/helpers/belgemineDrive.ts` (the one `tests/unit/chapters/belgemine-bench.test.ts` pins), so what is printed is what is tested.
 * **No enemy row is ever touched**: a line is a plan among the party's own commands, a lever is the party preset (the tier, the aeons owned). Measure, never tune.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/belgemine-bench.mjs [--seeds 100] [--tier sin] [--tiers] [--lines advisor,careless] [--no-anima] [--grand off] [--target weakest]
 *
 *   --seeds   fights a line plays in a cell (seeds 1 to N); the committed table used 100
 *   --tier    the party preset: zanarkand, sin (the shipped one) or endgame
 *   --tiers   also print the chain on each of the three tiers
 *   --lines   any of `advisor` (the shipped line) and `careless` (only Attacks), comma-separated, default both
 *   --no-anima   the party without Anima (the Sisters are not beaten without her)
 *   --grand   `off` turns the Grand Summon off in the advisor's line
 *   --target  `weakest` sends the blow to the weakest Sister instead of Cindy
 *
 * It prints one markdown row per cell. A machine that is busy takes about 0.1 to 0.3 seconds a fight.
 */

import { belgemineBuildOf, BELGEMINE_TIER } from '../src/data/ffx/builds/belgemine.ts';
import { BELGEMINE_INTENDED_LINE } from '../src/engine/tactics/belgemine.ts';
import { ACT_KEYS, advisor, careless, rateOfChain, rateOfDuel, share, withoutAeons } from '../tests/unit/helpers/belgemineDrive.ts';

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
const tier = args.get('--tier') ?? BELGEMINE_TIER;
const lineNames = (args.get('--lines') ?? 'advisor,careless').split(',');
let party = belgemineBuildOf(tier);
if (args.has('--no-anima')) party = withoutAeons(party, ['anima']);
const line = { ...BELGEMINE_INTENDED_LINE };
if (args.get('--grand') === 'off') line.grandSummon = false;
if (args.get('--target') === 'weakest') line.sistersTarget = 'weakest';
const lines = { advisor: advisor(line), careless };

const t0 = Date.now();
console.log(`\nBelgemine's Challenge bench: tier ${tier}, ${seeds} seeds a cell\n`);
console.log(`| Duel | ${lineNames.join(' | ')} |`);
console.log(`|---|${lineNames.map(() => '---:').join('|')}|`);
for (const key of ACT_KEYS) {
  const cells = lineNames.map((n) => {
    const r = rateOfDuel(seeds, key, lines[n], party);
    return `${r.wins} / ${r.seeds} (KOs ${r.koMean.toFixed(1)}${r.unfinished ? `, ${r.unfinished} unfinished` : ''})`;
  });
  console.log(`| ${key} | ${cells.join(' | ')} |`);
}
const chain = lineNames.map((n) => {
  const r = rateOfChain(seeds, lines[n], party);
  const lost = r.lostIn.map((c, i) => (c > 0 ? `act ${i + 1}: ${c}` : '')).filter(Boolean).join(', ') || 'none';
  return `**${r.wins} / ${seeds}** (lost in ${lost})`;
});
console.log(`| **the chain** | ${chain.join(' | ')} |`);

if (args.has('--tiers')) {
  console.log('\n| Tier | ' + lineNames.join(' | ') + ' |\n|---|' + lineNames.map(() => '---:').join('|') + '|');
  for (const t of ['zanarkand', 'sin', 'endgame']) {
    const p = belgemineBuildOf(t);
    const cells = lineNames.map((n) => `${Math.round(share(rateOfChain(seeds, lines[n], p)) * 100)} %`);
    console.log(`| ${t} | ${cells.join(' | ')} |`);
  }
}
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
