/**
 * THE EFFECTS' FRAME-TIME GUARD (motion pass, lane "fx"; Bailey 2026-10-22: perf guard "Trim particles first"). Pure: it is handed one frame interval at a time (`SpellFxLayer.render`)
 * and answers how much of the new effects to draw and whether the 3D scene should be drawn a little smaller. Nothing here touches the GPU or the DOM.
 *
 * What it watches: the interval between drawn frames WHILE an effect is on screen, as a rolling trimmed mean over the last {@link WINDOW} such frames, against the display's own
 * calm interval (the median of the frames drawn with no effect up: 8.3 ms on a 120 Hz screen, 16.7 ms on a 60 Hz one). It is relative on purpose: a budget of 8 ms would fail every
 * 60 Hz display, and 18 ms would never notice a 120 Hz one dropping to 70 fps. Over budget = the mean is both {@link RATIO} times the calm interval and {@link ABSOLUTE_MS} above it.
 *
 * What it does, in the order Bailey picked: first it THINS the particles and the trails (level 1: three quarters of the particles, half the trails; level 2: half the particles, no trails),
 * one step per full window that is still over; if level 2 is still over for another window it asks for the 3D render scale to come down by a step (0.9, then 0.8 at most; the
 * supersampled sharpness rungs only, `CrispRig.setScaleCut`), which STAYS for the battle (a render-target resize is a hitch: it must not repeat per spell). The thinning gives
 * the particles back, one level at a time, after {@link RECOVER} calm effect frames.
 *
 * A stall (a tab coming back, a shader compile: one interval over {@link STALL_MS}) is not a reading. Deterministic: no clock, no `Math.random`.
 */

/** Effect frames in the rolling window (about 0.4 s at 120 Hz, 0.8 s at 60 Hz). */
export const WINDOW = 48;
/** Calm frames to remember for the display's interval. */
export const CALM_FRAMES = 90;
/** The fewest calm frames before the display's interval is trusted. */
export const CALM_MIN = 24;
/** The mean must exceed the calm interval by this factor ... */
export const RATIO = 1.25;
/** ... and by this many milliseconds. */
export const ABSOLUTE_MS = 1.2;
/** Frames to wait after a step before the next one may fire. */
export const HOLD = 36;
/** Effect frames under budget before one level of thinning is given back. */
export const RECOVER = 150;
/** An interval above this is a stall, not a reading. */
export const STALL_MS = 250;
/** Used until the calm interval is known: tolerant of a 60 Hz display. */
export const FALLBACK_BUDGET_MS = 19;

/** What each thinning level draws: the share of the particles and of the trails. */
export const THIN_LEVELS: ReadonlyArray<{ particles: number; trails: number }> = [
  { particles: 1, trails: 1 },
  { particles: 0.75, trails: 0.5 },
  { particles: 0.5, trails: 0 },
];

/**
 * The guard's present share, for the effects that are not drawn in the spell layer's batch (the item toss's sprites, `fx/ItemOrbFlourish.ts`). The layer writes it every frame while the new
 * effects are on; it is 1 and 1 otherwise.
 */
export const fxShare = { particles: 1, trails: 1 };

/** The 3D render scale's steps (a multiplier on the supersample factor). */
export const SCALE_STEPS: readonly number[] = [1, 0.9, 0.8];

function median(v: readonly number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** The mean of the middle of a window: the highest tenth (a hitch) is left out. */
export function trimmedMean(v: readonly number[]): number {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b);
  const keep = Math.max(1, Math.floor(s.length * 0.9));
  let sum = 0;
  for (let i = 0; i < keep; i++) sum += s[i]!;
  return sum / keep;
}

export class FxPerfGuard {
  private readonly calm: number[] = [];
  private readonly busy: number[] = [];
  private thin = 0;
  private cut = 0;
  private sinceStep = 0;
  private underFrames = 0;
  private stepped = 0;

  /** The thinning level now (0 = nothing trimmed, 2 = the most). */
  get level(): number {
    return this.thin;
  }

  /** The share of the particles and of the trails to draw. */
  get share(): { particles: number; trails: number } {
    return THIN_LEVELS[this.thin]!;
  }

  /** The 3D render scale step asked for (0 = untouched); only ever goes up. */
  get scaleStep(): number {
    return this.cut;
  }

  /** The multiplier on the 3D render scale for {@link scaleStep}. */
  get scaleFactor(): number {
    return SCALE_STEPS[this.cut]!;
  }

  /** The display's calm interval, ms, or null before enough calm frames were seen. */
  get calmMs(): number | null {
    return this.calm.length >= CALM_MIN ? median(this.calm) : null;
  }

  /** The budget the busy frames are held to, ms. */
  get budgetMs(): number {
    const c = this.calmMs;
    return c === null ? FALLBACK_BUDGET_MS : Math.max(c * RATIO, c + ABSOLUTE_MS);
  }

  /** The rolling trimmed mean of the busy frames, ms (0 with none). */
  get busyMs(): number {
    return trimmedMean(this.busy);
  }

  /**
   * One drawn frame: `dtMs` since the last, `busyNow` whether an effect was on screen in it. Returns true when the level or the scale step changed.
   */
  frame(dtMs: number, busyNow: boolean): boolean {
    if (!Number.isFinite(dtMs) || dtMs < 0.5 || dtMs > STALL_MS) return false;
    if (!busyNow) {
      this.calm.push(dtMs);
      if (this.calm.length > CALM_FRAMES) this.calm.shift();
      this.busy.length = 0; // the window is of consecutive busy frames
      this.underFrames = 0;
      return false;
    }
    this.busy.push(dtMs);
    if (this.busy.length > WINDOW) this.busy.shift();
    this.sinceStep++;
    if (this.busy.length < WINDOW) return false;
    const mean = trimmedMean(this.busy);
    if (mean > this.budgetMs) {
      this.underFrames = 0;
      if (this.sinceStep < HOLD) return false;
      this.sinceStep = 0;
      this.busy.length = 0;
      if (this.thin < THIN_LEVELS.length - 1) {
        this.thin++;
        this.stepped++;
        return true;
      }
      if (this.cut < SCALE_STEPS.length - 1) {
        this.cut++;
        this.stepped++;
        return true;
      }
      return false;
    }
    if (this.thin > 0 && mean <= (this.calmMs ?? this.budgetMs) * 1.08 + 0.4 && ++this.underFrames >= RECOVER) {
      this.underFrames = 0;
      this.thin--;
      return true;
    }
    return false;
  }

  /** Where the guard stands, for the debug report and the captures. */
  stats(): { level: number; scaleStep: number; calmMs: number | null; budgetMs: number; busyMs: number; steps: number } {
    const r = (v: number): number => Math.round(v * 100) / 100;
    const c = this.calmMs;
    return { level: this.thin, scaleStep: this.cut, calmMs: c === null ? null : r(c), budgetMs: r(this.budgetMs), busyMs: r(this.busyMs), steps: this.stepped };
  }

  /** Forget everything but the sticky scale step (a new battle starts fresh; the scale cut is cleared with `reset(true)`). */
  reset(clearScale = false): void {
    this.calm.length = 0;
    this.busy.length = 0;
    this.thin = 0;
    this.sinceStep = 0;
    this.underFrames = 0;
    if (clearScale) this.cut = 0;
  }
}
