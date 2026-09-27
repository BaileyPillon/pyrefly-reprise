/**
 * PR-0181: while an aeon is out, the party rows give way to the aeon's own row
 * (`research/ffx-combat-core.md` §6.1: the aeon replaces the party on the
 * field). The party's rows come back when it leaves. FFX only.
 */
import type { BattleState, CombatantId } from '../../battle/common/types.ts';

export function statusRowIds(state: Pick<BattleState, 'activeIds' | 'aeonId'>): CombatantId[] {
  return state.aeonId ? [state.aeonId] : [...state.activeIds];
}
