/**
 * Option B "Living Paintings": the slow cinematic drift (B2). Pure maths: no DOM, no `three`.
 *
 * An additive Lissajous on the neutral rig only, eased in after the rig settles and cut to zero
 * during rig moves, punches, rolls and moments. The camera **arcs around the fighters** rather
 * than trucking past them: it translates, then turns back toward the rig's look-at point by the
 * same angle, so the figures hold their place in frame and the painted plates slide behind them
 * at their own depths (the parallax is the point; the framing never moves by more than a few px).
 *
 * Game case: FFX is calm (the periods as specified); FFX-2 runs the periods at x0.8, a touch
 * livelier for the ATB pace, at the same amplitude.
 */

export interface DriftSpec {
  /** World units, peak: side to side, up and down, in and out. */
  lateral: number;
  vertical: number;
  dolly: number;
  /** Seconds per cycle for lateral, vertical and dolly. */
  periods: [number, number, number];
}

/** The tuned drift (bold: about +/-45 px of background travel at 1600x900 on the idle rigs). */
export const DRIFT_FFX: DriftSpec = { lateral: 0.42, vertical: 0.12, dolly: 0.16, periods: [23, 15, 31] };
export const DRIFT_FFX2: DriftSpec = { ...DRIFT_FFX, periods: [23 * 0.8, 15 * 0.8, 31 * 0.8] };

export interface DriftOffset {
  x: number;
  y: number;
  z: number;
}

const TAU = Math.PI * 2;

/** The raw Lissajous at time `t` (seconds), scaled by `amp` (0 = none). */
export function driftAt(t: number, spec: DriftSpec, amp = 1): DriftOffset {
  const [pl, pv, pd] = spec.periods;
  return {
    x: Math.sin((t / pl) * TAU) * spec.lateral * amp + Math.sin((t / pl) * TAU * 2.3 + 1.3) * spec.lateral * 0.18 * amp,
    y: Math.sin((t / pv) * TAU + 0.7) * spec.vertical * amp,
    z: Math.sin((t / pd) * TAU + 2.1) * spec.dolly * amp,
  };
}

/**
 * The drift's weight, 0..1: eases in over `easeIn` seconds once the camera is on a neutral rig
 * and still, and falls out over `easeOut` seconds the moment either stops being true.
 */
export class DriftEnvelope {
  weight = 0;
  private settled = 0;

  constructor(
    private readonly easeIn = 1.5,
    private readonly easeOut = 0.25,
    private readonly settleDelay = 0.4,
  ) {}

  update(dt: number, allowed: boolean): number {
    if (dt <= 0) return this.weight;
    if (!allowed) {
      this.settled = 0;
      this.weight = Math.max(0, this.weight - dt / this.easeOut);
      return this.weight;
    }
    this.settled += dt;
    if (this.settled >= this.settleDelay) this.weight = Math.min(1, this.weight + dt / this.easeIn);
    return this.weight;
  }
}

/** Smooth 0..1 ease of the weight, so the drift starts and stops without a kink. */
export function easeWeight(w: number): number {
  const t = Math.min(1, Math.max(0, w));
  return t * t * (3 - 2 * t);
}

/**
 * The turn that keeps the look-at point in place after a camera-local translation (dx right,
 * dy up) at `distance` from it: yaw (about local up) and pitch (about local right), radians.
 */
export function arcTurn(dx: number, dy: number, distance: number): { yaw: number; pitch: number } {
  const d = Math.max(0.5, distance);
  return { yaw: Math.atan2(dx, d), pitch: -Math.atan2(dy, d) };
}
