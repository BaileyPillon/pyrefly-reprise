/**
 * FFX-2 ATB gauges — fill, charge (CTIM) and recovery (RECTIM).
 *
 * The decoded model [ffx2-combat-core §1.2]:
 *
 * ```
 * ticks = floor(10000 * value / (agility + 1))     // the runway LENGTH
 * ```
 *
 * consumed at a **fixed** 3000 ticks/s. Agility shortens the runway; it does
 * not speed the fill. That is the reading the HUD draws and the one
 * `visual-bible §4.3` specifies, so `AtbState.required` is a *length* and a
 * fast dressphere visibly gets a shorter bar.
 *
 * Haste and Slow are multipliers on the **global tick rate** (x1.05 / x0.5) —
 * they never touch the Agility stat. This is X-2's Haste and it shares nothing
 * with FFX's Haste (which halves CTB recovery); see `docs/CONTRACTS.md`
 * "Do not share status logic between the two games".
 *
 * The four-phase pipeline a unit walks per turn:
 * ```
 * [recovery owed] -> [ATB fill to `required`] -> [command] -> [CTIM] -> [execute]
 * ```
 */

import type { AbilityDef, AtbSnapshot, Command, FFX2Combatant } from '../common/types.ts';
import {
  ATB_BASE_VALUE,
  ATB_INTERNAL_MAX_TICKS,
  BAR_INTERNAL_MAX,
  HASTE_TICK_MULTIPLIER,
  SLOW_CHARGE_VALUE_MULTIPLIER,
  SLOW_TICK_MULTIPLIER,
  TICKS_PER_BAR,
  TICK_RATE_BASE,
} from './constants.ts';

/** Ticks a unit must accumulate for a gauge entry of `value`. §1.2 */
export function atbTicks(value: number, agility: number): number {
  return Math.floor((10000 * value) / (Math.max(0, agility) + 1));
}

/** `"<skillset> wait down"` / Turbo / Lv.2–Lv.3 reducers shorten the GAUGE. §1.3 */
export function applyWaitDown(ticks: number, waitDownPercent: number): number {
  if (waitDownPercent <= 0) return ticks;
  return ticks - Math.floor((ticks * waitDownPercent) / 100);
}

/** Ticks -> milliseconds at the base rate. The presenter owns wall-clock time. */
export function ticksToMs(ticks: number): number {
  return (ticks / TICK_RATE_BASE) * 1000;
}

/** Milliseconds -> ticks at the base rate. */
export function msToTicks(ms: number): number {
  return (ms / 1000) * TICK_RATE_BASE;
}

/** Statuses that stop a gauge dead. §1.2 — Stop, Sleep, KO and Petrify all freeze it. */
export function isGaugeFrozen(c: FFX2Combatant): boolean {
  if (!c.alive || c.removed) return true;
  return Boolean(c.statuses.stop || c.statuses.sleep || c.statuses.petrify || c.statuses.ko);
}

/**
 * Per-combatant tick rate multiplier. 1.0 normally, x1.05 Hasted, x0.5 Slowed,
 * x0 frozen. Haste and Slow are mutually exclusive; Slow wins if both are
 * somehow present, matching the "gold bar" reading.
 */
export function tickMultiplier(c: FFX2Combatant): number {
  if (isGaugeFrozen(c)) return 0;
  if (c.statuses.slow) return SLOW_TICK_MULTIPLIER;
  if (c.statuses.haste) return HASTE_TICK_MULTIPLIER;
  return 1;
}

/** Bar colour hint for the HUD. §1.1 — green normal, red hasted, gold slowed, white stopped. */
export function barState(c: FFX2Combatant): 'normal' | 'haste' | 'slow' | 'stop' {
  if (c.statuses.stop || !c.alive) return 'stop';
  if (c.statuses.slow) return 'slow';
  if (c.statuses.haste) return 'haste';
  return 'normal';
}

/** The baseline runway length for this combatant, in ticks. */
export function baseRequired(agility: number): number {
  return Math.max(1, atbTicks(ATB_BASE_VALUE, agility));
}

/**
 * Extra recovery owed *beyond* the baseline runway.
 *
 * The research's `recoveryValue` (70 untagged, 140 for `2xRT`) is the whole
 * post-action gauge, and the baseline 70 **is** `required`. So an untagged or
 * `RT` action owes nothing extra and a `2xRT` action owes one more baseline
 * runway — which reproduces §1.4's 8.49 s at Agi 54 exactly. §1.4
 */
export function extraRecoveryTicks(recoveryValue: number, agility: number): number {
  const extra = Math.max(0, recoveryValue - ATB_BASE_VALUE);
  return atbTicks(extra, agility);
}

/** Charge (CTIM) length for an ability, honouring Slow's value doubling. §1.3 */
export function chargeTicksFor(
  ability: Pick<AbilityDef, 'chargeTicks'>,
  c: FFX2Combatant,
  waitDownPercent = 0,
): number {
  const value = (ability.chargeTicks ?? 0) * (c.statuses.slow ? SLOW_CHARGE_VALUE_MULTIPLIER : 1);
  if (value <= 0) return 0;
  return applyWaitDown(atbTicks(value, c.stats.agi), waitDownPercent);
}

/** Internal ceiling on accumulated ATB ticks. §1.2 — 416%, capped at 99 840. */
export function atbCeiling(required: number): number {
  return Math.min(required * BAR_INTERNAL_MAX, ATB_INTERNAL_MAX_TICKS);
}

/** True when a command may be issued: the green bar is completely full. §1.1 */
export function isReady(c: FFX2Combatant): boolean {
  if (isGaugeFrozen(c)) return false;
  if (c.atb.charging) return false;
  if (c.atb.recovery > 0) return false;
  return c.atb.ticks >= c.atb.required;
}

/** Recompute the HUD mirror `gauge` (0–100). */
export function refreshGauge(c: FFX2Combatant): void {
  const fill = c.atb.required > 0 ? c.atb.ticks / c.atb.required : 0;
  c.atb.gauge = Math.min(100, Math.round(fill * 100));
}

/** Reset the gauge to empty for the next cycle, owing `extra` recovery ticks first. */
export function beginRecovery(c: FFX2Combatant, extra: number): void {
  c.atb.ticks = 0;
  c.atb.recovery = Math.max(0, Math.round(extra));
  c.atb.charging = null;
  c.atb.required = baseRequired(c.stats.agi);
  refreshGauge(c);
}

/** Start the purple charge bar for `command`. §1.1 */
export function beginCharge(c: FFX2Combatant, command: Command, ticks: number): void {
  c.atb.ticks = 0;
  c.atb.charging = { commandRef: command, remainingTicks: ticks, totalTicks: ticks };
  refreshGauge(c);
}

/**
 * Advance one combatant by `ticks` of global clock.
 *
 * Returns `'charge-complete'` when the purple bar emptied this step (the queued
 * command must now fire) and `'ready'` when the green bar filled this step.
 * Recovery is paid first, then charge, then fill — a unit never does two of
 * those in one step, which keeps the sub-stepping in `engine.tick` exact.
 */
export function advanceGauge(c: FFX2Combatant, ticks: number): 'none' | 'ready' | 'charge-complete' {
  const mult = tickMultiplier(c);
  if (mult <= 0 || ticks <= 0) return 'none';
  let remaining = ticks * mult;

  if (c.atb.recovery > 0) {
    const paid = Math.min(c.atb.recovery, remaining);
    c.atb.recovery -= paid;
    remaining -= paid;
    if (remaining <= 0) return 'none';
  }

  if (c.atb.charging) {
    c.atb.charging.remainingTicks -= remaining;
    if (c.atb.charging.remainingTicks <= 0) {
      c.atb.charging.remainingTicks = 0;
      return 'charge-complete';
    }
    return 'none';
  }

  const wasReady = c.atb.ticks >= c.atb.required;
  c.atb.ticks = Math.min(atbCeiling(c.atb.required), c.atb.ticks + remaining);
  refreshGauge(c);
  return !wasReady && c.atb.ticks >= c.atb.required ? 'ready' : 'none';
}

/**
 * Ticks of *global clock* until this combatant's next state change, or
 * `Infinity` when nothing will ever happen (frozen, or already ready).
 */
export function ticksUntilNextEvent(c: FFX2Combatant): number {
  const mult = tickMultiplier(c);
  if (mult <= 0) return Infinity;
  if (c.atb.recovery > 0) return c.atb.recovery / mult;
  if (c.atb.charging) return Math.max(0, c.atb.charging.remainingTicks) / mult;
  const missing = c.atb.required - c.atb.ticks;
  if (missing <= 0) return 0;
  return missing / mult;
}

/** Empty a percentage of the target's ATB **or** CTIM bar. §2.8 "Delay effect". */
export function applyDelayEffect(c: FFX2Combatant, percent: number): void {
  const fraction = Math.max(0, Math.min(100, percent)) / 100;
  if (c.atb.charging) {
    // CTIM cannot be *cancelled* by Delay, only shortened.
    c.atb.charging.remainingTicks = Math.max(1, c.atb.charging.remainingTicks * (1 - fraction));
    return;
  }
  c.atb.ticks = Math.max(0, c.atb.ticks * (1 - fraction));
  refreshGauge(c);
}

/** A mid-CTIM action is cancelled outright and the ATB restarts from empty. §2.8 */
export function applyActionCancel(c: FFX2Combatant): boolean {
  if (!c.atb.charging) return false;
  c.atb.charging = null;
  c.atb.ticks = 0;
  c.atb.recovery = 0;
  refreshGauge(c);
  return true;
}

/** Build the HUD snapshot. `required` lets the HUD draw a shorter runway. §1.2 */
export function buildSnapshot(order: readonly FFX2Combatant[], elapsedMs: number): AtbSnapshot {
  return {
    elapsedMs,
    bars: order.map((c) => ({
      actorId: c.id,
      fill: c.atb.required > 0 ? c.atb.ticks / c.atb.required : 0,
      required: c.atb.required,
      ready: isReady(c),
      charge: c.atb.charging
        ? 1 - c.atb.charging.remainingTicks / Math.max(1, c.atb.charging.totalTicks)
        : null,
      state: barState(c),
    })),
  };
}

/** Bar length as a fraction of one drawn bar. §1.2 — for HUD layout only. */
export function barLengthFraction(required: number): number {
  return Math.min(1, required / TICKS_PER_BAR);
}
