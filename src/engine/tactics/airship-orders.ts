/**
 * **Which of Cid's two orders the player can give right now**, stated once for
 * the order widget and the move-advisor card.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The airship distance mechanic
 * "has no X-2 counterpart" (research/ffx-evrae-airship.md §0.4). Every answer is
 * `null` unless `flags['airship.range']` is set, which only the Evrae encounter
 * does (`src/battle/ffx/ai/evrae-rules.ts#applyEvraeSetup`).
 *
 * The engine keeps a redundant order **legal** on purpose (owner decision
 * C-7 / G-2, `REDUNDANT_ORDER_BURNS_TURN`: it still forgoes Cid's volley), so
 * it offers both rows enabled. The widget (`src/ui/ffx/AirshipOrderWidget.ts`)
 * greys out the two that can only cost a turn: the range the ship is already
 * in ("Already far"), and the order already standing ("Ordered", last order
 * wins, §4.2). Before this was one function the card kept recommending exactly
 * those rows (29 to 66 times a fight, following the top row), and the player
 * could not press what the card said.
 *
 * Pure, DOM-free, reads published state only.
 */

import type { Command } from '../../battle/common/types.ts';

/** The widget's greyed-row copy, or `null` when the order is one the player can give. */
export type AirshipOrderRefusal = 'Already near' | 'Already far' | 'Ordered';

/** `'pull-back'` flies the ship out, `'close-in'` brings it in [§4.2, owner ids 2026-09-21]. */
function destination(orderId: string): 'near' | 'far' | null {
  if (orderId === 'pull-back') return 'far';
  if (orderId === 'close-in') return 'near';
  return null;
}

/**
 * Why this order would only spend a turn, or `null` when it would change
 * something (or when this is not the airship battle at all).
 */
export function airshipOrderRefusal(
  flags: Readonly<Record<string, unknown>>,
  orderId: string,
): AirshipOrderRefusal | null {
  const range = flags['airship.range'];
  if (range !== 'near' && range !== 'far') return null;
  const target = destination(orderId);
  if (target === null) return null;
  if (target === range) return range === 'far' ? 'Already far' : 'Already near';
  if (flags['airship.order'] === target) return 'Ordered';
  return null;
}

/** `true` for a Trigger row the order widget greys out; `false` for everything else. */
export function refusedAirshipOrder(flags: Readonly<Record<string, unknown>>, command: Command): boolean {
  return command.kind === 'trigger' && airshipOrderRefusal(flags, command.id) !== null;
}

/**
 * **The §4.5 trap, as a gate for the card.** A breath is charged and the ship
 * is FAR: a command that names Evrae now makes it Swoop in and breathe anyway,
 * so the dodge fails *because you attacked* (research/ffx-evrae-airship.md
 * §4.5, "Evrae isn't targeted until the attack is executed"). The chapter's
 * own line already refuses it (`./evrae.ts` rule 2); this keeps the card's
 * simulated rows from putting it back on top (Chapter VIII end-to-end
 * evidence, win-23: "Lancet -> Evrae" on Kimahri's charged FAR turn).
 */
export function baitsTheBreath(flags: Readonly<Record<string, unknown>>, command: Command): boolean {
  if (!holdingForTheBreath(flags)) return false;
  return (command.targets as readonly string[] | undefined)?.includes('evrae') === true;
}

/**
 * A breath is charged and the ship is FAR: the dodge is in progress, and §4.5's
 * answer is "do nothing, visibly, on purpose". The card keeps the chapter's
 * quiet turn on top here even though it changes nothing measurable, because
 * changing nothing *is* the play (`./advisor.ts`, the state guard).
 */
export function holdingForTheBreath(flags: Readonly<Record<string, unknown>>): boolean {
  return flags['airship.range'] === 'far' && flags['airship.breathCharged'] === true;
}
