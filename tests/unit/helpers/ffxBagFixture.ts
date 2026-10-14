/**
 * Sparse bags in the RC7 vector files (`bag_change.json`, `mix_resolver.json`, `deduct_refund.json`): a bag is the list of its slots that are not
 * the default empty slot (id 0xff, count 0), each as `[slot, id, count]`. These helpers expand a list into a {@link BagState} and back.
 */

import { BAG_EMPTY_ID, BAG_SLOTS, type BagState, newBag } from '../../../src/battle/ffx/kernel/bag.ts';

export type SparseSlots = ReadonlyArray<readonly [number, number, number]>;

/** The bag a vector's slot list stands for, with the two bit arrays. */
export function bagOfSlots(slots: SparseSlots, obtained: readonly number[] = [], lost: readonly number[] = []): BagState {
  const bag = newBag();
  for (const [slot, id, count] of slots) {
    bag.ids[slot] = id;
    bag.counts[slot] = count;
  }
  for (let i = 0; i < obtained.length; i++) bag.obtained[i] = obtained[i] as number;
  for (let i = 0; i < lost.length; i++) bag.lost[i] = lost[i] as number;
  return bag;
}

/** A bag as its non-default slots. */
export function slotsOfBag(bag: BagState): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < BAG_SLOTS; i++) {
    if (bag.ids[i] !== BAG_EMPTY_ID || bag.counts[i] !== 0) out.push([i, bag.ids[i] as number, bag.counts[i] as number]);
  }
  return out;
}
