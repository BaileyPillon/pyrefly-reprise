/**
 * THE MOMENTS' NUMBERS (conference demo, motion pass, lane "core", step 3; pure: no `three`, no DOM, no clock; `MomentsSwitch.ts` has the switch and the picture).
 *
 * **Victory, each game's own** (Bailey, 2026-10-22: "Each game's own", the after-battle victory moment):
 *
 * - **FFX, Chapter I (Seymour Flux): a cheer.** The sources: the party strikes a victory pose to the fanfare, one clip (WIN_00, 3.7 to 4.0 s) and then a short loop (WIN_01, 1.0 to 1.7 s) until the
 *   results screen takes over (`research/re-ffx-party-motion-timing.md` sections 4, 5 and 7; `research/ffx-vs-ffx2-presentation.md` 2.1: poses are tied to the fanfare). The painting is one still, so the
 *   cheer is the body's: a crouch, a spring, the VICTORY painting swapped on the take-off's fastest frame (a planned smear when the smear is on: the victory painting is a different drawing, the
 *   party's poses share 14 to 50 percent of their outline), a landing, then the held pose and its loop (the victory posture's faster breath). The staggering per fighter is the one the hop always had.
 * - **FFX-2, Chapter IV (Bahamut): a quiet stand-down.** The sources withhold the pose: "the girls do not perform a victory pose at all after Bahamut" (`research/ffx-vs-ffx2-presentation.md` 2.2, FC-6a;
 *   `research/ffx2-bahamut.md` beat 9, "do not let the player celebrate"; `chapter-meta` `victoryPose: 'hold'`). What the sources do NOT say is what is shown instead (the same document, open
 *   question 11, `[absence]`): the girls keep their stance. The stand-down is `[ours]` and the smallest thing that still moves: one slow breath out, a settle of 3.5 percent and a small rise.
 *   No leap, no painting swap, no flash.
 *
 * **The knock-out's settle** (Bailey: "Rig collapse + settle": rigged figures collapse through the rig with a small landing bounce; painted ones get the closest equivalent, a smear cut into the KO pose
 * plus the settle): the landing squash the fall always had (`PaintedActor.fall`, 5 percent with the curves on) is followed by a small rebound of the whole figure, scaled by size (a boss rebounds less).
 * The sources describe the KO as a fall that reaches the floor 43 to 57 percent of the way through a 61 to 65 frame clip and then holds (`re-ffx-party-motion-timing.md` 7); a rebound is `[ours]`.
 *
 * **The knock-out's cut** ({@link koCutMs}): a party member's topple ends with the standing painting crossing to the lying one in 75 ms (100 under `?motion=demo`). With the smear on the cross is a CUT inside
 * the smear's own window (24 to 34 ms, at least 2.25 display frames), and the hold before it is lengthened by what the cross gave up, so the topple takes the same time and the cut falls at the end of it,
 * where the turn is fastest (`KoFall.toppleEase`).
 *
 * Every number is `[ours]`: the sources give clip lengths and frame counts, not paths, arcs, rebounds or smears.
 */
import type { LeapOptions } from './CurveDriver.ts';
import type { CurveGame } from './CurvesSwitch.ts';
import { SQUASH_CAP } from './StrikeCurve.ts';
import { CUT_MS_MAX, CUT_MS_MIN, FRAMES_MIN, WINDOW_CAP_MS } from './SmearPlan.ts';

export type VictoryKind = 'cheer' | 'stand-down';

/** Which victory moment a chapter gets: its own rule (`victoryPose`, from the sources) decides, the game only decides the numbers. */
export function victoryKind(victoryPose: 'pose' | 'hold' | null | undefined): VictoryKind {
  return victoryPose === 'hold' ? 'stand-down' : 'cheer';
}

export interface CheerShape {
  /** The spring's height, a share of the figure's height. */
  height: number;
  /** The whole cheer (crouch, flight), ON-SCREEN ms at the game's default pace. */
  ms: number;
  /** Where in the whole cheer the victory painting is swapped (0 to 1): a few frames into the flight, where the spring is fastest. */
  swapU: number;
  options: LeapOptions;
}

export const CHEER_OPTIONS: LeapOptions = { anticipation: 0.18, crouch: 0.04, stretch: 0.05, land: 0.04, landMs: 200, apex: 0.42 };

/** Where the swap falls inside the cheer: the crouch, then a tenth of the flight (the rise of `skewBell` is steepest at the take-off). */
export const swapAt = (o: LeapOptions): number => (o.anticipation ?? 0.12) + 0.1 * (1 - (o.anticipation ?? 0.12));

/**
 * The FFX cheer. One shape for both games: the sources give no cheer shape for either, and FFX-2's poses depend on the dressphere (the painting carries that); `game` is accepted so a per-game
 * difference has one place to go, and today it changes nothing.
 */
export function cheerShape(_game: CurveGame): CheerShape {
  return { height: 0.18, ms: 480, swapU: swapAt(CHEER_OPTIONS), options: CHEER_OPTIONS };
}

export interface StandDownShape {
  /** ON-SCREEN ms at the default pace. */
  ms: number;
  options: LeapOptions;
}

/** The quiet stand-down: a flight of height 0 (nothing leaves the floor), half of it spent settling 3.5 percent (the idle's own chest breath is about 2: anything under that is lost in it), then coming back up with a 1.2 percent overshoot. */
export function standDownShape(_game: CurveGame): StandDownShape {
  return { ms: 1000, options: { anticipation: 0.5, crouch: 0.035, stretch: 0.012, land: 0, landMs: 80, apex: 0.5 } };
}

export interface KoSettleShape {
  /** World units. */
  height: number;
  /** Paced ms (the landing's own, not stretched by the default pace: the fall it follows is not). */
  ms: number;
  options: LeapOptions;
}

/** The rebound after the KO's landing squash. `worldHeight` is the figure's height; `heft` 0 (a party figure) to 1 (a default foe) makes a big body rebound less. Never over the squash cap. */
export function koSettleShape(worldHeight: number, heft: number): KoSettleShape {
  const h = Math.min(1, Math.max(0, heft));
  return {
    height: worldHeight * 0.014 * (1 - 0.6 * h),
    ms: 190 * (1 + 0.5 * h),
    options: { anticipation: 0, crouch: 0, stretch: Math.min(SQUASH_CAP, 0.012 * (1 - 0.35 * h)), land: Math.min(SQUASH_CAP, 0.03 * (1 - 0.35 * h)), landMs: 170, apex: 0.45 },
  };
}

/**
 * The window of the KO's cut, real ms: the smear's own (24 to 34 ms by how much the pair shares, here the two paintings of a fall share almost nothing, so the long end), grown to at least
 * {@link FRAMES_MIN} display frames and never past the cap. `frameMs` 0 or less is unknown (the long end of the base).
 */
export function koCutMs(frameMs: number): number {
  const base = CUT_MS_MIN + (CUT_MS_MAX - CUT_MS_MIN) * 0.85;
  const frames = frameMs > 0 && Number.isFinite(frameMs) ? FRAMES_MIN * frameMs : 0;
  return Math.round(Math.min(WINDOW_CAP_MS, Math.max(base, frames)));
}

/** The KO cut's smear strength: a fall's turn is fast and the pair shares almost nothing, so near the top of the range. */
export const KO_CUT_STRENGTH = 0.85;
