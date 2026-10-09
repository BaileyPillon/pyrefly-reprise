/**
 * **Running the reactions the boss scripts queued** (re-parity; FFX only; see `./hooks.ts`).
 *
 * `engine-end.ts#afterAction` calls {@link drainScriptReactions} once the action that set them off
 * has resolved, and again after the turn's poison tick (a `postPoison` hook can queue too). Each
 * reaction costs its owner no CTB, and one that hits anybody runs that target's hooks like any
 * other action does, which can append more reactions to the end of the same queue: the game's
 * first-in-first-out order. Mortibsorption on Flux, for instance, is followed by the Protect and
 * Reflect his thresholds answer it with.
 *
 * Kept out of `hooks.ts` because it needs the executor, which needs the resolver, which needs
 * `hooks.ts`: the registry stays free of the cycle.
 */

import type { EventInput } from '../state.ts';
import { type Ctx, abilityOf, isAlive, tryActor } from '../state.ts';
import { executeCommand } from '../execute.ts';
import { mortibsorption } from '../scripted.ts';
import { canQueueCommand, runOnHit, takeReaction } from './hooks.ts';

/** More than any real chain; a runaway script cannot loop the engine. */
const MAX_REACTIONS_PER_DRAIN = 64;

/** What the drain needs from the facade: the context and its event emitter. */
export interface ReactionHost {
  ctx: Ctx;
  push(event: EventInput): void;
}

/** Run every queued reaction, oldest first, including the ones running them queues. */
export function drainScriptReactions(h: ReactionHost): void {
  const { ctx } = h;
  for (let n = 0; n < MAX_REACTIONS_PER_DRAIN; n++) {
    const reaction = takeReaction(ctx);
    if (!reaction) return;
    if (reaction.kind === 'drain') {
      runDrain(h, reaction.mountId, reaction.hostId);
      continue;
    }
    if (reaction.kind === 'emit') {
      h.push(reaction.event);
      continue;
    }
    const owner = tryActor(ctx, reaction.ownerId);
    if (!owner || !isAlive(owner)) continue;
    if (!reaction.forced && !canQueueCommand(owner, reaction.keepsControl)) continue;
    h.push({
      type: 'counter',
      actorId: owner.id,
      targetId: reaction.byId,
      abilityId: reaction.command.kind === 'ability' ? reaction.command.id : 'attack',
      cause: 'script',
    });
    executeCommand(ctx, owner, reaction.command, true);
  }
  while (takeReaction(ctx)) {
    // Dropped: nothing may leak into the next action.
  }
}

/**
 * Mortibsorption: the mount's max HP into the host (its HP and max HP were set to the revive value
 * when it was hit, `seymour-flux-hooks.ts`). The drain is an enemy-side hit on the host, so the
 * host's own `onHit` hears of it (the thresholds of Flux, the phase of Natus), and a lethal drain
 * still resolves, then the check. No `counter` event: the mount does not lunge at its master.
 */
function runDrain(h: ReactionHost, mountId: string, hostId: string): void {
  const { ctx } = h;
  const mount = tryActor(ctx, mountId);
  const host = tryActor(ctx, hostId);
  if (!mount || !host) return;
  const hpBefore = host.hp;
  const transfer = mortibsorption(ctx, mount, host); // the mount's max HP, before the clamp to the HP the host had left
  const def = abilityOf(ctx, 'mortibsorption');
  if (def) runOnHit(ctx, { def, user: mount }, host, { hpBefore, lostHp: host.hp < hpBefore, lastDamage: transfer, affectsHp: true });
}
