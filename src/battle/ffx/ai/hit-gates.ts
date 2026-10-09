/**
 * **The gates between a boss's `onHit` and the free action it asks for** (re-parity, AI lane C; **FFX only**).
 *
 * `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 1.1 (read in FFX.exe, the hook requester 0x7aceb0): the hook script
 * *runs* whatever the circumstances, so its counters and scores always move; only what it *queues* is filtered, and
 * `isCounterattackAllowed()` (0x7a8450) is the same test the scripts use to gate their own gains (Yojimbo's +3, Grothia's +3,
 * Pterya's +15):
 *
 * - the owner can queue (`canQueue`: not Petrified, Ejected, asleep, Threatened, Confused or Berserk), and
 * - the hit that raised the event is not itself part of a reaction (a party counter-attack, another boss's counter).
 *
 * A command queued with `performCommand` is further dropped when the owner already has a reaction waiting
 * (0x7b0720), so a Doublecast on a boss that answers every hit still gets one answer.
 */

import type { Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import { queueReaction } from '../hit-hooks.ts';
import { type Ctx, tryActor } from '../state.ts';
import { canQueue, frontLine } from './game-rolls.ts';

/** `isCounterattackAllowed()`: the owner can act and the attacker is not itself running a reaction. */
export function counterAllowed(ctx: Ctx, owner: FFXCombatant): boolean {
  return canQueue(owner) && ctx.rt.inReaction !== true;
}

/**
 * The game's `performCommand` from inside `onHit`: queue `command` for `owner` as a free action that runs once the triggering
 * action is done. `aimId` is only the `counter` event's target (the engine's queue refuses a dead one).
 * Returns whether it was queued.
 */
export function react(ctx: Ctx, owner: FFXCombatant, aimId: CombatantId, command: Command): boolean {
  if (!canQueue(owner)) return false;
  if ((ctx.rt.reactions ?? []).some((r) => r.actorId === owner.id)) return false;
  const before = ctx.rt.reactions?.length ?? 0;
  queueReaction(ctx, { actorId: owner.id, targetId: aimId, command, cause: 'script' });
  return (ctx.rt.reactions?.length ?? 0) > before;
}

/** Who a boss reaction names as its target for the `counter` event: the attacker if it still stands, else the first living friendly. */
export function reactionAim(ctx: Ctx, attacker: FFXCombatant): CombatantId {
  if (attacker.alive) return attacker.id;
  return frontLine(ctx).find((c) => c.alive)?.id ?? attacker.id;
}

/** Ids of the front line (`-14 FrontlineChars`): the whole party, or the aeon alone while one holds the field. */
export function frontIds(ctx: Ctx): CombatantId[] {
  return frontLine(ctx).map((c) => c.id);
}

/** The game's actor numbers 8 to 14: Yuna's seven aeons. The Magus Sisters (15 to 17) are not among them. */
const AEONS_8_TO_14: ReadonlySet<CombatantId> = new Set(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo']);

/**
 * `dereferenceCharacter(AllActors)` is an aeon 8 to 14: the scripts' "an aeon holds the field" test (note section 1.2).
 * It is about the field's state at that moment, not about who hit the boss.
 */
export function aeonHoldsField(ctx: Ctx): boolean {
  const id = ctx.state.aeonId;
  if (id === null) return false;
  const aeon = tryActor(ctx, id);
  return aeon !== undefined && AEONS_8_TO_14.has(aeon.id);
}
