/**
 * HP / MP mutation, KO, revival and removal from the field.
 *
 * Every HP change in the engine funnels through {@link applyHpDelta} so that
 * Auto-Life, Critical (SOS), overkill bookkeeping and the KO event all happen
 * in one place and in one order.
 */

import type { Affinity, CombatantId, ElementId, FFXCombatant } from '../common/types.ts';
import { idiv } from './math.ts';
import { type Ctx, has, isAlive, rtOf, statusOf, tryActor } from './state.ts';
import { clearStatusesOnKo, refreshCriticalStatus, removeStatus } from './statuses.ts';
import { onRevived } from './turnQueue.ts';
import { advanceForm, hasNextForm } from './forms.ts';

/** Metadata for a `damage` event. */
export interface DamageEventInfo {
  sourceId?: CombatantId;
  element: ElementId;
  affinity?: Affinity;
  crit: boolean;
  hitIndex: number;
  hitCount: number;
  capped?: boolean;
}

/**
 * Apply a signed HP delta. Positive damages, negative restores.
 *
 * Returns the amount actually applied, which is what the `damage` event
 * carries — a 400-damage hit on a 120-HP target reports 400, not 120, because
 * the overkill check reads the blow, not the shortfall.
 */
export function applyHpDelta(target: FFXCombatant, amount: number): number {
  if (amount === 0) return 0;
  const before = target.hp;
  target.hp = Math.max(0, Math.min(target.stats.maxHp, before - amount));
  return amount;
}

/** Apply damage and emit the `damage` event, then resolve any KO it caused. */
export function dealDamage(ctx: Ctx, target: FFXCombatant, amount: number, info: DamageEventInfo): void {
  const wasAlive = isAlive(target);
  const hpBefore = target.hp;

  // **A scripted per-hit cap and HP floor**, both engine-internal and both
  // absent on every actor that does not set them
  // [`ActorRuntime.damageCapPerHit` / `.hpFloor`]. This is the single funnel
  // for every HP change from the damage chain, so a boss who "cannot be killed
  // before he summons" is enforced here once rather than in each caller.
  let applied = amount;
  let capped = info.capped === true;
  if (applied > 0) {
    const rt = ctx.rt.actors.get(target.id);
    if (rt?.damageCapPerHit !== undefined && applied > rt.damageCapPerHit) {
      applied = rt.damageCapPerHit;
      capped = true;
    }
    if (rt?.hpFloor !== undefined) applied = Math.min(applied, Math.max(0, hpBefore - rt.hpFloor));
  }

  applyHpDelta(target, applied);

  const enemyDef = target.enemy;
  const overkill =
    applied > 0 &&
    target.hp === 0 &&
    wasAlive &&
    enemyDef !== undefined &&
    applied >= enemyDef.rewards.overkillThreshold;

  const event: Parameters<Ctx['emit']>[0] = {
    type: 'damage',
    targetId: target.id,
    amount: applied,
    element: info.element,
    crit: info.crit,
    hitIndex: info.hitIndex,
    hitCount: info.hitCount,
  };
  if (info.sourceId !== undefined) event.sourceId = info.sourceId;
  if (info.affinity !== undefined) event.affinity = info.affinity;
  if (overkill) event.overkill = true;
  if (capped) event.capped = true;
  ctx.emit(event);

  if (overkill && !ctx.rt.overkilled.includes(target.id)) ctx.rt.overkilled.push(target.id);
  refreshCriticalStatus(ctx, target);
  if (target.hp === 0 && wasAlive) {
    koActor(ctx, target, info.sourceId);
    // The killing blow is the only place the *excess* is knowable, so the
    // revive timer is armed here rather than inside `koActor`.
    if (applied > 0) schedulePartRevival(ctx, target, Math.max(0, applied - hpBefore));
  }
}

/**
 * Arm a destroyed part's revive timer [ffx-bfa-yu-yevon §1.4].
 *
 * `new max HP = baseMaxHp + excess damage from the killing blow`, back after
 * `delayTicks` on the field-wide CTB clock. The Yu Pagodas are the only users:
 * they "cannot be permanently killed", and the research calls getting this
 * right "critical to implement correctly" because it is the difference between
 * the pillars being a one-time chore and being a repeating decision that the
 * boss's whole heal / cleanse / Overdrive economy hangs off.
 */
export function schedulePartRevival(ctx: Ctx, target: FFXCombatant, excess: number): void {
  const rule = target.enemy?.reviveRule;
  if (!rule || isAlive(target)) return;
  const pending = ctx.rt.pendingPartRevivals;
  if (pending.some((p) => p.id === target.id)) return;
  pending.push({
    id: target.id,
    atTicks: ctx.state.ticks + rule.delayTicks,
    maxHp: rule.baseMaxHp + Math.max(0, excess),
  });
}

/**
 * Stand up every part whose {@link schedulePartRevival} timer has run out.
 *
 * Called once per turn from the engine's `advance()`, straight after the CTB
 * clock moves, so a Pagoda re-enters the queue before the next actor is picked.
 */
export function resolveDuePartRevivals(ctx: Ctx): void {
  const pending = ctx.rt.pendingPartRevivals;
  if (pending.length === 0) return;
  const due = pending.filter((p) => p.atTicks <= ctx.state.ticks);
  if (due.length === 0) return;
  ctx.rt.pendingPartRevivals = pending.filter((p) => p.atTicks > ctx.state.ticks);
  for (const p of due) restorePart(ctx, p.id, p.maxHp);
}

/** Restoration that never went through the damage chain (Regen, Auto-Potion, Mortibsorption). */
export function healOutsideChain(
  ctx: Ctx,
  target: FFXCombatant,
  amount: number,
  cause: string,
  sourceId?: CombatantId,
): void {
  if (amount <= 0) return;
  // A Zombie takes restoration as damage — including a Regen tick.
  if (has(target, 'zombie')) {
    dealDamage(ctx, target, amount, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    return;
  }
  applyHpDelta(target, -amount);
  const event: Parameters<Ctx['emit']>[0] = { type: 'heal', targetId: target.id, amount, cause };
  if (sourceId !== undefined) event.sourceId = sourceId;
  ctx.emit(event);
  refreshCriticalStatus(ctx, target);
}

/** Apply an MP delta. Positive drains, negative restores. */
export function applyMpDelta(ctx: Ctx, target: FFXCombatant, amount: number, sourceId?: CombatantId): number {
  if (amount === 0) return 0;
  const before = target.mp;
  target.mp = Math.max(0, Math.min(target.stats.maxMp, before - amount));
  const applied = before - target.mp;
  if (applied > 0) {
    const event: Parameters<Ctx['emit']>[0] = { type: 'mp-damage', targetId: target.id, amount: applied };
    if (sourceId !== undefined) event.sourceId = sourceId;
    ctx.emit(event);
  } else if (applied < 0) {
    const event: Parameters<Ctx['emit']>[0] = { type: 'mp-heal', targetId: target.id, amount: -applied };
    if (sourceId !== undefined) event.sourceId = sourceId;
    ctx.emit(event);
  }
  return applied;
}

/**
 * Take a combatant to 0 HP.
 *
 * Auto-Life is consumed here rather than in the revive path, because it fires
 * "on reaching 0 HP" and must beat the KO [ffx-combat-core §4.2].
 */
export function koActor(ctx: Ctx, target: FFXCombatant, sourceId?: CombatantId): void {
  target.hp = 0;
  // A multi-form boss transforms instead of dying; one monster record serves
  // every form and the script overwrites HP wholesale.
  if (hasNextForm(target) && advanceForm(ctx, target)) return;

  const autoLife = statusOf(target, 'auto-life');
  if (autoLife && !target.flags.noRevive) {
    // A **permanent** Auto-Life is the fayth's, and it is non-consumable:
    // "from the possessed-aeon fights onward the entire party carries a
    // permanent, non-consumable Auto-Life granted by the fayth... a KO'd
    // character immediately revives", and the consequence the same table draws
    // is that those battles **cannot be lost**
    // [ffx-bfa-yu-yevon §2.3, verified: 3 sources]. This code already told the
    // difference apart for the `cause: 'fayth'` message it emits, and then
    // spent it anyway — so the "unlosable" half of the rule survived exactly
    // one KO a head. A cast Auto-Life is still consumed, as it should be.
    const everlasting = autoLife.permanent === true;
    if (!everlasting) removeStatus(ctx, target, 'auto-life', 'consumed');
    const hp = Math.max(1, idiv(target.stats.maxHp, 4));
    target.hp = hp;
    target.alive = true;
    ctx.emit({ type: 'revive', targetId: target.id, hp, cause: everlasting ? 'fayth' : 'auto-life' });
    refreshCriticalStatus(ctx, target);
    // A revived character re-enters with a rank-3 delay, and loses its buffs
    // (§2.3, "KO revival loses buffs") — but not the fayth's gift.
    clearStatusesOnKo(ctx, target);
    if (everlasting) target.statuses['auto-life'] = { ...autoLife };
    onRevived(ctx, target.id);
    return;
  }

  target.alive = false;
  clearStatusesOnKo(ctx, target);
  target.statuses['ko'] = {
    id: 'ko',
    turnsRemaining: null,
    ticksRemaining: null,
    charges: null,
    stacks: 0,
    permanent: false,
  };
  const event: Parameters<Ctx['emit']>[0] = { type: 'ko', targetId: target.id };
  if (sourceId !== undefined) event.sourceId = sourceId;
  ctx.emit(event);
  refreshCriticalStatus(ctx, target);

  if (target.flags.isPart) {
    target.removed = true;
    const partEvent: Parameters<Ctx['emit']>[0] = { type: 'part-destroyed', partId: target.id };
    if (target.flags.partOf !== undefined) partEvent.ownerId = target.flags.partOf;
    ctx.emit(partEvent);
  }
}

/** Bring a KO'd combatant back with `hp` HP. Fails on anything flagged `noRevive`. */
export function reviveActor(ctx: Ctx, target: FFXCombatant, hp: number, cause: string): boolean {
  if (target.flags.noRevive) return false;
  if (target.immunityFlags.includes('immune-to-life')) return false;
  if (isAlive(target)) return false;
  removeStatus(ctx, target, 'ko', 'cured');
  target.alive = true;
  target.hp = Math.max(1, Math.min(target.stats.maxHp, hp));
  ctx.emit({ type: 'revive', targetId: target.id, hp: target.hp, cause });
  refreshCriticalStatus(ctx, target);
  onRevived(ctx, target.id);
  return true;
}

/**
 * Remove a combatant from the field for the rest of the battle.
 *
 * `eject` counts as defeated and a bench member cannot fill the slot
 * [ffx-combat-core §4.2]. `banish` is Seymour's aeon-removal, which **overrides
 * the aeon's innate Eject immunity** because it bypasses Aeon Ribbon rather
 * than rolling Eject [ffx-combat-core §6.1, ffx-seymour-flux §4.5, §7.7.1].
 */
export function ejectActor(ctx: Ctx, target: FFXCombatant, cause: 'eject' | 'shatter' | 'banish'): void {
  if (cause !== 'banish' && (target.immunities['eject'] ?? 0) >= 255) return;
  target.statuses['eject'] = {
    id: 'eject',
    turnsRemaining: null,
    ticksRemaining: null,
    charges: null,
    stacks: 0,
    permanent: true,
  };
  target.alive = false;
  target.removed = true;
  target.hp = 0;
  ctx.emit({
    type: 'status-add',
    targetId: target.id,
    status: 'eject',
    instance: { ...(target.statuses['eject'] as NonNullable<(typeof target.statuses)['eject']>) },
  });
  if (cause === 'shatter') ctx.emit({ type: 'message', text: `${target.name} shatters`, kind: 'status' });
}

/**
 * Restore a destroyed part. The Yu Pagodas come back with
 * `5000 + excess damage from the killing blow` [ffx-bfa-yu-yevon §1.4].
 */
export function restorePart(ctx: Ctx, partId: CombatantId, maxHp: number): void {
  const part = tryActor(ctx, partId);
  if (!part) return;
  part.stats.maxHp = maxHp;
  part.hp = maxHp;
  part.alive = true;
  part.removed = false;
  removeStatus(ctx, part, 'ko', 'cured');
  const event: Parameters<Ctx['emit']>[0] = { type: 'part-restored', partId, hp: maxHp };
  if (part.flags.partOf !== undefined) event.ownerId = part.flags.partOf;
  ctx.emit(event);
  onRevived(ctx, partId);
  rtOf(ctx, partId).ai = {};
}
