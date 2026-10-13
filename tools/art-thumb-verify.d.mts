/** Types for `tools/art-thumb-verify.mjs` (r44-thumbs): the gate that proves a build's strip thumbnails are what they claim to be. */

export interface ThumbVerifyResult {
  /** Record entries examined. */
  checked: number;
  webp: number;
  png: number;
  /** Entries that record no thumbnail (a master the tool refused, or one already no larger than a thumbnail). */
  none: number;
  /** False when the build says (or lacks a section that would say) it made none. */
  enabled: boolean;
  problems: string[];
}

export function verifyShippedThumbs(options: { distDir: string; publicDir: string; listFile?: string | null; jobs?: number }): Promise<ThumbVerifyResult>;
