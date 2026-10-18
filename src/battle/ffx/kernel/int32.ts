/**
 * 32-bit integer helpers for the FFX parity kernels.
 *
 * The game is 32-bit x86 code. Every number in its damage chain is a 32-bit
 * integer, so a product that does not fit WRAPS, a signed division rounds
 * toward zero, and the `>> 4` / `>> 8` forms the compiler emits for `/ 16` and
 * `/ 256` first add a bias for negative values so they also round toward zero
 * (add `(v >> 31) & mask` to `v`, where mask is the divisor minus 1, then shift right by n). The engine's own integer
 * helpers (`../math.ts`) floor instead; these do not.
 *
 * **Game case: FFX only** (FFX-2 has its own helpers in `src/battle/ffx2/kernel/`).
 *
 * Source: FFX.exe Steam build 25501027, the instruction sequences of 0x789bf0,
 * 0x78e630 and the modifier functions it calls (research/re-ffx-damage.md §1).
 * Pure, DOM-free, no `three`.
 */

/** The low 32 bits of `x`, as a signed integer (what a 32-bit register holds). */
export function s32(x: number): number {
  return x | 0;
}

/** The low 32 bits of `x`, as an unsigned integer. */
export function u32(x: number): number {
  return x >>> 0;
}

/**
 * The 32-bit signed product, low 32 bits kept (wraps). Math.imul does exactly
 * this (the 64-bit product is never formed), so a product past 2^31 wraps the
 * way the game's does.
 */
export function mul(a: number, b: number): number {
  return Math.imul(a, b);
}

/**
 * Signed division by a non-zero 32-bit divisor: truncation toward zero.
 *
 * `Math.trunc(a / b)` is exact for 32-bit operands: a non-integer quotient is at
 * least 1/|b| from the nearest integer, while the double rounding error is at
 * most |a/b| * 2^-53 < 2^-22/|b|. The game faults on a zero divisor; here that
 * is a RangeError so a bad input cannot pass for a result.
 */
export function sdiv(a: number, b: number): number {
  if (b === 0) throw new RangeError('integer division by zero (the game faults here)');
  return Math.trunc(a / b) | 0;
}

/**
 * Unsigned division by a non-zero divisor. Both operands are read as unsigned
 * 32-bit values; the quotient is an exact integer below 2^32 (same exactness
 * argument as {@link sdiv}).
 */
export function udiv(a: number, b: number): number {
  const d = b >>> 0;
  if (d === 0) throw new RangeError('integer division by zero (the game faults here)');
  return Math.floor((a >>> 0) / d);
}

/** `v / 2`, rounding toward zero: subtract the sign mask (-1 when `v` is negative), then shift right by 1. */
export function div2(v: number): number {
  return (v - (v >> 31)) >> 1;
}

/** `v / 4`, rounding toward zero: add 3 when `v` is negative (a bias), then shift right by 2. */
export function div4(v: number): number {
  return (v + ((v >> 31) & 3)) >> 2;
}

/** `v / 16`, rounding toward zero: add 0xf when `v` is negative (a bias), then shift right by 4. */
export function div16(v: number): number {
  return (v + ((v >> 31) & 15)) >> 4;
}

/** `v / 32`, rounding toward zero: add 0x1f when `v` is negative (a bias), then shift right by 5. */
export function div32(v: number): number {
  return (v + ((v >> 31) & 31)) >> 5;
}

/** `v / 256`, rounding toward zero: add 0xff when `v` is negative (a bias), then shift right by 8. */
export function div256(v: number): number {
  return (v + ((v >> 31) & 255)) >> 8;
}

/** `v * 3 / 2` as the game writes it: the product wraps at 32 bits, then halves toward zero. */
export function mul3div2(v: number): number {
  return div2(Math.imul(v, 3));
}

/** Two's-complement negation in 32 bits (and never `-0`). */
export function neg(v: number): number {
  return -v | 0;
}

/**
 * Double to int32 by truncation (the game's float-to-int conversion). NaN and anything outside the int32
 * range give the "integer indefinite" value 0x80000000, as the hardware does.
 */
export function cvttsd2si(x: number): number {
  if (Number.isNaN(x) || x >= 2147483648 || x <= -2147483649) return -2147483648;
  return Math.trunc(x) | 0;
}
