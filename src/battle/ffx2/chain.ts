/**
 * The Chain system [ffx2-combat-core §1.7; re-parity W3, FFX-2 only].
 *
 * Hits landing on the same target while it is still reacting to the last one stack a multiplier. This
 * is X-2's core offensive loop and the mechanic the encounter pacing is built
 * around, so it gets its own module rather than living inside the damage chain.
 *
 * **The counter is the game's** (`kernel/apply.ts`, `research/re-ffx2-damage.md` section 4): a byte on the TARGET,
 * read BEFORE the hit (a target with counter n takes a positive hit multiplied by (n + 28) / 20; n = 0 is no
 * multiplier) and raised by 1 (stopping at 99) when a positive HP number is applied to it. So `chainCount` is the
 * number of landed hits in the current chain, and the next hit's multiplier is `chainMultiplier(chainCount)`.
 * The game clears the counter when the target is Stopped or Petrified or has finished reacting to the hit
 * (`kernel/apply.ts shouldResetChain`); the engine has no hit-reaction state, so the window below stands in for it
 * (2 s, 3 s after a critical, `[ffx2-combat-core §1.7]`; an open item in `docs/handoff/re-parity-w3.md`).
 *
 * Three rules matter more than the damage bonus itself:
 * - a target inside its window is **in hit reaction**: the hit kernel forces the hit for the evadable accuracy
 *   formulas (1 and 2), so it cannot evade (`adapt/inputs.ts hitTarget`);
 * - a target inside its window **cannot start its own action**;
 * - the counter is **per target**, so spreading damage throws it away.
 *
 * `SinirothX`'s flowchart writes step 13 as `x (1.4 + chain * 0.5)`. That is a
 * typo for `0.05` — with `0.5` the first link would be x1.9 and would blow past
 * the sourced "600% maximum" by chain 10. The game's code is (n + 28) / 20 = 1.40 + 0.05 n.
 */

import type { BattleEvent, FFX2Combatant } from '../common/types.ts';
import {
  CHAIN_BASE,
  CHAIN_LOCKS_ACTIONS,
  CHAIN_MAX,
  CHAIN_STEP,
  CHAIN_WINDOW_TICKS,
  CHAIN_WINDOW_TICKS_CRIT,
} from './constants.ts';

/**
 * The multiplier a hit takes on a target whose counter is `count` (the game's (n + 28) / 20).
 *
 * Counter 0 is "no chain running" and is a clean x1.0 — which is why
 * `BattleEvent.chain.multiplier` documents its range as 1.0–6.35 rather than
 * 1.40–6.35. The first hit on a fresh target deals normal damage; the second
 * hit inside the window is "Chain x1!" at x1.45.
 */
export function chainMultiplier(count: number): number {
  if (count <= 0) return 1;
  return CHAIN_BASE + CHAIN_STEP * Math.min(count, CHAIN_MAX);
}

/** True while the target is still recovering from the previous hit. §1.7 */
export function isChained(c: FFX2Combatant): boolean {
  return c.chainWindowTicks > 0;
}

/** A chained target cannot *start* an action. Already-started animations finish. §1.7 */
export function isActionLocked(c: FFX2Combatant): boolean {
  return CHAIN_LOCKS_ACTIONS && isChained(c) && c.atb.charging === null;
}

/**
 * The counter a hit landing on `target` right now reads: the running count while its window is open, else 0. A Stopped
 * or Petrified target reads 0 whatever its window says: the game's per-step update clears the counter for both
 * (`kernel/apply.ts shouldResetChain`).
 */
export function chainBefore(target: FFX2Combatant): number {
  if (target.statuses['stop'] !== undefined || target.statuses['petrify'] !== undefined) return 0;
  return isChained(target) ? target.chainCount : 0;
}

/**
 * Apply a positive HP hit to `target`'s chain (`kernel/apply.ts applyHpDamage`): the counter goes up by one, stopping
 * at 99, and the window opens again — 3 s after a critical, 2 s otherwise. `before` is the counter the
 * hit read ({@link chainBefore}). Heals, misses and immune hits never call this. Returns the new counter.
 */
export function bumpChain(target: FFX2Combatant, before: number, crit: boolean): number {
  target.chainCount = Math.min(CHAIN_MAX, before + 1);
  target.chainWindowTicks = crit ? CHAIN_WINDOW_TICKS_CRIT : CHAIN_WINDOW_TICKS;
  return target.chainCount;
}

/**
 * Advance every chain window by `ticks` of global clock and return a `chain`
 * event with `count: 0` for each window that just expired.
 *
 * Chain windows run on the **global** clock, not the target's own gauge rate —
 * they are a real-time recovery animation, not an ATB entry, so Haste and Slow
 * on the victim do not stretch them.
 */
export function advanceChainWindows(
  combatants: readonly FFX2Combatant[],
  ticks: number,
  emit: (e: Omit<Extract<BattleEvent, { type: 'chain' }>, 'seq'>) => void,
): void {
  if (ticks <= 0) return;
  for (const c of combatants) {
    if (c.chainWindowTicks <= 0) continue;
    c.chainWindowTicks -= ticks;
    if (c.chainWindowTicks > 0) continue;
    c.chainWindowTicks = 0;
    if (c.chainCount > 0) {
      c.chainCount = 0;
      emit({ type: 'chain', targetId: c.id, count: 0, multiplier: 1 });
    } else {
      c.chainCount = 0;
    }
  }
}

/** Ticks until the earliest chain window expires, or `Infinity`. */
export function ticksUntilChainBreak(combatants: readonly FFX2Combatant[]): number {
  let soonest = Infinity;
  for (const c of combatants) {
    if (c.chainWindowTicks > 0 && c.chainWindowTicks < soonest) soonest = c.chainWindowTicks;
  }
  return soonest;
}

/** Break a chain outright — the target died or left the field. §1.7 break condition 2. */
export function breakChain(c: FFX2Combatant): boolean {
  const had = c.chainCount > 0 || c.chainWindowTicks > 0;
  c.chainCount = 0;
  c.chainWindowTicks = 0;
  return had;
}
