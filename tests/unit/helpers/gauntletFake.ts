/**
 * A fake battle context for the hidden Gauntlet chapter's script tests (FFX only; chapter 54): each branch of a creature's script is driven by the raw draw alone, and the odds are counted over all 65,536 values of
 * `GetRandomValue()` (the research note's own exact tallies, `research/re-ffx-monster-arena-creations.md` 3). The same pattern as the Dark Aeons' `dark-aeons-six-ai.test.ts`. Test-only.
 */

import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { type AiContext, aiContextFor } from '../../../src/battle/ffx/ai/types.ts';

export interface Fake {
  ctx: Ctx;
  /** Every draw the script took: `[stream, hi]`. */
  draws: Array<[number, number]>;
  events: Array<{ type: string; text?: string; kind?: string }>;
}

export interface FakeOptions {
  /** The enemy's combatant id. */
  boss: string;
  /** Every stream-2 draw (`GetRandomValue()`) answers this, or the next of a list (the last repeats). */
  raw?: number | readonly number[];
  /** Every stream-4 draw (the picker) answers this, clamped into the range asked. */
  pick?: number;
  /** Party members standing (default 3); the others of the three slots are KO'd. */
  living?: number;
  /** Which party members are petrified (by id `m0`, `m1`, `m2`). */
  petrified?: readonly string[];
  /** An aeon holds the field (Valefor). */
  aeon?: boolean;
  inReaction?: boolean;
  /** The boss's HP (default 1000). */
  bossHp?: number;
  /** More enemy combatants beside the boss (the Ultima Buster's Head and Arms), id to "standing"; the dead are KO'd. */
  extras?: Readonly<Record<string, boolean>>;
}

const dummy = (id: string, side: 'party' | 'enemy' | 'aeon', hp = 1000): FFXCombatant =>
  ({ id, side, alive: true, hp, mp: 999, removed: false, statuses: {}, flags: {}, immunityFlags: [], stats: { maxHp: 1000, agi: 100, def: 50, mdef: 50 } }) as unknown as FFXCombatant;

/** A battle with `living` party members (`m0`...) and one enemy; every stream-2 draw answered `raw`, every stream-4 draw `pick`. */
export function fakeArena(opts: FakeOptions): Fake {
  const draws: Array<[number, number]> = [];
  const events: Fake['events'] = [];
  const total = 3;
  const living = opts.living ?? total;
  const party = Array.from({ length: total }, (_, i) => {
    const c = dummy(`m${i}`, 'party');
    if (i >= living) {
      c.alive = false;
      c.hp = 0;
      (c.statuses as Record<string, unknown>)['ko'] = { id: 'ko' };
    }
    if (opts.petrified?.includes(c.id)) (c.statuses as Record<string, unknown>)['petrify'] = { id: 'petrify' };
    return c;
  });
  const combatants: Record<string, FFXCombatant> = Object.fromEntries(party.map((c) => [c.id, c]));
  combatants[opts.boss] = dummy(opts.boss, 'enemy', opts.bossHp ?? 1000);
  for (const [id, standing] of Object.entries(opts.extras ?? {})) {
    const extra = dummy(id, 'enemy', standing ? 1000 : 0);
    if (!standing) {
      extra.alive = false;
      (extra.statuses as Record<string, unknown>)['ko'] = { id: 'ko' };
    }
    combatants[id] = extra;
  }
  if (opts.aeon === true) combatants['valefor'] = dummy('valefor', 'aeon');
  const queue = typeof opts.raw === 'number' || opts.raw === undefined ? undefined : [...opts.raw];
  const ctx = {
    state: { flags: {}, combatants, activeIds: party.map((c) => c.id), aeonId: opts.aeon === true ? 'valefor' : null, enemyIds: [opts.boss, ...Object.keys(opts.extras ?? {})], reserveIds: [] },
    rt: { actors: new Map(), inReaction: opts.inReaction === true },
    rng: {
      on: (stream: number) => ({
        int: (_lo: number, hi: number): number => {
          draws.push([stream, hi]);
          if (stream !== FfxStream.Script) return Math.min(opts.pick ?? 0, hi);
          if (queue === undefined) return typeof opts.raw === 'number' ? opts.raw : 0;
          return queue.length > 1 ? (queue.shift() as number) : (queue[0] as number);
        },
      }),
    },
    content: { ability: () => ({}) },
    emit: (e: Fake['events'][number]) => events.push(e),
  } as unknown as Ctx;
  return { ctx, draws, events };
}

/** The boss's AI context (its memory is the runtime's, as in the engine). */
export const aiOf = (f: Fake, id: string): AiContext => aiContextFor(f.ctx, f.ctx.state.combatants[id] as FFXCombatant);
export const bossOf = (f: Fake, id: string): FFXCombatant => f.ctx.state.combatants[id] as FFXCombatant;
/** The row a command names (`ability id`), or `(kind)` for another command, `(none)` for a passed turn. */
export const rowOf = (c: Command | null): string => (c !== null && c.kind === 'ability' ? c.id : `(${c?.kind ?? 'none'})`);

/**
 * The exact tally of one turn's rows over all 65,536 values of the draw: `setup` may put the script's memory in the state under test (the same memory for every value); a fresh fake for each value.
 */
export function tally(boss: string, turn: (ai: AiContext) => Command | null, opts: Partial<FakeOptions> = {}, setup: (f: Fake, ai: AiContext) => void = () => undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (let raw = 0; raw < 0x10000; raw++) {
    const f = fakeArena({ boss, raw, ...opts });
    const ai = aiOf(f, boss);
    setup(f, ai);
    const row = rowOf(turn(ai));
    out[row] = (out[row] ?? 0) + 1;
  }
  return out;
}
