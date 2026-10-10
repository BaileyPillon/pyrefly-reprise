/**
 * How the game's boss scripts roll, for the scripts read in re-parity AI lane C (the Leblanc Syndicate, the Den of
 * Woe, Ixion; **FFX-2 only**). `research/re-ffx2-ai-bahamut-vegnagun.md` 1.3 and 1.4, and
 * `research/re-ffx2-ai-leblanc-den-ixion.md` 1.3.
 *
 * - `random()` is the low 16 bits of one draw ({@link scriptValue}); a script's `random() % n` is that value `mod n`
 *   ({@link scriptMod}), so 65,536 values fall on `n` residues as evenly as 16 bits allow (`% 5` leaves residue 0 one
 *   value ahead). The engine's one seeded stream stands in for the game's stream 2 until the RNG batch.
 * - A target search keeps the girls that are alive and targetable (a petrified girl is alive), in slot order. With
 *   **one** candidate nothing is drawn; with two or more the pick is the `(value mod n)`-th candidate
 *   ({@link pickFrom}). `searchr` is weighted by closeness and facing, which needs positions the engine does not
 *   have, so it is the same uniform pick here (listed in `docs/handoff/re-parity-ai-ffx2-c.md`).
 * - The common pair, `searchr(all girls, alive)` then `searchr(that set, stat, max or min)`, still makes its first
 *   search's draw when two or more girls live and throws the pick away; the second keeps **every** candidate tied
 *   for the extreme value and picks among the ties ({@link extremePick}), drawing nothing for a single extreme.
 */

import type { Rng } from '../../common/types.ts';
import type { AiContext, Ffx2Unit } from '../internal.ts';

/** `random()`: the low 16 bits of one draw. */
export function scriptValue(rng: Rng): number {
  return rng.int(0, 0xffff);
}

/** `random() % n`. */
export function scriptMod(rng: Rng, n: number): number {
  return scriptValue(rng) % n;
}

/** The girls a search sees: alive and targetable, in slot order (Yuna, Rikku, Paine). */
export function girls(ctx: AiContext): Ffx2Unit[] {
  return ctx.party().slice().sort((a, b) => a.slot - b.slot);
}

/** A search over `pool`: the `(value mod n)`-th candidate; nothing is drawn for fewer than two. */
export function pickFrom<T>(rng: Rng, pool: readonly T[]): T | undefined {
  if (pool.length === 0) return undefined;
  if (pool.length === 1) return pool[0];
  return pool[rng.int(0, pool.length - 1)];
}

/** The id of a search over `pool` as a one-target list, or an empty list ("nothing", value 255). */
export function pickId(rng: Rng, pool: readonly Ffx2Unit[]): string[] {
  const unit = pickFrom(rng, pool);
  return unit === undefined ? [] : [unit.id];
}

/** The first search of a pair: made, and its pick thrown away. */
export function discardedPick(rng: Rng, candidates: number): void {
  if (candidates >= 2) rng.int(0, candidates - 1);
}

/**
 * The pair for "the girl with the highest or lowest `key`": the first search over `pool` is made and discarded,
 * then every candidate tied for the extreme is kept and one is picked.
 */
export function extremePick(rng: Rng, pool: readonly Ffx2Unit[], key: (unit: Ffx2Unit) => number, extreme: 'max' | 'min'): Ffx2Unit | undefined {
  discardedPick(rng, pool.length);
  if (pool.length === 0) return undefined;
  const values = pool.map(key);
  const best = extreme === 'max' ? Math.max(...values) : Math.min(...values);
  return pickFrom(rng, pool.filter((_, i) => values[i] === best));
}

/** `extremePick` as a one-target list. */
export function extremeId(rng: Rng, pool: readonly Ffx2Unit[], key: (unit: Ffx2Unit) => number, extreme: 'max' | 'min'): string[] {
  const unit = extremePick(rng, pool, key, extreme);
  return unit === undefined ? [] : [unit.id];
}
