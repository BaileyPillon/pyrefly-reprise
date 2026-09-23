import { PerspectiveCamera, Vector3 } from 'three';
import { TweenGroup, damp, type EasingFn, type EasingName } from './Tween.ts';

export interface CameraRig {
  /** Camera world position. */
  position: [number, number, number] | Vector3;
  /** Point the camera aims at. */
  lookAt: [number, number, number] | Vector3;
  /** Optional per-rig field of view. */
  fov?: number;
  /** Idle sway amplitude multiplier for this rig (1 = default). */
  sway?: number;
}

interface ResolvedRig {
  position: Vector3;
  lookAt: Vector3;
  fov: number | undefined;
  sway: number;
}

export interface BattleCameraOptions {
  /** Named rigs available at construction. More can be added with {@link addRig}. */
  rigs?: Record<string, CameraRig>;
  /** Rig to snap to immediately. */
  initial?: string;
  /** Base idle sway amplitude in world units. Default 0.055. */
  swayAmplitude?: number;
  /** Idle sway speed in radians/second. Default 0.42. */
  swaySpeed?: number;
}

const toVec = (v: [number, number, number] | Vector3): Vector3 =>
  v instanceof Vector3 ? v.clone() : new Vector3(v[0], v[1], v[2]);

/**
 * Named camera rigs with smooth tweens between them, plus a permanent, very
 * gentle idle sway so nothing in frame is ever perfectly still.
 *
 * Every scene registers at least `idle`, `action` and `victory`.
 */
export class BattleCamera {
  readonly camera: PerspectiveCamera;
  readonly tweens = new TweenGroup();
  /**
   * Punch / push / roll live in their own group.
   *
   * `moveTo` and `snapTo` both `killAll()` {@link tweens} so a rig change
   * cancels the rig change it interrupts — but a *moment* is built out of a
   * rig change **and** a dolly push at the same time (`BattleMoments`: the
   * Overdrive rig pushes in while it cuts, the telegraph zoom rides through a
   * banner). Sharing one group meant the rig move silently ate the push.
   */
  private readonly fx = new TweenGroup();

  private readonly rigs = new Map<string, ResolvedRig>();
  private readonly swayAmplitude: number;
  private readonly swaySpeed: number;

  /** Rig target (what we are tweening toward / resting at). */
  private targetPos = new Vector3(0, 3.4, 9);
  private targetLook = new Vector3(0, 1.4, 0);
  /** Smoothed values actually applied to the camera each frame. */
  private curPos = new Vector3(0, 3.4, 9);
  private curLook = new Vector3(0, 1.4, 0);

  private tweenFromPos = new Vector3();
  private tweenFromLook = new Vector3();
  private tweening = false;

  private currentRig = '';
  /**
   * Resolver for the `moveTo` currently in flight.
   *
   * `TweenGroup.killAll` kills a tween without firing its `onComplete`, so the
   * promise `moveTo` handed out would never settle once a second move (or a
   * `snapTo`) superseded it — and a caller that `await`ed the first one would
   * wait forever. A superseded move resolves here instead: the camera did stop
   * doing what it was asked, which is all the caller was waiting to know.
   */
  private moveResolve: (() => void) | null = null;
  private swayClock = Math.random() * 100;
  private swayScale = 1;
  private readonly scratch = new Vector3();

  /** Impact shake, in world units, damping out over its lifetime. */
  private shakeAmp = 0;
  private shakeLeftMs = 0;
  private shakeTotalMs = 1;
  private shakePhase = 0;
  /**
   * Dolly punch: a fraction of the camera-to-subject distance the camera is
   * pushed in by, on top of whatever rig is active. Never touches `fov` — the
   * texel ratio has to stay put (visual-bible §6.3).
   */
  private punchAmount = 0;
  /**
   * Dutch roll in radians, applied after `lookAt`. The presentation spec asks
   * for "-4deg roll on every attack" (`presentation-ink-and-gold.md`, "Motion &
   * camera"); {@link roll} tweens there and back, {@link setRoll} holds it.
   */
  private rollRad = 0;

  constructor(camera: PerspectiveCamera, opts: BattleCameraOptions = {}) {
    this.camera = camera;
    this.swayAmplitude = opts.swayAmplitude ?? 0.055;
    this.swaySpeed = opts.swaySpeed ?? 0.42;

    for (const [name, rig] of Object.entries(opts.rigs ?? {})) this.addRig(name, rig);
    const initial = opts.initial ?? (this.rigs.has('idle') ? 'idle' : [...this.rigs.keys()][0]);
    if (initial) this.snapTo(initial);
  }

  get rigName(): string {
    return this.currentRig;
  }

  get rigNames(): string[] {
    return [...this.rigs.keys()];
  }

  addRig(name: string, rig: CameraRig): void {
    this.rigs.set(name, {
      position: toVec(rig.position),
      lookAt: toVec(rig.lookAt),
      fov: rig.fov,
      sway: rig.sway ?? 1,
    });
  }

  getRig(name: string): CameraRig | undefined {
    const r = this.rigs.get(name);
    if (!r) return undefined;
    return {
      position: r.position.clone(),
      lookAt: r.lookAt.clone(),
      ...(r.fov !== undefined ? { fov: r.fov } : {}),
      sway: r.sway,
    };
  }

  /**
   * Settle the promise handed out by a `moveTo` that has just been superseded
   * by another rig change. See {@link moveResolve}: `TweenGroup.killAll` kills
   * a tween without firing its `onComplete`, so without this the first move's
   * promise would never settle and a caller awaiting it would wait forever.
   */
  private settleMove(): void {
    const resolve = this.moveResolve;
    this.moveResolve = null;
    resolve?.();
  }

  /** Jump straight to a rig with no interpolation. */
  snapTo(name: string): void {
    const rig = this.rigs.get(name);
    if (!rig) return;
    this.currentRig = name;
    this.settleMove();
    this.tweens.killAll();
    this.tweening = false;
    this.targetPos.copy(rig.position);
    this.targetLook.copy(rig.lookAt);
    this.curPos.copy(rig.position);
    this.curLook.copy(rig.lookAt);
    this.swayScale = rig.sway;
    if (rig.fov !== undefined) {
      this.camera.fov = rig.fov;
      this.camera.updateProjectionMatrix();
    }
    this.apply(0);
  }

  /**
   * Smoothly move to a named rig. Resolves when the tween completes — or as
   * soon as a later `moveTo`/`snapTo` supersedes it, because the camera did
   * stop doing what this caller asked, which is all it was waiting to know.
   */
  moveTo(
    name: string,
    ms = 900,
    easing: EasingName | EasingFn = 'cubicInOut',
  ): Promise<void> {
    const rig = this.rigs.get(name);
    if (!rig) return Promise.resolve();
    this.currentRig = name;
    this.settleMove();
    this.tweens.killAll();
    this.tweenFromPos.copy(this.curPos);
    this.tweenFromLook.copy(this.curLook);
    this.targetPos.copy(rig.position);
    this.targetLook.copy(rig.lookAt);
    this.tweening = true;

    const fromFov = this.camera.fov;
    const toFov = rig.fov ?? fromFov;
    const fromSway = this.swayScale;

    const ran = this.tweens.toAsync(0, 1, {
      durationMs: ms,
      easing,
      onUpdate: (t) => {
        this.curPos.lerpVectors(this.tweenFromPos, this.targetPos, t);
        this.curLook.lerpVectors(this.tweenFromLook, this.targetLook, t);
        this.swayScale = fromSway + (rig.sway - fromSway) * t;
        if (toFov !== fromFov) {
          this.camera.fov = fromFov + (toFov - fromFov) * t;
          this.camera.updateProjectionMatrix();
        }
      },
      onComplete: () => {
        this.tweening = false;
        this.moveResolve = null;
      },
    });

    return new Promise<void>((resolve) => {
      this.moveResolve = resolve;
      void ran.then(resolve);
    });
  }

  /** Nudge the resting target without changing rig (recoil, focus pulls). */
  offsetTarget(dx: number, dy: number, dz: number): void {
    this.targetPos.add(this.scratch.set(dx, dy, dz));
  }

  /**
   * Impact shake. `amplitude` is in world units (0.05–0.2 reads well at the
   * battle distance) and damps linearly over `ms`.
   */
  shake(amplitude = 0.1, ms = 260): void {
    // Re-triggering during a shake takes the stronger of the two.
    if (this.shakeLeftMs > 0 && amplitude < this.shakeAmp) return;
    this.shakeAmp = amplitude;
    this.shakeLeftMs = ms;
    this.shakeTotalMs = Math.max(1, ms);
    this.shakePhase = Math.random() * Math.PI * 2;
  }

  /**
   * Punch in toward the look-at point by `fraction` of the current distance and
   * ease back out. FOV is never animated; this is a dolly.
   */
  punch(fraction = 0.12, ms = 420): Promise<void> {
    const inMs = Math.max(1, ms * 0.28);
    this.fx.to(this.punchAmount, fraction, {
      durationMs: inMs,
      easing: 'cubicOut',
      onUpdate: (v) => {
        this.punchAmount = v;
      },
    });
    return this.fx.toAsync(fraction, 0, {
      durationMs: ms - inMs,
      delayMs: inMs,
      easing: 'quadInOut',
      onUpdate: (v) => {
        this.punchAmount = v;
      },
    });
  }

  /**
   * Push in by `fraction` of the camera-to-subject distance and **hold** there
   * until {@link release}. This is the slow zoom a boss telegraph and an
   * Overdrive ride on, where `punch` — which eases straight back out — would
   * bounce the frame in the middle of the wind-up.
   */
  push(fraction = 0.1, ms = 900): Promise<void> {
    return this.fx.toAsync(this.punchAmount, fraction, {
      durationMs: Math.max(1, ms),
      easing: 'quadInOut',
      onUpdate: (v) => {
        this.punchAmount = v;
      },
    });
  }

  /** Ease a held {@link push} (and any roll) back to neutral. */
  release(ms = 420): Promise<void> {
    if (ms <= 1) { this.fx.killAll(); this.punchAmount = 0; this.rollRad = 0; return Promise.resolve(); } // a cut kills a push still easing in (PR-0061)
    if (this.rollRad !== 0) void this.rollTo(0, ms);
    if (this.punchAmount === 0) return Promise.resolve();
    return this.fx.toAsync(this.punchAmount, 0, {
      durationMs: Math.max(1, ms),
      easing: 'quadInOut',
      onUpdate: (v) => {
        this.punchAmount = v;
      },
    });
  }

  /** How far in the held dolly currently is, as a fraction. Read by tests. */
  get pushAmount(): number {
    return this.punchAmount;
  }

  /** Current dutch roll, in degrees. */
  get rollDeg(): number {
    return (this.rollRad * 180) / Math.PI;
  }

  /** Snap the dutch roll with no tween. */
  setRoll(deg: number): void {
    this.rollRad = (deg * Math.PI) / 180;
  }

  /** Tween the dutch roll to `deg` and hold it there. */
  rollTo(deg: number, ms = 240): Promise<void> {
    return this.fx.toAsync(this.rollDeg, deg, {
      durationMs: Math.max(1, ms),
      easing: 'quadOut',
      onUpdate: (v) => this.setRoll(v),
    });
  }

  /**
   * Kick the frame over to `deg` and let it fall back to level — the attack
   * roll. Resolves when it is level again.
   *
   * Both halves are scheduled up front (the fall-back rides a `delayMs`, the
   * way {@link punch} does) rather than chained on an `await`. Chaining them
   * would leave the frame tilted for a whole extra tick between the two, and
   * would strand the camera mid-tilt if the caller stopped pumping frames.
   */
  roll(deg = -4, ms = 420): Promise<void> {
    const inMs = Math.max(1, ms * 0.3);
    this.fx.to(this.rollDeg, deg, {
      durationMs: inMs,
      easing: 'quadOut',
      onUpdate: (v) => this.setRoll(v),
    });
    return this.fx.toAsync(deg, 0, {
      durationMs: Math.max(1, ms - inMs),
      delayMs: inMs,
      easing: 'quadInOut',
      onUpdate: (v) => this.setRoll(v),
    });
  }

  /** @param dt seconds */
  update(dt: number): void {
    this.tweens.update(dt);
    this.fx.update(dt);
    if (this.shakeLeftMs > 0) this.shakeLeftMs -= dt * 1000;
    if (!this.tweening) {
      // Ease toward the rig target; lets offsetTarget() settle naturally.
      this.curPos.set(
        damp(this.curPos.x, this.targetPos.x, 4.5, dt),
        damp(this.curPos.y, this.targetPos.y, 4.5, dt),
        damp(this.curPos.z, this.targetPos.z, 4.5, dt),
      );
      this.curLook.set(
        damp(this.curLook.x, this.targetLook.x, 4.5, dt),
        damp(this.curLook.y, this.targetLook.y, 4.5, dt),
        damp(this.curLook.z, this.targetLook.z, 4.5, dt),
      );
    }
    this.swayClock += dt;
    this.apply(this.swayClock);
  }

  private apply(clock: number): void {
    const a = this.swayAmplitude * this.swayScale;
    const s = this.swaySpeed;
    let ox = Math.sin(clock * s) * a + Math.sin(clock * s * 0.37 + 1.1) * a * 0.4;
    let oy = Math.sin(clock * s * 0.73 + 2.2) * a * 0.55;
    const oz = Math.sin(clock * s * 0.51 + 0.4) * a * 0.3;

    // Dolly punch: slide the camera along its own view vector.
    this.scratch.subVectors(this.curLook, this.curPos);
    const px = this.scratch.x * this.punchAmount;
    const py = this.scratch.y * this.punchAmount;
    const pz = this.scratch.z * this.punchAmount;

    if (this.shakeLeftMs > 0) {
      const k = Math.max(0, this.shakeLeftMs / this.shakeTotalMs);
      const damp2 = k * k;
      this.shakePhase += 0.9;
      ox += Math.sin(this.shakePhase * 2.7) * this.shakeAmp * damp2;
      oy += Math.sin(this.shakePhase * 3.9 + 1.7) * this.shakeAmp * damp2 * 0.8;
    }

    this.camera.position.set(
      this.curPos.x + ox + px,
      this.curPos.y + oy + py,
      this.curPos.z + oz + pz,
    );
    this.camera.lookAt(
      this.curLook.x + ox * 0.18,
      this.curLook.y + oy * 0.18,
      this.curLook.z,
    );
    // Roll last: `lookAt` rebuilds the whole orientation from the up vector, so
    // anything applied before it is thrown away.
    if (this.rollRad !== 0) this.camera.rotateZ(this.rollRad);
  }
}
