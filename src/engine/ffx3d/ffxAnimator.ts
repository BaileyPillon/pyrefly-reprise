/**
 * **The `ffx` skin's models move** (the hidden Fayth chapter; FFX only; `docs/plans/fayth-3d.md`, phase 5a): one three.js `AnimationMixer` per model, driven by what the presenter is doing. The order the
 * clips play in is `./clipSequencer.ts` (pure, and tested without a model); the rows of the table and the pose-to-row rules are `./clipMap.ts`; this file carries the sequencer's commands out on the mixer
 * (the actions, their loops, speeds and crossfades) and feeds it what the presenter does.
 *
 * ## What drives a model
 *
 * - **The pose** (`PaintedActor.pose` and `lifeState`, public; read every frame): the idle loop, the hit reaction, the fall and the celebration, a held guard. The presenter keeps driving the actor as it always
 *   does (position, lunge, recoil, hop, fades); the clips move the body inside it.
 * - **The action** (the shot director's beats, which carry the ability id: `noteOpen`, `noteImpact`, `noteClose`; wired by `./beatTap.ts`): an action's own row starts when the action opens (an enemy's
 *   pose says `attack` or `cast` whatever the move is; the beat names it), the hold of a cast or a breath is left when the first blow lands, and the pose that follows the close is not mistaken for a new
 *   action. A blow is **landed on the hit**: the lunge reaches its apex a fraction of a second after the action opens and the damage lands there, so the strike starts part-way in and is sped up to meet it
 *   (`ClipSequencer`). While an action is open its own key is held: the presenter's `ready`, `attack` and `follow` paintings within one action do not restart anything. Being hit, falling and winning still
 *   take over.
 * - **The airship's flights** (`noteRange`): Evrae's pull-back and move-in motions when the range changes. They are finite, and the pose does not cut them.
 *
 * Speeds follow the pacing option (`rate`, the presenter's action pace: the default `steady` stretches action by 1.2): the idle is never scaled. Each model starts its idle at a phase of its own, so
 * the three of the party do not breathe in step. A clip the table names but the file lacks is skipped (the actor stays on what it was doing). `finished` is queued by the mixer and handled after its update,
 * never inside it.
 *
 * Needs three.js only for the mixer; reached from the skin glue through the DEV-gated dynamic imports, so a production build holds none of it. Game case: FFX only.
 */

import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three';
import { KEEP, RANGE_KEYS, actionKeyFor, interrupts, keyForPose, type ClipMap, type RowKey } from './clipMap.ts';
import { ClipSequencer, type PlayCommand, type SequencerState } from './clipSequencer.ts';

/** What the presenter shows of an actor: the painting that is up and the life state. */
export interface PoseReading {
  readonly pose: string;
  readonly life: string;
}

/** A model the animator moves: its root (the clip tracks are bound to the nodes below it by name) and a way to read what the presenter shows of its actor. */
export interface AnimatedModel {
  readonly id: string;
  readonly root: Object3D;
  read(): PoseReading;
}

export interface FfxAnimatorOptions {
  readonly map: ClipMap;
  /** By actor id: the clips of its animation file by name. An actor with none, or with no row table, is not animated. */
  readonly clips: Readonly<Record<string, ReadonlyMap<string, AnimationClip>>>;
  /** The presenter's action pace as a clock rate (`paceRate('action')`: 1 normally, 1/1.2 at the default), read each frame. */
  readonly rate?: () => number;
}

/** What `noteOpen` is told of an action. */
export interface OpenInfo {
  readonly abilityId?: string | undefined;
  /** The painted pose the presenter picked for it (`attack`, `cast`, `item`, `defend`). */
  readonly kind?: string | undefined;
  /** Seconds until the blow lands (the lunge's apex), at the live speed; absent for a move with no lunge. */
  readonly lead?: number | undefined;
}

/** The longest frame the mixer is advanced by (a hidden tab's first frame back must not leap through a clip). */
const MAX_DT = 0.1;

/** A key held against the pose until the action closes, or until the row it started has played out. */
interface Hold {
  readonly key: RowKey;
  readonly until: 'close' | 'settled';
}

interface Slot {
  readonly model: AnimatedModel;
  readonly mixer: AnimationMixer;
  readonly seq: ClipSequencer;
  readonly clips: ReadonlyMap<string, AnimationClip>;
  readonly actions: Map<string, AnimationAction>;
  current: AnimationAction | null;
  hold: Hold | null;
  /** The action whose `finished` the mixer reported, handled after the update. */
  finished: AnimationAction | null;
}

/** A fraction in [0, 1) that is the same for the same id: where in its idle each model starts. */
export function phaseOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export class FfxAnimator {
  private readonly slots = new Map<string, Slot>();

  constructor(private readonly opts: FfxAnimatorOptions) {}

  /** Whether the table and the files have what it takes to animate this actor: a row table with an idle, and the idle clip. */
  canAnimate(id: string): boolean {
    const actor = this.opts.map.actors[id];
    const clips = this.opts.clips[id];
    return actor !== undefined && clips !== undefined && clips.has(actor.rows['idle']!.steps[0]!.clip);
  }

  /** The ids being animated. */
  get ids(): string[] {
    return [...this.slots.keys()];
  }

  /** Where an actor's sequence is (a test's and the debug view's read); null for one not animated. */
  stateOf(id: string): SequencerState | null {
    return this.slots.get(id)?.seq.state ?? null;
  }

  /** The clip an actor is playing now, by name; null for one not animated or between clips. */
  clipOf(id: string): string | null {
    return this.slots.get(id)?.current?.getClip().name ?? null;
  }

  /** How far into its clip the actor is, seconds (a test's and the debug view's read); null for one not animated. */
  timeOf(id: string): number | null {
    return this.slots.get(id)?.current?.time ?? null;
  }

  /** The speed the actor's clip plays at: its own scale times the pacing rate; null for one not animated. */
  speedOf(id: string): number | null {
    return this.slots.get(id)?.current?.timeScale ?? null;
  }

  /** Start animating `model`: it stands in its idle. Replaces an earlier model of the same id. Returns false (and does nothing) when the actor cannot be animated. */
  add(model: AnimatedModel): boolean {
    this.remove(model.id);
    if (!this.canAnimate(model.id)) return false;
    const actor = this.opts.map.actors[model.id]!;
    const mixer = new AnimationMixer(model.root);
    const slot: Slot = { model, mixer, seq: new ClipSequencer(actor.rows, this.opts.map.fps), clips: this.opts.clips[model.id]!, actions: new Map(), current: null, hold: null, finished: null };
    mixer.addEventListener('finished', (e) => {
      slot.finished = (e as unknown as { action: AnimationAction }).action;
    });
    this.slots.set(model.id, slot);
    this.apply(slot, slot.seq.start(), phaseOf(model.id));
    return true;
  }

  remove(id: string): void {
    const slot = this.slots.get(id);
    if (!slot) return;
    slot.mixer.stopAllAction();
    slot.mixer.uncacheRoot(slot.model.root);
    this.slots.delete(id);
  }

  /** Once a frame, after the presenter's own update: read each actor's pose, carry out what the sequencer says, and advance the mixers. */
  update(dt: number): void {
    const step = Math.min(Math.max(dt, 0), MAX_DT);
    for (const slot of this.slots.values()) {
      const read = slot.model.read();
      const poseKey = keyForPose(read.pose, read.life);
      if (slot.hold && interrupts(poseKey)) slot.hold = null;
      else if (slot.hold?.until === 'settled' && slot.seq.state.key === 'idle') {
        slot.hold = null; // the flight is over: the pose that is up now is not a new action (a painting left over from before it is not an edge)
        slot.seq.acknowledge(poseKey);
      }
      const key = slot.hold ? slot.hold.key : poseKey;
      if (key !== KEEP) this.apply(slot, slot.seq.want(key));
      slot.mixer.update(step);
      const done = slot.finished;
      slot.finished = null;
      if (done && done === slot.current) this.apply(slot, slot.seq.ended());
    }
  }

  // ------------------------------------------------------------------ what the engine and the presenter tell it

  /** An action opens (the beat's answer has come: the lunge starts now). Its row is held against the pose until {@link noteClose}. */
  noteOpen(id: string, info: OpenInfo): void {
    const slot = this.slots.get(id);
    if (!slot) return;
    const key = actionKeyFor(info.abilityId, info.kind);
    if (key === null) return;
    slot.hold = { key, until: 'close' };
    const lead = info.lead !== undefined ? info.lead * this.rate() : undefined; // clip time: the clip runs at `rate` of real time
    this.apply(slot, slot.seq.want(key, lead === undefined ? undefined : { lead }));
  }

  /** A blow lands: the actor's hold (a cast, a breath) is over and the release plays. */
  noteImpact(id: string): void {
    const slot = this.slots.get(id);
    if (slot) this.apply(slot, slot.seq.release());
  }

  /** The action is over: the pose decides again (it has gone back to idle; a held row is released, a blow plays out). */
  noteClose(id: string): void {
    const slot = this.slots.get(id);
    if (slot?.hold?.until === 'close') slot.hold = null;
  }

  /** The airship's range changed: Evrae's flight plays, and the pose does not cut it. `id` is the actor that flies. */
  noteRange(id: string, range: 'near' | 'far'): void {
    const slot = this.slots.get(id);
    if (!slot) return;
    const key = RANGE_KEYS[range];
    slot.hold = { key, until: 'settled' };
    this.apply(slot, slot.seq.want(key));
  }

  dispose(): void {
    for (const id of [...this.slots.keys()]) this.remove(id);
  }

  // ----------------------------------------------------------------------------------------- the mixer

  private rate(): number {
    const r = this.opts.rate?.() ?? 1;
    return Number.isFinite(r) && r > 0 ? r : 1;
  }

  /** Put a command's clip on the actor: from its start frame, at its speed, crossfaded from what plays. A clip the file lacks is skipped. `phase`: where in the clip to start, as a fraction (the idle's). */
  private apply(slot: Slot, cmd: PlayCommand | null, phase = 0): void {
    if (!cmd) return;
    const clip = slot.clips.get(cmd.clip);
    if (!clip) return;
    let action = slot.actions.get(cmd.clip);
    if (!action) {
      action = slot.mixer.clipAction(clip);
      slot.actions.set(cmd.clip, action);
    }
    const previous = slot.current;
    action.reset();
    action.setLoop(cmd.loop ? LoopRepeat : LoopOnce, Infinity);
    action.clampWhenFinished = !cmd.loop;
    action.timeScale = cmd.key === 'idle' ? 1 : cmd.scale * this.rate();
    action.time = Math.min(clip.duration, cmd.startFrame / this.opts.map.fps + phase * clip.duration);
    action.setEffectiveWeight(1);
    if (previous && previous !== action && cmd.fade > 0) {
      action.fadeIn(cmd.fade);
      previous.fadeOut(cmd.fade);
    } else if (previous && previous !== action) {
      previous.stop();
    }
    action.play();
    slot.current = action;
  }
}
