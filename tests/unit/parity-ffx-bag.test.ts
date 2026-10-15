/**
 * Parity tests for the FFX item bag, the deduct / refund routine and the gil helpers (`src/battle/ffx/kernel/bag.ts`, `deduct.ts`, `gil.ts`;
 * re-parity RC7, lane FFX-H).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the bag 0x00790550, the deduct and refund routine
 * 0x007b0c20, the gil pay 0x007859a0 and add 0x00784830; the private note `FFX-G05` sections 3.3, 3.4 and 3.8. The first blocks are hand-worked:
 * the arithmetic is in the comments. The last block of each section replays 300 vectors of the game's own machine code
 * (`tests/fixtures/parity/ffx/bag_change.json`, `deduct_refund.json`, `gil_pay_add.json`): every one is a run of the real function in an
 * x86-32 emulator, and the note's independent model agreed with it on all of them before the file was written.
 */

import { describe, expect, it } from 'vitest';
import { BAG_SLOTS, bagChange, cloneBag, newBag } from '../../src/battle/ffx/kernel/bag.ts';
import { chargeRecord, isMonsterUser } from '../../src/battle/ffx/kernel/deduct.ts';
import { GIL_ADD_CAP, addGil, payGil } from '../../src/battle/ffx/kernel/gil.ts';
import { type SparseSlots, bagOfSlots, slotsOfBag } from './helpers/ffxBagFixture.ts';
import { loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

const POTION = 0x2000;
const HI_POTION = 0x2001;

function bagWith(...stacks: Array<[number, number]>): ReturnType<typeof newBag> {
  const bag = newBag();
  stacks.forEach(([id, count], slot) => {
    bag.ids[slot] = id;
    bag.counts[slot] = count;
  });
  return bag;
}

describe('the bag (0x00790550)', () => {
  it('refuses anything that is not an item id or a zero change, and changes nothing', () => {
    const bag = bagWith([POTION, 5]);
    // item ids are 0x2000 to 0x2fff: the top 20 bits must be 0x00002
    for (const item of [0x1fff, 0x3000, 0x3001, 0, 0xff, 0x12000, 0x80002000]) expect(bagChange(bag, item, 1)).toBe(-1);
    expect(bagChange(bag, POTION, 0)).toBe(-1);
    expect(bag.counts[0]).toBe(5);
    expect(slotsOfBag(bag)).toEqual([[0, POTION, 5]]);
  });

  it('adds to an existing stack and cuts the sum at 99: 98 + 5 = 99, the excess is lost and no second stack opens', () => {
    const bag = bagWith([POTION, 98]);
    expect(bagChange(bag, POTION, 5)).toBe(0);
    expect(bag.counts[0]).toBe(99);
    expect(slotsOfBag(bag)).toEqual([[0, POTION, 99]]);
    // a stack of 99 takes nothing more, and the call still returns 0 (the count did not change: no bit either)
    const full = bagWith([POTION, 99]);
    full.obtained.fill(0);
    expect(bagChange(full, POTION, 1)).toBe(0);
    expect(full.counts[0]).toBe(99);
    expect(full.obtained.every((w) => w === 0)).toBe(true);
  });

  it('refuses a removal larger than the stack whole, and empties a stack exactly spent (its id becomes 0xff)', () => {
    const bag = bagWith([POTION, 3]);
    expect(bagChange(bag, POTION, -4)).toBe(-1);
    expect(bag.counts[0]).toBe(3);
    expect(bagChange(bag, POTION, -3)).toBe(0);
    expect(bag.counts[0]).toBe(0);
    expect(bag.ids[0]).toBe(0xff);
    // the emptied slot is free again: the next gain of anything lands there (slot 0, the first free)
    expect(bagChange(bag, HI_POTION, 2)).toBe(0);
    expect(slotsOfBag(bag)).toEqual([[0, HI_POTION, 2]]);
  });

  it('a new stack takes the first free slot (id 0 or count 0), the delta cut to 99, and sets no bit', () => {
    const bag = bagWith([POTION, 4], [HI_POTION, 0], [0x2002, 7]);
    expect(bagChange(bag, 0x2003, 250)).toBe(0); // 250 cut to 99, into slot 1 (a slot holding an id with count 0 is free)
    expect(slotsOfBag(bag)).toEqual([[0, POTION, 4], [1, 0x2003, 99], [2, 0x2002, 7]]);
    expect(bag.obtained.every((w) => w === 0)).toBe(true);
  });

  it('a slot under the id 0 is free whatever its count, a slot under 0xff with a count is not: a new stack takes the first of the free ones', () => {
    const bag = newBag();
    bag.ids[0] = 0xff; // a count under the "emptied" id: occupied, matches nothing
    bag.counts[0] = 7;
    bag.ids[1] = 0; // a count under the id 0: free to the game
    bag.counts[1] = 7;
    bag.ids[2] = 0x2002;
    bag.counts[2] = 4;
    expect(bagChange(bag, POTION, 3)).toBe(0);
    expect(slotsOfBag(bag)).toEqual([[0, 0xff, 7], [1, POTION, 3], [2, 0x2002, 4]]);
  });

  it('a full bag (112 stacks) refuses a new item, and a removal of an item it does not hold is refused', () => {
    const bag = newBag();
    for (let i = 0; i < BAG_SLOTS; i++) {
      bag.ids[i] = 0x2000 + i;
      bag.counts[i] = 1;
    }
    expect(bagChange(bag, 0x2070, 1)).toBe(-1);
    expect(bagChange(bag, 0x2070, -1)).toBe(-1);
    expect(bagChange(bag, 0x2000, 1)).toBe(0); // an item it holds still takes more
  });

  it('sets bit (id and 0xfff) of the obtained array for a gain and of the lost array for a loss, only when the count changed', () => {
    const bag = bagWith([0x2013, 5]);
    expect(bagChange(bag, 0x2013, 1)).toBe(0); // index 0x13: word 1, bit 3
    expect(bag.obtained[1]).toBe(1 << 3);
    expect(bagChange(bag, 0x2013, -2)).toBe(0);
    expect(bag.lost[1]).toBe(1 << 3);
    expect(bag.obtained.reduce((a, b) => a + b, 0)).toBe(1 << 3);
  });

  it('adds with a 32-bit wrapping sum: a huge gain onto a stack wraps negative and is cut to 0, not to 99', () => {
    const bag = bagWith([POTION, 50]);
    // 50 + 0x7fffffff wraps to a negative 32-bit value, which the clamp takes to 0
    expect(bagChange(bag, POTION, 0x7fffffff)).toBe(0);
    expect(bag.counts[0]).toBe(0);
    expect(bag.ids[0]).toBe(0xff);
  });

  it('replays 300 vectors of the real function (stacks, caps, refusals, emptied slots, full bags, non-items, both bit arrays)', () => {
    const fx = loadFfxParityFixture('bag_change');
    expect(fx).not.toBeNull();
    expect(fx!.vectors.length).toBe(300);
    for (const v of fx!.vectors) {
      const i = v.in as { bag: SparseSlots; obtained: number[]; lost: number[]; item: number; delta: number };
      const o = v.out as { ret: number; bag: SparseSlots; obtained: number[]; lost: number[] };
      const bag = bagOfSlots(i.bag, i.obtained, i.lost);
      const ret = bagChange(bag, i.item, i.delta);
      const why = `vector ${v.id} (${v.class}, item ${i.item}, delta ${i.delta})`;
      expect(ret, why).toBe(o.ret);
      expect(slotsOfBag(bag), why).toEqual(o.bag);
      expect(bag.obtained, why).toEqual(o.obtained);
      expect(bag.lost, why).toEqual(o.lost);
    }
  });

  it('cloneBag is independent of the original', () => {
    const bag = bagWith([POTION, 5]);
    const copy = cloneBag(bag);
    bagChange(copy, POTION, -5);
    expect(bag.counts[0]).toBe(5);
    expect(copy.counts[0]).toBe(0);
  });
});

describe('deduct and refund (0x007b0c20)', () => {
  it('a party user pays one of the item when the action is queued (-1) and gets it back when the action does not go through (+1)', () => {
    const bag = bagWith([POTION, 5]);
    expect(chargeRecord(0, [POTION], -1, bag)).toBe(0);
    expect(bag.counts[0]).toBe(4);
    expect(chargeRecord(0, [POTION], 1, bag)).toBe(0);
    expect(bag.counts[0]).toBe(5);
  });

  it('monsters never touch the bag: chr indices 0x14 to 0x1b are exempt; 0x13, 0x1c and an aeon (8) are charged', () => {
    for (const user of [0x14, 0x15, 0x1b]) {
      const bag = bagWith([POTION, 5]);
      expect(chargeRecord(user, [POTION], -1, bag)).toBe(0);
      expect(bag.counts[0], `user ${user}`).toBe(5);
    }
    for (const user of [0x13, 0x1c, 8, 0]) {
      const bag = bagWith([POTION, 5]);
      chargeRecord(user, [POTION], -1, bag);
      expect(bag.counts[0], `user ${user}`).toBe(4);
    }
    expect(isMonsterUser(0x14)).toBe(true);
    expect(isMonsterUser(0x1b)).toBe(true);
    expect(isMonsterUser(0x1c)).toBe(false);
    expect(isMonsterUser(0x114)).toBe(true); // only the low byte is read
  });

  it('with stock 0 a deduction fails (-1) and changes nothing, while a refund still creates a stack of 1 (it is not matched to a deduction)', () => {
    const bag = newBag();
    expect(chargeRecord(0, [POTION], -1, bag)).toBe(-1);
    expect(slotsOfBag(bag)).toEqual([]);
    expect(chargeRecord(0, [POTION], 1, bag)).toBe(0);
    expect(slotsOfBag(bag)).toEqual([[0, POTION, 1]]);
  });

  it('a refund into a stack of 99 is lost: 99 stays 99', () => {
    const bag = bagWith([POTION, 99]);
    expect(chargeRecord(0, [POTION], 1, bag)).toBe(0);
    expect(bag.counts[0]).toBe(99);
  });

  it('a Mix in a slot stops the walk: a Mix first deducts nothing, a Mix after an item pays that item only', () => {
    const bag = bagWith([POTION, 5], [HI_POTION, 5]);
    expect(chargeRecord(0, [0x311e, POTION], -1, bag)).toBe(0);
    expect(bag.counts).toEqual([5, 5, ...new Array<number>(BAG_SLOTS - 2).fill(0)]);
    expect(chargeRecord(0, [POTION, 0x311e, HI_POTION], -1, bag)).toBe(0);
    expect(bag.counts[0]).toBe(4);
    expect(bag.counts[1]).toBe(5);
  });

  it('a record with two item slots pays both, and the total counts the failures', () => {
    const bag = bagWith([POTION, 1]);
    expect(chargeRecord(0, [POTION, HI_POTION], -1, bag)).toBe(-1); // Potion paid, Hi-Potion short
    expect(bag.counts[0]).toBe(0);
    expect(chargeRecord(0, [], -1, bag)).toBe(0); // no slots
  });

  it('replays 300 vectors of the real function (party, aeon and monster users, deduct and refund, Mix records, short stock)', () => {
    const fx = loadFfxParityFixture('deduct_refund');
    expect(fx).not.toBeNull();
    expect(fx!.vectors.length).toBe(300);
    for (const v of fx!.vectors) {
      const i = v.in as { user: number; delta: number; effective: number[]; bag: SparseSlots; obtained: number[]; lost: number[] };
      const o = v.out as { ret: number; bag: SparseSlots; obtained: number[]; lost: number[] };
      const bag = bagOfSlots(i.bag, i.obtained, i.lost);
      const ret = chargeRecord(i.user, i.effective, i.delta, bag);
      const why = `vector ${v.id} (${v.class}, user ${i.user}, delta ${i.delta}, slots ${i.effective.map((e) => e.toString(16)).join(',')})`;
      expect(ret, why).toBe(o.ret);
      expect(slotsOfBag(bag), why).toEqual(o.bag);
      expect(bag.obtained, why).toEqual(o.obtained);
      expect(bag.lost, why).toEqual(o.lost);
    }
  });
});

describe('gil (0x007859a0 pay, 0x00784830 add)', () => {
  it('pays when the gil covers the amount; otherwise pays nothing and says -1 (the action still runs, unpaid)', () => {
    expect(payGil(1000, 300)).toEqual({ gil: 700, ret: 0 });
    expect(payGil(300, 300)).toEqual({ gil: 0, ret: 0 });
    expect(payGil(299, 300)).toEqual({ gil: 299, ret: -1 });
  });

  it('the add caps at 999,999,899 and the pay clamps at 999,999,999 (the exe\'s 100-gil gap)', () => {
    expect(addGil(999_999_800, 500)).toBe(GIL_ADD_CAP);
    expect(addGil(1000, 500)).toBe(1500);
    expect(payGil(999_999_999, 0).gil).toBe(999_999_999);
  });

  it('replays 300 vectors of the real functions', () => {
    const fx = loadFfxParityFixture('gil_pay_add');
    expect(fx).not.toBeNull();
    expect(fx!.vectors.length).toBe(300);
    for (const v of fx!.vectors) {
      const i = v.in as { gil: number; amount: number };
      const o = v.out as { afterPay: number; payRet: number; afterAdd: number };
      const pay = payGil(i.gil, i.amount);
      const why = `vector ${v.id} (${v.class}, gil ${i.gil}, amount ${i.amount})`;
      expect(pay.gil, why).toBe(o.afterPay);
      expect(pay.ret, why).toBe(o.payRet);
      expect(addGil(i.gil, i.amount), why).toBe(o.afterAdd);
    }
  });
});
