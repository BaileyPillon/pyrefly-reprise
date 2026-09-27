/**
 * A-11 and A-1's measuring stick (both games' plumbing; A-1's use is FFX-2
 * only): how much of a figure's painted quad a rig, pushed in by a fraction,
 * keeps inside the frame, and the largest push that keeps everyone who was in
 * frame still in frame.
 */

import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { fitRigToSlice, frameFit, insideFraction, SLICE_MAX_SCALE, type FitSubject } from '../../src/engine/FrameFit.ts';

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

const live = new PerspectiveCamera(40, 16 / 9, 0.1, 200);
const rig = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };

describe('insideFraction', () => {
  it('is 1 for a figure in the middle and 0 for one far off to the side', () => {
    expect(insideFraction(live, rig, 0, figure(0))).toBeCloseTo(1, 5);
    expect(insideFraction(live, rig, 0, figure(40))).toBe(0);
  });

  it('falls as a push-in brings the frame edge over a figure near it', () => {
    // Half-width of the frame at z=0 from z=10: tan(20deg) x 10 x 16/9 = 6.47.
    const edge = figure(5.9);
    expect(insideFraction(live, rig, 0, edge)).toBeCloseTo(1, 5);
    expect(insideFraction(live, rig, 0.3, edge)).toBeLessThan(0.6);
  });

  it('counts a figure behind the camera as out of frame', () => {
    expect(insideFraction(live, rig, 0, figure(0, 20))).toBe(0);
  });
});

describe('frameFit', () => {
  it('keeps the requested push when everyone stays in', () => {
    const v = frameFit(live, rig, 0.06, [
      { actor: figure(0), min: 0.85 },
      { actor: figure(2), min: 0.85 },
    ]);
    expect(v).toMatchObject({ fits: true, push: 0.06 });
  });

  it('stops the push short of cutting a figure that was in frame', () => {
    const v = frameFit(live, rig, 0.3, [{ actor: figure(5.9), min: 0.85 }]);
    expect(v.fits).toBe(true);
    expect(v.push).toBeGreaterThan(0);
    expect(v.push).toBeLessThan(0.3);
    expect(insideFraction(live, rig, v.push, figure(5.9))).toBeGreaterThanOrEqual(0.85 - 1e-6);
  });

  it('reports a rig that already cuts a figure, and ignores it for the push', () => {
    const v = frameFit(live, rig, 0.1, [
      { actor: figure(6.6), min: 0.85 },
      { actor: figure(0), min: 0.85 },
    ]);
    expect(v.fits).toBe(false);
    expect(v.push).toBe(0.1);
    expect(v.worst).toBeLessThan(0.85);
  });

  it('skips a subject with no painted quad', () => {
    expect(frameFit(live, rig, 0.1, [{ actor: {}, min: 0.9 }])).toMatchObject({ fits: true, push: 0.1 });
  });
});

describe('frameFit with a sway margin', () => {
  it('judges fits by the floor and aims the push at the margin, never past where the figure stood', () => {
    // At rest 5.9 is wholly in; aim for 0.95, floor 0.85.
    const v = frameFit(live, rig, 0.3, [{ actor: figure(5.9), min: 0.95, floor: 0.85 }]);
    expect(v.fits).toBe(true);
    expect(insideFraction(live, rig, v.push, figure(5.9))).toBeGreaterThanOrEqual(0.95 - 1e-6);
  });

  it('keeps a figure standing between the floor and the margin where it stood', () => {
    // Find an x that sits about 0.9 inside at rest.
    let x = 6.0;
    while (insideFraction(live, rig, 0, figure(x)) > 0.9) x += 0.01;
    const at0 = insideFraction(live, rig, 0, figure(x));
    const v = frameFit(live, rig, 0.2, [{ actor: figure(x), min: 0.95, floor: 0.85 }]);
    expect(v.fits).toBe(true);
    expect(insideFraction(live, rig, v.push, figure(x))).toBeGreaterThanOrEqual(at0 - 1e-6);
  });
});

describe('fitRigToSlice (A-12)', () => {
  it('leaves a rig alone when everyone already fits the slice', () => {
    const r = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    expect(fitRigToSlice(live, r, 0.5, [{ actor: figure(-1), min: 1 }, { actor: figure(1), min: 1 }])).toBe(false);
    expect(r.position.z).toBe(10);
  });

  it('dollies straight back until a wide formation fits a phone slice, and refits from the authored rig', () => {
    const r = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    const wide = [{ actor: figure(-3), min: 1 }, { actor: figure(3), min: 1 }];
    expect(fitRigToSlice(live, r, 0.42, wide)).toBe(true);
    expect(r.position.z).toBeGreaterThan(10);
    expect(r.position.z).toBeLessThanOrEqual(10 * SLICE_MAX_SCALE + 1e-6);
    expect(r.position.x).toBeCloseTo(0, 6);
    const z = r.position.z;
    // A narrower formation on the next link comes forward again: the base is the authored rig.
    fitRigToSlice(live, r, 0.42, [{ actor: figure(-1), min: 1 }, { actor: figure(1), min: 1 }]);
    expect(r.position.z).toBeLessThan(z);
  });
});

describe('fitRigToSlice leaves out a colossus part wider than the slice', () => {
  it('fits the party and ignores an enemy that cannot fit a slice at any distance it may stand', () => {
    const colossus = {
      contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]) {
        const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
        q[0].set(-30, 0, -5); q[1].set(30, 0, -5); q[2].set(30, 4, -5); q[3].set(-30, 4, -5);
        return q;
      },
    };
    const r = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    expect(fitRigToSlice(live, r, 0.42, [{ actor: figure(-1), min: 1 }, { actor: figure(1), min: 1 }, { actor: colossus, min: 0.75 }])).toBe(false);
    expect(r.position.z).toBe(10);
  });
});
