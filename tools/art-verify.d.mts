/** Types for `tools/art-verify.mjs` (release 38, "r38-bytes"): the pixel-identity gate and the art reference audit. */

export interface ArtVerifyResult {
  ok: boolean;
  checked: number;
  webp: number;
  png: number;
  decoded: number;
  problems: string[];
  ms: number;
}

export function verifyShippedArt(options: { distDir: string; publicDir: string; jobs?: number }): Promise<ArtVerifyResult>;
export function artNamesIn(text: string): string[];

export interface ArtAuditResult {
  ok: boolean;
  problems: string[];
  strict: string[];
  dangling: string[];
  baselineDangling: string[] | null;
  newDangling: string[];
  stats: { files: number; strictNames: number; jsNames: number; jsShipped: number; jsDerived: number; provenanceMentions: number; dynamicPieces: number };
  ms: number;
}

export function auditArtReferences(distDir: string, options?: { baselineDir?: string | null }): ArtAuditResult;
export function formatAudit(result: ArtAuditResult): string;
