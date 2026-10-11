/**
 * Equipment auto-statuses and SOS statuses, carried out in the engine (re-parity RC4 lane FFX-E; **FFX only**).
 *
 * `kernel/auto-status.ts` is the game's apply / restore / toggle / sweep over a character's status words and counters, proven against FFX.exe. A
 * character that wears an Auto-Shell, Auto-Haste or SOS ability keeps that machinery's memory in `ActorRuntime.auto` (the words the last apply used, what
 * it overwrote, the weak level it was made for); everyone else has none and none of this runs for them. This module hands the kernel the engine's status
 * words and counters (`adapt/status.ts`), and carries its answer back onto the combatant's statuses with the events the engine always emitted:
 *
 * - {@link startAutoStatuses}: the battle's first apply (`pp_BtlInitChr`, VA 0x0079b4f0), silent like the grant it replaces;
 * - {@link sweepAutoStatuses} / {@link toggleAutoStatus}: the SOS toggle. The game runs it for all 31 characters at the end of EVERY action (VA
 *   0x007b20e0 to 0x007af4b0) and for one character after a Regen payout or a Poison tick (VA 0x007af4f0, 0x007afab0); a character whose weak level is not the
 *   level its statuses were applied for gets a restore and an apply. The level is `weakLevel(HP, max HP)`; 1 and 2 are "under half" and switch the SOS set on;
 * - {@link reviveAutoStatuses}: a revive (VA 0x0078d530 with its flag set) and a Petrify that ends (VA 0x0078e150) restore and apply again, because the KO reset
 *   and the Petrify wiped the counters.
 *
 * The engine's `critical` pseudo-status stays what it was: the weak level read at once, after every HP change. It is the level byte the Overdrive gain
 * reads (`pp_BtlOdAdd`), which the game refreshes after every hit; only the statuses it switches wait for the sweep.
 */

import type { FFXCombatant, StatusId, StatusInstance } from '../../common/types.ts';
import { TEMPORAL_COUNT, type AutoChr, type AutoState, freshAutoState, reapplyAuto, applyAuto, sosToggle, weakLevel } from '../kernel/auto-status.ts';
import type { GearResult } from '../kernel/gear.ts';
import { type Ctx, allCombatants, rtOf, statusOf } from '../state.ts';
import { removeStatus } from '../statuses.ts';
import { gearOf } from './gear.ts';
import { TEMPORAL_STATUS_IDS, temporalCounters } from './status.ts';
import { extraWord, permWord } from './words.ts';

const NUL_SLOTS = new Set([6, 7, 8, 9]);

function hasWords(g: GearResult): boolean {
  return g.auto.some((w) => w !== 0) || g.sos.some((w) => w !== 0);
}

/**
 * The memory of this character's machinery, or `undefined` for a character whose gear gives no auto or SOS status. Created on first use when a
 * runtime built for a preview (`simulate.ts`) does not carry it.
 */
function stateOf(ctx: Ctx, c: FFXCombatant): AutoState | undefined {
  const rt = rtOf(ctx, c.id);
  if (rt.auto !== undefined) return rt.auto;
  if (c.equipment === undefined) return undefined;
  const g = gearOf(c);
  if (!hasWords(g)) return undefined;
  rt.auto = freshAutoState(g.auto, g.sos, g.sosFlag);
  return rt.auto;
}

/** The character as the kernel reads it: its statuses as words and counters, the machinery's memory, and the weak level of its HP right now. */
function chrOf(ctx: Ctx, c: FFXCombatant, st: AutoState): AutoChr {
  return {
    perm: permWord(c) & 0xfff,
    counters: temporalCounters(c),
    extra: extraWord(c),
    bkPerm: st.bkPerm,
    bkCounters: st.bkCounters,
    bkExtra: st.bkExtra,
    live: st.live,
    equip: st.equip,
    sos: st.sos,
    sosFlag: st.sosFlag,
    weak: weakLevel(c.hp, c.stats.maxHp),
    applied: st.applied,
    regenTicks: rtOf(ctx, c.id).regenTicks,
  };
}

/** A status at a counter value: 255 is "until removed" (permanent, undispellable), 1 to 254 the turns (the charges, for a Nul status). */
function instanceFor(id: StatusId, slot: number, value: number): StatusInstance {
  const permanent = value === 255;
  return NUL_SLOTS.has(slot)
    ? { id, turnsRemaining: null, ticksRemaining: null, charges: permanent ? null : value, stacks: 0, permanent }
    : { id, turnsRemaining: value, ticksRemaining: null, charges: null, stacks: 0, permanent };
}

/** Write one counter back onto the combatant's statuses. `silent`: no events (the battle's first apply). */
function setCounter(ctx: Ctx, c: FFXCombatant, slot: number, value: number, silent: boolean): void {
  const id = TEMPORAL_STATUS_IDS[slot] as StatusId;
  const existing = statusOf(c, id);
  if (value === 0) {
    if (existing === undefined) return;
    if (silent) delete c.statuses[id];
    else removeStatus(ctx, c, id, 'expired');
    return;
  }
  if (existing === undefined) {
    const inst = instanceFor(id, slot, value);
    c.statuses[id] = inst;
    if (!silent) ctx.emit({ type: 'status-add', targetId: c.id, status: id, instance: { ...inst } });
    return;
  }
  const next = instanceFor(id, slot, value);
  existing.permanent = next.permanent;
  existing.turnsRemaining = next.turnsRemaining;
  existing.charges = next.charges;
  if (!silent) ctx.emit({ type: 'status-tick', targetId: c.id, status: id, remaining: value });
}

/** Carry the kernel's answer back: the counters onto the statuses, the memory and the Regen clock into the runtime. */
function writeBack(ctx: Ctx, c: FFXCombatant, st: AutoState, before: AutoChr, after: AutoChr, silent: boolean): void {
  if (after.perm !== before.perm || after.extra !== before.extra) {
    // No auto-ability record gives a permanent-status bit or an extra-status bit (FFX-G02 section 3.4); only a script does, and none is written.
    throw new Error(`FFX engine: '${c.id}' wears gear that gives a permanent or extra status, which the engine has no way to carry`);
  }
  const rt = rtOf(ctx, c.id);
  // The memory is replaced, never changed in place (the kernel copies what it is given), so a forked context can share it.
  rt.auto = {
    live: after.live,
    equip: st.equip,
    sos: st.sos,
    sosFlag: st.sosFlag,
    bkPerm: after.bkPerm,
    bkCounters: after.bkCounters,
    bkExtra: after.bkExtra,
    applied: after.applied,
  };
  rt.regenTicks = after.regenTicks;
  for (let slot = 0; slot < TEMPORAL_COUNT; slot++) {
    if (before.counters[slot] !== after.counters[slot]) setCounter(ctx, c, slot, after.counters[slot] as number, silent);
  }
}

/**
 * The battle's first apply for one party member (silent): the game's `pp_BtlInitChr` runs the gear loop and then the apply at the weak level of the HP the
 * character starts with. A status the character carried in from the previous link of a chain that equipment alone granted (a permanent Auto-Haste, an SOS
 * Shell) is the gear's, not a status of its own: it is dropped first, so the apply does not save it as something to put back.
 */
export function startAutoStatuses(ctx: Ctx, c: FFXCombatant): void {
  const st = stateOf(ctx, c);
  if (st === undefined) return;
  for (let slot = 0; slot < TEMPORAL_COUNT; slot++) {
    const given = ((st.equip[1] | st.sos[1]) >> slot) & 1;
    const inst = statusOf(c, TEMPORAL_STATUS_IDS[slot] as StatusId);
    if (given !== 0 && inst?.permanent === true) delete c.statuses[TEMPORAL_STATUS_IDS[slot] as StatusId];
  }
  const before = chrOf(ctx, c, st);
  writeBack(ctx, c, st, before, applyAuto(before), true);
}

/** The SOS toggle for one character (`pp_BtlSosToggle`, VA 0x007af260). Returns true when it acted. */
export function toggleAutoStatus(ctx: Ctx, c: FFXCombatant): boolean {
  const st = stateOf(ctx, c);
  if (st === undefined) return false;
  const before = chrOf(ctx, c, st);
  const { chr, toggled } = sosToggle(before);
  if (!toggled) return false;
  writeBack(ctx, c, st, before, chr, false);
  return true;
}

/** The sweep over every character, run at the end of every action (VA 0x007af4b0). */
export function sweepAutoStatuses(ctx: Ctx): void {
  for (const c of allCombatants(ctx)) toggleAutoStatus(ctx, c);
}

/**
 * Restore and apply again: a revive (the HP it left is what the weak level is read from) and a Petrify that ends. The game does this unconditionally,
 * whatever the SOS flag says (VA 0x0078d530 with its flag set, VA 0x0078e150 leaving).
 */
export function reviveAutoStatuses(ctx: Ctx, c: FFXCombatant): void {
  const st = stateOf(ctx, c);
  if (st === undefined) return;
  const before = chrOf(ctx, c, st);
  writeBack(ctx, c, st, before, reapplyAuto(before), false);
}
