/**
 * **Which of Cid's orders the player can give right now**, stated once for the
 * move-advisor card (the order widget lists the rows the engine offers).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The airship distance mechanic
 * "has no X-2 counterpart" (research/ffx-evrae-airship.md §0.4). Every answer is
 * `false` unless `flags['airship.range']` is set, which only the Evrae encounter
 * does (`src/battle/ffx/ai/evrae-rules.ts#applyEvraeSetup`).
 *
 * The game offers **one order at a time** (re-parity row D-08, Bailey 2026-10-09:
 * "Yes, match the game"): Pull back at NEAR, Close in at FAR, Cancel while an
 * order stands, and the engine's rows follow (`orderOnOffer`), so the widget just
 * lists what is on offer. A card must not name an order row that is not the one on
 * offer: the player cannot press it.
 *
 * Pure, DOM-free, reads published state only.
 */

import type { Command } from '../../battle/common/types.ts';
import { ORDER_CANCEL, ORDER_CLOSE_IN, ORDER_PULL_BACK, orderOnOffer } from '../../battle/ffx/ai/evrae-rules.ts';

/** `true` when this is one of the three airship Trigger Commands. */
export function isAirshipOrderId(id: string): boolean {
  return id === ORDER_PULL_BACK || id === ORDER_CLOSE_IN || id === ORDER_CANCEL;
}

/** `true` for an order row that is not the one on offer on this board (the card must not name it); `false` for everything else. */
export function refusedAirshipOrder(flags: Readonly<Record<string, unknown>>, command: Command): boolean {
  if (command.kind !== 'trigger' || !isAirshipOrderId(command.id)) return false;
  const offered = orderOnOffer(flags);
  return offered !== null && offered !== command.id;
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
