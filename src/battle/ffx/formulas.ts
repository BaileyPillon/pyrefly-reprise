/**
 * The FFX damage chain [ffx-combat-core §2].
 *
 * Every step is integer arithmetic flooring toward negative infinity, and the
 * chain is run *once per hit*. Healing is **negative damage** — the sign flips
 * at step 14 and only when the target is not a Zombie, which is the whole
 * reason Zombie works and why the contract forbids a `heal` event for
 * damage-formula healing [docs/CONTRACTS.md].
 */

import type {
  Affinity,
  AbilityDef,
  DamageType,
  ElementId,
  FFXCombatant,
  FormulaKey,
} from '../common/types.ts';
import { idiv, mitigation, mulDivFloor } from './math.ts';
import { resolveAffinity } from './elements.ts';

// Re-exported so callers have one import site for "what this action produces".
export { resolveAffinity, resolveElements } from './elements.ts';
import {
  damageCapFor,
  defensiveBonusPercent,
  hasAuto,
  offensiveBonusPercent,
} from './equipment.ts';
import { has, stacks } from './state.ts';

/** Which pool an action's amount is applied to. */
export type DamagePool = 'hp' | 'mp' | 'ctb' | 'both';

/** The timed-input bonus payload [ffx-combat-core §5.2]. */
export interface TimingBonus {
  timeRemainingMs: number;
  timerMs: number;
}

/** Everything one hit of the damage chain needs. */
export interface DamageInput {
  user: FFXCombatant;
  target: FFXCombatant;
  def: AbilityDef;
  /** Overrides `def.power` (Slots resolve their own DmgCon, Fury its tier). */
  power?: number;
  crit: boolean;
  /** `damageRNG`, a uniform integer 0-31. 16 is exactly x1.0. */
  varianceRoll: number;
  /** Resolved element set, including weapon strikes. */
  elements: readonly ElementId[];
  timing?: TimingBonus | null;
  /** Spare Change only. */
  gilSpent?: number;
  /** The target's CTB counter, for the `ctb` formula. */
  targetCtb?: number;
}

/** What one hit of the damage chain produced. */
export interface DamageResult {
  /** Signed amount. Positive damages, negative restores. */
  amount: number;
  affinity: Affinity;
  /** True when the 9 999 / 99 999 cap bit. */
  capped: boolean;
}

// ---------------------------------------------------------------------------
// POWER [ffx-combat-core §2.2]
// ---------------------------------------------------------------------------

/** `(stat^3 // 32) + 30`. The frequently-quoted "+32" is a guide error. */
function cubicPower(stat: number): number {
  return idiv(stat * stat * stat, 32) + 30;
}

/** `(stat^2 // 6 + DmgCon) * DmgCon // 4`. */
function quadraticPower(stat: number, dmgCon: number): number {
  return idiv((idiv(stat * stat, 6) + dmgCon) * dmgCon, 4);
}

/** `((stat + DmgCon) // 2) * DmgCon`. */
function healingPower(stat: number, dmgCon: number): number {
  return idiv(stat + dmgCon, 2) * dmgCon;
}

/** The offensive stat a formula reads, including its stacking buff. */
export function offensiveStat(user: FFXCombatant, formula: FormulaKey): number {
  switch (formula) {
    case 'strength':
    case 'piercing-strength':
      return user.stats.str + stacks(user, 'cheer');
    case 'magic':
    case 'piercing-magic':
    case 'special-magic':
    case 'healing':
      return user.stats.mag + stacks(user, 'focus');
    default:
      return 0;
  }
}

/**
 * The defensive stat a formula reads, after the Break overrides.
 *
 * Defense is floored at 1 for the Strength formula and **set to 0** by Armor
 * Break or a piercing action; Magic Defense likewise, zeroed by Mental Break or
 * a piercing-magic action, and always 0 for `special-magic`
 * [ffx-combat-core §2.3].
 */
export function defensiveStat(target: FFXCombatant, def: AbilityDef): number {
  const piercesArmor = def.flags.includes('piercing') || def.ignoresDefense === true;
  switch (def.formula) {
    case 'strength':
      if (has(target, 'armor-break') || piercesArmor) return 0;
      return Math.max(target.stats.def, 1);
    case 'piercing-strength':
      return 0;
    case 'magic':
      if (has(target, 'mental-break') || piercesArmor) return 0;
      return Math.max(target.stats.mdef, 1);
    case 'piercing-magic':
    case 'special-magic':
      return 0;
    case 'healing':
      return 0;
    default:
      return 0;
  }
}

/** The target's Cheer / Focus stacks that feed the `(15 - buffs)` term. */
function defensiveBuffs(target: FFXCombatant, formula: FormulaKey): number {
  switch (formula) {
    case 'strength':
    case 'piercing-strength':
      return stacks(target, 'cheer');
    case 'magic':
    case 'piercing-magic':
    case 'special-magic':
    case 'healing':
      return stacks(target, 'focus');
    default:
      return 0;
  }
}

/**
 * The shared skeleton [ffx-combat-core §2.1].
 *
 * ```
 * d1  = POWER * MITIGATION
 * d2  = (d1 * -1282606671) // 0xFFFFFFFF
 * d3  = ((d1 + d2) // 0x200) * (15 - defensiveBuffs)
 * d4  = (d3 * -2004318071) // 0xFFFFFFFF
 * dmg = (d3 + d4) // 8
 * ```
 *
 * At MITIGATION 730 with no defensive buffs the chain is exactly the identity,
 * which is why `Cure` at Magic 20 restores its POWER of 528 on the nose.
 */
export function damageSkeleton(power: number, mit: number, buffs: number): number {
  const d1 = power * mit;
  const d2 = mulDivFloor(d1, -1282606671, 0xffffffff);
  const d3 = idiv(d1 + d2, 0x200) * (15 - buffs);
  const d4 = mulDivFloor(d3, -2004318071, 0xffffffff);
  return idiv(d3 + d4, 8);
}

/** Which pool an action's amount lands in. */
export function poolOf(def: AbilityDef): DamagePool {
  if (def.formula === 'lancet') return 'both';
  if (def.formula === 'ctb') return 'ctb';
  if (def.flags.includes('drains-mp')) return 'mp';
  return 'hp';
}

/**
 * Pre-modifier damage: POWER, MITIGATION, the skeleton, the
 * Strength/Special-Magic `x DmgCon/16` step and the variance roll.
 */
export function baseDamage(input: DamageInput): number {
  const { user, target, def } = input;
  const dmgCon = input.power ?? def.power;
  const pool = poolOf(def);

  switch (def.formula) {
    case 'fixed':
      return idiv(dmgCon * 50 * (input.varianceRoll + 240), 256);
    case 'fixed-no-variance':
      return dmgCon * 50;
    case 'percent-total':
      return idiv((pool === 'mp' ? target.stats.maxMp : target.stats.maxHp) * dmgCon, 16);
    case 'percent-current':
      return idiv((pool === 'mp' ? target.mp : target.hp) * dmgCon, 16);
    case 'user-max-hp':
      return idiv(user.stats.maxHp * dmgCon, 10);
    case 'ctb':
      return idiv((input.targetCtb ?? 0) * dmgCon, 16);
    case 'gil':
      return idiv(input.gilSpent ?? 0, 10);
    case 'deal-9999':
      return 9999 * dmgCon;
    case 'none':
      return 0;
    case 'fractional':
    case 'multiple':
      // FFX-2 shapes; an FFX data file should never reach here.
      return 0;
    default:
      break;
  }

  const stat = def.formula === 'lancet' ? user.stats.mag + stacks(user, 'focus') : offensiveStat(user, def.formula);
  let power: number;
  switch (def.formula) {
    case 'strength':
    case 'piercing-strength':
    case 'special-magic':
      power = cubicPower(stat);
      break;
    case 'healing':
      power = healingPower(stat, dmgCon);
      break;
    default:
      // `magic`, `piercing-magic`, `lancet`
      power = quadraticPower(stat, dmgCon);
      break;
  }

  const defStat = def.formula === 'lancet' ? 0 : defensiveStat(target, def);
  let dmg = damageSkeleton(power, mitigation(defStat), defensiveBuffs(target, def.formula));

  if (def.formula === 'strength' || def.formula === 'piercing-strength' || def.formula === 'special-magic') {
    dmg = idiv(dmg * dmgCon, 16);
  }
  return idiv(dmg * (input.varianceRoll + 240), 256);
}

// ---------------------------------------------------------------------------
// The full chain [ffx-combat-core §2.4]
// ---------------------------------------------------------------------------

function blockedByImmunity(target: FFXCombatant, def: AbilityDef, type: DamageType): boolean {
  const flags = target.immunityFlags;
  if (flags.includes('immune-to-damage')) return true;
  if (type === 'physical' && flags.includes('immune-to-physical-damage')) return true;
  if (type === 'magical' && flags.includes('immune-to-magical-damage')) return true;
  if (
    (def.formula === 'percent-total' || def.formula === 'percent-current') &&
    flags.includes('immune-to-percentage-damage')
  ) {
    return true;
  }
  return false;
}

/**
 * Run one hit end to end and return the **signed** amount.
 *
 * The modifier order is exactly §2.4's table; reordering any of it changes
 * results, because every step floors.
 */
export function computeDamage(input: DamageInput): DamageResult {
  const { user, target, def } = input;
  const type = def.damageType;
  const heals = def.flags.includes('heals');

  if (blockedByImmunity(target, def, type)) {
    return { amount: 0, affinity: 'immune', capped: false };
  }

  let dmg = baseDamage(input);
  let affinity: Affinity = 'normal';

  // 1. Critical hit.
  if (input.crit) dmg *= 2;
  // 2/3. Aeon stances. Both modify percentage and fixed damage too.
  if (has(target, 'boost')) dmg = Math.trunc(dmg * 1.5);
  if (has(target, 'shield')) dmg = idiv(dmg, 4);

  // 4. Elemental affinity.
  if (def.formula !== 'none' && dmg !== 0) {
    const res = resolveAffinity(target, input.elements);
    affinity = res.affinity;
    if (res.multiplier !== 1) dmg = Math.trunc(dmg * res.multiplier);
  }

  // 5. Physical-only modifiers.
  if (type === 'physical') {
    if (has(target, 'protect')) dmg = idiv(dmg, 2);
    if (has(user, 'berserk')) dmg = Math.trunc(dmg * 1.5);
    if (has(user, 'power-break')) dmg = idiv(dmg, 2);
    if (has(target, 'defend') || has(target, 'sentinel')) dmg = idiv(dmg, 2);
  }
  // 6. Magical-only modifiers.
  if (type === 'magical') {
    if (hasAuto(user, 'magic-booster')) dmg = Math.trunc(dmg * 1.5);
    if (has(target, 'shell')) dmg = idiv(dmg, 2);
    if (has(user, 'magic-break')) dmg = idiv(dmg, 2);
  }

  // 7. Alchemy doubles recovery items.
  if (heals && def.category === 'item' && hasAuto(user, 'alchemy')) dmg *= 2;

  // 8/9. Percentage auto-abilities.
  const offense = offensiveBonusPercent(user, type);
  if (offense > 0) dmg = dmg + idiv(dmg * offense, 100);
  const defense = defensiveBonusPercent(target, type);
  if (defense > 0) dmg = dmg - idiv(dmg * defense, 100);

  // 10. Armored.
  if (
    target.immunityFlags.includes('armored') &&
    type === 'physical' &&
    !def.flags.includes('ignores-armored') &&
    !def.flags.includes('piercing') &&
    !hasAuto(user, 'piercing') &&
    !has(target, 'armor-break')
  ) {
    dmg = idiv(dmg, 3);
  }

  // 11. Drain sign. Zombie on exactly one side reverses a drain; both cancel.
  if (def.flags.includes('drains') || def.flags.includes('drains-mp') || def.formula === 'lancet') {
    if (has(user, 'zombie')) dmg *= -1;
    if (has(target, 'zombie')) dmg *= -1;
  }

  // 12. Overdrive timing bonus.
  if (input.timing && input.timing.timerMs > 0) {
    const remaining = Math.min(input.timing.timeRemainingMs, input.timing.timerMs);
    dmg = dmg + idiv(dmg * remaining, input.timing.timerMs * 2);
  }

  // 13. Damage limit. Applied BEFORE the heal sign flip, so healing is capped too.
  const cap = damageCapFor(user, def.flags);
  let capped = false;
  if (dmg > cap) {
    dmg = cap;
    capped = true;
  } else if (dmg < -cap) {
    dmg = -cap;
    capped = true;
  }

  // 14. Heal sign. A Zombie target keeps the positive sign and takes the hit.
  if (heals && !has(target, 'zombie')) dmg *= -1;

  // 15. Trio of 9999 / Quartet of 9.
  if (has(target, 'damage-9999') || has(user, 'damage-9999')) {
    if (dmg > 0 && dmg <= 9999) dmg = 9999;
    else if (dmg < 0 && dmg >= -9999) dmg = -9999;
  }

  return { amount: dmg, affinity, capped };
}

/**
 * The reference figure Warrior mode measures against: damage dealt by Attack
 * ignoring the target's Defense, using Magic instead of Strength when Magic is
 * higher [ffx-combat-core §5.1].
 */
export function estimatedDamage(user: FFXCombatant): number {
  const stat = Math.max(user.stats.str, user.stats.mag);
  const dmg = damageSkeleton(cubicPower(stat), mitigation(0), 0);
  return Math.max(1, idiv(dmg * 16, 16));
}

// Hit and critical chance live in `accuracy.ts`; re-exported here so callers
// have one import site for "the numbers an action produces".
export { hitChance, critChance } from './accuracy.ts';
