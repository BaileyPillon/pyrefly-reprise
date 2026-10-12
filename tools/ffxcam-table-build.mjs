/**
 * Build the website's shot table from a recording (`tools/ffxcam-record.mjs`): clamp every recorded pose with the painted B filter (the azimuth within 35 degrees of the near default view's and
 * the elevation limit), fit keyframes to each path (`tools/ffxcam-table-lib.mjs`), share identical shots, group the beats into routes (`tools/ffxcam-table-routes.mjs`) and write
 * `src/data/ffx/camera/evrae-shots*.ts`. FFX only.
 *
 *   node --experimental-transform-types tools/ffxcam-table-build.mjs [--raw=<raw.json>] [--stats] [--no-clamp]
 *
 * `--stats` prints the table's size and the fit's worst errors and writes nothing. `--no-clamp` fits the unclamped paths (variant A: for the comparison in the notes). `--aspect=16:9` is the window shape the
 * plate fit (`src/engine/ffxcam/plateFit.ts`) is baked for.
 * Set TEMP and TMP to a folder on D: first (house rule).
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { FFX_NEAR_VIEW } from '../src/engine/ffx3d/ffxStaging.ts';
import { coverageOf, paintedBFilter, paintedWorld } from '../src/engine/ffxcam/plateFit.ts';
import { TOLERANCE, evalKeys, fitKeys, quantise, worstError } from './ffxcam-table-lib.mjs';
import { buildRows, mergeBranches } from './ffxcam-table-routes.mjs';
import { emitTable } from './ffxcam-table-emit.mjs';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const has = (name) => process.argv.includes(`--${name}`);
const rawPath = arg('raw', 'D:/Tools/ffx-parity/camera/table/raw.json');
const raw = JSON.parse(readFileSync(rawPath, 'utf8'));

const D2R = Math.PI / 180;
const [aw, ah] = arg('aspect', '16:9').split(':').map(Number);
const filter = has('no-clamp') ? (p) => p : paintedBFilter(FFX_NEAR_VIEW.thetaDeg, () => aw / ah);

/** One recorded sample through the painted B filter. */
function clampSample(s) {
  const pose = { eye: [s[0], s[1], s[2]], ref: [s[3], s[4], s[5]], roll: s[6] * D2R, scrDpt: s[7], fovDeg: (2 * Math.atan(240 / s[7])) / D2R };
  const out = filter(pose);
  return [...out.eye, ...out.ref, s[6], s[7]];
}

/**
 * **Shots the painting cannot hold.** After the three clamps some shots still look where the plate is not (a spell cast at Evrae at FAR looks along the ship at a spot 850 units off; Cid's missiles, the Move
 * in): more than 10 percent of the frame, at 16:9, off the plate and the deck for at least half a second (15 steps). Those are not baked: an action's shot becomes "leave the camera" (it keeps the shot it
 * had), a scene becomes a still of the default view it started from for as long as the scene would have run (the camera stays on the party while the airship moves, and Normal follows as ever). Reported.
 */
const UNSAFE_BELOW = 0.9;
const UNSAFE_STEPS = 15;
const world = paintedWorld();
function badSteps(keys, len) {
  let bad = 0;
  for (let k = 0; k <= len; k++) {
    const s = evalKeys(keys, k);
    const pose = { eye: [s[0], s[1], s[2]], ref: [s[3], s[4], s[5]], roll: s[6] * D2R, fovDeg: (2 * Math.atan(240 / s[7])) / D2R };
    if (coverageOf(world, pose, aw / ah).covered < UNSAFE_BELOW) bad++;
  }
  return bad;
}
const dropped = new Map(); // "phase:row" -> count of outcomes not baked

const KIND = { view: 'default', scene: 'scene', victory: 'victory', defeat: 'defeat', open: 'action', launch: 'action' };

// ------------------------------------------------------------------ pass 1: fit every distinct outcome

const shots = new Map(); // content key -> { kind, len, keys }
const worst = { eye: 0, ref: 0, roll: 0, fov: 0, dir: 0 };
const worstVsRaw = { eye: 0, ref: 0, roll: 0, fov: 0, dir: 0 };
let keyCount = 0;
let fitted = 0;
const outcomeKey = new WeakMap(); // outcome -> content key ('' for "leave the camera")

const settled = {}; // the default view each range rests on, raw (an opening that leaves the camera there leaves it)
for (const r of raw.records) if (r.phase === 'view') settled[r.range] = r.outcomes[0].samples[0];
const sameRaw = (a, b) => a.every((v, c) => Math.abs(v - b[c]) < 1e-3);

for (const r of raw.records) {
  for (const o of r.outcomes) {
    const holds = o.none || (r.phase === 'open' && o.len === 0 && o.samples.length === 1 && settled[r.range] && sameRaw(o.samples[0], settled[r.range]));
    if (holds) {
      outcomeKey.set(o, '');
      continue;
    }
    const clamped = o.samples.map(clampSample);
    const q = clamped.map(quantise);
    const keys = fitKeys(q, raw.shapes, TOLERANCE);
    const e = worstError(keys, q);
    const eRaw = worstError(keys, clamped);
    for (const c of Object.keys(worst)) {
      worst[c] = Math.max(worst[c], e[c]);
      worstVsRaw[c] = Math.max(worstVsRaw[c], eRaw[c]);
    }
    const kind = KIND[r.phase];
    if ((kind === 'action' || kind === 'scene') && badSteps(keys, o.len) >= UNSAFE_STEPS) {
      dropped.set(`${r.phase}:${r.row}`, (dropped.get(`${r.phase}:${r.row}`) ?? 0) + 1);
      if (kind === 'action') {
        outcomeKey.set(o, '');
      } else {
        const from = settled[r.range]; // the scene starts on the default view of the range it leaves
        const still = fitKeys([quantise(clampSample(from))], raw.shapes, TOLERANCE);
        const stillContent = JSON.stringify({ kind, len: o.len, keys: still });
        outcomeKey.set(o, stillContent);
        if (!shots.has(stillContent)) shots.set(stillContent, { kind, len: o.len, keys: still });
      }
      continue;
    }
    keyCount += keys.length;
    fitted++;
    const content = JSON.stringify({ kind, len: o.len, keys });
    outcomeKey.set(o, content);
    if (!shots.has(content)) shots.set(content, { kind, len: o.len, keys });
  }
}

// ------------------------------------------------------------------ pass 2: ids

const PREFIX = { default: 'd', scene: 'c', victory: 'v', defeat: 'x', action: 'a' };
const counters = {};
const idOf = new Map([['', '']]);
const defs = {};
for (const [content, def] of [...shots].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const prefix = PREFIX[def.kind];
  counters[prefix] = (counters[prefix] ?? 0) + 1;
  const id = `${prefix}${String(counters[prefix]).padStart(3, '0')}`;
  idOf.set(content, id);
  defs[id] = def;
}
const branchesOf = (r) => mergeBranches(r.outcomes.map((o) => [idOf.get(outcomeKey.get(o)), o.w]));

// ------------------------------------------------------------------ pass 3: the table

const beats = raw.records.filter((r) => r.phase === 'open' || r.phase === 'launch').map((r) => ({ phase: r.phase, row: r.row, actor: r.actor, slot: r.slot, tgt: r.tgt, range: r.range, branches: branchesOf(r) }));
const { rows, routes } = buildRows(beats);
const one = (phase, row, range) => {
  const r = raw.records.find((x) => x.phase === phase && x.row === row && (range === undefined || x.range === range));
  if (!r) throw new Error(`the recording has no ${phase} ${row} ${range ?? ''}`);
  return branchesOf(r);
};
const table = {
  format: 'echoes-evrae-shots/1',
  shots: defs,
  routes,
  rows,
  views: { near: one('view', 'default', 'n')[0][0], far: one('view', 'default', 'f')[0][0] },
  scenes: { pullBack: one('scene', 'pullBack'), moveIn: one('scene', 'moveIn') },
  victory: { n: one('victory', 'victory', 'n'), f: one('victory', 'victory', 'f') },
  defeat: Object.fromEntries(raw.records.filter((r) => r.phase === 'defeat').map((r) => [`${r.range}${r.slot}`, branchesOf(r)])),
};

// ------------------------------------------------------------------ report

const keysTotal = Object.values(defs).reduce((n, d) => n + d.keys.length, 0);
const cells = Object.values(routes).reduce((n, c) => n + Object.keys(c).length, 0);
const text = emitTable(table, { rawCreated: raw.created, samples: raw.samples, tolerance: TOLERANCE });
const r1 = (v) => Math.round(v * 1000) / 1000;
console.log(`outcomes fitted ${fitted}, keys before sharing ${keyCount}`);
const totals = new Map();
for (const r of raw.records) totals.set(`${r.phase}:${r.row}`, (totals.get(`${r.phase}:${r.row}`) ?? 0) + r.outcomes.length);
console.log(`not baked (more than ${Math.round(100 * (1 - UNSAFE_BELOW))}% of the frame off the painting for ${UNSAFE_STEPS}+ steps), outcomes dropped of recorded: ${[...dropped].map(([k, n]) => `${k} ${n}/${totals.get(k)}`).join(', ') || 'none'}`);
console.log(`shots ${Object.keys(defs).length} (${Object.entries(counters).map(([k, v]) => `${k}:${v}`).join(' ')}), keys ${keysTotal}, routes ${Object.keys(routes).length}, cells ${cells}, rows ${Object.keys(rows).length}`);
console.log(`worst error vs the quantised path: ${JSON.stringify(Object.fromEntries(Object.entries(worst).map(([k, v]) => [k, r1(v)])))}`);
console.log(`worst error vs the unrounded clamped path: ${JSON.stringify(Object.fromEntries(Object.entries(worstVsRaw).map(([k, v]) => [k, r1(v)])))}`);
console.log(`source text ${text.reduce((n, f) => n + f.text.length, 0)} bytes in ${text.length} file(s): ${text.map((f) => `${f.name} ${f.text.split('\n').length} lines`).join(', ')}`);
if (!has('stats')) {
  for (const f of text) writeFileSync(`src/data/ffx/camera/${f.name}`, f.text);
  console.log(`wrote ${text.map((f) => f.name).join(', ')}`);
}
