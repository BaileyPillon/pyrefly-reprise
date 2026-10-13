/**
 * Rikku's Mix: the chart lookup and the resolver (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * Source: the private note FFX-G05 sections 3.1 and 3.2, the resolver `pp_BtlMixResolve` at FFX.exe 0x007b0520 (Steam build 25501027,
 * SHA-256 0537B2A1...686D), run as the real machine code on 52,544 inputs against an independent model, 0 mismatches
 * (`tests/fixtures/parity/ffx/mix_resolver.json` replays 300 of them and the 12,544 ordered pairs, `tests/unit/parity-ffx-mix.test.ts`). The
 * target picker, the facing routine and the menu rebuilds are replaced by hooks in those runs, so the picker's own draws are the engine's
 * (`../mix.ts` runs the auto-target kernel for them).
 *
 * The resolver, once per Mix, in this order:
 *
 * 1. **Waiting.** While the table is loading (the loading flag) it returns 1 (try again next frame). Once the "resolved" flag is set it returns 0
 *    when the animation flag is clear and 1 otherwise, touching nothing else.
 * 2. **Ingredients.** It walks the record's slots (the slot count, two 16-bit fields each) in order; a field counts as an ingredient unless it is
 *    0xff, 0x311e (Mix) or 0x3001 (the Item command). Only the first two are kept.
 * 3. **Two ingredients.** One of each is deducted through the bag (the return values are ignored, so a missing stock is not noticed here: with one copy
 *    of a doubled item the Mix still resolves); the low 12 bits of both are sorted and the result command is the table cell for (larger, smaller).
 *    **One ingredient**: the ingredient itself becomes the "result" (one deduction): the record turns into a plain use of that item. **None**: 0xff.
 * 4. **Rewrite.** The slot count becomes 1, the first slot's first field is the result and its second 0xff.
 * 5. **Target.** The auto-target picker is called with the user, the result command, "the side from the command" (-1) and 1; its mask is the first
 *    slot's target mask. A mask of 0 returns 1; anything else returns 0.
 * 6. **Learn.** With a target found **and** two ingredients, the result is recorded as discovered: for a command id from 0x3060 up (every Mix result) bit
 *    (id - 0x60) and 15 of word ((id - 0x60) and 0xfff) >> 4 of the party-shared 16-word array. A command below 0x3060 would set a bit in the user's own
 *    6-word array; no Mix result is below it, so that branch is not modelled. What reads the bits is unread (note open question 5).
 * 7. **Finish.** The resolved flag is set.
 *
 * "Mix failed" is the case of a mask of 0 in step 5: both ingredients are already consumed (the deduction sits in step 3, before the target), so a Mix that finds
 * no target still costs them (note section 3.6, the executor's refund then finds only the result command in the record and returns nothing).
 */

import { type BagState, bagChange } from './bag.ts';
import { MIX_FIRST_RESULT, MIX_GROUP_OF_ITEM, MIX_GROUP_ROWS, MIX_ITEM_COUNT, MIX_RESULT_COUNT } from './mix-table.ts';

/** The Mix command: not an ingredient. */
export const MIX_COMMAND_ID = 0x311e;
/** The Item command: not an ingredient. */
export const ITEM_COMMAND_ID = 0x3001;
/** An empty field. */
export const NO_FIELD = 0xff;

/** The chart cell for a pair of item indices (the low 12 bits of the ids), larger first, exactly as the exe reads its table. */
function tableWord(hi: number, lo: number): number {
  if (hi <= MIX_ITEM_COUNT - 1) {
    const g = MIX_GROUP_OF_ITEM[hi] as number;
    const h = MIX_GROUP_OF_ITEM[lo] as number;
    // the cell is filled only for column <= row of the 112 x 112 table; (g, h) is the group pair of an item pair with lo <= hi
    const row = MIX_GROUP_ROWS[Math.max(g, h)] as readonly number[];
    return MIX_FIRST_RESULT + (row[Math.min(g, h)] as number);
  }
  // A row past the table falls back to row 0 and the column index runs on through the table's own words; past its end the bytes are 0.
  const flat = lo;
  if (flat >= MIX_ITEM_COUNT * MIX_ITEM_COUNT) return 0;
  const row = Math.floor(flat / MIX_ITEM_COUNT);
  const col = flat % MIX_ITEM_COUNT;
  return col <= row ? tableWord(row, col) : 0;
}

/**
 * The command id two ingredients make: the table cell in the row of the larger index and the column of the smaller, indices being the low 12 bits of
 * the item ids. For the 112 real items this is 0x308b to 0x30ca; an index past 111 (an id no item has) reads what the exe's table reads there.
 */
export function mixResultCommand(itemA: number, itemB: number): number {
  const a = itemA & 0xfff;
  const b = itemB & 0xfff;
  return tableWord(Math.max(a, b), Math.min(a, b));
}

/** The result ability id of a Mix result command (0x308b to 0x30ca), or `undefined` for any other value. */
export function mixCommandIndex(command: number): number | undefined {
  const n = command - MIX_FIRST_RESULT;
  return n >= 0 && n < MIX_RESULT_COUNT ? n : undefined;
}

/** What the resolver reads of the record, the flags and the bag. */
export interface MixResolveInput {
  /** The loading flag (`Chr+0xdfd`): the table is being read. */
  loading: boolean;
  /** The "resolved" flag (`Chr+0x717`). */
  resolved: boolean;
  /** The animation flag (`Chr+0x435`). */
  animating: boolean;
  /** The user's chr index. */
  user: number;
  /** The record's slot count. */
  slots: number;
  /** The record's 16-bit fields, two per slot, slot 0 first (fields past `2 * slots` are never read). */
  fields: readonly number[];
  /** The bag: one of each ingredient is deducted from it. */
  bag: BagState;
  /** The party-shared 16-word array of discovered Mix results. */
  shared: number[];
}

/** What the resolver leaves. */
export interface MixResolveOutput {
  /** 0: the record runs now; 1: wait (or no target found). */
  ret: 0 | 1;
  /** The record's slot count afterwards. */
  slots: number;
  /** The record's first field of the first slot afterwards (the result command, the ingredient, or 0xff), when the resolver rewrote the record. */
  field0: number | undefined;
  /** The first slot's second field afterwards. */
  field1: number | undefined;
  /** The first slot's target mask afterwards (the picker's answer), when the resolver reached the target step. */
  targetMask: number | undefined;
  /** The "resolved" flag afterwards. */
  resolved: boolean;
  /** The picker call the resolver made: the result command and the user, or `undefined` when it did not reach the target step. */
  pick: { user: number; command: number } | undefined;
  /** How many ingredients the record named (0, 1 or 2; more are ignored). */
  ingredients: number;
  /** Whether the result was recorded as discovered (a target found and two ingredients). */
  learned: boolean;
}

/**
 * `pp_BtlMixResolve(user, chr, record)` (0x007b0520). `pickTarget(command)` is the auto-target picker for the result command (side from the command,
 * count 1); it is called exactly once, after the ingredients are deducted, and returns the target mask. The bag and the shared array are changed in place.
 */
export function mixResolve(input: MixResolveInput, pickTarget: (command: number) => number): MixResolveOutput {
  const unchanged = (ret: 0 | 1): MixResolveOutput => ({
    ret, slots: input.slots, field0: undefined, field1: undefined, targetMask: undefined, resolved: input.resolved,
    pick: undefined, ingredients: 0, learned: false,
  });
  if (input.loading) return unchanged(1);
  if (input.resolved) return unchanged(input.animating ? 1 : 0);

  const picked: number[] = [];
  for (let s = 0; s < input.slots; s++) {
    for (let j = 0; j < 2; j++) {
      const field = (input.fields[2 * s + j] ?? 0) & 0xffff;
      if (field !== NO_FIELD && field !== MIX_COMMAND_ID && field !== ITEM_COMMAND_ID && picked.length < 2) picked.push(field);
    }
  }
  let result: number;
  if (picked.length >= 2) {
    for (const item of picked) bagChange(input.bag, item, -1);
    result = mixResultCommand(picked[0] as number, picked[1] as number);
  } else if (picked.length === 1) {
    result = picked[0] as number;
    bagChange(input.bag, result, -1);
  } else {
    result = NO_FIELD;
  }
  const mask = pickTarget(result) >>> 0;
  let learned = false;
  if (mask !== 0 && picked.length >= 2 && (((result >>> 0) & 0xfffff000) >>> 0) === 0x3000 && result >= 0x3060) {
    const n = (result - 0x60) & 0xfff;
    const index = n >> 4;
    if (index < input.shared.length) input.shared[index] = ((input.shared[index] as number) | (1 << (n & 0xf))) & 0xffff; // no table value reaches past the array
    learned = true;
  } else if (mask !== 0 && picked.length >= 2 && (((result >>> 0) & 0xfffff000) >>> 0) === 0x3000) {
    learned = true; // below 0x3060: the user's own array (no Mix result is there; not modelled)
  }
  return {
    ret: mask === 0 ? 1 : 0,
    slots: 1,
    field0: result & 0xffff,
    field1: NO_FIELD,
    targetMask: mask,
    resolved: true,
    pick: { user: input.user, command: result },
    ingredients: picked.length,
    learned,
  };
}
