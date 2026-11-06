#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Dark Aeons chapter (FFX only): plays the chapter's seven links on the real engine with the advisor's line, a careless one and the ablations, and prints the table that
 * `docs/handoff/ch-dark-aeons.md` carries. The harness is `tests/unit/helpers/darkAeonsBench.ts` (the same one `tests/unit/chapters/dark-aeons-bench.test.ts` pins), so what is printed is what is tested.
 * **No boss row is ever touched**: a cell is a choice of line or of the party's own estimates.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/dark-aeons-bench.mjs [--seeds 200] [--links valefor,ifrit,ixion-1,ixion-2,shiva,anima,bahamut] [--lines advisor,careless,no-zanmato]
 *                                                                  [--chain] [--phoenix 17] [--luck 60] [--evasion 255] [--stat 1] [--gil 1500000] [--yojimbo-gauge 0] [--lineup tidus+yuna+auron]
 *
 *   --seeds          fights a line plays in a cell (seeds 1 to N); the committed table used 200
 *   --links          the links to play alone, each from the fresh preset (default: all seven)
 *   --lines          `advisor` (the shipped line), `careless` (the plain Attack on the foe, no aeon, no potion), or any ablation of the harness joined with `+`: no-fodder, no-zanmato, zanmato-all, zanmato-late,
 *                    pay-10k, pay-1m, no-auto-life, no-overdrives, no-quick-hit, shield-early, shield-late, heal-45, heal-75
 *   --chain          also play the whole chapter (seven links chained, the carry between them) for each line, with the link the first loss came at tallied
 *   --phoenix, --luck, --evasion, --stat, --gil, --yojimbo-gauge, --lineup   the party levers (the chapter ships 17, 60, 255, 1, 1,500,000, 0 and tidus+yuna+auron)
 *
 * It prints one markdown row per cell and a JSON line per row. A machine that is busy takes about 0.1 to 1.5 seconds a fight (Dark Anima's is the longest).
 */

import { ablatedLine, advisorLine, carelessLine, chainRate, linkRate, share, withAeonGauge, withEvasion, withGil, withLineUp, withLuck, withPhoenixDowns, withStatFraction } from '../tests/unit/helpers/darkAeonsBench.ts';
import { darkAeonsBuild } from '../src/data/ffx/builds/dark-aeons.ts';
import { DARK_SIX_LINKS } from '../src/data/ffx/dark-aeons-six-ids.ts';

const args = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const next = argv[i + 1];
  if (next === undefined || next.startsWith('--')) args.set(argv[i], true);
  else args.set(argv[i], next), i++;
}
const num = (name, fallback) => (args.has(name) ? Number(args.get(name)) : fallback);
const seeds = num('--seeds', 200);
const links = (args.get('--links') ?? DARK_SIX_LINKS.map((l) => l.key).join(',')).split(',');
const lineNames = (args.get('--lines') ?? 'advisor,careless').split(',');

let party = darkAeonsBuild;
if (args.has('--phoenix')) party = withPhoenixDowns(party, num('--phoenix', 17));
if (args.has('--luck')) party = withLuck(party, num('--luck', 60));
if (args.has('--evasion')) party = withEvasion(party, num('--evasion', 255));
if (args.has('--stat')) party = withStatFraction(party, num('--stat', 1));
if (args.has('--gil')) party = withGil(party, num('--gil', 1_500_000));
if (args.has('--yojimbo-gauge')) party = withAeonGauge(party, 'yojimbo', num('--yojimbo-gauge', 0));
if (args.has('--lineup')) party = withLineUp(party, String(args.get('--lineup')).split('+'));

const lineOf = (name) => (name === 'advisor' ? advisorLine : name === 'careless' ? carelessLine : ablatedLine(...name.split('+')));
const pct = (r) => `${Math.round(100 * share(r))}`;

console.log(`| link | line | wins of ${seeds} | percent | unfinished |`);
console.log('|---|---|---:|---:|---:|');
for (const key of links) {
  for (const name of lineNames) {
    const r = linkRate(seeds, key, lineOf(name), party);
    console.log(`| ${key} | ${name} | ${r.wins} | ${pct(r)} | ${r.unfinished} |`);
    console.log(JSON.stringify({ kind: 'link', key, line: name, seeds, wins: r.wins, losses: r.losses, unfinished: r.unfinished }));
  }
}
if (args.has('--chain')) {
  console.log(`\n| whole chapter | line | wins of ${seeds} | percent | first loss at link 1 to 7 |`);
  console.log('|---|---|---:|---:|---|');
  for (const name of lineNames) {
    const r = chainRate(seeds, lineOf(name), party);
    console.log(`| chain | ${name} | ${r.wins} | ${pct(r)} | ${r.lostAt.slice(1).join(' / ')} |`);
    console.log(JSON.stringify({ kind: 'chain', line: name, seeds, wins: r.wins, losses: r.losses, unfinished: r.unfinished, lostAt: r.lostAt.slice(1) }));
  }
}
