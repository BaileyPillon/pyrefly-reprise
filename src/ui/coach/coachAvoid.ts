/**
 * FOC-05 (FFX only): keep Auron's first-turn coach line clear of the move
 * advisor card without moving the card.
 *
 * `.mad__card`'s position is not a CSS constant — `MoveAdvisor.layout()` and
 * `src/ui/ffx/hudSafeZones.ts` solve it per frame against whatever the party
 * and the boss are doing (`docs/handoff/fix3-ffx-hud.md`), so the card can
 * land in the same "open sky" band the coach mark's own `left: 28%; top: 11%`
 * (`coach.css`) was written against. `critic/reviews/1b33971…-focused.md`
 * FOC-05 measured exactly that at 1600x900: mark `[448, 99, 400x145]`, card
 * `[402, 98, 370x189]`, 324x145 px of overlap.
 *
 * Because the card's box cannot be predicted from CSS alone, this module does
 * not try to pick a static percentage that dodges it. It is pure geometry —
 * given the mark's own default rect, the card's *actual, currently rendered*
 * rect, and the stage it both live in, it returns a new rect for the mark
 * that shares no area with the card, or `null` when the two already do not
 * overlap and nothing needs to move. `CoachMark.ts` is the only caller, and it
 * supplies the rects from `getBoundingClientRect()`; this file has no DOM
 * dependency, so `tests/unit/ui-coach-avoid-card.test.ts` pins it on plain
 * numbers, the way `tests/unit/pause-remake-css.test.ts` pins CSS clamps.
 */

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** True when two rects share any area (touching edges do not count). */
export function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** Clearance kept between the mark's moved edge and the card, in px. */
export const AVOID_GAP = 12;

/**
 * Move `mark` clear of `card`, staying inside `stage`, without changing its
 * size or its horizontal position.
 *
 * Only the vertical axis moves: `coach-mark`'s `left`/`max-width` already
 * keep it clear of the turn-order rail and the command stack (its own
 * comment in `coach.css`), and the reported collision was always vertical —
 * the two panels landing in the same horizontal band, not the same corner.
 * Below the card is tried first, since the approved frame
 * (`docs/concepts/onboarding/c-aurons-briefing/c2-first-use-ffx.png`) reads
 * top to bottom as "the line, then the card"; above is used when the stage
 * has more room there; and when neither side clears the full mark height the
 * side with more room is used anyway, clamped inside the stage, because a
 * mark pinned a few px into the card's margin is still a smaller defect than
 * the 324x145 px the build shipped.
 */
export function bandClearOf(mark: Rect, card: Rect, stage: Rect, gap = AVOID_GAP): Rect | null {
  if (!overlaps(mark, card)) return null;

  const height = mark.bottom - mark.top;
  const spaceAbove = card.top - stage.top;
  const spaceBelow = stage.bottom - card.bottom;

  let top: number;
  if (spaceBelow >= height + gap) {
    top = card.bottom + gap;
  } else if (spaceAbove >= height + gap) {
    top = card.top - gap - height;
  } else if (spaceBelow >= spaceAbove) {
    top = Math.min(stage.bottom - height, card.bottom + gap);
  } else {
    top = Math.max(stage.top, card.top - gap - height);
  }

  const width = mark.right - mark.left;
  return { left: mark.left, right: mark.left + width, top, bottom: top + height };
}
