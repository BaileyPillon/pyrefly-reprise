// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { boardRects } from '../../src/ui/ffx2/intentBoard.ts';
import { placeSlab, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';

/**
 * r63-rc, driver call 201b (the r64 defaults and art review, minor m1): in Chapter IV outside the booth path the F1 HUD's Intel slab ("Curse ... ALSO ...") was drawn across
 * the active girl's name header (`.f1-hero`: face, name, role chip) and brushed the cue under it (`.f1-cue`), 43,264 px squared at 2560 x 1440 (real run, before and after in
 * `D:/Tools/pyrefly-scratch/2026-10-24/r63-rc/evidence/`). The slab is placed by the board list `boardRects` reads; the F1 hero and cue were not on it. Now they are, so the
 * solver puts the slab elsewhere.
 *
 * **Game case: FFX-2 only** (the FFX HUD has its own slab placement and its own twin of the list, and the review found no overlap in Chapter I).
 */

const r = (left: number, top: number, right: number, bottom: number): SlabRect => ({ left, top, right, bottom });
const overlap = (a: SlabRect, b: SlabRect): number =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

function put(root: HTMLElement, cls: string, b: SlabRect): HTMLElement {
  const el = document.createElement('div');
  el.className = cls;
  el.getBoundingClientRect = () =>
    ({ left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.right - b.left, height: b.bottom - b.top, x: b.left, y: b.top, toJSON: () => ({}) }) as DOMRect;
  root.appendChild(el);
  return el;
}

describe('the intent slab keeps off the F1 hero header and cue (FFX-2 only)', () => {
  // The Chapter IV first menu at 2560 x 1440, as measured in the real run.
  const hero = r(1868, 386, 2348, 490);
  const cue = r(1813, 516, 2455, 580);
  const verbs = r(1790, 590, 2450, 930);

  it('boardRects lists the hero and the cue with the chrome', () => {
    const root = document.createElement('div');
    put(root, 'f1-hero', hero);
    put(root, 'f1-cue', cue);
    put(root, 'ffx2hud__command', verbs);
    const rects = boardRects(root, { scale: 4, chipReach: 0 });
    expect(rects).toContainEqual(hero);
    expect(rects).toContainEqual(cue);
    expect(rects).toContainEqual(verbs);
    expect(rects.some((o) => o.soft)).toBe(false);
  });

  it('skips them while they are not laid out (F1 HUD off, or no menu open: `display: none`)', () => {
    const root = document.createElement('div');
    put(root, 'f1-hero', r(0, 0, 0, 0));
    put(root, 'f1-cue', r(0, 0, 0, 0));
    expect(boardRects(root, { scale: 4, chipReach: 0 })).toEqual([]);
  });

  it('the solved slab no longer lands on the hero or the cue (the real board: it stood on the hero before)', () => {
    const layer = { width: 2560, height: 1440 };
    const size = { w: 600, h: 398 }; // the slab as measured
    const natural = { left: 1932, top: 119 }; // where it stood in the unfixed run: its box 1932..2532 x 119..517
    const board = [hero, cue, verbs, r(1700, 1000, 2500, 1400)]; // + the party column
    const before = placeSlab(natural, size, [r(1700, 1000, 2500, 1400)], layer, 4, 0, { tiered: true });
    expect(overlap({ left: before.left, top: before.top, right: before.left + size.w, bottom: before.top + size.h }, hero)).toBeGreaterThan(0);
    const after = placeSlab(natural, size, board, layer, 4, 0, { tiered: true });
    const box = { left: after.left, top: after.top, right: after.left + size.w, bottom: after.top + size.h };
    expect(overlap(box, hero)).toBe(0);
    expect(overlap(box, cue)).toBe(0);
    expect(overlap(box, verbs)).toBe(0);
  });
});
