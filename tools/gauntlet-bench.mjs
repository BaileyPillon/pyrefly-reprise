#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Gauntlet chapter (FFX only; chapter 54): plays the chapter's acts on the real engine with the advisor's line, a careless one and the ablations, and prints the table that
 * `docs/handoff/ch-gauntlet.md` carries. The harness is `tests/unit/helpers/gauntletBench.ts` (the same one `tests/unit/chapters/gauntlet-bench.test.ts` pins), so what is printed is what is tested.
 * **No boss row is ever touched**: a cell is a choice of line or of the party's own estimates. Made from `tools/dark-aeons-bench.mjs`.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/gauntlet-bench.mjs [--seeds 100] [--acts cactuar-king,don-tonberry,jormungand] [--lines advisor,careless,no-zanmato]
 *                                                                [--chain] [--phoenix 17] [--luck 60] [--evasion 255] [--stat 1] [--gil 1500000] [--kills 500] [--yojimbo-gauge 0] [--lineup tidus+yuna+auron]
 *
 *   --seeds          fights a line plays in a cell (seeds 1 to N); the committed table used 100
 *   --tier           1, 2 or 3: play that tier's acts alone, and (with --chain) that tier's acts chained; default every act built
 *   --chain-acts     the acts of the chain, comma-separated (default: the tier's, else every act built)
 *   --deathproof     put Deathproof on every armour in place of one of its abilities (auto-protect, ribbon, auto-haste, auto-phoenix): the Death ward lever
 *   --acts           the acts to play alone, each from the fresh preset (default: every act whose rules are built)
 *   --lines          `advisor` (the shipped line), `careless` (the plain Attack on the foe, no aeon, no potion), or any ablation of the harness joined with `+`: no-zanmato, zanmato-all (Yojimbo against every act), no-fodder, no-wait, no-overdrives,
 *                    no-quick-hit, pay-10k, pay-1m, heal-45, heal-75, and the tier-2 rules: zanmato-t1, zanmato-t2, sphere-fodder (an aeon as the shield against the Greater Sphere), eater-fodder, sphere-od (Overdrives allowed against the Greater Sphere),
 *                    no-eater-focus (everyone strikes the standing Earth Eater), eater-wait (nobody strikes it while it lies down)
 *   --chain          also play the whole chapter (the acts built, chained, the carry between them) for each line, with the act the first loss came at tallied
 *   --phoenix, --luck, --evasion, --stat, --gil, --kills, --yojimbo-gauge, --lineup   the party levers (the chapter ships 17, 60, 255, 1, 1,500,000, 500, 0 and tidus+yuna+auron)
 *
 * It prints one markdown row per cell and a JSON line per row. "Got away" counts the Cactuar King leaving (preflight GA9: the act is retried).
 */

import {
  BUILT, ablatedLine, actRate, advisorLine, carelessLine, chainRate, share, tierActs, withAeonGauge, withDeathproof, withEvasion, withGil, withKills, withLineUp, withLuck, withPhoenixDowns, withStatFraction,
} from '../tests/unit/helpers/gauntletBench.ts';
import { gauntletBuild } from '../src/data/ffx/builds/gauntlet.ts';

const args = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const next = argv[i + 1];
  if (next === undefined || next.startsWith('--')) args.set(argv[i], true);
  else args.set(argv[i], next), i++;
}
const num = (name, fallback) => (args.has(name) ? Number(args.get(name)) : fallback);
const seeds = num('--seeds', 100);
const tier = args.has('--tier') ? Number(args.get('--tier')) : 0;
const acts = (args.get('--acts') ?? (tier > 0 ? tierActs(tier) : BUILT).join(',')).split(',');
// The acts of the chain: the tier's alone (--tier 2: Earth Eater, Greater Sphere, Catastrophe, each entered with the carry of the one before), an explicit list (--chain-acts a,b,c) or every act built.
const chainActs = args.has('--chain-acts') ? String(args.get('--chain-acts')).split(',') : tier > 0 ? [...tierActs(tier)] : [...BUILT];
const lineNames = (args.get('--lines') ?? 'advisor,careless').split(',');

let party = gauntletBuild;
if (args.has('--phoenix')) party = withPhoenixDowns(party, num('--phoenix', 17));
if (args.has('--luck')) party = withLuck(party, num('--luck', 60));
if (args.has('--evasion')) party = withEvasion(party, num('--evasion', 255));
if (args.has('--stat')) party = withStatFraction(party, num('--stat', 1));
if (args.has('--gil')) party = withGil(party, num('--gil', 1_500_000));
if (args.has('--kills')) party = withKills(party, num('--kills', 500));
if (args.has('--yojimbo-gauge')) party = withAeonGauge(party, 'yojimbo', num('--yojimbo-gauge', 0));
if (args.has('--lineup')) party = withLineUp(party, String(args.get('--lineup')).split('+'));
if (args.has('--deathproof')) party = withDeathproof(party, String(args.get('--deathproof')));

const lineOf = (name) => (name === 'advisor' ? advisorLine : name === 'careless' ? carelessLine : ablatedLine(...name.split('+')));
const pct = (r) => `${Math.round(100 * share(r))}`;

console.log(`| act | line | wins of ${seeds} | percent | lost | got away | unfinished |`);
console.log('|---|---|---:|---:|---:|---:|---:|');
for (const key of acts) {
  for (const name of lineNames) {
    const r = actRate(seeds, key, lineOf(name), party);
    console.log(`| ${key} | ${name} | ${r.wins} | ${pct(r)} | ${r.losses} | ${r.escapes} | ${r.unfinished} |`);
    console.log(JSON.stringify({ kind: 'act', key, line: name, seeds, wins: r.wins, losses: r.losses, escapes: r.escapes, unfinished: r.unfinished }));
  }
}
if (args.has('--chain')) {
  console.log(`\n| chain of ${chainActs.length} acts (${chainActs.join(', ')}) | line | wins of ${seeds} | percent | first loss or departure at act 1 to ${chainActs.length} |`);
  console.log('|---|---|---:|---:|---|');
  for (const name of lineNames) {
    const r = chainRate(seeds, lineOf(name), party, 1, chainActs);
    console.log(`| chain | ${name} | ${r.wins} | ${pct(r)} | ${r.lostAt.slice(1).join(' / ')} |`);
    console.log(JSON.stringify({ kind: 'chain', acts: chainActs, line: name, seeds, wins: r.wins, losses: r.losses, escapes: r.escapes, unfinished: r.unfinished, lostAt: r.lostAt.slice(1) }));
  }
}
