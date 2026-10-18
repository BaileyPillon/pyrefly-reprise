/** Types for `tools/rig/rig-silhouette.mjs` (the rig program): a posed key's box, feet and painted front. */
import type { RigSilhouette } from './rig-gate-lib.mjs';

export const BANDS: number;
export const PAINTED_ALPHA: number;
export function footLandmarks(rt: { landmarks: Record<string, unknown> }, prefixes: readonly string[]): string[];
export function silhouetteOf(
  frame: { W: number; H: number; sx: number; sy: number; ox: number; oy: number },
  drawn: { alpha: Uint8Array; k: Float64Array },
  rt: { landmarks: Record<string, { bone: number; x: number; y: number }> },
  footNames: string[],
): RigSilhouette | null;
