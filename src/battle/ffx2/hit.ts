/**
 * The FFX-2 hit chance and critical chance, as read-only views for the HUD, the move advisor and the enemy-intent panel
 * (re-parity W3; **FFX-2 only**).
 *
 * The rolls themselves are the kernels' (`kernel/hit.ts`, `kernel/crit.ts`), run by `resolve-strike.ts` on the game's
 * command row (`adapt/command.ts`). These two functions answer "what are the odds" with the same inputs and the same
 * rule (`adapt/preview.ts`), as a percentage point value that is exact over the draws the kernels reduce — so the
 * old hand-written points race, the Darkness divisor and the enemy baseline Accuracy are gone: the game's rule and
 * the monster rows' own Accuracy take their place.
 *
 * **A restorative action on your own side never rolls** (PR-0075): it is accuracy formula 0 in the game's rows, and in a
 * derived row (`adapt/command.ts`) a heal is formula 0 too. **Magic never rolls** (AGENTS.md hard rule 5; combat-fixes-0924
 * (a)): a magical row whose game accuracy formula is not 0 is held at formula 0 (`ruleFive`), except an ability that
 * opts back in with `canMiss: true` (Gunner's Enchanted Ammo). The held rows are listed in `docs/handoff/re-parity-w3.md`.
 */

import type { AbilityDef, FFX2Combatant } from '../common/types.ts';
import { critProbability, hitProbability } from './adapt/preview.ts';

/**
 * A heal, a recovery or any item: the same `heals` spelling the command rows use, plus the item category (Potions,
 * Ethers, the Alchemist's stash). Hostile actions are never this.
 */
export function isRestorative(ability: AbilityDef): boolean {
  return ability.flags.includes('heals') || ability.formula === 'healing' || ability.category === 'item';
}

/** The chance, in percentage points (0 to 100), that `user`'s `ability` lands on `target`. */
export function hitPercent(user: FFX2Combatant, target: FFX2Combatant, ability: AbilityDef): number {
  return 100 * hitProbability(user, target, ability);
}

/** The chance, in percentage points (0 to 100), that a hit of `ability` from `user` on `target` is critical. */
export function critPercent(user: FFX2Combatant, target: FFX2Combatant, ability: AbilityDef): number {
  return 100 * critProbability(user, target, ability);
}
