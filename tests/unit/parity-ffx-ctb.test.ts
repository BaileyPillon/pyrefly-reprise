/**
 * Parity tests for the FFX CTB kernels (`src/battle/ffx/kernel/ctb.ts`, `ctb-init.ts`, `ctb-scheduler.ts`,
 * `ctb-table.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: tick speed 0x7909c0,
 * Haste/Slow 0x78c150, recovery 0x78d1d0, action rank 0x7895b0, tie key 0x78f000, ready-list sort 0x78d3e0, CTB amount
 * 0x78e1e0, initial CTB 0x78ded0, scheduler 0x790fb0, revive 0x78d530. Spec: `research/re-ffx-ctb-status.md`.
 *
 * Every hand-worked number below has its arithmetic in the comment next to it. The last blocks load golden vectors
 * (`tests/fixtures/parity/ffx/ctb_small.json`, `ctb_init.json`, `ctb_scheduler.json`): every one is a run of the game's
 * own machine code in an x86-32 emulator, with only the RNG function replaced by a script. A kernel that disagrees with
 * one of them fails here.
 */

import { describe, expect, it } from 'vitest';
import {
  actionRank,
  chrBaseCtb,
  clampAgi,
  ctbAfterAction,
  delayAttackCtb,
  delayForRank,
  delayImmunity,
  hasteSlow,
  icvBonus,
  reviveCtb,
  scriptHoldActive,
  sortReady,
  subCtb,
  threatenIgnoresDelay,
  tickSpeed,
  tieKey,
} from '../../src/battle/ffx/kernel/ctb.ts';
import { CTB_ICV_BONUS, CTB_TICK_SPEED } from '../../src/battle/ffx/kernel/ctb-table.ts';
import { initialCtb, type InitCtbSlot } from '../../src/battle/ffx/kernel/ctb-init.ts';
import { isReady, isTicked, schedulerFrame, type SchedChr, type SchedGlobals } from '../../src/battle/ffx/kernel/ctb-scheduler.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import { streamedDraw } from './helpers/ffxStatusAdapters.ts';

describe('the CTB table (ctb_base.bin, 255 records read by the exe)', () => {
  it('has one record per Agility 1..255, tick speed falling from 28 to 3', () => {
    expect(CTB_TICK_SPEED).toHaveLength(255);
    expect(CTB_ICV_BONUS).toHaveLength(255);
    expect(CTB_TICK_SPEED[0]).toBe(28);
    expect(CTB_TICK_SPEED[254]).toBe(3);
    for (let i = 1; i < 255; i++) expect(CTB_TICK_SPEED[i] as number).toBeLessThanOrEqual(CTB_TICK_SPEED[i - 1] as number);
  });

  it('reads the record number clamp(AGI, 1, 255) - 1: Agility 0 and below read Agility 1, 256 and above read 255', () => {
    expect(clampAgi(0)).toBe(1);
    expect(clampAgi(-7)).toBe(1);
    expect(clampAgi(1000)).toBe(255);
    expect(tickSpeed(0)).toBe(28);
    expect(tickSpeed(-1)).toBe(28);
    expect(tickSpeed(256)).toBe(3);
    expect(tickSpeed(0x7fffffff)).toBe(3);
  });

  it('known rows: AGI 1 28/1, 4 20/1, 5 16/1, 6 16/2, 7 15/1, 10 14/1, 20 10/2, 30 8/2, 255 3/6', () => {
    const rows: Array<[number, number, number]> = [
      [1, 28, 1],
      [4, 20, 1],
      [5, 16, 1],
      [6, 16, 2],
      [7, 15, 1],
      [10, 14, 1],
      [20, 10, 2],
      [30, 8, 2],
      [255, 3, 6],
    ];
    for (const [agi, tick, bonus] of rows) {
      expect([agi, tickSpeed(agi), icvBonus(agi)]).toEqual([agi, tick, bonus]);
    }
  });

  it('the base ICV is 3 * tick speed: AGI 1 gives 84, AGI 10 gives 42, AGI 255 gives 9', () => {
    expect(chrBaseCtb(1)).toBe(84); // 28 * 3
    expect(chrBaseCtb(10)).toBe(42); // 14 * 3
    expect(chrBaseCtb(255)).toBe(9); // 3 * 3
  });
});

describe('Haste and Slow on a value (0x78c150)', () => {
  it('Haste halves with truncation, Slow doubles, both give half then double', () => {
    expect(hasteSlow(85, 1, 0)).toBe(42); // 85 / 2 = 42.5 -> 42
    expect(hasteSlow(85, 0, 1)).toBe(170); // 85 * 2
    expect(hasteSlow(85, 1, 1)).toBe(84); // 85 / 2 = 42, then * 2 = 84 (not 85)
    expect(hasteSlow(85, 0, 0)).toBe(85);
  });

  it('clamps to 0..255 after the arithmetic', () => {
    expect(hasteSlow(200, 0, 1)).toBe(255); // 400 -> 255
    expect(hasteSlow(300, 0, 0)).toBe(255);
    expect(hasteSlow(-3, 1, 0)).toBe(0); // -3 / 2 = -1 (toward zero) -> 0
    expect(hasteSlow(-10, 0, 0)).toBe(0);
    expect(hasteSlow(0, 1, 1)).toBe(0);
  });

  it('any non-zero counter counts, including the 255 an equipment status holds', () => {
    expect(hasteSlow(10, 255, 0)).toBe(5);
    expect(hasteSlow(10, 0, 255)).toBe(20);
    expect(hasteSlow(10, 3, 0)).toBe(5);
  });
});

describe('recovery after an action (0x78d1d0)', () => {
  it('tick speed times rank: AGI 10 (tick 14) pays 42 at rank 3 and 14 at rank 1', () => {
    expect(delayForRank(10, 3, 0, 0)).toBe(42); // 14 * 3
    expect(delayForRank(10, 1, 0, 0)).toBe(14);
    expect(delayForRank(10, 6, 0, 0)).toBe(84); // 14 * 6
  });

  it('a rank below 1 counts as 1', () => {
    expect(delayForRank(10, 0, 0, 0)).toBe(14);
    expect(delayForRank(10, -5, 0, 0)).toBe(14);
  });

  it('Haste floors the product in half, Slow doubles it: AGI 12 (tick 13) at rank 3 is 39, hasted 19, slowed 78', () => {
    expect(delayForRank(12, 3, 0, 0)).toBe(39);
    expect(delayForRank(12, 3, 1, 0)).toBe(19); // 39 / 2 = 19.5 -> 19
    expect(delayForRank(12, 3, 0, 1)).toBe(78);
  });

  it('is clamped to 255: AGI 1 (tick 28) at rank 10 is 280 -> 255, slowed 560 -> 255, hasted 140', () => {
    expect(delayForRank(1, 10, 0, 0)).toBe(255);
    expect(delayForRank(1, 10, 0, 1)).toBe(255);
    expect(delayForRank(1, 10, 1, 0)).toBe(140);
  });
});

describe('the rank of an action (0x7895b0)', () => {
  const ranks: Record<number, number | null> = {
    0x3000: 3,
    0x3006: 6,
    0x3008: 0,
    0x3028: 2,
    0x3029: 5,
    0x3036: 4,
    0x3123: null,
  };
  const rankOf = (id: number): number | null => ranks[id] ?? null;

  it('one command: its rank byte', () => {
    expect(actionRank([0x3006, 0xff], 0, rankOf)).toBe(6);
    expect(actionRank([0x3036, 0xff], 0, rankOf)).toBe(4);
  });

  it('two commands: the LAST record found decides', () => {
    expect(actionRank([0x3000, 0x3006], 0, rankOf)).toBe(6);
    expect(actionRank([0x3006, 0x3000], 0, rankOf)).toBe(3);
    expect(actionRank([0x3006, 0x3123], 0, rankOf)).toBe(6); // the second has no record: the first stays
  });

  it('a stop command (0x3029, 0x305f, 0x311e) ends the scan after itself', () => {
    expect(actionRank([0x3029, 0x3006], 0, rankOf)).toBe(5);
    expect(actionRank([0x3000, 0x3029], 0, rankOf)).toBe(5);
  });

  it('no record, an empty action, or a rank byte of 0 gives rank 3', () => {
    expect(actionRank([0x3123, 0xff], 0, rankOf)).toBe(3);
    expect(actionRank([0xff, 0xff], 0, rankOf)).toBe(3);
    expect(actionRank([0x3008, 0xff], 0, rankOf)).toBe(3); // rank byte 0
  });

  it('a non-zero substitution flag turns every command into 0x3028', () => {
    expect(actionRank([0x3006, 0x3036], 1, rankOf)).toBe(2);
    expect(actionRank([0x3006, 0xff], 255, rankOf)).toBe(2);
  });
});

describe('who goes first among equal counters (0x78f000, 0x78d3e0)', () => {
  it('party and aeons: (255 - AGI) * 256 + id, so a higher Agility is first and equal Agility goes to the lower id', () => {
    expect(tieKey(0, 10)).toBe(62720); // (255 - 10) * 256 + 0
    expect(tieKey(1, 12)).toBe(62209); // 243 * 256 + 1
    expect(tieKey(2, 10)).toBe(62722); // 245 * 256 + 2
    expect(tieKey(8, 12)).toBe(62216); // 243 * 256 + 8 (an aeon)
    expect(tieKey(0, 255)).toBe(0);
  });

  it('monsters (ids 0x14..0x1b): id + 0x10000, after every party member whatever the Agility', () => {
    expect(tieKey(0x14, 255)).toBe(65556);
    expect(tieKey(0x1b, 1)).toBe(0x1001b);
    expect(tieKey(0x14, 255)).toBeGreaterThan(tieKey(7, 1));
  });

  it('sortReady orders by key: Yuna (AGI 12) before aeon 8 (AGI 12) before Tidus and Auron (AGI 10) before the monster', () => {
    const agi: Record<number, number> = { 0: 10, 1: 12, 2: 10, 8: 12, 0x14: 255 };
    // keys: Yuna 62209, aeon 62216, Tidus 62720, Auron 62722, monster 65556
    expect(sortReady([0x14, 2, 0, 8, 1], (id) => agi[id] ?? 0)).toEqual([1, 8, 0, 2, 0x14]);
  });

  it('sortReady is the selection sort of the game: a list of one or none is untouched', () => {
    expect(sortReady([], () => 0)).toEqual([]);
    expect(sortReady([5], () => 0)).toEqual([5]);
  });
});

describe('the counter as a byte (0x78e1e0, 0x7b20e0, 0x78d530)', () => {
  it('subCtb adds a signed amount and clamps to 0..255', () => {
    expect(subCtb(10, -20)).toBe(0);
    expect(subCtb(250, 10)).toBe(255);
    expect(subCtb(100, -42)).toBe(58);
    expect(subCtb(0, 0)).toBe(0);
    expect(subCtb(255, 0x7fffffff)).toBe(0); // the 32-bit add wraps negative, then clamps up to 0
  });

  it('the recovery is added after an action as a byte and wraps at 256', () => {
    expect(ctbAfterAction(0, 42)).toBe(42);
    expect(ctbAfterAction(250, 10)).toBe(4); // 260 - 256
  });

  it('a revived character gets its base ICV (3 * the tick speed of battle start), not a fresh calculation', () => {
    expect(reviveCtb(42)).toBe(42);
    expect(reviveCtb(chrBaseCtb(10))).toBe(42);
  });
});

describe('Delay Attack, Delay Buster, Threaten and delay immunity (0x78e0f0, 0x78bd50, 0x78c180)', () => {
  it('Delay Attack adds tick * 3 / 2, Delay Buster tick * 3, from the TARGET Agility; the stronger flag wins', () => {
    expect(delayAttackCtb(0x2000, 14, 0, 0)).toEqual({ ctbDamage: 21, mask: 4 }); // 14 * 3 * 1 / 2
    expect(delayAttackCtb(0x4000, 14, 0, 0)).toEqual({ ctbDamage: 42, mask: 4 }); // 14 * 3 * 2 / 2
    expect(delayAttackCtb(0x6000, 14, 0, 0)).toEqual({ ctbDamage: 42, mask: 4 });
    expect(delayAttackCtb(0x2000, 13, 0, 0)).toEqual({ ctbDamage: 19, mask: 4 }); // 13 * 3 / 2 = 19.5 -> 19
    expect(delayAttackCtb(0, 14, 7, 1)).toEqual({ ctbDamage: 7, mask: 1 });
  });

  it('a Threatened target (record bit 0x800) ignores the delay and the CTB class leaves the live classes', () => {
    expect(threatenIgnoresDelay(0x800, 4, 7, 21)).toEqual({ ctbDamage: 0, classLeft: 3 });
    expect(threatenIgnoresDelay(0, 4, 7, 21)).toEqual({ ctbDamage: 21, classLeft: 7 });
    expect(threatenIgnoresDelay(0x800, 0, 7, 21)).toEqual({ ctbDamage: 21, classLeft: 7 }); // no CTB class on this hit
  });

  it('delay immunity zeroes the CTB amount unless Threaten itself wrote it', () => {
    expect(delayImmunity(true, 4, 0, 21)).toBe(0);
    expect(delayImmunity(true, 4, 1, 21)).toBe(21);
    expect(delayImmunity(false, 4, 0, 21)).toBe(21);
    expect(delayImmunity(true, 1, 0, 21)).toBe(21);
  });
});

// ---------------------------------------------------------------------------------------------
// Initial CTB
// ---------------------------------------------------------------------------------------------

function slotsWith(over: Record<number, Partial<InitCtbSlot>>): InitCtbSlot[] {
  return Array.from({ length: 31 }, (_, i) => ({
    agi: 1,
    haste: 0,
    slow: 0,
    autoA: 0,
    inBattle: false,
    isAeon: i >= 8 && i <= 0x11,
    ...over[i],
  }));
}

/** Tidus AGI 10 (tick 14, base 42, bonus 1), Yuna AGI 12 (13, 39, 1), Auron AGI 15 (12, 36, 1), one monster AGI 5 (16, 48). */
function trio(extra: Record<number, Partial<InitCtbSlot>> = {}): InitCtbSlot[] {
  const base: Record<number, Partial<InitCtbSlot>> = {
    0: { agi: 10, inBattle: true },
    1: { agi: 12, inBattle: true },
    2: { agi: 15, inBattle: true },
    0x14: { agi: 5, inBattle: true },
  };
  const merged: Record<number, Partial<InitCtbSlot>> = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(extra)])) {
    merged[Number(key)] = { ...base[Number(key)], ...extra[Number(key)] };
  }
  return slotsWith(merged);
}

function runInit(type: number, slots: InitCtbSlot[], values: Record<number, number> = {}) {
  const streams: number[] = [];
  const result = initialCtb(type, slots, (stream) => {
    streams.push(stream);
    return values[streams.length - 1] ?? 0;
  });
  return { ...result, streams };
}

describe('initial CTB of a battle (0x78ded0)', () => {
  // Draw order: slots 0..0x11 (18 draws), then monster slots 0x14..0x1b (8). Values by draw number below.
  const normalDraws = { 0: 5, 1: 8, 2: 3, 18: 7 }; // Tidus 5, Yuna 8, Auron 3, the monster 7

  it('a normal start: party base - draw % (bonus + 1), monster base * 100 / (100 - draw % 11), then the minimum comes off', () => {
    const r = runInit(0, trio(), normalDraws);
    expect(r.base.slice(0, 3)).toEqual([42, 39, 36]);
    expect(r.base[0x14]).toBe(48);
    // Tidus 42 - 5 % 2 = 41; Yuna 39 - 8 % 2 = 39; Auron 36 - 3 % 2 = 35; monster 4800 / (100 - 7 % 11) = 4800 / 93 = 51
    // The minimum of the four is 35, and it is subtracted from all of them.
    expect(r.minimum).toBe(35);
    expect([r.ctb[0], r.ctb[1], r.ctb[2], r.ctb[0x14]]).toEqual([6, 4, 0, 16]);
  });

  it('draws 26 times in a fixed order, even for slots nobody occupies: party 20..27, aeons 27, monsters 28..35', () => {
    const r = runInit(0, trio(), normalDraws);
    const expected = [20, 21, 22, 23, 24, 25, 26, 27, ...new Array<number>(10).fill(27), 28, 29, 30, 31, 32, 33, 34, 35];
    expect(r.streams).toEqual(expected);
    expect(r.streams).toHaveLength(26);
  });

  it('a preemptive start: party at 0, monsters at their base; an ambush the other way round; neither draws', () => {
    const pre = runInit(1, trio());
    expect(pre.streams).toEqual([]);
    expect([pre.ctb[0], pre.ctb[1], pre.ctb[2], pre.ctb[0x14]]).toEqual([0, 0, 0, 48]);
    expect(pre.minimum).toBe(0);
    const amb = runInit(2, trio());
    expect(amb.streams).toEqual([]);
    expect([amb.ctb[0], amb.ctb[1], amb.ctb[2], amb.ctb[0x14]]).toEqual([42, 39, 36, 0]);
    expect(amb.minimum).toBe(0);
  });

  it('any start type other than 1 or 2 behaves as a normal start', () => {
    expect(runInit(3, trio(), normalDraws).ctb).toEqual(runInit(0, trio(), normalDraws).ctb);
    expect(runInit(-1, trio(), normalDraws).streams).toHaveLength(26);
  });

  it('monster delay: draw % 11 of 0 keeps the base (48), of 10 gives 4800 / 90 = 53', () => {
    // Party: Tidus 42 - 1 % 2 = 41, Yuna 39 - 0 = 39, Auron 36 - 1 % 2 = 35, so the minimum is 35; the monster keeps 48.
    const keep = runInit(0, trio(), { 0: 1, 1: 0, 2: 1, 18: 0 });
    expect(keep.minimum).toBe(35);
    expect(keep.ctb[0x14]).toBe(13); // 4800 / 100 = 48, minus 35
    const slow10 = runInit(0, trio({ 2: { inBattle: false }, 1: { inBattle: false }, 0: { inBattle: false } }), { 18: 10 });
    expect(slow10.ctb[0x14]).toBe(0); // alone in the battle: its own value is the minimum, so it ends at 0
    expect(slow10.minimum).toBe(53); // 4800 / 90 = 53.33 -> 53
  });

  it('First Strike (Chr+0x6bc bit 1) forces 0 after the draw is spent, in every start type', () => {
    const fs = runInit(0, trio({ 1: { autoA: 0x02 } }), normalDraws);
    expect(fs.streams).toHaveLength(26);
    expect(fs.minimum).toBe(0);
    expect([fs.ctb[0], fs.ctb[1], fs.ctb[2], fs.ctb[0x14]]).toEqual([41, 0, 35, 51]);
    expect(runInit(2, trio({ 1: { autoA: 0x02 } })).ctb[1]).toBe(0); // ambush: 39 would have been the value
    expect(runInit(0, trio({ 1: { autoA: 0xfffd } }), normalDraws).ctb[1]).toBe(4); // bit 1 clear: no First Strike
  });

  it('Haste halves and Slow doubles the starting value (after First Strike), clamped to 0..255', () => {
    const r = runInit(0, trio({ 0: { haste: 1 }, 2: { slow: 255 } }), { 0: 5, 2: 3 });
    // Tidus 41 / 2 = 20; Auron 35 * 2 = 70; Yuna 39 - 0 = 39; monster 4800 / 100 = 48. Minimum 20.
    expect(r.minimum).toBe(20);
    expect([r.ctb[0], r.ctb[1], r.ctb[2], r.ctb[0x14]]).toEqual([0, 19, 50, 28]);
  });

  it('returns -1 and subtracts nothing when nobody is in the battle', () => {
    const r = runInit(0, slotsWith({ 0: { agi: 10 } }), { 0: 1 });
    expect(r.minimum).toBe(-1);
    expect(r.ctb[0]).toBe(41); // 42 - 1 % 2
  });

  it('slots the function never writes (0x12, 0x13, 0x1c..0x1e) keep their value, minus the minimum if in the battle', () => {
    const r = runInit(1, trio({ 0x12: { inBattle: true, ctb: 9 }, 0x13: { ctb: 77 } }));
    expect(r.ctb[0x12]).toBe(9); // minimum 0
    expect(r.ctb[0x13]).toBe(77);
  });

  it('...and that subtraction is a byte subtraction: a counter below the minimum wraps, and with no written slot in the battle the minimum is -1 so the counter gains one', () => {
    // Tidus AGI 1 slowed: base 3 * 28 = 84, doubled 168, so the minimum is 168. Slot 0x12 is in the battle with 90:
    // 90 - 168 = -78, which a byte holds as 256 - 78 = 178.
    const wrap = runInit(0, slotsWith({ 0: { agi: 1, slow: 255, inBattle: true }, 0x12: { inBattle: true, ctb: 90 } }), {});
    expect(wrap.minimum).toBe(168);
    expect(wrap.ctb[0]).toBe(0);
    expect(wrap.ctb[0x12]).toBe(178);
    // Only never-written slots are in the battle: nothing qualifies for the minimum (-1), and 90 - (-1) = 91.
    const up = runInit(0, slotsWith({ 0x12: { inBattle: true, ctb: 90 }, 0x1c: { inBattle: true, ctb: 90 } }), {});
    expect(up.minimum).toBe(-1);
    expect([up.ctb[0x12], up.ctb[0x1c], up.ctb[0x13]]).toEqual([91, 91, 0]); // 0x13 is not in the battle: untouched (0)
  });
});

// ---------------------------------------------------------------------------------------------
// The scheduler
// ---------------------------------------------------------------------------------------------

const GLOBALS: SchedGlobals = {
  paused: false,
  actionQueueCount: 0,
  frameCounter: 0,
  framesPerTick: 1,
  debugFastCtb: false,
  scriptHold: false,
};

function field(over: Record<number, Partial<SchedChr>>): SchedChr[] {
  return Array.from({ length: 31 }, (_, i) => ({
    inBattle: false,
    dead: false,
    perm: 0,
    queued: 0,
    ctb: 0,
    baseCtb: 30,
    getsTurns: true,
    tickCounter: 0,
    rank: 3,
    agi: 10,
    ...over[i],
  }));
}

describe('the CTB scheduler (0x790fb0)', () => {
  it('with nobody ready the clock ticks: every eligible counter loses 1 and its Regen tick counter gains 1', () => {
    const f = field({ 0: { inBattle: true, ctb: 2 }, 1: { inBattle: true, ctb: 1 }, 2: { ctb: 5 } });
    const r = schedulerFrame(f, GLOBALS);
    expect(r).toMatchObject({ ran: true, held: false, actor: null, ticked: true, frameCounter: 0 });
    expect([r.chrs[0]?.ctb, r.chrs[1]?.ctb, r.chrs[2]?.ctb]).toEqual([1, 0, 5]); // slot 2 is not in the battle
    expect([r.chrs[0]?.tickCounter, r.chrs[1]?.tickCounter, r.chrs[2]?.tickCounter]).toEqual([1, 1, 0]);
  });

  it('the call after that finds the character at 0 and queues its turn; nobody else ticks on that call', () => {
    const f = field({ 0: { inBattle: true, ctb: 1 }, 1: { inBattle: true, ctb: 0 } });
    const r = schedulerFrame(f, GLOBALS);
    expect(r).toMatchObject({ ran: true, actor: 1, ticked: false, ready: [1] });
    expect(r.chrs[1]?.queued).toBe(1);
    expect(r.chrs[0]?.ctb).toBe(1); // untouched
    expect(r.chrs[0]?.tickCounter).toBe(0);
  });

  it('counting a counter down to 0 resets its rank to 3', () => {
    const f = field({ 0: { inBattle: true, ctb: 1, rank: 8 }, 1: { inBattle: true, ctb: 4, rank: 8 } });
    const r = schedulerFrame(f, GLOBALS);
    expect([r.chrs[0]?.ctb, r.chrs[0]?.rank]).toEqual([0, 3]);
    expect([r.chrs[1]?.ctb, r.chrs[1]?.rank]).toEqual([3, 8]);
  });

  it('two characters at 0: the higher Agility goes first (Yuna AGI 12 before Tidus AGI 10), the list is the sorted keys', () => {
    const f = field({ 0: { inBattle: true, agi: 10 }, 1: { inBattle: true, agi: 12 } });
    const r = schedulerFrame(f, GLOBALS);
    expect(r.ready).toEqual([1, 0]);
    expect(r.actor).toBe(1);
  });

  it('equal Agility goes to the lower id, and a monster is always after the party', () => {
    const f = field({ 3: { inBattle: true, agi: 10 }, 1: { inBattle: true, agi: 10 }, 0x14: { inBattle: true, agi: 255 } });
    expect(schedulerFrame(f, GLOBALS).ready).toEqual([1, 3, 0x14]);
  });

  it('who is skipped: queued action, not in the battle, dead, Petrified, no turns; and only the first four also skip the tick', () => {
    const base = { inBattle: true, ctb: 3 };
    const f = field({
      0: { ...base, queued: 1 },
      1: { ...base, inBattle: false },
      2: { ...base, dead: true },
      3: { ...base, perm: 0x04 },
      4: { ...base, getsTurns: false },
      5: { ...base },
    });
    const r = schedulerFrame(f, GLOBALS);
    expect(r.chrs.slice(0, 6).map((c) => c.ctb)).toEqual([3, 3, 3, 3, 2, 2]);
    expect(isTicked(f[4] as SchedChr)).toBe(true); // a character without turns still ticks...
    expect(isReady({ ...(f[4] as SchedChr), ctb: 0 })).toBe(false); // ...but is never ready
    expect(isReady({ ...(f[5] as SchedChr), ctb: 0 })).toBe(true);
  });

  it('a character that gets no turns and reaches 0 is put back at its base ICV; one with turns stays at 0', () => {
    const f = field({ 0: { inBattle: true, ctb: 1, getsTurns: false, baseCtb: 42 }, 1: { inBattle: true, ctb: 1 } });
    const r = schedulerFrame(f, GLOBALS);
    expect(r.chrs[0]?.ctb).toBe(42);
    expect(r.chrs[1]?.ctb).toBe(0);
  });

  it('a counter already at 0 that is not ready (no turns) also resets to base on the tick', () => {
    const r = schedulerFrame(field({ 0: { inBattle: true, ctb: 0, getsTurns: false, baseCtb: 33 } }), GLOBALS);
    expect(r.chrs[0]?.ctb).toBe(33);
  });

  it('the Regen tick counter saturates at 255', () => {
    const r = schedulerFrame(field({ 0: { inBattle: true, ctb: 9, tickCounter: 255 }, 1: { inBattle: true, ctb: 9, tickCounter: 254 } }), GLOBALS);
    expect([r.chrs[0]?.tickCounter, r.chrs[1]?.tickCounter]).toEqual([255, 255]);
  });

  it('does nothing while the game is paused or an action is queued', () => {
    const f = field({ 0: { inBattle: true, ctb: 0 } });
    for (const g of [{ ...GLOBALS, paused: true }, { ...GLOBALS, actionQueueCount: 1 }]) {
      const r = schedulerFrame(f, g);
      expect(r).toMatchObject({ ran: false, actor: null, ticked: false, ready: [] });
      expect(r.chrs[0]?.queued).toBe(0);
    }
  });

  it('with a period of 3 the clock ticks on every third call', () => {
    const g = { ...GLOBALS, framesPerTick: 3 };
    let f = field({ 0: { inBattle: true, ctb: 10 } });
    let counter = 0;
    const log: boolean[] = [];
    for (let k = 0; k < 6; k++) {
      const r = schedulerFrame(f, { ...g, frameCounter: counter });
      log.push(r.ticked);
      counter = r.frameCounter;
      f = r.chrs;
    }
    expect(log).toEqual([false, false, true, false, false, true]);
    expect(f[0]?.ctb).toBe(8);
  });

  it('the debug switch makes a counter that would stay above 0 become 1', () => {
    const r = schedulerFrame(field({ 0: { inBattle: true, ctb: 50 }, 1: { inBattle: true, ctb: 1 } }), { ...GLOBALS, debugFastCtb: true });
    expect([r.chrs[0]?.ctb, r.chrs[1]?.ctb]).toEqual([1, 0]);
  });

  it('the script hold ends the call at the first ready character, but only when someone is ready', () => {
    const hold = { ...GLOBALS, scriptHold: true };
    const ready = schedulerFrame(field({ 0: { inBattle: true, ctb: 0 } }), hold);
    expect(ready).toMatchObject({ ran: true, held: true, actor: null, ticked: false });
    expect(ready.chrs[0]?.queued).toBe(0);
    const nobody = schedulerFrame(field({ 0: { inBattle: true, ctb: 4 } }), hold);
    expect(nobody).toMatchObject({ held: false, ticked: true });
  });

  it('the script-hold condition: scene 0x1ad or one of six commands, and a signed counter above 0', () => {
    expect(scriptHoldActive(0x1ad, 0, 1)).toBe(true);
    expect(scriptHoldActive(0x1ad, 0, 0)).toBe(false);
    expect(scriptHoldActive(0x1ad, 0, 128)).toBe(false); // the byte 0x80 is -128
    expect(scriptHoldActive(0, 0x312c, 5)).toBe(true);
    expect(scriptHoldActive(0, 0x60bd, 127)).toBe(true);
    expect(scriptHoldActive(0, 0x3000, 5)).toBe(false);
    expect(scriptHoldActive(0x1ac, 0x312d, 5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

const small = loadFfxParityFixture('ctb_small');
describe.skipIf(small === null)('golden vectors: small CTB functions (tests/fixtures/parity/ffx/ctb_small.json)', () => {
  it('every vector matches: tick speed, Haste/Slow, recovery, tie key, sort, CTB amount, action rank, revive', () => {
    const counts: Record<string, number> = {};
    for (const v of small?.vectors ?? []) {
      const i = expandVectorInput(small?.defaults ?? {}, v.in) as Record<string, unknown>;
      const o = v.out as Record<string, unknown>;
      const why = `vector ${v.id} (${v.class})`;
      counts[v.class] = (counts[v.class] ?? 0) + 1;
      switch (v.class) {
        case 'tick':
          expect(tickSpeed(i['agi'] as number), why).toBe(o['tick']);
          expect(icvBonus(i['agi'] as number), why).toBe(o['bonus']);
          break;
        case 'hasteSlow':
          expect(hasteSlow(i['value'] as number, i['haste'] as number, i['slow'] as number), why).toBe(v.out);
          break;
        case 'delay':
          expect(delayForRank(i['agi'] as number, i['rank'] as number, i['haste'] as number, i['slow'] as number), why).toBe(v.out);
          break;
        case 'tieKey':
          expect(tieKey(i['id'] as number, i['agi'] as number), why).toBe(v.out);
          break;
        case 'sort': {
          const agis = i['agis'] as Record<string, number>;
          expect(sortReady(i['ids'] as number[], (id) => agis[String(id)] ?? 0), why).toEqual(v.out);
          break;
        }
        case 'subCtb':
          expect(subCtb(i['ctb'] as number, i['delta'] as number), why).toBe(v.out);
          break;
        case 'actionRank': {
          const ranks = i['ranks'] as Record<string, number | null>;
          const got = actionRank(i['ids'] as number[], i['flag6de'] as number, (id) => ranks[String(id)] ?? null);
          expect(got, why).toBe(v.out);
          break;
        }
        case 'revive':
          // The game sets the counter to Chr+0x65d, which is also the "base" input here.
          expect(reviveCtb(i['baseCtb'] as number), why).toBe(o['ctb']);
          break;
        default:
          throw new Error(`unknown class ${v.class}`);
      }
    }
    expect(Object.keys(counts).sort()).toEqual(['actionRank', 'delay', 'hasteSlow', 'revive', 'sort', 'subCtb', 'tick', 'tieKey']);
    expect(small?.vectors.length ?? 0).toBeGreaterThan(2000);
  });
});

const initFx = loadFfxParityFixture('ctb_init');
describe.skipIf(initFx === null)('golden vectors: initial CTB (tests/fixtures/parity/ffx/ctb_init.json)', () => {
  it('every vector matches: base ICV, opening counters, the minimum, and the stream and order of every draw', () => {
    for (const v of initFx?.vectors ?? []) {
      const i = expandVectorInput(initFx?.defaults ?? {}, v.in) as { mode: number; slots: number[][] };
      const slots: InitCtbSlot[] = i.slots.map((s) => ({
        agi: s[0] as number,
        haste: s[1] as number,
        slow: s[2] as number,
        autoA: s[3] as number,
        inBattle: s[4] === 1,
        isAeon: s[5] === 1,
        ctb: 0x5a,
      }));
      const script = streamedDraw(v.rngDraws);
      const got = initialCtb(i.mode, slots, script.draw);
      const why = `vector ${v.id} (${v.class})`;
      expect(script.calls(), `${why} draw count`).toBe(v.rngDraws?.length ?? 0);
      expect(script.streams, `${why} streams`).toEqual((v.rngDraws ?? []).map((d) => d.stream));
      expect(got.base, `${why} base`).toEqual(v.out['base']);
      expect(got.ctb, `${why} counters`).toEqual(v.out['ctb']);
      expect(got.minimum, `${why} minimum`).toBe(v.out['minimum']);
    }
  });
});

const schedFx = loadFfxParityFixture('ctb_scheduler');
describe.skipIf(schedFx === null)('golden vectors: scheduler (tests/fixtures/parity/ffx/ctb_scheduler.json)', () => {
  it('every vector matches: whether it ran, the ready list, the turn queued, every counter, rank and tick counter', () => {
    for (const v of schedFx?.vectors ?? []) {
      const i = expandVectorInput(schedFx?.defaults ?? {}, v.in) as {
        chrs: number[][];
        globals: Record<string, number>;
      };
      const chrs: SchedChr[] = i.chrs.map((c) => ({
        inBattle: c[0] === 1,
        dead: (c[1] as number) !== 0,
        perm: c[2] as number,
        queued: c[3] as number,
        ctb: c[4] as number,
        baseCtb: c[5] as number,
        getsTurns: (c[6] as number) !== 0,
        tickCounter: c[7] as number,
        rank: c[8] as number,
        agi: c[9] as number,
      }));
      const g = i.globals;
      const got = schedulerFrame(chrs, {
        paused: (g['paused'] as number) !== 0,
        actionQueueCount: g['queueCount'] as number,
        frameCounter: g['frameCounter'] as number,
        framesPerTick: g['period'] as number,
        debugFastCtb: (g['debugFast'] as number) !== 0,
        scriptHold: scriptHoldActive(g['scene'] as number, g['cmdInProgress'] as number, g['hold'] as number),
      });
      const o = v.out as { ret: number; ready: number[] | null; frameCounter: number; chrs: number[][]; odCalls: number[] };
      const why = `vector ${v.id} (${v.class})`;
      expect(got.ran ? -1 : 0, `${why} return`).toBe(o.ret);
      if (got.ran && !got.held) expect(got.ready, `${why} ready list`).toEqual(o.ready);
      expect(got.frameCounter, `${why} frame counter`).toBe(o.frameCounter);
      expect(
        got.chrs.map((c) => [c.queued, c.ctb, c.tickCounter, c.rank]),
        `${why} characters`,
      ).toEqual(o.chrs);
      expect(got.actor === null ? [] : [got.actor], `${why} queued turn`).toEqual(o.odCalls);
    }
  });
});
