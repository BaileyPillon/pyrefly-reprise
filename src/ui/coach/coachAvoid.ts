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

/**
 * FOC-05 residue (release-09 verifier): below the card, the mark's left edge sat
 * over the right tips of the command stack (the "Physical damage" help strip and
 * the TALK row; 4,245 px² of box overlap at 1280x720, 2,833 at 1600x900). Slide
 * the mark right until it clears `obstacle`, keeping its size and its top, as
 * long as it stays inside `stage` and does not land back on `card`. `null` when
 * nothing needs to move or no such slide exists (the vertical move above still
 * stands; a few px of graze is smaller than giving up the card band).
 */
export function slideClearOf(mark: Rect, obstacle: Rect, card: Rect | null, stage: Rect, gap = AVOID_GAP): Rect | null {
  if (!overlaps(mark, obstacle)) return null;
  const width = mark.right - mark.left;
  const left = obstacle.right + gap;
  const moved = { left, right: left + width, top: mark.top, bottom: mark.bottom };
  if (moved.right > stage.right) return null;
  if (card && overlaps(moved, card)) return null;
  return moved;
}

/** Box area two rects share, in px². */
function sharedArea(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * `r` grown by `gap` less 1 px on every side: a rect placed exactly `gap` clear
 * (as `bandClearOf` and the candidates below place it) must not read as inside
 * the margin because layout returned a fraction of a pixel less.
 */
function margin(r: Rect, gap: number): Rect {
  const by = Math.max(0, gap - 1);
  return { left: r.left - by, top: r.top - by, right: r.right + by, bottom: r.bottom + by };
}

/**
 * Slide `mark` right past every `side` box it meets (the command stack, its
 * help strip), as {@link slideClearOf} does for the stack alone, keeping its
 * size and top. `null` when it meets none, or when the slid rect would leave
 * `stage`, still meet a `side` box, or come within `gap` of a `hard` box.
 */
export function slidePast(
  mark: Rect,
  side: readonly Rect[],
  hard: readonly Rect[],
  stage: Rect,
  gap = AVOID_GAP,
): Rect | null {
  const hit = side.filter((s) => overlaps(mark, s));
  if (!hit.length) return null;
  const left = Math.max(...hit.map((s) => s.right)) + gap;
  const slid = { left, right: left + (mark.right - mark.left), top: mark.top, bottom: mark.bottom };
  if (slid.right > stage.right) return null;
  if (side.some((s) => overlaps(slid, s)) || hard.some((h) => overlaps(slid, margin(h, gap)))) return null;
  return slid;
}

/**
 * Yojimbo's Zanmato gauge (FFX, Chapter IX only; `ui/ffx/ZanmatoGauge.ts`) sits
 * in the same top band the line's `top: 11%` was written against, and on a
 * phone it fills the empty band the line's `top: 8%` uses. Move `mark` at least
 * `gap` clear of every `hard` box (the gauge panel, its banner while up, the
 * advisor card), keeping its size and, where it can, its column.
 *
 * Candidates are the mark's own top and its edges against every box, `gap`
 * clear of each; one that meets a `side` box first slides right of it
 * ({@link slidePast}). The winner clears every `hard` box by `gap` and shares
 * the least area with `soft` and `side` (every other HUD panel); ties go to the
 * smallest move, then to below. It is returned only when it is strictly better
 * than where the mark already is (a mark on a `hard` box is worst), so a
 * per-frame caller settles instead of hopping. `null` when nothing better
 * exists; the caller only asks while the gauge is on screen, so every battle
 * without it is untouched.
 */
export function clearOfPanels(
  mark: Rect,
  hard: readonly Rect[],
  soft: readonly Rect[],
  side: readonly Rect[],
  stage: Rect,
  gap = AVOID_GAP,
): Rect | null {
  const panels = [...soft, ...side];
  const costOf = (r: Rect): number => panels.reduce((sum, p) => sum + sharedArea(r, p), 0);
  const now = hard.some((h) => overlaps(mark, h)) ? Infinity : costOf(mark);
  if (now === 0) return null;
  const height = mark.bottom - mark.top;
  const tops = new Set([mark.top, ...[...hard, ...panels].flatMap((e) => [e.bottom + gap, e.top - gap - height])]);
  let best: { rect: Rect; cost: number; move: number } | null = null;
  for (const top of tops) {
    if (top < stage.top || top + height > stage.bottom) continue;
    const upright: Rect = { left: mark.left, right: mark.right, top, bottom: top + height };
    const rect = slidePast(upright, side, hard, stage, gap) ?? upright;
    if (hard.some((h) => overlaps(rect, margin(h, gap)))) continue;
    const cost = costOf(rect);
    const move = Math.abs(top - mark.top);
    const better =
      !best || cost < best.cost || (cost === best.cost && (move < best.move || (move === best.move && top > best.rect.top)));
    if (better) best = { rect, cost, move };
  }
  return best && best.cost < now ? best.rect : null;
}
