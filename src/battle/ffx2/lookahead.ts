/**
 * How many logic steps until something can happen (re-parity W4; **FFX-2 only**).
 *
 * The presenter asks the engine for `waiting` decisions: "nothing needs you for this long". The answer is the number of
 * logic steps until the soonest event any clock can produce: a recovery or a thinking time ending, a cast coming due, a
 * command's action time running out, a status timer or counter expiring, a Poison or Regen payout, a chain window closing.
 * It is a LOWER bound on purpose: the step loop runs every step exactly (`logic-step.ts`), so an estimate that is too small
 * only costs the presenter one more call, while one that is too large would run past an event the presenter wants to play.
 *
 * Read-only: it draws nothing and changes nothing.
 */

import type { StatusInstance } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { freshSpeeds } from './atb-engine.ts';
import { ticksUntilChainBreak } from './chain.ts';
import { slotOf } from './adapt/slots.ts';
import { Ffx2AtbState } from './kernel/atb-gauge.ts';
import { STATUS2_INFO } from './kernel/statusTypes.ts';
import { FFX2_STATUS_ROM, status2Speed } from './kernel/status-timers.ts';
import { countUnits } from './statuses.ts';

/** At least one step: a step always advances. */
const atLeastOne = (n: number): number => Math.max(1, n);

/** Steps until a unit's own gauge, charge or action time produces an event, or `Infinity`. */
export function gaugeSteps(u: Ffx2Unit, tick: number): number {
  if (!u.alive || u.removed) return Infinity;
  const s = u.gauge.state;
  const charge = u.atb.charging;
  if (s === Ffx2AtbState.Idle || s === Ffx2AtbState.Recover) { // IDLE starts recovering and pays its first tick in the same step
    if (u.atb.recovery <= 0) return 1;
    return tick > 0 ? atLeastOne(Math.ceil(u.atb.recovery / tick)) : Infinity;
  }
  if (s === Ffx2AtbState.Think) return atLeastOne(u.gauge.thinking);
  if (s === Ffx2AtbState.Executing) {
    if (charge !== null && charge.remainingTicks > 0) return tick > 0 ? atLeastOne(Math.ceil(charge.remainingTicks / tick)) : Infinity;
    return u.gauge.executing > 0 ? u.gauge.executing : Infinity;
  }
  return Infinity; // ready for a decision: the engine acts on it before it waits
}

/** Steps until a status clock of the unit produces an event, or `Infinity`. */
function statusSteps(u: Ffx2Unit, baseSpeed: number): number {
  if (!u.alive || u.removed) return Infinity;
  const entries = Object.values(u.statuses) as StatusInstance[];
  const poison = u.statuses['poison'] !== undefined;
  const regen = u.statuses['regen'] !== undefined;
  if (entries.length === 0) return Infinity;
  const sp = freshSpeeds(u, baseSpeed);
  const stop = u.statuses['stop'] !== undefined || u.statuses['petrify'] !== undefined;
  const speeds = { raw: sp.raw, awake: sp.awake, active: sp.active };
  let soonest = Infinity;
  for (const inst of entries) {
    const slot = slotOf(inst.id);
    if (slot === undefined) continue;
    if (slot.group === 1) {
      if (inst.ticksRemaining !== null && inst.ticksRemaining > 0 && sp.raw > 0) soonest = Math.min(soonest, atLeastOne(Math.floor(inst.ticksRemaining / sp.raw)));
    } else if (inst.counter !== undefined) {
      const flags = STATUS2_INFO[slot.index] ?? 0;
      const speed = status2Speed(flags, speeds);
      const floor = (flags & 8) !== 0 ? 1 : 0;
      const step = countUnits(slot.index);
      if (speed > 0 && inst.counter > floor && step > 0) {
        const bank = (inst.counter - floor) * step - (inst.accumulator ?? 0);
        soonest = Math.min(soonest, atLeastOne(Math.floor(bank / speed)));
      }
    }
  }
  if (!stop || sp.awake > 0) {
    const period = FFX2_STATUS_ROM.poisonTime;
    if (poison && sp.awake > 0) soonest = Math.min(soonest, atLeastOne(Math.floor((period - u.gauge.poisonAcc) / sp.awake)));
    if (regen && sp.awake > 0) soonest = Math.min(soonest, atLeastOne(Math.floor((period - u.gauge.regenAcc) / sp.awake)));
  }
  return soonest;
}

/** Logic steps until the soonest event on the field; `Infinity` when nothing is scheduled at all. */
export function stepsUntilNextEvent(units: readonly Ffx2Unit[], baseSpeed: number): number {
  let soonest = ticksUntilChainBreak(units);
  for (const u of units) {
    // The fastest tick the unit can have (a hit reaction that is on wears off): a LOWER bound on the steps a counter needs.
    const tick = u.alive && !u.removed ? freshSpeeds(u, baseSpeed, false).tick : 0;
    soonest = Math.min(soonest, gaugeSteps(u, tick), statusSteps(u, baseSpeed));
  }
  return soonest;
}
