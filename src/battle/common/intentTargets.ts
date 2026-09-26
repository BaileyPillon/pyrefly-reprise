/**
 * Random targets in an enemy-intent prediction — shared by both games'
 * predictors (`src/battle/ffx/intent.ts`, `src/battle/ffx2/intent.ts`).
 *
 * PR-0153: the panel used to estimate a move against whichever character the
 * dry run happened to pick and print that one row under SCRIPTED. A script that
 * rolls its victim (`rng.pick(party)`) rolls it again when it really acts, after
 * the party's own turns have moved the stream; a record whose targeting is
 * `random-enemy` picks at resolve time, where the preview RNG always returns the
 * middle of the list. Either way the named victim was a guess shown as a fact.
 *
 * So the victim is measured the way the move is: the samples that rolled the
 * named move are compared on their target, and a declared-random record is
 * random by definition. When it is random, every candidate is estimated on its
 * own and the panel shows them all. Pure and deterministic (layering rule).
 */

import type { CombatantId, Targeting } from './types.ts';

/** The fields of one estimated row this module reads or rewrites. */
export interface RandomTargetRow {
  targetId: CombatantId;
  amount: number;
  min: number;
  max: number;
  hpFraction: number;
  lethal: boolean;
}

/** Every character a rolled move may land on, each with its own estimate. */
export interface RandomTarget<R extends RandomTargetRow = RandomTargetRow> {
  /** One row per candidate, in board order. */
  rows: R[];
  /** Each hit re-picks its victim, so every row is **one hit's** worth. */
  perHit: boolean;
  hits: number;
}

/** True for a record that picks a fresh victim at resolve time. */
export function isRandomTargeting(targeting: Targeting): boolean {
  return targeting === 'random-enemy' || targeting === 'random-ally';
}

/**
 * The candidates of a move whose victim is not settled, or `null` when it is.
 *
 * `sampled` holds the target list of every dry-run sample that rolled the same
 * move as the headline. A declared-random record takes its whole legal `pool`;
 * a single-target move is random when its samples named more than one victim,
 * and then lists every victim they named (never one the script cannot pick).
 */
export function randomTargetCandidates(
  targeting: Targeting,
  sampled: readonly (readonly CombatantId[])[],
  pool: () => readonly CombatantId[],
): CombatantId[] | null {
  if (isRandomTargeting(targeting)) {
    const all = [...new Set(pool())];
    return all.length > 1 ? all : null;
  }
  if (sampled.length === 0 || sampled.some((list) => list.length !== 1)) return null;
  const seen = [...new Set(sampled.map((list) => list[0]!))];
  if (seen.length < 2) return null;
  const order = pool();
  const rank = (id: CombatantId): number => {
    const i = order.indexOf(id);
    return i < 0 ? order.length : i;
  };
  return seen.sort((a, b) => rank(a) - rank(b));
}

/**
 * One estimated row per candidate. `estimateFor(id)` estimates the move aimed
 * at `id` and returns its rows; only `id`'s own row is kept (a drain's heal on
 * the user is not a victim). A per-hit volley that landed every hit on the aim
 * is divided back down to one hit by `divisor`, and its lethal flag re-read.
 * Fewer than two rows is not a choice worth showing: `null`.
 */
export function randomTargetRows<R extends RandomTargetRow>(
  ids: readonly CombatantId[],
  hits: number,
  perHit: boolean,
  divisor: number,
  estimateFor: (id: CombatantId) => readonly R[] | null,
): RandomTarget<R> | null {
  const rows: R[] = [];
  for (const id of ids) {
    const own = estimateFor(id)?.find((r) => r.targetId === id);
    if (!own) continue;
    if (divisor <= 1) {
      rows.push(own);
      continue;
    }
    const each = (n: number): number => Math.round(n / divisor);
    const hpFraction = own.hpFraction / divisor;
    rows.push({ ...own, amount: each(own.amount), min: each(own.min), max: each(own.max), hpFraction, lethal: hpFraction >= 1 });
  }
  return rows.length > 1 ? { rows, perHit: perHit && hits > 1, hits } : null;
}

/**
 * A preview RNG's `pick` when it has been told whom to aim at: the item that is
 * (or whose `id` is) `aim`, when the list holds it. Lets an estimate price a
 * random-target move against one chosen candidate (both `simulate.ts` files).
 */
export function aimedPick<T>(items: readonly T[], aim: CombatantId | undefined): T | undefined {
  if (aim === undefined) return undefined;
  return items.find((item) => item === aim || (item as { id?: unknown } | null)?.id === aim);
}
