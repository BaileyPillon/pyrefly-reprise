/**
 * A rig for the decision-table tests of the FFX-2 boss scripts (re-parity AI lane C; FFX-2 only).
 *
 * `scripted(values)` is an `Rng` that hands back the next queued value for every `int` call and records the range it was
 * asked for, so a test can feed a script exactly the 16-bit values its `random() % n` expressions need and check how many
 * draws a poll made (a search over fewer than two candidates draws nothing; a pair of searches draws twice).
 * `bench(...)` builds the three girls (Yuna slot 0, Rikku 1, Paine 2) beside the enemies under test.
 */

import type { Command, Rng } from '../../../src/battle/common/types.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { AiContext, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { defaultAbilities } from '../../../src/battle/ffx2/abilities.ts';

/** An `Rng` that returns queued values and records the `[min, max]` of every call. */
export interface ScriptedRng extends Rng {
  /** Every `int` call so far, as `[min, max]`. */
  readonly calls: Array<[number, number]>;
  /** Values still queued. */
  left(): number;
  /** Queue more values. */
  push(...values: number[]): void;
  /** Forget the values still queued (a branch that draws less than the one the test queued for). */
  drain(): void;
}

export function scripted(values: number[] = []): ScriptedRng {
  const queue = [...values];
  const calls: Array<[number, number]> = [];
  const rng: ScriptedRng = {
    calls,
    left: () => queue.length,
    push: (...more) => {
      queue.push(...more);
    },
    drain: () => {
      queue.length = 0;
    },
    next: () => 0,
    int(min: number, max: number): number {
      calls.push([min, max]);
      const v = queue.shift();
      if (v === undefined) throw new Error(`scripted rng ran dry on int(${min}, ${max}) after ${calls.length - 1} calls`);
      if (v < min || v > max) throw new Error(`scripted value ${v} is outside int(${min}, ${max})`);
      return v;
    },
    pick<T>(items: readonly T[]): T {
      return items[rng.int(0, items.length - 1)] as T;
    },
    seed: () => undefined,
    currentSeed: 0,
  };
  return rng;
}

/** A drawing-free sentinel: the bench uses it when a poll must make no draw at all. */
export const NO_DRAWS: number[] = [];

export interface Bench {
  /** The script's context; `ctx.rng` is the scripted generator. */
  ctx: AiContext;
  self: Ffx2Unit;
  girls: [Ffx2Unit, Ffx2Unit, Ffx2Unit];
  others: Ffx2Unit[];
  rng: ScriptedRng;
  events: Array<{ type: string; [k: string]: unknown }>;
  /** One poll of the script. */
  poll(...values: number[]): Command | null;
  /** The ids of a command, for terse expectations. */
  id(command: Command | null): string | null;
  /** A command's targets. */
  targets(command: Command | null): string[];
}

/** Build the bench: `self` runs `scriptId`, `others` are its allies, the girls are Yuna, Rikku and Paine at slots 0, 1 and 2. */
export function bench(self: Ffx2Unit, scriptId: string, others: Ffx2Unit[] = [], flags: Record<string, number | string | boolean> = {}): Bench {
  const girls: [Ffx2Unit, Ffx2Unit, Ffx2Unit] = [aiUnit('yuna', 'party', 1000, 0), aiUnit('rikku', 'party', 1000, 1), aiUnit('paine', 'party', 1000, 2)];
  const rng = scripted();
  const events: Bench['events'] = [];
  const units = [self, ...others, ...girls];
  const ctx: AiContext = {
    self,
    units,
    rng,
    flags,
    ticks: 0,
    ability: (id) => defaultAbilities.get(id),
    party: () => girls.filter((g) => g.alive && !g.removed),
    allies: () => [self, ...others].filter((u) => u.alive && u.id !== self.id),
    emit: (e) => events.push(e as Bench['events'][number]),
  };
  const script = aiScriptFor(scriptId);
  return {
    ctx,
    self,
    girls,
    others,
    rng,
    events,
    poll(...values: number[]): Command | null {
      rng.push(...values);
      return script.decide(ctx);
    },
    id: (command) => (command && 'id' in command ? command.id : null),
    targets: (command) => (command && command.kind === 'ability' ? command.targets : []),
  };
}

/** An enemy with its own stats and a script id on its record. */
export function enemy(id: string, maxHp: number, opts: { mp?: number; slot?: number; hp?: number } = {}): Ffx2Unit {
  const u = aiUnit(id, 'enemy', maxHp, opts.slot ?? 0);
  if (opts.mp !== undefined) {
    u.mp = opts.mp;
    u.stats.maxMp = Math.max(opts.mp, 1);
  }
  if (opts.hp !== undefined) u.hp = opts.hp;
  return u;
}
