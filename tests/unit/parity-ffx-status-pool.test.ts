/**
 * Parity tests for the FFX Double HP / Double MP kernel (`src/battle/ffx/kernel/status-pool.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, `pp_BtlApplyDoubleHpMp`
 * at VA 0x0078d270. Spec: `research/re-ffx-ctb-status.md` section 7. Every hand-worked number has its arithmetic in
 * the comment next to it. The last block replays golden vectors from `tests/fixtures/parity/ffx/status_pool.json`:
 * each one is a run of the game's own machine code in an x86-32 emulator (nothing replaced; there is no random draw).
 */

import { describe, expect, it } from 'vitest';
import { applyDoubleHpMp, type PoolState } from '../../src/battle/ffx/kernel/status-pool.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

function state(over: Partial<PoolState> = {}): PoolState {
  return {
    buffFlags: 0,
    baseMaxHp: 2700,
    baseMaxMp: 600,
    maxHp: 2700,
    maxMp: 600,
    hp: 2000,
    mp: 300,
    autoB: 0,
    ...over,
  };
}

const none = -1; // a negative third argument: "no new flag word"

describe('Double HP and Double MP (0x78d270)', () => {
  it('turning Double HP on doubles the base maximum and leaves current HP where it is', () => {
    const r = applyDoubleHpMp(state(), 1);
    expect(r.buffFlags).toBe(1);
    expect(r.maxHp).toBe(5400); // 2 * 2700
    expect(r.hp).toBe(2000); // clamp(2000, 0, 5400)
    expect(r.maxMp).toBe(600); // the MP half saw "not doubled before, not doubled now" with a new word: nothing
    expect(r.mp).toBe(300);
  });

  it('turning Double MP on does the same for MP and never touches HP', () => {
    const r = applyDoubleHpMp(state({ baseMaxMp: 300, maxMp: 300, mp: 250 }), 2);
    expect(r.buffFlags).toBe(2);
    expect(r.maxMp).toBe(600); // 2 * 300, under the 999 cap
    expect(r.mp).toBe(250); // clamp(250, 0, 600)
    expect(r.maxHp).toBe(2700); // the HP half saw "not doubled before, not doubled now, a word was given": nothing
    expect(r.hp).toBe(2000);
  });

  it('caps: HP at 9999 and MP at 999, or 99999 and 9999 with Break HP Limit (0x200) and Break MP Limit (0x400)', () => {
    const big = state({ baseMaxHp: 6000, baseMaxMp: 600, maxHp: 6000, maxMp: 600, hp: 6000, mp: 600 });
    const plain = applyDoubleHpMp(big, 3);
    expect(plain.maxHp).toBe(9999); // 12000 clamped to 9999
    expect(plain.hp).toBe(6000); // unchanged: under the new maximum
    expect(plain.maxMp).toBe(999); // 1200 clamped to 999
    expect(plain.mp).toBe(600);
    const broken = applyDoubleHpMp({ ...big, autoB: 0x600 }, 3);
    expect(broken.maxHp).toBe(12000); // cap 99999
    expect(broken.maxMp).toBe(1200); // cap 9999
    expect(applyDoubleHpMp({ ...big, autoB: 0x200 }, 3).maxMp).toBe(999); // Break HP Limit alone does not lift MP
    expect(applyDoubleHpMp({ ...big, autoB: 0x400 }, 3).maxHp).toBe(9999); // nor Break MP Limit lift HP
  });

  it('applying it again (old bit set, new word has the bit) touches nothing, so it does not double twice', () => {
    const doubled = state({ buffFlags: 1, maxHp: 5400, hp: 5400 });
    const r = applyDoubleHpMp(doubled, 1);
    expect(r).toEqual(doubled); // HP half: wasDoubled && haveNew -> skip
  });

  it('removing it puts the BASE maximum back (not half of the current one) and clamps HP under it', () => {
    const doubled = state({ buffFlags: 1, maxHp: 5400, hp: 5000 });
    const r = applyDoubleHpMp(doubled, 0);
    expect(r.buffFlags).toBe(0);
    expect(r.maxHp).toBe(2700); // the stored base, unclamped
    expect(r.hp).toBe(2700); // clamp(5000, 0, 2700)
    const low = applyDoubleHpMp(state({ buffFlags: 1, maxHp: 5400, hp: 100 }), 0);
    expect(low.hp).toBe(100); // already under the base: unchanged
  });

  it('a flag that was never set and is not set now is left alone when a word is given', () => {
    const r = applyDoubleHpMp(state({ maxHp: 3333, maxMp: 444 }), 0);
    expect(r.maxHp).toBe(3333); // not rebuilt from the base
    expect(r.maxMp).toBe(444);
  });

  it('with no new word (a negative argument) the maxima are rebuilt from the stored byte', () => {
    const rebuilt = applyDoubleHpMp(state({ buffFlags: 3, maxHp: 1, maxMp: 1 }), none);
    expect(rebuilt.buffFlags).toBe(3); // the byte is not rewritten
    expect(rebuilt.maxHp).toBe(5400);
    expect(rebuilt.maxMp).toBe(999); // 1200 clamped to 999
    const reset = applyDoubleHpMp(state({ buffFlags: 0, maxHp: 4000, maxMp: 700, hp: 3900, mp: 650 }), none);
    expect(reset.maxHp).toBe(2700); // base
    expect(reset.hp).toBe(2700); // clamp(3900, 0, 2700)
    expect(reset.maxMp).toBe(600);
    expect(reset.mp).toBe(600); // clamp(650, 0, 600)
  });

  it('the whole new word is stored as a byte (the other bits belong to the damage pipeline) and any word with bit 31 set means "none"', () => {
    expect(applyDoubleHpMp(state(), 0x1ff).buffFlags).toBe(0xff); // 0x1ff & 0xff
    expect(applyDoubleHpMp(state({ buffFlags: 0x20 }), 0x80000000).buffFlags).toBe(0x20); // negative as signed 32-bit: byte kept
    expect(applyDoubleHpMp(state({ buffFlags: 0x20 }), 0xffffffff).buffFlags).toBe(0x20);
  });

  it('the 32-bit product wraps: a base maximum of 0x40000000 doubles to a negative number and clamps up to 0', () => {
    const r = applyDoubleHpMp(state({ baseMaxHp: 0x40000000, maxHp: 7, hp: 5 }), 1);
    expect(r.maxHp).toBe(0); // imul(0x40000000, 2) = -2147483648 -> raised to 0
    expect(r.hp).toBe(0); // clamp(5, 0, 0)
    const edge = applyDoubleHpMp(state({ baseMaxHp: 0x3fffffff, maxHp: 7 }), 1);
    expect(edge.maxHp).toBe(9999); // 0x7ffffffe, clamped to the cap
  });

  it('clamp order: when the upper bound is below 0 the upper bound wins (raise to 0 first, then lower to the bound)', () => {
    const r = applyDoubleHpMp(state({ buffFlags: 1, baseMaxHp: -5, maxHp: 4, hp: 3 }), 0);
    expect(r.maxHp).toBe(-5); // the base is written unclamped
    expect(r.hp).toBe(-5); // clamp(3, 0, -5): raised to 0, then lowered to -5
  });

  it('does not modify its input', () => {
    const s = state({ buffFlags: 1 });
    const copy = { ...s };
    applyDoubleHpMp(s, 0);
    expect(s).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

const fx = loadFfxParityFixture('status_pool');
describe.skipIf(fx === null)('golden vectors: Double HP / Double MP (tests/fixtures/parity/ffx/status_pool.json)', () => {
  it('every vector matches: the stored byte, both maxima, HP and MP', () => {
    let n = 0;
    for (const v of fx?.vectors ?? []) {
      const i = expandVectorInput(fx?.defaults ?? {}, v.in) as Record<string, number>;
      const input: PoolState = {
        buffFlags: i['flags'] as number,
        baseMaxHp: i['baseMaxHp'] as number,
        baseMaxMp: i['baseMaxMp'] as number,
        maxHp: i['maxHp'] as number,
        maxMp: i['maxMp'] as number,
        hp: i['hp'] as number,
        mp: i['mp'] as number,
        autoB: i['autoB'] as number,
      };
      const got = applyDoubleHpMp(input, i['newFlags'] as number);
      const why = `vector ${v.id} (${v.class})`;
      const o = v.out as Record<string, number>;
      expect(got.buffFlags, `${why} flags`).toBe(o['flags']);
      expect(got.maxHp, `${why} max HP`).toBe(o['maxHp']);
      expect(got.maxMp, `${why} max MP`).toBe(o['maxMp']);
      expect(got.hp, `${why} HP`).toBe(o['hp']);
      expect(got.mp, `${why} MP`).toBe(o['mp']);
      expect(got.baseMaxHp, `${why} base max HP is never written`).toBe(input.baseMaxHp);
      expect(got.baseMaxMp, `${why} base max MP is never written`).toBe(input.baseMaxMp);
      n += 1;
    }
    expect(n).toBeGreaterThan(300);
  });
});
