/**
 * Option A2's runtime look LUT (`src/engine/fx/a/LookLut.ts`): built from the painting's own
 * palette, no image asset. FFX ("Golden Hour") and FFX-2 ("Pink Hour") recipes differ as the
 * spec says (rule 14). Prototype branch only (`?fx=a`).
 */
import { describe, expect, it } from 'vitest';
import { applyLook, buildLookLut, FFX2_RECIPE, FFX_RECIPE, LUT_DOMAIN, LUT_SIZE, lookHues, luma, shoulder, type Rgb } from '../../src/engine/fx/a/LookLut.ts';

const GAGAZET = { key: 0xcfe0ff, sky: 0x1b3a8c };

describe('buildLookLut', () => {
  it('is a 32-cube of RGBA bytes with black at black and an opaque alpha', () => {
    const lut = buildLookLut(GAGAZET, FFX_RECIPE);
    expect(lut.length).toBe(LUT_SIZE ** 3 * 4);
    expect([lut[0], lut[1], lut[2]]).toEqual([0, 0, 0]);
    for (let i = 3; i < lut.length; i += 4 * 97) expect(lut[i]).toBe(255);
  });

  it('keeps the grey ramp in order (the look never inverts tone)', () => {
    for (const r of [FFX_RECIPE, FFX2_RECIPE]) {
      const hues = lookHues(GAGAZET, r);
      let last = -1;
      for (let k = 0; k <= 40; k++) {
        const c = (k / 40) * LUT_DOMAIN;
        const l = luma(applyLook([c, c, c], hues, r));
        expect(l).toBeGreaterThanOrEqual(last - 1e-6);
        last = l;
      }
    }
  });

  it('brings values above 1 back under white with the shoulder, instead of clipping', () => {
    expect(shoulder(0.5, 0.76)).toBe(0.5);
    expect(shoulder(1.5, 0.76)).toBeLessThan(1);
    expect(shoulder(1.5, 0.76)).toBeGreaterThan(shoulder(1.1, 0.76));
  });
});

describe('the per-game recipes', () => {
  const mid: Rgb = [0.25, 0.25, 0.25];
  it('FFX-2 pushes shadows toward violet, FFX toward the painting\'s own sky', () => {
    const x2 = applyLook(mid, lookHues(GAGAZET, FFX2_RECIPE), FFX2_RECIPE);
    expect(x2[2]).toBeGreaterThan(x2[1]);
    expect(x2[0]).toBeGreaterThan(x2[1]);
    const x = applyLook(mid, lookHues(GAGAZET, FFX_RECIPE), FFX_RECIPE);
    expect(x[2]).toBeGreaterThan(x[0]);
  });

  it('FFX leans only its brightest values gold', () => {
    const hi = applyLook([0.95, 0.95, 0.95], lookHues(GAGAZET, FFX_RECIPE), FFX_RECIPE);
    expect(hi[0]).toBeGreaterThan(hi[2]);
  });
});
