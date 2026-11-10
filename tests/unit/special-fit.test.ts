/**
 * Test 14 of the FFX-2 Special look (step C1; pure half; game case: FFX-2 only in what is seen, the shared plumbing both games and inert): the fitted height of a Special's one figure.
 *
 * THE PIN (written in the step-0 commit, BEFORE `PartyStature.ts` is edited): the LITERAL copies of the old bodies of `sceneOwnHeight` and `formPlanScale` below are the answer the
 * stage gave before the optional fourth parameter existed; no check here compares new code with new code. The cases that need a stage and a camera (the whole enemy in frame, the head inside
 * the frame, the HUD lanes) are written by step C2.
 */
import { describe, expect, it } from 'vitest';
import { figureHeight, formPlanScale, partyStature, sceneOwnHeight } from '../../src/engine/PartyStature.ts';
import { figureSpec } from '../../src/engine/StageFigureRequest.ts';
import { makeSpecialFit } from '../../src/engine/SpecialStaging.ts';

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

// ------------------------------------------------------------------ with a fit (step C1)

const TRIAL = { fit: 'trial', mark: 'a', hold: 'per-save' } as const;
const desktopFit = makeSpecialFit({ partyHeight: 1.82, enemyHeight: 4.1, surface: 'desktop' }, TRIAL);
const SPECIAL_ART = ['yuna-floral-fallal', 'rikku-machina-maw', 'paine-full-throttle'] as const;
const TRIAL_GIRLS = [1.55, 1.45, 1.55];

describe('with a fit (the Special look)', () => {
  it('the figure\'s world height is girls x 1.82, for each of the three Specials, through sceneOwnHeight\'s fallback', () => {
    SPECIAL_ART.forEach((art, i) => {
      expect(sceneOwnHeight({}, art.split('-')[0]!, art, desktopFit)).toBeCloseTo(TRIAL_GIRLS[i]! * 1.82, 9);
    });
    expect(sceneOwnHeight({}, 'yuna', 'yuna-gunner', desktopFit)).toBeUndefined(); // an ordinary art id: the stage's own rule
  });

  it('is inert for 30 ordinary art ids, four slot shapes and eight combatant ids: the literal old body answers, with a fit or without', () => {
    for (const [name, slots] of SLOTS) {
      for (const artId of ORDINARY) {
        for (const id of ['yuna', 'rikku', 'paine', 'tidus', 'bahamut', 'seymour-flux', 'vegnagun-body', 'nobody']) {
          expect(sceneOwnHeight(slots, id, artId, desktopFit), `${name} / ${id} / ${artId}`).toBe(oldSceneOwnHeight(slots, id, artId));
        }
      }
    }
  });

  it('the planners see the real size (D-34): formPlanScale stays 1 for a Special, the size carries no stature, and so no STATURE_KEY is written', () => {
    const slots = {};
    for (const art of SPECIAL_ART) {
      expect(formPlanScale(slots, art.split('-')[0]!, art, 1.82)).toBe(1);
      const own = sceneOwnHeight(slots, art.split('-')[0]!, art, desktopFit);
      const size = figureHeight({ shared: 1.82, own, given: undefined, stature: partyStature('ffx2', 'party', art.split('-')[0]!) });
      expect(size.stature).toBe(1); // the stage writes the key only when `size.stature !== 1` or `formPlanScale(...) !== 1`
      expect(size.height).toBe(own);
      expect(size.ringScale).toBeCloseTo(own! / 1.82, 9);
    }
  });

  it('a scene\'s formHeights entry still wins over the fit (the ?? order), and then formPlanScale returns its own over the shared height (the alternative semantic, pinned)', () => {
    const slots = { formHeights: { 'yuna-floral-fallal': 2.2 } };
    expect(sceneOwnHeight(slots, 'yuna', 'yuna-floral-fallal', desktopFit)).toBe(2.2);
    expect(formPlanScale(slots, 'yuna', 'yuna-floral-fallal', 1.82)).toBeCloseTo(2.2 / 1.82, 12);
    const own = { figureHeights: { yuna: 3 }, formHeights: { 'yuna-floral-fallal': 2.2 } };
    expect(sceneOwnHeight(own, 'yuna', 'yuna-floral-fallal', desktopFit)).toBe(3);
    expect(formPlanScale(own, 'yuna', 'yuna-floral-fallal', 1.82)).toBe(1);
  });

  it('the stage\'s figure request takes the fit: the painting is drawn girls x 1.82 tall, an ordinary figure is as before, and no fit is today\'s request exactly', () => {
    const c = (id: string): Parameters<typeof figureSpec>[1] => ({ id, side: 'party', slot: 0, alive: true, spriteKey: id, flags: {} }) as unknown as Parameters<typeof figureSpec>[1];
    const env = { slots: { party: [], enemy: [] } as unknown as Parameters<typeof figureSpec>[0]['slots'], rim: undefined, rigs: undefined, groundLuma: 0.3, game: 'ffx2' as const };
    const art = (artId: string) => ({ artId, poses: { idle: `/art/characters/${artId}/idle.png` } });
    const withFit = figureSpec({ ...env, specialFit: desktopFit }, c('yuna'), art('yuna-floral-fallal'));
    expect(withFit.request.opts.worldHeight).toBeCloseTo(1.55 * 1.82, 9);
    expect(withFit.size.ringScale).toBeCloseTo(1.55, 9);
    const plain = figureSpec({ ...env, specialFit: desktopFit }, c('yuna'), art('yuna-gunner'));
    expect(plain.fingerprint).toBe(figureSpec(env, c('yuna'), art('yuna-gunner')).fingerprint);
    expect(plain.request.opts.worldHeight).toBeCloseTo(1.82, 9);
    const none = figureSpec(env, c('yuna'), art('yuna-floral-fallal'));
    expect(none.request.opts.worldHeight).toBeCloseTo(1.82, 9); // no fit registered: the stage's own rule, OFF
  });
});
