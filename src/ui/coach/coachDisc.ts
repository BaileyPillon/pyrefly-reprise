/**
 * **Chapter XII's disc line** (D-216, wording (c) picked verbatim in D-248).
 *
 * Auron says it once, the first time the advisor card's top row would turn a
 * Mortiphasm disc (`engine/tactics/advisor-omnis.ts#topRowDiscTurn`), and never
 * in any other fight: that answer is `null` unless the board carries the Omnis
 * `omnis.discs` flag, so Chapter I and the rest cannot reach the line.
 *
 * Unlike the menu marks it cannot be chosen before the menu opens, because the
 * card's top row only exists once `inner.chooseCommand` has run `showDecision`.
 * `CoachedHud` therefore asks this watcher right after it hands the menu on, in
 * the same turn of the event loop. The line's capture-phase confirm still sits
 * ahead of the menu's own keys in a browser (`CoachMark.onConfirmCapture`).
 *
 * **Game case: FFX only** (AGENTS.md rule 14): the discs exist in no FFX-2
 * fight, and FFX-2's deck is Rikku's, which never holds.
 */

import type { BattleState, Command, GameId } from '../../battle/common/types.ts';
import { topRowDiscTurn } from '../../engine/tactics/advisor-omnis.ts';
import { markById, type CoachMark, type CoachMarkId } from './coachCopy.ts';

/** The mark's id, for the seen-set. */
export const OMNIS_DISC_MARK: CoachMarkId = 'ffx-omnis-disc';

/** What the watcher reads off the HUD: the advisor card's view (`MoveAdvisor.view()`), duck-typed like the wrapper's `moveAdvisor` probe. */
interface CardOwner {
  moveAdvisor?: { view?: () => { actorId: string; suggestions: readonly { command: Command }[] } | null };
}

/** Remembers the last board, and answers whether the line is due on the menu just opened. */
export class DiscWatch {
  private state: BattleState | null = null;

  track(state: BattleState): void {
    this.state = state;
  }

  /** The disc line, when this FFX menu's top row turns a disc and it has not been said; else `null`. */
  markFor(game: GameId, hud: unknown, seen: (id: CoachMarkId) => boolean): CoachMark | null {
    if (game !== 'ffx' || !this.state || seen(OMNIS_DISC_MARK)) return null;
    try {
      const view = (hud as CardOwner).moveAdvisor?.view?.() ?? null;
      return topRowDiscTurn(this.state, view) ? markById(OMNIS_DISC_MARK) : null;
    } catch {
      return null; // a card that could not be read teaches nothing; the fight is untouched
    }
  }
}
