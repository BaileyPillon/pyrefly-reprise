#!/usr/bin/env node
/**
 * The winnability bench of the hidden Omega Ruins chapter (FFX only): plays the chapter's three fights on the real engine with the advisor's line, a careless one and the Yojimbo opener, and prints the tables that
 * `docs/handoff/ch-omega-ruins.md` carries. The harness is `tests/unit/helpers/omegaRuinsBench.ts` (the same one `tests/unit/chapters/omega-ruins-bench.test.ts` pins), so what is printed is what is tested.
 * **No boss row is ever touched**: the only lever is the party preset (`src/data/ffx/builds/omega-ruins.ts`: Piercing on the weapons, the Phoenix Downs, the Turbo Ethers).
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/omega-ruins-bench.mjs [--seeds 100] [--first 1] [--acts] [--chain] [--levers] [--ablate] [--yojimbo] [--phoenix 30] [--turbo 6] [--no-piercing]
 *
 *   --seeds     fights a line plays in a cell (seeds first to first + N - 1); the committed table used 100 or 200
 *   --first     the first seed (the table of record also reads seeds 201 to 400)
 *   --acts      each act alone, the advisor's line and the careless one (Acts I and II are formalities against the preset; Act III is the fight)
 *   --chain     the whole chapter, three acts chained (the heal between the acts), the advisor's line and the careless one
 *   --levers    Act III against the preset's levers: the shared preset (no lever), Piercing alone, + 30 Phoenix Downs, + 6 Turbo Ethers, the shipped preset, and the Phoenix Down stock from 17 to 36
 *   --ablate    Act III with the shipped preset and the advisor with one rule taken away (no Auto-Life, no MP items, no Quick Hit, Auto-Life on two, on one)
 *   --yojimbo   Act III with the Yojimbo opener beside the advisor alone (the Zanmato lottery: preflight WP9)
 *   --phoenix / --turbo / --no-piercing   a custom preset for --acts and --chain (the shipped one when left out)
 *
 * It prints one markdown row per cell and a JSON line per row for the document's builder. A machine that is busy takes about 0.1 to 0.2 seconds a Nemesis fight.
 */

import {
  ablatedLine, advisorLine, carelessLine, rateOfAct, rateOfChain, share, withBag, withPhoenixDowns, withPiercing, withYojimbo, SHARED_PRESET,
} from '../tests/unit/helpers/omegaRuinsBench.ts';
import { OMEGA_RUINS_PHOENIX_DOWNS, OMEGA_RUINS_TURBO_ETHERS, omegaRuinsBuild } from '../src/data/ffx/builds/omega-ruins.ts';

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
const first = Number(args.get('--first') ?? 1);
const pct = (r) => `${(100 * share(r)).toFixed(0)}% (${r.wins}/${r.seeds}${r.unfinished > 0 ? `, UNFINISHED ${r.unfinished}` : ''})`;
const ACT_NAMES = ['Ultima Weapon', 'Omega Weapon', 'Nemesis'];

let party = omegaRuinsBuild;
if (args.has('--no-piercing') || args.has('--phoenix') || args.has('--turbo')) {
  party = args.has('--no-piercing') ? SHARED_PRESET : withPiercing(SHARED_PRESET);
  if (args.has('--phoenix')) party = withPhoenixDowns(party, Number(args.get('--phoenix')));
  if (args.has('--turbo')) party = withBag(party, { 'turbo-ether': Number(args.get('--turbo')) });
}

function row(label, r, extra = {}) {
  console.log(`| ${label} | ${pct(r)} |`);
  console.log(JSON.stringify({ label, seeds: r.seeds, first, wins: r.wins, lost: r.lost, unfinished: r.unfinished, ...extra }));
}

console.log(`# seeds ${first} to ${first + seeds - 1}`);

if (args.has('--acts')) {
  console.log('\n| Act | advisor | careless |\n|---|---|---|');
  for (const act of [0, 1, 2]) {
    const a = rateOfAct(seeds, act, advisorLine, party, first);
    const c = rateOfAct(seeds, act, carelessLine, party, first);
    console.log(`| ${ACT_NAMES[act]} | ${pct(a)} | ${pct(c)} |`);
    console.log(JSON.stringify({ act: ACT_NAMES[act], seeds, first, advisor: a, careless: c }));
  }
}

if (args.has('--chain')) {
  console.log('\n| The whole chapter (three acts chained) | result |\n|---|---|');
  const a = rateOfChain(seeds, advisorLine, party, first);
  const c = rateOfChain(seeds, carelessLine, party, first);
  row('advisor', a, { lostIn: a.lostIn });
  row('careless', c, { lostIn: c.lostIn });
}

if (args.has('--levers')) {
  console.log('\n| Act III against the preset (the advisor\'s line) | wins |\n|---|---|');
  const piercing = withPiercing(SHARED_PRESET);
  const cells = [
    ['the shared preset (no lever): 17 Phoenix Downs, 2 Turbo Ethers, no Piercing', SHARED_PRESET],
    ['Piercing alone', piercing],
    ['Piercing + 30 Phoenix Downs', withPhoenixDowns(piercing, 30)],
    ['Piercing + 6 Turbo Ethers', withBag(piercing, { 'turbo-ether': 6 })],
    ['30 Phoenix Downs + 6 Turbo Ethers, no Piercing', withBag(withPhoenixDowns(SHARED_PRESET, 30), { 'turbo-ether': 6 })],
    ...[17, 20, 22, 24, 26, 28, 30, 33, 36].map((n) => [`Piercing + ${n} Phoenix Downs + 6 Turbo Ethers`, withBag(withPhoenixDowns(piercing, n), { 'turbo-ether': 6 })]),
    [`the shipped preset (Piercing, ${OMEGA_RUINS_PHOENIX_DOWNS} Phoenix Downs, ${OMEGA_RUINS_TURBO_ETHERS} Turbo Ethers)`, omegaRuinsBuild],
  ];
  for (const [label, p] of cells) row(label, rateOfAct(seeds, 2, advisorLine, p, first));
}

if (args.has('--ablate')) {
  console.log('\n| Act III, the shipped preset, the advisor with one rule taken away | wins |\n|---|---|');
  row('(the advisor as shipped)', rateOfAct(seeds, 2, advisorLine, party, first));
  for (const name of ['no-auto-life', 'no-mp-items', 'no-quick-hit', 'life-two', 'life-one']) row(name, rateOfAct(seeds, 2, ablatedLine(name), party, first));
  row('careless', rateOfAct(seeds, 2, carelessLine, party, first));
}

if (args.has('--yojimbo')) {
  console.log('\n| Act III, the shipped preset | wins |\n|---|---|');
  row('the advisor alone (Yojimbo stays on the list)', rateOfAct(seeds, 2, advisorLine, party, first));
  row('Yojimbo opens, paid 100,000 a menu, then the advisor', rateOfAct(seeds, 2, withYojimbo(advisorLine), party, first));
  row('Yojimbo opens, then a careless line', rateOfAct(seeds, 2, withYojimbo(carelessLine), party, first));
}
