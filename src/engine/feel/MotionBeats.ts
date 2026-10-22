/**
 * THE MOTION BEATS (motion program, lane "feel", step 2): the one small seam through which a moving figure tells the sound that something just happened.
 *
 * A figure calls {@link motionBeat} at a beat it owns (a lunge begins, a hop lands), the presenter calls it at a beat it owns (a cast begins), and the page's sink
 * (`app/motionSfxSink.ts`) turns the beat into a sound if `?motionsfx=` (or `?pack=demo`) is on in Chapter I or Chapter IV (`feel/MotionSfx.planMotionSfx`). With no sink installed
 * (every unit test, every build that never calls `installMotionSfx`) {@link motionBeat} does nothing, so a figure that calls it is exactly what it was.
 *
 * **This is the adapter the motion-core lane wires at integration** (`docs/handoff/motion-feel.md`, "What to wire when motion-core merges"): its sampled strike, its leap and its planned
 * smears have named marks, and each is one `motionBeat(...)` call:
 *
 * | motion-core mark | call |
 * |---|---|
 * | the strike's wind-up ends (travel begins), `StrikeRun.on('windupEnd')` or the start of `actor.strike` | `motionBeat({ kind: 'lunge', strength, heft, atMs: <ms from now to travelPeak>, ms: <the move's ms> })` |
 * | a planned smear cut (`SmearLog` push, `SmearDirector.swap`) | `motionBeat({ kind: 'smear', strength: plan.strength, heft })` |
 * | a leap lands (`CurveDriver` landing squash), the strike's end (home) | `motionBeat({ kind: 'land', strength: <the landing squash share of its 6 percent cap>, heft })` |
 *
 * Pure: no `three`, no DOM, no audio. A beat is data; the sink decides.
 */

import type { MotionBeatKind } from '../../audio/sfxV2/motionCues.ts';

export type { MotionBeatKind };

/** What a figure tells the sound about a beat. Every field but `kind` is optional. */
export interface MotionBeat {
  kind: MotionBeatKind;
  /** How big the movement is, 0 to 1: a lunge's reach over 2.4 world units, a hop's height over a third of the figure, a landing squash over its cap, a smear's strength. Absent: 0.6. */
  strength?: number;
  /** How heavy the body is, 0 to 1: 0 for a party member, 1 for a boss (`heftOfHeight`). Absent: 0. */
  heft?: number;
  /** ms from now to the visual peak the sound belongs on (a lunge's fastest frame); the sink starts the cue that much before it, never before now. Absent: the sound starts now. */
  atMs?: number;
  /** The move's own length in ms (a dash's run time, a lunge's ms): a whoosh is cut to fit it. Absent: the cue's own length. */
  ms?: number;
}

export type MotionBeatSink = (beat: MotionBeat) => void;

let sink: MotionBeatSink | null = null;
let speedOf: (() => string) | null = null;

/** The page installs its sink once (`installMotionSfx`); `null` removes it (tests). */
export function setMotionBeatSink(fn: MotionBeatSink | null): void {
  sink = fn;
}

/** Is a sink installed (a test, the debug surface)? */
export function hasMotionBeatSink(): boolean {
  return sink !== null;
}

/** A figure or the presenter reports a beat. Never throws, never waits, does nothing without a sink. */
export function motionBeat(beat: MotionBeat): void {
  if (sink === null) return;
  try {
    sink(beat);
  } catch {
    /* a sound that fails costs itself, never the movement that asked for it */
  }
}

/** The battle screen names how to read the playback speed (`'normal'`, `'fast'`, `'skip'`) while a chapter runs; `null` when it goes. */
export function setMotionSfxSpeed(fn: (() => string) | null): void {
  speedOf = fn;
}

/** The playback speed now: `'normal'` when nothing is named (the unit tests, every other screen). */
export function motionSfxSpeed(): string {
  try {
    return speedOf?.() ?? 'normal';
  } catch {
    return 'normal';
  }
}

/**
 * How heavy a figure is from its painted height in world units: 0 at the party's 1.8, 1 at 4.4 and over (a boss stands about 4.1 to 4.8). `[ours]`: the sources give no weights; the
 * sound only needs "a party member" and "a colossus" on one line.
 */
export function heftOfHeight(worldHeight: number): number {
  if (!Number.isFinite(worldHeight)) return 0;
  return Math.max(0, Math.min(1, (worldHeight - 1.8) / 2.6));
}
