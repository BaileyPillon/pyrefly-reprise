/**
 * Base damage kernel: the 25 damage formulas of a command row, the variance factor and the heal sign, with
 * the game's own integer semantics.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the base damage
 * function at 0x61b910 (the older copy of the exe has it at 0x61b930; the two are byte-identical). Spec:
 * `research/re-ffx2-damage.md` section 1. The engine's hand-written float chain (`formulas.ts`, one truncation
 * at the end) is gone: every damage class of every strike is computed here, through `./pipeline.ts`.
 *
 * Every operation mirrors the instruction sequence: IMUL products wrap at 32 bits, `/ 16`, `/ 64`, `/ 128`,
 * `/ 256` and `/ 1024` round toward zero, and the divisions by 12 and 255 are truncating signed divides. All
 * the arguments are signed 32-bit values (the caller, the damage orchestrator, has already zero-extended the
 * stat bytes and sign-extended the stage bytes). The one non-integer step is formula 0xc, which runs on the
 * x87 stack (see {@link gilCurve}).
 *
 * Randomness: the one draw of the variance happens BEFORE the formula switch, whenever the call is not a
 * preview, even for the formulas that never use it (4, 5, 7, 0xa, 0xb, 0xe, 0xf, 0x11 to 0x13, 0x18 and any
 * formula above 0x18). `draw(stream)` must return the raw value the game's RNG returns for that stream (a
 * non-negative 31-bit integer); only its low five bits matter here. The stream is the attacker's "mode 0"
 * stream, see {@link rollVariance}.
 */

import {
  add,
  cvttsd2si,
  div1024,
  div128,
  div16,
  div256,
  div64,
  mul,
  neg,
  scale,
  sdiv,
  sub,
} from './int32.ts';
import { Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';

/** The fields of the attacker's character record this function reads (all signed 32-bit by now). */
export interface BaseDamageUser {
  /** Chr+0x3b4: current HP (formula 0x13, and 0x11 with the max HP). */
  hp: number;
  /** Chr+0x384: max HP (formulas 0xb, 0x11). */
  maxHp: number;
  /** Chr+0x3b8: current MP (formula 0x15). */
  mp: number;
  /** Chr+0x388: max MP (formula 0x15; it is the divisor, so it must not be 0 there). */
  maxMp: number;
  /** Chr+0x396 (u8, zero-extended). */
  str: number;
  /** Chr+0x43f (s8, sign-extended): the STR stage. */
  strStage: number;
  /** Chr+0x398 (u8, zero-extended). */
  mag: number;
  /** Chr+0x440 (s8, sign-extended): the MAG stage. */
  magStage: number;
  /** Chr+0x380 (s32): level. */
  level: number;
}

/** The fields of the target's character record this function reads. For the MP and ATB classes the caller
 *  puts the target's MP / max MP, or its ATB values, in `hp` / `maxHp` (the orchestrator does). */
export interface BaseDamageTarget {
  /** Chr+0x3b4: current HP (formulas 4 and 0xa). */
  hp: number;
  /** Chr+0x384: max HP (formula 7). */
  maxHp: number;
  /** Chr+0x397 (u8, zero-extended). */
  def: number;
  /** Chr+0x441 (s8, sign-extended): the DEF stage. */
  defStage: number;
  /** Chr+0x399 (u8, zero-extended). */
  mdef: number;
  /** Chr+0x442 (s8, sign-extended): the MDEF stage. */
  mdefStage: number;
}

/**
 * Three fields of the "record" the exe keeps for each of the first 0x17 character ids (0x80 bytes each at
 * VA 0xe006c0 + id * 0x80, live build). Which game quantity they are is not pinned (anchor map section 6);
 * only formulas 0xd, 0x16 and 0x17 read them. A character id of 0x17 or more has no record (the game gets a
 * NULL pointer and adds nothing).
 */
export interface BaseDamageRecords {
  /** Attacker record +0x40 (u32): formula 0x17 adds 99999 when it is 0. */
  attackerF40: number;
  /** Attacker record +0x44 (s32): formula 0x16 adds it. */
  attackerF44: number;
  /** Target record +0x44 (s32): formula 0xd multiplies it by the power. */
  targetF44: number;
}

/** The command-row words this function reads (`null` = the caller passed no row, a NULL pointer). */
export interface BaseDamageCommand {
  /** Cmd+0x14 (u32), flags_misc: 0x1000 and 0x2000 pick the delay table of formula 0x18. */
  misc: number;
  /** Cmd+0x1c (u32), flags_damage: bit 4 (0x10) marks a healing command, the result is negated. */
  damage: number;
}

export interface BaseDamageInput {
  /** The attacker's character id (picks the RNG stream and, below 0x17, the record). */
  attackerId: number;
  /** The target's character id (below 0x17 it has a record, formula 0xd). */
  targetId: number;
  cmd: BaseDamageCommand | null;
  /** The damage formula: Cmd+0x28, or 0x18 when the orchestrator forces the delay class. */
  formula: number;
  /** The power byte, Cmd+0x2b (0..255). */
  power: number;
  /** ActionRec+0xb0 (s32): the amount a command carries, read by formula 0xc only. */
  amount: number;
  /** True for the estimate call: variance fixed at 0x100, no draw. */
  preview: boolean;
  user: BaseDamageUser;
  target: BaseDamageTarget;
  records: BaseDamageRecords;
  /** rom.bin delay_count[2], used by formula 0x18. Defaults to {@link DELAY_COUNT}. */
  delay?: readonly [number, number];
}

/** rom.bin `delay_count[2]`: formula 0x18 adds the first for flags_misc & 0x1000 and the second for 0x2000. */
export const DELAY_COUNT: readonly [number, number] = [4000, 8000];

/** The variance when the call is a preview (no draw). */
export const VARIANCE_PREVIEW = 0x100;

/**
 * The variance factor of one real call: `(draw & 0x1f) + 0xf0`, which is 240..271 (out of 256). The draw comes
 * from the attacker's mode-0 stream (`rngStreamForChr(attackerId, 0)`: the id plus 0x14, or plus 0xd for a
 * monster slot 15..30), exactly as the base formula computes it inline.
 */
export function rollVariance(attackerId: number, draw: Ffx2Draw): number {
  return ((drawValue(draw, rngStreamForChr(attackerId, Ffx2RngKind.Variance)) & 0x1f) + 0xf0) | 0;
}

/** True when the character id has a record (the table lookup returns NULL from id 0x17 up). */
function hasRecord(id: number): boolean {
  return (id & 0xff) < 0x17;
}

/**
 * Formula 0xc, the one floating-point formula (probably the gil-throw curve; the command that feeds it
 * `amount` was not traced): with `A = float32(amount)` and `r = float32(sqrt(A))`,
 *
 *     result = trunc( float32( 22 * A * r / (A + 20 * r) ) )        (0 when amount <= 0)
 *
 * The products and the quotient run on the x87 stack at 53-bit precision (the C runtime start-up leaves the
 * control word at 0x27F), so double arithmetic in this order reproduces it; the two `float32` roundings are
 * the stores to memory, the last one is read back by `_ftol`.
 */
export function gilCurve(amount: number): number {
  if (amount <= 0) return 0;
  const a = Math.fround(amount);
  const r = Math.fround(Math.sqrt(a));
  const q = (22 * a * r) / (a + r * 20);
  return cvttsd2si(Math.fround(q));
}

/** `((S + L) * S * L) / 1024 + S`, the cubic term of the physical-shaped formulas (S = STR or MAG). */
function cubic(s: number, level: number): number {
  const t = mul(mul(add(s, level), s), level);
  return add(div1024(t), s);
}

/** `(a * power / 16) * variance / 256`, the tail every physical-shaped formula ends with. */
function tail(a: number, power: number, variance: number): number {
  return div256(mul(div16(mul(a, power)), variance));
}

/** The magic term `(MAG + 2 * L) * power * power` (wrapping). */
function magicProduct(mag: number, level: number, power: number): number {
  return mul(mul(add(mag, mul(level, 2)), power), power);
}

/**
 * The base damage of one call with the variance already chosen (240..271, or {@link VARIANCE_PREVIEW}).
 * Pure: no draw. Returns the signed 32-bit result (negative for a healing command).
 */
export function baseDamageAt(input: BaseDamageInput, variance: number): number {
  const { user, target, records, cmd } = input;
  const power = input.power;
  const level = user.level;
  const v = variance;
  const formula = input.formula >>> 0;
  let r = 0;

  switch (formula) {
    case 0x00:
    case 0x15:
    case 0x16:
    case 0x17: {
      // Physical: ((STR+L)*STR*L>>10 + STR) * (270-DEF)/255 * (STRst+12)/12 * (12-DEFst)/12 * power/16 * v/256
      let a = scale(cubic(user.str, level), sub(270, target.def), 255);
      a = scale(a, add(user.strStage, 12), 12);
      a = scale(a, sub(12, target.defStage), 12);
      r = tail(a, power, v);
      break;
    }
    case 0x01: {
      // The same without the DEF term (the constant 270 stands in) but WITH the DEF stage.
      let a = scale(cubic(user.str, level), 270, 255);
      a = scale(a, add(user.strStage, 12), 12);
      a = scale(a, sub(12, target.defStage), 12);
      r = tail(a, power, v);
      break;
    }
    case 0x02:
    case 0x03: {
      // Magic: ((MAG+2L)*P*P/64) * (270-MDEF)/255 * (MAGst+12)/12 * (12-MDEFst)/12 * v/256; 3 uses 270 for the MDEF.
      let a = div64(magicProduct(user.mag, level, power));
      a = scale(a, formula === 2 ? sub(270, target.mdef) : 270, 255);
      a = scale(a, add(user.magStage, 12), 12);
      a = scale(a, sub(12, target.mdefStage), 12);
      r = div256(mul(a, v));
      break;
    }
    case 0x04:
      r = div16(mul(power, target.hp)); // target current HP * power / 16
      break;
    case 0x05:
      r = mul(power, 50); // fixed: power * 50, no variance
      break;
    case 0x06: {
      // Recovery magic: ((MAG+2L)*P*P/128) * (MAGst+12)/12 * v/256, no defence at all.
      const a = scale(div128(magicProduct(user.mag, level, power)), add(user.magStage, 12), 12);
      r = div256(mul(a, v));
      break;
    }
    case 0x07:
      r = div16(mul(power, target.maxHp)); // target max HP * power / 16
      break;
    case 0x08:
      r = div256(mul(mul(v, power), 50)); // variance * power * 50 / 256
      break;
    case 0x09: {
      // Special magic: the physical shape built on MAG and MDEF, with the MAG and MDEF stages.
      let a = scale(cubic(user.mag, level), sub(270, target.mdef), 255);
      a = scale(a, add(user.magStage, 12), 12);
      a = scale(a, sub(12, target.mdefStage), 12);
      r = tail(a, power, v);
      break;
    }
    case 0x0a:
      r = target.hp > 0 ? target.hp - 1 : 0; // leaves the target at 1 HP
      break;
    case 0x0b:
      r = div16(mul(power, user.maxHp)); // attacker max HP * power / 16
      break;
    case 0x0c:
      r = gilCurve(input.amount); // x87: 22 * A * sqrt(A) / (A + 20 * sqrt(A))
      break;
    case 0x0d:
      r = hasRecord(input.targetId) ? mul(records.targetF44, power) : 0; // target record +0x44 * power
      break;
    case 0x0e:
      r = mul(power, 9999);
      break;
    case 0x0f:
      r = power;
      break;
    case 0x10:
      r = div256(mul(v, power)); // variance * power / 256
      break;
    case 0x11:
      r = div16(mul(sub(user.maxHp, user.hp), power)); // attacker missing HP * power / 16
      break;
    case 0x12:
      r = mul(power, level); // power * attacker level
      break;
    case 0x13:
      r = div16(mul(power, user.hp)); // attacker current HP * power / 16
      break;
    case 0x14: {
      // Physical with the target's DEF working FOR the attacker: (DEF+15)/255 and (DEFst+12)/12.
      let a = scale(cubic(user.str, level), add(target.def, 15), 255);
      a = scale(a, add(user.strStage, 12), 12);
      a = scale(a, add(target.defStage, 12), 12);
      r = tail(a, power, v);
      break;
    }
    case 0x18: {
      // Delay: the rom.bin delay counts picked by the command's misc flags.
      if (cmd === null) throw new RangeError('formula 0x18 reads the command row (the game dereferences NULL here)');
      const delay = input.delay ?? DELAY_COUNT;
      r = 0;
      if ((cmd.misc & 0x1000) !== 0) r = delay[0] | 0;
      if ((cmd.misc & 0x2000) !== 0) r = add(r, delay[1]);
      break;
    }
    default:
      r = 0; // formulas above 0x18 compute nothing
  }

  if (formula === 0x15) {
    // Scaled by the attacker's MP deficit: ((maxMP - MP) * r * 4) / maxMP, the multiply wrapping at 32 bits.
    r = sdiv(mul(sub(user.maxMp, user.mp), r) << 2, user.maxMp);
  } else if (formula === 0x16) {
    if (hasRecord(input.attackerId)) r = add(r, records.attackerF44);
  } else if (formula === 0x17) {
    if (hasRecord(input.attackerId) && records.attackerF40 === 0) r = add(r, 99999);
  }

  if (cmd !== null && (cmd.damage & 0x10) !== 0) r = neg(r); // healing command: the result is negative
  return r;
}

/**
 * The base damage of one call, drawing the variance first (as the game does). One draw from the attacker's
 * mode-0 stream, unless `input.preview`; the draw is made even when the formula ignores it.
 */
export function baseDamage(input: BaseDamageInput, draw: Ffx2Draw): number {
  const variance = input.preview ? VARIANCE_PREVIEW : rollVariance(input.attackerId, draw);
  return baseDamageAt(input, variance);
}
