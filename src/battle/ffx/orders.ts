/**
 * **Ordered actions**: one actor's row makes another actor act, on the first
 * actor's turn.
 *
 * Yojimbo is the case this exists for. His "Daigoro" row (`ffx_monmagic1`
 * 4:134) deals no damage and targets **monster slot M3**, the Koma Inu record;
 * the dog then uses its own row (4:177) with **its own Strength 25**, never
 * Yojimbo's 34 [research/ffx-yojimbo.md §2.5, §3.1, decompiled]. The dog owns
 * no CTB counter of its own (`ActorRuntime.ordersOnly`, read by
 * `turnQueue.ts#queueMembers`), so this is the only way it ever acts.
 *
 * The seam is data-driven and inert everywhere else: an `AbilityDef` whose
 * `extra` names {@link ORDERS_ACTOR} and {@link ORDERED_ABILITY} orders that
 * actor to use that ability. No shipped row before the Yojimbo chapter sets
 * either key, so every other battle's event log is unchanged.
 *
 * What the ordered actor does is an ordinary resolved action: its own
 * `action-start` / `action-end`, its own stats, its own hit and crit rolls. It
 * costs the ordered actor **no CTB** (it has no counter) and it is not a
 * counter: `engine.ts` charges only the orderer's rank, and party reactions
 * key off the orderer's action exactly as they would for any enemy turn.
 *
 * Deterministic and DOM-free [AGENTS.md hard rule 1]: the only randomness is
 * the seeded target and damage rolls inside the ordered action itself.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The FFX-2 Yojimbo's Daigoro is
 * a different mechanic (an untargetable follow-up in an ATB script,
 * research §8.2) and the ATB engine never imports this module.
 */

import type { AbilityDef, Command, FFXCombatant } from '../common/types.ts';
import { type Ctx, canAct, tryActor } from './state.ts';

/** `AbilityDef.extra` key: the combatant id this row orders to act. */
export const ORDERS_ACTOR = 'ordersActor';
/** `AbilityDef.extra` key: the ability id the ordered actor uses. */
export const ORDERED_ABILITY = 'orderedAbility';

/** One ordered action: who acts, and the command they act with. */
export interface OrderedAction {
  actor: FFXCombatant;
  command: Command;
}

/**
 * The action a resolved row orders, or `null` when the row orders nothing or
 * the ordered actor cannot act (KO'd, petrified, ejected, asleep, Threatened).
 *
 * Targets are left empty on purpose: the ordered row's own `targeting` picks
 * them (`'random-enemy'` for Daigoro, "one random character" [§3.1]).
 */
export function orderedAction(ctx: Ctx, orderer: FFXCombatant, def: AbilityDef): OrderedAction | null {
  const who = def.extra?.[ORDERS_ACTOR];
  const what = def.extra?.[ORDERED_ABILITY];
  if (typeof who !== 'string' || typeof what !== 'string') return null;
  if (who === orderer.id) return null;
  const actor = tryActor(ctx, who);
  if (!actor || actor.side !== orderer.side || !canAct(actor)) return null;
  if (!ctx.content.ability(what)) return null;
  return { actor, command: { kind: 'ability', id: what, targets: [] } };
}

/**
 * Carry out the order a just-resolved row gave, if it gave one.
 *
 * `execute` is `execute.ts#executeCommand`, passed in rather than imported so
 * this module does not close an import cycle with its only caller. Returns the
 * HP damage the ordered action dealt (0 when nothing was ordered); the caller
 * keeps it apart from the orderer's own `damageDealt`.
 */
export function carryOutOrder(
  ctx: Ctx,
  orderer: FFXCombatant,
  def: AbilityDef,
  execute: (actor: FFXCombatant, command: Command) => number,
): number {
  const order = orderedAction(ctx, orderer, def);
  if (!order) return 0;
  return execute(order.actor, order.command);
}
