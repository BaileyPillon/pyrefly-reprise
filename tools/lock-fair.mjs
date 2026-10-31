/**
 * The fair stale rule for the review-browser lock (`D:/Tools/pyrefly-scratch/RIG-RECORD`) and its reservation (`RIG-RECORD.next`), and the heartbeat that keeps a live holder or waiter off it;
 * tooling only, both games (2026-10-31).
 *
 * The defect this replaces: a record's age counted from its `at`, and a waiter writes `at` once, when it enters the line. A live lane that had waited more than 15 minutes therefore read as stale to
 * every other poller and was replaced (on 2026-10-31 a live lane, pid 85472, waited from 09:18 to 11:00 UTC and was displaced eight times).
 *
 * The rule now: a lock file or a reservation is stale only when
 *   1. its record names a process id that is not running (`why: 'pid-gone'`), or
 *   2. the file has not been written to for `staleMs` (15 minutes) by its own mtime (`why: 'no-heartbeat'`). The holder or the waiter refreshes the file while it holds or waits (`startHeartbeat`), so a live
 *      one is never idle for long; a hung or dead one that nobody refreshes goes stale 15 minutes after its last beat. An unreadable file or one with no process id (a holder in the middle of writing it)
 *      is judged by rule 2 alone, as before.
 * The age in the record (`at`) no longer decides anything for this copy.
 *
 * Compatibility, both ways. READING: a file written by an older copy ({who, pid, at, maxMinutes}, written once, never refreshed) has an mtime equal to its write time, so it is judged by the same two rules:
 * dead pid, or untouched for 15 minutes. WRITING: a beat rewrites the record with the same four fields and a fresh `at` (and adds `since`: the moment the record was first written), so an older copy that
 * still judges by `at` sees a live waiter as young and leaves it alone. The rewrite is one atomic rename under the takeover mutex of `tools/lock-atomic.mjs`, and only while the file is still this
 * process's own: a beat never overwrites another lane's record and never recreates a file that is gone.
 */
import fs from 'node:fs';
import { replaceIfStale } from './lock-atomic.mjs';

export const STALE_MINUTES = 15;

/** Is there a process with this id? (EPERM: it exists but is not ours to signal: alive.) Anything that is not a positive integer is not a process. */
export function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === 'EPERM';
  }
}

/**
 * The lock file at `file`: its parsed record (null when unreadable or not a record) and its mtime in ms; null when there is no file. The content is read before the mtime, so a file replaced in
 * between reads as older content with newer time (fresher, never staler than it is).
 * @param {string} file
 * @returns {{ held: Record<string, any> | null, mtimeMs: number } | null}
 */
export function readLockFile(file) {
  let held = null;
  try { held = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* unreadable (a holder mid-write), or gone */ }
  if (held === null || typeof held !== 'object' || Array.isArray(held)) held = null;
  try {
    return { held, mtimeMs: fs.statSync(file).mtimeMs };
  } catch {
    return null;
  }
}

/**
 * Pure: is this lock file or reservation stale? `held` is its record (null when unreadable), `mtimeMs` its last write.
 * @param {{ held: Record<string, any> | null, mtimeMs: number, now?: number, staleMs?: number, isAlive?: (pid: number) => boolean }} o
 * @returns {{ stale: boolean, why: 'pid-gone' | 'no-heartbeat' | null, idleMs: number }}
 */
export function staleVerdict({ held, mtimeMs, now = Date.now(), staleMs = STALE_MINUTES * 60000, isAlive = pidAlive }) {
  const idleMs = Number.isFinite(mtimeMs) ? Math.max(0, now - mtimeMs) : Infinity;
  if (Number.isInteger(held?.pid) && !isAlive(held.pid)) return { stale: true, why: 'pid-gone', idleMs };
  if (idleMs > staleMs) return { stale: true, why: 'no-heartbeat', idleMs };
  return { stale: false, why: null, idleMs };
}

/**
 * One beat: rewrite `file` as `record` with a fresh `at` (and `since` kept or set), but only while the file still names `record.pid`. True when it was rewritten; false when the file is another
 * process's now, is gone, or a taker holds the mutex (the next beat tries again).
 * @param {string} file
 * @param {Record<string, any> & { pid: number }} record what this process wrote last
 * @returns {boolean}
 */
export function refreshOwn(file, record) {
  const next = { ...record, since: record.since ?? record.at, at: new Date().toISOString() };
  return replaceIfStale(file, JSON.stringify(next), () => readLockFile(file)?.held?.pid === record.pid);
}

/**
 * Beat `file` every `everyMs` (the timer does not keep the process alive; a failed beat is tried again at the next one) for at most `forMs`; returns the function that stops it.
 * A beat needs a running event loop: a job that blocks it (a synchronous child process) does not beat, and stays safe only for as long as its own promise (`maxMinutes`, at most 10) is under the stale line.
 * @param {string} file
 * @param {Record<string, any> & { pid: number }} record
 * @param {{ everyMs?: number, forMs?: number }} [o]
 * @returns {() => void}
 */
export function startHeartbeat(file, record, { everyMs = 30000, forMs = Infinity } = {}) {
  const t0 = Date.now();
  const timer = setInterval(() => {
    if (Date.now() - t0 > forMs) {
      clearInterval(timer);
      return;
    }
    try { refreshOwn(file, record); } catch { /* the next beat tries again */ }
  }, everyMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
