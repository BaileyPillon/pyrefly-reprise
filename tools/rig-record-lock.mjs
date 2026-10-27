/**
 * The review-browser lock every browser job takes (`D:/Tools/pyrefly-scratch/RIG-RECORD`, JSON {who, pid, at, maxMinutes}); tooling only.
 *
 * One browser job at a time on this PC (RUBRIC section 9). `takeRigRecord` waits in the line the other lanes keep: `RIG-RECORD.next` names the one waiter whose turn it is. A waiter that finds
 * `.next` free writes its own name there and takes the lock when it is free; it deletes `.next` the moment the lock is its own, so the next waiter can reserve. A waiter that finds `.next` held by
 * another lane waits and does not try the lock. The promise it returns resolves to a function that removes the lock only if it is still this process's own. A lock or a reservation older than
 * `staleMinutes` (15) belongs to nobody and is removed; an unreadable file (a holder in the middle of writing it) is as old as the file is. `maxMinutes` is the holder's own promise (10 at most),
 * written into the file.
 */
import fs from 'node:fs';

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
  const nextFile = `${file}.next`;
  const mine = { who, pid: process.pid, at: new Date().toISOString(), maxMinutes };
  const dropNext = () => {
    try { if (JSON.parse(fs.readFileSync(nextFile, 'utf8')).pid === process.pid) fs.unlinkSync(nextFile); } catch { /* gone */ }
  };
  try {
    for (let waited = 0; ; waited += pollMs / 1000) {
      // the turn: free, or already ours
      let myTurn = false;
      try {
        fs.writeFileSync(nextFile, JSON.stringify(mine), { flag: 'wx' });
        myTurn = true;
      } catch {
        const n = inspect(nextFile);
        if (n === null) continue; // it went between the two reads: look again at once
        if (n.held?.pid === process.pid) myTurn = true;
        else if (ownPrefix && typeof n.held?.who === 'string' && n.held.who.startsWith(ownPrefix) && Number.isInteger(n.held?.pid) && !alive(n.held.pid)) {
          log(`reservation of ${n.held.who} (pid ${n.held.pid}) was left by a job that is gone: removing it`);
          try { fs.unlinkSync(nextFile); } catch { /* raced */ }
          continue;
        } else if (n.age > staleMinutes) {
          log(`reservation of ${n.held?.who ?? '?'} is ${Math.round(n.age)} min old: removing it`);
          try { fs.unlinkSync(nextFile); } catch { /* raced */ }
          continue;
        }
      }
      if (myTurn) {
        try {
          fs.writeFileSync(file, JSON.stringify({ ...mine, at: new Date().toISOString() }), { flag: 'wx' }); // the lock's age counts from now, not from when this job began to wait
          dropNext();
          return () => {
            try {
              if (JSON.parse(fs.readFileSync(file, 'utf8')).pid === process.pid) fs.unlinkSync(file);
            } catch { /* gone */ }
          };
        } catch {
          const l = inspect(file);
          if (l !== null && l.age > staleMinutes) {
            log(`lock held by ${l.held?.who ?? '?'} is ${Math.round(l.age)} min old: removing it`);
            try { fs.unlinkSync(file); } catch { /* raced */ }
            continue;
          }
          if (waited % 60 === 0) log(`waiting for the review-browser lock (${l?.held?.who ?? '?'}, ${l ? Math.round(l.age * 10) / 10 : '?'} min old; my turn is reserved)`);
        }
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
