/**
 * THE CURVE DRIVER (conference demo, motion pass, lane "core", step 1; pure: no `three`, no DOM, no timer).
 *
 * The channels the new motion writes on a figure, summed in one place so `PaintedActor.update` reads one small record: `x` (along the body's facing, before the facing is applied),
 * `lift` (world units off the floor), `sy` (scale Y; scale X is `1 / sy`, volume-preserving) and `lean` (radians, forward positive). Three sources feed it, all advanced on the same
 * PACED clock the actor hands it (`dt * 1000 * paceRate('action')`; zero in a hit-stop):
 *
 * - the **strike** (`StrikeRun`): the attack's wind-up, arc, contact and way home;
 * - the **cast lift** ({@link LiftChannel}): a rise at the start of a cast, HELD until the spell lands, then a release that ends in a small landing squash;
 * - the **leap** ({@link LeapRun}): a short arc with a take-off crouch, a stretch in the air and a landing squash. FFX-2's run-in is a leap (the girls get the arc there, and their
 *   strike after it plays no arc of its own: no double lift); the turn-start weight shift is a very small one.
 *
 * Game case: the driver is shared plumbing (both games); WHICH profile feeds it is the chapter's game (`StrikeCurve.PROFILES`). Every number is `[ours]`.
 */
import { SQUASH_CAP, clamp01, pulse, skewBell, smooth, type StrikeShape } from './StrikeCurve.ts';
import { StrikeRun, type StrikePose } from './StrikeRun.ts';
import { smoothBell } from './RunEase.ts'; // MF-04: a lift that leaves and meets the floor at rest

/** The summed channels (world units where it matters). */
export type CurveChannels = StrikePose;

/** A cast's lift: rises to `height` over `ms` and stays there until released; the release eases down and rings a small landing squash. */
export class LiftChannel {
  value = 0;
  /** Scale Y of the landing squash after a release (1 at rest). */
  landSy = 1;
  private from = 0;
  private to = 0;
  private t = 0;
  private dur = 1;
  private moving = false;
  private landing = -1;
  private landAmp = 0;
  private landMs = 160;

  /** Rise to `height` world units over `ms` (smooth); holds there. A rise while one is in flight restarts from where it is. */
  rise(height: number, ms: number): void {
    this.begin(this.value, Math.max(0, height), ms);
    this.landing = -1;
    this.landSy = 1;
  }

  /** Come down over `ms`; ends in a landing squash of `land` (a share of the figure's scale, capped). */
  release(ms: number, land = 0.025): void {
    if (this.value <= 1e-6 && !this.moving) return;
    this.begin(this.value, 0, ms);
    this.landAmp = Math.min(SQUASH_CAP, land);
  }

  get held(): boolean {
    return !this.moving && this.value > 1e-6;
  }

  private begin(from: number, to: number, ms: number): void {
    this.from = from;
    this.to = to;
    this.t = 0;
    this.dur = Math.max(1, ms);
    this.moving = true;
  }

  advance(ms: number): void {
    if (this.moving) {
      this.t += ms;
      const p = clamp01(this.t / this.dur);
      this.value = this.from + (this.to - this.from) * smooth(p);
      if (p >= 1) {
        this.moving = false;
        this.value = this.to;
        if (this.to === 0 && this.from > 0) {
          this.landing = 0; // touched down: ring the landing
          this.landMs = Math.max(60, this.dur * 0.6);
        }
      }
    }
    if (this.landing >= 0) {
      this.landing += ms;
      this.landSy = 1 - this.landAmp * pulse(this.landing, this.landMs);
      if (this.landing >= this.landMs) {
        this.landing = -1;
        this.landSy = 1;
      }
    }
  }
}

/** A leap's shape (world units for the height; shares for the squash). */
export interface LeapOptions {
  /** Share of the flight spent crouching before the take-off. */
  anticipation?: number;
  crouch?: number;
  stretch?: number;
  land?: number;
  /** Length of the landing squash after the flight ends, paced ms. */
  landMs?: number;
  apex?: number;
  /** MF-04 (`?run=smooth`): the lift leaves and meets the floor at rest (`RunEase.smoothBell`) instead of at its steepest (`skewBell`). Default false: today's arc. */
  smooth?: boolean;
  /** Things to do on the frame the leap's time (the crouch and the flight, 0 to 1 of the whole `ms`) first reaches `u`: the victory cheer swaps its painting on the take-off (motion pass, step 3). */
  marks?: ReadonlyArray<{ u: number; fn: () => void }>;
  /** Called once, on the frame the flight ends and the landing squash begins (the lane "feel" landing thud, `?motionsfx=`). Never called when the leap is settled early (the actor was disposed). */
  onLand?: () => void;
}

/** One arc: crouch, take off, stretch in the air, land, ring the landing. The flight is `ms` long; the landing squash plays on after it. */
export class LeapRun {
  lift = 0;
  sy = 1;
  private t = 0;
  private flightDone = false;
  private readonly o: Required<Omit<LeapOptions, 'marks' | 'onLand'>>;
  private readonly onLand: (() => void) | undefined;
  private readonly pending: Array<{ u: number; fn: () => void }>;

  constructor(private readonly height: number, private readonly ms: number, resolve: () => void, options: LeapOptions = {}) {
    const { marks, onLand, ...shape } = options;
    this.onLand = onLand;
    this.pending = marks ? marks.map((m) => ({ u: m.u, fn: m.fn })).sort((a, b) => a.u - b.u) : [];
    this.o = { anticipation: 0.12, crouch: 0.03, stretch: 0.04, land: 0.04, landMs: 140, apex: 0.45, smooth: false, ...shape };
    this.o.crouch = Math.min(SQUASH_CAP, this.o.crouch);
    this.o.stretch = Math.min(SQUASH_CAP, this.o.stretch);
    this.o.land = Math.min(SQUASH_CAP, this.o.land);
    this.resolve = resolve;
  }
  private readonly resolve: () => void;

  get done(): boolean {
    return this.t >= this.ms + this.o.landMs;
  }

  advance(ms: number): void {
    this.t += ms;
    const o = this.o;
    const u = clamp01(this.t / this.ms);
    while (this.pending.length && this.pending[0]!.u <= u) this.pending.shift()!.fn();
    if (u < o.anticipation) {
      this.lift = 0;
      this.sy = 1 - o.crouch * smooth(u / o.anticipation);
    } else if (u < 1) {
      const f = (u - o.anticipation) / (1 - o.anticipation);
      this.lift = this.height * (o.smooth ? smoothBell(f, o.apex) : skewBell(f, o.apex));
      this.sy = f < 0.3 ? 1 - o.crouch + (o.stretch + o.crouch) * smooth(f / 0.3) : 1 + o.stretch * (1 - smooth((f - 0.3) / 0.6));
    } else {
      this.lift = 0;
      this.sy = 1 - o.land * pulse(this.t - this.ms, o.landMs);
      if (!this.flightDone) {
        this.flightDone = true;
        this.resolve();
        this.onLand?.();
      }
    }
    if (u >= 1 && !this.flightDone) {
      this.flightDone = true;
      this.resolve();
    }
  }

  /**
   * Settle the promise and run every mark not reached yet (so a swap that waits on one still happens), and let the arc play on: it is the caller's word that nothing waits on this leap any
   * more, not that it stops (review minor: stopping a leap that was mid-flight dropped its lift in one frame, a pop).
   */
  settle(): void {
    while (this.pending.length) this.pending.shift()!.fn();
    if (!this.flightDone) {
      this.flightDone = true;
      this.resolve();
    }
  }

  /** Stop and settle the promise (the actor was disposed, or too many leaps were running). A mark not reached yet is run now, so a swap that waits on it still happens. */
  finish(): void {
    this.settle();
    this.t = this.ms + this.o.landMs;
    this.lift = 0;
    this.sy = 1;
  }
}

/** How many leaps may be waited on at once, and how many may still be flying (a settled one keeps its arc). */
export const MAX_LEAPS_SETTLED = 3;
export const MAX_LEAPS_KEPT = 8;

export class CurveDriver {
  readonly cast = new LiftChannel();
  private run: StrikeRun | null = null;
  private runDone: (() => void) | null = null;
  private leaps: LeapRun[] = [];
  private readonly strikePose: StrikePose = { x: 0, lift: 0, sy: 1, lean: 0 };
  /** The summed channels as of the last {@link advance}. */
  readonly out: CurveChannels = { x: 0, lift: 0, sy: 1, lean: 0 };

  /** The strike in flight, if any (marks hang off it). */
  get strike(): StrikeRun | null {
    return this.run;
  }

  /**
   * Begin a strike. One in flight folds out over {@link import('./StrikeRun.ts').FOLD_MS}; its promise settles. The returned promise settles when the move is over (or replaced, or
   * the driver is {@link dispose}d). `autoRelease`: no contact will let the hold go.
   */
  begin(shape: StrikeShape, distance: number, height: number, autoRelease: boolean): { run: StrikeRun; done: Promise<void> } {
    const carry = this.run ? { ...this.strikePose } : null;
    this.end();
    const run = new StrikeRun(shape, distance, height, carry, autoRelease);
    this.run = run;
    const done = new Promise<void>((resolve) => (this.runDone = resolve));
    return { run, done };
  }

  private end(): void {
    this.run?.cancel();
    this.run = null;
    const r = this.runDone;
    this.runDone = null;
    r?.();
  }

  /** An arc: resolves when the flight is over; the landing squash plays on. */
  leap(height: number, ms: number, options?: LeapOptions): Promise<void> {
    return new Promise<void>((resolve) => {
      // Past three concurrent leaps the older ones are SETTLED (their promises resolve and their marks run) but keep flying to their natural end, so no lift pops away mid-arc; only a runaway
      // pile (eight) is cut, oldest first.
      if (this.leaps.length >= MAX_LEAPS_SETTLED) for (const l of this.leaps.slice(0, this.leaps.length - (MAX_LEAPS_SETTLED - 1))) l.settle();
      if (this.leaps.length >= MAX_LEAPS_KEPT) this.leaps.shift()?.finish();
      this.leaps.push(new LeapRun(height, Math.max(1, ms), resolve, options));
    });
  }

  /** Advance every channel by `ms` of paced time and refresh {@link out}. */
  advance(ms: number): void {
    const o = this.out;
    let x = 0;
    let lift = 0;
    let sy = 1;
    let lean = 0;
    const run = this.run;
    if (run) {
      run.advance(ms);
      run.sample(this.strikePose);
      x = this.strikePose.x;
      lift = this.strikePose.lift;
      sy = this.strikePose.sy;
      lean = this.strikePose.lean;
      if (run.done) this.end();
    }
    this.cast.advance(ms);
    lift += this.cast.value;
    sy *= this.cast.landSy;
    if (this.leaps.length) {
      for (const l of this.leaps) {
        l.advance(ms);
        lift += l.lift;
        sy *= l.sy;
      }
      this.leaps = this.leaps.filter((l) => !l.done);
    }
    o.x = x;
    o.lift = lift;
    o.sy = Math.min(1 + SQUASH_CAP * 1.5, Math.max(1 - SQUASH_CAP * 1.5, sy));
    o.lean = lean;
  }

  /** Settle every promise and go to rest (the actor is being disposed). */
  dispose(): void {
    this.end();
    for (const l of this.leaps) l.finish();
    this.leaps = [];
  }
}
