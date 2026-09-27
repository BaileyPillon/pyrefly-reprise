/**
 * The experiments' own records: a separate localStorage key, never the save.
 *
 * The hidden FF7 Guard Scorpion experiment (`docs/plans/ff7-guard-scorpion-architecture.md`
 * §2.3) keeps its attempts, clears and time here, under
 * {@link EXPERIMENTS_KEY}, so nothing it does ever writes
 * `pyrefly-reprise:save:v1` (`SaveData.ts`'s `SAVE_KEY`). That keeps it out of
 * the save-data class, out of the board's "N of 15", the veteran check, total
 * play time and the victory-line count, which all read the main save only.
 *
 * Every read and write is in try/catch: a private window, blocked storage or a
 * corrupt value reads as empty and is never merged into the main save.
 *
 * Game case: FF7 only (the only experiment today); the module is game-neutral.
 */

/** The experiments' key. Never the main save's `pyrefly-reprise:save:v1`. */
export const EXPERIMENTS_KEY = 'pyrefly-reprise:experiments:v1';

/** One experiment's record. */
export interface ExperimentRecord {
  attempts: number;
  clears: number;
  /** Best clear time in ms, or null before the first timed clear. */
  bestTimeMs: number | null;
  playTimeMs: number;
  /** `Date.now()` of the last attempt, or null. */
  lastPlayedAt: number | null;
}

/** The storage the store reads and writes; `localStorage` by default. */
export type ExperimentStorage = Pick<Storage, 'getItem' | 'setItem'>;

let storageOverride: ExperimentStorage | null | undefined;

/** Tests: point the store at a fake storage (`null` = no storage at all), or back to `localStorage` with `undefined`. */
export function setExperimentStorageForTests(storage: ExperimentStorage | null | undefined): void {
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

function emptyRecord(): ExperimentRecord {
  return { attempts: 0, clears: 0, bestTimeMs: null, playTimeMs: 0, lastPlayedAt: null };
}

function finite(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : fallback;
}

function sanitize(raw: unknown): ExperimentRecord {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const best = r['bestTimeMs'];
  const last = r['lastPlayedAt'];
  return {
    attempts: Math.floor(finite(r['attempts'], 0)),
    clears: Math.floor(finite(r['clears'], 0)),
    bestTimeMs: typeof best === 'number' && Number.isFinite(best) && best > 0 ? best : null,
    playTimeMs: finite(r['playTimeMs'], 0),
    lastPlayedAt: typeof last === 'number' && Number.isFinite(last) ? last : null,
  };
}

/** Every experiment's record, keyed by id. Empty on any failure. */
export function readExperiments(): Record<string, ExperimentRecord> {
  try {
    const raw = storage()?.getItem(EXPERIMENTS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, ExperimentRecord> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) out[id] = sanitize(value);
    return out;
  } catch {
    return {};
  }
}

/** One experiment's record (an empty one when there is none). */
export function experimentRecord(id: string): ExperimentRecord {
  return readExperiments()[id] ?? emptyRecord();
}

function update(id: string, change: (r: ExperimentRecord) => void): void {
  try {
    const all = readExperiments();
    const record = all[id] ?? emptyRecord();
    change(record);
    all[id] = record;
    storage()?.setItem(EXPERIMENTS_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked: the experiment keeps no record, the game goes on */
  }
}

/** A new attempt started. */
export function recordExperimentAttempt(id: string, now: number = Date.now()): void {
  update(id, (r) => {
    r.attempts += 1;
    r.lastPlayedAt = now;
  });
}

/** A clear; `timeMs` null = an automated run, which never sets a best time. */
export function recordExperimentClear(id: string, timeMs: number | null): void {
  update(id, (r) => {
    r.clears += 1;
    if (timeMs !== null && timeMs > 0 && (r.bestTimeMs === null || timeMs < r.bestTimeMs)) r.bestTimeMs = timeMs;
  });
}

/** Play time, in ms. Ignores non-finite and negative deltas. */
export function addExperimentPlayTime(id: string, ms: number): void {
  if (!Number.isFinite(ms) || ms <= 0) return;
  update(id, (r) => {
    r.playTimeMs += ms;
  });
}
