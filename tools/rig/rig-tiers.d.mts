/** Types for `tools/rig/rig-tiers.mjs` (the rig program): a rig's half-size texture tier. */
export const TIER_RULE: string;
export const TIER_DIR: string;
export interface RawImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}
export function rigImageNames(raw: Record<string, any>): string[];
export function halve(img: RawImage): RawImage;
export function readImage(file: string): Promise<RawImage>;
export function encodeImage(img: RawImage): Promise<Buffer>;
export function writeTiers(dir: string): Promise<{ written: string[] }>;
export function verifyTiers(dir: string): Promise<{ ok: boolean; problems: string[]; checked: number; bytes: number; texels: number }>;
export function hasCompleteTier(dir: string): boolean;
