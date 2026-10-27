/** Types for `critic/runner/lib/hz-moment.mjs`, so the unit tests can import it. */
import type { JoltTally, WallRow, BeatPair } from './hz-pure.mjs';

export interface Beat { label: string; t: number; f: number }
export declare const NOT_BEATS: ReadonlySet<string>;
export declare function beatsOf(rec: { frames: any[]; events?: any[] }, t0?: number): Beat[];
export declare function alignBeats(byHz: Record<number, Beat[]>): { common: string[]; missing: Record<string, string[]>; hzs: number[]; sets?: Array<Map<string, Beat>> };
export interface SharedRow { k: number; t: number; pos: Record<string, { x: number; y: number; rattle: boolean }> }
export declare function sharedTimeTrace(rec: { frames: any[] }, t0: number, o?: { stepMs?: number; count?: number; pxPerUnit?: number }): Array<SharedRow | null>;
export declare function sharedTimeDeviation(refRows: Array<SharedRow | null>, rows: Array<SharedRow | null>): { compared: number; worstPx: number; perFigure: Record<string, number> };
export interface MomentJudgement {
  hzs: number[]; beatCounts: Record<number, number>; commonBeats: number; missing: Record<string, string[]>;
  wall: Array<{ from: string; to: string; pass: boolean; worst?: number; rows: WallRow[] }>; chain: { pass: boolean; pairs: BeatPair[] };
  shared: Record<number, { compared: number; worstPx: number; perFigure: Record<string, number> }>; jolts: Record<number, JoltTally>;
  pass: boolean; reasons: string[]; beats: Record<number, Beat[]>;
}
export declare function judgeMoment(recs: Record<number, { frames: any[]; events: any[]; t0: number }>, o?: { wallTolerance?: number; beatFrames?: number; minIntervalMs?: number; epsilonMs?: number }): MomentJudgement;
