/**
 * What the presenter hands an actor to start the new strike (`ActorHandle.strike`, optional; `PaintedActor.strike`). Pure types only (motion pass, lane "core", step 1).
 * Game case: both; `game` picks the profile (`StrikeCurve.PROFILES`).
 */
import type { CurveGame } from './CurvesSwitch.ts';
import type { MarkName, StrikeProfile } from './StrikeCurve.ts';

export interface StrikePlan {
  /** `?curves=real` / `real-snappy` (`RealMotion.realStrikeProfile`): this figure's own profile from the real game's clips; absent: the game's house profile (`StrikeCurve.PROFILES`). */
  profile?: StrikeProfile;
  /** The lunge distance, world units: the house lunge or the solved reach (`motion/StrikeReach.ts`). x = 1 of the curve is this far. */
  distance: number;
  /** Which game's profile plays. */
  game: CurveGame;
  /** Playback speed scale (`SPEED_SCALE` times the presenter's `timeScale`): the curve's own pace is applied by the actor's clock. */
  timeScale: number;
  /** False after an FFX-2 run-in: the leap already carried the lift, so the strike plays no arc of its own. */
  arc: boolean;
  /** The contact (`ContactBeat.armContact`): `reached` is called at the contact mark; the strike holds there until `hold` settles (and at least the profile's hold). None: no hold wait. */
  contact?: { hold: Promise<unknown>; reached: () => void };
  /** Anything that wants to schedule on the move's marks (the smear cut, the sound, the camera punch): called once each, in order, on the frame that crosses the mark. */
  marks?: Partial<Record<MarkName, () => void>>;
  /**
   * r72-motion (FFX only, `FlipFit.ts`): asked once, on the frame the hold ends and the way home begins, with the figure's world height; answers a gain in (0, 1] on the return's lift (the leaping return of a real
   * strike), so a figure drawn bigger than the approved Chapter I Tidus does not cover more of the screen in one frame than that Tidus does. Absent (every strike in the booth pair, every house strike and every
   * FFX-2 strike): the return plays as sampled.
   */
  returnFit?: (worldHeight: number) => number;
  /**
   * r73-fit (FFX only, `ReturnPace.ts`): asked once, on the same `holdEnd` frame, with the figure's world height; answers how long the way home should take, paced ms (the strike's own return at the least, the return
   * plus the settle at the most: the run clamps, and the move's total never changes). For a real strike with no leaping return whose own return is shorter than the figure's drawn lunge allows (Wakka's is two frames
   * long, Lulu's none), so the figure does not cross a third of the screen in one frame on the way home. Absent (the booth pair, every house strike, every FFX-2 strike, every strike with a leaping return): the
   * return plays as sampled.
   */
  returnPace?: (worldHeight: number) => number;
  /**
   * r73-fast (both games, `StrikeCurve.crossingFloors`): false plays the travel and the return at the playback speed like every other phase (release 72 and before), the control arm of `r73-sinface-trace.test.ts`. Absent: a
   * house strike's travel and return keep their length at normal speed at every playback speed, so the figure never crosses the stage in a few frames (a real profile is not touched). Nothing in the game sets it.
   */
  floorCrossings?: false;
}
