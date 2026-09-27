/**
 * FOC23-01 (FFX Chapter I on a phone): the refit keeps every figure below the phone HUD's top
 * band (the turn strip and the intent strip cover the field's top), raising the camera on its
 * pedestal first and standing it back only when the figures are too tall for what is left.
 * FrameFit is shared plumbing; only the FFX phone HUD reports a band (`phoneSlice.ts`).
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { fitRigToSlice, type FitSubject } from '../../src/engine/FrameFit.ts';

function tall(y0: number, y1: number): FitSubject['actor'] {
  return {
    contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]) {
      const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
      q[0].set(-0.5, y0, 0); q[1].set(0.5, y0, 0); q[2].set(0.5, y1, 0); q[3].set(-0.5, y1, 0);
      return q;
    },
  };
}

const live = new PerspectiveCamera(40, 16 / 9, 0.1, 200);

function topNdc(r: { position: Vector3; lookAt: Vector3 }, y: number): number {
  const cam = new PerspectiveCamera(40, 16 / 9, 0.1, 200);
  cam.position.copy(r.position); cam.lookAt(r.lookAt); cam.updateMatrixWorld(true);
  return new Vector3(0, y, 0).project(cam).y;
}

describe('fitRigToSlice with a top band', () => {
  it('no band: unchanged behaviour', () => {
    const r = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    expect(fitRigToSlice(live, r, 0.5, [{ actor: tall(-1.5, 3.5), min: 1 }])).toBe(false);
    expect(r.position.y).toBe(1);
  });

  it('raises the camera on its pedestal until the figure clears the band, without standing back', () => {
    const r = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    expect(fitRigToSlice(live, r, 0.5, [{ actor: tall(-1.5, 3.5), min: 1 }], 0.3)).toBe(true);
    expect(r.position.z).toBeCloseTo(10, 6);
    expect(r.position.y).toBeGreaterThan(1);
    expect(r.lookAt.y - r.position.y).toBeCloseTo(0, 6);
    expect(topNdc(r, 3.5)).toBeLessThanOrEqual(1 - 2 * 0.3 + 1e-3);
    expect(topNdc(r, -1.5)).toBeGreaterThanOrEqual(-1);
  });

  it('stands back when the figure is too tall for what the band leaves', () => {
    const r = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    expect(fitRigToSlice(live, r, 0.5, [{ actor: tall(-2, 4), min: 1 }], 0.3)).toBe(true);
    expect(r.position.z).toBeGreaterThan(10);
    expect(topNdc(r, 4)).toBeLessThanOrEqual(1 - 2 * 0.3 + 1e-3);
    expect(topNdc(r, -2)).toBeGreaterThanOrEqual(-1 - 1e-3);
  });
});
