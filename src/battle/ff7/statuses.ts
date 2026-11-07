/**
 * The FF7 status layer: Reflect, Barrier, MBarrier and Regen (hidden chapter 44, Jenova LIFE).
 *
 * A status lives in `Ff7Combatant.ff7.status`, timed on the holder's own V-Timer [core §2.2: "most status
 * durations"]; the V-Timer already advances in `clock.ts#advanceTimers` for every living fighter, so a status
 * is a `until` value on that timer and nothing here keeps a second clock. **Absent = none**: a fight that never
 * applies a status (the whole Guard Scorpion slice) reads `undefined` everywhere and behaves exactly as before
 * (`tests/unit/ff7-golden.test.ts` is the absence test).
 *
 * | Status | Effect | Duration |
 * |---|---|---|
 * | Reflect | a reflectable spell aimed at the holder turns on its caster (`reflect.ts`) | until removed |
 * | Barrier | halves Physical damage taken (core §4.5 step 9) | 127 V-Units |
 * | MBarrier | halves Magical and Cure damage taken (core §4.5 step 9) | 127 V-Units |
 * | Regen | heals `[MaxHP / 32]` per 4 V-Units | 127 V-Units |
 *
 * `[single source: Lifestream Encore formulas 1.9 and 7.2, from Fergusson BM]` for the durations and the Regen
 * tick; a Unit is 8,192 V-Timer points [core §2.2]. Reflect's own life is `[conflict]` (LE 6.6: "up to four
 * bounces per casting per character, then it is exhausted"; the player and walkthrough reports behind chapter 44's
 * note have it stand until removed): the **status is kept until removed** and the bounce cap is per spell
 * (`reflect.ts#REFLECT_MAX_BOUNCES`), a labelled estimate. A KO removes every status here (LE 7.2, Death).
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { Ff7Combatant, Ff7StatusId } from '../common/types.ts';
import type { Ff7Env } from './internal.ts';

/** One V-Unit is 8,192 V-Timer points [core §2.2]. */
export const V_UNIT = 8192;
/** Barrier, MBarrier and Regen last 127 V-Units [LE formulas 1.9, 7.2: single source]. */
export const TIMED_STATUS_UNITS = 127;
/** Regen heals once per 4 V-Units [LE formulas 1.9: single source]. */
export const REGEN_TICK_UNITS = 4;
/** Regen heals `[MaxHP / 32]` each tick [LE formulas 7.2: single source]. */
export const REGEN_DIVISOR = 32;

/** The status ids, in the order the HUD and the tests list them. */
export const FF7_STATUS_IDS: readonly Ff7StatusId[] = ['reflect', 'barrier', 'mbarrier', 'regen'];

/** Is `id` on `c` now? */
export function hasStatus(c: Ff7Combatant, id: Ff7StatusId): boolean {
  return c.ff7.status?.[id] !== undefined;
}

/** Does `c` resist `id` by its listed immunities (`Ff7EnemyFields.statusImmune`)? Party members resist none here. */
export function resistsStatus(c: Ff7Combatant, id: Ff7StatusId): boolean {
  return c.ff7.enemy?.statusImmune?.includes(id) === true;
}

/**
 * Put `id` on `c`, refreshing it if it is already there (a recast starts the timer again). False when `c` is
 * KO'd, removed or immune: the caller prints a miss.
 */
export function applyStatus(c: Ff7Combatant, id: Ff7StatusId): boolean {
  if (!c.alive || c.removed || resistsStatus(c, id)) return false;
  const now = c.ff7.atb.vTimer;
  const span = id === 'reflect' ? null : TIMED_STATUS_UNITS * V_UNIT;
  const entry = { until: span === null ? null : now + span, span, ...(id === 'regen' ? { nextTick: now + REGEN_TICK_UNITS * V_UNIT } : {}) };
  c.ff7.status = { ...c.ff7.status, [id]: entry };
  return true;
}

/** Take `id` off `c` (DeBarrier and DeSpell would; nothing in chapter 44 casts them). */
export function removeStatus(c: Ff7Combatant, id: Ff7StatusId): void {
  const s = c.ff7.status;
  if (!s || s[id] === undefined) return;
  const next = { ...s };
  delete next[id];
  c.ff7.status = next;
}

/** A KO takes every one of these off [LE formulas 7.2: Death removes every status but Frog and Small]. */
export function clearStatuses(c: Ff7Combatant): void {
  if (c.ff7.status !== undefined) delete c.ff7.status;
}

/** The share of `id`'s life left, 0 to 1 (Reflect, which has no timer, reads 1); 0 when it is off. For the HUD's bars. */
export function statusShare(c: Ff7Combatant, id: Ff7StatusId): number {
  const e = c.ff7.status?.[id];
  if (!e) return 0;
  if (e.until === null || e.span === null || e.span <= 0) return 1;
  return Math.max(0, Math.min(1, (e.until - c.ff7.atb.vTimer) / e.span));
}

/**
 * Ticks until the soonest status end or Regen tick among the living, at `vIncrease` V-Timer points per tick;
 * `Infinity` when nobody holds a timed status (so `Ff7Engine.tick` takes the step it always took).
 */
export function ticksToNextStatusEvent(units: readonly Ff7Combatant[], vIncrease: number): number {
  let best = Number.POSITIVE_INFINITY;
  if (vIncrease <= 0) return best;
  for (const c of units) {
    const s = c.ff7.status;
    if (!s || !c.alive || c.removed) continue;
    for (const id of FF7_STATUS_IDS) {
      const e = s[id];
      if (!e) continue;
      if (e.until !== null) best = Math.min(best, Math.max(1, Math.ceil((e.until - c.ff7.atb.vTimer) / vIncrease)));
      if (e.nextTick !== undefined) best = Math.min(best, Math.max(1, Math.ceil((e.nextTick - c.ff7.atb.vTimer) / vIncrease)));
    }
  }
  return best;
}

/**
 * After the V-Timers advanced: Regen heals for every tick that came due, then the statuses whose time is up
 * come off. Regen's last tick lands before the status ends. A heal prints as a `heal` event with cause `'regen'`.
 */
export function tickStatuses(env: Ff7Env, units: readonly Ff7Combatant[]): void {
  for (const c of units) {
    const s = c.ff7.status;
    if (!s || !c.alive || c.removed) continue;
    const now = c.ff7.atb.vTimer;
    const regen = s.regen;
    if (regen && regen.nextTick !== undefined) {
      let next = regen.nextTick;
      while (next <= now && (regen.until === null || next <= regen.until)) {
        const amount = Math.min(c.stats.maxHp - c.hp, Math.trunc(c.stats.maxHp / REGEN_DIVISOR));
        if (amount > 0) {
          c.hp += amount;
          env.emit({ type: 'heal', targetId: c.id, amount, cause: 'regen' });
        }
        next += REGEN_TICK_UNITS * V_UNIT;
      }
      regen.nextTick = next;
    }
    for (const id of FF7_STATUS_IDS) {
      const e = s[id];
      if (e && e.until !== null && e.until <= now) removeStatus(c, id);
    }
  }
}
