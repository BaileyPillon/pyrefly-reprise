/**
 * **The order an actor's clips play in** (the hidden Fayth chapter's `ffx` skin; FFX only; `docs/plans/fayth-3d.md`, phase 5a). A pure state machine over the rows of a `ClipMap` (`./clipMap.ts`): it is told
 * what the actor should be showing (`want`), that the clip it is on has finished (`ended`) or that the hold may end (`release`), and answers each time with the one clip to play next, or nothing. The
 * animator (`./ffxAnimator.ts`) owns the three.js side (the mixer, the actions, the crossfades) and carries these commands out; keeping the order here lets Node test it with no model at all.
 *
 * ## The shapes of a row, and what each does
 *
 * - **Idle** (one looping clip): plays until something else is wanted.
 * - **A finite row** (`attack`, `hurt`, Evrae's inhale, the airship's flights): its clips play in turn and the actor goes back to idle when the last one ends. **Asking for idle does not cut it**: a figure
 *   does not drop its blow because the presenter has already put the idle painting back; it finishes and settles.
 * - **A held row** (`cast`, `item`, `defend`, Evrae's breath, gaze and spray: a looping clip in the middle): the clips before the hold play, the hold loops **until released**, then the clips after it
 *   play (the release, the end) and the actor goes to idle. It is released by {@link ClipSequencer.release} (the effect landing: the director's impact beat) or, failing that, by idle being wanted (the
 *   action is over). A second hold in the tail is skipped once the sequence has been released.
 * - **A terminal row** (`ko`, `victory`: its last clip loops): the clips play and the last one holds until something else is wanted.
 * - **Anything else wanted** (the figure is hit, falls, starts another action) **interrupts** at once with a short crossfade and starts that row from its first clip.
 *
 * `want` is **edge-triggered**: it compares the key with the last one it was given, so a presenter that keeps showing the `attack` pose after the clip has played does not restart it every frame. A key the
 * actor has no row for plays as idle (the table has no defend for Evrae).
 *
 * ## Landing the strike
 *
 * The presenter strikes on its own clock: the lunge reaches its apex a fraction of a second after the action opens and the blow lands there, long before a leap and slash that takes 0.7 s has played.
 * `want(key, { lead })` says how many seconds remain until the blow lands; for a row with a contact frame the sequence starts that far before it, sped up at most {@link MAX_SCALE} times (and at 1 when there
 * is time to spare), so the strike lands with the hit. Without a lead, or a contact frame, the row plays from its start at its own speed.
 *
 * Pure: no `three`, no DOM. Game case: FFX only.
 */

import type { ClipRow, RowKey } from './clipMap.ts';

/** One clip to put on the actor. */
export interface PlayCommand {
  readonly key: RowKey;
  /** The step's index in the row. */
  readonly step: number;
  readonly clip: string;
  /** True for a hold or the idle: the clip loops. */
  readonly loop: boolean;
  /** Seconds to crossfade into it from whatever is playing; 0 for the very first. */
  readonly fade: number;
  /** The frame of the clip to start at (0, or part-way in to land a strike). */
  readonly startFrame: number;
  /** The speed of the clip, on top of the presenter's pace. */
  readonly scale: number;
}

/** How long a crossfade into each row takes, seconds; the default is {@link DEFAULT_FADE}. `[ours]`: a presentation choice, no game number. */
export const FADES: Readonly<Record<RowKey, number>> = { idle: 0.2, hurt: 0.06, attack: 0.1, ko: 0.12, victory: 0.2 };
export const DEFAULT_FADE = 0.12;
/** The crossfade from one clip of a sequence to the next. */
export const STEP_FADE = 0.08;
/** The most a clip is sped up to land its strike with the hit. `[ours]`. */
export const MAX_SCALE = 1.8;
/**
 * Rows that play in about this many seconds whatever their length: the presenter's flinch is a third of a second and a hit reaction that takes one second or two (Evrae's) would still be mid-way when
 * the next blow lands. Never slower than the clip, never more than {@link MAX_SCALE_SHORT} times faster. `[ours]`.
 */
export const PLAN_SECONDS: Readonly<Record<RowKey, number>> = { hurt: 0.5 };
export const MAX_SCALE_SHORT = 3;

/** What a sequencer reports of itself (a test's and the debug view's read). */
export interface SequencerState {
  readonly key: RowKey;
  readonly step: number;
  readonly wanted: RowKey;
  /** True while the row's hold is the clip playing. */
  readonly holding: boolean;
}

/** The index of a row's hold: its first looping clip that is not the last. -1 for a finite or a terminal row. */
export function holdIndexOf(row: ClipRow): number {
  const last = row.steps.length - 1;
  return row.steps.findIndex((s, i) => s.loop && i < last);
}

/** A row whose last clip loops: it holds there. */
export const isTerminal = (row: ClipRow): boolean => row.steps[row.steps.length - 1]!.loop;

/** Where a frame counted from the start of a row lies: the step and the frame within it. A frame past the end is the last frame of the last step. */
export function locateFrame(row: ClipRow, frame: number): { step: number; frame: number } {
  let from = 0;
  for (let i = 0; i < row.steps.length; i++) {
    const frames = row.steps[i]!.frames;
    if (frame < from + frames) return { step: i, frame: Math.max(0, Math.floor(frame - from)) };
    from += frames;
  }
  const last = row.steps.length - 1;
  return { step: last, frame: Math.max(0, row.steps[last]!.frames - 1) };
}

export class ClipSequencer {
  private key: RowKey = 'idle';
  private step = 0;
  private wanted: RowKey = 'idle';
  private released = false;
  private idleWanted = false;
  private scale = 1;

  constructor(
    private readonly rows: Readonly<Record<RowKey, ClipRow>>,
    private readonly fps = 30,
  ) {}

  get state(): SequencerState {
    const row = this.rows[this.key]!;
    return { key: this.key, step: this.step, wanted: this.wanted, holding: this.step === holdIndexOf(row) };
  }

  /** The first clip: the idle loop, with no crossfade (a model starts standing). */
  start(): PlayCommand {
    this.key = 'idle';
    this.step = 0;
    this.wanted = 'idle';
    return this.command(0, 'idle', 0);
  }

  /**
   * The actor should now be showing `key`. Returns the clip to put on it, or null. A repeat of the last key is nothing (see the file header). `align.lead`: seconds until the strike lands.
   */
  want(key: RowKey, align?: { readonly lead: number }): PlayCommand | null {
    if (key === this.wanted) return null;
    this.wanted = key;
    const row = this.rows[key];
    if (key === 'idle' || !row) return this.wantIdle();
    return this.begin(key, row, align);
  }

  /** Take `key` as already seen without playing anything: the pose that is up when a flight ends is what it was, not a new action. */
  acknowledge(key: RowKey): void {
    this.wanted = key;
  }

  /** The clip that was playing has finished: the next one, or the idle when the row is done. Null for a loop (a hold, a terminal row's last clip, the idle), which does not finish: a hold is left by {@link release}. */
  ended(): PlayCommand | null {
    const row = this.rows[this.key];
    if (!row || this.key === 'idle' || row.steps[this.step]!.loop) return null;
    return this.advance(row);
  }

  /** The effect has landed: leave the hold (play what follows it); if the row has not reached its hold yet, skip it when it comes. Null when there is nothing to leave. */
  release(): PlayCommand | null {
    const row = this.rows[this.key];
    if (!row || this.key === 'idle') return null;
    this.released = true;
    return this.step === holdIndexOf(row) ? this.advance(row) : null;
  }

  // ----------------------------------------------------------------------------------------- internals

  private wantIdle(): PlayCommand | null {
    const row = this.rows[this.key];
    if (!row || this.key === 'idle') return null;
    this.idleWanted = true;
    if (isTerminal(row)) return this.settle(); // a fallen or celebrating figure is told to stand again
    return this.step === holdIndexOf(row) && !this.released ? this.release() : null; // a hold is over; anything else plays out and then settles
  }

  /** The step after the current one: holds that are not wanted are skipped, and past the last the actor settles. */
  private advance(row: ClipRow): PlayCommand {
    const last = row.steps.length - 1;
    let next = this.step + 1;
    while (next < last && row.steps[next]!.loop && (this.released || this.idleWanted)) next++; // a hold that is not wanted is skipped
    if (next > last) return this.settle();
    this.step = next;
    return this.command(next, this.key, STEP_FADE);
  }

  /** Back to the idle loop. */
  private settle(): PlayCommand {
    this.key = 'idle';
    this.step = 0;
    this.released = false;
    this.idleWanted = false;
    this.scale = 1;
    return this.command(0, 'idle', FADES['idle'] ?? DEFAULT_FADE);
  }

  /** Start `key`'s row from its first clip, or part-way in to land the strike on the hit. */
  private begin(key: RowKey, row: ClipRow, align?: { readonly lead: number }): PlayCommand {
    this.key = key;
    this.released = false;
    this.idleWanted = false;
    this.scale = 1;
    let step = 0;
    let startFrame = 0;
    const lead = align?.lead;
    if (row.contact !== null && lead !== undefined && lead > 0) {
      const toContact = row.contact / this.fps; // seconds the row takes to its strike at its own speed
      this.scale = Math.min(MAX_SCALE, Math.max(1, toContact / lead));
      const at = locateFrame(row, Math.max(0, row.contact - lead * this.fps * this.scale));
      step = at.step;
      startFrame = at.frame;
    } else {
      const total = row.steps.reduce((sum, s) => sum + s.frames, 0) / this.fps;
      const wanted = PLAN_SECONDS[key];
      if (wanted !== undefined && total > wanted) this.scale = Math.min(MAX_SCALE_SHORT, total / wanted);
    }
    this.step = step;
    return this.command(step, key, FADES[key] ?? DEFAULT_FADE, startFrame);
  }

  private command(step: number, key: RowKey, fade: number, startFrame = 0): PlayCommand {
    const s = this.rows[key]!.steps[step]!;
    return { key, step, clip: s.clip, loop: s.loop, fade, startFrame, scale: key === 'idle' ? 1 : this.scale };
  }
}
