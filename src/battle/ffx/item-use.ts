/**
 * Paying for an item command (re-parity RC7, lane FFX-H; **FFX only**), split out of `execute.ts` for the 400-line house limit (AGENTS.md rule 7).
 *
 * The game deducts an item's stock **when the action is queued** (the menu's commit: `kernel/deduct.ts`, FFX.exe 0x007b0c20 with -1) and gives it back **when the
 * executor does not carry the action out** (+1); a monster never touches the bag. The engine has no queue between the player choosing an item and the item being
 * used, so the one deduction happens here, where the command is executed: the same stock change at the same moment as far as anything can observe. What the
 * engine does model of the rest: the item an item *reaction* (Auto-Med, Auto-Potion, Auto-Phoenix) paid for when its record was queued is not paid again
 * (`FFXRuntime.prepaidItem`), and an Auto-Phoenix whose rescuer cannot act has its Phoenix Down refunded (`engine-end.ts`). Not modelled: the refund of an action
 * that is dropped at the range check (the engine's players cannot aim an item out of reach), and the loss of a queued item when its user dies first (no engine
 * action waits in a queue except the reactions, which `adapt/reactions.ts` already handles).
 *
 * **Gil** (the Spare Change offer, 0x007859a0): the action runs with the full amount offered, and the pay refuses (gil unchanged) when the amount exceeds the gil the party
 * holds, instead of cutting the amount (FFX-G05 section 3.8; the cut belongs to Copycat's repeat only).
 */

import type { AbilityDef, Command, FFXCombatant } from '../common/types.ts';
import type { ResolveOptions } from './abilities.ts';
import { type Ctx, spendItem } from './state.ts';
import { payGil } from './kernel/gil.ts';

type ItemCommand = Extract<Command, { kind: 'item' }>;
/** What paying for an item command left: the ability and options to resolve, or the result of a command that is refused. */
export type ItemPayment =
  | { ok: true; def: AbilityDef; options: ResolveOptions }
  | { ok: false; result: { rank: number; damageDealt: 0; rejected?: true } };

/**
 * Pay for `command` (spend its item once, take the Spare Change offer from the gil) and give the ability the item's own targeting and name. An aeon has no Item
 * command [ffx-combat-core §6.2] and is refused with the turn kept (PR-0155); an empty bag spends the turn with "No items left".
 */
export function payForItem(ctx: Ctx, actor: FFXCombatant, command: ItemCommand, def: AbilityDef, options: ResolveOptions): ItemPayment {
  if (actor.side === 'aeon') {
    ctx.emit({ type: 'message', text: `${actor.name} cannot use items`, kind: 'system' });
    return { ok: false, result: { rank: 0, rejected: true, damageDealt: 0 } };
  }
  // An item reaction (Auto-Med, Auto-Potion, Auto-Phoenix) was paid for when its record was queued (`adapt/reactions.ts`): that one use is not spent again.
  if (ctx.rt.prepaidItem === command.id) {
    ctx.rt.prepaidItem = undefined;
  } else if (!spendItem(ctx, command.id, actor)) {
    ctx.emit({ type: 'message', text: 'No items left', kind: 'system' });
    return { ok: false, result: { rank: 3, damageDealt: 0 } };
  }
  const item = ctx.content.item(command.id);
  const paid: AbilityDef = item ? { ...def, targeting: item.targeting, name: item.name, category: 'item' } : def;
  let next = options;
  if (command.gilSpent !== undefined) {
    next = { ...options, gilSpent: command.gilSpent };
    ctx.rt.gil = payGil(ctx.rt.gil, command.gilSpent).gil;
  }
  return { ok: true, def: paid, options: next };
}
