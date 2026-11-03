/**
 * **REDUCE FLASHES in the hidden Wind Waker chapter** (`src/engine/ww3d/hitBurst.ts`, `hitFx.ts`, `moves.ts`, `moveFx.ts`; FFX-2 only; the review of 2026-11-02).
 *
 * The scene draws its own hits and moves (`SceneStaging.ownImpacts`), which turns off the shared Spectacle hit whose impact frame goes soft under the ACCESSIBILITY row REDUCE FLASHES (PR-0032, `readReduceFlashes`;
 * `SpectacleRules.impactFrame`), and the star, the orb and the beam did not read the row. With the row on (`calm`): the star is smaller, begins at 70 percent and does not overshoot, and has no white core; the Blast's orb
 * does not burst and covers at most 8 percent of the frame; the Ray's width and the Blast's core do not shimmer. With the row off nothing changes (the other tests of this folder pin that).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Color, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3, type ShaderMaterial } from 'three';
import { afterEach, describe, expect, it } from 'vitest';

import { TARGET_FOV, TARGET_POSITION } from '../../../src/engine/ww3d/camera.ts';
import { CALM_STAR_OVERSHOOT, CALM_STAR_SCALE, CALM_STAR_START, HIT_COLOURS, STAR_LIFE, STAR_OVERSHOOT, STAR_POP, hitPlan, starLayerNames, starScale } from '../../../src/engine/ww3d/hitBurst.ts';
import { HitFx } from '../../../src/engine/ww3d/hitFx.ts';
import { BOSS_SPOT, PARTY_HEIGHT } from '../../../src/engine/ww3d/layout.ts';
import { ORB, ORB_BANDS, ORB_MAX_SHARE, ORB_MAX_SHARE_CALM, movePhase, orbCapRadius, orbFrameShare, orbRadius } from '../../../src/engine/ww3d/moves.ts';
import { MoveFx } from '../../../src/engine/ww3d/moveFx.ts';

const AGES = Array.from({ length: 101 }, (_, i) => (i / 100) * STAR_LIFE);

describe('the star, in numbers', () => {
  it('is smaller under the row: 60 percent of the radius, for a plain blow, a heavy one and a later hit of a multi-hit action', () => {
    for (const info of [{ heavy: false, hitIndex: 0 }, { heavy: true, hitIndex: 0 }, { heavy: false, hitIndex: 2 }]) {
      const plain = hitPlan(PARTY_HEIGHT, info);
      const calm = hitPlan(PARTY_HEIGHT, info, true);
      expect(calm.radius).toBeCloseTo(plain.radius * CALM_STAR_SCALE, 9);
      expect([calm.points, calm.puffs]).toEqual([plain.points, plain.puffs]); // the shape and the smoke are the blow's
    }
    expect(hitPlan(PARTY_HEIGHT, { heavy: false, hitIndex: 0 }, false)).toEqual(hitPlan(PARTY_HEIGHT, { heavy: false, hitIndex: 0 }));
  });

  it('does not overshoot under the row (it begins at 70 percent and never passes its size), where the plain star pops to 115 percent from 35', () => {
    const calm = AGES.map((a) => starScale(a, true));
    const plain = AGES.map((a) => starScale(a));
    expect(Math.max(...calm)).toBeLessThanOrEqual(CALM_STAR_OVERSHOOT + 1e-9);
    expect(Math.max(...plain)).toBeCloseTo(STAR_OVERSHOOT, 2);
    expect(starScale(0, true)).toBeCloseTo(CALM_STAR_START, 9);
    expect(starScale(STAR_POP, true)).toBeCloseTo(1, 9);
    expect(starScale(STAR_LIFE, true)).toBe(0); // it still ends at the same time
    expect(starScale(-1, true)).toBe(0);
    // the jump from the first frame to the peak is a third of the plain star's
    expect(CALM_STAR_OVERSHOOT - CALM_STAR_START).toBeLessThan((STAR_OVERSHOOT - 0.35) / 2);
  });

  it('draws no white core under the row: the outline and the body only', () => {
    expect(starLayerNames()).toEqual(['outline', 'body', 'core']);
    expect(starLayerNames(true)).toEqual(['outline', 'body']);
  });
});

describe('the object that draws it', () => {
  const open: HitFx[] = [];
  const make = (calm?: () => boolean): HitFx => {
    const fx = calm ? new HitFx({ calm }) : new HitFx();
    open.push(fx);
    return fx;
  };
  afterEach(() => {
    for (const fx of open.splice(0)) fx.dispose();
  });
  const AT = new Vector3(-0.34, 0.9, 0.89);
  const colourOf = (m: Mesh): Color => (m.material as MeshBasicMaterial).color;
  const coreColour = new Color(HIT_COLOURS.core);

  it('draws the plain star with its white core when it is given no row (the default), and two layers and the same smoke when the row is on', () => {
    const plain = make();
    plain.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    expect(plain.bursts[0]!.calm).toBe(false);
    expect(plain.meshCount).toBe(3 + 3 * 4);
    expect((plain.group.children as Mesh[]).slice(0, 3).some((m) => colourOf(m).equals(coreColour))).toBe(true);

    const calm = make(() => true);
    calm.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    expect(calm.bursts[0]!.calm).toBe(true);
    expect(calm.meshCount).toBe(2 + 3 * 4);
    expect((calm.group.children as Mesh[]).some((m) => colourOf(m).equals(coreColour))).toBe(false);
    expect(calm.bursts[0]!.radius).toBeCloseTo(plain.bursts[0]!.radius * CALM_STAR_SCALE, 9);
  });

  it('asks the row at each blow, so turning it on mid-fight changes the next burst and leaves the one in flight alone', () => {
    let on = false;
    const fx = make(() => on);
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    on = true;
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    expect(fx.bursts.map((b) => b.calm)).toEqual([false, true]);
    expect(fx.meshCount).toBe(3 + 3 * 4 + 2 + 3 * 4);
  });

  it('shows a calm star at a size that never passes the nominal one, from the first frame to the last', () => {
    const fx = make(() => true);
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    for (let t = 0; t < STAR_LIFE; t += 1 / 60) {
      expect(fx.bursts[0]?.scale ?? 0).toBeLessThanOrEqual(1 + 1e-9);
      fx.update(1 / 60);
    }
  });
});

describe('the scene hands both objects the row', () => {
  // The factory needs a renderer, so this reads its source (as the guards of this repo do): both objects are built with the reader, and the reader asks the shared eye-candy environment, which the app fills from the save.
  const src = readFileSync(fileURLToPath(new URL('../../../src/scenes/exp-windwaker-stage.ts', import.meta.url)), 'utf8');
  it('builds the hits and the moves with the reader of REDUCE FLASHES, and the reader is the eye-candy environment\'s', () => {
    expect(src).toMatch(/const calm = \(\): boolean => eyeCandy\.reduceFlashes;/);
    expect(src).toMatch(/new MoveFx\(\{ calm \}\)/);
    expect(src).toMatch(/new HitFx\(\{ calm \}\)/);
    expect(src).toMatch(/from '\.\.\/engine\/fx\/EyeCandy\.ts'/);
  });
});

describe('the moves', () => {
  const chest = new Vector3(BOSS_SPOT[0], 0.9 + 1.3, BOSS_SPOT[2]);
  const girls = [new Vector3(-0.34, 0.8, 0.89), new Vector3(-0.05, 0.7, -0.16), new Vector3(0.69, 0.8, -1.28)];
  const lens = (aspect = 16 / 9): PerspectiveCamera => {
    const cam = new PerspectiveCamera(TARGET_FOV, aspect, 0.1, 400);
    cam.position.set(...TARGET_POSITION);
    return cam;
  };
  const draw = (mesh: Mesh, cam: PerspectiveCamera): number => {
    (mesh.onBeforeRender as (...a: unknown[]) => void)(undefined, undefined, cam);
    return mesh.scale.x;
  };

  it('has no burst in the orb under the row: the radius at the blow is the charged one, and the plain one is 1.65 times that', () => {
    const atBlow = movePhase('blast', 1.5, 1.5);
    expect(orbRadius(atBlow, true)).toBeCloseTo(ORB.radius, 9);
    expect(orbRadius(atBlow)).toBeCloseTo(ORB.radius * ORB.burst, 9);
    expect(orbRadius(atBlow, false)).toBe(orbRadius(atBlow));
    const before = movePhase('blast', 0.6, 1.5);
    expect(orbRadius(before, true)).toBe(orbRadius(before)); // the charge is the same
  });

  it('caps the orb at 8 percent of the frame under the row, where the plain cap is a quarter', () => {
    expect(ORB_MAX_SHARE_CALM).toBeLessThan(ORB_MAX_SHARE / 3);
    const calm = new MoveFx({ calm: () => true });
    const plain = new MoveFx();
    for (const fx of [calm, plain]) fx.start('blast', chest, girls, 1.5);
    calm.update(1.5);
    plain.update(1.5);
    const cam = lens();
    const rCalm = draw(calm.group.children[0] as Mesh, cam);
    const rPlain = draw(plain.group.children[0] as Mesh, cam);
    const share = (fx: MoveFx, r: number): number => {
      const orb = fx.group.children[0] as Mesh;
      return orbFrameShare(r, cam.position.distanceTo(orb.position), cam.fov, cam.aspect);
    };
    expect(share(calm, rCalm)).toBeLessThanOrEqual(ORB_MAX_SHARE_CALM + 1e-9);
    expect(rCalm).toBeCloseTo(orbCapRadius(cam.position.distanceTo((calm.group.children[0] as Mesh).position), cam.fov, cam.aspect, ORB_MAX_SHARE_CALM), 9);
    expect(rCalm).toBeLessThan(rPlain);
    expect(share(plain, rPlain)).toBeGreaterThan(ORB_MAX_SHARE_CALM * 1.5); // the plain orb is the size it was
    calm.dispose();
    plain.dispose();
  });

  it('holds the Blast\'s core still under the row and lets it shimmer without it', () => {
    const readBand = (calm: boolean): number[] => {
      const fx = new MoveFx(calm ? { calm: () => true } : {});
      fx.start('blast', chest, girls, 1.5);
      const mat = (fx.group.children[0] as Mesh).material as ShaderMaterial;
      const seen: number[] = [];
      for (let i = 0; i < 60; i++) {
        fx.update(0.03);
        seen.push((mat.uniforms['uBands']!.value as Vector3).x);
      }
      fx.dispose();
      return seen;
    };
    expect(new Set(readBand(true))).toEqual(new Set([ORB_BANDS.core]));
    expect(new Set(readBand(false)).size).toBeGreaterThan(10);
  });

  it('holds the Ray\'s width still after the blow under the row and lets it shimmer without it', () => {
    const widths = (calm: boolean): number[] => {
      const fx = new MoveFx(calm ? { calm: () => true } : {});
      fx.start('ray', chest, [girls[0]!], 0.6);
      const sleeve = fx.group.children[1] as Mesh; // the muzzle first, then this girl's sleeve and core
      const seen: number[] = [];
      for (let i = 0; i < 45; i++) {
        fx.update(0.02);
        if ((i + 1) * 0.02 >= 0.62) seen.push(sleeve.scale.x); // the beam is open from the blow at 0.6 s
      }
      fx.dispose();
      return seen;
    };
    const still = widths(true);
    expect(still.length).toBeGreaterThan(0);
    expect(new Set(still.map((w) => w.toFixed(9))).size).toBe(1);
    expect(new Set(widths(false).map((w) => w.toFixed(9))).size).toBeGreaterThan(1);
  });

  it('asks the row every frame, so turning it on mid-move calms the orb that is already up', () => {
    let on = false;
    const fx = new MoveFx({ calm: () => on });
    fx.start('blast', chest, girls, 1.5);
    fx.update(1.5);
    const orb = fx.group.children[0] as Mesh;
    const cam = lens();
    const before = draw(orb, cam);
    on = true;
    fx.update(0.016);
    expect(draw(orb, cam)).toBeLessThan(before);
    fx.dispose();
  });
});
