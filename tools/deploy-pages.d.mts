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

export interface ReleaseGateResult {
  action: 'proceed' | 'fail' | 'proceed-with-warning';
  message?: string;
  warningLines?: string[];
  refusals?: string[];
}

/** A validated candidate review for one commit, with the ship verdict it carries (RULE A). */
export interface ShipEvidence {
  path: string;
  review: 'focused' | 'deep' | 'milestone';
  ship: 'SHIP' | 'HOLD';
}

/** The newest validated focused / deep / milestone report for this commit, deep outranking focused. */
export declare function shipEvidenceFor(root: string, mainSha: string): ShipEvidence | null;

/** May this candidate go public now? The owner's release rules of 2026-09-21, as one pure function. */
export declare function resolveReleaseGate(input: {
  focusedBeforeDeploy: boolean;
  deepBeforeDeploy: boolean;
  evidence: ShipEvidence | null;
  deepOwed?: string[];
  maxDeploysWithDeepOwed?: number;
  ownerOverrideWords: string | null;
}): ReleaseGateResult;

/** The loud warning block printed (and, on --dry-run, previewed) for an owner override. */
export declare function formatOwnerOverrideWarning(words: string, refusals?: string[]): string[];

/** One line saying which review this plan needs before the deploy, and which after it. */
export declare function formatWhenLine(plan: { focusedBeforeDeploy?: boolean; deepBeforeDeploy?: boolean; deepAfterDeploy?: boolean }): string;

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
