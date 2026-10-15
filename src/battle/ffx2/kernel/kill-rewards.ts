/**
 * FFX-2's kill rewards: what one kill pays (EXP, gil, the item drop and its rare slot), the reward abilities, and the AP a girl is
 * credited (re-parity RC9, lane X2-C; **FFX-2 only**: FFX has its own kill-reward routine, `battle/ffx/kernel/drops.ts`).
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); note FFX2-G03 sections 3 to 5 (213,000 vectors, 0 mismatches
 * in the note's own proofs). Pure, no DOM, no engine types; randomness comes from a `draw(stream)` callback (`./rng.ts`). The
 * engine side is `../kill-rewards.ts` (the ledger, the owners) and `../adapt/kill-rewards.ts` (the engine's units as the kernel's terms).
 *
 * | Function | Address | What it is here |
 * |---|---|---|
 * | reward roll for one kill | 0x006246d0 | {@link killRoll} |
 * | per-owner modifiers | 0x006244c0 | the owner loop inside {@link killRoll} |
 * | item into the results lists | 0x00624890 | {@link addItem} |
 * | AP gain for one owner | 0x00635590 | {@link apGain} (the spending that follows it is not here: see below) |
 * | end-of-battle rollback / battle-start commit | 0x00624450 / 0x006244a0 | {@link rollbackEnd} / {@link commitStart} |
 *
 * **The routine** (the note, 4.2): per kill, in this order. The results EXP total grows by the row's EXP (clamped 0 to 999,999,999;
 * no multiplier touches it). For each of nine owner slots, in order: an owner is a slot that is present and not ejected; her ability
 * word (`Chr+0x652`) updates the running multipliers (Gillionaire and Double Items double theirs **once per owner**, Butterfingers
 * **sets** the rare multiplier to 8, Item Hunter adds 0x40 to the drop threshold **per owner**), Double EXP doubles her own amount
 * only (it is not passed to the next owner), her record's EXP grows by that amount unless she is Pointless, and her AP gain is called
 * (a dead owner still gets the EXP). Then the gil total grows by the gil multiplier times the row's gil (a 32-bit product, clamped).
 * Then **one draw on stream 10, always, even when nothing can drop**; if the drop byte is not zero and `(draw mod 255) <
 * drop byte + best chain + current chain + 64 per Item Hunter owner`, one draw on stream 11 picks the rare slot when `(draw and
 * 255) < 32 x the rare multiplier + best chain + current chain`, and the slot's item goes to the lists. A girl's own knock-out runs
 * the same routine (her row is empty, so it pays nothing, and it still takes the stream-10 draw).
 *
 * **Not here, on purpose:** the spending of the AP into the worn dressphere's abilities (0x00635510, 0x00635430, 0x00635690): the
 * engine's dressphere data keeps one banked AP number per dressphere, not the AP held per ability and the learn target the routine
 * walks, so there is nothing to spend into (note FFX2-G03 section 4.6; `docs/handoff/re-parity-rc9-x2-rewards.md`, "decompiled, not wired").
 * Its in-battle stats refresh, which may draw on the girl's own stream, is open question 10 of the note.
 */

import { clampInt, s32 } from './intops.ts';
import { Ffx2FixedStream, drawValue, type Ffx2Draw } from './rng.ts';

/** The clamp of every EXP, gil and results total (the note, section 3). */
export const REWARD_TOTAL_MAX = 999_999_999;
/** Ids kept per category list; a ninth id is dropped without notice. */
export const LIST_CAPACITY = 8;
/** The pool cap `Chr+0x674` of a girl, set at battle start (note 4.5). */
export const AP_POOL_CAP = 99;
/** Owner slots the routine visits (`Chr` slots 0 to 8: the three girls and the six slots of a Special dressphere's parts). */
export const OWNER_SLOTS = 9;

/** Ability word 0 (`Chr+0x650`): Double AP and Triple AP. The word-1 bits are below. (`kernel/auto-ability.ts` names the same masks.) */
const W0_DOUBLE_AP = 0x1000;
const W0_TRIPLE_AP = 0x2000;
/** Ability word 1 (`Chr+0x652`). */
const W1_BUTTERFINGERS = 0x0002;
const W1_GILLIONAIRE = 0x0010;
const W1_DOUBLE_ITEMS = 0x0020;
const W1_DOUBLE_EXP = 0x0040;
const W1_ITEM_HUNTER = 0x0200;

/** Item id high nibble to [list index, stack cap] (the note, section 3: consumables, accessories, key items, dresspheres, garment grids). */
const CATEGORY: Readonly<Record<number, readonly [number, number]>> = {
  2: [0, 99],
  9: [1, 99],
  7: [2, 1],
  5: [3, 99],
  6: [4, 1],
};

/** The five item lists of the results buffer: for each, a count, up to 8 ids and their quantities. */
export interface RewardLists {
  count: number[];
  ids: number[][];
  qty: number[][];
}

/** One save record of the results buffer: the EXP at battle start (`snap`) and the EXP gained so far (`pend`). */
export interface RewardRecord {
  snap: number;
  pend: number;
}

/** The part of the results buffer (0x1ACCA20) this routine writes: the EXP and gil totals, the records and the item lists. */
export interface RewardBuffer {
  exp: number;
  gil: number;
  rec: RewardRecord[];
  lists: RewardLists;
}

/** A new, empty results buffer with `records` save records (the game keeps 23). */
export function newRewardBuffer(records = 23): RewardBuffer {
  return {
    exp: 0,
    gil: 0,
    rec: Array.from({ length: records }, () => ({ snap: 0, pend: 0 })),
    lists: {
      count: [0, 0, 0, 0, 0],
      ids: Array.from({ length: 5 }, () => new Array<number>(LIST_CAPACITY).fill(0)),
      qty: Array.from({ length: 5 }, () => new Array<number>(LIST_CAPACITY).fill(0)),
    },
  };
}

/**
 * Put `quantity` of the item `id` into the lists (0x00624890). Nothing for id 0 or a quantity below 1, nor for an id whose high
 * nibble is not one of the five categories; the multiplier applies to consumables (nibble 2) only; an id already listed grows (cut to
 * the category cap); a new id is appended while fewer than 8 are listed; a ninth is dropped.
 */
export function addItem(buffer: RewardBuffer, id: number, quantity: number, multiplier: number): void {
  const category = CATEGORY[(id >> 12) & 0xf];
  if (id === 0 || quantity < 1 || category === undefined) return;
  const [list, cap] = category;
  const qty = ((id >> 12) & 0xf) === 2 ? Math.imul(quantity, multiplier) : quantity;
  const lists = buffer.lists;
  const n = lists.count[list] as number;
  const ids = lists.ids[list] as number[];
  const quantities = lists.qty[list] as number[];
  for (let k = 0; k < n; k++) {
    if (ids[k] === id) {
      quantities[k] = clampInt(s32((quantities[k] as number) + qty), 0, cap) & 0xffff;
      return;
    }
  }
  if (n < LIST_CAPACITY) {
    ids[n] = id;
    quantities[n] = clampInt(qty, 0, cap) & 0xffff;
    lists.count[list] = n + 1;
  }
}

/** The victim's reward fields and chain bytes (the monster row copied into its `Chr`, and `Chr+0x5ad`, `+0x5ae`). */
export interface RewardVictim {
  exp: number;
  ap: number;
  gil: number;
  /** Row +0xaa: the drop chance byte (0 never drops, 255 always). */
  dropByte: number;
  /** `Chr+0x5ad`: the chain counter now (it includes the killing hit). */
  chain: number;
  /** `Chr+0x5ae`: the best chain of the battle (never below the current one, never reset). */
  best: number;
  /** [item id, quantity] of the common slot, then of the rare slot (row +0xac and +0xb0). */
  items: readonly [readonly [number, number], readonly [number, number]];
}

/** One of the nine owner slots, as the routine reads it. */
export interface RewardOwner {
  /** `Chr+0x1784` is not zero. */
  present: boolean;
  /** `Chr+0x1792` is not zero (Ejected). */
  ejected: boolean;
  /** `Chr+0x652`, the second ability word. */
  word1: number;
  /** `Chr+0x436` bit 0: the Pointless status. */
  pointless: boolean;
  /** `Chr+0x11`: the save index whose record takes her EXP. */
  saveIndex: number;
}

/** The three debug switches of the exe (VA 0xdf68d7, 0xdf68ce, 0xdf68d5): off in the retail game. */
export interface RewardDebug {
  gil100?: boolean;
  drop?: boolean;
  rare?: boolean;
}

/** What one roll did, besides writing the buffer. */
export interface KillRollResult {
  /** The AP-gain calls the owner loop made, in order: the slot and the victim's AP. */
  apCalls: Array<{ slot: number; ap: number }>;
  /** The streams drawn, in order: [10] or [10, 11]. */
  draws: number[];
  /** The drop test passed (a stream-11 draw followed). */
  dropped: boolean;
  /** The rare slot was chosen. */
  rare: boolean;
}

/**
 * The reward roll for one kill (0x006246d0 with 0x006244c0 and 0x00624890): writes `buffer`, reports the AP calls it makes.
 * `owners` is the nine slots in order. `draw(stream)` hands back the raw 31-bit value of one draw of that stream.
 */
export function killRoll(
  victim: RewardVictim,
  owners: readonly RewardOwner[],
  buffer: RewardBuffer,
  draw: Ffx2Draw,
  debug: RewardDebug = {},
): KillRollResult {
  const gilRow = debug.gil100 === true ? Math.imul(victim.gil, 100) : victim.gil;
  buffer.exp = clampInt(s32(buffer.exp + victim.exp), 0, REWARD_TOTAL_MAX);

  let gilMultiplier = 1;
  let itemMultiplier = 1;
  let rareMultiplier = 1;
  let hunter = 0;
  const apCalls: KillRollResult['apCalls'] = [];
  owners.forEach((owner, slot) => {
    if (!owner.present || owner.ejected) return;
    const word = owner.word1;
    if ((word & W1_GILLIONAIRE) !== 0) gilMultiplier = Math.imul(gilMultiplier, 2);
    if ((word & W1_DOUBLE_ITEMS) !== 0) itemMultiplier = Math.imul(itemMultiplier, 2);
    if ((word & W1_BUTTERFINGERS) !== 0) rareMultiplier = 8;
    let exp = victim.exp;
    if ((word & W1_DOUBLE_EXP) !== 0) exp = Math.imul(exp, 2);
    if ((word & W1_ITEM_HUNTER) !== 0) hunter = s32(hunter + 0x40);
    if (!owner.pointless) {
      const record = buffer.rec[owner.saveIndex];
      if (record !== undefined) record.pend = clampInt(s32(record.pend + exp), 0, REWARD_TOTAL_MAX);
    }
    apCalls.push({ slot, ap: victim.ap });
  });
  buffer.gil = clampInt(s32(Math.imul(gilMultiplier, gilRow) + buffer.gil), 0, REWARD_TOTAL_MAX);

  const draws: number[] = [Ffx2FixedStream.Steal];
  const test = drawValue(draw, Ffx2FixedStream.Steal) % 255;
  let dropped = false;
  let rare = false;
  if (victim.dropByte !== 0) {
    const chains = victim.best + victim.chain;
    if (test < chains + victim.dropByte + hunter || debug.drop === true) {
      draws.push(Ffx2FixedStream.StealSlot);
      rare = (drawValue(draw, Ffx2FixedStream.StealSlot) & 0xff) < rareMultiplier * 32 + chains || debug.rare === true;
      const slot = rare ? victim.items[1] : victim.items[0];
      addItem(buffer, slot[0], slot[1], itemMultiplier);
      dropped = true;
    }
  }
  return { apCalls, draws, dropped, rare };
}

/** One owner as the AP gain reads her. */
export interface ApOwner {
  /** The owner slot of the call. */
  slot: number;
  /** `Chr+0x11`: her save index (0x0f to 0x16 are captured-monster saves, which earn nothing). */
  saveIndex: number;
  /** `Chr+0x1787` is not zero: she is dead. */
  dead: boolean;
  /** `Chr+0x434` bit 1: Petrified. */
  petrified: boolean;
  /** `Chr+0x436` bit 0: Pointless. */
  pointless: boolean;
  /** `Chr+0x650`: the first ability word (Double AP, Triple AP). */
  word0: number;
  /** `Chr+0x670`: the AP credited so far this battle. */
  pool: number;
  /** `Chr+0x674`: the cap (99 for a girl). */
  cap: number;
}

/** What the AP gain did: her new pool, and the AP to spend (0 when none). */
export interface ApGainResult {
  /** She was eligible (the call did more than return). */
  eligible: boolean;
  pool: number;
  /** The increase of the pool when it is above 0: the AP the game spends into the worn dressphere at once. */
  spend: number;
}

/**
 * The AP gain for one owner (0x00635590): nothing for a monster slot (0x0f to 0x1e), a captured monster's save (0x0f to 0x16), a dead
 * or Petrified owner. The gain is the row's AP, doubled by Double AP and tripled by Triple AP (both: x6), none under Pointless; the
 * new pool is the old pool plus the gain, raised to 0 and cut to the cap; the increase is what is spent. So a girl is credited at most
 * `cap` AP in a battle, multipliers included.
 */
export function apGain(owner: ApOwner, ap: number): ApGainResult {
  const slot = owner.slot & 0xff;
  const monsterSave = ((owner.saveIndex - 0xf) & 0xff) < 8;
  const eligible = (slot < 0xf || slot >= 0x1f) && !monsterSave;
  if (!eligible || owner.dead || owner.petrified) return { eligible: false, pool: owner.pool, spend: 0 };
  let gain = ap;
  if ((owner.word0 & W0_DOUBLE_AP) !== 0) gain = Math.imul(gain, 2);
  if ((owner.word0 & W0_TRIPLE_AP) !== 0) gain = Math.imul(gain, 3);
  if (owner.pointless) gain = 0;
  const pool = clampInt(s32(gain + owner.pool), 0, owner.cap);
  const delta = s32(pool - owner.pool);
  return { eligible: true, pool, spend: delta > 0 ? delta : 0 };
}

/**
 * The end-of-battle rollback (0x00624450): for each owner slot, a girl who is dead or Petrified at the teardown has her EXP gained
 * set back to the EXP at battle start. A girl who stands keeps everything, including EXP gained while she was down earlier.
 * `down[slot]` is that test and `saveIndexOf[slot]` her record; AP already spent stays.
 */
export function rollbackEnd(buffer: RewardBuffer, down: readonly boolean[], saveIndexOf: readonly number[]): void {
  down.forEach((isDown, slot) => {
    const record = buffer.rec[saveIndexOf[slot] as number];
    if (isDown && record !== undefined) record.pend = record.snap;
  });
}

/** The battle-start commit (0x006244a0): every record's EXP at start becomes the EXP gained so far. */
export function commitStart(buffer: RewardBuffer): void {
  for (const record of buffer.rec) record.snap = record.pend;
}
