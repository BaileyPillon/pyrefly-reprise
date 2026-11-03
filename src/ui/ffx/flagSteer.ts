/**
 * THE TARGET FLAG AGAINST THE ADVISOR CARD IN CHAPTER XII (r74-omnis, 2026-11-02; FFX ONLY, rule 14: FFX-2's HUD never reaches this solver; the gate is the F1 HUD AND the disc read-out's marker, so Chapter I, every other chapter,
 * the F1 HUD off (TEXT SIZE 130, `?hud=today`, `?treated=pack`) and the phone answer "nothing" and move by not one pixel).
 *
 * ## What it fixes
 *
 * The r72 browser read walked the target cursor over 232 stops in Chapter XII (29 per window, eight windows, TEXT SIZE 100) and read the pro target flag (`.ffx-target__plate`) over the Move advisor card in 33 of them (1600 x 900 in 5, 1366 x 768 in 2,
 * 1440 x 810 in 9, 1536 x 864 in 6, 1920 x 1080 in 11, up to 15.3 px wide) and over the Enemy Intent line in one, 34 in all (`PieceHolds.ts`' old `hud` hold, this change lifts it; its text is kept in `docs/handoff/r74-omnis.md` section 8). The cause is in the
 * order of the two solvers. The flag docks beside the glove (`TargetCursor.dockFor`), against the panels it was handed at the last key press and with an UNSKEWED box (`targetCursorParts.plateBox` of `plateWidth`, which is right to about 1 px: 201.7 px at 1280 to 1600 wide, 213.0 at 1920, 269.3 at 2560) for a flag drawn
 * with `skewX(-12deg)`, so its bounding box is wider by its own height times tan 12 degrees (217.4, 230.7 and 291.2 px: 15.6 to 21.9 px, 5.5 to 7.8 grid px) and hangs that far past the place the dock judged it clear; and the advisor card is solved without knowing the flag at all, in the narrow
 * ground left of the Mortiphasm discs (x 203 to 300), where the flag's left edge lands (295 to 303). The two meet on the card's right edge. Fixing the dock's box (`plateBox` widened by the flag's height times tan 12 degrees; review m1, `docs/handoff/r74-omnis.md` section 9) would move the flag in every chapter of both games
 * (shared plumbing); this moves the card in Chapter XII, and only when the flag is on it.
 *
 * ## What it does
 *
 * The solver is told where the flag IS (measured from the DOM, in the stage's grid px) and keeps the card, its chip and the one-row tip off it, **but only once the flag lies on one of them** and then for as long as the flag is up:
 * a card the flag does not touch stays exactly where it stood, and a card the flag touches steps to the nearest clear ground (the solver's own answer, with the flag as one more solid box), falls to the
 * one-row tip, or is put away with the chip left on clear ground (the solver's decline), which is the "hidden while the cursor is up" the hold's lift condition names. The flag's box is held with a margin (`FLAG_PAD`) and replaced only when
 * the flag leaves it, so the sway of the figure (the flag drifts 8 grid px in a walk) does not re-solve the card at every frame; it is let go the frame the flag disappears, and the card comes home. The flag is in `keepOff` (the key of the
 * placement and the tip's list) and in the ink (`enemies`, the designed card's list): `hudAvoidSelectors.advisorKeepOffRects` and `advisorInkRects` add it, the call sites in `FFXBattleHud` are the lines they were.
 *
 * Two smaller pieces of the same lane: the Enemy Intent line is a panel the flag docks off ({@link omnisFlagPanelRects}; the walk read the flag 1.7 px onto it once, at 1280 x 720), and the Sensor card steers clear of the flag as well as
 * the figure (`sensorSteer.sensorSteerDx`, `flag` argument).
 */

import { growToGrid } from './hudPlacementKeys.ts';
import type { Rect } from './hudSafeZones.ts';

/** A DOM box in the stage's grid px, or `null` when it is hidden or zero-size (`hudAvoidSelectors.StageRectOf`: the same shape, defined here so the two modules do not import each other). */
type RectOf = (el: HTMLElement | null) => Rect | null;

/** The pro target flag: the plate `TargetCursor.plateHtml` draws beside the glove (the name, the TARGET label and the command's damage line). */
export const FLAG_SELECTOR = '.ffx-target__plate';

/** The advisor's two boxes the flag must not lie on: the card (or the tip bar) and its `N` chip. */
const ADVISOR_BOX_SELECTOR = '[data-role="move-advisor-card"], [data-role="move-advisor-toggle"]';

/** The Enemy Intent line of the disc read-out, the one chapter panel the flag's dock did not know (`omnisFlagPanelRects`). */
const FLAG_PANEL_SELECTOR = '.ffx-omr__intent';

/**
 * Grid px the held flag box is grown by each way. The flag drifts 5 to 8 grid px over a walk with the figure's sway (x 295.1 to 303.3 at 1600 x 900), and 4 absorbs the small steps so the card re-solves when the flag changes place, not when it
 * breathes. The solver adds its own GAP (6) beyond this.
 */
export const FLAG_PAD = 4;

/** The chapter and the layout this lane applies to: Chapter XII's disc read-out is live and the F1 HUD is on (`hud-f1`). The same gate as `hudAvoidSelectors.f1RibbonEls(hud, 'omnis')`. */
export function omnisF1On(hud: HTMLElement): boolean {
  return hud.classList.contains('hud-f1') && hud.hasAttribute('data-omnis-readout');
}

const hits = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const contains = (outer: Rect, inner: Rect): boolean => outer.left <= inner.left && outer.top <= inner.top && outer.right >= inner.right && outer.bottom >= inner.bottom;

/**
 * Chapter XII's disc read-out is live, in whatever layout the HUD is drawn: the F1 HUD, or release 71's frame (TEXT SIZE 130, `?hud=today`, `?treated=pack`). Not on the upright phone (its HUD is its own, and the F1 gate never reached it either).
 * The Sensor card's flag steer stands on this (R72-1, driver decision 219r, 2026-11-03); the advisor's does not (it stays on {@link omnisF1On}).
 */
export function omnisReadoutOn(hud: HTMLElement): boolean {
  return hud.hasAttribute('data-omnis-readout') && !document.documentElement.hasAttribute('data-phone-battle');
}

/** The first pro target flag with a size, in the stage's grid px, or `null` when none is up. */
function flagBox(hud: HTMLElement, rectOf: RectOf): Rect | null {
  for (const el of hud.querySelectorAll<HTMLElement>(FLAG_SELECTOR)) {
    const r = rectOf(el);
    if (r && r.right > r.left && r.bottom > r.top) return r;
  }
  return null;
}

/** The flag's box in the stage's grid px, or `null` when it is not up (no target cursor), or this is not Chapter XII on the F1 HUD. The advisor card and the dock read this one. */
export function omnisFlagRect(hud: HTMLElement, rectOf: RectOf): Rect | null {
  return omnisF1On(hud) ? flagBox(hud, rectOf) : null;
}

/**
 * The flag's box for the SENSOR CARD's steer (`FFXBattleHud.steerSensor`): the same box in Chapter XII on the F1 HUD, and now in Chapter XII's old looks too (R72-1, driver decision 219r, 2026-11-03; FFX only): at TEXT SIZE 130 the F1 HUD is
 * off (`F1_TEXT_CEILING`), and `?hud=today` and `?treated=pack` draw release 71's HUD, in which the Sensor card stands at the foot of the turn order (top 135 at TEXT SIZE 100) and lay on the flag at alternate stops of the cursor's walk. `null`
 * everywhere else: no read-out marker (Chapter I, every other chapter, FFX-2) and the phone move by not one pixel.
 */
export function omnisSensorFlagRect(hud: HTMLElement, rectOf: RectOf): Rect | null {
  return omnisReadoutOn(hud) ? flagBox(hud, rectOf) : null;
}

/** The held box per HUD: set the first time the flag lies on the advisor, kept while the flag stays inside it, replaced when it leaves, dropped when the flag is gone. */
const held = new WeakMap<HTMLElement, Rect>();

/**
 * The solid box the advisor's solver is given for the flag, as a list of zero or one rects (snapped outwards to whole grid px): empty while the flag is not up, or while it has not lain on the advisor's card or chip since it came up. Idempotent
 * within a frame (the ink and the `keepOff` builders both ask), and a function of the DOM and of the box it held last.
 */
export function flagInkRects(hud: HTMLElement, rectOf: RectOf): Rect[] {
  const flag = omnisFlagRect(hud, rectOf);
  if (!flag) {
    held.delete(hud);
    return [];
  }
  const box = held.get(hud);
  if (box && contains(box, flag)) return [box];
  if (!box) {
    const onAdvisor = [...hud.querySelectorAll<HTMLElement>(ADVISOR_BOX_SELECTOR)].some((e) => {
      const r = rectOf(e);
      return r !== null && hits(r, flag);
    });
    if (!onAdvisor) return [];
  }
  const ink = growToGrid({ left: flag.left - FLAG_PAD, top: flag.top - FLAG_PAD, right: flag.right + FLAG_PAD, bottom: flag.bottom + FLAG_PAD }, 1)!;
  held.set(hud, ink);
  return [ink];
}

/** A box in viewport px, the shape the target cursor's dock reads its panels in (`TargetCursor.setPanels`). */
export interface ViewportPanel {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The panels the flag's dock gets besides the HUD's own (`FFXBattleHud.applySelection`): in Chapter XII on the F1 HUD, the Enemy Intent line. Empty everywhere else, so no other chapter's flag docks differently. The disc strip and its note
 * are not listed: the flag docks at the figure's flank, well under them (y 133 and down against their foot at 48 at the most), and every walk stop read them clear.
 */
export function omnisFlagPanelRects(hud: HTMLElement): ViewportPanel[] {
  if (!omnisF1On(hud)) return [];
  return [...hud.querySelectorAll<HTMLElement>(FLAG_PANEL_SELECTOR)].flatMap((el) => {
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0 ? [{ x: b.left, y: b.top, w: b.width, h: b.height }] : [];
  });
}
