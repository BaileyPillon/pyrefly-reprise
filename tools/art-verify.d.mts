/** Types for `tools/art-verify.mjs` (release 38, "r38-bytes"): the pixel-identity gate and the art reference audit. */

export interface ArtVerifyResult {
  ok: boolean;
  checked: number;
  webp: number;
  png: number;
  decoded: number;
  /** Whether the decoder-independence test ran (on by default). */
  exact: boolean;
  /** The strip thumbnails (`tools/art-thumb-verify.mjs`): how many entries were checked, of which kinds, and whether the build made any. */
  thumbs: { checked: number; webp: number; png: number; none: number; enabled: boolean };
  /**
   * The art JSON (r46-fix, r47-rc): how many files the master folder holds, how many are painting sidecars (each shipped as only the fields the game reads),
   * how many are not (shipped as they are, local paths replaced), how many of those had a path replaced, and how many keys the sidecars lost.
   */
  sidecars: { checked: number; sidecars: number; others: number; redacted: number; keysDropped: number };
  problems: string[];
  ms: number;
}

/**
 * `exact` (default true): a shipped WebP must be of a master that is opaque, or only alpha 0 and 255 with no colour under alpha 0.
 * Whatever `exact` says, a shipped WebP under `MIN_WEBP_BYTES` (64) is a problem: WebKit cannot load one that small.
 */
export function verifyShippedArt(options: { distDir: string; publicDir: string; jobs?: number; exact?: boolean; listFile?: string }): Promise<ArtVerifyResult>;
export function artNamesIn(text: string): string[];
/**
 * Every art JSON of `public/` is in the build as `shippedArtJsonText` makes it from the master: a painting sidecar cut to the fields the game reads, any other
 * file with its local paths replaced; and the split between the two kinds holds against the master folder (a sidecar has a painting beside it).
 */
export function verifyShippedSidecars(options: { distDir: string; publicDir: string }): { checked: number; sidecars: number; others: number; redacted: number; keysDropped: number; problems: string[] };

export interface ArtAuditResult {
  ok: boolean;
  problems: string[];
  strict: string[];
  dangling: string[];
  baselineDangling: string[] | null;
  newDangling: string[];
  stats: { files: number; strictNames: number; jsNames: number; jsShipped: number; jsDerived: number; thumbRecorded: number; thumbNames: number; provenanceMentions: number; dynamicPieces: number };
  ms: number;
}

export function auditArtReferences(distDir: string, options?: { baselineDir?: string | null }): ArtAuditResult;
export function formatAudit(result: ArtAuditResult): string;
