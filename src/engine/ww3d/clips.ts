/**
 * **A rigged model's animation, driven by the battle** (the hidden Wind Waker chapter, FFX-2 only): the model's clips on one three.js `AnimationMixer`, in the order `./clipSequencer.ts` decides, over the windows
 * `./clipAnalysis.ts` finds. A model with no clip for a role simply never plays it; a model with no clips at all (Valefor is one static mesh, and a capsule has none) has no rig and stays procedural (the actor's own
 * breath, lunge, recoil, hop and fall, and the skin's flash and glow).
 *
 * ## Which clip is which
 *
 * By name, case-blind, the first match: **idle** (`idle_combat` first, then `idle`, `breath`, `stand`), **attack** (`attack`, `strike`, `slash`, `shoot`), **hit** (`hit`, `hurt`, `damage`, `flinch`), **cast** (`cast`,
 * `spell`, `magic`), **victory** (`victory`, `win`, `cheer`), **ko** (`ko`, `dead`, `death`, `die`, `faint`, `defeat`, `knock`). The final files (`yuna-v2`, `rikku-v2`, `paine-v2`, read off 2026-10-20) carry `idle`,
 * `idle_combat`, `attack`, `hit`, `cast`, `victory`, `walk` and `run`; none has a knock-out clip, so a downed body is tipped over by the skin. **The base clip is `idle_combat`**, the combat stance (hips at 0.86 of
 * rest, wide legs, arms forward) the look lab's target shot is built on; the plain `idle` is named and not used. `walk` and `run` are **named and not used** ({@link UNUSED_CLIPS}): the presenter walks the figure with
 * its own lunge, and a walk cycle under it would slide.
 *
 * ## How they play
 *
 * The idle loops from a phase of its own, always (so the party does not breathe in step). Each other clip is a one-shot over its window, crossfaded in over `FADE_IN` and back to the idle over `FADE_OUT`. The attack is
 * the long clip (2 to 7 seconds) cut to the second around its strike and sped to put the strike on the blow (`ClipSequencer.open`). A body that is down holds its pose (the mixer stops) while the actor tips it over, and
 * stands again on a revive. REDUCE MOTION stops the mixer too, as it stills the actor's idle. The speeds follow the pacing option (`pace.ts`) the way the actor's own one-shot moves do; the idle is never scaled.
 *
 * ## Root motion and facing
 *
 * Meshy's mocap sometimes carries the hips across the floor: the root bone's x and z are held at their first value in every clip ({@link flattenRoot}). An attack twists the pelvis differently from the stance, so each role
 * has a **yaw offset** (the pelvis's facing at the window's start against the stance's), eased in and out with the clip and added to the model's root yaw, so the first pose of a clip faces the way the stance does and
 * the body does not spin on the cut (the lab's `calibrateWindows`).
 *
 * Needs three.js only; the choices are the sequencer's. Game case: FFX-2 only.
 */

import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three';
import { attackWindow, motionEnergy, wholeWindow, type RotationTrack } from './clipAnalysis.ts';
import { ClipSequencer, type Command, type Role, type Windows } from './clipSequencer.ts';
import { wrapAngle } from './layout.ts';

/** The names that make a clip a role's, in the order roles are looked for. */
export const ROLE_PATTERNS: Readonly<Record<Role, RegExp>> = {
  idle: /idle|breath|stand/i,
  attack: /attack|strike|slash|shoot/i,
  hit: /\bhit|hurt|damage|flinch/i,
  cast: /cast|spell|magic/i,
  victory: /victory|win|cheer/i,
  ko: /(^|[^a-z])ko([^a-z]|$)|dead|death|\bdie|faint|defeat|knock/i,
};

/** The clip the base stance is, when the file has it (the combat stance); else the first idle-like clip. */
export const STANCE_CLIP = 'idle_combat';

/** The clips the files carry that no role plays: the presenter moves the figure itself. Named here so a reader (and a test) knows they are left out on purpose, not forgotten. */
export const UNUSED_CLIPS: RegExp = /walk|run/i;

const ROLES: readonly Role[] = ['idle', 'attack', 'hit', 'cast', 'victory', 'ko'];

/** The clips of a file by role: the first clip whose name matches the role's pattern and has not been given to another role; the idle is the stance clip when the file has one. */
export function roleClips(clips: readonly AnimationClip[]): Map<Role, AnimationClip> {
  const out = new Map<Role, AnimationClip>();
  const taken = new Set<AnimationClip>();
  for (const role of ROLES) {
    const stance = role === 'idle' ? clips.find((c) => c.name.toLowerCase() === STANCE_CLIP) : undefined;
    const found = stance ?? clips.find((c) => !taken.has(c) && ROLE_PATTERNS[role].test(c.name) && !(role !== 'idle' && UNUSED_CLIPS.test(c.name)));
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
    if (role === 'ko') {
      out[role] = { start: 0, end: clip.duration }; // the whole fall: it plays once and holds its last pose, so there is no tail to cut
      continue;
    }
    const energy = motionEnergy(rotationsOf(clip), clip.duration);
    out[role] = role === 'attack' ? attackWindow(energy, clip.duration) : wholeWindow(energy, clip.duration);
  }
  return out;
}

/** The root bone's track holds x and z at their first value when it strays more than 2 cm: returns true when it did. `values` is the track's `[x, y, z, x, y, z, ...]`; y (the hips' own bob) is left. */
export function flattenRoot(values: ArrayLike<number> & { [i: number]: number }): boolean {
  let range = 0;
  for (let i = 0; i < values.length; i += 3) range = Math.max(range, Math.abs(values[i]! - values[0]!), Math.abs(values[i + 2]! - values[2]!));
  if (range <= 0.02) return false;
  const x = values[0]!;
  const z = values[2]!;
  for (let i = 0; i < values.length; i += 3) {
    values[i] = x;
    values[i + 2] = z;
  }
  return true;
}

/** The name of the first bone that has no bone for a parent: the skeleton's root. */
export function rootBoneName(model: Object3D): string | null {
  let name: string | null = null;
  model.traverse((o) => {
    const bone = o as { isBone?: boolean; parent?: { isBone?: boolean } | null; name: string };
    if (name === null && bone.isBone === true && !(bone.parent && bone.parent.isBone === true)) name = bone.name;
  });
  return name;
}

/** A copy of `clip` with its root bone's x and z held (`flattenRoot`); the clip itself when there is no root track or nothing to hold. */
export function lockRoot(clip: AnimationClip, root: string | null): AnimationClip {
  if (root === null) return clip;
  const copy = clip.clone();
  let locked = false;
  for (const t of copy.tracks) if (t.name === `${root}.position` && flattenRoot(t.values as unknown as Float32Array)) locked = true;
  return locked ? copy : clip;
}

/** A fraction in [0, 1) that is the same for the same string: where in its idle a model starts. */
function phase(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** Seconds the yaw offset takes to follow a role change (about the fade). */
const YAW_TAU = 0.12;

export class ClipRig {
  readonly sequencer: ClipSequencer;
  private readonly mixer: AnimationMixer;
  private readonly actions = new Map<Role, AnimationAction>();
  private playing: AnimationAction;
  private yaw = 0;
  /** The roles this rig can play. */
  readonly roles: readonly Role[];

  /**
   * `root` is the model's scene (the tracks bind to its nodes by name); `clips` are by role (`roleClips`) and must include an idle; `yawOffsets` is each role's pelvis-facing correction, radians (`./pose.ts` `yawOffsetsOf`), if any.
   */
  constructor(root: Object3D, clips: ReadonlyMap<Role, AnimationClip>, id: string, private readonly yawOffsets: Readonly<Partial<Record<Role, number>>> = {}) {
    const idle = clips.get('idle');
    if (!idle) throw new Error('a clip rig needs an idle clip');
    const rootName = rootBoneName(root);
    this.mixer = new AnimationMixer(root);
    for (const [role, clip] of clips) this.actions.set(role, this.mixer.clipAction(lockRoot(clip, rootName)));
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

  /** The yaw correction now, radians: the current role's offset, eased. */
  get yawOffset(): number {
    return this.yaw;
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

  /** Advance by `dt` seconds. `frozen` (REDUCE MOTION; a body that is down on a model with no knock-out clip) holds the pose. */
  update(dt: number, frozen = false): void {
    if (!frozen) this.run(this.sequencer.update(dt));
    if (this.sequencer.current !== 'idle') this.playing.setEffectiveTimeScale(this.sequencer.speed);
    if (!frozen) this.mixer.update(dt);
    const want = this.sequencer.current === 'idle' ? 0 : (this.yawOffsets[this.sequencer.current] ?? 0);
    this.yaw = wrapAngle(this.yaw + wrapAngle(want - this.yaw) * (dt > 0 ? 1 - Math.exp(-dt / YAW_TAU) : 1));
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
