/**
 * The status kernels' answer, carried out in the engine (re-parity W2; **FFX only**).
 *
 * `adapt/status.ts` hands the game's infliction step the target's status words and gets back the hit record's words after
 * the step. The game then writes those words back to the character (`pp_BtlApplyHitRecords`, VA 0x0078f060), applies the
 * stage buffs and the buff flags, and lets the death handler clear what a death clears. This module does the same for the
 * engine's combatants: it compares the record before and after, bit by bit and counter by counter, and adds, updates or
 * removes the matching {@link StatusInstance}, with the events the engine always emitted. What the engine has no status for
 * (the four Distill bits) is applied to the record by the kernel and dropped here.
 *
 * Two things stay the engine's own business and are done here in the game's order: a Death that lands (or a Death that a
 * cleanse puts on a Zombie) kills through `koActor` (Auto-Life, forms), and an Eject (a shatter, a Petrified monster, the
 * Eject command) takes the target off the field through `ejectActor` / `banishAeon`. A revival (Death cleared) is the
 * revival block of `hit-apply.ts`, which has the hit-point amount.
 */

import type { AbilityDef, FFXCombatant, StatusId, StatusInstance } from '../../common/types.ts';
import { applyStageBuffs } from '../kernel/status-extra.ts';
import { PermBit, type StatusRecord } from '../kernel/status-types.ts';
import { applyDoubleHpMp, type PoolState } from '../kernel/status-pool.ts';
import { banishAeon } from '../aeons.ts';
import { ejectActor, koActor } from '../hp.ts';
import { statusOf, stacks } from '../predicates.ts';
import { type Ctx, onField, rtOf } from '../state.ts';
import { refreshCriticalStatus, removeStatus, SURVIVES_KO } from '../statuses.ts';
import {
  BUFF_STATUS_BIT,
  EXTRA_STATUS_BIT,
  PERM_STATUS_IDS,
  STACK_STATUS_IDS,
  TEMPORAL_STATUS_IDS,
  buffByte,
  doomStart,
  recordOf,
  stackBytes,
  type StatusStepOutput,
} from './status.ts';
import { autoWordB } from './words.ts';

/** What a combatant's statuses were when the hit began: the words the record started from, the stacks and the buff flags. */
export interface Before {
  record: StatusRecord;
  stacks: number[];
  buff: number;
}

export function beforeOf(c: FFXCombatant): Before {
  return { record: recordOf(c), stacks: stackBytes(c), buff: buffByte(c) };
}

/** A fresh status instance. A permanent-group, extra-group or flag status has no counter of its own: 254, "until removed". */
function instanceOf(id: StatusId, init: Partial<StatusInstance>, source?: { sourceId?: string; sourceAbilityId?: string }): StatusInstance {
  const inst: StatusInstance = { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...init };
  if (source?.sourceId !== undefined) inst.sourceId = source.sourceId;
  if (source?.sourceAbilityId !== undefined) inst.sourceAbilityId = source.sourceAbilityId;
  return inst;
}

const NUL_IDS: readonly StatusId[] = ['nultide', 'nulblaze', 'nulshock', 'nulfrost'];

/** What happened, for the triggers and the caller's bookkeeping. */
export interface Applied {
  added: StatusId[];
  removed: StatusId[];
  killed: boolean;
  ejected: boolean;
}

function add(ctx: Ctx, target: FFXCombatant, status: StatusId, inst: StatusInstance, quiet: boolean): void {
  if (quiet) return;
  target.statuses[status] = inst;
  ctx.emit({ type: 'status-add', targetId: target.id, status, instance: { ...inst } });
}

/**
 * Carry out one hit's status step. `died` is true when the hit's own damage has already taken the target to 0 HP: the game writes
 * the statuses first and the death handler clears them afterwards, so a status that does not survive a KO is simply never added.
 */
export function applyStatusStep(
  ctx: Ctx,
  user: FFXCombatant,
  target: FFXCombatant,
  def: AbilityDef,
  before: Before,
  step: StatusStepOutput,
): Applied {
  const after = step.result.record;
  const out: Applied = { added: [], removed: [], killed: false, ejected: false };
  const source = { sourceId: user.id, sourceAbilityId: def.id };
  const cleanse = (step.status.cmd.flagsDamage & 0x20) !== 0;
  const cleanseReason = def.category === 'item' ? 'cured' : 'dispelled';
  const quiet = (id: StatusId): boolean => !target.alive && !SURVIVES_KO.includes(id);
  const lose = (id: StatusId, byCleanse: boolean): void => {
    if (removeStatus(ctx, target, id, byCleanse ? cleanseReason : 'overwritten')) out.removed.push(id);
  };

  // --- the permanent word: bit 0 (Death) is handled last, by the engine's KO and revival paths
  for (let i = 1; i < PERM_STATUS_IDS.length; i++) {
    const id = PERM_STATUS_IDS[i] as StatusId;
    const bit = 1 << i;
    const was = (before.record.perm & bit) !== 0;
    const now = (after.perm & bit) !== 0;
    if (!was && now) {
      if (quiet(id)) continue;
      add(ctx, target, id, instanceOf(id, {}, source), false);
      out.added.push(id);
      if (id === 'threaten') rtOf(ctx, target.id).threatenChance = step.result.resist[11] as number;
    } else if (was && !now) {
      lose(id, cleanse);
    }
  }

  // --- the thirteen counters
  TEMPORAL_STATUS_IDS.forEach((id, t) => {
    const was = before.record.counters[t] as number;
    const now = after.counters[t] as number;
    if (was === now) return;
    const nul = NUL_IDS.includes(id);
    if (now === 0) {
      lose(id, cleanse);
    } else if (was === 0) {
      if (quiet(id)) return;
      const permanent = now === 255;
      const init: Partial<StatusInstance> = nul
        ? { turnsRemaining: null, charges: permanent ? null : now, permanent }
        : { turnsRemaining: permanent ? 255 : now, permanent };
      add(ctx, target, id, instanceOf(id, init, source), false);
      out.added.push(id);
    } else {
      // a cleansing command that took part of a finite counter off
      const inst = statusOf(target, id);
      if (inst) {
        if (nul) inst.charges = now;
        else inst.turnsRemaining = now;
      }
    }
  });

  // --- the extra word
  for (const [id, bit] of Object.entries(EXTRA_STATUS_BIT) as Array<[StatusId, number]>) {
    const was = (before.record.extra & bit) !== 0;
    const now = (after.extra & bit) !== 0;
    if (!was && now) {
      if (id === 'eject') continue; // the Eject below takes the target off the field
      if (quiet(id)) continue;
      const init: Partial<StatusInstance> = id === 'doom' ? { turnsRemaining: step.result.doomCounter ?? doomStart(target) } : {};
      add(ctx, target, id, instanceOf(id, init, source), false);
      out.added.push(id);
    } else if (was && !now) {
      lose(id, cleanse);
    }
  }

  // --- the stage buffs go straight onto the target's stacks (they are not part of the record)
  if (step.status.stageMask !== 0) {
    const next = applyStageBuffs(before.stacks, step.status.stageMask, step.status.stageAmount);
    STACK_STATUS_IDS.forEach((id, k) => {
      const was = before.stacks[k] as number;
      const now = next[k] as number;
      if (now === was) return;
      const inst = statusOf(target, id);
      if (inst) {
        inst.stacks = now;
        ctx.emit({ type: 'status-add', targetId: target.id, status: id, instance: { ...inst } });
      } else if (!quiet(id)) {
        add(ctx, target, id, instanceOf(id, { stacks: now }, source), false);
      }
      out.added.push(id);
    });
  }

  // --- the buff flags are OR-ed in unless the record is Petrified; Double HP and Double MP rebuild the maxima
  if (step.status.buff !== 0 && (after.perm & PermBit.Petrify) === 0) {
    const flags = before.buff | step.status.buff;
    const fresh = flags & ~before.buff;
    for (const [id, bit] of Object.entries(BUFF_STATUS_BIT) as Array<[StatusId, number]>) {
      if ((fresh & bit) === 0 || quiet(id)) continue;
      add(ctx, target, id, instanceOf(id, {}, source), false);
      out.added.push(id);
    }
    if ((fresh & 3) !== 0 && target.alive) applyPools(ctx, target, before.buff, flags);
  }

  // --- the engine's own paths: an Eject takes the target off the field; a Death kills it (Auto-Life, forms)
  const ejectNow = (after.extra & 0x100) !== 0 && (before.record.extra & 0x100) === 0;
  const deathNow = (after.perm & PermBit.Death) !== 0 && (before.record.perm & PermBit.Death) === 0;
  if (ejectNow && onField(target)) {
    if (target.side === 'aeon') banishAeon(ctx, target.id);
    else ejectActor(ctx, target, (after.perm & PermBit.Petrify) !== 0 ? 'shatter' : 'eject', true);
    out.ejected = true;
  } else if (deathNow && target.alive) {
    koActor(ctx, target, user.id);
    out.killed = true;
  }
  if (target.alive) refreshCriticalStatus(ctx, target);
  return out;
}

/** `pp_BtlApplyDoubleHpMp` (VA 0x0078d270) over the engine's maxima: the doubled maximum is a stat change while the flag is on. */
function applyPools(ctx: Ctx, target: FFXCombatant, oldFlags: number, newFlags: number): void {
  const rt = rtOf(ctx, target.id);
  if ((oldFlags & 1) === 0) rt.poolBaseHp = target.stats.maxHp;
  if ((oldFlags & 2) === 0) rt.poolBaseMp = target.stats.maxMp;
  const state: PoolState = {
    buffFlags: oldFlags,
    baseMaxHp: rt.poolBaseHp ?? target.stats.maxHp,
    baseMaxMp: rt.poolBaseMp ?? target.stats.maxMp,
    maxHp: target.stats.maxHp,
    maxMp: target.stats.maxMp,
    hp: target.hp,
    mp: target.mp,
    // Break HP Limit and Break MP Limit (the equipment) lift the 9,999 and 999 ceilings.
    autoB: autoWordB(target),
  };
  const next = applyDoubleHpMp(state, newFlags);
  target.stats.maxHp = next.maxHp;
  target.stats.maxMp = next.maxMp;
  target.hp = next.hp;
  target.mp = next.mp;
  refreshCriticalStatus(ctx, target);
}

/** True when a combatant's stack count for a stage-buff status is at its ceiling (5). */
export function stackAtCeiling(c: FFXCombatant, status: StatusId): boolean {
  return stacks(c, status) >= 5;
}
