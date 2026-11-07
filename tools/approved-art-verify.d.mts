/** Types for `tools/approved-art-verify.mjs` (r76c review, MINOR 5): every pinned painting is in `public/art` with its recorded hash. */

export const PIN_LISTS: string[];

export interface ApprovedArtResult {
  /** Pins whose file exists with the recorded hash. */
  ok: number;
  /** Files that exist with another hash than a pin records (one entry per pin). */
  bad: string[];
  /** Files a pin names that are not under the root (one entry per pin). */
  missing: string[];
  /** Pins read from the lists. */
  pins: number;
}

export function verifyApprovedArt(options: { root: string; lists?: string[]; artDir?: string }): ApprovedArtResult;
export function approvedArtRefusal(result: ApprovedArtResult): string;
export function enforceApprovedArt(options: { root: string; log?: (line: string) => void; fail: (message: string) => never | void; lists?: string[]; artDir?: string }): ApprovedArtResult;
