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
import { RigAnimator, type AnimEvent, type AnimFrame } from './RigAnimator.ts';
import type { IdleTerm } from './AnimIdle.ts';
import type { Subject } from './AnimLibrary.ts';
import { LULU } from './LuluAnim.ts';
import { animFromQuery, type AnimStyle } from './AnimStyles.ts';
import { VialProp } from './AnimProp.ts';
import { AnimFx } from './AnimFx.ts';
import { CastFx } from './AnimCastFx.ts';
import type { BendSpec } from './AnimBend.ts';

/** The name of the pseudo-bone whose `rot` is the knee's bend (pass 3): one more than the rig's last bone. */
export const BEND_BONE = '@bend';

/** What the layer needs of the actor: where it stands, the scene it is in, a landmark of the posed rig (local world units). */
export interface AnimHost {
  readonly position: { x: number; y: number; z: number };
  readonly parent: Object3D | null;
  landmark(name: string): { x: number; y: number } | null;
  /** Pass 3: where a world point is in the figure's painting (px), as the camera shows it (`RigPaint.ts`); null before it is drawn. */
  paintOf?(p: { x: number; y: number; z: number }): { x: number; y: number } | null;
  /** The rig's plane, whose scale is the figure's size in world units. */
  flash(colour?: number | string, ms?: number, peak?: number): void;
  readonly figure: { plane: { scale: { y: number } }; setSmear(names: readonly string[], dx: number, dy: number, on: boolean): boolean; setBend(spec: BendSpec | null): void };
}

/** The prototype is a dev tool: a production bundle replaces `import.meta.env.DEV` with false and never reads the query. */
export const pageAnimStyle = (): AnimStyle | null => (import.meta.env.DEV ? animFromQuery(globalThis.location?.search ?? '') : null);

const NEEDED = ['idle', 'ready', 'attack', 'follow', 'cast', 'item', 'hurt', 'ko', 'victory'];

/** Subjects the prototype has authored data for; any other rig with the keys gets the procedural clips and no idle or secondary motion of its own. */
const SUBJECTS: Readonly<Record<string, Subject>> = { lulu: LULU };

/**
 * A rig the prototype has no authored data for: the procedural clips, and the rig's OWN idle and lag chains carried over (its `motion.idle` sines become the breath, each `motion.chains` entry a Verlet
 * chain with the style's stiffness, drag and trail and the file's own `hang` and `limit`), so a rig with the nine keys is animated with no authoring at all.
 */
function genericOf(data: RigData): Subject {
  const m = data.motion;
  const breath: Record<string, IdleTerm> = {};
  for (const [bone, a] of Object.entries(m?.idle?.bones ?? {})) breath[bone] = { ...(a.rot !== undefined ? { rot: a.rot } : {}), ...(a.dx !== undefined ? { dx: a.dx } : {}), ...(a.dy !== undefined ? { dy: a.dy } : {}), ...(a.phase !== undefined ? { phase: a.phase } : {}) };
  return {
    accents: {},
    idle: { breath, shift: {} },
    secondary: (st) => ({ rots: [], points: [], chains: (m?.chains ?? []).map((c) => ({ bones: c.bones, hang: c.hang ?? 0.15, stiffness: st.braid.stiffness, drag: st.braid.drag, trail: st.braid.trail, limit: c.limit ?? 70 })) }),
    hand: 'fist',
  };
}

export class RigAnimLayer {
  readonly anim: RigAnimator;
  private readonly host: AnimHost;
  private prop: VialProp | null = null;
  /** Pass 2 (`P2`): light instead of a vial (`AnimFx.ts`). */
  private fx: AnimFx | null = null;
  /** Pass 3 (`P3`): the cast's channel drawn so it reads (`AnimCastFx.ts`). */
  private castFx: CastFx | null = null;
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
    const channels = compiled.get('idle')!.length; // pass 3: one pseudo-bone longer than the rig's own
    const boneIndex = channels > data.bones.length * 5 ? new Map([...data.boneIndex, [BEND_BONE, data.bones.length]]) : data.boneIndex;
    this.anim = new RigAnimator({ boneIndex, roots: data.roots, keys: compiled, channels, bones: data.bones, skeleton: new RigSkeleton(data) }, style, subject, pxPerUnit);
    if (style.p3 && subject.bend) host.figure.setBend(subject.bend);
    this.vel = new Float64Array(channels);
    this.imageH = data.image.h;
    if (style.p2) this.fx = new AnimFx();
    if (style.p3) this.castFx = new CastFx();
  }

  /** The layer for this figure, or null: the prototype is off, or the rig lacks a key the clips need. */
  static create(host: AnimHost, data: RigData, compiled: ReadonlyMap<string, Float64Array>, style: AnimStyle | null, pxPerUnit = 1280): RigAnimLayer | null {
    if (!style || NEEDED.some((k) => !compiled.has(k))) return null;
    try {
      return new RigAnimLayer(host, data, compiled, style, SUBJECTS[data.name] ?? genericOf(data), pxPerUnit);
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
    if (key === 'idle' || key === 'ko') {
      this.fx?.rest();
      this.castFx?.rest();
    }
    return this.anim.request(key, fromKey, trans.current, trans.velocity);
  }

  /** The presenter's action start: `targets` are the world points the action is aimed at (a thrown vial flies to the first). */
  begin(pose: string, targets: ReadonlyArray<{ x: number; y: number; z: number }>, trans: RigTransition): void {
    this.targets = targets;
    const h = this.host.position;
    const self = pose === 'item' && targets.length > 0 && targets.every((t) => Math.abs(t.x - h.x) < 0.6 && Math.abs(t.z - h.z) < 0.6); // an item on the user: a glow around her, no orb
    this.anim.begin(pose, trans.current, trans.velocity, self);
  }

  /** One frame: the clip's pose into `work` (and into `trans`, so a request that is not a clip moves on from here), the living layer, the secondary motion; solves `sk` twice. */
  compose(work: Float64Array, trans: RigTransition, sk: RigSkeleton, f: AnimFrame): void {
    this.rate = f.rate;
    if (this.anim.throwsDoll) this.anim.setAim(this.targets[0] && this.host.paintOf ? this.host.paintOf(this.targets[0]) : null); // pass 3: the doll is thrown where the target is on screen now
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
    const events = this.anim.drain();
    if (this.fx) {
      this.fxStep(dt, events);
      return;
    }
    for (const e of events) {
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

  /**
   * Pass 2's light (`AnimFx.ts`): a cast's glow at the doll that grows through the hold and flashes out on the release; an item's orb that rises from the hand and is tossed to the ally (or glow particles
   * around the user); driven by the clip's own glow level (`RigAnimator.charge`) and its marks.
   */
  private fxStep(dt: number, events: readonly AnimEvent[]): void {
    const fx = this.fx!;
    const p2 = this.anim.style.p2!;
    const kind = this.anim.playing;
    const self = this.anim.usedOnSelf;
    const pos = this.host.position;
    const h = this.host.figure.plane.scale.y;
    fx.setUnit(h / 1.8);
    const fist = this.host.landmark(kind === 'cast' ? (this.host.landmark('doll') ? 'doll' : this.anim.handLandmark) : this.anim.handLandmark); // a spell gathers at the doll (it rides her fist), an item at the hand
    const hand = fist ? { x: pos.x + fist.x, y: pos.y + fist.y, z: pos.z + 0.1 } : null;
    for (const e of events) {
      if (e !== 'release') continue;
      if (kind === 'cast' && hand) {
        fx.flashOut(hand, 'cast');
        this.host.flash(0xe8f6ff, 260, this.anim.style.glow); // the figure's own pulse; the spell effect lands on the presenter's cue
      } else if (kind === 'item') fx.toss(this.targets[0] ?? this.forward(), p2.orbFlight / Math.max(0.05, this.rate));
      else if (kind === 'itemSelf') fx.aura({ x: pos.x, y: pos.y, z: pos.z }, h);
    }
    const level = this.anim.charge;
    const isItem = kind === 'item' || kind === 'itemSelf';
    const cf = this.castFx;
    if (hand && (kind === 'cast' || isItem) && level > 0.02) fx.gather(hand, level * (self ? 0.45 : 1), isItem && !self ? 0.05 + 0.09 * Math.min(1, Math.max(0, (level - 0.1) / 0.9)) : 0, isItem ? 'item' : 'cast', cf && kind === 'cast' ? 1.3 : 1); // P3: the cast's own glow is a third bigger (1.55 hid the doll in the white)
    else fx.rest();
    if (cf) {
      if (hand && kind === 'cast' && level > 0.02) cf.gather(hand, level, pos, h, h / 1.8);
      else cf.rest();
      cf.update(dt, this.host.parent);
    }
    fx.update(dt, this.host.parent);
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
    this.fx?.dispose();
    this.fx = null;
    this.castFx?.dispose();
    this.castFx = null;
  }
}
