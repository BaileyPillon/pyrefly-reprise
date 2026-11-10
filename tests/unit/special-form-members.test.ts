/**
 * `SpecialFormMembers` (step D2 of the FFX-2 Special look; game case: FFX-2 only in what is seen, the readers are pure plumbing and answer `null` / `false` / `[]` with the switch OFF).
 *
 * The three readers the always-visible surfaces use to tell a girl from a part and to leave an away girl out, run over the REAL form-up engine of each girl (Floral Fallal, Machina Maw,
 * Full Throttle: `helpers/specialFormState.ts`). Removal check: delete `src/engine/SpecialFormMembers.ts` and this file (and the pause and field-mark tests that import it) fail to load.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { awayGirlIds, formMainOf, isFormPartId } from '../../src/engine/SpecialFormMembers.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { bahamutGroup, chapterIV, FORM_GIRLS, formUp } from './helpers/specialFormState.ts';
import { openSpecial, unit } from './helpers/specialDrive.ts';

const GIRLS = ['yuna', 'rikku', 'paine'] as const;

describe('a form is up: the readers tell the girl from her parts', () => {
  for (const { girl, parts } of FORM_GIRLS) {
    it(`${girl}: each part's main is her, she has none, and the other two girls are away`, () => {
      const { state } = formUp(girl);
      const s = state as BattleState;
      for (const part of parts) {
        expect(formMainOf(s, part), part).toBe(girl);
        expect(isFormPartId(s, part), part).toBe(true);
      }
      expect(formMainOf(s, girl)).toBeNull();
      expect(isFormPartId(s, girl)).toBe(false);
      expect(awayGirlIds(s).sort()).toEqual(GIRLS.filter((g) => g !== girl).sort());
      for (const g of GIRLS.filter((x) => x !== girl)) {
        expect(isFormPartId(s, g), g).toBe(false);
        expect(formMainOf(s, g), g).toBeNull();
      }
      // the foe and an id nobody holds are neither a part nor away
      expect(isFormPartId(s, 'bahamut')).toBe(false);
      expect(formMainOf(s, 'nobody-here')).toBeNull();
      expect(isFormPartId(s, 'nobody-here')).toBe(false);
      // the live list the surfaces walk is the girl, then her right part, then her left
      expect(s.activeIds).toEqual([girl, ...parts]);
    });
  }

  it('an Ejected girl (removed without the form\'s own parked mark) is not away; the parked ones still are', () => {
    const up = formUp('yuna');
    const rikku = unit(up.engine, 'rikku');
    expect(rikku.removed).toBe(true);
    delete rikku.aiMemory?.['sdspParked']; // out for another reason: removed, not parked by the form
    const away = awayGirlIds(up.engine.state() as BattleState);
    expect(away).toEqual(['paine']);
  });
});

describe('the switch is OFF: every answer is null, false or []', () => {
  it('the real engine at Chapter IV with no Special offered: no part, no main, no one away', () => {
    const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false });
    const s = engine.state() as BattleState;
    for (const id of Object.keys(s.combatants)) {
      expect(formMainOf(s, id), id).toBeNull();
      expect(isFormPartId(s, id), id).toBe(false);
    }
    expect(awayGirlIds(s)).toEqual([]);
  });

  it('the FFX fake state answers the same', () => {
    const s = makeFakeBattleState();
    for (const id of Object.keys(s.combatants)) {
      expect(formMainOf(s, id), id).toBeNull();
      expect(isFormPartId(s, id), id).toBe(false);
    }
    expect(awayGirlIds(s)).toEqual([]);
  });

  it('an Ejected girl with no form is not away either', () => {
    const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false });
    unit(engine, 'paine').removed = true;
    expect(awayGirlIds(engine.state() as BattleState)).toEqual([]);
  });
});
