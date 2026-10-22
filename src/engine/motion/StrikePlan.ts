/**
 * What the presenter hands an actor to start the new strike (`ActorHandle.strike`, optional; `PaintedActor.strike`). Pure types only (motion pass, lane "core", step 1).
 * Game case: both; `game` picks the profile (`StrikeCurve.PROFILES`).
 */
import type { CurveGame } from './CurvesSwitch.ts';
import type { MarkName } from './StrikeCurve.ts';

export interface StrikePlan {
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
}
