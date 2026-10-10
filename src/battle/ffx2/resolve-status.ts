/**
 * What a hit's status rolls do to the engine's statuses (re-parity W3; **FFX-2 only**).
 *
 * The game's status kernels (`kernel/statusGroup1.ts`, `statusGroup2.ts`) work on a result buffer: a group 1 set (one
 * bit per ailment) and 24 group 2 bytes (a timed status's counter, a stat stage's signed step). They decide, with the
 * game's own landing rule, what that buffer holds after the command. This module compares the buffer with the unit and
 * makes the engine's statuses match, emitting the events the presenter and the logs read: a status that is now on and
 * was not is applied (with the duration or stacks the ability names, `statuses.ts applyStatus`), one that was on and is
 * now off is removed. Because the buffer carries the game's side effects (Berserk drops Confusion, Petrify clears every
 * other status and every counter, Haste drops Slow and Stop, a stage of the opposite sign cancels the other) the engine
 * follows them without a rule of its own.
 *
 * A status the engine has but the game's 24-slot tables do not (the hidden Delay effect and Action-cancel, Shattering)
 * is not in the buffer: {@link rollEngineRiders} rolls those with the same landing rule.
 */

import type { AbilityDef, StatusApplication, StatusId } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import type { ResolvedCommand } from './adapt/command.ts';
import { levelOf } from './adapt/inputs.ts';
import { GROUP1_STATUS, GROUP2_STATUS, isStageSlot } from './adapt/slots.ts';
import { protectMask, stage } from './adapt/words.ts';
import { statusLands, type StatusResult } from './kernel/statusTypes.ts';
import { s8 } from './kernel/intops.ts';
import { applyHpDelta, type ResolveContext } from './resolve-hp.ts';
import { applyStatus, removeStatus } from './statuses.ts';

/** The ability's own application of a status (its duration and stacks), else the record's amount, else "until cured". */
function applicationFor(ability: AbilityDef, command: ResolvedCommand, status: StatusId, group2Index?: number): StatusApplication {
  const own = ability.statusEffects.find((a) => a.status === status);
  if (own !== undefined) return own;
  const time = group2Index === undefined ? 0 : (command.record.statusTime?.[group2Index] ?? 0);
  return { status, chance: 255, duration: time > 0 ? time : 0 };
}

function addStatus(ctx: ResolveContext, user: Ffx2Unit, target: Ffx2Unit, application: StatusApplication, abilityId: string): void {
  const instance = applyStatus(target, application, user.id, abilityId, ctx.timedAilmentDefaults === true);
  if (!instance) return;
  ctx.emit({ type: 'status-add', targetId: target.id, sourceId: user.id, status: application.status, instance });
  if (application.status === 'ko') applyHpDelta(ctx, target, target.hp, user.id);
  // **Eject removes the character from the battle.** `targeting.ts::isTargetable`, `engine.ts`'s `party()`, `gauges.ts`
  // and `results.ts` all test `!u.removed`, so removal, untargetability, a frozen gauge and "all three gone = defeat"
  // fall out of the flag; `revive()` clears it.
  if (application.status === 'eject') target.removed = true;
}

function removeOne(ctx: ResolveContext, target: Ffx2Unit, status: StatusId, reason: 'dispelled' | 'overwritten'): void {
  if (!removeStatus(target, status)) return;
  if (status === 'ko') return; // a revival: the strike emits `revive`
  ctx.emit({ type: 'status-remove', targetId: target.id, status, reason });
}

/** Make a stat stage (the Up and Down statuses of one slot) the signed step the buffer holds. */
function reconcileStage(
  ctx: ResolveContext,
  user: Ffx2Unit,
  target: Ffx2Unit,
  abilityId: string,
  up: StatusId,
  down: StatusId,
  next: number,
  reason: 'dispelled' | 'overwritten',
): void {
  if (stage(target, up, down) === next) return;
  const side = next > 0 ? up : next < 0 ? down : undefined;
  for (const id of [up, down]) if (id !== side && target.statuses[id] !== undefined) removeOne(ctx, target, id, reason);
  if (side === undefined) return;
  const steps = Math.abs(next);
  const existing = target.statuses[side];
  if (existing !== undefined) {
    if (existing.stacks === steps) return;
    existing.stacks = steps;
    ctx.emit({ type: 'status-add', targetId: target.id, sourceId: user.id, status: side, instance: existing });
    return;
  }
  addStatus(ctx, user, target, { status: side, chance: 255, duration: 0, stacks: steps }, abilityId);
}

/** Bring the engine's statuses in line with the result buffer the status kernels produced. */
export function applyStatusResult(
  ctx: ResolveContext,
  user: Ffx2Unit,
  target: Ffx2Unit,
  ability: AbilityDef,
  command: ResolvedCommand,
  result: StatusResult,
): void {
  const reason = command.status.cleanse ? 'dispelled' : 'overwritten';
  const protectedBits = protectMask(target);

  GROUP1_STATUS.forEach((status, i) => {
    if (status === null) return;
    const was = target.statuses[status] !== undefined;
    const now = ((result.statusSet >>> i) & 1) !== 0;
    if (!was && now) addStatus(ctx, user, target, applicationFor(ability, command, status), ability.id);
    else if (was && !now && ((protectedBits >>> i) & 1) === 0) removeOne(ctx, target, status, reason);
  });

  GROUP2_STATUS.forEach((statuses, i) => {
    const first = statuses[0];
    if (first === undefined) return;
    const next = s8(result.counters[i] ?? 0);
    if (isStageSlot(i)) {
      const down = statuses[1];
      if (down !== undefined) reconcileStage(ctx, user, target, ability.id, first, down, next, reason);
      return;
    }
    const was = target.statuses[first] !== undefined;
    if (!was && next > 0) addStatus(ctx, user, target, applicationFor(ability, command, first, i), ability.id);
    else if (was && next <= 0) removeOne(ctx, target, first, reason);
  });
}

/**
 * The statuses of the ability the 24-slot tables cannot hold: one draw each (`% 101`, as the kernels), the game's
 * landing rule, the engine's own application. Runs after the kernels' statuses so their draws keep the game's order.
 */
export function rollEngineRiders(ctx: ResolveContext, user: Ffx2Unit, target: Ffx2Unit, ability: AbilityDef, command: ResolvedCommand): void {
  for (const application of command.engineRiders) {
    const chance = Math.max(0, Math.min(255, Math.round(application.chance)));
    if (chance === 0) continue;
    const resist = target.immunities[application.status] ?? 0;
    const roll = ctx.rng.int(0, 100);
    if (!statusLands(chance, resist, roll, levelOf(user), levelOf(target))) continue;
    addStatus(ctx, user, target, application, ability.id);
  }
}
