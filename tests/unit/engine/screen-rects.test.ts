import { describe, expect, it } from 'vitest';
import {
  intersect,
  occludersOf,
  visibilityOf,
  visibleFraction,
  type DepthRect,
} from '../../../src/engine/ScreenRects.ts';

const R = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

describe('visibleFraction', () => {
  it('is 1 with nothing in the way', () => {
    expect(visibleFraction(R(0, 0, 100, 100), [])).toBe(1);
  });

  it('is 1 when the occluder misses', () => {
    expect(visibleFraction(R(0, 0, 100, 100), [R(200, 0, 50, 50)])).toBe(1);
  });

  it('measures a partial cover', () => {
    // A quarter of the target's area.
    expect(visibleFraction(R(0, 0, 100, 100), [R(0, 0, 50, 50)])).toBeCloseTo(0.75, 5);
  });

  it('is 0 when fully covered', () => {
    expect(visibleFraction(R(10, 10, 20, 20), [R(0, 0, 100, 100)])).toBe(0);
  });

  it('does not double-count two occluders that overlap each other', () => {
    // Both cover the left half; together they still cover only half.
    const half = visibleFraction(R(0, 0, 100, 100), [R(0, 0, 50, 100), R(0, 0, 50, 100)]);
    expect(half).toBeCloseTo(0.5, 5);
    // Staggered, sharing a 20-wide strip: 0..50 and 30..80 = 80 wide covered.
    const staggered = visibleFraction(R(0, 0, 100, 100), [R(0, 0, 50, 100), R(30, 0, 50, 100)]);
    expect(staggered).toBeCloseTo(0.2, 5);
  });

  it('clips the occluder to the target before measuring', () => {
    // The occluder sticks far out of frame; only its overlap may count.
    expect(visibleFraction(R(0, 0, 100, 100), [R(-500, 0, 550, 1000)])).toBeCloseTo(0.5, 5);
  });

  it('reports a zero-area target as invisible rather than fully visible', () => {
    expect(visibleFraction(R(0, 0, 0, 100), [])).toBe(0);
  });
});

describe('intersect', () => {
  it('returns null for a touching edge, not a zero-area rect', () => {
    expect(intersect(R(0, 0, 10, 10), R(10, 0, 10, 10))).toBeNull();
  });
});

describe('visibilityOf — depth decides who hides whom', () => {
  /**
   * Bailey's Chapter 3 frame: both Yu Pagodas completely behind Braska's Final
   * Aeon. The aeon is nearer the camera and wider, so it hides them; they do
   * not hide it.
   */
  const rects = new Map<string, DepthRect>([
    ['aeon', { x: 400, y: 200, w: 400, h: 500, depth: 8 }],
    ['pagoda-b', { x: 450, y: 300, w: 120, h: 300, depth: 12 }],
    ['pagoda-c', { x: 900, y: 300, w: 120, h: 300, depth: 12 }],
  ]);

  it('hides the fiend standing behind the bigger one', () => {
    const v = visibilityOf(rects);
    expect(v.get('pagoda-b')).toBe(0);
  });

  it('leaves the near, wide fiend fully visible', () => {
    expect(visibilityOf(rects).get('aeon')).toBe(1);
  });

  it('leaves a fiend standing clear of the boss visible', () => {
    expect(visibilityOf(rects).get('pagoda-c')).toBe(1);
  });

  it('counts a HUD panel as covering whatever is under it, at any depth', () => {
    // The party-status panel, bottom right, over Yu Pagoda C's lower half.
    const v = visibilityOf(rects, [{ x: 880, y: 450, w: 400, h: 300 }]);
    expect(v.get('pagoda-c')).toBeCloseTo(0.5, 5);
  });

  it('ties do not occlude — two parts of one machine at the same depth', () => {
    const parts = new Map<string, DepthRect>([
      ['body', { x: 0, y: 0, w: 200, h: 200, depth: 9 }],
      ['head', { x: 100, y: 0, w: 200, h: 200, depth: 9 }],
    ]);
    expect(visibilityOf(parts).get('head')).toBe(1);
    expect(visibilityOf(parts).get('body')).toBe(1);
  });
});

describe('occludersOf', () => {
  const rects = new Map<string, DepthRect>([
    ['near-big', { x: 0, y: 0, w: 300, h: 300, depth: 5 }],
    ['far-small', { x: 100, y: 100, w: 100, h: 100, depth: 10 }],
    ['grazing', { x: 198, y: 100, w: 100, h: 100, depth: 6 }],
  ]);

  it('names the figure in front', () => {
    expect(occludersOf('far-small', rects)).toContain('near-big');
  });

  it('ignores a figure behind', () => {
    expect(occludersOf('near-big', rects)).toEqual([]);
  });

  it('ignores a two-pixel graze', () => {
    // `grazing` overlaps far-small by 2px of 100 = 2% of its area, under the
    // 4% floor: a wingtip clipping a bracket must not fade a whole fiend out.
    expect(occludersOf('far-small', rects)).not.toContain('grazing');
  });
});
