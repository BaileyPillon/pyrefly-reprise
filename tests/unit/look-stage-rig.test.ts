import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { QuadField } from '../../src/engine/fx/b/QuadField.ts';
import { LookStage } from '../../src/engine/look/stage/LookStage.ts';
import { ROOM_STAGE, stageSwitchedOff } from '../../src/engine/look/stage/StageConfig.ts';
import { stageWind } from '../../src/engine/look/stage/StageWind.ts';
import type { LookRoom } from '../../src/engine/look/LookRoom.ts';

/** A scene with the painting plane the way `Backdrop.create` lays it for Mt. Gagazet: 82 wide, 46.9 tall, centred 10.7 below the floor, 48 behind it. */
function gagazetScene(): Scene {
  const scene = new Scene();
  const painting = new Mesh(new PlaneGeometry(82, 46.9), new MeshBasicMaterial());
  painting.name = 'backdrop-painting';
  painting.position.set(0, -10.7, -48);
  scene.add(painting);
  return scene;
}

const room = (key: string, game: 'ffx' | 'ffx2' = 'ffx'): LookRoom => ({ key, game }) as unknown as LookRoom;
const frame = (scene: Scene, key: string, time: number, quality: 'high' | 'medium' | 'low' = 'high', tweaks: Record<string, number> = {}, game: 'ffx' | 'ffx2' = 'ffx') => ({ scene, room: room(key, game), quality, time, tweak: (k: string, d: number) => tweaks[k] ?? d });

describe('depth stage: the object', () => {
  it('builds nothing for a room with no recipe and leaves the wind calm', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    expect(stage.update(frame(scene, 'bevelle-underground', 4, 'high', {}, 'ffx2'))).toBe(false);
    expect(scene.getObjectByName('look-stage')).toBeUndefined();
    expect(stageWind).toEqual({ gust: 0, speed: 1, thicken: 1, shaft: 1, density: 1 });
  });

  it('builds the glitter sheet under the figures, puts the moon on the painting and writes the wind', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    expect(stage.update(frame(scene, 'gagazet', 5))).toBe(true);
    const sheet = scene.getObjectByName('look-stage-glint') as Mesh;
    expect(sheet).toBeDefined();
    expect(sheet.renderOrder).toBeLessThan(0); // under the figures (they draw at 0)
    expect(sheet.position.y).toBeGreaterThan(0);
    expect(sheet.position.y).toBeLessThan(0.1);
    // the moon: left of centre and above the floor, on the painting's plane
    const moon = new Vector3(...(stage.stats.moon as [number, number, number]));
    expect(moon.z).toBeCloseTo(-48, 0);
    expect(moon.x).toBeLessThan(-15);
    expect(moon.y).toBeGreaterThan(3);
    expect(stage.stats.glint).toBe(true);
    // the wind is on the shared cell for the weather to read
    expect(stageWind.speed).toBeGreaterThanOrEqual(1);
    expect(stageWind.thicken).toBeGreaterThanOrEqual(1);
    expect(stageWind.gust).toBeCloseTo(stage.stats.gust, 2);
    stage.off();
    expect(scene.getObjectByName('look-stage')).toBeUndefined();
    expect(stageWind).toEqual({ gust: 0, speed: 1, thicken: 1, shaft: 1, density: 1 });
  });

  it('the wind peaks above calm at some moment of a minute and the clock speeds with it', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    let top = 0;
    let fastest = 1;
    for (let t = 0; t < 60; t += 0.25) {
      stage.update(frame(scene, 'gagazet', t));
      top = Math.max(top, stageWind.gust);
      fastest = Math.max(fastest, stageWind.speed);
    }
    expect(top).toBeGreaterThan(0.85);
    expect(fastest).toBeGreaterThan(1 + ROOM_STAGE['gagazet']!.wind.speedUp * 0.8);
    stage.off();
  });

  it('the low tier takes the glitter away and weakens the wind', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    stage.update(frame(scene, 'gagazet', 5, 'low'));
    expect(stage.stats.glint).toBe(false);
    const sheet = scene.getObjectByName('look-stage-glint') as Mesh;
    expect(sheet.visible).toBe(false);
    stage.off();
  });

  it('LOW EFFECTS and REDUCE MOTION: no glitter on the low tier, and no surge of wind while the weather holds still', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    eyeCandy.setTier('low');
    stage.update(frame(scene, 'gagazet', 5));
    expect(stage.stats.glint).toBe(false);
    eyeCandy.setTier(null);
    stage.update(frame(scene, 'gagazet', 5));
    expect(stage.stats.glint).toBe(true);
    const was = eyeCandy.env;
    eyeCandy.env = () => ({ ...was(), reduceMotion: true });
    stage.update(frame(scene, 'gagazet', 5));
    expect(stageWind).toEqual({ gust: 0, speed: 1, thicken: 1, shaft: 1, density: 1 });
    eyeCandy.env = was;
    stage.off();
  });

  it('a live tweak scales or removes the effects (stage.glint 0, stage.wind 0)', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    stage.update(frame(scene, 'gagazet', 5, 'high', { 'stage.glint': 0, 'stage.wind': 0 }));
    expect(stage.stats.glint).toBe(false);
    expect(stageWind.speed).toBe(1);
    expect(stageWind.thicken).toBe(1);
    stage.off();
  });

  it('the mist banks: two on the high tier, the nearer one only on the low tier, gone when the weather dial is off or a tweak says so', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    const visible = (): number => scene.getObjectByName('look-stage')!.children.filter((c) => c.name === 'look-stage-mist' && c.visible).length;
    stage.update(frame(scene, 'gagazet', 5, 'high'));
    expect(visible()).toBe(2);
    expect(stage.stats.mist).toBe(2);
    stage.update(frame(scene, 'gagazet', 5, 'medium'));
    expect(visible()).toBe(2); // 70 percent of two sheets rounds up to two
    stage.update(frame(scene, 'gagazet', 5, 'low'));
    expect(visible()).toBe(1);
    // the sheet kept is the nearer one (the last in the recipe: it crosses the fighters' feet)
    const kept = scene.getObjectByName('look-stage')!.children.filter((c) => c.name === 'look-stage-mist' && c.visible)[0]!;
    expect(kept.position.z).toBeGreaterThan(0);
    stage.update(frame(scene, 'gagazet', 5, 'high', { 'stage.mist': 0 }));
    expect(visible()).toBe(0);
    eyeCandy.setTier('low'); // LOW EFFECTS: option B has no haze there, and neither has the stage
    stage.update(frame(scene, 'gagazet', 5, 'high'));
    expect(visible()).toBe(0);
    eyeCandy.setTier(null);
    stage.update(frame(scene, 'gagazet', 5, 'high'));
    expect(visible()).toBe(2);
    stage.off();
    expect(scene.getObjectByName('look-stage')).toBeUndefined();
  });

  it('stage.t0 restarts the stage clock, so a capture lands its gusts on the same seconds every take', () => {
    const scene = gagazetScene();
    const a = new LookStage();
    const b = new LookStage();
    // two takes whose look clocks differ (the page had run 7 and 19 seconds when the recording began) restart to the same stage time and see the same wind
    const tweaksA = { 'stage.t0': 24 };
    a.update(frame(scene, 'gagazet', 7, 'high', tweaksA));
    const seenA: number[] = [];
    for (let i = 1; i <= 60; i++) {
      a.update(frame(scene, 'gagazet', 7 + i / 6, 'high', tweaksA));
      seenA.push(a.stats.gust);
    }
    a.off();
    const scene2 = gagazetScene();
    b.update(frame(scene2, 'gagazet', 19, 'high', tweaksA));
    const seenB: number[] = [];
    for (let i = 1; i <= 60; i++) {
      b.update(frame(scene2, 'gagazet', 19 + i / 6, 'high', tweaksA));
      seenB.push(b.stats.gust);
    }
    b.off();
    expect(seenB).toEqual(seenA);
    expect(Math.max(...seenA)).toBeGreaterThan(0.8); // t0 24 puts a strong gust about 6 seconds in (the curve peaks at 30)
    expect(a.stats.t).toBeGreaterThanOrEqual(0);
  });

  it('the quality tiers put the weather density on the shared cell, and the flakes and sheets follow it', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    stage.update(frame(scene, 'gagazet', 5, 'medium'));
    expect(stageWind.density).toBe(0.7);
    stage.update(frame(scene, 'gagazet', 5, 'low'));
    expect(stageWind.density).toBe(0.45);
    stage.update(frame(scene, 'gagazet', 5, 'high', { 'stage.density': 0.2 }));
    expect(stageWind.density).toBe(0.2); // a live override
    stage.update(frame(scene, 'gagazet', 5, 'high'));
    expect(stageWind.density).toBe(1);
    stage.off();
    expect(stageWind.density).toBe(1);
    // option B's quad field draws that share of its quads, never fewer than one, and a share of 1 touches nothing
    const field = new QuadField({ shape: 'flake', count: 200, min: [0, 0, 0], size: [1, 1, 1], vel: [0, 0, 0], scale: [0.1, 0.2], color: 0xffffff, opacity: 1 });
    const geo = field.mesh.geometry as unknown as { instanceCount: number };
    expect(geo.instanceCount).toBe(200);
    field.setDensity(0.45);
    expect(geo.instanceCount).toBe(90);
    field.setDensity(0);
    expect(geo.instanceCount).toBe(1);
    field.setDensity(1);
    expect(geo.instanceCount).toBe(200);
    field.setDensity(7);
    expect(geo.instanceCount).toBe(200);
    field.dispose();
  });

  it('a room the other game owns is left alone', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    expect(stage.update(frame(scene, 'gagazet', 5, 'high', {}, 'ffx2'))).toBe(false); // the recipe is FFX only
    expect(scene.getObjectByName('look-stage')).toBeUndefined();
  });

  it('prepare builds ahead of the first frame, and a second prepare of the same room builds nothing twice', () => {
    const scene = gagazetScene();
    const stage = new LookStage();
    stage.prepare(scene, 'gagazet');
    stage.prepare(scene, 'gagazet');
    expect(scene.children.filter((c) => c.name === 'look-stage')).toHaveLength(1);
    const parts = (scene.getObjectByName('look-stage') as Mesh).children.map((c) => c.name).sort();
    expect(parts).toEqual(['look-stage-glint', 'look-stage-mist', 'look-stage-mist']); // the glitter sheet and the recipe's two mist banks
    stage.dispose();
    expect(scene.getObjectByName('look-stage')).toBeUndefined();
  });

  it('`?stage=off` reads from an address', () => {
    expect(stageSwitchedOff('?stage=off')).toBe(true);
    expect(stageSwitchedOff('?look=hd2d&stage=OFF')).toBe(true);
    expect(stageSwitchedOff('?stage=on')).toBe(false);
    expect(stageSwitchedOff('')).toBe(false);
  });
});
