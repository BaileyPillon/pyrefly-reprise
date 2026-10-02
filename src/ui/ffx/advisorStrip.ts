/**
 * The advisor card's last resort: a one-line **strip** on the deck (F3 / PR-0274,
 * FFX only: the FFX HUD's solver; FFX-2's HUD never declines the card).
 *
 * `hudSafeZones.advisorZone` hands the card a box only when a clear rectangle
 * holds it at 132 wide and 72 tall, or at 80 wide. In Sin's two chapters
 * (XVII, XVIII) no such rectangle exists on the first menu of a link: the
 * boss's frame fills the middle of the stage, the strategy guide holds the
 * top-left corner and the Sin clock or Fin plate holds the rest, so the card
 * was declined (and, with it, the chip: `advisorChipFollow`) and a player on
 * the default setting saw no advice at all. What stays clear is the band of
 * deck under the party's feet, between the command stack and the party
 * column: about 184 grid px wide and 48 tall.
 *
 * That band is too short for the designed card but not for its **tersest
 * density rung** (the name, the move and the board's note: 31 grid px of
 * content at 132 wide, `hudSafeZones.MIN_ADVISOR_HEIGHT`'s own table), so this
 * third pass tries the same solve with a lower height floor. It runs only when
 * both of `advisorZone`'s passes decline, which none of the other eight FFX
 * chapters ever reach (`tests/unit/ui-ffx-hud-safe-zones.test.ts` pins that),
 * so no chapter that has a card today changes.
 */

import {
  ADVISOR_CHIP_RESERVE,
  MAX_ADVISOR_HEIGHT,
  MAX_ADVISOR_WIDTH,
  MIN_ADVISOR_WIDTH,
  SKEW,
  STAGE,
  advisorZone as solveDesigned,
  cardBoxInside,
  obstaclesOf,
  solveBox,
  type AdvisorZone,
  type AdvisorZoneInput,
} from './hudSafeZones.ts';

/** The shortest card the strip pass will lay out, in grid px (the tersest rung needs 31). */
export const STRIP_MIN_HEIGHT = 34;

/** `advisorZone`, then the strip; `null` only when even a strip has no clear ground. */
export function advisorZone(input: AdvisorZoneInput): AdvisorZone | null {
  const designed = solveDesigned(input);
  if (designed) return designed;
  const reserve = Math.max(ADVISOR_CHIP_RESERVE, input.chipReserve ?? 0);
  const box = solveBox(obstaclesOf(input), {
    minWidth: MIN_ADVISOR_WIDTH + SKEW * STRIP_MIN_HEIGHT,
    minHeight: STRIP_MIN_HEIGHT + reserve,
    anchor: { x: input.cmdArea.right, y: input.cmdArea.top },
  });
  if (!box) return null;
  const boxWidth = box.right - box.left;
  const height = Math.min(MAX_ADVISOR_HEIGHT, box.bottom - box.top - reserve, (boxWidth - MIN_ADVISOR_WIDTH) / SKEW);
  if (height < STRIP_MIN_HEIGHT) return null;
  const card = cardBoxInside(box, height);
  if (card.width < MIN_ADVISOR_WIDTH) return null;
  return { left: card.left, width: Math.min(card.width, MAX_ADVISOR_WIDTH), bottom: STAGE.height - box.bottom, maxHeight: height, kind: 'compact' };
}
