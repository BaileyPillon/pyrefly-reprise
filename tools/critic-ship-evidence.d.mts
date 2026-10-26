/** Types for `tools/critic-ship-evidence.mjs` (which review report the release gate may read). */
export interface SkippedReport { path: string; errors: string[] }
export declare function shipEvidenceFor(root: string, mainSha: string, skipped?: SkippedReport[]): { path: string; review: 'focused' | 'deep' | 'milestone'; ship: 'SHIP' | 'HOLD' } | null;
export declare function describeSkipped(skipped: SkippedReport[] | undefined): string;
