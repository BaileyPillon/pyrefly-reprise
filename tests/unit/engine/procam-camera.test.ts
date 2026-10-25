/**
 * The PRO CAMERA's hook in `BattleCamera` (lane "pro-camera", `?camera=pro`): with no layer the camera draws exactly as it did; with a layer that answers null it draws exactly as it did; with a
 * run on the layer it draws the run's pose (eye, aim, lens, roll), keeps the game's own punch and roll on top, gives the rig's lens back when the run ends, and never moves the pose the HUD
 * lays itself out against (`restCamera`).
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera } from 'three';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import type { Pose, ProRun } from '../../../src/engine/procam/ProTypes.ts';

const RIGS = {
  idle: { position: [0, 3.05, 9.5] as [number, number, number], lookAt: [0.15, 1.35, -1.2] as [number, number, number], fov: 32 },
  party: { position: [-1.6, 2.2, 6.5] as [number, number, number], lookAt: [-2.5, 1.15, 0.45] as [number, number, number], fov: 28 },
};

function make(): { bc: BattleCamera; cam: PerspectiveCamera } {
  const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 200);
  const bc = new BattleCamera(cam, { rigs: RIGS, initial: 'idle', swayAmplitude: 0 });
  return { bc, cam };
}

const shot: Pose = { pos: [-3, 1.4, 4], look: [-2.2, 1.3, 0.2], fov: 44, roll: 3 };
const run = (over: Partial<ProRun> = {}): ProRun => ({ id: 't', inMs: 0, inEase: 'linear', outMs: 0, outEase: 'linear', sample: () => shot, sway: 0, ...over });

const snap = (cam: PerspectiveCamera): number[] => [cam.position.x, cam.position.y, cam.position.z, cam.fov, ...cam.quaternion.toArray()];

describe('BattleCamera with the directed layer', () => {
  it('with no layer the camera sits on its rig', () => {
    const { bc, cam } = make();
    bc.update(0.016);
    expect(cam.position.toArray()).toEqual([0, 3.05, 9.5]);
    expect(cam.fov).toBe(32);
  });

  it('a layer that answers null changes nothing, frame for frame, through moves, punches and shakes', () => {
    const a = make();
    const b = make();
    void b.bc.pro; // the layer exists, with nothing to play
    const seq = (bc: BattleCamera, cam: PerspectiveCamera): number[][] => {
      const out: number[][] = [];
      void bc.moveTo('party', 400);
      for (let i = 0; i < 40; i++) {
        if (i === 10) void bc.punch(0.1, 200);
        if (i === 20) bc.setRoll(-4);
        bc.update(1 / 60);
        out.push(snap(cam));
      }
      return out;
    };
    expect(seq(b.bc, b.cam)).toEqual(seq(a.bc, a.cam));
  });

  it('a run is drawn: the eye, the aim, the lens and the roll', () => {
    const { bc, cam } = make();
    bc.pro.play(run());
    bc.update(0.016);
    expect(cam.position.toArray()).toEqual(shot.pos);
    expect(cam.fov).toBe(44);
    const ref = new PerspectiveCamera(44, 16 / 9, 0.1, 200);
    ref.position.set(...shot.pos);
    ref.lookAt(...shot.look);
    ref.rotateZ((3 * Math.PI) / 180);
    expect(cam.quaternion.angleTo(ref.quaternion)).toBeLessThan(1e-6);
  });

  it('the game\'s own punch and roll ride on top of the run', () => {
    const { bc, cam } = make();
    bc.pro.play(run());
    bc.update(0.016);
    const plain = cam.position.clone();
    void bc.punch(0.2, 400);
    for (let i = 0; i < 12; i++) bc.update(1 / 60);
    expect(cam.position.distanceTo(plain)).toBeGreaterThan(0.05);
    bc.setRoll(-4);
    bc.update(0.016);
    const ref = new PerspectiveCamera(44, 16 / 9, 0.1, 200);
    ref.position.copy(cam.position);
    ref.lookAt(-2.2, 1.3, 0.2);
    expect(cam.quaternion.angleTo(ref.quaternion)).toBeCloseTo((1 * Math.PI) / 180, 3); // the game's -4 and the shot's +3 degrees: one degree off the plain look
  });

  it('when the run ends the rig\'s lens and place come back', () => {
    const { bc, cam } = make();
    bc.pro.play(run());
    bc.update(0.016);
    bc.pro.stop(0);
    bc.update(0.016);
    expect(cam.fov).toBe(32);
    expect(cam.position.toArray()).toEqual([0, 3.05, 9.5]);
  });

  it('a rig move made while a run plays is where the camera lands when it ends, lens included', () => {
    const { bc, cam } = make();
    bc.pro.play(run());
    void bc.moveTo('party', 200);
    for (let i = 0; i < 30; i++) bc.update(1 / 60);
    expect(cam.fov).toBe(44); // still the run's
    bc.pro.stop(0);
    bc.update(0.016);
    expect(cam.fov).toBeCloseTo(28, 4);
    expect(cam.position.x).toBeCloseTo(-1.6, 3);
  });

  it('the pose the HUD lays itself out against is the rig\'s, whatever the run does', () => {
    const { bc } = make();
    const before = bc.restCamera().position.toArray();
    bc.pro.play(run());
    bc.update(0.016);
    expect(bc.restCamera().position.toArray()).toEqual(before);
    expect(bc.restCamera().fov).toBe(32);
  });

  it('keeps the idle sway at the run\'s share', () => {
    const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 200);
    const bc = new BattleCamera(cam, { rigs: RIGS, initial: 'idle', swayAmplitude: 0.2 });
    bc.pro.play(run({ sway: 0 }));
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      bc.update(0.1);
      seen.add(cam.position.x.toFixed(5));
    }
    expect(seen.size).toBe(1); // no sway at all
  });
});
