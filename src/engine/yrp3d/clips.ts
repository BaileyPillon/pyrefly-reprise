/**
 * **A rigged model's animation, driven by the battle** (the hidden 3D Bahamut chapter, FFX-2 only): the model's clips on one three.js `AnimationMixer`, in the order `./clipSequencer.ts` decides, over the windows
 * `./clipAnalysis.ts` finds. A model with no clip for a role simply never plays it; a model with no clips at all (Bahamut is unrigged, and a capsule has none) has no rig and stays procedural (the actor's own breath, lunge,
 * recoil, hop and fall, and the skin's flash and glow).
 *
 * ## Which clip is which
 *
 * By name, case-blind, the first match: **idle** (`idle`, `breath`, `stand`), **attack** (`attack`, `strike`, `slash`, `shoot`), **hit** (`hit`, `hurt`, `damage`, `flinch`), **cast** (`cast`, `spell`, `magic`),
 * **victory** (`victory`, `win`, `cheer`). `walk` and `run` are not used: the presenter walks the figure with its own lunge, and a walk cycle under it would slide. The files' clips are in place (root motion removed from the
 * idle and the hit; the others are in place too), so nothing here cancels a root.
 *
 * ## How they play
 *
 * The idle loops from a phase of its own, always (so the party does not breathe in step). Each other clip is a one-shot over its window, crossfaded in over `FADE_IN` and back to the idle over `FADE_OUT`. The attack is
 * the long clip (3 to 7 seconds) cut to the second around its strike and sped to put the strike on the blow (`ClipSequencer.open`). A body that is down holds its pose (the mixer stops) while the actor tips it over, and
 * stands again on a revive. REDUCE MOTION stops the mixer too, as it stills the actor's idle. The speeds follow the pacing option (`pace.ts`) the way the actor's own one-shot moves do; the idle is never scaled.
 *
 * Needs three.js only; the choices are the sequencer's. Game case: FFX-2 only.
 */

import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three';
import { attackWindow, motionEnergy, wholeWindow, type RotationTrack } from './clipAnalysis.ts';
import { ClipSequencer, type Command, type Role, type Windows } from './clipSequencer.ts';

/** The names that make a clip a role's, in the order roles are looked for. */
export const ROLE_PATTERNS: Readonly<Record<Role, RegExp>> = {
  idle: /idle|breath|stand/i,
  attack: /attack|strike|slash|shoot/i,
  hit: /\bhit|hurt|damage|flinch/i,
  cast: /cast|spell|magic/i,
  victory: /victory|win|cheer/i,
};

const ROLES: readonly Role[] = ['idle', 'attack', 'hit', 'cast', 'victory'];

/** The clips of a file by role: the first clip whose name matches the role's pattern and has not been given to another role. */
export function roleClips(clips: readonly AnimationClip[]): Map<Role, AnimationClip> {
  const out = new Map<Role, AnimationClip>();
  const taken = new Set<AnimationClip>();
  for (const role of ROLES) {
    const found = clips.find((c) => !taken.has(c) && ROLE_PATTERNS[role].test(c.name));
    if (found) {
      out.set(role, found);
      taken.add(found);
    }
  }
  return out;
}

/** The bone rotations of a clip, as `./clipAnalysis.ts` reads them. */
export function rotationsOf(clip: AnimationClip): RotationTrack[] {
  return clip.tracks.filter((t) => t.name.endsWith('.quaternion')).map((t) => ({ times: t.times, values: t.values }));
}

/** The window each non-idle role plays: the attack's is the second around its strike, every other one's the clip up to where its motion stops. */
export function windowsOfClips(clips: ReadonlyMap<Role, AnimationClip>): Windows {
  const out: { -readonly [K in Role]?: Windows[K] } = {};
  for (const [role, clip] of clips) {
    if (role === 'idle') continue;
    const energy = motionEnergy(rotationsOf(clip), clip.duration);
    out[role] = role === 'attack' ? attackWindow(energy, clip.duration) : wholeWindow(energy, clip.duration);
  }
  return out;
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
  private readonly actions = new Map<Role, AnimationAction>();
  private playing: AnimationAction;
  /** The roles this rig can play. */
  readonly roles: readonly Role[];

  /** `root` is the model's scene (the tracks bind to its nodes by name); `clips` are by role (`roleClips`) and must include an idle. */
  constructor(root: Object3D, clips: ReadonlyMap<Role, AnimationClip>, id: string) {
    const idle = clips.get('idle');
    if (!idle) throw new Error('a clip rig needs an idle clip');
    this.mixer = new AnimationMixer(root);
    for (const [role, clip] of clips) this.actions.set(role, this.mixer.clipAction(clip));
    this.roles = [...clips.keys()];
    this.sequencer = new ClipSequencer(windowsOfClips(clips));
    this.playing = this.actions.get('idle')!;
    this.playing.setLoop(LoopRepeat, Infinity);
    this.playing.play();
    this.mixer.setTime(phase(id) * idle.duration); // the party does not breathe in step
  }

  /** The role playing now. */
  get current(): Role {
    return this.sequencer.current;
  }

  private run(cmd: Command | null): void {
    if (!cmd) return;
    const next = this.actions.get(cmd.role);
    if (!next) return;
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

  /** An action opens (`attack` or `cast` start their clips). */
  open(kind: string, lead: number | undefined, paceRate = 1): void {
    this.run(this.sequencer.open(kind, lead, paceRate));
  }

  /** The blow landed. */
  impact(paceRate = 1): void {
    this.sequencer.impact(paceRate);
  }

  /** The pose the actor shows and whether it is down, once a frame. */
  pose(pose: string, down: boolean, paceRate = 1): void {
    this.run(this.sequencer.pose(pose, down, paceRate));
  }

  /** Advance by `dt` seconds. `frozen` (a body that is down, REDUCE MOTION) holds the pose. */
  update(dt: number, frozen = false): void {
    if (!frozen) this.run(this.sequencer.update(dt));
    if (this.sequencer.current !== 'idle') this.playing.setEffectiveTimeScale(this.sequencer.speed);
    this.mixer.update(frozen ? 0 : dt);
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
