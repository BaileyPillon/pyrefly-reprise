// The browser lock of the measuring tools (RIG-RECORD etiquette, feedback-review-browser-lock; motion-fluidity pass, lane L5; both games, tooling).
//
// One heavy browser job at a time across the machine, whichever lane or tool starts it. The protocol every lane of the pass uses:
//   - `REVIEW-BROWSER` and `GPU-QUIET` in the scratch folder are guards: while either exists nothing starts (a release review is timing frames).
//   - `RIG-RECORD` is the lock: JSON { who, pid, at, maxMinutes } (maxMinutes at most 10), created exclusively. A lock whose pid is gone, or older than 15 minutes, is stale and may be taken;
//     a live lock younger than that is never removed by anyone but its owner.
//   - `RIG-RECORD.next` is the reservation of the one that is waiting: a waiter claims the empty slot, and the lock is then taken by the holder of the reservation first, so lanes that queue do not starve each other.
// The tool that takes the lock releases it on every way out (normal end, error, signal), and a watchdog releases it and ends the process if the job runs past its `maxMinutes` (a hung browser must not hold
// the machine). Nothing here stops a process by image name; the callers stop what they started by PID.
import fs from 'node:fs';

export const SCRATCH = process.env.PYREFLY_SCRATCH ?? 'D:/Tools/pyrefly-scratch';
export const LOCK = `${SCRATCH}/RIG-RECORD`;
export const NEXT = `${SCRATCH}/RIG-RECORD.next`;
const GUARDS = ['REVIEW-BROWSER', 'GPU-QUIET'];
const STALE_MS = 15 * 60 * 1000;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

/** Pure: is this lock record a live hold by somebody else? (`now` and `isAlive` are injected for the tests.) */
export function heldBy(rec, { pid = process.pid, now = Date.now(), isAlive = alive } = {}) {
  if (!rec) return null;
  const age = now - Date.parse(rec.at ?? 0);
  if (!Number.isInteger(rec.pid) || rec.pid === pid || !isAlive(rec.pid) || age > STALE_MS) return null;
  return rec;
}

/** Pure: the reservation of somebody else that is still good (its owner alive and younger than its own max plus the stale margin). */
export function reservedBy(rec, { pid = process.pid, now = Date.now(), isAlive = alive } = {}) {
  if (!rec || rec.pid === pid) return null;
  const age = now - Date.parse(rec.at ?? 0);
  return isAlive(rec.pid) && age < (rec.maxMinutes ?? 10) * 60 * 1000 + STALE_MS ? rec : null;
}

/**
 * Take the lock (waiting as long as it takes, up to `maxWaitMs`). Returns `release()`.
 * @param {{who: string, what: string, maxMinutes?: number, maxWaitMs?: number, log?: (...a: unknown[]) => void, watchdog?: boolean}} o
 */
export async function takeBrowserLock({ who, what, maxMinutes = 10, maxWaitMs = 4 * 3600 * 1000, log = console.log, watchdog = true }) {
  const max = Math.min(10, Math.max(1, maxMinutes));
  const t0 = Date.now();
  let lastLog = 0;
  const mine = () => JSON.stringify({ who, pid: process.pid, what, at: new Date().toISOString(), maxMinutes: max });
  for (;;) {
    const guards = GUARDS.filter((g) => fs.existsSync(`${SCRATCH}/${g}`));
    const held = heldBy(readJson(LOCK));
    const reserved = reservedBy(readJson(NEXT));
    const ours = readJson(NEXT)?.pid === process.pid;
    if (!ours && !reserved && (held || guards.length)) { try { fs.writeFileSync(NEXT, mine()); } catch { /* lost the claim: poll again */ } }
    if (!guards.length && !held && !reserved) {
      try { fs.writeFileSync(LOCK, mine()); } catch { await sleep(100); continue; }
      await sleep(150);
      if (readJson(LOCK)?.pid === process.pid) { if (readJson(NEXT)?.pid === process.pid) try { fs.rmSync(NEXT, { force: true }); } catch { /* gone */ } break; }
      continue; // lost the race
    }
    if (Date.now() - t0 > maxWaitMs) throw new Error('waited too long for the browser lock');
    if (Date.now() - lastLog > 60000) { lastLog = Date.now(); log(`[lock] waiting: ${guards.join('+') || 'no guard'}; RIG-RECORD ${held ? `held by ${held.who} (pid ${held.pid}, ${held.what ?? ''})` : 'free'}; reservation ${reserved ? `of ${reserved.who}` : ours ? 'mine' : 'none'}`); }
    await sleep(80);
  }
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    try { if (readJson(LOCK)?.pid === process.pid) fs.rmSync(LOCK, { force: true }); } catch { /* gone */ }
    clearTimeout(timer);
  };
  const timer = watchdog ? setTimeout(() => { log(`[lock] watchdog: ${what} ran past ${max} min; releasing and ending`); release(); process.exit(3); }, (max + 0.5) * 60000) : null;
  timer?.unref?.();
  process.on('exit', release);
  for (const s of ['SIGINT', 'SIGTERM', 'SIGBREAK']) process.on(s, () => { release(); process.exit(130); });
  log(`[lock] RIG-RECORD taken after ${((Date.now() - t0) / 60000).toFixed(1)} min: ${what}`);
  return release;
}
