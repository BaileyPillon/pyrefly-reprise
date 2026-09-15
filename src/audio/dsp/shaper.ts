/** Saturation, soft clipping and panning. */

import type { Stereo } from './buffer.ts';

/**
 * Cubic soft clipper: transparent below ~0.66, rounds the top off above it and
 * hard-limits at ±1. `drive` boosts before the curve.
 */
export function softClip(x: number, drive = 1): number {
  const v = x * drive;
  if (v <= -1) return -2 / 3;
  if (v >= 1) return 2 / 3;
  return v - (v * v * v) / 3;
}

/** Soft clipper normalised so unity in stays roughly unity out. */
export function softClipNorm(x: number, drive = 1): number {
  return softClip(x, drive) * 1.5;
}

/** tanh-style saturation; warmer than the cubic clipper, good on brass/bass. */
export function saturate(x: number, drive = 2): number {
  const v = x * drive;
  return Math.tanh(v) / Math.tanh(drive);
}

/** Bit-of-grit asymmetric shaper for machina / mechanical SFX. */
export function crunch(x: number, amount = 0.5): number {
  const k = (2 * amount) / Math.max(0.0001, 1 - amount);
  return ((1 + k) * x) / (1 + k * Math.abs(x));
}

export function applySoftClip(buf: Stereo, drive = 1): void {
  for (let i = 0; i < buf.left.length; i++) {
    buf.left[i] = softClipNorm(buf.left[i]!, drive);
    buf.right[i] = softClipNorm(buf.right[i]!, drive);
  }
}

export interface PanGains {
  left: number;
  right: number;
}

/** Equal-power pan. `pan` is -1 (hard left) .. 0 (centre) .. 1 (hard right). */
export function panGains(pan: number): PanGains {
  const p = Math.min(1, Math.max(-1, pan));
  const angle = ((p + 1) * Math.PI) / 4;
  return { left: Math.cos(angle), right: Math.sin(angle) };
}

/** Widen a stereo pair by mid/side scaling. `width` 0 = mono, 1 = as-is, 2 = wide. */
export function applyWidth(buf: Stereo, width: number): void {
  for (let i = 0; i < buf.left.length; i++) {
    const l = buf.left[i]!;
    const r = buf.right[i]!;
    const mid = (l + r) * 0.5;
    const side = (l - r) * 0.5 * width;
    buf.left[i] = mid + side;
    buf.right[i] = mid - side;
  }
}

/** Convert a linear gain to decibels (for logging peak levels). */
export function toDb(gain: number): number {
  return gain <= 0 ? -Infinity : 20 * Math.log10(gain);
}
