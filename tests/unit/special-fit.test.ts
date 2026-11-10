/**
 * Test 14 of the FFX-2 Special look (step C1; pure half; game case: FFX-2 only in what is seen, the shared plumbing both games and inert): the fitted height of a Special's one figure.
 *
 * THE PIN (written in the step-0 commit, BEFORE `PartyStature.ts` is edited): the LITERAL copies of the old bodies of `sceneOwnHeight` and `formPlanScale` below are the answer the
 * stage gave before the optional fourth parameter existed; no check here compares new code with new code. The cases that need a stage and a camera (the whole enemy in frame, the head inside
 * the frame, the HUD lanes) are written by step C2.
 */
import { describe, expect, it } from 'vitest';
import { formPlanScale, sceneOwnHeight } from '../../src/engine/PartyStature.ts';

type Slots = { readonly figureHeights?: Readonly<Record<string, number>> | undefined; readonly formHeights?: Readonly<Record<string, number>> | undefined };

/** The body of `sceneOwnHeight` as it was before step C1 (`src/engine/PartyStature.ts`, one line). */
function oldSceneOwnHeight(slots: Slots, id: string, artId: string): number | undefined {
  return slots.figureHeights?.[id] ?? slots.formHeights?.[artId];
}

/** The body of `formPlanScale` as it was before step C1, and it must stay (D-34: the planners see the real size). */
function oldFormPlanScale(slots: Slots, id: string, artId: string, shared: number, given?: number): number {
  if (given !== undefined || slots.figureHeights?.[id] !== undefined) return 1;
  const own = slots.formHeights?.[artId];
  return own === undefined ? 1 : own / shared;
}

/** 30 ordinary art ids: the party, the dresspheres, an aeon, a boss, a namespaced copy, a part, and the ids a Special's part would be tempted to use. */
const ORDINARY = [
  'tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku', 'paine',
  'yuna-gunner', 'yuna-white-mage', 'yuna-black-mage', 'rikku-thief', 'rikku-songstress', 'paine-warrior', 'paine-dark-knight', 'paine-lady-luck',
  'valefor', 'ifrit', 'bahamut', 'seymour-flux', 'yunalesca-1', 'yunalesca-2', 'vegnagun-body', 'vegnagun-head',
  'exp-leblanc-yuna-gunner', 'exp-leblanc-rikku-thief', 'yuna-floral-fallal-yuna-floral-fallal', 'floral-fallal', 'machina-maw', 'full-throttle',
];

const SLOTS: Array<[string, Slots]> = [
  ['none', {}],
  ['figure heights', { figureHeights: { yuna: 2.4, rikku: 1.1, 'vegnagun-body': 9 } }],
  ['form heights', { formHeights: { 'yunalesca-1': 3.2, 'yunalesca-2': 4.4, yuna: 1.9, 'yuna-gunner': 2.2 } }],
  ['both', { figureHeights: { yuna: 2.4 }, formHeights: { 'yuna-gunner': 2.2, 'yunalesca-1': 3.2 } }],
];

describe('the old bodies, pinned (no `fit` given)', () => {
  it('sceneOwnHeight without a fit answers the literal old body for 30 ordinary art ids, four slot shapes and eight combatant ids', () => {
    let checked = 0;
    for (const [name, slots] of SLOTS) {
      for (const artId of ORDINARY) {
        for (const id of ['yuna', 'rikku', 'paine', 'tidus', 'bahamut', 'seymour-flux', 'vegnagun-body', 'nobody']) {
          expect(sceneOwnHeight(slots, id, artId), `${name} / ${id} / ${artId}`).toBe(oldSceneOwnHeight(slots, id, artId));
          checked++;
        }
      }
    }
    expect(ORDINARY.length).toBe(30);
    expect(checked).toBe(30 * 4 * 8);
  });

  it('formPlanScale is the literal old body for the same inputs (not edited by step C1)', () => {
    for (const [name, slots] of SLOTS) {
      for (const artId of ORDINARY) {
        for (const id of ['yuna', 'rikku', 'tidus', 'vegnagun-body']) {
          for (const given of [undefined, 3]) {
            expect(formPlanScale(slots, id, artId, 1.82, given), `${name} / ${id} / ${artId} / ${given}`).toBe(oldFormPlanScale(slots, id, artId, 1.82, given));
          }
        }
      }
    }
  });
});
