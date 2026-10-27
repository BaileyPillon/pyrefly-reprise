/** Types for `critic/runner/lib/continuity-ghostms.mjs`, so the unit tests can import it. */
export interface GhostMsBlock {
  ghostMs: number;
  ghostMsPerMinute: number | null;
  ghostFramesPerMinute: number | null;
  ghostFrames60PerMinute: number | null;
}
export declare const FRAME_MS_60: number;
export declare function ghostMsBlock(counted: Array<{ ghost?: { frames?: number; ms?: number } }>, minutes: number): GhostMsBlock;
export declare function aggregateGhostMs(motions: Array<{ ghostMs?: number; ghostFrames?: number }>, minutes: number): GhostMsBlock | null;
export declare function ghostRateText(motion: { ghostMsPerMinute?: number | null; ghostFrames60PerMinute?: number | null } | null | undefined): string;
