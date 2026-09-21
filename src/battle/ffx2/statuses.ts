/**
 * FFX-2 status semantics [ffx2-combat-core §2.8, §2.6a].
 *
 * **Nothing here is shared with `battle/ffx/statuses`.** The ids overlap; the
 * rules do not. In X-2 Haste is a x1.05 tick rate (FFX halves CTB recovery),
 * Berserk is x1.25 (FFX x1.5), Regen pays ~3% of max HP on a real-time interval
 * (FFX pays on every unit's turn boundary), and duration is stored as an
 * integer `durationValue` converted at 0.53 s per unit.
 *
 * Duration model:
 * ```
 * ticks = durationValue * 0.53 * 3000          // Config ATB speed = Normal
 * ```
 * and the remaining duration then drains at x2.0 on a Slowed unit and x0.95 on
 * a Hasted one. A status with no duration value is `Infinite` and never expires
 * (Poison, Darkness, Silence, Petrify, Curse, Pointless, Itchy, Auto-Life,
 * Spellspring, every Up/Down stack).
 */

import type {
  FFX2Combatant,
  StatusApplication,
  StatusId,
  StatusInstance,
} from '../common/types.ts';
import type { Emit, Ffx2Unit } from './internal.ts';
import {
  DURATION_SCALE_HASTE,
  DURATION_SCALE_SLOW,
  POISON_FRACTION,
  REGEN_FRACTION,
  STATUS_TICK_INTERVAL_TICKS,
  STAT_STACK_MAX,
  TICKS_PER_DURATION_UNIT,
} from './constants.ts';

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

/** `durationValue` -> ticks at Config ATB speed = Normal. §2.8 */
export function durationToTicks(durationValue: number): number | null {
  if (durationValue <= 0) return null;
  return Math.round(durationValue * TICKS_PER_DURATION_UNIT);
}

/** Current level of a stacking Up/Down status, 0–10. §2.8 */
export function statLevel(c: FFX2Combatant, id: StatusId): number {
  const inst = c.statuses[id];
  return inst ? Math.max(0, Math.min(STAT_STACK_MAX, inst.stacks)) : 0;
}

/** How fast this unit's status durations drain. §2.8 */
function durationRate(c: FFX2Combatant): number {
  if (c.statuses.slow) return 1 / DURATION_SCALE_SLOW;
  if (c.statuses.haste) return 1 / DURATION_SCALE_HASTE;
  return 1;
}

/** §2.6a "Status 1" — the linear chance most ordinary riders use. */
export function statusChanceLinear(
  userLevel: number,
  power: number,
  targetLevel: number,
  resist: number,
): number {
  return Math.max(0, Math.min(100, userLevel * 5 + power - (targetLevel * 5 + resist)));
}

/**
 * §2.6a "Status 2" — the quartic-over-resist used by the Eject and instant
 * Death families. The `(resist + 5)^2` denominator is why every X-2 boss is
 * functionally immune to instant death.
 */
export function statusChanceQuartic(
  userLevel: number,
  power: number,
  targetLevel: number,
  resist: number,
): number {
  const lv = Math.max(1, targetLevel);
  let t = Math.floor(Math.floor((100 * userLevel * userLevel * power * power) / lv) / lv);
  const d = resist + 5;
  t = Math.floor(Math.floor(t / d) / d) - 1;
  return Math.max(0, Math.min(100, (t / 128) * 100));
}

/** §2.6a "Status 3" — the sextic used by Zantetsu. */
export function statusChanceSextic(userLevel: number, targetLevel: number, resist: number): number {
  const lv = Math.max(1, targetLevel);
  const denominator = lv ** 3 * (resist + 10) ** 2 * Math.floor(resist / 20 + 1);
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(100, (Math.floor(userLevel ** 6 / denominator) / 1024) * 100));
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
    ticksRemaining: infinite ? null : durationToTicks(application.duration),
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
  return instance;
}

/** Remove a status if present. Returns true when something was removed. */
export function removeStatus(target: FFX2Combatant, id: StatusId): boolean {
  if (!target.statuses[id]) return false;
  delete target.statuses[id];
  return true;
}

/** Ticks until this unit's soonest status expiry, or `Infinity`. */
export function ticksUntilStatusEvent(c: Ffx2Unit): number {
  const rate = durationRate(c);
  if (rate <= 0) return Infinity;
  let soonest = Infinity;
  for (const key of Object.keys(c.statuses) as StatusId[]) {
    const inst = c.statuses[key];
    if (!inst || inst.ticksRemaining === null) continue;
    const t = inst.ticksRemaining / rate;
    if (t < soonest) soonest = t;
  }
  // Regen and Poison pay out on a fixed real-time interval while they are on.
  if ((c.statuses.regen || c.statuses.poison) && !c.statuses.stop) {
    const owed = STATUS_TICK_INTERVAL_TICKS - (c.statusTickAccumulator ?? 0);
    if (owed < soonest) soonest = Math.max(0, owed);
  }
  return soonest;
}

/**
 * Advance one unit's statuses by `ticks` of global clock: expiries, and the
 * Regen / Poison payout. Both are inert while Stopped. §2.3, §2.8
 *
 * Returns the signed HP delta to apply (positive = damage), so the caller owns
 * KO handling and event ordering.
 */
export function advanceStatuses(c: Ffx2Unit, ticks: number, emit: Emit): number {
  if (ticks <= 0 || !c.alive) return 0;
  const rate = durationRate(c);

  for (const key of Object.keys(c.statuses) as StatusId[]) {
    const inst = c.statuses[key];
    if (!inst || inst.ticksRemaining === null || inst.permanent) continue;
    inst.ticksRemaining -= ticks * rate;
    if (inst.ticksRemaining > 0) {
      emit({ type: 'status-tick', targetId: c.id, status: key, remaining: Math.round(inst.ticksRemaining) });
      continue;
    }
    delete c.statuses[key];
    emit({ type: 'status-remove', targetId: c.id, status: key, reason: 'expired' });
  }

  if (c.statuses.stop) return 0;
  if (!c.statuses.regen && !c.statuses.poison) {
    c.statusTickAccumulator = 0;
    return 0;
  }

  c.statusTickAccumulator = (c.statusTickAccumulator ?? 0) + ticks;
  let delta = 0;
  while (c.statusTickAccumulator >= STATUS_TICK_INTERVAL_TICKS) {
    c.statusTickAccumulator -= STATUS_TICK_INTERVAL_TICKS;
    if (c.statuses.poison) delta += Math.max(1, Math.floor(c.stats.maxHp * POISON_FRACTION));
    if (c.statuses.regen) delta -= Math.max(1, Math.floor(c.stats.maxHp * REGEN_FRACTION));
  }
  return delta;
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
