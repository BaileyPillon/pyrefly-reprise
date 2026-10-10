/**
 * FFX kill rewards kernel: what a monster's death gives (`pp_BtlRollDrops`, VA 0x007990d0), the reward list it adds to
 * (VA 0x00798ac0), and the end-of-battle AP settle (VA 0x00798b70).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-overdrive-steal-aeons.md` section 3. Not wired into the engine. Pure given `draw`.
 *
 * Draw order of one kill: a bribed monster draws twice from the killer's mode-0 stream; any other monster draws stream
 * 10 once per item slot (two slots) and stream 11 after each success; then stream 10 once for the gear roll (which draws
 * streams 12 and 13, see `./gear-drop.ts`). `draw(stream)` returns the raw 31-bit value of that stream.
 */

import { awardAp, type ApRecipient, bumpStat, clamp, COUNTER_CAP } from './ap-award.ts';
import { type GearEntry, type GearLoot, rollGearDrop } from './gear-drop.ts';
import { cvttsd2si, mul } from './int32.ts';
import { ITEM_RENAME_CARD, LOCALE_REPLACED } from './steal-rewards.ts';

/** The party members' potion-like status bits `Chr+0x616` that turn a drop into a sphere (the Distill statuses). */
export const DistillBit = { Power: 0x2, Mana: 0x4, Speed: 0x8, Unused: 0x10, Ability: 0x20 } as const;
export const ITEM_POWER_SPHERE = 0x2046;
export const ITEM_MANA_SPHERE = 0x2047;
export const ITEM_SPEED_SPHERE = 0x2048;
export const ITEM_ABILITY_SPHERE = 0x2049;
export const ITEM_FARPLANE_SHADOW = 0x2032;

/** A monster's loot record, as far as the kill rewards read it (offsets into the 0x118-byte record). */
export interface DropLoot extends GearLoot {
  /** +0 (u16): gil. */
  gil: number;
  /** +2 (u16): AP for a normal kill; +4 (u16): AP for an overkill. */
  ap: number;
  apOverkill: number;
  /** +8, +9: the chance bytes of the two item slots. */
  chance: [number, number];
  /** +0xb: the gear drop chance. */
  gearChance: number;
  /** +0xc (u16 x4) and +0x14 (u8 x4): per slot a common item then a rare item, with quantities. */
  items: number[];
  qty: number[];
  /** +0x18 and +0x20: the same lists used when the monster dies to an overkill. */
  overkillItems: number[];
  overkillQty: number[];
  /** +0x2a (u16): the item a bribed monster leaves behind (changed in place by the language swap). */
  bribeItem: number;
  /** +0x2c: the multiplier of the bribed quantity. */
  bribeFactor: number;
}

/** The battle rewards struct at VA 0x02310ea0, as far as the kill rewards use it. */
export interface RewardList {
  /** 0x02310f6c: gil earned (0..999999999). */
  gil: number;
  /** 0x02310f20: AP earned per slot 0..0x11. */
  ap: number[];
  /** +0xd0 (count) ... : up to eight item stacks. */
  items: Array<{ id: number; qty: number }>;
  /** +0xd2 (count) ...: up to eight gear entries. */
  gear: GearEntry[];
}

/** The battle-wide switches the rewards read. */
export interface DropOptions {
  /** The language id; 11 swaps Rename Cards. */
  language: number;
  /** VA 0x0112a90a: the item rolls always succeed (for a slot whose chance byte is not 0). */
  debugAlwaysHit?: boolean;
  /** VA 0x0112a911: the rare item is always taken. */
  debugAlwaysRare?: boolean;
  /** VA 0x0112a912: AP x100. */
  debugAp100?: boolean;
  /** VA 0x0112a913: gil x100. */
  debugGil100?: boolean;
}

/**
 * `FUN_00798ac0(item, qty, list)`: adds `qty` of `item` to the reward list. Nothing happens for item 0 or a quantity
 * below 1. An item already listed has the quantity added (clamped to 0..99); otherwise a new stack of
 * `clamp(qty, 0, 99)` is appended while fewer than eight stacks exist.
 */
export function addReward(list: RewardList, item: number, qty: number): void {
  if (item === 0 || qty < 1) return;
  const found = list.items.find((s) => s.id === (item & 0xffff) && item === (item & 0xffff));
  if (found !== undefined) {
    found.qty = clamp(found.qty + qty, 0, 99);
    return;
  }
  if (list.items.length < 8) list.items.push({ id: item & 0xffff, qty: clamp(qty, 0, 99) });
}

export interface DropsInput {
  /** `pp_BtlRngStreamIndex(killerId, 0)`: the stream the killer's damage rolls use (the bribe quantity draws from it). */
  killerStream: number;
  /** The id of whoever dealt the killing blow (the gear owner falls back to it when it is a party member). */
  killerId: number;
  loot: DropLoot;
  /** `Chr+0xf5f`: the monster died to an overkill. */
  overkill: boolean;
  /** `Chr+0x616` of the monster when it died: the Distill bits. */
  statusWord: number;
  /** The dead monster: `Chr+0x701 == 2` means it was bribed away; `Chr+0x708` is the bribe value. */
  bribed: boolean;
  bribeValue: number;
  /** Slots 0 to 0x11, for the AP award. */
  recipients: readonly ApRecipient[];
  /** Party save bit for each member 0 to 6 (the gear owner roll). */
  joined: readonly boolean[];
  groupOf: (ability: number) => number;
  nameOf: (e: GearEntry) => number;
  opts: DropOptions;
}

/**
 * `pp_BtlRollDrops(killer, victim, loot, overkill, statusWord)` (0x007990d0). In order:
 *   1. AP: the normal or overkill AP (x100 with the debug switch) is awarded to each of the slots 0 to 0x11 through
 *      {@link awardAp}, chaining the gil multiplier (1, or 2 once any living member in the battle has Gillionaire).
 *   2. A bribed monster (marker 2) leaves `clamp(trunc(float(bit + sqrt(value) * factor / 16 * r / 25)), 1, 99)` of its bribe
 *      item, with `r = draw % 11 + 20` and `bit` the low bit of the next draw, both from the killer's stream (a Rename Card
 *      becomes 4 Speed Spheres in language 11). No gil.
 *      Any other monster: gil = `clamp(multiplier * gil + gil so far, 0, 999999999)`; then for each of the two slots a
 *      stream-10 roll `% 255` below the slot's chance byte gives an item: a stream-11 low byte below 0x20 picks the rare entry,
 *      else the common one; a Distill bit on the monster (power, mana, speed, ability, in that priority) replaces the item
 *      by the matching sphere and keeps the quantity; in language 11 a Rename Card becomes 4 (8 on an overkill) Farplane Shadows.
 *   3. The gear roll: a stream-10 roll below the gear chance byte calls {@link rollGearDrop}.
 */
export function rollDrops(inp: DropsInput, reward: RewardList, draw: (stream: number) => number): void {
  const { loot, opts } = inp;
  let apValue = inp.overkill ? loot.apOverkill : loot.ap;
  let gilValue = loot.gil;
  if (opts.debugAp100 === true) apValue = mul(apValue, 100);
  if (opts.debugGil100 === true) gilValue = mul(gilValue, 100);
  const items = inp.overkill ? loot.overkillItems : loot.items;
  const qtys = inp.overkill ? loot.overkillQty : loot.qty;

  let mult = 1;
  for (let i = 0; i < 0x12; i++) mult = awardAp(inp.recipients[i] as ApRecipient, reward.ap, i, apValue, mult);

  if (inp.bribed) {
    const r1 = ((draw(inp.killerStream) & 0x7fffffff) % 11) + 0x14;
    const root = Math.fround(Math.sqrt(inp.bribeValue | 0));
    const x = (root * loot.bribeFactor * 0.0625 * r1) / 25;
    const bit = draw(inp.killerStream) & 1;
    let qty = clamp(cvttsd2si(Math.fround(bit + x)), 1, 99);
    if (opts.language === LOCALE_REPLACED && loot.bribeItem === ITEM_RENAME_CARD) {
      loot.bribeItem = ITEM_SPEED_SPHERE;
      qty = 4;
    }
    addReward(reward, loot.bribeItem, qty);
  } else {
    reward.gil = clamp((mul(mult, gilValue) + (reward.gil | 0)) | 0, 0, COUNTER_CAP);
    for (let k = 0; k < 2; k++) {
      const chance = loot.chance[k] as number;
      const roll = (draw(10) & 0x7fffffff) % 255;
      if (roll < chance || (opts.debugAlwaysHit === true && chance !== 0)) {
        const rare = (draw(11) & 0xff) < 0x20 || opts.debugAlwaysRare === true;
        const idx = (rare ? 1 : 0) + 2 * k;
        let item = items[idx] as number;
        let qty = qtys[idx] as number;
        const s = inp.statusWord;
        if ((s & DistillBit.Power) !== 0) item = ITEM_POWER_SPHERE;
        else if ((s & DistillBit.Mana) !== 0) item = ITEM_MANA_SPHERE;
        else if ((s & DistillBit.Speed) !== 0) item = ITEM_SPEED_SPHERE;
        else if ((s & DistillBit.Unused) === 0 && (s & DistillBit.Ability) !== 0) item = ITEM_ABILITY_SPHERE;
        if (opts.language === LOCALE_REPLACED && item === ITEM_RENAME_CARD) {
          item = ITEM_FARPLANE_SHADOW;
          qty = (inp.overkill ? 1 : 0) * 4 + 4;
        }
        addReward(reward, item, qty);
      }
    }
  }

  const gearRoll = (draw(10) & 0x7fffffff) % 255;
  if (gearRoll < loot.gearChance || (opts.debugAlwaysHit === true && loot.gearChance !== 0)) {
    rollGearDrop(inp.killerId, loot, reward.gear, inp.joined, inp.groupOf, inp.nameOf, draw);
  }
}

/** One slot of the settle: the flags and counters `FUN_00798b70` reads. */
export interface SettleSlot {
  /** `R+0x24+i`: the member took a command other than Switch this battle (set by the command code for ids below 8). */
  acted: boolean;
  /** `R+i`: the slot was in the battle. */
  inBattle: boolean;
  dead: boolean;
  stoned: boolean;
  /** `R+0x80+4i`: the AP earned; `R+0x38+4i`: its value when the battle started. */
  ap: number;
  backup: number;
  /** Save record +0x50: the battles-fought statistic counter. */
  battles: number;
}

/**
 * `FUN_00798b70()`, run once when a battle ends: every slot 0 to 0x11 that never acted, is dead or is Petrified loses the
 * AP it earned in this battle (the value goes back to the one stored at the start); every slot that was in the battle
 * has its battles-fought counter bumped. Returns nothing; the dword at 0x02310f68 is cleared (its meaning was not traced).
 */
export function settleAp(slots: SettleSlot[]): void {
  slots.forEach((s, i) => {
    if (!s.acted || s.dead || s.stoned) s.ap = s.backup;
    if (s.inBattle) {
      const c = [s.battles, 0, 0, 0];
      bumpStat(c, i, 0, 0);
      s.battles = c[0] as number;
    }
  });
}
