/**
 * **The planner**: the per-decision budget, the cache, and the prior.
 *
 * `./advisor.ts` enumerates and simulates; `./advisor-eval.ts` prices what is
 * coming; this file holds the three things that are about the *decision* rather
 * than about any one row:
 *
 *  1. **the budget**, expressed in work counts rather than milliseconds;
 *  2. **the cache**, so the FFX-2 Active pump cannot re-plan at 20 Hz;
 *  3. **the prior** — how far a simulated score has to beat the chapter's own
 *     line before the card is allowed to say something else.
 *
 * ## Why the budget is counts and not a clock
 *
 * A wall-clock deadline makes the card's answer depend on how busy the machine
 * is. Two runs of the same seed would then take different advice, every
 * acceptance number in `critic/bench/advisor-v2/` would be unreproducible, and
 * a regression would be indistinguishable from a slow afternoon. So the budget
 * is *simulations, forecasts and candidates*: the same board plans the same way
 * on any machine, in any process, forever [docs/plans/advisor-v2-review.md §4.6
 * and §8 R-2].
 *
 * Measured on this tree, forty seeds a chapter, 2026-09-21: p50 1.3–3.5 ms and
 * p95 2.4–5.7 ms per decision across all five chapters, comfortably inside the
 * 15 ms / 8 ms typical budgets the plan set — so the counts below are a ceiling
 * that protects the frame, not a cut the player will meet.
 *
 * ## Which game
 *
 * **Both** for the budget, the cache and the prior — they are properties of
 * advice [AGENTS.md rule 14]. The two numbers differ per game because the menus
 * do: FFX offers a measured 42.5 enabled rows on a Chapter 1 turn against
 * FFX-2's 15.5, and FFX-2 runs an **Active** ATB clock while the menu is open
 * (Bailey, 2026-09-21: Active only), so its ceiling is tighter on purpose.
 *
 * Pure and DOM-free.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';

/** How much work one decision is allowed to spend. Counts, never milliseconds. */
export interface PlanBudget {
  /** Previews across the whole decision. */
  maxSimulations: number;
  /** Enemy-intent forecasts. One per decision is enough; the plan is shared. */
  maxForecasts: number;
}

/**
 * The ceiling per game.
 *
 * FFX's 60 is the shipped `MAX_SIMULATIONS` and is kept: the measured cost at
 * that cap is 1.7 ms p50, so cutting it would buy nothing and could drop a
 * Phoenix Down off the end of a deep item list. FFX-2's is lower because the
 * clock is running under the menu and its menus are a third the size.
 */
export function budgetFor(game: BattleState['game']): PlanBudget {
  return game === 'ffx2'
    ? { maxSimulations: 40, maxForecasts: 1 }
    : { maxSimulations: 60, maxForecasts: 1 };
}

/**
 * **The prior.** How far a simulated score must beat the chapter's own line
 * before the card says something else.
 *
 * Three passes of `docs/handoff/fix3-advisor.md` left this open for Bailey — the
 * line was *pinned*, so a Mega Phoenix priced at 11 300 still lost to a line
 * worth 555. Bailey answered it on 2026-09-21: the ranking **may** outrank the
 * guide. So the line is no longer a pin; it is a prior with a margin.
 *
 * A **ratio**, not a constant, so it reads the same at Chapter 1's numbers and
 * Chapter 3's — and applied only when the line's own score is positive, because
 * "beat a negative number by 60 percent" is not a bar at all.
 */
export const PRIOR_MARGIN = 1.6;

/**
 * The flat credit the line carries, so it wins every tie and holds through
 * evaluation noise.
 *
 * Set below `SWITCH_PENALTY` (12 000) on purpose: it must never make a switch
 * the chapter merely tolerated outrank a real move.
 */
export const PRIOR_BONUS = 2_000;

/**
 * Does `score` clear the chapter line's `prior`?
 *
 * The line still decides what the chapter is *about*; this only decides whether
 * one particular board is the exception. When it returns `true` the card is
 * required to name the long plan in the same sentence
 * (`./advisor-say.ts#reasonForOverride`), so the player is never quietly taught
 * a different fight from the one the strategy panel is teaching.
 */
export function beatsPrior(score: number, prior: number): boolean {
  if (prior <= 0) return score > prior + PRIOR_BONUS;
  return score > prior * PRIOR_MARGIN + PRIOR_BONUS;
}

// ------------------------------------------------------------------- the cache

/**
 * One plan per `(game, nextSeq, actorId)`, plus a board digest.
 *
 * **This is the FFX-2 Active requirement** [docs/plans/advisor-v2-review.md
 * §4.7, R-5]. Under Active the clock runs while the menu is open and
 * `syncGauges` pumps the HUD at 20 Hz; without a cache every one of those
 * frames would re-plan a board that has not changed. `nextSeq` is the engine's
 * own event counter, so a board that *has* changed cannot share a key.
 *
 * The digest is belt and braces for the one thing `nextSeq` cannot rule out —
 * two different battles alive in one process, as the bench runs them — and is
 * cheap: HP and status counts, no allocation per combatant.
 *
 * Small and FIFO. A cache that grows is a leak in a page the player leaves open.
 */
const MAX_ENTRIES = 8;

export interface CacheKey {
  game: string;
  nextSeq: number;
  actorId: CombatantId;
  digest: number;
}

export function cacheKeyFor(state: Readonly<BattleState>, actorId: CombatantId): CacheKey {
  let digest = state.turn * 31;
  for (const id of [...state.activeIds, ...state.enemyIds]) {
    const c = state.combatants[id];
    if (!c) continue;
    digest = (digest * 33 + c.hp) | 0;
    digest = (digest * 33 + Object.keys(c.statuses).length) | 0;
  }
  return { game: state.game, nextSeq: state.nextSeq, actorId, digest };
}

function keyString(k: CacheKey): string {
  return `${k.game}|${k.nextSeq}|${k.actorId}|${k.digest}`;
}

/** A tiny FIFO cache of whatever the planner produced for one decision. */
export class PlanCache<T> {
  private readonly entries = new Map<string, T>();

  get(key: CacheKey): T | undefined {
    return this.entries.get(keyString(key));
  }

  set(key: CacheKey, value: T): void {
    const s = keyString(key);
    if (this.entries.has(s)) this.entries.delete(s);
    this.entries.set(s, value);
    while (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next();
      if (oldest.done === true) break;
      this.entries.delete(oldest.value);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
