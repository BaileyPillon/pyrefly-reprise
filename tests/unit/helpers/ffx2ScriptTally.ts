/**
 * Test helpers for the FFX-2 boss-AI parity tests (AI-FFX2-b; **FFX-2 only**): an AI context over hand-built units with a
 * scripted random stream, and the **exact outcome tables** of a decision, the way the lane's note got them from the game's
 * compiled scripts ("every `random() mod n` expanded exhaustively", research/re-ffx2-ai-fallen-trema.md 0).
 *
 * `exactTally` runs a decision once per class of random value instead of once per value. A roll is `int(0, 0xFFFF) % n`
 * (`ai/script-rolls.ts`), so for any `n` dividing the modulus M the 65,536 values fall into M residue classes of a known size
 * (65,536 is not a multiple of 3, 5 or 6, so the classes differ by one: that bias is the game's, and the tables carry it);
 * a pick draws a raw 31-bit value modulo the candidate count, classed the same way over 6 equal classes. The probabilities
 * come back as the product of each draw's class share (a roll class: its count of 65,536; a pick class: 1/6), exact to a double's
 * rounding, so a test compares them to the closed form (`21846 / 65536`) with twelve digits, not a statistical tolerance.
 */

import type { Rng } from '../../../src/battle/common/types.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import type { AiContext, EventDraft, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { abilityRegistryFrom } from '../../../src/battle/ffx2/index.ts';

export const REGISTRY = abilityRegistryFrom(Object.values(data.ABILITIES));

/** A stream that hands out the given values to `int`, then zeros. `pick` takes the next value modulo the list. */
export function scriptedRng(values: readonly number[]): Rng {
  let i = 0;
  const next = (): number => values[i++] ?? 0;
  return {
    next: () => 0,
    int: (min: number, max: number) => Math.min(max, min + (next() % (max - min + 1))),
    pick: <T>(items: readonly T[]): T => items[next() % items.length] as T,
    seed: () => undefined,
    currentSeed: 0,
  };
}

export interface Board {
  ctx: AiContext;
  events: EventDraft[];
  flags: Record<string, number | string | boolean>;
  units: Ffx2Unit[];
}

/** An AI context for `self` over `units` (the party is the living `side: 'party'` units, in the order given). */
export function boardOf(self: Ffx2Unit, units: Ffx2Unit[], rng: Rng, ticks = 0): Board {
  const events: EventDraft[] = [];
  const flags: Record<string, number | string | boolean> = {};
  const ctx: AiContext = {
    self,
    units,
    rng,
    flags,
    ticks,
    ability: (id) => REGISTRY.get(id),
    party: () => units.filter((u) => u.side === 'party' && u.alive && !u.removed),
    allies: () => units.filter((u) => u.side === 'enemy' && u.alive && !u.removed && u.id !== self.id),
    emit: (e) => events.push(e),
  };
  return { ctx, events, flags, units };
}

/** The same board seen by another enemy (shares units, rng, flags and events). */
export function asSelf(board: Board, self: Ffx2Unit): AiContext {
  return { ...board.ctx, self };
}

/** Three girls at set HP/MP in slot order: yuna, rikku, paine. */
export function girls(hp = 5000, mp = 999): Ffx2Unit[] {
  return ['yuna', 'rikku', 'paine'].map((id, i) => {
    const u = aiUnit(id, 'party', hp, i);
    u.hp = hp;
    u.mp = mp;
    return u;
  });
}

const RAW_16 = 0xffff;
const RAW_31 = 0x7fffffff;

/** The count of values in 0..65535 that are congruent to `r` modulo `m` (65,536 is not a multiple of 3, 5 or 6). */
export function residueCount(r: number, m: number): number {
  const total = 65536;
  return Math.floor(total / m) + (r < total % m ? 1 : 0);
}

class Stop extends Error {}

/**
 * Every outcome of `run` with its probability. `run(rng)` must build its own fresh state, play one decision and return a
 * string key for the outcome. `modulus` is a common multiple of every roll's `n` in that decision. The tests pass 120 (the least
 * common multiple of 1 to 6 and 8) wherever the script rolls once, on purpose: a table taken over exactly `n` classes cannot tell
 * `mod 3` from `mod 4`, so a mutant that changes the modulus would survive (Sandy's odds did in the first mutation pass); over 120
 * classes the two give different shares. Picks branch over 6 equal classes, which is exact for 1, 2, 3 and 6 candidates.
 */
export function exactTally(run: (rng: Rng) => string, modulus: number): Map<string, number> {
  const out = new Map<string, number>();
  const explore = (prefix: ReadonlyArray<{ value: number; p: number }>): void => {
    let i = 0;
    let want: 'roll' | 'pick' | null = null;
    const rng: Rng = {
      next: () => 0,
      int: (min: number, max: number) => {
        const entry = prefix[i++];
        if (entry !== undefined) return entry.value;
        want = max === RAW_16 ? 'roll' : max === RAW_31 ? 'pick' : null;
        if (want === null) throw new Error(`unexpected int(${min}, ${max}) in a script`);
        throw new Stop();
      },
      pick: () => {
        throw new Error('scripts draw through int(), not pick()');
      },
      seed: () => undefined,
      currentSeed: 0,
    };
    try {
      const key = run(rng);
      const p = prefix.reduce((w, e) => w * e.p, 1);
      out.set(key, (out.get(key) ?? 0) + p);
    } catch (e) {
      if (!(e instanceof Stop)) throw e;
      if (want === 'roll') {
        for (let r = 0; r < modulus; r++) explore([...prefix, { value: r, p: residueCount(r, modulus) / 65536 }]);
      } else {
        for (let r = 0; r < 6; r++) explore([...prefix, { value: r, p: 1 / 6 }]);
      }
    }
  };
  explore([]);
  return out;
}

/** The probability of one outcome (0 when it never happens). */
export function share(table: Map<string, number>, key: string): number {
  return table.get(key) ?? 0;
}

export function total(table: Map<string, number>): number {
  let sum = 0;
  for (const v of table.values()) sum += v;
  return sum;
}
