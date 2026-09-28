/**
 * Who stands at the end of an FF7 battle (FF7 only; the phase-3 judge's repair item 12): each party member on the
 * field and not KO'd gets the full EXP, a KO'd member gets 0 (research/ff7-battle-core.md §11, "single source:
 * Fergusson PM §1.3"; `src/battle/ff7/results.ts` leaves it to the results screen to read who is alive).
 * `BattleScreen.finish` adds it to the result for an FF7 engine; every FFX and FFX-2 result is unchanged.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';

/** `{ standing }` for an FF7 state (the active party members alive and on the field), `{}` for any other game. */
export function ff7Standing(state: BattleState | null | undefined): { standing?: CombatantId[] } {
  if (!state || state.game !== 'ff7') return {};
  return { standing: state.activeIds.filter((id) => { const c = state.combatants[id]; return !!c && c.alive && !c.removed; }) };
}
