#!/usr/bin/env node
/**
 * Measures how far every frontal layer of the living-portrait rig can move
 * relative to the canvas, by running the prototype's OWN state machine
 * (`docs/concepts/pause-until-dawn/prototype-v2/src/state.ts`) and its own
 * springs/noise (`dynamics.ts`) through a long, adversarial input script,
 * then applying the renderer's per-layer offset formulas (copied verbatim
 * from `renderer.ts`: chest sway, iris travel, loose-part lag + idle jiggle).
 *
 * The result is the displacement envelope the art pass must inpaint under:
 * a layer that can move by (dx, dy) uncovers whatever lies under its own
 * silhouette shifted by that amount.
 *
 *   node tools/gen/rig-range.mjs [--yaw -85,40] [--seconds 1800] [--out file.json]
 *
 * Node 24 strips the TypeScript types itself; nothing is built.
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../docs/concepts/pause-until-dawn/prototype-v2/src');
const { PortraitStateMachine } = await import(`file://${SRC}/state.ts`);
const { ExponentialSpring, BandNoise } = await import(`file://${SRC}/dynamics.ts`);
const { RIG_CONSTANTS } = await import(`file://${SRC}/constants.ts`);

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, t, i, a) => (t.startsWith('--') ? [...acc, [t.slice(2), a[i + 1]]] : acc), []),
);
const [yawMin, yawMax] = (args.yaw ?? '-85,40').split(',').map(Number);
const seconds = Number(args.seconds ?? 1800);

// Copied from renderer.ts (keep in sync; the art depends on these numbers).
const IRIS_TRAVEL_PX = [11, 7];
const LOOSE_LAG_TAU = { earring: 0.5, strand1: 0.32, strand2: 0.38 };
const LOOSE_SWING_PX = { earring: 16, strand1: 20, strand2: 18 };
const LOOSE_IDLE_PX = { earring: 3, strand1: 5, strand2: 4 };
const PLATE_IPD_PX = Math.hypot(609 - 338, 406 - 422);
const CHEST_AXIS = { x: 0.35, y: 1 };
const noiseSeeds = { earring: [0xe001, 0], strand1: [0xe002, 1.1], strand2: [0xe003, 2.3] };

function yawNormFor(yawDeg) {
  if (yawDeg >= 0) return yawMax === 0 ? 0 : Math.max(0, Math.min(1, yawDeg / yawMax));
  // renderer.ts had `Math.max(-1, Math.min(0, yawDeg / yawMin) * -1)`, which is
  // always 0 for a left turn (yawDeg/yawMin > 0, so min(0, .) = 0): no iris
  // travel, strand swing or relight on the left. Fixed in renderer.ts by the
  // v3 art pass; this is the corrected mapping.
  return yawMin === 0 ? 0 : -Math.max(0, Math.min(1, yawDeg / yawMin));
}
const pitchToNorm = (deg) => Math.max(-1, Math.min(1, deg / RIG_CONSTANTS.yaw.maxDeg));

// Deterministic adversarial input: hard stick slams between the extremes,
// random holds, plus every expression (hurt runs the sway 1.6x faster).
let s = 12345;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

const env = {};
const note = (name, dx, dy) => {
  const e = (env[name] ??= { dxMin: 0, dxMax: 0, dyMin: 0, dyMax: 0 });
  e.dxMin = Math.min(e.dxMin, dx); e.dxMax = Math.max(e.dxMax, dx);
  e.dyMin = Math.min(e.dyMin, dy); e.dyMax = Math.max(e.dyMax, dy);
};

let chestPeak = 0;
for (const expression of ['normal', 'determined', 'hurt']) {
  const sm = new PortraitStateMachine();
  sm.setYawRange(yawMin, yawMax);
  sm.setExpression(expression);
  const lag = Object.fromEntries(Object.keys(LOOSE_LAG_TAU).map((k) => [k, new ExponentialSpring(0, LOOSE_LAG_TAU[k])]));
  const noise = Object.fromEntries(Object.keys(noiseSeeds).map((k) => [k, new BandNoise({ seed: noiseSeeds[k][0], phaseOffset: noiseSeeds[k][1] })]));
  const dt = 1 / 60;
  let nextSwitch = 0;
  for (let t = 0; t < seconds; t += dt) {
    if (t >= nextSwitch) {
      const pick = rnd();
      const gx = pick < 0.35 ? -1 : pick < 0.7 ? 1 : pick < 0.85 ? 0 : rnd() * 2 - 1;
      sm.setGazeTarget(gx, rnd() < 0.5 ? (rnd() < 0.5 ? -1 : 1) : rnd() * 2 - 1);
      nextSwitch = t + 0.15 + rnd() * 2.5;
    }
    const f = sm.update(dt);
    const yn = yawNormFor(f.yawDeg);
    const pn = pitchToNorm(f.pitchDeg);
    const amp = (RIG_CONSTANTS.sway.chestAmpPctIpd / 100) * PLATE_IPD_PX;
    chestPeak = Math.max(chestPeak, Math.abs(f.chestSample));
    note('chest', f.chestSample * amp * CHEST_AXIS.x, f.chestSample * amp * CHEST_AXIS.y);
    note('iris', yn * IRIS_TRAVEL_PX[0], -pn * IRIS_TRAVEL_PX[1]);
    for (const k of Object.keys(lag)) {
      lag[k].setTarget(yn);
      const lagged = lag[k].step(dt);
      const tt = f.timeSeconds;
      const dx = (yn - lagged) * LOOSE_SWING_PX[k] + noise[k].sample(tt) * LOOSE_IDLE_PX[k];
      const dy = noise[k].sample(tt + 50) * LOOSE_IDLE_PX[k] * 0.6;
      note(k, dx, dy);
    }
  }
}
const round = (e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, Math.round(v * 10) / 10]));
const out = {
  measuredBy: 'tools/gen/rig-range.mjs',
  yawRange: [yawMin, yawMax],
  seconds,
  chestSamplePeak: Math.round(chestPeak * 100) / 100,
  envelopePx: Object.fromEntries(Object.entries(env).map(([k, v]) => [k, round(v)])),
  note: 'px on the 832x1216 plate canvas, y down. chest applies to the body layer; iris/strand/earring are relative to the head group.',
};
const json = `${JSON.stringify(out, null, 2)}\n`;
if (args.out) writeFileSync(resolve(process.cwd(), args.out), json);
process.stdout.write(json);
