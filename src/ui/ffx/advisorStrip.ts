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
 * third pass tries the same solve with a lower height floor. It runs only in the
 * Sin fights, and only when both of `advisorZone`'s passes decline, so no other
 * chapter's card changes.
 *
 * **After it, for every fight, comes the tip** (r3942-giants-ffx, `./advisorTip.ts`): one row of the card on whatever thin clear ground is left, for the frames the strip
 * cannot serve either (Chapters I and III at Bailey's giants' sizes: their clear ground is 28 to 40 grid px tall, and the strip needs 45).
 */

import { foldedGuideZone, underTheChipRow } from './advisorFolded.ts';
import { roomier } from './advisorRoomy.ts';
import { tipZone } from './advisorTip.ts';
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

/**
 * `advisorZone`, then (only when `strip` is set) the strip, then (only when `tip` is set) the
 * one-row tip (`advisorTip.ts`); `null` when even a tip has no clear ground. The HUD sets `strip` in
 * the two Sin fights alone (their state carries `sin.*` flags), and `tip` in every fight but while the
 * enemy-move read-out is open: a read-out opened with E takes the band, and the card with it, as a
 * designed answer that tests pin. No chapter whose card the designed passes place can move: the
 * strip and the tip are asked only of a board they all declined.
 */
export function advisorZone(input: AdvisorZoneInput, strip = false, tip = false): AdvisorZone | null {
  // Chapters I and III with the guide folded (`advisorFolded.ts`): the full card under the chip row with the N chip beside the G chip; failing that, the designed passes against the same band (the chip above the card).
  // The HUD measured that the card does not fit the guide's rail at this decision (`foldedFallback`, which only means something with the folded chip): no card of any box, the tip.
  const fallback = !!input.guideChip && input.foldedFallback === true;
  if (input.guideChip && !fallback) {
    const folded = foldedGuideZone(input);
    if (folded) return folded;
  }
  const guarded = underTheChipRow(input);
  const designed = fallback ? null : roomier(guarded, solveDesigned(guarded)); // PR-0330: a compact answer is improved first
  if (designed) return designed;
  const stripped = strip ? stripZone(input) : null;
  if (stripped || !tip) return stripped;
  return tipZone(input);
}

/** The Sin fights' strip: the designed solve with a lower height floor (34), or `null`. */
function stripZone(input: AdvisorZoneInput): AdvisorZone | null {
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
