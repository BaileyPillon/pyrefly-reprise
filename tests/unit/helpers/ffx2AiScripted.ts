/**
 * Helpers for the boss-script tests of re-parity AI lane FFX-2 a (Bahamut, the Vegnagun chain, Shuyin). **FFX-2 only.**
 *
 * `ScriptedRng` answers `int(lo, hi)` from a list (clamped into the range asked for) and then from a fallback, and remembers every
 * range it was asked, so a test can prove how many draws a decision took and of what size: a script's `random() % n` is
 * `int(0, 65535)`, a target search with two or more candidates is one `int(0, 2147483647)`, and a search with fewer draws nothing.
 * `scriptHarness` drives one script against a party of three girls (Yuna, Rikku, Paine in slots 0 to 2) with that stream.
 */

import { SeededRng } from '../../../src/battle/common/rng.ts';
import type { Command } from '../../../src/battle/common/types.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/index.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { defaultAbilities } from '../../../src/battle/ffx2/index.ts';
import type { AiContext, EventDraft, Ffx2Unit } from '../../../src/battle/ffx2/index.ts';

/** The widest raw value of a target search and of `random()`. */
export const SEARCH_MAX = 0x7fffffff;
export const RANDOM_MAX = 0xffff;

export class ScriptedRng extends SeededRng {
  readonly calls: Array<[number, number]> = [];
  private readonly queue: number[];

  constructor(values: readonly number[] = [], private readonly fallback = 0) {
    super(1);
    this.queue = [...values];
  }

  override next(): number {
    return 0.5;
  }

  override int(min: number, max: number): number {
    this.calls.push([min, max]);
    const raw = this.queue.length > 0 ? (this.queue.shift() as number) : this.fallback;
    return Math.max(min, Math.min(max, raw));
  }

  override pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Answer the next draws from `values`, after any still waiting. */
  feed(...values: number[]): void {
    this.queue.push(...values);
  }

  /** Forget every waiting value and the record of past draws. */
  reset(): void {
    this.queue.length = 0;
    this.calls.length = 0;
  }

  /** How many draws of this width have been asked. */
  drawsOf(max: number): number {
    return this.calls.filter(([, hi]) => hi === max).length;
  }
}

export interface ScriptHarness {
  ctx: AiContext;
  rng: ScriptedRng;
  girls: Ffx2Unit[];
  emitted: EventDraft[];
  flags: Record<string, number | string | boolean>;
  /** One poll: the command, or `null` for a poll that issues nothing. */
  poll(): Command | null;
  /** `times` polls; each entry is the command's ability id, or `null` for a poll that issued nothing. */
  run(times: number): Array<string | null>;
}

/** The three girls, Yuna, Rikku and Paine, in party slots 0 to 2. */
export function threeGirls(): Ffx2Unit[] {
  return [aiUnit('yuna', 'party', 1000, 0), aiUnit('rikku', 'party', 1000, 1), aiUnit('paine', 'party', 1000, 2)];
}

/**
 * Drive script `scriptId` for `self` with `others` standing beside it. `ctx.party()` is the living girls; `ctx.allies()` the living
 * enemies other than `self`. Nothing is seeded: the stream is the scripted one, answering `values` and then `fallback`.
 */
export function scriptHarness(
  self: Ffx2Unit,
  scriptId: string,
  others: Ffx2Unit[] = [],
  values: readonly number[] = [],
  fallback = 0,
): ScriptHarness {
  const girls = threeGirls();
  const rng = new ScriptedRng(values, fallback);
  const emitted: EventDraft[] = [];
  const flags: Record<string, number | string | boolean> = {};
  const units = [self, ...others, ...girls];
  const ctx: AiContext = {
    self,
    units,
    rng,
    flags,
    ticks: 0,
    ability: (id) => defaultAbilities.get(id),
    party: () => girls.filter((g) => g.alive && !g.removed),
    allies: () => [self, ...others].filter((u) => u.alive && !u.removed && u.id !== self.id),
    emit: (e) => emitted.push(e),
  };
  const script = aiScriptFor(scriptId);
  const poll = (): Command | null => script.decide(ctx);
  return {
    ctx,
    rng,
    girls,
    emitted,
    flags,
    poll,
    run(times: number) {
      const out: Array<string | null> = [];
      for (let i = 0; i < times; i++) {
        const command = poll();
        out.push(command && 'id' in command ? command.id : null);
      }
      return out;
    },
  };
}

/** The ids a command aims at, or none. */
export function aimOf(command: Command | null): string[] {
  return command && 'targets' in command ? [...command.targets] : [];
}

/** The `script-trigger` names emitted so far, in order. */
export function triggerNames(emitted: readonly EventDraft[]): string[] {
  return emitted.filter((e) => e.type === 'script-trigger').map((e) => (e as { name: string }).name);
}

/** Put a status on a unit the way a live status looks to a script. */
export function giveStatus(unit: Ffx2Unit, id: string): void {
  (unit.statuses as Record<string, unknown>)[id] = {
    id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true,
  };
}
