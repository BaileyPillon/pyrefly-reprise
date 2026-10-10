/**
 * The NEXT BEST MOVE card in the strategy guide's place, while the guide is folded (FFX only, Chapters I and III: `SceneStaging.guideFolded`; branch r3943-int, Bailey's pick "A2" of 2026-10-09).
 *
 * ## Why it exists
 *
 * Bailey's giants (2026-10-08) filled the sky where the card stood in Chapters I and III, so the guide's rail was the only ground the full card could have, and the card became a one-row tip
 * (`advisorTip.ts`). Bailey's pick of 2026-10-09 is the other way round: at the start of those two fights the guide is **folded** to its `G` chip (`StrategyGuide.startFolded`), the full designed
 * card stands in the guide's place, `G` opens the guide as ever and **while the guide is open the card falls back to the tip**.
 *
 * The first picture of that (the options sheet's A2: pressing `G` on the branch as it stood) had a defect the sheet measured in all six frames: the designed passes place the card in the rail's room,
 * which begins where the guide's sheet began, so the card (30 to 100 percent of the chip) or its `N` chip, riding above it (17 to 94 percent), stood on the folded guide's own `G` chip, the key that
 * brings the guide back. The chip is not an obstacle to the designed passes while the guide is open (the sheet is below it) and the passes never knew it was there when the sheet was not.
 *
 * ## What it does
 *
 * - **The chip row is a band no card box may cross.** The folded chip's height, across the whole stage, is an obstacle to the designed card (`foldedBand`), and the box under it starts
 *   {@link FOLDED_CHIP_CLEARANCE} grid px below the chip (the solver puts `GAP` round every obstacle, so the band is shortened by the difference).
 * - **The `N` chip parks in the row, beside the `G` chip** ({@link CHIP_BESIDE_GAP} to its right, on its baseline), not above the card: the rail between the chip row and the help slab under it is
 *   66 to 70 grid px, which holds the card (the short card's 60 at the least, 68 to print every line) but not the card and the chip above it (the 11 grid px of `ADVISOR_CHIP_RESERVE`), so a chip above the
 *   card either stands on the `G` chip or costs the card its lines. The dock is sized for the chip's longer label, whichever word it says (`advisorChipSizes.ts`), so it does not move when `N` changes the word
 *   or when the tip and the card swap places. Where the whole label does not fit in the row (a window so small that the type floor makes the chips wide, beside a giant that reaches into the rail's
 *   top: Chapter III at 1024x768) it parks as the **key-only badge** the tip uses (`AdvisorZone.chip.badge`), which is 21 grid px there: the HUD draws the chip as the badge while the card is up, and with
 *   the card put away by `N` the chip reads in full where the card stood.
 * - **The card stands in the rail and nowhere else**: between the chip row and the help slab under it (`foldedFloor`), at every decision. The box search takes the tallest clear box on the stage, and a
 *   decision whose actor has a shorter command stack offered a box above the stack a grid px taller than the rail: the card moved 110 grid px down between two decisions. The rail ends
 *   {@link FOLDED_SLAB_GAP} grid px above the help slab's reserved slot, not the solver's `GAP` of 6: the full card at 1600x900 and 1440x900 is 69 grid px tall and a rail of 68 held it at the edge of
 *   `MoveAdvisor.fitCard`'s one grid px of tolerance, which leaves its last 2 grid px of padding under the card's own bottom border (clipped, `scrollHeight` 69 against a `clientHeight` of 67, which
 *   `advisor-zone.spec.ts` counts as a clipped card); a rail of 70 holds it with room to spare.
 * - **The card is never wider than `COMFORTABLE_ADVISOR_WIDTH`** (180 grid px: "past this the card is comfortable", `hudSafeZones.ts`). The scene stands 25 grid px further right at the first menu of a fight than at the later
 *   ones (the camera's opening shot), so the room beside the card was 36 grid px wider at the first menu than at the second (Chapter I at 1600x900: 209.5 and 173.5), and a card that took all of it was a card of
 *   another width at the first menu than at every other. Capped, the card keeps the left edge, the bottom edge and the height budget it has everywhere (they are the same at every decision) and its right edge follows
 *   the room beside it, which differs by 0 to 12 grid px from one decision to the next with where the party and the floating Mortiorchis stand, and by 26 at Chapter I's first menu at 1024x768 (measured at three decisions of each of the six frames).
 * - **It reads the fighters where the camera's shot comes to rest** (`AdvisorZoneInput.enemiesAtRest`, a fresh solve only), as the tip does: a floating enemy's live painted box moves (Mortiorchis's left edge
 *   travels 11 grid px in twelve seconds) and the placement is held for the whole decision, so a card solved against it has the width of the moment it was solved in.
 * - **It declines when it cannot**: no chip size, neither chip fitting in the row, or no clear box holding the card under the band. `advisorStrip.advisorZone` then runs the designed passes
 *   against the same band (the chip above the card, so a shorter card or none), and the tip after them, which keeps off the chips already (`keepOff`).
 *
 * Pure arithmetic on the 640x360 grid, tested on boards measured at the six frames in `tests/unit/ui-ffx-advisor-folded.test.ts`.
 */

import { SHORT_ADVISOR_HEIGHT } from './advisorRoomy.ts';
import {
  COMFORTABLE_ADVISOR_WIDTH,
  GAP,
  MIN_ADVISOR_HEIGHT,
  MIN_ADVISOR_WIDTH,
  NARROW_ADVISOR_WIDTH,
  STAGE,
  obstaclesOf,
  solveCard,
  type AdvisorZone,
  type AdvisorZoneInput,
  type Rect,
} from './hudSafeZones.ts';

/** Grid px between the folded `G` chip's bottom edge and the top of the box the card stands in. */
export const FOLDED_CHIP_CLEARANCE = 3;

/** Grid px between the folded `G` chip and the advisor's `N` chip on its right. */
export const CHIP_BESIDE_GAP = 4;

/** Grid px between the bottom edge of the card's box and the top of the help slab's reserved slot (the solver's own gap round an obstacle is `GAP`, 6; the rail takes 2 of those back, see the file's note). */
export const FOLDED_SLAB_GAP = 4;

/** The band across the stage at the folded guide chip's height: no card box may cross it, and the box under it starts {@link FOLDED_CHIP_CLEARANCE} below the chip. */
export function foldedBand(chip: Rect): Rect {
  return { left: 0, top: chip.top, right: STAGE.width, bottom: Math.max(chip.top + 1, chip.bottom - (GAP - FOLDED_CHIP_CLEARANCE)) };
}

/**
 * Everything from the help slab's top edge down (less the 2 grid px the rail takes back, {@link FOLDED_SLAB_GAP}), across the whole stage: the card stands in the guide's rail, between the chip row and the slab, and **nowhere else**. Without it the box search takes
 * the tallest clear box on the stage, and at a decision whose actor has a shorter command stack (Chapter III at 1024x768: the second decision) a box above the stack is a grid px taller than the rail
 * and the card moved 110 grid px down between two decisions (measured). The slab's reserved slot is always in the input (`FFXBattleHud`: `CMD_INFO_SLOT`); the command stack's top stands in for it.
 */
export function foldedFloor(input: Pick<AdvisorZoneInput, 'cmdInfo' | 'cmdArea'>): Rect {
  // The solver puts `GAP` round every obstacle, so a floor `GAP - FOLDED_SLAB_GAP` below the slab's top ends the box `FOLDED_SLAB_GAP` above it.
  return { left: 0, top: (input.cmdInfo ?? input.cmdArea).top + (GAP - FOLDED_SLAB_GAP), right: STAGE.width, bottom: STAGE.height };
}

/** Where a chip of `size` stands beside the `G` chip, in the chip row on its baseline; null for no size. */
export function chipBeside(chip: Rect, size: { readonly width: number; readonly height: number } | null | undefined): Rect | null {
  if (!size || size.width <= 0 || size.height <= 0) return null;
  const left = chip.right + CHIP_BESIDE_GAP;
  return { left, top: chip.bottom - size.height, right: left + size.width, bottom: chip.bottom };
}

/**
 * The input with the chip row as one more obstacle: what every pass that is **not** the folded placement itself solves against (the designed passes, and the chip's own dock when the card is declined),
 * so nothing the HUD places in the guide's place, the card, its `N` chip or either alone, can stand on the `G` chip. The tip keeps off the chip already (`keepOff`). Unchanged when the guide is not folded.
 */
export function underTheChipRow(input: AdvisorZoneInput): AdvisorZoneInput {
  return input.guideChip ? { ...input, enemies: [...(input.enemies ?? []), foldedBand(input.guideChip)] } : input;
}

const touches = (a: Rect, b: Rect, margin: number): boolean => a.left < b.right + margin && a.right > b.left - margin && a.top < b.bottom + margin && a.bottom > b.top - margin;

/**
 * The designed card under the folded guide's chip row, with the `N` chip beside the `G` chip (its whole label, else the key-only badge), or `null` (see the file's note: the caller falls back to the
 * designed passes against the band). The designed card at its full height if the rail holds it, else the short card (`advisorRoomy.SHORT_ADVISOR_HEIGHT`), else the narrow one; the density ladder
 * (`MoveAdvisor.fitCard`) trims what the height cannot hold, as it does for every zone.
 */
export function foldedGuideZone(given: AdvisorZoneInput): AdvisorZone | null {
  const chip = given.guideChip;
  if (!chip) return null;
  // The fighters where the camera's shot comes to rest, as the tip reads them (`enemiesAtRest`, a fresh solve only): the placement is held for the whole decision, and the live painted box of a floating
  // enemy moves (Mortiorchis's left edge travels 11 grid px in twelve seconds), so a card solved against it has the width of the moment it was solved in (measured: Chapter I at 1600x900, 209.5 grid px at the
  // first menu and 201.5 after the guide was opened and folded again, one decision). The rest box does not move.
  const input = given.enemiesAtRest ? { ...given, enemies: given.enemiesAtRest } : given;
  // The help slab's reserved slot is the rail's floor (`foldedFloor`), not an obstacle of its own: it would put the solver's whole `GAP` between the card and the slab.
  const others = obstaclesOf(input).filter((o) => o !== input.cmdInfo);
  // The chip stands in the chip row: clear of every panel and every fighter (the guide's own sheet is folded, so it is not one).
  let dock: { rect: Rect; badge: boolean } | null = null;
  for (const [size, badge] of [[input.chipSize, false], [input.badgeSize, true]] as const) {
    const rect = chipBeside(chip, size);
    if (rect && rect.right <= STAGE.width - GAP && !others.some((o) => touches(rect, o, 1))) {
      dock = { rect, badge };
      break;
    }
  }
  if (!dock) return null;
  const obstacles = [...others, foldedBand(chip), foldedFloor(input)];
  const full = solveCard(obstacles, input, MIN_ADVISOR_WIDTH, 0, MIN_ADVISOR_HEIGHT) ?? solveCard(obstacles, input, MIN_ADVISOR_WIDTH, 0, SHORT_ADVISOR_HEIGHT);
  const narrow = full ? null : solveCard(obstacles, input, NARROW_ADVISOR_WIDTH, 0, SHORT_ADVISOR_HEIGHT);
  const solved = full ?? (narrow ? ({ ...narrow, kind: 'compact' } as AdvisorZone) : null);
  const zone = solved ? { ...solved, width: Math.min(solved.width, COMFORTABLE_ADVISOR_WIDTH) } : null;
  return zone ? { ...zone, chip: { left: dock.rect.left, bottom: STAGE.height - dock.rect.bottom, ...(dock.badge ? { badge: true } : {}) } } : null;
}
