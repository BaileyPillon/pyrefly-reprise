/**
 * THE STEPPED FADES BECOME RAMPS (motion-fluidity pass, lane L2 "moves", item MF-23; timebase audit TB-02; FFX: the petrify, Evrae falling away (Chapter VIII), Yojimbo's recall (Chapter IX), the held
 * Seymour Omnis; FFX-2: Leblanc, Logos and Ormi yielding, Paragon and Trema held (Chapter XIII). None is reachable in Chapter I or IV; filmed with the debug API). Behind `?ramps=` (`smooth` the default since release 68, `today` the loops of release 67,
 * `MoveSwitch.ts`). Ports only: no `three`, no DOM, no engine state (hard rule 1).
 *
 * **What was wrong:** five presenter animations are loops of `await sleep(ms / steps)` that set a value a step at a time: the petrify greys in four jumps of a quarter 70 ms apart, Evrae's fall shrinks in 12
 * jumps of 6.5 percent every 103 ms, and the yield, the held dim and the recall dim in six jumps of 7.5 to 9 percent 60 to 80 ms apart: a stair-stepped effect on an otherwise smooth figure, 4 to 17 distinct values a
 * second, on a presenter timer that is not a frame.
 *
 * **`?ramps=smooth`:** one linear tween on the actor's own clock (`PaintedActor.ramp`: paced like the other tweens, frozen in a hit-stop, the same wall time at every display rate) per property, run alongside
 * the move it accompanies, and the beat waits on it exactly as it waited on the loop. A figure with no `ramp` (a test double, FF7) plays the loop.
 */
import type { ActorHandle } from '../BattlePresenterPorts.ts';
import { moveWord } from './MoveSwitch.ts';

export type RampProp = 'brightness' | 'stone' | 'scale';

/** What `PaintedActor.ramp` reads and writes of the actor (some of it private there: it hands itself over cast to this). */
export interface RampHost {
  tweens: { toAsync(from: number, to: number, o: { durationMs: number; easing: 'linear'; onUpdate: (v: number) => void }): Promise<void> };
  u: { brightness: { value: number } };
  baseBrightness: number;
  stoneAmount: number;
  scale: { x: number; setScalar(v: number): void };
  setBrightness(v: number): void;
  setStone(v: number): void;
}

/** One linear tween of `prop` on the actor's own clock to `to` over `ms`: a brightness multiplier, a stone share (0..1), or a factor of the size the actor has now. */
export function rampActor(a: RampHost, prop: RampProp, to: number, ms: number): Promise<void> {
  const size = a.scale.x || 1;
  const from = prop === 'brightness' ? a.u.brightness.value / (a.baseBrightness || 1) : prop === 'stone' ? a.stoneAmount : 1;
  const set = (v: number): void => {
    if (prop === 'brightness') a.setBrightness(v);
    else if (prop === 'stone') a.setStone(v);
    else a.scale.setScalar(size * v);
  };
  return a.tweens.toAsync(from, to, { durationMs: Math.max(1, ms), easing: 'linear', onUpdate: set });
}

/** Is `?ramps=smooth` on? */
export const rampsOn = (): boolean => moveWord('ramps') === 'smooth';

/**
 * Ramp `prop` of every actor of `actors` to `to` over `ms` (the actor's tween clock), or undefined when the switch is off or one of them cannot ramp: the caller then plays its stepped loop. `to` is a
 * brightness multiplier, a stone share (0..1) or a scale factor (a share of the size the actor started the ramp with).
 */
export function rampAll(actors: readonly ActorHandle[], prop: RampProp, to: number, ms: number): Promise<void> | undefined {
  if (!rampsOn() || actors.length === 0 || actors.some((a) => !a.ramp)) return undefined;
  return Promise.all(actors.map((a) => a.ramp!(prop, to, ms))).then(() => undefined);
}

/** The slice of a departure's budget the dim uses (`BattlePresenterDepartures.budget`, `BattlePresenterRecall.RecallBudget`): the deadline guard and the deadline-raced sleep. */
export interface DimBudget {
  guard(p: void | Promise<void>): Promise<void>;
  sleep(ms: number): Promise<void>;
}

/**
 * Dim `actors` from full brightness to `to` over `ms`: today in `steps` equal jumps, one `b.sleep` apart (the yield, the held dim, the recall); with `?ramps=smooth` one tween on each actor's own clock.
 * Resolves when the dim is done (or the departure's deadline passes).
 */
export async function dimTo(actors: readonly ActorHandle[], to: number, ms: number, steps: number, b: DimBudget): Promise<void> {
  const smooth = rampAll(actors, 'brightness', to, ms);
  if (smooth) return b.guard(smooth);
  for (let i = 1; i <= steps; i++) {
    for (const a of actors) a.setBrightness(1 - (1 - to) * (i / steps));
    await b.sleep(ms / steps);
  }
}
