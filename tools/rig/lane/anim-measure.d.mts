import type { ClipRig } from '../../../src/engine/rig/anim/AnimClip.ts';

/** Where a posed rig is, in painting px (y grows down; the floor is `baselineY`). */
export interface Measure {
  low: number;
  left: number;
  right: number;
  top: number;
  feet: [number, number] | null;
}

export function measurer(rigDir: string): Promise<{
  rt: unknown;
  rig: ClipRig;
  baselineY: number;
  pose(channels: Float64Array): Measure;
  landmark(channels: Float64Array, name: string): [number, number] | null;
}>;
