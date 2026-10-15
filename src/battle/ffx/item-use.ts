/**
 * Using an item command: what it aims with, and paying for it (re-parity RC7, lanes FFX-H and L-CMD merged; **FFX only**). Split out of `execute.ts` for the
 * 400-line house limit (AGENTS.md rule 7).
 *
 * The game deducts an item's stock **when the action is queued** (the menu's commit: `kernel/deduct.ts`, FFX.exe 0x007b0c20 with -1) and gives it back **when the
 * executor does not carry the action out** (+1); a monster never touches the bag. The engine has no queue between the player choosing an item and the item being
 * used, so the one deduction happens where the command is executed, **after** the two checks the executor makes as a sub-action starts (`command-start.ts`: the
 * cost check and the range filter): a command those checks refuse pays nothing, which is the same stock as the game's deduct at the queue followed by its refund.
 * What the engine does model of the rest: the item an item *reaction* (Auto-Med, Auto-Potion, Auto-Phoenix) paid for when its record was queued is not paid again
 * (`FFXRuntime.prepaidItem`), is returned when the command does not start (`command-start.ts#fizzle`), and an Auto-Phoenix whose rescuer cannot act has its
 * Phoenix Down refunded (`engine-end.ts`). Not modelled: the loss of a queued item when its user dies first (no engine action waits in a queue except the
 * reactions, which `adapt/reactions.ts` already handles).
 *
 * **Gil** (the Spare Change offer, 0x007859a0): the action runs with the full amount offered, and the pay refuses (gil unchanged) when the amount exceeds the gil the party
 * holds, instead of cutting the amount (FFX-G05 section 3.8; the cut belongs to Copycat's repeat only).
 */

import type { AbilityDef, Command, FFXCombatant } from '../common/types.ts';
import type { ResolveOptions } from './abilities.ts';
import { type Ctx, spendItem } from './state.ts';
import { payGil } from './kernel/gil.ts';

type ItemCommand = Extract<Command, { kind: 'item' }>;
type Refused = { ok: false; result: { rank: number; damageDealt: 0; rejected?: true } };
/** What setting up an item command left: the ability to resolve (the item's own targeting and name), or the result of a command that is refused. */
export type ItemSetup = { ok: true; def: AbilityDef } | Refused;
/** What paying for an item command left: the options to resolve with, or the result of a command that is refused. */
export type ItemPayment = { ok: true; options: ResolveOptions } | Refused;

/**
 * Give the ability the item's own targeting and name. An aeon has no Item command [ffx-combat-core §6.2]; `commands.ts` offers none, and one that arrives anyway is
 * refused with the turn kept (PR-0155). Pays nothing: it runs before the range filter, which needs the item's targeting.
 */
export function itemAbility(ctx: Ctx, actor: FFXCombatant, command: ItemCommand, def: AbilityDef): ItemSetup {
  if (actor.side === 'aeon') {
    ctx.emit({ type: 'message', text: `${actor.name} cannot use items`, kind: 'system' });
    return { ok: false, result: { rank: 0, rejected: true, damageDealt: 0 } };
  }
  const item = ctx.content.item(command.id);
  return { ok: true, def: item ? { ...def, targeting: item.targeting, name: item.name, category: 'item' } : def };
}

/**
 * Pay for `command` once both gates have let it start: spend its item (through the game's bag, charged to `actor`) and take the Spare Change offer from the gil.
 * An empty bag spends the turn with "No items left".
 */
export function payForItem(ctx: Ctx, actor: FFXCombatant, command: ItemCommand, options: ResolveOptions): ItemPayment {
  // An item reaction (Auto-Med, Auto-Potion, Auto-Phoenix) was paid for when its record was queued (`adapt/reactions.ts`): that one use is not spent again.
  if (ctx.rt.prepaidItem === command.id) {
    ctx.rt.prepaidItem = undefined;
  } else if (!spendItem(ctx, command.id, actor)) {
    ctx.emit({ type: 'message', text: 'No items left', kind: 'system' });
    return { ok: false, result: { rank: 3, damageDealt: 0 } };
  }
  let next = options;
  if (command.gilSpent !== undefined) {
    next = { ...options, gilSpent: command.gilSpent };
    ctx.rt.gil = payGil(ctx.rt.gil, command.gilSpent).gil;
  }
  return { ok: true, options: next };
}
