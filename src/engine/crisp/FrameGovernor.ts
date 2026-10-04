/**
 * The frame-time governor of the sharpness ladder (release 39; both games, shared plumbing). Pure: it is handed a clock reading
 * once per drawn frame and answers which rung the frame should be drawn on; nothing here touches the GPU or the DOM.
 *
 * A device starts on the rung its class allows (`CrispConfig.startRung`: F plus on a discrete GPU, F on an integrated one, A2 on a
 * software renderer) and may only go DOWN the ladder, never back up, so a frame never changes its look twice in a way the player can
 * notice and a device never oscillates between two rungs. While it draws, the governor collects the interval between frames
 * (the time from one drawn frame to the next, the number the player feels); once a window of about two seconds holds enough of them
 * it takes their MEDIAN, and a median above the budget means the current rung costs more than this device can pay: it steps down one
 * rung and starts a fresh window after a short hold (the step itself, a new pass and new buffers, costs a hitch that must not be read as slowness).
 *
 * Why the interval and not the cost of the render call: a render call returns long before the GPU is done with it, so only the
 * interval between frames shows a GPU that cannot keep up, and it is the one clock every browser has.
 *
 * Why the median: a load stall, a garbage collection, a hidden tab coming back (one interval of seconds) must not cost a
 * player the sharper frame; a window in which most frames are late is a device that cannot hold the rung.
 *
 * Why this budget ({@link FRAME_BUDGET_MS}, 22 ms, about 45 frames a second): an interval cannot show GPU headroom on a display that
 * waits for its refresh, so the question is only "does the device hold the display's rate?". A 60 Hz display that is held shows
 * 16.7 ms intervals, a 50 Hz one 20 ms, a 144 Hz one 6.9 ms; one that is missed every other frame shows 33 ms. 22 ms clears every held
 * display with margin and fails a device that has dropped to half rate. (A cost-per-frame figure such as 12 ms of GPU work cannot be
 * read from a browser without a timer extension only Chromium offers; the interval is the portable reading.) The budget can be set
 * from the address for a capture (`?crispbudget=<ms>`).
 *
 * Holds: the governor ignores samples while the scene is new (art decodes and shader compiles land in the first seconds of a
 * battle), while the window is being resized, and for a moment after it has stepped.
 */

import { LADDER, stepDownFrom, type GovernedRung } from './CrispConfig.ts';

/** The median frame interval over a window above which a rung is too expensive, ms. */
export const FRAME_BUDGET_MS = 22;
/** The window the median is taken over, ms. */
export const WINDOW_MS = 2000;
/** The fewest intervals a window must hold before its median counts (the window waits for them). */
export const MIN_SAMPLES = 12;
/** How long samples are ignored after a new scene, a resize or a step, ms. */
export const HOLD_SCENE_MS = 2000;
export const HOLD_RESIZE_MS = 1000;
export const HOLD_STEP_MS = 1000;

export interface GovernorOptions {
  budgetMs?: number;
  windowMs?: number;
  minSamples?: number;
}

/** One finished window, for the report and the proofs. */
export interface GovernorWindow {
  rung: GovernedRung;
  median: number;
  samples: number;
  /** True when this window stepped the rung down. */
  stepped: boolean;
}

export function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid]! : (v[mid - 1]! + v[mid]!) / 2;
}

export class FrameGovernor {
  private current: GovernedRung;
  private readonly budget: number;
  private readonly windowMs: number;
  private readonly minSamples: number;
  private samples: number[] = [];
  private windowStart = 0;
  private last: number | null = null;
  private holdUntil = 0;
  /** The windows decided so far, newest last (kept short: a report, not a log). */
  readonly windows: GovernorWindow[] = [];

  constructor(start: GovernedRung, opts: GovernorOptions = {}) {
    this.current = LADDER.includes(start) ? start : 'a2';
    this.budget = opts.budgetMs ?? FRAME_BUDGET_MS;
    this.windowMs = opts.windowMs ?? WINDOW_MS;
    this.minSamples = opts.minSamples ?? MIN_SAMPLES;
  }

  get rung(): GovernedRung {
    return this.current;
  }

  get budgetMs(): number {
    return this.budget;
  }

  /** Intervals collected in the open window. */
  get pending(): number {
    return this.samples.length;
  }

  /** Ignore samples until `now + ms` and start the window again (a new scene, a resize). A longer hold already running stays. */
  hold(now: number, ms: number): void {
    this.holdUntil = Math.max(this.holdUntil, now + ms);
    this.samples = [];
    this.windowStart = this.holdUntil;
  }

  /**
   * One drawn frame at clock reading `now` (ms, monotonic); `extra` adds that many milliseconds to the interval (a capture's
   * simulated slow frame, `__pyrefly.crisp.simulate`). Returns the rung to step down to when this frame closed a window over
   * budget, else null.
   */
  frame(now: number, extra = 0): GovernedRung | null {
    const prev = this.last;
    this.last = now;
    if (prev === null) {
      this.windowStart = Math.max(this.windowStart, now); // the first frame opens the first window
      return null;
    }
    if (now < this.holdUntil) return null;
    this.samples.push(Math.max(0, now - prev) + extra);
    if (now - this.windowStart < this.windowMs || this.samples.length < this.minSamples) return null;
    const m = median(this.samples);
    const next = m > this.budget ? stepDownFrom(this.current) : null;
    this.windows.push({ rung: this.current, median: Math.round(m * 100) / 100, samples: this.samples.length, stepped: next !== null });
    if (this.windows.length > 16) this.windows.shift();
    this.samples = [];
    this.windowStart = now;
    if (next === null) return null;
    this.current = next;
    this.hold(now, HOLD_STEP_MS);
    return next;
  }

  /** Where the governor stands, for the debug report. */
  stats(): { rung: GovernedRung; budgetMs: number; pending: number; windows: GovernorWindow[] } {
    return { rung: this.current, budgetMs: this.budget, pending: this.samples.length, windows: [...this.windows] };
  }
}
