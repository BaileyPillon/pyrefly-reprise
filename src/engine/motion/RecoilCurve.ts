/**
 * THE NEW HIT RECOIL (conference demo, motion pass, lane "core", step 1; Bailey's pick, 2026-10-22: "Knock-back + flash: a short push away a few px at 1440p, white flash, recover with a
 * small overshoot"). Pure; switched by `CurvesSwitch.ts` (default OFF); both games (shared plumbing, `PaintedActor.knockBack`).
 *
 * Today's knock-back (`HitRecoil.ts`) pushes 0.22 world units (0.34 on a crit): about 30 to 50 px at 1440p. The pick is "a few px": the same two legs, shorter and softer:
 * a quick eased push ({@link PUSH_MS}, a fifth of the move at most, the peak speed on its first frame so the blow reads at once) and a recover that comes home with ONE small overshoot
 * (about 13 percent of the push) and rests exactly at 0. The caller still hands the distance it always did; {@link recoilDistance} scales it ({@link RECOIL_SCALE}) and thins it for
 * a heavy body (a boss budges less). Continuity with a second hit landing mid-recoil is kept (`from`). The white flash is the existing hit flash (`DemoHitBeat.blowFlash`); this
 * file does not draw it. `[ours]`: every number; the sources give no knock-back distance or timing in either game.
 */
import { Easing } from '../Tween.ts';

/** The share of today's push distance. 0.3 of 0.22 is 0.066 world units, about 9 px at 1440p (0.10 or 13 px on a crit). */
export const RECOIL_SCALE = 0.3;

/** The longest push, ms of tween time (a fifth of a short move at most). */
export const PUSH_MS = 70;

/** The recover's back-out constant: peak overshoot is (4 / 27) * s^3 / (s + 1)^2 = 0.1317 of the distance at 2.0. */
const BACK_S = 2.0;

function backOut(u: number): number {
  const x = u <= 0 ? 0 : u >= 1 ? 1 : u;
  const w = x - 1;
  return 1 + (BACK_S + 1) * w * w * w + BACK_S * w * w;
}

/** The distance a hit pushes under the new curve: today's, scaled, and a little thinner for a heavy body (`heft` 0..1). */
export function recoilDistance(distance: number, heft = 0): number {
  return distance * RECOIL_SCALE * (1 - 0.4 * Math.min(1, Math.max(0, heft)));
}

/** The push's length for a recoil of `ms`. */
export function newPushMs(ms: number): number {
  return Math.min(PUSH_MS, Math.max(1, ms) * 0.2);
}

/**
 * The offset at progress `p` (0..1) of a recoil lasting `ms`, in the sign `PaintedActor.recoilOffset` uses (negative = knocked back before the facing flips it), for a push of
 * `distance` that began with the figure already displaced by `from`.
 */
export function newRecoilOffset(p: number, ms: number, distance: number, from = 0): number {
  const total = Math.max(1, ms);
  const t = (p <= 0 ? 0 : p >= 1 ? 1 : p) * total;
  const push = newPushMs(total);
  if (t < push) return from + (-distance - from) * Easing.sineOut(t / push);
  const u = (t - push) / (total - push);
  const v = -distance * (1 - backOut(u));
  return v === 0 ? 0 : v; // never -0
}
