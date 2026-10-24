/**
 * THE REAL STRIKE'S SHAPES (conference demo, integration 2, 2026-10-22; Bailey's decision 179: "by Sunday every demo action takes its wind-up, contact and recovery timing from the real game's clips").
 * Pure: no `three`, no DOM, no clock. Used only by `StrikeCurve.sampleAt` when a shape carries {@link RealShape} (`?curves=real` and `?curves=real-snappy`, `RealMotion.ts`); every other strike
 * (`?curves=new`) never reaches this file.
 *
 * Two things the house sampler cannot play, both from the real clips (`research` of the real-motion lane, `real-motion/final/README.md`):
 *
 * 1. **The approach.** A real leaping attack is ONE move from the first step to the blow: Tidus's attack (the `ATTACK1_00` clip) is a leap with an apex at 21 percent of his height and a landing
 *    crouch, and he covers the whole gap in it (a PS2 recording of the real run gives the share of the distance covered at eleven steps). The house sampler's wind-up only pulls back and
 *    crouches, and its travel carries the whole lunge in a few frames, so the real timing (567 ms wind-up, 100 ms swing) would squeeze the leap into the swing. In a real approach shape the arc
 *    and the x path both span wind-up plus travel ({@link realPre}): the hip's height at eleven equal steps is the lift (the part below the standing hip is a crouch, a scale, never a sink
 *    under the floor), the recorded path (or an ease) is x.
 * 2. **The way home.** Tidus's return is a flip (86 percent of his height at the top), Yuna's, Kimahri's, Rikku's and Paine's back-leaps are 14 to 54 percent: {@link realPost} plays the real
 *    lift profile of the return leg (its x is the recorded path for Tidus, an ease for the rest).
 *
 * The lift is a share of the figure's height (the strike clock multiplies it by the height). A figure the real data says does not leap (Yuna, Auron, Kimahri, Lulu: crouch into the lunge) keeps the house
 * wind-up and travel with the real durations.
 *
 * Game case (AGENTS.md rule 14): both games read the same pure code; WHICH numbers they get is the game's own (`data/motion/realMotion.ts`: FFX in Chapter I, FFX-2 in Chapter IV).
 */
import type { StrikeSample, StrikeShape } from './StrikeCurve.ts';

/** The most any squash or stretch may move the figure's scale from 1: the same cap as `StrikeCurve.SQUASH_CAP` (a test pins them equal; this file cannot import it without a cycle). */
const CAP = 0.06;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoother = (u: number): number => {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** What a real strike adds to a {@link StrikeShape} (absent on a house strike): the extras of the table, with the arc gain already applied. */
export interface RealShape {
  /** The arc and the x path span wind-up plus travel (a leaping attack: Tidus, Wakka, Seymour, Bahamut). */
  readonly approach: boolean;
  /** The hip's height at eleven equal steps of the approach, shares of the figure's height (negative: crouched). */
  readonly approachProfile?: readonly number[];
  /** The share of the approach's distance covered at eleven equal steps (Tidus: from the PS2 recording). Absent: an ease. */
  readonly xApproach?: readonly number[];
  /** The hip's height at eleven equal steps of the way home. Present only when the real return leaves the floor (a leap back); absent: the house return. */
  readonly returnProfile?: readonly number[];
  readonly xReturn?: readonly number[];
  /** Multiplier on the approach's lift and on the return's lift: 0 after an FFX-2 run-in (the run's leap carried the lift), a heavy body's share, and the global `?realarc=` gain. */
  readonly approachGain: number;
  readonly returnGain: number;
}

/**
 * A smooth curve through `p` (values at equal steps of 0..1): the monotone cubic of Fritsch and Carlson, so a rise never overshoots between two samples and a flat stretch stays flat.
 * C1, allocation-free.
 */
export function pchip(p: readonly number[], u: number): number {
  const n = p.length;
  if (n === 0) return 0;
  if (n === 1) return p[0]!;
  const x = clamp01(u) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const t = x - i;
  const slope = (k: number): number => p[k + 1]! - p[k]!; // equal steps: the secant is the difference
  const tangent = (k: number): number => {
    if (k === 0) return slope(0);
    if (k === n - 1) return slope(n - 2);
    const a = slope(k - 1);
    const b = slope(k);
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b); // the harmonic mean: zero at an extremum
  };
  const m0 = tangent(i);
  const m1 = tangent(i + 1);
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p[i]! + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p[i + 1]! + (t3 - t2) * m1;
}

/** The weight of a crouch's scale: full early in a leap, gone toward the contact (the contact's own landing squash takes over there, so the scale never pops at the hand-over). */
const dipWeight = (u: number): number => 1 - smoother((u - 0.72) / 0.28);

/** The move from its start to the contact, for a leaping attack (`real.approach`): x along the real path, lift from the hip's profile. `ms` runs 0 to wind-up plus travel. */
export function realPre(s: StrikeShape, ms: number, out: StrikeSample): StrikeSample {
  const r = s.real!;
  const span = Math.max(1, s.windupMs + s.travelMs);
  const u = clamp01(ms / span);
  const reach = r.xApproach ? pchip(r.xApproach, u) : smoother(Math.pow(u, 1.2));
  out.x = (1 + s.over) * reach;
  const share = r.approachProfile ? pchip(r.approachProfile, u) : s.arc * Math.sin(Math.PI * u);
  out.lift = r.approachGain * Math.max(0, share);
  const dip = Math.max(0, -share) * r.approachGain * dipWeight(u);
  const stretch = Math.min(s.stretch, Math.max(0, share) * 0.3);
  out.sy = 1 - Math.min(CAP, dip * 0.4) + stretch;
  out.lean = s.leanFwd * Math.sin(Math.PI * u);
  return out;
}

/** The way home of a strike whose return is a leap (`real.returnProfile`), `ms` in 0 to the return's length. False when this shape has no leaping return (the house return plays). */
export function realPost(s: StrikeShape, ms: number, out: StrikeSample): boolean {
  const r = s.real;
  if (!r?.returnProfile || !(ms < s.returnMs)) return false;
  const u = clamp01(ms / Math.max(1, s.returnMs));
  const reach = r.xReturn ? pchip(r.xReturn, u) : smoother(u);
  out.x = 1 - (1 + s.homeOver) * reach;
  const share = pchip(r.returnProfile, u);
  out.lift = r.returnGain * Math.max(0, share) * smoother(u / 0.12); // the first frames come off the hold: no pop
  out.sy = 1 - Math.min(CAP, Math.max(0, -share) * r.returnGain * 0.4) + Math.min(s.stretch, Math.max(0, share) * 0.12);
  out.lean = -0.4 * s.leanBack * Math.sin(Math.PI * u) ** 2;
  return true;
}
