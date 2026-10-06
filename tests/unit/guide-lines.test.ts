import { describe, expect, it } from 'vitest';
import { CUT_TOLERANCE, cleanWindow, mergeLines, type LineBox } from '../../src/ui/common/guideLines.ts';

/**
 * PR-0385 (release 39.1; both games: the sheet is shared plumbing): the guide's reading sheet never shows half a line. This is the arithmetic: the lines of
 * the sheet, merged from the browser's text boxes, and the part of the window that holds whole lines only.
 */
/** `n` lines of height 8 on a pitch of 10, the first at `y0`. */
const lines = (n: number, y0 = 5): LineBox[] => Array.from({ length: n }, (_, k) => ({ top: y0 + k * 10, bottom: y0 + k * 10 + 8 }));

describe('mergeLines', () => {
  it('puts the boxes of one line together (an inline label in another face sits a hair off its neighbours) and keeps two lines apart', () => {
    const merged = mergeLines([
      { top: 10, bottom: 18 },
      { top: 10.4, bottom: 18.6 },
      { top: 9.8, bottom: 17.6 },
      { top: 20, bottom: 28 },
    ]);
    expect(merged).toEqual([
      { top: 9.8, bottom: 18.6 },
      { top: 20, bottom: 28 },
    ]);
  });

  it('is order-free, drops boxes with no height, and keeps lines whose content boxes touch (a tight leading) apart', () => {
    expect(mergeLines([{ top: 30, bottom: 38 }, { top: 5, bottom: 5 }, { top: 10, bottom: 18 }])).toEqual([
      { top: 10, bottom: 18 },
      { top: 30, bottom: 38 },
    ]);
    // 1.5 px of overlap on 8 px boxes is two lines, not one
    expect(mergeLines([{ top: 0, bottom: 8 }, { top: 6.5, bottom: 14.5 }])).toHaveLength(2);
    expect(mergeLines([])).toEqual([]);
  });
});

describe('cleanWindow', () => {
  it('is the window itself when no line crosses an edge (the opening position: a gap above the header, a gap at the foot)', () => {
    // lines at 5-13, 15-23, ...; a window 5..53 starts at a line and ends in the gap after the fifth
    expect(cleanWindow(lines(10), 5, 48)).toEqual({ top: 5, bottom: 53 });
    expect(cleanWindow(lines(10), 0, 54)).toEqual({ top: 0, bottom: 54 });
  });

  it('ends at the head of a line the foot would cut, no higher than the foot of the line before it', () => {
    // the window 5..58 cuts the line 55..63 in its middle; the line before it is 45..53
    const w = cleanWindow(lines(10), 5, 53);
    expect(w.top).toBe(5);
    expect(w.bottom).toBeCloseTo(53.96, 6); // the foot of the line before it (53) and the overshoot of a descender's tail (12 percent of its 8): above the head of the cut line (55)
    for (const l of lines(10)) expect(l.top < w.bottom && l.bottom > w.bottom, `a line crosses ${w.bottom}`).toBe(false);
  });

  it('keeps the line before the cut whole when the boxes overlap: the clip is not above its foot (its descenders are in it)', () => {
    // 9 px boxes on a 7.5 px pitch overlap by 1.5; the window cuts the third line
    const tight: LineBox[] = [0, 1, 2, 3, 4].map((k) => ({ top: k * 7.5, bottom: k * 7.5 + 9 }));
    const w = cleanWindow(tight, 0, 18); // the third line is 15..24: cut; the one before it is 7.5..16.5, so the window keeps it and no more of the cut line than its ink-free quarter
    expect(w.bottom).toBeCloseTo(17.25, 6);
    expect(w.bottom).toBeGreaterThanOrEqual(16.5);
  });

  it('starts at the foot of a line the head would cut, no further into the next line than its ink-free top', () => {
    // a window from 29 cuts the line 25..33; it starts just past its foot (33 and 12 percent of 8), above the next line (35)
    const w = cleanWindow(lines(10), 29, 40);
    expect(w.top).toBeCloseTo(33.96, 6);
    for (const l of lines(10)) expect(l.top < w.top && l.bottom > w.top).toBe(false);
    // boxes that overlap: the cut line's foot (9) is past the next line's head (7.5); the window starts 12 percent past the foot, inside the ink-free 40 percent of the next box
    const tight: LineBox[] = [0, 1, 2, 3].map((k) => ({ top: k * 7.5, bottom: k * 7.5 + 9 }));
    expect(cleanWindow(tight, 4, 20).top).toBeCloseTo(10.08, 6);
  });

  it('cleans both edges at once, and never invents room: the clean window lies inside the window', () => {
    const w = cleanWindow(lines(20), 29, 71);
    expect(w.top).toBeGreaterThanOrEqual(29);
    expect(w.bottom).toBeLessThanOrEqual(100);
    for (const l of lines(20)) {
      expect(l.top < w.top && l.bottom > w.top).toBe(false);
      expect(l.top < w.bottom && l.bottom > w.bottom).toBe(false);
    }
  });

  it('leaves a line alone whose edge lies within the tolerance of the window\'s (the transform\'s rounding is not a cut)', () => {
    const near = [{ top: 5, bottom: 13 }, { top: 15, bottom: 23 + CUT_TOLERANCE / 2 }, { top: 25, bottom: 33 }];
    expect(cleanWindow(near, 0, 23)).toEqual({ top: 0, bottom: 23 });
  });

  it('is the whole window when it is too short to hold a line, or when there are no lines to measure (jsdom, a sheet not shown)', () => {
    expect(cleanWindow(lines(5), 8, 4)).toEqual({ top: 8, bottom: 12 });
    expect(cleanWindow([], 10, 100)).toEqual({ top: 10, bottom: 110 });
  });

  it('shows the last lines of the sheet whole at the foot (no line crosses the end of the content): only the head is cleaned', () => {
    const all = lines(10); // the last line ends at 103; the sheet's foot (with its padding) is at 111
    expect(cleanWindow(all, 41, 70).bottom).toBe(111);
    expect(cleanWindow(all, 41, 70).top).toBeCloseTo(43.96, 6);
  });
});
