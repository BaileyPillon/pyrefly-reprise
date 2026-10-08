/**
 * **The engine keeps the head steady** (D-510, Bailey's pick of 2026-10-06; lane r394-headlock; both games): the pure maths of `src/engine/HeadLock.ts`,
 * held to known answers and to the continuity harness's own measurement (`critic/runner/lib/continuity-pure.mjs`, CHK-026).
 * The plane's half is `tests/unit/engine/head-lock-actor.test.ts`.
 */
import { Euler, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { headSizePx, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import { computePoseScale, type PoseFrame } from '../../../src/engine/PaintedScale.ts';
import { HEAD_BAND, HeadLockStats, headLockOff, projectedHeadSize, scaledPose, setHeadLockOff, solveHeadFactor } from '../../../src/engine/HeadLock.ts';

afterEach(() => setHeadLockOff(null));

const W = 1600;
const H = 900;

/** A camera looking at a figure 1 unit up, from `y` high and `z` away. */
function camera(y: number, z = 8): PerspectiveCamera {
  const cam = new PerspectiveCamera(28, W / H, 0.1, 200);
  cam.position.set(0, y, z);
  cam.lookAt(0, 1, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
}

const viewOf = (cam: PerspectiveCamera): Matrix4 => new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);

/** A plane's matrix in the world: a unit square scaled to `w` x `h`, turned `roll` about the view axis, at `(x, y, z)`. */
function plane(w: number, h: number, x: number, y: number, z = 0, roll = 0): Matrix4 {
  return new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(0, 0, roll)), new Vector3(w, h, 1));
}

/** The probe's own reading of a plane (`continuity-probe.mjs`): its four corners on a 1600x900 canvas, then the harness's projective map and `headSizePx`. */
function harnessHead(cam: PerspectiveCamera, world: Matrix4, head: readonly [number, number, number, number]): number {
  const vp = viewOf(cam).elements;
  const m = world.elements;
  const q: number[] = [];
  for (const [lx, ly] of [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]] as const) {
    const x = m[0]! * lx + m[4]! * ly + m[12]!;
    const y = m[1]! * lx + m[5]! * ly + m[13]!;
    const z = m[2]! * lx + m[6]! * ly + m[14]!;
    const cx = vp[0]! * x + vp[4]! * y + vp[8]! * z + vp[12]!;
    const cy = vp[1]! * x + vp[5]! * y + vp[9]! * z + vp[13]!;
    const cw = vp[3]! * x + vp[7]! * y + vp[11]! * z + vp[15]!;
    q.push(((cx / cw) * 0.5 + 0.5) * W, (-(cy / cw) * 0.5 + 0.5) * H);
  }
  return headSizePx(unitSquareToQuad(q), { u0: head[0], t0: head[1], u1: head[2], t1: head[3] });
}

describe('projectedHeadSize: the harness\'s head size, in NDC units', () => {
  const head = [0.42, 0.06, 0.58, 0.13] as const;

  it('is the harness\'s headSizePx up to the one constant every box on a canvas shares (a standing plane, a rolled one, a mirrored one)', () => {
    const k = Math.sqrt(W * H) / 2;
    for (const cam of [camera(0.4), camera(1), camera(4.5), camera(2, 5)]) {
      for (const world of [plane(1.2, 1.9, -2, 0.95), plane(2.3, 1.4, 1.3, 0.55, 0.4, 0.2), plane(-1.2, 1.9, 0.5, 0.95, -1), plane(1.9, 1.2, 0, 0.6, 0, -0.45)]) {
        const mvp = new Matrix4().multiplyMatrices(viewOf(cam), world);
        const mine = projectedHeadSize(mvp.elements, head);
        expect(mine).toBeGreaterThan(0);
        expect(harnessHead(cam, world, head) / mine).toBeCloseTo(k, 6);
      }
    }
  });

  it('reads the box\'s own area: an orthographic 2x3 stretch of a 1x1 box is the square root of 6', () => {
    const mvp = new Matrix4().makeScale(2, 3, 1);
    expect(projectedHeadSize(mvp.elements, [0.5 - 0.5, 0.5 - 0.5, 1.5 - 0.5, 1.5 - 0.5])).toBeCloseTo(Math.sqrt(6), 12);
    // a mirror does not change a size
    expect(projectedHeadSize(new Matrix4().makeScale(-2, 3, 1).elements, [0, 0, 1, 1])).toBeCloseTo(Math.sqrt(6), 12);
  });

  it('is NaN for a box on or behind the camera, and for a flat one', () => {
    const cam = camera(1, 8);
    const behind = new Matrix4().multiplyMatrices(viewOf(cam), plane(1, 2, 0, 1, 20)); // 12 units behind the camera
    expect(projectedHeadSize(behind.elements, head)).toBeNaN();
    expect(projectedHeadSize(new Matrix4().makeScale(2, 3, 1).elements, [0.3, 0.3, 0.3, 0.6])).toBe(0);
  });
});

describe('scaledPose: the pose\'s scale times a factor', () => {
  const idle: PoseFrame = { width: 803, height: 1075, baselineY: 1060 };
  const hurt: PoseFrame = { width: 791, height: 1037, baselineY: 1021, scale: 0.804, anchorY: 1015, content: { x0: 120, x1: 640, y0: 40, y1: 1030 } };
  const opts = { worldHeight: 1.8, reference: idle };

  it('is the very object when the factor is 1', () => {
    const s = computePoseScale(hurt, opts);
    expect(scaledPose(s, 1)).toBe(s);
  });

  it('is exactly computePoseScale with the pose\'s scale multiplied (every length scales, the anchor row, prone and clamped do not)', () => {
    for (const f of [0.9, 0.97, 1.03, 1.1]) {
      const a = scaledPose(computePoseScale(hurt, opts), f);
      const b = computePoseScale({ ...hurt, scale: 0.804 * f }, opts);
      for (const k of ['unitsPerPixel', 'width', 'height', 'offsetY', 'topY', 'anchorY', 'footprint'] as const) expect(a[k], `${k} at ${f}`).toBeCloseTo(b[k], 12);
      for (const k of ['x0', 'x1', 'y0', 'y1'] as const) expect(a.contentBox[k], `${k} at ${f}`).toBeCloseTo(b.contentBox[k], 12);
      expect(a.prone).toBe(b.prone);
      expect(a.clamped).toBe(b.clamped);
    }
  });

  it('scales a lying pose too (the prone footprint) and a pose with no measured content (the whole plane is its box)', () => {
    const ko: PoseFrame = { width: 1216, height: 816, baselineY: 804, scale: 0.529 };
    const a = scaledPose(computePoseScale(ko, opts), 1.06);
    const b = computePoseScale({ ...ko, scale: 0.529 * 1.06 }, opts);
    expect(a.prone).toBe(true);
    expect(a.footprint).toBeCloseTo(b.footprint, 12);
    expect(a.contentBox.y1).toBeCloseTo(b.contentBox.y1, 12);
  });
});

describe('solveHeadFactor', () => {
  it('answers want over the size at 1 when the head is proportional to the plane, in one look', () => {
    const calls: number[] = [];
    const r = solveHeadFactor((f) => (calls.push(f), 10 * f), 9.5);
    expect(r.factor).toBeCloseTo(0.95, 12);
    expect(r.raw).toBeCloseTo(0.95, 12);
    expect(r.clamp).toBe(0);
    expect(r.skipped).toBe(false);
    expect(calls).toHaveLength(2); // at 1, then at the first answer
    expect(r.evaluated).toBe(calls.at(-1));
  });

  it('corrects the first answer for the head moving as the plane scales about the feet (a head that grows a little faster than the plane)', () => {
    const size = (f: number): number => 10 * f * (1 + 0.04 * (f - 1)); // 4 percent of the change again, as perspective does
    const r = solveHeadFactor(size, 10.6);
    expect(Math.abs(size(r.factor) - 10.6) / 10.6).toBeLessThan(2e-4); // two looks: about 0.01 percent off ...
    expect(Math.abs(size(10.6 / 10) - 10.6) / 10.6).toBeGreaterThan(2e-3); // ... where the first-order answer alone is about 0.24 percent off
  });

  it('holds the factor to the band and says which side bit, with what it really wanted', () => {
    const low = solveHeadFactor((f) => 10 * f, 7);
    expect(low.factor).toBe(HEAD_BAND[0]);
    expect(low.clamp).toBe(-1);
    expect(low.raw).toBeCloseTo(0.7, 9);
    const high = solveHeadFactor((f) => 10 * f, 13);
    expect(high.factor).toBe(HEAD_BAND[1]);
    expect(high.clamp).toBe(1);
    expect(high.raw).toBeCloseTo(1.3, 9);
    expect(HEAD_BAND).toEqual([0.9, 1.1]);
  });

  it('leaves the table\'s scale alone when the frame has no size to read, or nothing to match', () => {
    for (const r of [solveHeadFactor(() => Number.NaN, 5), solveHeadFactor(() => 0, 5), solveHeadFactor((f) => f, Number.NaN), solveHeadFactor((f) => f, 0)]) {
      expect(r.skipped).toBe(true);
      expect(r.factor).toBe(1);
      expect(r.clamp).toBe(0);
    }
    // a second look that comes back unreadable keeps the first answer
    let n = 0;
    const r = solveHeadFactor((f) => (n++ === 0 ? 10 * f : Number.NaN), 9);
    expect(r.skipped).toBe(false);
    expect(r.factor).toBeCloseTo(0.9, 12);
  });
});

describe('HeadLockStats: the clamp hit is reported, not absorbed', () => {
  const ok = { factor: 0.97, raw: 0.97, clamp: 0, skipped: false, evaluated: 0.97 } as const;
  const hit = { factor: 1.1, raw: 1.31, clamp: 1, skipped: false, evaluated: 1.1 } as const;

  it('counts planes, the factor\'s range, the worst raw answer and each side of the band', () => {
    const s = new HeadLockStats();
    expect(s.snapshot()).toMatchObject({ planes: 0, min: null, max: null, clampedLow: 0, clampedHigh: 0 });
    s.note('hurt', ok);
    s.note('ko', { factor: 0.9, raw: 0.8, clamp: -1, skipped: false, evaluated: 0.9 });
    s.note('ko', hit);
    s.note('victory', { factor: 1, raw: 1, clamp: 0, skipped: true, evaluated: 1 });
    expect(s.snapshot()).toMatchObject({ planes: 3, skipped: 1, clampedLow: 1, clampedHigh: 1, min: 0.9, max: 1.1, worstRaw: 1.31 });
    expect(s.clamped).toBe(2);
    expect(s.last).toMatchObject({ pose: 'ko', clamp: 1 });
  });

  it('asks for a warning once per pose and only on a hit', () => {
    const s = new HeadLockStats();
    expect(s.note('hurt', ok)).toBe(false);
    expect(s.note('ko', hit)).toBe(true);
    expect(s.note('ko', hit)).toBe(false);
    expect(s.note('cast', hit)).toBe(true);
    expect(s.clampedHigh).toBe(3);
  });
});

describe('the kill switch', () => {
  it('is off unless the address says ?headlock=off (a test can force it)', () => {
    expect(headLockOff()).toBe(false);
    setHeadLockOff(true);
    expect(headLockOff()).toBe(true);
    setHeadLockOff(null);
    expect(headLockOff()).toBe(false);
  });
});
