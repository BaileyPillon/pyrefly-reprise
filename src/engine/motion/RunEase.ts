/**
 * AN FFX-2 GIRL'S RUN, LEAP AND LUNGE (motion-fluidity pass, lane L2 "moves", item MF-04; curves audit C-05, C-06, C-07; FFX-2 ONLY: the run-in and the run home are FFX-2's alone, `research/ffx2-combat-core.md`
 * section 1, D-354; nothing here is reached in FFX). Pure: no `three`, no DOM, no clock (hard rule 1).
 *
 * **What was wrong (measured, r64):** the run is `moveTo` on `quadInOut`, a triangle of speed whose peak is twice its mean (Rikku's run home 47 px a 60 Hz frame at 1600 wide, 75 at the booth's 2560);
 * the leap that carries her lift is `u (1 - u)^b`, which leaves the floor at its steepest (15 px in its first frame, a quarter of the arc) and lands at 9 to 10 px a frame on a stop; the run ends in a full
 * stop and the strike, asked for only when the run is over, stands her still for about 100 ms (its wind-up, a 3 px pull) before it lunges. Real girls run at a constant 2.6 to 2.8 body heights a
 * second and attack from the run.
 *
 * **Four variants, one switch (`?run=`, `MoveSwitch.ts`; the default is `flow` since release 67, message 2 of Bailey's look choices, the driver's call under his delegation, his to overturn):**
 * - `today` (V0, release 66's look): this file changes nothing.
 * - `smooth` (V1): the same run time, a TRAPEZOID of speed ({@link trapezoid}: a quarter of the run easing in, a cruise, a quarter easing out; peak 1.33 times the mean, not 2), and a leap whose lift
 *   leaves and meets the floor at rest ({@link smoothBell}), so the landing is a brake and then the squash.
 * - `flow` (V2): V1, plus the strike is asked for as the run brakes, so its wind-up (a pull the eye can read, {@link FLOW_PROFILE}, and a deeper crouch) is the end of the stop and the lunge's travel
 *   starts as she arrives: the stand is gone and the whole attack is about 0.1 s shorter. The lunge is solved from where she WILL stand ({@link RunInMotion.reachGap}), so contact is where it was.
 * - `pace` (V3): V2 at the real pace: the run lasts as long as it takes to cruise at about three body heights a second ({@link paceRunMs}), 0.5 to 0.7 s in and three quarters of that home.
 *
 * Game case (AGENTS.md rule 14): FFX-2 only. Every number is `[ours]` except the pace (the game's job-macro run speed, 40 FFX units a second, is 2.6 to 2.8 body heights a second).
 */
import type { EasingFn } from '../Tween.ts';
import { smooth } from './StrikeCurve.ts';
import { PROFILES, type StrikeProfile } from './StrikeCurve.ts';
import { moveWord } from './MoveSwitch.ts';
import { curvesOn } from './CurvesSwitch.ts';

/** The share of a run spent easing in, and the same easing out; the cruise is the rest. */
export const RAMP = 0.25;

/**
 * The position share (0..1) at progress `u` of a run whose speed is a trapezoid: it climbs in a straight line for the first {@link RAMP}, holds, and falls in a straight line over the last
 * {@link RAMP}. The cruise speed is 1 / (1 - RAMP) = 1.33 times the mean (the triangle of `quadInOut` peaks at 2.0).
 */
export function trapezoid(u: number, ramp = RAMP): number {
  const x = u <= 0 ? 0 : u >= 1 ? 1 : u;
  const v = 1 / (1 - ramp);
  if (x < ramp) return (v * x * x) / (2 * ramp);
  if (x > 1 - ramp) return 1 - (v * (1 - x) * (1 - x)) / (2 * ramp);
  return v * (ramp / 2 + (x - ramp));
}

/**
 * A bell over 0..1 with its apex at `apex`, zero at both ends AND zero speed at both ends (two smoothsteps meeting at the top): the lift of a leap that leaves and meets the floor at rest.
 * `skewBell` (the leap's old lift) has its steepest slope on its first sample.
 */
export function smoothBell(u: number, apex: number): number {
  const x = u <= 0 ? 0 : u >= 1 ? 1 : u;
  const a = Math.min(0.9, Math.max(0.1, apex));
  return x < a ? smooth(x / a) : smooth((1 - x) / (1 - a));
}

/** The run's pace in V3: body heights a second at the cruise, and the body height it is measured against (a girl's, world units). */
export const PACE_BODY_HEIGHTS_PER_S = 3;
export const PACE_BODY_HEIGHT = 1.75;
/** V3's run in, ms of tween time, never shorter or longer than these. */
export const PACE_RUN_MIN = 450;
export const PACE_RUN_MAX = 760;

/** What the run does under the switch's word now; `today` is all `false`. */
export interface RunMode {
  /** A trapezoid run and a leap that leaves and lands at rest (V1 and on). */
  smooth: boolean;
  /** The strike starts as the run brakes, with the readable pull (V2 and on). */
  flow: boolean;
  /** The run lasts as long as the real pace asks (V3). */
  pace: boolean;
}

/** {@link RunMode} of a word. */
export function runModeOf(word: 'today' | 'smooth' | 'flow' | 'pace'): RunMode {
  return { smooth: word !== 'today', flow: word === 'flow' || word === 'pace', pace: word === 'pace' };
}

/**
 * The mode in force (`?run=`). `flow` asks for the strike while she is still braking, which only the sampled strike (the new curves: Chapters I and IV) is built for: the old lunge has no wind-up to
 * hide an early start and nothing solves it from where she will stand, so where the curves are off (Chapter V) the run stays smooth (and paced) and the strike is today's (review of 2026-10-27, open question 4).
 */
export function runMode(): RunMode {
  const m = runModeOf(moveWord('run'));
  return m.flow && !curvesOn() ? { ...m, flow: false } : m;
}

/** The easing the run's `moveTo` takes: the trapezoid, or undefined (the actor's default `quadInOut`) for today. */
export function runEase(mode: RunMode = runMode()): EasingFn | undefined {
  return mode.smooth ? (u: number) => trapezoid(u) : undefined;
}

/** V3's run in for `distance` world units, tween ms: the time a trapezoid needs to cruise at the real pace. */
export function paceRunMs(distance: number): number {
  const cruise = PACE_BODY_HEIGHTS_PER_S * PACE_BODY_HEIGHT; // world units a second
  const ms = (Math.max(0, distance) / (cruise * (1 - RAMP))) * 1000;
  return Math.round(Math.min(PACE_RUN_MAX, Math.max(PACE_RUN_MIN, ms)));
}

/**
 * The strike profile for a girl who has run in and flows into her lunge: FFX-2's house profile with a pull and a crouch the eye can read (Chapter I pulls 17 px over 150 ms; the house FFX-2 strike
 * pulls 3 px over 100 ms from a standstill). The pull is 0.16 of the lunge up to 0.1 world units (about 14 px at the party's depth), the crouch 7 percent. The times are the house's.
 */
export const FLOW_PROFILE: StrikeProfile = { ...PROFILES.ffx2, pullback: 0.16, pullbackMax: 0.1, crouch: 0.07 };

/** The profile the strike after a run-in plays: {@link FLOW_PROFILE} when the strike flows out of the run, else undefined (the game's own). */
export function flowProfile(mode: RunMode = runMode()): StrikeProfile | undefined {
  return mode.flow ? FLOW_PROFILE : undefined;
}

/** `flow`: the lunge's travel starts this long before the run's end, tween ms at normal speed and pace 1, so she is still braking as it begins (a pull-back that ended exactly at the run's end still leaves her under 1.5 px a frame for 33 to 50 ms; 30 to 110 ms of overlap leave none, 40 is the middle of that range).*/
export const FLOW_OVERLAP_MS = 40;

/**
 * How long before the run's end the strike is asked for, tween ms (the strike's own paced clock): its wind-up plus {@link FLOW_OVERLAP_MS}, so that the wind-up is over, and the lunge's travel under way, as the
 * run brakes to its end. `timeScale` is the presenter's playback speed scale (1 normal, 0.32 fast).
 */
export function flowLeadMs(timeScale: number, paceFactor: number): number {
  return ((FLOW_PROFILE.windupMs + FLOW_OVERLAP_MS) * Math.max(0.02, timeScale)) / Math.max(0.05, paceFactor);
}
