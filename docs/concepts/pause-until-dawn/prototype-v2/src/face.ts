/**
 * The face's own clocks: the blink scheduler and the mouth/brow event
 * scheduler. No DOM, no rendering — `renderer.ts` reads these frames and
 * decides which patch texture to draw.
 */
import { RIG_CONSTANTS } from './constants.ts';
import { mulberry32 } from './rng.ts';

export type EyeState = 'open' | 'half' | 'closing' | 'closed' | 'opening';

export interface BlinkFrame {
  state: EyeState;
  /** 1 = fully open, 0 = fully closed. */
  aperture: number;
}

/**
 * Full blinks (close/hold/open, 150-170ms total) plus half blinks (200ms,
 * bottoms at 50-60% aperture, never closes) on an independent clock, per
 * section 4 of the motion spec: "something happens to the lids about every
 * 2s" because a full-blink process alone (1 per 4.9s) is far sparser than
 * that.
 */
export class BlinkScheduler {
  private readonly rnd: () => number;
  private t = 0;
  private nextFullAt: number;
  private phase: 'idle' | 'closing' | 'holding' | 'opening' = 'idle';
  private phaseElapsed = 0;
  private holdDuration = 0;
  private nextHalfAt: number;
  private halfActive = false;
  private halfElapsed = 0;
  /** Human-readable event log for the diagnostics overlay (`F`). */
  readonly log: string[] = [];

  constructor(seed: number) {
    this.rnd = mulberry32(seed);
    this.nextFullAt = this.sampleFullInterval();
    this.nextHalfAt = this.sampleFullInterval() * 0.85;
  }

  private sampleFullInterval(): number {
    const { fullMinIntervalS, fullMaxIntervalS } = RIG_CONSTANTS.blink;
    // Sum of two uniforms (Irwin-Hall n=2) biases the mass toward the middle
    // of the range, closer to the documented 4.9s mean than a flat uniform.
    const a = this.rnd();
    const b = this.rnd();
    const span = fullMaxIntervalS - fullMinIntervalS;
    return fullMinIntervalS + (span * (a + b)) / 2;
  }

  /** `B`: blink now, unless one is already mid-flight. */
  forceBlink(): void {
    if (this.phase === 'idle') {
      this.phase = 'closing';
      this.phaseElapsed = 0;
      this.log.push(`blink(forced)@${this.t.toFixed(2)}s`);
    }
  }

  /** Debug/verification aid: starts a half-blink now, unless one is already running. */
  forceHalfBlink(): void {
    if (!this.halfActive && this.phase === 'idle') {
      this.halfActive = true;
      this.halfElapsed = 0;
      this.log.push(`half(forced)@${this.t.toFixed(2)}s`);
    }
  }

  update(dt: number): BlinkFrame {
    this.t += dt;

    if (!this.halfActive && this.phase === 'idle' && this.t >= this.nextHalfAt) {
      this.halfActive = true;
      this.halfElapsed = 0;
      this.log.push(`half@${this.t.toFixed(2)}s`);
    } else if (this.halfActive) {
      this.halfElapsed += dt;
      if (this.halfElapsed >= RIG_CONSTANTS.blink.halfDurationS) {
        this.halfActive = false;
        this.nextHalfAt = this.t + this.sampleFullInterval();
      }
    }

    if (this.phase === 'idle' && this.t >= this.nextFullAt) {
      this.phase = 'closing';
      this.phaseElapsed = 0;
      this.log.push(`blink@${this.t.toFixed(2)}s`);
    }

    if (this.phase !== 'idle') {
      this.phaseElapsed += dt;
      const c = RIG_CONSTANTS.blink;
      if (this.phase === 'closing' && this.phaseElapsed >= c.closeS) {
        this.phase = 'holding';
        this.phaseElapsed = 0;
        this.holdDuration = c.holdMinS + this.rnd() * (c.holdMaxS - c.holdMinS);
      } else if (this.phase === 'holding' && this.phaseElapsed >= this.holdDuration) {
        this.phase = 'opening';
        this.phaseElapsed = 0;
      } else if (this.phase === 'opening' && this.phaseElapsed >= c.openS) {
        this.phase = 'idle';
        this.phaseElapsed = 0;
        this.nextFullAt = this.t + this.sampleFullInterval();
      }
    }

    return this.frame();
  }

  private frame(): BlinkFrame {
    const c = RIG_CONSTANTS.blink;
    if (this.phase === 'closing') return { state: 'closing', aperture: 1 - this.phaseElapsed / c.closeS };
    if (this.phase === 'holding') return { state: 'closed', aperture: 0 };
    if (this.phase === 'opening') return { state: 'opening', aperture: this.phaseElapsed / c.openS };
    if (this.halfActive) {
      const f = this.halfElapsed / RIG_CONSTANTS.blink.halfDurationS;
      const triangle = f < 0.5 ? f * 2 : (1 - f) * 2; // 0 -> 1 -> 0 over the event
      const bottomDepth = 1 - (c.halfApertureMin + c.halfApertureMax) / 2;
      return { state: 'half', aperture: 1 - triangle * bottomDepth };
    }
    return { state: 'open', aperture: 1 };
  }
}

export type MouthPatch = 'neutral' | 'parted' | 'smile' | 'pressed';
export type BrowPatch = 'neutral' | 'raised' | 'drawn';

export interface ExpressionFrame {
  mouth: MouthPatch;
  mouthWeight: number;
  brow: BrowPatch;
  browWeight: number;
}

/**
 * Continuous mouth/brow swells: 400ms onset (linear), no hold, ~2.8s
 * exponential release — "fast in, slow out", per section 7. The mouth is
 * the busiest region of the idle face, so its event rate is the base rate;
 * brows run 1.6x rarer and are capped at 40% of the mouth's amplitude.
 */
export class ExpressionScheduler {
  private readonly rnd: () => number;
  private t = 0;
  private mouthEvent: { patch: MouthPatch; startedAt: number } | null = null;
  private nextMouthAt: number;
  private browEvent: { patch: BrowPatch; startedAt: number } | null = null;
  private nextBrowAt: number;
  /** Hurt/determined states retune this: "busier brow" and a faster mouth. */
  rateMultiplier = 1;

  constructor(seed: number) {
    this.rnd = mulberry32(seed);
    this.nextMouthAt = this.sampleInterval();
    this.nextBrowAt = this.sampleInterval() * 1.6;
  }

  private sampleInterval(): number {
    const mean = RIG_CONSTANTS.expression.eventMeanIntervalS / this.rateMultiplier;
    return mean * (0.75 + this.rnd() * 0.5); // spreads roughly across "3 to 5s"
  }

  private envelope(ageS: number): number {
    const onsetS = RIG_CONSTANTS.expression.onsetMs / 1000;
    if (ageS < onsetS) return ageS / onsetS;
    return Math.exp(-(ageS - onsetS) / RIG_CONSTANTS.expression.decayS);
  }

  /** Debug/verification aid: starts a mouth event now, unless one is already running. */
  forceMouthEvent(patch: MouthPatch = 'smile'): void {
    if (!this.mouthEvent) this.mouthEvent = { patch, startedAt: this.t };
  }

  update(dt: number): ExpressionFrame {
    this.t += dt;

    if (!this.mouthEvent && this.t >= this.nextMouthAt) {
      const options: MouthPatch[] = ['parted', 'smile', 'pressed'];
      this.mouthEvent = { patch: options[Math.floor(this.rnd() * options.length)]!, startedAt: this.t };
    }
    let mouth: MouthPatch = 'neutral';
    let mouthWeight = 0;
    if (this.mouthEvent) {
      const age = this.t - this.mouthEvent.startedAt;
      mouthWeight = this.envelope(age);
      mouth = this.mouthEvent.patch;
      if (age > RIG_CONSTANTS.expression.onsetMs / 1000 && mouthWeight < 0.02) {
        this.mouthEvent = null;
        this.nextMouthAt = this.t + this.sampleInterval();
      }
    }

    if (!this.browEvent && this.t >= this.nextBrowAt) {
      const options: BrowPatch[] = ['raised', 'drawn'];
      this.browEvent = { patch: options[Math.floor(this.rnd() * options.length)]!, startedAt: this.t };
    }
    let brow: BrowPatch = 'neutral';
    let browWeight = 0;
    if (this.browEvent) {
      const age = this.t - this.browEvent.startedAt;
      browWeight = this.envelope(age) * RIG_CONSTANTS.expression.browAmplitudeFraction;
      brow = this.browEvent.patch;
      if (age > RIG_CONSTANTS.expression.onsetMs / 1000 && browWeight < 0.01) {
        this.browEvent = null;
        this.nextBrowAt = this.t + this.sampleInterval() * 1.6;
      }
    }

    return { mouth, mouthWeight, brow, browWeight };
  }
}

/**
 * The lid follows the eye: aperture narrows slightly as the gaze looks down.
 * No saccades anywhere in this rig — gaze is driven straight from the head
 * spring's own target, never an independent random walk (section 5: "no
 * saccades... big gaze changes happen with the head turn").
 */
export function lidDroopForGaze(baseAperture: number, gazeY: number): number {
  const droop = Math.max(0, gazeY) * 0.15;
  return Math.max(0, Math.min(1, baseAperture - droop));
}
