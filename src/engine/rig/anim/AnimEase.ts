/**
 * Easing curves for the animation prototype's clips (`?anim=proto`, branch `anim-proto`; both games, presentation only; no `three`, no DOM, erasable TS so a Node tool may import it).
 *
 * A curve maps `u` in 0..1 to a progress that is exactly 0 at 0 and exactly 1 at 1 (so a clip's key lands on its pose to the last bit). Curves may leave 0..1 in between: `backOut` overshoots
 * its target and comes back (the settle), `backIn` pulls away from it first (the anticipation).
 */

export type EaseName = 'linear' | 'sineInOut' | 'quadIn' | 'quadOut' | 'quadInOut' | 'cubicIn' | 'cubicOut' | 'cubicInOut' | 'expoOut' | 'quartIn' | 'quartOut';

/** A named curve, a CSS-style cubic bezier `[x1, y1, x2, y2]` (x1 and x2 in 0..1), or a back curve whose `s` is how far it strays (0.1 a hair, 1 a quarter past the target). */
export type EaseSpec = EaseName | readonly [number, number, number, number] | { readonly backOut: number } | { readonly backIn: number };

const C1 = 3; // the back curves' scale: backOut 1 strays 25 percent past the target (the classic constant 1.70158 is 10)

/** A cubic bezier with end points (0,0) and (1,1): the y at the given x, by Newton's method with a bisection fallback (x1 and x2 must lie in 0..1 so x is monotonic). */
export function bezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number): number => ((ax * t + bx) * t + cx) * t;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = X(t) - x;
    if (Math.abs(err) < 1e-7) return ((ay * t + by) * t + cy) * t;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0;
  let hi = 1;
  t = x;
  for (let i = 0; i < 40; i++) {
    const v = X(t);
    if (Math.abs(v - x) < 1e-7) break;
    if (v < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return ((ay * t + by) * t + cy) * t;
}

const NAMED: Record<EaseName, (u: number) => number> = {
  linear: (u) => u,
  sineInOut: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  quadIn: (u) => u * u,
  quadOut: (u) => 1 - (1 - u) * (1 - u),
  quadInOut: (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)),
  cubicIn: (u) => u * u * u,
  cubicOut: (u) => 1 - (1 - u) ** 3,
  cubicInOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - 4 * (1 - u) ** 3),
  expoOut: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  quartIn: (u) => u ** 4,
  quartOut: (u) => 1 - (1 - u) ** 4,
};

/** The curve at `u` (clamped to 0..1): exactly 0 at 0 and exactly 1 at 1 for every spec. */
export function ease(spec: EaseSpec, u: number): number {
  if (!(u > 0)) return 0;
  if (u >= 1) return 1;
  if (typeof spec === 'string') return NAMED[spec](u);
  if (Array.isArray(spec)) {
    const b = spec as readonly [number, number, number, number];
    return bezier(b[0], b[1], b[2], b[3], u);
  }
  if ('backOut' in spec) {
    const s = C1 * Math.max(0, spec.backOut) + 0.0001;
    const v = u - 1;
    return 1 + (s + 1) * v * v * v + s * v * v;
  }
  const s = C1 * Math.max(0, (spec as { backIn: number }).backIn) + 0.0001;
  return (s + 1) * u * u * u - s * u * u;
}

/** A stable string for a spec (the timing tables and test names). */
export function easeName(spec: EaseSpec): string {
  if (typeof spec === 'string') return spec;
  if (Array.isArray(spec)) return `bezier(${(spec as readonly number[]).join(',')})`;
  return 'backOut' in (spec as object) ? `backOut(${(spec as { backOut: number }).backOut})` : `backIn(${(spec as { backIn: number }).backIn})`;
}
