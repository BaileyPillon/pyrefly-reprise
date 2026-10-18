/**
 * The counter chain, as the engine's seam to `kernel/counter.ts` (re-parity RC9 lane FFX-G slice G-c; **FFX only**).
 *
 * What the game does (`research/re-ffx-targeting.md` section 7): every hit of a command ends by asking whether it arms its target's counter, and a target answers
 * **once per command**, when its first hit is applied. A hit arms when it is not a "no effect" outcome (a hit, a miss, a forced miss and a Nul-nullified hit all count),
 * the command is single-target and harmful, the attacker is not itself running a reaction, and the target wears Counterattack or Evade and Counter (against a physical
 * command) or Magic Counter (against a magical one). The target then answers if it can act, with **its own default attack** at the attacker, queued as a reaction; a
 * target that cannot act forgets the counter. The answer is not a chance roll: there is no draw anywhere in the chain.
 *
 * The engine applies its hits one after another, so the decision is taken after each hit of a target until the target has had its turn at it: {@link noteCounterHit}
 * arms from the hit, and the first hit that arms decides (can the holder act now, after that hit's statuses went in?). The answers queue in `FFXRuntime.counters`;
 * `engine-end.ts#afterAction` runs them once the action is over, and `adapt/reactions.ts#cancelReactionsOf` marks a holder's lost when the action then kills it (the game's
 * death check removes a dying character's queued actions).
 *
 * **The holder's own default attack.** The game queues the holder's `Chr+0x6c6`. The character initialiser writes the constant 0x3000 (Attack) into it for every
 * party member and aeon (VA 0x0079b68d, the non-monster branch), and the engine's one generic `attack` is that command for them; a monster takes its record's
 * forced-action word (`adapt/target-world.ts#defaultAttackOf`), and none holds a counter (see `adapt/counter.ts`), so in practice the generic Attack is the holder's own.
 */

import type { CombatantId, FFXCombatant } from '../common/types.ts';
import { reactionCanAct } from './kernel/reaction-items.ts';
import { queueCounter } from './kernel/counter.ts';
import type { HitOutcome } from './kernel/hittypes.ts';
import { canActFacts } from './adapt/reactions.ts';
import { armedCause, attackerInReaction } from './adapt/counter.ts';
import { actorNumber } from './ai/script-random.ts';
import { defaultAttackOf } from './adapt/target-world.ts';
import { type Ctx } from './state.ts';
import type { HitScope } from './hit-apply.ts';

/** One counter a hit has queued, waiting for the action to be over. */
export interface PendingCounter {
  /** The holder: it answers. */
  holderId: CombatantId;
  /** The attacker: the answer is aimed at it. */
  attackerId: CombatantId;
  /** What the engine reports: Counterattack and Evade and Counter answer a physical command, Magic Counter a magical one. */
  cause: 'counterattack' | 'magic-counter';
  /** The holder died after this was queued: the death check removed it. */
  lost: boolean;
}

/**
 * The end of one hit of `scope`'s command on `target`: arm the counter from the hit, and when the target is armed and has not been answered for in this command,
 * decide it. `outcome` is what the hit came to.
 */
export function noteCounterHit(scope: HitScope, target: FFXCombatant, outcome: HitOutcome): void {
  const { ctx, user, def, options } = scope;
  const answered = (scope.answered ??= new Set());
  if (answered.has(target.id)) return;
  const cause = armedCause(ctx, user, def, target, outcome, attackerInReaction(ctx, def, options.isCounter === true));
  if (cause === undefined) return;
  // The decision is taken: the armed byte is cleared whether or not the holder queues, so the command's later hits find nothing to answer (a script-aimed row is a
  // random-target record, never single-target, so it never gets here).
  answered.add(target.id);
  const canAct = reactionCanAct(canActFacts(target));
  const record = queueCounter(canAct, actorNumber(ctx, target), actorNumber(ctx, user), defaultAttackOf(target));
  // A holder with no default attack (a command word of 0) queues a record that names no command: nothing runs.
  if (record === undefined || record.command === 0) return;
  const queue = (ctx.rt.counters ??= []);
  queue.push({ holderId: target.id, attackerId: user.id, cause, lost: ctx.rt.reactionDeaths?.has(target.id) === true });
}

/** The counters the action queued, oldest first, emptying the list. A holder that died, or an attacker that did, answers nothing. */
export function takeCounters(ctx: Ctx): PendingCounter[] {
  const queue = ctx.rt.counters ?? [];
  ctx.rt.counters = undefined;
  return queue.filter((c) => !c.lost);
}
