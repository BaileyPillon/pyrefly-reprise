/**
 * **The brush grain** (`src/engine/yrp3d/grain.ts`; the hidden 3D Bahamut chapter, FFX-2 only): the look lab's seeded, tileable 512 x 512 grain. Pinned at a small size (the generator is the same at any size; 512 is its default
 * and what the shader samples), no renderer.
 */
import { NearestFilter, NoColorSpace, RepeatWrapping } from 'three';
import { describe, expect, it } from 'vitest';

import { grainData, makeGrainTexture } from '../../../src/engine/yrp3d/grain.ts';

describe('the grain', () => {
  it('is RGBA bytes of the size asked for, opaque, and the same every time for the same seed', () => {
    const a = grainData(32, 11);
    const b = grainData(32, 11);
    expect(a).toHaveLength(32 * 32 * 4);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    for (let i = 3; i < a.length; i += 4) expect(a[i]).toBe(255);
    expect(Buffer.from(grainData(32, 12)).equals(Buffer.from(a))).toBe(false); // another seed, another grain
  });

  it('sits around the middle with a gentle spread in every channel (a texture to modulate by, not a pattern to see): means near 0.5, within a quarter of it at the extremes', () => {
    const d = grainData(48, 11);
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      let lo = 255;
      let hi = 0;
      for (let i = c; i < d.length; i += 4) {
        sum += d[i]!;
        lo = Math.min(lo, d[i]!);
        hi = Math.max(hi, d[i]!);
      }
      const mean = sum / (d.length / 4) / 255;
      expect(mean, `channel ${c}`).toBeGreaterThan(0.4);
      expect(mean, `channel ${c}`).toBeLessThan(0.6);
      expect(hi - lo, `channel ${c} spreads`).toBeGreaterThan(30);
    }
  });

  it('streaks along one direction in R: neighbouring pixels along the streak agree more than neighbouring pixels across it', () => {
    const size = 64;
    const d = grainData(size, 11);
    const r = (x: number, y: number): number => d[((((y % size) + size) % size) * size + (((x % size) + size) % size)) * 4]!;
    let along = 0;
    let across = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        along += Math.abs(r(x, y) - r(x + 2, y + 1)); // the streak runs at about 28 degrees: 2 across, 1 down
        across += Math.abs(r(x, y) - r(x - 1, y + 2)); // perpendicular to it
      }
    }
    expect(along).toBeLessThan(across);
  });

  it('is a repeating, nearest-filtered texture with no colour space (it holds numbers, not colours)', () => {
    const t = makeGrainTexture(16, 11);
    expect([t.wrapS, t.wrapT, t.magFilter, t.minFilter, t.colorSpace, t.generateMipmaps]).toEqual([RepeatWrapping, RepeatWrapping, NearestFilter, NearestFilter, NoColorSpace, false]);
    expect([t.image.width, t.image.height]).toEqual([16, 16]);
    t.dispose();
  });
});
