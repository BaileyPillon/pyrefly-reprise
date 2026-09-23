/**
 * *An ally is on the floor and the card is not showing the raise. Say why.*
 *
 * `advisor.ts` rule 4 — "an ally on the floor always gets an answer" — was a
 * comment rather than a behaviour. The card priced the Phoenix Down, refused it
 * because the body was **still a Zombie**, and then printed nothing at all:
 * `noteFor` dropped every `'zombie'` refusal on the grounds that
 * `advisor-revive.ts`'s sentence for it ("…so cure the Zombie first") is only
 * an answer when a cure is a row the player can press, and in Chapter 1 it
 * never is — Holy Water, Remedy and Esuna all come back with the **living**
 * as their legal targets, so nobody can clear a Zombie off a corpse.
 *
 * That reasoning is right about the sentence and wrong about the silence.
 * Chapter 1's boss zombifies on the way to killing someone [ffx-seymour-flux
 * §4.8: Lance of Atrophy, Zombie @ 100%, `can_target_dead`], so the zombie
 * branch is the *normal* case there, not an edge: 138 of 166 Chapter 1
 * decisions with somebody down said nothing whatsoever [critic, fix-3 pass 3,
 * F-A] — which is Bailey's original report, *"and what about reviving yuna?"*,
 * still unanswered three passes later.
 *
 * So this module writes the sentence the card is *in a position* to print.
 * Every branch names only the body on the floor and moves that are on the
 * acting character's own list; none of them tells the player to press
 * something that is not there.
 *
 * ## The Zombie branch, and why "leave them down" is the honest answer
 *
 * Full-Life picks a **random zombied character, dead or alive** and inverts
 * into 100% of max HP plus a guaranteed Death [ffx-seymour-flux §4.8, §3.3].
 * A zombied body left on the floor is therefore a Full-Life that *wastes the
 * boss's turn*; the same body stood back up is a free kill. `seymour-flux.ts`
 * step 4 leaves it there for exactly this reason, so the card and the
 * auto-battler now teach the same fight.
 *
 * ## Which game
 *
 * **Both** — the rule is a property of the card, and `advisor.ts` is the one
 * card FFX and FFX-2 share. The Zombie *reading* inside it is FFX's: FFX-2's
 * data layer defines no `zombie` status, so {@link reviveRisk} can never return
 * that kind there, and the one sentence that names **Full-Life** is gated on
 * `state.game` all the same, so an FFX-2 status added later cannot inherit an
 * FFX boss's move name [AGENTS.md rule 14].
 *
 * Pure and DOM-free, like the rest of `tactics/`.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { type ReviveRisk, waitSentence } from './advisor-revive.ts';

/** Everything the sentence is allowed to know. See {@link floorNote}. */
export interface FloorContext {
  state: Readonly<BattleState>;
  /** Who is acting — named only when the answer is "not from this menu". */
  actorName: string;
  /** The body the note is about. */
  fallenId: CombatantId;
  /**
   * The label of a raise this actor can press at {@link fallenId} right now,
   * read off the offered rows rather than off the simulation — `null` when the
   * command window in front of the player has none.
   */
  raiseLabel: string | null;
  /** The reading that made the advisor hold the raise back, if it priced one. */
  refused: ReviveRisk | null;
  /**
   * A raise another girl already has on its way to {@link fallenId} (FFX-2
   * only; `./advisor-committed.ts`, PR-0088): who, and the move's name.
   */
  incoming?: { byName: string; name: string } | null;
}

/**
 * One plain sentence about the ally on the floor, for a card that is not
 * showing the raise. Never empty.
 *
 * No full stop: `MoveAdvisor.ts` appends it.
 */
export function floorNote(ctx: FloorContext): string {
  const who = ctx.state.combatants[ctx.fallenId]?.name ?? 'them';

  // Somebody is already standing them up: that is the answer, and the card
  // has left the second raise off on purpose (PR-0088).
  if (ctx.incoming) return `${ctx.incoming.byName}'s ${ctx.incoming.name} is already on its way to ${who}`;

  if (ctx.refused) {
    // `'aimed'` and `'sweep'` already resolve into "take the hit, then raise
    // them", which is an instruction the player can follow with the card
    // exactly as it stands.
    if (ctx.refused.kind !== 'zombie') return waitSentence(ctx.refused);
    return ctx.state.game === 'ffx'
      ? `Leave ${who} down for now — a raise brings ${who} back still a Zombie, and Full-Life kills a Zombie outright`
      : `Leave ${who} down for now — a raise brings ${who} back still a Zombie, and healing a Zombie is damage`;
  }

  // Nothing refused the raise; it simply is not what the card picked. Say
  // whether standing them up is even on the table.
  if (ctx.raiseLabel) {
    return `${who} can be stood up right now — ${ctx.raiseLabel} is on ${ctx.actorName}'s list`;
  }
  return `Nothing ${ctx.actorName} can press stands ${who} up — that raise has to come from somebody else`;
}
