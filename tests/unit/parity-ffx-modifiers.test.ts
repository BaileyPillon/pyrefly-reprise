/**
 * Parity tests for the steps of the FFX HP damage chain (`src/battle/ffx/kernel/modifiers.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: Shield/Boost 0x78c530,
 * Shell 0x78adc0, Protect 0x78ad40, the damage half of the critical check 0x789690, Berserk 0x78c0b0, Magic Booster
 * 0x78c580, Alchemy 0x78c5f0, party percent 0x7891e0, ratio immunity 0x78ad80, absorb flip 0x78a200, Armored
 * 0x78a830, Defend/Sentinel 0x78a7d0, user Break 0x789290, damage immunity 0x78aac0, scale override 0x78bd90.
 * Spec: `research/re-ffx-damage.md` section 4.
 *
 * Every expected number is worked by hand from the decompile and the disassembly (arithmetic in the comments).
 * The last block loads emulator golden vectors from `tests/fixtures/parity/ffx/small_mods.json` when it exists.
 * Order effects (which step runs before which) are in `parity-ffx-hitdamage.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import {
  absorbInvert,
  alchemyMod,
  armoredMod,
  berserkMod,
  critMod,
  damageImmunity,
  damageScaleOverride,
  defendSentinelMod,
  magicBoosterMod,
  newHitFlags,
  partyPercentMod,
  protectMod,
  ratioImmunity,
  shellMod,
  shieldBoostMod,
  userBreakMod,
} from '../../src/battle/ffx/kernel/modifiers.ts';
import { delayAttackCtb } from '../../src/battle/ffx/kernel/aftermath.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

const PHYS = 1;
const MAGIC = 2;
const NONE: { physDealt: number; magDealt: number; physTaken: number; magTaken: number } = {
  physDealt: 0, magDealt: 0, physTaken: 0, magTaken: 0,
};

describe('Shield and Boost stances (0x78c530)', () => {
  it('Shield divides by 4 toward zero, sets flag 0x8000 and the guard mark', () => {
    const f = newHitFlags(1);
    expect(shieldBoostMod(0x40, 242, f)).toBe(60); // 242 / 4 = 60.5
    expect(f.resultMask).toBe(0x8001);
    expect(f.guardMark).toBe(1);
  });

  it('Boost multiplies by 3/2 and sets no flag', () => {
    const f = newHitFlags(1);
    expect(shieldBoostMod(0x80, 242, f)).toBe(363); // 726 / 2
    expect(f.resultMask).toBe(1);
    expect(f.guardMark).toBe(0);
  });

  it('with both stances Shield goes FIRST   7 -> 7/4 = 1 -> 1*3/2 = 1   (Boost first would give 2)', () => {
    expect(shieldBoostMod(0xc0, 7, newHitFlags(1))).toBe(1);
    // Boost first: 7 * 3 / 2 = 10;  10 / 4 = 2
    expect(Math.trunc(Math.trunc((7 * 3) / 2) / 4)).toBe(2);
  });

  it('a negative (healing) value rounds toward zero   -242 -> -60, not -61', () => {
    expect(shieldBoostMod(0x40, -242, newHitFlags(1))).toBe(-60);
  });

  it('no stance: unchanged, no flags', () => {
    const f = newHitFlags(1);
    expect(shieldBoostMod(0x800, 242, f)).toBe(242);
    expect(f.resultMask).toBe(1);
  });
});

describe('Shell and Protect (0x78adc0, 0x78ad40)', () => {
  it('Shell halves a MAGICAL command and marks the hit reduced (2) with flag 0x20', () => {
    const f = newHitFlags(1);
    expect(shellMod(MAGIC, 3, 243, f)).toBe(121); // 243 / 2 = 121.5
    expect(f.reduced).toBe(2);
    expect(f.resultMask).toBe(0x21);
  });

  it('Protect halves a PHYSICAL command with flag 0x40; each ignores the other\'s damage type', () => {
    const f = newHitFlags(1);
    expect(protectMod(PHYS, 255, 243, f)).toBe(121);
    expect(f.resultMask).toBe(0x41);
    expect(protectMod(MAGIC, 255, 243, newHitFlags(1))).toBe(243);
    expect(shellMod(PHYS, 255, 243, newHitFlags(1))).toBe(243);
  });

  it('a zero counter does nothing, and a command that is neither physical nor magical is untouched', () => {
    expect(shellMod(MAGIC, 0, 243, newHitFlags(1))).toBe(243);
    expect(shellMod(0, 3, 243, newHitFlags(1))).toBe(243);
    expect(shellMod(3, 3, 243, newHitFlags(1))).toBe(243); // type bits 3 is neither 1 nor 2
  });

  it('halving is toward zero for a heal   -243 -> -121', () => {
    expect(shellMod(MAGIC, 1, -243, newHitFlags(1))).toBe(-121);
  });
});

describe('critical hit damage half (0x789690)', () => {
  it('doubles the damage and sets flag 0x100', () => {
    const f = newHitFlags(1);
    expect(critMod(242, true, f)).toBe(484);
    expect(f.resultMask).toBe(0x101);
    expect(critMod(242, false, newHitFlags(1))).toBe(242);
  });

  it('the doubling wraps at 32 bits   1,500,000,000 * 2 = 3,000,000,000 - 2^32 = -1,294,967,296', () => {
    expect(critMod(1500000000, true, newHitFlags(1))).toBe(-1294967296);
  });
});

describe('Berserk (0x78c0b0)', () => {
  it('a Berserk user\'s own default attack is multiplied by 3/2', () => {
    expect(berserkMod(0x200, 0x3000, 0x3000, 242)).toBe(363);
  });

  it('any other command is not', () => {
    expect(berserkMod(0x200, 0x3001, 0x3000, 242)).toBe(242);
  });

  it('without the Berserk bit nothing happens, and only 16 bits of the ids are compared', () => {
    expect(berserkMod(0x000, 0x3000, 0x3000, 242)).toBe(242);
    expect(berserkMod(0x200, 0x13000, 0x3000, 242)).toBe(363);
  });
});

describe('Magic Booster and Auto-Life (0x78c580)', () => {
  it('Magic Booster multiplies by 3/2 for command types 1 and 2 only', () => {
    expect(magicBoosterMod(0x3010, 1, 0x40, 0, 834).damage).toBe(1251); // 2,502 / 2
    expect(magicBoosterMod(0x3010, 2, 0x40, 0, 834).damage).toBe(1251);
    expect(magicBoosterMod(0x3010, 5, 0x40, 0, 834).damage).toBe(834);
    expect(magicBoosterMod(0x3010, 1, 0x00, 0, 834).damage).toBe(834);
  });

  it('command 0x311f consumes the user\'s flag and multiplies once; with no flag it does nothing', () => {
    expect(magicBoosterMod(0x311f, 0, 0, 1, 834)).toEqual({ damage: 1251, bonusFlag: 0 });
    expect(magicBoosterMod(0x311f, 0, 0, 0, 834)).toEqual({ damage: 834, bonusFlag: 0 });
  });

  it('0x311f ignores Magic Booster itself (the flag is the only trigger)', () => {
    expect(magicBoosterMod(0x311f, 1, 0x40, 0, 834).damage).toBe(834);
    expect(magicBoosterMod(0x311f, 1, 0x40, 1, 834).damage).toBe(1251);
  });
});

describe('Alchemy (0x78c5f0)', () => {
  const heals = 0x10;
  it('doubles a healing item whose formula is 6 or 8', () => {
    expect(alchemyMod(0x200, 0x2000, heals, 6, -200)).toBe(-400);
    expect(alchemyMod(0x200, 0x2006, heals, 8, -500)).toBe(-1000);
  });

  it('...but not other formulas, non-healing items, non-items, or users without Alchemy', () => {
    expect(alchemyMod(0x200, 0x2000, heals, 7, -200)).toBe(-200);
    expect(alchemyMod(0x200, 0x2000, 0, 6, 200)).toBe(200);
    expect(alchemyMod(0x200, 0x3000, heals, 6, -200)).toBe(-200); // 0x3000 is a command, not an item
    expect(alchemyMod(0x000, 0x2000, heals, 6, -200)).toBe(-200);
    expect(alchemyMod(0x200, 0x2fff, heals, 6, -200)).toBe(-400); // the whole 0x2000..0x2fff block counts
  });
});

describe('party percent modifiers (0x7891e0)', () => {
  it('dealt +20% then taken -10% on 242: 242 + 48 = 290;  290 - 29 = 261', () => {
    // 20 * 242 = 4,840;  / 100 = 48 (48.4);  242 + 48 = 290
    // 10 * 290 = 2,900;  / 100 = 29;  290 - 29 = 261
    expect(partyPercentMod(PHYS, { ...NONE, physDealt: 20, physTaken: 10 }, 242)).toBe(261);
  });

  it('each product is cut toward zero before it is added   7 at +20%: 7 + 1 = 8;  8 at -10%: 8 - 0 = 8', () => {
    expect(partyPercentMod(PHYS, { ...NONE, physDealt: 20, physTaken: 10 }, 7)).toBe(8);
  });

  it('the magical pair is used for a magical command, the physical pair for a physical one', () => {
    const p = { physDealt: 20, magDealt: 50, physTaken: 10, magTaken: 50 };
    expect(partyPercentMod(PHYS, p, 242)).toBe(261);
    expect(partyPercentMod(MAGIC, p, 242)).toBe(182); // +50%: 242 + 121 = 363;  -50%: 363 - 181 = 182
  });

  it('a heal (negative) is raised by the same rule   -242 at +20% = -242 - 48 = -290', () => {
    expect(partyPercentMod(PHYS, { ...NONE, physDealt: 20 }, -242)).toBe(-290);
    // taken -10% on -290: -290 / -100 ... = -290 - (-29) = -261
    expect(partyPercentMod(PHYS, { ...NONE, physTaken: 10 }, -290)).toBe(-261);
  });

  it('a command that is neither physical nor magical is unchanged', () => {
    expect(partyPercentMod(0, { physDealt: 99, magDealt: 99, physTaken: 99, magTaken: 99 }, 242)).toBe(242);
    expect(partyPercentMod(3, { physDealt: 99, magDealt: 99, physTaken: 99, magTaken: 99 }, 242)).toBe(242);
  });

  it('the product wraps at 32 bits before the division   255 * 9,000,000 = 2,295,000,000 -> -1,999,967,296', () => {
    // 255 * 9,000,000 = 2,295,000,000 - 2^32 = -1,999,967,296;  / 100 = -19,999,672 (toward zero);  9,000,000 + that
    expect(partyPercentMod(PHYS, { ...NONE, physDealt: 255 }, 9000000)).toBe(9000000 - 19999672);
  });
});

describe('ratio immunity and damage immunity (0x78ad80, 0x78aac0)', () => {
  it('formulas 5 and 8 against a target immune to fractions give 0 and cancel the HP class', () => {
    for (const formula of [5, 8]) {
      const f = newHitFlags(7);
      expect(ratioImmunity(formula, 2, 500, f)).toBe(0);
      expect(f.classLeft).toBe(6);
      expect(f.immunityCount).toBe(1);
    }
    expect(ratioImmunity(1, 2, 500, newHitFlags(1))).toBe(500);
    expect(ratioImmunity(5, 0, 500, newHitFlags(1))).toBe(500);
  });

  it('special bit 0x20 blocks physical, 0x40 magical, 0x80 everything', () => {
    expect(damageImmunity(PHYS, 0x20, 242, newHitFlags(1))).toBe(0);
    expect(damageImmunity(MAGIC, 0x20, 242, newHitFlags(1))).toBe(242);
    expect(damageImmunity(MAGIC, 0x40, 242, newHitFlags(1))).toBe(0);
    expect(damageImmunity(PHYS, 0x40, 242, newHitFlags(1))).toBe(242);
    expect(damageImmunity(0, 0x80, 242, newHitFlags(1))).toBe(0);
    const f = newHitFlags(1);
    expect(damageImmunity(PHYS, 0x80, 242, f)).toBe(0);
    expect(f.classLeft).toBe(0);
    expect(f.immunityCount).toBe(1);
  });
});

describe('absorb flip (0x78a200)', () => {
  it('negates when exactly one of the user\'s Zombie bit and the target snapshot\'s Zombie bit is set', () => {
    expect(absorbInvert(0x100, 2, 0, 242)).toBe(-242);
    expect(absorbInvert(0x100, 0, 2, 242)).toBe(-242);
    expect(absorbInvert(0x100, 2, 2, 242)).toBe(242);
    expect(absorbInvert(0x100, 0, 0, 242)).toBe(242);
  });

  it('only a command with the absorb flag (Cmd+0x1c bit 0x100) is affected', () => {
    expect(absorbInvert(0, 2, 0, 242)).toBe(242);
  });
});

describe('Armored (0x78a830)', () => {
  it('divides by 3 toward zero and marks the hit   242 -> 80;  -10 -> -3', () => {
    const f = newHitFlags(1);
    expect(armoredMod(0, 1, 0, 0, 242, f)).toBe(80);
    expect(f.armored).toBe(1);
    expect(armoredMod(0, 1, 0, 0, -10, newHitFlags(1))).toBe(-3);
  });

  it('...unless the command pierces armor (Cmd+0x1c bit 0x10000), the user has Pierce, or the target is Armor Broken', () => {
    expect(armoredMod(0x10000, 1, 0, 0, 242, newHitFlags(1))).toBe(242);
    expect(armoredMod(0, 1, 0x2000, 0, 242, newHitFlags(1))).toBe(242);
    expect(armoredMod(0, 1, 0, 0x40, 242, newHitFlags(1))).toBe(242);
  });

  it('a target that is not Armored is untouched, and the damage type is not checked', () => {
    expect(armoredMod(0, 0, 0, 0, 242, newHitFlags(1))).toBe(242);
    expect(armoredMod(0, 0x21, 0, 0, 242, newHitFlags(1))).toBe(80); // bit 0 set, other bits ignored
  });
});

describe('Defend and Sentinel (0x78a7d0)', () => {
  it('halve a PHYSICAL command; flag 0x08 for Defend, 0x10 when only Sentinel; Defend wins when both', () => {
    const d = newHitFlags(1);
    expect(defendSentinelMod(PHYS, 0x800, 243, d)).toBe(121);
    expect(d.resultMask).toBe(0x09);
    const s = newHitFlags(1);
    expect(defendSentinelMod(PHYS, 0x2000, 243, s)).toBe(121);
    expect(s.resultMask).toBe(0x11);
    const both = newHitFlags(1);
    expect(defendSentinelMod(PHYS, 0x2800, 243, both)).toBe(121);
    expect(both.resultMask).toBe(0x09);
    expect(both.guardMark).toBe(1);
  });

  it('a magical command, or other extra bits, are untouched', () => {
    expect(defendSentinelMod(MAGIC, 0x800, 243, newHitFlags(1))).toBe(243);
    expect(defendSentinelMod(PHYS, 0x400, 243, newHitFlags(1))).toBe(243);
  });
});

describe('Power Break and Magic Break on the user (0x789290)', () => {
  it('Power Break (0x10) halves physical damage, Magic Break (0x20) magical damage', () => {
    expect(userBreakMod(PHYS, 0x10, 243)).toBe(121);
    expect(userBreakMod(MAGIC, 0x20, 243)).toBe(121);
    expect(userBreakMod(MAGIC, 0x10, 243)).toBe(243);
    expect(userBreakMod(PHYS, 0x20, 243)).toBe(243);
    expect(userBreakMod(0, 0x30, 243)).toBe(243);
  });
});

describe('timed-input scale override (0x78bd90)', () => {
  it('damage * (a + 2b) / (2b) in double precision, truncated   a 0.5, b 1: 242 * 2.5 / 2 = 302.5 -> 302', () => {
    expect(damageScaleOverride({ a: 0.5, b: 1 }, 242)).toBe(302);
  });

  it('a = b = 1 gives exactly 3/2   242 -> 363;  with no override the damage is unchanged', () => {
    expect(damageScaleOverride({ a: 1, b: 1 }, 242)).toBe(363);
    expect(damageScaleOverride(null, 242)).toBe(242);
  });

  it('the damage is rounded to single precision first   16,777,217 -> 16,777,216', () => {
    expect(damageScaleOverride({ a: 0, b: 1 }, 16777217)).toBe(16777216);
  });

  it('a zero denominator gives 0x80000000   (0/0 is NaN; the hardware conversion returns "integer indefinite")', () => {
    expect(damageScaleOverride({ a: 0, b: 0 }, 100)).toBe(-2147483648);
  });
});

describe('golden vectors from the emulator harness (skipped until tests/fixtures/parity/ffx/small_mods.json exists)', () => {
  const fixture = loadFfxParityFixture('small_mods');
  it.skipIf(fixture === null)('every recorded vector matches', () => {
    if (fixture === null) return;
    for (const v of fixture.vectors) {
      const i = expandVectorInput(fixture.defaults, v.in) as Record<string, any>;
      const e = v.out as Record<string, any>;
      const where = `vector ${v.id} (${v.class})`;
      if (i['kind'] === 'party') {
        const b = i['bytes'] as number[];
        const got = partyPercentMod(i['flagsDamage'], { physDealt: b[0]!, magDealt: b[1]!, physTaken: b[2]!, magTaken: b[3]! }, i['damage']);
        expect(got, where).toBe(e['value']);
      } else if (i['kind'] === 'scale') {
        expect(damageScaleOverride(i['on'] ? { a: i['a'], b: i['b'] } : null, i['damage']), where).toBe(e['value']);
      } else if (i['kind'] === 'armored') {
        const f = newHitFlags(1);
        expect(armoredMod(i['flagsMisc'], i['special'], i['autoA'], i['perm'], i['damage'], f), where).toBe(e['value']);
        expect(f.armored, where).toBe(e['flag']);
      } else if (i['kind'] === 'shield') {
        const f = newHitFlags(0);
        expect(shieldBoostMod(i['extra'], i['damage'], f), where).toBe(e['value']);
        expect(f.resultMask, where).toBe(e['mask']);
        expect(f.guardMark, where).toBe(e['guardMark']);
      } else if (i['kind'] === 'delay') {
        const r = delayAttackCtb(i['flagsMisc'], i['tick'], i['ctb'], i['mask']);
        expect(r.ctbDamage, where).toBe(e['ctb']);
        expect(r.mask, where).toBe(e['mask']);
      }
    }
  });
});
