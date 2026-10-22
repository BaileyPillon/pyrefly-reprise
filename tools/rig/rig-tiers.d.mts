/** Types for `tools/rig/rig-tiers.mjs` (the rig program): a rig's half-size texture tier. */
export const TIER_RULE: string;
export const TIER_DIR: string;
export interface RawImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}
export type Size = [number, number];
export interface PartTextureSizes {
  map: Size;
  rim: Size | null;
  /** The HD-2D look's normal piece (format v2 `normal`), when the part has one: one size, no 1x twin. */
  normal?: Size;
}
export function rigImageNames(raw: Record<string, any>): string[];
export function rigShippedNames(raw: Record<string, any>): string[];
export function pngSize(file: string): { width: number; height: number } | null;
export function rimNeedsHalving(rim: { width: number; height: number }, map: { width: number; height: number }): boolean;
export function twinSizes(map: Size, rim: Size | null): { map: Size; rim: Size | null; map1x: Size; rim1x: Size | null };
export function textureSizes(raw: Record<string, any>, dir: string): Record<string, PartTextureSizes>;
export function halve(img: RawImage): RawImage;
export function readImage(file: string): Promise<RawImage>;
export function encodeImage(img: RawImage): Promise<Buffer>;
export function writeTiers(dir: string): Promise<{ written: string[] }>;
export function verifyTiers(dir: string): Promise<{ ok: boolean; problems: string[]; checked: number; bytes: number; texels: number }>;
export function hasCompleteTier(dir: string): boolean;
