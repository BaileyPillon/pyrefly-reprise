/**
 * The small helpers `PaintedActor` calls for the per-game MOMENTS (motion pass, lane "core", step 3; `MomentsSwitch.ts` has the picture, `MomentsPlan.ts` the numbers), kept out of that
 * 2,500-line file. No `three`, no DOM. Game case: the helpers are shared plumbing (both games); WHICH one a chapter gets, and with which numbers, is `MomentsPlan`'s.
 */
import type { LeapOptions } from './CurveDriver.ts';
import type { CurveGame } from './CurvesSwitch.ts';
import { heftOf } from './ActorCurves.ts';
import { cheerShape, koSettleShape, standDownShape } from './MomentsPlan.ts';
import { realCheerShape } from './RealMoments.ts';
import { defaultPaceFactor } from './StrikeCurve.ts';

/** What the helpers need of the actor: its height and the leap channel of its curve driver. */
export interface MomentsHost {
  readonly worldHeight: number;
  /** The combatant's id (its real-motion key under `?curves=real`, `RealMoments.ts`); absent: the house cheer. */
  readonly name?: string;
  leap(height: number, ms: number, options?: LeapOptions): Promise<void>;
}

/**
 * The victory cheer: a crouch, a spring and a landing. `swap` (when the victory painting waits for it) is called ONCE, on the frame the spring is fastest, so the actor's own smear can make the
 * change of painting a cut on a moving figure. The profile's milliseconds are ON SCREEN at the game's default pace (the actor's clock counts paced ms), like the strike's.
 */
export function startCheer(host: MomentsHost, game: CurveGame, swap: (() => void) | null): Promise<void> {
  const s = (host.name ? realCheerShape(game, host.name) : undefined) ?? cheerShape(game); // `?curves=real`: the real victory clip's crouch and spring
  return host.leap(host.worldHeight * s.height, s.ms / defaultPaceFactor(game), { ...s.options, ...(swap ? { marks: [{ u: s.swapU, fn: swap }] } : {}) });
}

/** The quiet stand-down of a chapter whose sources withhold the victory pose: one slow breath out, nothing leaves the floor. */
export function startStandDown(host: MomentsHost, game: CurveGame): Promise<void> {
  const s = standDownShape(game);
  return host.leap(0, s.ms / defaultPaceFactor(game), s.options);
}

/** The rebound after a knock-out's landing squash. A big body (a boss) rebounds less and slower. */
export function startKoSettle(host: MomentsHost): Promise<void> {
  const s = koSettleShape(host.worldHeight, heftOf(host.worldHeight));
  return host.leap(s.height, s.ms, s.options);
}
