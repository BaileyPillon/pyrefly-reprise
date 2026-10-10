/**
 * r3942-stage wave 2 repair, FFX-2 only in effect (the verifier's finding of 2026-10-08): every rig CHAPTER FRAMING registers is "the rig going on", not a scene's own new camera.
 *
 * `RigWatch.install` (the master and the close rigs it re-authors from it, today's rigs put back when CHAPTER FRAMING is off) and `dispose` pass `continues` to `addRig`, which is what keeps a giant's phone
 * fit tied to its link through CHAPTER FRAMING's plans (`FrameFit.LinkFits`, `frame-fit-link.test.ts`). A camera whose `addRig` takes two arguments (every fake in the older tests) is unaffected.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { RigWatch, type BattleCameraLike } from '../../src/engine/fx/mix/rigWatch.ts';
import type { Pose } from '../../src/engine/fx/mix/geometry.ts';

type Shape = { position: number[] | Vector3; lookAt: number[] | Vector3; fov?: number; sway?: number };

function fake(): { bc: BattleCameraLike; calls: Array<{ name: string; continues: unknown }>; rigs: Map<string, Shape> } {
  const rigs = new Map<string, Shape>([
    ['idle', { position: [0, 2, 10], lookAt: [0, 1, 0], fov: 30 }],
    ['party', { position: [-3, 2, 8], lookAt: [0, 1, 0] }],
    ['enemy', { position: [3, 2, 8], lookAt: [0, 1, 0] }],
    ['action', { position: [0, 3, 7], lookAt: [0, 1, 0] }],
    ['victory', { position: [0, 1, 6], lookAt: [0, 1, 0] }],
  ]);
  const calls: Array<{ name: string; continues: unknown }> = [];
  // moveTo and snapTo on the prototype, as BattleCamera has them: RigWatch wraps them on the instance and `dispose` deletes its wrappers
  class Cam {
    camera = new PerspectiveCamera(30, 16 / 9); rigName = 'idle'; rigNames = [...rigs.keys()]; pushAmount = 0; tweens = { size: 0 };
    getRig(n: string): Shape | undefined { return rigs.get(n); }
    addRig(n: string, r: Shape, continues?: boolean): void { calls.push({ name: n, continues }); rigs.set(n, r); }
    async moveTo(): Promise<void> {}
    snapTo(): void {}
  }
  return { bc: new Cam() as never as BattleCameraLike, calls, rigs };
}
const master = (): Pose => ({ pos: new Vector3(0, 3, 14), look: new Vector3(0, 1.5, 0), fov: 32 });

describe('CHAPTER FRAMING registers its rigs as the rig going on', () => {
  it('install: the master and the re-authored close rigs, and every other rig it re-registers, are continuations', () => {
    const { bc, calls } = fake();
    const rw = new RigWatch(bc, new PerspectiveCamera(30, 16 / 9));
    rw.install(master(), true);
    expect(calls.map((c) => c.name).sort()).toEqual(['action', 'enemy', 'idle', 'party', 'victory']);
    expect(calls.every((c) => c.continues === true)).toBe(true);
  });

  it('install with CHAPTER FRAMING off puts today\'s rigs back as continuations too', () => {
    const { bc, calls } = fake();
    const rw = new RigWatch(bc, new PerspectiveCamera(30, 16 / 9));
    rw.install(master(), true);
    calls.length = 0;
    rw.install(master(), false);
    expect(calls.length).toBe(5);
    expect(calls.every((c) => c.continues === true)).toBe(true);
  });

  it('a giant\'s camera leaves the close rigs as the scene authored them, and still registers them as continuations', () => {
    const { bc, calls } = fake();
    const rw = new RigWatch(bc, new PerspectiveCamera(30, 16 / 9));
    rw.install(master(), true, false);
    expect(calls.length).toBe(5);
    expect(calls.every((c) => c.continues === true)).toBe(true);
  });

  it('dispose puts today\'s rigs back as continuations', () => {
    const { bc, calls } = fake();
    const rw = new RigWatch(bc, new PerspectiveCamera(30, 16 / 9));
    rw.install(master(), true);
    calls.length = 0;
    rw.dispose();
    expect(calls.map((c) => c.name).sort()).toEqual(['action', 'enemy', 'idle', 'party', 'victory']);
    expect(calls.every((c) => c.continues === true)).toBe(true);
  });

  it('a camera whose addRig takes two arguments still works: the flag is simply not read', () => {
    const rigs = new Map<string, Shape>([['idle', { position: [0, 2, 10], lookAt: [0, 1, 0], fov: 30 }]]);
    class Cam {
      camera = new PerspectiveCamera(30, 16 / 9); rigName = 'idle'; rigNames = ['idle']; pushAmount = 0; tweens = { size: 0 };
      getRig(n: string): Shape | undefined { return rigs.get(n); }
      addRig(n: string, r: Shape): void { rigs.set(n, r); }
      async moveTo(): Promise<void> {}
      snapTo(): void {}
    }
    const bc = new Cam();
    const rw = new RigWatch(bc as never as BattleCameraLike, bc.camera);
    rw.install(master(), true);
    expect((rigs.get('idle')!.position as Vector3).z).toBe(14);
    rw.dispose();
  });
});
