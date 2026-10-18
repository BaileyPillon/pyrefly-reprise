/** Types for `tools/posescale/pose-pixels.mjs` (pose continuity, W1): the pixel half of the pose model. */
export interface Measured {
  pose: string;
  W: number;
  H: number;
  /** 1 where the alpha is over 128. */
  mask: Uint8Array;
  bbox: number[];
  sidecar: Record<string, unknown>;
  hasSidecar: boolean;
  sha: string;
  /** Nothing opaque in the painting. */
  empty: boolean;
  /** Opaque pixels. */
  area: number;
  engineBase: number | null;
  engineBox: { x0: number; x1: number; y0: number; y1: number } | null;
  stance: { x: number; row: number; x0: number; x1: number } | null;
  mass: number;
  proneRaw: boolean;
}
export function readPaint(pngPath: string, pose: string): Promise<Measured>;
export function readAlpha(path: string): Promise<{ W: number; H: number; a: Uint8Array }>;
export function headBoxOn(m: Pick<Measured, 'W' | 'H' | 'mask' | 'bbox' | 'empty'>, head: readonly number[] | null | undefined): { cy: number; coverage: number } | null;
export function drawnMask(p: Pick<Measured, 'W' | 'H' | 'mask'>, upp: number, anchor: number, shift: number, mirror: number): Uint8Array;
export function maskIou(a: Uint8Array, b: Uint8Array): number | null;

/** The common grid every silhouette is drawn on: `GS` cells per idle height, u from `GU0` to `GU1` (right), v from `GV0` to `GV1` (up); `GW` x `GH` cells. */
export const GRID: Readonly<{ GS: number; GW: number; GH: number; GU0: number; GU1: number; GV0: number; GV1: number }>;
