/**
 * **The target shot and its siblings** (the hidden Wind Waker chapter; FFX-2 only): the camera rigs the scene publishes and the projection maths that pins them without a browser. Pure: arrays and numbers, no `three`,
 * no DOM.
 *
 * ## The target
 *
 * `idle` is the look lab's TARGET-C shot (`look-lab/js/shots.mjs`, run 3): **a low camera** (26 cm up since polish 2; the lab's was 37) at (1.0, 0.26, 3.2), tipped 18.9 degrees upward (the lab's 15.6, see `TARGET_PITCH_DEG`), a 49 degree vertical lens. Low and tipped up is the Wind Waker
 * look (the horizon sits at 0.87 of the frame's height before the engine's lift below, the sky and the roof opening above the party), and the lens is wide: nothing in the frame is close enough to make a flat face read as a mask. The girls stand low on
 * the left, Valefor fills the right half, and the bottom fifth of the frame is floor, calm for the HUD.
 *
 * The other rigs are pushes toward who is being looked at, all from the same low height: `intro` is the lab's wide start of the push-in, `action` a push toward the middle of the fight, `party` and `victory` the girls,
 * `enemy` Valefor, `reveal` the boss shot. The presenter picks by name and falls back to `idle` for a name a scene lacks (`BattleMoments.pick`).
 */

import { BOSS_HEIGHT, BOSS_SPOT, HALF_WIDTH, PARTY_HEIGHT, PARTY_SLOTS, WW_BOSS_ID, WW_PARTY_IDS, type V3, type WwId } from './layout.ts';

/** A camera rig, the shape of `engine/BattleCamera.ts`'s `CameraRig` (kept apart so this file imports nothing). */
export interface RigData {
  readonly position: V3;
  readonly lookAt: V3;
  readonly fov: number;
  readonly sway?: number;
}

/** The look-at point of a camera at `pos` pitched `pitchDeg` degrees above the horizon, looking toward -z, `dist` metres ahead (the lab's `lookAt`). */
export function pitchedLook(pos: V3, pitchDeg: number, dist = 10): V3 {
  return [pos[0], pos[1] + dist * Math.tan((pitchDeg * Math.PI) / 180), pos[2] - dist];
}

/**
 * The target shot: position, pitch and lens (the lab's `TARGET_POS`, `TARGET_PITCH`, fov 49). **The height is 0.26 since polish 2** (it was the lab's 0.37): the floor is the strip of frame between the girls' feet and the wall, and the lower the lens the
 * thinner it is at the same figure size. The camera the screen shows is not this rig alone: CHAPTER FRAMING (`engine/fx/mix/framing.ts`) plans a static lens shift for the menu clearance, and at this target shot it is always (0, 36 px at 1600x900),
 * the picture lifted by 0.04 of the frame (the discrete step of `fitClear`; measured in polish 2 on the live build for eight rigs and slot sets, always the same). The numbers below are the rig's and the frame is 0.04 higher: the figures' `raw` tops
 * and feet in `tests/unit/ww3d/layout.test.ts` carry it.
 */
export const TARGET_POSITION: V3 = [1.0, 0.26, 3.2];
/**
 * The lab's pitch was 15.6; 16.8 in polish 1; **18.9 here (polish 2)**, with the lens lowered to 0.26 and the three slots moved to match (`layout.ts`). Measured on the live build (1600x900, camera sway off, each girl alone on a flat ground, the floor alone in
 * red): the girls' hair tops at .329 / .466 / .552 of the frame (TARGET-C .33 / .47 / .55), Yuna's boots .988 (clear of the frame's bottom edge, where polish 1's touched it), the floor 13.1 percent by polish 1's method (TARGET-C 13.2; polish 1's build 16.7).
 * Solved by `D:\Tools\pyrefly-scratch\2026-10-20\windwaker\polish2\solve4.mjs` and verified on candidates in `tune/fc2` and `tune/fc3`.
 */
export const TARGET_PITCH_DEG = 18.9;
export const TARGET_FOV = 49;

/** The sun, from the lab: a warm key from the front right, high. */
export const SUN_DIRECTION: V3 = [3.2, 5.4, 4.2];

export const RIGS: Readonly<Record<string, RigData>> = {
  idle: { position: TARGET_POSITION, lookAt: pitchedLook(TARGET_POSITION, TARGET_PITCH_DEG), fov: TARGET_FOV },
  // the lab's wide start of the push-in: further back, higher, the party small and the boss whole (the presenter pushes in from it to `idle`)
  intro: { position: [2.6, 2.2, 9.0], lookAt: [1.7, 1.5, -2.5], fov: 49, sway: 1.4 },
  // a push toward the middle of the fight: the lens a little left and a little in, the girls a touch bigger, Valefor still whole (measured with `figureBoxes`: Yuna at x 0.04 to 0.31, Valefor at 0.41 to 1.21)
  action: { position: [0.6, 0.42, 3.0], lookAt: [0.9, 2.3, -3.8], fov: 47, sway: 0.7 },
  // the girls: the camera in front of the diagonal, a touch to the right, looking at Rikku's waist
  party: { position: [1.6, 0.7, 3.0], lookAt: [0.0, 0.85, -0.3], fov: 40, sway: 0.7 },
  // Valefor: from among the girls, looking up at her
  enemy: { position: [0.6, 0.8, 2.4], lookAt: [3.4, 2.6, -3.3], fov: 49, sway: 0.7 },
  // Valefor again, a little wider (the reveal at the opening)
  reveal: { position: [0.4, 1.0, 3.6], lookAt: [3.2, 2.4, -3.3], fov: 52, sway: 1.2 },
  victory: { position: [1.0, 0.5, 2.8], lookAt: [0.0, 0.95, -0.3], fov: 42, sway: 1.2 },
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** The camera's basis: forward, right, up (a rig looks at its `lookAt` with world up). */
export function basisOf(rig: RigData): { f: V3; r: V3; u: V3 } {
  const f = norm(sub(rig.lookAt, rig.position));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  return { f, r, u };
}

/** A point on the screen: x and y in 0..1 from the top left, and `depth` along the view (positive in front of the lens). */
export interface ScreenPoint {
  x: number;
  y: number;
  depth: number;
}

/** Where `p` lands on the screen of a window `aspect` wide (width over height) seen through `rig` (the vertical field of view is the rig's, kept as the window widens). */
export function project(rig: RigData, aspect: number, p: V3): ScreenPoint {
  const { f, r, u } = basisOf(rig);
  const d = sub(p, rig.position);
  const depth = dot(d, f);
  const t = Math.tan((rig.fov * Math.PI) / 360);
  const nx = dot(d, r) / (depth * t * aspect);
  const ny = dot(d, u) / (depth * t);
  return { x: 0.5 + 0.5 * nx, y: 0.5 - 0.5 * ny, depth };
}

/** The screen box of a figure. */
export interface ScreenBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The screen box of a figure standing at `at` (feet), `height` tall and `halfWidth` either side of its axis, `lift` above the floor (the four corners of the box it fills, so the camera's yaw is told). */
export function boxOf(rig: RigData, aspect: number, at: V3, height: number, halfWidth: number, lift = 0): ScreenBox {
  const { r } = basisOf(rig);
  const corners: V3[] = [];
  for (const side of [-1, 1]) for (const y of [lift, lift + height]) corners.push([at[0] + r[0] * halfWidth * side, at[1] + y, at[2] + r[2] * halfWidth * side]);
  const pts = corners.map((c) => project(rig, aspect, c));
  return { left: Math.min(...pts.map((q) => q.x)), right: Math.max(...pts.map((q) => q.x)), top: Math.min(...pts.map((q) => q.y)), bottom: Math.max(...pts.map((q) => q.y)) };
}

/** The boxes of the four figures through `rig` at a window `aspect` wide, keyed by id (Valefor's lifted by her hover). */
export function figureBoxes(rig: RigData, aspect: number, hover: number): Record<WwId, ScreenBox> {
  const out = {} as Record<WwId, ScreenBox>;
  WW_PARTY_IDS.forEach((id, i) => {
    out[id] = boxOf(rig, aspect, PARTY_SLOTS[i]!, PARTY_HEIGHT, HALF_WIDTH[id]);
  });
  out[WW_BOSS_ID] = boxOf(rig, aspect, BOSS_SPOT, BOSS_HEIGHT, HALF_WIDTH[WW_BOSS_ID], hover);
  return out;
}

/** How much of the frame's width two boxes share, as a fraction of the narrower (0 when they do not meet). */
export function overlapOf(a: ScreenBox, b: ScreenBox): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (w <= 0 || h <= 0) return 0;
  return (w * h) / Math.min((a.right - a.left) * (a.bottom - a.top), (b.right - b.left) * (b.bottom - b.top));
}

/** The y (0..1 from the top) at which the horizon, the sky's lower edge at infinity, lands for `rig`: the lab's target shot puts it at 0.80 of the frame's height. */
export function horizonY(rig: RigData): number {
  const { f, u } = basisOf(rig);
  const t = Math.tan((rig.fov * Math.PI) / 360);
  // a point very far ahead on the floor's plane: its direction is the horizontal one, (f.x, 0, f.z) normalised
  const h = norm([f[0], 0, f[2]]);
  return 0.5 - 0.5 * (dot(h, u) / dot(h, f) / t);
}

/** The vertical pitch of a rig, degrees above the horizon (positive looks up). */
export function pitchOf(rig: RigData): number {
  const d = sub(rig.lookAt, rig.position);
  return (Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180) / Math.PI;
}
