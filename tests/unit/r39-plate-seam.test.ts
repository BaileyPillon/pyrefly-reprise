/**
 * Round 21, PR-0344 (FFX-2 only in use: Chapters IV and XIII's Bevelle plate at 21:9). The "tilted wing seam" was not the painted wings: it
 * was the two foreground conduits (3D pipes with a strip of lamps, placed so the 16:9 frame cuts them) standing inside a 21:9 frame as
 * dark slabs with straight tilted sides, and the plate's parallax layers stopping at a vertical line there. The pipes keep their place at
 * the frame's edge at any width and the layers' ends fall away along a smoothstep.
 */
import { describe, expect, it } from 'vitest';
import { BRACKET_ASPECT, bracketScale } from '../../src/scenes/frameBracket.ts';
import { sideFeatherStops, type ParallaxLayerSpec } from '../../src/engine/Backdrop.ts';
import { BEVELLE_UNDERGROUND_BACKDROP } from '../../src/scenes/bevelle-underground.ts';

describe('bracketing props stay at the frame edge as the window widens (PR-0344)', () => {
  it('moves nothing at 16:9 or narrower, and scales x by aspect over 16:9 above it', () => {
    expect(bracketScale(16 / 9)).toBe(1);
    expect(bracketScale(1.6)).toBe(1);
    expect(bracketScale(4 / 3)).toBe(1);
    expect(bracketScale(21 / 9)).toBeCloseTo((21 / 9) / (16 / 9), 9);
    expect(bracketScale(2560 / 1080)).toBeCloseTo(1.3333, 3);
    for (const bad of [NaN, Infinity, 0, -1]) expect(bracketScale(bad)).toBe(1);
  });

  it('keeps the prop at the same fraction of the frame at a fixed vertical field of view (a pinhole camera)', () => {
    const tanV = Math.tan((32 * Math.PI) / 360); // the Bevelle rigs' lens
    const depth = 14;
    const frac = (x: number, aspect: number): number => x / (depth * tanV * aspect); // normalised screen x: -1 left edge .. 1 right edge
    for (const aspect of [16 / 9, 2, 21 / 9, 32 / 9]) {
      expect(frac(7.9 * bracketScale(aspect), aspect)).toBeCloseTo(frac(7.9, 16 / 9), 9);
    }
    expect(BRACKET_ASPECT).toBeCloseTo(16 / 9, 12);
    // and without the scale the 16:9 edge-cut prop walks into the picture as the window widens
    expect(Math.abs(frac(7.9, 21 / 9))).toBeLessThan(Math.abs(frac(7.9, 16 / 9)) * 0.8);
  });
});

describe('a parallax layer\'s ends fall away along a smoothstep (PR-0344)', () => {
  it('no feather by default (every other scene draws as it did)', () => {
    expect(sideFeatherStops(0)).toEqual([]);
    expect(sideFeatherStops(undefined as unknown as number)).toEqual([]);
    expect(sideFeatherStops(-1)).toEqual([]);
  });

  it('is zero at both ends, one beyond the feather, symmetric, sorted, and smooth (no step steeper than the smoothstep\'s)', () => {
    const stops = sideFeatherStops(0.06);
    expect(stops[0]).toEqual([0, 0]);
    expect(stops[stops.length - 1]).toEqual([1, 0]);
    const sorted = [...stops].sort((a, b) => a[0] - b[0]);
    expect(sorted[0]![0]).toBe(0);
    expect(sorted.some(([at, a]) => at === 0.06 && a === 1)).toBe(true);
    expect(sorted.some(([at, a]) => Math.abs(at - 0.94) < 1e-12 && a === 1)).toBe(true);
    for (let i = 1; i < sorted.length; i++) {
      const [x0, a0] = sorted[i - 1]!;
      const [x1, a1] = sorted[i]!;
      if (x1 - x0 < 1e-9) continue;
      expect(Math.abs((a1 - a0) / (x1 - x0))).toBeLessThanOrEqual(1.5 / 0.06 + 1e-6); // the smoothstep's steepest slope is 1.5 over its width
    }
    // symmetric about the middle
    for (const [at, a] of stops) expect(stops.some(([b, c]) => Math.abs(b - (1 - at)) < 1e-12 && Math.abs(c - a) < 1e-12)).toBe(true);
  });

  it('is capped so the two ends never meet', () => {
    const stops = sideFeatherStops(0.9);
    expect(Math.max(...stops.map(([at]) => at).filter((x) => x < 0.5))).toBeCloseTo(0.45, 9);
  });

  it('Bevelle\'s layers ask for it; the type carries the field', () => {
    const spec: ParallaxLayerSpec = { from: 0, to: 1, z: -20, featherSide: 0.06 };
    expect(spec.featherSide).toBe(0.06);
    expect(BEVELLE_UNDERGROUND_BACKDROP.width).toBe(78); // the plate the layers are cut from
  });
});
