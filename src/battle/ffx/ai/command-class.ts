/**
 * What a boss script reads about the command that reached it (`readCommandProperty`), from the game's own
 * record of that command (re-parity; **FFX only**).
 *
 * The hooks of the Seymour fights ask one thing of `usedCommand()`: its **damage type**, the low two bits of the
 * record's damage flags: 1 physical, 2 magical, 3 both, 0 neither (an item that heals, a status-only move, a
 * Talk-like special). Macalania's Seymour marks a Guardian only for type 1; Omnis's discs turn only for type 1
 * (a quarter one way) or type 2 (the other way), whatever the target mode, the item or the spell.
 */

import type { AbilityDef, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';

/** `readCommandProperty(command, damageType)`: `flags_damage & 3` of the command's record. */
export function commandDamageType(def: AbilityDef, user: FFXCombatant): number {
  return resolveCommand(def, user).record.flagsDamage & 3;
}

export const DAMAGE_PHYSICAL = 1;
export const DAMAGE_MAGICAL = 2;
