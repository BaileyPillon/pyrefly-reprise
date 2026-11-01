/** Types of `tools/sky-plate-read.mjs` (the sky read of the Farplane's two plates; FFX-2 only). */
export interface SkyBand {
  readonly id: string;
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}
export const BANDS: Readonly<Record<'v' | 'xi', SkyBand>>;
export interface RegionStats {
  pixels: number;
  mean: number;
  over240: number;
  over235: number;
}
export function luma(r: number, g: number, b: number): number;
export function regionStats(data: ArrayLike<number>, width: number, channels: number, x0: number, x1: number, y0: number, y1: number): RegionStats;
export function skyRead(data: ArrayLike<number>, width: number, height: number, channels: number, key: 'v' | 'xi'): { chapter: string; size: string; frame: RegionStats; band: RegionStats };
