/**
 * **Playing a shot's keyframes** (`src/engine/ffxcam/shotTrack.ts`, the data's shapes in `src/data/ffx/camera/shotTypes.ts`; FFX only). The website's table director and the table builder both go through
 * `poseAt`, so what this file pins is what a fitted shot plays back as:
 *
 * 1. **A cut** holds the previous key until its own step and then jumps; **a linear blend** is a straight line in every channel; **a cosine blend** starts and ends at rest.
 * 2. **A trapezoid** is the game's accelerated move (the stepper's own arithmetic on a unit distance): it lands exactly on the key and is the same curve for every channel.
 * 3. **The lens, not the angle, is blended** (the game blends the lens value): the field of view in between is not the mean of the two angles. The roll is in degrees in the data and radians in the pose.
 * 4. **Before the first key and after the last** the nearest key holds; a single key is a hard cut with nothing after it.
 *
 * Numbers are made up. Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import type { ShotDef, ShotKey } from '../../src/data/ffx/camera/shotTypes.ts';
import { lastPose, poseAt, progress } from '../../src/engine/ffxcam/shotTrack.ts';
import { stepAxis, type MoveRecord } from '../../src/engine/ffxcam/stepper.ts';

const key = (step: number, x: number, shape: ShotKey[5], opts: { roll?: number; lens?: number } = {}): ShotKey => [step, [x, -50, 100], [0, -40, 0], opts.roll ?? 0, opts.lens ?? 1024, shape];
const shot = (...keys: ShotKey[]): ShotDef => ({ kind: 'action', len: keys[keys.length - 1]![0], keys });

describe('progress', () => {
  it('is 0 before a blend begins and 1 once it has run, whatever the shape', () => {
    for (const s of [1, 2, [3, 10, 5, 10, 0]] as const) {
      expect(progress(s, 0, 25)).toBe(0);
      expect(progress(s, -3, 25)).toBe(0);
      expect(progress(s, 25, 25)).toBe(1);
      expect(progress(s, 40, 25)).toBe(1);
    }
    expect(progress(1, 5, 0)).toBe(1); // a blend of no length has already landed
  });

  it('linear is t over n; cosine is (1 - cos(pi t / n)) / 2 and starts and ends at rest', () => {
    expect(progress(1, 10, 40)).toBeCloseTo(0.25, 12);
    expect(progress(2, 10, 40)).toBeCloseTo((1 - Math.cos(Math.PI / 4)) / 2, 12);
    expect(progress(2, 20, 40)).toBeCloseTo(0.5, 12);
    expect(progress(2, 1, 40)).toBeLessThan(progress(1, 1, 40)); // slower to start
  });

  it('a trapezoid is the stepper\'s own accelerated move on a unit distance, for the symmetric shape and for the ones with a base speed', () => {
    for (const shape of [[3, 100, 50, 100, 0], [3, 45, 0, 35, 0], [3, 0, 0, 80, 40], [3, 10, 8, 10, 0]] as const) {
      const [, a, b, c, d] = shape;
      const n = a + b + c;
      for (const t of [1, Math.floor(n / 3), Math.floor(n / 2), n - 1]) {
        const rec: MoveRecord = { kind: 2, n, t, a, b, c, d };
        expect(progress(shape, t, n), `${shape} at ${t}`).toBeCloseTo(stepAxis(false, 1, 0, rec), 12);
      }
      expect(progress(shape, n, n)).toBe(1);
    }
  });
});

describe('poseAt', () => {
  it('a cut holds the previous key until its step, then jumps', () => {
    const s = shot(key(0, 0, 0), key(40, 90, 0));
    expect(poseAt(s, 0).eye[0]).toBe(0);
    expect(poseAt(s, 39).eye[0]).toBe(0);
    expect(poseAt(s, 40).eye[0]).toBe(90);
    expect(poseAt(s, 400).eye[0]).toBe(90);
  });

  it('a linear blend is a straight line in the eye, the look-at, the roll and the lens', () => {
    const s: ShotDef = { kind: 'action', len: 20, keys: [[0, [0, -50, 100], [0, -40, 0], 0, 1000, 0], [20, [100, -30, 60], [20, -20, 10], 10, 800, 1]] };
    const p = poseAt(s, 5); // a quarter of the way
    expect(p.eye).toEqual([25, -45, 90]);
    expect(p.ref).toEqual([5, -35, 2.5]);
    expect(p.roll).toBeCloseTo((2.5 * Math.PI) / 180, 12); // degrees in the data, radians in the pose
    expect(p.scrDpt).toBeCloseTo(950, 9);
  });

  it('a cosine blend is at rest at both ends and at the middle halfway', () => {
    const s = shot(key(0, 0, 0), key(30, 60, 2));
    expect(poseAt(s, 15).eye[0]).toBeCloseTo(30, 9);
    expect(poseAt(s, 1).eye[0]).toBeLessThan(2); // a linear blend would be at 2
    expect(poseAt(s, 29).eye[0]).toBeGreaterThan(58);
  });

  it('a trapezoid lands exactly on its key and is the same curve in every channel', () => {
    const shape = [3, 10, 5, 10, 0] as const;
    const s: ShotDef = { kind: 'action', len: 25, keys: [[0, [0, 0, 0], [0, 0, 0], 0, 1000, 0], [25, [100, -50, 20], [10, 5, 2], 20, 500, shape]] };
    const p = poseAt(s, 12);
    const u = progress(shape, 12, 25);
    expect(p.eye[0]).toBeCloseTo(100 * u, 9);
    expect(p.eye[1]).toBeCloseTo(-50 * u, 9);
    expect(p.ref[0]).toBeCloseTo(10 * u, 9);
    expect(poseAt(s, 25).eye).toEqual([100, -50, 20]);
  });

  it('blends the lens value, not the angle: the field of view halfway is not the mean of the two angles', () => {
    const s: ShotDef = { kind: 'action', len: 10, keys: [[0, [0, -50, 100], [0, -40, 0], 0, 1900, 0], [10, [0, -50, 100], [0, -40, 0], 0, 534, 1]] };
    const mid = poseAt(s, 5);
    expect(mid.scrDpt).toBeCloseTo(1217, 9);
    const mean = (poseAt(s, 0).fovDeg + poseAt(s, 10).fovDeg) / 2;
    expect(mid.fovDeg).toBeCloseTo(2 * Math.atan(240 / 1217) * (180 / Math.PI), 9);
    expect(Math.abs(mid.fovDeg - mean)).toBeGreaterThan(0.5);
  });

  it('before the first key and after the last the nearest key holds; fractions of a step are taken', () => {
    const s = shot(key(2, 10, 0), key(12, 30, 1));
    expect(poseAt(s, -5).eye[0]).toBe(10);
    expect(poseAt(s, 0).eye[0]).toBe(10);
    expect(poseAt(s, 7).eye[0]).toBeCloseTo(20, 9);
    expect(poseAt(s, 7.5).eye[0]).toBeCloseTo(21, 9);
    expect(poseAt(s, 99).eye[0]).toBe(30);
    expect(lastPose(s).eye[0]).toBe(30);
  });

  it('a single key is a hard cut with nothing after it, and a shot with none is refused', () => {
    const s = shot(key(0, 5, 0));
    expect(poseAt(s, 0).eye[0]).toBe(5);
    expect(poseAt(s, 1000).eye[0]).toBe(5);
    expect(() => poseAt({ kind: 'action', len: 0, keys: [] }, 0)).toThrow();
  });

  it('three blends in a row are each their own, and the key steps need not be whole', () => {
    const s = shot(key(0, 0, 0), key(10, 10, 1), key(20, 10, 0), key(30, 40, 1));
    expect(poseAt(s, 5).eye[0]).toBeCloseTo(5, 9);
    expect(poseAt(s, 15).eye[0]).toBe(10); // the cut at 20 has not come: it holds the key before
    expect(poseAt(s, 20).eye[0]).toBe(10);
    expect(poseAt(s, 25).eye[0]).toBeCloseTo(25, 9);
  });
});
