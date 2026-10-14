/**
 * The engine's item bag as the game's bag (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * The engine keeps its stock as `FFXRuntime.inventory`, a map of item id to count (and mirrors each change into `state.flags['inventory:<id>']`
 * so a chain carries it). The game keeps 112 slots of a 16-bit id and a count 0 to 99, and every change goes through one function
 * (`kernel/bag.ts`, FFX.exe 0x00790550). This module is the one place the two meet: {@link bagOfStock} lays the map out as the game's slots,
 * {@link stockAfter} runs the kernel on it and says what the item's stack came to, and {@link changeStock} writes that back. So the 99 cap, the
 * refusal of a removal larger than the stack and the full bag are the kernel's, wherever the engine adds or takes items: an item use, a refund,
 * a steal, the starting bag.
 *
 * An item id with no number (the chart's 112 items are the game's whole item table; an id outside it is a test rig's) goes through the same kernel as the
 * one stack of a bag of its own, so the arithmetic is the same and only the slot count does not bind it.
 */

import { BAG_SLOTS, type BagState, bagChange, newBag } from '../kernel/bag.ts';
import { chargeRecord } from '../kernel/deduct.ts';
import { mixItemNumber } from '../kernel/mix.ts';
import type { FFXCombatant } from '../../common/types.ts';
import { actorNumber } from '../ai/script-random.ts';
import type { Ctx } from '../state.ts';

/** The number the kernel uses for an id the game has no item for (an item id the bit arrays do not reach, so no bit is set). */
const FOREIGN_NUMBER = 0x2fff;

/** The game's item number (0x2000 + index) of our item id, or `undefined` for an id the game's table does not have. */
export function itemNumber(id: string): number | undefined {
  return mixItemNumber(id);
}

/** The count a bag holds of an item number: the first non-empty stack with its id. */
export function countOf(bag: BagState, number: number): number {
  for (let i = 0; i < BAG_SLOTS; i++) {
    if (bag.ids[i] === number && (bag.counts[i] as number) > 0) return bag.counts[i] as number;
  }
  return 0;
}

/**
 * The engine's stock as the game's slots, in the order the map holds its stacks. Empty stacks and ids with no number are left out (an empty
 * slot is a free slot).
 */
export function bagOfStock(stock: ReadonlyMap<string, number>): BagState {
  const bag = newBag();
  let slot = 0;
  for (const [id, count] of stock) {
    const number = itemNumber(id);
    if (number === undefined || count <= 0 || slot >= BAG_SLOTS) continue;
    bag.ids[slot] = number;
    bag.counts[slot] = count;
    slot += 1;
  }
  return bag;
}

/** What a change did to one item's stack: the kernel's return code and the count the stack came to. */
export interface StockChange {
  ret: 0 | -1;
  count: number;
}

/**
 * Run the kernel's change of `delta` copies of `id` on the stock without writing anything back. With a `user` (the game's chr index of whoever the item
 * is charged to) the change is the deduct and refund routine's (`kernel/deduct.ts`: a monster, chr index 0x14 to 0x1b, never touches the bag); without
 * one it is the bag function itself (a steal, the starting bag).
 */
export function stockAfter(stock: ReadonlyMap<string, number>, id: string, delta: number, user?: number): StockChange {
  const known = itemNumber(id);
  const number = known ?? FOREIGN_NUMBER;
  let bag: BagState;
  if (known === undefined) {
    bag = newBag();
    bag.ids[0] = FOREIGN_NUMBER;
    bag.counts[0] = Math.max(0, stock.get(id) ?? 0);
  } else {
    bag = bagOfStock(stock);
  }
  const ret = user === undefined ? bagChange(bag, number, delta) : chargeRecord(user, [number], delta, bag) === 0 ? 0 : -1;
  return { ret, count: countOf(bag, number) };
}

/**
 * Change one item's stock through the kernel and mirror the new count into `state.flags`. Returns the kernel's code: 0 when the bag changed (a gain
 * above 99 is cut off), -1 when it did not (a removal larger than the stack, a gain with no free slot). A refund of an item the party has none of
 * makes a stack of one: the game's refund is not matched to a deduction that really happened. With a `user` the change is charged to it as the game charges
 * (a monster pays and gets back nothing).
 */
export function changeStock(ctx: Pick<Ctx, 'rt' | 'state'>, id: string, delta: number, user?: FFXCombatant): 0 | -1 {
  const { ret, count } = stockAfter(ctx.rt.inventory, id, delta, user === undefined ? undefined : actorNumber(ctx, user));
  if (ret === 0) {
    ctx.rt.inventory.set(id, count);
    ctx.state.flags[`inventory:${id}`] = count;
  }
  return ret;
}

/** Put the counts the kernel left for these items back into the engine's stock (after a resolver that changed a bag it was handed). */
export function writeBack(ctx: Pick<Ctx, 'rt' | 'state'>, bag: BagState, ids: readonly string[]): void {
  for (const id of ids) {
    const number = itemNumber(id);
    if (number === undefined) continue;
    const count = countOf(bag, number);
    ctx.rt.inventory.set(id, count);
    ctx.state.flags[`inventory:${id}`] = count;
  }
}
