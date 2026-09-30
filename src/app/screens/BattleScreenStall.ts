/**
 * The watchdog for "won, and then never ends" (moved out of `BattleScreen.ts`, unchanged in
 * behaviour, so the screen stays under its line budget).
 *
 * `tests/unit/flow-encounter-chain.test.ts` shows the engine, the presenter and the chain loop
 * always reach an outcome, so nothing *inside* them explains what the critic measured: Bahamut at
 * 0/8400 with the screen still on `'battle'` five minutes later (round 02 #01). What can still
 * strand a fight is a port that never answers: a HUD transient, a mid-battle beat, an art load.
 * Each of those already has its own budget, and each of those budgets could in principle be missed.
 *
 * So this is the backstop the critic asked for, and it is deliberately dumb: once the **engine**
 * says the battle has a result, and playback has not advanced a single event for
 * {@link STALL_LIMIT_MS}, the screen stops waiting and resolves with the result the engine already
 * has. It is checked on the frame clock, which the pause overlay stops, so a paused fight is never
 * mistaken for a stalled one.
 */

import type { BattleEngine } from '../../battle/common/types.ts';
import type { BattleOutcome, BattlePresenter } from '../../engine/BattlePresenter.ts';

/**
 * How long a decided battle may go without playing a single event before the screen resolves it
 * itself. Comfortably longer than every port budget the presenter already keeps
 * (`HUD_EVENT_BUDGET_MS` 600 ms, `SCRIPT_BUDGET_MS` 30 s), so this only ever fires for something
 * that missed its own deadline.
 */
export const STALL_LIMIT_MS = 45_000;

export interface StallInput {
  preview: boolean;
  presenter: BattlePresenter | null;
  engine: BattleEngine | null;
  /** False once the screen has finished (its `finishedResolve` is null). */
  running: boolean;
  chapterId: string;
}

export class StallWatch {
  private stalledMs = 0;
  private lastPlayed = -1;

  /** The outcome to resolve the encounter with when it has stalled, else null. */
  check(dt: number, o: StallInput): BattleOutcome | null {
    if (o.preview || !o.presenter || !o.engine || !o.running) {
      // Nothing running, or already finished.
      if (!o.running) this.stalledMs = 0;
      return null;
    }
    const played = Number(o.presenter.snapshot()['played'] ?? 0);
    if (played !== this.lastPlayed) {
      this.lastPlayed = played;
      this.stalledMs = 0;
      return null;
    }
    const result = o.engine.state().result;
    if (!result) {
      // Still fighting. A long wait for a human at the command menu is not a
      // stall, which is why only a *decided* battle is ever force-resolved.
      this.stalledMs = 0;
      return null;
    }
    this.stalledMs += dt * 1000;
    if (this.stalledMs < STALL_LIMIT_MS) return null;
    console.error(
      `[battle] ${o.chapterId}: the engine reported "${result.outcome}" but playback has not ` +
        `advanced for ${Math.round(this.stalledMs)}ms. Resolving the encounter from the engine's own result.`,
    );
    this.stalledMs = 0;
    return result.outcome === 'defeat'
      ? { kind: 'defeat', result }
      : result.outcome === 'escape'
        ? { kind: 'escape', result }
        : { kind: 'victory', result };
  }
}
