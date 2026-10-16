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
import { releaseThreatenLink } from './adapt/threaten.ts';
import { reviveAutoStatuses } from './adapt/auto-status.ts';
import { gaugeOnDeath } from './gauge.ts';
import { cancelReactionsOf, reactToDeath } from './adapt/reactions.ts';
import { holdsDeathForHook } from './ai/hooks.ts';
import { overkillReached, overkillStart, overkillStep } from './kernel/death-check.ts';
import { payKill } from './adapt/loot.ts';

/** Metadata for a `damage` event. */
export interface DamageEventInfo {
  sourceId?: CombatantId;
  element: ElementId;
  affinity?: Affinity;
  crit: boolean;
  hitIndex: number;
  hitCount: number;
  capped?: boolean;
  /**
   * A lethal hit leaves the KO pending (re-parity, FFX only): the game's death check runs once, after the target's LAST hit of the action
   * (and after its script's `onHit`), and a hit only clamps HP at 0 until then (RC5 lane FFX-D; FFX-G02 section 3.12). `hit-apply.ts` sets it
   * on every hit of an action; `abilities.ts#finishTouched` settles it with {@link settleDeferredDeath}. Callers outside an action (a Poison
   * tick, a Regen payout, a script writing HP) leave it unset and the KO happens in the call, as the game's single-hit check does.
   */
  holdKo?: boolean;
  /**
   * The target's script {@link ../ai/hooks.ts ScriptHooks.holdsDeath} (the bosses that refill or revive themselves: the Mortiorchis, Mortibody,
   * Macalania's Seymour, Yunalesca, Braska's Final Aeon, the Yu Pagodas): a held KO that the script is certain to refill is not an overkill of anything.
   */
  scriptHeld?: boolean;
  /**
   * The HP damage the whole action has done to this target so far, this hit included (each hit's value after the cap and before the clamp, a heal
   * negative): the game's overkill counter is the monster's threshold minus this (`kernel/death-check.ts#overkillStep`). Absent outside an action.
   */
  actionDamage?: number;
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

  // This is the single funnel for every HP change from the damage chain. Macalania's Seymour no longer gets a
  // per-hit cap and an HP floor from here: the game lets a lethal hit through and his own `onHit` puts him back on
  // his feet (`ai/macalania-seymour.ts`), which is what `info.holdKo` below waits for.
  const applied = amount;
  const capped = info.capped === true;

  applyHpDelta(target, applied);

  const enemyDef = target.enemy;
  // A held KO that the script is certain to refill (a form change, a Yu Pagoda) is not an overkill of anything (AI lane B).
  const survives = info.scriptHeld === true && (hasNextForm(target) || enemyDef?.reviveRule !== undefined);
  // **Overkill is the damage of the whole action** (RC5 lane FFX-D; FFX-G02 sections 1 and 3.1): inside an action the event names the first hit after which
  // the target is at 0 HP with the action's running total (`actionDamage`) at the threshold, and the mark that counts (`ctx.rt.overkilled`) is made at the
  // death check from the final total. A caller outside an action has only this hit.
  const total = info.actionDamage;
  const threshold = enemyDef?.rewards.overkillThreshold ?? 0;
  const overkill =
    target.hp === 0 &&
    wasAlive &&
    !survives &&
    enemyDef !== undefined &&
    applied > 0 &&
    (total === undefined ? applied >= threshold : total >= threshold && !(hpBefore === 0 && total - applied >= threshold));

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

  // A target whose death waits for its last hit is marked overkilled only if it dies, from the action's total (`settleDeferredDeath`).
  if (overkill && info.holdKo !== true && !ctx.rt.overkilled.includes(target.id)) ctx.rt.overkilled.push(target.id);
  refreshCriticalStatus(ctx, target);
  if (target.hp === 0 && wasAlive) {
    if (info.holdKo === true) return; // the death check waits for the target's onHit (`settleDeferredDeath`)
    koActor(ctx, target, info.sourceId);
    // The killing blow is the only place the *excess* is knowable, so the
    // revive timer is armed here rather than inside `koActor`.
    if (applied > 0) schedulePartRevival(ctx, target, Math.max(0, applied - hpBefore));
  }
}

/**
 * The overkill counter of the game's death check (`kernel/death-check.ts#overkillReached`): the monster's threshold minus the HP damage of the whole action is
 * below 1. Only a monster, and not one whose script is certain to refill it (a form change, a Yu Pagoda).
 */
export function overkillAtDeath(target: FFXCombatant, actionDamage: number): boolean {
  const def = target.enemy;
  if (def === undefined) return false;
  if (holdsDeathForHook(target) && (hasNextForm(target) || def.reviveRule !== undefined)) return false;
  return overkillReached(overkillStep(overkillStart(def.rewards.overkillThreshold), actionDamage));
}

/**
 * The death check a lethal hit left pending ({@link DamageEventInfo.holdKo}): after the target's last hit of the action and its
 * script's `onHit`, a target still at 0 HP and still standing dies now (the game's check, VA 0x0078c740). `actionDamage` is the action's HP
 * damage to this target (the overkill counter's input). A no-op for anyone else.
 */
export function settleDeferredDeath(ctx: Ctx, target: FFXCombatant, sourceId?: CombatantId, actionDamage?: number): void {
  if (target.hp !== 0 || !target.alive || has(target, 'ko')) return;
  if (actionDamage !== undefined && overkillAtDeath(target, actionDamage) && !ctx.rt.overkilled.includes(target.id)) ctx.rt.overkilled.push(target.id);
  koActor(ctx, target, sourceId);
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
 * Arm a destroyed part's return at an exact clock reading with an exact pool: the Yu Pagodas' own script decides both
 * (`ai/yu-pagoda.ts`: the pool it absorbed in the life that just ended, back after two or three of its own turns).
 */
export function scheduleRevivalAt(ctx: Ctx, partId: CombatantId, atTicks: number, maxHp: number): void {
  const pending = ctx.rt.pendingPartRevivals;
  if (pending.some((p) => p.id === partId)) return;
  pending.push({ id: partId, atTicks, maxHp });
}

/**
 * Stand up every part whose revive timer ({@link schedulePartRevival}, {@link scheduleRevivalAt}) has run out.
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
  for (const p of due) {
    restorePart(ctx, p.id, p.maxHp);
    // The clock only moves between turns, so a return is found `late` ticks after it was due. The rank-3 delay it pays on
    // rising is counted from the moment it was due, so its first action lands where the Pagoda's own script puts it
    // (the revival is its own turn, which it ends with the recovery of an empty one).
    const late = ctx.state.ticks - p.atTicks;
    if (late > 0) rtOf(ctx, p.id).ctb = Math.max(0, rtOf(ctx, p.id).ctb - late);
  }
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

  // The death handler dissolves the Threaten pair the dying character is an end of (VA 0x0078c740 -> 0x0078e410), before
  // Auto-Life can stand it up again [re-parity W2].
  releaseThreatenLink(ctx, target);

  // ...and runs the Overdrive gauge's death hook (Avenger, Slayer, Hero) whether or not Auto-Life then stands the character up:
  // the killer is whoever's action it was, the victim itself for a tick (Poison, Doom) [re-parity W5; VA 0x0078c740 -> 0x007b0f80].
  gaugeOnDeath(ctx, (sourceId !== undefined ? tryActor(ctx, sourceId) : undefined) ?? target, target);

  // ...and cancels every record the dying character had queued (an Auto-Potion, an Auto-Med, an Auto-Phoenix it was to use), with no
  // refund, before it asks about Auto-Life (VA 0x0078c740, re-parity RC4 lane F).
  cancelReactionsOf(ctx, target.id);

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
    // A revived character re-enters with a rank-3 delay, and loses its buffs
    // (§2.3, "KO revival loses buffs") — but not the fayth's gift. The fayth's revival is the game's own command 0x311F
    // in the possession fights, and the party's script answers it by zeroing that character's CTB, so the one who rose acts
    // next [re-ffx-ai-yunalesca-bfa §5.2; the seven party workers of sins07_*, @0x027f to @0x0327].
    // The KO reset comes FIRST, as in the game's check (VA 0x0078c740: the reset runs, then the Auto-Life revive is queued as an action of the
    // dead character, a quarter of its maximum through the damage chain): a Double HP pool is undone before the quarter is taken from the
    // maximum, and Critical is judged on the HP the revive gives (re-parity RC5, lane FFX-D; FFX-G02 sections 3.1 and 3.7). Not modelled: the
    // revive being a queued action that other entries and later hits can see the corpse before, and Magic Booster's x3/2 on it.
    //
    // The fayth's permanent Auto-Life is wiped by that reset and put back by the revive, inside the same call (the permanent flag `Chr+0x3b`,
    // FFX-G02 sections 3.6 and 3.7): nothing sees the gap, so the engine leaves the status on the body and says nothing about it. It used
    // to emit `status-remove` (reason ko) and then put the status back with no `status-add`, so a party row that follows the events lost the
    // icon for the length of the revive beat and kept it off until the next resync (focused review FOC43-04, Chapter III's last link).
    // Now a permanent holder's Auto-Life has no event at a KO at all, and a cast one is still removed with its event (above).
    clearStatusesOnKo(ctx, target, everlasting ? ['auto-life'] : []);
    const hp = Math.max(1, idiv(target.stats.maxHp, 4));
    target.hp = hp;
    target.alive = true;
    ctx.emit({ type: 'revive', targetId: target.id, hp, cause: everlasting ? 'fayth' : 'auto-life' });
    refreshCriticalStatus(ctx, target);
    if (everlasting) {
      rtOf(ctx, target.id).ctb = 0;
      reviveAutoStatuses(ctx, target); // the equipment statuses the KO reset wiped come back with the revive, as in the branch below [re-parity RC4]
    } else {
      onRevived(ctx, target.id);
    }
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
  payKill(ctx, target, sourceId !== undefined ? tryActor(ctx, sourceId) : undefined); // the death check's loot roll (step 14): a monster pays now, at its death, before Auto-Phoenix (re-parity RC9)
  refreshCriticalStatus(ctx, target);

  // Auto-Phoenix is tried only when there was no Auto-Life for the death check to queue (VA 0x007b2910 answers -1, then 0x007b27b0 runs).
  if (autoLife === undefined) reactToDeath(ctx, target);

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
export function ejectActor(ctx: Ctx, target: FFXCombatant, cause: 'eject' | 'shatter' | 'banish', force = false): void {
  // `force`: the infliction step has already decided (it checked the target's extra-status immunity itself, and a Petrify that lands
  // on a monster puts Eject in the record whatever the monster's immunity says), so the old guard does not apply [re-parity W2].
  if (!force && cause !== 'banish' && (target.immunities['eject'] ?? 0) >= 255) return;
  const wasAlive = target.alive;
  // The function that takes a character off the field also dissolves its Threaten pair (VA 0x0078e410) [re-parity W2].
  releaseThreatenLink(ctx, target);
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
  if (wasAlive && cause !== 'banish') payKill(ctx, target); // the death check's kind 2 (an Eject) pays the monster's loot as a KO does (FFX-G02 section 3.1); a party member has no rewards block (re-parity RC9)
}

/**
 * Restore a destroyed part with the pool it was armed with. The Yu Pagodas come back with the damage they took in the
 * life that just ended (`ai/yu-pagoda.ts`; the data's `reviveRule` is the older fixed rule, used only when something
 * other than a hit destroys a part). Its AI memory carries over, as the script's private variables do.
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
}
