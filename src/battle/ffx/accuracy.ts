/**
 * Hit chance and critical chance [ffx-combat-core §2.11, §2.12].
 *
 * Two things here are routinely got wrong:
 * - **Only 40% of Accuracy counts**, and it indexes a nine-entry table rather
 *   than feeding a percentage directly.
 * - **Enemy Accuracy is never used.** Every enemy action carries its own
 *   `accuracy` byte and takes the `USE_ACTION_ACCURACY` branch.
 */

import type { AbilityDef, FFXCombatant } from '../common/types.ts';
import { HIT_CHANCE_TABLE, idiv, ifloor } from './math.ts';
import { has, stacks } from './state.ts';

/**
 * Hit chance in percentage points; the action lands when `chance > rng % 101`.
 *
 * Returns `null` when the action always hits — `canMiss: false`, or a Sleeping
 * or Petrified target, both of which are struck unconditionally.
 */
export function hitChance(user: FFXCombatant, target: FFXCombatant, def: AbilityDef): number | null {
  if (def.canMiss === false) return null;
  if (has(target, 'sleep') || has(target, 'petrify')) return null;

  let base: number;
  if (def.accuracy !== undefined) {
    // USE_ACTION_ACCURACY: every enemy action takes this branch.
    base = def.accuracy - target.stats.eva;
  } else {
    const raw = ifloor(user.stats.acc * 0.4);
    const idx = Math.max(0, Math.min(8, raw - target.stats.eva + 10));
    base = HIT_CHANCE_TABLE[idx] ?? 25;
  }

  if (def.flags.includes('affected-by-darkness') && has(user, 'darkness')) {
    // `base = floor(base * 0.4) // 4`, i.e. base/10 — unless the attacker's
    // Luck exceeds the target's by 90 or more, which cancels Darkness.
    if (user.stats.luck - Math.max(target.stats.luck, 1) < 90) {
      base = idiv(ifloor(base * 0.4), 4);
    }
  }

  return (
    base +
    user.stats.luck -
    Math.max(target.stats.luck, 1) +
    stacks(user, 'luck') +
    stacks(target, 'jinx') +
    10 * (stacks(user, 'aim') - stacks(target, 'reflex'))
  );
}

/**
 * Critical chance in percentage points; a crit lands when `rng % 101 < chance`.
 *
 * `equipCrit` is the weapon's plus the armour's `bonusCrit`, used only when the
 * action carries `adds-equipment-crit`; otherwise the action's own `bonusCrit`
 * byte applies. The decompile gives Luck stacks **+10 crit each**, not the +1
 * the wiki prints [ffx-combat-core §2.12, §11 C6].
 */
export function critChance(
  user: FFXCombatant,
  target: FFXCombatant,
  def: AbilityDef,
  equipCrit: number,
): number {
  const bonus = def.flags.includes('adds-equipment-crit') ? equipCrit : (def.bonusCrit ?? 0);
  return (
    user.stats.luck +
    10 * stacks(user, 'luck') +
    bonus -
    (Math.max(target.stats.luck, 1) - 10 * stacks(target, 'jinx'))
  );
}
