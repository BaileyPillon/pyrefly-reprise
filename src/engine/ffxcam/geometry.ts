/**
 * **The camera's geometry** (`D:\Tools\ffx-parity\camera\CAMERA.md` 1.1 and 1.2): the polar rule that turns "this far from the look-at, at this yaw and pitch" into an eye position, and the lens.
 *
 * - **Polar rule** (Proven against the PS2 capture of the near default view to 0.01): `eye = ref + len * (cos(phi) cos(theta), sin(phi), cos(phi) sin(theta))`, angles in radians here (the scripts
 *   speak degrees and `./calls.ts` converts), Y down, so a negative pitch puts the eye ABOVE the look-at.
 * - **Lens**: the vertical field of view is `2 * atan(240 / scrDpt)` at the game's 4:3, so `scrDpt` 1024 is 26.38 degrees, 724 is 36.7 and 1824 is 15.0.
 * - **The window's lens** ({@link screenFovDeg}, FOC46-05): what that lens becomes in a window of another shape. Wider than 4:3 it is unchanged (Hor+); narrower, FFX's 4:3 horizontal field is kept and the vertical one
 *   grows, up to a cap.
 *
 * Pure numbers. Game case: FFX only.
 */

import type { Vec3 } from './ir.ts';

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

/** `base` plus `len` along the (yaw, pitch) direction. */
export const polarToCart = (base: Vec3, theta: number, phi: number, len: number): Vec3 => [
  base[0] + len * Math.cos(phi) * Math.cos(theta),
  base[1] + len * Math.sin(phi),
  base[2] + len * Math.cos(phi) * Math.sin(theta),
];

/** The inverse: `p`'s (yaw, pitch, length) about `base`. */
export function cartToPolar(p: Vec3, base: Vec3): Vec3 {
  const dx = p[0] - base[0];
  const dy = p[1] - base[1];
  const dz = p[2] - base[2];
  const len = Math.hypot(dx, dy, dz);
  return [Math.atan2(dz, dx), len === 0 ? 0 : Math.asin(Math.max(-1, Math.min(1, dy / len))), len];
}

/** The vertical field of view, in degrees, of a lens value (`camSetScrDpt`). */
export const vfovDeg = (scrDpt: number): number => 2 * Math.atan(240 / scrDpt) * R2D;

/** The shape FFX frames every shot for: a 4:3 television. The lens values above are the vertical field of view of a frame this shape. */
export const FFX_FRAME_ASPECT = 4 / 3;

/**
 * The widest vertical field of view, in degrees, a window narrower than {@link FFX_FRAME_ASPECT} is drawn with (see {@link screenFovDeg}): **the painted plate's own height** from the eye it is laid for
 * (`./plate.ts`: 92.6 world units seen from 80 away, 60.1 degrees). A frame taller than the painting shows the void above and below it at any pitch, so a very tall window gets a little less of FFX's width rather
 * than more of the void. `tests/unit/ffxcam-aspect.test.ts` pins the number against the plate's.
 */
export const MAX_SCREEN_VFOV_DEG = 60;

/**
 * The vertical field of view, in degrees, a window of `aspect` (width over height of **what the player sees**, not of the canvas: an upright phone shows a 3:4 slice of a 16:9 render) is drawn with for a shot whose
 * lens says `fovDeg` at FFX's own 4:3 (FOC46-05).
 *
 * - A window **as wide as 4:3, or wider** keeps FFX's vertical field and widens sideways (Hor+): `fovDeg` itself, to the bit. That is every desktop window and a phone held sideways.
 * - A **narrower** window (an upright tablet; the slice of an upright phone) keeps FFX's **4:3 horizontal field**, `2 * atan(tan(fov / 2) * (4 / 3) / aspect)`, which makes the vertical field taller. Hor+ would give a 3:4
 *   window a horizontal field of about 20 degrees where FFX's frame has 34.7, and the boss would stand outside it.
 * - It is never narrower than the shot's own lens and never taller than {@link MAX_SCREEN_VFOV_DEG} unless the shot's own lens already is, it is continuous at 4:3, and a non-positive or non-numeric aspect (or lens)
 *   leaves the lens alone.
 *
 * One definition: the camera sink draws it (`./sink.ts`), and the in-frame test the safety net and the audit use (`./framing.ts`) and the plate fit (`./plateFit.ts`) read the camera it draws.
 */
export function screenFovDeg(fovDeg: number, aspect: number): number {
  if (!(aspect > 0) || aspect >= FFX_FRAME_ASPECT || !Number.isFinite(fovDeg)) return fovDeg;
  const keepHorizontal = 2 * Math.atan(Math.tan((fovDeg * D2R) / 2) * (FFX_FRAME_ASPECT / aspect)) * R2D;
  return Math.max(fovDeg, Math.min(keepHorizontal, MAX_SCREEN_VFOV_DEG));
}
