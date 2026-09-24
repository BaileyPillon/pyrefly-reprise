/**
 * The FFX-2 hit check (§2.6) and critical chance (§2.5) [research/ffx2-combat-core.md].
 * Split out of `formulas.ts` (house rule 7) and re-exported from it.
 *
 * **A restorative action on your own side never rolls** (PR-0075, FFX-2 only). §2.6 is an
 * attacker-versus-defender points race; no source applies it to a friendly target, and the
 * §2.9.1 tables that carry an Accuracy column mark every ally-support row "—" (no check).
 * FFX makes the same carve-out in `battle/ffx/accuracy.ts` [ffx-combat-core §2.11].
 * Preflight: `docs/plans/ffx2-item-accuracy-review.md`.
 *
 * **Magic never rolls** (AGENTS.md hard rule 5; combat-fixes-0924 (a), FFX-2 only). Every §2.6 rule
 * is about physical attacks ("physical attacks always connect", "party physicals never miss",
 * Darkness: "physical attacks frequently miss"), and the §2.9 magic tables carry no Accuracy
 * column. The one magic-formula row §2.9 marks `Stat` (Gunner's Enchanted Ammo) opts back in with
 * `canMiss: true` on its data row. A numeric `accuracy` still wins: §2.9 calls it "a flat override".
 * The guard reads `canMiss !== true`, so an unset field on a magical row **hits** (rule 5's safe
 * direction); the opt-in set is pinned in `tests/unit/ffx2-magic-never-misses.test.ts`, so a new
 * magical row that sets `canMiss: true` fails that test until its source is named.
 * Preflight: `docs/plans/combat-fixes-0924-review.md`.
 */

import type { AbilityDef, FFX2Combatant, StatusId } from '../common/types.ts';
import {
  ACCU_POINTS_PER_LEVEL,
  DARKNESS_ACCURACY_DIVISOR,
  ENEMY_BASE_ACCURACY,
  EVA_POINTS_PER_LEVEL,
  LUCK_POINTS_PER_LEVEL,
} from './constants.ts';
import { statLevel } from './statuses.ts';

function has(c: FFX2Combatant, id: StatusId): boolean {
  return Boolean(c.statuses[id]);
}

/**
 * A heal, a recovery or any item: the same `heals` spelling `computeDamage` uses, plus the
 * item category (Potions, Ethers, the Alchemist's stash). Hostile actions are never this.
 */
export function isRestorative(ability: AbilityDef): boolean {
  return ability.flags.includes('heals') || ability.formula === 'healing' || ability.category === 'item';
}

/**
 * §2.6: a flat additive points race, not a ratio. Darkness **divides** Accuracy
 * by four, which is why blinding the party is X-2's most damaging debuff.
 */
export function hitPercent(user: FFX2Combatant, target: FFX2Combatant, ability: AbilityDef): number {
  if (typeof ability.accuracy === 'number') return Math.max(0, Math.min(100, ability.accuracy));
  if (ability.canMiss === false) return 100;
  // Magic always hits, on either side; only a sourced `Stat` row opts back in (see the header).
  if (ability.damageType === 'magical' && ability.canMiss !== true) return 100;
  // Status-only actions are gated by the §2.6a infliction formulas, not by the
  // physical hit check — the same carve-out §2.6 makes for Death and Eject.
  if (ability.formula === 'none') return 100;
  // A heal or item on your own side has no defender to race (PR-0075). A Confused
  // girl's Attack on an ally is not restorative and still rolls.
  if (user.side === target.side && isRestorative(ability)) return 100;

  // An enemy whose Accuracy is absent from the record uses the baseline; see
  // ENEMY_BASE_ACCURACY for the conflict this resolves.
  const ownAcc = user.side === 'enemy' && user.stats.acc === 0 ? ENEMY_BASE_ACCURACY : user.stats.acc;
  const rawAcc = ability.flags.includes('affected-by-darkness') || ability.damageType === 'physical'
    ? has(user, 'darkness')
      ? Math.floor(ownAcc / DARKNESS_ACCURACY_DIVISOR)
      : ownAcc
    : ownAcc;

  const attacker =
    rawAcc +
    user.stats.luck +
    ACCU_POINTS_PER_LEVEL * (statLevel(user, 'accu-up') - statLevel(user, 'accu-down')) +
    LUCK_POINTS_PER_LEVEL * (statLevel(user, 'luck-up') - statLevel(user, 'luck-down'));

  // Sleep sets Evasion to 0; Stop and an open chain window forbid evading at all.
  const evasion = has(target, 'sleep') || has(target, 'stop') ? 0 : target.stats.eva;
  const defender =
    evasion +
    target.stats.luck +
    EVA_POINTS_PER_LEVEL * (statLevel(target, 'eva-up') - statLevel(target, 'eva-down')) +
    LUCK_POINTS_PER_LEVEL * (statLevel(target, 'luck-up') - statLevel(target, 'luck-down'));

  return Math.max(0, Math.min(100, Math.floor(attacker - defender)));
}

/**
 * Critical chance. §2.5 says only "attacker's Luck vs target's Luck" — no
 * source publishes the curve, so this is an `[estimate]`: a quarter of the Luck
 * gap, plus the ability's own bonus. Tune here, not at call sites.
 */
export function critPercent(user: FFX2Combatant, target: FFX2Combatant, ability: AbilityDef): number {
  if (!ability.flags.includes('crit-eligible')) return 0;
  const userLuck =
    user.stats.luck + LUCK_POINTS_PER_LEVEL * (statLevel(user, 'luck-up') - statLevel(user, 'luck-down'));
  const targetLuck =
    target.stats.luck +
    LUCK_POINTS_PER_LEVEL * (statLevel(target, 'luck-up') - statLevel(target, 'luck-down'));
  const gap = Math.floor((userLuck - targetLuck) / 4);
  return Math.max(0, Math.min(100, gap + (ability.bonusCrit ?? 0)));
}
