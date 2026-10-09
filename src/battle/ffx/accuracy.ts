/**
 * Hit chance and critical chance, from the game's own kernels (re-parity W1; **FFX only**).
 *
 * The arithmetic is `kernel/hit.ts` (the exe's hit check, nine-entry table, per-command accuracy formula 0 to 7,
 * Darkness on flagged commands, raw target Luck, Aim, Reflex, Luck and Jinx stacks) and `kernel/crit.ts` (the exe's
 * critical check: Luck, the target's Luck, Luck and Jinx stacks at one point each, the command's crit byte or the
 * equipment's bonus). Spec: `research/re-ffx-rng-hit.md` sections 4 and 5. These two functions are the engine's
 * read-only view of them for the advisor, the intent panel and the tests; the rolls themselves run in `adapt/hit.ts`.
 */

import type { AbilityDef, FFXCombatant } from '../common/types.ts';
import { critChancePercent, hitChancePercent } from './adapt/preview.ts';

/**
 * Hit chance in percentage points; the action lands when `roll < chance` with the roll 0 to 100.
 *
 * Returns `null` when the game rolls no hit for it: the command always hits (its accuracy formula is 0, as for every
 * spell, item and Overdrive), the target is asleep or petrified, or the command has no effect on this target.
 */
export function hitChance(user: FFXCombatant, target: FFXCombatant, def: AbilityDef): number | null {
  return hitChancePercent(user, target, def);
}

/**
 * Critical chance in percentage points; a crit lands when `roll < chance` with the roll 0 to 100. 0 for a command
 * that cannot crit.
 */
export function critChance(user: FFXCombatant, target: FFXCombatant, def: AbilityDef): number {
  return critChancePercent(user, target, def);
}
