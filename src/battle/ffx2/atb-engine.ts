/**
 * The engine's use of the game's ATB kernels (re-parity W4; **FFX-2 only**).
 *
 * `kernel/atb*.ts` hold the game's gauge, proven against FFX-2.exe: the speeds of a logic step, the recovery a command
 * leaves, the thinking time, the ready list, the charge of a cast, Delay damage and the magic cancel. This module is the
 * one place engine state becomes the kernels' inputs and their answers become engine state. Every input names the field
 * of the game's character it stands for; `docs/handoff/re-parity-w4.md` section 1 is the table of all of them, with what
 * the engine cannot supply and why each is the value it is.
 *
 * The engine resolves a command in one go, at the moment it is chosen (or released from its charge), where the game plays
 * its animation first. A command therefore ENDS, for the gauge, when the engine resolves it, plus the action time
 * (`action-time.ts`, an estimate that is off unless a formation turns it on); `completeCommand` is `MsCommandComplete`.
 */

import type { Command } from '../common/types.ts';
import type { Ffx2Draw } from './kernel/rng.ts';
import type { Ffx2Gauge, Ffx2Unit } from './internal.ts';
import { ATB_BASE_VALUE } from './constants.ts';
import { baseRequired, refreshGauge } from './gauges.ts';
import { assignSlotIds, statByte } from './adapt/inputs.ts';
import { has, specialWord, statusWord1 } from './adapt/words.ts';
import { FFX2_CLOCK_OPEN, atbSpeeds, type Ffx2AtbSpeeds } from './kernel/atb-clock.ts';
import {
  Ffx2AtbState,
  activePartyCounts,
  chargeTime,
  commandComplete,
  type Ffx2ChargeRow,
} from './kernel/atb-gauge.ts';
import { atbInit } from './kernel/atb-start.ts';
import { atbTick, type Ffx2AtbUnit } from './kernel/atb-tick.ts';
import { applyAtbDamage, chargeTick } from './kernel/atb-interrupt.ts';
import { stopState } from './kernel/atb-clock.ts';

/** A gauge that has not started: IDLE, nothing owed, no speeds yet. */
export function newGauge(slot = 0): Ffx2Gauge {
  return {
    state: Ffx2AtbState.Idle,
    slot,
    recoveryMax: 0,
    thinking: 0,
    carry: 0,
    executing: 0,
    costAtb: ATB_BASE_VALUE,
    speeds: { raw: 0, awake: 0, active: 0, tick: 0 },
    poisonAcc: 0,
    regenAcc: 0,
    hitReaction: 0,
    readyKey: Number.MAX_SAFE_INTEGER,
  };
}

/** Give every unit its kernel slot (the party 0 to 14, the enemies 15 to 30, each side by slot then position). */
export function assignSlots(units: readonly Ffx2Unit[]): void {
  const ids = assignSlotIds(units);
  for (const u of units) u.gauge.slot = ids.get(u) ?? 0;
}

/** The units in the order the game visits its characters: ascending kernel slot. */
export function bySlot(units: readonly Ffx2Unit[]): Ffx2Unit[] {
  return [...units].sort((a, b) => a.gauge.slot - b.gauge.slot);
}

/** `stop` state of the kernel (`MsStatCheckStop`): 4 asleep, 2 petrified, 1 Stopped. */
export function stopStateOf(u: Ffx2Unit): number {
  // The kernel's `stopState` reads two bits of the status word (Sleep 4, Petrify 2) and the Stop byte; the step loop asks for it for every
  // unit several times a step, so the two bits are read straight off the unit instead of building the whole word (`stopStateOfWord` is the
  // same answer through the kernel, pinned by `parity-ffx2-engine-atb-hand.test.ts`).
  return (has(u, 'sleep') ? 4 : 0) | (has(u, 'petrify') ? 2 : 0) | (has(u, 'stop') ? 1 : 0);
}

/** {@link stopStateOf} through the kernel's `MsStatCheckStop` and the full status word: the slow, reference form. */
export function stopStateOfWord(u: Ffx2Unit): number {
  return stopState({ status1: statusWord1(u), stopStage: has(u, 'stop') ? 1 : 0, condemned: false });
}

/** One unit as `MsChrATBprocess` sees it. */
export function kernelUnit(u: Ffx2Unit): Ffx2AtbUnit {
  const girl = u.side === 'party';
  return {
    id: u.gauge.slot,
    chr: {
      atbEnabled: true,
      condemned: false, // a Doom victim is KO'd the moment the counter runs out (`status-clock.ts`)
      inBattle: !u.removed,
      dead: !u.alive,
      held: false, // `Chr+0xe72`, set by a dress change: the engine's change resolves at once
      state: u.gauge.state,
      recovery: u.atb.recovery,
      tick: 0, // written by the kernel (`atbSpeeds`)
      thinking: u.gauge.thinking,
      thinkingTick: 1,
      pendingAnimation: false,
      motion: false,
    },
    speed: {
      hasted: has(u, 'haste'),
      slowed: has(u, 'slow'),
      stopState: stopStateOf(u),
      // The game's own rule halves the tick while the charging flag `Chr+0xd65` is set, but the flag stayed 0 through every charge
      // countdown on the running game (`research/re-ffx2-timing-measured.md` section 6): in play only a hit reaction halves.
      charging: false,
      // The hit reaction is a motion-system state the exe holds no length for: the engine runs it for the 15 steps the running game
      // showed after a weak Delay hit (HIT_REACTION_STEPS), from the moment a damaging hit lands.
      hitReaction: u.gauge.hitReaction > 0,
      // `Chr+0x3a6` bit 1: a monster whose row says hit reactions do not slow it (every boss).
      hitReactionExempt: (specialWord(u) & 2) !== 0,
    },
    mode: girl ? 1 : 2,
    confused: false, // Confusion's own pick (state 7) is not modelled: a confused girl keeps her menu (W3 handoff section 7, item 7)
    berserk: girl && has(u, 'berserk'), // a Berserked enemy keeps running its script (as before)
  };
}

/** The speeds a unit would have if the next step ran now (the statuses may have changed since the last step wrote `gauge.speeds`). */
export function freshSpeeds(u: Ffx2Unit, baseSpeed: number, withHitReaction = true): Ffx2AtbSpeeds {
  const k = kernelUnit(u);
  if (k.speed === undefined) throw new Error('freshSpeeds: a unit has a speed');
  return atbSpeeds({ ...k.speed, base: baseSpeed, ...(withHitReaction ? {} : { hitReaction: false }) });
}

/** What one pass of the ATB process did, by unit. */
export interface AtbProcessResult {
  /** Units whose recovery ended this step (Defense is cleared for them), in slot order. */
  recoveryEnded: Ffx2Unit[];
  /** Units that became ready this step, in the order the game hands them to its action request (lowest counter first). */
  readyOrder: Ffx2Unit[];
}

/**
 * `MsChrATBprocess` for every unit, once: the speeds, then recovery, thinking and the ready list, then the hand-off. The
 * engine decides every command itself, after the pass (`engine.ts`), so the kernel's two action requests answer "no command
 * yet": a girl's menu opens (state 4), a monster waits for its script (5), a Berserked girl for her pick (8).
 */
export function runAtbProcess(ordered: readonly Ffx2Unit[], baseSpeed: number): AtbProcessResult {
  const res = atbTick(
    ordered.map(kernelUnit),
    FFX2_CLOCK_OPEN,
    { baseSpeed, thinkingTick: 1 },
    { ready: () => false, poll: (_id, state) => state },
  );
  ordered.forEach((u, i) => {
    const k = res.units[i];
    const s = res.speeds[i];
    if (k === undefined || s === undefined) throw new Error('runAtbProcess: the kernel dropped a unit');
    u.gauge.state = k.chr.state;
    u.atb.recovery = k.chr.recovery;
    u.gauge.thinking = k.chr.thinking;
    u.gauge.speeds = s;
    refreshGauge(u);
  });
  const bySlotId = new Map(ordered.map((u) => [u.gauge.slot, u]));
  const pick = (ids: readonly number[]): Ffx2Unit[] => ids.flatMap((id) => bySlotId.get(id) ?? []);
  return { recoveryEnded: pick(res.recoveryEnded), readyOrder: pick(res.readyOrder) };
}

/** The party side of `pp_btl_get_stat`'s "active party" counts a monster's thinking time reads. */
export function partyCountsOf(units: readonly Ffx2Unit[]): { count: number; standing: number } {
  return activePartyCounts(
    units
      .filter((p) => p.side === 'party')
      .slice(0, 3)
      .map((p) => ({ slot: p.gauge.slot, inBattle: !p.removed, hidden: false, dead: !p.alive, petrified: has(p, 'petrify') })),
  );
}

/**
 * `MsCommandComplete` (exe 0x00640190): the unit's command has ended, so it recovers. The recovery is the ended command's
 * ATB cost over (AGI + 1) plus the delay it took while executing; a monster also waits 30 steps for every fallen girl. The
 * state goes back to IDLE, from where the next step starts the recovery. A dead unit is left alone.
 */
export function completeCommand(u: Ffx2Unit, costAtb: number, units: readonly Ffx2Unit[], idle = false): void {
  const counts = partyCountsOf(units);
  // An idle wait (RC3, ai/idle.ts AI_IDLE_STEPS) is not a command: the thinking time is a command's end, so a wait adds none.
  const r = commandComplete(
    {
      dead: !u.alive,
      costAtb,
      agi: statByte(u.stats.agi),
      carry: u.gauge.carry,
      thinking: { chrId: u.gauge.slot, base: 0, isMonster: u.side === 'enemy' && !idle, partyCount: counts.count, partyStanding: counts.standing },
    },
    () => {
      throw new Error('the thinking base is 0 in play, so thinking draws nothing (research/re-ffx2-atb-status.md section 3.4)');
    },
  );
  u.gauge.executing = 0;
  u.gauge.idleWait = false;
  u.gauge.idleWake = 0;
  u.gauge.state = Ffx2AtbState.Idle;
  if (r.recovery === null) return;
  u.atb.recovery = r.recovery;
  u.gauge.recoveryMax = r.recovery;
  u.gauge.thinking = r.thinking ?? 0;
  u.gauge.carry = r.carry ?? 0;
  refreshGauge(u);
}

/**
 * An event the waiting unit asked to be woken by has happened (RC3, `ai/idle.ts`): its idle wait ends now, so the next logic step makes it ready and
 * its script is polled one step after the event, as the game's every-step poll would find it. A unit that is not idle-waiting, or did not ask for
 * this event, is left alone.
 */
export function wakeIdle(u: Ffx2Unit, units: readonly Ffx2Unit[], mask: number): void {
  if (u.gauge.idleWait !== true || ((u.gauge.idleWake ?? 0) & mask) === 0) return;
  completeCommand(u, 0, units, true);
}

/**
 * The cast time of a command (`atb_charge_time`, exe 0x00644520), in units: `cost_cast * 10000 / (AGI + 1)`, shortened by
 * the girl's cast-speed entries. The engine keeps one such entry per girl, the Garment Grid gate's "wait down" percent, and
 * applies it to every cast of hers (the gate names a skillset; the auto-ability tables that say which commands it covers are
 * not decoded). The kernel takes it as an entry that names this very command.
 */
export function castTime(u: Ffx2Unit, commandId: number, costCast: number, waitDownPercent: number): number {
  if (costCast <= 0) return 0;
  const row: Ffx2ChargeRow = { costCast, menuFlags: 0, subMenu: 0 };
  const cuts = waitDownPercent > 0 ? [{ commandId, percent: waitDownPercent }] : [];
  return chargeTime(statByte(u.stats.agi), commandId, row, cuts, () => ({ menuFlags: 0, category: 0 }));
}

/** Start the purple charge bar (`charge_start`): the remaining time and the maximum are both the cast time; the unit is executing. */
export function beginCharge(u: Ffx2Unit, command: Command, units: number): void {
  u.atb.charging = { commandRef: command, remainingTicks: units, totalTicks: units };
  u.gauge.state = Ffx2AtbState.Executing;
  refreshGauge(u);
}

/**
 * `charge_tick` (exe 0x00644770) for every unit that is charging: the remaining time falls by the caster's own tick, which
 * is the FULL tick (the charging halving never happened on the running game). A Stopped, asleep or petrified caster has a
 * tick of 0. Returns the units whose cast is now due (remaining at or below 0), in slot order.
 */
export function tickCharges(ordered: readonly Ffx2Unit[]): Ffx2Unit[] {
  const due: Ffx2Unit[] = [];
  for (const u of ordered) {
    const c = u.atb.charging;
    if (c === null || c.remainingTicks <= 0) continue;
    const next = chargeTick({ remaining: c.remainingTicks, max: c.totalTicks }, u.gauge.speeds.tick, true, false, stopStateOf(u));
    c.remainingTicks = next.remaining;
    if (next.remaining <= 0) due.push(u);
  }
  return due;
}

/**
 * `apply_atb_damage` (exe 0x0061b620) on one unit: Delay damage. A unit charging a cast has the cast LENGTHENED; one that is
 * executing banks the delay for its next recovery; any other has its recovery set back (a ready or thinking unit starts a new
 * recovery) and, for a positive amount, its open menu closed. Returns whether a menu closed.
 */
export function applyDelay(u: Ffx2Unit, damage: number): boolean {
  const charge = u.atb.charging;
  const r = applyAtbDamage(
    {
      state: u.gauge.state,
      recovery: u.atb.recovery,
      recoveryMax: u.gauge.recoveryMax,
      carry: u.gauge.carry,
      charging: charge !== null,
      chargeRemaining: charge?.remainingTicks ?? 0,
      chargeMax: charge?.totalTicks ?? 0,
      chargeReleased: 0,
    },
    damage,
  );
  u.gauge.state = r.state;
  u.atb.recovery = r.recovery;
  u.gauge.recoveryMax = r.recoveryMax;
  u.gauge.carry = r.carry;
  if (charge !== null) {
    charge.remainingTicks = r.chargeRemaining;
    charge.totalTicks = r.chargeMax;
  }
  refreshGauge(u);
  return r.closeMenu;
}

/**
 * A command in flight is dropped (the game clears the character's command queue when it is KO'd, petrified, ejected or
 * Stopped): the charge goes, the unit is idle and recovers from the counter it has.
 */
export function dropAction(u: Ffx2Unit): void {
  u.atb.charging = null;
  u.pendingCommand = null;
  u.gauge.executing = 0;
  u.gauge.idleWait = false;
  u.gauge.idleWake = 0;
  if (u.gauge.state === Ffx2AtbState.Executing) u.gauge.state = Ffx2AtbState.Idle;
}

/**
 * A hit's magic cancel took (`magic_cancel`, exe 0x00618dd0): the cast on the purple bar is aborted. The command ends at once and
 * the unit recovers by that command's own ATB cost. What the game's sequence does with the aborted command is not decoded, so
 * this is the engine's closest reading.
 */
export function cancelCast(u: Ffx2Unit, units: readonly Ffx2Unit[]): void {
  u.atb.charging = null;
  u.pendingCommand = null;
  completeCommand(u, u.gauge.costAtb, units);
}

/**
 * The gauge of a unit that was just KO'd (`pp_ko_resolve` calls `MsChrAtbInit(chr, 1, -1)`, exe 0x00634700): the counter
 * becomes the standard gauge, so a revived unit waits a whole recovery, the state goes to IDLE, and the call draws its one
 * value (from the unit's own stream) whether it uses it or not. A KO also clears the command queue.
 */
export function resetGaugeOnKo(u: Ffx2Unit, units: readonly Ffx2Unit[], draw: Ffx2Draw): void {
  dropAction(u);
  u.gauge.hitReaction = 0;
  const counts = partyCountsOf(units);
  const r = atbInit(
    {
      chrId: u.gauge.slot,
      agi: statByte(u.stats.agi),
      costAtb: ATB_BASE_VALUE,
      carry: u.gauge.carry,
      randomStart: false,
      deadOrStone: false,
      lead: false, // Initiative is an auto-ability the engine does not model
      isMonster: u.side === 'enemy',
      aided: false,
      thinkingBaseArg: -1,
      thinking: { baseBefore: 0, partyCount: counts.count, partyStanding: counts.standing },
    },
    draw,
  );
  u.atb.recovery = r.start;
  u.gauge.recoveryMax = r.full;
  u.gauge.thinking = r.thinking;
  u.gauge.carry = r.carry;
  u.gauge.state = Ffx2AtbState.Idle;
  u.atb.required = baseRequired(u.stats.agi);
  refreshGauge(u);
}

/** The number of steps of a command's action time, from the battle's estimate (0 when the formation has none). */
export function actionSteps(seconds: number, stepsPerSecond: number): number {
  return Math.max(0, Math.round(seconds * stepsPerSecond));
}
