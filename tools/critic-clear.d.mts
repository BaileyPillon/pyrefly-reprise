/** Types for `tools/critic-clear.mjs`, so the unit tests can import it directly. */

export interface ClearResult {
  ok: boolean;
  errors: string[];
  settled: { kind: string; result: string }[];
  refused: { kind: string; why: string }[];
  note?: string;
  archived?: boolean;
}

export declare function clearWithReport(root: string, reportPath: string): ClearResult;
export declare function applyStoredReports(root: string, mainSha: string): (ClearResult & { report: string })[];
