/**
 * **Test modes A and B of the FFX camera** (`src/engine/ffxcam/variant.ts`; D-632; the hidden Fayth chapter, FFX only). What this file pins:
 *
 * 1. **The query**: `?ffxcam=b` is B; nothing, `a` and anything else is A, the unfiltered default.
 * 2. **The clamp**: B holds the camera's azimuth about its look-at point within one named constant (35 degrees) of the near default view's azimuth, and **only** that: the look-at point, the eye's height and its
 *    horizontal radius (so its distance), the roll and the lens are untouched; a pose already inside the arc is the very same object; the clamp is continuous (it slides along the limit, no jump) and turns the
 *    short way round the wrap at plus or minus 180.
 * 3. **A is the identity**: no filter at all.
 * 4. **The real near default view** is inside its own arc (its azimuth is the arc's centre), so B changes nothing about it.
 *
 * Numbers are made up except the near default view's, which the scene's staging module states (`FFX_NEAR_VIEW`). Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { FFXCAM_B_AZIMUTH_LIMIT_DEG, azimuthDeg, clampAzimuth, ffxCamVariantOf, variantFilter } from '../../src/engine/ffxcam/variant.ts';
import type { CameraPose } from '../../src/engine/ffxcam/solver.ts';
import { FFX_NEAR_VIEW } from '../../src/engine/ffx3d/ffxStaging.ts';
import { ffxEye } from '../../src/engine/ffx3d/ffxWorld.ts';

const D2R = Math.PI / 180;
const CENTRE = FFX_NEAR_VIEW.thetaDeg; // -258.47623 degrees, which is 101.52377 wrapped

/** A pose looking at `ref` from `len` away at azimuth `thetaDeg` and pitch `phiDeg` (FFX's polar rule). */
function pose(thetaDeg: number, opts: { ref?: [number, number, number]; phiDeg?: number; len?: number; roll?: number; scrDpt?: number } = {}): CameraPose {
  const ref = opts.ref ?? [10, -35, 20];
  const eye = ffxEye({ ref, thetaDeg, phiDeg: opts.phiDeg ?? -17, len: opts.len ?? 300, scrDpt: opts.scrDpt ?? 1024 });
  return { eye, ref, roll: opts.roll ?? 0, scrDpt: opts.scrDpt ?? 1024, fovDeg: 26.38 };
}

const wrap = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;
const offFromCentre = (p: CameraPose): number => wrap(azimuthDeg(p)! - CENTRE);

describe('the query', () => {
  it('?ffxcam=b is B; nothing, a and anything else is A', () => {
    expect(ffxCamVariantOf('?ffxcam=b')).toBe('b');
    expect(ffxCamVariantOf('?skin=painted&ffxcam=B')).toBe('b');
    expect(ffxCamVariantOf('?ffxcam=a')).toBe('a');
    expect(ffxCamVariantOf('')).toBe('a');
    expect(ffxCamVariantOf('?ffxcam=')).toBe('a');
    expect(ffxCamVariantOf('?ffxcam=bb')).toBe('a');
    expect(ffxCamVariantOf('?other=b')).toBe('a');
  });

  it('the limit is one named constant, 35 degrees', () => {
    expect(FFXCAM_B_AZIMUTH_LIMIT_DEG).toBe(35);
  });
});

describe('the clamp', () => {
  it('leaves a pose inside the arc exactly as it is (the same object), at the centre, at either edge and between', () => {
    for (const off of [0, 12, -12, 34.999, -34.999]) {
      const p = pose(CENTRE + off);
      expect(clampAzimuth(p, CENTRE, 35), `${off}`).toBe(p);
    }
  });

  it('brings a pose outside the arc onto the nearer edge, and only turns the eye about the look-at point', () => {
    for (const theta of [CENTRE + 60, CENTRE - 60, CENTRE + 179, CENTRE - 179, CENTRE + 90, CENTRE + 36, CENTRE - 36]) {
      const p = pose(theta, { ref: [87, -55, 55], phiDeg: -6, len: 250 });
      const q = clampAzimuth(p, CENTRE, 35);
      expect(q).not.toBe(p);
      expect(Math.abs(offFromCentre(q)), `${theta - CENTRE}`).toBeCloseTo(35, 9);
      expect(Math.sign(offFromCentre(q))).toBe(Math.sign(offFromCentre(p))); // the nearer edge (the edge on its own side)
      expect(q.ref).toEqual(p.ref); // the look-at point
      expect(q.eye[1]).toBe(p.eye[1]); // the height
      expect(Math.hypot(q.eye[0] - q.ref[0], q.eye[2] - q.ref[2])).toBeCloseTo(Math.hypot(p.eye[0] - p.ref[0], p.eye[2] - p.ref[2]), 9); // the horizontal radius
      expect(Math.hypot(q.eye[0] - q.ref[0], q.eye[1] - q.ref[1], q.eye[2] - q.ref[2])).toBeCloseTo(250, 9); // so the distance
      expect(q.roll).toBe(p.roll);
      expect(q.scrDpt).toBe(p.scrDpt);
      expect(q.fovDeg).toBe(p.fovDeg);
    }
  });

  it('goes the short way round the wrap: a pose just past +-180 from the centre goes to the edge on its own side', () => {
    const centre = 101.52377;
    const justPast = clampAzimuth(pose(centre + 181), centre, 35); // 179 degrees to the other side of the wrap
    expect(wrap(azimuthDeg(justPast)! - centre)).toBeCloseTo(-35, 9);
    const justBefore = clampAzimuth(pose(centre + 179), centre, 35);
    expect(wrap(azimuthDeg(justBefore)! - centre)).toBeCloseTo(35, 9);
  });

  it('is continuous: a camera sweeping round the look-at point slides along the limit and comes back, never jumping', () => {
    let last: CameraPose | null = null;
    let inside = 0;
    for (let theta = CENTRE - 120; theta <= CENTRE + 120; theta += 0.5) {
      const q = clampAzimuth(pose(theta), CENTRE, 35);
      if (Math.abs(wrap(theta - CENTRE)) <= 35) inside++;
      if (last) {
        const step = Math.hypot(q.eye[0] - last.eye[0], q.eye[1] - last.eye[1], q.eye[2] - last.eye[2]);
        expect(step).toBeLessThan(300 * 0.5 * D2R * 1.2 + 1e-9); // never more than the unclamped eye moves in half a degree
      }
      last = q;
    }
    expect(inside).toBeGreaterThan(100);
  });

  it('keeps a pose with no azimuth (the eye straight above the look-at point)', () => {
    const above: CameraPose = { eye: [10, -300, 20], ref: [10, -35, 20], roll: 0, scrDpt: 1024, fovDeg: 26.38 };
    expect(azimuthDeg(above)).toBeNull();
    expect(clampAzimuth(above, CENTRE, 35)).toBe(above);
  });

  it('works about a moving look-at point: the same eye offset is clamped to the same edge wherever the look-at point is', () => {
    const a = clampAzimuth(pose(CENTRE + 120, { ref: [0, 0, 0] }), CENTRE, 35);
    const b = clampAzimuth(pose(CENTRE + 120, { ref: [500, -80, -300] }), CENTRE, 35);
    expect(b.eye[0] - b.ref[0]).toBeCloseTo(a.eye[0] - a.ref[0], 9);
    expect(b.eye[2] - b.ref[2]).toBeCloseTo(a.eye[2] - a.ref[2], 9);
  });
});

describe('the variants', () => {
  it('A filters nothing; B filters through the clamp around the centre it is given', () => {
    expect(variantFilter('a', CENTRE)).toBeNull();
    const filter = variantFilter('b', CENTRE)!;
    const p = pose(CENTRE + 100);
    expect(Math.abs(offFromCentre(filter(p)))).toBeCloseTo(35, 9);
    const inside = pose(CENTRE + 10);
    expect(filter(inside)).toBe(inside);
  });

  it('the near default view stands at the centre of its own arc, so B leaves the default view untouched', () => {
    const near: CameraPose = { eye: ffxEye(FFX_NEAR_VIEW), ref: [...FFX_NEAR_VIEW.ref], roll: 0, scrDpt: 1024, fovDeg: 26.38 };
    expect(offFromCentre(near)).toBeCloseTo(0, 9);
    expect(variantFilter('b', FFX_NEAR_VIEW.thetaDeg)!(near)).toBe(near);
  });
});
