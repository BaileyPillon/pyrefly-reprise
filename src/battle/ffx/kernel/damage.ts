/**
 * Base damage kernel: damage formulas 1 to 0x17, the variance factor and the
 * heal sign, with the game's own integer semantics.
 *
 * **Game case: FFX only** (FFX-2's damage functions are different code in a different exe).
 *
 * Source: FFX.exe Steam build 25501027, function at 0x789bf0 (the formula
 * switch every damage class goes through). Spec in research/re-ffx-damage.md
 * §2; the field offsets in the comments are the battle-character structure
 * (`Chr+0x...`) and the 0x5c-byte command record (`Cmd+0x...`).
 *
 * Every operation mirrors the instruction sequence: IMUL products wrap at 32
 * bits, `/ 16`, `/ 32` and `/ 256` round toward zero, the stat divisions are
 * signed except where the game uses unsigned DIV/MUL (formulas 0xa, 0x10 and
 * 0x11 to 0x13, flagged below). Nothing here reads the engine's types.
 *
 * Randomness: the one draw of a hit's variance happens BEFORE the formula
 * switch, whenever variance is on, even for formulas that never use it
 * (0xe, 0x14 and the fixed ones). `draw` must return the raw value of the
 * user's mode-0 RNG stream (a non-negative 31-bit integer); only its low five
 * bits matter here.
 */

import { div16, div2, div256, div32, div4, mul, neg, sdiv, udiv } from './int32.ts';

/** The user fields the formulas read. Bytes are 0..255. */
export interface BaseDamageUser {
  /** Chr+0x5a8 (u8). */
  str: number;
  /** Chr+0x5aa (u8). */
  mag: number;
  /** Chr+0x65e (u8): Cheer stacks 0..5. */
  cheer: number;
  /** Chr+0x660 (u8): Focus stacks 0..5. */
  focus: number;
  /** Chr+0x594 (s32). */
  maxHp: number;
  /** Chr+0x598 (s32). */
  maxMp: number;
  /** Chr+0x5d0 (s32): current HP (formulas 0x11 and 0x13). */
  hp: number;
  /** Chr+0x5d4 (s32): current MP (formula 0x12). */
  mp: number;
}

/** The target fields the formulas read. */
export interface BaseDamageTarget {
  /** Chr+0x0c (u8): the target's character id (formula 0x16 only). */
  id: number;
  /** Chr+0x5a9 (u8). */
  def: number;
  /** Chr+0x5ab (u8). */
  mdf: number;
  /** Chr+0x65e (u8): Cheer stacks, the physical `15 - stacks` term. */
  cheer: number;
  /** Chr+0x660 (u8): Focus stacks, the magical `15 - stacks` term. */
  focus: number;
  /** Chr+0x594 (s32). */
  maxHp: number;
  /** Chr+0x598 (s32). */
  maxMp: number;
  /** Chr+0x65d (u8): the target's base CTB (tick speed * 3). */
  baseCtb: number;
  /** Chr+0x6e4 (s32): running HP, reduced after every hit of an action. */
  runningHp: number;
  /** Chr+0x6e8 (s32): running MP. */
  runningMp: number;
  /** Chr+0x6ec (s32): running CTB. */
  runningCtb: number;
  /**
   * Field at +0x54 of the target's party-save record (the table at 0x011320b0,
   * stride 0x94): the counter formula 0x16 multiplies by the power. The anchor
   * map reads it as a kill count. Used only when `id` is below 0x12.
   */
  saveCounter: number;
}

/** The command-record bytes this function reads. */
export interface BaseDamageCommand {
  /** Cmd+0x20 (flags_damage): bit 4 (0x10) marks a healing command. */
  flagsDamage: number;
  /** Cmd+0x23 (damage class): bit 0 (1) = the command damages HP. */
  damageClass: number;
}

export interface BaseDamageInput {
  user: BaseDamageUser;
  target: BaseDamageTarget;
  /** The command record; `null` is allowed (the Overdrive reference damage passes none). */
  cmd: BaseDamageCommand | null;
  /** The damage formula, 1 to 0x17 (Cmd+0x28, or the weapon's Chr+0x5c1). */
  formula: number;
  /** The power byte (Cmd+0x2a, or the weapon's Chr+0x5c7). */
  power: number;
  /**
   * The target's permanent-status snapshot (hit record +0x14). Only the low
   * byte is read: 0x02 Zombie, 0x40 Armor Break, 0x80 Mental Break.
   */
  snapshot: number;
  /** 1 = HP, 2 = MP, 4 = CTB: which running value / maximum formulas 5 and 8 read. */
  mode: number;
  /** True to draw the variance factor; false gives the plain factor 256. */
  variance: boolean;
  /** The signed global at VA 0x0112be90: the gil offered (formula 0x15). */
  gilOffered?: number;
  /** The default result for formula 0, an unknown formula, and formula 0x16 on a target id of 0x12 or more. */
  fallback?: number;
}

export interface BaseDamageResult {
  /** Signed 32-bit damage; negative = healing. */
  value: number;
  /**
   * The DEF the formula saw (zeroed by Armor Break on an HP command), and the
   * MDF likewise. The game stores these through two out-pointers, except for
   * formulas 0xe and 0x14, which return early without writing them.
   */
  defUsed: number | undefined;
  mdfUsed: number | undefined;
}

/** `cube(s) = (s^3 >> 5) + 30`, the cubic power term (the 32-bit product wraps). */
export function cube(s: number): number {
  return div32(mul(mul(s, s), s)) + 30;
}

/** `730 - (51*x - x*x/11) / 10`: the defence term for a DEF or MDF byte (730 at 0, 21 at 255). */
export function defTerm(x: number): number {
  return 730 - sdiv((mul(x, 51) - sdiv(mul(x, x), 11)) | 0, 10);
}

/**
 * The shared tail of the defence-reduced formulas: `* defTerm / 730`, then
 * `* (15 - buffStacks) / 15`. Both divisions are signed.
 */
function reduceByDefence(term: number, dt: number, buffStacks: number): number {
  let v = sdiv(mul(dt, term), 730);
  v = mul(v, 15 - buffStacks);
  return sdiv(v, 15);
}

/**
 * Base damage of one hit for one damage class.
 *
 * Formula 1 (STR vs DEF): `reduce(cube(cheer + STR), defTerm(DEF))`, then
 * `* power / 16 * V / 256`. See research/re-ffx-damage.md §2 for all 23.
 */
export function baseDamage(input: BaseDamageInput, draw: () => number): BaseDamageResult {
  const { user: u, target: t, cmd } = input;
  const power = input.power;

  // The saved value and maximum for this mode (0 for any other mode).
  let saved = 0;
  let max = 0;
  if (input.mode === 1) {
    saved = t.runningHp;
    max = t.maxHp;
  } else if (input.mode === 2) {
    saved = t.runningMp;
    max = t.maxMp;
  } else if (input.mode === 4) {
    saved = t.runningCtb;
    max = t.baseCtb;
  }

  // Armor Break / Mental Break zero the defences of an HP command.
  let def = t.def;
  let mdf = t.mdf;
  if (cmd !== null && (cmd.damageClass & 1) !== 0) {
    if ((input.snapshot & 0x40) !== 0) def = 0;
    if ((input.snapshot & 0x80) !== 0) mdf = 0;
  }

  // The variance draw comes first, whatever the formula.
  const v = input.variance ? (draw() & 31) + 240 : 256;

  let r: number;
  let early = false; // formulas 0xe and 0x14 return before the sign flip and the out-pointers
  switch (input.formula) {
    case 1: {
      // STR vs DEF.
      const x = reduceByDefence(cube(u.cheer + u.str), defTerm(def), t.cheer);
      r = div256(mul(div16(mul(x, power)), v));
      break;
    }
    case 2: {
      // STR, defence ignored.
      r = div256(mul(div16(mul(cube(u.cheer + u.str), power)), v));
      break;
    }
    case 3: {
      // MAG vs MDF: (s*s/6 + power) * power / 4, reduced by MDF and the target's Focus.
      const s = u.focus + u.mag;
      const q = div4(mul(sdiv(mul(s, s), 6) + power, power));
      const x = reduceByDefence(q, defTerm(mdf), t.focus);
      r = div256(mul(x, v));
      break;
    }
    case 4: {
      // MAG, defence ignored.
      const s = u.focus + u.mag;
      const q = div4(mul(sdiv(mul(s, s), 6) + power, power));
      r = div256(mul(q, v));
      break;
    }
    case 5:
      // Fraction of the target's running HP/MP/CTB. No variance.
      r = div16(mul(saved, power));
      break;
    case 6:
      r = mul(power, 50);
      break;
    case 7:
      // Healing: ((MAG + Focus + power) / 2) * V * power / 256.
      r = div256(mul(mul(div2(u.mag + (u.focus + power)), v), power));
      break;
    case 8:
      // Fraction of the target's maximum.
      r = div16(mul(max, power));
      break;
    case 9:
      r = div256(mul(mul(v, power), 50));
      break;
    case 0xa:
      // Unsigned: the target's max MP, whatever the mode.
      r = mul(t.maxMp, power) >>> 4;
      break;
    case 0xb:
      r = div16(mul(t.baseCtb, power));
      break;
    case 0xc:
      r = div16(mul(t.runningMp, power));
      break;
    case 0xd:
      r = div16(mul(t.runningCtb, power));
      break;
    case 0xe:
      // STR cube, no defence, no variance, no Cheer.
      r = div16(mul(cube(u.str), power));
      early = true;
      break;
    case 0xf:
      // MAG cube with variance (Focus added).
      r = div256(mul(div16(mul(cube(u.focus + u.mag), power)), v));
      break;
    case 0x10:
      // Unsigned: the user's max HP * power / 10.
      r = udiv(mul(u.maxHp, power), 10);
      break;
    case 0x11:
      r = celestial(u, power, v, udiv(mul(u.hp, 100), u.maxHp) + 10, 110);
      break;
    case 0x12:
      r = celestial(u, power, v, udiv(mul(u.mp, 100), u.maxMp) + 10, 110);
      break;
    case 0x13:
      // (130 - HP%) * cube / 60: the bonus grows as HP falls.
      r = celestial(u, power, v, 130 - udiv(mul(u.hp, 100), u.maxHp), 60);
      break;
    case 0x14:
      // MAG cube, no defence, no variance.
      r = div16(mul(cube(u.mag), power));
      early = true;
      break;
    case 0x15:
      r = sdiv(input.gilOffered ?? 0, 10);
      break;
    case 0x16:
      r = (t.id & 0xff) < 0x12 ? mul(t.saveCounter, power) : (input.fallback ?? 0);
      break;
    case 0x17:
      r = mul(power, 9999);
      break;
    default:
      r = input.fallback ?? 0;
      break;
  }

  if (early) return { value: r | 0, defUsed: undefined, mdfUsed: undefined };

  // Healing commands return a negative value, except against a Zombie.
  if (cmd !== null && (cmd.flagsDamage & 0x10) !== 0 && (input.snapshot & 2) === 0) r = neg(r);
  return { value: r | 0, defUsed: def, mdfUsed: mdf };
}

/**
 * Formulas 0x11 to 0x13: `((a * cube(cheer + STR)) / divisor * power >> 4) * V >> 8`.
 * Every step is UNSIGNED (DIV, MUL and logical shifts), so a wrapped product is
 * read as a large positive number.
 */
function celestial(u: BaseDamageUser, power: number, v: number, a: number, divisor: number): number {
  let x = udiv(mul(a, cube(u.cheer + u.str)), divisor);
  x = mul(x, power) >>> 4;
  return mul(x, v) >>> 8;
}
