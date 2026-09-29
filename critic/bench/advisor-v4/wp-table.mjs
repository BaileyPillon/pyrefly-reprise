// The worker-path scorecard table in docs/handoff/advisor-v4.md, from worker-path.test.ts's files
// (results/wp-<budget>-<chapter>.json).
//
//   node critic/bench/advisor-v4/wp-table.mjs lean
//
// Per FFX chapter: v3's wins and v4's through the game's worker path, the seeds each won that the
// other lost, lethal-save misses, and the top-row switch rate (v4's top row differs from v3's).
// Game case: FFX only (a reading of the bench).

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), 'results');
const BUDGET = process.argv[2] ?? 'lean';
const ORDER = [
  ['seymour-flux', 'I'], ['yunalesca', 'II'], ['braskas-final-aeon', 'III'], ['seymour-anima-macalania', 'VII'],
  ['evrae-airship', 'VIII'], ['yojimbo-cavern', 'IX'], ['seymour-natus', 'X'], ['seymour-omnis', 'XII'], ['isaaru-via-purifico', 'XIV'],
];
const seeds = (r) => [...Array(r.seeds)].map((_, i) => r.first + i);
const tot = { v3: 0, v4: 0, n: 0, sw: 0, dec: 0 };
console.log(`Worker path, budget ${BUDGET}, 40 seeds a chapter`);
console.log('| Chapter | v3 wins | v4 wins | v4 won, v3 lost / the reverse | Lethal-save miss v3 → v4 | Missed revive v3 → v4 | Top row switched / decisions | v4 shown / not ready | Worker ms p50 / p95 | Verdict |');
console.log('|---|---:|---:|---|---|---|---|---|---|---|');
for (const [id, roman] of ORDER) {
  const f = join(HERE, `wp-${BUDGET}-${id}.json`);
  if (!existsSync(f)) { console.log(`| ${roman} | (not run) |`); continue; }
  const d = JSON.parse(readFileSync(f, 'utf8'));
  const v3 = d.rows.find((r) => r.driver === 'v3');
  const v4 = d.rows.find((r) => r.driver === 'v4');
  for (const r of [v3, v4]) r.first = d.first ?? 1;
  const lost3 = seeds(v3).filter((s) => !v3.winSeeds.includes(s));
  const lost4 = seeds(v4).filter((s) => !v4.winSeeds.includes(s));
  const plus = lost3.filter((s) => !lost4.includes(s));
  const minus = lost4.filter((s) => !lost3.includes(s));
  tot.v3 += v3.wins; tot.v4 += v4.wins; tot.n += v3.seeds; tot.sw += v4.switched; tot.dec += v4.decisions;
  const verdict = v4.wins > v3.wins ? 'better' : v4.wins === v3.wins ? 'equal' : '**worse**';
  console.log(`| ${roman} | ${v3.wins}/${v3.seeds} | ${v4.wins}/${v4.seeds} | +${plus.length} / −${minus.length}${minus.length ? ` (lost ${minus.join(', ')})` : ''} | ${v3.lethalMiss} → ${v4.lethalMiss} | ${v3.missedRevive} → ${v4.missedRevive} | ${v4.switched} / ${v4.decisions} (${((100 * v4.switched) / Math.max(1, v4.decisions)).toFixed(1)} %) | ${v4.shownV4} / ${v4.notReady} | ${v4.workerP50.toFixed(0)} / ${v4.workerP95.toFixed(0)} | ${verdict} |`);
}
console.log(`| **All** | **${tot.v3}/${tot.n}** | **${tot.v4}/${tot.n}** | | | | ${tot.sw} / ${tot.dec} (${((100 * tot.sw) / Math.max(1, tot.dec)).toFixed(1)} %) | | | |`);
