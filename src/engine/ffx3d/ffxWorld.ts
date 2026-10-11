/**
 * **The one transform from FFX battle coordinates to our world** (the hidden Fayth chapter; `docs/plans/fayth-3d.md`). Everything in the `ffx` skin and in the FFX camera replay that is written in FFX's own
 * numbers (the party's slots, Evrae's spots, the camera's eye and look-at) goes through the matrix and the helpers here, so the models, the stage and the camera can never disagree about where a point is.
 *
 * ## The transform
 *
 * `world = FFX_UNIT * (x, -y, -z)` of the FFX-frame point `(x, y, z)`.
 *
 * - **The rotation is the converter's.** FFX's frame is right-handed with **Y down** (a standing character is near `y = -35`, up is negative `y`; the scripts and the camera speak it). The converted models
 *   (`D:\Tools\ffx-parity\assets\runtime\`, `_checks\AXES.md`) were rotated half a turn about X, `(x, y, z) -> (x, -y, -z)`, so they load into three.js unchanged: Y up, right-handed, **characters face +Z**.
 *   This matrix applies the same rotation to a point, so a model needs no extra transform to stand at a point written in FFX's numbers, and a mirror never enters (the determinant is positive).
 * - **The scale is one number.** {@link FFX_UNIT} makes Tidus (18.15 FFX units tall) stand {@link WORLD_TIDUS_HEIGHT} (1.75) world units tall, which is the painted Tidus of Chapter VIII
 *   (`EVRAE_AIRSHIP_ACTOR_HEIGHTS.tidus`), so the party is the size the game's other scenes, rigs and HUD anchors already expect. `1 / FFX_UNIT` is 10.37 FFX units per world unit. The game draws other things at
 *   other factors on top of this one (the stage x10, Evrae x4: `runtimeScale` in the converted files); those are applied to the model, and the matrix then maps its FFX-unit result.
 * - **What it maps where** (rounded): the party slots `(-25, -35, 120)`, `(-20, -35, 80)`, `(-15, -35, 40)` to `(-2.41, 3.37, -11.57)`, `(-1.93, 3.37, -7.71)`, `(-1.45, 3.37, -3.86)`; Evrae's near spot
 *   `(-140, -35, 80)` to `(-13.50, 3.37, -7.71)`. A point `y = -35` stands 3.37 world units up, so the world's floor of this fight is **above** the origin: the party stands on the deck, and the origin is not on it.
 *
 * ## Facing
 *
 * A converted model faces +Z, so turning it by `yaw` about Y (three.js `rotation.y`) makes it face `(sin yaw, 0, cos yaw)` in x and z. {@link yawToward} is the yaw that faces one FFX point from another.
 *
 * Pure numbers and `three` math types: no DOM, no loader. Game case: FFX only (the numbers are FFX's).
 */

import { Matrix4, Vector3 } from 'three';

/** A point or a direction in FFX's frame (x right-handed, **y down**, z) unless a name says it is already in the world. */
export type Vec3 = readonly [number, number, number];

/** Tidus's height in FFX's units: his `.chr` height says 18.0 and the converted model's bind-pose box says 18.1467; the notes round it to 18.15. */
export const FFX_TIDUS_HEIGHT = 18.15;

/** Tidus's height in our world: Chapter VIII's painted Tidus (`EVRAE_AIRSHIP_ACTOR_HEIGHTS.tidus`). */
export const WORLD_TIDUS_HEIGHT = 1.75;

/** World units per FFX unit: Tidus's 18.15 stand 1.75, so one FFX unit is 0.0964 world units. */
export const FFX_UNIT = WORLD_TIDUS_HEIGHT / FFX_TIDUS_HEIGHT;

const K = FFX_UNIT;

/** Fill `out` with the FFX-to-world matrix: a scale by {@link FFX_UNIT} after the half turn about X. Returns `out`. */
export function ffxWorldMatrix(out: Matrix4 = new Matrix4()): Matrix4 {
  return out.set(
    K, 0, 0, 0,
    0, -K, 0, 0,
    0, 0, -K, 0,
    0, 0, 0, 1,
  );
}

/** A point of FFX's frame, in the world. The same arithmetic as the matrix, written out so a test can pin both. */
export function ffxPoint(p: Vec3, out: Vector3 = new Vector3()): Vector3 {
  return out.set(K * p[0], -K * p[1], -K * p[2]);
}

/** {@link ffxPoint} as a plain triple (the shape scenes and rigs hold). */
export function ffxPointTuple(p: Vec3): [number, number, number] {
  return [K * p[0], -K * p[1], -K * p[2]];
}

/** A direction of FFX's frame, in the world: the rotation only, no scale. */
export function ffxDirection(d: Vec3, out: Vector3 = new Vector3()): Vector3 {
  return out.set(d[0], -d[1], -d[2]);
}

/** A length in FFX units, in world units. */
export function ffxLength(n: number): number {
  return n * K;
}

/**
 * The yaw (radians about Y, three.js `rotation.y`) that turns a converted model, which faces +Z, toward `to` as seen from `from`; both are FFX-frame points, and only x and z matter. Facing the same
 * point (or one straight above or below) gives 0.
 */
export function yawToward(from: Vec3, to: Vec3): number {
  const dx = to[0] - from[0];
  const dz = -(to[2] - from[2]); // FFX z is world -z
  return dx === 0 && dz === 0 ? 0 : Math.atan2(dx, dz);
}

// ---------------------------------------------------------------------------
// The camera's own numbers
// ---------------------------------------------------------------------------

const D2R = Math.PI / 180;

/**
 * One FFX camera view as the scripts state it (`hiku15_00`'s default views; the replay's polar rule, `CAMERA.md` 1.1): the look-at `ref`, and the eye as a polar offset from it. Angles in degrees; `len` in FFX
 * units; `scrDpt` is the lens value (the vertical field of view is `2 * atan(240 / scrDpt)` at the game's 4:3).
 */
export interface FfxView {
  readonly ref: Vec3;
  /** Yaw of the eye about the look-at, degrees. */
  readonly thetaDeg: number;
  /** Pitch of the eye, degrees; **negative puts the eye above** (FFX's y is down). */
  readonly phiDeg: number;
  readonly len: number;
  readonly scrDpt: number;
}

/** The eye of `view`, in FFX's frame: `ref + len * (cos phi cos theta, sin phi, cos phi sin theta)` (proven against the PS2 capture of the near default view to 0.01). */
export function ffxEye(view: FfxView): [number, number, number] {
  const theta = view.thetaDeg * D2R;
  const phi = view.phiDeg * D2R;
  return [
    view.ref[0] + view.len * Math.cos(phi) * Math.cos(theta),
    view.ref[1] + view.len * Math.sin(phi),
    view.ref[2] + view.len * Math.cos(phi) * Math.sin(theta),
  ];
}

/** The vertical field of view, degrees, of a lens value: 1024 is 26.38 degrees. Vertical, so a wider window widens the picture and keeps the framing (how the Steam build widens 4:3 is Open). */
export function ffxVerticalFov(scrDpt: number): number {
  return (2 * Math.atan(240 / scrDpt)) / D2R;
}

/** A camera rig in the world, the shape `BattleCamera` takes (`position`, `lookAt`, `fov` degrees vertical). FFX's camera does not sway: `sway` is 0. */
export interface WorldRig {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  sway: number;
}

/** The rig that shows `view` in the world: the eye and the look-at through the transform, the vertical field of view of the lens. */
export function ffxRig(view: FfxView): WorldRig {
  return { position: ffxPointTuple(ffxEye(view)), lookAt: ffxPointTuple(view.ref), fov: ffxVerticalFov(view.scrDpt), sway: 0 };
}
