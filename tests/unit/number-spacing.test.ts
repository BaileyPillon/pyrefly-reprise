import { describe, expect, it } from 'vitest';
import {
  GAP_OF_HEIGHT,
  LOWER_BY,
  MAX_UP_HEIGHTS,
  MIN_GAP,
  SPACING_WINDOW_MS,
  boxesMeet,
  planNumberSpacing,
  type SpacingBox,
  type SpacingItem,
  type SpacingRect,
  type SpacingResult,
} from '../../src/ui/common/numberSpacing.ts';

/**
 * Numbers that never print through each other (release 64, both games; the driver's frame-by-frame look at Chapter I's Total Annihilation): the planner's rules, with no DOM.
 */
const W = 90; // a three-figure glass number at 2560x1440: about 180 px wide
const H = 48; // and about 96 px tall (half extents)

const item = (id: number, cx: number, cy: number, shownAt: number, extra: Partial<SpacingItem> = {}): SpacingItem => ({ id, seq: id, cx, cy, hw: W, hh: H, shownAt, ...extra });
const finalBox = (it: SpacingItem, r: SpacingResult): SpacingBox => ({ cx: it.cx + r.dx, cy: it.cy + r.dy, hw: it.hw, hh: it.hh });
const clearOf = (a: SpacingBox, b: SpacingBox): boolean => !boxesMeet(a, b, 0);
const BIG: SpacingRect = { left: 0, top: 0, right: 2560, bottom: 1440 };

function plan(items: SpacingItem[], opts: Parameters<typeof planNumberSpacing>[1] = {}): Array<{ it: SpacingItem; r: SpacingResult; box: SpacingBox }> {
  const res = planNumberSpacing(items, opts);
  return items.map((it) => ({ it, r: res.get(it.id)!, box: finalBox(it, res.get(it.id)!) }));
}

describe('planNumberSpacing: when it moves nothing', () => {
  it('two numbers that do not meet are left exactly where they are', () => {
    const out = plan([item(1, 600, 700, 0), item(2, 1200, 700, 0)]);
    for (const o of out) expect(o.r).toEqual({ dx: 0, dy: 0, axis: null, clear: true });
  });

  it('two numbers that meet but began more than the window apart are left alone (the later is not simultaneous)', () => {
    const out = plan([item(1, 800, 700, 0), item(2, 800, 700, SPACING_WINDOW_MS + 1)]);
    expect(out[1]!.r.dy).toBe(0);
    expect(out[1]!.r.dx).toBe(0);
  });

  it('a number alone is untouched, and an empty frame plans nothing', () => {
    expect(plan([item(1, 800, 700, 0)])[0]!.r.axis).toBeNull();
    expect(planNumberSpacing([]).size).toBe(0);
  });
});

describe('planNumberSpacing: the later one gives way, upward first', () => {
  it('two numbers on the same spot, together: the earlier stays, the later is lifted just clear', () => {
    const [a, b] = plan([item(1, 800, 700, 0), item(2, 800, 700, 0)]);
    expect(a!.r).toEqual({ dx: 0, dy: 0, axis: null, clear: true });
    expect(b!.r.axis).toBe('up');
    expect(b!.r.dx).toBe(0);
    expect(b!.r.dy).toBeLessThan(0);
    expect(clearOf(a!.box, b!.box)).toBe(true);
    // just clear: one box height plus the gap, no more
    const gap = Math.max(MIN_GAP, GAP_OF_HEIGHT * 2 * H);
    expect(b!.r.dy).toBeCloseTo(-(2 * H + gap), 5);
  });

  it('"later" is the one that began later; on the same instant it is the one spawned later', () => {
    const [a, b] = plan([item(1, 800, 700, 100), item(2, 800, 700, 100), item(3, 2000, 700, 0)]);
    expect(a!.r.dy).toBe(0);
    expect(b!.r.dy).toBeLessThan(0);
    const swapped = plan([item(2, 800, 700, 250), item(1, 800, 700, 100)]);
    expect(swapped.find((o) => o.it.id === 1)!.r.dy).toBe(0); // began first: stays
    expect(swapped.find((o) => o.it.id === 2)!.r.dy).toBeLessThan(0);
  });

  it('three on one spot stack upward, every pair clear', () => {
    const out = plan([item(1, 800, 700, 0), item(2, 800, 700, 50), item(3, 800, 700, 100)]);
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) expect(clearOf(out[i]!.box, out[j]!.box)).toBe(true);
    expect(out[2]!.r.dy).toBeLessThan(out[1]!.r.dy);
    expect(out.every((o) => o.r.clear)).toBe(true);
  });

  it('two numbers that overlap only partly (side by side, close) still end clear, by the smallest lift', () => {
    const [a, b] = plan([item(1, 800, 700, 0), item(2, 880, 720, 40)]);
    expect(clearOf(a!.box, b!.box)).toBe(true);
    expect(b!.r.axis).toBe('up');
    expect(Math.abs(b!.r.dy)).toBeLessThan(2 * H * MAX_UP_HEIGHTS);
  });

  it('a number is still attached to its target: the lift is at most the heights allowed, the sideways at most the widths', () => {
    const items = Array.from({ length: 5 }, (_, k) => item(k + 1, 800, 700, k * 20));
    const out = plan(items, { bounds: BIG });
    for (const o of out) {
      expect(Math.abs(o.r.dy)).toBeLessThanOrEqual(MAX_UP_HEIGHTS * 2 * H + 1e-6);
    }
  });
});

describe('planNumberSpacing: a lower target is never hopped over', () => {
  it('a later number whose centre is clearly below the earlier one moves DOWN, so the figures keep their order', () => {
    const lowerBy = LOWER_BY * 2 * H + 20;
    const [a, b] = plan([item(1, 800, 700, 0), item(2, 810, 700 + lowerBy, 30)]);
    expect(b!.r.axis).toBe('down');
    expect(b!.r.dy).toBeGreaterThan(0);
    expect(b!.box.cy).toBeGreaterThan(a!.box.cy);
    expect(clearOf(a!.box, b!.box)).toBe(true);
  });

  it('a later number only a little lower still goes up (the way numbers climb)', () => {
    const [, b] = plan([item(1, 800, 700, 0), item(2, 810, 700 + 0.2 * 2 * H, 30)]);
    expect(b!.r.axis).toBe('up');
  });
});

describe('planNumberSpacing: room', () => {
  it('goes sideways when up would leave the screen, toward the side away from the figure it meets', () => {
    const near = { left: 0, top: 0, right: 2560, bottom: 1440 };
    const [a, b] = plan([item(1, 800, 60, 0), item(2, 840, 60, 10)], { bounds: near }); // right under the top edge: no room above
    expect(b!.r.axis).toBe('right');
    expect(b!.r.dy).toBe(0);
    expect(b!.r.dx).toBeGreaterThan(0);
    expect(clearOf(a!.box, b!.box)).toBe(true);
  });

  it('goes the other way when the first side has no room', () => {
    const bounds = { left: 0, top: 0, right: 1000, bottom: 1440 };
    const [a, b] = plan([item(1, 880, 60, 0), item(2, 900, 60, 10)], { bounds });
    expect(b!.r.axis).toBe('left');
    expect(b!.box.cx + W).toBeLessThanOrEqual(bounds.right);
    expect(clearOf(a!.box, b!.box)).toBe(true);
  });

  it('never moves a number off the screen: the box stays inside the bounds', () => {
    const bounds = { left: 100, top: 100, right: 1500, bottom: 900 };
    const out = plan([item(1, 300, 200, 0), item(2, 300, 210, 10), item(3, 310, 220, 20), item(4, 320, 230, 30)], { bounds });
    for (const o of out) {
      if (!o.r.clear) continue;
      expect(o.box.cx - W).toBeGreaterThanOrEqual(bounds.left - 1e-6);
      expect(o.box.cx + W).toBeLessThanOrEqual(bounds.right + 1e-6);
      expect(o.box.cy - H).toBeGreaterThanOrEqual(bounds.top - 1e-6);
      expect(o.box.cy + H).toBeLessThanOrEqual(bounds.bottom + 1e-6);
    }
  });

  it('a HUD panel is not pushed into: with the panel above, the number goes to the side instead', () => {
    const panel: SpacingRect = { left: 500, top: 0, right: 1200, bottom: 640 };
    const [a, b] = plan([item(1, 800, 700, 0), item(2, 800, 700, 0)], { bounds: BIG, panels: [panel] });
    expect(b!.r.axis === 'right' || b!.r.axis === 'left' || b!.r.axis === 'down').toBe(true);
    const r = { left: b!.box.cx - W, top: b!.box.cy - H, right: b!.box.cx + W, bottom: b!.box.cy + H };
    expect(r.left < panel.right && r.right > panel.left && r.top < panel.bottom && r.bottom > panel.top).toBe(false);
    expect(clearOf(a!.box, b!.box)).toBe(true);
  });

  it('a number whose target is under the HUD may be moved over it (the panels are not obstacles for it)', () => {
    const panel: SpacingRect = { left: 500, top: 0, right: 1200, bottom: 640 };
    const [, b] = plan([item(1, 800, 700, 0), item(2, 800, 700, 0, { overPanels: true })], { bounds: BIG, panels: [panel] });
    expect(b!.r.axis).toBe('up');
  });

  it('when no clear place exists the number stays where it was and says so', () => {
    const tiny = { left: 700, top: 600, right: 900, bottom: 800 }; // no room anywhere
    const [, b] = plan([item(1, 800, 700, 0), item(2, 800, 700, 0)], { bounds: tiny });
    expect(b!.r.clear).toBe(false);
    expect(b!.r.dx).toBe(0);
    expect(b!.r.dy).toBe(0);
  });
});

describe('planNumberSpacing: continuity over a flight', () => {
  /** Fly two numbers for 1.2 s at 60 Hz: the earlier rises 30 px over its life, the later starts 80 ms behind it; feed each frame's result back in. */
  function fly(startOffsetY: number, sameTarget = false): { maxStep: number; overlapFrames: number; finalGap: number } {
    let carry: { dx: number; dy: number; axis: SpacingResult['axis'] } = { dx: 0, dy: 0, axis: null };
    let prevB: SpacingBox | null = null;
    let maxStep = 0;
    let overlapFrames = 0;
    let lastGap = 0;
    for (let f = 0; f < 72; f++) {
      const t = f * (1000 / 60);
      const rise = (age: number): number => -120 * (1 - (1 - Math.min(1, Math.max(0, age) / 1150)) ** 2.4);
      const a = item(1, 800, 700 + rise(t), 0);
      const b = item(2, sameTarget ? 800 : 860, 700 + startOffsetY + rise(t - 80), 80, { dx: carry.dx, dy: carry.dy, axis: carry.axis });
      const res = planNumberSpacing([a, b]);
      const rb = res.get(2)!;
      carry = { dx: rb.dx, dy: rb.dy, axis: rb.axis };
      const fa = finalBox(a, res.get(1)!);
      const fb = finalBox(b, rb);
      if (f * (1000 / 60) >= 80 && boxesMeet(fa, fb, 0)) overlapFrames++;
      if (prevB && f * (1000 / 60) > 80) maxStep = Math.max(maxStep, Math.hypot(fb.cx - prevB.cx, fb.cy - prevB.cy));
      prevB = fb;
      lastGap = fb.cy - fa.cy;
    }
    return { maxStep, overlapFrames, finalGap: lastGap };
  }

  it('over a whole flight the later number is never on top of the earlier one and never jumps (no step beyond what its own rise makes)', () => {
    const r = fly(0);
    expect(r.overlapFrames).toBe(0);
    expect(r.maxStep).toBeLessThan(12); // its natural rise is under 8 px a frame at the start of the ease
  });

  it('the same holds when the second target stands lower (it goes down and stays down)', () => {
    const r = fly(80);
    expect(r.overlapFrames).toBe(0);
    expect(r.maxStep).toBeLessThan(12);
    expect(r.finalGap).toBeGreaterThan(0);
  });

  it('the shift is sticky: it never gives room back, so a number does not drop when the one it made way for is gone', () => {
    const a = item(1, 800, 700, 0);
    const b = item(2, 800, 700, 0);
    const first = planNumberSpacing([a, b]).get(2)!;
    expect(first.dy).toBeLessThan(0);
    // the earlier number is dropped: the later one, handed its own last shift, keeps it
    const after = planNumberSpacing([{ ...b, dx: first.dx, dy: first.dy, axis: first.axis }]).get(2)!;
    expect(after.dy).toBe(first.dy);
    expect(after.axis).toBe('up');
  });

  it('a number that has already moved and meets a new figure moves further along the same axis', () => {
    const a = item(1, 800, 700, 0);
    const b = item(2, 800, 700, 0);
    const first = planNumberSpacing([a, b]).get(2)!;
    const c = item(3, 800, 700 + first.dy, 200); // a third, on the second one's new spot
    const out = planNumberSpacing([a, { ...b, dx: first.dx, dy: first.dy, axis: first.axis }, c]);
    expect(out.get(2)!.dy).toBe(first.dy); // the second one is not disturbed (it began first)
    expect(c.cy + out.get(3)!.dy).toBeLessThan(b.cy + first.dy); // the third climbs above it
    expect(out.get(3)!.axis).toBe('up');
  });
});

describe('planNumberSpacing: purity', () => {
  it('the same frame planned twice gives the same answer, and the input is not changed', () => {
    const items = [item(1, 800, 700, 0), item(2, 810, 705, 40), item(3, 790, 690, 90)];
    const copy = JSON.stringify(items);
    const one = [...planNumberSpacing(items, { bounds: BIG }).entries()];
    const two = [...planNumberSpacing(items, { bounds: BIG }).entries()];
    expect(two).toEqual(one);
    expect(JSON.stringify(items)).toBe(copy);
  });

  it('input order does not matter: the planner sorts by when the numbers began', () => {
    const items = [item(1, 800, 700, 0), item(2, 810, 705, 40), item(3, 790, 690, 90)];
    const a = planNumberSpacing(items);
    const b = planNumberSpacing([...items].reverse());
    for (const it of items) expect(b.get(it.id)).toEqual(a.get(it.id));
  });
});
