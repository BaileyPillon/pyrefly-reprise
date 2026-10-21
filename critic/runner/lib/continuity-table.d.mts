/** Types for `critic/runner/lib/continuity-table.mjs`, so the unit tests can import it. */
export declare const POSE_MEASURE_REL: string[];
export type PoseTableSource = 'explicit' | 'candidate-root' | 'harness-tree' | 'none';
export declare function resolvePoseMeasure(input: { args: Record<string, unknown>; root: string; exists?: (file: string) => boolean }): { path: string | null; source: PoseTableSource; root: string | null };
export declare function tableRootOf(file: string): string | null;
export declare function parseBuildTag(text: unknown): { release: string | null; sha: string | null };
export declare function candidateTableAt(root: string | null | undefined, sha: string | null | undefined, run?: (...args: never[]) => unknown): { sha256: string; count: number } | null;
export declare function judgeTable(input: {
  loaded: { path?: string; sha256: string; count: number } | null;
  candidate: { sha256: string; count: number } | null;
  buildSha: string | null;
  source: string;
  allowStale?: boolean;
}): { checked: boolean; stale: boolean; fail: boolean; reason: string | null };
