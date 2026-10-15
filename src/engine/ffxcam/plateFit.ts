/**
 * **Keeping a frame on the painting** (the painted B's last step; FFX only): how much of a camera's frame lands on the painted plate or the deck, and the nearest azimuth, inside B's arc, at which all of it does.
 *
 * The painted skin has one sky plate (`./plate.ts`: 162 by 92.6 world units, 80 down the near default camera's view line) and a deck, and nothing beyond them. B's clamp (`./variant.ts`) keeps the eye's azimuth
 * about its look-at within 35 degrees of the near default's, and its elevation limit keeps the look direction's pitch inside the plate's height, but a frame at the arc's edge can still reach past the plate's
 * **side**: the view turns with the eye, and the plate is only so wide. So after both clamps {@link fitToPlate} checks the frame: a grid of its rays (the camera sink's own basis: FFX's up vector turned by the
 * roll, the vertical field of view the window is drawn with, the horizontal one from the window's aspect) against the plate and the deck. A frame wholly on them is returned as it is. Otherwise the eye is turned about the
 * look-at, **inside the arc**, to the nearest azimuth at which the frame is on the painting (its height, its distance and everything else kept); if there is none, the azimuth with the most of it.
 *
 * It is the same arithmetic the table was baked with (`tools/ffxcam-table-build.mjs`), so a baked pose is a fixed point of it at the aspect it was baked for (16:9) and the filter only moves a pose for a
 * window shape that needs more. Pure numbers: no `three`, no DOM; a few hundred multiplications per frame. Game case: FFX only.
 */

import { FFX_NEAR_VIEW, FFX_PARTY_SLOTS } from '../ffx3d/ffxStaging.ts';
import { ffxEye, ffxPointTuple } from '../ffx3d/ffxWorld.ts';
import { D2R, screenFovDeg } from './geometry.ts';
import { deckRect, plateRect, type WorldRect } from './plate.ts';
import type { CameraPose } from './solver.ts';
import { FFXCAM_B_AZIMUTH_LIMIT_DEG, FFXCAM_B_PITCH_MAX_DEG, FFXCAM_B_PITCH_MIN_DEG, azimuthDeg, clampAzimuth, clampElevation, type PoseFilter } from './variant.ts';

/** The painting as the painted skin lays it: the plate and the deck, in the world. */
export interface PaintedWorld {
  readonly plate: WorldRect;
  readonly deck: WorldRect;
}

let memo: PaintedWorld | null = null;

/** The plate and the deck of the painted skin at FFX's staging (the near default view's camera places the plate; the party's slots place the deck). Built once. */
export function paintedWorld(): PaintedWorld {
  memo ??= {
    plate: plateRect(ffxPointTuple(ffxEye(FFX_NEAR_VIEW)), ffxPointTuple(FFX_NEAR_VIEW.ref)),
    deck: deckRect(FFX_PARTY_SLOTS.map((p) => ffxPointTuple(p))),
  };
  return memo;
}

/** The share of the frame's rays that must land on the painting for a frame to count as on it (one ray in two hundred, at the 17 by 9 grid, is none). */
export const ON_PAINTING = 0.995;

function hits(r: WorldRect, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): boolean {
  const den = dx * r.n[0] + dy * r.n[1] + dz * r.n[2];
  if (Math.abs(den) < 1e-12) return false;
  const t = ((r.centre[0] - ox) * r.n[0] + (r.centre[1] - oy) * r.n[1] + (r.centre[2] - oz) * r.n[2]) / den;
  if (!(t > 0)) return false;
  const hx = ox + dx * t - r.centre[0];
  const hy = oy + dy * t - r.centre[1];
  const hz = oz + dz * t - r.centre[2];
  return Math.abs(hx * r.u[0] + hy * r.u[1] + hz * r.u[2]) <= r.halfW && Math.abs(hx * r.v[0] + hy * r.v[1] + hz * r.v[2]) <= r.halfH;
}

/** What a pose's frame rays land on: the share on the plate, on the deck, and on either. */
export interface Coverage {
  readonly covered: number;
  readonly plate: number;
  readonly deck: number;
}

/**
 * Cast an `nx` by `ny` grid of the frame's rays (edges included) through the pose and say how many land on the plate or the deck. The camera is the sink's (`./sink.ts`): the eye and the look-at through FFX's one
 * transform, up (0, -1, 0) turned about the view axis by the roll, the vertical field of view **the window is drawn with** (`./geometry.ts`, `screenFovDeg`: the lens's own in a window as wide as 4:3, a taller one in a
 * narrower window), `aspect` the width over height of what the player sees.
 */
export function coverageOf(world: PaintedWorld, pose: Pick<CameraPose, 'eye' | 'ref' | 'roll' | 'fovDeg'>, aspect: number, nx = 17, ny = 9): Coverage {
  const eye = ffxPointTuple(pose.eye);
  const look = ffxPointTuple(pose.ref);
  let fx = look[0] - eye[0];
  let fy = look[1] - eye[1];
  let fz = look[2] - eye[2];
  const fl = Math.hypot(fx, fy, fz);
  if (!(fl > 1e-9)) return { covered: 0, plate: 0, deck: 0 };
  fx /= fl;
  fy /= fl;
  fz /= fl;
  let ux = 0;
  let uy = 1; // FFX's (0, -1, 0) through the transform
  let uz = 0;
  if (Math.abs(fy) > 1 - 1e-9) [uy, uz] = [0, 1];
  if (pose.roll !== 0) {
    const c = Math.cos(pose.roll);
    const s = Math.sin(pose.roll);
    const kx = fy * uz - fz * uy;
    const ky = fz * ux - fx * uz;
    const kz = fx * uy - fy * ux;
    const d = (fx * ux + fy * uy + fz * uz) * (1 - c);
    [ux, uy, uz] = [ux * c + kx * s + fx * d, uy * c + ky * s + fy * d, uz * c + kz * s + fz * d];
  }
  // right = forward x up, then the camera's own up = right x forward
  let rx = fy * uz - fz * uy;
  let ry = fz * ux - fx * uz;
  let rz = fx * uy - fy * ux;
  const rl = Math.hypot(rx, ry, rz);
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const upx = ry * fz - rz * fy;
  const upy = rz * fx - rx * fz;
  const upz = rx * fy - ry * fx;
  const tanY = Math.tan((screenFovDeg(pose.fovDeg, aspect) * D2R) / 2);
  const tanX = tanY * aspect;
  let plate = 0;
  let deck = 0;
  let covered = 0;
  for (let j = 0; j < ny; j++) {
    const sy = ny === 1 ? 0 : -1 + (2 * j) / (ny - 1);
    for (let i = 0; i < nx; i++) {
      const sx = nx === 1 ? 0 : -1 + (2 * i) / (nx - 1);
      const dx = fx + rx * sx * tanX + upx * sy * tanY;
      const dy = fy + ry * sx * tanX + upy * sy * tanY;
      const dz = fz + rz * sx * tanX + upz * sy * tanY;
      const onPlate = hits(world.plate, eye[0], eye[1], eye[2], dx, dy, dz);
      const onDeck = hits(world.deck, eye[0], eye[1], eye[2], dx, dy, dz);
      if (onPlate) plate++;
      if (onDeck) deck++;
      if (onPlate || onDeck) covered++;
    }
  }
  const n = nx * ny;
  return { covered: covered / n, plate: plate / n, deck: deck / n };
}

/** The pose with its eye turned about the vertical axis through the look-at to azimuth `azDeg` (height and horizontal radius kept). */
function turnedTo(pose: CameraPose, azDeg: number): CameraPose {
  const r = Math.hypot(pose.eye[0] - pose.ref[0], pose.eye[2] - pose.ref[2]);
  const a = azDeg * D2R;
  return { ...pose, eye: [pose.ref[0] + r * Math.cos(a), pose.eye[1], pose.ref[2] + r * Math.sin(a)] };
}

const wrap180 = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;

/**
 * The pose, or the pose turned to the nearest azimuth inside the arc (`centreDeg` plus or minus `limitDeg`, tried in whole degrees outward from where it is, either way) at which the frame is
 * {@link ON_PAINTING}; the same object when it already is. With no such azimuth, the one with the most of the frame on the painting (the pose's own among them).
 */
export function fitToPlate(world: PaintedWorld, pose: CameraPose, aspect: number, centreDeg: number, limitDeg: number): CameraPose {
  const first = coverageOf(world, pose, aspect).covered;
  if (first >= ON_PAINTING) return pose;
  const az = azimuthDeg(pose);
  if (az === null) return pose;
  const off = wrap180(az - centreDeg);
  let best = pose;
  let bestCover = first;
  for (let k = 1; k <= 2 * limitDeg; k++) {
    for (const sign of [-1, 1]) {
      const to = off + sign * k;
      if (Math.abs(to) > limitDeg) continue;
      const turned = turnedTo(pose, centreDeg + to);
      const c = coverageOf(world, turned, aspect).covered;
      if (c >= ON_PAINTING) return turned;
      if (c > bestCover) {
        best = turned;
        bestCover = c;
      }
    }
  }
  return best;
}

/**
 * **The painted B's whole filter**: the azimuth clamp of B around `centreDeg`, the elevation limit, then {@link fitToPlate} for a window of `aspect` (read each time: the window may be resized). A pose already
 * inside all three is the same object; the last answer is kept, so a pose that is shown on many frames is measured once.
 */
export function paintedBFilter(centreDeg: number, aspect: () => number = () => 16 / 9, world: PaintedWorld = paintedWorld()): PoseFilter {
  let lastIn: CameraPose | null = null;
  let lastAspect = 0;
  let lastOut: CameraPose | null = null;
  return (pose) => {
    const a = aspect();
    if (pose === lastIn && a === lastAspect && lastOut) return lastOut;
    const clamped = clampElevation(clampAzimuth(pose, centreDeg, FFXCAM_B_AZIMUTH_LIMIT_DEG), FFXCAM_B_PITCH_MIN_DEG, FFXCAM_B_PITCH_MAX_DEG);
    const out = fitToPlate(world, clamped, a, centreDeg, FFXCAM_B_AZIMUTH_LIMIT_DEG);
    lastIn = pose;
    lastAspect = a;
    lastOut = out;
    return out;
  };
}

