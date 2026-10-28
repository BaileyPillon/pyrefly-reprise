/** Types for `critic/runner/lib/pace-record.mjs`, so the unit tests can import it. */
export declare const PACE_INIT: string;
export declare function installRecorder(ctx: { addInitScript(s: unknown): Promise<unknown> }, cfg?: Record<string, unknown>): Promise<void>;
export interface PaceChunk { epoch: number; c: Record<string, any> & { timeOrigin: number; from: number; n: number } }
export interface PaceSegment { timeOrigin: number; n: number; chunks: number; gapFrames: number; fTs: number[]; fStart: number[]; fJs: number[]; fHeap: number[]; fCbs: number[]; [k: string]: any }
export declare function mergeSegments(chunks: PaceChunk[]): PaceSegment[];
export declare function createDrainer(getPage: () => { evaluate(fn: () => unknown): Promise<any> } | null): { drain(): Promise<void>; start(everyMs?: number): void; finish(): Promise<PaceSegment[]>; readonly lost: number };
export declare function mainSegment(segs: PaceSegment[]): PaceSegment | null;
export declare function readRun(file: string): Promise<{ meta: any; page: any }>;
