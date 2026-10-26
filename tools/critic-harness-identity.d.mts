/** Types for `tools/critic-harness-identity.mjs` (which continuity harness read a run, and is it the release tree's own), so the unit tests can import it. */
export declare const STAMP_SCHEMA: 'continuity-harness/1';
export declare const HARNESS_ENTRIES: string[];
export declare const HARNESS_LEFT_OUT: string[];

export interface PoseTableStamp { path?: string | null; sha256: string; subjects?: number | null; source?: string | null; buildSha?: string | null; isCandidate?: boolean | null }
export interface WaiverStamp { path?: string | null; sha256: string | null; rows?: number | null }
export interface HarnessIdentity {
  schema: 'continuity-harness/1';
  /** sha256 over the harness files' blob ids and the policy continuity block's hash (notes and verdict-side keys left out). */
  id: string;
  tree: { root: string; head: string | null; dirty: string[] | null };
  files: Record<string, string>;
  policy: { continuitySha256: string | null; fileSha256: string | null; override: boolean; overrideSha256: string | null };
  probe: { version: number | null; blob: string | null };
  poseTable: PoseTableStamp | null;
  /** The pose-waiver ledger the run read (recorded, not part of the id). */
  waivers: WaiverStamp | null;
  /** The environment the run was started with (recorded, not part of the id). */
  run: { query: string | null; setArt: string | null; browser: string | null };
  changedDuringRun: boolean;
  /** Summary-level only: the id each chapter's own process stamped, and the chapters measured with no stamp (an older run re-aggregated). */
  chapterIds?: string[];
  unstamped?: string[];
  /** Summary-level only: chapters whose own stamp names another harness than the one that started the run. */
  chaptersByOtherHarness?: string[];
  /** Summary-level only: digest of the checks, size and motion objects written under this stamp. */
  aggregateSha256?: string;
}

export declare function blobId(bytes: Uint8Array | string): string;
export declare function canonicalJson(v: unknown): string;
export declare function measuredBlock(v: unknown, top?: boolean): unknown;
export declare function fileSha256(file: string): string | null;
export declare function aggregateDigest(agg: unknown): string;
export declare function summaryStamp(p: { stamp0: HarnessIdentity; stampEnd: HarnessIdentity; results: object[]; tableStamp: PoseTableStamp | null; staleChapters?: string[]; aggregate: unknown }): HarnessIdentity;
export declare function harnessFiles(root: string, entries?: string[], leftOut?: string[]): string[];
export declare function tableAtCommit(root: string | null | undefined, sha: string | null | undefined, run?: (...args: never[]) => unknown): { sha256: string; count: number } | null;
export declare function harnessDigest(files: Record<string, string>, policySha256: string | null | undefined): string;
export declare function harnessIdentity(root: string, opts?: { run?: (...args: never[]) => unknown; env?: Record<string, string | undefined>; poseTable?: PoseTableStamp | null; waivers?: WaiverStamp | null }): HarnessIdentity;
export declare function verifyStamp(h: unknown): string[];
export declare function compareIdentity(stamped: Partial<HarnessIdentity> | null | undefined, expected: Partial<HarnessIdentity> | null | undefined): { same: boolean; files: { path: string; stamped: string | null; expected: string | null }[]; policy: boolean };
export declare function describeIdentity(h: HarnessIdentity): string;
export declare function harnessIdentityErrors(
  report: unknown,
  policy: unknown,
  opts?: { root?: string | null; explicitTree?: boolean; chapterStamp?: boolean; identity?: HarnessIdentity | null; candidateTable?: (root: string, sha: string) => { sha256: string; count: number } | null },
): string[];
