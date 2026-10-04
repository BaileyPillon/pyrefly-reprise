import { Vector3, type PerspectiveCamera } from 'three';
import type { Pose } from './geometry.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's handle on the battle camera (`BattleCamera`), ported from option
 * C's prototype (`fx/max/c/rigWatch.ts`) with its refinement fixes. It adds no move and no cut: it
 * re-registers the resting rig as the chapter's master (so the calm preset's own moves, blends and
 * REDUCE MOTION cuts land on it; a move onto it already in flight is retargeted, where the prototype
 * snapped the camera across), writes a held shot after the rig has placed the camera, and gives the
 * rig its own camera back at the start of the next frame. Every rig it changes is recorded and put back
 * on dispose.
 *
 * Unlike the prototype it never hands the HUD's resting projector (`restCamera`) a held shot: the HUD
 * stays laid out on the master while a held shot is up, so the enemy-intent card stays pinned where it
 * sits at rest (D-291; the judges' spherechange finding, where the Bahamut card jumped onto the coach
 * card). The prototype's two fixes are kept: until the first install the scene's live rigs are today's
 * (a scene registers its own master after the bind: D-228 Vegnagun keeps its rig and its 40-degree field
 * of view), and the field of view is restored only with the position, when nothing re-placed the camera.
 */

type V3 = [number, number, number] | Vector3;
interface RigShape {
  position: V3;
  lookAt: V3;
  fov?: number;
  sway?: number;
}

export interface BattleCameraLike {
  readonly camera: PerspectiveCamera;
  readonly rigName: string;
  readonly rigNames: string[];
  readonly pushAmount: number;
  getRig(name: string): RigShape | undefined;
  addRig(name: string, rig: RigShape): void;
  moveTo(name: string, ms?: number, easing?: unknown): Promise<void>;
  snapTo(name: string): void;
}

const v = (x: V3): Vector3 => (x instanceof Vector3 ? x.clone() : new Vector3(x[0], x[1], x[2]));
/** Today's close rigs, re-authored from the master's place (today's push kept). */
const CLOSE = ['party', 'enemy', 'action'];

export class RigWatch {
  private readonly orig = new Map<string, RigShape>();
  private wroteIdle: Vector3 | null = null;
  private installedOnce = false;
  /** When the last install changed the resting rig (-1: never). */
  private installedAt = -1;
  /** A move or cut since the last install has completed: the camera is on the new rigs. */
  private arrived = true;
  private last = { name: '', t0: 0, ms: 0, ease: '' };
  private everRested = false;
  private readonly t0 = performance.now();
  private saved: { pos: Vector3; quat: [number, number, number, number]; fov: number } | null = null;
  private wrote: Vector3 | null = null;
  private readonly moveTo0: BattleCameraLike['moveTo'];
  private readonly snapTo0: BattleCameraLike['snapTo'];
  readonly n = { moves: 0, snaps: 0, writes: 0 };

  constructor(private readonly bc: BattleCameraLike, private readonly cam: PerspectiveCamera) {
    for (const name of bc.rigNames) {
      const r = bc.getRig(name);
      if (r) this.orig.set(name, r);
    }
    const self = this;
    const o = bc as unknown as Record<string, unknown>;
    this.moveTo0 = bc.moveTo;
    this.snapTo0 = bc.snapTo;
    o['moveTo'] = function (name: string, ms = 900, easing?: unknown): Promise<void> {
      self.last = { name: name.split('~')[0]!, t0: performance.now(), ms, ease: typeof easing === 'string' ? easing : '' };
      self.n.moves++;
      return self.moveTo0.call(bc, name, ms, easing);
    };
    o['snapTo'] = function (name: string): void {
      self.last = { name: name.split('~')[0]!, t0: performance.now(), ms: 0, ease: '' };
      self.n.snaps++;
      self.snapTo0.call(bc, name);
    };
  }

  /** Today's rig (as the scene registered it), as a pose. */
  base(name: string): Pose | null {
    const r = (this.installedOnce ? this.orig.get(name) : undefined) ?? this.bc.getRig(name) ?? this.orig.get(name);
    if (!r) return null;
    return { pos: v(r.position), look: v(r.lookAt), fov: r.fov ?? this.cam.fov };
  }

  /** The scene re-registered its resting rig since the install (Evrae's range, the phone refit): adopt it. */
  baseChanged(): boolean {
    if (!this.wroteIdle) return false;
    const r = this.bc.getRig('idle');
    if (!r || v(r.position).distanceTo(this.wroteIdle) < 1e-4) return false;
    const prev = this.orig.get('idle');
    this.orig.set('idle', { ...r, ...(prev?.fov !== undefined ? { fov: prev.fov } : {}) });
    for (const name of this.bc.rigNames) if (!this.orig.has(name)) this.orig.set(name, this.bc.getRig(name)!);
    return true;
  }

  /** Hold a change made outside the rigs (the lens shift) until the camera's next move or cut. */
  holdUntilMove(): void {
    this.installedAt = performance.now();
    this.arrived = false;
  }

  /** Counts every move and cut through the camera (a new one restarts the lens's travel from where it is). */
  get moveSeq(): number {
    return this.n.moves + this.n.snaps;
  }

  /** Register the master as the resting rig and re-author the close rigs from it; `on` false puts today's back. */
  install(m: Pose, on: boolean): void {
    if (!this.installedOnce) {
      for (const name of this.bc.rigNames) {
        const r = this.bc.getRig(name);
        if (r) this.orig.set(name, r);
      }
      this.installedOnce = true;
    }
    for (const name of this.bc.rigNames) if (!this.orig.has(name)) this.orig.set(name, this.bc.getRig(name)!);
    const was = this.bc.getRig('idle');
    const base = this.base('idle');
    for (const [name, r] of this.orig) {
      if (on && name === 'idle') {
        this.bc.addRig('idle', { position: m.pos.clone(), lookAt: m.look.clone(), fov: m.fov, ...(r.sway !== undefined ? { sway: r.sway } : {}) });
      } else if (on && base && CLOSE.includes(name)) {
        const fov = r.fov ?? this.cam.fov;
        this.bc.addRig(name, { position: m.pos.clone().add(v(r.position).sub(base.pos)), lookAt: v(r.lookAt), fov: fov + (m.fov - base.fov), ...(r.sway !== undefined ? { sway: r.sway } : {}) });
      } else {
        this.bc.addRig(name, r);
      }
    }
    this.wroteIdle = on ? m.pos.clone() : null;
    const now = this.bc.getRig('idle');
    if (!was || !now || (v(was.position).distanceTo(v(now.position)) < 1e-4 && v(was.lookAt).distanceTo(v(now.lookAt)) < 1e-4 && (was.fov ?? 0) === (now.fov ?? 0))) return;
    this.installedAt = performance.now();
    this.arrived = false;
    // The mix adds no cut and no move of its own. A move onto the resting rig still in flight (the battle-start
    // move) is the same move retargeted, for the time it had left; at rest the camera stays until the
    // presenter's next move or cut onto the resting rig, which lands on the new master (the lens shift travels
    // with it: `sinceInstall`).
    const busy = ((this.bc as unknown as { tweens?: { size?: number } }).tweens?.size ?? 0) > 0;
    if (busy && this.bc.rigName.split('~')[0] === 'idle') {
      const left = this.last.name === 'idle' ? this.last.t0 + this.last.ms - performance.now() : 500;
      void this.bc.moveTo('idle', Math.max(120, left), 'cubicOut');
    }
  }

  /**
   * How far the camera has gone onto the rigs of the last install: 0 before any move or cut since, then along
   * the move in flight (eased as it is), and 1 for good once one has completed.
   */
  sinceInstall(): number {
    if (this.arrived || this.installedAt < 0) return 1;
    if (this.last.t0 < this.installedAt) return 0;
    const p = this.last.ms <= 0 ? 1 : Math.min(1, Math.max(0, (performance.now() - this.last.t0) / this.last.ms));
    if (p >= 1) {
      this.arrived = true;
      return 1;
    }
    if (this.last.ease === 'cubicOut') return 1 - Math.pow(1 - p, 3);
    if (this.last.ease === 'sineInOut') return -(Math.cos(Math.PI * p) - 1) / 2;
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // cubicInOut, BattleCamera's default
  }

  /** Has the battle-start move landed on the master yet (or has it been long enough)? */
  introDone(): boolean {
    if (this.everRested) return true;
    if (this.restingOn('idle') || performance.now() - this.t0 > 12000) this.everRested = true;
    return this.everRested;
  }

  restingOn(name: string): boolean {
    return this.last.name === name && performance.now() >= this.last.t0 + this.last.ms + 60;
  }

  /** The camera stands on the resting rig with no move in flight (the frame is the master's, not an action's). */
  atRest(): boolean {
    const busy = (this.bc as unknown as { tweens?: { size?: number } }).tweens?.size ?? 0;
    return busy === 0 && this.bc.rigName.split('~')[0] === 'idle';
  }

  /** Start of the mix's frame: if nothing re-placed the camera since the held shot was written, give the rig its own back. */
  restore(): void {
    const c = this.cam;
    if (this.saved && this.wrote && c.position.distanceToSquared(this.wrote) < 1e-10) {
      c.position.copy(this.saved.pos);
      c.quaternion.set(...this.saved.quat);
      if (c.fov !== this.saved.fov) {
        c.fov = this.saved.fov;
        c.updateProjectionMatrix();
      }
      c.updateMatrixWorld();
    }
    this.saved = null;
    this.wrote = null;
  }

  /** After the rig placed the camera: hold a shot (no roll: `lookAt` with the world up). */
  write(p: Pose): void {
    const c = this.cam;
    this.saved = { pos: c.position.clone(), quat: [c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w], fov: c.fov };
    c.position.copy(p.pos);
    c.up.set(0, 1, 0);
    c.lookAt(p.look);
    if (c.fov !== p.fov) {
      c.fov = p.fov;
      c.updateProjectionMatrix();
    }
    c.updateMatrixWorld();
    this.wrote = c.position.clone();
    this.n.writes++;
  }

  stats(): Record<string, unknown> {
    return { rig: this.bc.rigName, last: this.last.name, resting: this.restingOn('idle'), onMaster: this.arrived, ...this.n };
  }

  dispose(): void {
    const o = this.bc as unknown as Record<string, unknown>;
    delete o['moveTo'];
    delete o['snapTo'];
    this.restore();
    if (this.installedOnce) for (const [name, r] of this.orig) this.bc.addRig(name, r);
    if (this.installedOnce && this.bc.rigName.split('~')[0] === 'idle') this.bc.snapTo('idle');
  }
}
