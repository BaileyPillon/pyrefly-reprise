/**
 * LIVING PAINTINGS, A-7 "Backdrops with a floor and a sky": the pure half of the plate defocus.
 * No DOM and no `three`, so vitest runs it in Node.
 *
 * The approved target (docs/concepts/polish/living-backdrops, the "after" frame) shows the camera at the
 * extreme of its move with the lens focused on the plate the party stands on: the far ridge and the sky go
 * soft, and the nearer the plate is to the focus the sharper it stays. Three rules make that safe:
 *
 * - **The resting frame is the painting.** The defocus weight follows how far the drift has carried the
 *   camera off its rest pose, and is exactly 0 at rest, so the plates composite back to the approved PNG
 *   there (`plateMaths.compositeAtRest`) and with REDUCE MOTION on (no drift, so no defocus).
 * - **Defocus is a sampling choice** (a mip bias per plate in the plate's own material), never a change to
 *   the painted pixels: no extra pass, no cut-out halo round the figures (research/visual-bible.md 6.4).
 * - **A per-room cap** (`maxBias`), because the blur is the easiest thing to overdo: too much and the
 *   approved painting stops being legible (the card's own risk note).
 *
 * Game case: both (shared plumbing); each room's cap is its own.
 */

import type { DriftOffset, DriftSpec } from './CameraDrift.ts';
import { smoothstep } from './plateMaths.ts';

/** How fast the blur grows with distance from the focus (the mock's `abs(p - focus) ** 0.85`). */
export const FOCUS_GAMMA = 0.85;

/** The default cap, in mip levels, for the plate farthest from the focus at the drift's extreme. */
export const FOCUS_MAX_BIAS = 2.2;

/**
 * Each plate's circle of confusion as a share of the largest, 0 on the focus plate. A lens' blur
 * grows with the difference of inverse distances, so plates close together in depth stay close in blur.
 * `distances` are metres (world units) from the reference camera, one per plate; `focus` is the index of
 * the plate in focus.
 */
export function focusAmounts(distances: readonly number[], focus: number, gamma = FOCUS_GAMMA): number[] {
  const inv = distances.map((d) => 1 / Math.max(0.5, d));
  const f = inv[Math.min(inv.length - 1, Math.max(0, focus))] ?? 0;
  let span = 0;
  for (const v of inv) span = Math.max(span, Math.abs(v - f));
  if (span < 1e-9) return inv.map(() => 0);
  return inv.map((v) => Math.pow(Math.abs(v - f) / span, gamma));
}

/**
 * How far the drift has carried the camera off rest, 0..1: the lateral swing counts in full (it is what
 * the parallax shows), the lift and the push at 0.4 of theirs. `d` already carries the drift's own weight,
 * so this is 0 when the drift is off, easing in, or cut by a rig move.
 */
export function driftExtent(d: DriftOffset, spec: DriftSpec): number {
  const x = d.x / (spec.lateral * 1.18);
  const y = (0.4 * d.y) / Math.max(1e-6, spec.vertical);
  const z = (0.4 * d.z) / Math.max(1e-6, spec.dolly);
  return Math.min(1, Math.hypot(x, y, z));
}

/** The defocus weight for a drift extent: 0 until the camera is a fifth of the way out, full near the extreme. */
export function focusWeight(extent: number): number {
  return smoothstep(0.2, 0.85, extent);
}

/** The mip bias for each plate, given its amount, the weight, the room's cap and the strength dial. */
export function plateBiases(amounts: readonly number[], weight: number, maxBias: number, dial = 1): number[] {
  const k = Math.max(0, weight) * Math.max(0, maxBias) * Math.max(0, dial);
  return amounts.map((a) => a * k);
}
