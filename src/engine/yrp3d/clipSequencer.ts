/**
 * **Which clip plays when** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): the order of a real model's battle motions, as a state machine with no `three` in it (`./clips.ts` carries
 * its commands out on the mixer, and `tests/unit/yrp3d/clips.test.ts` drives it with made-up plans and durations). The presenter keeps doing what it always does to the actor (the lunge, the recoil, the hop, the fade);
 * the clips move the body inside it. What a pose is made of (its entry clips, its hold, its exit) is `./clipMap.ts`'s.
 *
 * ## What starts a pose
 *
 * - **The action** (the shot director's beats, `./beats.ts`): `open('attack', lead)` as an attack opens, with `lead` the seconds until the blow lands (the lunge's apex); `open('cast')` and `open('item')`. An attack plays the
 *   *end* of its entry (the start and, for Bahamut, the lunge) at the speed that puts the end on the blow: from `E - lead * s` at speed `s` (kept between 1 and 2.2), so the long wind-up of a 4-second Thief attack is cut to
 *   the moment before the stab, not played in full. It then **holds** until the blow lands (`impact`; or the action closes, or the pose leaves, or `MAX_HOLD`), and the **exit** (the follow-through) plays on the blow. A cast
 *   or an item plays its entry at up to double speed, holds while the spell or item is on, and exits when the action closes.
 * - **The pose** (`PaintedActor.pose`, read every frame): a rise to `hurt` is the hit reaction (once), a rise to `victory` the celebration (its pose, then its hold for good); a rise to `attack`, `cast` or `item` that no beat
 *   announced (a test, a scripted action) starts that pose with no sync. A body that is **down** plays its fall and holds the last frame; a revive plays the rise. A figure at **low HP** (`low`) kneels in, holds the
 *   kneel, and rises when the HP is back; an action stands it up and it kneels again after (the game: the low-HP stance is the idle).
 * - **Priority.** A hit does not interrupt a celebration; a celebration interrupts anything but a fall; an action interrupts a hit and a kneel (the player's move is the one that matters); a fall interrupts all. The
 *   fidget (`idle2`, the game's alternate idle, every several seconds) is interrupted by anything.
 *
 * ## What ends one
 *
 * The end of its last exit clip: the clip fades back to the idle (or to the kneel's hold) and the idle loop never stopped counting. A pose with no exit ends with its entry. A role the model has no clip for is never started.
 */

import type { Plan, PlanTable, Pose } from './clipMap.ts';

/** The seconds a clip fades in over, a pose fades back to the base over, one part of a pose fades into the next over, and a revive or a cleared kneel fades into the idle over. */
export const FADE = { in: 0.12, out: 0.25, part: 0.05, base: 0.3 } as const;

/** Seconds an attack has to land when no beat said (an unannounced attack). */
export const DEFAULT_LEAD = 0.35;

/** The longest a held action waits for its release (seconds): an attack for its blow, a cast for its spell, an item for its use. Whatever releases it first wins. */
export const MAX_HOLD = { attack: 0.6, cast: 6, item: 4 } as const;

/** The seconds the entry of a cast or an item is fitted into (up to double speed), a hit reaction, a fall, and the time every exit is fitted into (up to 1.8 times faster, never slower). */
export const BUDGET = { enter: 0.75, hurt: 0.6, fall: 1.8, exit: 1.3, rise: 1.8 } as const;

/** What the player is told to do: play `clip` from `from` seconds into it at `speed`, fading in over `fade`; `loop` for a hold. `from` is -1 for "carry on where the clip's clock stands" (the idle). */
export interface Command {
  readonly clip: string;
  readonly from: number;
  readonly speed: number;
  readonly fade: number;
  readonly loop: boolean;
}

type Stage = 'enter' | 'hold' | 'exit';

interface Seg {
  readonly pose: Pose;
  stage: Stage;
  /** Which clip of the stage (entry or exit) is playing. */
  i: number;
  /** The clip playing, or null for a hold that has no clip (the last frame of the entry stays). */
  clip: string | null;
  /** Seconds into the clip, and its length. */
  t: number;
  end: number;
  speed: number;
  /** The pacing option's rate for this pose's one-shots. */
  rate: number;
  /** The hold is over (the blow landed, the action closed ...) but the entry has not finished: go to the exit when it does. */
  released: boolean;
  age: number;
  held: number;
}

/** Poses that wait in a hold for their release; `hurt` and `idle2` play through and end. */
const HOLDING: ReadonlySet<Pose> = new Set(['attack', 'cast', 'item', 'victory', 'ko', 'critical']);

/** The poses a battle actor shows while it is acting: leaving them (to the idle) releases a held action. */
const ACTING: ReadonlySet<string> = new Set(['ready', 'attack', 'cast', 'item', 'defend']);

const PRIORITY: Readonly<Record<Pose, number>> = { idle: 0, idle2: 0.5, critical: 1, hurt: 2, attack: 3, cast: 3, item: 3, victory: 4, ko: 5 };

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** A fraction in [0, 1) that is the same for the same string. */
function unit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export class ClipSequencer {
  private seg: Seg | null = null;
  private lastPose = 'idle';
  private down = false;
  private low = false;
  private idleFor = 0;
  private fidgets = 0;
  private fidgetAt: number;

  /** `plans` and `durations` (seconds, by clip name) are the model's; the plans must include an idle with a hold. `seed` makes the fidget's timing this figure's own. */
  constructor(private readonly plans: PlanTable, private readonly durations: Readonly<Record<string, number>>, private readonly seed = '') {
    this.fidgetAt = this.nextFidget();
  }

  private nextFidget(): number {
    return 7 + 6 * unit(`${this.seed}:${this.fidgets}`);
  }

  private dur(clip: string): number {
    return Math.max(0.01, this.durations[clip] ?? 0.01);
  }

  private sum(clips: readonly string[]): number {
    return clips.reduce((a, c) => a + this.dur(c), 0);
  }

  /** The pose playing now, `idle` when nothing else is (the kneel's hold counts as `critical`). */
  get current(): Pose {
    return this.seg?.pose ?? 'idle';
  }

  /** The stage of the pose playing now, or null for the base loop. */
  get stage(): Stage | null {
    return this.seg?.stage ?? null;
  }

  /** The clip playing now, or null (the base loop, or a hold on a frame). */
  get clip(): string | null {
    return this.seg?.clip ?? null;
  }

  /** The speed the playing clip should run at now: the player applies it every frame (0 holds a frame). */
  get speed(): number {
    return this.seg ? this.seg.speed : 1;
  }

  /** True while a fall, a rise or a celebration is on: it must run to its pose even when the idle is stilled (REDUCE MOTION). */
  get settling(): boolean {
    const p = this.seg?.pose;
    return p === 'ko' || p === 'victory';
  }

  /** Does this model have a plan for `pose`? */
  has(pose: Pose): boolean {
    return this.plans[pose] !== undefined;
  }

  private priority(): number {
    const s = this.seg;
    if (!s) return 0;
    if (s.stage === 'exit' && (s.pose === 'ko' || s.pose === 'critical')) return 0.9; // a rise or a kneel getting up gives way to an action
    return PRIORITY[s.pose];
  }

  private cmd(clip: string, from: number, speed: number, fade: number, loop: boolean): Command {
    return { clip, from, speed, fade, loop };
  }

  /** The loop under everything: the idle, or the kneel's hold while the HP is low. */
  private toBase(fade: number): Command {
    const idle = this.plans.idle!.hold!;
    const kneel = this.plans.critical;
    if (this.low && !this.down && kneel?.hold) {
      this.seg = { pose: 'critical', stage: 'hold', i: 0, clip: kneel.hold, t: 0, end: Infinity, speed: 1, rate: 1, released: false, age: 0, held: 0 };
      return this.cmd(kneel.hold, 0, 1, fade, true);
    }
    this.seg = null;
    this.idleFor = 0;
    return this.cmd(idle, -1, 1, fade, true);
  }

  /** Where in a run of clips `skip` seconds in lands: the clip's index and the seconds into it. */
  private locate(clips: readonly string[], skip: number): { i: number; at: number } {
    let i = 0;
    let at = skip;
    while (i < clips.length - 1 && at >= this.dur(clips[i]!)) {
      at -= this.dur(clips[i]!);
      i++;
    }
    return { i, at };
  }

  /** Start `pose`: its entry (the end of it, for an attack with a `lead`), at the speed its kind asks for. Null when the model has no such pose or something of higher priority is playing. */
  private begin(pose: Pose, rate: number, lead?: number): Command | null {
    const plan = this.plans[pose];
    if (!plan || PRIORITY[pose] < this.priority()) return null;
    if (this.down && pose !== 'ko') return null;
    if ((pose === 'cast' || pose === 'item') && this.seg?.pose === pose && this.seg.stage !== 'exit') return null; // already on it (the pose rose before the beat said so): no second start
    if (plan.enter.length === 0) {
      // a pose that is only a hold (the kneel when it is already down): straight to the hold
      this.seg = { pose, stage: 'enter', i: 0, clip: null, t: 0, end: 0, speed: rate, rate, released: false, age: 0, held: 0 };
      return this.afterEnter(this.seg, plan);
    }
    const total = this.sum(plan.enter);
    let speed = rate;
    let skip = 0;
    if (pose === 'attack') {
      const l = Math.max(0.05, lead ?? DEFAULT_LEAD);
      speed = clamp(total / l, 1, 2.2);
      skip = Math.max(0, total - l * speed);
    } else if (pose === 'cast' || pose === 'item') speed = clamp(total / BUDGET.enter, 1, 2) * rate;
    else if (pose === 'hurt') speed = clamp(total / BUDGET.hurt, 1, 1.8) * rate;
    else if (pose === 'ko') speed = clamp(total / BUDGET.fall, 1, 1.5) * rate;
    const at = this.locate(plan.enter, skip);
    const clip = plan.enter[at.i]!;
    this.seg = { pose, stage: 'enter', i: at.i, clip, t: at.at, end: this.dur(clip), speed, rate, released: false, age: 0, held: 0 };
    this.idleFor = 0;
    return this.cmd(clip, at.at, speed, FADE.in, false);
  }

  /** The entry is over: a holding pose waits in its hold (or goes straight on when it was already released); another goes to its exit or to the base. */
  private afterEnter(seg: Seg, plan: Plan): Command | null {
    if (HOLDING.has(seg.pose)) {
      if (seg.released) return this.toExit(seg, plan);
      seg.stage = 'hold';
      seg.held = 0;
      seg.i = 0;
      seg.end = Infinity;
      if (plan.hold) {
        seg.clip = plan.hold;
        seg.speed = 1;
        return this.cmd(plan.hold, 0, 1, FADE.part, true);
      }
      seg.clip = null; // no hold clip: the last frame of the entry stays
      seg.speed = 0;
      return null;
    }
    return plan.exit.length > 0 ? this.toExit(seg, plan) : this.toBase(FADE.out);
  }

  private toExit(seg: Seg, plan: Plan): Command {
    if (plan.exit.length === 0) return this.toBase(seg.pose === 'ko' ? FADE.base : FADE.out);
    const budget = seg.pose === 'ko' ? BUDGET.rise : BUDGET.exit;
    const speed = clamp(this.sum(plan.exit) / budget, 1, seg.pose === 'ko' ? 2.5 : 1.8) * seg.rate;
    const clip = plan.exit[0]!;
    seg.stage = 'exit';
    seg.i = 0;
    seg.clip = clip;
    seg.t = 0;
    seg.end = this.dur(clip);
    seg.speed = speed;
    return this.cmd(clip, 0, speed, FADE.in, false);
  }

  /** The hold is over (or the entry, when the hold has not begun): go to the exit. */
  private release(): Command | null {
    const seg = this.seg;
    if (!seg || !HOLDING.has(seg.pose)) return null;
    const plan = this.plans[seg.pose]!;
    if (seg.stage === 'hold') return this.toExit(seg, plan);
    if (seg.stage === 'enter') seg.released = true;
    return null;
  }

  /** The clip that was playing has ended: the next part, or the next stage, or the base. */
  private advance(): Command | null {
    const seg = this.seg!;
    const plan = this.plans[seg.pose]!;
    const run = seg.stage === 'enter' ? plan.enter : plan.exit;
    if (seg.i + 1 < run.length) {
      seg.i++;
      seg.clip = run[seg.i]!;
      seg.t = 0;
      seg.end = this.dur(seg.clip);
      return this.cmd(seg.clip, 0, seg.speed, FADE.part, false);
    }
    if (seg.stage === 'enter') return this.afterEnter(seg, plan);
    return this.toBase(seg.pose === 'ko' ? FADE.base : FADE.out);
  }

  /** An action opens. `kind` is the painted pose the presenter picked for it (`attack`, `cast`, `item`, `defend`); `lead` the seconds until the blow lands, when there is a blow. */
  open(kind: string, lead: number | undefined, rate = 1): Command | null {
    if (this.down) return null;
    if (kind === 'attack' || kind === 'cast' || kind === 'item') return this.begin(kind, rate, lead);
    return null;
  }

  /** The blow landed: the follow-through plays (or, if the entry has not finished, plays when it does). */
  impact(): Command | null {
    return this.seg?.pose === 'attack' ? this.release() : null;
  }

  /** The action is over: a held attack, cast or item goes to its exit. */
  close(): Command | null {
    const p = this.seg?.pose;
    return p === 'attack' || p === 'cast' || p === 'item' ? this.release() : null;
  }

  /**
   * The pose the actor shows now, whether it is down and whether its HP is low, once a frame: a rise to `hurt` or `victory` (or an unannounced `attack`, `cast` or `item`) starts that pose; a body that is down plays its
   * fall; a revive its rise; a cleared kneel its rise. A held action whose pose has left (the actor is back at idle) is released.
   */
  pose(pose: string, down: boolean, low: boolean, rate = 1): Command | null {
    this.low = low;
    if (down) {
      this.lastPose = pose;
      if (this.down) return null;
      this.down = true;
      return this.begin('ko', rate);
    }
    if (this.down) {
      this.down = false; // a revive: the rise
      return this.seg?.pose === 'ko' ? this.release() ?? this.toBase(FADE.base) : this.toBase(FADE.base);
    }
    const seg = this.seg;
    if (seg && (seg.pose === 'attack' || seg.pose === 'cast' || seg.pose === 'item') && seg.stage !== 'exit' && seg.age > 0.15 && !ACTING.has(pose)) {
      const out = this.release(); // the actor is back at rest: the action is over
      if (out) return out;
    }
    if (seg?.pose === 'critical' && seg.stage === 'hold' && !low) return this.release();
    if (!seg && low) return this.begin('critical', rate);
    if (pose !== this.lastPose) {
      const was = this.lastPose;
      let started: Command | null = null;
      if (pose === 'hurt') started = this.begin('hurt', rate);
      else if (pose === 'victory') started = this.begin('victory', rate);
      else if (pose === 'attack' || pose === 'cast' || pose === 'item') started = this.seg?.pose === pose ? null : this.begin(pose, rate);
      else if (was === 'victory' && this.seg?.pose === 'victory') started = this.release();
      this.lastPose = pose;
      return started;
    }
    return null;
  }

  /** Advance by `dt` seconds of the field's clock; at the end of a clip, the next; at the end of the exit, the base. A hold that has waited too long is released. */
  update(dt: number): Command | null {
    const seg = this.seg;
    if (!seg) {
      this.idleFor += dt;
      if (this.idleFor >= this.fidgetAt && this.plans.idle2 && !this.low) {
        this.fidgets++;
        this.fidgetAt = this.nextFidget();
        return this.begin('idle2', 1);
      }
      return null;
    }
    seg.age += dt;
    if (seg.speed > 0) seg.t += dt * seg.speed;
    if (seg.stage === 'hold') {
      seg.held += dt;
      const max = seg.pose === 'attack' ? MAX_HOLD.attack : seg.pose === 'cast' ? MAX_HOLD.cast : seg.pose === 'item' ? MAX_HOLD.item : Infinity;
      return seg.held >= max ? this.release() : null;
    }
    return seg.t >= seg.end ? this.advance() : null;
  }

  /** Back to the idle at once (a model that is being re-fitted or re-staged). */
  reset(): void {
    this.seg = null;
    this.down = false;
    this.low = false;
    this.lastPose = 'idle';
    this.idleFor = 0;
  }
}
