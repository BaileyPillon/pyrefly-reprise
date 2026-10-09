/**
 * What the FFX-2 kernels read, built from the engine's state (re-parity W3; **FFX-2 only**).
 *
 * The kernels take the game's own terms: stat bytes, signed stage bytes, a status word with one bit per group 1 status,
 * 24 bytes of group 2, four element bytes, a special-flag word. This module is the one place those are read off a
 * combatant. Every function says where the number comes from; `docs/handoff/re-parity-w3.md` section 1 is the table.
 * An input the engine cannot supply is a named constant with the reason, never a silent default.
 */

import type { ElementId, FFX2Combatant, StatusId } from '../../common/types.ts';
import type { Ffx2Unit } from '../internal.ts';
import { TICKS_PER_DURATION_UNIT } from '../constants.ts';
import { statLevel } from '../statuses.ts';
import { GROUP1_STATUS, GROUP2_STATUS, STAGE_FIRST, STAGE_LAST, isStageSlot } from './slots.ts';

/** The kernels' bit for each element (`Chr+0x3af`..`+0x3b3`, `Cmd+0x2e`): fire 1, ice 2, thunder 4, water 8, gravity 0x10, holy 0x20. */
const ELEMENT_BIT: Readonly<Partial<Record<ElementId, number>>> = {
  fire: 1,
  ice: 2,
  lightning: 4,
  water: 8,
  gravity: 0x10,
  holy: 0x20,
};

/**
 * The element bits of a list of elements (an element the game has no bit for, and `none`, add nothing). A def the advisor
 * builds by hand without the list (its tests do) is no element at all.
 */
export function elementMask(elements: readonly ElementId[] | undefined): number {
  let mask = 0;
  for (const e of elements ?? []) mask |= ELEMENT_BIT[e] ?? 0;
  return mask;
}

/** Does the combatant carry the status right now. */
export function has(unit: FFX2Combatant, status: StatusId): boolean {
  return unit.statuses[status] !== undefined;
}

/** A stat stage (`Chr+0x43f`..`+0x445`) as the game keeps it: the Up level less the Down level, -10 to +10. */
export function stage(unit: FFX2Combatant, up: StatusId, down: StatusId): number {
  return Math.max(-10, Math.min(10, statLevel(unit, up) - statLevel(unit, down)));
}

/** The Accuracy, Evasion and Luck stages the hit and critical kernels read. */
export function accuracyStage(unit: FFX2Combatant): number {
  return stage(unit, 'accu-up', 'accu-down');
}
export function evasionStage(unit: FFX2Combatant): number {
  return stage(unit, 'eva-up', 'eva-down');
}
export function luckStage(unit: FFX2Combatant): number {
  return stage(unit, 'luck-up', 'luck-down');
}

/** Status word 1 (`Chr+0x434`): bit i set when the group 1 status in slot i is on. */
export function statusWord1(unit: FFX2Combatant): number {
  let word = 0;
  GROUP1_STATUS.forEach((status, i) => {
    if (status !== null && has(unit, status)) word |= 1 << i;
  });
  return word >>> 0;
}

/**
 * The group 2 bytes as the game keeps them in the result buffer (`Chr+0x4b4`, `Res+0x38`): for a timed status the
 * counter (the remaining time in the game's units of 0.53 s, 1 to 125, 0 = off), for a stage the signed step count.
 */
export function group2Counters(unit: FFX2Combatant): number[] {
  return GROUP2_STATUS.map((statuses, i) => {
    if (isStageSlot(i)) {
      const [up, down] = statuses;
      return up !== undefined && down !== undefined ? stage(unit, up, down) : 0;
    }
    const status = statuses[0];
    const instance = status === undefined ? undefined : unit.statuses[status];
    if (!instance) return 0;
    if (instance.ticksRemaining === null) return 125;
    return Math.max(1, Math.min(125, Math.round(instance.ticksRemaining / TICKS_PER_DURATION_UNIT)));
  });
}

/** `Chr+0x438`..: the group 2 byte currently in effect (a stage as the signed step, a timed status as non-zero). */
export function group2Active(unit: FFX2Combatant): number[] {
  return group2Counters(unit);
}

/**
 * Statuses a permanent source holds (`Chr+0x4fc`, `+0x500`, `+0x570`, `+0x574`): the ones the unit carries from an
 * auto-status (`EnemyDef.autoStatuses`, Chapter XIII's Spellspring). The engine's accessories are stat-only, so nothing
 * else is a permanent source here.
 */
function permanentSource(unit: Ffx2Unit, status: StatusId): boolean {
  return unit.statuses[status] !== undefined && (unit.autoStatuses ?? []).includes(status);
}

/** Group 2 slots held by a permanent source, 1 where one holds the slot (`Chr+0x500+i` and `+0x574+i`). */
export function group2Permanent(unit: Ffx2Unit): number[] {
  return GROUP2_STATUS.map((statuses, i) => (!isStageSlot(i) && statuses.some((s) => permanentSource(unit, s)) ? 1 : 0));
}

/** Group 1 statuses held by a permanent source (`Chr+0x4fc | Chr+0x570`), one bit per slot. */
export function protectMask(unit: Ffx2Unit): number {
  let mask = 0;
  GROUP1_STATUS.forEach((status, i) => {
    if (status !== null && permanentSource(unit, status)) mask |= 1 << i;
  });
  return mask >>> 0;
}

/** The 24 resist bytes of each group (`Chr+0x404`, `Chr+0x41c`): the combatant's `immunities` by slot (a stage's Up and Down share a slot). */
export function resistTables(unit: FFX2Combatant): { resist1: number[]; resist2: number[] } {
  const resist1 = GROUP1_STATUS.map((status) => (status === null ? 0 : (unit.immunities[status] ?? 0) & 0xff));
  const resist2 = GROUP2_STATUS.map((statuses) => statuses.reduce((best, status) => Math.max(best, (unit.immunities[status] ?? 0) & 0xff), 0));
  return { resist1, resist2 };
}

/** The four element bytes (`Chr+0x3b0`..`+0x3b3`): absorb, null, half, weak. */
export function affinityBytes(unit: FFX2Combatant): { absorb: number; nullify: number; half: number; weak: number } {
  const out = { absorb: 0, nullify: 0, half: 0, weak: 0 };
  for (const [element, affinity] of Object.entries(unit.affinities)) {
    const bit = ELEMENT_BIT[element as ElementId] ?? 0;
    if (bit === 0) continue;
    if (affinity === 'absorb') out.absorb |= bit;
    else if (affinity === 'immune') out.nullify |= bit;
    else if (affinity === 'resist') out.half |= bit;
    else if (affinity === 'weak') out.weak |= bit;
  }
  return out;
}

/**
 * The special-flag word (`Chr+0x3a6`): bit 0 immune to the percent formulas, bit 6 immune to ATB damage, bit 9 immune to
 * Bribe. An enemy that carries the game's monster row has the row's word; anything else is built from its immunity flags.
 */
export function specialWord(unit: FFX2Combatant): number {
  const record = unit.enemy?.ffx2Record;
  if (record !== undefined) return record.special;
  let word = 0;
  if (unit.immunityFlags.includes('immune-to-percentage-damage')) word |= 0x1;
  if (unit.immunityFlags.includes('immune-to-delay')) word |= 0x40;
  if (unit.immunityFlags.includes('immune-to-bribe')) word |= 0x200;
  return word;
}

/** The species mask (`Chr+0x660`): the monster row's type word; the party has none. */
export function speciesMask(unit: FFX2Combatant): number {
  return unit.enemy?.ffx2Record?.species ?? 0;
}

/**
 * The ATB pool the Delay class damages (`pp_atb_pool`): the charge while it runs, else the recovery. The engine keeps
 * the remaining recovery only, so the recovery's maximum is that figure. (The ATB class is computed but not applied here:
 * the ATB, charge and recovery path is batch W4.)
 */
export function atbPool(unit: FFX2Combatant): { current: number; max: number } {
  const charging = unit.atb.charging;
  if (charging !== null && charging.totalTicks > 0) return { current: Math.max(0, charging.remainingTicks | 0), max: charging.totalTicks | 0 };
  const recovery = Math.max(0, unit.atb.recovery | 0);
  return { current: recovery, max: recovery };
}

export { STAGE_FIRST, STAGE_LAST };
