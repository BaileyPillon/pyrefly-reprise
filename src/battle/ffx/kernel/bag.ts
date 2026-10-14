/**
 * The item bag: 112 stacks of 0 to 99 (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * Source: the private note FFX-G05 section 3.3, the function `pp_BtlInventoryChange` at FFX.exe 0x00790550 (Steam build 25501027,
 * SHA-256 0537B2A1...686D), run as the real machine code in an x86-32 emulator on 60,000 inputs against an independent model, 0 mismatches
 * (`tests/fixtures/parity/ffx/bag_change.json` replays 300 of them, `tests/unit/parity-ffx-bag.test.ts`). Pure and deterministic; it draws
 * nothing. Thirteen callers use it in the game: the Mix resolver, the deduct and refund routine, steals, the Atel `giveItem` call, and the
 * menu, shop and reward code, so the 99 cap and the 112 stacks bind steals and rewards as well.
 *
 * - **Accepted**: an id whose top 20 bits are 0x00002 (0x2000 to 0x2fff) and a delta other than 0. Anything else returns -1 and changes nothing.
 * - **Existing stack**: the first slot whose id is the item and whose count is not 0. A removal larger than the stack is refused whole (-1, the scan
 *   moves on and merges nothing). Otherwise the new count is count plus delta (32-bit wrapping sum) cut to 0 to 99: a gain above 99 is cut off and
 *   the excess is lost; it never opens a second stack. A changed count sets bit (id and 0xfff) of the "obtained" bit array for a gain, of the
 *   "lost" one for a loss. A stack that reaches 0 has its slot id set to 0xff.
 * - **New stack**: with no matching non-empty stack a positive delta goes into the first free slot (id 0 or count 0, scanning from slot 0): the
 *   slot takes the id and the delta cut to 0 to 99; no bit is set on this path. With no free slot the result is -1 (a full bag refuses a new item).
 *
 * The game's bit setter has no bounds check: an item id from 0x2100 up would write past the 16-word array (no such item exists). This port
 * ignores such a bit, which no real item can reach.
 */

/** The number of stacks the bag holds. */
export const BAG_SLOTS = 112;
/** The most one stack holds. */
export const BAG_STACK_MAX = 99;
/** The id an emptied slot carries. */
export const BAG_EMPTY_ID = 0xff;

/** The bag as the game keeps it: a 16-bit id and a count for each of 112 slots, and the two 16-word bit arrays. */
export interface BagState {
  ids: number[];
  counts: number[];
  /** Bit (id and 0xfff) set when a stack of the item grew. */
  obtained: number[];
  /** The same for a stack that shrank. */
  lost: number[];
}

/** An empty bag: every slot id 0xff with count 0, no bit set. */
export function newBag(): BagState {
  return {
    ids: new Array<number>(BAG_SLOTS).fill(BAG_EMPTY_ID),
    counts: new Array<number>(BAG_SLOTS).fill(0),
    obtained: new Array<number>(16).fill(0),
    lost: new Array<number>(16).fill(0),
  };
}

/** A copy of a bag, so a caller can try a change and keep the original. */
export function cloneBag(bag: BagState): BagState {
  return { ids: bag.ids.slice(), counts: bag.counts.slice(), obtained: bag.obtained.slice(), lost: bag.lost.slice() };
}

function setBit(words: number[], item: number): void {
  const index = (item & 0xfff) >> 4;
  if (index >= words.length) return; // the game writes past its array here; no real item has such an id
  words[index] = ((words[index] as number) | (1 << (item & 0xf))) & 0xffff;
}

/**
 * `pp_BtlInventoryChange(item, delta)` (0x00790550): add (`delta` > 0) or remove (`delta` < 0) copies of `item`. Returns 0 when the bag changed
 * and -1 when it did not. `item` is the 32-bit value the exe is called with.
 */
export function bagChange(bag: BagState, item: number, delta: number): 0 | -1 {
  if ((((item >>> 0) & 0xfffff000) >>> 0) !== 0x2000 || delta === 0) return -1;
  let free = -1;
  for (let i = 0; i < BAG_SLOTS; i++) {
    const count = bag.counts[i] as number;
    if ((item >>> 0) === bag.ids[i] && count !== 0 && (delta >= 0 || count + delta >= 0)) {
      const next = Math.max(0, Math.min(BAG_STACK_MAX, (count + delta) | 0));
      bag.counts[i] = next;
      if (next !== count) setBit(delta > 0 ? bag.obtained : bag.lost, item);
      if (next === 0) bag.ids[i] = BAG_EMPTY_ID;
      return 0;
    }
    if (free < 0 && (bag.ids[i] === 0 || count === 0)) free = i;
  }
  if (free >= 0 && delta > 0) {
    bag.ids[free] = (item >>> 0) & 0xffff;
    bag.counts[free] = Math.max(0, Math.min(BAG_STACK_MAX, delta));
    return 0;
  }
  return -1;
}
