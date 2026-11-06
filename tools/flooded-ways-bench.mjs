#!/usr/bin/env node
/**
 * The difficulty bench of the hidden Flooded Ways chapter (FFX only): plays Evrae Altana's three areas as one fight and Geosgaeno as another on the real engine with the bench's named lines and the party ablations, and prints
 * the table that `docs/handoff/ch-flooded-ways.md` carries. The harness is `tests/unit/helpers/floodedBench.ts` (the same one `tests/unit/chapters/flooded-ways-bench.test.ts` pins), so what is printed is what is tested.
 * **No boss row is ever touched**: a cell is a choice of line or of the party's own estimates.
 *
 * Usage (the engine's sources use parameter properties, so Node must transform types):
 *
 *   node --experimental-transform-types tools/flooded-ways-bench.mjs [--seeds 200] [--fights evrae,geosgaeno]
 *        [--evrae-lines phoenix,ordinary,careless] [--geo-lines smart,struggle,wait,careless] [--party shipped|wards3|unwarded|nokit|wards3+nokit|unwarded+nokit]
 *
 *   --seeds        fights a line plays in a cell (seeds 1 to N); the committed table used 200
 *   --fights       which of the two fights to play (default both)
 *   --evrae-lines  `phoenix` (two Phoenix Downs on the dead one), `ordinary` (open the locks, strike, mend; never a heal on Evrae), `careless` (the plain Attack)
 *   --geo-lines    `smart` (the held character waits while the spit-out would leave everyone standing, else Struggles), `struggle`, `wait`, `careless`
 *   --party        `shipped` (Rikku's Stone Ward alone: the Highbridge equipment as it was carried forward), `wards3` (a Ward on all three: the preflight's GV4), `unwarded` (no Ward at all), `nokit` (the preflight's kit
 *                  taken out of the bag: the Highbridge bag as it was), or a Ward option and `nokit` joined with +
 *
 * It prints one markdown row per cell and a JSON line per row.
 */

import { evraeCareless, evraeOrdinary, evraePhoenix, evraeRate, geosgaenoCareless, geosgaenoLine, geosgaenoRate, share, withBag, withWards } from '../tests/unit/helpers/floodedBench.ts';
import { unwarded } from '../tests/unit/helpers/floodedDrive.ts';
import { swimmersBuild } from '../src/data/ffx/builds/swimmers.ts';

const args = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const next = argv[i + 1];
  if (next === undefined || next.startsWith('--')) args.set(argv[i], true);
  else args.set(argv[i], next), i++;
}
const seeds = args.has('--seeds') ? Number(args.get('--seeds')) : 200;
const fights = String(args.get('--fights') ?? 'evrae,geosgaeno').split(',');
const evraeLines = String(args.get('--evrae-lines') ?? 'phoenix,ordinary,careless').split(',');
const geoLines = String(args.get('--geo-lines') ?? 'smart,struggle,wait,careless').split(',');
const partyName = String(args.get('--party') ?? 'shipped');

let party = swimmersBuild;
if (partyName.includes('unwarded')) party = unwarded(party);
if (partyName.includes('rikkuward')) party = withWards(party, ['rikku']); // the Highbridge equipment as it was carried forward: Rikku's Stone Ward alone (the shipped party)
if (partyName.includes('wards3')) party = withWards(party, ['tidus', 'wakka', 'rikku']); // the preflight's pick (GV4): a Ward on all three
if (partyName.includes('nokit')) party = withBag(party, false);

const evrae = { phoenix: evraePhoenix, ordinary: evraeOrdinary, careless: evraeCareless };
const geo = { smart: geosgaenoLine('smart'), struggle: geosgaenoLine('struggle'), wait: geosgaenoLine('wait'), careless: geosgaenoCareless };
const pct = (r) => `${Math.round(100 * share(r))}`;

console.log(`party: ${partyName}`);
console.log(`| fight | line | wins of ${seeds} | percent | losses | unfinished | members shattered per fight |`);
console.log('|---|---|---:|---:|---:|---:|---:|');
const emit = (fight, line, r) => {
  console.log(`| ${fight} | ${line} | ${r.wins} | ${pct(r)} | ${r.losses} | ${r.unfinished} | ${r.shatterAvg.toFixed(2)} |`);
  console.log(JSON.stringify({ fight, line, party: partyName, seeds, wins: r.wins, losses: r.losses, unfinished: r.unfinished, shatterAvg: r.shatterAvg }));
};
if (fights.includes('evrae')) for (const name of evraeLines) emit('Evrae Altana', name, await evraeRate(seeds, evrae[name], party));
if (fights.includes('geosgaeno')) for (const name of geoLines) emit('Geosgaeno', name, geosgaenoRate(seeds, geo[name], party));
