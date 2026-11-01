/**
 * The review-browser lock every browser job takes (`D:/Tools/pyrefly-scratch/RIG-RECORD`, JSON {who, pid, at, maxMinutes}); tooling only.
 *
 * One browser job at a time on this PC (RUBRIC section 9). `takeRigRecord` waits in the line the other lanes keep: `RIG-RECORD.next` names the one waiter whose turn it is. A waiter that finds
 * `.next` free writes its own name there and takes the lock when it is free; it deletes `.next` the moment the lock is its own, so the next waiter can reserve. A waiter that finds `.next` held by
 * another lane waits and does not try the lock. The promise it returns resolves to a function that removes the lock only if it is still this process's own. `maxMinutes` is the holder's own promise
 * (10 at most), written into the file.
 *
 * FAIR STALE RULE (2026-10-31, `tools/lock-fair.mjs`): a lock or a reservation is stale only when its process is not running, or when nobody has written to the file for `staleMinutes` (15) by its
 * own mtime. The one that holds or waits refreshes the file (a heartbeat every 30 s, which also keeps `at` current for older copies that still judge by it), so a live lane is never displaced however
 * long it waits; before, the age counted from when the waiter entered the line and a live waiter was replaced after 15 minutes (a live lane was displaced eight times on 2026-10-31). An unreadable
 * file (a holder in the middle of writing it) is as old as the file is. A holder stops beating after its own `maxMinutes`, so a hung holder that is still running goes stale `staleMinutes` after that.
 *
 * ATOMIC (backlog 60, release 67): the lock and the reservation are made with an exclusive open (`createExclusive`, `tools/lock-atomic.mjs`), and a stale one is replaced by an atomic rename of a temp file
 * under a takeover mutex that asks again whether it is still stale (`replaceIfStale`), never removed and then created: two waiters that judge the same lock stale can no longer both take it, and a waiter can
 * no longer delete a lock that another waiter took over a moment before.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createExclusive, replaceIfStale } from './lock-atomic.mjs';
import { readLockFile, staleVerdict, startHeartbeat } from './lock-fair.mjs';

export const RIG_RECORD = 'D:/Tools/pyrefly-scratch/RIG-RECORD';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} who what the lock says it is for
 * @param {{ file?: string | null, maxMinutes?: number, staleMinutes?: number, pollMs?: number, heartbeatMs?: number, ownPrefix?: string | null, log?: (m: string) => void }} [opts] `file: null` takes nothing (a test); `heartbeatMs`: how often the holder or waiter refreshes its file (default a fifth of `staleMinutes`, at most 30 s); `ownPrefix` is kept for callers that pass it and changes nothing now: a reservation whose process is gone is removed whoever made it
 * @returns {Promise<() => void>}
 */
export async function takeRigRecord(who, { file = RIG_RECORD, maxMinutes = 10, staleMinutes = 15, pollMs = 1000, heartbeatMs, log = () => undefined } = {}) {
  if (!file) return () => undefined;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const nextFile = `${file}.next`;
  const staleMs = staleMinutes * 60000;
  const beatMs = heartbeatMs ?? Math.max(10, Math.min(30000, Math.floor(staleMs / 5)));
  const entered = new Date().toISOString();
  const mine = { who, pid: process.pid, at: entered, maxMinutes, since: entered };
  /** The file, its record, its mtime and the verdict on it (null when there is no file). */
  const look = (f) => {
    const r = readLockFile(f);
    return r === null ? null : { ...r, ...staleVerdict({ held: r.held, mtimeMs: r.mtimeMs, staleMs }) };
  };
  /** Asked again inside the takeover mutex: the file is gone, or stale by the rule. */
  const staleNow = (f) => () => {
    const v = look(f);
    return v === null || v.stale;
  };
  const why = (v) => (v.why === 'pid-gone' ? `its process ${v.held?.pid} is not running` : `nobody has written to it for ${Math.round(v.idleMs / 60000)} min`);
  const releaseOwn = () => {
    try {
      if (JSON.parse(fs.readFileSync(file, 'utf8')).pid === process.pid) fs.unlinkSync(file);
    } catch { /* gone */ }
  };
  const dropNext = () => {
    try { if (JSON.parse(fs.readFileSync(nextFile, 'utf8')).pid === process.pid) fs.unlinkSync(nextFile); } catch { /* gone */ }
  };
  let stopNextBeat = null;
  const stopNext = () => {
    stopNextBeat?.();
    stopNextBeat = null;
  };
  /** The lock is ours: the reservation is given up and the lock is kept fresh until its promise (`maxMinutes`) is over. */
  const taken = (record) => {
    stopNext();
    dropNext();
    const stopBeat = startHeartbeat(file, record, { everyMs: beatMs, forMs: maxMinutes * 60000 });
    return () => {
      stopBeat();
      releaseOwn();
    };
  };
  try {
    for (let waited = 0; ; waited += pollMs / 1000) {
      // the turn: free, or already ours
      let myTurn = createExclusive(nextFile, JSON.stringify(mine));
      if (!myTurn) {
        const n = look(nextFile);
        if (n === null) continue; // it went between the two reads: look again at once
        if (n.held?.pid === process.pid) myTurn = true;
        else if (n.stale) {
          log(`reservation of ${n.held?.who ?? '?'} is stale (${why(n)}): removing it`);
          myTurn = replaceIfStale(nextFile, JSON.stringify(mine), staleNow(nextFile));
          if (!myTurn) { await sleep(Math.min(pollMs, 50)); continue; }
        }
      }
      if (myTurn) {
        stopNextBeat ??= startHeartbeat(nextFile, mine, { everyMs: beatMs }); // a live waiter is never displaced, however long it waits
        const now = new Date().toISOString();
        const rec = { ...mine, at: now, since: now }; // the lock's age counts from now, not from when this job began to wait
        if (createExclusive(file, JSON.stringify(rec))) return taken(rec);
        const l = look(file);
        if (l !== null && l.stale) {
          log(`lock held by ${l.held?.who ?? '?'} is stale (${why(l)}): removing it`);
          if (replaceIfStale(file, JSON.stringify(rec), staleNow(file))) return taken(rec);
          await sleep(Math.min(pollMs, 50));
          continue;
        }
        if (waited % 60 === 0) log(`waiting for the review-browser lock (${l?.held?.who ?? '?'}, ${l ? Math.round((l.idleMs / 60000) * 10) / 10 : '?'} min since it was last written; my turn is reserved)`);
      } else if (waited % 60 === 0) {
        const n = readLockFile(nextFile);
        log(`waiting for my turn (${n?.held?.who ?? '?'} is next)`);
      }
      await sleep(pollMs);
    }
  } catch (err) {
    stopNext();
    dropNext();
    throw err;
  }
}
