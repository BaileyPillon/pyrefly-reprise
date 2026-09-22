import { describe, expect, it } from 'vitest';
import {
  blendPatch,
  distanceToTransparent,
  featherAlpha,
  solveGainOffset,
  type RGBAImage,
} from '../../docs/concepts/pause-until-dawn/prototype-v2/src/patch-blend.ts';

/** A 40x30 patch: an opaque ellipse matte in a transparent surround, colour from `f(x, y)`. */
function patch(f: (x: number, y: number) => [number, number, number]): RGBAImage {
  const w = 40;
  const h = 30;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const inside = ((x - 20) / 17) ** 2 + ((y - 15) / 12) ** 2 <= 1;
      const [r, g, b] = f(x, y);
      data.set([r, g, b, inside ? 255 : 0], i);
    }
  }
  return { width: w, height: h, data };
}
const skin = (x: number, y: number): [number, number, number] => [150 + x, 100 + y, 80 + ((x + y) % 7) * 5];

describe('patch feather', () => {
  it('never widens the matte, is zero on the transparent surround and leaves the interior alone', () => {
    const p = patch(skin);
    const out = featherAlpha(p, 3);
    const d = distanceToTransparent(p);
    for (let i = 0; i < p.width * p.height; i++) {
      expect(out[i * 4 + 3]!).toBeLessThanOrEqual(p.data[i * 4 + 3]!);
      if (p.data[i * 4 + 3] === 0) expect(out[i * 4 + 3]).toBe(0);
      if (d[i]! >= 3) expect(out[i * 4 + 3]).toBe(p.data[i * 4 + 3]);
    }
    // and it really is a ramp, not a hard edge: some border pixel is partial
    expect([...Array(p.width * p.height).keys()].some((i) => out[i * 4 + 3]! > 0 && out[i * 4 + 3]! < 255)).toBe(true);
  });

  it('a patch whose matte is a rectangle still comes out with no hard rectangle edge', () => {
    const rect: RGBAImage = { width: 20, height: 10, data: new Uint8ClampedArray(20 * 10 * 4).fill(255) };
    const out = featherAlpha(rect, 2);
    expect(out[3]).toBeLessThan(255); // the corner
    expect(out[(5 * 20 + 10) * 4 + 3]).toBe(255); // the middle
  });
});

describe('seam colour match', () => {
  it('recovers a known per-channel gain and offset from a ring with a wide tonal range', () => {
    const wide = (x: number, y: number): [number, number, number] => [40 + x * 5, 30 + y * 6, 60 + x * 3 + y * 2];
    const base = patch(wide);
    const g = [1.1, 0.95, 1.05];
    const o = [-0.03, 0.02, 0.0];
    const p = patch((x, y) => wide(x, y).map((v, c) => Math.round(((v / 255 - o[c]!) / g[c]!) * 255)) as [number, number, number]);
    const fit = solveGainOffset(p, base, 6);
    for (let c = 0; c < 3; c++) {
      expect(fit.gain[c]!).toBeCloseTo(g[c]!, 1);
      expect(fit.offset[c]!).toBeCloseTo(o[c]!, 1);
    }
  });

  it('on a narrow-range ring (skin) it still closes the seam to within a few levels', () => {
    const base = patch(skin);
    const g = [1.1, 0.95, 1.05];
    const o = [-0.03, 0.02, 0.0];
    // the patch is the base, graded wrong: base = g * patch + o  ->  patch = (base - o) / g
    const p = patch((x, y) => skin(x, y).map((v, c) => Math.round(((v / 255 - o[c]!) / g[c]!) * 255)) as [number, number, number]);
    expect(solveGainOffset(p, base, 6).samples).toBeGreaterThan(24);
    // applying it brings the ring back within a couple of levels
    const { image } = blendPatch(p, base, 0, 6);
    const d = distanceToTransparent(p);
    let worst = 0;
    for (let i = 0; i < p.width * p.height; i++) {
      if (p.data[i * 4 + 3] !== 255 || d[i]! > 6) continue;
      for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(image.data[i * 4 + c]! - base.data[i * 4 + c]!));
    }
    expect(worst).toBeLessThanOrEqual(3);
  });

  it('is the identity when the patch already matches its base', () => {
    const base = patch(skin);
    const fit = solveGainOffset(base, base, 6);
    for (let c = 0; c < 3; c++) {
      expect(fit.gain[c]!).toBeCloseTo(1, 6);
      expect(fit.offset[c]!).toBeCloseTo(0, 6);
    }
  });

  it('caps a wild fit instead of repainting the patch', () => {
    const base = patch(() => [250, 250, 250]);
    const p = patch(() => [20, 20, 20]);
    const fit = solveGainOffset(p, base, 6);
    for (let c = 0; c < 3; c++) {
      expect(fit.gain[c]!).toBeLessThanOrEqual(1.25);
      expect(Math.abs(fit.offset[c]!)).toBeLessThanOrEqual(0.08);
    }
  });
});
