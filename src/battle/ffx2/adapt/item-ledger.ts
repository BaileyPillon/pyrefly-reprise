/**
 * The engine's party stock as the item ledger kernel's stock (re-parity RC8, lane X2-F, row XF1; **FFX-2 only**).
 *
 * The engine keeps the party's items as `state.flags['inventory:<itemId>']` (the convention `setup.ts` seeds, `steal.ts` adds to and the app's chain carries between
 * links). The game keeps 68 slots of an id and a count and every change goes through `kernel/item-ledger.ts`. This module is the one place the two meet, so the
 * rules are the kernel's wherever the engine reserves, commits or refunds an item.
 *
 * - **Reserve** when a command is picked (before its charge begins): one item leaves the stock and the unit holds it ({@link ItemHold}). The menus read the stock, so
 *   they show the lower count at once and a second girl cannot take the last one.
 * - **Commit** when the cast fires (the game's start gate, the only commit): the hold is dropped and the item stays spent.
 * - **Refund** when a cast leaves the queue without firing (a KO, Stop, Petrify, ejection or dress change drops it, a magic cancel aborts it, the battle ends): the item
 *   goes back, capped at 99. {@link releaseItemHolds} does it for every hold whose cast is gone, so no cancel path has to know about the stock.
 *
 * - **A Mix reserves two** (re-parity RC9, lane X2-G): the game's HUD packet reserves each of the two ingredients into the record's two id slots, so the hold carries a second id
 *   ({@link ItemHold.itemId2}) and every way out of the queue gives both back. The same item twice needs two in stock; one short, the gate would fail and the removal would refund the other.
 *
 * **Monsters never reserve** (the kernel: a character slot of 0x0f to 0x1e), so a monster's item command touches nothing. **An item the battle does not track**
 * (no `inventory:` flag: a test rig, a script) is used freely, as before the ledger. The table the kernel sees holds the one stack being changed: the kernel's
 * functions never look at another slot but to find a free one, and the stack's own emptied slot is always free, so a one-stack table answers as the whole table would.
 */

import type { Ffx2Unit } from '../internal.ts';
import { emptyWorld, newRecord, refund, reserve, startGate, STOCK_SLOTS, stockCount, type StockWorld } from '../kernel/item-ledger.ts';

/** What a unit holds while an item command of hers is in flight: the item and the kernel record's counters. */
export interface ItemHold {
  itemId: string;
  /** The record's items reserved (+0x8e) and needed (+0x8f). */
  got: number;
  needed: number;
  /** A Mix's second ingredient (the record's second id slot, +0x92); absent for every command that holds one item. */
  itemId2?: string;
}

/** The item ids a hold gives back, in slot order. */
const heldIds = (hold: ItemHold): string[] => (hold.itemId2 === undefined ? [hold.itemId] : [hold.itemId, hold.itemId2]);

/** The item number the one-stack table gives the item (an item id: nibble 2). */
const NUMBER = 0x2000;

type Flags = Record<string, unknown>;

const keyOf = (itemId: string): string => `inventory:${itemId}`;

/** The battle's count of an item when it tracks it, else `undefined` (the item is then used freely). */
export function trackedStock(flags: Readonly<Flags>, itemId: string): number | undefined {
  const v = flags[keyOf(itemId)];
  return typeof v === 'number' ? v : undefined;
}

/** Can this item be picked now? True for an item the battle does not track; else the kernel's count must reach `need` (1 for one pick; 2 for a Mix of the same item twice). */
export function itemAvailable(flags: Readonly<Flags>, itemId: string, need = 1): boolean {
  const have = trackedStock(flags, itemId);
  return have === undefined || stockOf(have, (w) => stockCount(w, NUMBER)) >= need;
}

/** Can the party's stock make a Mix of these two ingredients? Each tracked one must be there; the same item twice needs two. */
export function ingredientsAvailable(flags: Readonly<Flags>, ingredients: readonly [string, string]): boolean {
  const [a, b] = ingredients;
  return itemAvailable(flags, a, a === b ? 2 : 1) && itemAvailable(flags, b, a === b ? 2 : 1);
}

/** Run `fn` on a one-stack table holding `count` of the item and return its answer. */
function stockOf<T>(count: number, fn: (w: StockWorld) => T): T {
  const w = emptyWorld();
  w.ids[0] = count > 0 ? NUMBER : 0;
  w.counts[0] = Math.max(0, Math.min(count, 255));
  return fn(w);
}

/** The count the stack came to: the first slot with the item and a count, else 0. */
function countOf(w: StockWorld): number {
  for (let k = 0; k < STOCK_SLOTS; k++) if (w.ids[k] === NUMBER && (w.counts[k] as number) > 0) return w.counts[k] as number;
  return 0;
}

/** Hold-free form of a stack change: build the table, run the kernel, write the count back. */
function change(flags: Flags, itemId: string, fn: (w: StockWorld) => void): void {
  const have = trackedStock(flags, itemId);
  if (have === undefined) return;
  const w = emptyWorld();
  w.ids[0] = have > 0 ? NUMBER : 0;
  w.counts[0] = Math.max(0, Math.min(have, 255));
  fn(w);
  flags[keyOf(itemId)] = countOf(w);
}

/**
 * Reserve one item for `unit`'s command (the queue add). Returns `true` when the command may go on: the item is reserved and the unit holds it, or the item is not
 * tracked, or the unit is a monster. Returns `false` when the stock had none (the game's gate would fail and the record would be removed with nothing to refund).
 */
export function reserveItem(flags: Flags, unit: Ffx2Unit, itemId: string): boolean {
  if (trackedStock(flags, itemId) === undefined) return true;
  if (unit.itemHold !== undefined) return true; // the pick is already reserved (a re-submitted command)
  let ok = true;
  change(flags, itemId, (w) => {
    const rec = newRecord(NUMBER);
    reserve(w, rec, unit.gauge.slot, NUMBER);
    if (rec.needed === 0) return; // a monster: nothing is taken, nothing is held
    ok = rec.got >= rec.needed;
    if (ok) unit.itemHold = { itemId, got: rec.got, needed: rec.needed };
  });
  return ok;
}

/**
 * Reserve a Mix's two ingredients for `unit`'s command (the HUD packet reserves each into the record's two id slots, FFX2-G06 3.8). Returns `true` when the command may go on: both
 * tracked ingredients are reserved and the unit holds them, or nothing is tracked, or the unit is a monster, or the pick is already reserved (a re-submitted command). Returns `false`
 * when the stock was short for either: what the first reserve took is given back at once (the gate would fail and the removal would refund it) and nothing is held.
 */
export function reserveIngredients(flags: Flags, unit: Ffx2Unit, ingredients: readonly [string, string]): boolean {
  if (unit.itemHold !== undefined) return true;
  const rec = newRecord(NUMBER);
  const taken: string[] = [];
  for (const itemId of ingredients) {
    if (trackedStock(flags, itemId) === undefined) continue; // the battle does not track it: free, as before the ledger
    change(flags, itemId, (w) => {
      const before = rec.got;
      reserve(w, rec, unit.gauge.slot, NUMBER);
      if (rec.got > before) taken.push(itemId);
    });
  }
  if (rec.needed === 0) return true; // a monster, or nothing tracked: nothing is taken, nothing is held
  if (rec.got < rec.needed) {
    for (const itemId of taken) change(flags, itemId, (w) => refund(w, newRecord(NUMBER, { got: 1, needed: 1, ids: [NUMBER, 0] }), 1));
    return false;
  }
  const [first, second] = taken as [string, string | undefined];
  unit.itemHold = { itemId: first, got: rec.got, needed: rec.needed, ...(second !== undefined ? { itemId2: second } : {}) };
  return true;
}

/**
 * The start gate for a cast that has fired (the commit): passes when the reservation is whole, keeps the item spent and drops the hold. Returns `false` when the
 * hold is short or its owner is dead (the gate fails and the removal refunds what the hold has). A unit with no hold passes: an untracked item, or a monster.
 */
export function commitItem(flags: Flags, unit: Ffx2Unit): boolean {
  const hold = unit.itemHold;
  if (hold === undefined) return true;
  const w = emptyWorld();
  const rec = newRecord(NUMBER, { got: hold.got, needed: hold.needed, ids: [NUMBER, hold.itemId2 === undefined ? 0 : NUMBER] });
  const passed = startGate(w, rec, { dead: !unit.alive, targetsOk: true, cost: 0 });
  delete unit.itemHold;
  if (!passed) for (const itemId of heldIds(hold)) change(flags, itemId, (stack) => refund(stack, newRecord(NUMBER, { got: 1, needed: 1, ids: [NUMBER, 0] }), 1));
  return passed;
}

/** Give a hold's item back (cap 99) and drop the hold: the record left the queue unspent. */
export function refundItem(flags: Flags, unit: Ffx2Unit): void {
  const hold = unit.itemHold;
  if (hold === undefined) return;
  delete unit.itemHold;
  for (const itemId of heldIds(hold)) {
    change(flags, itemId, (w) => {
      const rec = newRecord(NUMBER, { got: hold.got, needed: hold.needed, ids: [hold.got > 0 ? NUMBER : 0, 0] });
      refund(w, rec, 1);
    });
  }
}

/**
 * The sweep: every unit that holds an item for a cast that is no longer in flight (the charge was dropped, cancelled or interrupted) gets it back. Called after a
 * logic step and after an action, so a KO, Stop, Petrify, ejection, dress change or magic cancel needs no refund of its own, and at the battle's end.
 */
export function releaseItemHolds(units: readonly Ffx2Unit[], flags: Flags): void {
  for (const u of units) if (u.itemHold !== undefined && u.atb.charging === null) refundItem(flags, u);
}
