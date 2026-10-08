/**
 * Parity tests for the FFX-2 element kernel (`src/battle/ffx2/kernel/element.ts`): what a target's absorb, null,
 * half and weak bytes do to a damage number.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), function 0x618780
 * (the older copy of the exe has it at 0x6187a0). Spec: `research/re-ffx2-damage.md` section 3.
 *
 * Where the expected numbers come from: hand arithmetic (shown in the comments), and the real function. The
 * single-bit and two-bit cases below were also run through the real damage orchestrator in the x86 emulator
 * (private scratch `D:\Tools\ffx-parity\kernel-check-ffx2-damage\`), which calls this function; 33,440 emulated
 * orchestrator cases, a large share with random element masks and affinity bytes, agree with the kernel.
 */

import { describe, expect, it } from 'vitest';
import { elementLadder, elementMod, type ElementAffinities } from '../../src/battle/ffx2/kernel/element.ts';

function target(over: Partial<ElementAffinities> = {}): ElementAffinities {
  return { absorb: 0, nullify: 0, half: 0, weak: 0, ...over };
}

/** Bits 0 to 5 are fire, ice, thunder, water, gravity, holy (the first six the anchor map names); 6 and 7 are the rest. */
const FIRE = 0x01;
const ICE = 0x02;
const THUNDER = 0x04;
const BIT7 = 0x80;

describe('element ladder: rung 1, no element', () => {
  it('an attack with element byte 0 is unchanged, whatever the target is', () => {
    expect(elementMod(target({ weak: 0xff, absorb: 0xff, nullify: 0xff, half: 0xff }), 0, 11)).toBe(11);
    expect(elementLadder(target({ weak: 0xff }), 0, 11).outcome).toBe('none');
  });
});

describe('element ladder: rung 2 and 3, weakness doubles and compounds', () => {
  it('one shared bit doubles: 11 -> 22', () => {
    expect(elementMod(target({ weak: FIRE }), FIRE, 11)).toBe(22);
    expect(elementLadder(target({ weak: FIRE }), FIRE, 11).outcome).toBe('weak');
  });

  it('two shared bits double twice: 11 -> 44, seven bits -> x128', () => {
    expect(elementMod(target({ weak: FIRE | ICE }), FIRE | ICE, 11)).toBe(44);
    expect(elementMod(target({ weak: 0x7f }), 0x7f, 11)).toBe(1408); // 11 * 128
  });

  it('only the bits the attack carries count: a weakness to ice does nothing to a fire attack', () => {
    // fire is then judged by the rest of the ladder: no entry for fire at all, so it is neutral -> unchanged
    expect(elementMod(target({ weak: ICE }), FIRE, 11)).toBe(11);
  });

  it('weakness wins over everything below it, even an absorb on another bit', () => {
    // fire is weak (x2); ice is absorbed, but the ladder returns at the weak rung
    expect(elementMod(target({ weak: FIRE, absorb: ICE }), FIRE | ICE, 11)).toBe(22);
    expect(elementMod(target({ weak: FIRE, nullify: ICE }), FIRE | ICE, 11)).toBe(22);
  });

  it('bit 7 is special: both sides having it doubles once more and returns at once', () => {
    expect(elementMod(target({ weak: BIT7 }), BIT7, 11)).toBe(22);
    expect(elementMod(target({ weak: BIT7 | FIRE }), BIT7 | FIRE, 11)).toBe(44); // fire x2, then bit 7 x2
    expect(elementMod(target({ weak: BIT7 }), BIT7 | FIRE, 11)).toBe(22); // only bit 7 is shared
  });

  it('a weak hit on a negative number doubles it too, and the doubling wraps at 32 bits', () => {
    expect(elementMod(target({ weak: FIRE }), FIRE, -11)).toBe(-22);
    expect(elementMod(target({ weak: FIRE }), FIRE, 0x60000000)).toBe(-1073741824); // 0xC0000000
  });
});

describe('element ladder: rung 4, one neutral bit shields the hit from the resistances', () => {
  it('fire is half, ice has no entry: the attack carrying both is unchanged', () => {
    // 11: no weak bit; ice has no null, half or absorb entry, so the whole hit is neutral
    expect(elementMod(target({ half: FIRE }), FIRE | ICE, 11)).toBe(11);
    expect(elementLadder(target({ half: FIRE }), FIRE | ICE, 11).outcome).toBe('neutral');
  });

  it('the same holds for null and absorb on the other bit', () => {
    expect(elementMod(target({ nullify: FIRE }), FIRE | ICE, 11)).toBe(11);
    expect(elementMod(target({ absorb: FIRE }), FIRE | ICE, 11)).toBe(11);
  });

  it('a lone bit 7 with no entry on bit 7 is neutral; with any entry it falls through to the lower rungs', () => {
    expect(elementMod(target({ half: FIRE }), BIT7, 11)).toBe(11);
    expect(elementMod(target({ half: BIT7 }), BIT7, 11)).toBe(5);
  });
});

describe('element ladder: rung 5, half', () => {
  it('half rounds toward zero: 11 -> 5, and -11 -> -5', () => {
    expect(elementMod(target({ half: FIRE }), FIRE, 11)).toBe(5);
    expect(elementMod(target({ half: FIRE }), FIRE, -11)).toBe(-5);
    expect(elementLadder(target({ half: FIRE }), FIRE, 11).outcome).toBe('half');
  });

  it('a bit that is half AND null (or half and absorb) does not count as half', () => {
    expect(elementMod(target({ half: FIRE, nullify: FIRE }), FIRE, 11)).toBe(0); // null rung
    expect(elementMod(target({ half: FIRE, absorb: FIRE }), FIRE, 11)).toBe(-11); // absorb rung
  });

  it('half on one bit beats null on another (half is judged first)', () => {
    expect(elementMod(target({ half: FIRE, nullify: ICE }), FIRE | ICE, 11)).toBe(5);
    expect(elementMod(target({ half: FIRE, absorb: ICE }), FIRE | ICE, 11)).toBe(5);
  });

  it('bit 7 follows the same test on its own', () => {
    expect(elementMod(target({ half: BIT7 }), BIT7, 11)).toBe(5);
    expect(elementMod(target({ half: BIT7, nullify: BIT7 }), BIT7, 11)).toBe(0);
    expect(elementMod(target({ half: BIT7 | FIRE }), BIT7 | FIRE, 11)).toBe(5);
  });
});

describe('element ladder: rungs 6 and 7, null and absorb', () => {
  it('null zeroes the hit', () => {
    expect(elementMod(target({ nullify: FIRE }), FIRE, 11)).toBe(0);
    expect(elementLadder(target({ nullify: FIRE }), FIRE, 11).outcome).toBe('null');
  });

  it('absorb negates it: the hit heals', () => {
    expect(elementMod(target({ absorb: FIRE }), FIRE, 11)).toBe(-11);
    expect(elementLadder(target({ absorb: FIRE }), FIRE, 11).outcome).toBe('absorb');
    expect(elementMod(target({ absorb: FIRE }), FIRE, -11)).toBe(11); // an absorbed heal hurts
    expect(elementMod(target({ absorb: FIRE }), FIRE, -2147483648)).toBe(-2147483648); // NEG of INT_MIN
  });

  it('a bit that is null and absorb is absorbed (null needs "not absorb")', () => {
    expect(elementMod(target({ nullify: FIRE, absorb: FIRE }), FIRE, 11)).toBe(-11);
  });

  it('null on one bit and absorb on another: null wins (it is judged first)', () => {
    expect(elementMod(target({ nullify: FIRE, absorb: ICE }), FIRE | ICE, 11)).toBe(0);
  });

  it('bit 7: null and absorb on their own', () => {
    expect(elementMod(target({ nullify: BIT7 }), BIT7, 11)).toBe(0);
    expect(elementMod(target({ absorb: BIT7 }), BIT7, 11)).toBe(-11);
    expect(elementMod(target({ nullify: BIT7, absorb: BIT7 }), BIT7, 11)).toBe(-11);
  });

  it('three bits, each with a different entry: weak, half and null together -> weak decides', () => {
    expect(elementMod(target({ weak: FIRE, half: ICE, nullify: THUNDER }), FIRE | ICE | THUNDER, 11)).toBe(22);
  });
});

describe('the ladder reads bytes', () => {
  it('values above 255 are cut to their low byte, as the byte reads do', () => {
    expect(elementMod(target({ weak: 0x101 }), 0x101, 11)).toBe(22); // 0x101 & 0xff = 0x01
    expect(elementMod(target({ weak: FIRE }), 0x100, 11)).toBe(11); // 0x100 & 0xff = 0: no element
  });
});
