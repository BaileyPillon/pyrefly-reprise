/**
 * FF7's damage chain [core §4, single source: Fergusson BM §3.4 and §3.6 unless noted].
 *
 * Pure, integer, deterministic. Nothing here is shared with the FFX or FFX-2
 * chains. Game case: **FF7 only.** Section references are to
 * `research/ff7-battle-core.md` ("core") and `research/ff7-guard-scorpion.md` ("gs").
 *
 * The chain, in order:
 * 1. {@link rawDamage}: the formula (Physical, Magical, Cure, Item, Fixed, HP%).
 * 2. {@link applyModifiers}: the twelve modifiers **strictly in core §4.5's order**,
 *    the last one Random Variation, which is why a computed value is the
 *    **maximum** and `3841/4096` of it the minimum.
 * 3. {@link resolveElements}: Death Weakness > Recovery > Immune > Absorb >
 *    Weak/Resist > Normal [core §4.6 step 2]. Weakness comes **after** variance,
 *    so a weak spell's range is exactly twice the neutral one.
 * 4. {@link finalDamage}: the 9,999 / 999 cap, the immunity re-check, Lucky 7s
 *    [core §4.6 steps 3 to 5].
 * 5. {@link applyHpChange}: heal capped at Max HP, damage floored at 0 [core §4.6 step 6].
 *
 * The only random draw in this file is Random Variation's `Rnd(0..255)`
 * ({@link rollVariance}); every other function takes its roll as a number so a
 * test can pin the minimum (0) and the maximum (255).
 */

import type { Rng } from '../common/types.ts';
import type { Ff7Affinity, Ff7Element, Ff7Formula } from './defs.ts';
import { trunc } from './stats.ts';

// ---------------------------------------------------------------------------
// Constants [core §4]
// ---------------------------------------------------------------------------

/** `16 * 512`: the divisor of the Physical and Magical formulas [core §4.1, §4.2]. */
export const FORMULA_DIVISOR = 16 * 512;
/** Random Variation: `[x (3841 + Rnd(0..255)) / 4096]` [core §4.5 step 12]. */
export const VARIANCE_MIN = 3841;
export const VARIANCE_ROLL_MAX = 255;
export const VARIANCE_DIVISOR = 4096;
/** HP damage cap and MP damage cap [core §4.6 step 3]. */
export const HP_DAMAGE_CAP = 9999;
export const MP_DAMAGE_CAP = 999;
/** Lucky 7s [core §4.6 step 5]. */
export const LUCKY_SEVENS = 7777;
/** The Back Attack multiplier for the party and almost all enemies: 16, read as `/ 8` = x2 [core §4.5 step 5]. */
export const BACK_ATTACK_MULTIPLIER = 16;
/** Cure's constant: `Base + 22 * Power` [core §4.3]. */
export const CURE_CONSTANT = 22;
/** Fixed formula: `Power * 20` (Potion 100) [core §4.4]. */
export const FIXED_MULTIPLIER = 20;

// ---------------------------------------------------------------------------
// 1. Formulas
// ---------------------------------------------------------------------------

/** Physical Base: `Att + [(Att + Lvl) / 32] * [(Att * Lvl) / 32]` [core §4.1, verified: 2 sources]. */
export function physicalBase(att: number, level: number): number {
  return att + trunc((att + level) / 32) * trunc((att * level) / 32);
}

/** Physical damage: `[(Power * (512 - Def) * Base) / (16 * 512)]` [core §4.1]. */
export function physicalDamage(power: number, def: number, base: number): number {
  return trunc((power * (512 - def) * base) / FORMULA_DIVISOR);
}

/** Magical Base: `6 * (MAt + Lvl)` [core §4.2]. */
export function magicalBase(mat: number, level: number): number {
  return 6 * (mat + level);
}

/** Magical damage: `[(Power * (512 - MDf) * Base) / (16 * 512)]` [core §4.2]. */
export function magicalDamage(power: number, mdf: number, base: number): number {
  return trunc((power * (512 - mdf) * base) / FORMULA_DIVISOR);
}

/** Cure amount: `Base + 22 * Power` (Cure = Base + 110) [core §4.3]. */
export function cureAmount(power: number, base: number): number {
  return base + CURE_CONSTANT * power;
}

/** Item damage: `[16 * Power * (512 - Def) / 512]` (magical items read MDf) [core §4.4]. */
export function itemDamage(power: number, defense: number): number {
  return trunc((16 * power * (512 - defense)) / 512);
}

/** Fixed: `Power * 20` [core §4.4]. */
export function fixedAmount(power: number): number {
  return power * FIXED_MULTIPLIER;
}

/** HP% / Max HP%: `[HP * Power / 32]` [core §4.4]. */
export function hpPercentAmount(hp: number, power: number): number {
  return trunc((hp * power) / 32);
}

/** What {@link rawDamage} reads from the user. */
export interface Ff7AttackerNumbers {
  level: number;
  att: number;
  mat: number;
}

/** What {@link rawDamage} reads from the target (the current form's Def and MDf for an enemy). */
export interface Ff7TargetNumbers {
  def: number;
  mdf: number;
  hp: number;
  maxHp: number;
}

/** Step 1: the formula's value before any modifier [core §4.1 to §4.4]. */
export function rawDamage(formula: Ff7Formula, power: number, user: Ff7AttackerNumbers, target: Ff7TargetNumbers): number {
  switch (formula) {
    case 'physical':
      return physicalDamage(power, target.def, physicalBase(user.att, user.level));
    case 'magical':
      return magicalDamage(power, target.mdf, magicalBase(user.mat, user.level));
    case 'cure':
      return cureAmount(power, magicalBase(user.mat, user.level));
    case 'item':
      // The slice has no magical item; one would pass MDf [core §4.4].
      return itemDamage(power, target.def);
    case 'fixed':
      return fixedAmount(power);
    case 'hp-percent':
      return hpPercentAmount(target.hp, power);
    case 'max-hp-percent':
      return hpPercentAmount(target.maxHp, power);
    case 'none':
      return 0;
  }
}

// ---------------------------------------------------------------------------
// 2. Modifiers, strictly in order [core §4.5]
// ---------------------------------------------------------------------------

/** The modifier inputs. Everything absent is off. */
export interface Ff7ModifierContext {
  formula: Ff7Formula;
  /** 1. Critical hit (physical). */
  critical?: boolean;
  /** 2. Berserk on the attacker (physical). */
  attackerBerserk?: boolean;
  /** 3. Row check result from {@link rowHalves} (physical). */
  rowHalves?: boolean;
  /** 4. Target used Defend on its most recent turn (physical) [core §5.2]. */
  targetDefending?: boolean;
  /** 5. Target back-attacked (physical); the multiplier defaults to 16. */
  backAttack?: boolean;
  backAttackMultiplier?: number;
  /** 6. Frog on the attacker (physical). */
  attackerFrog?: boolean;
  /** 7. Sadness on the target (physical, magical). */
  targetSadness?: boolean;
  /** 8. Quadra Magic, else the split from {@link splits}. */
  quadraMagic?: boolean;
  split?: boolean;
  /** 9. Barrier (read by physical) / MBarrier (read by magical and Cure) on the target. */
  targetBarrier?: boolean;
  targetMBarrier?: boolean;
  /** 10. MP Turbo level (0 = none). */
  mpTurboLevel?: number;
  /** 11. Mini on the attacker (physical). */
  attackerMini?: boolean;
}

/** Which of the twelve steps a formula takes [core §4.5, the "Applies to" column and the note under it]. */
function takes(formula: Ff7Formula, step: number): boolean {
  switch (formula) {
    case 'physical':
      return true;
    case 'magical':
      return step === 7 || step === 8 || step === 9 || step === 10 || step === 12;
    case 'cure':
      return step === 8 || step === 9 || step === 10 || step === 12;
    case 'item':
      return step === 12;
    // HP%: "Only modifier: Quadra Magic" [core §4.4]; the split row says "never HP%" [core §4.5 step 8].
    case 'hp-percent':
    case 'max-hp-percent':
      return step === 8;
    case 'fixed':
    case 'none':
      return false;
  }
}

/** Random Variation at a given roll 0..255: `[x (3841 + roll) / 4096]`, then 0 becomes 1 [core §4.5 step 12]. */
export function variance(damage: number, roll: number): number {
  const r = Math.max(0, Math.min(VARIANCE_ROLL_MAX, Math.trunc(roll)));
  const out = trunc((damage * (VARIANCE_MIN + r)) / VARIANCE_DIVISOR);
  return out === 0 ? 1 : out;
}

/** Draw Random Variation's `Rnd(0..255)`: one draw from the seeded stream. */
export function rollVariance(rng: Rng): number {
  return rng.int(0, VARIANCE_ROLL_MAX);
}

/**
 * Step 2: the modifiers in core §4.5's order. `varianceRoll` is the 0..255 draw
 * (0 gives the minimum, 255 the maximum); it is ignored by a formula that does
 * not take step 12 (Fixed, HP%).
 */
export function applyModifiers(damage: number, ctx: Ff7ModifierContext, varianceRoll: number): number {
  const f = ctx.formula;
  let d = damage;
  if (takes(f, 1) && ctx.critical) d = d * 2;
  if (takes(f, 2) && ctx.attackerBerserk) d = trunc((d * 3) / 2);
  if (takes(f, 3) && ctx.rowHalves) d = trunc(d / 2);
  if (takes(f, 4) && ctx.targetDefending) d = trunc(d / 2);
  if (takes(f, 5) && ctx.backAttack) d = trunc((d * (ctx.backAttackMultiplier ?? BACK_ATTACK_MULTIPLIER)) / 8);
  if (takes(f, 6) && ctx.attackerFrog) d = trunc(d / 4);
  if (takes(f, 7) && ctx.targetSadness) d = d - trunc((d * 3) / 10);
  if (takes(f, 8)) {
    if (ctx.quadraMagic) d = trunc(d / 2);
    else if (ctx.split && f !== 'hp-percent' && f !== 'max-hp-percent') d = trunc((d * 2) / 3);
  }
  if (takes(f, 9)) {
    const barrier = f === 'physical' ? ctx.targetBarrier : ctx.targetMBarrier;
    if (barrier) d = trunc(d / 2);
  }
  if (takes(f, 10) && (ctx.mpTurboLevel ?? 0) > 0) d = trunc((d * (10 + (ctx.mpTurboLevel ?? 0))) / 10);
  if (takes(f, 11) && ctx.attackerMini) d = 0;
  if (takes(f, 12)) d = variance(d, varianceRoll);
  return d;
}

// ---------------------------------------------------------------------------
// Rows, Long Range, split [core §4.5, §5.1]
// ---------------------------------------------------------------------------

/** A combatant as the row check sees it. Only a party member's back row counts [core §5.1]. */
export interface Ff7RowSubject {
  side: 'party' | 'enemy' | 'aeon';
  row: 'front' | 'back';
}

/**
 * The row check [core §4.5 step 3, §5.1, verified: 2 sources]: halve once if the
 * attacker **or** the target is a party member in the back row and the action
 * is not Long Range. Enemies have rows for targeting but no back-row damage rule.
 */
export function rowHalves(attacker: Ff7RowSubject, target: Ff7RowSubject, longRange: boolean): boolean {
  if (longRange) return false;
  const back = (c: Ff7RowSubject): boolean => c.side === 'party' && c.row === 'back';
  return back(attacker) || back(target);
}

/**
 * Does a hit split (`x 2/3`) [core §4.5 step 8]? Physical and Cure split on more
 * than one target; Magical only when the ability can toggle between one and all.
 */
export function splits(formula: Ff7Formula, targetCount: number, canToggleAll: boolean): boolean {
  if (targetCount <= 1) return false;
  if (formula === 'physical' || formula === 'cure') return true;
  if (formula === 'magical') return canToggleAll;
  return false;
}

// ---------------------------------------------------------------------------
// 3. Elements [core §4.6 step 2, §6.2]
// ---------------------------------------------------------------------------

/** What the element check turns a hit into. */
export type Ff7ElementOutcome =
  | { kind: 'death' }
  /** Recovery exists on a few enemies; its effect is not in the research (unreachable in the slice) [core §6.2]. */
  | { kind: 'recovery' }
  /** Damage 0; a miss if a status had landed or the element was Earth. */
  | { kind: 'immune'; countsAsMiss: boolean }
  | { kind: 'damage'; amount: number; restorative: boolean };

/** Affinity of a target to each of an action's elements. */
function levels(elements: readonly Ff7Element[], affinities: Readonly<Record<string, Ff7Affinity>>): Ff7Affinity[] {
  const out: Ff7Affinity[] = [];
  for (const e of elements) {
    const a = affinities[e];
    if (a) out.push(a);
  }
  return out;
}

/**
 * Step 3: elements by priority, Death Weakness > Recovery > Immune > Absorb >
 * Weak/Resist > Normal [core §4.6 step 2, single source: Fergusson BM §3.6].
 * Weak (and not absorbing) doubles; Resist is `[(dmg + 1) / 2]`; both together
 * cancel. `restorative` is the action's own healing flag (Cure); Absorb toggles it.
 */
export function resolveElements(
  damage: number,
  elements: readonly Ff7Element[],
  affinities: Readonly<Record<string, Ff7Affinity>>,
  restorative: boolean,
  statusLanded = false,
): Ff7ElementOutcome {
  const ls = levels(elements, affinities);
  if (ls.includes('death')) return { kind: 'death' };
  if (ls.includes('recovery')) return { kind: 'recovery' };
  if (ls.includes('void')) return { kind: 'immune', countsAsMiss: statusLanded || elements.includes('earth') };
  const absorbing = ls.includes('absorb');
  const heal = absorbing ? !restorative : restorative;
  const weak = !absorbing && ls.includes('weak');
  const resist = ls.includes('half');
  let amount = damage;
  if (weak && !resist) amount = amount * 2;
  else if (resist && !weak) amount = trunc((amount + 1) / 2);
  return { kind: 'damage', amount, restorative: heal };
}

/** True when an affinity forces a hit: Death Weakness, Auto-Hit, Immune or Absorb [core §3.1, §3.2]. */
export function affinityForcesHit(elements: readonly Ff7Element[], affinities: Readonly<Record<string, Ff7Affinity>>): boolean {
  return levels(elements, affinities).some((a) => a === 'death' || a === 'auto-hit' || a === 'void' || a === 'absorb');
}

// ---------------------------------------------------------------------------
// 4. Final checks [core §4.6 steps 3 to 5]
// ---------------------------------------------------------------------------

/** Inputs of the last checks. */
export interface Ff7FinalContext {
  /** MP damage caps at 999 instead of 9,999. */
  mpDamage?: boolean;
  /** Physical / Magical Immunity, Peerless or Petrify on the target: 0 [core §4.6 step 4]. */
  targetNullifies?: boolean;
  /** The attacker's current HP, for Lucky 7s [core §4.6 step 5]. */
  attackerHp?: number;
}

/** Steps 3 to 5: cap, the immunity re-check, Lucky 7s. */
export function finalDamage(amount: number, ctx: Ff7FinalContext = {}): number {
  let d = Math.min(amount, ctx.mpDamage ? MP_DAMAGE_CAP : HP_DAMAGE_CAP);
  if (ctx.targetNullifies) d = 0;
  if (ctx.attackerHp === LUCKY_SEVENS) d = LUCKY_SEVENS;
  return d;
}

/** Step 6: heal capped at Max HP, damage floored at 0 [core §4.6 step 6]. */
export function applyHpChange(hp: number, maxHp: number, amount: number, heal: boolean): number {
  return heal ? Math.min(maxHp, hp + amount) : Math.max(0, hp - amount);
}

// ---------------------------------------------------------------------------
// The whole chain at one roll (what tests, the advisor and resolve.ts call)
// ---------------------------------------------------------------------------

/** One action on one target, everything the chain reads. */
export interface Ff7DamageInput {
  formula: Ff7Formula;
  power: number;
  user: Ff7AttackerNumbers;
  target: Ff7TargetNumbers;
  elements: readonly Ff7Element[];
  affinities: Readonly<Record<string, Ff7Affinity>>;
  /** Heals without a Restorative element (Potion); a Restorative element heals on its own. */
  heals?: boolean;
  modifiers?: Omit<Ff7ModifierContext, 'formula'>;
  final?: Ff7FinalContext;
}

/** The chain at a fixed variance roll 0..255. */
export function damageAtRoll(input: Ff7DamageInput, varianceRoll: number): Ff7ElementOutcome {
  const raw = rawDamage(input.formula, input.power, input.user, input.target);
  const modded = applyModifiers(raw, { formula: input.formula, ...input.modifiers }, varianceRoll);
  const restorative = input.heals === true || input.elements.includes('restorative');
  const out = resolveElements(modded, input.elements, input.affinities, restorative);
  if (out.kind !== 'damage') return out;
  return { ...out, amount: finalDamage(out.amount, input.final) };
}

/** Minimum and maximum of the chain (variance rolls 0 and 255), for `kind: 'damage'` outcomes. */
export function damageRange(input: Ff7DamageInput): { min: number; max: number } {
  const lo = damageAtRoll(input, 0);
  const hi = damageAtRoll(input, VARIANCE_ROLL_MAX);
  if (lo.kind !== 'damage' || hi.kind !== 'damage') throw new Error(`FF7 damageRange: outcome is '${lo.kind}', not damage`);
  return { min: lo.amount, max: hi.amount };
}
