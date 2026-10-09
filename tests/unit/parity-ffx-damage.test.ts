/**
 * Parity tests for the FFX base-damage kernel (`src/battle/ffx/kernel/damage.ts`). The 32-bit integer helpers it
 * stands on, the cube term and the defence term are in `parity-ffx-int32.test.ts`.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, function 0x00789bf0.
 * Spec: `research/re-ffx-damage.md` section 2.
 *
 * Every expected number below is worked by hand from the decompile and the disassembly; the arithmetic is in
 * the comments, one line per game step. Each of these inputs was also run through the real machine code in an
 * x86-32 emulator (only the RNG function replaced) and returned the same number. The last block loads emulator
 * golden vectors from `tests/fixtures/parity/ffx/base_damage.json` when that file exists.
 *
 * Notation: `V` is the variance factor, `(draw & 31) + 240`, or 256 when variance is off. `cube(s)` is
 * `(s*s*s >> 5) + 30` rounded toward zero. `dt(x)` is the defence term, 730 at 0 down to 21 at 255.
 */

import { describe, expect, it } from 'vitest';
import {
  baseDamage,
  type BaseDamageCommand,
  type BaseDamageInput,
  type BaseDamageTarget,
  type BaseDamageUser,
} from '../../src/battle/ffx/kernel/damage.ts';
import { expandVectorInput, loadFfxParityFixture, scriptedDraw } from './helpers/ffxParityFixture.ts';

const user = (over: Partial<BaseDamageUser> = {}): BaseDamageUser => ({
  str: 20, mag: 20, cheer: 0, focus: 0, maxHp: 1000, maxMp: 100, hp: 1000, mp: 100, ...over,
});
const target = (over: Partial<BaseDamageTarget> = {}): BaseDamageTarget => ({
  id: 0x14, def: 20, mdf: 20, cheer: 0, focus: 0, maxHp: 5000, maxMp: 100, baseCtb: 30,
  runningHp: 5000, runningMp: 100, runningCtb: 20, saveCounter: 0, ...over,
});
/** A physical command that can crit and damages HP. */
const ATTACK: BaseDamageCommand = { flagsDamage: 0x05, damageClass: 1 };
/** A healing command (Cmd+0x20 bit 4). */
const HEALS: BaseDamageCommand = { flagsDamage: 0x10, damageClass: 1 };

interface Over {
  u?: Partial<BaseDamageUser>;
  t?: Partial<BaseDamageTarget>;
  cmd?: BaseDamageCommand | null;
  snapshot?: number;
  mode?: number;
  gil?: number;
  fallback?: number;
}

/** Run one formula. `draw` undefined = variance off (V = 256); otherwise the raw RNG value handed to the kernel. */
function calc(formula: number, power: number, over: Over = {}, draw?: number) {
  let draws = 0;
  const input: BaseDamageInput = {
    user: user(over.u),
    target: target(over.t),
    cmd: over.cmd === undefined ? ATTACK : over.cmd,
    formula,
    power,
    snapshot: over.snapshot ?? 0,
    mode: over.mode ?? 1,
    variance: draw !== undefined,
    gilOffered: over.gil ?? 0,
    fallback: over.fallback ?? 0,
  };
  const result = baseDamage(input, () => (draws++, draw ?? 0));
  return { ...result, draws };
}

describe('the 23 damage formulas, worked by hand (variance off, V = 256, unless a draw is given)', () => {
  it('1: STR vs DEF   STR 20, DEF 20, power 16', () => {
    // cube(20) = 280;  dt(20) = 632
    // 632 * 280 = 176,960;  / 730 = 242        (242.4)
    // * (15 - target Cheer 0) = 3,630;  / 15 = 242
    // * power 16 = 3,872;  / 16 = 242;  * V 256 = 61,952;  / 256 = 242
    expect(calc(1, 16).value).toBe(242);
  });

  it('1: Cheer on both sides   user Cheer 3 + STR 20 = 23, target Cheer 5, DEF 20', () => {
    // cube(23) = 12,167 / 32 = 380 (380.2), + 30 = 410;  632 * 410 = 259,120;  / 730 = 354 (354.9)
    // * (15 - 5) = 3,540;  / 15 = 236;  * 16 / 16 = 236;  * 256 / 256 = 236
    expect(calc(1, 16, { u: { cheer: 3 }, t: { cheer: 5 } }).value).toBe(236);
  });

  it('1: extreme defences   DEF 255 -> dt 21;  DEF 0 -> dt 730', () => {
    // dt 21: 21 * 280 = 5,880;  / 730 = 8;  *15/15 = 8;  *16/16 = 8;  8
    expect(calc(1, 16, { t: { def: 255 } }).value).toBe(8);
    // dt 730: 730 * 280 = 204,400;  / 730 = 280  (the game does not raise a natural DEF of 0 to 1)
    expect(calc(1, 16, { t: { def: 0 } }).value).toBe(280);
  });

  it('2: STR, defence ignored (and the target Cheer too)', () => {
    // cube(20) = 280;  * 16 = 4,480;  / 16 = 280;  * 256 / 256 = 280
    expect(calc(2, 16).value).toBe(280);
    expect(calc(2, 16, { t: { def: 255, cheer: 5 } }).value).toBe(280);
  });

  it('3: MAG vs MDF   MAG 40, power 12, MDF 50 (the Fire row of the worked table)', () => {
    // s = 40;  s*s = 1,600;  / 6 = 266;  + 12 = 278;  * 12 = 3,336;  / 4 = 834
    // dt(50) = 498;  498 * 834 = 415,332;  / 730 = 568 (568.9);  * (15 - 0) / 15 = 568;  * 256 / 256 = 568
    expect(calc(3, 12, { u: { mag: 40 }, t: { mdf: 50 } }).value).toBe(568);
    expect(calc(3, 12, { u: { mag: 40 }, t: { mdf: 0 } }).value).toBe(834); // dt(0) = 730: 834 * 730 / 730
  });

  it('3: the TARGET\'s Focus reduces it   (15 - 5)/15', () => {
    // 568 * (15 - 5) = 5,680;  / 15 = 378
    expect(calc(3, 12, { u: { mag: 40 }, t: { mdf: 50, focus: 5 } }).value).toBe(378);
  });

  it('4: MAG, defence ignored', () => {
    expect(calc(4, 12, { u: { mag: 40 }, t: { mdf: 50, focus: 5 } }).value).toBe(834); // no MDF, no Focus
  });

  it('5: a fraction of the running value of the mode   (Demi-style)', () => {
    // running HP 1000 * power 4 = 4,000;  / 16 = 250
    expect(calc(5, 4, { t: { runningHp: 1000 } }).value).toBe(250);
    // mode 2 reads the running MP: 200 * 4 / 16 = 50
    expect(calc(5, 4, { t: { runningMp: 200 }, mode: 2 }).value).toBe(50);
    // mode 4 reads the running CTB: 80 * 4 / 16 = 20
    expect(calc(5, 4, { t: { runningCtb: 80 }, mode: 4 }).value).toBe(20);
    // any other mode reads nothing
    expect(calc(5, 4, { mode: 0 }).value).toBe(0);
  });

  it('5: a negative running value rounds toward zero', () => {
    // -1 * 8 = -8;  -8 / 16 = -0.5 -> 0   (a floor would give -1)
    expect(calc(5, 8, { t: { runningHp: -1 } }).value).toBe(0);
    expect(calc(5, 16, { t: { runningHp: -17 } }).value).toBe(-17);
  });

  it('6: fixed   Potion (power 4) = 200, Hi-Potion (20) = 1000, Mega-Potion (40) = 2000', () => {
    expect(calc(6, 4).value).toBe(200);
    expect(calc(6, 20).value).toBe(1000);
    expect(calc(6, 40).value).toBe(2000);
  });

  it('7: healing   Cure (power 24) with MAG 20: ((20 + 0 + 24) / 2) * V * power / 256', () => {
    // (20 + 0 + 24) / 2 = 22;  * 256 = 5,632;  * 24 = 135,168;  / 256 = 528;  heal flag -> -528
    const cure = { cmd: { flagsDamage: 0x12, damageClass: 1 } };
    expect(calc(7, 24, cure).value).toBe(-528);
    // on a Zombie (snapshot bit 2) the sign is not flipped
    expect(calc(7, 24, { ...cure, snapshot: 2 }).value).toBe(528);
    // the target's Focus does NOT reduce a heal in the game code
    expect(calc(7, 24, { ...cure, t: { focus: 5 } }).value).toBe(-528);
    // draw 0 -> V = 240: 22 * 240 = 5,280;  * 24 = 126,720;  / 256 = 495
    expect(calc(7, 24, cure, 0).value).toBe(-495);
  });

  it('8: a fraction of the maximum of the mode   Phoenix Down (power 8)', () => {
    // HP: 1000 * 8 / 16 = 500;  heal flag -> -500
    expect(calc(8, 8, { t: { maxHp: 1000 }, cmd: HEALS }).value).toBe(-500);
    expect(calc(8, 8, { mode: 2 }).value).toBe(50); // max MP 100: 800 / 16
    expect(calc(8, 8, { mode: 4 }).value).toBe(15); // base CTB 30: 240 / 16
    expect(calc(8, 8, { mode: 0 }).value).toBe(0);
  });

  it('9: fixed with variance   power * 50 * V / 256', () => {
    // power 4: 200 at V = 256;  draw 0 (V 240): 240 * 4 * 50 = 48,000 / 256 = 187 (187.5)
    expect(calc(9, 4, {}, 16).value).toBe(200);
    expect(calc(9, 4, {}, 0).value).toBe(187);
    // draw 31 (V 271): 271 * 4 * 50 = 54,200 / 256 = 211 (211.7)
    expect(calc(9, 4, {}, 31).value).toBe(211);
  });

  it('0xa: the target\'s max MP * power / 16 (unsigned shift), whatever the mode', () => {
    expect(calc(0xa, 10).value).toBe(62); // 100 * 10 = 1,000;  >> 4 = 62
    expect(calc(0xa, 10, { mode: 4 }).value).toBe(62);
  });

  it('0xb, 0xc, 0xd: base CTB, running MP and running CTB of the target', () => {
    expect(calc(0xb, 8).value).toBe(15); // 30 * 8 = 240;  / 16
    expect(calc(0xc, 8, { t: { runningMp: 200 } }).value).toBe(100); // 1,600 / 16
    expect(calc(0xd, 8, { t: { runningCtb: 100 } }).value).toBe(50); // 800 / 16  (Silver Hourglass)
  });

  it('0xe: the STR cube, no defence, no Cheer, no variance', () => {
    // cube(20) = 280;  * 16 = 4,480;  / 16 = 280.  Cheer is not added.
    expect(calc(0xe, 16, { u: { cheer: 5 } }).value).toBe(280);
  });

  it('0xf: the MAG cube with variance   MAG 20 power 24;  Focus adds', () => {
    // cube(20) = 280;  * 24 = 6,720;  / 16 = 420;  * 256 / 256 = 420
    expect(calc(0xf, 24).value).toBe(420);
    // Focus 5: s = 25, cube = 518;  * 24 = 12,432;  / 16 = 777
    expect(calc(0xf, 24, { u: { focus: 5 } }).value).toBe(777);
    // no defence, and the target's Focus is not used
    expect(calc(0xf, 24, { t: { mdf: 255, focus: 5 } }).value).toBe(420);
  });

  it('0x10: the user\'s max HP * power / 10   Self-Destruct (power 30)', () => {
    expect(calc(0x10, 30).value).toBe(3000); // 1000 * 30 / 10
    expect(calc(0x10, 7, { u: { maxHp: 999 } }).value).toBe(699); // 6,993 / 10, truncated
  });

  it('0x11: celestial HP   (HP% + 10) * cube / 110 * power >> 4 * V >> 8', () => {
    // HP 500 / 1000 -> 50%;  + 10 = 60;  60 * 280 = 16,800;  / 110 = 152;  * 16 >> 4 = 152;  * 256 >> 8 = 152
    expect(calc(0x11, 16, { u: { hp: 500 } }).value).toBe(152);
  });

  it('0x12: celestial MP   MP 25 / 100 -> 25%;  + 10 = 35;  35 * 280 = 9,800;  / 110 = 89', () => {
    expect(calc(0x12, 16, { u: { mp: 25 } }).value).toBe(89);
  });

  it('0x13: celestial Auron   (130 - HP%) * cube / 60 ...', () => {
    // HP 250 / 1000 -> 25%;  130 - 25 = 105;  105 * 280 = 29,400;  / 60 = 490
    expect(calc(0x13, 16, { u: { hp: 250 } }).value).toBe(490);
  });

  it('0x14: the MAG cube, no defence, no variance', () => {
    expect(calc(0x14, 16).value).toBe(280);
  });

  it('0x15: the gil offered / 10   Spare Change', () => {
    expect(calc(0x15, 1, { gil: 1234 }).value).toBe(123);
    expect(calc(0x15, 1, { gil: -15 }).value).toBe(-1); // truncated toward zero
  });

  it('0x16: a counter of the TARGET\'s save record * power   Karma (only for target ids below 0x12)', () => {
    expect(calc(0x16, 10, { t: { id: 3, saveCounter: 7 } }).value).toBe(70);
    expect(calc(0x16, 10, { t: { id: 0x12, saveCounter: 7 } }).value).toBe(0); // the fallback
    expect(calc(0x16, 10, { t: { id: 0x12, saveCounter: 7 }, fallback: 5 }).value).toBe(5);
  });

  it('0x17: power * 9999   Sunburst (power 2) = 19,998;  99999 Needles (power 51)', () => {
    expect(calc(0x17, 2).value).toBe(19998);
    expect(calc(0x17, 51).value).toBe(509949);
  });

  it('formula 0 and anything above 0x17 return the fallback (still subject to the heal sign)', () => {
    expect(calc(0, 16).value).toBe(0);
    expect(calc(0x18, 16).value).toBe(0);
    expect(calc(0x18, 16, { fallback: 9 }).value).toBe(9);
    expect(calc(0x18, 16, { fallback: 9, cmd: HEALS }).value).toBe(-9);
  });
});

describe('the variance factor and the draw', () => {
  it('V = (draw & 31) + 240: the two ends and the middle   (formula 1, base 242)', () => {
    // draw 0   -> V 240: 242 * 240 = 58,080 / 256 = 226 (226.9)
    // draw 16  -> V 256: 242
    // draw 31  -> V 271: 242 * 271 = 65,582 / 256 = 256 (256.2)
    expect(calc(1, 16, {}, 0).value).toBe(226);
    expect(calc(1, 16, {}, 16).value).toBe(242);
    expect(calc(1, 16, {}, 31).value).toBe(256);
  });

  it('only the low five bits of the raw draw matter', () => {
    expect(calc(1, 16, {}, 32).value).toBe(226); // 32 & 31 = 0
    expect(calc(1, 16, {}, 0x7fffffff).value).toBe(256); // & 31 = 31
    expect(calc(1, 16, {}, 0x7fffffe0).value).toBe(226);
  });

  it('variance off draws nothing and uses 256', () => {
    const r = calc(1, 16);
    expect(r.draws).toBe(0);
    expect(r.value).toBe(242);
  });

  it('with variance on, exactly one draw is made, before the formula, for EVERY formula (even those that ignore V)', () => {
    for (const f of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18]) {
      expect(calc(f, 16, {}, 5).draws, `formula 0x${f.toString(16)}`).toBe(1);
    }
  });
});

describe('Armor Break, Mental Break and the heal sign', () => {
  it('Armor Break (snapshot bit 0x40) zeroes DEF for a command that damages HP', () => {
    expect(calc(1, 16, { snapshot: 0x40 }).value).toBe(280); // dt 730: 730 * 280 / 730
    expect(calc(1, 16, { snapshot: 0x40 }).defUsed).toBe(0);
    expect(calc(1, 16, { snapshot: 0x80 }).defUsed).toBe(20); // Mental Break leaves DEF alone
  });

  it('...but not for a command whose damage class has no HP bit, or when there is no command', () => {
    expect(calc(1, 16, { snapshot: 0x40, cmd: { flagsDamage: 5, damageClass: 2 } }).value).toBe(242);
    expect(calc(1, 16, { snapshot: 0x40, cmd: null }).value).toBe(242);
  });

  it('Mental Break (snapshot bit 0x80) zeroes MDF   MAG 40 power 12: 568 -> 834', () => {
    expect(calc(3, 12, { u: { mag: 40 }, t: { mdf: 50 }, snapshot: 0x80 }).value).toBe(834);
    expect(calc(3, 12, { u: { mag: 40 }, t: { mdf: 50 }, snapshot: 0x80 }).mdfUsed).toBe(0);
  });

  it('a healing command returns a negative value, except against a Zombie (snapshot bit 2)', () => {
    expect(calc(6, 4, { cmd: HEALS }).value).toBe(-200);
    expect(calc(6, 4, { cmd: HEALS, snapshot: 2 }).value).toBe(200);
  });

  it('formulas 0xe and 0x14 return before the heal sign and before writing DEF / MDF', () => {
    expect(calc(0xe, 16, { cmd: HEALS }).value).toBe(280);
    expect(calc(0xe, 16).defUsed).toBeUndefined();
    expect(calc(0x14, 16).mdfUsed).toBeUndefined();
  });
});

describe('32-bit wraparound inside the base formulas', () => {
  it('formula 1 at STR 255 with 5 Cheer, DEF 0, power 255 and the top variance wraps negative', () => {
    // cube(260) = 549,280;  dt(0) = 730;  730 * 549,280 / 730 = 549,280;  * 15 / 15 = 549,280
    // * 255 = 140,066,400;  / 16 = 8,754,150
    // * V 271 = 2,372,374,650  which is past 2^31 (2,147,483,648):  as a 32-bit number it is -1,922,592,646
    // / 256 toward zero = -7,510,127
    const r = calc(1, 255, { u: { str: 255, cheer: 5 }, t: { def: 0 } }, 31);
    expect(r.value).toBe(-7510127);
  });

  it('...but not with a smaller power or an ordinary defence', () => {
    // power 244 is the last that fits at STR 255 (the threshold in the 8,754,150 * 271 step is power 245)
    expect(calc(1, 244, { u: { str: 255 }, t: { def: 0 } }, 31).value).toBeGreaterThan(0);
    expect(calc(1, 255, { u: { str: 255, cheer: 5 }, t: { def: 20 } }, 31).value).toBeGreaterThan(0);
  });

  it('formula 5 wraps too: running HP 2^31 - 1 times power 16', () => {
    // (2^31 - 1) * 16 = 2^35 - 16;  low 32 bits = 0xFFFFFFF0 = -16;  / 16 = -1
    expect(calc(5, 16, { t: { runningHp: 2147483647 } }).value).toBe(-1);
  });

  it('the celestial formulas read a wrapped product as a big UNSIGNED number', () => {
    // 0x10: user max HP 99999 * power 255 = 25,499,745;  / 10 = 2,549,974   (no wrap, but unsigned DIV)
    expect(calc(0x10, 255, { u: { maxHp: 99999 } }).value).toBe(2549974);
    // 0xa: 2^31 - 1 max MP * 2 = 0xFFFFFFFE as unsigned = 4,294,967,294;  >>> 4 = 268,435,455
    expect(calc(0xa, 2, { t: { maxMp: 2147483647 } }).value).toBe(268435455);
  });
});

describe('golden vectors from the emulator harness (skipped until tests/fixtures/parity/ffx/base_damage.json exists)', () => {
  const fixture = loadFfxParityFixture('base_damage');
  it.skipIf(fixture === null)('every recorded vector matches', () => {
    if (fixture === null) return;
    for (const v of fixture.vectors) {
      const input = expandVectorInput(fixture.defaults, v.in) as unknown as BaseDamageInput & { draw: number };
      const script = scriptedDraw(v.rngDraws);
      const got = baseDamage(input, script.draw);
      const expected = v.out as { value: number; defUsed: number | null; mdfUsed: number | null };
      const where = `vector ${v.id} (${v.class})`;
      expect(got.value, where).toBe(expected.value);
      expect(got.defUsed ?? null, where).toBe(expected.defUsed);
      expect(got.mdfUsed ?? null, where).toBe(expected.mdfUsed);
      expect(script.calls(), where).toBe(v.rngDraws?.length ?? 0);
    }
  });
});
