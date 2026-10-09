/**
 * FFX AP rules shared by the Overdrive gauge and the end-of-fight rewards: the AP curve a full gauge converts to,
 * the per-character AP award with its auto-ability multipliers, and the statistic counters the battle code bumps.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the AP curve is 0x784e90,
 * the AP award 0x798a00, the statistic counter 0x785a00. Spec: `research/re-ffx-overdrive-steal-aeons.md` sections 2
 * and 4. Pure, deterministic, not wired into the engine. Every operation mirrors the instruction sequence (32-bit
 * wraparound products, truncating divisions, signed clamps), as in `./int32.ts`.
 */

import { mul, s32, sdiv } from './int32.ts';

/** The clamp the game uses on its counters: `pp_BtlClamp(value, 0, 999999999)` with signed compares. */
export const COUNTER_CAP = 999_999_999;

/** `clamp(v, lo, hi)` as `pp_Clamp` (0x0079a0c0) does it: the low bound first, then the high bound, signed. */
export function clamp(v: number, lo: number, hi: number): number {
  let x = v | 0;
  if (x < lo) x = lo;
  if (x > hi) x = hi;
  return x;
}

/** The four numbers of one `ply_rom` record the AP curve reads: bytes 0x11, 0x12, 0x13 and the u32 at 0x14. */
export interface ApCurveRow {
  /** Byte at record +0x11: the cubic term (per 100). */
  a: number;
  /** Byte at record +0x12: the square term (per 10). */
  b: number;
  /** Byte at record +0x13: the linear term. */
  c: number;
  /** u32 at record +0x14: the value used when the level is above 100 (signed 32-bit here, as the game returns it in EAX). */
  cap: number;
}

/**
 * `FUN_00784e90(id)`: the AP value of the character's next step, `c * (n + 1) + a * n^3 / 100 + b * n^2 / 10` with
 * truncating divisions, where `n` is the sum of the two level bytes of the party save record (+0x3b and +0x3c).
 * Above 100 the row's cap is returned instead. The Overdrive-to-AP ability turns the whole gauge into this much AP.
 */
export function apCurve(row: ApCurveRow, levelA: number, levelB: number): number {
  const n = (levelA & 0xff) + (levelB & 0xff);
  if (n > 100) return row.cap | 0;
  const cubic = sdiv(mul(mul(mul(row.a & 0xff, n), n), n), 100);
  const square = sdiv(mul(mul(row.b & 0xff, n), n), 10);
  return (mul(row.c & 0xff, n + 1) + cubic + square) | 0;
}

/** The auto-ability bits `Chr+0x6be` the AP award reads. */
export const AUTO_B = {
  /** Overdrive x2. */
  OdDouble: 0x0001,
  /** Overdrive x3. */
  OdTriple: 0x0002,
  /** Overdrive x2 while the HP is below half. */
  OdLowHp: 0x0004,
  /** Overdrive to AP. */
  OdToAp: 0x0008,
  /** Double AP. */
  ApDouble: 0x0010,
  /** Triple AP. */
  ApTriple: 0x0020,
  /** No AP. */
  ApNone: 0x0040,
  /** Gillionaire: doubles the gil of a kill. */
  GilDouble: 0x4000,
} as const;

/** What the AP award reads of one character. */
export interface ApRecipient {
  /** `Chr+0x6be` (u16). */
  autoB: number;
  /** `Chr+0xdc8 != 0`. */
  inBattle: boolean;
  /** `Chr+0xdcc != 0`. */
  dead: boolean;
  /** `Chr+0xdcd != 0`: the character is not eligible at all. */
  apBlocked: boolean;
}

/**
 * `FUN_00798a00(id, chr, ap, other)`: adds `ap` to the character's running AP total `totals[id]` (clamped to
 * 0..999999999) and returns the gil multiplier chain value. Returns `other` untouched, adding nothing, when
 * `Chr+0xdcd` is set. The AP is 0 with the No AP ability (bit 0x40). Only a character who is in the battle and not dead
 * gets Double AP (0x10, x2) or Triple AP (0x20, x3, checked first) applied, and only such a character can turn the
 * return value into 2 (the Gillionaire bit 0x4000); everybody else, a reserve or a dead character, gets the plain AP.
 */
export function awardAp(c: ApRecipient, totals: number[], id: number, ap: number, other: number): number {
  if (c.apBlocked) return other;
  let v = (c.autoB & AUTO_B.ApNone) !== 0 ? 0 : ap | 0;
  let ret = other;
  if (c.inBattle && !c.dead) {
    ret = (c.autoB & AUTO_B.GilDouble) !== 0 ? 2 : other;
    if ((c.autoB & AUTO_B.ApTriple) !== 0) v = mul(v, 3);
    else if ((c.autoB & AUTO_B.ApDouble) !== 0) v = (v + v) | 0;
  }
  totals[id] = clamp(s32(totals[id] ?? 0) + v, 0, COUNTER_CAP);
  return ret;
}

/** Statistic counters kept per party member in the save record (+0x50, +0x54, +0x58, +0x5c). */
export const STAT_COUNTERS = 4;

/**
 * `FUN_00785a00(id, kind)`: bumps statistic counter `kind` (0 to 3) of party member `id` (below 0x12) by one,
 * clamped to 0..999999999, unless the battle mode byte (0x0112c9e5) is 2. The counter is a u32 read as signed: a
 * value of 0x7fffffff or more reads as negative and the clamp turns the increment into 0. Counter 3 is the one the
 * Overdrive gauge bumps when it reaches full; counter 1 counts kills and counter 2 deaths (death handler 0x78c740).
 */
export function bumpStat(counters: number[], id: number, kind: number, demoMode: number): void {
  if (id >= 0x12 || demoMode === 2 || kind < 0 || kind > 3) return;
  counters[kind] = clamp(s32(counters[kind] ?? 0) + 1, 0, COUNTER_CAP) >>> 0;
}
