/**
 * The review-browser lock every browser job takes (`D:/Tools/pyrefly-scratch/RIG-RECORD`, JSON {who, pid, at, maxMinutes}); tooling only.
 *
 * One browser job at a time on this PC (RUBRIC section 9). `takeRigRecord` waits in the line the other lanes keep: `RIG-RECORD.next` names the one waiter whose turn it is. A waiter that finds
 * `.next` free writes its own name there and takes the lock when it is free; it deletes `.next` the moment the lock is its own, so the next waiter can reserve. A waiter that finds `.next` held by
 * another lane waits and does not try the lock. The promise it returns resolves to a function that removes the lock only if it is still this process's own. A lock or a reservation older than
 * `staleMinutes` (15) belongs to nobody and is removed; an unreadable file (a holder in the middle of writing it) is as old as the file is. `maxMinutes` is the holder's own promise (10 at most),
 * written into the file.
 *
 * ATOMIC (backlog 60, release 67): the lock and the reservation are made with an exclusive open (`createExclusive`, `tools/lock-atomic.mjs`), and a stale one is replaced by an atomic rename of a temp file
 * under a takeover mutex that asks again whether it is still stale (`replaceIfStale`), never removed and then created: two waiters that judge the same lock stale can no longer both take it, and a waiter can
 * no longer delete a lock that another waiter took over a moment before. The stale rule itself is unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createExclusive, replaceIfStale } from './lock-atomic.mjs';

export const RIG_RECORD = 'D:/Tools/pyrefly-scratch/RIG-RECORD';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The JSON of a lock file and its age in minutes (the file's own for an unreadable one); null when there is no file. */
function inspect(file) {
  let held = null;
  try { held = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* unreadable, or gone */ }
  let age = held?.at ? (Date.now() - Date.parse(held.at)) / 60000 : NaN;
  if (!Number.isFinite(age)) {
    try { age = (Date.now() - fs.statSync(file).mtimeMs) / 60000; } catch { return null; }
  }
  return { held, age };
}

/** Is there a process with this id? */
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === 'EPERM';
  }
}

/**
 * @param {string} who what the lock says it is for
 * @param {{ file?: string | null, maxMinutes?: number, staleMinutes?: number, pollMs?: number, ownPrefix?: string | null, log?: (m: string) => void }} [opts] `file: null` takes nothing (a test); `ownPrefix`: a reservation whose name starts with it and whose process is gone is this lane's own, left by a job that was stopped, and is removed
 * @returns {Promise<() => void>}
 */
export async function takeRigRecord(who, { file = RIG_RECORD, maxMinutes = 10, staleMinutes = 15, pollMs = 1000, ownPrefix = null, log = () => undefined } = {}) {
  if (!file) return () => undefined;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const nextFile = `${file}.next`;
  const mine = { who, pid: process.pid, at: new Date().toISOString(), maxMinutes };
  /** The file is gone, or older than the stale line (an unreadable one is as old as the file is): asked again inside the takeover mutex. */
  const staleNow = (f) => () => {
    const i = inspect(f);
    return i === null || i.age > staleMinutes;
  };
  const releaseOwn = () => {
    try {
      if (JSON.parse(fs.readFileSync(file, 'utf8')).pid === process.pid) fs.unlinkSync(file);
    } catch { /* gone */ }
  };
  const dropNext = () => {
    try { if (JSON.parse(fs.readFileSync(nextFile, 'utf8')).pid === process.pid) fs.unlinkSync(nextFile); } catch { /* gone */ }
  };
  try {
    for (let waited = 0; ; waited += pollMs / 1000) {
      // the turn: free, or already ours
      let myTurn = createExclusive(nextFile, JSON.stringify(mine));
      if (!myTurn) {
        const n = inspect(nextFile);
        if (n === null) continue; // it went between the two reads: look again at once
        if (n.held?.pid === process.pid) myTurn = true;
        else if (ownPrefix && typeof n.held?.who === 'string' && n.held.who.startsWith(ownPrefix) && Number.isInteger(n.held?.pid) && !alive(n.held.pid)) {
          log(`reservation of ${n.held.who} (pid ${n.held.pid}) was left by a job that is gone: removing it`);
          const gone = n.held.pid;
          // the turn passes to this job in one move (a rename over the dead reservation), so a third waiter cannot slip in between a removal and a new claim
          myTurn = replaceIfStale(nextFile, JSON.stringify(mine), () => {
            const c = inspect(nextFile);
            return c === null || c.held?.pid === gone;
          });
          if (!myTurn) { await sleep(Math.min(pollMs, 50)); continue; }
        } else if (n.age > staleMinutes) {
          log(`reservation of ${n.held?.who ?? '?'} is ${Math.round(n.age)} min old: removing it`);
          myTurn = replaceIfStale(nextFile, JSON.stringify(mine), staleNow(nextFile));
          if (!myTurn) { await sleep(Math.min(pollMs, 50)); continue; }
        }
      }
      if (myTurn) {
        const text = () => JSON.stringify({ ...mine, at: new Date().toISOString() }); // the lock's age counts from now, not from when this job began to wait
        if (createExclusive(file, text())) {
          dropNext();
          return releaseOwn;
        }
        const l = inspect(file);
        if (l !== null && l.age > staleMinutes) {
          log(`lock held by ${l.held?.who ?? '?'} is ${Math.round(l.age)} min old: removing it`);
          if (replaceIfStale(file, text(), staleNow(file))) {
            dropNext();
            return releaseOwn;
          }
          await sleep(Math.min(pollMs, 50));
          continue;
        }
        if (waited % 60 === 0) log(`waiting for the review-browser lock (${l?.held?.who ?? '?'}, ${l ? Math.round(l.age * 10) / 10 : '?'} min old; my turn is reserved)`);
      } else if (waited % 60 === 0) {
        const n = inspect(nextFile);
        log(`waiting for my turn (${n?.held?.who ?? '?'} is next)`);
      }
      await sleep(pollMs);
    }
  } catch (err) {
    dropNext();
    throw err;
  }
}
