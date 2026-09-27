/**
 * FF7's running clock: the three Config modes, the grace pause, ticks and
 * milliseconds, and the step that moves every Turn Timer to the next fill.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.** The rates themselves are in
 * `atb.ts` [core §2.1 to §2.4]; this file is what the engine facade calls.
 *
 * **Estimates here, each said to Bailey as "our estimate":**
 * - {@link TICKS_PER_SECOND}: the tick's real length is `[unsourced]` (core §2.2,
 *   §15.1 Q1); 30 per second is the NTSC inference of the earlier D:\FF7 research.
 *   It is the one constant between the engine's ticks and the presenter's ms.
 * - {@link gracePauseTicks}: the grace pause's rule is sourced (core §2.5, wiki),
 *   its length is not (Q2); ours is proportional to Speed Value, as Q2 suggests:
 *   `[SpeedValue / 6]` ticks, 15 at the default Battle Speed (half a second at 30 Hz).
 */

import type { Ff7AtbMode, Ff7Combatant } from '../common/types.ts';
import { TURN_TIMER_FULL, speedValue } from './atb.ts';
import { trunc } from './stats.ts';

/** Recommended is FF7's default mode [core §2.5, single source: wiki battle system]. */
export const DEFAULT_FF7_ATB_MODE: Ff7AtbMode = 'recommended';

/** Ticks per real second [core §2.2 `[unsourced]`; **our estimate**, the D:\FF7 NTSC inference]. */
export const TICKS_PER_SECOND = 30;

/** The grace pause's divisor of Speed Value [core §2.5 rule, length Q2 **our estimate**]. */
export const GRACE_SPEED_DIVISOR = 6;

/** Grace-pause length in ticks at a Battle Speed [core §2.5; length **our estimate**, Q2]. */
export function gracePauseTicks(battleSpeed: number): number {
  return trunc(speedValue(battleSpeed) / GRACE_SPEED_DIVISOR);
}

/**
 * Recommended and Wait pause briefly after an action is queued or a party gauge
 * fills; Active has no grace pause [core §2.5, single source: wiki footnote].
 */
export function modeHasGracePause(mode: Ff7AtbMode): boolean {
  return mode !== 'active';
}

/**
 * Does an open command menu hold the clock right now? Only Wait, and only while
 * the player targets or is in a sub-menu (Magic, Item lists); the top command list
 * runs [core §2.5]. Recommended and Active never hold for a menu.
 */
export function clockHeldByMenu(mode: Ff7AtbMode, menuOpen: boolean, level: 'top' | 'deep'): boolean {
  return mode === 'wait' && menuOpen && level === 'deep';
}

/** The presenter's two-way view of the mode (its chip and its pump): Wait is `'wait'`, the others run under a menu. */
export function presenterMode(mode: Ff7AtbMode): 'wait' | 'active' {
  return mode === 'wait' ? 'wait' : 'active';
}

/** Whole ticks in `ms` of real time, and the ms left over. */
export function msToTicks(ms: number): { ticks: number; restMs: number } {
  const exact = (Math.max(0, ms) * TICKS_PER_SECOND) / 1000;
  const ticks = Math.floor(exact + 1e-9);
  return { ticks, restMs: Math.max(0, ms - (ticks * 1000) / TICKS_PER_SECOND) };
}

/** Real ms for `ticks`, rounded up so `msToTicks(ticksToMs(n)).ticks >= n`. */
export function ticksToMs(ticks: number): number {
  return Math.ceil((ticks * 1000) / TICKS_PER_SECOND);
}

/** A unit whose Turn Timer is running: alive, on the field, not already full. */
export function timerRuns(c: Ff7Combatant): boolean {
  return c.alive && !c.removed && !c.ff7.atb.ready;
}

/** Ticks until the soonest running Turn Timer fills, or Infinity when none runs [core §2.3]. */
export function ticksToNextFill(units: readonly Ff7Combatant[], increase: Readonly<Record<string, number>>): number {
  let best = Number.POSITIVE_INFINITY;
  for (const c of units) {
    if (!timerRuns(c)) continue;
    const inc = increase[c.id] ?? 0;
    if (inc <= 0) continue;
    best = Math.min(best, Math.max(0, Math.ceil((TURN_TIMER_FULL - c.ff7.atb.turnTimer) / inc)));
  }
  return best;
}

/**
 * Advance every running Turn Timer by `ticks` and return the units that filled,
 * in slot order (party first, then enemies: our estimate for a same-tick tie,
 * core §2.6). The V-Timer advances too; nothing in the slice reads it yet.
 */
export function advanceTimers(
  units: readonly Ff7Combatant[],
  increase: Readonly<Record<string, number>>,
  vIncrease: number,
  ticks: number,
): Ff7Combatant[] {
  const filled: Ff7Combatant[] = [];
  const n = Math.max(0, ticks);
  for (const c of units) {
    if (!c.alive || c.removed) continue;
    c.ff7.atb.vTimer += vIncrease * n;
    if (c.ff7.atb.ready) continue;
    const next = Math.min(TURN_TIMER_FULL, c.ff7.atb.turnTimer + (increase[c.id] ?? 0) * n);
    c.ff7.atb.turnTimer = next;
    if (next >= TURN_TIMER_FULL) {
      c.ff7.atb.ready = true;
      filled.push(c);
    }
  }
  return filled;
}
