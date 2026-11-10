/**
 * Test 4, the helper half, of the FFX-2 Special look (step C1; game case: FFX-2 only in what is seen, the plumbing both games and inert while no form is registered):
 * `src/engine/SpecialStaging.ts`. The cases that need a running `PaintedStage` (a re-stage leaves one painted actor and two stubs, no pass moves a stub) are step C2's.
 *
 * Removal check: delete `SpecialStaging.ts` and this file (and `special-fit.test.ts`) no longer compile.
 */
import { describe, expect, it } from 'vitest';
import type { AnyCombatant } from '../../src/battle/common/types.ts';
import { SPECIAL_PARTS, STAND_POINT } from '../../src/data/art/specialParts.ts';
import type { PaintedActor } from '../../src/engine/PaintedActor.ts';
import type { SceneSlots } from '../../src/scenes/index.ts';
import {
  anchorRowFor,
  anchorSourceOf,
  FALL_GRADE,
  formHandleOf,
  formKeepIds,
  formSlots,
  makeSpecialFit,
  partRoleOf,
  partView,
  partViewOf,
  setSpecialLook,
  setStageForm,
  specialFitGirls,
  specialFitOf,
  specialLook,
  stageFormOf,
  surfaceOf,
  type SpecialLook,
  type StageForm,
} from '../../src/engine/SpecialStaging.ts';

const ENEMY_OVER_PARTY = 4.1 / 1.82;
const SLOTS = { party: [], enemy: [], partyHeight: 1.82, enemyHeight: 4.1 } as unknown as SceneSlots;
const formOf = (special: StageForm['special'], girl = 'yuna'): StageForm => ({ girl, special, main: girl, right: `${girl}-pod-r`, left: `${girl}-pod-l`, parked: ['rikku', 'paine'], gate: { blocked: false } });
const SPECIALS = ['floral-fallal', 'machina-maw', 'full-throttle'] as const;
const ART = ['yuna-floral-fallal', 'rikku-machina-maw', 'paine-full-throttle'] as const;
const look = (l: Partial<SpecialLook>): SpecialLook => ({ fit: 'trial', mark: 'a', hold: 'per-save', ...l });
const girls = (surface: 'desktop' | 'phone', l: SpecialLook = look({})): Array<number | undefined> => ART.map((a) => specialFitGirls(a, surface, ENEMY_OVER_PARTY, l));

describe('with no form registered (the OFF state)', () => {
  it('formSlots is the very same object, formKeepIds is empty, partViewOf is the combatant itself, the hooks answer undefined', () => {
    const stage = {};
    expect(formSlots(stage, SLOTS)).toBe(SLOTS);
    expect(formKeepIds(stage)).toEqual([]);
    const c = { id: 'yuna-pod-r', side: 'party', flags: {} } as unknown as AnyCombatant;
    for (const id of ['yuna', 'yuna-pod-r', 'yuna-pod-l', 'tidus']) {
      const x = { ...c, id } as AnyCombatant;
      expect(partViewOf(stage, x)).toBe(x);
      expect(partRoleOf(stage, id)).toBeUndefined();
      expect(formHandleOf(stage, id, { get: () => undefined })).toBeUndefined();
    }
    expect(specialFitOf(stage, { slots: SLOTS, canvas: { clientWidth: 1600, clientHeight: 900 } })).toBeUndefined();
    expect(anchorSourceOf(stage)).toBeUndefined();
    expect(stageFormOf(stage)).toBeUndefined();
  });

  it('registering and dropping a form on one stage leaves another stage untouched', () => {
    const a = {};
    const b = {};
    setStageForm(a, formOf('floral-fallal'));
    expect(stageFormOf(a)).toBeDefined();
    expect(stageFormOf(b)).toBeUndefined();
    expect(formSlots(b, SLOTS)).toBe(SLOTS);
    setStageForm(a, null);
    expect(stageFormOf(a)).toBeUndefined();
    expect(formSlots(a, SLOTS)).toBe(SLOTS);
  });
});

describe('with a form registered', () => {
  it('formSlots adds one row for each stub and keeps every other thing; a row the scene already has is never overwritten', () => {
    const stage = {};
    const form = formOf('floral-fallal');
    setStageForm(stage, form);
    const existing = { mode: 'overhead', offset: [0, 0, 0] } as const;
    const slots = { ...SLOTS, partAnchors: { 'vegnagun-leg': existing, [form.left]: existing } } as unknown as SceneSlots;
    const out = formSlots(stage, slots);
    expect(out).not.toBe(slots);
    expect(out.partyHeight).toBe(1.82);
    expect(Object.keys(out.partAnchors!).sort()).toEqual([form.left, form.right, 'vegnagun-leg'].sort());
    expect(out.partAnchors![form.left]).toBe(existing);
    expect(out.partAnchors![form.right]!.mode).toBe('onParent');
    expect(formKeepIds(stage)).toEqual(['rikku', 'paine']);
    expect(partRoleOf(stage, 'yuna')).toBe('main');
    expect(partRoleOf(stage, form.right)).toBe('right');
    expect(partRoleOf(stage, form.left)).toBe('left');
    expect(partRoleOf(stage, 'rikku')).toBeUndefined();
    setStageForm(stage, null);
  });

  for (const special of SPECIALS) {
    it(`mode (a), ${special}: both rows are the whole-figure row (the figure's box, the number point, a hidden ring), for every pose`, () => {
      for (const [pose, rows] of Object.entries(SPECIAL_PARTS[special].poses)) {
        const r = anchorRowFor(special, 'right', pose, look({ mark: 'a' }))!;
        const l = anchorRowFor(special, 'left', pose, look({ mark: 'a' }))!;
        expect(r).toEqual(l);
        expect(r.mode).toBe('onParent');
        expect(r.box, `${special}/${pose}`).toEqual(rows.whole.box);
        expect(r.px).toEqual(rows.whole.numberPoint);
        expect(r.chestPx).toEqual(rows.whole.numberPoint);
        expect(r.ring.hidden).toBe(true);
        expect(r.ring.mark).toBeUndefined();
        expect(r.paint).toEqual(rows.paint);
      }
    });

    it(`mode (b), ${special}: each part gets its own region's row and a gold target mark, never the violet`, () => {
      for (const [pose, rows] of Object.entries(SPECIAL_PARTS[special].poses)) {
        const r = anchorRowFor(special, 'right', pose, look({ mark: 'b' }))!;
        const l = anchorRowFor(special, 'left', pose, look({ mark: 'b' }))!;
        expect(r.px, `${special}/${pose}`).toEqual(rows.right.px);
        expect(l.px).toEqual(rows.left.px);
        expect(r.chestPx).toEqual(rows.right.px);
        expect(r.box).toBeUndefined();
        expect(r.ring).toMatchObject({ ground: false, mark: 'target', colour: 0xf0cf92 });
        expect(r.ring.hidden).toBeUndefined();
        expect(r.ring.radius).toBeGreaterThan(0);
        expect(r.ring.colour).not.toBe(0xc8a0ff);
      }
    });
  }

  it('mode (b), a phone: the ring follows the figure on screen, not the desktop reference (anchorSourceOf takes the main\'s live height; absent, the desktop one)', () => {
    for (const special of SPECIALS) {
      const stage = {};
      const form = formOf(special, special === 'floral-fallal' ? 'yuna' : special === 'machina-maw' ? 'rikku' : 'paine');
      setStageForm(stage, form);
      setSpecialLook({ mark: 'b' });
      const desktop = specialFitGirls(`${form.girl}-${special}`, 'desktop', ENEMY_OVER_PARTY, look({ mark: 'b' }))! * 1.82;
      const phone = specialFitGirls(`${form.girl}-${special}`, 'phone', ENEMY_OVER_PARTY, look({ mark: 'b' }))! * 1.82;
      expect(phone, special).toBeLessThan(desktop); // a phone fits the figure smaller
      const radius = (h?: number): number => (anchorSourceOf(stage, h)!(form.right, 'idle') as { ring: { radius: number } }).ring.radius;
      expect(radius(), 'no height given: the desktop reference').toBeCloseTo(radius(desktop), 9);
      expect(radius(phone) / radius(desktop), special).toBeCloseTo(phone / desktop, 9);
      const rows = SPECIAL_PARTS[special].poses['idle']!;
      expect(radius(phone), special).toBeCloseTo((rows.right.radiusPx / (rows.paint.baselineY - rows.paint.contentTop)) * phone, 9);
      setSpecialLook(null);
      setStageForm(stage, null);
    }
  });

  it('the main has no row', () => {
    expect(anchorRowFor('floral-fallal', 'main', 'idle')).toBeUndefined();
  });

  it('right and left are told apart by name, never by x: Full Throttle\'s attack has the right wing on the screen-right, Floral Fallal\'s idle on the screen-left', () => {
    const ftR = anchorRowFor('full-throttle', 'right', 'attack', look({ mark: 'b' }))!;
    const ftL = anchorRowFor('full-throttle', 'left', 'attack', look({ mark: 'b' }))!;
    expect(ftR.px[0]).toBeGreaterThan(ftL.px[0]);
    const ffR = anchorRowFor('floral-fallal', 'right', 'idle', look({ mark: 'b' }))!;
    const ffL = anchorRowFor('floral-fallal', 'left', 'idle', look({ mark: 'b' }))!;
    expect(ffR.px[0]).toBeLessThan(ffL.px[0]);
    // the stage's per-frame source answers by the part's id
    const stage = {};
    const form = formOf('full-throttle', 'paine');
    setStageForm(stage, form);
    setSpecialLook({ mark: 'b' });
    const source = anchorSourceOf(stage)!;
    expect((source(form.right, 'attack') as { px: number[] }).px).toEqual(ftR.px);
    expect((source(form.left, 'attack') as { px: number[] }).px).toEqual(ftL.px);
    expect(source('paine', 'attack')).toBeUndefined();
    expect(source('rikku-pod-r', 'attack')).toBeUndefined();
    setSpecialLook(null);
    setStageForm(stage, null);
  });

  it('a painting with no table row shows the idle painting\'s row (ready, critical, sleep)', () => {
    for (const pose of ['ready', 'critical', 'sleep', 'victory', 'no-such-pose']) {
      expect(anchorRowFor('machina-maw', 'right', pose, look({ mark: 'a' }))).toEqual(anchorRowFor('machina-maw', 'right', 'idle', look({ mark: 'a' })));
      expect(anchorRowFor('machina-maw', 'left', pose, look({ mark: 'b' }))).toEqual(anchorRowFor('machina-maw', 'left', 'idle', look({ mark: 'b' })));
    }
    expect(anchorRowFor('machina-maw', 'right', 'attack', look({ mark: 'a' }))).not.toEqual(anchorRowFor('machina-maw', 'right', 'idle', look({ mark: 'a' })));
  });

  it('a row is a copy: changing it changes nothing in the table', () => {
    const r = anchorRowFor('floral-fallal', 'right', 'idle', look({ mark: 'a' }))!;
    r.px[0] = -1;
    r.box![0] = -1;
    expect(SPECIAL_PARTS['floral-fallal'].poses['idle']!.whole.numberPoint[0]).not.toBe(-1);
    expect(SPECIAL_PARTS['floral-fallal'].poses['idle']!.whole.box[0]).not.toBe(-1);
  });

  it('partView names the main as the parent and keeps every other field; partViewOf does it for the form\'s pods only', () => {
    const form = formOf('floral-fallal');
    const pod = { id: form.right, side: 'party', slot: 3, flags: { isBoss: false } } as unknown as AnyCombatant;
    const view = partView(pod, form);
    expect(view.flags['partOf']).toBe('yuna');
    expect(view.flags['isBoss']).toBe(false);
    expect(view.id).toBe(form.right);
    expect(pod.flags['partOf']).toBeUndefined();
    const stage = {};
    setStageForm(stage, form);
    expect(partViewOf(stage, pod).flags['partOf']).toBe('yuna');
    const girl = { id: 'yuna', side: 'party', flags: {} } as unknown as AnyCombatant;
    expect(partViewOf(stage, girl)).toBe(girl);
    setStageForm(stage, null);
  });

  it('the form carries a hit gate, and formHandleOf answers a handle for each part id and a hit-gated actor for the main\'s', () => {
    const stage = {};
    const form = formOf('machina-maw', 'rikku');
    expect(form.gate).toEqual({ blocked: false });
    setStageForm(stage, form);
    const actor = (): { actor: PaintedActor } => ({ actor: new Proxy({}, {}) as unknown as PaintedActor });
    const map: Record<string, { actor: PaintedActor }> = { rikku: actor(), [form.right]: actor(), [form.left]: actor() };
    const actors = { get: (id: string) => map[id] };
    const r = formHandleOf(stage, form.right, actors);
    const l = formHandleOf(stage, form.left, actors);
    const m = formHandleOf(stage, 'rikku', actors);
    expect(r).toBeDefined();
    expect(l).toBeDefined();
    expect(m).toBeDefined();
    expect(new Set([r, l, m]).size).toBe(3);
    expect(formHandleOf(stage, 'yuna', actors)).toBeUndefined();
    setStageForm(stage, null);
  });
});

describe('the stand point and the fall grade (data)', () => {
  it('every girl stands at her own slot', () => {
    expect(STAND_POINT).toEqual({ yuna: 'own', rikku: 'own', paine: 'own' });
  });

  it('the fall grade is the KO flash stretched and the squash', () => {
    expect(FALL_GRADE).toEqual({ flashColour: 0x4a5a78, flashPeak: 0.7, scale: 0.8 });
  });

  it('the default look is the working default, and setSpecialLook(null) puts it back', () => {
    setSpecialLook({ fit: 'larger', mark: 'b', hold: 'short-always' });
    expect(specialLook()).toEqual({ fit: 'larger', mark: 'b', hold: 'short-always' });
    setSpecialLook({ mark: 'b' });
    expect(specialLook()).toEqual({ fit: 'trial', mark: 'b', hold: 'per-save' });
    setSpecialLook(null);
    expect(specialLook()).toEqual({ fit: 'trial', mark: 'a', hold: 'per-save' });
  });
});

describe('the fit rule', () => {
  const round2 = (v: number | undefined): number | undefined => (v === undefined ? v : Math.round(v * 100) / 100);

  it('gives the trial table: 1.55 / 1.45 / 1.55 girls on the desktop, 1.15 / 1.0 / 1.15 on the phone', () => {
    expect(girls('desktop')).toEqual([1.55, 1.45, 1.55]);
    expect(girls('phone')).toEqual([1.15, 1, 1.15]);
  });

  it('is 2.82 / 2.64 / 2.82 world units tall on the desktop and 2.09 / 1.82 / 2.09 on the phone at the default heights, and 0.59 / 0.72 / 0.52 of the silhouette', () => {
    const desk = makeSpecialFit({ partyHeight: 1.82, enemyHeight: 4.1, surface: 'desktop' }, look({}));
    const phone = makeSpecialFit({ partyHeight: 1.82, enemyHeight: 4.1, surface: 'phone' }, look({}));
    expect(ART.map((a) => round2(desk(a)))).toEqual([2.82, 2.64, 2.82]);
    expect(ART.map((a) => round2(phone(a)))).toEqual([2.09, 1.82, 2.09]);
    const sil = SPECIALS.map((s) => SPECIAL_PARTS[s].silhouetteGirls);
    expect(girls('desktop').map((g, i) => round2(g! / sil[i]!))).toEqual([0.59, 0.72, 0.52]);
    expect(girls('phone').map((g, i) => round2(g! / sil[i]!))).toEqual([0.44, 0.5, 0.39]);
  });

  it('the enemy term bites when the enemy is short; the width cap bites for Machina Maw and Full Throttle on a "larger" row', () => {
    expect(specialFitGirls('yuna-floral-fallal', 'desktop', 1, look({}))).toBeCloseTo(0.9, 9);
    expect(girls('desktop', look({ fit: 'larger' }))).toEqual([2, 1.54, 1.64]);
    expect(girls('phone', look({ fit: 'larger' }))).toEqual([1.15, 1, 1.15]);
  });

  it('the "true" row is the silhouettes: no enemy term, no width term', () => {
    expect(girls('desktop', look({ fit: 'true' }))).toEqual([2.63, 2.02, 2.97]);
    expect(girls('phone', look({ fit: 'true' }))).toEqual([2.63, 2.02, 2.97]);
    expect(specialFitGirls('yuna-floral-fallal', 'desktop', 0.2, look({ fit: 'true' }))).toBe(2.63);
  });

  it('answers undefined for an art id that is not a Special\'s, and answers as the base id inside an art namespace', () => {
    for (const id of ['yuna-gunner', 'exp-leblanc-yuna-gunner', 'floral-fallal', 'yuna-floral-fallal-yuna-floral-fallal', 'tidus', '']) {
      expect(specialFitGirls(id, 'desktop', ENEMY_OVER_PARTY, look({})), id).toBeUndefined();
    }
    expect(specialFitGirls('exp-leblanc-yuna-floral-fallal', 'desktop', ENEMY_OVER_PARTY, look({}))).toBe(1.55);
    const fit = makeSpecialFit({ partyHeight: 1.82, enemyHeight: 4.1, surface: 'desktop' }, look({}));
    expect(fit('yuna-gunner')).toBeUndefined();
    expect(fit('exp-leblanc-yuna-gunner')).toBeUndefined();
    expect(fit('exp-leblanc-rikku-machina-maw')).toBeCloseTo(1.45 * 1.82, 9);
  });

  it('reads the scene\'s heights and the window\'s surface through the stage, and follows the look', () => {
    const stage = {};
    setStageForm(stage, formOf('floral-fallal'));
    const desk = specialFitOf(stage, { slots: SLOTS, canvas: { clientWidth: 1600, clientHeight: 900 } })!;
    const phone = specialFitOf(stage, { slots: SLOTS, canvas: { clientWidth: 390, clientHeight: 844 } })!;
    expect(desk('yuna-floral-fallal')).toBeCloseTo(1.55 * 1.82, 9);
    expect(phone('yuna-floral-fallal')).toBeCloseTo(1.15 * 1.82, 9);
    const tall = { ...SLOTS, partyHeight: 2, enemyHeight: 5 } as unknown as SceneSlots;
    expect(specialFitOf(stage, { slots: tall, canvas: { clientWidth: 1600, clientHeight: 900 } })!('yuna-floral-fallal')).toBeCloseTo(1.55 * 2, 9);
    setSpecialLook({ fit: 'larger' });
    expect(specialFitOf(stage, { slots: SLOTS, canvas: { clientWidth: 1600, clientHeight: 900 } })!('yuna-floral-fallal')).toBeCloseTo(2 * 1.82, 9);
    setSpecialLook(null);
    setStageForm(stage, null);
  });

  it('surfaceOf is the shared phone test', () => {
    expect(surfaceOf(390, 844)).toBe('phone');
    expect(surfaceOf(1600, 900)).toBe('desktop');
    expect(surfaceOf(599, 600)).toBe('phone');
    expect(surfaceOf(600, 900)).toBe('desktop');
    expect(surfaceOf(500, 400)).toBe('desktop');
  });
});
