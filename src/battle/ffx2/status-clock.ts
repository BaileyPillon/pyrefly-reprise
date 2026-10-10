/**
 * The status clocks, run by the game's own process (re-parity W4; **FFX-2 only**).
 *
 * `MsStatusProcess` (exe 0x00636e80, `kernel/status-timers.ts`) runs once per logic step for every character, after the ATB
 * process and the action dispatcher: the timers of Sleep, Confusion and Berserk fall by the raw speed; a timed group 2
 * status banks the speed it counts at and loses a count each time the bank reaches 1,500 units (Doom 10,000); Poison and
 * Regen bank the awake speed against a period of 16,000 and pay `(8 * max HP) >> 8` when it is passed. This module builds
 * the kernel's character record from a unit's statuses, runs it, and puts the answer back: the clocks into the status
 * instances, the expiries and payouts into events (`research/re-ffx2-atb-status.md` section 6).
 *
 * Where the game does something the engine cannot show yet, the closest honest thing is done and written down:
 * a Doom victim whose counter ran out is KO'd on the spot, where the game queues Death (command 0x3026) on itself and the
 * queue plays it a few steps later.
 */

import type { StatusId, StatusInstance } from '../common/types.ts';
import type { AiContext, Emit, Ffx2Unit } from './internal.ts';
import { GROUP1_STATUS, GROUP2_STATUS, slotOf } from './adapt/slots.ts';
import { has, statusWord1 } from './adapt/words.ts';
import { stopStateOf } from './atb-engine.ts';
import { aiScriptFor } from './ai/index.ts';
import { FFX2_CLOCK_OPEN } from './kernel/atb-clock.ts';
import { s8 } from './kernel/intops.ts';
import { FFX2_STATUS_ROM, statusProcess, type Ffx2TimerChr, type Ffx2TimerResult } from './kernel/status-timers.ts';
import { STATUS_COUNT } from './kernel/statusTypes.ts';
import { applyHpDelta, heal, type ResolveContext } from './resolve-hp.ts';
import { countUnits } from './statuses.ts';

/** The unit as `MsStatusProcess` reads it, or `null` when no clock of it could move (no timed status, no Poison, no Regen). */
function timerChr(u: Ffx2Unit): Ffx2TimerChr | null {
  const timers = new Array<number>(STATUS_COUNT).fill(0);
  const counters = new Array<number>(STATUS_COUNT).fill(0);
  const accumulators = new Array<number>(STATUS_COUNT).fill(0);
  let applied = 0;
  let clocked = false;
  for (const inst of Object.values(u.statuses) as StatusInstance[]) {
    const slot = slotOf(inst.id);
    if (slot === undefined) continue;
    if (slot.group === 1) {
      if (inst.ticksRemaining !== null && inst.ticksRemaining > 0) {
        timers[slot.index] = inst.ticksRemaining;
        applied |= 1 << slot.index;
        clocked = true;
      }
    } else if (inst.counter !== undefined) {
      counters[slot.index] = inst.counter;
      accumulators[slot.index] = inst.accumulator ?? 0;
      clocked = true;
    }
  }
  const poison = has(u, 'poison');
  const regen = has(u, 'regen');
  if (!clocked && !poison && !regen) return null;
  const { raw, awake, active } = u.gauge.speeds;
  return {
    inBattle: !u.removed,
    hidden: false,
    hp: u.hp,
    dead: !u.alive,
    status1: statusWord1(u),
    applied: applied >>> 0,
    timers,
    counters,
    accumulators,
    regenByte: regen ? Math.max(1, counters[3] ?? 0) : 0,
    poisonAcc: u.gauge.poisonAcc,
    regenAcc: u.gauge.regenAcc,
    poisonPeriod: FFX2_STATUS_ROM.poisonTime,
    regenPeriod: FFX2_STATUS_ROM.regenTime,
    poisonDamage: FFX2_STATUS_ROM.poisonDamage,
    regenDamage: FFX2_STATUS_ROM.regenDamage,
    maxHp: u.stats.maxHp,
    speeds: { raw, awake, active },
    stopState: stopStateOf(u),
    condemned: false,
  };
}

function remove(u: Ffx2Unit, status: StatusId, emit: Emit): void {
  if (u.statuses[status] === undefined) return;
  delete u.statuses[status];
  emit({ type: 'status-remove', targetId: u.id, status, reason: 'expired' });
}

/** Tell a script once per Regen payout that healed (Chapter XI's Sisters: +5 when Regen heals her, research ffx2-fallen-aeons §4.2). */
function notifyRegen(u: Ffx2Unit, hpBefore: number, amount: number, aiContext?: (unit: Ffx2Unit) => AiContext): void {
  if (u.side !== 'enemy' || aiContext === undefined) return;
  const onRegen = aiScriptFor(u.enemy?.aiScriptId).onRegen;
  if (onRegen === undefined) return;
  const gained = Math.min(u.stats.maxHp, hpBefore + amount) - hpBefore;
  if (gained > 0) onRegen(aiContext(u), gained);
}

/** Put one unit's process result back: the clocks, the expiries, the payout, the Doom victim. */
function apply(u: Ffx2Unit, r: Ffx2TimerResult, emit: Emit, ctx: ResolveContext, aiContext?: (unit: Ffx2Unit) => AiContext): void {
  const { chr, events } = r;
  // The clocks that kept running.
  GROUP1_STATUS.forEach((status, i) => {
    const inst = status === null ? undefined : u.statuses[status];
    if (inst !== undefined && inst.ticksRemaining !== null && (chr.timers[i] ?? 0) !== inst.ticksRemaining) inst.ticksRemaining = chr.timers[i] ?? 0;
  });
  const expiring = new Set(events.expiredGroup2.map((e) => e.index));
  GROUP2_STATUS.forEach((statuses, i) => {
    const first = statuses[0];
    const inst = first === undefined ? undefined : u.statuses[first];
    if (first === undefined || inst === undefined || inst.counter === undefined) return;
    const before = inst.counter;
    inst.counter = s8(chr.counters[i] ?? 0);
    inst.accumulator = chr.accumulators[i] ?? 0;
    inst.ticksRemaining = inst.counter * countUnits(i) - inst.accumulator;
    // A count lost by a status that is still on is announced; an expiry says so itself (the removal below).
    if (inst.counter !== before && !expiring.has(i)) emit({ type: 'status-tick', targetId: u.id, status: first, remaining: Math.max(0, inst.ticksRemaining) });
  });
  u.gauge.poisonAcc = chr.poisonAcc;
  u.gauge.regenAcc = chr.regenAcc;

  // The expiries, in the order the kernel reports them: group 1, then group 2.
  for (const i of events.expiredGroup1) {
    const status = GROUP1_STATUS[i];
    if (status !== null && status !== undefined) remove(u, status, emit);
  }
  for (const { index } of events.expiredGroup2) {
    const status = GROUP2_STATUS[index]?.[0];
    if (status !== undefined) remove(u, status, emit);
  }

  // The Poison or Regen payout: damage through the ordinary HP path (it can KO), or healing.
  const tick = events.tick;
  if (tick !== null && tick.amount !== 0) {
    if (tick.kind === 'poison') {
      emit({ type: 'damage', targetId: u.id, amount: tick.amount, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
      applyHpDelta(ctx, u, tick.amount);
    } else {
      const before = u.hp;
      heal(ctx, u, -tick.amount, 'regen');
      notifyRegen(u, before, -tick.amount, aiContext);
    }
  }

  // Doom ran out: Death is queued on the victim (command 0x3026, chance 255). The engine plays it at once.
  if (events.doom && u.alive) applyHpDelta(ctx, u, u.hp);
}

/**
 * `MsStatusProcess` for every unit, in slot order, once. `ordered` is the units sorted by kernel slot; the speeds each one
 * carries are the ones the ATB process wrote earlier in the same step (`atb-engine.ts runAtbProcess`).
 */
export function advanceStatusClocks(
  ordered: readonly Ffx2Unit[],
  emit: Emit,
  ctx: ResolveContext,
  aiContext?: (unit: Ffx2Unit) => AiContext,
): void {
  const batch: Array<{ id: number; chr: Ffx2TimerChr }> = [];
  const owners = new Map<number, Ffx2Unit>();
  for (const u of ordered) {
    if (!u.alive && Object.keys(u.statuses).length === 0) continue;
    const chr = timerChr(u);
    if (chr === null) continue;
    batch.push({ id: u.gauge.slot, chr });
    owners.set(u.gauge.slot, u);
  }
  if (batch.length === 0) return;
  for (const r of statusProcess(batch, FFX2_CLOCK_OPEN)) {
    const u = owners.get(r.id);
    if (u !== undefined) apply(u, r, emit, ctx, aiContext);
  }
}
