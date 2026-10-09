/**
 * Small machine-integer helpers for the FFX-2 hit / crit / status / steal kernels.
 *
 * The game is 32-bit x86 code: every value is a 32-bit register, a product that does not fit WRAPS, a
 * signed division and a signed modulo round toward zero, and the "divide by a power of two" the
 * compiler emits adds a bias for negative values first so it also rounds toward zero. The engine's
 * own helpers floor instead; these do not.
 *
 * **Game case: FFX-2 only** (kept separate from the FFX kernels' helpers on purpose). Source: the
 * instruction sequences of FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), functions
 * 0x00641500, 0x00617210, 0x00619230, 0x00619700, 0x00619c10, 0x00619d10, 0x00616fb0
 * (`research/re-ffx2-hit-status.md`). Pure, DOM-free.
 */

/** `a[i]`, or a RangeError (the project compiles with `noUncheckedIndexedAccess`). */
export function at<T>(a: ArrayLike<T>, i: number): T {
  const v = a[i];
  if (v === undefined) throw new RangeError(`index ${i} is outside 0..${a.length - 1}`);
  return v;
}

/** The low 32 bits of `x` as a signed integer (what a 32-bit register holds). */
export function s32(x: number): number {
  return x | 0;
}

/** The low 32 bits of `x` as an unsigned integer. */
export function u32(x: number): number {
  return x >>> 0;
}

/** The low 8 bits of `x` as a signed byte (MOVSX from a byte). */
export function s8(x: number): number {
  return (x << 24) >> 24;
}

/**
 * IDIV by a non-zero divisor: truncation toward zero, 32-bit. `Math.trunc(a / b)` is exact for 32-bit
 * operands (a non-integer quotient is at least 1/|b| from an integer, the double error is far smaller).
 * The game faults on a zero divisor; here that is a RangeError.
 */
export function sdiv(a: number, b: number): number {
  if (b === 0) throw new RangeError('integer division by zero (the game faults here)');
  return Math.trunc(a / b) | 0;
}

/** IDIV's remainder: the sign follows the dividend (C's `%`). */
export function smod(a: number, b: number): number {
  if (b === 0) throw new RangeError('integer division by zero (the game faults here)');
  return (a | 0) % (b | 0) | 0;
}

/** Unsigned DIV by a non-zero divisor, both operands read as unsigned 32-bit. */
export function udiv(a: number, b: number): number {
  const d = b >>> 0;
  if (d === 0) throw new RangeError('integer division by zero (the game faults here)');
  return Math.floor((a >>> 0) / d);
}

/** `v / 4`, rounding toward zero: CDQ; AND EDX, 3; ADD EAX, EDX; SAR EAX, 2. */
export function div4(v: number): number {
  return (v + ((v >> 31) & 3)) >> 2;
}

/**
 * CVTTSD2SI / `__ftol2_sse`: double to int32 by truncation toward zero. NaN and anything outside the
 * int32 range give the "integer indefinite" value 0x80000000, as the hardware does.
 */
export function cvttsd2si(x: number): number {
  if (Number.isNaN(x) || x >= 2147483648 || x <= -2147483649) return -2147483648;
  return Math.trunc(x) | 0;
}

/** `clamp(v, lo, hi)` as the game's `pp_clamp` (exe 0x00624ca0): the low bound first, then the high. */
export function clampInt(v: number, lo: number, hi: number): number {
  let r = v;
  if (r < lo) r = lo;
  if (hi < r) r = hi;
  return r;
}
