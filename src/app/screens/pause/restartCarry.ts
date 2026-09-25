/**
 * RESTART ENCOUNTER past a Save Sphere restarts **that link**, exactly as the
 * defeat panel's RETRY does (FA3 = b, D-100; `BattleChainCheckpoint.ts`).
 *
 * Before this, the pause menu's row aborted the fight and asked the flow for a
 * fresh run of the chapter, so in Chapter XI it sent a party that had beaten
 * Shiva and reached the Sisters or Anima back to Shiva, while RETRY after a
 * loss at the same point re-entered the lost link (7c06b8a8, 84de159e).
 *
 * The flow remembers how its last run ended ({@link closeRun}); the restart's
 * run ({@link openRun}, `RunChapterOptions.restart`) picks that up **only**
 * when the run it follows was aborted past a checkpoint in the same chapter.
 * Then it carries on as the RETRY loop would: the checkpoint and the fight time
 * spent so far (`carryAfterDefeat`), the attempt count (so it is reseeded the
 * same way and plays no pre-battle scene again), and the lost run's own
 * options (seed, autopilot, results), so the restarted link is the same run.
 *
 * Every other restart is unchanged: no checkpoint (every FFX chapter, every
 * other FFX-2 chapter, Chapter XI before its first Save Sphere) means a fresh
 * run of the chapter from its first formation, with the restart's own options.
 * The memory lives on the flow object for one hand-over and is never saved
 * (D-100: "kept in memory, not saved to disk").
 *
 * Game case: FFX-2 only in effect (Chapter XI is the only chapter with a
 * checkpoint); the plumbing is shared, so both games' other restarts are
 * pinned unchanged by `tests/unit/pause-restart-checkpoint.test.ts`.
 *
 * Layering: no `three`, no DOM.
 */

import { carryAfterDefeat, FRESH_RUN, type ChainCheckpoint, type RetryCarry } from '../BattleChainCheckpoint.ts';
import type { RunChapterOptions } from '../BattleScreenFlow.ts';
import { drawRunSeed } from '../../runSeed.ts';

/** A run's options once its first seed is fixed, so a restart that resumes it reuses that seed. */
export type SeededRunOptions = RunChapterOptions & { seed: number };

/** How a chapter run starts: the retry carry, the attempt count, the options it runs with. */
export interface RunStart {
  carry: RetryCarry;
  attempt: number;
  opts: SeededRunOptions;
}

interface Memo extends RunStart {
  chapterId: string;
}

/** The last run each flow ended, when it ended aborted past a checkpoint. */
const lastAborted = new WeakMap<object, Memo>();

/**
 * The start of a chapter run on `flow`. A restart that follows a run aborted
 * past a Save Sphere in the same chapter resumes it; anything else starts
 * fresh with its own options. The memory is spent either way.
 *
 * A fresh run with no seed of its own draws one (`runSeed.ts`, PR-0008; both
 * games): the first attempt is no longer seed 1 every time.
 */
export function openRun(flow: object, chapterId: string, opts: RunChapterOptions): RunStart {
  const memo = lastAborted.get(flow);
  lastAborted.delete(flow);
  if (opts.restart === true && memo && memo.chapterId === chapterId && memo.carry.resumeAt) {
    return { carry: memo.carry, attempt: memo.attempt, opts: memo.opts };
  }
  return { carry: FRESH_RUN, attempt: 0, opts: { ...opts, seed: opts.seed ?? drawRunSeed() } };
}

/**
 * The end of a chapter run on `flow`: returns `outcome` unchanged, and when
 * the run was aborted (the pause menu's exits) past a checkpoint, remembers
 * where a RESTART ENCOUNTER should pick it up.
 */
export function closeRun<T extends { outcome: string }>(
  flow: object,
  chapterId: string,
  run: RunStart,
  fought: { checkpoint?: ChainCheckpoint | null; elapsedMs: number },
  outcome: T,
): T {
  const carry = outcome.outcome === 'aborted' ? carryAfterDefeat(run.carry, fought) : FRESH_RUN;
  if (carry.resumeAt) lastAborted.set(flow, { ...run, carry, chapterId });
  else lastAborted.delete(flow);
  return outcome;
}
