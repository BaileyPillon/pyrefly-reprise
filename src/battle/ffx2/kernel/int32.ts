/**
 * 32-bit integer helpers for the FFX-2 parity kernels.
 *
 * **Game case: FFX-2 only** (the FFX kernels keep their own copy in `../../ffx/kernel/int32.ts`; the two are
 * written from different executables and are not shared on purpose, AGENTS.md rule 14).
 *
 * FFX-2.exe is 32-bit x86 code. Every number in its damage chain is a 32-bit register: a product that does
 * not fit WRAPS (IMUL keeps the low 32 bits), a signed division rounds toward zero, and the compiler writes
 * `/ 2`, `/ 16`, `/ 64`, `/ 128`, `/ 256` and `/ 1024` as a shift that first adds a bias for negative values
 * (`CDQ; AND EDX, mask; ADD EAX, EDX; SAR EAX, n`) so they also round toward zero. The division by 12, 20 and
 * 255 is a multiply by a magic constant (0x2AAAAAAB, 0x66666667, 0x80808081) plus a shift and a sign
 * correction, which is exactly `trunc(x / d)` for every 32-bit `x` (tested against the magic sequences in
 * `tests/unit/parity-ffx2-damage.test.ts`). The engine's own integer helpers (`../../ffx/math.ts`) floor
 * instead; these do not.
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the instruction sequences of the base
 * damage function 0x61b910 and the damage orchestrator 0x6172c0 (research/re-ffx2-damage.md section 1).
 * Pure, DOM-free, no `three`.
 */

/** The low 32 bits of `x`, as a signed integer (what a 32-bit register holds). */
export function s32(x: number): number {
  return x | 0;
}

/** `a + b` in a 32-bit register (ADD / LEA wrap). */
export function add(a: number, b: number): number {
  return (a + b) | 0;
}

/** `a - b` in a 32-bit register (SUB wraps). */
export function sub(a: number, b: number): number {
  return (a - b) | 0;
}

/**
 * IMUL r32: the low 32 bits of the product, signed. `Math.imul` does exactly this (the 64-bit product is
 * never formed in a double), so a product past 2^31 wraps the way the game's does.
 */
export function mul(a: number, b: number): number {
  return Math.imul(a, b);
}

/**
 * IDIV by a non-zero 32-bit divisor: truncation toward zero.
 *
 * `Math.trunc(a / b)` is exact for 32-bit operands: a non-integer quotient is at least 1/|b| from the
 * nearest integer, while the double rounding error is at most |a/b| * 2^-53, far below that. The CPU raises a
 * divide error on a zero divisor and on INT_MIN / -1; here both are a RangeError so a bad input cannot pass
 * for a result.
 */
export function sdiv(a: number, b: number): number {
  if (b === 0) throw new RangeError('integer division by zero (the game faults here)');
  if (a === -2147483648 && b === -1) throw new RangeError('INT_MIN / -1 overflows (the game faults here)');
  return Math.trunc(a / b) | 0;
}

/** `a * num / den` as the game writes the stage and defence factors: wrapping IMUL, then a truncating divide. */
export function scale(a: number, num: number, den: number): number {
  return sdiv(Math.imul(a, num), den);
}

/** `v / 2`, rounding toward zero: CDQ; SUB EAX, EDX; SAR EAX, 1. */
export function div2(v: number): number {
  return (v - (v >> 31)) >> 1;
}

/** `v / 4`, rounding toward zero: CDQ; AND EDX, 3; ADD EAX, EDX; SAR EAX, 2. */
export function div4(v: number): number {
  return (v + ((v >> 31) & 3)) >> 2;
}

/** `v / 16`, rounding toward zero: CDQ; AND EDX, 0xf; ADD EAX, EDX; SAR EAX, 4. */
export function div16(v: number): number {
  return (v + ((v >> 31) & 15)) >> 4;
}

/** `v / 64`, rounding toward zero: CDQ; AND EDX, 0x3f; ADD EAX, EDX; SAR EAX, 6. */
export function div64(v: number): number {
  return (v + ((v >> 31) & 63)) >> 6;
}

/** `v / 128`, rounding toward zero: CDQ; AND EDX, 0x7f; ADD EAX, EDX; SAR EAX, 7. */
export function div128(v: number): number {
  return (v + ((v >> 31) & 127)) >> 7;
}

/** `v / 256`, rounding toward zero: CDQ; AND EDX, 0xff; ADD EAX, EDX; SAR EAX, 8. */
export function div256(v: number): number {
  return (v + ((v >> 31) & 255)) >> 8;
}

/** `v / 1024`, rounding toward zero: CDQ; AND EDX, 0x3ff; ADD EAX, EDX; SAR EAX, 10. */
export function div1024(v: number): number {
  return (v + ((v >> 31) & 1023)) >> 10;
}

/** `v * 3 / 2` as the game writes it: the product wraps at 32 bits, then halves toward zero. */
export function mul3div2(v: number): number {
  return div2(Math.imul(v, 3));
}

/** NEG: two's-complement negation in 32 bits (and never `-0`). */
export function neg(v: number): number {
  return -v | 0;
}

/** MOVZX r32, byte: the low 8 bits as an unsigned number (a stat byte read from the character record). */
export function u8(x: number): number {
  return x & 0xff;
}

/** MOVSX r32, byte: the low 8 bits as a signed number (a stat-stage byte read from the character record). */
export function s8(x: number): number {
  return (x << 24) >> 24;
}

/** MOVZX r32, word: the low 16 bits as an unsigned number. */
export function u16(x: number): number {
  return x & 0xffff;
}

/**
 * The game's clamp helper `pp_clamp` (exe 0x624ca0): `v` raised to `lo`, then lowered to `hi`. With `hi < lo`
 * the result is `hi`, as in the game (the second test runs last).
 */
export function clamp(v: number, lo: number, hi: number): number {
  let r = v;
  if (r < lo) r = lo;
  if (hi < r) r = hi;
  return r;
}

/**
 * CVTTSD2SI / `_ftol`: double to int32 by truncation. NaN and anything outside the int32 range give the
 * "integer indefinite" value 0x80000000, as the hardware does.
 */
export function cvttsd2si(x: number): number {
  if (Number.isNaN(x) || x >= 2147483648 || x <= -2147483649) return -2147483648;
  return Math.trunc(x) | 0;
}
