/**
 * **No card on the menus of Yuna's own Yojimbo and Magus Sisters** (lane FFX-K's aeons, the hidden Mirror Aeons chapter; **FFX only**: FFX-2's Yojimbo is a mission boss with no such menu).
 *
 * Their menus are Pay and the Sisters' orders (`battle/ffx/aeon-commands.ts`), commands the engine carries out itself and that are not abilities of the registry, so the card's simulation cannot run them: it prices the one
 * row it can, Dismiss, and prints it as the best move on the turn the right move is Combine powers or a payment (the reverse-engineering session's open item 12: "a chapter that shows the card should hide or reword it for these
 * turns"). A card that says nothing is better than one that sends the aeon home. The chapter's own line (`./mirror-aeons.ts`) still plays these turns for the Auto strategy and the bench; the strategy guide panel still
 * names Combine powers and the payment. **The payment screen does not exist yet** (a new screen needs its mockup and Bailey's word first), so the HUD's Pay row sends a payment of nothing and Yojimbo leaves: recommending
 * it on a card would be recommending that.
 */
import type { AvailableCommand } from '../../battle/common/types.ts';
import { ORDER_IDS, PAY_ABILITY_ID } from '../../battle/ffx/aeon-commands.ts';

/** Is this the menu of the player's Yojimbo or of one of the Sisters: does any of its rows carry Pay's id or an order's? No other menu does. */
export function isAeonMenu(commands: readonly AvailableCommand[]): boolean {
  return commands.some((c) => c.command.kind === 'ability' && (c.command.id === PAY_ABILITY_ID || ORDER_IDS.includes(c.command.id)));
}
