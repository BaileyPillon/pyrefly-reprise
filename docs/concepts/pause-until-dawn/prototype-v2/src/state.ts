/**
 * The frame-by-frame state machine: springs + sway + blink + expression,
 * combined into one `Frame` the renderer can draw and the diagnostics
 * overlay can print. Deliberately has no DOM and no WebGL dependency so it
 * can be driven and asserted on directly in `tests/unit`, the same
 * separation `src/battle/**` keeps from `src/engine/**` (hard rule 1,
 * extended here by convention).
 */
import { RIG_CONSTANTS } from './constants.ts';
import { ExponentialSpring, IdleSway } from './dynamics.ts';
import { BlinkScheduler, ExpressionScheduler, lidDroopForGaze, type EyeState, type MouthPatch, type BrowPatch } from './face.ts';

export type ExpressionName = 'normal' | 'determined' | 'hurt';

export interface Frame {
  yawDeg: number;
  pitchDeg: number;
  gaze: { x: number; y: number };
  eyeState: EyeState;
  eyeAperture: number;
  mouth: MouthPatch;
  mouthWeight: number;
  brow: BrowPatch;
  browWeight: number;
  timeSeconds: number;
  reducedMotion: boolean;
  springResidualDeg: number;
  blinkLog: readonly string[];
  /**
   * Unit-RMS band-limited noise for the pinned body/chest layer's own small
   * breathing sway — same band as `headSample`, independent phase (see
   * `IdleSway`), zeroed under reduced motion. Was computed (`chestSway()`,
   * below) but never read anywhere until this pass wired it into
   * `renderer.ts`'s body-layer draw (AGENTS.md hard rule 4: built but wired
   * to nothing).
   */
  chestSample: number;
  /** v3.2: the chest's horizontal sample (own phase), unit RMS; 0 under reduced motion. */
  chestSampleX: number;
  /**
   * v3.2: the head's yaw from the spring alone, without the idle wander.
   * The renderer picks the painted key from this, so a held gaze never
   * flickers between two paintings as the head wanders.
   */
  baseYawDeg: number;
  /** v3.2: the head's own translation wander, two unit-RMS samples [x, y]; zeros under reduced motion. */
  headSample: [number, number];
}

export interface StateSeed {
  headSway?: number;
  blink?: number;
  expression?: number;
}

export class PortraitStateMachine {
  private readonly yawSpring: ExponentialSpring;
  private readonly pitchSpring: ExponentialSpring;
  private readonly sway: IdleSway;
  private readonly blinkScheduler: BlinkScheduler;
  private readonly exprScheduler: ExpressionScheduler;
  private gazeTarget = { x: 0, y: 0 };
  private expression: ExpressionName = 'normal';
  private reducedMotion = false;
  private tSeconds = 0;
  /** Degrees; defaults to the stand-in's symmetric range until a real rig sets it. */
  private yawMin: number = -RIG_CONSTANTS.yaw.maxDeg;
  private yawMax: number = RIG_CONSTANTS.yaw.maxDeg;

  constructor(seed: StateSeed = {}) {
    this.yawSpring = new ExponentialSpring(0);
    this.pitchSpring = new ExponentialSpring(0);
    this.sway = new IdleSway(seed.headSway ?? 1);
    this.blinkScheduler = new BlinkScheduler(seed.blink ?? 2);
    this.exprScheduler = new ExpressionScheduler(seed.expression ?? 3);
  }

  setGazeTarget(x: number, y: number): void {
    this.gazeTarget = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  }

  /** An authored rig's yaw range is usually asymmetric (see `rig.ts: yawRangeForRig`). */
  setYawRange(min: number, max: number): void {
    this.yawMin = min;
    this.yawMax = max;
  }

  setExpression(name: ExpressionName): void {
    this.expression = name;
    const isHurt = name === 'hurt';
    this.sway.setRateMultiplier(isHurt ? RIG_CONSTANTS.hurt.swayRateMultiplier : name === 'determined' ? 0.8 : 1);
    this.exprScheduler.rateMultiplier = isHurt ? RIG_CONSTANTS.hurt.browRateMultiplier : 1;
  }

  getExpression(): ExpressionName {
    return this.expression;
  }

  forceBlink(): void {
    this.blinkScheduler.forceBlink();
  }

  /** Debug/verification aid — see `BlinkScheduler.forceHalfBlink`. */
  forceHalfBlink(): void {
    this.blinkScheduler.forceHalfBlink();
  }

  /** Debug/verification aid — see `ExpressionScheduler.forceMouthEvent`. */
  forceMouthEvent(patch?: MouthPatch): void {
    this.exprScheduler.forceMouthEvent(patch);
  }

  /** Debug/verification aid (v4) — see `ExpressionScheduler.forceBrowEvent`. */
  forceBrowEvent(patch?: BrowPatch): void {
    this.exprScheduler.forceBrowEvent(patch);
  }

  setReducedMotion(on: boolean): void {
    this.reducedMotion = on;
    this.yawSpring.tau = on ? RIG_CONSTANTS.reducedMotion.tau : RIG_CONSTANTS.spring.tau;
    this.pitchSpring.tau = this.yawSpring.tau;
  }

  isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  /** Advances the clock by `dt` seconds and returns the frame to draw. */
  update(dt: number): Frame {
    this.tSeconds += dt;
    const tighten = this.expression === 'hurt' ? RIG_CONSTANTS.hurt.gazeTighten : 1;
    // Asymmetric-range aware: gazeTarget.x in [-1,1] maps to [yawMin,yawMax],
    // not to +-yawMax on both sides (an authored rig's range rarely is).
    const yawSpan = this.gazeTarget.x >= 0 ? this.yawMax : -this.yawMin;
    this.yawSpring.setTarget(this.gazeTarget.x * yawSpan * tighten);
    const maxYaw = Math.max(this.yawMax, -this.yawMin);
    this.pitchSpring.setTarget(this.gazeTarget.y * maxYaw * 0.6 * tighten);

    // The head always follows input (spec section 11: on release it holds,
    // it does not snap) — reduced motion only raises tau and drops the
    // *idle* layers (noise sway, continuous mouth/brow drift), per section
    // 11's own "Reduced motion" row.
    const yawFollow = this.yawSpring.step(dt);
    const pitchFollow = this.pitchSpring.step(dt);

    let yawDeg = yawFollow;
    let pitchDeg = pitchFollow;
    let headSample: [number, number] = [0, 0];
    let mouth: MouthPatch = 'neutral';
    let mouthWeight = 0;
    let brow: BrowPatch = 'neutral';
    let browWeight = 0;

    if (!this.reducedMotion) {
      // v3.2: the head's idle sway is a translation (`headSample`, carried by
      // the renderer's mesh); the rotation keeps only a small wander, sized at
      // p95 (v3.1 turned the head-width fraction into +-10 deg of yaw).
      const swayDeg = RIG_CONSTANTS.sway.yawWanderDegP95 / RIG_CONSTANTS.sway.p95OverRms;
      // Taper the yaw sway as the spring's own target nears the rig's hard
      // yaw stop (measured this pass: held at -85deg, the *rendered* yaw kept
      // wandering between -85 and about -79deg indefinitely — sway pushing
      // past the limit, then getting clamped below, reads as the head
      // bouncing against a wall instead of the spec's "holds at the extreme").
      // Fading sway out over the last few degrees of room, rather than
      // clamping its result after the fact, keeps a held extreme visually
      // still without touching the spring itself or the sway's own amplitude
      // anywhere but right at the limit. `YAW_EDGE_TAPER_DEG` and the taper
      // floor are a tuning choice (the spec measured a held-stick hold, not
      // this interaction), not a spec constant, so it stays local to this
      // function rather than in `constants.ts`.
      const YAW_EDGE_TAPER_DEG = 8;
      const yawEdgeRoomDeg = Math.min(yawFollow - this.yawMin, this.yawMax - yawFollow);
      const yawSwayTaper = Math.max(0.2, Math.min(1, yawEdgeRoomDeg / YAW_EDGE_TAPER_DEG));
      yawDeg += this.sway.headSample(this.tSeconds) * swayDeg * yawSwayTaper;
      pitchDeg += this.sway.headSample(this.tSeconds + 100) * swayDeg * 0.6;
      headSample = [this.sway.headSample(this.tSeconds + 200), this.sway.headSample(this.tSeconds + 300)];
      const expr = this.exprScheduler.update(dt);
      mouth = expr.mouth;
      mouthWeight = expr.mouthWeight;
      brow = expr.brow;
      browWeight = expr.browWeight;
    }

    const blink = this.blinkScheduler.update(dt);
    const aperture = lidDroopForGaze(blink.aperture, this.gazeTarget.y);
    // Sway can nudge slightly past the spring's own target; hold the hard
    // stop at the rig's range regardless ("stopping: hard stop... no bounce").
    yawDeg = Math.max(this.yawMin, Math.min(this.yawMax, yawDeg));

    return {
      yawDeg,
      pitchDeg,
      gaze: { ...this.gazeTarget },
      eyeState: blink.state,
      eyeAperture: aperture,
      mouth,
      mouthWeight,
      brow,
      browWeight,
      timeSeconds: this.tSeconds,
      reducedMotion: this.reducedMotion,
      springResidualDeg: this.yawSpring.residual(),
      blinkLog: this.blinkScheduler.log,
      chestSample: this.chestSway(),
      chestSampleX: this.reducedMotion ? 0 : this.sway.chestSample(this.tSeconds + 150),
      baseYawDeg: Math.max(this.yawMin, Math.min(this.yawMax, yawFollow)),
      headSample,
    };
  }

  /** Chest sway alone, for the pinned body/chest layer's own breathing sway. */
  chestSway(): number {
    return this.reducedMotion ? 0 : this.sway.chestSample(this.tSeconds);
  }
}
