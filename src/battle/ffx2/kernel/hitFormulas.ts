/**
 * The threshold arithmetic of the eight FFX-2 accuracy formulas (`pp_hit_determine`, exe 0x00641500).
 * Split out of `./hit.ts` (house rule 7: every source file under 400 lines); the control flow, the
 * forced hits and misses and the draws live there.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69),
 * 0x00641500, read from the disassembly (operand widths and signedness live there, not in the
 * decompile). Spec: `research/re-ffx2-hit-status.md` section 2. Pure, no DOM, no engine types.
 *
 * Every formula ends in the same compare, `roll < threshold` (signed 32-bit). What differs is how the
 * roll and the threshold are made:
 *
 * | f | roll                 | threshold                                                          |
 * |---|----------------------|--------------------------------------------------------------------|
 * | 0 | none                 | none: always hits                                                  |
 * | 1 | draw % 101           | Luck/Evasion race on the command's own Accuracy byte               |
 * | 2 | draw % 101           | the same race on the attacker's own Accuracy stat                  |
 * | 3 | constant 128         | (draw & 0x7f) + level/power/resist quotient, Eject resist          |
 * | 4 | constant 128         | the same, Death resist                                             |
 * | 5 | constant 128         | the same, Petrify resist                                           |
 * | 6 | draw & 0xff (or 0)   | Bribe: accumulated gil against the target's maximum HP             |
 * | 7 | draw & 0x3ff         | level^6 / (levelT^3 (r+10)^2 (r/20+1)): the Zantetsu-type roll     |
 */

import { cvttsd2si, div4, s8 } from './intops.ts';

/** `flags_misc` bits 3 to 5: the accuracy formula number. */
export function accuracyFormulaOf(flagsMisc: number): number {
  return (flagsMisc >>> 3) & 7;
}

/** `flags_misc` bit: Darkness on the attacker lowers this command's accuracy. */
export const MISC_FLAG_DARKNESS = 0x40;
/** `flags_misc` bit: spread the command's hits over random targets. */
export const MISC_FLAG_RANDOM_TARGETS = 0x4000;
/** `flags_damage` bits 0 and 1: physical and magical. */
export const DAMAGE_FLAG_PHYSICAL = 0x01;
export const DAMAGE_FLAG_MAGICAL = 0x02;
/** Attacker status word 1 (Chr +0x434) bit: Darkness. */
export const STATUS1_DARKNESS = 0x10;

/** The command whose Bribe accuracy skips its roll and starts from 128 instead of -64. */
export const COMMAND_BRIBE_FREE_ROLL = 0x31da;

/** Formulas 1 and 2 read this attacker/target pair. Signed stage bytes are -128..127. */
export interface RaceTerms {
  /** Accuracy base: the command's Accuracy byte (f = 1) or the attacker's ACC stat (f = 2). */
  base: number;
  attackerLuck: number;
  attackerAccStage: number;
  attackerLuckStage: number;
  targetLuck: number;
  targetEva: number;
  targetEvaStage: number;
  targetLuckStage: number;
}

/**
 * Formulas 1 and 2 (exe 0x00641500, 0x0064182a to 0x006418cf):
 *
 *     hit% = LCK_a + base - LCK_t - EVA_t + 5 * (2 * (ACCstage_a - EVAstage_t) - LCKstage_t + LCKstage_a)
 *
 * All 32-bit ints; the result can be negative or above 100. Darkness (when the command allows it) has
 * already divided `base` by four. `aidCount` is the player-side-monster scale (see {@link aidScale}).
 */
export function raceThreshold(t: RaceTerms): number {
  const stages =
    2 * (s8(t.attackerAccStage) - s8(t.targetEvaStage)) - s8(t.targetLuckStage) + s8(t.attackerLuckStage);
  return ((t.attackerLuck & 0xff) + t.base + 5 * stages - (t.targetEva & 0xff) - (t.targetLuck & 0xff)) | 0;
}

/**
 * Darkness: `base / 4` rounded toward zero (CDQ; AND EDX, 3; ADD; SAR 2). `base` is a byte, so this is
 * a floor in practice.
 */
export function darknessBase(base: number): number {
  return div4(base);
}

/**
 * The scale applied to the threshold of a PLAYER-SIDE MONSTER target (a Creature Create friend:
 * `pp_is_aided_chr`, a slot outside the monster range whose save index is 15 to 22):
 * `trunc((aid + 1) * threshold / 4)`. `aid` is the short at VA 0x011b85c4 (0 to 5, default 3, which is
 * x1). Ordinary targets are not scaled.
 */
export function aidScale(threshold: number, aidCount: number): number {
  const aid = (aidCount << 16) >> 16; // a signed short
  return div4(Math.imul(aid + 1, threshold));
}

/**
 * Formulas 3, 4 and 5 (exe 0x00641500, 0x006418d4 to 0x00641990): the instant-effect chance.
 *
 *     q = ((((lvA^2 * power) * power) * 100) / lvT) / lvT) / (r + 5)) / (r + 5)
 *
 * in SIGNED 64-bit integer steps (the CRT's __allmul and __alldiv; every division truncates toward
 * zero), where `lvT` is the target level clamped to at least 1, `power` the command's power byte and `r`
 * the target's resist byte (Eject f = 3, Death f = 4, Petrify f = 5; 255 means immune and is handled by
 * the caller). Only the LOW 32 BITS of `q` are kept, as a signed int, and added to `draw & 0x7f`:
 *
 *     threshold = (draw & 0x7f) + int32(q)          // 32-bit wrap
 *
 * The roll is the constant 128, so the effect lands exactly when `threshold > 128`, that is
 * `(draw & 0x7f) + q >= 129`. With `q` of 129 or more it always lands; with `q` of 1 or less it can
 * never land. (`q` can exceed 2^31 for a level-99 attacker with a big power against a level-1 target;
 * the int32 truncation then turns it negative, and the effect cannot land. That is what the code does.)
 */
export function resistThreshold(
  attackerLevel: number,
  targetLevel: number,
  power: number,
  resist: number,
  draw7f: number,
): number {
  const lvA = BigInt(attackerLevel | 0);
  const lvT = BigInt(Math.max(targetLevel | 0, 1));
  const pw = BigInt(power & 0xff);
  const d = BigInt((resist & 0xff) + 5);
  let x = BigInt.asIntN(64, lvA * lvA);
  x = BigInt.asIntN(64, x * pw);
  x = BigInt.asIntN(64, x * pw);
  x = BigInt.asIntN(64, x * 100n);
  x = x / lvT; // BigInt division truncates toward zero, like __alldiv
  x = x / lvT;
  x = x / d;
  x = x / d;
  return ((draw7f & 0x7f) + Number(BigInt.asIntN(32, x))) | 0;
}

/** What formula 6 (Bribe) computes, and the two numbers the game stores back on the target. */
export interface BribeAccuracy {
  /** The new accumulated amount (target Chr +0x67c): `clamp(old + amount, 0, 999999999)`. */
  accumulated: number;
  /** The threshold (stored at target Chr +0x680 and compared with the roll): an int. */
  threshold: number;
}

/**
 * Formula 6 (exe 0x00641500, 0x0064173f to 0x006417e3): the Bribe accuracy. The sum and the divisor are
 * converted to 32-bit floats, the rest is x87 arithmetic at 53-bit precision, the result is stored as a
 * float32 and then truncated to an int:
 *
 *     base = 128 for command 0x31da, else -64                        (float32 constants)
 *     acc  = clamp(old + amount, 0, 999999999)                      (the add wraps at 32 bits first)
 *     den  = max(maxHp, 1)
 *     t    = float32( float32(acc) * 256 / float32(den) / 5 + base )
 *     threshold = trunc(min(t, 1e9))
 *
 * so each point of `acc` relative to `maxHp` adds 51.2 to the threshold, and the roll is `draw & 0xff`:
 * a bribe of five times the target's maximum HP starts to work and ten times works three times in four.
 */
export function bribeAccuracy(commandId: number, old: number, amount: number, maxHp: number): BribeAccuracy {
  const base = commandId === COMMAND_BRIBE_FREE_ROLL ? 128 : -64;
  const den = Math.max(maxHp | 0, 1);
  const acc = Math.min(Math.max((old + amount) | 0, 0), 999999999);
  let t = Math.fround((Math.fround(acc) * 256) / Math.fround(den) / 5 + base);
  if (1e9 < t) t = Math.fround(1e9);
  return { accumulated: acc, threshold: cvttsd2si(t) };
}

/**
 * Formula 7 (exe 0x00641500, 0x00641a0d to 0x00641a80): the level^6 roll (the Zantetsu type).
 *
 *     a = float32(lvA);  t = float32(max(lvT, 1));  r = resist byte at target +0x66b
 *     v = a^6 / t / t / t / float32(r + 10) / float32(r + 10) / float32(floor(r / 20) + 1)
 *     threshold = trunc(float32(v))
 *
 * x87 at 53-bit precision, left to right (the power is built by five multiplications, each rounded).
 * The roll is `draw & 0x3ff` (0 to 1023). A threshold of 2^31 or more converts to the "integer
 * indefinite" value and cannot beat any roll.
 */
export function sexticThreshold(attackerLevel: number, targetLevel: number, resist: number): number {
  const a = Math.fround(attackerLevel | 0);
  const t = Math.fround(Math.max(targetLevel | 0, 1));
  const r = resist & 0xff;
  const r10 = Math.fround(r + 10);
  const d = Math.fround(Math.floor(r / 20) + 1);
  let v = a * a;
  v *= a;
  v *= a;
  v *= a;
  v *= a;
  v = v / t / t / t;
  v = v / r10 / r10;
  v = v / d;
  return cvttsd2si(Math.fround(v));
}
