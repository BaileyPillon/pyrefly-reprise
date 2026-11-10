/**
 * The rows the two Special-form end-to-end specs open by name, proved on the REAL FFX-2 engine with each CHAPTER'S OWN party build (FFX-2 only: the three Special dresspheres exist only in FFX-2;
 * the `specialDressUp` switch is OFF in every build and ON here). Review fix pass 2, item O1 (finding R3-2 left half open: the touch-aim spec named Ma'at's Feather for Paine's left wing, a row
 * only a mastered rig offers).
 *
 * The specs (`tests/e2e/pause-with-form.spec.ts`, `special-touch-aim.spec.ts`) are written and not run, so this file is what keeps their tables true. The tables are
 * `tests/e2e/support/special-rows.ts`: the specs and this file import the SAME objects, nothing is copied. The engine is played through the app's own `setupForChapter(chapter)` with the chapter's
 * `buildRef` (`helpers/specialPartMenus.ts`): the girl walks her own Garment Grid to the offer of her Special, picks it, and the menus of her three plates are read. The menu texts are the
 * ones the command window prints (`labelOf`), the aims the ones it opens (`chooseLeaf`).
 */

import { describe, expect, it } from 'vitest';

import {
  AIMED_GIRLS,
  ALLY_ROWS,
  CHAPTER_OF,
  ENEMY_ROWS,
  LEAVE_ROW,
  PARTS,
  PASS_ROWS,
  ROW_ATTACK,
  ROW_CHANGE,
  SPECIAL_ROW,
  firstPresent,
  nextChangeRow,
  type Girl,
  type RowPick,
} from '../e2e/support/special-rows.ts';
import { chapterPartMenus, collectPlateMenus, greedyWalk, startMenus, type MenuRow, type PlateMenu } from './helpers/specialPartMenus.ts';
import { formUp } from './helpers/specialFormState.ts';

const GIRLS = ['yuna', 'rikku', 'paine'] as const;

type Played = ReturnType<typeof chapterPartMenus>;
const played = new Map<Girl, Played>();
/** The girl in her Special on her chapter's own build, played once; every plate's first two menus. */
function formOn(girl: Girl): Played {
  let p = played.get(girl);
  if (!p) {
    p = chapterPartMenus(CHAPTER_OF[girl], girl, PARTS[girl], { times: 2 });
    played.set(girl, p);
  }
  return p;
}

const girlOfPart = (part: string): Girl => GIRLS.find((g) => (PARTS[g] as readonly string[]).includes(part))!;
const menusOf = (part: string): PlateMenu[] => formOn(girlOfPart(part)).menus[part]!;
const rowsNamed = (m: PlateMenu, label: string): MenuRow[] => m.rows.filter((r) => r.label === label);
const labelsOf = (m: PlateMenu): string[] => m.rows.map((r) => r.label);
const offIn = (m: PlateMenu): boolean[] => m.rows.map((r) => !r.enabled);

describe('the parts and the chapters the specs name are the engine\'s', () => {
  for (const girl of GIRLS) {
    it(`${girl} in ${CHAPTER_OF[girl]}: the Special puts her and her two parts, right then left, on the field`, () => {
      expect(formOn(girl).active).toEqual([girl, ...PARTS[girl]]);
    });

    it(`${girl}: her own menu in the form has an enabled ${ROW_ATTACK}, a Skill submenu and a ${ROW_CHANGE} submenu that holds only the way out`, () => {
      for (const m of formOn(girl).menus[girl]!) {
        const attack = rowsNamed(m, ROW_ATTACK);
        expect(attack).toHaveLength(1);
        expect(attack[0]!.enabled).toBe(true);
        expect(m.ui.some((e) => 'leaf' in e && e.leaf === ROW_ATTACK)).toBe(true);
        const change = m.ui.find((e) => 'group' in e && e.group === ROW_CHANGE);
        expect(change && 'items' in change ? change.items : null, 'the Change submenu').toHaveLength(1);
        expect((change as { items: string[] }).items[0]).toMatch(LEAVE_ROW);
      }
    });

    it(`${girl}: each part's top level is submenus only (the spec opens them and never picks a leaf by mistake), with no ${ROW_ATTACK} and no ${ROW_CHANGE}`, () => {
      for (const part of PARTS[girl]) {
        for (const m of menusOf(part)) {
          expect(m.ui.length).toBeGreaterThan(0);
          expect(m.ui.every((e) => 'group' in e), `${part}: ${JSON.stringify(m.ui)}`).toBe(true);
          expect(rowsNamed(m, ROW_ATTACK), `${part} has no ${ROW_ATTACK} row`).toEqual([]);
          expect(m.ui.some((e) => 'group' in e && e.group === ROW_CHANGE)).toBe(false);
        }
      }
    });
  }
});

describe('ENEMY_ROWS: every row the touch-aim spec opens to aim a foe is offered by the chapter\'s own build', () => {
  it('the table names exactly the parts of the girls the spec runs', () => {
    const want = AIMED_GIRLS.flatMap((g) => [...PARTS[g]]).sort();
    expect(Object.keys(ENEMY_ROWS).sort()).toEqual(want);
    expect(Object.keys(ALLY_ROWS).sort()).toEqual(want);
  });

  for (const [part, picks] of Object.entries(ENEMY_ROWS)) {
    describe(`${part} (${girlOfPart(part)}, ${CHAPTER_OF[girlOfPart(part)]})`, () => {
      it('every candidate is one enabled row, aimed at the foe, with the aim the table names', () => {
        expect(picks.length).toBeGreaterThan(0);
        for (const m of menusOf(part)) {
          for (const pick of picks) {
            const rows = rowsNamed(m, pick.label);
            expect(rows, `${pick.label} on ${part}: ${labelsOf(m).join(' | ')}`).toHaveLength(1);
            expect(rows[0]).toMatchObject({ enabled: true, side: 'enemy', aim: pick.aim });
          }
        }
      });

      it('the first candidate is what the spec opens, and a one-foe skill comes first wherever the part has one', () => {
        for (const m of menusOf(part)) {
          expect(firstPresent(picks, labelsOf(m), offIn(m))).toBe(picks[0]);
          const oneFoe = m.rows.some((r) => r.enabled && r.side === 'enemy' && r.aim === 'single' && r.kind === 'ability');
          expect(picks[0]!.aim, oneFoe ? 'the part offers a one-foe skill: the pick is one' : 'the part offers no one-foe skill: the pick is a group').toBe(oneFoe ? 'single' : 'all');
        }
      });
    });
  }

  it('Paine\'s left wing in Chapter V has no one-foe skill, so its table is a group aim, and Ma\'at\'s Feather (a mastered rig\'s row) is not on it', () => {
    const left = menusOf('full-throttle-left')[0]!;
    expect(left.rows.filter((r) => r.side === 'enemy').map((r) => [r.label, r.aim])).toEqual([['White Feather', 'all'], ['Buckle Feather', 'all']]);
    expect(labelsOf(left)).not.toContain("Ma'at's Feather");
    // the finding itself: the mastered rig of `specialFormState.formUp` offers rows the chapter's build does not
    const rig = formUp('paine', { seed: 1, mastered: true });
    const mastered = collectPlateMenus(rig.engine, 'paine', PARTS.paine, 1)['full-throttle-left']![0]!;
    expect(labelsOf(mastered)).toContain("Ma'at's Feather");
    expect(labelsOf(mastered).length).toBeGreaterThan(labelsOf(left).length);
  });
});

describe('ALLY_ROWS: the one-target ally rows aim on all three plates', () => {
  for (const [part, picks] of Object.entries(ALLY_ROWS)) {
    it(`${part}: every candidate is one enabled single pick whose valid targets are the main and both parts`, () => {
      const girl = girlOfPart(part);
      for (const m of menusOf(part)) {
        expect(firstPresent(picks, labelsOf(m), offIn(m))).toBe(picks[0]);
        for (const pick of picks) {
          const rows = rowsNamed(m, pick.label);
          expect(rows, `${pick.label} on ${part}: ${labelsOf(m).join(' | ')}`).toHaveLength(1);
          expect(rows[0]).toMatchObject({ enabled: true, side: 'party', aim: pick.aim, targeting: 'single-ally' });
          expect([...rows[0]!.targets].sort(), 'the spec taps each of the three plates').toEqual([girl, ...PARTS[girl]].sort());
        }
      }
    });
  }

  it('Yuna\'s parts offer no one-target ally pick, which is why the spec does not run her (a design question, recorded in the handoff)', () => {
    expect(AIMED_GIRLS as readonly string[]).not.toContain('yuna');
    for (const part of PARTS.yuna) {
      for (const m of menusOf(part)) expect(m.rows.filter((r) => r.side === 'party' && r.aim === 'single')).toEqual([]);
    }
  });
});

describe('the walk to a Special: the e2e\'s own rules, on the real engine', () => {
  for (const chapter of new Set(Object.values(CHAPTER_OF))) {
    it(`${chapter}: every girl's first menu offers a pass row (Yuna's White Mage menu has no ${ROW_ATTACK}, so Cure is the second candidate)`, () => {
      const first = startMenus(chapter);
      expect(Object.keys(first).sort()).toEqual([...GIRLS].sort());
      for (const girl of GIRLS) {
        const rows = first[girl]!.rows;
        const pick = firstPresent(PASS_ROWS, rows.map((r) => r.label), rows.map((r) => !r.enabled));
        expect(pick, `${girl}: ${rows.map((r) => r.label).join(' | ')}`).toBeDefined();
        expect(pick!.label).toBe(girl === 'yuna' ? 'Cure' : ROW_ATTACK);
      }
    });
  }

  for (const girl of GIRLS) {
    it(`${girl}: the pass rows for the others and the greedy Change rule reach her Special in ${CHAPTER_OF[girl]} within the spec's 60 menus (the Curse rig of walkTo lifted)`, () => {
      const walk = greedyWalk(CHAPTER_OF[girl], girl, PARTS[girl], { liftCurse: true });
      expect(walk.failure).toBeNull();
      expect(walk.reached).toBe(true);
      expect(walk.decisions.length).toBeLessThanOrEqual(60);
      expect(walk.decisions.filter((d) => d.startsWith(`${girl}: ${ROW_CHANGE}`)).pop(), 'the last Change goes into the Special').toMatch(SPECIAL_ROW);
    });
  }
});

describe('the two pure rules of special-rows.ts', () => {
  const picks: RowPick[] = [{ label: 'A', aim: 'single' }, { label: 'B', aim: 'all' }];
  it('firstPresent takes the first candidate that is shown and enabled', () => {
    expect(firstPresent(picks, ['X', 'A', 'B'], [false, false, false])).toBe(picks[0]);
    expect(firstPresent(picks, ['X', 'A', 'B'], [false, true, false])).toBe(picks[1]);
    expect(firstPresent(picks, ['B'], [false])).toBe(picks[1]);
    expect(firstPresent(picks, ['X', 'Y'], [false, false])).toBeUndefined();
    expect(firstPresent(picks, ['A', 'B'], [true, true])).toBeUndefined();
  });

  it('nextChangeRow takes the enabled Special first, else the first enabled dress not worn, else -1', () => {
    expect(nextChangeRow(['Gunner', 'Floral Fallal (Special)', 'Thief'], [false, false, false], new Set())).toBe(1);
    expect(nextChangeRow(['Gunner', 'Floral Fallal (Special)', 'Thief'], [false, true, false], new Set())).toBe(0);
    expect(nextChangeRow(['Gunner', 'Thief'], [false, false], new Set(['Gunner']))).toBe(1);
    expect(nextChangeRow(['Gunner', 'Thief'], [true, false], new Set(['Thief']))).toBe(-1);
  });
});
