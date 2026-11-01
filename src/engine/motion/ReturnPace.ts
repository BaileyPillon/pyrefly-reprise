/**
 * THE WAY HOME, PACED TO THE FIGURE'S DRAWN LUNGE (booth-b4, r73-fit; FFX only; Bailey's delegation of 2026-10-31, "you make the executive decisions for the next few days", his to overturn). The second half of `FlipFit.ts`:
 * that file scales a return flip (a lift) to the drawn size; this one stretches a return that has no flip but is too short for the ground it covers.
 *
 * **The finding (the focused review of the release 71 candidate 10b426248, `critic/reviews/10b426248-focused`, R71-C2).** Wakka's real-snappy attack lunges at the target like every FFX figure's (the reach solver does not know he throws),
 * and its way home is the clip's: 67 ms at 30 fps, which the 1.1 s pick scales to 35 ms, two frames, with the rest of the move's tail (185 ms) left to the settle (a 4 percent overshoot that comes back). In Chapter VIII (Evrae) the
 * figure covers 0.798 of its lunge in the largest of those two frames: 13 swaps at the settle mark (the fastest frame home, where the attack painting goes to the follow-through) read 161 to 494 px against 0 on `?treated=pack`.
 * Lulu's real return is 0 ms: the whole lunge and its overshoot (1.04) in the frame the hold ends. Both are the table's honest clip length on a figure the port sends across the stage; Chapter I's own Auron, Kimahri, Yuna and Tidus
 * come home over 150 to 180 ms (0.16 to 0.21 of the lunge in their largest frame).
 *
 * **The fit.** On the frame the hold ends, from what the screen shows then (the stage's projection of the figure's feet and head over the canvas: {@link canvasPerUnit}), the way home is lengthened out of the settle, so
 * the largest one-frame step of the figure on the screen is at most the CAP: the smaller of {@link flipStepCap} (Chapter I's own largest frame, Tidus's flip at its drawn size: 170 px of 900) and 0.45 of the figure's drawn
 * height (nine tenths of `critic/policy.json` `continuity.smear.maxJerkShare`, 0.5: the most a planned cut at a swap may move a figure and still be excused; the settle mark IS a swap). The move's total never changes (the end mark, the
 * 1.1 s pick, the contact and the hold are where they were; only the split between the return and the settle moves), the settle keeps at least {@link TRAVEL_SETTLE_FLOOR} of the move so its overshoot still comes back, and a
 * figure whose way home is already inside the cap, or one that cannot be stretched enough, is stretched as far as the tail allows (never past it) and the rest is reported, not hidden.
 *
 * **What it never touches.** The booth pair ({@link returnPaceOf} answers undefined for `DemoGate.isDemoChapter`: Chapter I's and Chapter IV's strikes carry no pace at all and are byte for byte what release 70 played),
 * every house (`?curves=new`) strike, every FFX-2 strike (rule 14: no FFX-2 chapter has been read for a return), every strike whose return is a flip (`FlipFit.ts` scales those) and a stage that cannot say how big a
 * figure is drawn (a unit-test fake, a canvas with no height): the return is the clip's there.
 *
 * Pure but for the canvas's height (through {@link canvasPerUnit}): no `three`, no clock, no engine state (hard rule 1).
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { BattleStage } from '../BattlePresenterPorts.ts';
import { paceRate } from '../pace.ts';
import { curvesGame } from './CurvesSwitch.ts';
import { demoChapter, isDemoChapter } from './DemoGate.ts';
import { FLIP_FRAME_MS, canvasPerUnit, flipStepCap } from './FlipFit.ts';
import { TRAVEL_SETTLE_FLOOR, realArcGain } from './RealMotion.ts';
import { resolveStrike, sampleAt, strikeTotalMs, type StrikeProfile, type StrikeSample, type StrikeShape } from './StrikeCurve.ts';

/** The share of a figure's drawn height one frame of its way home may move it: the policy's `continuity.smear.maxJerkShare` (a test reads the file), the limit of an excused swap. */
export const SWAP_EXCUSE_SHARE = 0.5;

/** The fit aims this much inside that limit (a step of half the drawn height or more stays a jerk; the model's lunge reading is good to a few percent). */
export const SWAP_EXCUSE_MARGIN = 0.9;

/**
 * A world unit along the floor draws up to 1 / cos(pitch) bigger than a world unit of height (the vertical reading is foreshortened by the camera's pitch and the horizontal one is not): 1.06 covers a camera pitched
 * down by up to 19 degrees, which the painted stages' rigs stay inside. The lunge is judged at this much more than the height reading says.
 */
export const FLOOR_PER_HEIGHT = 1.06;

/** Sampling resolution of the way home, paced ms. */
const SCAN_MS = 0.25;

/**
 * The largest rise in one displayed 60 Hz frame of the figure's lunge position on the way home, as a share of the lunge distance, when the return takes `returnMs` of the post phase (the settle takes the rest of
 * the shape's own return plus settle). Includes the step from the hold's last sample into the first frame of the return, which is the whole lunge for a return of no length. `rate`: the pace's
 * (`pace.paceRate('action')`), as `FlipFit.flipStepShare` reads it.
 */
export function homeStepShare(shape: StrikeShape, returnMs: number, rate = paceRate('action')): number {
  const total = shape.returnMs + shape.settleMs;
  const r = Math.min(total, Math.max(shape.returnMs, returnMs));
  const post: StrikeShape = { ...shape, returnMs: r, settleMs: total - r };
  const scratch: StrikeSample = { x: 0, lift: 0, sy: 1, lean: 0 };
  const held = sampleAt(post, 'hold', post.holdMs, scratch).x; // where the figure stands when the hold ends (the touch point)
  const frame = FLIP_FRAME_MS * rate; // paced ms one displayed frame advances the strike's clock
  const at = (ms: number): number => (ms < 0 ? held : sampleAt(post, 'post', ms, scratch).x);
  let worst = 0;
  for (let t = -frame; t < total; t += SCAN_MS) worst = Math.max(worst, Math.abs(at(Math.min(total, t + frame)) - at(t)));
  return worst;
}

/**
 * How long the way home should take, paced ms, so the figure's largest one-frame step is at most `cap` canvas heights when its whole lunge draws as `lunge` canvas heights: the shape's own return when that is
 * already inside the cap; the least that is, between it and the return plus the settle less the settle's floor, when one is; the most the tail allows when none is.
 */
export function homePaceFor(shape: StrikeShape, lunge: number, cap: number, rate = paceRate('action')): number {
  const total = shape.returnMs + shape.settleMs;
  const keep = Math.min(shape.settleMs, TRAVEL_SETTLE_FLOOR * strikeTotalMs(shape));
  const most = Math.max(shape.returnMs, total - keep);
  const fits = (r: number): boolean => homeStepShare(shape, r, rate) * lunge <= cap;
  if (fits(shape.returnMs)) return shape.returnMs;
  if (!fits(most)) return most;
  let lo = shape.returnMs;
  let hi = most;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * The pace a strike asks for when its hold ends, or undefined when this strike carries none (see the header). `distance` is the plan's lunge (world units) and `timeScale` the plan's (a fast-forwarded move takes
 * fewer frames, so its steps are bigger and it is paced too). The returned function takes the actor's world height, as `ActorCurves.startStrike` calls it on the `holdEnd` mark, and answers the return's length in paced ms
 * (0: leave it: the stage cannot say how big the figure is drawn).
 */
export function returnPaceOf(
  ctx: { readonly stage: BattleStage },
  id: CombatantId | undefined,
  profile: StrikeProfile | undefined,
  timeScale: number,
  distance: number,
): ((worldHeight: number) => number) | undefined {
  if (!id || !profile?.real || profile.real.returnProfile || curvesGame() !== 'ffx' || isDemoChapter(demoChapter())) return undefined;
  const stage = ctx.stage;
  return (worldHeight) => {
    const per = canvasPerUnit(stage, id);
    if (per === undefined) return 0;
    const shape = resolveStrike(profile, { distance, height: worldHeight, heft: stage.actor(id)?.strikeHeft?.() ?? 0, timeScale, realGain: realArcGain() });
    const cap = Math.min(flipStepCap(), SWAP_EXCUSE_SHARE * SWAP_EXCUSE_MARGIN * worldHeight * per);
    return homePaceFor(shape, distance * per * FLOOR_PER_HEIGHT, cap);
  };
}
