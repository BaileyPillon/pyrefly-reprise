/**
 * Parity tests for the FFX elemental affinity, the Nul-element check and the steps after the damage classes
 * (`src/battle/ffx/kernel/element.ts`, `kernel/aftermath.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: element 0x78a360, Nul check
 * 0x78bfb0, Delay Attack 0x78e0f0, Threaten ignores delay 0x78bd50, Petrified 0x78ba30, delay immunity 0x78c180,
 * newly-dead 0x78c480 and the clamp at the end of the per-hit pipeline 0x78e630.
 * Spec: `research/re-ffx-damage.md` sections 5 and 6.
 *
 * Every expected number is worked by hand from the decompile and the disassembly; the cases of the element rules
 * were also run through the real machine code in an x86-32 emulator and agreed. The last block loads emulator golden
 * vectors from `tests/fixtures/parity/ffx/element_mod.json` when that file exists.
 *
 * Element bits: 1 fire, 2 ice, 4 thunder, 8 water, 0x10 holy (0x20 to 0x80 are handled the same way).
 */

import { describe, expect, it } from 'vitest';
import {
  damageCap,
  deathHitNoDamage,
  delayAttackCtb,
  delayImmunity,
  finalClamp,
  noStatusOutcome,
  petrifiedNoDamage,
  threatenIgnoresDelay,
} from '../../src/battle/ffx/kernel/aftermath.ts';
import { elementMod, nulElementCheck, type ElementAffinity } from '../../src/battle/ffx/kernel/element.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

const FIRE = 1;
const ICE = 2;
const THUNDER = 4;
const WATER = 8;
const HOLY = 0x10;
const aff = (over: Partial<ElementAffinity> = {}): ElementAffinity => ({ absorb: 0, null: 0, resist: 0, weak: 0, ...over });

describe('elemental affinity (0x78a360)', () => {
  it('a command with no element is unchanged whatever the target carries', () => {
    expect(elementMod(1000, 0, aff({ absorb: 0xff, null: 0xff, resist: 0xff, weak: 0xff }))).toBe(1000);
  });

  it('weak multiplies by 3/2, resist halves, null zeroes, absorb negates (one element)', () => {
    expect(elementMod(1000, FIRE, aff({ weak: FIRE }))).toBe(1500);
    expect(elementMod(1000, FIRE, aff({ resist: FIRE }))).toBe(500);
    expect(elementMod(1000, FIRE, aff({ null: FIRE }))).toBe(0);
    expect(elementMod(1000, FIRE, aff({ absorb: FIRE }))).toBe(-1000);
    expect(elementMod(1000, FIRE, aff({ weak: ICE, resist: ICE }))).toBe(1000); // a different element: neutral
  });

  it('each weak bit multiplies again, truncating every time   5 -> 7 -> 10, where a single x2.25 would give 11', () => {
    // 5 * 3 = 15;  / 2 = 7        7 * 3 = 21;  / 2 = 10
    expect(elementMod(5, FIRE | ICE, aff({ weak: FIRE | ICE }))).toBe(10);
    expect(elementMod(1000, FIRE | ICE, aff({ weak: FIRE | ICE }))).toBe(2250);
  });

  it('a weakness anywhere decides it; resist, null and absorb on the other bits are ignored', () => {
    expect(elementMod(1000, FIRE | ICE, aff({ weak: FIRE }))).toBe(1500);
    expect(elementMod(1000, FIRE | ICE, aff({ weak: FIRE, absorb: ICE }))).toBe(1500);
    expect(elementMod(1000, FIRE | ICE | THUNDER, aff({ weak: THUNDER, null: FIRE, absorb: ICE }))).toBe(1500);
  });

  it('with no weakness, ONE neutral element bit leaves the whole hit unchanged', () => {
    expect(elementMod(1000, FIRE | ICE, aff({ resist: FIRE }))).toBe(1000); // ice is neutral
    expect(elementMod(1000, FIRE | ICE, aff({ absorb: FIRE }))).toBe(1000);
    expect(elementMod(1000, FIRE | ICE, aff({ null: FIRE }))).toBe(1000);
    expect(elementMod(1000, FIRE | ICE, aff({ absorb: ICE }))).toBe(1000); // fire is neutral
  });

  it('with every bit affected, the order is: a resisted bit, then a nulled bit, then absorb', () => {
    // fire absorbed, ice resisted -> half   (a resisted bit beats an absorbed bit)
    expect(elementMod(1000, FIRE | ICE, aff({ absorb: FIRE, resist: ICE }))).toBe(500);
    // fire absorbed, ice nulled -> 0        (a nulled bit beats an absorbed bit)
    expect(elementMod(1000, FIRE | ICE, aff({ absorb: FIRE, null: ICE }))).toBe(0);
    // fire nulled, ice resisted -> half     (a resisted bit beats a nulled bit)
    expect(elementMod(1000, FIRE | ICE, aff({ null: FIRE, resist: ICE }))).toBe(500);
    // both absorbed -> negated
    expect(elementMod(1000, FIRE | ICE, aff({ absorb: FIRE | ICE }))).toBe(-1000);
    // three bits: fire resisted, ice nulled, thunder absorbed -> half
    expect(elementMod(1000, FIRE | ICE | THUNDER, aff({ resist: FIRE, null: ICE, absorb: THUNDER }))).toBe(500);
  });

  it('a bit that is resisted AND absorbed counts as absorbed;  nulled AND absorbed likewise', () => {
    expect(elementMod(1000, FIRE, aff({ resist: FIRE, absorb: FIRE }))).toBe(-1000);
    expect(elementMod(1000, FIRE, aff({ null: FIRE, absorb: FIRE }))).toBe(-1000);
    expect(elementMod(1000, FIRE, aff({ resist: FIRE, null: FIRE }))).toBe(0); // nulled wins over resisted on ONE bit
  });

  it('holy and the high bits follow the same rules   bit 0x80 weak returns at once with x3/2', () => {
    expect(elementMod(1000, HOLY, aff({ weak: HOLY }))).toBe(1500);
    expect(elementMod(1000, 0x80, aff({ weak: 0x80 }))).toBe(1500);
    expect(elementMod(1000, 0x81, aff({ weak: 0x80 }))).toBe(1500);
    expect(elementMod(1000, 0x81, aff({ weak: 0x81 }))).toBe(2250);
    expect(elementMod(1000, 0x80, aff())).toBe(1000);
    expect(elementMod(1000, 0x80, aff({ resist: 0x80 }))).toBe(500);
    expect(elementMod(1000, 0x80, aff({ null: 0x80 }))).toBe(0);
    expect(elementMod(1000, 0x80, aff({ absorb: 0x80 }))).toBe(-1000);
  });

  it('every multiplication and halving cuts toward zero, for a heal too', () => {
    expect(elementMod(-5, FIRE, aff({ weak: FIRE }))).toBe(-7); // -15 / 2 = -7.5 -> -7   (a floor gives -8)
    expect(elementMod(-5, FIRE | ICE, aff({ weak: FIRE | ICE }))).toBe(-10); // -7 -> -21 / 2 = -10
    expect(elementMod(3, FIRE, aff({ resist: FIRE }))).toBe(1);
    expect(elementMod(-3, FIRE, aff({ resist: FIRE }))).toBe(-1);
    expect(elementMod(3, FIRE, aff({ absorb: FIRE }))).toBe(-3);
  });
});

describe('the Nul-element check (0x78bfb0)', () => {
  const none = { tide: 0, blaze: 0, shock: 0, frost: 0 };

  it('a single element covered by its Nul status is nullified and the counter ticks down', () => {
    const r = nulElementCheck(FIRE, { ...none, blaze: 2 });
    expect(r.nullified).toBe(true);
    expect(r.counters).toEqual({ ...none, blaze: 1 });
  });

  it('every Nul-able element of the command must be covered   fire + ice with only Nul-Blaze is NOT nullified', () => {
    const r = nulElementCheck(FIRE | ICE, { ...none, blaze: 2 });
    expect(r.nullified).toBe(false);
    expect(r.counters).toEqual({ ...none, blaze: 2 });
    expect(nulElementCheck(FIRE | ICE, { ...none, blaze: 2, frost: 1 })).toEqual({
      nullified: true,
      counters: { ...none, blaze: 1, frost: 0 },
    });
  });

  it('holy and the other bits do not count: fire + holy is covered by Nul-Blaze alone; holy alone never is', () => {
    expect(nulElementCheck(FIRE | HOLY, { ...none, blaze: 2 }).nullified).toBe(true);
    expect(nulElementCheck(HOLY, { ...none, blaze: 2 }).nullified).toBe(false);
    expect(nulElementCheck(0, { ...none, blaze: 2 }).nullified).toBe(false);
  });

  it('thunder is Nul-Shock, ice Nul-Frost, water Nul-Tide', () => {
    expect(nulElementCheck(THUNDER, { ...none, shock: 1 }).counters.shock).toBe(0);
    expect(nulElementCheck(ICE, { ...none, frost: 1 }).counters.frost).toBe(0);
    expect(nulElementCheck(WATER, { ...none, tide: 1 }).counters.tide).toBe(0);
  });

  it('counters 0xfe and 0xff never tick;  0xfd does', () => {
    const r = nulElementCheck(FIRE | ICE | THUNDER | WATER, { tide: 0xfe, blaze: 0xff, shock: 0xfd, frost: 1 });
    expect(r).toEqual({ nullified: true, counters: { tide: 0xfe, blaze: 0xff, shock: 0xfc, frost: 0 } });
  });
});

describe('Delay Attack and Delay Buster (0x78e0f0)', () => {
  it('Delay Attack adds tick speed * 3 / 2 to the CTB damage;  Delay Buster tick speed * 3', () => {
    // tick speed 7: 7 * 3 = 21;  k = 1: 21 / 2 = 10;  k = 2: 42 / 2 = 21
    expect(delayAttackCtb(0x2000, 7, 5, 1)).toEqual({ ctbDamage: 15, mask: 5 });
    expect(delayAttackCtb(0x4000, 7, 0, 1)).toEqual({ ctbDamage: 21, mask: 5 });
  });

  it('when both flags are set the Buster wins;  with neither, nothing changes', () => {
    expect(delayAttackCtb(0x6000, 7, 0, 0).ctbDamage).toBe(21);
    expect(delayAttackCtb(0, 7, 3, 1)).toEqual({ ctbDamage: 3, mask: 1 });
  });
});

describe('Threaten, Petrified, delay immunity and newly-dead overrides', () => {
  it('Threaten (snapshot bit 0x800) cancels CTB damage and removes the CTB class, only when flag 4 is on', () => {
    expect(threatenIgnoresDelay(0x800, 5, 7, 21)).toEqual({ ctbDamage: 0, classLeft: 3 });
    expect(threatenIgnoresDelay(0x800, 1, 7, 21)).toEqual({ ctbDamage: 21, classLeft: 7 });
    expect(threatenIgnoresDelay(0, 5, 7, 21)).toEqual({ ctbDamage: 21, classLeft: 7 });
  });

  it('a target Petrified before and after (no Eject) takes nothing of any class', () => {
    expect(petrifiedNoDamage(4, 4, 0, [100, 20, 5])).toEqual({ damage: [0, 0, 0], applied: true });
  });

  it('...but not one that has just been petrified, has been shattered out of Petrify, or carries Eject (extra bit 8)', () => {
    expect(petrifiedNoDamage(0, 4, 0, [100, 20, 5])).toEqual({ damage: [100, 20, 5], applied: false });
    expect(petrifiedNoDamage(4, 0, 0, [100, 20, 5])).toEqual({ damage: [100, 20, 5], applied: false });
    expect(petrifiedNoDamage(4, 4, 0x100, [100, 20, 5])).toEqual({ damage: [100, 20, 5], applied: false });
  });

  it('delay immunity zeroes CTB damage when flag 4 is on, unless Threaten set the bypass flag', () => {
    expect(delayImmunity(true, 4, 0, 21)).toBe(0);
    expect(delayImmunity(true, 4, 1, 21)).toBe(21);
    expect(delayImmunity(true, 0, 0, 21)).toBe(21);
    expect(delayImmunity(false, 4, 0, 21)).toBe(21);
  });

  it('a hit that newly inflicts Death zeroes all three damages and clears the three class bits', () => {
    expect(deathHitNoDamage(0, 1, 0x107, [100, 20, 5])).toEqual({ damage: [0, 0, 0], mask: 0x100 });
    expect(deathHitNoDamage(1, 1, 0x107, [100, 20, 5])).toEqual({ damage: [100, 20, 5], mask: 0x107 });
    expect(deathHitNoDamage(0, 0, 0x107, [100, 20, 5])).toEqual({ damage: [100, 20, 5], mask: 0x107 });
  });

  it('with no status change the snapshot passes through', () => {
    expect(noStatusOutcome(0x1234, 0x20)).toEqual({ permAfter: 0x1234, extraAfter: 0x20, maskBits: 0, ctbDamage: null, ctbFlag: 0 });
  });
});

describe('the damage cap and the final clamp (end of 0x78e630)', () => {
  it('cap: 9999;  99999 with Break Damage Limit (Chr+0x6be bit 0x800);  Cmd+0x20 bit 0x40 forces 9999, bit 0x80 forces 99999', () => {
    expect(damageCap(0, 0)).toBe(9999);
    expect(damageCap(0, 0x800)).toBe(99999);
    expect(damageCap(0x40, 0x800)).toBe(9999);
    expect(damageCap(0x80, 0)).toBe(99999);
    expect(damageCap(0xc0, 0)).toBe(99999); // bit 0x80 is looked at first
    expect(damageCap(0x40, 0)).toBe(9999);
    expect(damageCap(0x05, 0x7ff)).toBe(9999); // the other auto-ability bits do not matter
  });

  const base = { mask: 1, flagsDamage: 0, userAutoB: 0, userBuffFlags: 0, overkillThreshold: 100000, running: [5000, 100, 40] as [number, number, number] };

  it('each class is clamped to +-cap on its own   -12,000 heals no more than 9,999', () => {
    const r = finalClamp({ ...base, damage: [12000, -12000, 50000] });
    expect(r.amounts).toEqual([9999, -9999, 9999]);
    expect(r.cap).toBe(9999);
    expect(finalClamp({ ...base, damage: [12000, 0, 0], userAutoB: 0x800 }).amounts[0]).toBe(12000);
    expect(finalClamp({ ...base, damage: [123456, 0, 0], userAutoB: 0x800 }).amounts[0]).toBe(99999);
  });

  it('the inflicts-9999 buff turns 1..9998 into 9999 and -9998..-1 into -9999, only for HP, only with the HP class live', () => {
    const buff = { ...base, userBuffFlags: 8 };
    expect(finalClamp({ ...buff, damage: [1, 0, 0] }).amounts[0]).toBe(9999);
    expect(finalClamp({ ...buff, damage: [9998, 0, 0] }).amounts[0]).toBe(9999);
    expect(finalClamp({ ...buff, damage: [-1, 0, 0] }).amounts[0]).toBe(-9999);
    expect(finalClamp({ ...buff, damage: [-9998, 0, 0] }).amounts[0]).toBe(-9999);
    expect(finalClamp({ ...buff, damage: [0, 0, 0] }).amounts[0]).toBe(0);
    expect(finalClamp({ ...buff, damage: [0, 50, 7] }).amounts).toEqual([0, 50, 7]); // MP and CTB untouched
    expect(finalClamp({ ...buff, mask: 6, damage: [50, 0, 0] }).amounts[0]).toBe(50); // HP class not live
    // a larger value is left for the cap: 20,000 with Break Damage Limit stays 20,000
    expect(finalClamp({ ...buff, userAutoB: 0x800, damage: [20000, 0, 0] }).amounts[0]).toBe(20000);
  });

  it('the running totals go down by the damage, never below 0, and up by a heal with no ceiling', () => {
    expect(finalClamp({ ...base, damage: [30, 0, 0] }).running).toEqual([4970, 100, 40]);
    expect(finalClamp({ ...base, running: [100, 10, 5], damage: [150, 20, 9] }).running).toEqual([0, 0, 0]);
    expect(finalClamp({ ...base, damage: [-50, -30, -2] }).running).toEqual([5050, 130, 42]);
  });

  it('overkill (result flag 0x80): threshold minus HP damage is 0 or less', () => {
    expect(finalClamp({ ...base, overkillThreshold: 100, damage: [100, 0, 0] }).overkill).toBe(true);
    expect(finalClamp({ ...base, overkillThreshold: 100, damage: [99, 0, 0] }).overkill).toBe(false);
    expect(finalClamp({ ...base, overkillThreshold: 0, damage: [0, 0, 0] }).overkill).toBe(true); // a threshold of 0 always sets it
  });
});

describe('golden vectors from the emulator harness (skipped until tests/fixtures/parity/ffx/element_mod.json exists)', () => {
  const fixture = loadFfxParityFixture('element_mod');
  it.skipIf(fixture === null)('every recorded vector matches', () => {
    if (fixture === null) return;
    for (const v of fixture.vectors) {
      const i = expandVectorInput(fixture.defaults, v.in) as Record<string, any>;
      const e = v.out as Record<string, any>;
      const where = `vector ${v.id} (${v.class})`;
      if (i['kind'] === 'elem') {
        expect(elementMod(i['damage'], i['element'], i['affinity']), where).toBe(e['value']);
      } else {
        const r = nulElementCheck(i['element'], i['nul']);
        expect(r.nullified, where).toBe(e['nullified']);
        expect(r.counters, where).toEqual(e['counters']);
      }
    }
  });
});
