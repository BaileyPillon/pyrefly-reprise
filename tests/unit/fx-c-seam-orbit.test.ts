/**
 * PR-0300 (round 18b): at a chain seam, eye-candy C's victory arc of the link just won stayed on the
 * camera (12 degrees of yaw, a rise and a push about the old party centre), so the next link's
 * opening framed the scene yawed and Chapter XV showed the floor plate's right edge with black
 * beyond it. The opening now lets go of the arc (`fxOpening`, called by `playOpening`).
 *
 * Game case: both (shared presenter plumbing and option C; observed in FFX-2 Chapter XV).
 */

import { PerspectiveCamera, Scene, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { SpectacleFx, type SpectacleDeps } from '../../src/engine/fx/c/SpectacleFx.ts';
import { SpectaclePass } from '../../src/engine/fx/c/SpectaclePass.ts';
import { fxOpening } from '../../src/engine/fx/c/presenterHooks.ts';
import { playOpening } from '../../src/engine/OpeningSkip.ts';

const RIG = new Vector3(0, 2.4, 9);

function rig(): { fx: SpectacleFx; camera: PerspectiveCamera; frame: (ms: number) => void } {
  const camera = new PerspectiveCamera(40, 16 / 9, 0.1, 200);
  const party = ['yuna', 'rikku', 'paine'].map((id, i) => ({ id, position: new Vector3(-2 + i, 0, 1), visible: true, flash: () => {}, headPoint: (v: Vector3) => v.set(-2 + i, 1.6, 1) }));
  const deps: SpectacleDeps = {
    game: 'ffx2',
    scene: new Scene(),
    camera,
    stage: {
      actor: (id) => party.find((a) => a.id === id) as never,
      staged: () => party.map((a) => a.id),
      sideOf: () => 'party',
      snapshot: () => [],
    },
    pass: new SpectaclePass(),
    enabled: () => true,
    flags: () => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1 }),
    dial: () => 1,
    sub: () => true,
    splash: null,
    splashArt: () => null,
    view: () => ({ w: 1600, h: 900, dpr: 1 }),
  };
  const fx = new SpectacleFx(deps);
  // The scene places the camera on its rig every frame; C applies its arc on top (`update`).
  const frame = (ms: number): void => {
    camera.position.copy(RIG);
    camera.quaternion.identity();
    fx.stageDt(ms / 1000);
    fx.update(ms / 1000);
  };
  return { fx, camera, frame };
}

describe('PR-0300: the victory arc does not outlive its link', () => {
  it('without the opening call, the arc is still held on the camera long after the victory (the bug)', () => {
    const { fx, camera, frame } = rig();
    expect(fx.victory('pose')).toBeGreaterThan(0);
    for (let i = 0; i < 300; i++) frame(16); // 4.8 s: the next link's opening is under way by now
    expect(camera.position.distanceTo(RIG)).toBeGreaterThan(0.2);
  });

  it('the next opening lets go of it: the camera is back on its rig from the first frame', () => {
    const { fx, camera, frame } = rig();
    fx.victory('pose');
    for (let i = 0; i < 200; i++) frame(16);
    fx.opening();
    frame(16);
    expect(camera.position.distanceTo(RIG)).toBeLessThan(1e-9);
    expect(camera.quaternion.w).toBeCloseTo(1, 9);
    expect(fx.snapshot()['orbit']).toBeNull();
  });
});

describe('fxOpening and playOpening', () => {
  it('reaches the port even with option C switched off, and is a no-op without one', () => {
    const calls: string[] = [];
    fxOpening({ stage: { fx: { enabled: () => false, opening: () => calls.push('opening') } } } as unknown as EventCtx);
    expect(calls).toEqual(['opening']);
    expect(() => fxOpening({ stage: {} } as unknown as EventCtx)).not.toThrow();
  });

  it('the opening moment lets go of the arc before its first shot, at any speed', async () => {
    for (const speed of ['normal', 'skip'] as const) {
      const calls: string[] = [];
      const ctx = {
        speed: () => speed,
        moments: { hurry: false, pick: () => 'idle' },
        stage: { fx: { enabled: () => true, opening: () => calls.push('opening') }, camera: { snapTo: () => {} } },
        deps: { moments: { confirmPress: () => ({ pressed: new Promise<void>(() => {}), dispose: () => {} }), clear: () => {} } },
      } as unknown as EventCtx;
      await playOpening(ctx, async () => void calls.push('battle-start'));
      expect(calls).toEqual(['opening', 'battle-start']);
    }
  });
});
