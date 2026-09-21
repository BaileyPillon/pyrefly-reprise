/**
 * Types for the pure helper functions exported by `tools/deploy-pages.mjs`,
 * so the unit tests can import them directly instead of shelling out to node
 * (the script itself still runs unguarded via `node tools/deploy-pages.mjs`
 * or `npm run deploy`; it only skips `main()` when imported as a module).
 * Same arrangement as `critic-pending.d.mts`. Declares only the exported pure
 * helpers used by the owner-override gate (critic/RUBRIC.md section 10), not
 * the script's side-effecting `main()` or its unexported internals.
 */

export interface OwnerOverrideParseResult {
  ok: boolean;
  words?: string | null;
  error?: string;
}

/** Validate the raw `--owner-override` flag value. Absent (`undefined`) means no override was requested. */
export declare function parseOwnerOverride(raw: string | boolean | undefined): OwnerOverrideParseResult;

export interface DeepGateResult {
  action: 'proceed' | 'fail' | 'proceed-with-warning';
  message?: string;
  warningLines?: string[];
}

/** What to do when a shared-system change has no validated deep report with a passing changed area. */
export declare function resolveDeepGate(input: {
  deepBeforeDeploy: boolean;
  evidence: string | null;
  ownerOverrideWords: string | null;
}): DeepGateResult;

/** The loud warning block printed (and, on --dry-run, previewed) for an owner override. */
export declare function formatOwnerOverrideWarning(words: string): string[];

/** The `docs/deploys.log` line for one run; `overrideUsed` appends a trailing `override=owner` field. */
export declare function formatDeployLogLine(input: {
  isoNow: string;
  mainSha: string;
  bundleHash: string;
  artFileCount: number;
  status: string;
  overrideUsed?: boolean;
}): string;

/** The newest deep or milestone report on record for this commit, whatever its verdict — informational only. */
export declare function latestDeepReportFor(root: string, mainSha: string): { path: string; changedArea: string | null } | null;
