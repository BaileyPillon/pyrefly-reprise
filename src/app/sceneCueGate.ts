/**
 * The opening scene's cue goes down the pipe first (r46-scenecue; both games, shared loading plumbing).
 *
 * Live check LV43-2 (7b2582e7): the chapter's scene bed was playing at the first spoken line in 2 of 15 runs, because at the
 * card confirm everything a run needs starts at once (the scene cue, the boss and victory cues, the SFX parity packs, the
 * battle's art) and shares one link. Fetch priority is not the lever (Chromium's `fetch()` default is already High and the link
 * is shared whatever the priority), so the lever is the ORDER of what the confirm starts: the opening cue alone first, the rest
 * once its response has arrived or failed, or after a short cap so a link that never answers cannot stall the rest.
 *
 * This file is the gate that holds "the rest". It plays nothing and fetches nothing itself: `AudioManager.warmMusic` settles it,
 * `sfxChapter` and `GameFlow.playChapter` run their deferred starts through {@link SceneCueGate.after}.
 *
 * A run gets no gate (so every start is immediate, exactly as before this change) when: the switch is not on (OFF by default, see
 * {@link SCENE_CUE_DEFAULT_ON}; `?scenecue=on` or `?scenecue=<capMs>` turns it on),
 * cutscenes are skipped, the chapter's opening scene asks for no cue at its first line (Chapter I opens with silence), or the
 * mixer will not fetch one (audio still locked, the synth-only build, sound switched off, the cue already decoded, no rendered
 * file for it).
 */

import { audio } from '../audio/index.ts';
import type { WarmGate } from '../audio/MusicWarm.ts';
import type { Chapter } from '../data/encounters.ts';
import { openingSceneCue } from './openingSceneCue.ts';

/** How long the rest of the run waits for the opening cue before it starts anyway (ms). */
export const SCENE_CUE_CAP_MS = 4000;

/**
 * Is the ordering on when the page address says nothing? NO: the measurements did not earn it (docs/handoff/r46-scenecue.md). On the
 * 18 Mbit/s link, with the gate as built, the cue arrived as late as without it (Chapter II fast 10.4 s against 10.0 to 10.7 s, Chapter IV
 * 13.7 against 13.5), because what competes with it (the party prep's art, the card's backdrops, the unlock-time audio) is not what the
 * gate holds, and 2 of 30 runs with it on never reached a first line (party prep 9 to 15 s late), against 0 of 60 without. Off by default,
 * kept behind `?scenecue=on` so the next experiment starts from a tested gate.
 */
export const SCENE_CUE_DEFAULT_ON = false;

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}
const realTimers: Timers = { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };

/** How a gate came to open, for the tests and the debug overlay. */
export type GateOpenedBy = 'arrived' | 'cap' | 'cancelled';

export class SceneCueGate implements WarmGate {
  readonly opened: Promise<void>;
  private resolveOpened: () => void = () => undefined;
  private state: 'waiting' | 'open' | 'cancelled' = 'waiting';
  private by: GateOpenedBy | null = null;
  private deferred: Array<() => void> = [];
  private timer: unknown;

  constructor(
    readonly capMs: number = SCENE_CUE_CAP_MS,
    private readonly timers: Timers = realTimers,
  ) {
    this.opened = new Promise<void>((resolve) => {
      this.resolveOpened = resolve;
    });
    this.timer = this.timers.set(() => this.open('cap'), this.capMs);
  }

  /** Open: the cue's response has arrived or failed, or there was nothing to fetch. Idempotent. */
  settle(): void {
    this.open('arrived');
  }

  /** Run `start` now when the gate is open, else when it opens (in the order asked). A cancelled gate never runs it. */
  after(start: () => void): void {
    if (this.state === 'open') this.run(start);
    else if (this.state === 'waiting') this.deferred.push(start);
  }

  /** The run ended before the gate opened: drop every deferred start (nobody needs a battle's art now). Idempotent. */
  cancel(): void {
    if (this.state !== 'waiting') return;
    this.state = 'cancelled';
    this.by = 'cancelled';
    this.timers.clear(this.timer);
    this.deferred = [];
    this.resolveOpened(); // a warm waiting on the cue goes on as it always did
  }

  get isOpen(): boolean {
    return this.state === 'open';
  }

  get openedBy(): GateOpenedBy | null {
    return this.by;
  }

  private open(by: GateOpenedBy): void {
    if (this.state !== 'waiting') return;
    this.state = 'open';
    this.by = by;
    this.timers.clear(this.timer);
    this.resolveOpened();
    const starts = this.deferred;
    this.deferred = [];
    for (const start of starts) this.run(start);
  }

  private run(start: () => void): void {
    try {
      start();
    } catch {
      /* a deferred start is a favour to the player, never a failure; the next one still runs */
    }
  }
}

/** What the page address says about the ordering: `?scenecue=off`, `?scenecue=on`, or `?scenecue=<capMs>` (on, with that cap). */
export function sceneCueSwitch(search: string, defaultOn: boolean = SCENE_CUE_DEFAULT_ON): { on: boolean; capMs: number } {
  const value = new URLSearchParams(search).get('scenecue');
  if (value === 'off') return { on: false, capMs: SCENE_CUE_CAP_MS };
  if (value === 'on') return { on: true, capMs: SCENE_CUE_CAP_MS };
  const ms = value !== null && /^\d{1,6}$/.test(value) ? Number(value) : NaN;
  if (Number.isFinite(ms)) return { on: true, capMs: ms };
  return { on: defaultOn, capMs: SCENE_CUE_CAP_MS };
}

/**
 * The gate for a run of `chapter`, or `null` for "start everything at once, as before". `skipCutscenes` is an automated run
 * that shows no opening scene. The pre-check asks the mixer, synchronously, whether a first fetch will really happen.
 */
export function sceneCueGateFor(
  chapter: Chapter,
  opts: { skipCutscenes?: boolean },
  search: string = typeof location === 'undefined' ? '' : location.search,
): SceneCueGate | null {
  const mode = sceneCueSwitch(search);
  if (!mode.on || opts.skipCutscenes) return null;
  const cue = openingSceneCue(chapter);
  if (!cue || !audio.needsFirstFetch(cue)) return null;
  return new SceneCueGate(mode.capMs);
}
