/**
 * The enemy a formation's opening beats name and show: the Ink & Gold
 * battle-start card, the intro dolly's caption and the preload's card info.
 *
 * A formation that declares {@link EnemyGroupDef.bossId} gets that enemy
 * whenever it is on the field (visible, not removed, not a part). Everything
 * else keeps the house rule every chapter shipped with: the first enemy in
 * `enemyIds` that is visible and not a destructible part.
 *
 * PR-0243 (critic round 16): Chapter VII's formation stages Guado Guardian A in
 * slot 0 (`src/data/ffx/enemies/seymour-anima-macalania.ts`), so the first-enemy
 * rule named the retainer instead of Seymour. Game case: shared plumbing (both
 * games); only the Macalania formation declares a `bossId`, so no other
 * chapter's opening changes.
 *
 * Pure: no DOM, no `three`, no randomness (AGENTS.md hard rule 1).
 */

import type { BattleState, Combatant } from './types.ts';

function onField(c: Combatant | undefined): c is Combatant {
  return Boolean(c) && !c!.removed && !c!.flags.hidden && !c!.flags.isPart;
}

/** The headline enemy: the declared boss when it stands on the field, else the first visible non-part enemy. */
export function headlineEnemy(state: Readonly<BattleState>, bossId?: string | null): Combatant | undefined {
  if (bossId) {
    const declared = state.combatants[bossId];
    if (onField(declared) && declared.side === 'enemy') return declared;
  }
  return state.enemyIds.map((id) => state.combatants[id]).find(onField);
}
