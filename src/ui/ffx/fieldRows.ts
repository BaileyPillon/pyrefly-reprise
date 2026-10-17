/**
 * PR-0181: while an aeon is out, the party rows give way to the aeon's own row
 * (`research/ffx-combat-core.md` §6.1: the aeon replaces the party on the
 * field). The party's rows come back when it leaves. FFX only.
 */
import type { BattleState, CombatantId } from '../../battle/common/types.ts';

export function statusRowIds(state: Pick<BattleState, 'activeIds' | 'aeonId'> & Partial<Pick<BattleState, 'aeonIds'>>): CombatantId[] {
  // The player's Magus Sisters are three aeons out together (`aeonIds`, FFX only): each has her own row.
  if (state.aeonIds !== undefined && state.aeonIds.length > 0) return [...state.aeonIds];
  return state.aeonId ? [state.aeonId] : [...state.activeIds];
}
