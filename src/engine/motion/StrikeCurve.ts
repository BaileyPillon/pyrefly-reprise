/**
 * THE STRIKE CURVE (conference demo, motion pass, lane "core", step 1; Bailey, 2026-10-22: "The motion and animations need to be top notch, even above visuals").
 *
 * ONE pure, sampled timeline for a physical attack, replacing the chained tween legs of `PaintedActor.lunge` (x only; no anticipation, no arc, no overshoot; each leg
 * boundary dropped the previous leg's leftover frame time). Given a {@link StrikeShape} it answers, for any moment of the move, `{x, lift, sy, lean}` and the MARKS other code
 * can schedule on (the smear cut, the sound, the camera punch): `windupEnd`, `travelPeak` (the fastest frame before contact), `contact`, `holdEnd`, `settlePeak` (the fastest frame
 * of the way home) and `end`. Sampling is analytic from accumulated time, so 60 Hz and 120 Hz walk the same curve. Switched by `CurvesSwitch.ts`; default OFF.
 *
 * The beats (Bailey's picks: "Snappy, about 1.1 s": wind-up ~0.15 s, travel 0.25 s, strike held 0.2 s, return 0.4 s + settle):
 *
 *   1. wind-up      a short pull back along the line of attack, a crouch (squash) and a lean back; eased in and out so the step starts from rest;
 *   2. travel       a committed step in an ARC (a lift over the travel), stretched at its fastest frame; arrives at contact at rest; the arrival overshoots the touch point by a few
 *                   pixels (`over`) and the snap settles back in `snapMs`;
 *   3. contact      the blow's mark (`ContactBeat` holds the strike here until the blow lands, as before). A volume-preserving squash rings out over the hold (the landing
 *                   thud the sound is matched to) and rests exactly at 1;
 *   4. return       out of the hold, a walk home: the fastest frame mid-way, a small arc, a lean back; it steps a little PAST home (`homeOver`) and
 *   5. settle       comes back to rest with a landing squash. The rest pose is exact: x = 0, lift = 0, scale = 1, lean = 0.
 *
 * Squash and stretch are SUBTLE (about 4 to 6 percent) and volume-preserving: `sx = 1 / sy`, `|sy - 1| <= {@link SQUASH_CAP}` always (today's attack call is 8.1 percent in Y and 6.3 in X).
 *
 * **Game case (AGENTS.md rule 14).** Both games have a profile and each is its own (`PROFILES`). The SOURCED part is the shape of the timing: FFX's strike clip lands the blow on the
 * last frames of the lunge (Tidus: frame 20 of 21, 667 ms) and carries on 15 frames of follow-through; FFX-2's girls hit within 4 to 12 frames of the strike clip's start
 * (`src/data/ffx2/action-frames.ts` `GIRL_HIT_FRAMES`: Rikku 4, Paine 11, Yuna 12 of the Mascot sets) after a quick run-in (`research/re-ffx-party-motion-timing.md` sections 3 and 7).
 * So FFX gets the committed run-up lunge (later peak speed, low arc, longer pull back) and FFX-2 the quicker acrobatic one (earlier contact, a higher arc, a leaner return). Every
 * number is `[ours]`: the sources give frame counts, not paths, arcs or squash.
 *
 * Pure: no `three`, no DOM, no clock (hard rule 1). The clock that walks it is `StrikeRun.ts`.
 */
import { DEFAULT_PACE, PACE_PRESETS } from '../pace.ts';
import type { CurveGame } from './CurvesSwitch.ts';

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const smooth = (u: number): number => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
/** Smootherstep: zero first AND second derivative at both ends. */
export const smoother = (u: number): number => {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The most any squash or stretch may move the figure's scale from 1, either way (Bailey: "about 4-6 percent"). */
export const SQUASH_CAP = 0.06;

/** A game's strike, in the units a designer thinks in. Segment lengths are ms ON SCREEN at the game's default pace (the brief's numbers); every other number is a share. */
export interface StrikeProfile {
  readonly game: CurveGame;
  readonly windupMs: number;
  readonly travelMs: number;
  /** The contact hold at least this long (the blow can keep it longer). */
  readonly holdMs: number;
  readonly returnMs: number;
  readonly settleMs: number;
  /** How long the contact overshoot takes to settle back to the touch point. */
  readonly snapMs: number;
  /** The pull back of the wind-up, as a share of the lunge distance, and its cap in world units. */
  readonly pullback: number;
  readonly pullbackMax: number;
  /** Crouch at the end of the wind-up (scale Y down by this share). */
  readonly crouch: number;
  /** Lean back at the wind-up's end and forward at the fastest travel frame, radians. */
  readonly leanBack: number;
  readonly leanFwd: number;
  /** Peak lift of the travel arc as a share of the figure's height, and where in the travel the apex falls (0..1). */
  readonly arc: number;
  readonly arcApex: number;
  /** Peak lift of the way home, share of height. */
  readonly returnArc: number;
  /** Stretch at the fastest travel frame; squash at the contact; both scale Y, volume-preserving. */
  readonly stretch: number;
  readonly squash: number;
  /** Peak-speed bias of the travel: 1 = symmetric, above 1 = the fastest frame comes later (a committed arrival). */
  readonly bias: number;
  /** Overshoot past the touch point at the snap (share of the distance, cap in world units), and past home on the way back. */
  readonly over: number;
  readonly overMax: number;
  readonly homeOver: number;
  readonly homeOverMax: number;
}

/** FFX in Chapter I (committed run-up lunge) and FFX-2 in Chapter IV (quick acrobatic strike). `[ours]` every number; the sourced part is in the header. */
export const PROFILES: Readonly<Record<CurveGame, StrikeProfile>> = {
  ffx: { game: 'ffx', windupMs: 150, travelMs: 250, holdMs: 200, returnMs: 400, settleMs: 100, snapMs: 70, pullback: 0.05, pullbackMax: 0.12, crouch: 0.05, leanBack: 0.05, leanFwd: 0.04, arc: 0.035, arcApex: 0.5, returnArc: 0.012, stretch: 0.04, squash: 0.05, bias: 1.35, over: 0.03, overMax: 0.05, homeOver: 0.04, homeOverMax: 0.06 },
  ffx2: { game: 'ffx2', windupMs: 100, travelMs: 200, holdMs: 200, returnMs: 350, settleMs: 150, snapMs: 60, pullback: 0.035, pullbackMax: 0.09, crouch: 0.045, leanBack: 0.06, leanFwd: 0.05, arc: 0.085, arcApex: 0.42, returnArc: 0.045, stretch: 0.05, squash: 0.045, bias: 1.1, over: 0.02, overMax: 0.04, homeOver: 0.03, homeOverMax: 0.05 },
};

/** The default pace's action factor for a game: the profile's milliseconds are on screen at THIS pace, so a `?pace=` choice still stretches or shrinks the move (`pace.ts`). */
export const defaultPaceFactor = (game: CurveGame): number => PACE_PRESETS[game][DEFAULT_PACE].action;

/** What a strike is resolved against: the lunge distance (world units), the figure's height, its heft, the playback speed and whether the arc plays. */
export interface StrikeOptions {
  readonly distance: number;
  readonly height: number;
  /** 0 = a party figure, 1 = a default-size foe: heavier, slower, less airborne, less squash (bosses are scaled by size). */
  readonly heft?: number;
  /** Playback speed scale (`SPEED_SCALE`: 1 normal, 0.32 fast); 0.02 floor. The pace option is applied by the actor's clock. */
  readonly timeScale?: number;
  /** 0..1: the share of the travel arc that plays (0 after an FFX-2 run-in, whose own leap already carries the lift: no double lift). */
  readonly arcGain?: number;
}

/** A profile resolved for one strike: durations in paced ms (what the actor's clock counts), amounts as shares. */
export interface StrikeShape {
  readonly game: CurveGame;
  readonly windupMs: number;
  readonly travelMs: number;
  readonly holdMs: number;
  readonly returnMs: number;
  readonly settleMs: number;
  readonly snapMs: number;
  readonly pull: number;
  readonly crouch: number;
  readonly leanBack: number;
  readonly leanFwd: number;
  readonly arc: number;
  readonly arcApex: number;
  readonly returnArc: number;
  readonly stretch: number;
  readonly squash: number;
  readonly bias: number;
  readonly over: number;
  readonly homeOver: number;
}

/**
 * Bosses and big foes: the same curves, heavier and slower (`[ours]`): longer wind-up and return, a longer hold, a bigger pull back, much less air, less squash (a heavy body does not
 * bounce), and a smaller overshoot.
 */
export function heftFactors(heft: number): { time: number; hold: number; ret: number; arc: number; squash: number; pull: number; over: number } {
  const h = clamp01(heft);
  return { time: 1 + 0.3 * h, hold: 1 + 0.35 * h, ret: 1 + 0.4 * h, arc: 1 - 0.6 * h, squash: 1 - 0.35 * h, pull: 1 + 0.3 * h, over: 1 - 0.3 * h };
}

export function resolveStrike(profile: StrikeProfile, o: StrikeOptions): StrikeShape {
  const d = Math.max(0.05, o.distance);
  const f = heftFactors(o.heft ?? 0);
  const k = Math.max(0.02, o.timeScale ?? 1) / defaultPaceFactor(profile.game);
  const arcGain = clamp01(o.arcGain ?? 1);
  return {
    game: profile.game,
    windupMs: profile.windupMs * k * f.time,
    travelMs: profile.travelMs * k * f.time,
    holdMs: profile.holdMs * k * f.hold,
    returnMs: profile.returnMs * k * f.ret,
    settleMs: profile.settleMs * k * f.ret,
    snapMs: profile.snapMs * k,
    pull: Math.min(profile.pullback, profile.pullbackMax / d) * f.pull,
    crouch: Math.min(SQUASH_CAP, profile.crouch * (2 - f.squash)),
    leanBack: profile.leanBack * (2 - f.squash),
    leanFwd: profile.leanFwd * f.squash,
    arc: profile.arc * f.arc * arcGain,
    arcApex: profile.arcApex,
    returnArc: profile.returnArc * f.arc * arcGain,
    stretch: Math.min(SQUASH_CAP, profile.stretch * f.squash),
    squash: Math.min(SQUASH_CAP, profile.squash * f.squash),
    bias: profile.bias,
    over: Math.min(profile.over, profile.overMax / d) * f.over,
    homeOver: Math.min(profile.homeOver, profile.homeOverMax / d) * f.over,
  };
}

/** One sample of the move. `x` is a share of the lunge distance (negative while winding up, a little above 1 at the snap), `lift` a share of the figure's height. */
export interface StrikeSample {
  x: number;
  lift: number;
  /** Scale Y; scale X is `1 / sy` (volume-preserving). */
  sy: number;
  /** Lean, radians, forward positive. */
  lean: number;
}

export type StrikePhase = 'pre' | 'hold' | 'post';

// ------------------------------------------------------------------ the pieces

/** The travel's distance curve: smootherstep of u^bias, so it starts and ends at rest and its fastest frame sits at {@link travelPeakU}. */
const travelEase = (u: number, bias: number): number => smoother(Math.pow(clamp01(u), bias));

const peaks = new Map<number, number>();
/** Where in the travel (0..1) the speed is highest, found once per bias by scanning the curve's slope. */
export function travelPeakU(bias: number): number {
  let u = peaks.get(bias);
  if (u === undefined) {
    let best = 0;
    let at = 0.5;
    const n = 2000;
    for (let i = 1; i < n; i++) {
      const s = travelEase((i + 0.5) / n, bias) - travelEase((i - 0.5) / n, bias);
      if (s > best) [best, at] = [s, i / n];
    }
    peaks.set(bias, (u = at));
  }
  return u;
}

/** A bell over 0..1 with its apex at `apex`, zero at both ends, slope finite at the takeoff: u * (1 - u)^b, normalised to 1 at the apex. */
export function skewBell(u: number, apex: number): number {
  const x = clamp01(u);
  const a = Math.min(0.9, Math.max(0.1, apex));
  const b = 1 / a - 1;
  return (x * Math.pow(1 - x, b)) / (a * Math.pow(1 - a, b));
}

/** The ring's shape on a unit time axis (0..1 of the pulse's length): period 0.75, decay 0.425, so it reads the same at any playback speed or pace. */
const PULSE_PERIOD = 0.75;
const PULSE_TAU = 0.425;
const pulseRaw = (p: number): number => Math.sin((2 * Math.PI * p) / PULSE_PERIOD) * Math.exp(-p / PULSE_TAU);
const PULSE_PEAK = ((): number => {
  let m = 0;
  for (let p = 0; p <= PULSE_PERIOD / 2; p += 0.001) m = Math.max(m, pulseRaw(p));
  return m;
})();

/**
 * A damped ring that starts at 0 with a push, peaks at 1 (about 17 percent of the way in), rings back through zero to a smaller rebound, and is windowed to land on exactly 0 at
 * `end` ms: the squash of a landing. Used for the contact thud and the landing at home.
 */
export function pulse(v: number, end: number): number {
  if (!(v > 0) || !(v < end)) return 0;
  const p = v / end;
  const w = 1 - smoother((p - 0.6) / 0.4);
  return (pulseRaw(p) / PULSE_PEAK) * w;
}

// ------------------------------------------------------------------ the sampler

/** Total length with the contact hold at its minimum, paced ms. */
export const strikeTotalMs = (s: StrikeShape): number => s.windupMs + s.travelMs + s.holdMs + s.returnMs + s.settleMs;

/**
 * The move at `ms` into `phase`. `pre`: 0 to windup + travel (the contact). `hold`: ms since the contact, unbounded (the blow may keep the strike up as long as it likes). `post`:
 * ms since the hold was let go, through the return and the settle. Writes into `out` (allocation-free).
 */
export function sampleAt(s: StrikeShape, phase: StrikePhase, ms: number, out: StrikeSample = { x: 0, lift: 0, sy: 1, lean: 0 }): StrikeSample {
  let x = 0;
  let lift = 0;
  let sy = 1;
  let lean = 0;
  if (phase === 'pre') {
    if (ms < s.windupMs) {
      const e = smoother(ms / s.windupMs);
      x = -s.pull * e;
      sy = 1 - s.crouch * e;
      lean = -s.leanBack * e;
    } else {
      const u = clamp01((ms - s.windupMs) / s.travelMs);
      x = -s.pull + (1 + s.over + s.pull) * travelEase(u, s.bias);
      lift = s.arc * skewBell(u, s.arcApex);
      const up = travelPeakU(s.bias);
      if (u < up) {
        const q = smooth(u / up);
        sy = lerp(1 - s.crouch, 1 + s.stretch, q);
        lean = lerp(-s.leanBack, s.leanFwd, q);
      } else {
        const q = smooth((u - up) / (1 - up));
        sy = lerp(1 + s.stretch, 1, q);
        lean = lerp(s.leanFwd, 0, q);
      }
    }
  } else if (phase === 'hold') {
    x = 1 + s.over * (1 - smoother(ms / Math.max(1, s.snapMs)));
    sy = 1 - s.squash * pulse(ms, s.holdMs);
  } else if (ms < s.returnMs) {
    const u = ms / s.returnMs;
    x = 1 - (1 + s.homeOver) * smoother(u);
    lift = s.returnArc * skewBell(u, 0.5);
    const b = Math.sin(Math.PI * u);
    sy = 1 + 0.5 * s.stretch * b * b;
    lean = -0.4 * s.leanBack * b * b;
  } else if (ms < s.returnMs + s.settleMs) {
    const v = ms - s.returnMs;
    x = -s.homeOver * (1 - smoother(v / s.settleMs));
    sy = 1 - 0.4 * s.squash * pulse(v, s.settleMs);
  }
  out.x = x === 0 ? 0 : x; // never -0
  out.lift = lift;
  out.sy = Math.min(1 + SQUASH_CAP, Math.max(1 - SQUASH_CAP, sy));
  out.lean = lean === 0 ? 0 : lean;
  return out;
}

/** The marks of a strike, in paced ms from its start, with the contact hold at its minimum. */
export interface StrikeMarks {
  readonly windupEnd: number;
  /** The fastest frame before contact: where a cut or a smear belongs. */
  readonly travelPeak: number;
  readonly contact: number;
  readonly holdEnd: number;
  /** The fastest frame of the way home. */
  readonly settlePeak: number;
  readonly end: number;
}

export type MarkName = keyof StrikeMarks;
export const MARK_NAMES: readonly MarkName[] = ['windupEnd', 'travelPeak', 'contact', 'holdEnd', 'settlePeak', 'end'];

export function strikeMarks(s: StrikeShape): StrikeMarks {
  const contact = s.windupMs + s.travelMs;
  const holdEnd = contact + s.holdMs;
  return {
    windupEnd: s.windupMs,
    travelPeak: s.windupMs + travelPeakU(s.bias) * s.travelMs,
    contact,
    holdEnd,
    settlePeak: holdEnd + 0.5 * s.returnMs,
    end: holdEnd + s.returnMs + s.settleMs,
  };
}

/** The marks as shares of the whole move (0..1). */
export function strikeMarkFractions(s: StrikeShape): StrikeMarks {
  const m = strikeMarks(s);
  const t = m.end;
  return { windupEnd: m.windupEnd / t, travelPeak: m.travelPeak / t, contact: m.contact / t, holdEnd: m.holdEnd / t, settlePeak: m.settlePeak / t, end: 1 };
}

/** The whole move as one function of `t` in 0..1 (the contact hold at its minimum): the form the brief names. */
export function sampleStrike(s: StrikeShape, t: number, out?: StrikeSample): StrikeSample {
  const total = strikeTotalMs(s);
  const ms = clamp01(t) * total;
  const contact = s.windupMs + s.travelMs;
  if (ms < contact) return sampleAt(s, 'pre', ms, out);
  if (ms < contact + s.holdMs) return sampleAt(s, 'hold', ms - contact, out);
  return sampleAt(s, 'post', ms - contact - s.holdMs, out);
}
