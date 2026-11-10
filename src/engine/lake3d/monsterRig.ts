/**
 * **The Wendigo's, the Guardians' and the aeons' motion** (the hidden Wendigo chapter's 3D stage; FFX only): the game's own clips (the real `m212`, `m213` and `s001` to `s004` banks, joined into whole performances by the asset
 * build: the Wendigo's `attack` is its `attack1_00` then `attack1_01`) on one three.js `AnimationMixer`, driven by what the battle is doing. Each action clip has the moment its blow or effect lands, its **strike**: the game's
 * own effect-trigger mark when the data table has one (`../../data/ffx/lake-models.ts` `LAKE_STRIKES`), else **looked at once** when the rig is built: where its bones turn fastest after the wind-up
 * (`../ww3d/clipAnalysis.ts`, the same reading the Wind Waker chapter takes of its girls' clips). An action starts from the point that puts the strike on the blow: `start = strike - lead * speed`, the speed kept between
 * 1 and {@link SPEED_MAX} (the wind-up is cut to what the lunge leaves; with the director's hold, `./beats.ts`, the whole wind-up plays).
 *
 * States: the base loop is `idle`, or `stance_block1` while the Wendigo's arms are up (it holds there through its counter punches), or `sleep` while it sleeps; an action plays once and settles back to the base; a hit plays
 * `hurt` (never over an action, never over a sleep); a fall plays `ko` and holds its last frame; a rise goes back to the base. The stance is entered through `arms_up` (the game's `sp1_00`) and left through `stance_block2`
 * (`sp1_02`). **Sleep** (the game's `sleep_00` to `sleep_02`: `sleep_in`, the held `sleep`, `wake`) **ends the stance on the spot**, as the game's script clears it for a sleeper, whatever the engine's flag says until the next hit:
 * the arms are down the moment it falls asleep. Needs three.js only. Game case: FFX only.
 */

import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three';
import { motionEnergy, strikeTime, type RotationTrack } from '../ww3d/clipAnalysis.ts';
import { monsterRowFor, MONSTER_IDLE } from './clipMap.ts';

/** The fastest an action's lead-in is played to put its strike on the blow. */
export const SPEED_MAX = 2.2;
/** Seconds a blow's lead is at least (an unannounced action), and the lead a cast's effect is given. */
export const MIN_LEAD = 0.3;
export const CAST_LEAD = 0.9;
/** Crossfades, seconds. */
const FADE = { in: 0.14, base: 0.3, hurt: 0.08, ko: 0.15 } as const;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** A fraction in [0, 1) that is the same for the same string (where in its idle a model starts). */
function phase(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/** The moment a clip's strike lands, seconds: the peak of its bones' turning after the wind-up (0.3 s skipped). A clip with no rotation tracks lands at 40 percent of its length. */
export function strikeOf(clip: AnimationClip): number {
  const tracks: RotationTrack[] = clip.tracks.filter((t) => t.name.endsWith('.quaternion')).map((t) => ({ times: t.times, values: t.values }));
  if (tracks.length === 0) return clip.duration * 0.4;
  const at = strikeTime(motionEnergy(tracks, clip.duration), Math.min(0.3, clip.duration * 0.2));
  return at > 0 ? at : clip.duration * 0.4;
}

export class MonsterRig {
  private readonly mixer: AnimationMixer;
  private readonly clips = new Map<string, AnimationClip>();
  private readonly actions = new Map<string, AnimationAction>();
  private readonly strikes = new Map<string, number>();
  private current: AnimationAction | null = null;
  private busy = false;
  private stance = false;
  private down = false;
  private asleep = false;
  private lastPose = 'idle';
  private readonly fixed: Readonly<Record<string, number>>;
  private finished: AnimationAction | null = null;
  private readonly id: string;

  /** `root` is the model's scene (the tracks bind to its nodes by name); `clips` must hold an `idle`; `strikes` are the game's own marks by clip name (seconds), which win over the reading of the motion. */
  constructor(root: Object3D, clips: readonly AnimationClip[], id: string, strikes: Readonly<Record<string, number>> = {}) {
    if (!clips.some((c) => c.name === MONSTER_IDLE)) throw new Error('a monster rig needs an idle clip');
    this.id = id;
    this.fixed = strikes;
    this.mixer = new AnimationMixer(root);
    for (const c of clips) this.clips.set(c.name, c);
    this.mixer.addEventListener('finished', (e) => {
      this.finished = (e as unknown as { action: AnimationAction }).action;
    });
    this.play(MONSTER_IDLE, { loop: true, fade: 0 });
    this.mixer.setTime(phase(id) * this.clips.get(MONSTER_IDLE)!.duration); // two Guardians do not breathe in step
  }

  /** The clip playing now, by name. */
  get clip(): string | null {
    return this.current?.getClip().name ?? null;
  }

  /** True while an action's clip is on. */
  get acting(): boolean {
    return this.busy;
  }

  /** True while the arms are up. */
  get armsUp(): boolean {
    return this.stance;
  }

  /** True when the model plays its own fall (the skin then does not tip the body over as well). */
  get playsKo(): boolean {
    return this.clips.has('ko');
  }

  /** True while it is asleep (the sleep clips, or the base idle when the file has none: the arms are down either way). */
  get sleeping(): boolean {
    return this.asleep;
  }

  /** Whether the file has a clip by this name. */
  has(name: string): boolean {
    return this.clips.has(name);
  }

  /** The strike of a clip, seconds: the game's own mark when the table has one, else read from the motion on first use. */
  strikeAt(name: string): number {
    const marked = this.fixed[name];
    if (marked !== undefined && Number.isFinite(marked) && marked > 0) return marked;
    let s = this.strikes.get(name);
    if (s === undefined) {
      const clip = this.clips.get(name);
      s = clip ? strikeOf(clip) : 0;
      this.strikes.set(name, s);
    }
    return s;
  }

  /** The clip a row plays: its own, else its alternative (a Guardian's potion plays the cast when the file has no `item`); null when the file has neither. */
  private clipFor(row: { clip: string; alt?: string | undefined }): string | null {
    if (this.clips.has(row.clip)) return row.clip;
    return row.alt !== undefined && this.clips.has(row.alt) ? row.alt : null;
  }

  private action(name: string): AnimationAction | null {
    let a = this.actions.get(name);
    if (!a) {
      const clip = this.clips.get(name);
      if (!clip) return null;
      a = this.mixer.clipAction(clip);
      this.actions.set(name, a);
    }
    return a;
  }

  private play(name: string, o: { loop: boolean; fade: number; from?: number; speed?: number }): boolean {
    const next = this.action(name);
    if (!next) return false;
    const previous = this.current;
    next.reset();
    next.setLoop(o.loop ? LoopRepeat : LoopOnce, o.loop ? Infinity : 1);
    next.clampWhenFinished = !o.loop;
    next.timeScale = o.speed ?? 1;
    next.time = clamp(o.from ?? 0, 0, next.getClip().duration);
    next.setEffectiveWeight(1);
    if (previous && previous !== next && o.fade > 0) {
      next.fadeIn(o.fade);
      previous.fadeOut(o.fade);
    } else if (previous && previous !== next) previous.stop();
    next.play();
    this.current = next;
    return true;
  }

  private toBase(fade: number): void {
    this.busy = false;
    const held = this.asleep && this.clips.has('sleep') ? 'sleep' : this.stance && this.clips.has('stance_block1') ? 'stance_block1' : MONSTER_IDLE;
    this.play(held, { loop: true, fade });
  }

  /** The seconds a blow would have to wait beyond `lead` for this action's clip to play from its first frame (the director's hold); 0 for a cast or a clip with no row. */
  windup(abilityId: string | undefined, kind: string | undefined, lead: number | undefined): number {
    const row = monsterRowFor(this.id, abilityId, kind);
    const clip = row && row.kind === 'blow' && !this.asleep ? this.clipFor(row) : null;
    if (!clip) return 0;
    return Math.max(0, this.strikeAt(clip) / SPEED_MAX - Math.max(MIN_LEAD, lead ?? MIN_LEAD));
  }

  /** An action opens: the clip starts so that its strike lands `lead` seconds on (a cast's effect `CAST_LEAD` on, whatever the beat says). */
  open(abilityId: string | undefined, kind: string | undefined, lead: number | undefined): void {
    if (this.down || this.asleep) return; // a sleeper does not act
    const row = monsterRowFor(this.id, abilityId, kind);
    const clip = row ? this.clipFor(row) : null;
    if (!row || !clip) return;
    const strike = this.strikeAt(clip);
    const to = row.kind === 'cast' ? Math.max(lead ?? 0, CAST_LEAD) : Math.max(lead ?? MIN_LEAD, MIN_LEAD);
    const speed = clamp(strike / to, 1, SPEED_MAX);
    const from = Math.max(0, strike - to * speed);
    this.busy = this.play(clip, { loop: false, fade: FADE.in, from, speed });
  }

  /** The Wendigo's arms go up (`true`: `arms_up`, then the held block) or come down (`stance_block2`, then the idle). */
  setStance(up: boolean): void {
    if (this.down || this.asleep) {
      this.stance = false; // a sleeper's arms are down, and a corpse's
      return;
    }
    if (this.stance === up || !this.clips.has('arms_up')) return;
    this.stance = up;
    if (up) {
      this.busy = this.play('arms_up', { loop: false, fade: FADE.in });
    } else {
      this.busy = this.clips.has('stance_block2') ? this.play('stance_block2', { loop: false, fade: FADE.in }) : false;
      if (!this.busy) this.toBase(FADE.base);
    }
  }

  /**
   * Sleep lands or ends (the presenter's `status-add` and `status-remove` of `sleep`, told through the actor). **Falling asleep ends the arms-up stance on the spot** (the game's script clears it for a sleeper, RE 4.3):
   * `sleep_in` plays once, then the held `sleep`; waking plays `wake`, then the base. A file with no sleep clips still drops the stance and rests in its idle. A fallen body sleeps no more.
   */
  noteSleep(on: boolean): void {
    if (on === this.asleep || this.down) return;
    this.asleep = on;
    if (on) {
      this.stance = false;
      if (this.clips.has('sleep_in')) this.busy = this.play('sleep_in', { loop: false, fade: FADE.in });
      else this.toBase(FADE.base);
      return;
    }
    if (this.clips.has('wake')) this.busy = this.play('wake', { loop: false, fade: FADE.in });
    else this.toBase(FADE.base);
  }

  /** The pose the actor shows and whether it is down, once a frame: a rise to `hurt` plays the hit (never over an action); a body that is down plays its fall and holds; a revive goes back to the base. */
  notePose(pose: string, down: boolean): void {
    if (down) {
      this.lastPose = pose;
      if (this.down) return;
      this.down = true;
      this.stance = false;
      this.asleep = false;
      this.busy = true;
      this.play(this.clips.has('ko') ? 'ko' : MONSTER_IDLE, { loop: !this.clips.has('ko'), fade: FADE.ko, speed: 1 });
      return;
    }
    if (this.down) {
      this.down = false; // a revive
      this.toBase(FADE.base);
    }
    if (pose !== this.lastPose) {
      if (pose === 'hurt' && !this.busy && !this.asleep && this.clips.has('hurt')) {
        const dur = this.clips.get('hurt')!.duration;
        this.busy = this.play('hurt', { loop: false, fade: FADE.hurt, speed: clamp(dur / 0.9, 1, SPEED_MAX) });
      }
      this.lastPose = pose;
    }
  }

  /** Advance by `dt` seconds; `frozen` (REDUCE MOTION) holds the pose except a fall. */
  update(dt: number, frozen = false): void {
    this.mixer.update(frozen && !this.down ? 0 : dt);
    const done = this.finished;
    this.finished = null;
    if (done && done === this.current && !this.down) this.toBase(FADE.base); // a sleeper's `sleep_in` ends in the held `sleep` (the base while asleep)
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
