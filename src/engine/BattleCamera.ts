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

  /** Jump straight to a rig with no interpolation. */
  snapTo(name: string): void {
    const rig = this.rigs.get(name);
    if (!rig) return;
    this.currentRig = name;
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

  /** Smoothly move to a named rig. Resolves when the tween completes. */
  moveTo(
    name: string,
    ms = 900,
    easing: EasingName | EasingFn = 'cubicInOut',
  ): Promise<void> {
    const rig = this.rigs.get(name);
    if (!rig) return Promise.resolve();
    this.currentRig = name;
    this.tweens.killAll();
    this.tweenFromPos.copy(this.curPos);
    this.tweenFromLook.copy(this.curLook);
    this.targetPos.copy(rig.position);
    this.targetLook.copy(rig.lookAt);
    this.tweening = true;

    const fromFov = this.camera.fov;
    const toFov = rig.fov ?? fromFov;
    const fromSway = this.swayScale;

    return this.tweens.toAsync(0, 1, {
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
      },
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
    this.tweens.to(this.punchAmount, fraction, {
      durationMs: inMs,
      easing: 'cubicOut',
      onUpdate: (v) => {
        this.punchAmount = v;
      },
    });
    return this.tweens.toAsync(fraction, 0, {
      durationMs: ms - inMs,
      delayMs: inMs,
      easing: 'quadInOut',
      onUpdate: (v) => {
        this.punchAmount = v;
      },
    });
  }

  /** @param dt seconds */
  update(dt: number): void {
    this.tweens.update(dt);
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
  }
}
