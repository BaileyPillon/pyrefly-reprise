/**
 * FFX Steal, Pilfer Gil and Bribe kernels (part 1 of the steal and rewards kernel; the kill rewards are in
 * `./drops.ts`, the gear drop in `./gear-drop.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: Steal 0x0078b760, Pilfer Gil
 * 0x0078b920, Bribe 0x0078bdd0. Spec: `research/re-ffx-overdrive-steal-aeons.md` section 3. Not wired into the engine.
 * Pure and deterministic given `draw`. Integer rules as `./int32.ts`: 32-bit wrap, truncating divisions.
 *
 * Draws: Steal draws stream 10 (the success roll) and, on success, stream 11 (the rare roll); Pilfer Gil draws stream 10
 * twice (success, then the amount); Bribe draws once from the target's mode-2 stream. `draw(stream)` returns the raw
 * 31-bit value of that stream; the kernels use only the remainder or the low byte the game uses.
 *
 * "Debug flags" below are the cheat switches the exe keeps next to the other battle debug flags (VA 0x0112a90a always
 * hit, 0x0112a911 always rare); a retail game never sets them, and every kernel works with them off by default.
 */

import { clamp, COUNTER_CAP } from './ap-award.ts';
import { mul, sdiv, udiv } from './int32.ts';
import { rngStreamIndex } from './rng.ts';

/** The language id of the build for which Rename Cards and the Zaurus bribe are replaced (the id list: 0 JP, 1 EN, 2 FR, 3 ES, 4 DE, 5 IT, 9 KR, 10 CN, 11 another). */
export const LOCALE_REPLACED = 0xb;
/** Rename Card, and the items that replace it. */
export const ITEM_RENAME_CARD = 0x2065;
export const ITEM_GAMBLERS_SPIRIT = 0x206d;

/** The battle-wide switches the steal code reads. */
export interface StealOptions {
  /** Byte at VA 0x0112c9e5; 2 stops stealing altogether. */
  demoMode: number;
  /** VA 0x0112a90a: the roll always succeeds. */
  debugAlwaysHit?: boolean;
  /** VA 0x0112a911: the rare item is always taken. */
  debugAlwaysRare?: boolean;
  /** The language id (`0x008ac2f0`); only 11 changes anything. */
  language: number;
}

/** The parts of a monster's loot record the item steal reads and changes. */
export interface StealLoot {
  /** +0x0a: the steal chance, 0..255; halves (never below 1) after every successful steal. */
  chance: number;
  /** +0x24, +0x26 (u16): the common and the rare item ids (high nibble 2 = an item). */
  commonId: number;
  rareId: number;
  /** +0x28, +0x29: their quantities. */
  commonQty: number;
  rareQty: number;
}

export interface StealItemResult {
  /** The result block's byte 7: 1 whenever a loot record exists. */
  attempted: boolean;
  /** The block's word at +8: 0xffff while the monster has something to steal and the roll has not happened, the quantity after a success, else 0. */
  qtyWord: number;
  /** The block's word at +0xa: the item id after a success, else 0. */
  itemId: number;
  /** The call to the party inventory (item id, quantity) a success makes at once, else null. */
  inventoryAdd: [number, number] | null;
  /** The achievement call (code 4) raised when Rikku's steal counter reaches 200, else null. */
  achievement: number | null;
}

export interface StealTarget {
  /** `Chr+0xdeb`: how many times the target has been stolen from (byte, stops at 255). */
  stealCount: number;
  /** `Chr+0xded`: the id of the last attacker; 6 is Rikku. */
  lastAttacker: number;
}

/**
 * `pp_BtlStealItem(user, target, loot, block, missCount)` (0x0078b760). `userAutoB` is `Chr+0x6be` of the thief (bit 7
 * raises the rare threshold from 0x20 to 0x80, bit 8 to 0x100 = always), `misses` the number of the action's hits that
 * missed this target (any miss cancels the steal AFTER the success roll has been drawn). `loot` is changed in place; so are
 * `target` and `rikkuSteals.count` (the counter at VA 0x01130840).
 *
 * The item is stealable only when the chance is not 0, the common quantity is not 0, the common id is an item (high
 * nibble 2) and `demoMode` is not 2; otherwise the placeholder word stays 0. The success roll is `draw(10) % 255 <
 * chance` (or the debug switch), cancelled by a miss. On success: the chance becomes `chance * 50 / 100` (at least 1);
 * `draw(11) & 0xff` below the rare threshold (or the debug switch) takes the rare item when its quantity is not 0 and its
 * id is an item, else the common one; in build language 11 a Rename Card becomes 2 Gambler's Spirits (loot changed too);
 * the target's steal count goes up (stops at 255); Rikku's counter goes up and raises the achievement from 200; the
 * item goes straight into the party inventory.
 */
export function stealItem(
  loot: StealLoot | null,
  userAutoB: number,
  misses: number,
  target: StealTarget,
  rikkuSteals: { count: number },
  opts: StealOptions,
  draw: (stream: number) => number,
): StealItemResult {
  const res: StealItemResult = { attempted: false, qtyWord: 0, itemId: 0, inventoryAdd: null, achievement: null };
  if (loot === null) return res;
  res.attempted = true;
  let chance = loot.chance;
  if (chance === 0 || loot.commonQty === 0 || (loot.commonId & 0xf000) !== 0x2000 || opts.demoMode === 2) {
    chance = 0;
  } else {
    res.qtyWord = 0xffff;
  }
  const roll = (draw(10) & 0x7fffffff) % 255;
  const rareAt = (userAutoB & 0x100) !== 0 ? 0x100 : (userAutoB & 0x80) !== 0 ? 0x80 : 0x20;
  if ((roll < chance || opts.debugAlwaysHit === true) && misses === 0) {
    loot.chance = Math.max(1, sdiv(mul(loot.chance, 50), 100)) & 0xff;
    let slot = 0;
    const rare = (draw(11) & 0xff) < rareAt || opts.debugAlwaysRare === true;
    if (rare && loot.rareQty !== 0 && (loot.rareId & 0xf000) === 0x2000) slot = 1;
    if (opts.language === LOCALE_REPLACED && (slot === 1 ? loot.rareId : loot.commonId) === ITEM_RENAME_CARD) {
      if (slot === 1) {
        loot.rareId = ITEM_GAMBLERS_SPIRIT;
        loot.rareQty = 2;
      } else {
        loot.commonId = ITEM_GAMBLERS_SPIRIT;
        loot.commonQty = 2;
      }
    }
    res.qtyWord = slot === 1 ? loot.rareQty : loot.commonQty;
    res.itemId = slot === 1 ? loot.rareId : loot.commonId;
    if (target.stealCount < 0xff) target.stealCount += 1;
    if (target.lastAttacker === 6) {
      rikkuSteals.count = (rikkuSteals.count + 1) | 0;
      if (rikkuSteals.count >= 200) res.achievement = 4;
    }
    res.inventoryAdd = [res.itemId, (res.qtyWord << 16) >> 16];
  }
  return res;
}

export interface StealGilResult {
  /** The block's byte at +0xc: 1 whenever a loot record exists. */
  attempted: boolean;
  /** The block's value at +0x10 (signed): the gil taken; -1 when this monster has nothing to give (factor 0 or mode 2); else 0 or the amount. */
  amount: number;
  /** The target's gil-steal chance (`Chr+0x712`, signed 16-bit) after the call. */
  chance: number;
}

/**
 * `pp_BtlStealGil(user, target, loot, block, missCount)` (0x0078b920): Pilfer Gil. The chance lives on the TARGET
 * (`Chr+0x712`, signed 16-bit, 255 at battle start for every character) and halves after each success. `gilFactor` is
 * the loot record's byte at +0x113 (0 = the monster has no gil to pilfer). Draws stream 10 for the success roll (`% 255`
 * below the chance, cancelled by a miss), then stream 10 again: the amount is
 * `floor(floor((draw % 101 + 100) * factor * 100 / 200) * chance / 255)`, in 32-bit signed arithmetic with truncation
 * toward zero; the new chance is `max(1, chance * 50 / 100)`. The gil goes to the party when the hit is applied.
 */
export function stealGil(
  hasLoot: boolean,
  gilFactor: number,
  chance: number,
  misses: number,
  opts: Pick<StealOptions, 'demoMode' | 'debugAlwaysHit'>,
  draw: (stream: number) => number,
): StealGilResult | null {
  if (!hasLoot) return null;
  const res: StealGilResult = { attempted: true, amount: 0, chance: (chance << 16) >> 16 };
  if (gilFactor === 0 || opts.demoMode === 2) {
    res.amount = -1;
    return res;
  }
  const c = res.chance;
  const roll = (draw(10) & 0x7fffffff) % 255;
  if ((roll < c || opts.debugAlwaysHit === true) && misses === 0) {
    const r2 = (draw(10) & 0x7fffffff) % 101;
    const base = sdiv(mul(mul(r2 + 100, gilFactor & 0xff), 100), 200);
    res.amount = sdiv(mul(base, c), 255);
    res.chance = (Math.max(1, sdiv(mul(c, 50), 100)) << 16) >> 16;
  }
  return res;
}

/** What Bribe reads and changes of the target monster. */
export interface BribeTarget {
  /** `Chr+0x594`: maximum HP (the divisor; 0 faults in the game). */
  maxHp: number;
  /** `Chr+0x704`: gil paid to this monster so far. */
  paid: number;
  /** `Chr+0x5b8` (u16): bit 10 (0x400) makes it immune to Bribe. */
  special: number;
  /** `Chr+0xe` (u16): the monster id. */
  monsterId: number;
  /** `Chr+0x701`: the death marker; 2 means it left by being bribed. */
  marker: number;
  /** `Chr+0x708`: set to the bribe value on success; the kill reward later turns it into items. */
  value: number;
}

export interface BribeCounters {
  /** +0x10 of the action's counter block: successes. */
  success: number;
  /** +0x14: immune (Bribe-immune or asleep). */
  immune: number;
  /** +0x18: failures. */
  fail: number;
}

/**
 * `pp_BtlBribe(targetId, targetChr, cmd, counters, hitRecord)` (0x0078bdd0). Only a command whose misc word has bit 31
 * does anything. The value is `(paid + offered) * 256 / maxHP / 20 - 64` (unsigned division, the first product wraps at
 * 32 bits); the roll is the low byte of one draw from the target's mode-2 stream; it works when `roll < value` (signed)
 * and gil was offered, unless the target has the Bribe-immune bit or is asleep (`recSleep` is the hit record's Sleep
 * counter), in which case the immune counter goes up. Success sets the death marker to 2, stores the value and sets the
 * Eject bit (0x100) of the record's extra word. The gil offered is added to `paid` (clamped to 999999999) in every case
 * but one: in build language 11 the monster with id 0x10ef returns early with a failure while `paid + offered` is below
 * 0x26548, and otherwise has 0x4650 added to `paid` first.
 * Returns 1 when the monster was bribed.
 */
export function bribe(
  targetId: number,
  t: BribeTarget,
  cmdFlagsMisc: number,
  counters: BribeCounters,
  rec: { sleep: number; extra: number },
  gilOffered: number,
  opts: Pick<StealOptions, 'debugAlwaysHit' | 'language'>,
  draw: (stream: number) => number,
): number {
  if ((cmdFlagsMisc & 0x80000000) === 0) return 0;
  const total = ((t.paid + gilOffered) | 0) << 8;
  const value = udiv(udiv(total, t.maxHp), 20) - 0x40;
  const roll = draw(rngStreamIndex(targetId, 2, false)) & 0xff;
  if (opts.language === LOCALE_REPLACED && t.monsterId === 0x10ef) {
    if (((gilOffered + t.paid) | 0) < 0x26548) {
      counters.fail += 1;
      return 0;
    }
    t.paid = (t.paid + 0x4650) | 0;
  }
  let ret = 0;
  if ((t.special & 0x400) === 0 && rec.sleep === 0) {
    if ((roll < value && gilOffered > 0) || opts.debugAlwaysHit === true) {
      t.marker = 2;
      t.value = value | 0;
      rec.extra = (rec.extra | 0x100) & 0xffff;
      ret = 1;
      counters.success += 1;
    } else {
      counters.fail += 1;
    }
  } else {
    counters.immune += 1;
  }
  t.paid = clamp((t.paid + gilOffered) | 0, 0, COUNTER_CAP);
  return ret;
}
