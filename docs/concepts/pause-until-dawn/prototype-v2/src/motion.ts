/**
 * Per-layer motion of the v3 frontal rig, in plate pixels (y down): chest
 * sway for the pinned body, iris travel inside its socket, the loose parts'
 * lag + idle jiggle, and the fringe lift that rides a raised brow. Every
 * number here is also what `tools/gen/rig-range.mjs` measures the art's
 * hidden-region envelope from, so the two must stay in step (that script
 * copies these constants; change both or neither).
 */
import { RIG_CONSTANTS } from './constants.ts';
import { ExponentialSpring, BandNoise } from './dynamics.ts';

/** Not measured by the motion spec (its section 12): rig-geometry tuning, kept inside the painted socket. */
export const IRIS_TRAVEL_PX: readonly [number, number] = [11, 7];
export const LOOSE_LAG_TAU = { earring: 0.5, strand1: 0.32, strand2: 0.38 } as const;
export const LOOSE_SWING_PX = { earring: 16, strand1: 20, strand2: 18 } as const;
export const LOOSE_IDLE_PX = { earring: 3, strand1: 5, strand2: 4 } as const;
/** Interpupillary distance sampled off the plate (pupils (338,422) and (609,406)). */
export const PLATE_IPD_PX = Math.hypot(609 - 338, 406 - 422);
export const CHEST_SWAY_AXIS_WEIGHT = { x: 0.35, y: 1 } as const;

export type LoosePart = keyof typeof LOOSE_LAG_TAU;
export type Px = [number, number];

/**
 * Yaw in degrees -> [-1, 1] against this rig's own (possibly asymmetric)
 * range. FIX (v3): v2 returned `Math.max(-1, Math.min(0, yaw / min) * -1)`,
 * which is 0 for every left turn (yaw/min > 0, so min(0, .) = 0): the iris,
 * the strands and the relight never moved to the left.
 */
export function yawNormFor(yawDeg: number, minDeg: number, maxDeg: number): number {
  if (yawDeg >= 0) return maxDeg === 0 ? 0 : Math.max(0, Math.min(1, yawDeg / maxDeg));
  return minDeg === 0 ? 0 : -Math.max(0, Math.min(1, yawDeg / minDeg));
}

export function chestOffsetPx(chestSample: number): Px {
  const amp = (RIG_CONSTANTS.sway.chestAmpPctIpd / 100) * PLATE_IPD_PX;
  return [chestSample * amp * CHEST_SWAY_AXIS_WEIGHT.x, chestSample * amp * CHEST_SWAY_AXIS_WEIGHT.y];
}

export function irisOffsetPx(yawNorm: number, pitchNorm: number): Px {
  return [yawNorm * IRIS_TRAVEL_PX[0], -pitchNorm * IRIS_TRAVEL_PX[1]];
}

/** Loose parts trail the head on their own springs and keep a small idle jiggle. */
export class LooseMotion {
  private readonly lag: Record<LoosePart, ExponentialSpring>;
  private readonly noise: Record<LoosePart, BandNoise>;
  private last: number | null = null;

  constructor() {
    this.lag = {
      earring: new ExponentialSpring(0, LOOSE_LAG_TAU.earring),
      strand1: new ExponentialSpring(0, LOOSE_LAG_TAU.strand1),
      strand2: new ExponentialSpring(0, LOOSE_LAG_TAU.strand2),
    };
    this.noise = {
      earring: new BandNoise({ seed: 0xe001, phaseOffset: 0 }),
      strand1: new BandNoise({ seed: 0xe002, phaseOffset: 1.1 }),
      strand2: new BandNoise({ seed: 0xe003, phaseOffset: 2.3 }),
    };
  }

  step(timeSeconds: number, yawNorm: number, still: boolean): Record<LoosePart, Px> {
    const dt = this.last === null ? 0 : Math.max(0, Math.min(0.1, timeSeconds - this.last));
    this.last = timeSeconds;
    const out = {} as Record<LoosePart, Px>;
    for (const part of Object.keys(this.lag) as LoosePart[]) {
      this.lag[part].setTarget(yawNorm);
      const lagged = this.lag[part].step(dt);
      const idle = still ? 0 : 1;
      const n = this.noise[part];
      out[part] = [
        (yawNorm - lagged) * LOOSE_SWING_PX[part] + idle * n.sample(timeSeconds) * LOOSE_IDLE_PX[part],
        idle * n.sample(timeSeconds + 50) * LOOSE_IDLE_PX[part] * 0.6,
      ];
    }
    return out;
  }
}

/** Ken Perlin's smootherstep: 0/1 at the ends with zero first and second derivative. */
export function smootherstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}
