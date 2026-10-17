/**
 * The item reactions in the engine: Auto-Potion, Auto-Med and Auto-Phoenix (re-parity RC4 lane F; **FFX only**).
 *
 * The decisions are the game's (`../kernel/reaction-items.ts`, proven against the machine code). This module turns the engine's combatants
 * into the kernel's inputs, and keeps the reactions the game has QUEUED: a reaction is decided inside a hit (Auto-Med and Auto-Potion
 * after the hit's damage and status write-back, Auto-Phoenix inside the death check) and paid for at once, and it runs after the
 * action that caused it. So each decision is made where the game makes it and its item is spent there; what waits in
 * `FFXRuntime.itemReactions` is the queued record, which `engine-end.ts#runItemReactions` executes when the action is over.
 *
 * What a queued record loses: the death check cancels every queued record of the character that dies, and nothing is refunded
 * (`{@link cancelReactionsOf}`, called by `hp.ts#koActor`). What a queued Auto-Phoenix gets back: the executor empties its target
 * (and refunds the Phoenix Down) when its rescuer can no longer act by the time it runs (`engine-end.ts#runItemReactions`).
 *
 * What is NOT modelled (the reaction queue, `FFX-G05` section 3.5, waits for Bailey): the 62-slot record list and its priority
 * insertion. The reactions run in the order they were queued, Auto-Med before Auto-Potion within one hit, after the action's counters.
 */

import type { CombatantId, FFXCombatant, ItemId } from '../../common/types.ts';
import { hasAuto } from '../equipment.ts';
import {
  type CanActFacts,
  type PhoenixCandidate,
  MED_LIST,
  POTION_LIST,
  autoMed,
  autoPhoenix,
  autoPotion,
  reactionCanAct,
} from '../kernel/reaction-items.ts';
import { ExtraBit, PermBit, type StatusRecord, TemporalSlot } from '../kernel/status-types.ts';
import { type Ctx, friendlies, spendItem, statusOf } from '../state.ts';
import { recordOf } from './status.ts';
import { slotOf } from './slots.ts';

/** The item every Auto-Phoenix uses, and nothing else (no Mega Phoenix fallback). */
export const PHOENIX_DOWN: ItemId = 'phoenix-down';

/** One queued item reaction, paid for when it was queued. */
export interface PendingItemReaction {
  kind: 'auto-potion' | 'auto-med' | 'auto-phoenix';
  /** Who uses the item (the wearer; the rescuer for Auto-Phoenix). */
  userId: CombatantId;
  targetId: CombatantId;
  itemId: ItemId;
  /** The queue priority byte (Auto-Med 0x11 to 0x15, Auto-Potion 0x21 to 0x23, Auto-Phoenix 0x30). */
  priority: number;
  /** The user died after this was queued: the death check cancelled it, and the item is lost. */
  lost: boolean;
}

function queueOf(ctx: Ctx): PendingItemReaction[] {
  return (ctx.rt.itemReactions ??= []);
}

/** What Can-act reads of a character, from its status record when it has one (the game's snapshot) or from the character itself. */
export function canActFacts(c: FFXCombatant, rec: StatusRecord = recordOf(c), sleeping = rec.counters[TemporalSlot.Sleep] !== 0): CanActFacts {
  return {
    stoned: (rec.perm & PermBit.Petrify) !== 0,
    perm: rec.perm,
    asleep: sleeping,
    ejected: (rec.extra & ExtraBit.Eject) !== 0,
    inBattleByte: !c.removed,
  };
}

/** The stock the party holds of an item. */
function stockOf(ctx: Ctx, id: ItemId): number {
  return ctx.rt.inventory.get(id) ?? 0;
}

/** A queued Auto-Med or Auto-Potion record of this character is waiting (`0x007b0770`: one per priority class per character). */
function classBlocked(ctx: Ctx, userId: CombatantId, base: number): boolean {
  return queueOf(ctx).some((r) => r.userId === userId && (r.priority & 0xf0) === base);
}

function enqueue(ctx: Ctx, entry: Omit<PendingItemReaction, 'lost'>): void {
  const dead = ctx.rt.reactionDeaths?.has(entry.userId) === true;
  queueOf(ctx).push({ ...entry, lost: dead });
}

/** What the engine knows of one hit that reached a character, for its Auto-Med and Auto-Potion. */
export interface HitFacts {
  /** The character's HP before the hit's HP class was applied, and the positive HP damage the hit dealt (0 when it dealt none). */
  hpBefore: number;
  hpDamage: number;
  /** The hit record's status words before and after this hit (the live statuses before the write-back, and the snapshot written back). */
  before: StatusRecord;
  after: StatusRecord;
  /** A physical hit woke the sleeper (an engine rule, `hit-apply.ts`): the character is not asleep when the reactions look. */
  woke: boolean;
}

/**
 * The reactions of one hit, in the game's order: Auto-Med, then Auto-Potion (only after a hit that dealt positive HP damage). The
 * item is spent here, at the moment the record enters the queue. A monster wears no auto-abilities in the exe (its auto-ability block
 * is zeroed), so only the party and the aeons react.
 */
export function reactToHit(ctx: Ctx, target: FFXCombatant, hit: HitFacts): void {
  if (target.side === 'enemy') return;
  const wearsMed = hasAuto(target, 'auto-med');
  const wearsPotion = hasAuto(target, 'auto-potion');
  if (!wearsMed && !wearsPotion) return;
  const canAct = reactionCanAct(canActFacts(target, hit.after, hit.after.counters[TemporalSlot.Sleep] !== 0 && !hit.woke));

  if (wearsMed) {
    const { before: b, after: a } = hit;
    const given = (id: 'poison' | 'zombie' | 'darkness' | 'silence'): boolean => statusOf(target, id)?.permanent === true;
    const req = autoMed({
      poison: (a.perm & PermBit.Poison) !== 0,
      zombie: (a.perm & PermBit.Zombie) !== 0,
      darkness: a.counters[TemporalSlot.Darkness] as number,
      silence: a.counters[TemporalSlot.Silence] as number,
      oldPoison: b.perm & PermBit.Poison,
      oldZombie: b.perm & PermBit.Zombie,
      oldDarkness: b.counters[TemporalSlot.Darkness] as number,
      oldSilence: b.counters[TemporalSlot.Silence] as number,
      eqPoison: given('poison'),
      eqZombie: given('zombie'),
      eqDarkness: given('darkness'),
      eqSilence: given('silence'),
      classBlocked: classBlocked(ctx, target.id, 0x10),
      canAct,
      stock: [0, 1, 2, 3, 4].map((k) => stockOf(ctx, MED_LIST[k] as ItemId)) as [number, number, number, number, number],
    });
    if (req) {
      const itemId = MED_LIST[req.index] as ItemId;
      if (spendItem(ctx, itemId, target)) enqueue(ctx, { kind: 'auto-med', userId: target.id, targetId: target.id, itemId, priority: req.priority });
    }
  }

  if (wearsPotion && hit.hpDamage > 0) {
    // The HP the callee sees: the hit's damage already subtracted, clamped at 0 (the death check has not run).
    const hp = Math.max(0, Math.min(target.stats.maxHp, hit.hpBefore - hit.hpDamage));
    const req = autoPotion({
      hp,
      maxHp: target.stats.maxHp,
      classBlocked: classBlocked(ctx, target.id, 0x20),
      canAct,
      stock: [0, 1, 2].map((k) => stockOf(ctx, POTION_LIST[k] as ItemId)) as [number, number, number],
    });
    if (req) {
      const itemId = POTION_LIST[req.index] as ItemId;
      if (spendItem(ctx, itemId, target)) enqueue(ctx, { kind: 'auto-potion', userId: target.id, targetId: target.id, itemId, priority: req.priority });
    }
  }
}

/**
 * Auto-Phoenix, from the death check of a party member or an aeon that died of HP loss with no Auto-Life to take it
 * (`hp.ts#koActor`). The rescuer is the first able holder in the game's slot order (party, then aeons); the Phoenix Down is spent now.
 */
export function reactToDeath(ctx: Ctx, victim: FFXCombatant): void {
  if (victim.side === 'enemy') return;
  const holders = friendlies(ctx).filter((c) => hasAuto(c, 'auto-phoenix'));
  if (holders.length === 0) return;
  holders.sort((x, y) => slotOf(ctx, x) - slotOf(ctx, y));
  const candidates: PhoenixCandidate[] = holders.map((c) => ({
    dead: !c.alive || statusOf(c, 'ko') !== undefined,
    holds: true,
    canAct: reactionCanAct(canActFacts(c)),
  }));
  const k = autoPhoenix(false, stockOf(ctx, PHOENIX_DOWN), candidates);
  if (k === null) return;
  const rescuer = holders[k] as FFXCombatant;
  if (spendItem(ctx, PHOENIX_DOWN, rescuer)) {
    enqueue(ctx, { kind: 'auto-phoenix', userId: rescuer.id, targetId: victim.id, itemId: PHOENIX_DOWN, priority: 0x30 });
  }
}

/**
 * The death check cancels every record the dying character has queued, and refunds nothing (`0x0078c740` step 11). The record stays in
 * the list, marked lost, so it still blocks a second one of its class until the action is over; a record queued for the same
 * character later in the action is lost too.
 */
export function cancelReactionsOf(ctx: Ctx, victimId: CombatantId): void {
  for (const r of ctx.rt.itemReactions ?? []) if (r.userId === victimId) r.lost = true;
  // A counter the dying character had queued goes too: the death check removes every action the character had queued (RC9, `counter-chain.ts`).
  for (const c of ctx.rt.counters ?? []) if (c.holderId === victimId) c.lost = true;
  (ctx.rt.reactionDeaths ??= new Set()).add(victimId);
}
