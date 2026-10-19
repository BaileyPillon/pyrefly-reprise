/**
 * What `RigActor` holds when the animation prototype is on (`?anim=proto&style=A|B|C`, dev builds only; both games, presentation only): the animator (`RigAnimator.ts`), the vial prop
 * (`AnimProp.ts`) and the glue between them and the actor. The actor asks it the same few questions it would ask `RigTransition` and `applyIdle`; with no layer it does what it always did.
 *
 * The layer is built only when the flag is on, the figure's rig has the keys the clips are made of (`idle ready attack follow cast item hurt ko victory`), and the figure is a rig the
 * prototype has data for or the generic (procedural) set is enough: a rig without all the keys is left alone (`create` answers null).
 */
import { Vector3, type Object3D } from 'three';
import { ATTACK_IMPACT } from '../../BattlePresenterActors.ts';
import type { RigData } from '../RigData.ts';
import type { RigTransition } from '../RigKeys.ts';
import { RigSkeleton } from '../RigSkeleton.ts';
import { RigAnimator, type AnimFrame } from './RigAnimator.ts';
import type { Subject } from './AnimLibrary.ts';
import { LULU } from './LuluAnim.ts';
import { animFromQuery, type AnimStyle } from './AnimStyles.ts';
import { VialProp } from './AnimProp.ts';

/** What the layer needs of the actor: where it stands, the scene it is in, a landmark of the posed rig (local world units). */
export interface AnimHost {
  readonly position: { x: number; y: number; z: number };
  readonly parent: Object3D | null;
  landmark(name: string): { x: number; y: number } | null;
  /** The rig's plane, whose scale is the figure's size in world units. */
  flash(colour?: number | string, ms?: number, peak?: number): void;
  readonly figure: { plane: { scale: { y: number } }; setSmear(names: readonly string[], dx: number, dy: number, on: boolean): boolean };
}

/** The prototype is a dev tool: a production bundle replaces `import.meta.env.DEV` with false and never reads the query. */
export const pageAnimStyle = (): AnimStyle | null => (import.meta.env.DEV ? animFromQuery(globalThis.location?.search ?? '') : null);

const NEEDED = ['idle', 'ready', 'attack', 'follow', 'cast', 'item', 'hurt', 'ko', 'victory'];

/** Subjects the prototype has authored data for; any other rig with the keys gets the procedural clips and no idle or secondary motion of its own. */
const SUBJECTS: Readonly<Record<string, Subject>> = { lulu: LULU };
const GENERIC: Subject = { accents: {}, idle: { breath: {}, shift: {} }, secondary: () => ({ rots: [], points: [] }), hand: 'fist' };

export class RigAnimLayer {
  readonly anim: RigAnimator;
  private readonly host: AnimHost;
  private prop: VialProp | null = null;
  private targets: ReadonlyArray<{ x: number; y: number; z: number }> = [];
  private readonly vel: Float64Array;
  private rate = 1;
  private readonly tmp = new Vector3();
  private readonly imageH: number;
  private scaled = false;
  private smearOn = false;
  private lastSmear: NonNullable<RigAnimator['smearing']> | null = null;

  private constructor(host: AnimHost, data: RigData, compiled: ReadonlyMap<string, Float64Array>, style: AnimStyle, subject: Subject, pxPerUnit: number) {
    this.host = host;
    const channels = data.bones.length * 5;
    this.anim = new RigAnimator({ boneIndex: data.boneIndex, roots: data.roots, keys: compiled, channels, bones: data.bones, skeleton: new RigSkeleton(data) }, style, subject, pxPerUnit);
    this.vel = new Float64Array(channels);
    this.imageH = data.image.h;
  }

  /** The layer for this figure, or null: the prototype is off, or the rig lacks a key the clips need. */
  static create(host: AnimHost, data: RigData, compiled: ReadonlyMap<string, Float64Array>, style: AnimStyle | null, pxPerUnit = 1280): RigAnimLayer | null {
    if (!style || NEEDED.some((k) => !compiled.has(k))) return null;
    try {
      return new RigAnimLayer(host, data, compiled, style, SUBJECTS[data.name] ?? GENERIC, pxPerUnit);
    } catch (e) {
      console.warn(`[anim] ${data.name}: the prototype's clips do not fit this rig (${e instanceof Error ? e.message : String(e)}); it plays as it always did`);
      return null;
    }
  }

  get style(): AnimStyle {
    return this.anim.style;
  }

  /** A pose request that resolved to `key` (the one the actor was showing is `fromKey`). True when a clip plays it. */
  request(key: string, fromKey: string, trans: RigTransition): boolean {
    if (key !== 'item' && this.prop?.held) this.prop.drop();
    return this.anim.request(key, fromKey, trans.current, trans.velocity);
  }

  /** The presenter's action start: `targets` are the world points the action is aimed at (a thrown vial flies to the first). */
  begin(pose: string, targets: ReadonlyArray<{ x: number; y: number; z: number }>, trans: RigTransition): void {
    this.targets = targets;
    this.anim.begin(pose, trans.current, trans.velocity);
  }

  /** One frame: the clip's pose into `work` (and into `trans`, so a request that is not a clip moves on from here), the living layer, the secondary motion; solves `sk` twice. */
  compose(work: Float64Array, trans: RigTransition, sk: RigSkeleton, f: AnimFrame): void {
    this.rate = f.rate;
    if (this.anim.step(f, work, this.vel)) trans.drive(work, this.vel);
    this.anim.idle(work, f);
    sk.solve(work);
    this.anim.secondaryStep(work, f, sk.m);
    sk.solve(work);
  }

  /** After the actor has synced its parts to the plane: the vial (events of the clip, the hand's place). */
  afterSync(dt: number): void {
    const h = this.host.figure.plane.scale.y;
    if (!this.scaled && h > 0) {
      this.scaled = true;
      this.anim.setScale(this.imageH / h);
    }
    const sm = this.anim.smearing;
    if ((sm !== null) !== this.smearOn) {
      this.smearOn = sm !== null;
      const spec = sm ?? this.lastSmear;
      if (spec) this.host.figure.setSmear(spec.parts, spec.dx, spec.dy, this.smearOn);
    }
    if (sm) this.lastSmear = sm;
    for (const e of this.anim.drain()) {
      if (e === 'reach') (this.prop ??= new VialProp()).hold();
      else if (e === 'release' && this.anim.playing === 'cast') this.host.flash(0xe8f6ff, 260, this.anim.style.glow); // the figure's own pulse as the thrust lets go; the spell effect lands on the presenter's cue
      else if (e === 'release' && this.prop?.held) this.prop.throwTo(this.targets[0] ?? this.forward(), (this.anim.style.item.flight / Math.max(0.05, this.rate)) | 0);
    }
    const p = this.prop;
    if (!p?.active) return;
    if (p.held) {
      const fist = this.host.landmark(this.anim.handLandmark);
      const wrist = this.host.landmark('wristPt');
      if (fist) {
        const dx = wrist ? fist.x - wrist.x : 0;
        const dy = wrist ? fist.y - wrist.y : 1;
        const n = Math.hypot(dx, dy) || 1;
        const h = this.host.position;
        p.place({ x: h.x + fist.x, y: h.y + fist.y, z: h.z + 0.1 }, { x: dx / n, y: dy / n });
      }
    }
    p.update(dt, this.host.parent);
  }

  /** A point a body-length in front of the figure at chest height, for a throw with no target. */
  private forward(): { x: number; y: number; z: number } {
    const h = this.host.position;
    return this.tmp.set(h.x + 1.2, h.y + 0.9, h.z);
  }

  /** The presenter's beats, passed through. */
  lead(pose: string): number {
    return this.anim.lead(pose);
  }

  lunge(ms: number): void {
    this.anim.lunge(ms, ATTACK_IMPACT);
  }

  dispose(): void {
    this.prop?.dispose();
    this.prop = null;
  }
}
