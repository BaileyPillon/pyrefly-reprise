/** Types for `tools/live-record.mjs`, so the unit test can import the builder and the renderer directly. */

export interface DeployRow {
  line: number;
  at: string;
  sha: string;
  bundle: string;
  artFiles: number;
  status: string;
  override: string;
  host: string;
}

export interface Obligation {
  kind: string;
  status: string;
  requires: string;
  carriedFrom?: string[];
}

export interface Marker {
  mainSha?: string;
  bundle?: string;
  deployedAt?: string;
  artifactHash?: string;
  liveArtifact?: { result: string; checked: number };
  ownerOverride?: { words?: string };
  obligations?: Obligation[];
}

export interface ReportIssue {
  id: string;
  severity: string;
  title: string;
  introducedByCandidate?: boolean;
  regressionVsLive?: boolean;
}

export interface Report {
  file: string;
  data: { verdicts?: Record<string, string>; issues?: ReportIssue[] };
}

export interface InFlight {
  asOf: string | null;
  note: string;
  branches: { name: string; tip: string; case: string; what: string }[];
}

export interface LiveModel {
  live: DeployRow;
  after: DeployRow[];
  recent: DeployRow[];
  marker: { state: 'pending' | 'cleared' | 'missing'; data: Marker | null };
  pending: { sha: string; data: Marker }[];
  focused: Report | null;
  liveReport: Report | null;
  majors: ReportIssue[];
  changelog: string | null;
  inFlight: InFlight;
  deploysSinceDeep: number | null;
}

/** The deploy log as rows (the header and blank lines skipped). */
export declare function parseDeployLog(text: string): DeployRow[];
/** A moment as US Eastern, for example "2026-10-17 19:46 EDT". */
export declare function eastern(iso: string): string;
export declare function loadMarker(root: string, sha: string): LiveModel['marker'];
export declare function loadPending(root: string): LiveModel['pending'];
/** The CHANGELOG entry whose Address line names the sha, or null. */
export declare function changelogEntry(text: string, sha: string): string | null;
/** Everything docs/LIVE.md says, as data, read from a repository root. */
export declare function buildLive(root: string): LiveModel;
/** docs/LIVE.md for a model from buildLive. */
export declare function renderLive(model: LiveModel): string;
/** Problems with docs/LIVE.md next to what the repository says; an empty list means it is current. */
export declare function checkLive(root: string): string[];
