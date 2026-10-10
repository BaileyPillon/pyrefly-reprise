/**
 * Parity tests for the FFX steal and kill-reward kernels (`src/battle/ffx/kernel/steal-rewards.ts`, `drops.ts`,
 * `gear-drop.ts`, `ap-award.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: Steal 0x78b760, Pilfer Gil
 * 0x78b920, Bribe 0x78bdd0, kill rewards 0x7990d0, gear drop 0x798c10, AP award 0x798a00, reward list 0x798ac0, AP settle
 * 0x798b70. Spec: `research/re-ffx-overdrive-steal-aeons.md` section 3.
 *
 * The first blocks are hand-worked: the arithmetic is in the comments. The last block replays the golden vectors
 * (`tests/fixtures/parity/ffx/steal_*.json`, `drops_*.json`): every one is a run of the game's own machine code in an x86-32
 * emulator with only the RNG function replaced by a script, and the kernel must make the same draws on the same streams.
 */

import { describe, expect, it } from 'vitest';
import { addReward, rollDrops, settleAp, type DropLoot, type DropsInput, type RewardList } from '../../src/battle/ffx/kernel/drops.ts';
import { gearEntryBytes, rollGearDrop, type GearEntry, type GearLoot } from '../../src/battle/ffx/kernel/gear-drop.ts';
import { bribe, stealGil, stealItem, type StealLoot, type StealOptions } from '../../src/battle/ffx/kernel/steal-rewards.ts';
import { loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import { runDropsVector } from './helpers/ffxDropsAdapters.ts';
import { runStealVector } from './helpers/ffxStealAdapters.ts';

/** A `draw` that returns the next value of a list whatever the stream, and logs the streams asked. */
function script(values: number[]): { draw: (stream: number) => number; streams: number[] } {
  const streams: number[] = [];
  let i = 0;
  return {
    draw: (stream) => {
      streams.push(stream);
      if (i >= values.length) throw new Error(`asked for draw ${i + 1}, scripted ${values.length}`);
      return values[i++] as number;
    },
    streams,
  };
}

const OPTS: StealOptions = { demoMode: 0, language: 1 };
const loot = (over: Partial<StealLoot> = {}): StealLoot => ({ chance: 100, commonId: 0x2001, rareId: 0x2005, commonQty: 3, rareQty: 1, ...over });
const victim = (): { stealCount: number; lastAttacker: number } => ({ stealCount: 0, lastAttacker: 0 });

describe('Steal (0x78b760)', () => {
  it('succeeds when draw % 255 is below the chance: 99 passes a chance of 100, 100 does not', () => {
    const ok = script([99, 0xff]); // 99 % 255 = 99 < 100; the rare byte 0xff is not below 0x20: the common item
    const l = loot();
    const r = stealItem(l, 0, 0, victim(), { count: 0 }, OPTS, ok.draw);
    expect(r.inventoryAdd).toEqual([0x2001, 3]);
    expect(ok.streams).toEqual([10, 11]);
    const bad = script([100]);
    const l2 = loot();
    const r2 = stealItem(l2, 0, 0, victim(), { count: 0 }, OPTS, bad.draw);
    expect(r2.inventoryAdd).toBeNull();
    expect(bad.streams).toEqual([10]); // a failed roll never draws the rare roll
    expect(r2.qtyWord).toBe(0xffff); // "something to steal" placeholder
    expect(l2.chance).toBe(100); // unchanged
  });

  it('the chance halves after every success and never goes below 1: 255, 127, 63, 31, 15, 7, 3, 1, 1', () => {
    const l = loot({ chance: 255 });
    const seen: number[] = [l.chance];
    for (let k = 0; k < 8; k++) {
      stealItem(l, 0, 0, victim(), { count: 0 }, OPTS, script([0, 0xff]).draw);
      seen.push(l.chance); // 255 * 50 / 100 = 127, 127 -> 63, 63 -> 31, 31 -> 15, 15 -> 7, 7 -> 3, 3 -> 1, 1 -> 0 -> 1
    }
    expect(seen).toEqual([255, 127, 63, 31, 15, 7, 3, 1, 1]);
  });

  it('the rare item: a low byte below 0x20 (1 in 8), 0x80 (1 in 2) with auto-ability bit 7, always with bit 8', () => {
    const rare = (low: number, auto: number): boolean => {
      const l = loot({ chance: 255 });
      return stealItem(l, auto, 0, victim(), { count: 0 }, OPTS, script([0, low]).draw).itemId === 0x2005;
    };
    expect([rare(0x1f, 0), rare(0x20, 0)]).toEqual([true, false]);
    expect([rare(0x7f, 0x80), rare(0x80, 0x80)]).toEqual([true, false]);
    expect(rare(0xff, 0x100)).toBe(true); // threshold 0x100: every byte is below it
  });

  it('a rare slot with no quantity or a non-item id falls back to the common item', () => {
    const noQty = loot({ chance: 255, rareQty: 0 });
    expect(stealItem(noQty, 0, 0, victim(), { count: 0 }, OPTS, script([0, 0]).draw).itemId).toBe(0x2001);
    const notItem = loot({ chance: 255, rareId: 0x3000 });
    expect(stealItem(notItem, 0, 0, victim(), { count: 0 }, OPTS, script([0, 0]).draw).itemId).toBe(0x2001);
  });

  it('a missed hit spends the draw but steals nothing and does not halve; no record means no draw at all', () => {
    const l = loot({ chance: 255 });
    const s = script([0]);
    const r = stealItem(l, 0, 1, victim(), { count: 0 }, OPTS, s.draw);
    expect(r.inventoryAdd).toBeNull();
    expect(l.chance).toBe(255);
    expect(s.streams).toEqual([10]);
    const none = script([]);
    expect(stealItem(null, 0, 0, victim(), { count: 0 }, OPTS, none.draw).attempted).toBe(false);
    expect(none.streams).toEqual([]);
  });

  it('nothing is stealable with chance 0, quantity 0, a non-item id, or demo mode 2: the placeholder stays 0 and no roll can pass', () => {
    for (const l of [loot({ chance: 0 }), loot({ commonQty: 0 }), loot({ commonId: 0x3001 })]) {
      const r = stealItem(l, 0, 0, victim(), { count: 0 }, OPTS, script([0]).draw);
      expect([r.qtyWord, r.inventoryAdd]).toEqual([0, null]);
    }
    const demo = stealItem(loot({ chance: 255 }), 0, 0, victim(), { count: 0 }, { ...OPTS, demoMode: 2 }, script([0]).draw);
    expect(demo.inventoryAdd).toBeNull();
  });

  it('counts steals on the target (stops at 255), counts Rikku\'s steals and raises the achievement from the 200th', () => {
    const t = { stealCount: 254, lastAttacker: 6 };
    const rikku = { count: 198 };
    const run = (): number | null => stealItem(loot({ chance: 255 }), 0, 0, t, rikku, OPTS, script([0, 0xff]).draw).achievement;
    expect([run(), run(), run(), run()]).toEqual([null, 4, 4, 4]); // counter 199, 200, 201, 202: the call comes from 200 on
    expect(t.stealCount).toBe(255);
    expect(rikku.count).toBe(202);
  });

  it('in language 11 a Rename Card is exchanged for 2 Gambler\'s Spirits, in the loot record as well', () => {
    const l = loot({ chance: 255, commonId: 0x2065, commonQty: 1 });
    const r = stealItem(l, 0, 0, victim(), { count: 0 }, { ...OPTS, language: 11 }, script([0, 0xff]).draw);
    expect(r.inventoryAdd).toEqual([0x206d, 2]);
    expect([l.commonId, l.commonQty]).toEqual([0x206d, 2]);
  });
});

describe('Pilfer Gil (0x78b920)', () => {
  const gil = (chance: number, factor: number, rolls: number[], misses = 0) =>
    stealGil(true, factor, chance, misses, { demoMode: 0 }, script(rolls).draw);

  it('amount = floor(floor((draw % 101 + 100) * factor * 100 / 200) * chance / 255)', () => {
    // factor 50, chance 255: draw % 101 = 0 -> 100 * 50 * 100 = 500,000 / 200 = 2,500; * 255 / 255 = 2,500.
    expect(gil(255, 50, [0, 0])?.amount).toBe(2500);
    // draw % 101 = 100 -> 200 * 50 * 100 = 1,000,000 / 200 = 5,000.
    expect(gil(255, 50, [0, 100])?.amount).toBe(5000);
    // chance 127 (the second Pilfer on the same monster): 2,500 * 127 / 255 = 317,500 / 255 = 1,245.
    expect(gil(127, 50, [0, 0])?.amount).toBe(1245);
  });

  it('the chance (on the target) halves with every success: 255, 127, 63, ... down to 1; a miss or failed roll leaves it', () => {
    let chance = 255;
    const seen = [chance];
    for (let k = 0; k < 9; k++) {
      chance = gil(chance, 10, [0, 0])?.chance ?? chance;
      seen.push(chance);
    }
    expect(seen).toEqual([255, 127, 63, 31, 15, 7, 3, 1, 1, 1]);
    expect(gil(100, 10, [100], 0)?.chance).toBe(100); // 100 % 255 = 100, not below 100: failed
    expect(gil(255, 10, [0], 1)?.chance).toBe(255); // missed hit: the roll is drawn, nothing happens
  });

  it('a monster with no gil to give (factor 0) answers -1 and draws nothing; no record answers nothing', () => {
    const s = script([]);
    const r = stealGil(true, 0, 255, 0, { demoMode: 0 }, s.draw);
    expect([r?.amount, s.streams]).toEqual([-1, []]);
    expect(stealGil(false, 10, 255, 0, { demoMode: 0 }, s.draw)).toBeNull();
  });
});

describe('Bribe (0x78bdd0)', () => {
  const target = (over: Partial<{ maxHp: number; paid: number; special: number; monsterId: number }> = {}) => ({
    maxHp: 1000,
    paid: 0,
    special: 0,
    monsterId: 5,
    marker: 0,
    value: 0,
    ...over,
  });
  const tryBribe = (offered: number, roll: number, t = target(), sleep = 0) => {
    const counters = { success: 0, immune: 0, fail: 0 };
    const rec = { sleep, extra: 0 };
    const ret = bribe(0x14, t, 0x80000000, counters, rec, offered, { language: 1 }, script([roll]).draw);
    return { ret, counters, rec, t };
  };

  it('value = ((paid + offered) * 256 / maxHP) / 20 - 64; 25 times the HP is a certain bribe', () => {
    // 1000 HP, 25,000 offered: 25,000 * 256 = 6,400,000 / 1000 = 6,400 / 20 = 320 - 64 = 256: every roll 0..255 is below it.
    expect(tryBribe(25_000, 255).ret).toBe(1);
    // 10,000 offered: 2,560,000 / 1000 = 2,560 / 20 = 128 - 64 = 64: a roll of 63 works, 64 does not.
    expect([tryBribe(10_000, 63).ret, tryBribe(10_000, 64).ret]).toEqual([1, 0]);
    // 5,000 offered: 1,280 / 20 = 64 - 64 = 0: nothing is below 0.
    expect(tryBribe(5_000, 0).ret).toBe(0);
  });

  it('success marks the monster as bribed (marker 2), stores the value, sets Eject and counts; the gil is kept either way', () => {
    const { t, rec, counters } = tryBribe(10_000, 0);
    expect([t.marker, t.value, rec.extra, counters.success, t.paid]).toEqual([2, 64, 0x100, 1, 10_000]);
    const miss = tryBribe(10_000, 200);
    expect([miss.t.marker, miss.counters.fail, miss.t.paid]).toEqual([0, 1, 10_000]);
  });

  it('gil already paid counts too, a Bribe-immune or sleeping monster counts as immune, and nothing offered never works', () => {
    expect(tryBribe(5_000, 63, target({ paid: 5_000 })).ret).toBe(1); // paid + offered = 10,000: the value is 64 again
    const immune = tryBribe(25_000, 0, target({ special: 0x400 }));
    expect([immune.ret, immune.counters.immune, immune.t.paid]).toEqual([0, 1, 25_000]);
    expect(tryBribe(25_000, 0, target(), 1).counters.immune).toBe(1); // asleep
    expect(tryBribe(0, 0, target({ paid: 100_000 })).ret).toBe(0); // paid so far lifts the value, but offering nothing cannot succeed
  });

  it('a command without bit 31 does nothing; the paid total is clamped to 999,999,999', () => {
    const t = target();
    const counters = { success: 0, immune: 0, fail: 0 };
    expect(bribe(0x14, t, 0x7fffffff, counters, { sleep: 0, extra: 0 }, 5000, { language: 1 }, script([]).draw)).toBe(0);
    expect(t.paid).toBe(0);
    const big = target({ paid: 999_999_000 });
    bribe(0x14, big, 0x80000000, counters, { sleep: 0, extra: 0 }, 5000, { language: 1 }, script([0]).draw);
    expect(big.paid).toBe(999_999_999);
  });
});

describe('kill rewards (0x7990d0)', () => {
  const dropLoot = (over: Partial<DropLoot> = {}): DropLoot => ({
    gil: 100,
    ap: 10,
    apOverkill: 40,
    chance: [255, 255],
    gearChance: 0,
    items: [0x2000, 0x2001, 0x2002, 0x2003],
    qty: [2, 1, 3, 1],
    overkillItems: [0x2010, 0x2011, 0x2012, 0x2013],
    overkillQty: [4, 2, 6, 2],
    bribeItem: 0x2020,
    bribeFactor: 10,
    slotBase: 12,
    copy2e: 0,
    copy2f: 0,
    copy30: 0,
    abilityBase: 8,
    rows: new Map(),
    ...over,
  });
  const reward = (): RewardList => ({ gil: 0, ap: new Array<number>(0x12).fill(0), items: [], gear: [] });
  const input = (over: Partial<DropsInput> = {}): DropsInput => ({
    killerStream: 20,
    killerId: 0,
    loot: dropLoot(),
    overkill: false,
    statusWord: 0,
    bribed: false,
    bribeValue: 0,
    recipients: Array.from({ length: 0x12 }, () => ({ autoB: 0, inBattle: true, dead: false, apBlocked: false })),
    joined: [true, true, true, false, false, false, false],
    groupOf: () => 0,
    nameOf: () => 0,
    opts: { language: 1 },
    ...over,
  });

  it('AP goes to all eighteen slots (overkill AP on an overkill), gil to the pool', () => {
    const rw = reward();
    rollDrops(input(), rw, script([254, 0xff, 254, 0xff, 254]).draw); // 254 % 255 = 254 is below the chance 255: both slots drop (rare byte 0xff: the common items); the last draw is the gear roll
    expect(rw.ap.every((a) => a === 10)).toBe(true);
    expect(rw.gil).toBe(100);
    const ok = reward();
    rollDrops(input({ overkill: true }), ok, script([254, 0xff, 254, 0xff, 254]).draw);
    expect(ok.ap[0]).toBe(40);
  });

  it('an item slot drops when draw % 255 is below its chance byte; a low byte below 0x20 picks the rare entry', () => {
    // chance 255 on both slots: both always drop. Rare bytes: 0x1f (rare, entry 1 of slot 0 = 0x2001 x1) then 0x20 (common, entry 2 = 0x2002 x3).
    const rw = reward();
    const s = script([0, 0x1f, 0, 0x20, 254]); // last: the gear roll, chance 0 never passes
    rollDrops(input(), rw, s.draw);
    expect(rw.items).toEqual([{ id: 0x2001, qty: 1 }, { id: 0x2002, qty: 3 }]);
    expect(s.streams).toEqual([10, 11, 10, 11, 10]);
    const none = reward();
    rollDrops(input({ loot: dropLoot({ chance: [0, 0] }) }), none, script([0, 0, 0]).draw); // chance 0: roll 0 % 255 = 0 is not below 0
    expect(none.items).toEqual([]);
  });

  it('a Distill status turns the drop into the sphere (power, mana, speed, ability in that order) and keeps the quantity', () => {
    const drop = (status: number): number => {
      const rw = reward();
      rollDrops(input({ statusWord: status, loot: dropLoot({ chance: [255, 0] }) }), rw, script([0, 0xff, 0, 0]).draw);
      return rw.items[0]?.id ?? 0;
    };
    // 0x30 has bit 0x10 set, which cancels the ability sphere: the normal drop (0x2000) stays. 0x22 has power (2) and ability (0x20): power wins.
    expect([drop(0x2), drop(0x4), drop(0x8), drop(0x20), drop(0x30), drop(0x22), drop(0)]).toEqual([0x2046, 0x2047, 0x2048, 0x2049, 0x2000, 0x2046, 0x2000]);
  });

  it('Gillionaire (0x4000) on any living member in the battle doubles the gil; a dead one does not', () => {
    const g = (dead: boolean): number => {
      const rw = reward();
      const rec = input().recipients.map((r, i) => (i === 3 ? { ...r, autoB: 0x4000, dead } : r));
      rollDrops(input({ recipients: rec, loot: dropLoot({ chance: [0, 0] }) }), rw, script([254, 254, 254]).draw);
      return rw.gil;
    };
    expect([g(false), g(true)]).toEqual([200, 100]);
  });

  it('a bribed monster gives clamp(trunc(float(bit + sqrt(value) * factor / 16 * r / 25)), 1, 99) of its item and no gil', () => {
    // value 100: sqrt 10; factor 10: 10 * 10 = 100, / 16 = 6.25; r = draw % 11 + 20 = 5 + 20 = 25: 6.25 * 25 / 25 = 6.25.
    // bit 0: 6.25 -> 6.   bit 1: 7.25 -> 7.
    const q = (bit: number): number => {
      const rw = reward();
      rollDrops(input({ bribed: true, bribeValue: 100, loot: dropLoot({ gearChance: 0 }) }), rw, script([5, bit, 254]).draw);
      expect(rw.gil).toBe(0);
      return rw.items[0]?.qty ?? 0;
    };
    expect([q(0), q(1)]).toEqual([6, 7]);
    // a negative or zero bribe value: sqrt gives NaN or 0, the conversion gives the quantity floor 1
    const rw = reward();
    rollDrops(input({ bribed: true, bribeValue: -5 }), rw, script([0, 0, 254]).draw);
    expect(rw.items[0]?.qty).toBe(1);
  });

  it('the reward list merges equal items (cap 99), holds eight stacks, and ignores item 0 and quantities below 1', () => {
    const rw = reward();
    addReward(rw, 0x2000, 60);
    addReward(rw, 0x2000, 60);
    expect(rw.items).toEqual([{ id: 0x2000, qty: 99 }]);
    addReward(rw, 0, 5);
    addReward(rw, 0x2001, 0);
    addReward(rw, 0x2001, -3);
    expect(rw.items).toHaveLength(1);
    for (let k = 1; k <= 9; k++) addReward(rw, 0x2000 + k, 1);
    expect(rw.items).toHaveLength(8); // the first stack plus seven more fill the eight places; the last two find no room
  });

  it('the AP settle: a member who never acted, or is dead or Petrified, loses the battle\'s AP; everyone in the battle counts a battle', () => {
    const slots = Array.from({ length: 0x12 }, () => ({ acted: false, inBattle: false, dead: false, stoned: false, ap: 0, backup: 0, battles: 0 }));
    Object.assign(slots[0] as object, { acted: true, inBattle: true, ap: 200 }); // kept
    Object.assign(slots[1] as object, { acted: true, inBattle: true, dead: true, ap: 200 }); // dead: back to the stored 0
    Object.assign(slots[2] as object, { acted: false, inBattle: true, ap: 200 }); // never acted
    Object.assign(slots[3] as object, { acted: true, inBattle: true, stoned: true, ap: 200, backup: 7 });
    settleAp(slots);
    expect(slots.slice(0, 4).map((s) => s.ap)).toEqual([200, 0, 0, 7]);
    expect(slots.slice(0, 5).map((s) => s.battles)).toEqual([1, 1, 1, 1, 0]);
  });
});

describe('gear drop (0x798c10)', () => {
  const rows = new Map<number, readonly number[]>([
    [0, [0x8001, 0x8002, 0x8003, 0x8004, 0x8005, 0x8006, 0x8007]], // owner 0, weapon (row = type + 2 * owner)
    [2, [0x8010, 0x8011, 0x8012, 0x8013, 0, 0, 0, 0]], // owner 1, weapon
  ]);
  const gearLoot: GearLoot = { slotBase: 12, copy2e: 0xa1, copy2f: 0xa2, copy30: 0xa3, abilityBase: 8, rows };
  const roll = (killer: number, draws: number[], joined: boolean[], list: GearEntry[] = [], groupOf = (a: number) => a): { e: GearEntry | null; streams: number[] } => {
    const s = script(draws);
    const e = rollGearDrop(killer, gearLoot, list, joined, groupOf, () => 0, s.draw);
    return { e, streams: s.streams };
  };

  it('owner: the first joined member whose running count passes draw % n (n = joined + 3 for a party killer), else the killer', () => {
    // Members 0, 1, 2 joined; killer 1 is a party member: n = 3 + 3 = 6.
    const j = [true, true, true, false, false, false, false];
    const owner = (d: number): number | undefined => roll(1, [d, 0, 0, 0], j).e?.owner;
    // d % 6 = 0: member 0 (count 1 > 0).  d % 6 = 2: member 2 (count 3 > 2).  d % 6 = 3, 4, 5: nobody -> the killer, 1.
    expect([owner(0), owner(1), owner(2), owner(3), owner(5), owner(6)]).toEqual([0, 1, 2, 1, 1, 0]);
    // A monster killer adds nothing (n = 3) and counts as member 0 for the fallback: 4 % 3 = 1, member 1's count 2 passes it.
    expect(roll(0x14, [4, 0, 0, 0], j).e?.owner).toBe(1);
  });

  it('draws 12, 12, 12, 12 then one 13 per try; weapon or armor from the low bit of the second', () => {
    // slots: slotBase 12 + (a & 7) - 4 = 12 + 3 - 4 = 11, 11 / 4 = 2 slots.  tries: abilityBase 8 + (b & 7) - 4 = 8 + 4 - 4 = 8, 8 / 8 = 1.
    const j = [true, false, false, false, false, false, false];
    const r = roll(0, [0, 0, 3, 4, 0], j); // owner 0, type 0, a = 3, b = 4, the try draws 0 -> pool element 1
    expect(r.streams).toEqual([12, 12, 12, 12, 13]);
    expect(r.e?.slots).toBe(2);
    expect(r.e?.abilities).toEqual([0x8001, 0x8002, 0xff, 0xff]); // row element 0, then pool element (0 % 7) + 1 = element 1
    expect(r.e?.copies).toEqual([0xa1, 0xa3, 0xa2]); // loot bytes 0x2e, 0x30, 0x2f
  });

  it('an ability whose group is already on the gear is skipped, and the tries run out without a second draw', () => {
    const j = [true, false, false, false, false, false, false];
    const sameGroup = roll(0, [0, 0, 3, 4, 0], j, [], () => 7); // everything in one group
    expect(sameGroup.e?.abilities).toEqual([0x8001, 0xff, 0xff, 0xff]);
  });

  it('once the slots are full the tries stop without drawing: slot base 4 and a low draw give 1 slot, taken by the first ability', () => {
    const j = [true, false, false, false, false, false, false];
    const s = script([0, 0, 0, 4]); // a = 0: slots = (4 + 0 - 4) / 4 = 0, raised to 1; b = 4: one try, but the gear already holds 1 of 1
    const e = rollGearDrop(0, { ...gearLoot, slotBase: 4 }, [], j, (a) => a, () => 0, s.draw);
    expect([e?.slots, e?.abilities, s.streams]).toEqual([1, [0x8001, 0xff, 0xff, 0xff], [12, 12, 12, 12]]);
  });

  it('a full list (eight entries) draws nothing and gives nothing', () => {
    const list: GearEntry[] = Array.from({ length: 8 }, () => ({ name: 0, flag: 1, owner: 0, type: 0, mark: 0xff, copies: [0, 0, 0], slots: 1, abilities: [1, 1, 1, 1] }));
    const r = roll(0, [], [true, false, false, false, false, false, false], list);
    expect([r.e, r.streams]).toEqual([null, []]);
  });

  it('the entry has 22 bytes: name, 1, owner, type, 0xff, three loot bytes, the slot count and four abilities', () => {
    const j = [true, false, false, false, false, false, false];
    const e = roll(0, [0, 1, 7, 0], j).e as GearEntry; // armor (low bit 1); a = 7: slots = (12 + 7 - 4) / 4 = 3; b = 0: tries = (8 + 0 - 4) / 8 = 0
    const bytes = gearEntryBytes(e);
    expect(bytes).toHaveLength(22);
    expect(bytes.slice(2, 12)).toEqual([1, 0, 0, 1, 0xff, 0, 0xa1, 0xa3, 0xa2, 3]);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

for (const name of ['steal_item', 'steal_gil_bribe']) {
  const fx = loadFfxParityFixture(name);
  describe.skipIf(fx === null)(`golden vectors: ${name} (tests/fixtures/parity/ffx/${name}.json)`, () => {
    it('every vector matches: results, changed memory, and the number, order and stream of every draw', () => {
      let n = 0;
      for (const v of fx?.vectors ?? []) {
        const why = `vector ${v.id} (${v.class}) ${JSON.stringify(v.in)}`;
        const run = runStealVector(v.in, v.rngDraws);
        expect(run.out, why).toEqual(v.out);
        expect(run.draws, `${why} draw count`).toBe(v.rngDraws?.length ?? 0);
        expect(run.streams, `${why} streams`).toEqual((v.rngDraws ?? []).map((d) => d.stream));
        n++;
      }
      expect(n).toBeGreaterThan(250);
    });
  });
}

for (const name of ['drops_rolls', 'drops_gear', 'drops_small']) {
  const fx = loadFfxParityFixture(name);
  describe.skipIf(fx === null)(`golden vectors: ${name} (tests/fixtures/parity/ffx/${name}.json)`, () => {
    it('every vector matches: AP, gil, the reward list, the gear entries, and the number, order and stream of every draw', () => {
      let n = 0;
      for (const v of fx?.vectors ?? []) {
        const why = `vector ${v.id} (${v.class})`;
        const run = runDropsVector(v.in, v.rngDraws);
        expect(run.out, why).toEqual(v.out);
        expect(run.draws, `${why} draw count`).toBe(v.rngDraws?.length ?? 0);
        expect(run.streams, `${why} streams`).toEqual((v.rngDraws ?? []).map((d) => d.stream));
        n++;
      }
      expect(n).toBeGreaterThan(200);
    });
  });
}
