/**
 * Helpers for the boss-script tests of re-parity AI lane B (Yunalesca, Braska's Final Aeon, the Yu Pagodas, the
 * possessed aeons, Yu Yevon): a scripted random stream that records the draws it answers, and a battle built from the
 * shipped data with the engine's own event log. **FFX only.**
 */

import type { BattleEvent, Command, EnemyGroupDef, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { type Ctx, FFXContentRegistry, buildBattle } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../../src/data/ffx/builds/dreams-end.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';

/**
 * A random stream that answers `int(lo, hi)` from a list (clamped into the range asked for), then from `fallback`,
 * and remembers every range it was asked. A test reads `calls` to prove how many draws a decision took and of what
 * size: a game pick with one candidate draws nothing, a `GetRandomValue` is `int(0, 65535)`.
 */
export class ScriptedRng extends SeededRng {
  readonly calls: Array<[number, number]> = [];
  /**
   * Answers to the next `GetRandomValue()` draws (`int(0, 65535)`), taken before the general queue and only by that range:
   * a test can set the roll of a hook that runs after an action's own damage draws without counting those.
   */
  readonly wide: number[] = [];
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
    const wide = min === 0 && max === 0xffff && this.wide.length > 0;
    const raw = wide ? (this.wide.shift() as number) : this.queue.length > 0 ? (this.queue.shift() as number) : this.fallback;
    return Math.max(min, Math.min(max, raw));
  }

  override pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Answer the next draws from `values`, in order, after any still waiting. */
  feed(...values: number[]): void {
    this.queue.push(...values);
  }

  /** Forget every waiting value and answer the next draws from `values`. */
  set(...values: number[]): void {
    this.queue.length = 0;
    this.queue.push(...values);
  }
}

export function liveContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities(ALL_ABILITIES);
  reg.addItems(Object.values(ITEMS));
  return reg;
}

/** The shipped group with this id, deep-copied so a test may edit it. */
export function groupOf(id: string): EnemyGroupDef {
  const group = ENEMY_GROUPS_BY_ID[id];
  if (!group) throw new Error(`no enemy group '${id}'`);
  return JSON.parse(JSON.stringify(group)) as EnemyGroupDef;
}

export interface LiveBattle {
  ctx: Ctx;
  /** Every event the battle emitted, with its `seq`, exactly as the engine's log holds them. */
  events: BattleEvent[];
  at: (id: string) => FFXCombatant;
}

/** A battle on the shipped data (`scripted` condition: nobody has a head start), the engine's log filling as in play. */
export function liveBattle(
  groupId: string,
  options: { party?: FFXPartyBuild; seed?: number; group?: EnemyGroupDef } = {},
): LiveBattle {
  const seed = options.seed ?? 1;
  const party = options.party ?? (groupId === 'yunalesca' ? zanarkandBuild : dreamsEndBuild);
  const events: BattleEvent[] = [];
  const holder: { ctx?: Ctx } = {};
  const ctx = buildBattle(
    {
      game: 'ffx',
      party,
      enemies: options.group ?? groupOf(groupId),
      triggers: [],
      seed,
      condition: 'scripted',
      canEscape: false,
    },
    new SeededRng(seed),
    liveContent(),
    (e) => {
      const state = holder.ctx!.state;
      const full = { ...e, seq: state.nextSeq++ } as BattleEvent;
      state.log.push(full);
      events.push(full);
    },
  );
  holder.ctx = ctx;
  return { ctx, events, at: (id) => ctx.state.combatants[id] as FFXCombatant };
}

/** A counter a lane B script queued, in the shape its tests read: who performs it, who it is aimed at, the command. */
export interface QueuedCounter {
  actorId: string;
  targetId: string;
  command: Command;
}

/** The commands waiting in the engine's one reaction queue (`ai/hooks.ts`), oldest first, without taking them. */
export function queuedCounters(ctx: Ctx): QueuedCounter[] {
  return peekReactions(ctx).flatMap((r) => (r.kind === 'command' ? [{ actorId: r.ownerId, targetId: r.byId, command: r.command }] : []));
}

/** Take every waiting command off the queue, oldest first (what the old per-battle list's drain did). */
export function takeQueuedCounters(ctx: Ctx): QueuedCounter[] {
  const out: QueuedCounter[] = [];
  for (let r = takeReaction(ctx); r !== undefined; r = takeReaction(ctx)) {
    if (r.kind === 'command') out.push({ actorId: r.ownerId, targetId: r.byId, command: r.command });
  }
  return out;
}
