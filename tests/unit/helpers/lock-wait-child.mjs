// A waiter for the review-browser lock, run as a child process by tests/unit/lock-fair.test.ts (fair stale rule, 2026-10-31; tooling, both games).
//
// argv: <maxWaitMs>; env PYREFLY_SCRATCH (the folder) and PYREFLY_LOCK_BEAT_MS are set by the test. It waits in the line of tools/measure/lock.mjs (RIG-RECORD held by someone else) until it gives up.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [maxWaitMs] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '../../..');
const { takeBrowserLock } = await import(pathToFileURL(path.join(root, 'tools/measure/lock.mjs')).href);
try {
  const release = await takeBrowserLock({ who: 'wait child', what: 'beat test', maxMinutes: 1, maxWaitMs: Number(maxWaitMs), watchdog: false, log: () => undefined });
  release();
  process.exit(0);
} catch {
  process.exit(7); // gave up waiting: the expected end
}
