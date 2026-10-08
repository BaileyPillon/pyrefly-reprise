/**
 * The per-step modifiers of the HP damage chain, one function per game
 * function, with the game's exact integer semantics and side effects.
 *
 * **Game case: FFX only.**
 *
 * Source: FFX.exe Steam build 25501027. The chain is run by the per-hit
 * pipeline at 0x78e630 in this order (research/re-ffx-damage.md §3):
 *
 *   Shield/Boost 0x78c530, Shell 0x78adc0, Protect 0x78ad40, critical hit
 *   0x789690, Berserk 0x78c0b0, Magic Booster 0x78c580, Alchemy 0x78c5f0,
 *   party percent 0x7891e0, ratio immunity 0x78ad80, absorb flip 0x78a200,
 *   element 0x78a360 (element.ts), Armored 0x78a830, Defend/Sentinel 0x78a7d0,
 *   user Power/Magic Break 0x789290, damage immunity 0x78aac0, scale override
 *   0x78bd90.
 *
 * Each function takes only the numbers the game function reads. The game
 * passes several outputs by reference (the result-flag word, the damage-class
 * word, counters); here they live in a {@link HitFlags} object that the steps
 * update, so a step stays a pure function of its arguments and that object.
 *
 * All damage values are signed 32-bit integers; healing is NEGATIVE here too
 * (the base damage function negates it), so every step sees the signed value.
 */

import { cvttsd2si, div2, div4, mul, mul3div2, neg, sdiv } from './int32.ts';

/**
 * The by-reference outputs of one hit's modifier chain (locals of 0x78e630).
 * Bit meanings of `resultMask`, which becomes hit-record word +0x18:
 * 1 HP, 2 MP, 4 CTB (the command's damage classes), 0x08 Defend halved it,
 * 0x10 Sentinel halved it, 0x20 Shell halved it, 0x40 Protect halved it,
 * 0x80 overkill, 0x100 critical hit, 0x8000 Shield quartered it.
 */
export interface HitFlags {
  /** Local copy of the result word (hit record +0x18). Starts as the command's damage class. */
  resultMask: number;
  /** The damage classes still live: starts as Cmd+0x23; immunities clear the HP bit, the CTB branch clears 4. */
  classLeft: number;
  /** 2 when Shell or Protect reduced the hit (hit record +3), else 0. */
  reduced: number;
  /** How many times an immunity step cancelled the damage. */
  immunityCount: number;
  /** 1 once the Armored step divided the damage. */
  armored: number;
  /** Target Chr+0x6da: set to 1 by Shield and by Defend/Sentinel. */
  guardMark: number;
}

/** A fresh flag set for a hit of a command whose damage class (Cmd+0x23) is `damageClass`. */
export function newHitFlags(damageClass: number): HitFlags {
  return {
    resultMask: damageClass & 0xff,
    classLeft: damageClass & 0xff,
    reduced: 0,
    immunityCount: 0,
    armored: 0,
    guardMark: 0,
  };
}

/**
 * 0x78c530. Target extra status (Chr+0x616) bit 0x40, the Shield stance:
 * damage / 4 toward zero, result flag 0x8000, Chr+0x6da set. Then bit 0x80,
 * the Boost stance: damage * 3 / 2. Shield is applied FIRST, so a target with
 * both is quartered and then raised by half.
 */
export function shieldBoostMod(targetExtra: number, damage: number, flags: HitFlags): number {
  let d = damage;
  if ((targetExtra & 0x40) !== 0) {
    d = div4(d);
    flags.guardMark = 1;
    flags.resultMask |= 0x8000;
  }
  if ((targetExtra & 0x80) !== 0) d = mul3div2(d);
  return d;
}

/**
 * 0x78adc0. A magic command (Cmd+0x20 & 3 == 2) against a target whose hit
 * record carries a non-zero Shell counter (+0x0a): damage / 2 toward zero,
 * result flag 0x20, hit marked as reduced. Healing magic is halved too.
 */
export function shellMod(flagsDamage: number, shellCounter: number, damage: number, flags: HitFlags): number {
  if ((flagsDamage & 3) === 2 && (shellCounter & 0xff) !== 0) {
    flags.reduced = 2;
    flags.resultMask |= 0x20;
    return div2(damage);
  }
  return damage;
}

/** 0x78ad40. As {@link shellMod} for a physical command (Cmd+0x20 & 3 == 1) and the Protect counter (+0x0b); flag 0x40. */
export function protectMod(flagsDamage: number, protectCounter: number, damage: number, flags: HitFlags): number {
  if ((flagsDamage & 3) === 1 && (protectCounter & 0xff) !== 0) {
    flags.reduced = 2;
    flags.resultMask |= 0x40;
    return div2(damage);
  }
  return damage;
}

/**
 * 0x789690, the damage half. A critical hit doubles the damage (32-bit add)
 * and sets result flag 0x100. The decision itself is made elsewhere: the game
 * rolls it only for a command with Cmd+0x20 bit 2 set (see crit.ts).
 */
export function critMod(damage: number, crit: boolean, flags: HitFlags): number {
  if (!crit) return damage;
  flags.resultMask |= 0x100;
  return (damage + damage) | 0;
}

/**
 * 0x78c0b0. A Berserk user (permanent status bit 0x200 of Chr+0x606) whose
 * current command (Chr+0xf5c) is its own default attack (Chr+0x6c6) deals
 * damage * 3 / 2. Any other command is untouched.
 */
export function berserkMod(userPerm: number, currentCommand: number, defaultAttack: number, damage: number): number {
  if ((userPerm & 0x200) !== 0 && (currentCommand & 0xffff) === (defaultAttack & 0xffff)) {
    return mul3div2(damage);
  }
  return damage;
}

export interface MagicBoosterResult {
  damage: number;
  /** The user's Chr+0x5ca flag after the step (cleared when command 0x311f consumed it). */
  bonusFlag: number;
}

/**
 * 0x78c580. Two cases. Command 0x311f (Auto-Life): if the user's flag
 * Chr+0x5ca is set, clear it and multiply by 3/2; otherwise nothing. Any
 * other command: a user with Magic Booster (Chr+0x6bc bit 0x40) whose command
 * type byte (Cmd+0x17) is 1 or 2 deals damage * 3 / 2. The flag is consumed on
 * the FIRST call, so an MP-class call in the same hit no longer sees it.
 */
export function magicBoosterMod(
  commandId: number,
  commandType: number,
  autoA: number,
  bonusFlag: number,
  damage: number,
): MagicBoosterResult {
  if (commandId === 0x311f) {
    if ((bonusFlag & 0xff) !== 0) return { damage: mul3div2(damage), bonusFlag: 0 };
    return { damage, bonusFlag };
  }
  if ((autoA & 0x40) !== 0 && ((commandType & 0xff) === 1 || (commandType & 0xff) === 2)) {
    return { damage: mul3div2(damage), bonusFlag };
  }
  return { damage, bonusFlag };
}

/**
 * 0x78c5f0. Alchemy (Chr+0x6bc bit 0x200) doubles the damage of an item
 * command (command id 0x2000 to 0x2fff) that heals (Cmd+0x20 bit 4) when the
 * resolved formula is 6 or 8. 32-bit add.
 */
export function alchemyMod(autoA: number, commandId: number, flagsDamage: number, formula: number, damage: number): number {
  if (
    (autoA & 0x200) !== 0 &&
    (commandId & 0xfffff000) === 0x2000 &&
    (flagsDamage & 0x10) !== 0 &&
    (formula === 6 || formula === 8)
  ) {
    return (damage + damage) | 0;
  }
  return damage;
}

/** The four bytes of the party percent table (0x02311240, 4 per character). */
export interface PartyPercent {
  /** Byte 0 of the USER's entry: physical damage dealt, +%. */
  physDealt: number;
  /** Byte 1 of the USER's entry: magical damage dealt, +%. */
  magDealt: number;
  /** Byte 2 of the TARGET's entry: physical damage taken, -%. */
  physTaken: number;
  /** Byte 3 of the TARGET's entry: magical damage taken, -%. */
  magTaken: number;
}

/**
 * 0x7891e0. For a physical (Cmd+0x20 & 3 == 1) or magical (== 2) command:
 * first `damage + damage * dealt / 100` (when the user's byte is non-zero),
 * then `damage - damage * taken / 100` (when the target's byte is non-zero).
 * Each product is truncated toward zero BEFORE it is added or subtracted, and
 * the second step works on the already-raised value. Other commands: unchanged.
 */
export function partyPercentMod(flagsDamage: number, pct: PartyPercent, damage: number): number {
  const cls = flagsDamage & 3;
  let dealt: number;
  let taken: number;
  if (cls === 1) {
    dealt = pct.physDealt & 0xff;
    taken = pct.physTaken & 0xff;
  } else if (cls === 2) {
    dealt = pct.magDealt & 0xff;
    taken = pct.magTaken & 0xff;
  } else {
    return damage;
  }
  let d = damage;
  if (dealt !== 0) d = (d + sdiv(mul(dealt, d), 100)) | 0;
  if (taken !== 0) d = (d + sdiv(mul(taken, d), -100)) | 0;
  return d;
}

/**
 * 0x78ad80. Formulas 5 and 8 (fractions of HP) against a target with the
 * "immune to fractional damage" bit (Chr+0x5b8 bit 2): the HP class is
 * cancelled, the damage becomes 0 and the immunity counter ticks.
 */
export function ratioImmunity(formula: number, targetSpecial: number, damage: number, flags: HitFlags): number {
  if ((formula === 8 || formula === 5) && (targetSpecial & 2) !== 0) {
    flags.classLeft &= ~1;
    flags.immunityCount++;
    return 0;
  }
  return damage;
}

/**
 * 0x78a200. A command that absorbs (Cmd+0x1c bit 0x100) negates its damage
 * when exactly one of two Zombie bits is set: the USER's permanent status
 * (Chr+0x606 bit 1, current) and the TARGET's snapshot in the hit record
 * (+0x14 bit 1). Both set, or neither, leaves the sign alone.
 */
export function absorbInvert(flagsMisc: number, userPerm: number, snapshotPerm: number, damage: number): number {
  if ((flagsMisc & 0x100) !== 0 && ((userPerm >> 1) & 1) + ((snapshotPerm >> 1) & 1) === 1) {
    return neg(damage);
  }
  return damage;
}

/**
 * 0x78a830. An Armored target (Chr+0x5b8 bit 1) takes damage / 3 toward zero
 * from a command unless: the command pierces armor (Cmd+0x1c bit 0x10000),
 * the user has Pierce (Chr+0x6bc bit 0x2000), or the target's snapshot has
 * Armor Break (hit record +0x14 bit 0x40). Physical or magical alike.
 */
export function armoredMod(
  flagsMisc: number,
  targetSpecial: number,
  userAutoA: number,
  snapshotPerm: number,
  damage: number,
  flags: HitFlags,
): number {
  if ((flagsMisc & 0x10000) !== 0) return damage;
  if ((targetSpecial & 1) === 0) return damage;
  if ((userAutoA & 0x2000) !== 0) return damage;
  if ((snapshotPerm & 0x40) !== 0) return damage;
  flags.armored = 1;
  return sdiv(damage, 3);
}

/**
 * 0x78a7d0. A PHYSICAL command against a target whose hit-record extra status
 * (+0x16) has Defend (0x800) or Sentinel (0x2000): damage / 2 toward zero,
 * Chr+0x6da set, result flag 0x08 for Defend or 0x10 when only Sentinel.
 */
export function defendSentinelMod(flagsDamage: number, recordExtra: number, damage: number, flags: HitFlags): number {
  if ((flagsDamage & 3) !== 1) return damage;
  if ((recordExtra & 0x2800) === 0) return damage;
  flags.guardMark = 1;
  flags.resultMask |= (recordExtra & 0x800) !== 0 ? 0x08 : 0x10;
  return div2(damage);
}

/**
 * 0x789290. A user with Power Break (permanent bit 0x10 of Chr+0x606) deals
 * half damage with a physical command; Magic Break (0x20) with a magical one.
 */
export function userBreakMod(flagsDamage: number, userPerm: number, damage: number): number {
  const cls = flagsDamage & 3;
  if (cls === 1 && (userPerm & 0x10) !== 0) return div2(damage);
  if (cls === 2 && (userPerm & 0x20) !== 0) return div2(damage);
  return damage;
}

/**
 * 0x78aac0. Chr+0x5b8 bit 0x20 makes the target immune to physical commands,
 * 0x40 to magical ones, 0x80 to everything: the HP class is cancelled, the
 * damage becomes 0 and the immunity counter ticks.
 */
export function damageImmunity(flagsDamage: number, targetSpecial: number, damage: number, flags: HitFlags): number {
  const cls = flagsDamage & 3;
  const immune =
    (targetSpecial & 0x80) !== 0 ||
    (cls === 1 && (targetSpecial & 0x20) !== 0) ||
    (cls === 2 && (targetSpecial & 0x40) !== 0);
  if (!immune) return damage;
  flags.classLeft &= ~1;
  flags.immunityCount++;
  return 0;
}

/**
 * The timed-input bonus the game applies to the USER's last HP value
 * (Chr+0xd26 non-zero; the floats at Chr+0xd2c and Chr+0xd30 are set by the
 * Overdrive timing code). Both are single-precision.
 */
export interface ScaleOverride {
  /** Chr+0xd2c (float): the part added on top. */
  a: number;
  /** Chr+0xd30 (float): doubled, the denominator. */
  b: number;
}

/**
 * 0x78bd90. With the override active: `damage * (a + 2b) / (2b)` in x87
 * double precision, the damage first rounded to single precision, then
 * converted to int by truncation. Without it: the damage unchanged.
 */
export function damageScaleOverride(scale: ScaleOverride | null, damage: number): number {
  if (scale === null) return damage;
  const a = Math.fround(scale.a);
  const twoB = 2 * Math.fround(scale.b);
  return cvttsd2si(((a + twoB) * Math.fround(damage)) / twoB);
}
