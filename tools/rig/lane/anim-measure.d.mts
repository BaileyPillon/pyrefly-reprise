import type { ClipRig } from '../../../src/engine/rig/anim/AnimClip.ts';
import type { BendSpec } from '../../../src/engine/rig/anim/AnimBend.ts';

/** Where a posed rig is, in painting px (y grows down; the floor is `baselineY`). */
export interface Measure {
  low: number;
  left: number;
  right: number;
  top: number;
  feet: [number, number] | null;
}

/** A normalised rig (`rig-format.mjs#normaliseRig`), as much of it as the tests read. */
export interface MeasuredRig {
  bones: Array<{ name: string }>;
  parts: Array<{ name: string; verts: Float32Array | number[] }>;
  [k: string]: unknown;
}

/** `bendSpec` (pass 3): the knee of a skirt with no legs; the rig's clip arrays then carry the pseudo-bone `@bend` after the real bones. */
export function measurer(rigDir: string, bendSpec?: BendSpec | null): Promise<{
  rt: MeasuredRig;
  rig: ClipRig;
  baselineY: number;
  pose(channels: Float64Array): Measure;
  landmark(channels: Float64Array, name: string): [number, number] | null;
}>;
