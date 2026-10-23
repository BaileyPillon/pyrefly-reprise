/**
 * THE FRAME-BUDGET GOVERNOR of the conference demo's conditional extras (lane "perf-trim", 2026-10-23; Bailey 2026-10-23, item 195c: trim the frame cost of the integrated build so a 120 Hz
 * screen does not stutter, "a soft background if the frame rate holds"). Pure: it is handed one frame interval at a time and answers how much of each extra to draw this frame. No DOM, no `three`,
 * no clock of its own, no `Math.random`: the same intervals give the same answers (layering rule 1). Both games (shared plumbing); the host acts only in the two demo chapters with a pro lane on.
 *
 * What it watches: the interval between drawn frames, as the 95th percentile over a rolling window of about two seconds, against the display's budget (8.33 ms on a 120 Hz screen; the host passes
 * the display's own calm interval when it knows one). A display that waits for its refresh shows only whole intervals (8.3, then 16.7 ms), so "p95 over the budget" means one frame in twenty
 * or more missed the refresh, which is the stutter the player sees.
 *
 * What it does, in the order Bailey picked (the most expensive extra first, the look kept for last):
 *   level 1  the camera's soft background off      (`soft`: 1 -> 0)
 *   level 2  the particles halved                  (`particles`: 1 -> 0.5: ink drops, sparks, motes)
 *   level 3  the scene drawn a little smaller  (`heavy`: 1 -> 0.8, the supersample's multiplier: the biggest pass of the frame, `CrispRig.setGovernorCut`)
 * A step from rest happens when a full window is over budget; the next ones need half a window of fresh evidence each (the step itself must not be read as slowness: its own hitch is held out). Every lever MOVES toward its target at a bounded
 * rate (`fadeMs` for its whole range), so no step is a pop: the host reads the lever values, never the level. `heavy` is the exception that cannot fade (a render target's size is a size, one resize and no more): it is
 * given as its target and the host switches when the other two levers have settled.
 *
 * Recovery: when the window has been inside the budget (with a margin) for `recoverAfterMs`, one level is given back. A display that waits for its refresh cannot show headroom (a held 8.3 ms
 * looks the same whether the frame cost 3 ms or 8), so a recovery is a probe: if the governor steps down again within `probeMs`, the wait before the next probe doubles (up to `maxRecoverMs`),
 * so a machine that truly cannot hold the full look settles on the reduced one and stops probing, and a machine that merely had a busy moment gets the full look back.
 *
 * It never turns on what the player's settings turned off: its levers are multipliers (1 = untouched), and the host multiplies them into values REDUCE MOTION and LOW EFFECTS already set.
 */

export type GovernorLevel = 0 | 1 | 2 | 3;

export interface GovernorOptions {
  /** The display's budget, ms (8.33 = 120 Hz). */
  budgetMs?: number;
  /** The rolling window, ms. */
  windowMs?: number;
  /** The fewest intervals a window must hold before it counts. */
  minSamples?: number;
  /** Over budget = p95 above `budget * overTol`. */
  overTol?: number;
  /** Inside budget = p95 at or below `budget * underTol` (the margin a recovery needs). */
  underTol?: number;
  /** How long a lever takes to travel its whole range, ms. */
  fadeMs?: number;
  /** Clean time before the first recovery probe, ms. */
  recoverAfterMs?: number;
  /** A step down within this long of a recovery is a failed probe, ms. */
  probeMs?: number;
  /** The wait before a recovery probe never grows past this, ms. */
  maxRecoverMs?: number;
}

export const DEFAULTS: Required<GovernorOptions> = {
  budgetMs: 8.33,
  windowMs: 2000,
  minSamples: 60,
  overTol: 1.2,
  underTol: 1.08,
  fadeMs: 450,
  recoverAfterMs: 8000,
  probeMs: 6000,
  maxRecoverMs: 96000,
};

/** An interval above this is a stall (a tab coming back, a shader compile), not a reading. */
export const STALL_MS = 250;
/** The window is judged at most this often, ms. */
export const JUDGE_EVERY_MS = 250;

/** The share of each lever at each level: where the lever is heading. */
export const LEVEL_TARGETS: ReadonlyArray<{ soft: number; particles: number; heavy: number }> = [
  { soft: 1, particles: 1, heavy: 1 },
  { soft: 0, particles: 1, heavy: 1 },
  { soft: 0, particles: 0.5, heavy: 1 },
  { soft: 0, particles: 0.5, heavy: 0.8 },
];

export interface GovernorPlan {
  level: GovernorLevel;
  /** The camera's soft background weight: multiply the shot's weight by it (1 = as directed, 0 = off). */
  soft: number;
  /** The share of the particles to draw (1 = all). */
  particles: number;
  /** The multiplier on the scene's supersample (1 = as the sharpness rung says, 0.8 = a fifth smaller each way, about a third fewer pixels in the biggest pass). Switched by the host once `soft` and `particles` are at rest. */
  heavy: 0.8 | 1;
  /** True while a lever is still moving. */
  fading: boolean;
}

export function percentile(sorted: ArrayLike<number>, n: number, p: number): number {
  if (n <= 0) return 0;
  return sorted[Math.min(n - 1, Math.floor(n * p))]!;
}

export class FrameBudgetGovernor {
  private readonly o: Required<GovernorOptions>;
  // the window: a ring of (time, interval)
  private readonly ts: Float64Array;
  private readonly iv: Float64Array;
  private head = 0;
  private count = 0;
  private readonly scratch: Float64Array;
  private level: GovernorLevel = 0;
  private soft = 1;
  private particles = 1;
  private lastNow = -1;
  private nextJudge = 0;
  private holdUntil = 0;
  private cleanSince = -1;
  /** A level held by hand (captures, the cost harness): the window is still read but never steps. */
  private pinned: GovernorLevel | null = null;
  private recoverWait: number;
  private lastRecoverAt = -1e12;
  private last: { p95: number; samples: number; over: boolean; under: boolean } = { p95: 0, samples: 0, over: false, under: false };
  /** Steps taken so far, for the report: [time, from, to]. Kept short. */
  readonly log: Array<[number, GovernorLevel, GovernorLevel]> = [];

  constructor(opts: GovernorOptions = {}) {
    this.o = { ...DEFAULTS, ...opts };
    const cap = 2048; // 2 s at 1000 Hz is more than any display
    this.ts = new Float64Array(cap);
    this.iv = new Float64Array(cap);
    this.scratch = new Float64Array(cap);
    this.recoverWait = this.o.recoverAfterMs;
  }

  /** The budget now, ms. */
  get budgetMs(): number {
    return this.o.budgetMs;
  }

  /** The host learnt the display's own interval (the calm frames' median): the budget follows it. */
  setBudget(ms: number): void {
    if (Number.isFinite(ms) && ms >= 4 && ms <= 34) this.o.budgetMs = ms;
  }

  /** The level now. */
  get current(): GovernorLevel {
    return this.level;
  }

  /** Hold the governor at `level` (the levers fade there) until `pin(null)`: a capture, the cost harness. */
  pin(level: GovernorLevel | null): void {
    this.pinned = level;
    if (level !== null && level !== this.level) {
      this.level = level;
      this.count = 0;
      this.head = 0;
      this.cleanSince = -1;
    }
  }

  /** What the last judgement saw, for the report. */
  get lastJudgement(): Readonly<{ p95: number; samples: number; over: boolean; under: boolean }> {
    return this.last;
  }

  /** Start again at full (a new fight, a resize, a switch flipped): the window and the holds are emptied, the levers stay where they are and fade. */
  reset(now: number, holdMs = 0): void {
    this.head = 0;
    this.count = 0;
    this.lastNow = -1;
    this.cleanSince = -1;
    this.holdUntil = now + holdMs;
    this.nextJudge = now + holdMs + JUDGE_EVERY_MS;
  }

  /** Drop to level 0 now (the lanes were switched off): the levers fade back to 1. */
  release(now: number): void {
    if (this.level !== 0) this.log.push([now, this.level, 0]);
    this.level = 0;
    this.cleanSince = -1;
    this.recoverWait = this.o.recoverAfterMs;
    this.count = 0; // the readings of the reduced look say nothing about the full one
    this.head = 0;
    this.lastNow = -1;
    this.nextJudge = now + JUDGE_EVERY_MS;
  }

  /** Hold the judgement until `now + ms` (a new scene, a resize, a menu opening: not a reading of the device). */
  hold(now: number, ms: number): void {
    this.holdUntil = Math.max(this.holdUntil, now + ms);
    this.count = 0;
    this.head = 0;
    this.lastNow = -1;
    this.cleanSince = -1;
  }

  /**
   * One drawn frame at clock reading `now` (ms, monotonic). Returns the plan for this frame. The interval to the previous call is the reading; the first call, a stall and a frame inside a hold
   * are not readings.
   */
  frame(now: number): GovernorPlan {
    const prev = this.lastNow;
    this.lastNow = now;
    const dt = prev < 0 ? 0 : now - prev;
    if (prev >= 0 && dt > 0 && dt <= STALL_MS && now >= this.holdUntil) {
      const cap = this.ts.length;
      this.ts[this.head] = now;
      this.iv[this.head] = dt;
      this.head = (this.head + 1) % cap;
      if (this.count < cap) this.count++;
      this.judge(now);
    }
    this.fade(dt);
    return this.plan();
  }

  private judge(now: number): void {
    if (now < this.nextJudge) return;
    this.nextJudge = now + JUDGE_EVERY_MS;
    // drop what fell out of the window; the oldest first
    const cap = this.ts.length;
    while (this.count > 0) {
      const oldest = (this.head - this.count + cap) % cap;
      if (now - this.ts[oldest]! <= this.o.windowMs) break;
      this.count--;
    }
    // Already in trouble (a level is taken): the next level needs half the evidence, a second and not two, because the measured savings are in the last level (the scene's size) and a stutter
    // should not be sat through for four seconds on the way to it. From rest a full window is needed (a hitch is not a trend).
    const inTrouble = this.level > 0;
    const needMs = inTrouble ? this.o.windowMs * 0.5 : this.o.windowMs;
    if (this.count < (inTrouble ? Math.floor(this.o.minSamples / 2) : this.o.minSamples)) return;
    const oldestIdx = (this.head - this.count + cap) % cap;
    if (now - this.ts[oldestIdx]! < needMs * 0.9) return; // a window is a full window
    const n = this.count;
    for (let i = 0; i < n; i++) this.scratch[i] = this.iv[(oldestIdx + i) % cap]!;
    const sorted = this.scratch.subarray(0, n).sort();
    const p95 = percentile(sorted, n, 0.95);
    const over = p95 > this.o.budgetMs * this.o.overTol;
    const under = p95 <= this.o.budgetMs * this.o.underTol;
    this.last = { p95, samples: n, over, under };
    if (this.pinned !== null) return;
    if (over) {
      this.cleanSince = -1;
      if (this.level < 3) this.step(now, 1);
      return;
    }
    if (!under) {
      this.cleanSince = -1;
      return;
    }
    if (this.cleanSince < 0) this.cleanSince = now;
    if (this.level > 0 && now - this.cleanSince >= this.recoverWait) this.step(now, -1);
  }

  private step(now: number, dir: 1 | -1): void {
    const from = this.level;
    const to = (from + dir) as GovernorLevel;
    if (dir === 1) {
      // a step down soon after a recovery: the probe failed, the next one waits twice as long
      if (now - this.lastRecoverAt < this.o.probeMs) this.recoverWait = Math.min(this.o.maxRecoverMs, this.recoverWait * 2);
    } else {
      this.lastRecoverAt = now;
    }
    this.level = to;
    this.log.push([now, from, to]);
    if (this.log.length > 24) this.log.shift();
    // a full fresh window of evidence before the next step in either direction
    this.count = 0;
    this.head = 0;
    this.cleanSince = -1;
    this.holdUntil = now + 300; // the step's own hitch (a new buffer) is not a reading
  }

  private fade(dtMs: number): void {
    if (dtMs <= 0) return;
    const t = LEVEL_TARGETS[this.level]!;
    const stepAmt = Math.min(1, dtMs / this.o.fadeMs);
    this.soft = approach(this.soft, t.soft, stepAmt * 1); // the soft background's range is 1
    this.particles = approach(this.particles, t.particles, stepAmt * 0.5); // the particles' range is 0.5
  }

  private plan(): GovernorPlan {
    const t = LEVEL_TARGETS[this.level]!;
    const settled = this.soft === t.soft && this.particles === t.particles;
    return {
      level: this.level,
      soft: this.soft,
      particles: this.particles,
      // half resolution is asked for only when the level wants it AND the other levers have arrived; full resolution comes back as soon as the level does
      heavy: t.heavy < 1 && settled ? 0.8 : 1,
      fading: !settled,
    };
  }

  /** For the report and the proofs. */
  report(): { level: GovernorLevel; soft: number; particles: number; budgetMs: number; recoverWaitMs: number; last: { p95: number; samples: number; over: boolean; under: boolean }; log: Array<[number, GovernorLevel, GovernorLevel]> } {
    return { level: this.level, soft: this.soft, particles: this.particles, budgetMs: this.o.budgetMs, recoverWaitMs: this.recoverWait, last: this.last, log: [...this.log] };
  }
}

/** Move `v` toward `to` by at most `by`. */
export function approach(v: number, to: number, by: number): number {
  if (v < to) return Math.min(to, v + by);
  if (v > to) return Math.max(to, v - by);
  return v;
}
