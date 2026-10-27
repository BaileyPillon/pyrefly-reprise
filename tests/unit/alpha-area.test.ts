/**
 * MF-02 (lane "mf-l4-freezes", both games): the area average of an alpha plane (`src/engine/look/alphaArea.ts`), which the alpha worker uses for the extents field. Pure.
 */
import { describe, expect, it } from 'vitest';
import { alphaPlane, areaAverage } from '../../src/engine/look/alphaArea.ts';

/** The textbook version (every output texel is the weighted mean of the source texels it covers), to hold the two-pass one against. */
function naive(p: ArrayLike<number>, w: number, h: number, W: number, H: number): Uint8Array {
  const out = new Uint8Array(W * H);
  const sx = w / W;
  const sy = h / H;
  for (let Y = 0; Y < H; Y++) {
    const y0 = Y * sy;
    const y1 = (Y + 1) * sy;
    for (let X = 0; X < W; X++) {
      const x0 = X * sx;
      const x1 = (X + 1) * sx;
      let s = 0;
      let ws = 0;
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
        const wy = Math.min(y + 1, y1) - Math.max(y, y0);
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
          const wx = Math.min(x + 1, x1) - Math.max(x, x0);
          s += p[y * w + x]! * wx * wy;
          ws += wx * wy;
        }
      }
      out[Y * W + X] = Math.round(s / ws);
    }
  }
  return out;
}

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

describe('areaAverage (MF-02)', () => {
  it('a flat plane stays flat, at any size and any ratio', () => {
    for (const [w, h] of [[640, 480], [301, 517], [2920, 4528], [128, 128], [130, 129]] as const) {
      const p = new Uint8Array(w * h).fill(200);
      const a = areaAverage(p, w, h, 128, 128);
      expect(a.length).toBe(128 * 128);
      expect(Math.min(...a)).toBe(200);
      expect(Math.max(...a)).toBe(200);
    }
  });

  it('a half plane whose edge falls on a texel boundary comes out exactly half and half', () => {
    const w = 640;
    const h = 256;
    const p = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) p[y * w + x] = 255;
    const a = areaAverage(p, w, h, 128, 128);
    for (let Y = 0; Y < 128; Y++) {
      expect(a[Y * 128 + 63]).toBe(255);
      expect(a[Y * 128 + 64]).toBe(0);
    }
  });

  it('is the textbook weighted mean to within a level, on a noisy plane of an awkward size', () => {
    const r = lcg(7);
    const w = 331;
    const h = 457;
    const p = new Uint8Array(w * h);
    for (let i = 0; i < p.length; i++) p[i] = Math.floor(r() * 256);
    const a = areaAverage(p, w, h, 128, 128);
    const b = naive(p, w, h, 128, 128);
    let worst = 0;
    for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i]! - b[i]!));
    expect(worst).toBeLessThanOrEqual(1);
  });

  it('keeps the mean: the average of the output is the average of the input', () => {
    const r = lcg(11);
    const w = 700;
    const h = 900;
    const p = new Uint8Array(w * h);
    for (let i = 0; i < p.length; i++) p[i] = r() < 0.3 ? 255 : 0;
    const a = areaAverage(p, w, h, 128, 128);
    const mp = p.reduce((s, v) => s + v, 0) / p.length;
    const ma = a.reduce((s, v) => s + v, 0) / a.length;
    expect(Math.abs(mp - ma)).toBeLessThan(0.6);
  });

  it('takes the alpha bytes of an RGBA buffer, top row first', () => {
    const rgba = new Uint8ClampedArray([1, 2, 3, 40, 4, 5, 6, 80, 7, 8, 9, 120, 10, 11, 12, 160]);
    expect([...alphaPlane(rgba, 2, 2)]).toEqual([40, 80, 120, 160]);
  });
});
