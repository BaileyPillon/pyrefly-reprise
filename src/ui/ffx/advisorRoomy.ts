/**
 * The advisor card keeps its detail lines when the framing squeezes the free ground
 * (PR-0330, FFX only: the FFX HUD's solver; FFX-2's card is placed by `ffx2/advisorLane.ts`).
 *
 * `hudSafeZones.advisorZone` tries the card at its designed size (132 wide, 72 tall), then at
 * the narrow 80-wide `compact` size, and ranks a box by its **raw** height first. Release 36's
 * colossus framing stands the party and the boss a little differently, and two things followed,
 * both measured at 1600x900 and 2000x1012 (round 19b):
 *
 *  1. **Braska's Final Aeon (Ch III)**: the sky shelf between the strategy guide and the boss
 *     was 80 grid px tall, 3 short of the 83 the designed pass asks (72 + the chip's 11), so the
 *     card fell to the 97-wide compact box and lost its `NO MP`, effect and numbers lines. A
 *     182 x 80 clear box is a perfectly good home for the full card: the card is only 69 tall
 *     in it, and the density ladder (`MoveAdvisor.fitCard`) trims the rest on its own.
 *  2. **Yojimbo (Ch IX)**: the compact pass preferred a 96 x 128 slot between the help slab and
 *     Ginnem to a 121 x 109 one beside the guide, because the raw box was taller. But the card
 *     is the *width* of the box minus its shear, so the tall slot gave an 80 x 75 card (heading,
 *     GUIDE'S PICK, numbers and hits all dropped) while the roomier one gives 100 x 98, the card
 *     live 35 printed in full.
 *
 * So, when the designed solver can only offer `compact`, two more passes run before it is
 * accepted: the full-width card at {@link SHORT_ADVISOR_HEIGHT}, then the compact pass ranked by
 * the **card's own area**. Both stay clear of every panel and fighter, exactly as the designed
 * passes do. Nothing changes for a chapter whose designed pass already yields a full card, and a
 * declined card (the `E` read-out, the Sin fights) stays declined here.
 *
 * **Neither may print less than the designed card did** (repair of the r38 check, Chapter VII,
 * Seymour Omnis): the density ladder trims by *height*, so a wide card that is short loses the
 * heading and the effect line, which the narrow, tall `compact` card kept. At 2000x1012 Omnis's
 * compact card was 86 wide and 104 tall and printed 11 lines; the 132 x 66 short card printed 9.
 * The short card is therefore taken only when it is at least {@link enoughHeight} tall: the
 * height a full card measures (68 grid px, {@link FULL_CARD_HEIGHT}), or the designed card's own
 * height when that is less. Chapter III's short card is 69 tall (it printed all ten lines, where
 * its 97-wide compact card printed seven); Omnis's is 62 to 66, so it keeps its designed card. The
 * area-ranked compact card is taken only when it is wider **and** at least as tall as the designed
 * one (Yojimbo: 100 x 98 against 80 x 75); Omnis's alternative, 112 x 77 against 85 x 98, trades
 * height for width and is refused.
 *
 * Pure arithmetic on the 640x360 grid, tested in `tests/unit/ui-ffx-advisor-roomy.test.ts`.
 */

import {
  ADVISOR_CHIP_RESERVE,
  GAP,
  MAX_ADVISOR_HEIGHT,
  MAX_ADVISOR_WIDTH,
  MIN_ADVISOR_HEIGHT,
  MIN_ADVISOR_WIDTH,
  NARROW_ADVISOR_WIDTH,
  POCKET_BOTTOM,
  SKEW,
  STAGE,
  anchorOf,
  cardBoxInside,
  describe,
  freeSpans,
  obstaclesOf,
  solveBox,
  type AdvisorZone,
  type AdvisorZoneInput,
  type Rect,
} from './hudSafeZones.ts';

/**
 * The shortest full-width card worth placing, in grid px. The designed pass wants 72; the
 * tersest rung at 132+ wide needs 31 (`hudSafeZones.MIN_ADVISOR_HEIGHT`'s table) and a
 * 167-wide card with a reason line measured 63-69, so 60 keeps the ladder at its middle rungs.
 */
export const SHORT_ADVISOR_HEIGHT = 60;

/**
 * The height, in grid px, at which the advisor card prints every line it has for a decision:
 * measured on the FFX HUD at 1600x900 as `scrollHeight` 68 (Seymour Omnis, live card and short
 * card alike) and 69 to 70 (Braska's Final Aeon). Below it the density ladder starts dropping
 * the heading and the effect line.
 */
export const FULL_CARD_HEIGHT = 68;

/** The height a replacement for `designed` must reach so that it prints at least as much. */
export function enoughHeight(designed: AdvisorZone): number {
  return Math.min(designed.maxHeight, FULL_CARD_HEIGHT);
}

/** The card a solved box holds, or `null`: the same arithmetic as `hudSafeZones.solveCard`. */
function cardIn(box: Rect, minWidth: number, minHeight: number, reserve: number, input: AdvisorZoneInput): AdvisorZone | null {
  const boxWidth = box.right - box.left;
  const height = Math.min(MAX_ADVISOR_HEIGHT, box.bottom - box.top - reserve, (boxWidth - minWidth) / SKEW);
  if (height < minHeight) return null;
  const card = cardBoxInside(box, height);
  if (card.width < minWidth) return null;
  return {
    left: card.left,
    width: Math.min(card.width, MAX_ADVISOR_WIDTH),
    bottom: STAGE.height - box.bottom,
    maxHeight: height,
    kind: describe(box, input),
  };
}

/** The full-width card at {@link SHORT_ADVISOR_HEIGHT}, in the best clear box that holds it. */
export function shortFullZone(input: AdvisorZoneInput): AdvisorZone | null {
  const reserve = Math.max(ADVISOR_CHIP_RESERVE, input.chipReserve ?? 0);
  const box = solveBox(obstaclesOf(input), {
    minWidth: MIN_ADVISOR_WIDTH + SKEW * SHORT_ADVISOR_HEIGHT,
    minHeight: SHORT_ADVISOR_HEIGHT + reserve,
    anchor: anchorOf(input),
    minWidthAt: (boxWidth) => boxWidth - SKEW * SHORT_ADVISOR_HEIGHT >= MIN_ADVISOR_WIDTH,
  });
  return box ? cardIn(box, MIN_ADVISOR_WIDTH, SHORT_ADVISOR_HEIGHT, reserve, input) : null;
}

/** How much card a zone prints: its layout width times the height it may grow to. */
export function cardArea(zone: AdvisorZone): number {
  return zone.width * zone.maxHeight;
}

/**
 * The narrow (`compact`) card in the clear box that gives it the most **area**.
 *
 * Every strip between two cut lines is measured, as `hudSafeZones.solveBox` does, but a box is
 * ranked by the card it yields rather than by its own height: width and height trade through the
 * shear, so a tall, narrow slot can hold a smaller card than a shorter, wider one.
 */
export function roomiestCompactZone(input: AdvisorZoneInput): AdvisorZone | null {
  const obstacles = obstaclesOf(input);
  const reserve = Math.max(ADVISOR_CHIP_RESERVE, input.chipReserve ?? 0);
  const anchor = anchorOf(input);
  const top = GAP;
  const bottom = STAGE.height - POCKET_BOTTOM;
  const ys = new Set<number>([top, bottom]);
  for (const o of obstacles) {
    for (const y of [o.top - GAP, o.bottom + GAP]) if (y > top && y < bottom) ys.add(y);
  }
  const cuts = [...ys].sort((a, b) => a - b);
  let best: { zone: AdvisorZone; dist: number } | null = null;
  for (let i = 0; i < cuts.length; i++) {
    for (let j = i + 1; j < cuts.length; j++) {
      const y0 = cuts[i]!;
      const y1 = cuts[j]!;
      if (y1 - y0 < MIN_ADVISOR_HEIGHT + reserve) continue;
      const blockers: Array<[number, number]> = [];
      for (const o of obstacles) {
        if (o.bottom + GAP <= y0 || o.top - GAP >= y1) continue;
        blockers.push([o.left - GAP, o.right + GAP]);
      }
      for (const [x0, x1] of freeSpans(blockers, GAP, STAGE.width - GAP)) {
        const box: Rect = { left: x0, top: y0, right: x1, bottom: y1 };
        const zone = cardIn(box, NARROW_ADVISOR_WIDTH, MIN_ADVISOR_HEIGHT, reserve, input);
        if (!zone) continue;
        const dist = Math.hypot(Math.max(box.left - anchor.x, 0, anchor.x - box.right), Math.max(box.top - anchor.y, 0, anchor.y - box.bottom));
        const gain = best ? cardArea(zone) - cardArea(best.zone) : 1;
        if (!best || gain > 0.01 || (Math.abs(gain) <= 0.01 && dist < best.dist)) best = { zone: { ...zone, kind: 'compact' }, dist };
      }
    }
  }
  return best?.zone ?? null;
}

/**
 * `designed` (the result of `hudSafeZones.advisorZone`) improved where it settled for `compact`:
 * the full-width short card if a clear box holds one that is tall enough, else the compact card
 * with the most area if it dominates `designed` (it must not print less than `designed`).
 * Any other answer, including `null`, is returned untouched.
 */
export function roomier(input: AdvisorZoneInput, designed: AdvisorZone | null): AdvisorZone | null {
  if (!designed || designed.kind !== 'compact') return designed;
  const short = shortFullZone(input);
  if (short && short.width >= designed.width && short.maxHeight >= enoughHeight(designed)) return short;
  const roomy = roomiestCompactZone(input);
  // The compact pass must be wider *and* at least as tall: a tall slot traded for a wide one prints less.
  const dominates = roomy && roomy.width >= designed.width && roomy.maxHeight >= designed.maxHeight;
  return roomy && dominates && cardArea(roomy) > cardArea(designed) + 0.01 ? roomy : designed;
}
