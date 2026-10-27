/** Types for `critic/runner/lib/continuity.mjs`, so the unit tests can import it. */
import type { ContinuityConfig } from './continuity-pure.mjs';

export declare function continuityConfig(root?: string): ContinuityConfig & Record<string, unknown>;
/** The pose waiver ledger a run reads: `--pose-waivers`, else beside the registration records, else the repository's own; null when the policy does not honour waivers or there is none. */
export declare function waiverPathFor(o: { poseMeasurePath?: string | null; poseWaiversPath?: string | null; cfg: Pick<ContinuityConfig, 'waivers'>; root?: string }): string | null;
export interface ChapterResult { chapter: string; dir?: string; game?: string; summary?: Record<string, any> | null; checks?: Record<string, { result: string; reasons?: string[] }>; strips?: { file: string | null }[]; unverified?: string[] | null; /** the probe's stats (fps, ...) as continuity.json carries them, and whether the dedicated harness ran it (PR-0450 d) */ probe?: { fps?: number | null } | null; dedicated?: boolean | null }
export declare function aggregate(results: ChapterResult[], cfg: ContinuityConfig): {
  schema: string; battleSeconds: number; counted: number; swaps: number;
  size: Record<string, number>; motion: Record<string, number | null>;
  checks: Record<'CHK-026' | 'CHK-027', { result: string; reasons: string[]; note?: string }>;
  /** W4: the whole run's frame-time number (the chapters' long frames added up, the worst p99 and maximum), null when no chapter carried one. */
  frameTime: { frames: number; longFrames: number; longFramePct: number; worstP99Ms: number; maxMs: number; longMs: number } | null;
  chapters: ({ chapter: string; jerksCovered: number; fps: number | null; dedicated: boolean | null } & Record<string, unknown>)[];
  reportLine: string;
};
export declare function runContinuity(argv: string[]): Promise<unknown>;
/** Step 0 (post-conference motion plan): the pose table a stamp names (`measure` is what `loadPoseMeasure` gave; `judged` what `judgeTable` said, or null). */
export declare function poseTableStamp(measure: { path?: string; sha256: string; count: number }, source: string | null | undefined, buildSha: string | null | undefined, judged: { checked: boolean; stale: boolean } | null | undefined): { path: string | undefined; sha256: string; subjects: number; source: string; buildSha: string | null; isCandidate: boolean | null };
