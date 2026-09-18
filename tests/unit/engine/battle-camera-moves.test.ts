/**
 * The camera moves a *moment* is built from.
 *
 * Two things here are easy to break and invisible in a still: a held `push`
 * must survive the rig change that happens at the same time (a moment cuts and
 * dollies together), and `roll` must be applied *after* `lookAt`, which rebuilds
 * the whole orientation from the up vector and throws away anything set before
 * it.
 */

import { describe, expect, it } from 'vitest';
import { PerspectiveCamera } from 'three';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';

function makeCamera(): BattleCamera {
  return new BattleCamera(new PerspectiveCamera(32, 16 / 9, 0.1, 100), {
    rigs: {
      idle: { position: [0, 2, 8], lookAt: [0, 1.5, 0] },
      enemy: { position: [1, 2.2, 7], lookAt: [2, 2, -2] },
    },
    initial: 'idle',
    swayAmplitude: 0,
  });
}

/** Run `ms` of camera time in 16 ms steps, as the game loop would. */
function run(cam: BattleCamera, ms: number): void {
  for (let t = 0; t < ms; t += 16) cam.update(0.016);
}

describe('roll', () => {
  it('survives lookAt — the frame actually tilts', () => {
    const cam = makeCamera();
    cam.update(0.016);
    const level = cam.camera.rotation.z;

    cam.setRoll(-4);
    cam.update(0.016);
    expect(cam.camera.rotation.z).not.toBeCloseTo(level, 4);
    expect(cam.rollDeg).toBeCloseTo(-4);
  });

  it('kicks over and falls back level on its own', async () => {
    const cam = makeCamera();
    const done = cam.roll(-4, 320);
    run(cam, 120);
    expect(Math.abs(cam.rollDeg)).toBeGreaterThan(1);
    run(cam, 400);
    await done;
    expect(cam.rollDeg).toBeCloseTo(0, 3);
  });

  it('a rig change does not freeze a roll half-tilted', async () => {
    const cam = makeCamera();
    void cam.roll(-6, 300);
    run(cam, 60);
    void cam.moveTo('enemy', 200); // kills the rig tween group, not the fx group
    run(cam, 500);
    expect(cam.rollDeg).toBeCloseTo(0, 3);
  });
});

describe('moveTo', () => {
  it('resolves when the move completes', async () => {
    const cam = makeCamera();
    const done = cam.moveTo('enemy', 200);
    run(cam, 300);
    await done;
    expect(cam.rigName).toBe('enemy');
  });

  // A moment awaits its rig change (`BattleMoments.move`), and the very next
  // beat can cut somewhere else. `TweenGroup.killAll` drops a tween without
  // firing `onComplete`, so a superseded move has to settle its own promise or
  // the whole battle hangs on that await.
  it('settles a superseded move instead of hanging the caller', async () => {
    const cam = makeCamera();
    const first = cam.moveTo('enemy', 4000);
    run(cam, 32);
    cam.snapTo('idle');
    await first; // would time out if the promise were abandoned
    expect(cam.rigName).toBe('idle');

    const second = cam.moveTo('enemy', 4000);
    run(cam, 32);
    void cam.moveTo('idle', 200);
    await second;
    run(cam, 300);
    expect(cam.rigName).toBe('idle');
  });
});

describe('push and release', () => {
  it('holds the dolly in instead of easing straight back out', async () => {
    const cam = makeCamera();
    const done = cam.push(0.12, 200);
    run(cam, 300);
    await done;
    expect(cam.pushAmount).toBeCloseTo(0.12, 3);

    // ...and is still held a second later. A `punch` would be back at 0.
    run(cam, 1000);
    expect(cam.pushAmount).toBeCloseTo(0.12, 3);
  });

  it('survives the rig change a moment makes at the same time', async () => {
    const cam = makeCamera();
    void cam.push(0.14, 200);
    run(cam, 120);
    void cam.moveTo('enemy', 400);
    run(cam, 500);
    expect(cam.pushAmount).toBeCloseTo(0.14, 3);
  });

  it('release eases the dolly and the roll back to neutral together', async () => {
    const cam = makeCamera();
    const pushed = cam.push(0.14, 200);
    run(cam, 260);
    await pushed;
    cam.setRoll(-5);
    const done = cam.release(200);
    run(cam, 400);
    await done;
    expect(cam.pushAmount).toBeCloseTo(0, 3);
    expect(cam.rollDeg).toBeCloseTo(0, 3);
  });

  it('release is a no-op when nothing is held', async () => {
    const cam = makeCamera();
    await cam.release(200);
    expect(cam.pushAmount).toBe(0);
  });

  it('pushes the camera along its own view vector, never the FOV', () => {
    const cam = makeCamera();
    const fov = cam.camera.fov;
    const before = cam.camera.position.clone();
    cam.push(0.2, 100);
    run(cam, 200);
    // Visual-bible §6.3: the texel ratio has to stay put, so a push is a dolly.
    expect(cam.camera.fov).toBe(fov);
    expect(cam.camera.position.distanceTo(before)).toBeGreaterThan(0.5);
  });
});
