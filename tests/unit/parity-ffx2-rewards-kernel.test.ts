/**
 * Kernel parity for FFX-2's kill rewards (re-parity RC9, lane X2-C; **FFX-2 only**): the item function, the reward roll with its
 * per-owner modifiers, the AP gain, and the end-of-battle rollback (`kernel/kill-rewards.ts`).
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), functions 0x00624890, 0x006246d0 with 0x006244c0, 0x00635590,
 * 0x00624450 and 0x006244a0; note FFX2-G03 sections 3 to 5 and 7. A vector is the answer of the REAL game function, run in the
 * emulator harness on the live exe with the random generator scripted; `tests/fixtures/parity/ffx2/kill_rewards.json` is a
 * stratified pick of the vectors that matched the note's independent Python models with no difference (60,000 for the item function,
 * 60,000 for the roll, 40,000 for the AP gain). The hand-worked tests restate the note's own examples with the arithmetic shown.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): Gillionaire or Double Items counted once; Butterfingers
 * ignored or compounding; Item Hunter counted once; the chain terms dropped from the drop test or from the rare test; `<` made `<=`;
 * a zero drop byte still dropping; an ejected owner counted; Pointless ignored; Double EXP carried to the next owner; Triple AP
 * replacing Double AP; no pool cap; a dead or Petrified owner credited; the rollback sparing a dead girl.
 */

import { describe, expect, it } from 'vitest';
import {
  AP_POOL_CAP,
  addItem,
  apGain,
  commitStart,
  killRoll,
  newRewardBuffer,
  rollbackEnd,
  type ApOwner,
  type RewardBuffer,
  type RewardOwner,
  type RewardVictim,
} from '../../src/battle/ffx2/kernel/kill-rewards.ts';
import { arr, inOf, kernelCheck, num, outOf, recs, sub, vectorsOf, type Rec } from './helpers/ffx2AtbAdapters.ts';
import { scriptedDraw } from './helpers/ffx2ParityFixture.ts';

/** The fixture's results record as a kernel buffer. */
function bufferOf(r: Rec): RewardBuffer {
  const buffer = newRewardBuffer(9);
  buffer.exp = num(r, 'exp');
  buffer.gil = num(r, 'gil');
  (r['rec'] as number[][]).forEach(([snap, pend], i) => {
    const record = buffer.rec[i];
    if (record !== undefined) Object.assign(record, { snap, pend });
  });
  buffer.lists.count = [...arr(r, 'cnt')];
  buffer.lists.ids = (r['ids'] as number[][]).map((x) => [...x]);
  buffer.lists.qty = (r['qty'] as number[][]).map((x) => [...x]);
  return buffer;
}

/** The buffer as the fixture writes a result. */
function resultOf(b: RewardBuffer): Rec {
  return { exp: b.exp, gil: b.gil, rec: b.rec.map((x) => [x.snap, x.pend]), cnt: b.lists.count, ids: b.lists.ids, qty: b.lists.qty };
}

function ownerOf(r: Rec): RewardOwner {
  return { present: num(r, 'f1784') !== 0, ejected: num(r, 'f1792') !== 0, word1: num(r, 'auto652'), pointless: (num(r, 'status436') & 1) !== 0, saveIndex: num(r, 'saveIndex') };
}

function victimOf(r: Rec): RewardVictim {
  const items = r['items'] as number[][];
  return {
    exp: num(r, 'exp'), ap: num(r, 'ap'), gil: num(r, 'gil'), dropByte: num(r, 'dropByte'), chain: num(r, 'chain'), best: num(r, 'best'),
    items: [[items[0]![0]!, items[0]![1]!], [items[1]![0]!, items[1]![1]!]],
  };
}

const fx = kernelCheck('kill_rewards');

describe('golden vectors: the item function (0x00624890)', () => {
  it('the fixture is there and is a pick of every group', () => {
    expect(fx).not.toBeNull();
    expect(vectorsOf(fx!, 'item').length).toBeGreaterThan(120);
    expect(vectorsOf(fx!, 'roll').length).toBeGreaterThan(120);
    expect(vectorsOf(fx!, 'ap_gain').length).toBeGreaterThan(200);
  });

  it('every item lands in the lists the game puts it in (all 16 nibbles, quantities from -5 to 2^31, multipliers, full lists, ids already listed)', () => {
    const items = vectorsOf(fx!, 'item');
    expect(items.some((v) => (num(inOf(v), 'item') >> 12) === 2 && num(inOf(v), 'mult') > 1)).toBe(true); // a multiplier on a consumable
    expect(items.some((v) => arr(sub(inOf(v), 'before'), 'cnt').some((c) => c === 8))).toBe(true); // a full list
    for (const v of items) {
      const buffer = bufferOf(sub(inOf(v), 'before'));
      addItem(buffer, num(inOf(v), 'item'), num(inOf(v), 'qty'), num(inOf(v), 'mult'));
      expect(resultOf(buffer), `vector ${v.id}`).toEqual(outOf(v));
    }
  });
});

describe('golden vectors: the reward roll (0x006246d0 with 0x006244c0)', () => {
  const rolls = vectorsOf(fx!, 'roll');

  it('the pick has drops, rare slots, every reward ability and the edge cases', () => {
    const party = (v: (typeof rolls)[number]): Rec[] => recs(inOf(v), 'party');
    const dropped = rolls.filter((v) => (v.rngDraws ?? []).length === 2);
    expect(dropped.length).toBeGreaterThan(40);
    expect(rolls.some((v) => (v.rngDraws ?? []).length === 1)).toBe(true);
    for (const bit of [0x02, 0x10, 0x20, 0x40, 0x200]) expect(rolls.some((v) => party(v).some((p) => (num(p, 'auto652') & bit) !== 0)), `bit ${bit}`).toBe(true);
    expect(rolls.some((v) => party(v).some((p) => num(p, 'f1792') !== 0))).toBe(true); // an ejected slot
    expect(rolls.some((v) => party(v).some((p) => (num(p, 'status436') & 1) !== 0))).toBe(true); // Pointless
    expect(rolls.some((v) => num(sub(inOf(v), 'victim'), 'dropByte') === 0)).toBe(true);
  });

  it('every roll writes the buffer the game writes, calls the AP gain as the game does, and draws the streams the game drew', () => {
    for (const v of rolls) {
      const buffer = bufferOf(sub(inOf(v), 'before'));
      const script = scriptedDraw(v.rngDraws);
      const debug = sub(inOf(v), 'debug');
      const result = killRoll(victimOf(sub(inOf(v), 'victim')), recs(inOf(v), 'party').map(ownerOf), buffer, script.draw, {
        gil100: num(debug, 'gil100') !== 0,
        drop: num(debug, 'drop') !== 0,
        rare: num(debug, 'rare') !== 0,
      });
      const label = `vector ${v.id}`;
      expect(resultOf(buffer), label).toEqual(outOf(v)['results']);
      expect(result.apCalls.map((c) => [c.slot, c.ap]), label).toEqual(outOf(v)['apCalls']);
      expect(result.draws, label).toEqual((v.rngDraws ?? []).map((d) => d.stream));
      expect(script.calls(), label).toBe((v.rngDraws ?? []).length);
    }
  });
});

describe('golden vectors: the AP gain (0x00635590)', () => {
  const gains = vectorsOf(fx!, 'ap_gain');

  it('the pick spends, caps, and refuses the monster slots, the captured saves, the dead and the Petrified', () => {
    expect(gains.some((v) => (outOf(v)['spend'] as unknown[]).length > 0)).toBe(true);
    expect(gains.some((v) => num(sub(inOf(v), 'chr'), 'dead') !== 0)).toBe(true);
    expect(gains.some((v) => (num(sub(inOf(v), 'chr'), 'status434') & 2) !== 0)).toBe(true);
    expect(gains.some((v) => num(inOf(v), 'slot') >= 15 && num(inOf(v), 'slot') < 31)).toBe(true);
    expect(gains.some((v) => (num(sub(inOf(v), 'chr'), 'auto650') & 0x3000) === 0x3000)).toBe(true); // Double and Triple AP together
  });

  it('the new pool and the AP to spend are the game\'s', () => {
    for (const v of gains) {
      const c = sub(inOf(v), 'chr');
      const owner: ApOwner = {
        slot: num(inOf(v), 'slot'), saveIndex: num(c, 'saveIndex'), dead: num(c, 'dead') !== 0, petrified: (num(c, 'status434') & 2) !== 0,
        pointless: (num(c, 'status436') & 1) !== 0, word0: num(c, 'auto650'), pool: num(c, 'cur'), cap: num(c, 'cap'),
      };
      const r = apGain(owner, num(inOf(v), 'ap'));
      const spend = r.spend > 0 ? [[owner.slot, r.spend]] : [];
      expect({ pool: r.pool, spend }, `vector ${v.id}`).toEqual({ pool: outOf(v)['pool'], spend: outOf(v)['spend'] });
    }
  });
});

describe('the note\'s worked examples (FFX2-G03 sections 4.5, 4.7, 5.2)', () => {
  const girl = (word1 = 0, saveIndex = 0, extra: Partial<RewardOwner> = {}): RewardOwner => ({ present: true, ejected: false, word1, pointless: false, saveIndex, ...extra });
  const party = (...words: number[]): RewardOwner[] => {
    const out: RewardOwner[] = words.map((w, i) => girl(w, i));
    while (out.length < 9) out.push({ present: false, ejected: false, word1: 0, pointless: false, saveIndex: out.length });
    return out;
  };
  const victim = (over: Partial<RewardVictim> = {}): RewardVictim => ({ exp: 100, ap: 5, gil: 1000, dropByte: 255, chain: 0, best: 0, items: [[0x2008, 1], [0x2009, 1]], ...over });
  /** A scripted draw: stream 10 hands `a`, stream 11 hands `b`. */
  const draws = (a: number, b: number) => (stream: number): number => (stream === 10 ? a : b);

  it('every owner gets the full EXP; Double EXP doubles only her own (a Double EXP girl does not pass it on)', () => {
    const buffer = newRewardBuffer();
    killRoll(victim(), party(0, 0x40, 0), buffer, draws(0, 0));
    expect([0, 1, 2].map((i) => buffer.rec[i]!.pend)).toEqual([100, 200, 100]);
    expect(buffer.exp).toBe(100); // the results total is the plain sum
  });

  it('Gillionaire doubles once per owner (x8 for three girls); a Pointless owner takes no EXP but still compounds', () => {
    const buffer = newRewardBuffer();
    killRoll(victim(), party(0x10, 0x10, 0x10), buffer, draws(0, 0));
    expect(buffer.gil).toBe(8000);
    const pointless = newRewardBuffer();
    const owners = party(0x10, 0, 0);
    owners[0] = girl(0x10, 0, { pointless: true });
    killRoll(victim(), owners, pointless, draws(0, 0));
    expect(pointless.rec[0]!.pend).toBe(0);
    expect(pointless.gil).toBe(2000);
  });

  it('an ejected or absent slot is not an owner: no EXP, no ability, no AP call', () => {
    const buffer = newRewardBuffer();
    const owners = party(0x10, 0x10, 0x10);
    owners[1] = girl(0x10, 1, { ejected: true });
    owners[2] = girl(0x10, 2, { present: false });
    const r = killRoll(victim(), owners, buffer, draws(0, 0));
    expect(buffer.gil).toBe(2000);
    expect(r.apCalls).toEqual([{ slot: 0, ap: 5 }]);
    expect([1, 2].map((i) => buffer.rec[i]!.pend)).toEqual([0, 0]);
  });

  it('every roll draws stream 10 once, even for a victim with nothing to drop; stream 11 only after the drop test', () => {
    const none = killRoll(victim({ dropByte: 0, items: [[0, 0], [0, 0]] }), party(0, 0, 0), newRewardBuffer(), draws(0, 0));
    expect(none.draws).toEqual([10]);
    expect(none.dropped).toBe(false);
    const passed = killRoll(victim(), party(0, 0, 0), newRewardBuffer(), draws(254, 0));
    expect(passed.draws).toEqual([10, 11]);
    const failed = killRoll(victim({ dropByte: 128 }), party(0, 0, 0), newRewardBuffer(), draws(128, 0)); // 128 is not below 128
    expect(failed.draws).toEqual([10]);
  });

  it('the drop test: a byte of 128 drops on 128 of the 255 draws (50.2 percent); the chains and each Item Hunter owner raise the threshold', () => {
    const lands = (over: Partial<RewardVictim>, words: number[], q: number): boolean => killRoll(victim(over), party(...words), newRewardBuffer(), draws(q, 0)).dropped;
    expect(lands({ dropByte: 128 }, [0, 0, 0], 127)).toBe(true);
    expect(lands({ dropByte: 128 }, [0, 0, 0], 128)).toBe(false);
    expect(lands({ dropByte: 128, chain: 10, best: 10 }, [0, 0, 0], 147)).toBe(true); // 128 + 10 + 10 = 148
    expect(lands({ dropByte: 128, chain: 10, best: 10 }, [0, 0, 0], 148)).toBe(false);
    expect(lands({ dropByte: 128 }, [0x200, 0x200, 0], 255 - 1)).toBe(true); // +64 per owner: 256 passes every draw
    expect(lands({ dropByte: 0, chain: 99, best: 99 }, [0x200, 0x200, 0x200], 0)).toBe(false); // a zero byte never drops
    expect(lands({ dropByte: 255 }, [0, 0, 0], 254)).toBe(true); // 255 always drops
  });

  it('the rare slot: 32 of 256 at no chain (12.5 percent), the chains add to it, Butterfingers makes it certain', () => {
    const slot = (over: Partial<RewardVictim>, words: number[], b: number): number => {
      const buffer = newRewardBuffer();
      killRoll(victim(over), party(...words), buffer, draws(0, b));
      return buffer.lists.ids[0]![0]!;
    };
    expect(slot({}, [0, 0, 0], 31)).toBe(0x2009); // rare
    expect(slot({}, [0, 0, 0], 32)).toBe(0x2008); // common
    expect(slot({ chain: 10, best: 10 }, [0, 0, 0], 51)).toBe(0x2009); // 32 + 20 = 52
    expect(slot({ chain: 10, best: 10 }, [0, 0, 0], 52)).toBe(0x2008);
    expect(slot({}, [0x02, 0, 0], 255)).toBe(0x2009); // 8 x 32 = 256: certain
    expect(slot({}, [0x02, 0x02, 0x02], 255)).toBe(0x2009); // it sets 8, it does not compound
    expect(slot({ dropByte: 128 }, [0x200, 0x200, 0], 255)).toBe(0x2008); // Item Hunter never touches the rare share
  });

  it('Double Items doubles consumables per owner and nothing else', () => {
    const buffer = newRewardBuffer();
    killRoll(victim({ items: [[0x2008, 1], [0x2008, 1]] }), party(0x20, 0x20, 0), buffer, draws(0, 255));
    expect(buffer.lists.qty[0]![0]).toBe(4);
    const accessory = newRewardBuffer();
    killRoll(victim({ items: [[0x9002, 1], [0x9002, 1]] }), party(0x20, 0x20, 0x20), accessory, draws(0, 255));
    expect(accessory.lists.qty[1]![0]).toBe(1);
  });

  it('the lists: 8 ids a category, a ninth is dropped, stacks stop at 99 (key items and grids at 1)', () => {
    const buffer = newRewardBuffer();
    for (let i = 0; i < 9; i++) addItem(buffer, 0x2000 + i, 1, 1);
    expect(buffer.lists.count[0]).toBe(8);
    expect(buffer.lists.ids[0]).not.toContain(0x2008);
    addItem(buffer, 0x2000, 150, 1);
    expect(buffer.lists.qty[0]![0]).toBe(99);
    addItem(buffer, 0x7029, 5, 1);
    addItem(buffer, 0x6001, 2, 1);
    expect([buffer.lists.qty[2]![0], buffer.lists.qty[4]![0]]).toEqual([1, 1]);
    addItem(buffer, 0x3123, 1, 1); // an id of no category
    addItem(buffer, 0, 1, 1);
    expect(buffer.lists.count).toEqual([8, 0, 1, 0, 1]);
  });

  it('the AP gain: the row\'s AP, x2 Double AP, x3 Triple AP, x6 both, none under Pointless; the pool is cut to 99 for the battle', () => {
    const owner = (over: Partial<ApOwner> = {}): ApOwner => ({ slot: 0, saveIndex: 0, dead: false, petrified: false, pointless: false, word0: 0, pool: 0, cap: AP_POOL_CAP, ...over });
    expect(apGain(owner(), 15)).toEqual({ eligible: true, pool: 15, spend: 15 });
    expect(apGain(owner({ word0: 0x1000 }), 15).spend).toBe(30);
    expect(apGain(owner({ word0: 0x2000 }), 15).spend).toBe(45);
    expect(apGain(owner({ word0: 0x3000 }), 15).spend).toBe(90);
    expect(apGain(owner({ word0: 0x3000 }), 50)).toEqual({ eligible: true, pool: 99, spend: 99 }); // a 50 AP boss with both pays 99, not 300
    expect(apGain(owner({ pool: 90 }), 15)).toEqual({ eligible: true, pool: 99, spend: 9 }); // only the part that fits under the cap
    expect(apGain(owner({ pool: 99 }), 15)).toEqual({ eligible: true, pool: 99, spend: 0 });
    expect(apGain(owner({ pointless: true }), 15)).toEqual({ eligible: true, pool: 0, spend: 0 });
    expect(apGain(owner({ dead: true }), 15).eligible).toBe(false);
    expect(apGain(owner({ petrified: true }), 15).eligible).toBe(false);
    expect(apGain(owner({ slot: 15 }), 15).eligible).toBe(false); // a monster slot
    expect(apGain(owner({ saveIndex: 0x10 }), 15).eligible).toBe(false); // a captured monster's save
  });

  it('the end of the battle: a girl who is dead or Petrified loses the EXP she gained; one who stands keeps it all', () => {
    const buffer = newRewardBuffer();
    killRoll(victim(), party(0, 0, 0), buffer, draws(0, 0));
    killRoll(victim(), party(0, 0, 0), buffer, draws(0, 0));
    expect([0, 1, 2].map((i) => buffer.rec[i]!.pend)).toEqual([200, 200, 200]);
    rollbackEnd(buffer, [false, true, false, false, false, false, false, false, false], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect([0, 1, 2].map((i) => buffer.rec[i]!.pend)).toEqual([200, 0, 200]);
    expect(buffer.exp).toBe(200); // the total on the screen does not change
    commitStart(buffer);
    expect(buffer.rec[0]!.snap).toBe(200);
  });
});
