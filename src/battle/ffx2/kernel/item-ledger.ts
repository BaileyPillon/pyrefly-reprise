/**
 * FFX-2 item ledger kernel: an item leaves the stock when the command is QUEUED, comes back when the command leaves the queue unspent, and is kept
 * when the start gate lets the command begin (re-parity RC8, lane X2-F, row XF1; **FFX-2 only**).
 *
 * **Game case: FFX-2 only** (FFX has its own bag, `../../ffx/kernel/bag.ts` and `deduct.ts`, and its own Mix; nothing here is read from FFX). Source:
 * FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); spec: the checked note FFX2-G06 sections 1 to 4 and 7 (357,509 harness vectors, 0 mismatches,
 * **0 random draws** in any of these functions). Pure and deterministic.
 *
 * Exe addresses (live build):
 * - 0x00620ba0  stock count            {@link stockCount}
 * - 0x00620e80  stock add or subtract  {@link stockAdd}
 * - 0x0060d4b0  gil subtract or add    {@link gilSubtract}
 * - 0x00620d90  reserve                {@link reserve}      (called by the queue add)
 * - 0x00620c00  refund or commit       {@link refund}       (flag 1 refund, flag 0 commit)
 * - 0x0062d300  queue add              {@link queueAdd}
 * - 0x0062d120  cancel one record      {@link cancelRecord}
 * - 0x0062c500, 0x0062c770, 0x0062c6a0, 0x0062c5c0, 0x006424b0 (the knock-out's cancel)  {@link cancelWhere}
 * - 0x006314c0  the start gate         {@link startGate}    (the only commit)
 *
 * The rules, in the note's words made short:
 * - The stock is 68 slots of a 16-bit id and a count 0 to 99 (a slot is free when its id is 0 or its count is 0; one just emptied takes the id 0xFF).
 *   A change goes through one routine that caps at 99, refuses a subtraction larger than a stack (and tries the next slot with the same id), and marks
 *   the item in a "gained" or "used" bitmap.
 * - The reserve takes one item out of the stock (and the record's gil amount out of the gil) the moment a command is queued, and writes the item id into the
 *   record. **A monster slot never reserves.** The menus read the stock, so they show the lower count at once and a second girl cannot take the last one.
 * - Every way a record leaves the queue unspent (the knock-out, a party exchange, a magic cancel before the gate, the battle's end, a start that returns 0)
 *   goes through the cancel routine, which refunds each reserved id (count + 1, capped at 99; a fresh slot if the item has none) and the reserved gil.
 * - The start gate is the only commit: when it passes, the same routine runs with the flag at 0 and returns nothing, so the later removal of the record
 *   refunds nothing. A gate that fails marks the record aborted and its removal refunds.
 *
 * The engine reaches this through `../adapt/item-ledger.ts`. Vectors: `tests/fixtures/parity/ffx2/item_ledger.json` and `item_queue.json`.
 */

/** The stock table's slot count (the number of item rows, 0x2000 to 0x2043). */
export const STOCK_SLOTS = 0x44;
/** The most of one item a slot holds. */
export const STACK_MAX = 99;
/** The most gil the party holds. */
export const GIL_MAX = 999_999_999;
/** Room for the two item bitmaps: the gained bitmap's 16 words, the used bitmap's 16 words 0x20 bytes on, and the highest word an id can reach in either. */
export const BITMAP_WORDS = 16 + 256;
/** Where the used bitmap starts in {@link StockWorld.bits}, in words. */
export const USED_BITMAP = 16;

/** The party's stock, its gil, the two bitmaps and the "special" id the count function discounts (the first ingredient of a Mix being built). */
export interface StockWorld {
  /** 68 slot ids (16 bits). */
  ids: number[];
  /** 68 counts (a byte; 0 to 99 in play, more only in the vectors' messy worlds). */
  counts: number[];
  /** The gained bitmap (words 0 to 15) then the used bitmap (words 16 to 31) and the words beyond, 16 bits each. */
  bits: number[];
  /** The special id (16 bits). */
  special: number;
  /** The gil (signed 32-bit). */
  gil: number;
}

/** An empty world: every slot free, the bitmaps clear, no gil. */
export function emptyWorld(): StockWorld {
  return { ids: new Array<number>(STOCK_SLOTS).fill(0), counts: new Array<number>(STOCK_SLOTS).fill(0), bits: new Array<number>(BITMAP_WORDS).fill(0), special: 0, gil: 0 };
}

const s32 = (v: number): number => v | 0;
const u32 = (v: number): number => v >>> 0;

/** The game's clamp: raise to `lo` first, then cut to `hi`, in signed 32-bit arithmetic. */
function clamp(v: number, lo: number, hi: number): number {
  let x = s32(v);
  if (x < lo) x = lo;
  if (x > hi) x = hi;
  return x;
}

/** Set the bit for an item id (`id & 0xfff`: word `>> 4`, bit `& 0xf`) in the bitmap that starts at word `base`. */
function setBit(w: StockWorld, base: number, id: number): void {
  const low = id & 0xfff;
  const at = base + (low >> 4);
  w.bits[at] = ((w.bits[at] ?? 0) | (1 << (low & 0xf))) & 0xffff;
}

/**
 * The count of an item (exe 0x00620ba0): the count of the FIRST slot whose id equals it and whose count is not 0; one less when it is the special id (the
 * menus show it so while a Mix is being built); never negative.
 */
export function stockCount(w: StockWorld, id: number): number {
  const want = u32(id);
  for (let k = 0; k < STOCK_SLOTS; k++) {
    if (w.ids[k] === want && (w.counts[k] as number) > 0) {
      let c = w.counts[k] as number;
      if (want === w.special) c -= 1;
      return c >= 0 ? c : 0;
    }
  }
  return 0;
}

/**
 * Add to or take from the stock (exe 0x00620e80): returns 0 when the stock changed, -1 when it did not. An id that is not an item id (`id & 0xfffff000` is not
 * 0x2000) or a delta of 0 does nothing. With a matching slot (the first with the id and a count) the new count is the sum cut to 0 to 99 (a sum past 2^31 wraps
 * and reads as 0), a subtraction larger than the stack is refused by that slot only (the scan goes on), a gain sets the "gained" bit and a spend the "used" bit,
 * and a count that reaches 0 turns the slot's id into 0xff. With no accepting slot a gain fills the first free slot (no bit) and a spend fails.
 */
export function stockAdd(w: StockWorld, id: number, delta: number): number {
  const item = u32(id);
  const d = s32(delta);
  if ((item & 0xfffff000) >>> 0 !== 0x2000 || d === 0) return -1;
  let free = -1;
  for (let k = 0; k < STOCK_SLOTS; k++) {
    const sid = w.ids[k] as number;
    const cnt = w.counts[k] as number;
    if (item === sid && cnt !== 0) {
      if (d >= 0 || cnt + d >= 0) {
        const fresh = clamp(cnt + d, 0, STACK_MAX);
        w.counts[k] = fresh;
        if (fresh !== cnt) {
          if (d > 0) setBit(w, 0, item);
          else if (d < 0) setBit(w, USED_BITMAP, item);
        }
        if (fresh === 0) w.ids[k] = 0xff;
        return 0;
      }
    }
    if ((sid === 0 || cnt === 0) && free < 0) free = k;
  }
  if (free < 0 || d <= 0) return -1;
  w.ids[free] = item & 0xffff;
  w.counts[free] = clamp(d, 0, STACK_MAX);
  return 0;
}

/**
 * Take `amount` from the gil (exe 0x0060d4b0): 0 when the balance stayed non-negative (it becomes the result, cut to 999,999,999), -1 when it would not (the
 * balance stays, but a balance already below 0 becomes 0 and one above the cap becomes the cap). A negative amount adds.
 */
export function gilSubtract(w: StockWorld, amount: number): number {
  const cur = w.gil;
  const diff = s32(cur - s32(amount));
  const negative = diff < 0;
  const result = negative ? cur : diff;
  const ret = negative ? -1 : 0;
  if (result < 0) {
    w.gil = 0;
    return ret;
  }
  w.gil = GIL_MAX;
  if (result <= GIL_MAX) w.gil = result;
  return ret;
}

/** A queued action record: the fields the accounting reads. Every other byte of the game's 0xCC-byte record is the animation machine's. */
export interface ActionRecord {
  /** +0x00: the handle, `(sequence << 8) + chr`. */
  handle: number;
  /** +0x0b: 1 queued, 2 waiting, 3 running, 4 cancelled. */
  state: number;
  /** +0x0e: 1 a player or script command, 2 a system command (Auto-Life, death, exchange). */
  kind: number;
  /** +0x0f: cancel-all and cancel-by-command skip a record whose byte is not 0; cancel-by-handle does not look at it. */
  protect: number;
  /** +0xa4: the command id; an item id is `0x2000 + n`. */
  command: number;
  /** +0x8e, +0x8f: items reserved, items needed (the needed count rises on every reserve call for an item id, success or not). */
  got: number;
  needed: number;
  /** +0x90, +0x92: the two reserved item ids. */
  ids: [number, number];
  /** +0xb0, +0xb4: the gil the command needs, the gil reserved for it. */
  gilNeeded: number;
  gilReserved: number;
  /** +0x1e: a second pass; the gate skips its five failure checks. */
  second: boolean;
  /** +0x17: set by a failed gate. */
  aborted: boolean;
}

/** A record with nothing reserved. */
export function newRecord(command: number, over: Partial<ActionRecord> = {}): ActionRecord {
  return { handle: 0, state: 1, kind: 1, protect: 0, command, got: 0, needed: 0, ids: [0, 0], gilNeeded: 0, gilReserved: 0, second: false, aborted: false, ...over };
}

/** Is this character index a monster slot (0x0f to 0x1e)? Monsters never reserve. */
export function isMonsterSlot(chr: number): boolean {
  const c = chr & 0xff;
  return c >= 0x0f && c < 0x1f;
}

/**
 * Reserve (exe 0x00620d90) for a record of character `chr` and command `cmd`: gil first (when the record needs some and the gil covers it), then, for an item
 * id, one item out of the stock into the first empty id slot of the record. A monster slot returns 0 and changes nothing. The needed count rises whether or not
 * the stock had the item; with both id slots occupied nothing is taken. Returns the command id when an attempt was made, else 0.
 */
export function reserve(w: StockWorld, rec: ActionRecord, chr: number, cmd: number): number {
  if (isMonsterSlot(chr)) return 0;
  const gil = rec.gilNeeded;
  if (gil > 0 && gilSubtract(w, gil) === 0) rec.gilReserved = gil;
  const nibble = s32(cmd) >> 12;
  if (nibble !== 2) return 0;
  rec.needed = (rec.needed + 1) & 0xff;
  let ret = 0;
  for (let i = 0; i < 2; i++) {
    if (rec.ids[i] === 0) {
      ret = u32(cmd);
      if (stockAdd(w, cmd, -1) === 0) {
        rec.got = (rec.got + 1) & 0xff;
        rec.ids[i] = u32(cmd) & 0xffff;
        return ret;
      }
    }
  }
  return ret;
}

/**
 * Refund or commit (exe 0x00620c00). Clears the record's two reserved ids and its counters. With `flag` not 0 (a refund) each reserved item id goes back to
 * its stock slot (count + 1 cut to 0 to 99, so a full stack loses it; a fresh slot with a count of 1 when the item has none) and the reserved gil is added back
 * (to the cap); with `flag` 0 (the commit) nothing returns. Returns the number of occupied id slots, plus one when gil was reserved.
 */
export function refund(w: StockWorld, rec: ActionRecord, flag: number): number {
  let n = 0;
  for (let i = 0; i < 2; i++) {
    const sid = rec.ids[i] as number;
    if (sid === 0) continue;
    n += 1;
    if (flag !== 0 && ((sid & 0xf000) >>> 0) === 0x2000) {
      let found = -1;
      let free = -1;
      for (let k = 0; k < STOCK_SLOTS; k++) {
        const tid = w.ids[k] as number;
        const cnt = w.counts[k] as number;
        if (sid === tid && cnt > 0) {
          found = k;
          break;
        }
        if ((tid === 0 || cnt === 0) && free < 0) free = k;
      }
      if (found >= 0) {
        const old = w.counts[found] as number;
        const fresh = clamp(old + 1, 0, STACK_MAX);
        w.counts[found] = fresh;
        if (fresh !== old) setBit(w, 0, sid);
        if (fresh === 0) w.ids[found] = 0xff;
      } else if (free >= 0) {
        w.ids[free] = sid;
        w.counts[free] = 1;
      }
    }
    rec.ids[i] = 0;
  }
  rec.got = 0;
  rec.needed = 0;
  const gil = rec.gilReserved;
  let ret = n;
  if (gil > 0) {
    if (flag !== 0) gilSubtract(w, -gil);
    ret = n + 1;
  }
  rec.gilReserved = 0;
  return ret;
}

/** What the gate's helpers answered for this record. */
export interface GateInput {
  /** The character's dead byte (queue header +0x1c). */
  dead: boolean;
  /** Every linked record has a non-empty target mask (0x0062c080). */
  targetsOk: boolean;
  /** The usability check's answer (0x0061a840): negative means the command is blocked for her. */
  cost: number;
}

/**
 * The start gate (exe 0x006314c0): fails (returns false, marks the record aborted) when the girl is dead (unless the record is on its second pass), a target mask
 * is empty, the command is unusable, fewer items were reserved than needed, or less gil was reserved than needed. A second-pass record and a dress change (id
 * nibble 5) skip those checks. **A pass is the commit**: the reservation is cleared and nothing is returned to the stock or the gil.
 */
export function startGate(w: StockWorld, rec: ActionRecord, input: GateInput): boolean {
  const nibble = rec.command >> 12;
  const dead = rec.second ? false : input.dead;
  if (nibble !== 5 && !rec.second) {
    if (dead || !input.targetsOk || input.cost < 0 || rec.got < rec.needed || rec.gilReserved < rec.gilNeeded) {
      rec.aborted = true;
      return false;
    }
  }
  refund(w, rec, 0);
  return true;
}

/** One character's command queue: up to eight records in order, and the 24-bit sequence counter the handles come from. */
export interface CommandQueue {
  records: ActionRecord[];
  /** Queue header +0x08: the sequence number (24 bits, never 0 after an add). */
  sequence: number;
}

/** The most records a queue holds. */
export const QUEUE_MAX = 8;

/**
 * Add a record at the tail (exe 0x0062d300): nothing and a return of 0 when the queue already holds eight. Otherwise the handle is
 * `(sequence << 8) + chr`, the record is queued (state 1), and **the reserve runs with its command id**; a reserve that fails undoes nothing. Returns the
 * handle (non-zero).
 */
export function queueAdd(w: StockWorld, queue: CommandQueue, src: ActionRecord, chr: number): number {
  if (queue.records.length >= QUEUE_MAX) return 0;
  let seq = (queue.sequence + 1) & 0xffffff;
  if (seq === 0) seq = 1;
  queue.sequence = seq;
  const rec: ActionRecord = { ...src, ids: [src.ids[0], src.ids[1]], handle: u32((seq << 8) + (chr & 0xff)), state: 1 };
  queue.records.push(rec);
  reserve(w, rec, chr, rec.command);
  return rec.handle;
}

/** Cancel one record (exe 0x0062d120 with a delta of -1): the state becomes 4 (cancelled) and the record **refunds**. */
export function cancelRecord(w: StockWorld, rec: ActionRecord): void {
  rec.state = 4;
  refund(w, rec, 1);
}

/**
 * The cancel family (exe 0x0062c500 all, 0x0062c770 by handle, 0x0062c6a0 by command id, 0x0062c5c0 every queue, and the knock-out's own cancel 0x006424b0):
 * walk the queue in order and cancel (with refund) each record that `matches`, that has a protect byte of 0 when `checkProtect` is set (cancel-by-handle does not
 * look at it), and that is not running (state 3) unless `includeRunning`; the others are kept and packed to the front in their order. Each cancel refunds before
 * the next record is looked at. Returns the number cancelled.
 */
export function cancelWhere(
  w: StockWorld,
  queue: CommandQueue,
  matches: (rec: ActionRecord) => boolean,
  checkProtect: boolean,
  includeRunning: boolean,
): number {
  const kept: ActionRecord[] = [];
  let cancelled = 0;
  for (const rec of queue.records) {
    if (matches(rec) && (!checkProtect || rec.protect === 0) && (rec.state !== 3 || includeRunning)) {
      cancelRecord(w, rec);
      cancelled += 1;
    } else {
      kept.push(rec);
    }
  }
  queue.records = kept;
  return cancelled;
}
