/**
 * **Fitting a recorded camera path with keyframes** (FFX only; the table builder's arithmetic, `tools/ffxcam-table-build.mjs`): a path is the pose at every logic step, `[eye x y z, look-at x y z,
 * roll in degrees, lens]` per step; a fit is the fewest keys that reproduce it within a tolerance, played back by `src/engine/ffxcam/shotTrack.ts`'s own `progress`, so a fit is checked against
 * what plays.
 *
 * A key is reached from the previous one by a **cut** (the camera holds, then jumps: a long hold and its jump are one segment), a **linear** blend, a **cosine** blend, or a **trapezoid** of
 * one of the shapes the recording saw (`a,b,c,d`). The fit is a shortest path over the step indices: `dp[j]` is the fewest segments that reach step `j`, and a segment `i..j` is allowed when
 * one of the four families stays within the tolerance at every step between (a one-step segment always is). So a 250-step trapezoid after a hold is two segments, however slowly the trapezoid
 * leaves its start.
 *
 * **The tolerance** (the brief's): the eye and the look-at each within 0.5 FFX units, the roll within 0.3 degrees, the vertical field of view (from the lens) within 0.3 degrees, and the view
 * direction (the angle between look-at minus eye, which is what the picture is) within 0.3 degrees, so a close-up, where half a unit is a lot of angle, is fitted tighter than a wide shot.
 *
 * Game case: FFX only.
 */

import { progress } from '../src/engine/ffxcam/shotTrack.ts';

export const TOLERANCE = { pos: 0.5, deg: 0.3 };

const R2D = 180 / Math.PI;
const fovOf = (lens) => 2 * Math.atan(240 / lens) * R2D;

/** Round a sample to what the table stores: 0.01 units and degrees, 0.1 of a lens value. */
export const quantise = (s) => [r2(s[0]), r2(s[1]), r2(s[2]), r2(s[3]), r2(s[4]), r2(s[5]), r2(s[6]), Math.round(s[7] * 10) / 10];
const r2 = (v) => Math.round(v * 100) / 100;

/** How far `p` is from `s`, per channel group: `{ eye, ref, roll, fov, dir }` (units and degrees). */
export function errorOf(p, s) {
  const ux = p[3] - p[0];
  const uy = p[4] - p[1];
  const uz = p[5] - p[2];
  const vx = s[3] - s[0];
  const vy = s[4] - s[1];
  const vz = s[5] - s[2];
  const cx = uy * vz - uz * vy;
  const cy = uz * vx - ux * vz;
  const cz = ux * vy - uy * vx;
  return {
    eye: Math.hypot(p[0] - s[0], p[1] - s[1], p[2] - s[2]),
    ref: Math.hypot(p[3] - s[3], p[4] - s[4], p[5] - s[5]),
    roll: Math.abs(p[6] - s[6]),
    fov: Math.abs(fovOf(p[7]) - fovOf(s[7])),
    dir: Math.atan2(Math.hypot(cx, cy, cz), ux * vx + uy * vy + uz * vz) * R2D,
  };
}

function within(p, s, tol) {
  if (Math.hypot(p[0] - s[0], p[1] - s[1], p[2] - s[2]) > tol.pos) return false;
  if (Math.hypot(p[3] - s[3], p[4] - s[4], p[5] - s[5]) > tol.pos) return false;
  if (Math.abs(p[6] - s[6]) > tol.deg) return false;
  if (Math.abs(fovOf(p[7]) - fovOf(s[7])) > tol.deg) return false;
  const e = errorOf(p, s);
  return e.dir <= tol.deg;
}

const scratch = new Float64Array(8);

/** The pose `shape` gives at step `k` of the segment `a..b` whose end poses are `A` and `B` (arrays of 8), written into `scratch`. */
function blend(A, B, shape, k, n) {
  const u = progress(shape, k, n);
  for (let c = 0; c < 8; c++) scratch[c] = A[c] + (B[c] - A[c]) * u;
  return scratch;
}

/** Does `shape` carry the samples `S[i..j]` within the tolerance? */
function fits(S, i, j, shape, tol) {
  const A = S[i];
  const B = S[j];
  const n = j - i;
  for (let k = i + 1; k < j; k++) {
    const p = shape === 0 ? A : blend(A, B, shape, k - i, n);
    if (!within(p, S[k], tol)) return false;
  }
  return true;
}

/**
 * The fewest keys that carry `samples` (arrays of 8, already quantised) within `tol`: `[[step, eye, ref, roll, lens, shape], ...]`. `shapes` are the trapezoids (`'a,b,c,d'`) that may be used.
 * The first key is the first sample and the last the last, unless the path ends in a hold (then the keys stop where the camera stops).
 */
export function fitKeys(samples, shapes = [], tol = TOLERANCE) {
  const N = samples.length - 1;
  const traps = shapes.map((s) => s.split(',').map(Number)).filter((s) => s.length === 4);
  const trapsByLength = new Map();
  for (const t of traps) {
    const n = t[0] + t[1] + t[2];
    (trapsByLength.get(n) ?? trapsByLength.set(n, []).get(n)).push([3, ...t]);
  }
  const best = new Array(N + 1).fill(Number.POSITIVE_INFINITY);
  const from = new Array(N + 1).fill(-1);
  const how = new Array(N + 1).fill(0);
  best[0] = 0;
  for (let i = 0; i < N; i++) {
    if (!Number.isFinite(best[i])) continue;
    for (let j = i + 1; j <= N; j++) {
      if (best[i] + 1 >= best[j]) continue;
      let shape = null;
      if (j - i === 1 || fits(samples, i, j, 0, tol)) shape = 0;
      else if (fits(samples, i, j, 1, tol)) shape = 1;
      else if (fits(samples, i, j, 2, tol)) shape = 2;
      else {
        for (const t of trapsByLength.get(j - i) ?? []) {
          if (fits(samples, i, j, t, tol)) {
            shape = t;
            break;
          }
        }
      }
      if (shape !== null) {
        best[j] = best[i] + 1;
        from[j] = i;
        how[j] = shape;
      }
    }
  }
  const keys = [];
  for (let j = N; j > 0; j = from[j]) keys.push([j, how[j]]);
  keys.reverse();
  const out = [[0, ...pack(samples[0]), 0]];
  for (const [j, shape] of keys) out.push([j, ...pack(samples[j]), shape]);
  // A path that ends in a hold ends where the camera stops: drop trailing keys that repeat the pose before them.
  while (out.length > 1 && same(out[out.length - 1], out[out.length - 2])) out.pop();
  return out;
}

const pack = (s) => [[s[0], s[1], s[2]], [s[3], s[4], s[5]], s[6], s[7]];
const same = (a, b) => a[1].every((v, c) => v === b[1][c]) && a[2].every((v, c) => v === b[2][c]) && a[3] === b[3] && a[4] === b[4];

/** The pose of `keys` at integer step `k`, as an array of 8 (the same arithmetic as `shotTrack.poseAt`). */
export function evalKeys(keys, k) {
  if (k <= keys[0][0] || keys.length === 1) return flat(keys[0]);
  let m = 1;
  while (m < keys.length - 1 && k >= keys[m][0]) m++;
  const to = keys[m];
  if (k >= to[0]) return flat(to);
  const from = keys[m - 1];
  const u = progress(to[5], k - from[0], to[0] - from[0]);
  const a = flat(from);
  const b = flat(to);
  return a.map((v, c) => v + (b[c] - v) * u);
}
const flat = (key) => [...key[1], ...key[2], key[3], key[4]];

/** The largest error of `keys` against `samples` over every step: `{ eye, ref, roll, fov, dir }`. */
export function worstError(keys, samples) {
  const worst = { eye: 0, ref: 0, roll: 0, fov: 0, dir: 0 };
  for (let k = 0; k < samples.length; k++) {
    const e = errorOf(evalKeys(keys, k), samples[k]);
    for (const c of Object.keys(worst)) worst[c] = Math.max(worst[c], e[c]);
  }
  return worst;
}
