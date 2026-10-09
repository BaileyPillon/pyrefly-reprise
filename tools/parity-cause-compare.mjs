// Compare two cause tallies (tests/unit/ffx-parity-cause.test.ts) of the same chapters on two engines, as means per seed.
//
//   node tools/parity-cause-compare.mjs old.json new.json [chapter,chapter|-] [minimum change per seed, default 0.05]
//
// Prints, per chapter, the wins, the turns per seed and the tallies that moved most: party KOs by the ability that was resolving
// ("tick" when none was), statuses added to the party and to the enemies, ability uses, misses and crits. A line that moves by a
// whole number of events per seed with no matching move in the uses is a rule that changed, not a different fight.
// (re-parity W2; FFX only; docs/handoff/re-parity-w2.md section 5)
import fs from 'node:fs';

const [, , oldPath, newPath, onlyArg, minArg] = process.argv;
if (!oldPath || !newPath) {
  console.error('usage: node tools/parity-cause-compare.mjs old.json new.json [chapter,chapter|-] [min]');
  process.exit(2);
}
const oldT = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
const newT = JSON.parse(fs.readFileSync(newPath, 'utf8'));
const only = onlyArg && onlyArg !== '-' ? onlyArg.split(',') : Object.keys(newT);
const min = Number(minArg ?? '0.05');

function section(title, a, b, seedsA, seedsB, limit = 14) {
  const rows = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = (a[k] ?? 0) / seedsA;
    const y = (b[k] ?? 0) / seedsB;
    if (Math.abs(y - x) >= min) rows.push({ k, x, y, d: y - x });
  }
  rows.sort((p, q) => Math.abs(q.d) - Math.abs(p.d));
  console.log(`  ${title}`);
  for (const r of rows.slice(0, limit)) {
    console.log(`    ${r.k.padEnd(52)} ${r.x.toFixed(2).padStart(8)} -> ${r.y.toFixed(2).padStart(8)}  (${r.d >= 0 ? '+' : ''}${r.d.toFixed(2)})`);
  }
  if (rows.length === 0) console.log('    (nothing moved by the threshold)');
}

for (const chapter of only) {
  const a = oldT[chapter];
  const b = newT[chapter];
  if (!a || !b) continue;
  console.log(`\n=== ${chapter}: wins ${a.wins} -> ${b.wins} of ${b.seeds}`);
  const perSeed = (x, k) => ((x.turns[k] ?? 0) / x.seeds).toFixed(1);
  console.log(`  turns per seed: party ${perSeed(a, 'party')} -> ${perSeed(b, 'party')}, enemy ${perSeed(a, 'enemy')} -> ${perSeed(b, 'enemy')}`);
  section('party/aeon KOs per seed, by what was resolving', a.partyKoBy, b.partyKoBy, a.seeds, b.seeds);
  section('statuses added to the party/aeons, per seed (status <- ability)', a.statusOnParty, b.statusOnParty, a.seeds, b.seeds);
  section('statuses added to enemies, per seed', a.statusOnEnemy, b.statusOnEnemy, a.seeds, b.seeds, 10);
  section('actions per seed (P party, E enemy)', a.uses, b.uses, a.seeds, b.seeds, 12);
  section('misses per seed', a.misses, b.misses, a.seeds, b.seeds, 8);
  section('crits per seed', a.crits, b.crits, a.seeds, b.seeds, 6);
}
