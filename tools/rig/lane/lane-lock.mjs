/**
 * The lock the rig lane's recorder takes (`D:/Tools/pyrefly-scratch/RIG-RECORD`; tooling only, both games; backlog 60, release 67): ONE recording at a time, made atomic.
 *
 * Before: the recorder read the file, judged it free or stale, then overwrote it with a plain write, so two recorders that looked in the same moment both wrote and both went on. Now the file is created with an
 * exclusive open (exactly one racing recorder gets it) and a stale or hand-over lock is replaced by an atomic rename of a temp file under a takeover mutex that asks again (`tools/lock-atomic.mjs`).
 *
 * The rule this recorder keeps (`lockStatus`, `lane-pure.mjs`): a lock whose pid is alive is held; one whose pid is gone, or that is not a lock file, is stale and taken over. A lock held by THIS process's parent
 * is a queue's hand-over (a waiter claimed the free slot, then started the recorder): it is replaced by this recorder's own record. A file that cannot be read yet is a holder in the middle of writing it, and is
 * waited for until it is older than `graceMs` by its own mtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createExclusive, replaceIfStale, unreadableAge } from '../../lock-atomic.mjs';
import { lockStatus } from './lane-pure.mjs';

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const readText = (file) => { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } };
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * Take `lock` for the record `text` (a JSON string with this process's pid). Throws when a live recording holds it.
 * @param {{ lock: string, text: string, pid?: number, ppid?: number, isAlive?: (pid: number) => boolean, graceMs?: number, tries?: number }} o
 * @returns {void}
 */
export function takeLaneLock({ lock, text, pid = process.pid, ppid = process.ppid, isAlive = alive, graceMs = 5000, tries = 200 }) {
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  /** Is the file replaceable now: gone, a dead pid, our own, our parent's (the hand-over), or garbage that nobody is still writing. */
  const takeable = () => {
    const raw = readText(lock);
    const st = lockStatus(raw, isAlive);
    if (st.state === 'free') return true;
    if (st.state === 'held') return st.by.pid === ppid || st.by.pid === pid;
    if (st.why === 'not a lock file') return (unreadableAge(lock) ?? Infinity) > graceMs;
    return true; // its pid is gone
  };
  for (let i = 0; i < tries; i++) {
    if (createExclusive(lock, text)) return;
    const st = lockStatus(readText(lock), isAlive);
    if (st.state === 'held' && st.by.pid !== ppid && st.by.pid !== pid) throw new Error(`lane: another recording holds ${lock} (pid ${st.by.pid}, ${st.by.what ?? '?'}): one recording at a time`);
    if (replaceIfStale(lock, text, takeable)) return;
    sleepSync(25); // another recorder is mid-move, or a holder is mid-write: look again
  }
  throw new Error(`lane: could not take ${lock} (another recorder keeps changing it)`);
}
