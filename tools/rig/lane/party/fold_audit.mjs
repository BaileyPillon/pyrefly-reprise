// fold_audit.mjs <rig.json> [--game ffx|ffx2] [--pace current|steady|relaxed] [--rule on|off] [--pairs a>b,...] [--out file.json] [--all]
//
// The OFFLINE fold audit of a party rig (rigs-v3, 2026-10-29; both games, shared plumbing; no browser, no GPU, no image). Run it with
//   node --experimental-transform-types --no-warnings tools/rig/lane/party/fold_audit.mjs <rig folder>/rig.json --game ffx2
//
// `move_audit.py` reads SILHOUETTES, and a sword that turns flat inside the figure's outline is invisible to it (the clips of 2026-10-29: four broken frames in Rikku's `follow>idle`, "0 stray
// frames" in the audit). This reads what is drawn instead: the engine's own move (`RigTransition`, `partStateAt`, the page's pace factor, the `FOLD_MS` rule of `RigFold.ts` when `--rule on`, the default)
// for every pair of keys, one step a frame at 60 Hz, and for every frame, every part that is SHOWN, with the image the key it was painted in (a variant's name is the key's; the part's own image is the idle's):
// how far the bone that carries it is turned from the angle it has in THAT key (`RigSkeleton.absAngle`, degrees, wrapped to 180). A piece drawn more than `FOLD_DEG` (35) off its own drawing's angle is a
// FOLDED piece; a frame with one is a folded frame. Parts under 2 percent of the figure's box area are not read (a glow, a tuft). The `ko` key is left out (its own topple: `RigKoHost.ts`).
//
// Per pair: `frames` (steps to the key), `playMs`, `foldFrames`, `worstDeg`, `worstPart`, the per-frame worst (`devs`), and `headStep` (the largest one-frame step of the head landmark in master px, the move's own: a shorter move steps
// further a frame, so this is the price of the cap; at the default framing a master px is about 0.11 px on a 1600 wide canvas, the harness fails a swap jerk of 40 px: 360 master px). The summary: pairs with a folded frame,
// folded frames in all, the worst, and the largest head step of any pair.
import fs from 'node:fs';
import { readRig } from '../../../../src/engine/rig/RigData.ts';
import { RigTransition, compileKey } from '../../../../src/engine/rig/RigKeys.ts';
import { RigSkeleton } from '../../../../src/engine/rig/RigSkeleton.ts';
import { HIDDEN, OWN, keyState, partStateAt } from '../../../../src/engine/rig/RigPartState.ts';
import { FOLD_DEG, foldMs, shortestWay } from '../../../../src/engine/rig/RigFold.ts';
import { PACE_PRESETS } from '../../../../src/engine/pace.ts';

const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const file = a[0];
if (!file || file.startsWith('--')) throw new Error('usage: fold_audit.mjs <rig.json> [--game ffx|ffx2] [--pace steady] [--rule on|off] [--pairs a>b,...] [--out file]');
const game = opt('--game', 'ffx');
const paceName = opt('--pace', 'steady');
const rule = opt('--rule', 'on') !== 'off';
const pace = PACE_PRESETS[game][paceName].action;
const read = readRig(JSON.parse(fs.readFileSync(file, 'utf8')));
if (!read.ok) throw new Error(read.reason);
const data = read.data;
const DT = 1 / 60;
const sk = new RigSkeleton(data);
const nb = data.bones.length;

/** The bone that carries most of a mesh's weight. */
function dominantBone(mesh) {
  const w = new Float64Array(nb);
  for (let i = 0; i < mesh.boneA.length; i++) {
    if (mesh.boneA[i] >= 0) w[mesh.boneA[i]] += mesh.wA[i];
    if (mesh.boneB[i] >= 0) w[mesh.boneB[i]] += mesh.wB[i];
  }
  let best = 0;
  for (let b = 1; b < nb; b++) if (w[b] > w[best]) best = b;
  return best;
}
const areaOf = (mesh) => {
  const v = mesh.verts;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < v.length; i += 2) { x0 = Math.min(x0, v[i]); x1 = Math.max(x1, v[i]); y0 = Math.min(y0, v[i + 1]); y1 = Math.max(y1, v[i + 1]); }
  return (x1 - x0) * (y1 - y0);
};
const total = data.parts.reduce((s, p) => s + areaOf(p), 0);
const lookOf = (p, v) => (v >= 0 ? p.variants[v] : p);
const carriers = data.parts.map((p) => [p, ...p.variants].map((m) => ({ bone: dominantBone(m), area: areaOf(m) })));

const headName = ['headCenter', 'head'].find((n) => data.landmarks.has(n));
const headAt = () => { const p = headName ? sk.landmark(headName) : null; return p ? [p.x, p.y] : null; };
const keys = [...data.keys.keys()].filter((k) => k !== 'ko');
const compiled = new Map(keys.map((k) => [k, compileKey(data, data.keys.get(k))]));
const states = new Map(keys.map((k) => [k, keyState(data, data.keys.get(k))]));
/** The absolute angle of every bone in a key's own pose (no idle sway): where the drawing painted in that key has each bone. */
const home = new Map(keys.map((k) => { sk.solve(compiled.get(k)); return [k, Array.from({ length: nb }, (_, b) => sk.absAngle(b))]; }));
const wrap = (x) => { let d = Math.abs(x) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; return d; };

/** The image of `part` in state value `v`: the key it was painted in (a variant is named for its key). */
const paintedIn = (p, v) => (v >= 0 ? p.variants[v].name : 'idle');

function playPair(from, to) {
  const keyMs = data.keys.get(to).ms ?? 120;
  const target = rule ? shortestWay(compiled.get(from), compiled.get(to)) : compiled.get(to); // what `RigActor.moveKey` does for a figure drawn by pose (`--rule off` is the engine before rigs-v3)
  const ms = rule ? foldMs(keyMs, compiled.get(from), target) : keyMs;
  const playMs = ms * pace;
  const t = new RigTransition(nb * 5, compiled.get(from));
  t.retarget(target, ms);
  const devs = [];
  sk.solve(compiled.get(from));
  let last = headAt(), headStep = 0, n = 0;
  while (t.busy && n < 400) {
    n++;
    t.step(DT * pace);
    const st = partStateAt(states.get(from), states.get(to), t.progress);
    sk.solve(t.current);
    const h = headAt();
    if (h && last) headStep = Math.max(headStep, Math.hypot(h[0] - last[0], h[1] - last[1]));
    last = h;
    let worst = 0, who = '';
    data.parts.forEach((p, i) => {
      const v = st[i];
      if (v === HIDDEN) return;
      const look = v === OWN ? 0 : v + 1;
      const c = carriers[i][look];
      if (c.area < 0.02 * total) return;
      const homeKey = paintedIn(p, v);
      const h = home.get(homeKey);
      if (!h) return; // painted in the ko key: not read here
      const d = wrap(sk.absAngle(c.bone) - h[c.bone]) * 180 / Math.PI;
      if (d > worst) { worst = d; who = `${p.name}:${homeKey}`; }
    });
    devs.push([Math.round(worst), who]);
  }
  const folded = devs.filter((d) => d[0] > FOLD_DEG);
  const w = devs.reduce((m, d) => (d[0] > m[0] ? d : m), [0, '']);
  return { pair: `${from}>${to}`, keyMs, ms, playMs: Math.round(playMs), frames: n, foldFrames: folded.length, worstDeg: w[0], worstPart: w[1], headStep: Math.round(headStep), devs: devs.map((d) => d[0]) };
}

const only = opt('--pairs', null)?.split(',');
const rows = [];
for (const from of keys) for (const to of keys) {
  if (from === to) continue;
  if (only && !only.includes(`${from}>${to}`)) continue;
  rows.push(playPair(from, to));
}
const bad = rows.filter((r) => r.foldFrames > 0);
const summary = { rig: data.name, game, pace: paceName, rule, pairs: rows.length, pairsWithFold: bad.length, foldFrames: rows.reduce((s, r) => s + r.foldFrames, 0), worstDeg: rows.reduce((m, r) => Math.max(m, r.worstDeg), 0), headStepMax: rows.reduce((m, r) => Math.max(m, r.headStep), 0), foldDeg: FOLD_DEG };
const out = { summary, rows };
if (opt('--out')) fs.writeFileSync(opt('--out'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(summary));
const show = a.includes('--all') ? rows : bad.sort((x, y) => y.foldFrames - x.foldFrames || y.worstDeg - x.worstDeg).slice(0, 14);
for (const r of show) console.log(`${r.pair.padEnd(22)} keyMs ${String(r.keyMs).padStart(3)} play ${String(r.playMs).padStart(3)} ms ${String(r.frames).padStart(2)} fr  fold ${r.foldFrames}  worst ${r.worstDeg}deg ${r.worstPart} headStep ${r.headStep}px  [${r.devs.join(' ')}]`);
