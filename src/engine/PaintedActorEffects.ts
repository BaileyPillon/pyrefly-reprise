/**
 * The one-shot moves and looks: flash, lunge, strike, leap, knock-back, squash, hop, shake, the tints, the lights, the dissolve and the fade.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` -> `PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { MeshBasicMaterial, Vector3 } from 'three';
import { ATTACK_IMPACT, attackOffset, reachOffset } from './BattlePresenterActors.ts';
import { hitRecoilOffset, recoilLegacy } from './HitRecoil.ts'; // r40-recoil (FC-1): the knock-back's curve
import { heftOfHeight, motionBeat } from './feel/MotionBeats.ts'; // `?motionsfx=` (step 2; off by default): a figure tells the sound its lunge begins and its hop lands
import type { EasingFn, EasingName } from './Tween.ts';
import type { LeapOptions } from './motion/CurveDriver.ts'; // motion pass (lane "core"): the new curves; idle unless the presenter starts one (default OFF, `motion/CurvesSwitch.ts`)
import { curvesOn } from './motion/CurvesSwitch.ts';
import { heftOf, startStrike } from './motion/ActorCurves.ts';
import { newRecoilOffset, recoilDistance } from './motion/RecoilCurve.ts';
import type { HitSpec } from './motion/HitReaction.ts'; // MF-03: the struck figure's ramped rattle or directional knock-back (`?hit=`); idle by default
import { rampActor, type RampHost } from './motion/RampBeat.ts'; // MF-23
import type { StrikePlan } from './motion/StrikePlan.ts';
import type { MomentsHost } from './motion/ActorMoments.ts';
import { softActorFlash } from './flashRules.ts'; // PR-0032: REDUCE FLASHES
import { motionSmooth } from './PoseSwap.ts'; // W5: `?swap=aligned` (off by default), and the lunge's first frame (on; `?motion=classic` restores cubic-out)
import { TAU, STONE_TINT, clamp01 } from './PaintedActorKit.ts';
import { PaintedActorSizing } from './PaintedActorSizing.ts';

export abstract class PaintedActorEffects extends PaintedActorSizing {
  /** What the moments' helpers (`motion/ActorMoments.ts`) need of this actor. */
  protected momentsHost(): MomentsHost {
    return { worldHeight: this.worldHeight, name: this.name, leap: (h, ms, o) => this.leap(h, ms, o) };
  }

  /**
   * Additive flash toward `colour`, decaying to nothing over `ms`.
   *
   * The shader adds this on top of the painting (alpha- and
   * reflectance-weighted, clamped to white), so even `peak` 1 brightens the
   * figure rather than replacing it with a flat colour-shaped hole.
   *
   * Only one flash runs at a time. Two overlapping ones used to drive the same
   * uniform from two live tweens, and whichever happened to be later in the
   * group won the frame -- so a heal landing during a cast could *raise* the
   * amount back up and hold the figure lit. The in-flight tween is killed, and
   * the new one starts from whichever of the two is brighter so a weak flash
   * never cuts a strong one short.
   */
  flash(colour: number | string = 0xffffff, ms = 180, peak = 1, floorCut = 0): void { // floorCut 0..1: less dark-texel lift (FF7)
    if (this.softFlash?.()) ({ colour, ms, peak } = softActorFlash(colour, ms, peak)); // REDUCE FLASHES: peak 0.35, white turns ivory, ms unchanged
    this.flashTween?.kill();
    this.u.flashColor.value.set(colour as never); this.u.flashFloorCut.value = clamp01(floorCut);
    const from = Math.max(clamp01(peak), this.u.flashAmount.value);
    this.u.flashAmount.value = from;
    this.flashTween = this.tweens.to(from, 0, {
      durationMs: Math.max(1, ms),
      easing: 'quadOut',
      onUpdate: (v) => {
        this.u.flashAmount.value = v;
      },
      onComplete: () => {
        this.flashTween = null;
        this.u.flashAmount.value = 0;
      },
    });
  }

  /**
   * Step in, strike, come home — the attack move, along the *body's* facing.
   *
   * Not one ease out and back: that is a drift, and it reads as the figure
   * sliding into the enemy. The shape is punctuated — quick step, a beat of
   * stillness, the strike pushing through the top of it, then the walk back —
   * which is what makes a still painting read as hitting something. The timing
   * lives in {@link import('./BattlePresenterActors.ts').ATTACK_BEATS}; the
   * peak is still `distance` and the whole move still takes `ms`, so every
   * existing call site keeps its staging. `house`: how much of `distance` is the
   * house lunge (default all of it); a strike carried further than that to reach its
   * target (`motion/StrikeReach.ts`) moves the rest on the eased step.
   */
  lunge(distance = 0.9, ms = 320, contact?: { hold: Promise<unknown>; reached: () => void }, house = distance): Promise<void> {
    motionBeat({ kind: 'lunge', strength: distance / 2.4, heft: heftOfHeight(this.worldHeight), atMs: ms * 0.19, ms }); // the step's fastest frame is at 0.19 of the move (measured in the real game, Chapter I, stepped at 60 Hz: +84 ms of a 440 ms move; the smooth `reachOffset` house step, not the classic `attackOffset`'s 0.13)
    const from = this.lungeOffset; // anything in flight folds out over the first beat (no snap back to zero)
    const houseStep = motionSmooth() ? reachOffset : attackOffset; // W5 (on by default; `?motion=classic` restores cubic-out): the house part's step starts on the velocity-continuous curve, not cubic-out's 28 percent first frame; same distance, same beats
    const extra = Math.max(0, distance - house); // the distance beyond the house lunge rides the eased step (`reachOffset`); the house part is `attackOffset` to the frame
    const leg = (a: number, b: number, d: number): Promise<void> => this.tweens.toAsync(a, b, { durationMs: Math.max(1, d), easing: 'linear',
      onUpdate: (t) => void (this.lungeOffset = (distance - extra) * houseStep(t) + extra * reachOffset(t) + from * Math.max(0, 1 - t / 0.26)) });
    // VP-1001-06 (`ContactBeat.ts`): with a contact, the strike holds at its apex until the blow lands.
    const run = contact ? leg(0, ATTACK_IMPACT, ms * ATTACK_IMPACT).then(() => (contact.reached(), contact.hold)).then(() => leg(ATTACK_IMPACT, 1, ms * (1 - ATTACK_IMPACT))) : leg(0, 1, ms);
    return run.then(() => void (this.lungeOffset = 0));
  }

  /**
   * The new strike (motion pass, lane "core"): one sampled timeline of wind-up, arcing step, contact, hold, return and settle (`motion/StrikeCurve.ts`), walked on this actor's
   * paced clock. Resolves when the move is over. Started by the presenter only when `curvesOn()`; `lunge` is untouched for everything else.
   */
  strike(plan: StrikePlan): Promise<void> {
    return startStrike(this.curves, plan, this.worldHeight);
  }

  /** 0 for a party-sized figure up to 1 for a default-size foe (`motion/ActorCurves.heftOf`): the strike's heft, which the strike's sound reads (`StrikeBeat.strikeBeatNow`). */
  strikeHeft(): number {
    return heftOf(this.worldHeight);
  }

  /** A cast's lift: rise `height` world units over `ms` and HOLD until {@link liftRelease}. */
  liftTo(height: number, ms = 220): void {
    this.curves.cast.rise(height, ms);
  }

  /** The cast is away: come down over `ms` and ring a small landing squash. */
  liftRelease(ms = 260): void {
    this.curves.cast.release(ms);
  }

  /** An arc with a take-off crouch, a stretch in the air and a landing squash (FFX-2's run-in; the turn-start weight shift). Resolves at the landing. */
  leap(height: number, ms: number, options?: LeapOptions): Promise<void> {
    // The lane "feel" landing thud (`?motionsfx=`): the hop reports its landing, so the leap that replaces it under the curves does too (strength is the landing squash over its 6 percent cap).
    const land = options?.land ?? 0.04;
    return this.curves.leap(height, ms, { ...options, onLand: () => motionBeat({ kind: 'land', strength: land / 0.06, heft: heftOfHeight(this.worldHeight) }) });
  }

  protected knockBack(ms: number, distance: number): Promise<void> {
    // r40-recoil (FC-1, `HitRecoil.ts`): an 80 ms eased push from where the figure is, then a spring home; progress 0 writes where it already is, so a hit-stop (dt 0) never teleports it.
    const legacy = recoilLegacy();
    const from = this.recoilOffset;
    const fresh = !legacy && curvesOn(); // motion pass (lane "core"): a few px, then recover with one small overshoot (`motion/RecoilCurve.ts`)
    const push = fresh ? recoilDistance(distance, heftOf(this.worldHeight)) : distance;
    return this.tweens.toAsync(legacy ? 1 : 0, legacy ? 0 : 1, {
      durationMs: Math.max(1, ms),
      easing: legacy ? 'elasticOut' : 'linear',
      onUpdate: (v, p) => void (this.recoilOffset = legacy ? -v * distance : fresh ? newRecoilOffset(p, ms, push, from) : hitRecoilOffset(p, ms, distance, from)),
    });
  }

  /** Warm damage tint over the painting, decaying to the base tint. */
  protected tintHurt(ms = 240): void {
    this.tweens.to(1, 0, {
      durationMs: Math.max(1, ms),
      easing: 'quadOut',
      onUpdate: (v) => {
        this.hurtTint = v;
        this.syncTint();
      },
      onComplete: () => {
        this.hurtTint = 0;
        this.syncTint();
      },
    });
  }

  private syncTint(): void {
    this.tintScratch.copy(this.baseTint).lerp(this.hurtTintColour, clamp01(this.hurtTint));
    this.u.tint.value.copy(this.tintScratch.lerp(STONE_TINT, this.stoneAmount * 0.6));
  }

  /**
   * The quiet dim: how far this figure is pushed toward grey and toward dark
   * while somebody *else* is the target. 0 = untouched, 1 = fully grey.
   *
   * Option B dims a non-target "about a quarter", which is `0.25` here: the
   * shader takes it as both the desaturation amount and (at a gentler rate) a
   * brightness trim, so the change reads as the figure stepping out of the
   * light rather than as a colour-grade bug. The trim rate 0.9 lands the
   * on-screen drop at about 17 percent after tone mapping (PR-0031; 0.72 read
   * as no dim at all in the critic's frames).
   */
  setDim(amount: number): void {
    const k = clamp01(amount);
    this.dimAmount = k;
    this.u.desaturate.value = Math.max(k, this.stoneAmount);
    this.u.brightness.value = this.baseBrightness * (1 - k * 0.9);
  }

  get dim(): number {
    return this.dimAmount;
  }

  /** A plain delay on the actor's own tween group, so `dispose` kills it. */
  protected after(ms: number, fn: () => void): void {
    if (ms <= 0) {
      fn();
      return;
    }
    this.tweens.to(0, 1, {
      durationMs: 1,
      delayMs: ms,
      easing: 'linear',
      onUpdate: () => {},
      onComplete: fn,
    });
  }

  /** Squash and stretch, springing back. `amount` 1 = the default 18%. */
  squash(ms = 320, amount = 1): Promise<void> {
    return this.tweens.toAsync(amount, 0, {
      durationMs: ms,
      easing: 'elasticOut',
      onUpdate: (v) => {
        this.squashAmount = v;
      },
    });
  }

  /** A sine arc hop. */
  hop(height = 0.5, ms = 420): Promise<void> {
    return this.tweens.toAsync(0, 1, {
      durationMs: ms,
      easing: 'linear',
      onUpdate: (t) => {
        this.hopHeight = Math.sin(Math.PI * t) * height;
      },
      onComplete: () => motionBeat({ kind: 'land', strength: height / (this.worldHeight * 0.33), heft: heftOfHeight(this.worldHeight) }), // the landing thud (`?motionsfx=`); a killed hop (the actor is disposed) never lands
    });
  }

  /** Damped jitter, in world units. `phase` (radians, MF-09) fixes where the sine starts; without it the phase is random, as it always was. */
  shake(amount = 0.08, ms = 300, phase?: number): void {
    if (this.still?.()) return;
    this.shakeAmp = amount;
    this.shakeLeftMs = ms;
    this.shakeTotalMs = Math.max(1, ms);
    this.shakePhase = phase ?? Math.random() * TAU;
  }

  /** MF-03 (`?hit=ramp|knock`, `motion/HitBeat.ts`): a blow's reaction in place of {@link shake}. False when REDUCE MOTION holds the jitter off (the caller plays today's). */
  hitReact(spec: HitSpec): boolean {
    if (this.still?.()) return false;
    this.hit.start(spec);
    return true;
  }

  setDissolve(value: number): void {
    this.u.dissolve.value = value;
  }

  /** How far the dissolve has eaten the figure, 0..1 (the stage's pyrefly release reads it, `PyreflyStage.ts`). */
  get dissolveLevel(): number {
    return this.u.dissolve.value;
  }

  /**
   * `'pyrefly'`: the death of a fiend that is sent (A-5): eaten from the feet
   * up with a gold burn edge. `'plain'` (the default) is the old dissolve.
   */
  setDissolveStyle(style: 'plain' | 'pyrefly'): void {
    this.u.dissolveSweep.value = style === 'pyrefly' ? 1 : 0;
  }

  fadeTo(alpha: number, ms = 300, easing: EasingName | EasingFn = 'quadInOut'): Promise<void> {
    return this.tweens.toAsync(this._alpha, alpha, {
      durationMs: ms,
      easing,
      onUpdate: (v) => this.setAlpha(v),
    });
  }

  setAlpha(alpha: number): void {
    this._alpha = alpha;
    this.syncOpacity();
    const sm = this.shadow?.material as MeshBasicMaterial | undefined;
    if (sm) sm.opacity = this.shadowBaseOpacity * alpha;
  }

  get alpha(): number {
    return this._alpha;
  }

  moveTo(
    pos: Vector3 | { x: number; y: number; z: number },
    ms = 400,
    easing: EasingName | EasingFn = 'quadInOut',
  ): Promise<void> {
    const from = this.position.clone();
    const to = new Vector3(pos.x, pos.y, pos.z);
    return this.tweens.toAsync(0, 1, {
      durationMs: ms,
      easing,
      onUpdate: (t) => {
        this.position.lerpVectors(from, to, t);
      },
    });
  }

  /** MF-23 (`?ramps=smooth`): one linear tween of brightness, stone or scale on this actor's own clock (`motion/RampBeat.rampActor`). */
  ramp(prop: 'brightness' | 'stone' | 'scale', to: number, ms: number): Promise<void> {
    return rampActor(this as unknown as RampHost, prop, to, ms);
  }

  holdLanding(): void { if (this.fallDue) this.landHeld = true; } // MF-09/17: the KO run is up and plays the landing itself when it cuts

  get striking(): boolean { return this.curves.strike !== null; } // MF-11: a strike (wind-up to settle) is in flight

  waitMs(ms: number): Promise<void> { return this.tweens.toAsync(0, 1, { durationMs: Math.max(1, ms), easing: 'linear', onUpdate: () => {} }); } // MF-04: settles after `ms` of this actor's own tween clock

  setBrightness(mult: number): void {
    this.u.brightness.value = this.baseBrightness * mult;
  }

  setTint(colour: number | string): void {
    this.baseTint.set(colour as never);
    this.syncTint();
  }

  /** Petrified, 0..1: drained of colour and tinted stone, beside (never fighting) {@link setDim}. */
  setStone(k: number): void {
    this.stoneAmount = clamp01(k);
    this.u.desaturate.value = Math.max(this.dimAmount, this.stoneAmount);
    this.syncTint();
  }

  /** Drive the rim light from the scene's light rig. */
  setRimLight(colour: number | string, strength: number, dir?: [number, number]): void {
    this.u.rimColor.value.set(colour as never);
    this.u.rimStrength.value = strength;
    if (dir) {
      this.rimDirBase.set(dir[0], dir[1]);
      this.applyMirror();
    }
  }

  /** Ground-bounce colour added into the lower half of the figure. */
  setBounceLight(colour: number | string, strength: number): void {
    this.u.bounceColor.value.set(colour as never);
    this.u.bounceStrength.value = strength;
  }
}
