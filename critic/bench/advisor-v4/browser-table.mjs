// The browser timing table in docs/handoff/advisor-v4.md, from browser-timing.mjs's JSON files.
//
//   node critic/bench/advisor-v4/browser-table.mjs critic/bench/advisor-v4/results/browser
//
// Pools every run in the folder by viewport (and CPU throttle) and v4 on/off: menus opened, the
// share where v4's answer was ready at menu open, the menu-open cost of the card (the wall time of
// MoveAdvisor.showDecision, per menu), long frames over the whole battle, and the worker's time.
// Game case: FFX only (a reading of the bench).

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] ?? 'critic/bench/advisor-v4/results/browser';
const pct = (xs, p) => {
  if (!xs.length) return '-';
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.round((p / 100) * (s.length - 1)))].toFixed(1);
};
const runs = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));
const groups = new Map();
for (const r of runs) {
  const key = `${r.viewport} cpu${r.throttle}x v4 ${r.v4 ? 'on' : 'off'}`;
  const g = groups.get(key) ?? { runs: 0, menus: 0, opened: 0, ready: 0, show: [], frames: 0, over34: 0, over50: 0, worker: [], chapters: new Set(), errors: 0 };
  g.runs += 1;
  g.chapters.add(r.chapter);
  g.menus += r.cards.length;
  g.opened += r.opened ?? 0;
  g.ready += r.ready ?? 0;
  g.show.push(...r.cards.map((c) => c.ms));
  const all = r.frameMsAll ?? r.frameMs;
  g.frames += all.n;
  g.over34 += all.over34 ?? 0;
  g.over50 += all.over50 ?? 0;
  if (r.workerTotalMs?.p95 != null) g.worker.push(r.workerTotalMs.p95);
  g.errors += r.errors.length;
  groups.set(key, g);
}
console.log('| Size | v4 | Runs | Menus | v4 ready at open | Menu open ms p50 / p95 / max | Frames > 34 ms / > 50 ms (of all) | Worker ms p95, per run, max | Console errors |');
console.log('|---|---|---:|---:|---|---|---|---:|---:|');
for (const [key, g] of [...groups].sort()) {
  const [size, cpu, , onoff] = key.split(' ');
  const ready = onoff === 'on' ? `${g.ready} / ${g.opened} (${((100 * g.ready) / Math.max(1, g.opened)).toFixed(0)} %)` : '-';
  const worker = g.worker.length ? Math.max(...g.worker).toFixed(0) : '-';
  console.log(`| ${size} ${cpu} | ${onoff} | ${g.runs} | ${g.menus} | ${ready} | ${pct(g.show, 50)} / ${pct(g.show, 95)} / ${pct(g.show, 100)} | ${g.over34} / ${g.over50} (of ${g.frames}) | ${worker} | ${g.errors} |`);
}
