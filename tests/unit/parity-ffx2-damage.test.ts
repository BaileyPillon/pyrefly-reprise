/**
 * Parity tests for the FFX-2 base damage kernel (`src/battle/ffx2/kernel/damage.ts`): the 25 damage formulas, the
 * variance factor, the heal sign, and the 32-bit integer helpers they stand on.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), function 0x61b910
 * (the older copy of the exe has it at 0x61b930). Spec: `research/re-ffx2-damage.md` section 1.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comment of every example (every `/` truncates toward zero, as in the game);
 * - the harness lane's independent Python port of the function (`D:\Tools\ffx-parity\harness\analysis\
 *   ffx2_damage_models.py`), run on 2026-10-08 for the same inputs, which agrees with all of them;
 * - the emulator: the kernel was run on all 11,857 vectors of `D:\Tools\ffx-parity\vectors\ffx2\base_damage.json`
 *   (the real machine code of 0x61b910 on generated inputs) with no difference, value and draw stream and draw
 *   count alike. The last block here loads `tests/fixtures/parity/ffx2/base_damage.json` when a reduced copy of
 *   that file has been placed there, and is skipped until then.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DELAY_COUNT,
  VARIANCE_PREVIEW,
  baseDamage,
  baseDamageAt,
  gilCurve,
  rollVariance,
  type BaseDamageInput,
} from '../../src/battle/ffx2/kernel/damage.ts';
import {
  clamp,
  cvttsd2si,
  div1024,
  div128,
  div16,
  div2,
  div256,
  div4,
  div64,
  mul,
  mul3div2,
  neg,
  s8,
  scale,
  sdiv,
  u8,
} from '../../src/battle/ffx2/kernel/int32.ts';

/** A Bahamut-like attacker (Lv 20, STR 71, MAG 86) against a monster with DEF 160, MDEF 10; party attacker id 0. */
function input(over: Partial<Omit<BaseDamageInput, 'user' | 'target' | 'records'>> & {
  user?: Partial<BaseDamageInput['user']>;
  target?: Partial<BaseDamageInput['target']>;
  records?: Partial<BaseDamageInput['records']>;
} = {}): BaseDamageInput {
  const { user, target, records, ...rest } = over;
  return {
    attackerId: 0,
    targetId: 15,
    cmd: { misc: 0, damage: 1 },
    formula: 0,
    power: 16,
    amount: 0,
    preview: false,
    user: { hp: 1500, maxHp: 2000, mp: 60, maxMp: 200, str: 71, strStage: 0, mag: 86, magStage: 0, level: 20, ...user },
    target: { hp: 5000, maxHp: 30000, def: 160, defStage: 0, mdef: 10, mdefStage: 0, ...target },
    records: { attackerF40: 0, attackerF44: 0, targetF44: 0, ...records },
    ...rest,
  };
}

/** The base damage with the variance chosen directly (240..271, or 256 for "x1.0"). */
function at(variance: number, over: Parameters<typeof input>[0] = {}): number {
  return baseDamageAt(input(over), variance);
}

describe('32-bit helpers: the compiler idioms are exact truncating division', () => {
  // The game divides by 255, 12 and 20 with a multiply by a magic constant, a shift and a sign fix. Reproduce
  // each sequence with BigInt (a real 64-bit product) and check it equals sdiv (trunc(x / d)) for edge values
  // and a pseudo-random sample of 32-bit numbers.
  const asInt = (x: bigint): number => Number(BigInt.asIntN(32, x));
  const hi32 = (x: number, magic: bigint): number => asInt((BigInt(x) * magic) >> 32n); // IMUL r/m32: EDX
  const addSign = (q: number): number => (q + (q >>> 31)) | 0; // MOV ECX,EDX; SHR ECX,31; ADD ECX,EDX

  /** /255: MOV EAX,0x80808081; IMUL ESI; ADD EDX,ESI; SAR EDX,7; then the sign fix. */
  const magic255 = (x: number): number => addSign(((hi32(x, BigInt.asIntN(32, 0x80808081n)) + x) | 0) >> 7);
  /** /12: MOV EAX,0x2AAAAAAB; IMUL ECX; SAR EDX,1; then the sign fix. */
  const magic12 = (x: number): number => addSign(hi32(x, 0x2aaaaaabn) >> 1);
  /** /20: MOV EAX,0x66666667; IMUL ECX; SAR EDX,3; then the sign fix. */
  const magic20 = (x: number): number => addSign(hi32(x, 0x66666667n) >> 3);

  const edges = [0, 1, -1, 2, -2, 11, 12, 13, -11, -12, -13, 19, 20, 21, -19, -20, -21, 254, 255, 256, -254, -255, -256,
    1023, 1024, 1025, 65535, 65536, 2147483647, -2147483648, 2147483646, -2147483647, 0x40000000, -0x40000000];
  let seed = 12345;
  const sample: number[] = [...edges];
  for (let i = 0; i < 20000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0; // a fixed LCG: the sample is the same on every run
    sample.push(seed);
  }

  it('x / 255 (IMUL 0x80808081, SAR 7) equals sdiv(x, 255) for 20,000+ values', () => {
    for (const x of sample) expect(magic255(x), `x=${x}`).toBe(sdiv(x, 255));
  });

  it('x / 12 (IMUL 0x2AAAAAAB, SAR 1) equals sdiv(x, 12)', () => {
    for (const x of sample) expect(magic12(x), `x=${x}`).toBe(sdiv(x, 12));
  });

  it('x / 20 (IMUL 0x66666667, SAR 3) equals sdiv(x, 20)', () => {
    for (const x of sample) expect(magic20(x), `x=${x}`).toBe(sdiv(x, 20));
  });

  it('the shift forms round toward zero, unlike >>', () => {
    const pairs: Array<[(v: number) => number, number]> = [[div2, 2], [div4, 4], [div16, 16], [div64, 64], [div128, 128], [div256, 256], [div1024, 1024]];
    for (const [fn, d] of pairs) {
      for (const x of sample) expect(fn(x), `/${d} x=${x}`).toBe(sdiv(x, d));
    }
    // -7 / 2: the plain shift gives -4, the game gives -3 (CDQ; SUB EAX,EDX; SAR EAX,1).
    expect(-7 >> 1).toBe(-4);
    expect(div2(-7)).toBe(-3);
    expect(div16(-17)).toBe(-1);
    expect(div256(-255)).toBe(0);
  });

  it('products wrap at 32 bits like IMUL; division by zero and INT_MIN / -1 are errors (the CPU faults)', () => {
    expect(mul(65536, 65536)).toBe(0);
    expect(mul(46341, 46341)).toBe(-2147479015); // 2,147,488,281 - 2^32
    expect(mul3div2(1000000000)).toBe(-647483648); // 3e9 wraps to -1,294,967,296, then halves toward zero
    expect(() => sdiv(1, 0)).toThrow(RangeError);
    expect(() => sdiv(-2147483648, -1)).toThrow(RangeError);
    expect(scale(1000, 15, 12)).toBe(1250); // 15,000 / 12
    expect(neg(-2147483648)).toBe(-2147483648);
  });

  it('byte reads: MOVZX for stats, MOVSX for stages; clamp is the game helper (low bound first)', () => {
    expect(u8(300)).toBe(44);
    expect(u8(-1)).toBe(255);
    expect(s8(200)).toBe(-56);
    expect(s8(127)).toBe(127);
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, 0, 3)).toBe(0);
    expect(clamp(5, 3, 0)).toBe(0); // hi < lo: the high bound is applied last
    expect(cvttsd2si(2.9)).toBe(2);
    expect(cvttsd2si(-2.9)).toBe(-2);
    expect(cvttsd2si(3e9)).toBe(-2147483648);
    expect(cvttsd2si(Number.NaN)).toBe(-2147483648);
  });
});

describe('the variance factor (one draw before the formula switch)', () => {
  it('is (draw & 0x1f) + 0xf0: 240 at the low end, 271 at the high end, bits above 5 ignored', () => {
    const v = (value: number): number => rollVariance(0, () => value);
    expect(v(0)).toBe(240); // 0 + 0xf0
    expect(v(16)).toBe(256); // 16 + 240: exactly x1.0
    expect(v(31)).toBe(271); // 31 + 240
    expect(v(32)).toBe(240); // bit 5 and above are dropped
    expect(v(0x7fffffff)).toBe(271);
    expect(v(0x12345)).toBe(245); // 0x45 & 0x1f = 5
  });

  it('draws from the attacker mode-0 stream: id + 0x14 for party slots, id + 0xd for monster slots 15 to 30', () => {
    const stream = (id: number): number => {
      let seen = -1;
      rollVariance(id, (s) => {
        seen = s;
        return 0;
      });
      return seen;
    };
    expect(stream(0)).toBe(20);
    expect(stream(2)).toBe(22);
    expect(stream(14)).toBe(34);
    expect(stream(15)).toBe(28);
    expect(stream(23)).toBe(36);
    expect(stream(30)).toBe(43);
    expect(stream(31)).toBe(51); // above the monster slots: back to id + 0x14
  });

  it('exactly one draw per real call, even for formulas that never use it; none for a preview', () => {
    for (let formula = 0; formula <= 0x1a; formula++) {
      let draws = 0;
      const power = formula === 0xc ? 1 : 3;
      const user = input({ formula, power, amount: 5 });
      baseDamage(user, () => (draws++, 16));
      expect(draws, `formula 0x${formula.toString(16)}`).toBe(1);
      draws = 0;
      baseDamage({ ...user, preview: true }, () => (draws++, 16));
      expect(draws, `preview formula 0x${formula.toString(16)}`).toBe(0);
    }
  });

  it('a preview uses 0x100 (x1.0): the same number as a real draw of 16', () => {
    expect(VARIANCE_PREVIEW).toBe(256);
    const real = baseDamage(input({ power: 20 }), () => 16);
    const preview = baseDamage(input({ power: 20, preview: true }), () => {
      throw new Error('a preview must not draw');
    });
    expect(real).toBe(105);
    expect(preview).toBe(105);
  });

  it('the variance reaches the result only in formulas 0 to 3, 6, 8, 9, 0x10 and 0x14 to 0x17', () => {
    const uses = [0, 1, 2, 3, 6, 8, 9, 0x10, 0x14, 0x15, 0x16, 0x17];
    for (let f = 0; f <= 0x18; f++) {
      const lo = at(240, { formula: f, power: 100, amount: 7 });
      const hi = at(271, { formula: f, power: 100, amount: 7 });
      expect(lo !== hi, `formula 0x${f.toString(16)}`).toBe(uses.includes(f));
    }
  });
});

describe('formula 0, physical: STR and level against DEF, with stage factors', () => {
  it('Lv 20, STR 71, DEF 160, power 16, x1.0 -> 84', () => {
    // t = (71+20)*71*20 = 129,220; t/1024 = 126 (126.19); + STR 71 = 197
    // 197*(270-160)/255 = 21,670/255 = 84 (84.98); *(0+12)/12 = 84; *(12-0)/12 = 84
    // 84*16/16 = 84; 84*256/256 = 84
    expect(at(256)).toBe(84);
  });

  it('stages and power: DEF 100, STR stage +3, DEF stage -2, power 20 -> 237 at x1.0, 222 at 240, 250 at 271', () => {
    // 197 as above; 197*(270-100)/255 = 33,490/255 = 131 (131.33)
    // 131*(3+12)/12 = 1,965/12 = 163 (163.75)         [the engine would keep 163.75]
    // 163*(12+2)/12 = 2,282/12 = 190 (190.17)
    // 190*20/16 = 3,800/16 = 237 (237.5)
    const over = { formula: 0, power: 20, user: { strStage: 3 }, target: { def: 100, defStage: -2 } } as const;
    expect(at(256, over)).toBe(237); // 237*256/256
    expect(at(240, over)).toBe(222); // 237*240 = 56,880; /256 = 222.19
    expect(at(271, over)).toBe(250); // 237*271 = 64,227; /256 = 250.89
  });

  it('Lv 99, STR 255, DEF 0, power 255 at x271 -> 160,445', () => {
    // t = (255+99)*255*99 = 8,936,730; /1024 = 8,727; + 255 = 8,982
    // 8,982*270/255 = 2,425,140/255 = 9,510; *12/12 and *12/12 keep 9,510
    // 9,510*255 = 2,425,050; /16 = 151,565 (151,565.6); *271 = 41,074,115; /256 = 160,445 (160,445.8)
    expect(at(271, { power: 255, user: { str: 255, level: 99 }, target: { def: 0 } })).toBe(160445);
  });

  it('a zero stat or a defence of 270 gives 0; a defence above 270 goes negative and rounds toward zero', () => {
    expect(at(256, { user: { str: 0 } })).toBe(0); // t = 0, cubic = 0, + STR 0
    expect(at(256, { target: { def: 270 } })).toBe(0); // (270-270) = 0
    // DEF 300: 197*(270-300) = -5,910; /255 = -23 (-23.18, toward zero); the rest keeps -23
    expect(at(256, { target: { def: 300 } })).toBe(-23);
  });

  it('the products wrap at 32 bits (a level of 100,000 is outside the game; it pins the wrap)', () => {
    // (255+100000)*255 = 25,563,... * 100000 overflows 2^31: the game's own IMUL result is what is returned
    expect(at(256, { power: 255, user: { str: 255, level: 100000 }, target: { def: 0 } })).toBe(-343550);
  });
});

describe('formulas 1 to 3: no-defence physical, and the magic pair', () => {
  it('formula 1: the DEF term is the constant 270 but the DEF stage still applies', () => {
    // 197*270/255 = 53,190/255 = 208 (208.58); with stages STR +3, DEF -2: 208*15/12 = 260; 260*14/12 = 3,640/12 = 303
    expect(at(256, { formula: 1 })).toBe(208);
    expect(at(256, { formula: 1, user: { strStage: 3 }, target: { defStage: -2 } })).toBe(303);
    expect(at(256, { formula: 1, target: { def: 255 } })).toBe(208); // DEF itself is ignored
  });

  it('formula 2, magic with MDEF: Mega-Flare style power 24, MAG 86, Lv 20, MDEF 10 -> 1156', () => {
    // q = (86+2*20)*24*24 = 126*576 = 72,576; /64 = 1,134
    // 1,134*(270-10)/255 = 294,840/255 = 1,156 (1,156.2); stage factors 12/12 keep it; *256/256
    expect(at(256, { formula: 2, power: 24 })).toBe(1156);
    expect(at(240, { formula: 2, power: 24 })).toBe(1083); // 1,156*240/256 = 1,083.75
    expect(at(271, { formula: 2, power: 24 })).toBe(1223); // 1,156*271/256 = 1,223.7
  });

  it('formula 2 with stages: MAG +2, MDEF 120, MDEF -3, x271 -> 1028', () => {
    // 1,134*(270-120)/255 = 170,100/255 = 667 (667.06); *(2+12)/12 = 9,338/12 = 778 (778.17)
    // 778*(12+3)/12 = 11,670/12 = 972 (972.5); 972*271 = 263,412; /256 = 1,028
    expect(at(271, { formula: 2, power: 24, user: { magStage: 2 }, target: { mdef: 120, mdefStage: -3 } })).toBe(1028);
  });

  it('formula 3: the same with the constant 270 for MDEF, MDEF stage still applied -> 1852', () => {
    // 1,134*270/255 = 306,180/255 = 1,200 (1,200.7); *14/12 = 16,800/12 = 1,400; *15/12 = 21,000/12 = 1,750
    // 1,750*271 = 474,250; /256 = 1,852 (1,852.5)
    expect(at(271, { formula: 3, power: 24, user: { magStage: 2 }, target: { mdef: 120, mdefStage: -3 } })).toBe(1852);
    expect(at(271, { formula: 3, power: 24, user: { magStage: 2 }, target: { mdef: 0, mdefStage: -3 } })).toBe(1852);
  });
});

describe('formulas 4 to 8: percentages, fixed damage, recovery magic', () => {
  it('formula 4 is target current HP * power / 16, formula 7 is target max HP * power / 16 (no variance, truncating)', () => {
    expect(at(256, { formula: 4, power: 16 })).toBe(5000); // 5,000*16/16
    expect(at(256, { formula: 4, power: 6 })).toBe(1875); // 30,000/16
    expect(at(240, { formula: 4, power: 6 })).toBe(1875); // same at any variance
    expect(at(256, { formula: 7, power: 6 })).toBe(11250); // 30,000*6 = 180,000; /16
    expect(at(256, { formula: 7, power: 1, target: { maxHp: 31 } })).toBe(1); // 31/16 = 1.94 -> 1
  });

  it('formula 5 is power * 50 with no variance', () => {
    expect(at(240, { formula: 5, power: 3 })).toBe(150);
    expect(at(271, { formula: 5, power: 3 })).toBe(150);
  });

  it('formula 6, recovery magic: (MAG+2L)*P*P/128, MAG stage, no defence, variance', () => {
    // q = 126*16*16 = 32,256; /128 = 252; *(3+12)/12 = 3,780/12 = 315; *256/256 = 315
    expect(at(256, { formula: 6, user: { magStage: 3 } })).toBe(315);
    expect(at(271, { formula: 6, user: { magStage: 3 } })).toBe(333); // 315*271 = 85,365; /256 = 333.46
    expect(at(256, { formula: 6, target: { mdef: 255, mdefStage: 10 } })).toBe(252); // the target does not matter
  });

  it('formula 8 is variance * power * 50 / 256', () => {
    // 256*2 = 512; *50 = 25,600; /256 = 100.  271*2 = 542; *50 = 27,100; /256 = 105 (105.86)
    expect(at(256, { formula: 8, power: 2 })).toBe(100);
    expect(at(271, { formula: 8, power: 2 })).toBe(105);
  });
});

describe('formulas 9 to 0x13', () => {
  it('formula 9, special magic: the physical shape on MAG, MDEF and the MAG and MDEF stages -> 403', () => {
    // t = (86+20)*86*20 = 182,320; /1024 = 178 (178.04); + MAG 86 = 264
    // 264*(270-10)/255 = 68,640/255 = 269 (269.18); stages 12/12; 269*24 = 6,456; /16 = 403 (403.5); *256/256
    expect(at(256, { formula: 9, power: 24 })).toBe(403);
  });

  it('formula 0xa leaves the target at 1 HP: tHP - 1, and 0 when it has 1 or less', () => {
    expect(at(256, { formula: 0xa })).toBe(4999);
    expect(at(256, { formula: 0xa, target: { hp: 1 } })).toBe(0);
    expect(at(256, { formula: 0xa, target: { hp: 0 } })).toBe(0);
    expect(at(256, { formula: 0xa, target: { hp: -5 } })).toBe(0);
  });

  it('formula 0xb is attacker max HP * power / 16', () => {
    expect(at(256, { formula: 0xb, power: 32 })).toBe(4000); // 2,000*32 = 64,000; /16
  });

  it('formula 0xc is the amount curve 22*A*r / (A + 20*r), A = float32(amount), r = float32(sqrt(A)), truncated', () => {
    // amount 100: r = 10; 22*100*10 = 22,000; 100 + 200 = 300; 73.33 -> 73
    // amount 1000: r = 31.622776 (float32 31.62277603...); 22*1000*r = 695,700.07; 1000 + 632.4555 = 1,632.4555; 426.18 -> 426
    expect(at(256, { formula: 0xc, amount: 100 })).toBe(73);
    expect(at(256, { formula: 0xc, amount: 1000 })).toBe(426);
    expect(at(256, { formula: 0xc, amount: 1 })).toBe(1); // 22/21 = 1.047
    expect(at(256, { formula: 0xc, amount: 99999 })).toBe(6543);
    expect(at(256, { formula: 0xc, amount: 2147483647 })).toBe(1019061); // float32(2^31-1) = 2^31
    expect(at(256, { formula: 0xc, amount: 0 })).toBe(0);
    expect(at(256, { formula: 0xc, amount: -5 })).toBe(0);
    expect(gilCurve(100)).toBe(73);
  });

  it('formula 0xd is the target record field +0x44 times power, only for target ids below 0x17', () => {
    expect(at(256, { formula: 0xd, power: 3, targetId: 5, records: { targetF44: 40 } })).toBe(120);
    expect(at(256, { formula: 0xd, power: 3, targetId: 0x17, records: { targetF44: 40 } })).toBe(0);
    expect(at(256, { formula: 0xd, power: 3, targetId: 0x20, records: { targetF44: 40 } })).toBe(0);
  });

  it('formulas 0xe and 0xf: power * 9999 and the power itself', () => {
    expect(at(256, { formula: 0xe, power: 2 })).toBe(19998);
    expect(at(256, { formula: 0xe, power: 255 })).toBe(2549745);
    expect(at(256, { formula: 0xf, power: 7 })).toBe(7);
  });

  it('formula 0x10 is variance * power / 256', () => {
    expect(at(271, { formula: 0x10, power: 100 })).toBe(105); // 27,100/256 = 105.86
    expect(at(256, { formula: 0x10, power: 100 })).toBe(100);
  });

  it('formulas 0x11 to 0x13 read the attacker: missing HP, power * level, current HP', () => {
    expect(at(256, { formula: 0x11 })).toBe(500); // (2,000-1,500)*16 = 8,000; /16
    expect(at(256, { formula: 0x11, user: { hp: 2500 } })).toBe(-500); // (2,000-2,500)*16 = -8,000; -500
    expect(at(256, { formula: 0x12 })).toBe(320); // 16*20
    expect(at(256, { formula: 0x13, power: 5 })).toBe(468); // 5*1,500 = 7,500; /16 = 468.75
  });
});

describe('formulas 0x14 to 0x18 and above', () => {
  it('formula 0x14 lets the target DEF work for the attacker: (DEF+15) and (DEF stage + 12)', () => {
    // 197*(160+15)/255 = 34,475/255 = 135 (135.2); stages 0 -> 135
    expect(at(256, { formula: 0x14 })).toBe(135);
    // STR +2: 135*14/12 = 1,890/12 = 157 (157.5); DEF +3: 157*(3+12)/12 = 2,355/12 = 196 (196.25)
    expect(at(256, { formula: 0x14, user: { strStage: 2 }, target: { defStage: 3 } })).toBe(196);
  });

  it('formula 0x15 is formula 0 scaled by the attacker MP deficit: ((maxMP - MP) * r << 2) / maxMP', () => {
    // r = 84; (200-60)*84 = 11,760; << 2 = 47,040; / 200 = 235 (235.2)
    expect(at(256, { formula: 0x15 })).toBe(235);
    expect(at(256, { formula: 0x15, user: { mp: 200 } })).toBe(0); // full MP: no deficit
    expect(() => at(256, { formula: 0x15, user: { maxMp: 0 } })).toThrow(RangeError); // the CPU faults on /0
  });

  it('formula 0x16 adds the attacker record field +0x44, only for attacker ids below 0x17', () => {
    expect(at(256, { formula: 0x16, records: { attackerF44: 1234 } })).toBe(1318); // 84 + 1,234
    expect(at(256, { formula: 0x16, attackerId: 0x17, records: { attackerF44: 1234 } })).toBe(84);
  });

  it('formula 0x17 adds 99999 when the attacker record field +0x40 is 0, for attacker ids below 0x17', () => {
    expect(at(256, { formula: 0x17 })).toBe(100083); // 84 + 99,999
    expect(at(256, { formula: 0x17, records: { attackerF40: 1 } })).toBe(84);
    expect(at(256, { formula: 0x17, attackerId: 0x17 })).toBe(84);
  });

  it('formula 0x18 is the delay table: 4000 for flags_misc 0x1000, plus 8000 for 0x2000', () => {
    expect(DELAY_COUNT).toEqual([4000, 8000]);
    const f = (misc: number): number => at(256, { formula: 0x18, cmd: { misc, damage: 1 } });
    expect(f(0)).toBe(0);
    expect(f(0x1000)).toBe(4000);
    expect(f(0x2000)).toBe(8000);
    expect(f(0x3000)).toBe(12000);
    expect(at(256, { formula: 0x18, cmd: { misc: 0x3000, damage: 1 }, delay: [10, 20] })).toBe(30);
    expect(() => at(256, { formula: 0x18, cmd: null })).toThrow(RangeError); // the game dereferences the row here
  });

  it('formulas above 0x18 compute nothing', () => {
    for (const f of [0x19, 0x1a, 0x7f, 0xff, 0x100, -1]) expect(at(256, { formula: f }), `formula ${f}`).toBe(0);
  });
});

describe('the heal sign and the command row', () => {
  it('flags_damage bit 0x10 negates the result: Cure-style and fixed items', () => {
    expect(at(256, { cmd: { misc: 0, damage: 0x11 } })).toBe(-84);
    expect(at(256, { formula: 5, power: 3, cmd: { misc: 0, damage: 0x11 } })).toBe(-150);
    expect(at(256, { formula: 4, power: 6, cmd: { misc: 0, damage: 0x10 } })).toBe(-1875);
  });

  it('with no command row the result is not negated (and formula 0x18 would fault)', () => {
    expect(at(256, { cmd: null })).toBe(84);
  });

  it('the negation applies after the formula 0x15 to 0x17 additions', () => {
    expect(at(256, { formula: 0x17, cmd: { misc: 0, damage: 0x10 } })).toBe(-100083);
  });
});

// ---- golden vectors from the emulator --------------------------------------------------------------------------
interface Vector {
  id: number;
  class: string;
  in: Record<string, unknown>;
  rngDraws: Array<{ stream: number; value: number }>;
  out: { ret: number };
}
interface VectorFile {
  defaults: Record<string, unknown>;
  vectors: Vector[];
}

function loadFixture(name: string): VectorFile | null {
  const path = fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}.json`, import.meta.url));
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as VectorFile) : null;
}

/** A vector's input: its sparse `in` laid over the file's `defaults` (objects merge, everything else replaces). */
function expand(defaults: Record<string, unknown>, sparse: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(sparse)) {
    const base = out[k];
    const plain = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
    out[k] = plain(base) && plain(v) ? expand(base, v) : v;
  }
  return out;
}

const baseDamageFixture = loadFixture('base_damage');

describe.skipIf(baseDamageFixture === null)('golden vectors: tests/fixtures/parity/ffx2/base_damage.json (0x61b910)', () => {
  it('every vector: the same value, the same draw count and the same RNG stream', () => {
    const file = baseDamageFixture as VectorFile;
    let mismatches = 0;
    for (const v of file.vectors) {
      const e = expand(file.defaults, v.in) as Record<string, number | Record<string, number | boolean>>;
      const num = (k: string): number => e[k] as number;
      const cmd = e['cmd'] as { present: boolean; misc: number; damage: number };
      const rec = e['records'] as { attackerF40: number; attackerF44: number; targetF44: number };
      const glob = e['globals'] as { delay0: number; delay1: number };
      const call: BaseDamageInput = {
        attackerId: num('attackerId'),
        targetId: num('targetId'),
        cmd: cmd.present === false ? null : { misc: cmd.misc >>> 0, damage: cmd.damage >>> 0 },
        formula: num('formula'),
        power: num('power'),
        amount: num('amount'),
        preview: num('preview') !== 0,
        user: {
          hp: num('aHP'), maxHp: num('aMaxHP'), mp: num('aMP'), maxMp: num('aMaxMP'), str: num('aSTR'), strStage: num('aSTRstage'),
          mag: num('aMAG'), magStage: num('aMAGstage'), level: num('aLevel'),
        },
        target: {
          hp: num('tHP'), maxHp: num('tMaxHP'), def: num('tDEF'), defStage: num('tDEFstage'), mdef: num('tMDEF'), mdefStage: num('tMDEFstage'),
        },
        records: rec,
        delay: [glob.delay0, glob.delay1],
      };
      const seen: Array<{ stream: number; value: number }> = [];
      const script = v.rngDraws.slice();
      const got = baseDamage(call, (stream) => {
        const next = script.shift();
        if (next === undefined) throw new Error(`vector ${v.id}: the kernel drew more than the game did`);
        seen.push({ stream, value: next.value });
        return next.value;
      });
      const sameStreams = seen.length === v.rngDraws.length && seen.every((d, i) => d.stream === v.rngDraws[i]?.stream);
      if (got !== v.out.ret || !sameStreams) mismatches += 1;
    }
    expect(mismatches).toBe(0);
  });
});
