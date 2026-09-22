/**
 * FOC-05 (FFX only, `critic/reviews/1b33971…-focused.md`): the first-turn
 * coach mark must never paint over `.mad__card`. The card's real position is
 * not CSS (`src/ui/coach/coachAvoid.ts` header), so this pins the pure
 * geometry `CoachMark.ts` calls against it, at the five named windows, the
 * way `tests/unit/pause-remake-css.test.ts` pins CSS clamps against a floor
 * instead of driving a browser.
 *
 * The mark rect at each window is `coach.css`'s own formula for
 * `.coach-mark[data-game='ffx']` (`left: 28%; top: 11%;
 * max-width: min(400px, 44%)`), so a later edit to that rule is exercised
 * here too. The card rect is the one the focused review measured live at
 * 1600x900 (`[402, 98, 370x189]`, evidence `tile-c2-first-use-ffx.jpg`),
 * scaled to the other four windows in proportion to width: the card's own
 * position is `MoveAdvisor.layout()` output on the same letterboxed stage the
 * mark is, so it moves with the window the same way the mark's percentages
 * do. This is the regression case the defect was measured on, not a claim
 * that every future encounter's card lands here — that guarantee belongs to
 * `tests/unit/ui-ffx-hud-safe-zones.test.ts`, which pins the card's own
 * solver.
 */

import { describe, expect, it } from 'vitest';
import { bandClearOf, overlaps, type Rect } from '../../src/ui/coach/coachAvoid.ts';

/** The five windows AGENTS.md and the FOC-05 brief name, plus the phone. */
const WINDOWS = [
  [1280, 720],
  [1600, 900],
  [2000, 1012],
  [2560, 1080],
  [390, 844],
] as const;

/** The phone breakpoint `coach.css`'s `@media (max-width: 900px)` switches on. */
const PHONE_BREAKPOINT = 900;

/**
 * `coach.css`'s `.coach-mark[data-game='ffx']` rect at a window, desktop or
 * phone rule as the media query picks it.
 */
function markRectAt(w: number, h: number): Rect {
  // The mark's height is content flow, not a CSS length; 145px is what the
  // focused review measured live at 1600x900 (`tile-c2-first-use-ffx.jpg`).
  // `@media (max-width: 900px)` shrinks the body text to 18px, so the phone
  // rule gets a shorter, still-conservative estimate.
  if (w <= PHONE_BREAKPOINT) {
    const width = 0.88 * w; // `width: 88vw`
    const left = 0.5 * w - width / 2; // `left: 50%; transform: translateX(-50%)`
    const top = 0.08 * h;
    const height = 120;
    return { left, top, right: left + width, bottom: top + height };
  }
  const left = 0.28 * w;
  const top = 0.11 * h;
  const width = Math.min(400, 0.44 * w);
  const height = 145;
  return { left, top, right: left + width, bottom: top + height };
}

/**
 * The card the focused review measured at 1600x900, scaled to the other
 * windows by width — see the file header for why that is the right proxy.
 */
function cardRectAt(w: number): Rect {
  const scale = w / 1600;
  const left = 402 * scale;
  const top = 98 * scale;
  const width = 370 * scale;
  const height = 189 * scale;
  return { left, top, right: left + width, bottom: top + height };
}

function stageRectAt(width: number, height: number): Rect {
  return { left: 0, top: 0, right: width, bottom: height };
}

describe('FOC-05: bandClearOf', () => {
  it('reproduces the reported overlap before it is cleared', () => {
    // The exact numbers the focused review measured: proof this test is
    // pinned against the real defect, not a synthetic one.
    const mark = markRectAt(1600, 900);
    const card = cardRectAt(1600);
    expect(mark.left).toBeCloseTo(448, 6);
    expect(mark.top).toBeCloseTo(99, 6);
    expect(mark.right).toBeCloseTo(848, 6);
    expect(mark.bottom).toBeCloseTo(244, 6);
    expect(card).toEqual({ left: 402, top: 98, right: 772, bottom: 287 });
    expect(overlaps(mark, card)).toBe(true);
  });

  for (const [w, h] of WINDOWS) {
    it(`clears the card at ${w}x${h} without moving it`, () => {
      const mark = markRectAt(w, h);
      const card = cardRectAt(w);
      const stage = stageRectAt(w, h);
      const moved = bandClearOf(mark, card, stage);
      expect(moved, `${w}x${h}: mark and card were already clear`).not.toBeNull();
      // The card never moves: bandClearOf only ever returns a new mark rect.
      expect(overlaps(moved!, card)).toBe(false);
      // The mark keeps its size and its horizontal placement — only the band
      // (top/bottom) it occupies is allowed to change.
      expect(moved!.left).toBe(mark.left);
      expect(moved!.right).toBe(mark.right);
      expect(moved!.bottom - moved!.top).toBeCloseTo(mark.bottom - mark.top, 6);
    });
  }

  it('is a no-op when the two rects do not overlap', () => {
    const mark: Rect = { left: 0, top: 0, right: 100, bottom: 100 };
    const card: Rect = { left: 200, top: 200, right: 300, bottom: 300 };
    const stage: Rect = { left: 0, top: 0, right: 400, bottom: 400 };
    expect(bandClearOf(mark, card, stage)).toBeNull();
  });
});
