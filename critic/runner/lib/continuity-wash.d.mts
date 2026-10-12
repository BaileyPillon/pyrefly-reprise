/** Types for `critic/runner/lib/continuity-wash.mjs`, so the unit tests can import it. */
import type { ContinuityConfig, Jerk } from './continuity-pure.mjs';
import type { ProbeMeta } from './continuity-probe.mjs';

export declare const WASH_SELECTOR: string;
export declare const WASH_MIN_COVER: number;
export interface WashPolicy { excuse: boolean; minCover: number; selector: string | null }
export interface WashOverStep { opacity: number; cover: number; frames: [number, number] }
export declare function washPolicy(cfg: Pick<ContinuityConfig, 'wash'> | Partial<ContinuityConfig> | null | undefined): WashPolicy;
export declare function washCover(opacity: number, alpha: number | null | undefined): number;
export declare function washTable(records: { n: number; w?: number }[]): Map<number, number>;
export declare function washOverStep(n: number, table: Map<number, number>, alpha: number | null | undefined): WashOverStep | null;
export declare function tagWash(jerks: Pick<Jerk, 'n'>[], o: { records: { n: number; w?: number }[]; alpha: number | null | undefined; policy: Pick<WashPolicy, 'excuse' | 'minCover'> }): number;
export interface WashReport {
  selector: string | null; alpha: number | null; excuse: boolean; minCover: number; framesSeen: number; maxOpacity: number;
  spans: { from: number; to: number; frames: number; ms: number }[]; jerksUnderWash: number; jerksCovered: number; worstCoveredPx: number; readError?: string;
}
export declare function washReport(o: { records: { n: number; w?: number }[]; meta: Pick<ProbeMeta, 'wash'> | null | undefined; policy: WashPolicy; jerks: Jerk[]; frameMs?: number }): WashReport;
