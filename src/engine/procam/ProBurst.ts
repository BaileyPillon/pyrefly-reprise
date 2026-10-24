/**
 * What the burst of events being played already holds (PRO CAMERA; both games). Pure: types only.
 *
 * The engine has resolved the whole burst by the time the presenter plays it (`BattlePresenter.playBurst`; `EventCtx.burst`: the events and where the one in hand is), so the camera can know
 * at an action's start that its blow will kill, and at the blow that this one is the killing one, without any state of its own. The killing-blow shot (FFX Chapter I) is built on that.
 */
import type { BattleEvent, CombatantId } from '../../battle/common/types.ts';

export interface BurstAt {
  readonly events: readonly BattleEvent[];
  readonly at: number;
}

/** Does an action's own events (those after `at`, up to its `action-end`) KO a combatant that `isFoe` says is a foe (or `victim` when named)? */
export function actionKills(burst: BurstAt | undefined, isFoe: (id: CombatantId) => boolean, victim?: CombatantId): boolean {
  if (!burst) return false;
  for (let i = burst.at + 1; i < burst.events.length; i++) {
    const e = burst.events[i]!;
    if (e.type === 'action-end' || e.type === 'action-start') return false;
    if (victim !== undefined && e.type === 'damage' && e.targetId === victim) return false; // a later blow on the same target is the one that kills, not this
    if (e.type === 'ko' && (victim !== undefined ? e.targetId === victim : isFoe(e.targetId))) return true;
  }
  return false;
}
