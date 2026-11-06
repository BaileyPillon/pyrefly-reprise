/**
 * **The optional-config seam is inert for the Wind Waker chapter** (`src/engine/ww3d/layout.ts` `WwStaging`, `model.ts`, `skin.ts`, `pose.ts`, `props.ts`, `toonify.ts`; FFX-2 only; added by the anime chapter, 2026-11-06). The models and
 * the skin read their numbers from a staging table, the figures' shading from a `ModelShading`, the weapons' from a `PropStyle`, the head from a pitch fix, the set's extras from `ToonSet.extras`; **every one is optional and
 * omitted it is the Wind Waker chapter's own constant**, so that chapter reads and draws exactly as it did. This file pins every field of the default against the constant it stands for, and each seam's default behaviour.
 */
import { Group, Object3D, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
  BODY_OFF_DEG,
  BOSS_HEIGHT,
  BOSS_HOVER,
  BOSS_SPOT,
  BOSS_YAW_DEG,
  FACE_OFF_DEG,
  MODEL_FILE,
  NATIVE_HEIGHT,
  PARTY_HEIGHT,
  PARTY_SLOTS,
  WORLD_HEIGHT,
  WW_BOSS_ID,
  WW_CAST,
  WW_STAGING,
  heightFactor,
  heightFactorIn,
  modelUrl,
} from '../../../src/engine/ww3d/layout.ts';
import { HeadTurn } from '../../../src/engine/ww3d/pose.ts';
import { PROP_SPECS, attachProps, chooseProp, type PropStyle } from '../../../src/engine/ww3d/props.ts';
import { createToonUniforms } from '../../../src/engine/ww3d/toon.ts';
import { disposeToon, driveToon, toonify } from '../../../src/engine/ww3d/toonify.ts';
import { Color } from 'three';
import { plainMesh, skinnedGirl } from '../helpers/animeFixtures.ts';

describe('the default staging is the Wind Waker chapter\'s constants, field by field', () => {
  it('slots, spot, heights, hover, aim, turns, files, chest', () => {
    expect(WW_STAGING.partySlots).toBe(PARTY_SLOTS);
    expect(WW_STAGING.bossSpot).toBe(BOSS_SPOT);
    expect(WW_STAGING.nativeHeight).toBe(NATIVE_HEIGHT);
    expect(WW_STAGING.worldHeight).toBe(WORLD_HEIGHT);
    expect([WW_STAGING.partyHeight, WW_STAGING.bossHeight]).toEqual([PARTY_HEIGHT, BOSS_HEIGHT]);
    expect(WW_STAGING.bossHover).toBe(BOSS_HOVER);
    expect(WW_STAGING.bossAim).toEqual([BOSS_SPOT[0], BOSS_HOVER + 1.3, BOSS_SPOT[2]]); // the skin's old BOSS_CHEST
    expect([WW_STAGING.bodyOffDeg, WW_STAGING.faceOffDeg, WW_STAGING.bossYawDeg]).toEqual([BODY_OFF_DEG, FACE_OFF_DEG, BOSS_YAW_DEG]);
    expect(WW_STAGING.files).toBe(MODEL_FILE);
    expect(WW_STAGING.girlChest).toBe(0.58); // the skin's old GIRL_CHEST
    expect(WW_STAGING.headPitchFix, 'the head is only yawed').toBeUndefined();
  });

  it('the height factor in the default staging is the old one, for every figure; the model URL is the old one', () => {
    for (const id of WW_CAST) {
      expect(heightFactorIn(WW_STAGING, id), id).toBe(heightFactor(id));
      expect(modelUrl('/x/', 'models-exp/windwaker', id)).toBe(`/x/models-exp/windwaker/${MODEL_FILE[id]}.glb`);
      expect(modelUrl('/x/', 'models-exp/windwaker', id, WW_STAGING.files)).toBe(modelUrl('/x/', 'models-exp/windwaker', id));
    }
    expect(heightFactorIn(WW_STAGING, WW_BOSS_ID)).toBe(1);
  });
});

describe('the head turn: no pitch fix by default', () => {
  const headOf = (g: ReturnType<typeof skinnedGirl>): Quaternion => g.scene.getObjectByName('Head')!.quaternion.clone();

  it('only yaws the head; with a pitch fix a head bowed past the limit is raised, by at most the cap, and one already level is left as it is', () => {
    const base = skinnedGirl();
    base.scene.getObjectByName('Head')!.rotateX(0.6); // bowed forward (+x rotates +z toward -y)
    const bowed = (): number => {
      const f = new Vector3();
      const p = new Vector3();
      base.scene.getObjectByName('headfront')!.getWorldPosition(f);
      base.scene.getObjectByName('Head')!.getWorldPosition(p);
      return Math.asin(f.sub(p).normalize().y);
    };
    expect(bowed()).toBeLessThan(-0.4);
    const turn = new HeadTurn(base.scene);
    turn.apply([1.5, 0.37, 3.8]);
    expect(bowed(), 'the default turn leaves the bow').toBeLessThan(-0.4);
    const before = headOf(base);
    turn.apply([1.5, 0.37, 3.8], 24, 55, { minPitchDeg: -4, limitDeg: 40 });
    expect(bowed(), 'raised to the limit').toBeGreaterThan(-0.4);
    expect(bowed()).toBeLessThan(0.05);
    expect(headOf(base).equals(before)).toBe(false);
    const level = skinnedGirl();
    const lt = new HeadTurn(level.scene);
    lt.apply([1.5, 0.37, 3.8], 24, 55);
    const settled = headOf(level);
    lt.apply([1.5, 0.37, 3.8], 24, 55, { minPitchDeg: -4, limitDeg: 40 });
    expect(headOf(level).angleTo(settled), 'a level head: the same pose with or without the fix').toBeLessThan(1e-6);
  });

  it('caps the correction: a head bowed 60 degrees with a 10 degree cap is raised only part of the way', () => {
    const g = skinnedGirl();
    g.scene.getObjectByName('Head')!.rotateX(1.05);
    const turn = new HeadTurn(g.scene);
    const pitch = (): number => {
      const f = new Vector3();
      const p = new Vector3();
      g.scene.getObjectByName('headfront')!.getWorldPosition(f);
      g.scene.getObjectByName('Head')!.getWorldPosition(p);
      return (Math.asin(f.sub(p).normalize().y) * 180) / Math.PI;
    };
    const was = pitch();
    turn.apply([1.5, 0.37, 3.8], 24, 55, { minPitchDeg: -4, limitDeg: 10 });
    expect(pitch() - was).toBeGreaterThan(8);
    expect(pitch() - was).toBeLessThan(10.5);
  });
});

describe('the weapons: no style by default', () => {
  const girlWith = (swap: boolean): Object3D => {
    const g = skinnedGirl();
    const root = new Group();
    root.add(g.scene);
    void swap;
    return g.scene;
  };

  it('with no style the specs are the Wind Waker\'s, a swapped file is used at scale 1 and mirrored in the left hand, a procedural stand-in at the spec\'s scale', () => {
    const u = createToonUniforms();
    const file = new Group();
    file.add(plainMesh());
    const swapped = attachProps(girlWith(true), 'yuna', u, { pistol: file });
    expect(swapped.props).toHaveLength(PROP_SPECS.yuna.length);
    expect(swapped.swapped).toBe(2);
    expect(swapped.props.map((p) => p.scale.toArray())).toEqual([[-1, 1, 1], [1, 1, 1]]);
    const bare = attachProps(girlWith(false), 'rikku', u);
    expect(bare.swapped).toBe(0);
    expect(bare.props.map((p) => p.scale.x)).toEqual(PROP_SPECS.rikku.map((s) => s.scale));
    expect(attachProps(girlWith(false), 'nobody', u).props).toEqual([]);
  });

  it('an empty style is the same as none: same scales, same rotations, same positions', () => {
    const u = createToonUniforms();
    const file = new Group();
    file.add(plainMesh());
    const a = attachProps(girlWith(true), 'yuna', u, { pistol: file });
    const b = attachProps(girlWith(true), 'yuna', u, { pistol: file }, {} as PropStyle);
    for (let i = 0; i < a.props.length; i++) {
      expect(b.props[i]!.scale.toArray()).toEqual(a.props[i]!.scale.toArray());
      expect(b.props[i]!.quaternion.angleTo(a.props[i]!.quaternion)).toBeLessThan(1e-9);
      expect(b.props[i]!.position.toArray()).toEqual(a.props[i]!.position.toArray());
    }
  });

  it('a style\'s shade replaces the toon on a file\'s clone, its swapScale the scale, its specs the specs', () => {
    const u = createToonUniforms();
    const file = new Group();
    file.add(plainMesh());
    let shaded = 0;
    const style: PropStyle = { swapScale: 2, shade: () => void shaded++, specs: { yuna: [{ ...PROP_SPECS.yuna[1]!, grip: 0.2 }] } };
    const made = attachProps(girlWith(true), 'yuna', u, { pistol: file }, style);
    expect(shaded).toBe(1);
    expect(made.props).toHaveLength(1);
    expect(made.props[0]!.scale.toArray()).toEqual([2, 2, 2]);
    expect(chooseProp('pistol', u, { pistol: file }, style).swapped).toBe(true);
    expect(chooseProp('pistol', u, undefined, style).swapped).toBe(false);
  });
});

describe('the set\'s extras: none by default', () => {
  it('toonify returns a set with no extras, and driveToon and disposeToon do what they did; extras, when a style adds them, are driven and freed with the set', () => {
    const g = skinnedGirl();
    const set = toonify(g.scene, createToonUniforms());
    expect(set.extras).toBeUndefined();
    driveToon(set, { colour: new Color(1, 1, 1), emissive: new Color(0, 0, 0), amount: 0, opacity: 1 });
    disposeToon(set, false);
    const calls: string[] = [];
    const g2 = skinnedGirl();
    const set2 = { ...toonify(g2.scene, createToonUniforms()), extras: { drive: (): void => void calls.push('drive'), dispose: (): void => void calls.push('dispose') } };
    driveToon(set2, { colour: new Color(1, 1, 1), emissive: new Color(0, 0, 0), amount: 0, opacity: 1 });
    disposeToon(set2, false);
    expect(calls).toEqual(['drive', 'dispose']);
  });
});
