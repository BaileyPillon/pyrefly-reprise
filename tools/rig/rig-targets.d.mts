/** Types for `tools/rig/rig-targets.mjs` (the rig program): what a rig's keys are fitted to, the approved paintings on the pose model's grid. */
import type { ModelInputs } from '../posescale/pose-model.mjs';

export interface RigTargetPlace { W: number; upp: number; anchor: number; shift: number; mirror: number }
export interface RigTargetPose {
  class: string; band: [number, number] | null; propsOut: boolean; normK: number; registered: boolean;
  stature: number | null; bodyStature: number | null; headReal: number | null; status: string; feetPx: { x: number; row: number } | null; png: string;
  place: RigTargetPlace; mirroredTarget?: true;
}
export interface RigTargets {
  schema: string; subject: string; scale: number;
  grid: { GS: number; GW: number; GH: number; GU0: number; GV1: number };
  gridFromMaster: { ax: number; bx: number; ay: number; by: number };
  poses: Record<string, RigTargetPose>;
  [k: string]: unknown;
}
export function buildTargets(o: { inputs: ModelInputs; subject: string; costume?: string; scale?: number; baseline?: number; poses?: string[]; turn?: string[] }): Promise<{ info: RigTargets; masks: Record<string, Uint8Array> }>;
