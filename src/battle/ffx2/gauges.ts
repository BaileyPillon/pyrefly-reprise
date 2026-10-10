/**
 * FFX-2 gauges as the HUD and the turn logic read them (re-parity W4; **FFX-2 only**).
 *
 * The gauge itself is the GAME's (`atb-engine.ts`, on `kernel/atb*.ts`): a down-counter in the game's units that the
 * character's speed pays each logic step. What lives here is what everything else asks of it: whether a unit is READY,
 * the bar colour, and the HUD mirrors `AtbState.ticks`, `required` and `gauge` (`research/re-ffx2-atb-status.md` section 3).
 *
 * The HUD draws a bar `required` units long, where `required = floor(10000 * 70 / (AGI + 1))` is the standard wait (the Attack
 * row's cost). A bar fills as the recovery counter falls: after a command whose cost is the standard one it fills from empty,
 * after a cheaper command (a spell: 0) it starts full, after a dearer one it stays empty until the counter is inside the
 * standard wait. That is "how much of a standard wait is paid", which is the only reading a command-dependent counter allows.
 *
 * Haste and Slow are the kernel's speeds (x21/20 and /2 of the Config speed); they never touch the Agility stat, and they
 * share nothing with FFX's Haste (`docs/CONTRACTS.md`, "Do not share status logic between the two games").
 */

import type { AtbSnapshot, FFX2Combatant } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { ATB_BASE_VALUE, TICKS_PER_BAR } from './constants.ts';
import { Ffx2AtbState } from './kernel/atb-gauge.ts';

/** Units of a cost `value` at an Agility: `floor(10000 * value / (agility + 1))`, the game's `cost * 10000 / (AGI + 1)`. */
export function atbTicks(value: number, agility: number): number {
  return Math.floor((10000 * value) / (Math.max(0, agility) + 1));
}

/** `"<skillset> wait down"` shortens a cast by a percent of the whole (`kernel/atb-gauge.ts` `chargeTime` does the arithmetic in the engine). */
export function applyWaitDown(ticks: number, waitDownPercent: number): number {
  if (waitDownPercent <= 0) return ticks;
  return ticks - Math.floor((ticks * waitDownPercent) / 100);
}

/** Statuses that stop a gauge dead: Stop, Sleep, KO and Petrify (the kernel gives these units a speed of 0). */
export function isGaugeFrozen(c: FFX2Combatant): boolean {
  if (!c.alive || c.removed) return true;
  return Boolean(c.statuses.stop || c.statuses.sleep || c.statuses.petrify || c.statuses.ko);
}

/** Bar colour hint for the HUD. §1.1 — green normal, red hasted, gold slowed, white stopped. */
export function barState(c: FFX2Combatant): 'normal' | 'haste' | 'slow' | 'stop' {
  if (c.statuses.stop || !c.alive) return 'stop';
  if (c.statuses.slow) return 'slow';
  if (c.statuses.haste) return 'haste';
  return 'normal';
}

/** The standard gauge of an Agility: the Attack row's cost over (AGI + 1), at least 1 so the HUD always has a bar. */
export function baseRequired(agility: number): number {
  return Math.max(1, atbTicks(ATB_BASE_VALUE, agility));
}

/**
 * Is this unit READY for a decision: its gauge has run out, its thinking is over and it has been handed to its menu (a girl,
 * state 4), its script (a monster, 5), its AI (6) or its Confusion or Berserk pick (7, 8). A unit that is executing a command
 * (9), recovering or thinking is not; neither is one the clock cannot reach (dead, Stopped, asleep, petrified, ejected).
 */
export function isReady(c: Ffx2Unit): boolean {
  if (isGaugeFrozen(c)) return false;
  const s = c.gauge.state;
  return s >= Ffx2AtbState.Ready && s <= Ffx2AtbState.Berserk;
}

/** The fraction of the standard wait that is paid, 0 to 1 (the HUD's bar). A unit that is ready reads 1. */
export function fillOf(c: Ffx2Unit): number {
  if (isReady(c)) return 1;
  if (c.gauge.state === Ffx2AtbState.Executing) return 0; // a unit on the purple bar, or playing its command, has spent its gauge
  if (c.atb.required <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - Math.max(0, c.atb.recovery) / c.atb.required));
}

/** Recompute the HUD mirrors (`ticks`, `gauge`) from the recovery counter. */
export function refreshGauge(c: Ffx2Unit): void {
  const fill = fillOf(c);
  c.atb.ticks = Math.round(fill * c.atb.required);
  c.atb.gauge = Math.min(100, Math.round(fill * 100));
}

/** Build the HUD snapshot. `required` lets the HUD draw a shorter runway for a faster character. §1.2 */
export function buildSnapshot(order: readonly Ffx2Unit[], elapsedMs: number): AtbSnapshot {
  return {
    elapsedMs,
    bars: order.map((c) => ({
      actorId: c.id,
      fill: fillOf(c),
      required: c.atb.required,
      ready: isReady(c),
      charge: c.atb.charging
        ? 1 - Math.max(0, c.atb.charging.remainingTicks) / Math.max(1, c.atb.charging.totalTicks)
        : null,
      state: barState(c),
    })),
  };
}

/** Bar length as a fraction of one drawn bar. §1.2 — for HUD layout only. */
export function barLengthFraction(required: number): number {
  return Math.min(1, required / TICKS_PER_BAR);
}
