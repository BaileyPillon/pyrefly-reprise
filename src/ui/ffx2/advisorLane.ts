import {
  ADVISOR_CLEARANCE_GAP,
  ADVISOR_MAX_CARD_WIDTH,
  ADVISOR_MIN_CARD_WIDTH,
} from '../common/MoveAdvisor.ts';

/**
 * Where FFX-2's move-advisor card goes along the bottom band, in the 640x360
 * stage grid (critic round 09 PR-0091).
 *
 * The card sits between two walls: on the left, the girls standing in its band
 * (the `party-right` fence); on the right, the party HP rows (the
 * `party-column` fence). The rows are HUD the player reads every turn, so that
 * wall is hard. The girls are the soft one.
 *
 * Until PR-0091 the left wall was simply "past the right shoulder of every girl
 * whose feet are below the card's top". After a chain seam in chapters 5 and 6
 * the formation is restaged with Rikku and Paine standing well to the right, and
 * the card, taller since FOC-06 raised its type floor, counted both of them as
 * in its band. That left 13 grid px between the girls and the rows, the card
 * refused to go under its 132 px minimum, and it painted straight across
 * Yuna's and Rikku's HP rows (measured at 1600x900, seed 1, link 2: card
 * [1059,616,1436,835] over the rows, 46,010 px2 of overlap).
 *
 * The answer, in order of preference:
 *
 *  1. **clear**: the old lane, right of every girl in the band, whenever it is
 *     still at least the card's minimum width. Nothing changes where the old
 *     placement worked.
 *  2. **under**: otherwise the lane that keeps the tallest card while it
 *     passes *under* the feet of every girl it spans, as live 1b33971 did at
 *     the same seam. The cap is handed back as a `max-height`, and the card's
 *     own density ladder (`MoveAdvisor.fitCard`) prints less until it fits.
 *  3. **squeezed**: no lane leaves even {@link MIN_UNDER_ROOM}. The card keeps
 *     the old left wall and `MoveAdvisor`'s `wall: 'before'` slides it left
 *     over the girls rather than over the rows.
 *
 * Pure, so the whole decision is unit-tested (`tests/unit/ffx2-advisor-lane.test.ts`).
 * FFX-2 only: FFX places its card through `ffx/hudSafeZones.ts`.
 */

/** One girl's body box as the card sees it, in stage px (the card's skew lean already added on both sides). */
export interface LaneFigure {
  left: number;
  right: number;
  /** Stage y of her lowest point (the feet). */
  foot: number;
}

export interface LaneInput {
  figures: readonly LaneFigure[];
  /** The card's left edge when nobody is in the way (`ADVISOR_FALLBACK_LEFT`). */
  floor: number;
  /** The party column fence's stage x: the card stops `ADVISOR_CLEARANCE_GAP` before it. */
  wall: number;
  /** Stage y of the card's bottom edge (`360 - ADVISOR_BOTTOM`). */
  base: number;
  /** Height of the `N HIDE MOVES` chip parked above the card, plus its 2 px gap. */
  chip: number;
  /** The card's current layout height. */
  cardHeight: number;
  /** The cap already applied for this decision, if any; a cap only tightens within a decision. */
  cap: number | null;
}

export interface Lane {
  /** Stage x for the `party-right` fence (the card starts `1 + ADVISOR_CLEARANCE_GAP` after it). */
  after: number;
  /** Inline `max-height` for the card in grid px, or `null` for the stylesheet's own. */
  maxHeight: number | null;
  mode: 'clear' | 'under' | 'squeezed';
}

/** The fence element's own width: `MoveAdvisor.layout` reads `offsetLeft + offsetWidth`. */
const FENCE_WIDTH = 1;
/** Air between a girl's feet and the top of the chip above the card. */
const FOOT_GAP = 2;
/**
 * The shortest card worth passing under the feet: the head line plus one named
 * move at the 12.2 px rendered floor (FOC-06), which is about 7 grid px a line
 * at 1600x900 and 9 at 1280x720, plus the card's padding. Under this the card
 * would be a strip of names with nothing behind them, and sliding it over the
 * girls' legs (mode `squeezed`) is the lesser evil.
 */
export const MIN_UNDER_ROOM = 36;
/** `move-advisor.css`'s own `max-height`; a lane with more room than this needs no inline cap. */
export const CARD_CSS_CAP = 104;

/** Width the card gets when its fence is parked at `after`. */
function laneWidth(after: number, wall: number): number {
  return wall - ADVISOR_CLEARANCE_GAP - (after + FENCE_WIDTH + ADVISOR_CLEARANCE_GAP);
}

export function solveAdvisorLane(input: LaneInput): Lane {
  const { figures, floor, wall, base, chip, cardHeight, cap } = input;

  // 1. The old lane: past every girl whose feet are below the card's top.
  const top = base - cardHeight - chip;
  let after = floor;
  // A girl standing past the wall (under the rows) is not in the lane at all.
  for (const f of figures) if (f.foot > top && f.left < wall) after = Math.max(after, f.right);
  if (laneWidth(after, wall) >= ADVISOR_MIN_CARD_WIDTH) return { after, maxHeight: cap, mode: 'clear' };

  // 2. Under their feet: every lane that starts at the floor or at a girl's
  // right shoulder and is wide enough, scored by the tallest card it can take.
  let best: { after: number; room: number } | null = null;
  for (const x0 of [floor, ...figures.map((f) => f.right)]) {
    if (x0 < floor) continue;
    const usable = laneWidth(x0, wall);
    if (usable < ADVISOR_MIN_CARD_WIDTH) continue;
    const left = x0 + FENCE_WIDTH + ADVISOR_CLEARANCE_GAP;
    const right = left + Math.min(ADVISOR_MAX_CARD_WIDTH, usable);
    let room = Number.POSITIVE_INFINITY;
    for (const f of figures) {
      if (f.right > left && f.left < right) room = Math.min(room, base - chip - FOOT_GAP - f.foot);
    }
    // Ties go to the lane further right, the side the old placement favoured.
    if (!best || room > best.room || (room === best.room && x0 > best.after)) best = { after: x0, room };
  }
  if (best && best.room >= MIN_UNDER_ROOM) {
    const room = best.room >= CARD_CSS_CAP ? null : best.room;
    const maxHeight = room === null ? cap : cap === null ? room : Math.min(cap, room);
    return { after: best.after, maxHeight, mode: 'under' };
  }

  // 3. Nowhere to stand: `MoveAdvisor`'s hard wall slides the card left.
  return { after, maxHeight: cap, mode: 'squeezed' };
}
