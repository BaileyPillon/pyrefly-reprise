/**
 * W5 (pose swap smoothing, 2026-10-17; both games): the geometry of the aligned dissolve, `PoseAlign.ts`. Pure arithmetic on numbers: no `three`, no DOM.
 *
 * The properties the engine relies on: a coarse silhouette reads the painted area; two silhouettes' overlap is the harness's intersection over union
 * (1 for the same picture in the same place, 0 for two apart, mirrored pictures compared as drawn); an anchor is the head when it is on the body and the
 * centroid when it is not; and the drift is a function of a plane's own fade that is 0 at full, full at half or less, and brings both planes of a symmetric
 * dissolve to the same point at the crossing.
 */
import { describe, expect, it } from 'vitest';
import {
  MASK_CELLS,
  alignWeight,
  coarseMask,
  footprintOverlap,
  maskCentroidU,
  meetingOffsets,
  planeAnchor,
  type CoarseMask,
  type Footprint,
} from '../../../src/engine/PoseAlign.ts';

/** RGBA pixels of a `w` x `h` picture with a solid box `[x0, y0, x1, y1)` (fractions of the picture) of alpha 255, the rest 0. */
function boxPixels(w: number, h: number, box: [number, number, number, number]): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x / w >= box[0] && x / w < box[2] && y / h >= box[1] && y / h < box[3]) d[(y * w + x) * 4 + 3] = 255;
  return d;
}
const maskOf = (box: [number, number, number, number], w = 96, h = 96): CoarseMask => coarseMask(boxPixels(w, h, box), w, h, 90)!;
const fp = (mask: CoarseMask | null, over: Partial<Footprint> = {}): Footprint => ({ cx: 0, cy: 1, width: 2, height: 2, mirror: 1, mask, head: null, ...over });

describe('coarseMask', () => {
  it('reads the solid area of a picture on a grid whose long side is MASK_CELLS', () => {
    const m = maskOf([0.25, 0.25, 0.75, 0.75]);
    expect(Math.max(m.w, m.h)).toBe(MASK_CELLS);
    const solid = m.bits.reduce((n, b) => n + b, 0);
    expect(solid / (m.w * m.h)).toBeCloseTo(0.25, 1);
  });

  it('keeps the picture\'s aspect: a tall picture gets more rows than columns, and row 0 is the top', () => {
    const m = coarseMask(boxPixels(60, 120, [0, 0, 1, 0.25]), 60, 120, 90)!;
    expect(m.h).toBeGreaterThan(m.w);
    expect(m.bits[0]).toBe(1);
    expect(m.bits[(m.h - 1) * m.w]).toBe(0);
  });

  it('is null for an empty picture and for no pixels', () => {
    expect(coarseMask(new Uint8ClampedArray(16 * 16 * 4), 16, 16, 90)).toBeNull();
    expect(coarseMask(new Uint8ClampedArray(0), 0, 0, 90)).toBeNull();
  });

  it('ignores a haze under the cut', () => {
    const d = new Uint8ClampedArray(32 * 32 * 4);
    for (let i = 0; i < 32 * 32; i++) d[i * 4 + 3] = 60;
    expect(coarseMask(d, 32, 32, 90)).toBeNull();
  });
});

describe('footprintOverlap', () => {
  const body = maskOf([0.3, 0.1, 0.7, 0.95]);

  it('is 1 for the same picture in the same place', () => {
    expect(footprintOverlap(fp(body), fp(body))).toBeCloseTo(1, 2);
  });

  it('is 0 for two pictures that do not touch', () => {
    expect(footprintOverlap(fp(body, { cx: -5 }), fp(body, { cx: 5 }))).toBe(0);
  });

  it('is the intersection over union of what is drawn: two equal boxes shifted by half a width read 1/3', () => {
    const box = maskOf([0, 0, 1, 1]);
    const o = footprintOverlap(fp(box, { cx: 0, width: 2 }), fp(box, { cx: 1, width: 2 }))!;
    expect(o).toBeCloseTo(1 / 3, 1);
  });

  it('compares pictures as drawn: a mirrored plane puts the same silhouette on the other side', () => {
    const left = maskOf([0.05, 0.1, 0.35, 0.95]);
    const same = footprintOverlap(fp(left), fp(left));
    const flipped = footprintOverlap(fp(left), fp(left, { mirror: -1 }));
    expect(same).toBeCloseTo(1, 2);
    expect(flipped).toBeLessThan(0.05);
  });

  it('is null when either plane has no silhouette or is degenerate', () => {
    expect(footprintOverlap(fp(null), fp(body))).toBeNull();
    expect(footprintOverlap(fp(body), fp(body, { width: 0 }))).toBeNull();
  });
});

describe('planeAnchor', () => {
  const body = maskOf([0.3, 0.1, 0.7, 0.95]);

  it('is the centre of the head box when that lies on the silhouette', () => {
    const a = planeAnchor(fp(body, { head: [0.4, 0.1, 0.6, 0.25] }))!;
    expect(a.source).toBe('head');
    expect(a.x).toBeCloseTo(0, 1); // the head box is centred in a plane centred on x = 0
  });

  it('puts the head where the painting puts it: left of centre in the picture is left of the plane\'s centre, and the mirror flips it', () => {
    const lean = maskOf([0.1, 0.1, 0.5, 0.95]);
    const head: [number, number, number, number] = [0.1, 0.1, 0.3, 0.25];
    const a = planeAnchor(fp(lean, { head, cx: 3 }))!;
    const b = planeAnchor(fp(lean, { head, cx: 3, mirror: -1 }))!;
    expect(a.x).toBeCloseTo(3 + (0.2 - 0.5) * 2, 1);
    expect(b.x).toBeCloseTo(3 - (0.2 - 0.5) * 2, 1);
  });

  it('falls back to the silhouette\'s centroid when the head box floats off the body', () => {
    const a = planeAnchor(fp(body, { head: [0.0, 0.0, 0.1, 0.05] }))!;
    expect(a.source).toBe('centroid');
    expect(a.x).toBeCloseTo(0, 1);
  });

  it('uses the centroid when the row has no head box, and is null with no silhouette', () => {
    const lean = maskOf([0.1, 0.1, 0.5, 0.95]);
    const a = planeAnchor(fp(lean))!;
    expect(a.source).toBe('centroid');
    expect(a.x).toBeCloseTo((0.3 - 0.5) * 2, 1);
    expect(planeAnchor(fp(null))).toBeNull();
  });

  it('the centroid of a mask is across the picture, 0 to 1', () => {
    expect(maskCentroidU(maskOf([0, 0, 0.5, 1]))!).toBeCloseTo(0.25, 1);
  });
});

describe('the drift', () => {
  it('meets halfway: each plane\'s full shift takes its anchor to the middle', () => {
    const m = meetingOffsets({ x: -1, source: 'head' }, { x: 3, source: 'head' });
    expect(m.distance).toBe(4);
    expect(m.out).toBe(2);
    expect(m.inn).toBe(-2);
    expect(-1 + m.out).toBe(3 + m.inn);
  });

  it('the weight is 0 at full, 1 at half or less, linear between', () => {
    expect(alignWeight(1)).toBe(0);
    expect(alignWeight(0.75)).toBeCloseTo(0.5, 12);
    expect(alignWeight(0.5)).toBe(1);
    expect(alignWeight(0.2)).toBe(1);
    expect(alignWeight(0)).toBe(1);
    expect(alignWeight(1.2)).toBe(0); // a fade past 1 is not a negative shift
  });

  it('on a symmetric dissolve the two heads are at the same place from the crossing until the incoming plane goes home, and at their own places at the ends', () => {
    const out = { x: -1, source: 'head' as const };
    const inn = { x: 3, source: 'head' as const };
    const m = meetingOffsets(out, inn);
    const at = (s: number): { o: number; i: number } => ({ o: out.x + m.out * alignWeight(1 - s), i: inn.x + m.inn * alignWeight(s) });
    expect(at(0)).toEqual({ o: -1, i: 1 }); // the incoming plane starts AT the meeting point, the outgoing one at home
    expect(at(1)).toEqual({ o: 1, i: 3 }); // the outgoing one has drifted to it as it left, the incoming one is home
    const mid = at(0.5);
    expect(mid.o).toBeCloseTo(mid.i, 12);
    expect(mid.o).toBeCloseTo(1, 12);
    // between the crossing and the end the incoming head only moves toward home, never past it, and the outgoing one never leaves the meeting point
    let prev = at(0.5).i;
    for (let s = 0.55; s <= 1.0001; s += 0.05) {
      const p = at(Math.min(1, s));
      expect(p.i).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(p.i).toBeLessThanOrEqual(3 + 1e-9);
      expect(p.o).toBeCloseTo(1, 12);
      prev = p.i;
    }
  });

  it('the fade-weighted head of an aligned dissolve moves less in its steepest frame than the plain dissolve\'s, on the quadInOut curve at 60 Hz in 120 ms', () => {
    const quadInOut = (u: number): number => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
    const out = { x: 0, source: 'head' as const };
    const inn = { x: 1, source: 'head' as const };
    const m = meetingOffsets(out, inn);
    const steps = (aligned: boolean): number => {
      let prev = 0;
      let worst = 0;
      for (let f = 1; f <= 7; f++) {
        const s = quadInOut(Math.min(1, (f * (1000 / 60)) / 120));
        const fo = 1 - s;
        const fi = s;
        const po = out.x + (aligned ? m.out * alignWeight(fo) : 0);
        const pi = inn.x + (aligned ? m.inn * alignWeight(fi) : 0);
        const w = (fo * po + fi * pi) / (fo + fi);
        worst = Math.max(worst, Math.abs(w - prev));
        prev = w;
      }
      return worst;
    };
    expect(steps(false)).toBeGreaterThan(0.25); // 0.26 of the separation in one frame, the harness's mid-blend step
    expect(steps(true)).toBeLessThan(steps(false) * 0.8);
  });
});
