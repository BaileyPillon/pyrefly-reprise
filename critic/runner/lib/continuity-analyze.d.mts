/** Types for `critic/runner/lib/continuity-analyze.mjs`, so the unit tests can import it. */
import type { Anchors, ContinuityConfig, Jerk, SwapRow, Summary } from './continuity-pure.mjs';
import type { PoseMeasure } from './continuity-silhouette.mjs';
import type { ProbeFrame, ProbeMeta } from './continuity-probe.mjs';

export declare function anchorsForPoses(o: { poses: { fig: number; pose: string; url: string | null }[]; fetchImage: (url: string) => Promise<Buffer>; measure: PoseMeasure | null | undefined }): Promise<{ anchors: (Anchors | null)[]; notes: string[] }>;
export declare function causeOf(logEvents: { n: number; type?: string; [key: string]: unknown }[], n: number, within?: number): { type: string | undefined; actorId: unknown; targetId: unknown; abilityId: unknown; framesBefore: number } | null;
export declare function analyzeRun(o: { meta: ProbeMeta; records: ProbeFrame[]; anchors: (Anchors | null)[]; cfg: ContinuityConfig }): {
  swaps: (SwapRow & { fi: number; from: number; to: number; startFrame: number })[]; jerks: (Jerk & { figure: string; fi: number; id: number })[]; summary: Summary & { run: Record<string, unknown> };
  perFigure: Record<string, Record<string, unknown>>; coverage: Record<string, unknown>; worst: { swaps: number[]; jerks: number[]; ghosts: number[] }; frameMs: number; cameraCuts: number[];
  access: { trackAt(fi: number, n: number): { feet: [number, number] | null; head: [number, number] | null } | null; planeAt(fi: number, n: number, k: number): { feet: number[] | null; head: number[] | null } | null; recordAt(fi: number, n: number): unknown };
};
