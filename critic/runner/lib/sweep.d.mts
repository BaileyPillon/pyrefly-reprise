/** Types for `critic/runner/lib/sweep.mjs`, so the unit tests can import it. */
import type { Legibility, Surface, SweepSummary } from './legibility-pure.mjs';

export declare const BOARD_CHAPTERS: readonly string[];
export declare const PHONE_CHAPTERS: readonly string[];
export declare const PREP_CASES: readonly (readonly [string, string, boolean])[];
export declare const MATRIX_SIZES: readonly string[];
export declare const PREP_TABS: number;

/** What a booted chapter gives a sweep (gap-boot.mjs `bootChapter`): the page, the keys, a snapshot function that reads back what it was asked for, the screen reader. */
export interface BootedChapter {
  page: { evaluate(fn: unknown, arg?: unknown): Promise<any>; waitForTimeout(ms: number): Promise<void> };
  input: { press(key: string): Promise<void>; pause(): Promise<void> };
  snap(file: string, state: string, want?: Record<string, unknown>, extra?: Record<string, unknown>): Promise<boolean>;
  scr(): Promise<string | null>;
  fails?: { file?: string; unverified?: string[]; err?: string }[];
  browser: { close(): Promise<void> };
}
export interface SweepCase { key: string; id: string; size: string; touch: boolean; tabs?: number }
export interface SweepOut<R = Record<string, unknown>> { rec: R; surfaces: Surface[] }
export declare function sweepBattleChapter(b: BootedChapter, o: { id: string; size: string; floor?: number }): Promise<SweepOut<{ id: string; size: string; firstMenuAsShown: Legibility; battle: Legibility; battleMenuVerified: boolean; screen: string | null; pause: Legibility | { unverified: string } }>>;
export declare function sweepPrepTabs(b: BootedChapter, o: { id: string; size: string; tabs?: number; floor?: number }): Promise<SweepOut<{ id: string; size: string; tabs: Record<string, unknown>[] }>>;
export declare function sweepMatrixSize(b: BootedChapter, o: { size: string; floor?: number }): Promise<SweepOut<Record<string, any>>>;
export declare function casesFor(job: string, o?: { chapters?: string[] | null; tabs?: number }): SweepCase[];
export declare function runSweepJob(o: {
  job: string; base: string; evidence: string; floor?: number; chapters?: string[] | null; tabs?: number;
  boot?: (spec: { base: string; evidence: string; id: string; dir: string; size: string; touch: boolean; stopAtPrep: boolean }) => Promise<BootedChapter>;
  save?: (results: Record<string, unknown>) => void; log?: (line: string) => void;
}): Promise<{ results: Record<string, any>; surfaces: Surface[]; summary: SweepSummary; reportLine: string }>;
