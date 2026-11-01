# tools-lock-fair: a live lane is never displaced from the review-browser line, and a browser crash leaves evidence

Branch `tools-lock-fair` (from `origin/main` c1ddce10d). Game case: **both games, tooling only** (no game file, no engine, no art, no deploy). Authority: Bailey 2026-10-29, "you make all executive decisions for the next few days. i'll go with all of your recommendations."

## 1. The lock defect (found 2026-10-31, r69-crash)

`tools/rig-record-lock.mjs` judged a lock or a reservation stale by the `at` in its record. A waiter writes its reservation (`RIG-RECORD.next`) once, when it enters the line, so after 15 minutes of waiting a **live** lane read as stale to whoever polled next and was replaced. On 2026-10-31 a live lane (pid 85472) waited from 09:18 to 11:00 UTC and was displaced eight times. `tools/measure/lock.mjs` had the same shape for its reservation (live only until `maxMinutes` + 15 minutes).

### The rule now (`tools/lock-fair.mjs`)

A lock file or a reservation is **stale only if** (1) the process id in its record is not running (`why: 'pid-gone'`), or (2) the file has not been written to for 15 minutes by its **mtime** (`why: 'no-heartbeat'`). The `at` in the record decides nothing for this copy. An unreadable file, or one with no integer pid (a holder in the middle of writing it), is judged by (2) alone, as before.

**Heartbeats.** The holder and the waiter refresh their own file while they hold or wait:

- a waiter that holds the reservation: `startHeartbeat(nextFile, ...)` as soon as the turn is its own, until it takes the lock;
- a holder: `startHeartbeat(file, ...)` from the moment the lock is its own, **for its own `maxMinutes`** (10 at most) and no longer, so a hung holder whose process is still alive goes stale 15 minutes after its last beat (worst case `maxMinutes` + 15), not never;
- the interval is `heartbeatMs` (default a fifth of `staleMinutes`, at most 30 s); the timers are `unref`ed;
- a beat (`refreshOwn`) rewrites the record with a fresh `at` and a `since` (the first `at`), as ONE atomic rename under the takeover mutex of `tools/lock-atomic.mjs`, and only while the file still names this process: it never overwrites another lane's record, never recreates a file that is gone, and backs off if a taker holds the mutex (the next beat tries again).
- a beat needs a running event loop. A job that blocks it (a synchronous child process, as in `critic/reviews/*/run-with-lock.mjs`) does not beat; that is safe for as long as the job keeps its own promise (`maxMinutes` is at most 10, under the 15-minute line).

`tools/measure/lock.mjs`: its waiter that holds the reservation now calls `refreshOwn` every 30 s (`PYREFLY_LOCK_BEAT_MS` overrides the interval, for the test), so its `reservedBy` age (`at`) stays young. Its own stale rule for the LOCK is unchanged (a record is held until 15 minutes old by `at`, whether or not its pid answers: the pass's "the pid may be a wrapper" rule).

### How old lock files are read, and how new ones read to old copies

- **Reading a file an older copy wrote** (`{who, pid, at, maxMinutes}`, written once, never refreshed): its mtime equals its write time, so the same two rules apply. A live pid and a file written within 15 minutes is honoured; a dead pid, or untouched for more than 15 minutes, is stale. An older copy's live waiter that waits more than 15 minutes is therefore still replaced by a NEW copy (the old copy never refreshes its file); nothing can fix that short of every tree taking this change.
- **Writing for an older copy to read:** every record keeps the four old fields, and a beat refreshes `at`, so an older copy (which still judges by `at`) sees a beating waiter or holder as young. `since` is the only new field; older copies ignore it.
- `ownPrefix` is still accepted by `takeRigRecord` and now changes nothing: a reservation whose process is gone is removed whoever made it (it used to be removed only for the caller's own prefix; another lane's dead reservation waited out 15 minutes).
- The log lines changed: `reservation of X is stale (its process N is not running | nobody has written to it for M min): removing it`, and likewise `lock held by X is stale (...)`.

### The tests

- `tests/unit/lock-fair.test.ts` (15): the pure verdict (live pid and fresh file; dead pid at once; live pid and 15 minutes untouched; a holder past `maxMinutes` with a live pid; unreadable and pid-less records; the line as a parameter), `pidAlive`, `readLockFile`, `refreshOwn` (fresh `at`, four old fields, `since` kept; never another lane's record; never a gone file; backs off on the mutex), `startHeartbeat` (beats, stops, `forMs`, survives a failed beat), and a real child process in the line of `tools/measure/lock.mjs` whose reservation is rewritten while it waits.
- `tests/unit/rig-record-lock.test.ts` (17, 10 of them fail on the old logic; verified by running the file against `origin/main`'s `rig-record-lock.mjs`): a live waiter older than 15 minutes is NOT replaced; a live holder whose `at` is 40 minutes old but whose file is fresh is waited for; a dead pid is replaced at once (lock and reservation, with and without `ownPrefix`); a holder past `maxMinutes` with a live pid and no write for 16 minutes IS replaced, one written 14 minutes ago is not; files in the old format are read by the same rules; a waiter and a holder keep their file fresh (newer `at` and mtime, `since` kept), the holder stops after its `maxMinutes`, the release stops the beat. The fixtures that used `pid: 1` as "another live lane" now use a real sleeping child process.
- `tests/unit/lock-atomic.test.ts`: one fixture takes a live pid (it used the unreachable pid 2147483000 as "live"); the six real-process races (four processes at once, over free and stale locks) pass unchanged.

## 2. Crash capture for the browser harnesses

The repo had no browser helper shared by all harnesses (about 35 tools call `chromium.launch` themselves; `tools/browser-mode.mjs` shares only the launch flags). The measuring pass has one capture library, `tools/measure/session.mjs` (`ab-clip`, `alloc-profile`, `atb-shimmer`, `hz-matrix`, `channels`), so the capture is a module any harness can use (`tools/browser-crash-capture.mjs`, with `tools/browser-crash-procmem.ps1` and `.d.mts`) and `session.mjs` attaches it:

| what | where |
|---|---|
| `--enable-logging=stderr --log-level=0` on the launch | `CRASH_LAUNCH_ARGS`; `launchBrowser` adds them |
| `page.on('crash')`: stamp harness time, wall clock, last sampled heap and process rows; write the evidence file at once; take one more process sample and write again | `attachCrashCapture` |
| CDP heap sample every 2 s (`Performance.getMetrics`) and process-tree memory every 10 s (`SystemInfo.getProcessInfo` + the PowerShell script: working set, private bytes, GPU dedicated/shared per process, host CPU and free memory; `nvidia-smi`) in ring buffers (150 and 60 rows) | same; the file is `$PYREFLY_CRASH_DIR` or `pyrefly-crash-captures/` under the temp folder |
| the last 100 console errors, page errors and `[ac]` / `[gl]` lines | same |
| "Target crashed" = retry once on a fresh browser, then UNVERIFIED, never a content failure; any other error rethrown unchanged | `runWithCrashRetry`, `isTargetCrashed`, `annotateCrash`, `capture.assertAlive()` |

`openGame` returns `g.crash` (null when `PYREFLY_CRASH_CAPTURE=0`). Nothing is added to the game's page (no init script, no proxies; the reference's AudioContext / GL stamping scripts are not part of it). The listeners go on before any CDP session is awaited; a CDP failure leaves only the crash stamp; the timers are `unref`ed and end with the page, the browser or `stop()`. The real PowerShell sampler was run once against this node process (2.7 s, full row).

Tests: `tests/unit/browser-crash-capture.test.ts` (20): rings, the row shapes, the launch args, `isTargetCrashed`, the capture against fakes (listener before setup; sampling and `stop()`; the crash stamp with the last memory and the two writes; no restamp; console ring; CDP failure; close and disconnect end the timers), `runWithCrashRetry` (OK; crash then OK; crash twice then UNVERIFIED with the stamps; a content failure rethrown after one attempt; `retries: 0`), and `openGame` with a stub browser (capture on; off with `PYREFLY_CRASH_CAPTURE=0`).

Not wired (each is a three-line change when its owner wants it; none was run, because no browser was allowed): the other harnesses that launch their own browser (`tools/fight-start-timeline.mjs`, `tools/pace.mjs`, `tools/art-play-audit.mjs`, `tools/rig/lane/play-common.mjs`, `critic/runner/lib/coldload.mjs`, ...). The timing tools (`pace`, `fight-start-timeline`) should pass `sample: false`.

## 3. Checks run

`tsc --noEmit`: no error in a file this branch touches (26 errors, all in `tests/unit/pause-living-portrait-*.test.ts`: `docs/concepts/pause-until-dawn/prototype-v2/` is tracked but absent from this worktree; the same on `origin/main`). `node tools/orphans.mjs`: nothing new. The lock and capture test files, `measure-tools.test.ts`: green. Every touched source file is under 400 lines.

## 4. Open

- `tools/measure/lock.mjs` still honours a LOCK whose pid is gone until it is 15 minutes old (the pass's wrapper-pid rule), while `tools/rig-record-lock.mjs` now replaces it at once (the driver's rule for this change). A measure-tools waiter therefore sits out a dead `rig-record-lock` holder's lock for up to 15 minutes, while a `rig-record-lock` waiter does not. Align them (a one-line change in `heldBy`) if the driver wants one rule.
- `lock-atomic.mjs` is unchanged: it carries no stale rule, only the two atomic moves.
- The ledgers (`ACTIONS.md` row, `NOW.md`) are left to the release driver.
