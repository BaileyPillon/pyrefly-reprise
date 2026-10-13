/**
 * Measure the painted B's elevation limit from the painted sky plate's extent (FFX only; `src/engine/ffxcam/variant.ts`'s `FFXCAM_B_PITCH_MAX_DEG` and `FFXCAM_B_PITCH_MIN_DEG`), and, with `--table`, how much
 * of the frame the baked table keeps on the painting.
 *
 *   node --experimental-transform-types tools/ffxcam-plate.mjs [--table]
 *
 * **The limit.** The plate is a rectangle 80 world units down the near default camera's view line (`src/scenes/exp-fayth-plate.ts`: 162 by 92.6 units, rolled 11.6 degrees). From the eye the painted skin was
 * built for, this finds the highest look-direction pitch at which the **top edge of the frame** (the top row of rays across the window) still lands on the plate, for the view turned `d` degrees either way of the
 * near default's azimuth (B's clamp allows 35) and for three window shapes. A pitch above it shows the void above the plate. The constant is the floor of the centre column over the three shapes, rounded
 * down to the half degree. The lower limit is the same for the **bottom edge** against the plate's lower edge (the deck, which covers the bottom of most frames, is not counted: it only adds margin).
 *
 * `--table` casts a 17 by 9 grid of the frame's rays through every step of every shot in the table and reports the share that lands on the plate or the deck, by kind of shot.
 */
import { ffxEye } from '../src/engine/ffx3d/ffxWorld.ts';
import { FFX_NEAR_VIEW } from '../src/engine/ffx3d/ffxStaging.ts';
import { basisOf, coverage, paintedWorld } from './ffxcam-plate-lib.mjs';

const D2R = Math.PI / 180;
const world = paintedWorld();
const eye0 = ffxEye(FFX_NEAR_VIEW);
const ref0 = FFX_NEAR_VIEW.ref;
const baseAz = Math.atan2(ref0[2] - eye0[2], ref0[0] - eye0[0]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** A pose at the near default's eye looking at pitch `p` degrees (up positive), `d` degrees off the near default's azimuth. */
function poseAt(p, d, fovDeg = 26.38) {
  const az = baseAz + d * D2R;
  const len = FFX_NEAR_VIEW.len;
  const dir = [Math.cos(p * D2R) * Math.cos(az), -Math.sin(p * D2R), Math.cos(p * D2R) * Math.sin(az)];
  return { eye: eye0, ref: [eye0[0] + dir[0] * len, eye0[1] + dir[1] * len, eye0[2] + dir[2] * len], roll: 0, scrDpt: 1024, fovDeg };
}

/** True when one edge row of the frame (`sy` = 1 top, -1 bottom) lands on the plate along its whole width. */
function edgeOnPlate(p, d, aspect, sy) {
  const { eye, forward, right, up } = basisOf(poseAt(p, d));
  const tanY = Math.tan((26.38 * D2R) / 2);
  const tanX = tanY * aspect;
  const pl = world.plate;
  for (let i = 0; i <= 40; i++) {
    const sx = -1 + (2 * i) / 40;
    const dd = [0, 1, 2].map((c) => forward[c] + right[c] * sx * tanX + up[c] * sy * tanY);
    const den = dot(dd, pl.n);
    const t = dot([pl.centre[0] - eye[0], pl.centre[1] - eye[1], pl.centre[2] - eye[2]], pl.n) / den;
    if (!(t > 0)) return false;
    const h = [eye[0] + dd[0] * t - pl.centre[0], eye[1] + dd[1] * t - pl.centre[1], eye[2] + dd[2] * t - pl.centre[2]];
    if (Math.abs(dot(h, pl.u)) > pl.halfW || Math.abs(dot(h, pl.v)) > pl.halfH) return false;
  }
  return true;
}

/** The pitches (degrees) between which the edge row stays on the plate, scanning 0.1 degree: `[lowest, highest]` or null. */
function band(d, aspect, sy) {
  let lo = null;
  let hi = null;
  for (let p = -45; p <= 45; p += 0.1) {
    if (edgeOnPlate(p, d, aspect, sy)) {
      lo ??= p;
      hi = p;
    }
  }
  return lo === null ? null : [lo, hi];
}

const aspects = [
  ['4:3', 4 / 3],
  ['16:9', 16 / 9],
  ['21:9', 21 / 9],
];
console.log(`near default pitch ${((Math.atan2(-(ref0[1] - eye0[1]), Math.hypot(ref0[0] - eye0[0], ref0[2] - eye0[2])) / D2R)).toFixed(2)} deg; plate half sizes ${world.plate.halfW} x ${world.plate.halfH.toFixed(2)} units`);
console.log('highest pitch with the frame\'s TOP edge on the plate, by view azimuth offset d (blank: no pitch does it):');
const tops = [];
for (const [name, a] of aspects) {
  const cells = [-35, -25, -15, 0, 15, 25, 35].map((d) => {
    const b = band(d, a, 1);
    if (d === 0 && b) tops.push(b[1]);
    return `${d}:${b ? b[1].toFixed(1) : '-'}`;
  });
  console.log(`  ${name.padEnd(5)} ${cells.join('  ')}`);
}
const bottoms = aspects.map(([, a]) => band(0, a, -1)?.[0] ?? NaN);
const MAX = Math.floor(Math.min(...tops) * 2) / 2;
const MIN = Math.ceil(Math.max(...bottoms) * 2) / 2;
console.log(`lowest pitch with the BOTTOM edge on the plate (d = 0): ${bottoms.map((b) => b.toFixed(1)).join(', ')}`);
console.log(`=> FFXCAM_B_PITCH_MAX_DEG = ${MAX} (floor of the centre column's top-edge limit over the three shapes), FFXCAM_B_PITCH_MIN_DEG = ${MIN}`);

if (process.argv.includes('--table')) {
  const { EVRAE_SHOTS } = await import('../src/data/ffx/camera/evrae-shots.ts');
  const { poseAt: shotPose } = await import('../src/engine/ffxcam/shotTrack.ts');
  const kinds = {};
  for (const shot of Object.values(EVRAE_SHOTS.shots)) {
    const k = (kinds[shot.kind] ??= { steps: 0, covered: 0, full: 0 });
    const last = Math.max(shot.len, shot.keys[shot.keys.length - 1][0]);
    for (let t = 0; t <= last; t++) {
      const c = coverage(world, shotPose(shot, t), 16 / 9).covered;
      k.steps++;
      k.covered += c;
      if (c >= 0.99) k.full++;
    }
  }
  for (const [kind, k] of Object.entries(kinds)) console.log(`  ${kind.padEnd(8)} ${k.steps} steps, mean ${(100 * k.covered / k.steps).toFixed(1)}% of the frame on the painting, ${(100 * k.full / k.steps).toFixed(1)}% of steps fully`);
}
