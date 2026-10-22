/**
 * The small pieces the new spell effects are drawn from (motion pass, lane "fx"; Bailey 2026-10-22: "Fire, Thunder, Blizzard (trails, shockwave rings, sparks with easing)").
 * Each is a pure function of the effect's local time, like the effects of `effects-*.ts`, and each draws through the same `FxDrawList` calls, so it obeys the same budgets,
 * REDUCE FLASHES rules and quality tiers. They are used only while the new effects are on (`FxSwitch.ts`): nothing in the live game calls them.
 *
 * - `spark`: one spark on an eased path, drawn as a stroke from where it was a moment ago to where it is, so it is long while it is fast and shortens as it slows (stretch with speed).
 * - `trailAlong`: a tapered brush trail through a list of points (the path of a thing in flight).
 * - `shockRing`: a ring that bursts outward fast and settles (outExpo) while it thins and fades.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList, FxTile } from './FxDrawList.ts';
import { clamp, inQuad, lerp, outCubic, outExpo, outQuart } from './fxMath.ts';

export type Pt = readonly [number, number];

/** The biggest scale an effect's local sizes follow: a boss is two or three times a girl's height, and a flash sized to it would white the whole frame out (the new boss effects clamp to this; today's effects are not changed). */
export const SC_MAX = 1.5;

/** A stroke from `a` to `b` whose head (the bright end) is at `b`; `thick` is its widest. Draws nothing below half a pixel. */
export function stroke(o: FxDrawList, col: string, a: Pt, b: Pt, thick: number, alpha: number, tile: FxTile = 'streak'): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (alpha <= 0.003 || thick <= 0.4) return;
  if (len < thick * 0.6) {
    o.sprite('dab', col, b[0], b[1], thick * 1.6, alpha);
    return;
  }
  const w = len * 1.12 + thick;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  // the tile's head sits near its +x edge: centre the quad a little behind the head
  o.quad(tile, col, lerp(a[0], b[0], 0.55) - Math.cos(ang) * thick * 0.1, lerp(a[1], b[1], 0.55) - Math.sin(ang) * thick * 0.1, w, thick * 2, alpha, ang);
}

export interface SparkOpts {
  /** Birth point. */
  ox: number;
  oy: number;
  /** Direction, radians (y down), and the distance it travels before it dies, px. */
  ang: number;
  dist: number;
  life: number;
  /** Seconds since birth (negative = not yet). */
  age: number;
  /** Downward pull, px per second squared (0 = none). */
  grav?: number;
  thick: number;
  col: string;
  alpha?: number;
  /** The ease of the travel: outQuart by default (fast out, long settle). */
  ease?: (u: number) => number;
  tile?: FxTile;
}

/** The place a spark is at, `u` of its life in. */
function sparkPos(s: SparkOpts, u: number): Pt {
  const e = (s.ease ?? outQuart)(u);
  const age = u * s.life;
  return [s.ox + Math.cos(s.ang) * s.dist * e, s.oy + Math.sin(s.ang) * s.dist * e + (s.grav ?? 0) * age * age];
}

/** One eased spark: a stroke from its place a moment ago to its place now, fading out as it goes. Returns whether it is alive. */
export function spark(o: FxDrawList, s: SparkOpts): boolean {
  const u = s.age / s.life;
  if (u < 0 || u >= 1) return false;
  const head = sparkPos(s, u);
  const tail = sparkPos(s, Math.max(0, u - 0.09));
  stroke(o, s.col, tail, head, s.thick * (1 - 0.45 * u), (s.alpha ?? 1) * (1 - inQuad(u)), s.tile ?? 'streak');
  return true;
}

/** A brush trail through `pts` (oldest first, the head last): the segments thicken toward the head and brighten. */
export function trailAlong(o: FxDrawList, pts: readonly Pt[], col: string, thick: number, alpha: number, tile: FxTile = 'streak'): void {
  for (let i = 1; i < pts.length; i++) {
    const f = i / (pts.length - 1);
    stroke(o, col, pts[i - 1]!, pts[i]!, thick * (0.25 + 0.75 * f), alpha * (0.15 + 0.85 * f), tile);
  }
}

/**
 * A shockwave ring on the ground (`flat` 0.28) or facing the camera (`flat` 1): bursts from `r0` to `r1` on outExpo over `dur` seconds from `t0`, thinning and fading.
 * Returns whether it was drawn.
 */
export function shockRing(o: FxDrawList, x: number, y: number, t: number, t0: number, dur: number, r0: number, r1: number, w: number, col: string, a: number, flat = 0.28): boolean {
  const u = (t - t0) / dur;
  if (u <= 0 || u >= 1) return false;
  const r = lerp(r0, r1, outExpo(u));
  o.ring(x, y, r, Math.max(0.8, w * (1 - 0.7 * u)), col, a * (1 - outCubic(u) * 0.95), flat);
  return true;
}

/** Evenly spread `n` samples of `f(i / (n - 1))` along a path: the points of a trail (the path of a thing in flight at time `t`). */
export function history(n: number, t: number, step: number, at: (t: number) => Pt): Pt[] {
  const out: Pt[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(at(Math.max(0, t - i * step)));
  return out;
}

/** The pop of a flash: 0 before `t0`, overshoots to ~1.08 and settles to 1 over `dur`, then fades over `fade`. */
export function pop(t: number, t0: number, dur: number, fade: number): number {
  if (t < t0) return 0;
  const u = clamp((t - t0) / dur);
  const grow = 1 + 0.08 * Math.sin(u * Math.PI);
  return Math.min(grow, outCubic(u) * 1.08) * clamp(1 - (t - t0 - dur) / fade);
}
