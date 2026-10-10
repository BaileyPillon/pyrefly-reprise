/**
 * The advisor card's very last resort: **the tip**, one row of the card on whatever thin clear ground the frame still has (r3942-giants-ffx, FFX only: the FFX HUD's solver;
 * FFX-2's HUD never declines the card).
 *
 * ## Why it exists
 *
 * Bailey's giants (2026-10-08, "all of your recommendations") filled Chapters I and III. Seymour Flux stands 6.0 units tall (was 4.1) with Mortiorchis 3.3 beside him, and Braska's
 * Final Aeon 6.9 with the two Yu Pagodas behind him at 5.7 and 6.3: the sky between the strategy guide's rail and the fight, where the card stood on live (164 x 70 grid px at 1600x900),
 * is the fight's now. The free ground that is left is a band along the top of the frame, 28 to 40 grid px tall, and the three passes of `advisorZone` (a card 72 tall at 132 wide, the
 * same at 80 wide, the same at 60 tall) all decline, so the card and its chip both came down on every desktop shape (the verifier's 16 captures of the two chapters). The strip of
 * `advisorStrip.ts` (the Sin fights' last resort: 34 tall, with its chip above it) needs 45; the band has 28 at 16:10.
 *
 * ## What it is
 *
 * The card's bare rung (the move, its target, the menu it lives in and what it costs: `MoveAdvisor.cardHtml` at the last density) laid out as **one row** (`move-advisor-tip.css`),
 * with the `N` chip as a key-only badge on its left. About 13 grid px tall (16 at the largest TEXT SIZE on a small window), so it fits in any clear box 18 tall and 150 wide; it prints the lead move only (the runner-up, the effect, the
 * reason and the board's note are the full card's, which comes back, as ever, in a box that holds it: with the guide folded with G, or in a chapter whose frame is not so full). It is
 * clear of every panel and fighter by the same arithmetic as the designed card (the fighters read where the camera's shot comes to rest, not where a camera still gliding to the menu shot has them
 * for a moment: `AdvisorZoneInput.enemiesAtRest`), and of the small chips the designed card never meets (the guide's G and scroll chips and the PAUSE chip: `keepOff`). It stands on the top row of the
 * stage whenever that row holds the whole bar, so it is where the player left it at the next decision (`tipZone`).
 *
 * It runs only when the three designed passes (and, in the Sin fights, the strip) decline, and not while the enemy-move read-out is open: **a read-out that takes the band takes the card
 * with it, as before** (`FFXBattleHud.solveAdvisorPlacement` passes `tip` off then; the tests that pin it are unchanged).
 *
 * Pure arithmetic on the 640x360 grid, tested in `tests/unit/ui-ffx-advisor-tip.test.ts` on the boards the two chapters measured at four desktop shapes (1600x900, 1440x900, 1024x768, 1280x720).
 */

import {
  GAP,
  MAX_ADVISOR_WIDTH,
  POCKET_BOTTOM,
  SKEW,
  STAGE,
  cardBoxInside,
  freeSpans,
  obstaclesOf,
  type AdvisorZone,
  type AdvisorZoneInput,
  type Rect,
} from './hudSafeZones.ts';

/**
 * The tallest the bar is allowed to be, and so the least box it needs, in grid px. Measured on the built card (`.mad__card[data-zone='tip']`, headless Chromium on the real GPU, Chapter I's first
 * menu): 13.2 at 1600x900 (scale 2.5), 13.7 at 1024x768 (scale 1.6, where the type floor is larger in grid px), and 16.0 with TEXT SIZE 130 on that window, the worst the HUD allows. 18 leaves the
 * worst two grid px, and the card is never cut: its scroll height equals its box in all four.
 */
export const TIP_HEIGHT = 18;

/**
 * The room the `N` badge takes on the left of the bar, chip and gap, in grid px. The key-only chip measures 17.2 wide at scale 2.5, 20.9 at 1024x768 and 23.8 with TEXT SIZE 130 on that
 * window; 28 holds the widest with its gap, so the chip never stands on the bar.
 */
export const TIP_BADGE = 28;

/** The narrowest clear box worth a tip: the badge and a bar that holds "NEXT  Tidus  Hastega -> the party" (about 122 at the type floor). Under it the target is cut to an ellipsis. */
export const TIP_MIN_WIDTH = 150;

/**
 * A box this wide holds the whole bar ("NEXT  Tidus  Hastega -> the party" is about 122 at the type floor, and the badge and the shear take 32): above it the position decides, below it the width.
 */
export const TIP_COMFORTABLE_WIDTH = 160;

/**
 * The command stack at its fullest, in grid px: its left and top as far as they ever stand (`FFXBattleHud`'s own fallback box, widened to the tallest measured top with a full list, 166), its
 * right as it stands at the default text size. The stack grows when a menu opens and gives ground back when a submenu replaces it, and the designed card never notices because it
 * stands above the party; a one-row tip that took the ground a submenu frees would jump at every keypress, so the tip is solved as if the stack were always at its fullest (the measured
 * stack is still an obstacle: at a larger text size it is wider than this).
 */
export const COMMAND_STACK_AT_REST: Rect = { left: 24, top: 166, right: 218, bottom: 336 };

/** The extra obstacles the tip keeps off, as the solver's input names them (`AdvisorZoneInput.keepOff`), and the stack at its fullest. */
const keepOffOf = (input: AdvisorZoneInput): Rect[] => [...(input.keepOff ?? []).filter((r) => r.right > r.left && r.bottom > r.top), COMMAND_STACK_AT_REST];

/**
 * Every clear box `TIP_HEIGHT` tall and `TIP_MIN_WIDTH` wide on the frame, in the same cuts and with the same clearances as `hudSafeZones.solveBox`, and the best of them. **The highest
 * box wide enough for the whole bar (`TIP_COMFORTABLE_WIDTH`), the leftmost of those; failing one, the widest.** Not the nearest to the command stack, which was the first answer: the
 * stack grows and shrinks with every submenu and the party steps forward on its turn, so "nearest" moved the bar between the top of the stage, the left column and the deck from one
 * keypress to the next. The top row of the stage is the one place that is clear of both, and it is where a player looks for the chrome. The bar stands on the foot of its box, so a box
 * with a lower bottom is a higher bar.
 */
export function tipZone(input: AdvisorZoneInput): AdvisorZone | null {
  // The fighters where the shot comes to rest, not where a camera still gliding has them for a moment: see `AdvisorZoneInput.enemiesAtRest`.
  const obstacles = [...obstaclesOf(input.enemiesAtRest ? { ...input, enemies: input.enemiesAtRest } : input), ...keepOffOf(input)];
  const top = GAP;
  const bottom = STAGE.height - POCKET_BOTTOM;
  const minWidth = TIP_MIN_WIDTH + SKEW * TIP_HEIGHT;
  const ys = new Set<number>([top, bottom]);
  for (const o of obstacles) {
    for (const y of [o.top - GAP, o.bottom + GAP]) if (y > top && y < bottom) ys.add(y);
  }
  const cuts = [...ys].sort((a, b) => a - b);
  let best: { box: Rect; width: number } | null = null;
  for (let i = 0; i < cuts.length; i++) {
    for (let j = i + 1; j < cuts.length; j++) {
      const y0 = cuts[i]!;
      const y1 = cuts[j]!;
      if (y1 - y0 < TIP_HEIGHT) continue;
      const blockers: Array<[number, number]> = [];
      for (const o of obstacles) {
        if (o.bottom + GAP <= y0 || o.top - GAP >= y1) continue;
        blockers.push([o.left - GAP, o.right + GAP]);
      }
      for (const [x0, x1] of freeSpans(blockers, GAP, STAGE.width - GAP)) {
        if (x1 - x0 < minWidth) continue;
        const box: Rect = { left: x0, top: y0, right: x1, bottom: y1 };
        const width = x1 - x0;
        if (!best || tipBetter(best, { box, width })) best = { box, width };
      }
    }
  }
  if (!best) return null;
  const card = cardBoxInside(best.box, TIP_HEIGHT);
  return {
    left: card.left + TIP_BADGE,
    width: Math.min(card.width - TIP_BADGE, MAX_ADVISOR_WIDTH),
    bottom: STAGE.height - best.box.bottom,
    maxHeight: TIP_HEIGHT,
    kind: 'tip',
  };
}

/** Is `b` a better home than `a`: comfortable beats cramped; among the comfortable the higher bar, then the leftmost; among the cramped the wider. */
function tipBetter(a: { box: Rect; width: number }, b: { box: Rect; width: number }): boolean {
  const ca = a.width >= TIP_COMFORTABLE_WIDTH;
  const cb = b.width >= TIP_COMFORTABLE_WIDTH;
  if (ca !== cb) return cb;
  if (!ca && Math.abs(a.width - b.width) > 0.01) return b.width > a.width;
  if (Math.abs(a.box.bottom - b.box.bottom) > 0.01) return b.box.bottom < a.box.bottom;
  return b.box.left < a.box.left - 0.01;
}
