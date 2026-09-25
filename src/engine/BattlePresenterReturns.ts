/**
 * **A figure sent to come back: the `'returns'` departure** (`BattlePresenterDepartures.ts`).
 *
 * **Game case: FFX only** for the one id that has it, Mortibody (Chapter X); the plumbing is
 * shared (both) [AGENTS.md rule 14]. On whose word: research
 * `ffx-seymour-natus-highbridge.md` §4.4 (Mortibsorption drains Natus and revives Mortibody,
 * verified: 4 sources) and §4.5 ("Mortibody has no death state of its own: it always
 * revives", derived); Bailey's O-2 A pick with its KO-and-revive strip
 * (`docs/concepts/chapters/natus/INSTALLED.md`: the pyrefly dissolve, then "the same idle coming
 * back weaker").
 *
 * The engine revives the mount with a `heal` (`cause: 'mortibsorption'`) and never a `revive`
 * or `part-restored` (`src/battle/ffx/scripted.ts#mortibsorption`). A plain send removed the
 * figure at `ko` and again at `part-destroyed`, so from its first KO it fought on unseen (the
 * preflight `docs/plans/natus-ship-review.md`, proved on the engine). Here the send keeps the
 * figure on the stage at dissolve 1, `part-destroyed` leaves it, and the reviving heal fades
 * it back in. Chapter I's Mortiorchis shows the same removal and is **not** given this kind
 * (reported, not fixed in passing).
 *
 * Same rules as the other beat modules: no `three`, no DOM, ports only [AGENTS.md rule 1].
 */

import type { CombatantId } from '../battle/common/types.ts';
import type { ActorHandle } from './BattlePresenterPorts.ts';
import { settled, TIMING, type EventCtx } from './BattlePresenterEvents.ts';

/**
 * The send: the fiend's dissolve length (`TIMING.ko`, 620 ms). A literal, not a read of
 * `TIMING`: the departures table reads it at module load, inside the import cycle
 * `BattlePresenterDepartures.ts` describes at `FALL_MS`.
 */
export const RETURN_MS = 620;

/** The fiend's pyrefly green, as `BattlePresenterBeats.ts#ko` sends one. */
const PYREFLY = 0x9dffc4;

/** Figures a `'returns'` departure kept on the stage, waiting for the heal that revives them. */
const kept = new WeakSet<ActorHandle>();

/** Was `actor` sent by a `'returns'` departure and not yet brought back? */
export function keptToReturn(actor: ActorHandle | undefined): boolean {
  return actor !== undefined && kept.has(actor);
}

/** Send `actor` into pyreflies as a fiend is, but keep it on the stage for its revive. */
export async function sendToReturn(actor: ActorHandle, guard: (p: void | Promise<void>) => Promise<void>): Promise<void> {
  kept.add(actor);
  await guard(actor.dissolveTo(1, RETURN_MS, PYREFLY));
}

/**
 * `heal`: the actor to flash, after fading a kept figure back in (the revive of a `'returns'`
 * departure). Every other heal gets its actor unchanged, so no other chapter moves.
 */
export async function comeBack(ctx: EventCtx, id: CombatantId): Promise<ActorHandle | undefined> {
  const a = ctx.stage.actor(id);
  if (!a || !kept.has(a)) return a;
  kept.delete(a);
  a.setDissolve(0);
  a.setAlpha(0);
  a.setPose('idle');
  await settled(ctx, a.fadeTo(1, TIMING.revive), TIMING.revive);
  return a;
}
