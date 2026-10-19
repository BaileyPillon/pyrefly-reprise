/**
 * The animator of a rigged figure (`?anim=proto&style=A|B|C`; both games, presentation only; no `three`, no DOM).
 *
 * `RigActor` asks it three things: should this pose request play as a CLIP (`request`), what is the pose and the living layer this frame (`step`, `layers`), and what happened on the way (marks the
 * props and the presenter care about: `drain`). It owns the clip in flight, the compiled library of the figure's style, the idle layer and the secondary layer (`AnimSecondary.ts`). It never
 * touches a battle timer: its clock is the actor's own dt, scaled by the pacing option's rate like the actor's one-shot moves, so a hit-stop (dt 0) freezes it with the rest of the picture.
 *
 * The presenter's beats and what each starts (see `docs/handoff/anim-proto.md`):
 *   `begin('attack')`  at the action's start: the wind-up (anticipation) clip; its length is the lead the presenter waits before the lunge.
 *   `lunge(ms)`        the strike clip is SCHEDULED so that its `contact` mark lands on the lunge's apex (`ATTACK_IMPACT` of the move), the frame the presenter asks for the `attack` pose.
 *   `request('attack')` when the strike is already running, nothing; otherwise the strike starts there.
 *   `begin('cast'|'item')` the clip plays from the request; the lead is the time to its release (a spell) or to the vial's landing (an item).
 *   `beat('contact')`  at each blow: a hit-stop on the attacker for the first and the last hit of a strike, an impulse in the springs, and the camera punch the style asks for.
 */
import { Carry, type CarrySkeleton } from './AnimCarry.ts';
import { applyIdleLayer, type IdleSpec } from './AnimIdle.ts';
import { compileClip, sampleClip, unwrapTargets, type ClipDef, type ClipLive, type ClipRig, type CompiledClip } from './AnimClip.ts';
import { buildLibrary, type Library, type Subject } from './AnimLibrary.ts';
import { halfLifeStep, SecondaryLayer, type LayerBone } from './AnimSecondary.ts';
import type { AnimStyle } from './AnimStyles.ts';

/** What the animator needs of a rig (`RigData` satisfies it). */
export interface AnimRigData extends ClipRig {
  readonly bones: readonly (LayerBone & { name: string })[];
  /** A skeleton of the animator's own (the actor's is mid-frame when a request comes): `RigSkeleton` fits. */
  readonly skeleton: CarrySkeleton;
}

/** What the actor tells the animator about the figure's motion in the world, each frame. */
export interface AnimFrame {
  dt: number;
  /** The pacing option's clock rate (1 / its factor): the animator runs on the pace the actor's own moves do. */
  rate: number;
  /** The figure's speed toward the way it faces, world units a second. */
  forward: number;
  /** True while the figure is down or REDUCE MOTION asks for stillness: the living layer fades out. */
  calm: boolean;
}

/** Events a frame can raise, in the order they happened. */
export type AnimEvent = 'reach' | 'drawn' | 'release' | 'contact' | 'impact' | 'ground' | 'burst' | 'smear';

const EVENT_MARKS: readonly string[] = ['reach', 'drawn', 'release', 'contact', 'impact', 'ground', 'burst', 'smear'];
/** A smear frame is shown for this long (ms of the animator's clock): two frames at 60 Hz. */
const SMEAR_MS = 34;
const HALFLIFE = 0.12;

export class RigAnimator {
  readonly style: AnimStyle;
  readonly lib: Library;
  private readonly rig: AnimRigData;
  private readonly clips = new Map<string, CompiledClip>();
  private readonly recovers = new Map<string, CompiledClip>();
  private readonly idleSpec: IdleSpec;
  private readonly secondary: SecondaryLayer;
  private readonly hand: string;
  private clip: CompiledClip | null = null;
  private targets: readonly Float64Array[] = [];
  private t = 0;
  private from: Float64Array;
  private v0: Float64Array;
  private readonly prev: Float64Array;
  private readonly scratch: Float64Array;
  /** The strike clip is due to start at this clip-time-independent animator time (base ms), or -1. */
  private strikeAt = -1;
  private clock = 0;
  private frozen = 0;
  private readonly live: ClipLive = { alive: 1, sec: 1, seg: 0, e: 1 };
  private readonly att: Carry | null;
  private readonly offsets = new Map<CompiledClip, Float64Array>();
  private readonly fromOff = new Float64Array(2);
  private readonly smooth = { alive: 1, va: 0, sec: 1, vs: 0 };
  private events: AnimEvent[] = [];
  private readonly fired = new Set<string>();
  private smearUntil = -1;
  private readonly smearSpec: Subject['smear'] | undefined;
  private kindName = '';

  constructor(rig: AnimRigData, style: AnimStyle, subject: Subject, pxPerUnit: number) {
    this.rig = rig;
    this.style = style;
    this.lib = buildLibrary(style, subject.accents);
    this.idleSpec = subject.idle;
    this.hand = subject.hand;
    this.smearSpec = subject.smear;
    this.att = subject.attach ? Carry.create(rig.bones, rig.boneIndex, subject.attach, rig.skeleton) : null;
    for (const c of [this.lib.ready, this.lib.windup, this.lib.strike, this.lib.follow, this.lib.cast, this.lib.item, this.lib.hurt, this.lib.ko, this.lib.victory]) this.clips.set(c.name, compileClip(rig, c));
    this.secondary = new SecondaryLayer(rig.bones, rig.boneIndex, subject.secondary(style), style.secondary, pxPerUnit);
    this.from = new Float64Array(rig.channels);
    this.v0 = new Float64Array(rig.channels);
    this.prev = new Float64Array(rig.channels);
    this.scratch = new Float64Array(rig.channels);
  }

  /** The part and direction of the smear frame the figure shows now, or null (the style has no smear, or the moment has passed). */
  get smearing(): NonNullable<Subject['smear']> | null {
    return this.smearSpec && this.clock < this.smearUntil ? this.smearSpec : null;
  }

  /** The landmark the held prop follows. */
  get handLandmark(): string {
    return this.hand;
  }

  /** The name of the clip in flight ('' when none). */
  get playing(): string {
    return this.clip && !this.done ? this.clip.name : '';
  }

  /** The rig key the figure is reported as: the clip's. */
  get key(): string {
    return this.clip?.key ?? '';
  }

  /** True while a clip drives the pose (it keeps driving, holding its last pose, until the next request: the actor leaves the move to `RigTransition` only for poses it does not animate). */
  get driving(): boolean {
    return this.clip !== null;
  }

  private get done(): boolean {
    return this.clip !== null && !this.clip.loop && this.t >= this.clip.total;
  }

  /** The compiled clip by name, for the tools and the tests. */
  compiled(name: string): CompiledClip | undefined {
    return this.clips.get(name);
  }

  private start(c: CompiledClip, cur: Float64Array, vel: Float64Array): void {
    this.from.set(cur);
    this.v0.set(vel);
    this.clip = c;
    this.targets = unwrapTargets(c, this.from);
    this.t = 0;
    this.fired.clear();
    this.kindName = c.name;
    this.att?.offsetOf(cur, this.fromOff, 0);
  }

  /**
   * A pose request that resolved to the key `key`; `fromKey` is the key the figure was showing; `cur` and `vel` are its pose and velocity. True when the animator plays it (the actor then
   * moves no key); false leaves the request to the ordinary move.
   */
  request(key: string, fromKey: string, cur: Float64Array, vel: Float64Array): boolean {
    switch (key) {
      case 'idle':
        return this.play(this.recoverOf(fromKey), cur, vel);
      case 'attack':
        if (this.clip === this.clips.get('strike')) return true; // the schedule already started it, to land on the apex
        this.strikeAt = -1;
        return this.play(this.clips.get('strike')!, cur, vel);
      case 'cast':
      case 'item':
        return this.kindName === key ? true : this.play(this.clips.get(key)!, cur, vel);
      case 'ready':
      case 'follow':
      case 'hurt':
      case 'ko':
      case 'victory':
        return this.play(this.clips.get(key)!, cur, vel);
      default:
        this.cancel();
        return false;
    }
  }

  /** Painting px per world unit, for the trail of a lunge (known once the plane has been drawn). */
  setScale(pxPerUnit: number): void {
    this.secondary.pxPerUnit = pxPerUnit;
  }

  /** Stop playing a clip (a snapped pose, a pose the clips do not play): the ordinary move has the figure. */
  cancel(): void {
    this.clip = null;
    this.kindName = '';
    this.strikeAt = -1;
    this.secondary.settle();
  }

  private offsetsOf(c: CompiledClip): Float64Array {
    let o = this.offsets.get(c);
    if (!o) this.offsets.set(c, (o = this.att!.offsetsOf(c.target)));
    return o;
  }

  private recoverOf(from: string): CompiledClip {
    let c = this.recovers.get(from);
    if (!c) this.recovers.set(from, (c = compileClip(this.rig, this.lib.recover(from))));
    return c;
  }

  private play(c: CompiledClip, cur: Float64Array, vel: Float64Array): true {
    this.start(c, cur, vel);
    return true;
  }

  /** The presenter's first beat of an action: a strike starts its wind-up (held until the strike), a spell or an item its clip if the request has not. */
  begin(pose: string, cur: Float64Array, vel: Float64Array): void {
    if (pose === 'attack' && this.kindName !== 'windup') this.start(this.clips.get('windup')!, cur, vel);
    else if ((pose === 'cast' || pose === 'item') && this.kindName !== pose) this.start(this.clips.get(pose)!, cur, vel);
  }

  /** How long, in base ms, the presenter should still wait before the beat the clip leads to: the lunge after a wind-up, the spell's release, the vial's landing (0 when the beat has passed, -1 when no clip is playing for `pose`). */
  lead(pose: string): number {
    const c = pose === 'attack' ? this.clips.get('windup')! : pose === 'cast' || pose === 'item' ? this.clips.get(pose)! : null;
    if (!c || this.clip !== c) return -1;
    const l = pose === 'attack' ? this.lib.leads.attack : this.lib.leads[pose as 'cast' | 'item'];
    const at = c.marks[l.mark];
    return at === undefined ? 0 : Math.max(0, at + l.offsetMs - this.t);
  }

  /**
   * The strike is scheduled so its contact lands on the apex of a lunge of `ms` (the tween's own time: the actor's tweens run on the same pace-scaled clock as this one, so `ms` is in this clock's
   * ms): `apex` (`ATTACK_IMPACT`, passed in so this file stays free of the presenter's modules) of the move from now, less the strike's own run-up to its contact.
   */
  lunge(ms: number, apex: number): void {
    const c = this.clips.get('strike')!;
    this.strikeAt = this.clock + Math.max(0, ms * apex - (c.marks['contact'] ?? 0));
  }

  /** A blow landed (the presenter's damage handler). Returns the camera punch to give, a fraction of the subject distance (0 none). */
  beat(kind: string, hitIndex: number, hitCount: number): { punch: number } {
    const S = this.style;
    if (kind !== 'contact') return { punch: 0 };
    const striking = this.kindName === 'strike' || this.kindName === 'windup';
    const first = hitIndex === 0;
    if (striking && (first || hitIndex === hitCount - 1) && S.attack.hitStop > 0) this.frozen = Math.max(this.frozen, S.attack.hitStop);
    this.secondary.impulse(striking ? 4 : 2.5, striking ? 260 : 140);
    if (!first) return { punch: 0 };
    return { punch: striking ? S.camera.contact : this.kindName === 'cast' ? S.camera.release : 0 };
  }

  get punchMs(): number {
    return this.style.camera.ms;
  }

  /** The events raised since the last call, oldest first. */
  drain(): AnimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  /** The figure was placed or snapped (a stage entrance, an immediate pose): nothing swings to it. */
  settle(): void {
    this.secondary.settle();
  }

  /**
   * Advance the clip by the actor's frame and write the pose it asks for into `out` (a channel array; untouched when no clip drives). `vel` receives the pose's speed (channel units a second).
   * Returns true when a clip drove `out`.
   */
  step(f: AnimFrame, out: Float64Array, vel: Float64Array): boolean {
    let dtMs = f.dt * 1000 * f.rate;
    if (this.frozen > 0 && f.dt > 0) {
      this.frozen = Math.max(0, this.frozen - f.dt * 1000);
      dtMs = 0;
    }
    this.clock += dtMs;
    if (this.strikeAt >= 0 && this.clock >= this.strikeAt) {
      this.strikeAt = -1;
      this.start(this.clips.get('strike')!, out, vel);
    }
    if (!this.clip) return false;
    this.t += dtMs;
    this.prev.set(this.scratch);
    sampleClip(this.clip, this.t, this.from, this.scratch, this.v0, this.targets, this.live);
    if (this.att) this.att.place(this.scratch, this.offsetsOf(this.clip), this.fromOff, this.live.seg, this.live.e); // the doll rides the hand
    this.fire(this.t);
    for (let i = 0; i < out.length; i++) {
      out[i] = this.scratch[i]!;
      if (f.dt > 0) vel[i] = (this.scratch[i]! - this.prev[i]!) / f.dt;
    }
    return true;
  }

  private fire(t: number): void {
    const c = this.clip!;
    for (const m of EVENT_MARKS) {
      const at = c.marks[m];
      if (at !== undefined && t >= at - 1e-9 && !this.fired.has(m)) {
        this.fired.add(m);
        this.events.push(m as AnimEvent);
        if (m === 'smear') this.smearUntil = this.clock + SMEAR_MS;
      }
    }
  }

  /** Lay the living layer on `work`: the breath and the weight shift, weighted by the clip's `alive`. Call before solving. */
  idle(work: Float64Array, f: AnimFrame): void {
    const goal = f.calm ? 0 : this.clip ? this.live.alive : 1;
    if (f.dt > 0) {
      const [x, v] = halfLifeStep(this.smooth.alive, this.smooth.va, goal, HALFLIFE, f.dt);
      this.smooth.alive = x;
      this.smooth.va = v;
    }
    const S = this.style;
    applyIdleLayer(work, this.rig.boneIndex, this.idleSpec, { breathHz: S.idle.breathHz, shiftHz: S.idle.shiftHz, amp: S.idle.amp, shift: S.idle.shift }, this.clock / 1000, Math.max(0, Math.min(1, this.smooth.alive)));
  }

  /** Lay the secondary motion on `work`, which must have been solved into `m` (the skeleton's world matrices) just before. */
  secondaryStep(work: Float64Array, f: AnimFrame, m: Float64Array): void {
    const goal = f.calm ? 0.5 : this.clip ? this.live.sec : 1;
    if (f.dt > 0) {
      const [x, v] = halfLifeStep(this.smooth.sec, this.smooth.vs, goal, HALFLIFE, f.dt);
      this.smooth.sec = x;
      this.smooth.vs = v;
    }
    this.secondary.step(work, this.frozen > 0 ? 0 : f.dt, f.forward, m, this.smooth.sec);
  }
}

export type { ClipDef };
