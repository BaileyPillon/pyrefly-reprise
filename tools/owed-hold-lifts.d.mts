/**
 * Types for `tools/owed-hold-lifts.mjs`, so the unit tests (TypeScript, type-checked by `tsc --noEmit`) and `deploy-pages.d.mts` can use it directly.
 * This file declares the module's whole public surface: add an export over there, add it here.
 */
import type { OwedLift } from './owed-lifts.mjs';

/** What a job's entry in the proof report must hold: each `zero` field the number 0, each `atMost` field a number at or under its bound (and `verdict` PASS). */
export interface HoldLiftJob {
  readonly zero: readonly string[];
  readonly atMost: Readonly<Record<string, number>>;
}

export interface HoldLift {
  readonly id: string;
  readonly label: string;
  /** The chapter's id in `TREATED_CHAPTERS` and in the hold tables. */
  readonly chapter: string;
  /** The `TreatedPiece` whose hold was lifted. */
  readonly piece: string;
  /** The handoff note whose `marker` line carries the lift (repo-relative). */
  readonly note: string;
  readonly marker: string;
  /** One entry per browser job the proof report must hold, keyed by the job's id. */
  readonly jobs: Readonly<Record<string, HoldLiftJob>>;
}

export interface HoldLiftReportVerdict {
  state: 'pass' | 'fail' | 'missing-job' | 'wrong-subject' | 'unreadable';
  detail: string;
}

export declare const HOLD_LIFTS: readonly HoldLift[];

/** Is this piece a key of this chapter's row in `PieceHolds.ts` / `PieceHoldsLast.ts`? */
export declare function holdIsInSource(root: string, chapter: string, piece: string): boolean;

/** Does the named proof report (repo-relative) hold every job of the row at its numbers? */
export declare function holdLiftReportVerdict(root: string, reportRel: string, row: HoldLift): HoldLiftReportVerdict;

/** Every lifted hold whose proof is missing or does not hold. */
export declare function findOwedHoldLifts(root?: string): OwedLift[];
