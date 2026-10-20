/**
 * **Which clip plays when** (the hidden 3D Bahamut chapter, FFX-2 only): the order of a rigged model's animation, as a state machine with no `three` in it (`./clips.ts` carries its commands out on the mixer, and
 * `tests/unit/yrp3d/clips.test.ts` drives it with made-up windows). The presenter keeps doing what it always does to the actor (the lunge, the recoil, the hop, the fade, the KO's fall); the clips move the body inside it.
 *
 * ## What starts a clip
 *
 * - **The action** (the shot director's beats, `./beats.ts`): `open('attack', lead)` as an attack opens, with `lead` the seconds until the blow lands (the lunge's apex); `open('cast')` as a spell opens. An attack plays
 *   its **window** (`./clipAnalysis.ts`: a second or so of the long clip around its strike) at the speed that puts the strike on the blow: the window starts `STRIKE_PRE` seconds before the strike, so the speed is
 *   `STRIKE_PRE / lead` (kept between 0.6 and 2.5) until the strike has passed, and 1 after it. A cast plays whole at the pace rate.
 * - **The pose** (`PaintedActor.pose`, read every frame): a rise to `hurt` is the hit reaction, a rise to `victory` the celebration; a rise to `attack` or `cast` that no beat announced (a test, a scripted action) starts that
 *   clip at the pace rate with no sync. Everything else (`ready`, `defend`, `item`, `idle`) is the idle.
 * - **Priority.** A hit does not interrupt a celebration; a celebration interrupts anything; an action interrupts a hit (the player's move is the one that matters) and an action interrupts the other.
 *
 * ## What ends one
 *
 * The window's end: the clip fades back to the idle over `FADE_OUT` (the idle loop never stopped counting). Being down stops the clips (the body is tipped by the actor's own fall and holds its pose); a revive stands it up
 * on the idle. A role the model has no clip for is never started. The idle itself loops from a phase of its own.
 */

import type { ClipWindow } from './clipAnalysis.ts';

export type Role = 'idle' | 'attack' | 'hit' | 'cast' | 'victory';

/** The seconds a one-shot fades in over, and the seconds it fades back to the idle over. */
export const FADE_IN = 0.12;
export const FADE_OUT = 0.25;

/** What the player is told to do: play `role` from `from` seconds into its clip at `speed`, fading in over `fade`; `loop` for the idle. `from` is -1 for "carry on where the idle is". */
export interface Command {
  readonly role: Role;
  readonly from: number;
  readonly speed: number;
  readonly fade: number;
  readonly loop: boolean;
}

export type Windows = Partial<Record<Role, ClipWindow>>;

const PRIORITY: Readonly<Record<Role, number>> = { idle: 0, hit: 1, attack: 2, cast: 2, victory: 3 };

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export class ClipSequencer {
  private role: Role = 'idle';
  private position = 0;
  private rate = 1;
  private landed = true;
  private lastPose = 'idle';
  private down = false;

  constructor(private readonly windows: Windows) {}

  /** The role playing now. */
  get current(): Role {
    return this.role;
  }

  /** Seconds into the playing clip (the idle's is not tracked). */
  get at(): number {
    return this.position;
  }

  /** The speed the playing clip should run at now: the player applies it every frame. */
  get speed(): number {
    return this.role === 'idle' ? 1 : this.rate;
  }

  /** Does this model have a clip for `role`? */
  has(role: Role): boolean {
    return this.windows[role] !== undefined;
  }

  private start(role: Role, speed: number, landed: boolean): Command | null {
    const w = this.windows[role];
    if (!w) return null;
    if (PRIORITY[this.role] > PRIORITY[role] && this.role !== 'idle') return null;
    if (this.role === 'victory' && role !== 'victory') return null;
    this.role = role;
    this.position = w.start;
    this.rate = speed;
    this.landed = landed;
    return { role, from: w.start, speed, fade: FADE_IN, loop: false };
  }

  /** An action opens. `kind` is the painted pose the presenter picked for it (`attack`, `cast`, `item`, `defend`); `lead` the seconds until the blow lands, when there is a blow. */
  open(kind: string, lead: number | undefined, paceRate = 1): Command | null {
    if (this.down) return null;
    if (kind === 'attack') {
      const w = this.windows.attack;
      if (!w) return null;
      if (lead !== undefined && lead > 0 && w.shot !== undefined && w.shot > w.start) return this.start('attack', clamp((w.shot - w.start) / lead, 0.6, 2.5), false);
      return this.start('attack', paceRate, true);
    }
    if (kind === 'cast') return this.start('cast', paceRate, true);
    return null;
  }

  /** The blow landed (the beat): the strike is over, the rest of the window plays at its own speed. */
  impact(paceRate = 1): void {
    if (this.role === 'attack' && !this.landed) {
      this.landed = true;
      this.rate = paceRate;
    }
  }

  /** The pose the actor shows now and whether it is down, once a frame: a rise to `hurt` or `victory` (or an unannounced `attack` or `cast`) starts that clip. A body that is down stops the clips. */
  pose(pose: string, down: boolean, paceRate = 1): Command | null {
    const was = this.lastPose;
    this.lastPose = pose;
    if (down) {
      this.down = true;
      this.role = 'idle';
      return null;
    }
    if (this.down) {
      this.down = false; // a revive: stand on the idle
      this.role = 'idle';
      return { role: 'idle', from: -1, speed: 1, fade: 0.3, loop: true };
    }
    if (pose === was) return null;
    if (pose === 'hurt') return this.start('hit', paceRate, true);
    if (pose === 'victory') return this.start('victory', paceRate, true);
    if (pose === 'attack' && this.role !== 'attack') return this.start('attack', paceRate, true);
    if (pose === 'cast' && this.role !== 'cast') return this.start('cast', paceRate, true);
    return null;
  }

  /** Advance by `dt` seconds of the field's clock; at the end of a window, the fade back to the idle. */
  update(dt: number): Command | null {
    if (this.role === 'idle') return null;
    const w = this.windows[this.role]!;
    this.position += dt * this.rate;
    if (!this.landed && w.shot !== undefined && this.position >= w.shot) {
      this.landed = true; // the strike has passed without a beat saying so: the rest plays at its own speed
      this.rate = 1;
    }
    if (this.position >= w.end) {
      this.role = 'idle';
      return { role: 'idle', from: -1, speed: 1, fade: FADE_OUT, loop: true };
    }
    return null;
  }

  /** Back to the idle at once (a model that is being re-fitted or re-staged). */
  reset(): void {
    this.role = 'idle';
    this.down = false;
    this.lastPose = 'idle';
  }
}
