/**
 * A decision cap for tests that auto-play a real fight through the real
 * `BattlePresenter` until it ends.
 *
 * The presenter's own loop has no decision cap: it guards only against a
 * livelock (decisions that emit nothing) and against one actor being offered the
 * same turn forever. A fight that keeps emitting events but can never end (the
 * FFX-2 IC-2 fix, 2026-09-26, can leave Chapter IV's White Mage Yuna alone: she
 * cannot kill Bahamut and Vigor keeps her alive) runs until the worker runs out
 * of heap. This wraps a strategy so the presenter is aborted after `cap` player
 * decisions, and the test gets an `aborted` outcome it can assert against
 * instead of a hung worker. Test plumbing, both games.
 */

import type { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import type { AutoStrategy } from '../../../src/engine/BattlePresenterPorts.ts';

/** Far above any shipped line (the longest FFX-2 chain wins in a few hundred player turns). */
export const PRESENTER_DECISION_CAP = 5_000;

export interface CappedAutoPlay {
  /** Player decisions the strategy has answered so far. */
  decisions(): number;
  /** True once the cap aborted the presenter. */
  capped(): boolean;
}

/** `presenter.setAutoPlay(strategy)` with a player-decision cap that aborts the presenter. */
export function setCappedAutoPlay(
  presenter: BattlePresenter,
  strategy: AutoStrategy,
  cap: number = PRESENTER_DECISION_CAP,
): CappedAutoPlay {
  let count = 0;
  let hit = false;
  presenter.setAutoPlay((actorId, commands, engine) => {
    count += 1;
    if (count > cap && !hit) {
      hit = true;
      presenter.abort();
    }
    return strategy(actorId, commands, engine);
  });
  return { decisions: () => count, capped: () => hit };
}
