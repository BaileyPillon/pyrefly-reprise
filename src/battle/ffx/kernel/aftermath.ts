/**
 * The steps of a hit that run after the damage classes: the Delay attacks,
 * the "no damage" overrides that depend on the status result, and the final
 * clamp that writes the hit record and the running totals.
 *
 * **Game case: FFX only.**
 *
 * Source: FFX.exe Steam build 25501027: Delay Attack/Buster 0x78e0f0, Threaten
 * ignores delay 0x78bd50, Petrified no damage 0x78ba30, delay immunity
 * 0x78c180, newly-dead no damage 0x78c480, and the tail of the per-hit
 * pipeline 0x78e630 (research/re-ffx-damage.md §3 and §6).
 *
 * The status infliction between these steps (0x78ae00, 0x78b4e0) is NOT here:
 * its outcome comes in as a {@link StatusOutcome}.
 */

import { div2, mul } from './int32.ts';

/** Damage per class, in the game's order: HP, MP, CTB. */
export type Triple = [number, number, number];

/**
 * 0x78e0f0. A Delay Attack (Cmd+0x1c bit 0x2000, k = 1) or Delay Buster
 * (bit 0x4000, k = 2; the stronger wins when both are set) adds
 * `tickSpeed * 3 * k / 2` (truncating toward zero) to the CTB damage and sets
 * result flag 4. `tickSpeed` is the target's tick speed for its Agility
 * (Chr+0x5ac through the table at 0x7909c0).
 */
export function delayAttackCtb(
  flagsMisc: number,
  tickSpeed: number,
  ctbDamage: number,
  mask: number,
): { ctbDamage: number; mask: number } {
  const k = (flagsMisc & 0x4000) !== 0 ? 2 : (flagsMisc & 0x2000) !== 0 ? 1 : 0;
  if (k === 0) return { ctbDamage, mask };
  const add = div2(mul(mul(tickSpeed & 0xff, 3), k));
  return { ctbDamage: (ctbDamage + add) | 0, mask: mask | 4 };
}

/**
 * 0x78bd50. When result flag 4 is on and the target's snapshot (hit record
 * +0x14) has Threaten (0x800), the CTB damage is cancelled and the CTB class
 * leaves the live-class word.
 */
export function threatenIgnoresDelay(
  snapshotPerm: number,
  mask: number,
  classLeft: number,
  ctbDamage: number,
): { ctbDamage: number; classLeft: number } {
  if ((mask & 4) !== 0 && (snapshotPerm & 0x800) !== 0) return { ctbDamage: 0, classLeft: classLeft & ~4 };
  return { ctbDamage, classLeft };
}

/** What the status infliction step (0x78ae00 and 0x78b4e0) left in the hit record. */
export interface StatusOutcome {
  /** Hit record +0x14 after infliction. */
  permAfter: number;
  /** Hit record +0x16 after infliction (the high byte's bit 0 is Eject). */
  extraAfter: number;
  /** Bits the infliction ORs into the result word (it also carries the Delay bit 4). */
  maskBits: number;
  /** A CTB damage the infliction wrote (Threaten), or null when it did not touch it. */
  ctbDamage: number | null;
  /** The delay-immunity bypass flag: 1 when Threaten itself set the CTB damage. */
  ctbFlag: number;
}

/** The no-status outcome for a snapshot: nothing changed, nothing inflicted. */
export function noStatusOutcome(snapshotPerm: number, snapshotExtra: number): StatusOutcome {
  return { permAfter: snapshotPerm, extraAfter: snapshotExtra, maskBits: 0, ctbDamage: null, ctbFlag: 0 };
}

/**
 * 0x78ba30. A target that was Petrified before the hit and still is, and does
 * not carry the Eject bit (extra bit 8) afterwards, takes no damage of any
 * class; the live-class word is cleared too (`applied`).
 */
export function petrifiedNoDamage(
  permBefore: number,
  permAfter: number,
  extraAfter: number,
  damage: Triple,
): { damage: Triple; applied: boolean } {
  if ((permAfter & 4) !== 0 && (permBefore & 4) !== 0 && ((extraAfter >> 8) & 1) === 0) {
    return { damage: [0, 0, 0], applied: true };
  }
  return { damage, applied: false };
}

/**
 * 0x78c180. A target with delay immunity (Chr+0x5b9 bit 0) takes no CTB damage
 * when the CTB class is on, unless the infliction step set the bypass flag
 * (Threaten's own delay).
 */
export function delayImmunity(targetDelayImmune: boolean, mask: number, ctbFlag: number, ctbDamage: number): number {
  if ((mask & 4) !== 0 && targetDelayImmune && ctbFlag === 0) return 0;
  return ctbDamage;
}

/**
 * 0x78c480. A hit that NEWLY inflicted Death (bit 0 of the permanent status
 * clear before, set after) zeroes the damage of all three classes and clears
 * the three class bits of the result word.
 */
export function deathHitNoDamage(
  permBefore: number,
  permAfter: number,
  mask: number,
  damage: Triple,
): { damage: Triple; mask: number } {
  if ((permBefore & 1) === 0 && (permAfter & 1) !== 0) return { damage: [0, 0, 0], mask: mask & ~7 };
  return { damage, mask };
}

/** What the final clamp reads. */
export interface ClampInput {
  /** HP, MP, CTB damage of the hit (signed; negative heals). */
  damage: Triple;
  /** The result word at this point (bit 1 = the HP class is still live). */
  mask: number;
  /** Cmd+0x20 (flags_damage): bit 6 (0x40) forces the 9999 cap, bit 7 (0x80) the 99999 cap. */
  flagsDamage: number;
  /** User Chr+0x6be: bit 0x800 is Break Damage Limit. */
  userAutoB: number;
  /** User Chr+0x640: bit 8 inflicts exactly 9999. */
  userBuffFlags: number;
  /** Target Chr+0x5a4: the overkill threshold. */
  overkillThreshold: number;
  /** Target Chr+0x6e4, 0x6e8, 0x6ec: running HP, MP, CTB before the hit. */
  running: Triple;
}

export interface ClampResult {
  /** The three amounts written to hit record +0x20, +0x24, +0x28. */
  amounts: Triple;
  /** The running totals after the hit (never below 0). */
  running: Triple;
  /** The cap that applied (9999 or 99999). */
  cap: number;
  /** True when the overkill bit (result flag 0x80) is set: threshold minus HP damage is 0 or less. */
  overkill: boolean;
}

/** The per-class cap: 9999, or 99999 with Break Damage Limit; Cmd+0x20 bit 7 forces 99999 and bit 6 forces 9999. */
export function damageCap(flagsDamage: number, userAutoB: number): number {
  let cap = 9999 + ((userAutoB & 0x800) !== 0 ? 90000 : 0);
  if ((flagsDamage & 0x80) !== 0) cap = 99999;
  else if ((flagsDamage & 0x40) !== 0) cap = 9999;
  return cap;
}

/**
 * The end of 0x78e630. If the user carries the inflicts-9999 buff
 * (Chr+0x640 bit 8) and the HP class is live, an HP value of 1..9998 becomes
 * 9999 and -9998..-1 becomes -9999 (anything larger stays for the cap). Then
 * each class is clamped to +-cap, written out, and subtracted from the
 * target's running total, which is floored at 0 (healing raises it).
 */
export function finalClamp(input: ClampInput): ClampResult {
  const cap = damageCap(input.flagsDamage, input.userAutoB);
  const damage: Triple = [input.damage[0], input.damage[1], input.damage[2]];
  if ((input.userBuffFlags & 8) !== 0 && (input.mask & 1) !== 0) {
    if (damage[0] >= 1 && damage[0] <= 9998) damage[0] = 9999;
    else if (damage[0] <= -1 && damage[0] >= -9998) damage[0] = -9999;
  }
  const amounts: Triple = [0, 0, 0];
  const running: Triple = [input.running[0], input.running[1], input.running[2]];
  for (let i = 0; i < 3; i++) {
    let v = damage[i] ?? 0;
    if (v < -cap) v = -cap;
    else if (v > cap) v = cap;
    amounts[i] = v;
    const left = ((running[i] ?? 0) - v) | 0;
    running[i] = left < 0 ? 0 : left;
  }
  return { amounts, running, cap, overkill: ((input.overkillThreshold - amounts[0]) | 0) <= 0 };
}
