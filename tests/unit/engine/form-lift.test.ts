/**
 * **The stage lift of a form (`SceneStaging.formLifts`, `FormLift.ts`, `PaintedActor.setPerch`; release 76, FFX only in use: the hidden Penance chapter's half disc).**
 *
 * The engine plants a painting's lowest opaque row on the floor. At the Separation Penance swaps to a painting whose lowest row (the torn edge, `baselineY` 633) is 280 rows above the whole disc's (the rim's bottom, 913) at
 * the same pixel scale (its sidecar's `scale` 0.6933), so left alone the half that stays would drop by what fell away (about 1.7 world units at the stage's 5.6). The scene names the fraction of the figure's height
 * (`PENANCE_SPLIT_LIFT`) under the painting's art id; the stage stands the plane that much higher while it is up.
 *
 * Pinned here: the pure rule; that only Penance's scene names a lift (every other scene's slots and the empty staging carry none); and, through the REAL `PaintedActor` sized the way the loader sizes it (the real pose records and
 * registration rows of the new subjects, `head-lock-fixture.ts`), that with the lift the half disc's top sits where the whole disc's is and without it three and a half units lower.
 *
 * **Game case: FFX only** for the lift's use [AGENTS.md rule 14]; `setPerch` and `formLifts` are shared plumbing, additive, and a figure that never gets a lift is drawn exactly as before (a test of `perchHeight` 0 below).
 */
import { Texture } from 'three';
// the fixture first: it mocks the canvas stand-ins, and the modules below must see the mock
import { PaintedActor, painting, reset } from './head-lock-fixture.ts';
import { afterEach, describe, expect, it } from 'vitest';
import { formLiftFor } from '../../../src/engine/FormLift.ts';
import { PENANCE_SPLIT_LIFT, PENANCE_SPRITES } from '../../../src/data/ffx/penance-ids.ts';
import { PENANCE_FIGURE_HEIGHTS, PENANCE_FORM_LIFTS, PENANCE_SLOTS } from '../../../src/scenes/penance.ts';
import { sceneKeys, getScene } from '../../../src/scenes/index.ts';
import { stagingOf } from '../../../src/scenes/types.ts';

afterEach(reset);

describe('formLiftFor: the scene\'s fraction of the figure\'s height, in world units', () => {
  it('is the fraction times the height for a named art id', () => {
    expect(formLiftFor({ formLifts: { 'penance-split': 0.3 } }, 'penance-split', 5.6)).toBeCloseTo(1.68, 12);
  });
  it('is 0 for an art id the scene does not name, a scene that names none, and a table that is undefined', () => {
    expect(formLiftFor({ formLifts: { 'penance-split': 0.3 } }, 'penance', 5.6)).toBe(0);
    expect(formLiftFor({}, 'penance-split', 5.6)).toBe(0);
    expect(formLiftFor({ formLifts: undefined }, 'penance-split', 5.6)).toBe(0);
  });
  it('is 0 for a fraction that is not a positive finite number and for a height that is not (nothing is ever pushed below the floor or to NaN)', () => {
    for (const bad of [0, -0.3, Number.NaN, Number.POSITIVE_INFINITY]) expect(formLiftFor({ formLifts: { a: bad } }, 'a', 5.6), String(bad)).toBe(0);
    for (const bad of [0, -1, Number.NaN, undefined as unknown as number]) expect(formLiftFor({ formLifts: { a: 0.3 } }, 'a', bad), String(bad)).toBe(0);
  });
});

describe('only the Penance scene names a lift (FFX only); every other scene stands its figures exactly as before', () => {
  it('Penance names one: its half disc, the fraction of the whole disc\'s idle rows that fell away', () => {
    expect(PENANCE_FORM_LIFTS).toEqual({ [PENANCE_SPRITES.split]: PENANCE_SPLIT_LIFT });
    expect(PENANCE_SLOTS.formLifts).toBe(PENANCE_FORM_LIFTS);
    expect(PENANCE_SPLIT_LIFT).toBeGreaterThan(0.3);
    expect(PENANCE_SPLIT_LIFT).toBeLessThan(0.31);
    expect(formLiftFor(PENANCE_SLOTS, 'penance-split', PENANCE_FIGURE_HEIGHTS['penance']!)).toBeCloseTo(1.717, 3);
    expect(formLiftFor(PENANCE_SLOTS, 'penance', PENANCE_FIGURE_HEIGHTS['penance']!), 'the whole disc stands on the floor').toBe(0);
  });
  it('no other registered scene carries `formLifts`, and the staging switches of a build pass the table through only when it names one', () => {
    const named = sceneKeys().filter((key) => getScene(key)?.slots.formLifts !== undefined);
    expect(named).toEqual(['penance']);
    expect(stagingOf({}).formLifts).toBeUndefined();
    expect('formLifts' in stagingOf({})).toBe(false);
    expect(stagingOf({ formLifts: PENANCE_FORM_LIFTS }).formLifts).toBe(PENANCE_FORM_LIFTS);
  });
});

describe('through the real PaintedActor: the half disc\'s top stays where the whole disc\'s was', () => {
  /** The disc as the stage stages it: 5.6 units tall, no breath, no sway, no life layer, so a frame is the same frame. */
  function disc(subject: 'penance' | 'penance-split'): InstanceType<typeof PaintedActor> {
    const actor = new PaintedActor({ name: 'penance', worldHeight: 5.6, side: 'enemy', breathe: false, sway: false, life: false, interimYaw: false, shadow: false });
    // the sidecars' numbers (913 by 929, baselineY 913; 912 by 649, baselineY 633 and scale 0.6933): the loader's `PoseMeta`, over the registration rows' stance
    const tex = subject === 'penance' ? painting('penance', 'idle', { baselineY: 913 }) : painting('penance-split', 'idle', { baselineY: 633, scale: 0.6933 });
    actor.adoptPoses({ idle: { ...tex, texture: new Texture() } }, 'idle');
    actor.position.set(2.4, 0, -6.4);
    return actor;
  }
  const topOf = (actor: InstanceType<typeof PaintedActor>): number => {
    actor.update(1 / 60);
    actor.updateMatrixWorld(true);
    return Math.max(...actor.contentQuad().map((c) => c.y));
  };

  it('the whole disc stands 5.6 high; the half disc, drawn at the same pixel scale, 3.88 (its baseline 633 of the whole disc\'s 913)', () => {
    expect(topOf(disc('penance'))).toBeCloseTo(5.6, 2);
    expect(topOf(disc('penance-split'))).toBeCloseTo((5.6 * 633) / 913, 2);
  });

  it('with the scene\'s lift the half disc\'s top is the whole disc\'s, to a hundredth of a unit (the half that stays does not drop)', () => {
    const half = disc('penance-split');
    half.setPerch(formLiftFor(PENANCE_SLOTS, 'penance-split', half.height));
    expect(topOf(half)).toBeCloseTo(topOf(disc('penance')), 2);
  });

  it('the lift is for a standing painting: with the KO painting (a lying body, its own floor) shown, the dead half disc lies on the deck and does not hang 1.7 units above it', () => {
    const lowest = (actor: InstanceType<typeof PaintedActor>): number => {
      for (let i = 0; i < 3; i++) actor.update(1 / 60);
      actor.updateMatrixWorld(true);
      return Math.min(...actor.contentQuad().map((c) => c.y));
    };
    const staged = (): InstanceType<typeof PaintedActor> => {
      const actor = new PaintedActor({ name: 'penance', worldHeight: 5.6, side: 'enemy', breathe: false, sway: false, life: false, interimYaw: false, shadow: false });
      actor.adoptPoses({ idle: { ...painting('penance-split', 'idle', { baselineY: 633, scale: 0.6933 }), texture: new Texture() }, ko: { ...painting('penance-split', 'ko'), texture: new Texture() } }, 'idle');
      actor.position.set(2.4, 0, -6.4);
      return actor;
    };
    const lift = formLiftFor(PENANCE_SLOTS, 'penance-split', 5.6);
    const bare = staged();
    const perched = staged();
    perched.setPerch(lift);
    const standing = lowest(perched);
    expect(standing - lowest(bare), 'standing: the whole lift').toBeCloseTo(lift, 3);
    bare.setPose('ko', { immediate: true, force: true });
    perched.setPose('ko', { immediate: true, force: true });
    expect(lowest(perched), 'lying: no lift left').toBeCloseTo(lowest(bare), 3);
    perched.setPose('idle', { immediate: true, force: true });
    expect(lowest(perched), 'standing again (a revive): the lift is back').toBeCloseTo(standing, 3);
  });

  it('a perch is replaced by the next one, goes back to 0 for a bad number, and a figure never perched is drawn as it always was', () => {
    const plain = topOf(disc('penance-split'));
    const half = disc('penance-split');
    half.setPerch(2);
    expect(topOf(half)).toBeCloseTo(plain + 2, 3);
    half.setPerch(0.5);
    expect(topOf(half)).toBeCloseTo(plain + 0.5, 3);
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      half.setPerch(bad);
      expect(topOf(half), String(bad)).toBeCloseTo(plain, 3);
    }
  });
});
