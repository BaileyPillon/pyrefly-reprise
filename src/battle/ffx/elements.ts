/**
 * Element resolution [ffx-combat-core §3].
 *
 * Five real elements plus non-elemental. The multi-element rule is "take the
 * single strongest affinity", with one exception: multiple **weaknesses**
 * multiply, so double-weak is x2.25.
 */

import type { Affinity, AbilityDef, ElementId, FFXCombatant } from '../common/types.ts';
import { AFFINITY_MULTIPLIER_FFX } from '../common/types.ts';

const AFFINITY_RANK: Readonly<Record<Affinity, number>> = {
  absorb: 4,
  immune: 3,
  weak: 2,
  resist: 1,
  normal: 0,
};

/**
 * Multi-element resolution: take the single strongest affinity among the
 * attack's elements, except that multiple *weaknesses* multiply
 * (double-weak = x2.25) [ffx-combat-core §3].
 */
export function resolveAffinity(
  target: FFXCombatant,
  elements: readonly ElementId[],
): { affinity: Affinity; multiplier: number } {
  const real = elements.filter((e) => e !== 'none');
  if (real.length === 0) return { affinity: 'normal', multiplier: 1 };

  let best: Affinity = 'normal';
  let weakCount = 0;
  for (const e of real) {
    const a = target.affinities[e] ?? 'normal';
    if (a === 'weak') weakCount++;
    if (AFFINITY_RANK[a] > AFFINITY_RANK[best]) best = a;
  }
  if (best === 'weak' && weakCount > 1) {
    return { affinity: 'weak', multiplier: Math.pow(AFFINITY_MULTIPLIER_FFX.weak, weakCount) };
  }
  return { affinity: best, multiplier: AFFINITY_MULTIPLIER_FFX[best] };
}

/** Elements this hit actually carries, folding in weapon strikes. */
export function resolveElements(user: FFXCombatant, def: AbilityDef, weaponEls: readonly ElementId[]): ElementId[] {
  const own = def.element.filter((e) => e !== 'none');
  if (!def.flags.includes('inherits-weapon-properties')) return own;
  void user;
  const merged = new Set<ElementId>([...own, ...weaponEls]);
  return [...merged];
}
