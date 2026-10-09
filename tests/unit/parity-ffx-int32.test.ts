/**
 * Parity tests for the 32-bit integer helpers (`src/battle/ffx/kernel/int32.ts`) and the two terms every
 * defence-reduced formula shares, the cube term and the defence term (`kernel/damage.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, the instruction sequences of
 * 0x789bf0 and of the modifier functions 0x78e630 calls. Spec: `research/re-ffx-damage.md` section 1.
 *
 * `/ 2`, `/ 4`, `/ 16`, `/ 32` and `/ 256` round toward zero; products wrap at 32 bits; a few steps are unsigned.
 */

import { describe, expect, it } from 'vitest';
import { cube, defTerm } from '../../src/battle/ffx/kernel/damage.ts';
import {
  cvttsd2si,
  div16,
  div2,
  div256,
  div32,
  div4,
  mul,
  mul3div2,
  neg,
  sdiv,
  udiv,
} from '../../src/battle/ffx/kernel/int32.ts';

describe('32-bit integer helpers (what the instruction sequences compute)', () => {
  it('division by a power of two rounds toward zero, not toward minus infinity', () => {
    // CDQ; AND EDX, mask; ADD EAX, EDX; SAR EAX, n: -17 + 15 = -2, then -2 >> 4 = -1 (floor division would give -2).
    expect(div16(17)).toBe(1);
    expect(div16(-17)).toBe(-1);
    expect(div16(-15)).toBe(0);
    expect(div2(-3)).toBe(-1);
    expect(div4(-5)).toBe(-1);
    expect(div32(-33)).toBe(-1);
    expect(div256(-257)).toBe(-1);
    expect(div256(255)).toBe(0);
  });

  it('x * 3 / 2 multiplies first (wrapping at 32 bits) and then halves toward zero', () => {
    expect(mul3div2(3)).toBe(4); // 9 / 2 = 4
    expect(mul3div2(-3)).toBe(-4); // -9 / 2 = -4 (trunc), floor would be -5
    // 715,827,883 * 3 = 2,147,483,649 wraps to -2,147,483,647;  / 2 toward zero = -1,073,741,823
    expect(mul3div2(715827883)).toBe(-1073741823);
  });

  it('IMUL keeps the low 32 bits: a product past 2^31 turns negative', () => {
    expect(mul(65536, 65536)).toBe(0);
    expect(mul(46341, 46341)).toBe(-2147479015); // 2,147,488,281 - 2^32
    expect(mul(3, 715827883)).toBe(-2147483647); // 2,147,483,649 - 2^32
  });

  it('IDIV truncates toward zero, DIV reads both operands as unsigned', () => {
    expect(sdiv(-7, 2)).toBe(-3);
    expect(sdiv(7, -2)).toBe(-3);
    expect(sdiv(-7, 100)).toBe(0);
    expect(Object.is(sdiv(-7, 100), 0)).toBe(true); // never -0
    expect(udiv(-1, 10)).toBe(429496729); // 0xFFFFFFFF / 10
    expect(udiv(7, 2)).toBe(3);
  });

  it('division by zero is an error here (the game faults)', () => {
    expect(() => sdiv(5, 0)).toThrow(RangeError);
    expect(() => udiv(5, 0)).toThrow(RangeError);
  });

  it('NEG never produces -0, and wraps -2^31 to itself', () => {
    expect(Object.is(neg(0), 0)).toBe(true);
    expect(neg(5)).toBe(-5);
    expect(neg(-2147483648)).toBe(-2147483648);
  });

  it('CVTTSD2SI truncates, and out-of-range or NaN gives 0x80000000', () => {
    expect(cvttsd2si(3.99)).toBe(3);
    expect(cvttsd2si(-1.9)).toBe(-1);
    expect(cvttsd2si(2147483647.5)).toBe(2147483647);
    expect(cvttsd2si(2147483648)).toBe(-2147483648);
    expect(cvttsd2si(Number.NaN)).toBe(-2147483648);
    expect(cvttsd2si(-2147483648.9)).toBe(-2147483648);
  });
});

describe('cube term and defence term', () => {
  it('cube(s) = (s^3 >> 5) + 30', () => {
    expect(cube(0)).toBe(30); // 0 + 30
    expect(cube(20)).toBe(280); // 8000 / 32 = 250, + 30
    expect(cube(25)).toBe(518); // 15625 / 32 = 488.28 -> 488, + 30
    expect(cube(255)).toBe(518197); // 16,581,375 / 32 = 518,167.97 -> 518,167, + 30
    expect(cube(260)).toBe(549280); // STR 255 + 5 Cheer: 17,576,000 / 32 = 549,250, + 30
  });

  it('dt(x) = 730 - (51x - x*x/11) / 10', () => {
    // x = 20: 400 / 11 = 36; 51*20 = 1020; 1020 - 36 = 984; 984 / 10 = 98; 730 - 98 = 632.
    expect(defTerm(20)).toBe(632);
    expect(defTerm(0)).toBe(730);
    expect(defTerm(1)).toBe(725); // 51 - 0 = 51; 51 / 10 = 5
    expect(defTerm(5)).toBe(705);
    expect(defTerm(50)).toBe(498); // 2500 / 11 = 227; 2550 - 227 = 2323; 232; 730 - 232
    expect(defTerm(100)).toBe(311);
    expect(defTerm(200)).toBe(74);
    expect(defTerm(255)).toBe(21); // 65025 / 11 = 5911; 13005 - 5911 = 7094; 709; 730 - 709
  });
});
