/**
 * The FFX-2 damage chain — SinirothX's canonical 20-step flowchart
 * [ffx2-combat-core §2.1], re-exporting the hit check (§2.6) and criticals (§2.5) from `hit.ts`.
 *
 * This shares **nothing** with `battle/ffx/formulas`. X-2's pipeline is a
 * different shape: Level is a first-class term in the physical base, Defense is
 * linear (`(270 - Def) / 255`), the damage constant is split across two steps,
 * and the Up/Down statuses are +/-1/12 multiplicative rather than additive.
 *
 * **Healing is negative damage.** A `heals`-flagged action (or the `healing`
 * formula) returns a negative `amount`, which the engine emits as a `damage`
 * event with a negative value — never a `heal` event. `docs/CONTRACTS.md` rule
 * 5; it is what makes Absorb and Zombie-shaped effects fall out for free.
 */

import type {
  AbilityDef,
  Affinity,
  ElementId,
  FFX2Combatant,
  Rng,
  StatusId,
} from '../common/types.ts';
import { AFFINITY_MULTIPLIER_FFX2 } from '../common/types.ts';
import {
  BACK_ATTACK_MULTIPLIER,
  BASE_CUBIC_DIVISOR,
  BERSERK_MULTIPLIER,
  CRIT_MULTIPLIER,
  DAMAGE_9999,
  DAMAGE_CAP,
  DAMAGE_CAP_BROKEN,
  DEFENSE_DIVISOR,
  DEFENSE_NUMERATOR,
  MAGIC_CONSTANT_DIVISOR,
  MAGIC_RECOVERY_CONSTANT_DIVISOR,
  MULTI_TARGET_MULTIPLIER,
  PHYSICAL_CONSTANT_DIVISOR,
  PROTECT_MULTIPLIER,
  RANDOM_DIVISOR,
  RANDOM_MAX,
  RANDOM_MIN,
  SHELL_MULTIPLIER,
  UPDOWN_DIVISOR,
} from './constants.ts';
import { chainMultiplier } from './chain.ts';
import { statLevel } from './statuses.ts';

/** Step 7's roll, drawn as one integer in `[240, 271]`. §2.1 */
export function randomiserRoll(rng: Rng): number {
  return rng.int(RANDOM_MIN, RANDOM_MAX);
}

/** Step 1, physical: `(Lv + Str) * Lv * Str / 1024 + Str`. §2.1 */
export function physicalBase(level: number, str: number): number {
  return ((level + str) * level * str) / BASE_CUBIC_DIVISOR + str;
}

/** Step 1, magic and magic recovery: `Lv * 2 + Mag`. §2.1 */
export function magicBase(level: number, mag: number): number {
  return level * 2 + mag;
}

/** Step 1, special magic: `(Lv + Mag) * Lv * Mag / 1024 + Mag`. §2.1 */
export function specialMagicBase(level: number, mag: number): number {
  return ((level + mag) * level * mag) / BASE_CUBIC_DIVISOR + mag;
}

/** Step 3: linear and it bottoms out — Def >= 270 yields zero. §2.2 */
export function defenseTerm(def: number): number {
  return (DEFENSE_NUMERATOR - def) / DEFENSE_DIVISOR;
}

/** Element resolution: weaknesses **stack**, resistance halves only once. §2.7 */
export function resolveAffinity(target: FFX2Combatant, elements: readonly ElementId[]): {
  affinity: Affinity;
  multiplier: number;
} {
  const real = elements.filter((e) => e !== 'none');
  if (real.length === 0) return { affinity: 'normal', multiplier: 1 };

  let multiplier = 1;
  let weakCount = 0;
  let sawAbsorb = false;
  let sawImmune = false;
  let sawResist = false;

  for (const element of real) {
    const affinity = target.affinities[element] ?? 'normal';
    if (affinity === 'absorb') sawAbsorb = true;
    else if (affinity === 'immune') sawImmune = true;
    else if (affinity === 'weak') weakCount += 1;
    else if (affinity === 'resist') sawResist = true;
  }

  if (sawAbsorb) return { affinity: 'absorb', multiplier: AFFINITY_MULTIPLIER_FFX2.absorb };
  if (sawImmune) return { affinity: 'immune', multiplier: 0 };
  if (weakCount > 0) {
    multiplier = AFFINITY_MULTIPLIER_FFX2.weak ** weakCount;
    return { affinity: 'weak', multiplier };
  }
  if (sawResist) return { affinity: 'resist', multiplier: AFFINITY_MULTIPLIER_FFX2.resist };
  return { affinity: 'normal', multiplier: 1 };
}

function has(c: FFX2Combatant, id: StatusId): boolean {
  return Boolean(c.statuses[id]);
}

/** Everything the chain needs that is not on the ability or the two combatants. */
export interface DamageContext {
  user: FFX2Combatant;
  target: FFX2Combatant;
  ability: AbilityDef;
  /** Chain count applying to **this** hit (from `chain.registerHit`). */
  chainCount: number;
  crit: boolean;
  /** Step 7's roll. Injected so fixtures can pin it; 256 is exactly x1.0. */
  randomRoll: number;
  /** Step 11. Not reachable in our scripted boss fights. */
  backAttack?: boolean;
  /** Step 15 — player Black/White magic cast on *all*. Enemy party-wide moves are not halved. */
  multiTarget?: boolean;
  /** Step 12 escape hatch for Fiend Hunter x4, Magic Booster x1.5, item doublers. */
  otherMultiplier?: number;
  /** Step 8 flat addition (Finale +99999, Momentum + kills). */
  flatAddition?: number;
  /** Raises the cap to 99 999 (Break Damage Limit). */
  breaksDamageLimit?: boolean;
  /** Gil thrown, for the `gil` formula. */
  gilSpent?: number;
}

export interface DamageResult {
  /** Signed HP delta. Positive = damage, negative = healing. */
  amount: number;
  affinity: Affinity;
  capped: boolean;
  /** Step 20 fired: the presenter prints "IMMUNE". */
  immune: boolean;
}

/** Step 1 — pick the base number from the formula family. */
function stepOne(ctx: DamageContext): { base: number; skipDefense: boolean; skipConstant: boolean } {
  const { ability, user, target } = ctx;
  const level = user.level ?? 1;
  const power = ability.power;
  const extra = ability.extra ?? {};

  switch (ability.formula) {
    case 'strength':
      return { base: physicalBase(level, user.stats.str), skipDefense: false, skipConstant: false };
    case 'piercing-strength':
      return { base: physicalBase(level, user.stats.str), skipDefense: true, skipConstant: false };
    case 'magic':
      return { base: magicBase(level, user.stats.mag), skipDefense: false, skipConstant: false };
    case 'piercing-magic':
      return { base: magicBase(level, user.stats.mag), skipDefense: true, skipConstant: false };
    case 'special-magic':
      return {
        base: specialMagicBase(level, user.stats.mag),
        skipDefense: false,
        skipConstant: false,
      };
    case 'healing':
      return { base: magicBase(level, user.stats.mag), skipDefense: true, skipConstant: false };
    case 'fixed':
    case 'fixed-no-variance':
      // §2.9 provenance check: every published Mix value is `power * 50`.
      return { base: power * 50, skipDefense: true, skipConstant: true };
    case 'fractional':
    case 'percent-total':
      return {
        base: (target.stats.maxHp * power) / 16,
        skipDefense: true,
        skipConstant: true,
      };
    case 'percent-current':
      return { base: (target.hp * power) / 16, skipDefense: true, skipConstant: true };
    case 'user-max-hp':
      return { base: (user.stats.maxHp * power) / 10, skipDefense: true, skipConstant: true };
    case 'deal-9999':
      return { base: DAMAGE_9999 * power, skipDefense: true, skipConstant: true };
    case 'gil': {
      // X-2 Spare Change: `(22 * Gil) / (sqrt(Gil) + 20)`. §2.3
      const gil = Math.max(0, ctx.gilSpent ?? 0);
      return { base: (22 * gil) / (Math.sqrt(gil) + 20), skipDefense: true, skipConstant: true };
    }
    case 'multiple': {
      // §2.3 — the published one-offs, keyed off `AbilityDef.extra`.
      const flat = typeof extra['flat'] === 'number' ? (extra['flat'] as number) : 0;
      const byLevel =
        typeof extra['userLevelMultiplier'] === 'number' ? (extra['userLevelMultiplier'] as number) : 0;
      const byMaxHp =
        typeof extra['userMaxHpMultiplier'] === 'number' ? (extra['userMaxHpMultiplier'] as number) : 0;
      const byMissing =
        typeof extra['userMissingHpFraction'] === 'number'
          ? (extra['userMissingHpFraction'] as number)
          : 0;
      const base =
        flat +
        byLevel * level +
        byMaxHp * user.stats.maxHp +
        byMissing * (user.stats.maxHp - user.hp);
      return { base, skipDefense: true, skipConstant: true };
    }
    case 'lancet':
      return { base: physicalBase(level, user.stats.str), skipDefense: true, skipConstant: false };
    case 'ctb':
    case 'none':
    default:
      return { base: 0, skipDefense: true, skipConstant: true };
  }
}

/** Run the whole 20-step chain for one hit. */
export function computeDamage(ctx: DamageContext): DamageResult {
  const { ability, user, target } = ctx;
  const isPhysical = ability.damageType === 'physical';
  const isMagical = ability.damageType === 'magical';
  const isRecovery = ability.formula === 'healing';
  const flags = ability.flags;

  const { base, skipDefense, skipConstant } = stepOne(ctx);
  let value = base;
  if (value === 0 && ability.formula === 'none') {
    return { amount: 0, affinity: 'normal', capped: false, immune: false };
  }

  const constant = ability.power;

  // Step 2 — damage constant, part 1 (magic families only).
  if (!skipConstant && (ability.formula === 'magic' || ability.formula === 'piercing-magic')) {
    value = (value * constant * constant) / MAGIC_CONSTANT_DIVISOR;
  } else if (!skipConstant && isRecovery) {
    value = (value * constant * constant) / MAGIC_RECOVERY_CONSTANT_DIVISOR;
  }

  // Step 3 — Defense. Linear, and it bottoms out at Def >= 270.
  const ignoresDefense = skipDefense || flags.includes('piercing') || ability.ignoresDefense === true;
  if (!ignoresDefense) {
    value *= defenseTerm(isPhysical ? target.stats.def : target.stats.mdef);
  }

  // Step 4 — the attacker's STR/MAG Up-Down levels.
  if (isPhysical) {
    const lvl = statLevel(user, 'str-up') - statLevel(user, 'str-down');
    value *= (UPDOWN_DIVISOR + lvl) / UPDOWN_DIVISOR;
  } else if (isMagical || isRecovery) {
    const lvl = statLevel(user, 'mag-up') - statLevel(user, 'mag-down');
    value *= (UPDOWN_DIVISOR + lvl) / UPDOWN_DIVISOR;
  }

  // Step 5 — the target's DEF/MDEF Up-Down levels. No effect on fractional damage.
  if (!skipDefense) {
    if (isPhysical) {
      const lvl = statLevel(target, 'def-up') - statLevel(target, 'def-down');
      value *= (UPDOWN_DIVISOR - lvl) / UPDOWN_DIVISOR;
    } else if (isMagical) {
      const lvl = statLevel(target, 'mdef-up') - statLevel(target, 'mdef-down');
      value *= (UPDOWN_DIVISOR - lvl) / UPDOWN_DIVISOR;
    }
  }

  // Step 6 — damage constant, part 2 (physical and special magic).
  if (!skipConstant && !isRecovery && ability.formula !== 'magic' && ability.formula !== 'piercing-magic') {
    value = (value * constant) / PHYSICAL_CONSTANT_DIVISOR;
  }

  // Step 7 — randomiser. Applies to everything except menu-cast White Magic.
  value = (value * ctx.randomRoll) / RANDOM_DIVISOR;

  // Step 8 — flat addition (Finale, Momentum).
  value += ctx.flatAddition ?? 0;

  // Step 9 / 10 / 11.
  if (ctx.crit) value *= CRIT_MULTIPLIER;
  if (has(user, 'berserk')) value *= BERSERK_MULTIPLIER;
  if (ctx.backAttack && isPhysical) value *= BACK_ATTACK_MULTIPLIER;

  // Step 12 — the grab-bag (Fiend Hunter x4, Magic Booster x1.5, item doublers).
  if (ctx.otherMultiplier) value *= ctx.otherMultiplier;

  // Step 13 — Chain.
  value *= chainMultiplier(ctx.chainCount);

  // Step 14 — Element.
  const { affinity, multiplier } = resolveAffinity(target, ability.element);
  value *= multiplier;

  // Step 15 — multi-target halving, AFTER chain and element, BEFORE Protect/Shell.
  if (ctx.multiTarget) value *= MULTI_TARGET_MULTIPLIER;

  // Step 16 — Protect / Shell.
  if (isPhysical && has(target, 'protect')) value *= PROTECT_MULTIPLIER;
  if ((isMagical || isRecovery) && has(target, 'shell')) value *= SHELL_MULTIPLIER;

  // Healing is negative damage, so flip before the "damage" steps 17–20 clamp it.
  const heals = flags.includes('heals') || isRecovery;
  let amount = Math.trunc(value);
  if (heals) amount = -Math.abs(amount);

  // Step 17 — Defend / Sentinel: any Protect-reducible damage >= 2 becomes 1.
  // X-2 has no status id of its own for this; the shared `'defend'` id carries
  // it, with X-2's rule (flat 1 HP) rather than FFX's (halve).
  if (isPhysical && amount >= 2 && has(target, 'defend')) amount = 1;

  // Step 18 — the 9999-damage status (Cat Nip).
  if (has(user, 'damage-9999') && amount > 0 && amount < DAMAGE_9999) {
    amount = DAMAGE_9999;
  }

  // Step 19 — damage limit.
  const cap = ctx.breaksDamageLimit && !flags.includes('never-break-damage-limit')
    ? DAMAGE_CAP_BROKEN
    : flags.includes('always-break-damage-limit')
      ? DAMAGE_CAP_BROKEN
      : DAMAGE_CAP;
  const capped = Math.abs(amount) > cap;
  if (capped) amount = Math.sign(amount) * cap;

  // Step 20 — damage immunity.
  const immune =
    (isPhysical && has(target, 'null-physical')) ||
    ((isMagical || isRecovery) && has(target, 'null-magic')) ||
    has(target, 'invincible') ||
    affinity === 'immune' ||
    (skipDefense &&
      ability.formula !== 'none' &&
      target.immunityFlags.includes('immune-to-percentage-damage') &&
      (ability.formula === 'fractional' ||
        ability.formula === 'percent-total' ||
        ability.formula === 'percent-current'));
  if (immune && amount > 0) amount = 0;

  return { amount, affinity, capped, immune };
}

// The hit check (§2.6) and criticals (§2.5) live in `hit.ts`; re-exported so no
// importer changes.
export { critPercent, hitPercent } from './hit.ts';
