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
