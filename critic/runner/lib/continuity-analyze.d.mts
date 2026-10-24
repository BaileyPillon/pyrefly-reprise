/** Types for `critic/runner/lib/continuity-analyze.mjs`, so the unit tests can import it. */
import type { Anchors, ContinuityConfig, Jerk, SwapRow, Summary } from './continuity-pure.mjs';
import type { PoseMeasure } from './continuity-silhouette.mjs';
import type { ProbeFrame, ProbeMeta } from './continuity-probe.mjs';
import type { WashReport } from './continuity-wash.mjs';
import type { PoseWaivers } from './continuity-waivers.mjs';

export declare function anchorsForPoses(o: { poses: { fig: number; pose: string; url: string | null }[]; fetchImage: (url: string) => Promise<Buffer>; measure: PoseMeasure | null | undefined; waivers?: PoseWaivers | { path: string; error: string } | null }): Promise<{ anchors: (Anchors | null)[]; notes: string[] }>;
export declare function causeOf(logEvents: { n: number; type?: string; [key: string]: unknown }[], n: number, within?: number): { type: string | undefined; actorId: unknown; targetId: unknown; abilityId: unknown; framesBefore: number } | null;
/** The head the player really sees in a key of a rigged figure over the idle's, from the pose registration records (R59, decision 146); null for a key they do not give. */
export declare function realHeadOfRegistration(measure: PoseMeasure | null | undefined, subject: string): (pose: string) => number | null;
export declare function analyzeRun(o: { meta: ProbeMeta; records: ProbeFrame[]; anchors: (Anchors | null)[]; cfg: ContinuityConfig; measure?: PoseMeasure | null }): {
  swaps: (SwapRow & { fi: number; from: number; to: number; startFrame: number })[]; jerks: (Jerk & { figure: string; fi: number; id: number })[]; summary: Summary & { run: Record<string, unknown> };
  perFigure: Record<string, Record<string, unknown>>; coverage: Record<string, unknown>; worst: { swaps: number[]; jerks: number[]; ghosts: number[] }; frameMs: number; cameraCuts: number[]; wash: WashReport; smear: Record<string, unknown> & { planned: number; matched: number; unmatched: number; snapsExcused: number };
  access: { trackAt(fi: number, n: number): { feet: [number, number] | null; head: [number, number] | null; centroid: [number, number] | null } | null; planeAt(fi: number, n: number, k: number): { feet: number[] | null; head: number[] | null; centroid: number[] | null } | null; recordAt(fi: number, n: number): unknown };
};
