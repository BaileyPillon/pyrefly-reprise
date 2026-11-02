/**
 * Types for `tools/owed-lifts.mjs`, so the unit tests (TypeScript, type-checked by `tsc --noEmit`) and `deploy-pages.d.mts` can use it directly.
 * This file declares the module's whole public surface: add an export over there, add it here.
 */

export interface LiftNote {
  /** The chapter's id in `TREATED_CHAPTERS`. */
  readonly id: string;
  /** How the refusal names the chapter. */
  readonly label: string;
  /** The handoff note whose `marker` line carries the lift (repo-relative). */
  readonly note: string;
  readonly marker: string;
  /** The check the proof reads in the report's `continuity.chapters` (e.g. `CHK-027`). */
  readonly check: string;
}

export interface OwedLift {
  id: string;
  label: string;
  why: string;
}

export interface LiftReportVerdict {
  state: 'pass' | 'fail' | 'no-entry' | 'unreadable';
  detail: string;
}

export declare const LIFT_NOTES: readonly LiftNote[];

/** Is this id a data line of `TREATED_CHAPTERS` in `src/engine/motion/DemoGate.ts`? */
export declare function isListedInSource(root: string, id: string): boolean;

/** Does the named review report (repo-relative) show a PASS for the chapter's check? */
export declare function liftReportVerdict(root: string, reportRel: string, id: string, check: string): LiftReportVerdict;

/** Every listed chapter whose lift is not yet proved by a review report that reads PASS. */
export declare function findOwedLifts(root?: string): OwedLift[];

/** The report paths a lift line may name: `critic/reviews/<sha>-focused|live|deep.json` or a lift proof `critic/reviews/r<release>-<name>.json`. */
export declare const REPORT_RE: RegExp;
