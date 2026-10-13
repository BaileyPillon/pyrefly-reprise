/**
 * Record the Evrae fight's camera: every beat the fight can produce, replayed headless through the camera-program VM with the live chapter's host values, the pose written down at every logic step.
 * FFX only. Reads Bailey's own copy of the programs (`D:\Tools\ffx-parity\assets\runtime\camera\evrae\`, `PYREFLY_FFX_LOCAL` overrides the root), so it runs only on his PC; the recording is
 * local (`D:\Tools\ffx-parity\camera\table\raw.json`), and `tools/ffxcam-table-build.mjs` turns it into the website's table.
 *
 *   node tools/ffxcam-record.mjs [--out=<file>] [--samples=96] [--only=<substring of a row>] [--check=24]
 *
 * `--samples` is how many seeds of the camera's dice a random shot is run under. `--check` replays that many beats from two different cameras and reports any whose first poses differ.
 * Set TEMP and TMP to a folder on D: first (house rule).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { loadLocal, modules, priorDependence, recordFixed, recordScenario, scenarios, seenShapes } from './ffxcam-record-lib.mjs';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const out = arg('out', 'D:/Tools/ffx-parity/camera/table/raw.json');
const samples = Number(arg('samples', '96'));
const only = arg('only', '');
const check = Number(arg('check', '0'));

const started = Date.now();
const m = await modules();
const env = await loadLocal(m);
const list = scenarios(m, env).filter((s) => s.row.includes(only));
console.log(`${list.length} scenarios, ${samples} seeds for the random ones`);

const records = [];
let steps = 0;
for (const [i, s] of list.entries()) {
  const r = recordScenario(m, env, s, samples);
  steps += r.outcomes.reduce((n, o) => n + o.samples.length, 0);
  records.push(r);
  if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${list.length}  ${((Date.now() - started) / 1000).toFixed(0)} s`);
}
if (only === '') records.push(...recordFixed(m, env, samples));

const capped = records.filter((r) => r.outcomes.some((o) => o.capped));
const dependent = [];
if (check > 0) {
  const step = Math.max(1, Math.floor(list.length / check));
  for (let i = 0; i < list.length; i += step) {
    const s = list[i];
    if (s.phase !== 'launch') continue;
    const worst = priorDependence(m, env, s);
    if (worst > 0.01) dependent.push({ row: s.row, actor: s.actor, slot: s.slot, tgt: s.tgt, range: s.range, worst: Math.round(worst * 100) / 100 });
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ format: 'ffxcam-raw/1', created: new Date().toISOString(), samples, shapes: [...seenShapes], records }));
const outcomes = records.reduce((n, r) => n + r.outcomes.length, 0);
console.log(`wrote ${out}: ${records.length} records, ${outcomes} distinct outcomes, ${steps} samples, ${((Date.now() - started) / 1000).toFixed(1)} s`);
console.log(`trapezoid shapes seen: ${[...seenShapes].sort().join(' | ')}`);
if (capped.length) console.log(`capped (ran to the step limit): ${capped.map((r) => `${r.phase}:${r.row}`).join(', ')}`);
if (check > 0) console.log(dependent.length ? `PRIOR-DEPENDENT launches: ${JSON.stringify(dependent)}` : `prior state: ${Math.ceil(list.length / Math.max(1, Math.floor(list.length / check)))} launches checked, none depends on the camera it starts from`);
