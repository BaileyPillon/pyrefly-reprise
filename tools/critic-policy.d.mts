/**
 * Types for `tools/critic-policy.mjs` (critic policy v2), so the unit tests can
 * import it directly. Same arrangement as `critic-pending.d.mts`.
 */

export type ReviewKind = 'live' | 'focused' | 'deep' | 'milestone';
export type Result = 'PASS' | 'FAIL' | 'UNVERIFIED' | 'NOT APPLICABLE';

export interface PolicyCategory { id: string; title: string; weight: number }
export interface PolicyRule {
  id: string; depth: 'none' | 'focused' | 'deep'; match: string[]; system?: string; games?: string;
  chapters?: string | string[]; checks?: string[]; targetGroups?: string[]; deepBeforeDeploy?: boolean; fallback?: boolean;
}
export interface Policy {
  rubricVersion: number;
  acceptance: { total: number; categoryFloor: number };
  categories: PolicyCategory[];
  chapters: Record<string, { game: string; scene: string }>;
  cadence: {
    substantialCheckpoints: number; activeDays: number; repairAttemptsBeforeEscalation: number; stalledAfterReviews: number;
    repairCyclesPerCandidate: { normal: number; conserve: number; protect: number };
  };
  usageModes: { normal: { weeklyLeftAbove: number }; conserve: { weeklyLeftAbove: number }; protect: { weeklyLeftAtOrBelow: number }; pacingGapPoints: number };
  escalation: { focusedSystemsForDeep: number; productFilesForDeep: number };
  alwaysAtDeploy: string[];
  rules: PolicyRule[];
  checks: { id: string; title: string; automation: string }[];
  [key: string]: unknown;
}

export interface ChangeClass {
  depth: 'none' | 'focused' | 'deep'; deepBeforeDeploy: boolean; reasons: string[]; systems: string[]; games: string;
  chapters: string[]; checks: string[]; targetGroups: string[]; productPaths: string[]; ignoredPaths: string[];
  dataAudit: boolean; approvedArtCheck: boolean;
}
export interface ReviewPlan extends Omit<ChangeClass, 'depth'> {
  depth: ChangeClass['depth']; review: ReviewKind; obligations: ReviewKind[]; carriedDeep: string[];
}

export interface CategoryScore { id: string; score?: number | null; status?: string }
export interface ScoreResult {
  total: number | null; display: string; provisional: boolean; missing: string[]; belowFloor: string[]; meetsTotal: boolean;
}

/** A critic report as written by a reviewer; deliberately loose, `validateReport` is the gate. */
export interface CriticReport {
  rubricVersion?: number; review?: string; date?: string;
  build?: { mainSha?: string; bundle?: string; artifactHash?: string };
  verdicts?: { deployment?: string; changedArea?: string; milestone?: string };
  checks?: { id: string; result?: string; mandatory?: boolean; reason?: string; evidence?: string[]; reusedFrom?: string; dependencyArgument?: string }[];
  categories?: CategoryScore[];
  issues?: { id?: string; severity?: string; status?: string; title?: string; attempts?: unknown }[];
  encounters?: { id: string; completedRealFlow?: boolean }[];
  targets?: { required?: number; matched?: number; failing?: number; unverified?: number; waiting?: number };
  humanJudgments?: { what: string; recorded?: boolean }[];
  coverage?: { requiredNotTested?: string[]; [key: string]: unknown };
  [key: string]: unknown;
}

export declare const REVIEW_KINDS: ReviewKind[];
export declare const RESULTS: Result[];
export declare const MILESTONE_STATES: string[];
export declare function loadPolicy(root: string): Policy;

export interface OwnerOverridePolicy {
  allowed: boolean;
  requiresOwnerWords: boolean;
  settlesObligations: boolean;
}

/** The owner-override policy block (`critic/policy.json` `ownerOverride`, RUBRIC section 10). */
export declare function ownerOverridePolicy(policy: Policy): OwnerOverridePolicy;
export declare function globToRegExp(glob: string): RegExp;
export declare function classifyChange(paths: string[] | null | undefined, policy: Policy): ChangeClass;
export declare function accumulatedDeepDue(state: { substantialSinceDeep?: number; activeDaysSinceDeep?: number }, policy: Policy): string | null;
export declare function planReview(input: {
  paths: string[] | null | undefined; policy: Policy; ledger?: { substantialSinceDeep?: number; activeDaysSinceDeep?: number };
  carriedDeep?: string[]; claim?: string | null; minimum?: string | null;
}): ReviewPlan;
export declare function weightedTotal(categories: CategoryScore[] | undefined, policy: Policy): ScoreResult;
export declare function milestoneVerdict(report: CriticReport, policy: Policy): { accepted: boolean; reasons: string[]; score: ScoreResult };
export declare function validateReport(report: CriticReport, policy: Policy): string[];

/** One report as the stagnation rule reads it, oldest first. */
export interface ReportIssues { id: string; rubricVersion?: number; review?: string; issues?: CriticReport['issues'] | null }
export interface StalledIssue { id: string; severity: string; title: string; reason: string; attempts: number | null }
export declare function stalledIssues(reports: ReportIssues[], policy: Policy): StalledIssue[];
