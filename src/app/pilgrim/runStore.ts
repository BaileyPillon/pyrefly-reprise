/**
 * **What the Pilgrimage keeps** (prototype, FFX only; Bailey, 2026-10-18, decision 122): the best run, outside the save.
 *
 * Two places, neither of them `SaveData` (`pyrefly-reprise:save:v1`):
 *
 * - **the experiments' own key** (`app/experiments/experimentRecords.ts`, `EXPERIMENTS_KEY`), under the id {@link PILGRIM_EXPERIMENT_ID}: attempts, clears and the best clear time, the same record every hidden
 *   chapter keeps, written through that module's own functions;
 * - **a sibling key**, {@link PILGRIM_KEY}: the run count and the best run's detail (fights won, fights reached, time, boons used), which the experiments' record has no field for.
 *
 * So a run never writes the save: it is out of the save-data class, off the board's "N of M", the veteran check and every total that read the main save only. Every read and write is in try/catch: a private
 * window, blocked storage or a corrupt value reads as empty, and a run that cannot be kept still plays. The state of a run in progress is in memory only (`./runState.ts`).
 *
 * Game case: FFX only for this prototype; the store is game-neutral.
 */

import { recordExperimentAttempt, recordExperimentClear, type ExperimentStorage } from '../experiments/experimentRecords.ts';
import { isBetterRun, type BestRun, type RunSummary } from './runState.ts';

/** The sibling key. Never the main save's `pyrefly-reprise:save:v1`, and never the experiments' own. */
export const PILGRIM_KEY = 'pyrefly-reprise:pilgrim:v1';

/** The Pilgrimage's id in the experiments' store. */
export const PILGRIM_EXPERIMENT_ID = 'pilgrimage';

export interface PilgrimRecord {
  /** Runs begun. */
  readonly runs: number;
  /** Runs that ended on the finale's win. */
  readonly clears: number;
  /** The best run so far, or null before the first one ends. */
  readonly best: BestRun | null;
  /** The run before this one: what a new run is shown against. */
  readonly last: BestRun | null;
}

let storageOverride: ExperimentStorage | null | undefined;

/** Tests: point the store at a fake storage (`null` = no storage at all), or back to `localStorage` with `undefined`. */
export function setPilgrimStorageForTests(storage: ExperimentStorage | null | undefined): void {
  storageOverride = storage;
}

function storage(): ExperimentStorage | null {
  if (storageOverride !== undefined) return storageOverride;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const whole = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);

function sanitizeRun(raw: unknown): BestRun | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const time = r['timeMs'];
  return {
    won: whole(r['won']),
    reached: Math.max(1, whole(r['reached'])),
    cleared: r['cleared'] === true,
    timeMs: typeof time === 'number' && Number.isFinite(time) && time >= 0 ? time : 0,
    boonsUsed: whole(r['boonsUsed']),
    finishedAt: typeof r['finishedAt'] === 'number' && Number.isFinite(r['finishedAt']) ? r['finishedAt'] : 0,
  };
}

const EMPTY: PilgrimRecord = { runs: 0, clears: 0, best: null, last: null };

/** The record, or an empty one on any failure. */
export function readPilgrim(): PilgrimRecord {
  try {
    const raw = storage()?.getItem(PILGRIM_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return EMPTY;
    const p = parsed as Record<string, unknown>;
    return { runs: whole(p['runs']), clears: whole(p['clears']), best: sanitizeRun(p['best']), last: sanitizeRun(p['last']) };
  } catch {
    return EMPTY;
  }
}

function write(record: PilgrimRecord): void {
  try {
    storage()?.setItem(PILGRIM_KEY, JSON.stringify(record));
  } catch {
    /* storage full or blocked: no record is kept, the run goes on */
  }
}

/** A run begins: counted here and as an attempt in the experiments' record. */
export function recordRunStart(now: number = Date.now()): void {
  const r = readPilgrim();
  write({ ...r, runs: r.runs + 1 });
  recordExperimentAttempt(PILGRIM_EXPERIMENT_ID, now);
}

/** What a finished run's keeping answered. */
export interface RunKept {
  readonly record: PilgrimRecord;
  /** The best run as it stood before this run ended (what the run-over screen compares with). */
  readonly previousBest: BestRun | null;
  readonly newBest: boolean;
}

/** A run ended: keep it as the last run, and as the best when it won a fight and beats the best. A finale win also counts as a clear in the experiments' record. */
export function recordRunEnd(summary: RunSummary, now: number = Date.now()): RunKept {
  const before = readPilgrim();
  const run: BestRun = { won: summary.won, reached: summary.reached, cleared: summary.cleared, timeMs: summary.timeMs, boonsUsed: summary.boonsUsed, finishedAt: now };
  const newBest = summary.won > 0 && isBetterRun(run, before.best); // a run that won nothing is never the best
  const record: PilgrimRecord = { runs: before.runs, clears: before.clears + (summary.cleared ? 1 : 0), best: newBest ? run : before.best, last: run };
  write(record);
  if (summary.cleared) recordExperimentClear(PILGRIM_EXPERIMENT_ID, summary.timeMs > 0 ? summary.timeMs : null);
  return { record, previousBest: before.best, newBest };
}
