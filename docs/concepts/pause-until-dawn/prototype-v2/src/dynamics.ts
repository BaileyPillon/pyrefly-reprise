/**
 * The head-follow spring and the band-limited idle noise. Pure math, no DOM,
 * no `three` (this file is presentation *data*, not presentation itself —
 * the same layering discipline as `src/battle/**`, hard rule 1, extended to
 * this prototype by convention).
 */
import { RIG_CONSTANTS } from './constants.ts';
import { mulberry32 } from './rng.ts';

/**
 * First-order (single-pole) low-pass "spring": monotonic, never overshoots,
 * and reproduces the motion spec's documented settle percentages exactly.
 * See `constants.ts`'s decision note for why this isn't a two-pole
 * mass-spring-damper.
 */
export class ExponentialSpring {
  x: number;
  private targetValue: number;
  /** The gap at the moment the current target was set, for settledFraction(). */
  private originX: number;
  private originTarget: number;
  /** Mutable so `reducedMotion`/`hurt` states can retune it live. */
  tau: number;

  constructor(initial: number, tau: number = RIG_CONSTANTS.spring.tau) {
    this.x = initial;
    this.targetValue = initial;
    this.originX = initial;
    this.originTarget = initial;
    this.tau = tau;
  }

  get target(): number {
    return this.targetValue;
  }

  setTarget(target: number): void {
    if (target === this.targetValue) return;
    this.originX = this.x;
    this.originTarget = target;
    this.targetValue = target;
  }

  /** Snap immediately (reduced motion / initial mount) with no transition. */
  snap(value: number): void {
    this.x = value;
    this.targetValue = value;
    this.originX = value;
    this.originTarget = value;
  }

  step(dt: number): number {
    if (dt > 0) {
      const alpha = 1 - Math.exp(-dt / this.tau);
      this.x += (this.targetValue - this.x) * alpha;
    }
    return this.x;
  }

  /** 0 = transition just started, 1 = fully settled at the current target. */
  settledFraction(): number {
    const span = this.originTarget - this.originX;
    if (span === 0) return 1;
    return 1 - Math.abs(this.targetValue - this.x) / Math.abs(span);
  }

  /** Signed distance still to travel, for the diagnostics overlay. */
  residual(): number {
    return this.targetValue - this.x;
  }
}

export interface BandNoiseOptions {
  seed: number;
  bandHzMin?: number;
  bandHzMax?: number;
  /** 6-8 per the spec; more reads smoother, fewer reads more like a loop. */
  components?: number;
  /** Radians; offsets this generator's phases from another sharing the same band. */
  phaseOffset?: number;
}

/**
 * Band-limited idle noise: a sum of incommensurate sines inside
 * `[bandHzMin, bandHzMax]`, unit RMS. This is deliberately *not* a single
 * sine (autocorrelation of the reference peaks at only 0.06-0.42, section 8
 * of the motion spec) and deliberately not filtered white noise dressed up —
 * a small sum of sines is enough to fail a period test while staying cheap
 * and fully deterministic under a seed, which matters for `tests/unit`.
 */
export class BandNoise {
  private readonly freqsHz: number[] = [];
  private readonly phases: number[] = [];
  private readonly weights: number[] = [];

  constructor(opts: BandNoiseOptions) {
    const rnd = mulberry32(opts.seed >>> 0);
    const n = opts.components ?? 7;
    const fMin = opts.bandHzMin ?? RIG_CONSTANTS.sway.bandHzMin;
    const fMax = opts.bandHzMax ?? RIG_CONSTANTS.sway.bandHzMax;
    const raw: number[] = [];
    for (let i = 0; i < n; i++) {
      // Geometric spread across the band plus jitter so no two components
      // share a ratio close to a small integer (keeps it non-periodic).
      const spread = fMin * Math.pow(fMax / fMin, (i + rnd() * 0.6) / n);
      this.freqsHz.push(spread);
      this.phases.push(rnd() * Math.PI * 2 + (opts.phaseOffset ?? 0));
      raw.push(0.6 + rnd() * 0.8);
    }
    const rms0 = Math.sqrt(raw.reduce((s, w) => s + w * w, 0) / 2);
    for (const w of raw) this.weights.push(w / rms0);
  }

  /** Unit-RMS sample at time t (seconds). Multiply by the target amplitude. */
  sample(tSeconds: number): number {
    let sum = 0;
    for (let i = 0; i < this.freqsHz.length; i++) {
      sum += this.weights[i]! * Math.sin(2 * Math.PI * this.freqsHz[i]! * tSeconds + this.phases[i]!);
    }
    return sum;
  }
}

/** Head sway + chest sway sharing the band but on independent phases. */
export class IdleSway {
  readonly head: BandNoise;
  readonly chest: BandNoise;
  private rateMultiplier = 1;

  constructor(seed: number) {
    this.head = new BandNoise({ seed, phaseOffset: 0 });
    // Chest lags the head by ~1/3 of a cycle at the band's mean rate — modelled
    // as a fixed phase offset rather than a time delay, which would need a
    // history buffer for no measurable benefit at this band.
    const meanHz = (RIG_CONSTANTS.sway.bandHzMin + RIG_CONSTANTS.sway.bandHzMax) / 2;
    const lagRad = 2 * Math.PI * RIG_CONSTANTS.sway.chestPhaseLagFraction * (1 / meanHz) * meanHz;
    this.chest = new BandNoise({ seed: seed ^ 0x9e3779b9, phaseOffset: lagRad });
  }

  /** Hurt/determined states run the band faster (Sam AFTER: 0.34 vs 0.18 Hz). */
  setRateMultiplier(m: number): void {
    this.rateMultiplier = m;
  }

  headSample(tSeconds: number): number {
    return this.head.sample(tSeconds * this.rateMultiplier);
  }

  chestSample(tSeconds: number): number {
    return this.chest.sample(tSeconds * this.rateMultiplier);
  }
}
