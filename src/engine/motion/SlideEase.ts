/**
 * WHETHER THE KNOCK-OUT FLOOR SLIDE EASES IN (r72-motion, review majors M1 and M3; both games: the actor layer is shared by FFX chapters 1 to 3 and FFX-2 chapters 4 to 6, and the gate asks the chapter's own switches,
 * so it follows whichever game the treated chapter is).
 *
 * `ProneLay.layProneFigures(..., dt)` eases the lying body from its station to the place the stage chose over `SLIDE_EASE_MS`; with no `dt` the whole slide lands on the frame the figure goes down, which is release 70's
 * look (and release 71's). The stage asks this module what to pass, so the ease is a piece of the motion treatment and answers to its switches:
 *
 * - **REDUCE MOTION gets no new motion (M1).** The knock-out is a deliberate cut under REDUCE MOTION (`KoFall.koMode`: "no buckle, no tilt, no topple, no puff, no fade", Bailey's pick of 2026-10-10), so the lying body is
 *   shown whole at its place on the frame it goes down, as release 70 shows it. An ease would have glided it for 43 frames (Ixion's 355 px at up to 16 px a frame) for the player who asked for less.
 * - **The off words restore the release before (M3).** The ease plays where the new curves play (`curvesOn()`: a chapter the treatment reaches with the curves piece not held, the curves not `?curves=today`, the pack on): so the
 *   untreated chapters (XVII and every hidden one), `?pack=off`, `?treated=pack` (outside the booth pair), `?curves=today` and the phone gate all play the slide as release 71 does. `?kofall=off` ("play the KO as before FA-1",
 *   `KoFall.koFallOff`, for a same-build A/B capture) turns it off too, so that capture word still means the old KO.
 *
 * Pure but for the address and the chapter (read through the same switches every other piece reads); no `three`, no DOM.
 */

import { koFallOff } from '../KoFall.ts';
import { curvesOn } from './CurvesSwitch.ts';

/** `?kofall=off`, read once (the stage asks every frame; the address does not change under it). */
let koLegacy: boolean | null = null;

/** Tests: force the `?kofall=off` answer (`null` reads the address again). */
export function setSlideEaseLegacy(value: boolean | null): void {
  koLegacy = value;
}

/** Does the knock-out slide ease in on this page, in this chapter, for a player with (or without) REDUCE MOTION on? */
export function slideEaseOn(reduceMotion: boolean): boolean {
  return !reduceMotion && curvesOn() && !(koLegacy ??= koFallOff());
}

/**
 * The clock the stage hands `layProneFigures`: this frame's unscaled seconds when the slide eases ({@link slideEaseOn}), else undefined (the whole slide on the first frame, as release 71 plays it).
 * `realDt` is the real clock so a hit-stop never leaves a body half-way.
 */
export function slideEaseDt(realDt: number, reduceMotion: boolean): number | undefined {
  return slideEaseOn(reduceMotion) ? realDt : undefined;
}
