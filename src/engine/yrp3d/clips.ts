/**
 * **A real model's battle motions, driven by the battle** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): the game's own clips of a model (`<id>-anims.glb`, named as the developers'
 * `btlmot.ath` names them) on one three.js `AnimationMixer`, in the order `./clipSequencer.ts` decides, over the parts `./clipMap.ts` says make each pose. A model with no idle clip (a capsule) has no rig and stays
 * procedural (the actor's own breath, lunge, recoil, hop and fall, and the skin's flash and glow).
 *
 * ## How they play
 *
 * The idle loops from a phase of its own, always (so the party does not breathe in step). Every other pose is a sequence of clips (a start, a hold, a finish; a fall, a hold, a rise ...), each crossfaded in over
 * `FADE.in` and back to the idle over `FADE.out`; the speeds follow the pacing option (`pace.ts`) the way the actor's own one-shot moves do, and the idle is never scaled. The clips are the game's: their bones' rotations
 * and their root's position drive the body inside the actor's own lunge and recoil. REDUCE MOTION stills the idle (the mixer stops) but lets a fall, a rise or a celebration run to its pose.
 *
 * Needs three.js only; the choices are the sequencer's. Game case: FFX-2 only.
 */

import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three';
import type { PlanTable, Pose } from './clipMap.ts';
import { ClipSequencer, type Command } from './clipSequencer.ts';

/** The seconds each clip of a file runs, by name. */
export function durationsOf(clips: readonly AnimationClip[]): Record<string, number> {
  return Object.fromEntries(clips.map((c) => [c.name, c.duration]));
}

/** A fraction in [0, 1) that is the same for the same string: where in its idle a model starts. */
function phase(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export class ClipRig {
  readonly sequencer: ClipSequencer;
  private readonly mixer: AnimationMixer;
  private readonly byName = new Map<string, AnimationClip>();
  private readonly actions = new Map<string, AnimationAction>();
  private playing: AnimationAction;

  /** `root` is the model's scene (the tracks bind to its nodes by name); `plans` (`./clipMap.ts`) must include an idle with a hold, whose clip `clips` must have. */
  constructor(root: Object3D, clips: readonly AnimationClip[], plans: PlanTable, id: string) {
    const idle = plans.idle?.hold;
    if (!idle || !clips.some((c) => c.name === idle)) throw new Error('a clip rig needs an idle clip');
    this.mixer = new AnimationMixer(root);
    for (const c of clips) this.byName.set(c.name, c);
    this.sequencer = new ClipSequencer(plans, durationsOf(clips), id);
    this.playing = this.action(idle);
    this.playing.setLoop(LoopRepeat, Infinity);
    this.playing.play();
    this.mixer.setTime(phase(id) * this.byName.get(idle)!.duration); // the party does not breathe in step
  }

  private action(name: string): AnimationAction {
    let a = this.actions.get(name);
    if (!a) {
      a = this.mixer.clipAction(this.byName.get(name)!);
      this.actions.set(name, a);
    }
    return a;
  }

  /** The pose playing now (`idle` when none else is). */
  get current(): Pose {
    return this.sequencer.current;
  }

  /** The clip playing now, by name. */
  get clip(): string {
    return this.sequencer.clip ?? [...this.actions].find(([, a]) => a === this.playing)?.[0] ?? '';
  }

  /** Does this rig have a fall (so the body needs no procedural tip)? */
  get playsKo(): boolean {
    return this.sequencer.has('ko');
  }

  private run(cmd: Command | null): void {
    if (!cmd || !this.byName.has(cmd.clip)) return;
    const next = this.action(cmd.clip);
    if (cmd.from >= 0) {
      next.reset();
      next.time = cmd.from;
    } else {
      next.enabled = true; // back to the idle: carry on from where its clock stands
    }
    next.setLoop(cmd.loop ? LoopRepeat : LoopOnce, cmd.loop ? Infinity : 1);
    next.clampWhenFinished = true;
    next.setEffectiveTimeScale(cmd.speed);
    next.setEffectiveWeight(1);
    if (this.playing !== next) {
      this.playing.fadeOut(cmd.fade);
      next.fadeIn(cmd.fade);
    }
    next.play();
    this.playing = next;
  }

  /** The seconds a blow would have to wait, beyond `lead`, for an attack to play from its first part (`ClipSequencer.windup`). */
  windup(kind: string, lead: number | undefined): number {
    return this.sequencer.windup(kind, lead);
  }

  /** An action opens (`attack`, `cast` and `item` start their poses). */
  open(kind: string, lead: number | undefined, rate = 1): void {
    this.run(this.sequencer.open(kind, lead, rate));
  }

  /** The blow landed. */
  impact(): void {
    this.run(this.sequencer.impact());
  }

  /** The action is over. */
  close(): void {
    this.run(this.sequencer.close());
  }

  /** The pose the actor shows, whether it is down and whether its HP is low, once a frame. */
  pose(pose: string, down: boolean, low: boolean, rate = 1): void {
    this.run(this.sequencer.pose(pose, down, low, rate));
  }

  /** Advance by `dt` seconds. `frozen` (REDUCE MOTION) holds the pose, except a fall, a rise or a celebration, which runs to its end. */
  update(dt: number, frozen = false): void {
    const hold = frozen && !this.sequencer.settling;
    if (!hold) this.run(this.sequencer.update(dt));
    if (this.sequencer.current !== 'idle') this.playing.setEffectiveTimeScale(this.sequencer.speed);
    this.mixer.update(hold ? 0 : dt);
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
