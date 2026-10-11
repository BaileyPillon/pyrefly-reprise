/**
 * The game's auto-ability table as numbers (`kernel/gear-table.ts`) and our ids over it (`adapt/gear-ids.ts`).
 *
 * **Game case: FFX only.** The expectations below are written by hand from FFX-G03 section 5.1, one line per ability name, so a transposed record
 * number in the id map, or a wrong byte in the table, fails here whichever of the two it is. The table itself is proven against the game's machine
 * code by `parity-ffx-gear.test.ts` (the vectors run every record alone). This file also holds the cross-checks that keep the engine's older, narrower
 * readers (`adapt/words.ts`, `equipment.ts`) agreeing with the table they were written from.
 */

import { describe, expect, it } from 'vitest';
import type { AutoAbilityId } from '../../src/battle/common/types.ts';
import { AUTO_ABILITY_RECORDS } from '../../src/battle/ffx/kernel/gear-table.ts';
import { AUTO_ABILITY_RECORD } from '../../src/battle/ffx/adapt/gear-ids.ts';
import { STATUS_BY_NUMBER } from '../../src/battle/ffx/adapt/gear.ts';
import { PERM_STATUS_IDS, TEMPORAL_STATUS_IDS } from '../../src/battle/ffx/adapt/status.ts';
import { autoWordA, autoWordB } from '../../src/battle/ffx/adapt/words.ts';
import { weaponStatusStrikes } from '../../src/battle/ffx/equipment.ts';
import type { GearRecord } from '../../src/battle/ffx/kernel/gear.ts';
import type { FFXCombatant } from '../../src/battle/common/types.ts';

const rec = (id: AutoAbilityId): GearRecord => AUTO_ABILITY_RECORDS[AUTO_ABILITY_RECORD[id]] as GearRecord;

describe('the table', () => {
  it('has the game\'s 134 records; the five last are empty rows (129 to 133)', () => {
    expect(AUTO_ABILITY_RECORDS).toHaveLength(134);
    for (let i = 129; i < 134; i++) expect(AUTO_ABILITY_RECORDS[i], `record ${i}`).toEqual({});
  });

  it('gives each of our 125 ids its own record, and none of the four Distill records (124 to 127)', () => {
    const numbers = Object.values(AUTO_ABILITY_RECORD);
    expect(numbers).toHaveLength(125);
    expect(new Set(numbers).size).toBe(125);
    for (const n of numbers) expect([124, 125, 126, 127]).not.toContain(n);
    for (const n of numbers) expect(n).toBeGreaterThanOrEqual(0);
    for (const n of numbers) expect(n).toBeLessThan(134);
  });

  it('the status order of the 25 bytes is the engine\'s permanent group then its temporal group', () => {
    expect(STATUS_BY_NUMBER).toEqual([...PERM_STATUS_IDS, ...TEMPORAL_STATUS_IDS]);
  });
});

describe('each id does what its name says (FFX-G03 section 5.1)', () => {
  it('Strength, Magic, Defense and Magic Def +N% put N on their own damage entry (bits 10 to 13); HP and MP +N% on bits 8 and 9', () => {
    const families: Array<[string, number, number[]]> = [
      ['strength', 0x0400, [3, 5, 10, 20]],
      ['magic', 0x0800, [3, 5, 10, 20]],
      ['defense', 0x1000, [3, 5, 10, 20]],
      ['magic-def', 0x2000, [3, 5, 10, 20]],
      ['hp', 0x0100, [5, 10, 20, 30]],
      ['mp', 0x0200, [5, 10, 20, 30]],
    ];
    for (const [family, mask, tiers] of families) {
      for (const n of tiers) {
        const r = rec(`${family}-${n}` as AutoAbilityId);
        expect(r, `${family}-${n}`).toEqual({ percent: n, mask });
      }
    }
  });

  it('a Ward is 50 on its status, a Proof 255; Curse Ward and Curseproof set the Curse extra-immunity bit', () => {
    const statuses: Array<[string, number]> = [
      ['death', 0], ['zombie', 1], ['stone', 2], ['poison', 3], ['sleep', 12], ['silence', 13], ['dark', 14], ['slow', 24], ['confuse', 8], ['berserk', 9],
    ];
    for (const [name, number] of statuses) {
      expect(rec(`${name}-ward` as AutoAbilityId).resist, `${name}-ward`).toEqual([[number, 50]]);
      expect(rec((name === 'stone' ? 'stoneproof' : `${name}proof`) as AutoAbilityId).resist, `${name}proof`).toEqual([[number, 255]]);
    }
    expect(rec('curse-ward')).toEqual({ immuneExtra: 0x0400 });
    expect(rec('curseproof')).toEqual({ immuneExtra: 0x0400 });
  });

  it('a Strike is chance 100 and a Touch chance 50 on its status; Sleep, Silence and Darkness last 3, Slow 255, the permanent group has no duration', () => {
    const statuses: Array<[string, number, number | undefined, number | undefined]> = [
      ['death', 0, undefined, undefined], ['zombie', 1, undefined, undefined], ['stone', 2, undefined, undefined], ['poison', 3, undefined, undefined],
      ['sleep', 12, 0, 3], ['silence', 13, 1, 3], ['dark', 14, 2, 3], ['slow', 24, 12, 255],
    ];
    for (const [name, number, slot, duration] of statuses) {
      const strike = rec(`${name}strike` as AutoAbilityId);
      const touch = rec(`${name}touch` as AutoAbilityId);
      expect(strike.chances, `${name}strike`).toEqual([[number, 100]]);
      expect(touch.chances, `${name}touch`).toEqual([[number, 50]]);
      expect(strike.durations, `${name}strike duration`).toEqual(slot === undefined ? undefined : [[slot, duration]]);
      expect(touch.durations, `${name}touch duration`).toEqual(slot === undefined ? undefined : [[slot, duration]]);
    }
  });

  it('elemental gear: Strike adds the element, Ward resists it, Proof nullifies it, Eater absorbs it', () => {
    const elements: Array<[string, number]> = [['fire', 1], ['ice', 2], ['lightning', 4], ['water', 8]];
    for (const [name, bit] of elements) {
      expect(rec(`${name}strike` as AutoAbilityId).elements).toEqual([bit, 0, 0, 0, 0]);
      expect(rec(`${name}-eater` as AutoAbilityId).elements).toEqual([0, bit, 0, 0, 0]);
      expect(rec(`${name}proof` as AutoAbilityId).elements).toEqual([0, 0, bit, 0, 0]);
      expect(rec(`${name}-ward` as AutoAbilityId).elements).toEqual([0, 0, 0, bit, 0]);
    }
  });

  it('Auto-Shell, Protect, Reflect, Regen and Haste are the counter bits 3, 4, 5, 10 and 11; the SOS ones the same bits behind the SOS flag; the SOS Nuls bits 6 to 9', () => {
    const counters: Array<[string, number]> = [['shell', 3], ['protect', 4], ['reflect', 5], ['regen', 10], ['haste', 11]];
    for (const [name, bit] of counters) {
      expect(rec(`auto-${name}` as AutoAbilityId), `auto-${name}`).toEqual({ autoCounter: 1 << bit });
      expect(rec(`sos-${name}` as AutoAbilityId), `sos-${name}`).toEqual({ sos: true, autoCounter: 1 << bit });
    }
    expect(rec('sos-nultide')).toEqual({ sos: true, autoCounter: 1 << 6 });
    expect(rec('sos-nulblaze')).toEqual({ sos: true, autoCounter: 1 << 7 });
    expect(rec('sos-nulshock')).toEqual({ sos: true, autoCounter: 1 << 8 });
    expect(rec('sos-nulfrost')).toEqual({ sos: true, autoCounter: 1 << 9 });
  });

  it('the Ribbon is ten resistance bytes at 255 and the Doom extra immunity; the Aeon Ribbon adds Death, the four Breaks and the extra-immunity word 0x793f', () => {
    expect(rec('ribbon').resist).toEqual([1, 2, 3, 8, 9, 10, 12, 13, 14, 24].map((n) => [n, 255]));
    expect(rec('ribbon').immuneExtra).toBe(0x4000);
    expect(rec('aeon-ribbon').resist).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 24].map((n) => [n, 255]));
    expect(rec('aeon-ribbon').immuneExtra).toBe(0x793f);
  });

  it('the word bits: A, B and C, one per ability', () => {
    const a: Array<[AutoAbilityId, number]> = [
      ['sensor', 0x1], ['first-strike', 0x2], ['initiative', 0x4], ['counterattack', 0x8], ['evade-and-counter', 0x10], ['magic-counter', 0x20],
      ['magic-booster', 0x40], ['alchemy', 0x200], ['auto-potion', 0x400], ['auto-med', 0x800], ['auto-phoenix', 0x1000], ['piercing', 0x2000],
      ['half-mp-cost', 0x4000], ['one-mp-cost', 0x8000],
    ];
    const b: Array<[AutoAbilityId, number]> = [
      ['double-overdrive', 0x1], ['triple-overdrive', 0x2], ['sos-overdrive', 0x4], ['overdrive-to-ap', 0x8], ['double-ap', 0x10], ['triple-ap', 0x20],
      ['no-ap', 0x40], ['pickpocket', 0x80], ['master-thief', 0x100], ['break-hp-limit', 0x200], ['break-mp-limit', 0x400], ['break-damage-limit', 0x800],
      ['gillionaire', 0x4000], ['hp-stroll', 0x8000],
    ];
    const c: Array<[AutoAbilityId, number]> = [['mp-stroll', 0x1], ['no-encounters', 0x2], ['capture', 0x4]];
    for (const [id, bit] of a) expect(rec(id), id).toEqual({ wordA: bit });
    for (const [id, bit] of b) expect(rec(id), id).toEqual({ wordB: bit });
    for (const [id, bit] of c) expect(rec(id), id).toEqual({ wordC: bit });
  });
});

/** A party member wearing only these abilities (the engine's readers want a combatant). */
function wearing(...ids: AutoAbilityId[]): FFXCombatant {
  return {
    side: 'party',
    equipment: { weapon: { name: 'W', slots: 4, autoAbilities: ids }, armor: { name: 'A', slots: 1, autoAbilities: [] } },
  } as unknown as FFXCombatant;
}

describe('the engine\'s older readers agree with the table they were written from', () => {
  it('words A and B (`adapt/words.ts`) are the table\'s bits for the abilities they read', () => {
    expect(autoWordA(wearing('magic-booster'))).toBe(rec('magic-booster').wordA);
    expect(autoWordA(wearing('alchemy'))).toBe(rec('alchemy').wordA);
    expect(autoWordA(wearing('piercing'))).toBe(rec('piercing').wordA);
    for (const id of ['double-overdrive', 'triple-overdrive', 'sos-overdrive', 'overdrive-to-ap', 'break-hp-limit', 'break-mp-limit', 'break-damage-limit'] as const) {
      expect(autoWordB(wearing(id)), id).toBe(rec(id).wordB);
    }
  });

  it('the weapon strikes (`equipment.ts`) are the table\'s chance and duration bytes', () => {
    for (const name of ['stone', 'death', 'zombie', 'poison', 'sleep', 'silence', 'dark', 'slow']) {
      for (const [suffix, chance] of [['strike', 100], ['touch', 50]] as const) {
        const id = `${name}${suffix}` as AutoAbilityId;
        const r = rec(id);
        const [status, byte] = (r.chances as [[number, number]])[0];
        const got = weaponStatusStrikes(wearing(id));
        expect(got, id).toHaveLength(1);
        expect(STATUS_BY_NUMBER.indexOf(got[0]?.status as never), id).toBe(status);
        expect(got[0]?.chance, id).toBe(byte);
        expect(byte).toBe(chance);
        const duration = r.durations?.[0]?.[1] ?? 0;
        expect(got[0]?.duration, id).toBe(duration);
      }
    }
  });
});
