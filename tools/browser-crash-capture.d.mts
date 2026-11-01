/** Types for `tools/browser-crash-capture.mjs` (the Playwright objects are left loose on purpose: the tool is a script, not a library). */
export declare const CRASH_LAUNCH_ARGS: readonly string[];
export declare const HEAP_EVERY_MS: number;
export declare const PROC_EVERY_MS: number;
export declare const HEAP_RING: number;
export declare const PROC_RING: number;
export declare const CONSOLE_RING: number;
export interface Ring<T> { push(x: T): void; toArray(): T[]; last(): T | null; readonly size: number }
export declare function makeRing<T = any>(capacity: number): Ring<T>;
export declare class TargetCrashedError extends Error { crash: CrashStamp | null; constructor(message: string, crash?: CrashStamp | null) }
/** Is this error the browser target dying ("Target crashed", "Page crashed", a TargetCrashedError), as against a content failure? */
export declare function isTargetCrashed(err: unknown): boolean;
/** Put the capture's crash stamp on an error (if it has none); returns the error. */
export declare function annotateCrash<E>(err: E, capture: { state: { crash: CrashStamp | null } } | null | undefined): E;
export interface HeapRow { t: number; heapUsedMB: number; heapTotalMB: number; nodes: number | null; docs: number | null; listeners: number | null; layouts: number | null; recalcs: number | null }
export interface ProcRow {
  t: number; why: string; nv: string | null; hostCpu: number | null; hostFreeGB: number | null; gpuDedTotalMB: number | null; gpuOthers: string[] | null;
  procs: { id: number; type: string; cpu: number | null; wsMB: number; privMB: number; gpuDedMB: number; gpuShrMB: number }[];
}
export declare function shapeHeapRow(t: number, metrics: { name: string; value: number }[]): HeapRow;
export declare function shapeProcRow(o: { t: number; why: string; types?: Record<number, { type: string; cpu: number }>; mem?: any; nv?: string | null }): ProcRow;
export declare function defaultSampleProcesses(pids: number[]): Promise<{ mem: any; nv: string | null }>;
export declare function defaultDumpFile(tag?: string): string;
export interface CrashStamp { atMs: number; wallClock: string; lastHeap: HeapRow | null; lastProc: ProcRow | null; afterCrashProc?: ProcRow | null }
export interface CrashCapture {
  state: { crash: CrashStamp | null; closedAtMs: number | null; disconnectedAtMs: number | null; sampling: boolean; cdpError: string | null };
  heap: Ring<HeapRow>; procs: Ring<ProcRow>; console: Ring<{ t: number; type: string; text: string }>;
  snapshot(): unknown; dump(file?: string | null): string | null; stop(): void;
  heapSample(): Promise<void>; procSample(why?: string): Promise<void>; crashed(): CrashStamp | null; assertAlive(): void;
}
export declare function attachCrashCapture(o: {
  browser?: any; context?: any; page: any; t0?: number; dumpFile?: string | null; sample?: boolean; heapEveryMs?: number; procEveryMs?: number;
  sampleProcesses?: (pids: number[]) => Promise<{ mem: any; nv: string | null }>; log?: (m: string) => void; now?: () => number;
}): Promise<CrashCapture>;
export type CrashRetryResult<T> =
  | { status: 'OK'; value: T; attempts: number; crashes: unknown[] }
  | { status: 'UNVERIFIED'; reason: string; attempts: number; crashes: unknown[] };
/** Run a browser job; a crash of the browser target is retried once on a fresh browser, then UNVERIFIED; any other error is rethrown unchanged. */
export declare function runWithCrashRetry<T>(attempt: (attempt: number) => Promise<T>, o?: { retries?: number; log?: (m: string) => void }): Promise<CrashRetryResult<T>>;
