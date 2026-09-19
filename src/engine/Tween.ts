/**
 * Tiny dependency-free tween helper.
 *
 * Pure TypeScript: no DOM, no Three.js. Safe to unit test.
 * Everything is driven by an explicit `update(dt)` in seconds so the whole game
 * advances from one clock (and can be stepped deterministically in tests).
 */

export type EasingFn = (t: number) => number;

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Named easing curves. All map [0,1] -> [0,1] with f(0)=0 and f(1)=1. */
export const Easing = {
  linear: (t: number): number => clamp01(t),

  quadIn: (t: number): number => {
    const x = clamp01(t);
    return x * x;
  },
  quadOut: (t: number): number => {
    const x = clamp01(t);
    return x * (2 - x);
  },
  quadInOut: (t: number): number => {
    const x = clamp01(t);
    return x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
  },

  cubicIn: (t: number): number => {
    const x = clamp01(t);
    return x * x * x;
  },
  cubicOut: (t: number): number => {
    const x = clamp01(t) - 1;
    return x * x * x + 1;
  },
  cubicInOut: (t: number): number => {
    const x = clamp01(t);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },

  sineIn: (t: number): number => 1 - Math.cos((clamp01(t) * Math.PI) / 2),
  sineOut: (t: number): number => Math.sin((clamp01(t) * Math.PI) / 2),
  sineInOut: (t: number): number => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2,

  expoOut: (t: number): number => {
    const x = clamp01(t);
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },

  backOut: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const x = clamp01(t);
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },

  elasticOut: (t: number): number => {
    const x = clamp01(t);
    if (x === 0 || x === 1) return x;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  },

  bounceOut: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    let x = clamp01(t);
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  },
} as const;

export type EasingName = keyof typeof Easing;

/** Accepts a name or a raw function; defaults to quadInOut. */
export function resolveEasing(e: EasingName | EasingFn | undefined): EasingFn {
  if (typeof e === 'function') return e;
  if (e && e in Easing) return Easing[e];
  return Easing.quadInOut;
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Frame-rate independent exponential smoothing toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export interface TweenOptions {
  /** Duration in milliseconds. 0 snaps to the end on the next update. */
  durationMs: number;
  easing?: EasingName | EasingFn;
  /** Seconds-based delay before the tween starts running. */
  delayMs?: number;
  onUpdate?: (value: number, progress: number) => void;
  onComplete?: () => void;
  /**
   * Fired by {@link Tween.kill} instead of `onComplete`, exactly once, and
   * never after the tween has already completed.
   *
   * This exists because a killed tween used to settle **nothing**: a caller
   * awaiting {@link TweenGroup.toAsync} was abandoned mid-await, for ever.
   * That is the root cause `docs/handoff/builda-flow.md` traced Chapter 4's
   * "won and then never ends" to — `PaintedActor.dispose()` calls
   * `tweens.killAll()`, `PaintedStage.removeCombatant` disposes actors, and the
   * presenter was parked in `await actor.dissolveTo(...)` for the killing blow,
   * so the `victory` event queued behind it never played.
   */
  onKilled?: () => void;
}

/** A single scalar 0..1 tween, ticked by a {@link TweenGroup}. */
export class Tween {
  readonly from: number;
  readonly to: number;
  private readonly durationSec: number;
  private readonly ease: EasingFn;
  private delaySec: number;
  private elapsed = 0;
  private readonly onUpdate: ((value: number, progress: number) => void) | undefined;
  private readonly onComplete: (() => void) | undefined;
  private readonly onKilled: (() => void) | undefined;
  private _done = false;
  private _killed = false;

  constructor(from: number, to: number, opts: TweenOptions) {
    this.from = from;
    this.to = to;
    this.durationSec = Math.max(0, opts.durationMs) / 1000;
    this.ease = resolveEasing(opts.easing);
    this.delaySec = Math.max(0, opts.delayMs ?? 0) / 1000;
    this.onUpdate = opts.onUpdate;
    this.onComplete = opts.onComplete;
    this.onKilled = opts.onKilled;
  }

  get done(): boolean {
    return this._done || this._killed;
  }

  /** True when this tween was stopped by {@link kill} rather than finishing. */
  get killed(): boolean {
    return this._killed;
  }

  /** Current eased value without advancing time. */
  get value(): number {
    return lerp(this.from, this.to, this.ease(this.progress));
  }

  get progress(): number {
    if (this.durationSec === 0) return this.elapsed > 0 || this._done ? 1 : 0;
    return clamp01(this.elapsed / this.durationSec);
  }

  /**
   * Stop without firing `onComplete` — but **always settle**.
   *
   * `onKilled` fires here, once, and only for a tween that had not already
   * finished, so a `toAsync` caller is resolved rather than left awaiting a
   * promise nothing will ever settle. Killing a tween twice, or killing one
   * that has already completed, is a no-op.
   */
  kill(): void {
    if (this._done || this._killed) return;
    this._killed = true;
    this.onKilled?.();
  }

  /** Jump to the end, firing onUpdate + onComplete once. */
  finish(): void {
    if (this.done) return;
    this.elapsed = this.durationSec;
    this._done = true;
    this.onUpdate?.(this.to, 1);
    this.onComplete?.();
  }

  /** @param dt seconds */
  update(dt: number): boolean {
    if (this.done) return true;
    if (this.delaySec > 0) {
      this.delaySec -= dt;
      if (this.delaySec > 0) return false;
      dt = -this.delaySec;
      this.delaySec = 0;
    }
    this.elapsed += dt;
    const p = this.progress;
    const v = lerp(this.from, this.to, this.ease(p));
    this.onUpdate?.(v, p);
    if (p >= 1) {
      this._done = true;
      this.onComplete?.();
    }
    return this._done;
  }
}

/** Owns a set of tweens and advances them together. */
export class TweenGroup {
  private tweens: Tween[] = [];

  get size(): number {
    return this.tweens.length;
  }

  add(tween: Tween): Tween {
    this.tweens.push(tween);
    return tween;
  }

  /** Convenience: create + register in one call. */
  to(from: number, to: number, opts: TweenOptions): Tween {
    return this.add(new Tween(from, to, opts));
  }

  /**
   * Returns a promise that settles when the tween completes **or is killed**.
   *
   * It resolves on both paths and never rejects: a dropped animation is not an
   * error, and a rejection here would surface as an unhandled rejection inside
   * whichever `dispose()` happened to kill the tween, far from any `catch`.
   *
   * Until `Tween.kill()` learned to settle, the killed branch did not exist —
   * `killAll()` emptied the array and every awaiting caller was abandoned
   * mid-await, for ever. That is the defect `docs/handoff/builda-flow.md` #01
   * traced Chapter 4's "won and then never ends" to.
   *
   * **Which of the two happened is reported through `opts.onKilled`, not
   * through the resolved value**, and that is deliberate: every animation in
   * `ActorHandle` / `CameraHandle` (`src/engine/BattlePresenterPorts.ts`) is
   * typed `Promise<void>`, and widening the promise here would have rewritten
   * sixteen signatures across four files plus both ports and their fakes to
   * carry a value the presenter does not read. A caller that needs to know —
   * a beat that must not play its follow-through on an actor that has left the
   * stage — passes `onKilled` and is told.
   *
   * `BattlePresenterEvents.settled()` races these promises against a deadline
   * and that guard stays: it covers an animation that *overruns*, which is a
   * different failure from one that is killed. It simply no longer has to be
   * the only thing standing between a disposed actor and a frozen chapter.
   */
  toAsync(from: number, to: number, opts: TweenOptions): Promise<void> {
    return new Promise<void>((resolve) => {
      const done = opts.onComplete;
      const killed = opts.onKilled;
      this.add(
        new Tween(from, to, {
          ...opts,
          onComplete: () => {
            done?.();
            resolve();
          },
          onKilled: () => {
            killed?.();
            resolve();
          },
        }),
      );
    });
  }

  /** @param dt seconds */
  update(dt: number): void {
    if (this.tweens.length === 0) return;
    let write = 0;
    for (let i = 0; i < this.tweens.length; i++) {
      const t = this.tweens[i]!;
      t.update(dt);
      if (!t.done) this.tweens[write++] = t;
    }
    this.tweens.length = write;
  }

  /**
   * Kill every tween this group owns, settling each one's `toAsync` promise.
   *
   * The array is emptied **first**, so a caller whose `onKilled` reaches back
   * into the group — starting a replacement tween from a dissolve's
   * continuation, say — is not iterating a list that is being truncated
   * underneath it, and its new tween survives the call.
   */
  killAll(): void {
    const killing = this.tweens;
    this.tweens = [];
    for (const t of killing) t.kill();
  }
}
