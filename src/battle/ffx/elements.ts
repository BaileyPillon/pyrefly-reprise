/**
 * Element resolution (re-parity W1; **FFX only**).
 *
 * The multiplier is the kernel's (`kernel/element.ts`: any weakness 3/2 per bit, else a neutral bit leaves the hit
 * alone, else a resisted bit halves it, else a nulled bit zeroes it, else every bit is absorbed and the sign flips;
 * `research/re-ffx-damage.md` section 5). This module keeps the two helpers the engine needs around it: which
 * elements a hit carries once the weapon's strikes are folded in, and the label of the reading for a target.
 */

import type { AbilityDef, Affinity, ElementId, FFXCombatant } from '../common/types.ts';
import { affinityOf } from './adapt/affinity.ts';

/** The label (weak, normal, resist, immune, absorb) of an attack's elements against a target, by the game's ladder. */
export function resolveAffinity(target: FFXCombatant, elements: readonly ElementId[]): { affinity: Affinity } {
  return { affinity: affinityOf(target, elements) };
}

/** Elements this hit actually carries, folding in weapon strikes. */
export function resolveElements(user: FFXCombatant, def: AbilityDef, weaponEls: readonly ElementId[]): ElementId[] {
  const own = def.element.filter((e) => e !== 'none');
  if (!def.flags.includes('inherits-weapon-properties')) return own;
  void user;
  const merged = new Set<ElementId>([...own, ...weaponEls]);
  return [...merged];
}
