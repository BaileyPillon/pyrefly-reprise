/** Types for `critic/runner/lib/pace-pure.mjs`, so the unit tests can import it. */
export declare const ANIM_CLAMP_MS: number;
export declare const TIMER_CLAMP_MS: number;
export declare const ENTRY_SEC: number;
export declare const OVER_MS: ReadonlyArray<readonly [string, number]>;
export declare function pct(arr: number[], p: number): number | null;
export declare function battleWindow(screens: Array<[number, string]>, lastStart: number): { b0: number | null; b1: number | null; pauses: Array<[number, number]> };
export interface PaceRow { i?: number; t?: number; rel?: number; iv: number; gap?: number; js?: number; jsPrev?: number; heap?: number; heapPrev?: number; cbs?: number }
export interface PaceStats {
  frames: number; seconds: number | null; fps?: number | null; p50?: number | null; p95?: number | null; p99?: number | null; p999?: number | null; max?: number | null; mean?: number | null;
  over8_3?: number; over16_7?: number; over25?: number; over33?: number; over50?: number; over100?: number; over250?: number;
  over33PerMin?: number | null; over50PerMin?: number | null; over16_7PerMin?: number | null; over8_3PerMin?: number | null;
  animLostMsPerMin?: number | null; timerLostMsPerMin?: number | null; jsMean?: number | null; jsP95?: number | null; jsP99?: number | null;
  [k: string]: unknown;
}
export declare function paceStats(rows: PaceRow[], minutes: number): PaceStats;
export interface PaceDump {
  n: number; timeOrigin: number; fTs: number[]; fStart: number[]; fJs: number[]; fHeap?: number[]; fCbs?: number[];
  screens?: Array<[number, string]>; harness?: Array<[number, string, number]>; harnessCount?: Record<string, number>; gl?: Array<[number, string, number, number, number]>; loaf?: Array<Record<string, unknown> & { t: number; d: number }>;
  gov?: Array<Array<number | null>>; [k: string]: unknown;
}
export declare function frameRows(d: PaceDump, b0: number, b1: number): Array<Required<PaceRow>>;
export interface PaceHeadline { animLostMsPerMin: number | null; steadyAnimLostMsPerMin: number | null; over33PerMin: number | null; over50PerMin: number | null; p99: number | null; entryAnimLostMs: number | null; battleSeconds: number | null }
export interface PaceAnalysis {
  error?: string; battle: { startMs: number | null; endMs: number | null; seconds: number | null; pauses: number; pauseSec: number | null }; entrySec: number;
  all: PaceStats; entry: PaceStats; steady: PaceStats; steadyNoHarness: PaceStats & { note: string }; harness: { counts: Record<string, number>; slowCalls: number; totalMs: number | null };
  screenshots: { n: number; inBattle: number }; headline: PaceHeadline;
}
export declare function analyzePace(o: { dump: PaceDump; meta?: { screenshots?: Array<[number, number]> }; entrySec?: number }): PaceAnalysis;
export declare function headline(a: PaceAnalysis): PaceHeadline;
export declare function headlineText(label: string, a: PaceAnalysis): string;
