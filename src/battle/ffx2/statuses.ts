/**
 * FFX-2 status semantics [ffx2-combat-core §2.8, §2.6a; re-parity W4].
 *
 * **Nothing here is shared with `battle/ffx/statuses`.** The ids overlap; the
 * rules do not. In X-2 Haste is 95 -> 99 units a logic step (FFX halves CTB recovery),
 * Berserk is x1.25 (FFX x1.5), Regen pays (8 x max HP) >> 8 every 16,000 units (FFX pays on
 * every unit's turn boundary), and a duration is the game's own clock.
 *
 * Duration model (the game's, `kernel/status-timers.ts`): a timed GROUP 2 status (Shell, Protect, Reflect, Regen, Haste,
 * Slow, Stop, Doom, the three immunities) holds a counter of 1 to 125, set from the command row's amount, that loses one
 * count for every 1,500 units its owner's speed banks (Doom 10,000); a GROUP 1 status with a timer (Sleep 150,000,
 * Confusion and Berserk 200,000 units) falls by the owner's raw speed. A status with no duration is `Infinite` and never
 * expires (Poison, Darkness, Silence, Petrify, Curse, Pointless, Itchy, Auto-Life, Spellspring, every Up/Down stack). The
 * clocks run in `status-clock.ts`; this file only starts them.
 */

import type {
  FFX2Combatant,
  StatusApplication,
  StatusId,
  StatusInstance,
} from '../common/types.ts';
import { withPoolStatuses } from './kit.ts';
import { STAT_STACK_MAX } from './constants.ts';
import { isStageSlot, slotOf } from './adapt/slots.ts';
import { FFX2_STATUS_ROM } from './kernel/status-timers-set.ts';
import { STATUS2_INFO } from './kernel/statusTypes.ts';

/** Statuses the source tables flag `Infinite` — they have no expiry at all. §2.8 */
export const INFINITE_STATUSES: readonly StatusId[] = [
  'poison',
  'darkness',
  'silence',
  'petrify',
  'curse',
  'pointless',
  'itchy',
  'auto-life',
  'spellspring',
  'ko',
  'eject',
  'str-up',
  'mag-up',
  'def-up',
  'mdef-up',
  'accu-up',
  'eva-up',
  'luck-up',
  'str-down',
  'mag-down',
  'def-down',
  'mdef-down',
  'accu-down',
  'eva-down',
  'luck-down',
] as const;

/** The only four that survive victory, plus Pointless and Silence. §2.8 */
export const PERSISTS_AFTER_BATTLE: readonly StatusId[] = [
  'darkness',
  'ko',
  'petrify',
  'poison',
  'pointless',
  'silence',
] as const;

/** Esuna / Remedy's list. §2.8 "Blanket cures" */
export const ESUNA_CURES: readonly StatusId[] = [
  'berserk',
  'confuse',
  'curse',
  'darkness',
  'itchy',
  'petrify',
  'pointless',
  'poison',
  'silence',
  'sleep',
  'slow',
  'stop',
] as const;

/** Dispel's list — it strips the *good* ones. §2.8 */
export const DISPEL_REMOVES: readonly StatusId[] = [
  'auto-life',
  'shell',
  'protect',
  'reflect',
  'regen',
  'haste',
  'spellspring',
] as const;

/** Mutually exclusive pairs: applying one removes the other. §2.8 */
const EXCLUSIVE: ReadonlyArray<readonly [StatusId, StatusId]> = [
  ['haste', 'slow'],
  ['slow', 'haste'],
];

/** Units one count of a group 2 timed status is worth: 1,500, or 10,000 for Doom (`kernel/statusTypes.ts` flag words 0x4 and 0x8). 0 for a slot that never counts. */
export function countUnits(group2Index: number): number {
  const flags = STATUS2_INFO[group2Index] ?? 0;
  if ((flags & 8) !== 0) return FFX2_STATUS_ROM.countValue[1] ?? 0;
  return (flags & 4) !== 0 ? (FFX2_STATUS_ROM.countValue[0] ?? 0) : 0;
}

/** True for a group 2 slot that counts (Shell ... Slow, Stop, Doom, the three immunities); a stat stage never does. */
export function isTimedGroup2(group2Index: number): boolean {
  return !isStageSlot(group2Index) && countUnits(group2Index) > 0;
}

/** Current level of a stacking Up/Down status, 0–10. §2.8 */
export function statLevel(c: FFX2Combatant, id: StatusId): number {
  const inst = c.statuses[id];
  return inst ? Math.max(0, Math.min(STAT_STACK_MAX, inst.stacks)) : 0;
}

/** A group 2 counter is 1 to 125 (`kernel/statusGroup2.ts` `COUNTER_MAX`). */
const COUNTER_MAX = 125;

/**
 * The game's clock for a status that lands now (`MsSetStatus` loads it when the bit appears):
 *
 * - a group 1 status with a timer (Sleep, Confusion, Berserk) gets its `off_count` whatever the command that inflicted it
 *   said, the one timer the game keeps for it;
 * - a timed group 2 status gets the command's amount as its counter (clamped to 1..125). An application with no amount
 *   (`duration` 0) is "until cured": no clock, as every authored ability without a duration always meant.
 */
function clockFor(id: StatusId, duration: number): Pick<StatusInstance, 'ticksRemaining' | 'counter' | 'accumulator'> {
  const slot = slotOf(id);
  if (slot === undefined) return { ticksRemaining: null };
  if (slot.group === 1) {
    const timer = FFX2_STATUS_ROM.offCount[slot.index] ?? 0;
    return { ticksRemaining: timer > 0 ? timer : null };
  }
  if (!isTimedGroup2(slot.index) || duration <= 0) return { ticksRemaining: null };
  const counter = Math.max(1, Math.min(COUNTER_MAX, Math.round(duration)));
  return { ticksRemaining: counter * countUnits(slot.index), counter, accumulator: 0 };
}

/**
 * Apply one status. Returns the instance when it landed, `null` when it did
 * not. Re-applying a non-stacking status already present displays "MISS" in
 * X-2 — we return `null` and the caller emits the miss. §2.6
 */
export function applyStatus(
  target: FFX2Combatant,
  application: StatusApplication,
  sourceId?: string,
  sourceAbilityId?: string,
): StatusInstance | null {
  const id = application.status;
  const stacking = application.stacks !== undefined && application.stacks > 0;
  const existing = target.statuses[id];

  if (existing && !stacking) return null;
  if (existing && stacking) {
    const next = Math.min(STAT_STACK_MAX, existing.stacks + (application.stacks ?? 1));
    if (next === existing.stacks) return null;
    existing.stacks = next;
    return existing;
  }

  for (const [a, b] of EXCLUSIVE) {
    if (id === a) delete target.statuses[b];
  }

  const infinite = INFINITE_STATUSES.includes(id);
  const instance: StatusInstance = {
    id,
    turnsRemaining: null,
    ...(infinite ? { ticksRemaining: null } : clockFor(id, application.duration)),
    charges: null,
    stacks: application.stacks ?? 0,
    permanent: infinite,
    ...(sourceId ? { sourceId } : {}),
    ...(sourceAbilityId ? { sourceAbilityId } : {}),
  };
  target.statuses[id] = instance;

  // Stop also removes Sleep, Confusion and Berserk, and freezes the ticking ones.
  if (id === 'stop') {
    delete target.statuses.sleep;
    delete target.statuses.confuse;
    delete target.statuses.berserk;
  }
  // Stamina Tonic: the ceiling doubles, current HP does not (`kit.ts`). Nothing in FFX-2 removes it mid-battle.
  if (id === 'max-hp-x2') target.stats = withPoolStatuses(target.stats, target.statuses);
  return instance;
}

/** Remove a status if present. Returns true when something was removed. */
export function removeStatus(target: FFX2Combatant, id: StatusId): boolean {
  if (!target.statuses[id]) return false;
  delete target.statuses[id];
  return true;
}

/** Clear everything the end of a battle clears. §2.8 */
export function clearAfterBattle(c: FFX2Combatant): void {
  for (const key of Object.keys(c.statuses) as StatusId[]) {
    if (!PERSISTS_AFTER_BATTLE.includes(key)) delete c.statuses[key];
  }
  // **Eject is a battle-long removal, not a wound.** `eject` is not in
  // `PERSISTS_AFTER_BATTLE`, so the status is already cleared above — the flag
  // `resolve.ts::applyRiders` sets alongside it has to go with it, or a girl
  // ejected in one link of a chained encounter would still be missing from the
  // next [research/ffx2-leblanc-syndicate.md §4.3]. FFX-2 only.
  c.removed = false;
}

/** Can this unit act at all? Silence, Curse and Itchy gate *commands*, not the gauge. */
export function canAct(c: FFX2Combatant): boolean {
  if (!c.alive || c.removed) return false;
  return !(c.statuses.sleep || c.statuses.stop || c.statuses.petrify);
}
