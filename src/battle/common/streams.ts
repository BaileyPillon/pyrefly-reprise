/**
 * Each game's own random streams, as the battle engines draw from them (re-parity RNG lane; the plumbing is **both
 * games**, the stream maps are each game's own and live beside each engine: `ffx/adapt/streams.ts`,
 * `ffx2/adapt/streams.ts`; FF7 keeps its mulberry32 {@link SeededRng}).
 *
 * The games draw from 68 numbered streams, each with its own state: a draw from one never moves another, and which stream
 * a roll uses depends on who rolls and why (`research/re-ffx-rng-hit.md` section 2, `research/re-ffx2-hit-status.md`
 * section 1.1). So an engine does not hold "an RNG"; it holds a {@link BattleRng} and asks it for a stream:
 *
 *     rng.on(2).int(0, 0xffff)                 // the script's GetRandomValue: stream 2, low 16 bits
 *     rng.on(userStream).int(0, 100)           // a hit roll: the user's stream, 31-bit value % 101
 *
 * `on(s).int(0, n - 1)` is the 31-bit value of one draw of stream `s` modulo `n`, which is every reduction the games use
 * (`% n` and `& (2^k - 1)` alike). The type has no unqualified `int`, so an engine that still draws "from the battle" fails to
 * compile; a draw the game does not make at all (the stand-in for a player's minigame input) goes on {@link BattleRng.aux},
 * a separate engine-side stream that cannot move any game stream.
 *
 * A {@link SeededRng} (FF7, the advisor's preview {@link RollPolicyRng}s, a test's scripted generator) is a one-stream
 * {@link BattleRng}: `on(s)` is itself, so everything that drew from it before still does, and a preview still answers by
 * policy.
 *
 * Pure and deterministic, no DOM, no engine types (AGENTS.md rule 1).
 */

import { SeededRng } from './rng.ts';
import type { Rng } from './types.ts';

/**
 * Where a generator stands, for look-ahead and the advisor's worker: one number for a one-stream {@link SeededRng}; for a
 * game generator the 68 stream states followed by the state of the engine-side stream (69 numbers, each a u32).
 */
export type RngSnapshot = number | readonly number[];

/** What a battle engine draws from. */
export interface BattleRng {
  /** An {@link Rng} whose every draw is exactly one draw of stream `stream` (the game's own); a one-stream generator returns itself. */
  on(stream: number): Rng;
  /** The engine-side stream for draws the game does not make (a player's minigame input, an aim placeholder). It never moves a game stream. */
  readonly aux: Rng;
  /** How many streams it has: 68 for a game generator, 1 for a one-stream {@link SeededRng} (which ignores the stream a caller names). */
  readonly streamCount: number;
  /** The run seed this generator was last seeded with. */
  readonly currentSeed: number;
  /** Re-seed everything from the run seed `n` (a game generator uses its own seeding routine). */
  seed(n: number): void;
  /** The position of every stream, restorable with {@link BattleRng.restoreState}. */
  saveState(): RngSnapshot;
  restoreState(state: RngSnapshot): void;
  /** A generator of the same kind seeded `seed`, standing at `state` when one is given. */
  fork(seed: number, state?: RngSnapshot): BattleRng;
}

/** The game side of {@link GameStreams}: its generator and its seeding routine. */
export interface StreamGame {
  readonly name: string;
  /** How many streams the game has (68). */
  readonly count: number;
  /** One draw of `stream`: advances `states[stream]` and returns the 31-bit value. */
  draw(states: Uint32Array, stream: number): number;
  /** The `count` states the game's own seeding routine leaves for a run seed. */
  seedStates(runSeed: number): Uint32Array;
}

/** The stream number a tap reports for a draw of the engine-side stream. */
export const AUX_STREAM = -1;

/** A draw of one stream, for {@link GameStreams.tap}. */
export type DrawTap = (stream: number, value: number) => void;

/** The engine-side stream: mulberry32, reporting every draw to the tap. */
class AuxRng extends SeededRng {
  // No parameter properties anywhere in this file: the critic's plan imports the data layer (and so this file) through Node's strip-only TypeScript.
  private readonly report: () => DrawTap | undefined;

  constructor(report: () => DrawTap | undefined) {
    super(0);
    this.report = report;
  }

  override next(): number {
    const v = super.next();
    this.report()?.(AUX_STREAM, v);
    return v;
  }
}

/** One stream of a {@link GameStreams} as an {@link Rng}: every draw is one draw of that stream, reduced `lo + value % span`. */
class StreamView implements Rng {
  private readonly owner: GameStreams;
  private readonly stream: number;

  constructor(owner: GameStreams, stream: number) {
    this.owner = owner;
    this.stream = stream;
  }

  get currentSeed(): number {
    return this.owner.currentSeed;
  }

  seed(n: number): void {
    this.owner.seed(n);
  }

  /** The 31-bit value of one draw as a float in `[0, 1)`. */
  next(): number {
    return this.owner.draw(this.stream) / 0x80000000;
  }

  /** `lo + value % (hi - lo + 1)` of one draw; the games reduce with `% n` and `& (2^k - 1)`, which this is for `lo = 0`. */
  int(min: number, max: number): number {
    let lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    if (hi < lo) lo = hi;
    return lo + (this.owner.draw(this.stream) % (hi - lo + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty array');
    return items[this.int(0, items.length - 1)] as T;
  }
}

/** A game's 68 streams, seeded from a run seed through the game's own seeding routine. */
export class GameStreams implements BattleRng {
  /** The live stream states (`game.count` words). */
  readonly states: Uint32Array;
  /** Called with the stream and the 31-bit value of every draw (the engine-level stream test); {@link AUX_STREAM} for the engine-side stream. */
  tap: DrawTap | undefined;
  private runSeed: number;
  private readonly auxRng: AuxRng;
  private readonly views: Rng[];

  readonly game: StreamGame;

  constructor(game: StreamGame, seed = 0) {
    this.game = game;
    this.runSeed = seed >>> 0;
    this.states = game.seedStates(this.runSeed);
    this.auxRng = new AuxRng(() => this.tap);
    this.auxRng.seed(auxSeedOf(this.runSeed));
    this.views = Array.from({ length: game.count }, (_, s) => new StreamView(this, s));
  }

  get streamCount(): number {
    return this.game.count;
  }

  get currentSeed(): number {
    return this.runSeed;
  }

  get aux(): Rng {
    return this.auxRng;
  }

  on(stream: number): Rng {
    const view = this.views[stream];
    if (view === undefined) throw new RangeError(`${this.game.name} battle RNG stream ${stream} is outside 0..${this.game.count - 1}`);
    return view;
  }

  /** One draw of `stream`: the game's 31-bit value, with that stream (and only that stream) advanced. */
  draw(stream: number): number {
    const value = this.game.draw(this.states, stream);
    this.tap?.(stream, value);
    return value;
  }

  seed(n: number): void {
    this.runSeed = n >>> 0;
    this.states.set(this.game.seedStates(this.runSeed));
    this.auxRng.seed(auxSeedOf(this.runSeed));
  }

  saveState(): RngSnapshot {
    return [...this.states, this.auxRng.saveState()];
  }

  restoreState(state: RngSnapshot): void {
    if (typeof state === 'number' || state.length !== this.game.count + 1) {
      throw new TypeError(`${this.game.name} battle RNG: a snapshot is ${this.game.count + 1} numbers (the streams, then the engine-side stream)`);
    }
    for (let i = 0; i < this.game.count; i++) this.states[i] = state[i] as number;
    this.auxRng.restoreState(state[this.game.count] as number);
  }

  fork(seed: number, state?: RngSnapshot): GameStreams {
    const f = new GameStreams(this.game, seed);
    if (state !== undefined) f.restoreState(state);
    return f;
  }
}

/** The engine-side stream's seed: the run seed, spread so it is not the same walk as any other use of that number. */
function auxSeedOf(runSeed: number): number {
  return (runSeed ^ 0x9e3779b9) >>> 0;
}

/**
 * The game's target picker: `value % count` along candidates already in the game's ascending slot order, and **no draw at
 * all** with fewer than two (`pp_BtlPickTarget`, FFX.exe 0x007acd40; the FFX-2 random-target search, 0x00634e40). `stream` is
 * the stream the picker is called with (4 for a script or a forced action, 5 for a random-target hit, 6 for a Reflect bounce).
 * A preview's `RollPolicyRng` answers through `pick`, so its aim still steers a random target.
 */
export function pickDrawn<T>(stream: Rng, ordered: readonly T[]): T | undefined {
  if (ordered.length < 2) return ordered[0];
  return stream.pick(ordered);
}

/**
 * The `i`-th sample position of a forecast that tries several rolls from one board (`predictEnemyIntent`): sample 0 is the
 * position itself, so it is the roll the battle will really make; the others move every stream to a different, well-mixed word.
 */
export function sampleSnapshot(snapshot: RngSnapshot, i: number): RngSnapshot {
  if (i === 0) return snapshot;
  if (typeof snapshot === 'number') return (snapshot + Math.imul(i, 0x9e3779b1)) >>> 0;
  const k = Math.imul(i, 0x9e3779b1) | 0;
  return snapshot.map((w, j) => {
    let h = (w ^ k) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h + j) >>> 0;
  });
}
