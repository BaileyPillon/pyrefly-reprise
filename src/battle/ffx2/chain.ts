/**
 * The Chain system [ffx2-combat-core §1.7].
 *
 * Hits landing on the same target inside a ~2 s window stack a multiplier. This
 * is X-2's core offensive loop and the mechanic the encounter pacing is built
 * around, so it gets its own module rather than living inside the damage chain.
 *
 * Three rules matter more than the damage bonus itself:
 * - a target inside its window **cannot evade**;
 * - a target inside its window **cannot start its own action**;
 * - the counter is **per target**, so spreading damage throws it away.
 *
 * `SinirothX`'s flowchart writes step 13 as `x (1.4 + chain * 0.5)`. That is a
 * typo for `0.05` — with `0.5` the first link would be x1.9 and would blow past
 * the sourced "600% maximum" by chain 10. §1.7 records the conflict; we
 * implement `1.40 + 0.05 * chain`.
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
 * Step 13 of the damage flowchart.
 *
 * Chain 0 is "no chain running" and is a clean x1.0 — which is why
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

/** A chained target cannot evade. §2.6 "Guaranteed hit". */
export function cannotEvade(c: FFX2Combatant): boolean {
  return isChained(c);
}

/** A chained target cannot *start* an action. Already-started animations finish. §1.7 */
export function isActionLocked(c: FFX2Combatant): boolean {
  return CHAIN_LOCKS_ACTIONS && isChained(c) && c.atb.charging === null;
}

/**
 * Register a landed hit on `target` and return the chain count that applies to
 * **this** hit. Call once per hit, before computing damage.
 *
 * A hit inside an open window increments the counter; a hit with no window open
 * starts a fresh chain at 0. The window is then (re)opened — 3 s after a
 * critical, 2 s otherwise.
 */
export function registerHit(target: FFX2Combatant, crit: boolean): number {
  const count = isChained(target) ? Math.min(CHAIN_MAX, target.chainCount + 1) : 0;
  target.chainCount = count;
  target.chainWindowTicks = crit ? CHAIN_WINDOW_TICKS_CRIT : CHAIN_WINDOW_TICKS;
  return count;
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
