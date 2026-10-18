/** Types for `tools/posescale/pose-hires.mjs` (pose continuity repair, 2026-10-17): the hi-DPI masters of a painting. */
export const MIN_IOU: number;
export const TIERS: readonly number[];
export interface HiresProblem {
  code: 'hires-size' | 'hires-differs' | 'hires-unreadable';
  tier: number;
  message: string;
}
export function hiresFiles(dir: string, pose: string): Array<[number, string]>;
export function checkHires(dir: string, pose: string, one: { W: number; H: number; mask: Uint8Array }): Promise<HiresProblem[]>;
