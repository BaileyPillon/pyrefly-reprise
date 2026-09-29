/**
 * **Advisor v4's worker protocol** (docs/handoff/advisor-v4.md). The main thread hands the worker
 * a serialized copy of the battle (`FFXEngine.transferable`, copied by `postMessage`) and never
 * anything live; the worker answers with a finished card for one board, or with why it has none.
 *
 * ```
 * main -> worker   { type: 'search', job, snapshot, budget, capMs, advance }
 *                  { type: 'cancel', job }
 * worker -> main   { type: 'result', job, key, view, switched, stats }
 *                  { type: 'none',   job, reason, message? }
 * ```
 *
 * One job at a time: a new `search` supersedes whatever the worker was doing.
 *
 * Game case: FFX only for now (the snapshot is an FFX engine's); the shape is shared plumbing.
 */

import type { FFXEngineSnapshot } from '../../battle/ffx/index.ts';
import type { AdvisorView } from '../../engine/tactics/advisor.ts';
import type { BudgetName } from '../../engine/tactics/advisor-v4/presets.ts';

export interface SearchJob {
  type: 'search';
  /** Increasing per host; a result for an older job is dropped. */
  job: number;
  snapshot: FFXEngineSnapshot;
  budget: BudgetName;
  /** The worker stops at this many ms of its own time and answers `timeout`. */
  capMs: number;
  /**
   * Play the copy on to the next player menu first (the pre-start at a press: in CTB nothing the
   * player does before that menu changes it). A copy already standing at a menu stays there.
   */
  advance: boolean;
}

export interface CancelJob {
  type: 'cancel';
  job: number;
}

export type ToWorker = SearchJob | CancelJob;

/** What one search cost and chose (the handoff's timings read these). */
export interface SearchStats {
  /** Worker ms from receiving the job to posting the answer. */
  totalMs: number;
  /** Of which: playing on to the menu, the v3 card, the search, the final card. */
  advanceMs: number;
  v3Ms: number;
  searchMs: number;
  liftMs: number;
  simDecisions: number;
  candidates: number;
  /** Why the default stood without a search, when it did. */
  skipped?: string;
  /** Where the switched row came from (`v3-runner-up`, `line`, `ranked`). */
  origin?: string;
  /** The search switched, but the card had not priced that row (the card stands). */
  unliftable?: boolean;
}

export interface SearchAnswer {
  type: 'result';
  job: number;
  /** `boardKey` of the board the card is for. */
  key: string;
  /** The card for that board: v3's, or v3's with v4's pick on top. */
  view: AdvisorView | null;
  switched: boolean;
  stats: SearchStats;
}

export interface NoAnswer {
  type: 'none';
  job: number;
  reason: 'battle-over' | 'no-menu' | 'cancelled' | 'superseded' | 'timeout' | 'error';
  message?: string;
}

export type FromWorker = SearchAnswer | NoAnswer;
