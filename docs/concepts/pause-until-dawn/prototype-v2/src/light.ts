/**
 * Relighting: the key light is fixed in the world, so the face's mean
 * luminance should swing by about the spec's +-5 (of 255) levels across the
 * turn range (section 9/11). This is one multiplier the renderer's fragment
 * shader applies per pixel inside the head mask, plus a fixed shadow-side
 * gradient so the far side of the turn reads as turned away from the key.
 */
import { RIG_CONSTANTS } from './constants.ts';

/** yawNorm in [-1, 1] (fraction of `RIG_CONSTANTS.yaw.maxDeg`) -> a multiplicative gain near 1.0. */
export function relightGainForYaw(yawNorm: number): number {
  const levels = RIG_CONSTANTS.image.relightLevels; // +-5 of 255
  const deltaFraction = (levels / 255) * yawNorm;
  return 1 + deltaFraction;
}

/**
 * The asymmetric grade the spec measures (corner means 8.9-34.2 against a
 * centre of 28.7 — "a dark gradient runs toward the bottom-right", section
 * 9). Returns a 0..1 darkening weight for a normalised (u, v) position,
 * (0,0) top-left, (1,1) bottom-right; multiply into the post pass.
 */
export function vignetteWeight(u: number, v: number): number {
  const dx = u - 0.42;
  const dy = v - 0.38;
  const radial = Math.sqrt(dx * dx + dy * dy);
  const towardCorner = Math.max(0, u - 0.5) * 0.6 + Math.max(0, v - 0.5) * 0.6;
  return Math.min(1, radial * 0.9 + towardCorner);
}
