/**
 * Deducting and refunding an action's items (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * Source: the private note FFX-G05 section 3.4, `pp_BtlItemCharge` at FFX.exe 0x007b0c20 (Steam build 25501027, SHA-256 0537B2A1...686D),
 * run as the real machine code on 60,016 inputs against an independent model, 0 mismatches (`tests/fixtures/parity/ffx/deduct_refund.json`
 * replays 300, `tests/unit/parity-ffx-bag.test.ts`). The queue calls it with delta -1 when an action is queued; the executor calls it with +1
 * when the action does not go through. For each slot of the record, in order:
 *
 * 1. a slot whose effective command is **Mix** (0x311e) **stops** the walk and the running total is returned (nothing after it is touched; for a Mix in
 *    slot 0 nothing is deducted at all: a Mix pays its ingredients in the resolver, `./mix.ts`);
 * 2. a slot whose effective command is an item (0x2000 to 0x2fff) **and whose user is not a monster** (chr index 0x14 to 0x1b) goes through the bag
 *    ({@link bagChange}) and its result (0 or -1) is added to the total;
 * 3. the total is returned: 0 when every change succeeded, minus the number that failed.
 *
 * Consequences the vectors show: a monster user never touches the bag; stock 0 makes a deduction fail (-1) while **a refund still creates a stack of 1**
 * (a refund is not matched to a deduction that really happened); a refund into a stack of 99 is lost.
 *
 * The effective command of a slot (`pp_BtlGetCommandRec`, 0x0078ce50) is the caller's: the engine's item use is always the pair {Item command,
 * item id}, whose effective command is the item. The routine's category-command rule for a record with two item slots or a later category field is
 * decompiled and not needed by any record the engine builds.
 */

import { type BagState, bagChange } from './bag.ts';

/** The Mix command: the walk stops at it. */
export const MIX_COMMAND = 0x311e;
/** The first chr index of the monsters; the game has eight monster indices, 0x14 to 0x1b. */
export const MONSTER_USER_FIRST = 0x14;
const MONSTER_USER_COUNT = 8;

/** Is this chr index a monster (the bag is never charged for one)? Compared as the exe does: (index and 0xff) - 0x14 below 8, unsigned. */
export function isMonsterUser(user: number): boolean {
  return (((user & 0xff) - MONSTER_USER_FIRST) >>> 0) < MONSTER_USER_COUNT;
}

/**
 * `pp_BtlItemCharge(user, record, delta)` (0x007b0c20) over the effective command id of each slot of the record. Returns the running total: 0 when
 * every change went through, otherwise minus the number of changes the bag refused. An empty record returns 0.
 */
export function chargeRecord(user: number, effective: readonly number[], delta: number, bag: BagState): number {
  let total = 0;
  for (const id of effective) {
    if (id === MIX_COMMAND) return total;
    if ((((id >>> 0) & 0xfffff000) >>> 0) === 0x2000 && !isMonsterUser(user)) total += bagChange(bag, id, delta);
  }
  return total;
}
