/**
 * r392-motion: `frameFit` and `rigPose` can measure a rig through the live camera's view offset, the lens shift CHAPTER FRAMING puts on the picture (`fx/mix/framing.ts`:
 * `setViewOffset`; Chapter IV's master shifts it 64 px left and 36 px up at 1600x900). Off by default, so every measure made before is the same, to the digit.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { frameFit, insideFraction, rigPose, type FitSubject } from '../../src/engine/FrameFit.ts';

/** A 1 x 2 upright figure centred at (x, 1, z), facing +z. */
function figure(x: number, z = 0): FitSubject['actor'] {
  return {
    contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]) {
      const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
      q[0].set(x - 0.5, 0, z);
      q[1].set(x + 0.5, 0, z);
      q[2].set(x + 0.5, 2, z);
      q[3].set(x - 0.5, 2, z);
      return q;
    },
  };
}

const rig = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };

/** The live camera, 1600x900, with the lens shift CHAPTER FRAMING applies (`setViewOffset(W, H, -lens[0], -lens[1], W, H)`), or none. */
function liveCamera(lens: [number, number] | null): PerspectiveCamera {
  const cam = new PerspectiveCamera(40, 16 / 9, 0.1, 200);
  if (lens) cam.setViewOffset(1600, 900, -lens[0], -lens[1], 1600, 900);
  return cam;
}

// Half-width of the frame at z=0 from z=10 is tan(20deg) x 10 x 16/9 = 6.47 units: 800 px, so 123.7 px a unit.
const EDGE = figure(-5.8); // its left edge is 0.17 of a unit (21 px) inside the frame without a lens shift

describe('the lens shift in the measure', () => {
  it('is not read unless asked for: the same share, push and verdict as before, whatever view the live camera holds', () => {
    const plain = liveCamera(null);
    const shifted = liveCamera([-64, -36]);
    expect(insideFraction(shifted, rig, 0, EDGE)).toBe(insideFraction(plain, rig, 0, EDGE));
    expect(frameFit(shifted, rig, 0.1, [{ actor: EDGE, min: 1 }])).toEqual(frameFit(plain, rig, 0.1, [{ actor: EDGE, min: 1 }]));
    expect(frameFit(shifted, rig, 0.1, [{ actor: EDGE, min: 1 }], false)).toEqual(frameFit(plain, rig, 0.1, [{ actor: EDGE, min: 1 }]));
  });

  it('is the same measure when the live camera holds no lens shift, with or without asking', () => {
    const plain = liveCamera(null);
    expect(frameFit(plain, rig, 0.1, [{ actor: EDGE, min: 1 }], true)).toEqual(frameFit(plain, rig, 0.1, [{ actor: EDGE, min: 1 }]));
  });

  it('through the lens a figure the shift carries off the left edge is cut at rest, where the plain measure keeps her whole (Yuna at the played rig)', () => {
    const shifted = liveCamera([-64, -36]); // the picture moves 64 px left: 0.52 of a unit
    const subject = [{ actor: EDGE, min: 1, floor: 0.97 }];
    expect(frameFit(shifted, rig, 0, subject).fits).toBe(true);
    expect(frameFit(shifted, rig, 0, subject).worst).toBeCloseTo(1, 6);
    const lensed = frameFit(shifted, rig, 0, subject, true);
    expect(lensed.fits).toBe(false);
    expect(lensed.worst).toBeLessThan(0.97);
    expect(lensed.worst).toBeGreaterThan(0.5); // her edge is 64 - 21 = 43 px out of a 124 px quad
  });

  it('through the lens the largest push is the one the shifted frame allows: less than the plain measure, and the figure it keeps is whole there', () => {
    const shifted = liveCamera([-64, -36]);
    const inside = figure(-4.9); // 1.1 units (136 px) inside at rest: the 64 px shift leaves 72 px of room
    const subject = [{ actor: inside, min: 1, floor: 0.97 }];
    const plain = frameFit(shifted, rig, 0.3, subject);
    const lensed = frameFit(shifted, rig, 0.3, subject, true);
    expect(lensed.fits).toBe(true);
    expect(lensed.push).toBeGreaterThan(0);
    expect(lensed.push).toBeLessThan(plain.push);
    // posed at that push through the lens, nothing of her is outside
    const cam = rigPose(new PerspectiveCamera(), shifted, rig, lensed.push, true);
    const q = inside.contentQuad!();
    const xs = q.map((v) => v.clone().project(cam).x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-1 - 1e-3);
  });

  it('rigPose carries the lens only when asked, and a scratch camera that carried one once is cleared by a plain pose', () => {
    const shifted = liveCamera([-64, -36]);
    const scratch = new PerspectiveCamera();
    rigPose(scratch, shifted, rig, 0, true);
    expect(scratch.view?.enabled).toBe(true);
    expect(scratch.view?.offsetX).toBe(64);
    expect(scratch.view?.offsetY).toBe(36);
    rigPose(scratch, shifted, rig, 0);
    expect(scratch.view?.enabled ?? false).toBe(false);
    // asked for, with no lens on the live camera, there is none to carry
    rigPose(scratch, liveCamera(null), rig, 0, true);
    expect(scratch.view?.enabled ?? false).toBe(false);
  });
});
