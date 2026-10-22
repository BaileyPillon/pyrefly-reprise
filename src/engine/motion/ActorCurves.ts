/**
 * The small pure helpers `PaintedActor` calls for the new curves (motion pass, lane "core", step 1), kept out of that 2,468-line file. No `three`, no DOM.
 */
import { heftOfHeight, motionBeat } from '../feel/MotionBeats.ts';
import { paceFactor } from '../pace.ts';
import type { CurveDriver } from './CurveDriver.ts';
import { PROFILES, SQUASH_CAP, clamp01, resolveStrike } from './StrikeCurve.ts';
import type { StrikePlan } from './StrikePlan.ts';

/** The party's `worldHeight` and a default foe's (`BattlePresenterStage.add`): the two ends of a figure's heft. */
export const PARTY_HEIGHT = 1.82;
export const FOE_HEIGHT = 4.1;

/** 0 for a party-sized figure, 1 for a default-size foe: bosses are scaled by size (heavier, slower). */
export const heftOf = (worldHeight: number): number => clamp01((worldHeight - PARTY_HEIGHT) / (FOE_HEIGHT - PARTY_HEIGHT));

/** Begin the strike a plan describes on `driver`; resolves when the move is over. */
export function startStrike(driver: CurveDriver, plan: StrikePlan, worldHeight: number): Promise<void> {
  const shape = resolveStrike(PROFILES[plan.game], { distance: plan.distance, height: worldHeight, heft: heftOf(worldHeight), timeScale: plan.timeScale, arcGain: plan.arc ? 1 : 0 });
  const contact = plan.contact;
  const { run, done } = driver.begin(shape, plan.distance, worldHeight, contact === undefined);
  // The lane "feel" motion sounds (`?motionsfx=`, off by default): the whoosh of the step, asked for as the travel begins so that its loudest moment is the fastest frame (`travelPeak`), in on-screen ms.
  run.on('windupEnd', () => {
    const onScreen = paceFactor('action');
    motionBeat({ kind: 'lunge', strength: plan.distance / 2.4, heft: heftOfHeight(worldHeight), atMs: (run.marks.travelPeak - run.marks.windupEnd) * onScreen, ms: shape.travelMs * onScreen });
  });
  if (contact) {
    run.on('contact', () => contact.reached());
    void contact.hold.then(() => run.release(), () => run.release());
  }
  if (plan.marks) for (const [name, fn] of Object.entries(plan.marks)) if (fn) run.on(name as keyof NonNullable<StrikePlan['marks']>, fn);
  return done;
}

/** The squash family: today's 18 percent Y / 14 percent X (not volume-preserving), or with the new curves on the SUBTLE one: `amount` 1 is 10 percent, capped at {@link SQUASH_CAP}, `sx = 1 / sy`. */
export function squashPair(amount: number, curveSy: number, subtle: boolean, out: { x: number; y: number } = { x: 1, y: 1 }): { x: number; y: number } {
  let sy: number;
  let sx: number;
  if (subtle) {
    const d = Math.min(SQUASH_CAP, Math.max(-SQUASH_CAP, 0.1 * amount));
    sy = 1 - d;
    sx = 1 / sy;
  } else {
    sy = 1 - 0.18 * amount;
    sx = 1 + 0.14 * amount;
  }
  out.x = sx / curveSy; // the curves' own squash is volume-preserving on top of either family
  out.y = sy * curveSy;
  return out;
}
