/**
 * Golden vectors for the FFX-2 item ledger kernel (`src/battle/ffx2/kernel/item-ledger.ts`): the stock count (exe 0x00620ba0), the stock add or subtract
 * (0x00620e80), the gil routine (0x0060d4b0), the reserve (0x00620d90), the refund or commit (0x00620c00), the queue add (0x0062d300), the cancel family
 * (0x0062d120, 0x0062c500, 0x0062c770, 0x0062c6a0, 0x006424b0's cancel) and the start gate (0x006314c0).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the checked note FFX2-G06 (357,509 harness vectors, 0 mismatches,
 * **0 random draws** in any of these functions).
 *
 * Where each expectation comes from (the fixtures say it per vector, `src`):
 *   `emulator`  regenerated bit for bit from the note's own proof (one seeded generator, the note's own generator code) and checked, when the fixture was made,
 *               equal to what the emulator logged for that vector (return value and the whole record after): the expected values ARE the real function's.
 *   `oracle`    the note's independent Python model on the same kind of world, which the note proves equal to the real function over 20,000 to 30,000 vectors
 *               per function (the emulator's own logs hold only the first 300 of each proof, and not the stock they ran on).
 * The start-gate vectors (`gate`, 300) are the emulator's own logged answers, replayed directly. The fixtures: item_ledger.json (stock level), item_queue.json
 * (records and queues, projected from the model's byte images; the per-kind level counters and the queue's ATB state byte belong to the animation machine and are
 * not ported). The engine-level behaviour is in `parity-ffx2-item-ledger-engine.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BITMAP_WORDS,
  STOCK_SLOTS,
  cancelRecord,
  cancelWhere,
  emptyWorld,
  gilSubtract,
  newRecord,
  queueAdd,
  refund,
  reserve,
  startGate,
  stockAdd,
  stockCount,
  type ActionRecord,
  type CommandQueue,
  type StockWorld,
} from '../../src/battle/ffx2/kernel/item-ledger.ts';

function load<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`../fixtures/parity/ffx2/${name}`, import.meta.url), 'utf8')) as T;
}

interface WorldPre { i: string; c: string; sp: number; g: number; b: Record<string, number> }
interface WorldPost { s: Array<[number, number, number]>; sp: number; g: number; b: Record<string, number> }
type RecP = [number, number, number, number, number, number];

/** The word every bitmap cell outside the touched ones holds: the kernel must not disturb any of them. */
const sentinel = (idx: number): number => (0xa5a5 ^ (idx * 0x101)) & 0xffff;

function worldOf(w: WorldPre): StockWorld {
  const world = emptyWorld();
  for (let k = 0; k < STOCK_SLOTS; k++) {
    world.ids[k] = parseInt(w.i.slice(k * 4 + 2, k * 4 + 4) + w.i.slice(k * 4, k * 4 + 2), 16);
    world.counts[k] = parseInt(w.c.slice(k * 2, k * 2 + 2), 16);
  }
  for (let idx = 0; idx < BITMAP_WORDS; idx++) world.bits[idx] = sentinel(idx);
  for (const [idx, value] of Object.entries(w.b)) world.bits[Number(idx)] = value;
  world.special = w.sp;
  world.gil = w.g;
  return world;
}

function expectPost(world: StockWorld, pre: StockWorld, post: WorldPost, label: string): void {
  const want = { ids: [...pre.ids], counts: [...pre.counts] };
  for (const [k, id, count] of post.s) {
    want.ids[k] = id;
    want.counts[k] = count;
  }
  expect(world.ids, `${label}: ids`).toEqual(want.ids);
  expect(world.counts, `${label}: counts`).toEqual(want.counts);
  expect(world.special, `${label}: special`).toBe(post.sp);
  expect(world.gil, `${label}: gil`).toBe(post.g);
  for (let idx = 0; idx < BITMAP_WORDS; idx++) {
    const expected = post.b[String(idx)] ?? sentinel(idx);
    if (world.bits[idx] !== expected) throw new Error(`${label}: bitmap word ${idx} is ${world.bits[idx]}, expected ${expected}`);
  }
}

function recOf(command: number, p: RecP): ActionRecord {
  return newRecord(command & 0xffff, { got: p[0], needed: p[1], ids: [p[2], p[3]], gilNeeded: p[4], gilReserved: p[5] });
}

function recP(rec: ActionRecord): RecP {
  return [rec.got, rec.needed, rec.ids[0], rec.ids[1], rec.gilNeeded, rec.gilReserved];
}

interface Src { src: 'emulator' | 'oracle' }
interface StockFile {
  seed: number;
  crossChecked: Record<string, number>;
  count: Array<Src & { item: number; w: WorldPre; out: number }>;
  add: Array<Src & { item: number; delta: number; w: WorldPre; out: number; post: WorldPost }>;
  gil: Array<Src & { gil: number; amount: number; out: number; after: number }>;
  reserve: Array<Src & { chr: number; cmd: number; rec: RecP; w: WorldPre; out: number; recAfter: RecP; post: WorldPost }>;
  refund: Array<Src & { flag: number; rec: RecP; w: WorldPre; out: number; recAfter: RecP; post: WorldPost }>;
}

describe('FFX-2 item ledger, stock level (harness vectors)', () => {
  const file = load<StockFile>('item_ledger.json');

  it('every function was cross-checked against the emulator log when the fixture was made, and the fixture keeps emulator-checked and oracle vectors of each', () => {
    for (const key of ['count', 'add', 'gil', 'reserve', 'refund']) {
      expect(file.crossChecked[key], key).toBe(300);
      const rows = file[key as 'count'];
      expect(rows.filter((r) => r.src === 'emulator').length, `${key} emulator`).toBeGreaterThanOrEqual(60);
      expect(rows.filter((r) => r.src === 'oracle').length, `${key} oracle`).toBeGreaterThanOrEqual(15);
    }
  });

  it('stock count (0x620ba0): the first slot with the id and a count, one less for the special id', () => {
    for (const v of file.count) expect(stockCount(worldOf(v.w), v.item)).toBe(v.out);
    // restated: the special id (the first ingredient of a Mix being built) shows one fewer
    const w = emptyWorld();
    w.ids[3] = 0x2006;
    w.counts[3] = 2;
    expect(stockCount(w, 0x2006)).toBe(2);
    w.special = 0x2006;
    expect(stockCount(w, 0x2006)).toBe(1);
  });

  it('stock add or subtract (0x620e80): the return, the table, both bitmaps and nothing else', () => {
    expect(file.add.length).toBeGreaterThan(150);
    for (const [i, v] of file.add.entries()) {
      const w = worldOf(v.w);
      const pre = worldOf(v.w);
      expect(stockAdd(w, v.item, v.delta), `vector ${i}`).toBe(v.out);
      expectPost(w, pre, v.post, `add ${i}`);
    }
  });

  it('gil subtract or add (0x60d4b0): the cap, the refusal, a negative amount adds', () => {
    for (const v of file.gil) {
      const w = emptyWorld();
      w.gil = v.gil;
      expect(gilSubtract(w, v.amount)).toBe(v.out);
      expect(w.gil).toBe(v.after);
    }
  });

  it('reserve (0x620d90): one item out of the stock into the record, gil first, a monster never', () => {
    expect(file.reserve.length).toBeGreaterThan(150);
    for (const [i, v] of file.reserve.entries()) {
      const w = worldOf(v.w);
      const pre = worldOf(v.w);
      const rec = recOf(v.cmd, v.rec);
      expect(reserve(w, rec, v.chr, v.cmd), `vector ${i}`).toBe(v.out);
      expect(recP(rec), `record ${i}`).toEqual(v.recAfter);
      expectPost(w, pre, v.post, `reserve ${i}`);
    }
  });

  it('refund and commit (0x620c00): flag 1 returns each reserved item (cap 99) and the gil, flag 0 returns nothing; both clear the record', () => {
    expect(file.refund.length).toBeGreaterThan(150);
    for (const [i, v] of file.refund.entries()) {
      const w = worldOf(v.w);
      const pre = worldOf(v.w);
      const rec = recOf(0x2000, v.rec);
      expect(refund(w, rec, v.flag), `vector ${i}`).toBe(v.out);
      expect(recP(rec), `record ${i}`).toEqual(v.recAfter);
      expectPost(w, pre, v.post, `refund ${i}`);
    }
  });

  it('the note\'s named cases, restated: the last Phoenix Down is taken once; a cancel gives it back; the commit keeps it; the cap loses the 100th; a monster never reserves', () => {
    const PD = 0x2006;
    const stock = (count: number): StockWorld => {
      const w = emptyWorld();
      w.ids[0] = PD;
      w.counts[0] = count;
      return w;
    };
    // two girls, one Phoenix Down (scenario H)
    const w = stock(1);
    const a = newRecord(PD);
    const b = newRecord(PD);
    reserve(w, a, 0, PD);
    reserve(w, b, 1, PD);
    expect([a.got, a.needed]).toEqual([1, 1]);
    expect([b.got, b.needed]).toEqual([0, 1]); // the second finds no stock
    expect(stockCount(w, PD)).toBe(0);
    expect(startGate(w, b, { dead: false, targetsOk: true, cost: 0 })).toBe(false); // her gate fails ...
    expect(b.aborted).toBe(true);
    refund(w, b, 1); // ... and the removal refunds nothing
    expect(stockCount(w, PD)).toBe(0);
    // the first girl's gate passes and commits: the item stays spent, the removal after it refunds nothing
    expect(startGate(w, a, { dead: false, targetsOk: true, cost: 0 })).toBe(true);
    cancelRecord(w, a);
    expect(stockCount(w, PD)).toBe(0);
    // a cancel before the gate gives it back
    const v = stock(2);
    const c = newRecord(PD);
    reserve(v, c, 0, PD);
    expect(stockCount(v, PD)).toBe(1);
    cancelRecord(v, c);
    expect(stockCount(v, PD)).toBe(2);
    // the cap: a full stack loses the returned item
    const full = stock(99);
    const d = newRecord(PD);
    reserve(full, d, 0, PD);
    expect(stockCount(full, PD)).toBe(98);
    full.counts[0] = 99;
    refund(full, d, 1);
    expect(stockCount(full, PD)).toBe(99);
    // monsters (0x0f to 0x1e) never reserve
    const m = stock(5);
    const e = newRecord(PD);
    expect(reserve(m, e, 0x10, PD)).toBe(0);
    expect(stockCount(m, PD)).toBe(5);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// Records and queues

type RecQ = [number, number, number, number, number, number, number, number, number, number, number, number, number];

/** The projection of a record the queue fixtures use: [handle, state, kind, protect, command, got, needed, id0, id1, gilNeeded, gilReserved, second, aborted]. */
function qrec(p: RecQ): ActionRecord {
  return {
    handle: p[0], state: p[1], kind: p[2], protect: p[3], command: p[4], got: p[5], needed: p[6], ids: [p[7], p[8]], gilNeeded: p[9], gilReserved: p[10],
    second: p[11] !== 0, aborted: p[12] !== 0,
  };
}

function qproj(r: ActionRecord): RecQ {
  return [r.handle >>> 0, r.state, r.kind, r.protect, r.command, r.got, r.needed, r.ids[0], r.ids[1], r.gilNeeded, r.gilReserved, r.second ? 1 : 0, r.aborted ? 1 : 0];
}

interface QueueFile {
  add: Array<{ w: WorldPre; chr: number; seq: number; src: RecQ; q: RecQ[]; out: number; after: RecQ[]; seqAfter: number; post: WorldPost }>;
  cancelOne: Array<{ w: WorldPre; rec: RecQ; after: RecQ; post: WorldPost }>;
  cancel: Array<{ kind: 'all' | 'handle' | 'command'; p3: number; arg: number; w: WorldPre; q: RecQ[]; n: number; after: RecQ[]; post: WorldPost }>;
  gate: Array<{ cmd: number; rec: RecQ; dead: number; cost: number; tgt: number; out: number }>;
}

describe('FFX-2 item ledger, queue level (harness vectors)', () => {
  const file = load<QueueFile>('item_queue.json');

  it('queue add (0x62d300): nothing when eight are queued, otherwise the handle, state 1 and the reserve with the command id', () => {
    expect(file.add.length).toBeGreaterThanOrEqual(90);
    let full = 0;
    for (const [i, v] of file.add.entries()) {
      const w = worldOf(v.w);
      const pre = worldOf(v.w);
      const queue: CommandQueue = { records: v.q.map(qrec), sequence: v.seq };
      const handle = queueAdd(w, queue, qrec(v.src), v.chr);
      expect(handle >>> 0 === 0 ? 0 : 1, `vector ${i}`).toBe(v.out);
      expect(queue.records.map(qproj), `queue ${i}`).toEqual(v.after);
      expect(queue.sequence, `sequence ${i}`).toBe(v.seqAfter);
      expectPost(w, pre, v.post, `add ${i}`);
      if (v.out === 0) full += 1;
    }
    expect(full).toBeGreaterThan(5);
  });

  it('cancel one (0x62d120, delta -1): the state becomes 4 and the record refunds', () => {
    expect(file.cancelOne.length).toBeGreaterThanOrEqual(90);
    for (const [i, v] of file.cancelOne.entries()) {
      const w = worldOf(v.w);
      const pre = worldOf(v.w);
      const rec = qrec(v.rec);
      cancelRecord(w, rec);
      expect(qproj(rec), `record ${i}`).toEqual(v.after);
      expectPost(w, pre, v.post, `cancel ${i}`);
    }
  });

  it('cancel all, by handle, by command id (0x62c500, 0x62c770, 0x62c6a0): which records go, what they refund, how the rest is packed', () => {
    expect(file.cancel.length).toBeGreaterThanOrEqual(180);
    const kinds = new Set<string>();
    for (const [i, v] of file.cancel.entries()) {
      const w = worldOf(v.w);
      const pre = worldOf(v.w);
      const queue: CommandQueue = { records: v.q.map(qrec), sequence: 0 };
      const running = v.p3 === 1;
      const matches = v.kind === 'all' ? () => true : v.kind === 'handle' ? (r: ActionRecord) => r.handle >>> 0 === v.arg : (r: ActionRecord) => r.command === v.arg;
      const n = cancelWhere(w, queue, matches, v.kind !== 'handle', running);
      expect(n, `count ${i}`).toBe(v.n);
      expect(queue.records.map(qproj), `queue ${i}`).toEqual(v.after);
      expectPost(w, pre, v.post, `cancel ${i}`);
      kinds.add(`${v.kind}/${running}/${n > 0}`);
    }
    expect(kinds.size).toBeGreaterThanOrEqual(8);
  });

  it('the start gate (0x6314c0), replayed against what the emulator logged: five checks, a second pass skips them, a pass is the commit', () => {
    expect(file.gate.length).toBeGreaterThanOrEqual(300);
    let passes = 0;
    let fails = 0;
    for (const [i, v] of file.gate.entries()) {
      const w = emptyWorld();
      const rec = qrec(v.rec);
      rec.command = v.cmd;
      const ok = startGate(w, rec, { dead: v.dead !== 0, targetsOk: v.tgt !== 0, cost: v.cost });
      expect(ok ? 1 : 0, `gate ${i}`).toBe(v.out);
      if (ok) {
        passes += 1;
        expect([rec.got, rec.needed, rec.ids[0], rec.ids[1], rec.gilReserved], `committed ${i}`).toEqual([0, 0, 0, 0, 0]); // the commit cleared the reservation
      } else {
        fails += 1;
        expect(rec.aborted).toBe(true);
      }
    }
    expect(passes).toBeGreaterThan(30);
    expect(fails).toBeGreaterThan(30);
  });
});
