export interface ImageRgba {
  data: ArrayLike<number>;
  w: number;
  h: number;
}
export interface Geometry {
  head: readonly number[];
  feetRow: number;
}
export interface RegionProfile {
  n: number;
  meanL: number;
  q: Float64Array[];
}
export interface RegionsResult {
  by: 'registration' | 'silhouette' | null;
  regions: Record<string, RegionProfile | null>;
}
export interface IdentityDistance {
  per: Record<string, number | null>;
  worst: number | null;
}
export interface IdentityJudgement {
  distance: IdentityDistance;
  ceiling: Record<string, number>;
  ceilingAny: Record<string, number | null>;
  ratio: number | null;
  over: string[];
  verdict: 'pass' | 'watch' | 'fail' | 'unread';
  pass: boolean;
  unread: boolean;
}
export const SOLID_ALPHA: number;
export const MIN_CEILING: number;
export const MIN_PIXELS: number;
export const FAIL_RATIO: number;
export const WATCH_RATIO: number;
export const REGIONS: readonly string[];
export const FALLBACK_CUTS: readonly number[];
export const HEAD_GROW: { up: number; down: number };
export function rgbToLab(r: number, g: number, b: number): [number, number, number];
export function verticalExtent(img: ImageRgba, minRun?: number): { top: number; base: number } | null;
export function regionRows(img: ImageRgba, geometry?: Geometry | null): { head: [number, number]; body: [number, number]; legs: [number, number]; by: 'registration' | 'silhouette' } | null;
export function readRegions(img: ImageRgba, geometry?: Geometry | null): RegionsResult;
export function regionDistance(p: RegionProfile | null, q: RegionProfile | null): number | null;
export function identityDistance(a: RegionsResult, b: RegionsResult): IdentityDistance;
export function judgeIdentity(o: { idle: RegionsResult; pose: RegionsResult; attack?: RegionsResult | null; others?: RegionsResult[] }): IdentityJudgement;
