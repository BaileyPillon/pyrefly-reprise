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
  }

  get done(): boolean {
    return this._done || this._killed;
  }

  /** Current eased value without advancing time. */
  get value(): number {
    return lerp(this.from, this.to, this.ease(this.progress));
  }

  get progress(): number {
    if (this.durationSec === 0) return this.elapsed > 0 || this._done ? 1 : 0;
    return clamp01(this.elapsed / this.durationSec);
  }

  /** Stop without firing onComplete. */
  kill(): void {
    this._killed = true;
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

  /** Returns a promise that settles when the tween completes or is killed. */
  toAsync(from: number, to: number, opts: TweenOptions): Promise<void> {
    return new Promise<void>((resolve) => {
      const done = opts.onComplete;
      this.add(
        new Tween(from, to, {
          ...opts,
          onComplete: () => {
            done?.();
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

  killAll(): void {
    for (const t of this.tweens) t.kill();
    this.tweens.length = 0;
  }
}
