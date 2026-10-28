/**
 * HOW A RIG BOSS GOES DOWN AND COMES HOME (motion-fluidity pass, lane L2 "moves", item MF-11; curves audit C-09 and C-10; both games: Seymour Flux, FFX, and Bahamut, FFX-2, are rigs). Attached to a rig
 * from outside (`attachRigHandoff`, called by `RigActor.createRigged`; `RigActor.ts` is at the 400-line limit), the way `fx/mix/living.ts` hangs off a painted figure: it wraps the instance's `setPose` and
 * `update` and is inert with `?rigko=today` (`MoveSwitch.ts`; the default is `whole` since release 67, message 2 of Bailey's look choices, the driver's call under his delegation, his to overturn).
 *
 * **What was wrong (measured, r64).** KO: the rig's `ko` key collapses the body in 150 ms, but the actor's generic fall (written for a painted body, whose prone painting multiplies the drop by zero) keeps the
 * whole body sinking for 175 ms more into a thud at 325 ms (FFX-2) or 350 ms (FFX), and its relax then lifts the collapsed body back up 22 px over 260 ms before it dissolves: a bounce a body that has fallen
 * should not make. Return: the idle key is asked for at the action's end, which falls about 8 percent short of the strike's slide home, so the key's 140 ms move overlays the last of the return (a flat 4 px a
 * frame for five frames, then a second hump of 6 to 11 px a frame). The real boss holds its strike and returns with the clip: no pose change on the way home.
 *
 * **`?rigko=whole`.** (1) The `ko` key is the whole fall: the generic drop and tilt are switched off (`fallGain` 0), so the body stays where the key put it; (2) the landing (the squash, the settle and
 * the ground shake) is played on the frame the key ends (`PaintedActor.landFall`), where the body arrives; (3) an idle request that comes while the strike is still in its return is held, and the key moves to
 * idle once the strike is over, so the key move starts from a finished slide. Any other request cancels a held idle. A figure with no `ko` key (a dressphere falls straight to idle) is left alone.
 *
 * Presentation only: no engine state, no RNG, no timing the presenter waits on (the key move is the same 140 or 150 ms, only started later).
 */
import { moveWord } from '../motion/MoveSwitch.ts';

/** The slice of a rig actor the handoff uses. */
export interface RigLike {
  setPose(name: string, opts?: { immediate?: boolean; force?: boolean }): void;
  update(dt: number, realDt?: number): void;
  /** True while a move between two keys is in flight. */
  readonly blending: boolean;
  /** True while a strike (its wind-up, travel, hold, return and settle) is in flight. */
  readonly striking: boolean;
  fallGain: number;
  landFall(): void;
  readonly rigKeys: ReadonlySet<string>;
  /** The life layer's half of `setPose` (the pose request without the key move): `PaintedActor`'s. */
  poseLife(name: string, opts?: { immediate?: boolean; force?: boolean }): void;
}

/** Is `?rigko=whole` on? */
export const rigKoWhole = (): boolean => moveWord('rigko') === 'whole';

/** Wrap `actor`'s `setPose` and `update`. Safe to call on any rig; every added line is inert with the word at today. */
export function attachRigHandoff(actor: RigLike): void {
  const setPose = actor.setPose.bind(actor);
  const update = actor.update.bind(actor);
  let held: { opts: { immediate?: boolean; force?: boolean } | undefined } | null = null;
  let landDue = false;
  let gainSet = false;

  actor.setPose = (name, opts) => {
    held = null; // any request ends a held idle
    if (rigKoWhole()) {
      if (name === 'idle' && actor.striking && !opts?.immediate) {
        actor.poseLife(name, opts); // the life layer goes to idle now; the key waits for the strike to finish
        held = { opts };
        return;
      }
      if (name === 'ko' && actor.rigKeys.has('ko')) {
        setPose(name, opts);
        actor.fallGain = 0; // the key is the whole fall: no extra sink, no rise
        gainSet = true;
        landDue = true;
        return;
      }
    }
    landDue = false;
    if (gainSet && name !== 'ko' && name !== 'dead') {
      gainSet = false;
      actor.fallGain = 1; // the figure is up: its own fall tilt is its again
    }
    setPose(name, opts);
  };

  actor.update = (dt, realDt) => {
    update(dt, realDt);
    if (held && !actor.striking) {
      const h = held;
      held = null;
      setPose('idle', h.opts);
    }
    if (landDue && !actor.blending) {
      landDue = false;
      actor.landFall(); // the thud on the frame the key ends
    }
  };
}
