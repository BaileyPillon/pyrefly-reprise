/**
 * FFX-2 theft kernels: Steal (item), Pilfer Gil (the Thief's gil theft) and the Bribe reward.
 *
 * **Game case: FFX-2 only** (FFX's Steal is a different function with a halving counter; see
 * `src/battle/ffx/kernel/`). Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69):
 * 0x00619c10 `steal_item`, 0x00619d10 `steal_gil`, 0x00616fb0 `bribe` (the reward half; whether a bribe
 * works is accuracy formula 6 in `./hit.ts`), and the three `*_apply` steps 0x0061aac0, 0x0061aa60,
 * 0x0061aa10 described below. Spec: `research/re-ffx2-hit-status.md` section 5. Pure, no DOM, no engine
 * types. The engine runs the three inside a strike, after the status rolls (`resolve-strike.ts`), and does
 * the state changes below itself (`src/battle/ffx2/steal.ts`). Randomness comes from a `draw(stream)`
 * callback (see `./rng.ts`); all three use FIXED streams (10 and 11), not the thief's own.
 *
 * What the "apply" steps do with a result (state change, not modelled here; the kernels return the
 * numbers the apply steps read):
 * - item: when `quantity > 0` the item goes to the inventory, the target's steal chance byte (+0x6ad)
 *   becomes 0 (so an enemy can be stolen from once) and a counter (+0x678, capped at 255) goes up;
 * - gil: when `amount > 0` the party gains that much gil and the target's gil chance byte (+0x6ae)
 *   becomes 0 (the target's own gil figure +0x6a8 is NOT reduced, only the chance is cleared);
 * - bribe: when `quantity > 0` the item goes to the inventory.
 */

import { clampInt, cvttsd2si, smod } from './intops.ts';
import { Ffx2FixedStream, drawValue, type Ffx2Draw } from './rng.ts';

/** `flags_misc` bit: the command steals an item (command row +0x14, bit 0x200). */
export const MISC_FLAG_STEAL_ITEM = 0x200;
/** `flags_damage` bit: the command steals gil (command row +0x1c, bit 0x100). */
export const DAMAGE_FLAG_STEAL_GIL = 0x100;
/** `flags_misc` bit: the command is a Bribe (command row +0x14, bit 0x4000000). */
export const MISC_FLAG_BRIBE = 0x4000000;
/** The command id whose steal always succeeds (Sticky Fingers). */
export const COMMAND_STEAL_GUARANTEED = 0x30c4;
/** The command id whose successful steal always takes the rare slot (Master Thief). */
export const COMMAND_STEAL_RARE = 0x30c5;

/** Debug switches (VA 0x00df68ce, 0x00df68d5): off in the retail game. */
export interface StealDebug {
  /** DAT 0x00df68ce: every steal and every Pilfer Gil succeeds. */
  forceSuccess?: boolean;
  /** DAT 0x00df68d5: the rare slot is taken whenever it is populated. */
  forceRare?: boolean;
}

// ---------------------------------------------------------------------------------------------------
// Steal (item): exe 0x00619c10
// ---------------------------------------------------------------------------------------------------

/** What `steal_item` reads. */
export interface StealItemInput {
  /** Command row +0x14 bit 0x200. When false the function does nothing and draws nothing. */
  stealCommand: boolean;
  /** The command id (ActionRec +0xa4): 0x30c4 and 0x30c5 change the rolls. */
  commandId: number;
  /** Target Chr +0x6ad (u8): the steal chance out of 255; 0 means nothing can be stolen. */
  chance: number;
  /** Target Chr +0x6b8 / +0x6ba (u16 each): the common slot's item id and quantity. */
  commonItem: number;
  commonQuantity: number;
  /** Target Chr +0x6bc / +0x6be (u16 each): the rare slot's item id and quantity. */
  rareItem: number;
  rareQuantity: number;
}

export interface StealItemResult {
  /** The steal path ran (result byte +0x0d is set). */
  active: boolean;
  /** Result +0x1c: the item id stolen, 0 when nothing was. */
  itemId: number;
  /**
   * Result +0x20: the stolen quantity (> 0), 0 when there was nothing to steal (no chance or no common
   * item), -1 when there was something but the roll failed.
   */
  quantity: number;
  /** The success branch ran: the roll passed, so the steal counter went up. */
  success: boolean;
  /** The rare slot was chosen (only meaningful when {@link success}). */
  rare: boolean;
  /** The chance byte the function returns: the target's, or 0 when it had nothing to steal. */
  chanceUsed: number;
  /** `draw(10) % 255` when it was drawn, else `null`. */
  successRoll: number | null;
  /** `draw(11) & 0xff` when it was drawn, else `null`. */
  slotRoll: number | null;
}

/**
 * `steal_item` (exe 0x00619c10).
 *
 *     if the command is not a steal: nothing.
 *     chance := target chance byte; if chance == 0 or the common slot is empty (id 0 or quantity 0):
 *                  chance := 0, quantity := 0 (nothing to steal)        else quantity := -1 (an attempt)
 *     r := draw(stream 10) % 255                         -- drawn whenever the command is a steal
 *     mask the roll to 0 when the command is 0x30c4 (so any chance >= 1 passes)
 *     success if  (r or 0) < chance
 *     on success:  b := draw(stream 11) & 0xff           -- drawn only on success
 *                  mask b to 0 when the command is 0x30c5
 *                  take the rare slot if b < 32 (one in eight) and the rare slot has an id and a quantity
 */
export function stealItem(
  input: StealItemInput,
  draw: Ffx2Draw,
  debug: StealDebug = {},
): StealItemResult {
  const inactive: StealItemResult = {
    active: false,
    itemId: 0,
    quantity: 0,
    success: false,
    rare: false,
    chanceUsed: input.chance & 0xff,
    successRoll: null,
    slotRoll: null,
  };
  if (!input.stealCommand) return inactive;

  let chance = input.chance & 0xff;
  let quantity: number;
  if (chance === 0 || (input.commonItem & 0xffff) === 0 || (input.commonQuantity & 0xffff) === 0) {
    chance = 0;
    quantity = 0;
  } else {
    quantity = -1;
  }

  const successRoll = smod(drawValue(draw, Ffx2FixedStream.Steal), 255);
  const effective = input.commandId === COMMAND_STEAL_GUARANTEED ? 0 : successRoll;
  const result: StealItemResult = {
    active: true,
    itemId: 0,
    quantity,
    success: false,
    rare: false,
    chanceUsed: chance,
    successRoll,
    slotRoll: null,
  };
  if (!(effective < chance || debug.forceSuccess === true)) return result;

  result.success = true;
  const slotRoll = drawValue(draw, Ffx2FixedStream.StealSlot) & 0xff;
  result.slotRoll = slotRoll;
  const effectiveSlot = input.commandId === COMMAND_STEAL_RARE ? 0 : slotRoll;
  const rareAvailable = (input.rareItem & 0xffff) !== 0 && (input.rareQuantity & 0xffff) !== 0;
  result.rare = (effectiveSlot < 0x20 || debug.forceRare === true) && rareAvailable;
  result.itemId = (result.rare ? input.rareItem : input.commonItem) & 0xffff;
  result.quantity = (result.rare ? input.rareQuantity : input.commonQuantity) & 0xffff;
  return result;
}

// ---------------------------------------------------------------------------------------------------
// Pilfer Gil: exe 0x00619d10
// ---------------------------------------------------------------------------------------------------

/** What `steal_gil` reads. */
export interface StealGilInput {
  /** Command row +0x1c bit 0x100. When false the function does nothing and draws nothing. */
  stealsGil: boolean;
  /** Target Chr +0x6ae (u8): the Pilfer Gil chance out of 255. */
  chance: number;
  /** Target Chr +0x6a8 (s32): the gil the target can give. */
  gil: number;
}

export interface StealGilResult {
  /** The Pilfer path ran (result byte +0x0e is set). */
  active: boolean;
  /**
   * Result +0x24 (a dword read as signed): -1 when there is nothing to take (no chance or no gil), 0
   * when the roll failed, else the amount.
   */
  amount: number;
  success: boolean;
  chanceUsed: number;
  /** `draw(10) % 255`, or `null` when no draw was made. */
  successRoll: number | null;
  /** `draw(10) % 101`, or `null`. */
  amountRoll: number | null;
}

/**
 * `steal_gil` (exe 0x00619d10).
 *
 *     if the command does not steal gil: nothing.
 *     if chance == 0 or gil == 0:  amount := -1, and NO draw
 *     else  amount := 0;  r := draw(10) % 255;  if r < chance:
 *               s := draw(10) % 101
 *               amount := floor( floor( ((s + 100) * gil) / 200 ) * chance / 255 )     (unsigned 32-bit steps)
 *
 * The amount is between half and all of `gil`, scaled again by chance/255, so a thief who rolls the
 * top of the range against a 255 chance takes the whole figure.
 */
export function stealGil(input: StealGilInput, draw: Ffx2Draw, debug: StealDebug = {}): StealGilResult {
  const chance = input.chance & 0xff;
  const result: StealGilResult = {
    active: false,
    amount: 0,
    success: false,
    chanceUsed: chance,
    successRoll: null,
    amountRoll: null,
  };
  if (!input.stealsGil) return result;
  result.active = true;
  if (chance === 0 || (input.gil | 0) === 0) {
    result.amount = -1;
    return result;
  }
  const successRoll = smod(drawValue(draw, Ffx2FixedStream.Steal), 255);
  result.successRoll = successRoll;
  if (!(successRoll < chance || debug.forceSuccess === true)) return result;

  result.success = true;
  const amountRoll = smod(drawValue(draw, Ffx2FixedStream.Steal), 101);
  result.amountRoll = amountRoll;
  const product = Math.imul(amountRoll + 100, input.gil | 0) >>> 0; // IMUL then read as unsigned
  const half = Math.floor(product / 200); // unsigned DIV (compiler magic number 0x51eb851f)
  const scaled = Math.imul(half, chance) >>> 0;
  result.amount = Math.floor(scaled / 255) | 0; // unsigned DIV (magic number 0x80808081), stored as a dword
  return result;
}

// ---------------------------------------------------------------------------------------------------
// Bribe reward: exe 0x00616fb0
// ---------------------------------------------------------------------------------------------------

/** One of the two bribe slots at Chr +0x6c0 (item id u16, quantity u16). */
export interface BribeSlot {
  item: number;
  quantity: number;
}

/** What `bribe` (the reward half) reads. */
export interface BribeRewardInput {
  /** Command row +0x14 bit 0x4000000. When false the function does nothing and draws nothing. */
  bribeCommand: boolean;
  /** Target Chr +0x6c0 .. +0x6c6: slot 0 then slot 1. */
  slots: readonly [BribeSlot, BribeSlot];
  /**
   * Target Chr +0x680 (s32): the threshold the bribe accuracy (formula 6) stored there. The reward
   * grows with its square root, so a bigger bribe pays more.
   */
  threshold: number;
}

export interface BribeRewardResult {
  /** The function's return value: 1 when the command is a bribe. */
  active: boolean;
  /** Result +0x28: the item id (0 when the chosen slot is empty), result +0x2c: the quantity. */
  itemId: number;
  quantity: number;
  /** The slot used (0 or 1), or `null` when inactive. */
  slot: number | null;
  /** `draw(11) & 0xff`. */
  slotRoll: number | null;
  /** `draw(10) % 11` and `draw(10) & 1`, or `null` when the slot was empty. */
  factorRoll: number | null;
  ditherRoll: number | null;
}

/**
 * `bribe` (exe 0x00616fb0), reward half. Draws from fixed streams 11 then 10 then 10:
 *
 *     b := draw(11) & 0xff;  slot := 1 if b < 64 else 0;  if slot has no item, use the other slot
 *     if the slot has an item id:
 *         f := draw(10) % 11 + 20                              -- 20 to 30
 *         d := draw(10) & 1
 *         q := float32( float32(sqrt(threshold)) * quantity * 0.0625 * f / 25 + d )   truncated toward zero
 *         quantity := clamp(q, 1, 99)
 *
 * The arithmetic is x87 with 53-bit precision (the CRT leaves that setting) and float32 stores where the
 * code stores to float memory; JavaScript doubles plus `Math.fround` reproduce it. A negative threshold
 * gives a NaN square root, which converts to the "integer indefinite" value and clamps to 1.
 */
export function bribeReward(input: BribeRewardInput, draw: Ffx2Draw): BribeRewardResult {
  const result: BribeRewardResult = {
    active: false,
    itemId: 0,
    quantity: 0,
    slot: null,
    slotRoll: null,
    factorRoll: null,
    ditherRoll: null,
  };
  if (!input.bribeCommand) return result;
  result.active = true;

  const slotRoll = drawValue(draw, Ffx2FixedStream.StealSlot) & 0xff;
  result.slotRoll = slotRoll;
  let slot = slotRoll < 0x40 ? 1 : 0;
  if ((input.slots[slot]!.item & 0xffff) === 0) slot = (slot - 1) & 1;
  result.slot = slot;
  const chosen = input.slots[slot]!;
  const item = chosen.item & 0xffff;
  if (item === 0) return result;

  const factorRoll = smod(drawValue(draw, Ffx2FixedStream.Steal), 11);
  const ditherRoll = drawValue(draw, Ffx2FixedStream.Steal) & 1;
  result.factorRoll = factorRoll;
  result.ditherRoll = ditherRoll;

  const root = Math.fround(Math.sqrt(input.threshold | 0));
  let v = root * (chosen.quantity & 0xffff);
  v *= 0.0625;
  v *= factorRoll + 20;
  v /= 25;
  v += ditherRoll;
  result.itemId = item;
  result.quantity = clampInt(cvttsd2si(Math.fround(v)), 1, 99);
  return result;
}
