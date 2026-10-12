/** Types for `critic/runner/lib/continuity.mjs`, so the unit tests can import it. */
import type { ContinuityConfig } from './continuity-pure.mjs';

export declare function continuityConfig(root?: string): ContinuityConfig & Record<string, unknown>;
export interface ChapterResult { chapter: string; dir?: string; game?: string; summary?: Record<string, any> | null; checks?: Record<string, { result: string; reasons?: string[] }>; strips?: { file: string | null }[]; unverified?: string[] | null; /** the probe's stats (fps, ...) as continuity.json carries them, and whether the dedicated harness ran it (PR-0450 d) */ probe?: { fps?: number | null } | null; dedicated?: boolean | null }
export declare function aggregate(results: ChapterResult[], cfg: ContinuityConfig): {
  schema: string; battleSeconds: number; counted: number; swaps: number;
  size: Record<string, number>; motion: Record<string, number | null>;
  checks: Record<'CHK-026' | 'CHK-027', { result: string; reasons: string[] }>;
  chapters: ({ chapter: string; jerksCovered: number; fps: number | null; dedicated: boolean | null } & Record<string, unknown>)[];
};
export declare function runContinuity(argv: string[]): Promise<unknown>;
