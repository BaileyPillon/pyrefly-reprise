/** Types for `tools/anime/retarget.mjs`: clips copied between two Meshy 24-joint GLBs by bone name. */
import type { Glb } from './glbkit.mjs';

export declare function sample(times: ArrayLike<number>, vals: ArrayLike<number>, nc: number, t: number, slerp: boolean): number[];

export interface RetargetReport {
  name: string;
  keys: number;
  seconds: number;
  lift: number;
  toeBefore: [number, number];
  toeAfter: [number, number];
  rest: number;
}

/** Retarget `maps` ([source name, target name]) from `src` onto `dst` in place; `report: true` changes nothing. */
export declare function retargetClips(dst: Glb, src: Glb, maps: ReadonlyArray<readonly [string, string]>, opts?: { calib?: 'median' | 'first'; report?: boolean }): { reports: RetargetReport[]; ratio: number; root: string };
