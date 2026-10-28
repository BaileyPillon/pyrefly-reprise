/**
 * The two atomic moves every writer of the review-browser lock (`D:/Tools/pyrefly-scratch/RIG-RECORD` and its `.next` reservation) uses; tooling only, both games (backlog 60, release 67).
 *
 * Why: on 2026-10-27 two browser jobs took RIG-RECORD in the same second. The takers checked the file, found it free (or stale, or half written) and then wrote it with a plain `writeFileSync`, which
 * truncates whatever is there: the last writer won and the first never knew. The rules of the pass did not change (a lock is stale after 15 minutes, nobody removes another lane's younger lock); only the way
 * the file is made is atomic now:
 *
 *   1. `createExclusive` makes the file with an exclusive open (`'wx'`): exactly one of any number of racing takers gets it, the rest see `EEXIST` and look again.
 *   2. `replaceIfStale` takes over a lock that has gone stale, by writing the taker's record to a temp file and renaming it over the stale one, so the lock is never absent and never half written. Two takers
 *      that both judged the same lock stale would still both rename, so the move runs inside a takeover mutex (`<file>.takeover`, itself an exclusive create, held for milliseconds) and asks `stillStale()`
 *      AGAIN once it holds the mutex: the second taker finds the first one's fresh record there and backs off.
 *
 * A file that exists but cannot be read is a holder in the middle of writing it (between its open and its write), never a free lock: `unreadableAge` gives its age from the file's own mtime.
 */
import fs from 'node:fs';

/** A takeover mutex older than this belongs to a taker that died inside the move; the next taker removes it. Ordinary holds last a few milliseconds. */
export const TAKEOVER_STALE_MS = 10000;

/**
 * Create `file` holding `text`, only if no file is there (an exclusive open). True: it is ours. False: it exists, or Windows has it busy (a file being deleted answers EPERM or EACCES): look again.
 * Any other error is the caller's to see.
 * @param {string} file
 * @param {string} text
 * @returns {boolean}
 */
export function createExclusive(file, text) {
  let fd;
  try {
    fd = fs.openSync(file, 'wx');
  } catch (err) {
    if (err?.code === 'EEXIST' || err?.code === 'EPERM' || err?.code === 'EACCES' || err?.code === 'EBUSY') return false;
    throw err;
  }
  try {
    fs.writeSync(fd, text);
  } finally {
    fs.closeSync(fd);
  }
  return true;
}

/**
 * The age in ms of a file by its own mtime, for a lock nobody can read (a holder is writing it, or it is not a lock at all); `null` when the file is gone.
 * @param {string} file
 * @returns {number | null}
 */
export function unreadableAge(file) {
  try {
    return Date.now() - fs.statSync(file).mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Replace the lock at `file` with `text` if, and only if, `stillStale()` says it is stale (or gone) once this taker holds the takeover mutex. True: the file now holds `text`. False: not stale any more,
 * another taker is mid-move, or the move failed: the caller looks again. If the file is gone by then the taker creates it exclusively instead of renaming, so a fresh lock made in the gap is never replaced.
 * `stillStale` must treat an unreadable file as fresh until `unreadableAge` says otherwise.
 * @param {string} file
 * @param {string} text
 * @param {() => boolean} stillStale
 * @returns {boolean}
 */
export function replaceIfStale(file, text, stillStale) {
  const mutex = `${file}.takeover`;
  if (!createExclusive(mutex, String(process.pid))) {
    const age = unreadableAge(mutex);
    if (age !== null && age > TAKEOVER_STALE_MS) {
      try { fs.rmSync(mutex, { force: true }); } catch { /* raced */ }
    }
    return false;
  }
  try {
    if (!stillStale()) return false;
    if (!fs.existsSync(file)) return createExclusive(file, text);
    const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tmp, text);
    try {
      fs.renameSync(tmp, file); // atomic: the lock is the stale record or this one, never absent, never half written
    } catch {
      try { fs.rmSync(tmp, { force: true }); } catch { /* gone */ }
      return false;
    }
    return true;
  } finally {
    try { fs.rmSync(mutex, { force: true }); } catch { /* gone */ }
  }
}
