/**
 * The battle engines' only source of randomness.
 *
 * Deterministic, dependency-free and DOM-free: the same seed plus the same
 * command sequence must produce the same {@link BattleEvent} stream, byte for
 * byte. The e2e gallery and the critic replay whole chapters this way.
 *
 * Algorithm: **mulberry32** — a 32-bit state PRNG with a 2^32 period, excellent
 * avalanche for its size and a three-line body. It is not cryptographic and does
 * not need to be.
 *
 * Usage rules for engine agents:
 * - Never call `Math.random()` anywhere under `src/battle/`.
 * - Draw in a fixed order. Reordering draws changes replays even at the same
 *   seed, so if you add a roll, add it at the end of the step.
 * - The FFX chain wants integer rolls in specific ranges; use the named helpers
 *   ({@link Rng.int}, {@link damageRng}, {@link percentRoll}, {@link byteRoll})
 *   rather than scaling {@link Rng.next} by hand.
 */

import type { Rng } from './types.ts';

/** Force a value into an unsigned 32-bit integer, the state domain mulberry32 wants. */
function toUint32(n: number): number {
  return (Math.trunc(n) >>> 0) || 0;
}

/**
 * A seeded {@link Rng}.
 *
 * ```ts
 * const rng = new SeededRng(12345);
 * rng.int(0, 31);   // damage variance roll
 * rng.seed(12345);  // rewind: the same draws come back
 * ```
 */
export class SeededRng implements Rng {
  /** Live 32-bit state. Advances on every draw. */
  private state: number;
  /** The seed this generator was last seeded with. */
  private seedValue: number;

  constructor(seed = 0) {
    this.seedValue = toUint32(seed);
    this.state = this.seedValue;
  }

  get currentSeed(): number {
    return this.seedValue;
  }

  /** Re-seed in place and rewind the stream. */
  seed(n: number): void {
    this.seedValue = toUint32(n);
    this.state = this.seedValue;
  }

  /** Uniform float in `[0, 1)`. 32 bits of entropy per call. */
  next(): number {
    // mulberry32
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Uniform integer in `[min, max]`, **inclusive on both ends**.
   * Swapped bounds are tolerated; non-integer bounds are floored/ceiled inward.
   */
  int(min: number, max: number): number {
    let lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (hi < lo) lo = hi;
    const span = hi - lo + 1;
    return lo + Math.floor(this.next() * span);
  }

  /** Uniform element of a non-empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty array');
    const item = items[this.int(0, items.length - 1)];
    // `noUncheckedIndexedAccess` — the index is provably in range.
    return item as T;
  }

  /**
   * Fisher-Yates shuffle of a **copy**. Deterministic under the seed.
   * Useful for `random-enemy` targeting orders and AI weight tables.
   */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const a = out[i] as T;
      const b = out[j] as T;
      out[i] = b;
      out[j] = a;
    }
    return out;
  }

  /**
   * Weighted pick. `weights[i]` is the relative chance of `items[i]`; weights
   * must be non-negative and not all zero. Used by AI rule tables
   * ([ffx-combat-core §12.2] `AiRule.weight`).
   */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0) throw new Error('Rng.weighted: empty array');
    if (items.length !== weights.length) throw new Error('Rng.weighted: length mismatch');
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) throw new Error('Rng.weighted: all weights are zero');
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= Math.max(0, weights[i] ?? 0);
      if (roll < 0) return items[i] as T;
    }
    return items[items.length - 1] as T;
  }

  /** Snapshot the internal state, so a test can fork a stream. */
  saveState(): number {
    return this.state;
  }

  /** Restore a snapshot from {@link saveState}. */
  restoreState(state: number): void {
    this.state = toUint32(state);
  }
}

/** Convenience factory. */
export function makeRng(seed = 0): SeededRng {
  return new SeededRng(seed);
}

/**
 * FFX damage variance roll: a uniform integer **0–31**, applied as
 * `dmg * (roll + 240) // 256` — a 32-step discrete roll from x0.9375 to
 * x1.0586, **not** a continuous band [ffx-combat-core §2.1].
 *
 * `roll === 16` gives exactly x1.0; use 16 for deterministic fixtures.
 */
export function damageRng(rng: Rng): number {
  return rng.int(0, 31);
}

/**
 * The `rng % 101` roll shared by hit chance, critical chance and status
 * application: a uniform integer **0–100** [ffx-combat-core §2.11, §2.12, §4.1].
 */
export function percentRoll(rng: Rng): number {
  return rng.int(0, 100);
}

/**
 * The `rng & 255` roll used by Escape (success when `< 191`, i.e. 74.6%) and by
 * the encounter-condition draw [ffx-combat-core §1.8, §1.9].
 */
export function byteRoll(rng: Rng): number {
  return rng.int(0, 255);
}
