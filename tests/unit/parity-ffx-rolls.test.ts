/**
 * Parity tests for the two small FFX rolls in `src/battle/ffx/kernel/rolls.ts`: single-character Escape
 * and how a battle starts (normal, preemptive, ambush).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; functions
 * 0x0078a780 (Escape roll) and 0x0078d090 (start type). Spec: `research/re-ffx-rng-hit.md` section 6.
 * Expected values are worked by hand from the decompile and the disassembly (see the comments).
 */

import { describe, expect, it } from 'vitest';
import { StartType, escapeRoll, rollStartType } from '../../src/battle/ffx/kernel/rolls.ts';

describe('FFX Escape roll (exe 0x0078a780)', () => {
  const run = (flag: number, value: number, debugNeverHit = false) => {
    let drawn = 0;
    const ok = escapeRoll(flag, () => (drawn++, value), debugNeverHit);
    return { ok, drawn };
  };

  it('draws once, takes the low byte, and succeeds below 0xbf (191 of 256)', () => {
    expect(run(0, 0xbe)).toEqual({ ok: true, drawn: 1 });
    expect(run(0, 0xbf)).toEqual({ ok: false, drawn: 1 });
    expect(run(0, 0x100 + 0xbe)).toEqual({ ok: true, drawn: 1 }); // bits above the low byte are ignored
    expect(run(0, 0x7fffffff)).toEqual({ ok: false, drawn: 1 }); // low byte 0xff
    let wins = 0;
    for (let b = 0; b < 256; b++) if (escapeRoll(0, () => b)) wins++;
    expect(wins).toBe(191);
  });

  it('escape flag 2 always succeeds; flag 1 never does; both still draw first', () => {
    expect(run(2, 0xff)).toEqual({ ok: true, drawn: 1 });
    expect(run(1, 0)).toEqual({ ok: false, drawn: 1 });
    expect(run(1, 0xff)).toEqual({ ok: false, drawn: 1 });
  });

  it('any other flag value rolls normally; the debug never-hit switch forces failure after the draw', () => {
    expect(run(3, 0x10).ok).toBe(true);
    expect(run(0, 0x10, true)).toEqual({ ok: false, drawn: 1 });
    expect(run(2, 0x10, true)).toEqual({ ok: false, drawn: 1 });
  });

  it('reads the flag as a signed byte, as the exe does (MOVSX)', () => {
    // 0x101 is the byte 1 (cannot escape); 0xff is -1, an ordinary value that rolls.
    expect(run(0x101, 0x10)).toEqual({ ok: false, drawn: 1 });
    expect(run(0xff, 0x10)).toEqual({ ok: true, drawn: 1 });
  });
});

describe('FFX battle start type (exe 0x0078d090, called with X = 0x20 from 0x00783020)', () => {
  const roll = (r: number, init: boolean) => rollStartType(0x20, init, () => r);

  it('without Initiative: r 0..31 preemptive (32/256), 223..255 ambush (33/256), the rest normal', () => {
    expect(roll(0, false)).toBe(StartType.Preemptive);
    expect(roll(31, false)).toBe(StartType.Preemptive);
    expect(roll(32, false)).toBe(StartType.Normal);
    expect(roll(222, false)).toBe(StartType.Normal);
    expect(roll(223, false)).toBe(StartType.Ambush); // 255 - 32 = 223
    expect(roll(255, false)).toBe(StartType.Ambush);
    const counts = [0, 0, 0];
    for (let r = 0; r < 256; r++) counts[roll(r, false)]! += 1;
    expect(counts).toEqual([191, 32, 33]);
  });

  it('with Initiative: r - 33 (signed) is compared, so r 0..64 is preemptive and an ambush is impossible', () => {
    // r = 0 gives -33 (< 32: preemptive); r = 64 gives 31 (preemptive); r = 65 gives 32 (normal); r = 255 gives 222 (< 223).
    expect(roll(0, true)).toBe(StartType.Preemptive);
    expect(roll(64, true)).toBe(StartType.Preemptive);
    expect(roll(65, true)).toBe(StartType.Normal);
    expect(roll(255, true)).toBe(StartType.Normal);
    const counts = [0, 0, 0];
    for (let r = 0; r < 256; r++) counts[roll(r, true)]! += 1;
    expect(counts).toEqual([191, 65, 0]);
  });

  it('uses the low byte of the draw and draws exactly once', () => {
    let drawn = 0;
    expect(rollStartType(0x20, false, () => (drawn++, 0x300 + 5))).toBe(StartType.Preemptive);
    expect(drawn).toBe(1);
  });

  it('ambush outranks preemptive when X is large enough for both tests to hold', () => {
    expect(rollStartType(200, false, () => 100)).toBe(StartType.Ambush); // 100 >= 55 and 100 < 200
  });
});
