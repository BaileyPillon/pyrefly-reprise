/** Types for `tools/critic-status.mjs`, so the unit tests can import its readers directly. */

export interface ReportSummary {
  file: string; id: string; rubricVersion?: number; review?: string; sha?: string; total?: number | string | null;
  date?: string | null; verdicts?: unknown; parseError?: string;
}

export declare function readReports(dir: string, policy?: unknown): ReportSummary[];
export declare function qualityLine(reports: ReportSummary[], liveSha: string | null | undefined): string;
export declare function lastDeployed(root: string): { sha: string | null; bundle: string | null; at: string } | null;
