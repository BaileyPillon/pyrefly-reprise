/**
 * THE ADAPTER between this lane's big moments and the motion hooks the other lanes add (motion pass, lane "fx", step 3). Bailey 2026-10-22: Overdrives "layered with the anticipation, smear,
 * hit-stop and punch hooks"; hit-stop "Short, big hits only" (3 to 4 frames on criticals, Overdrives, boss big attacks), camera punch 2 to 3 percent on big hits and Overdrives, rumble "Light, big
 * moments only" (big hits dealt or taken, Overdrives, Mega Flare, the win).
 *
 * Those hooks live in the other lanes' branches (`motion-core`: anticipation, the smear; `motion-feel`: hit-stop, the punch, the rumble, `src/engine/feel/*`). This lane does not import them: it
 * would make two branches depend on each other. Instead each of this lane's big moments calls {@link fxBeat}, which calls whatever the integrator has registered with
 * {@link setFxMotionHooks} and does NOTHING while the registry is empty. So on this branch alone the calls are inert; at integration the wiring is one block, in one place:
 *
 * ```ts
 * setFxMotionHooks({
 *   anticipate: (id, ms) => core.anticipate(id, ms),   // motion-core: the wind-up pose / lean while the aura builds
 *   smear:      (id) => core.smear(id),                // motion-core: cut the ready pose to the strike pose on a smear
 *   hitStop:    (frames) => feel.hitStopShort(frames), // motion-feel: HitStopShort (3-4 frames)
 *   punch:      (amount) => feel.punch(amount),        // motion-feel: PunchCurve (0.02-0.03 of the view)
 *   rumble:     (strength, ms) => feel.rumble(strength, ms),
 * });
 * ```
 *
 * The numbers per moment are this lane's DATA ({@link FX_BEATS}): they are Bailey's picks (the ranges above), not game data, and each hook is given only what its owner defines (a frame count, a
 * fraction of the view, a strength 0 to 1). REDUCE MOTION turns off "shake, punch, freeze, rumble" and nothing else (Bailey's pick): {@link fxBeat} passes `calm` to the caller's own check and never
 * calls `hitStop`, `punch` or `rumble` when the flag is set, but still calls `anticipate` and `smear` (characters still move and smear).
 *
 * Pure: no `three`, no DOM.
 */

export type FxBeatKind =
  | 'od-open' // an Overdrive opens: the aura builds, the actor winds up
  | 'od-strike' // the Overdrive's first blow lands
  | 'boss-big' // a boss's big attack lands (Total Annihilation's last hit, Cross Cleave, Mega Flare)
  | 'boss-charge'; // a boss's charge reaches its last step

export interface FxMotionHooks {
  /** The actor winds up for `ms` (the aura's build). Owner: motion-core (anticipation). */
  anticipate?(actorId: string, ms: number): void;
  /** A big pose change is coming (ready to strike): cut it on a smear. Owner: motion-core (the smear). */
  smear?(actorId: string): void;
  /** Hold the frame for `frames` frames. Owner: motion-feel (hit-stop). */
  hitStop?(frames: number): void;
  /** Push the camera in by this fraction of the view and settle. Owner: motion-feel (the punch). */
  punch?(amount: number): void;
  /** Rumble the pad, `strength` 0 to 1 for `ms`. Owner: motion-feel (rumble). */
  rumble?(strength: number, ms: number): void;
}

export interface FxBeatNumbers {
  /** Whether the actor winds up and smears into the move's pose. */
  move: boolean;
  /** Hit-stop frames (0 = none). */
  hitStop: number;
  /** Camera punch, a fraction of the view (0 = none). */
  punch: number;
  /** Rumble strength 0 to 1 and its length in ms (0 = none). */
  rumble: number;
  rumbleMs: number;
}

/** Bailey's picks, as numbers: hit-stop 3 to 4 frames, punch 2 to 3 percent, rumble light. The Overdrive's opening moves the actor and rumbles lightly; its strike stops, punches and rumbles. */
export const FX_BEATS: Readonly<Record<FxBeatKind, FxBeatNumbers>> = Object.freeze({
  'od-open': { move: true, hitStop: 0, punch: 0, rumble: 0.2, rumbleMs: 260 },
  'od-strike': { move: false, hitStop: 4, punch: 0.025, rumble: 0.5, rumbleMs: 320 },
  'boss-big': { move: false, hitStop: 4, punch: 0.03, rumble: 0.6, rumbleMs: 400 },
  'boss-charge': { move: false, hitStop: 0, punch: 0, rumble: 0.3, rumbleMs: 300 },
});

let hooks: FxMotionHooks = {};

/** The integrator registers the other lanes' hooks here (replaces any earlier set); `{}` unregisters. */
export function setFxMotionHooks(h: FxMotionHooks): void {
  hooks = h;
}

export function fxMotionHooks(): Readonly<FxMotionHooks> {
  return hooks;
}

/** What a call to {@link fxBeat} did, for the tests and the recorder. */
export interface FxBeatLog {
  kind: FxBeatKind;
  called: string[];
}

/**
 * One of this lane's big moments happens: call the registered hooks the beat's numbers ask for. `calm` is the caller's REDUCE MOTION answer: then only the movement hooks run. Returns what was
 * called (empty on this branch alone).
 */
export function fxBeat(kind: FxBeatKind, actorId: string, o: { calm?: boolean; ms?: number } = {}): FxBeatLog {
  const n = FX_BEATS[kind];
  const called: string[] = [];
  if (n.move && hooks.anticipate) {
    hooks.anticipate(actorId, o.ms ?? 1000);
    called.push('anticipate');
  }
  if (n.move && hooks.smear) {
    hooks.smear(actorId);
    called.push('smear');
  }
  if (o.calm !== true) {
    if (n.hitStop > 0 && hooks.hitStop) {
      hooks.hitStop(n.hitStop);
      called.push('hitStop');
    }
    if (n.punch > 0 && hooks.punch) {
      hooks.punch(n.punch);
      called.push('punch');
    }
    if (n.rumble > 0 && hooks.rumble) {
      hooks.rumble(n.rumble, n.rumbleMs);
      called.push('rumble');
    }
  }
  return { kind, called };
}
