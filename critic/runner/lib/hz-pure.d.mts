/** Types for `critic/runner/lib/hz-pure.mjs`, so the unit tests can import it. */
export declare const HZ_RATES: readonly number[];
export declare function frameMsFor(hz: number): number[];
export declare function stepsTotal(hz: number, n: number): number;

export interface WallRow { hz: number; ms: number; ratio: number | null; deviation: number | null }
export declare function wallTimeEquality(runs: Array<{ hz: number; ms: number }>, o?: { tolerance?: number; reference?: number }): { pass: boolean; reason?: string; referenceHz?: number; tolerance?: number; worst?: number; rows: WallRow[] };
export interface BeatPair { hz: number; vs: number; beats: number; worstMs: number; worstBeat: number; allowedMs: number; pass: boolean; lengthMismatch: boolean }
export declare function chainedBeatEquality(runs: Array<{ hz: number; beats: number[] }>, o?: { frames?: number }): { pass: boolean; reason?: string; frames?: number; pairs: BeatPair[] };

export declare function speedSeries(samples: Array<{ t: number; x: number }>): number[];
export interface Jolt { i: number; t: number; vBefore: number; vAfter: number; jump: number; share: number }
export declare function findJolts(samples: Array<{ t: number; x: number }>, o?: { minJump?: number; minShare?: number; windowMs?: number; skip?: number; mergeMs?: number }): Jolt[];
export declare function classifyJolt(row: Record<string, any> | null | undefined, frame?: { hs?: number | null }): string;
export interface ClassedJolt extends Jolt { id: string; axis: 'x' | 'y'; class: string; pose: string | null }
export declare function joltsOfRecording(frames: Array<{ t: number; hs?: number | null; actors?: Record<string, Record<string, any>> }>, o?: { pxPerUnit?: number; minJump?: number; minShare?: number; windowMs?: number; skip?: number; mergeMs?: number }): ClassedJolt[];
export interface JoltTally { total: number; seconds: number; perMinute: number | null; maxJump: number; byClass: Record<string, number>; shareByClass: Record<string, number> }
export declare function joltTally(jolts: Array<{ class: string; jump: number }>, seconds: number): JoltTally;
export declare function joltGate(tally: JoltTally, baseline: { perMinute?: number; seconds?: number; byClass?: Record<string, number> } | null | undefined, o?: { maxRise?: number; declared?: string[] }): { pass: boolean; reasons: string[] };
