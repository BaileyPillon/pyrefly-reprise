/**
 * Parity tests for the Magus Sisters kernel (`src/battle/ffx/kernel/sisters.ts` and the joint-action counters of `kernel/aeon-stats.ts`;
 * re-parity lane FFX-K row K4, **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027, the exe's small pieces and the battle system script's workers 60 to 62 (note FFX-G08 sections 2, 6.1
 * to 6.4 and 6.6). The hand-worked cases state each rule in this file's own terms; the last blocks replay `sisters_natives.json`
 * (183,000 emulator vectors), `sisters_menu.json` (9,000 script VM runs) and `joint_ctb.json` (4,000 emulator vectors), stratified subsets of
 * runs of the game's own code against an independent model; the full sets were replayed through the same helper (0 mismatches).
 *
 * Property 282 (`combineCount`) and the Combine powers handler (`combineEvent`) are READ from the game's code, not run: their cases here
 * are the note's rules written out, not a proof against the game.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  type CombineFacts,
  DELTA_ATTACK,
  SISTER_CINDY,
  SISTER_DISMISS,
  SISTER_MINDY,
  SISTER_SANDY,
  SisterOrder as O,
  afterAction,
  combineCount,
  combineEvent,
  increaseMotivation,
  magusRoll,
  newMagusChr,
  positiveCaseTest,
  setMotivationChange,
  sisterMenu,
  storeStandingOrder,
} from '../../src/battle/ffx/kernel/sisters.ts';
import { type SummonSlot, summonCtb } from '../../src/battle/ffx/kernel/aeon-stats.ts';
import {
  type AfterVector,
  type JointVector,
  type MagusRollVector,
  type MenuVector,
  type OrderStoreVector,
  type PositiveVector,
  type Set2Vector,
  type Set4Vector,
  replayAfterAction,
  replayJoint,
  replayMagusRoll,
  replayMenu,
  replayOrderStore,
  replayPositive,
  replaySet2,
  replaySet4,
} from './helpers/ffxKReplay.ts';

const fixture = <T>(name: string): T => JSON.parse(readFileSync(new URL(`../fixtures/parity/ffx/${name}`, import.meta.url), 'utf8')) as T;

describe('the chance test (RollMagusRandom, 0x7a3300)', () => {
  const never = (): number => {
    throw new Error('no draw expected');
  };

  it('a negative threshold is true without a draw', () => {
    expect(magusRoll(5, -1, 0, never)).toEqual({ value: 1, drew: false });
    expect(magusRoll(0, -128, 7, never)).toEqual({ value: 1, drew: false });
  });

  it('with no order standing, or with a 0 command, it is one draw: (draw & 0xFF) < threshold', () => {
    expect(magusRoll(0x30e5, 50, 0, () => 49)).toEqual({ value: 1, drew: true });
    expect(magusRoll(0x30e5, 50, 0, () => 50)).toEqual({ value: 0, drew: true });
    expect(magusRoll(0x30e5, 50, 0, () => 0x1ff)).toEqual({ value: 0, drew: true }); // only the low byte
    expect(magusRoll(0, 128, 3, () => 127)).toEqual({ value: 1, drew: true });
  });

  it('with an order standing and a command asked, it is true exactly for that order and no draw is taken', () => {
    expect(magusRoll(0x3125, 0, 0x3125, never)).toEqual({ value: 1, drew: false });
    expect(magusRoll(0x3000, 255, 0x3125, never)).toEqual({ value: 0, drew: false });
    expect(magusRoll(0x13125, 255, 0x3125, never).value).toBe(0); // the whole argument is compared
  });

  it('the standing order is a 16-bit command id', () => {
    expect(storeStandingOrder(0x12345)).toBe(0x2345);
    expect(storeStandingOrder(-1)).toBe(0xffff);
  });
});

describe('motivation and the gauge', () => {
  it('the 2-argument call writes the same pair into both columns, and only while no order stands', () => {
    const c = newMagusChr(50, 4, 20);
    increaseMotivation(c, 0x3125, 1, 2);
    expect([c.f714, c.f715, c.b726, c.b727, c.b728, c.b729]).toEqual([0, 0, 0, 0, 0, 0]);
    increaseMotivation(c, 0, 1, 2);
    expect([c.f714, c.f715, c.b726, c.b727, c.b728, c.b729]).toEqual([1, 0, 2, 2, 1, 1]);
  });

  it('the 4-argument call writes the two columns separately, whatever order stands', () => {
    const c = newMagusChr(50, 4, 20);
    setMotivationChange(c, 2, 4, 0, -6); // the repeat order's pair: gauge +2 / motivation +4 if it worked, gauge 0 / motivation -6 if not
    expect([c.b726, c.b727, c.b728, c.b729]).toEqual([0xfa, 4, 0, 2]);
  });

  it('after the action the positive column is applied when the action had an effect, the negative one when not', () => {
    const good = newMagusChr(50, 4, 20);
    setMotivationChange(good, 2, 4, 0, -6);
    expect(positiveCaseTest(good, 0, [12, 0, 0], 0)).toBe(1);
    afterAction(good);
    expect([good.gauge, good.motivation]).toEqual([6, 54]);
    const bad = newMagusChr(50, 4, 20);
    setMotivationChange(bad, 2, 4, 0, -6);
    expect(positiveCaseTest(bad, 0, [0, 0, 0], 0)).toBe(0);
    afterAction(bad);
    expect([bad.gauge, bad.motivation]).toEqual([4, 44]);
  });

  it('the gauge is held between 0 and its maximum (20 for an aeon) and the motivation between 0 and 100', () => {
    const c = newMagusChr(98, 19, 20);
    increaseMotivation(c, 0, 5, 10);
    c.f715 = 1;
    afterAction(c);
    expect([c.gauge, c.motivation]).toEqual([20, 100]);
    const low = newMagusChr(3, 1, 20);
    setMotivationChange(low, 0, 0, -5, -15);
    afterAction(low);
    expect([low.gauge, low.motivation]).toEqual([0, 0]);
  });

  it('a healing command counts as an effect when a result is below 0, a damage command when one is above 0; a forced test is always one', () => {
    const c = newMagusChr(0, 0, 20);
    expect(positiveCaseTest(c, 0x10, [5, 5, 5], 0)).toBe(0);
    expect(positiveCaseTest(c, 0x10, [0, -1, 0], 0)).toBe(1);
    expect(c.f715).toBe(1);
    const d = newMagusChr(0, 0, 20);
    expect(positiveCaseTest(d, 0, [-9, 0, 0], 0)).toBe(0);
    expect(positiveCaseTest(d, 0, [0, 0, 1], 0)).toBe(1);
    const e = newMagusChr(0, 0, 20);
    expect(positiveCaseTest(e, 0, [0, 0, 0], 7)).toBe(1);
  });
});

describe('the menu (event 12)', () => {
  /** Build a menu with the rolls answered from `answers` in order (a negative threshold takes none); returns the commands added. */
  function menu(who: number, over: Partial<Parameters<typeof sisterMenu>[1]>, answers: boolean[] = []): { added: number[]; rolls: number[] } {
    const added: number[] = [];
    const rolls: number[] = [];
    let i = 0;
    sisterMenu(who, { debug: 0, turns: 0, motivation: 50, hp: 100, mp: 100, maxHp: 100, maxMp: 100, nearDeath: 0, combineReady: 0, ...over }, {
      clear: () => void (added.length = 0),
      add: (c) => void added.push(c),
      roll: (t) => (rolls.push(t), t < 0 ? true : (answers[i++] ?? false)),
    });
    return { added, rolls };
  }

  it('every sister offers free choice first, repeat from her second turn, and ends with Dismiss', () => {
    for (const who of [SISTER_CINDY, SISTER_SANDY, SISTER_MINDY]) {
      expect(menu(who, {}).added).toEqual([O.Free, SISTER_DISMISS]);
      expect(menu(who, { turns: 1 }).added).toEqual([O.Free, O.Repeat, SISTER_DISMISS]);
    }
  });

  it('Cindy rolls the attack order at motivation + 50, then 128 and 200 for her two spell orders, in that order', () => {
    const m = menu(SISTER_CINDY, { motivation: 30 }, [true, true, true]);
    expect(m.rolls).toEqual([80, 128, 200]);
    expect(m.added).toEqual([O.Free, O.Attack, O.CindyBig, O.CindySupport, SISTER_DISMISS]);
  });

  it('Sandy rolls the attack order at motivation + 150 and her support order is offered on someone below half HP or on a 128 roll that is drawn either way', () => {
    const low = menu(SISTER_SANDY, { motivation: 10, nearDeath: 1 }, [false, false]);
    expect(low.rolls).toEqual([160, 128]); // the 128 roll is drawn although someone is already low
    expect(low.added).toEqual([O.Free, O.SandySupport, SISTER_DISMISS]);
    const lucky = menu(SISTER_SANDY, { motivation: 10 }, [true, true]);
    expect(lucky.added).toEqual([O.Free, O.Attack, O.SandySupport, SISTER_DISMISS]);
  });

  it('Mindy\'s drain order: roll 200 when HP or MP is below a quarter, 128 when below half (strict, integer), nothing above', () => {
    expect(menu(SISTER_MINDY, { motivation: 0, hp: 24, maxHp: 100 }, [false, true]).rolls).toEqual([150, 200]);
    expect(menu(SISTER_MINDY, { motivation: 0, hp: 25, maxHp: 100 }, [false, true]).rolls).toEqual([150, 128]);
    expect(menu(SISTER_MINDY, { motivation: 0, hp: 49, maxHp: 100 }, [false, true]).rolls).toEqual([150, 128]);
    expect(menu(SISTER_MINDY, { motivation: 0, hp: 50, maxHp: 100 }, [false, true]).rolls).toEqual([150]);
    expect(menu(SISTER_MINDY, { motivation: 0, mp: 20, maxMp: 100 }, [false, true]).added).toEqual([O.Free, O.MindyDrain, SISTER_DISMISS]);
  });

  it('Combine powers is offered only when all three are ready, just before Dismiss', () => {
    expect(menu(SISTER_CINDY, { combineReady: 2 }).added).not.toContain(O.Combine);
    expect(menu(SISTER_CINDY, { combineReady: 3 }).added).toEqual([O.Free, O.Combine, SISTER_DISMISS]);
  });
});

describe('Combine powers (read, not run)', () => {
  const ok = (id: number, over: Partial<CombineFacts> = {}): CombineFacts => ({ id, gauge: 20, gaugeMax: 20, debugReady: false, dead: false, cursed: false, canAct: true, ...over });
  const three = (over: Partial<CombineFacts> = {}): CombineFacts[] => [ok(SISTER_CINDY, over), ok(SISTER_SANDY), ok(SISTER_MINDY)];

  it('counts a sister whose gauge is full, who is alive, not Cursed and able to act', () => {
    expect(combineCount(three())).toBe(3);
  });

  it('drops out when the gauge is below its maximum, or dead, Cursed or unable to act (Petrified, asleep, Confused, Berserk, Provoked, Threatened, ejected)', () => {
    expect(combineCount(three({ gauge: 19 }))).toBe(2);
    expect(combineCount(three({ gauge: 19, debugReady: true }))).toBe(3);
    expect(combineCount(three({ dead: true }))).toBe(2);
    expect(combineCount(three({ cursed: true }))).toBe(2);
    expect(combineCount(three({ canAct: false }))).toBe(2);
  });

  it('only the three Sisters count', () => {
    expect(combineCount([ok(8), ok(SISTER_SANDY), ok(SISTER_MINDY)])).toBe(2);
  });

  it('the handler tries the Delta Attack at 200 + motivation: queued it gives +10, otherwise -10 and no target search after a failed roll', () => {
    const asked: number[] = [];
    let searched = 0;
    const host = (roll: boolean, target: boolean): Parameters<typeof combineEvent>[1] => ({ roll: (t) => (asked.push(t), roll), target: () => (searched++, target) });
    expect(combineEvent(30, host(true, true))).toEqual({ queued: true, motivationChange: 10 });
    expect(asked).toEqual([230]);
    expect(combineEvent(30, host(false, true))).toEqual({ queued: false, motivationChange: -10 });
    expect(searched).toBe(1); // only the first call searched
    expect(combineEvent(30, host(true, false))).toEqual({ queued: false, motivationChange: -10 });
  });
});

describe('the joint action: the other Sisters\' counters (0x7b1aa0, kind 8)', () => {
  const slot = (agi: number, over: Partial<SummonSlot> = {}): SummonSlot => ({ ctb: 9, agi, haste: 0, slow: 0, targetMask: 0, flag451: 0, flag5c0: 0, mpUsed: 0, odUsed: 0, rank: 0, ...over });

  it('the actor goes to 0; each other sister takes the action\'s mask and costs and waits tick(Agility) x rank, halved by Haste and doubled by Slow', () => {
    const chrs = new Map<number, SummonSlot>([
      [SISTER_CINDY, slot(40, { targetMask: 0x1000_0000, flag451: 3, flag5c0: 4, mpUsed: 0, odUsed: 20, rank: 5, ctb: 30 })],
      [SISTER_SANDY, slot(40)],
      [SISTER_MINDY, slot(100, { haste: 1 })],
    ]);
    summonCtb([SISTER_CINDY, SISTER_SANDY, SISTER_MINDY, 0xff, 0xff, 0xff, 0xff], SISTER_CINDY, chrs);
    expect(chrs.get(SISTER_CINDY)!.ctb).toBe(0);
    expect(chrs.get(SISTER_SANDY)!.ctb).toBe(35); // Agility 40 is 7 ticks a rank: 7 x 5
    expect(chrs.get(SISTER_MINDY)!.ctb).toBe(10); // Agility 100 is 4 a rank: 20, halved by Haste
    for (const id of [SISTER_SANDY, SISTER_MINDY]) {
      const c = chrs.get(id)!;
      expect([c.targetMask, c.flag451, c.flag5c0, c.odUsed]).toEqual([0x1000_0000, 3, 4, 20]);
    }
  });

  it('the Delta Attack is command 0x30ea', () => {
    expect(DELTA_ATTACK).toBe(0x30ea);
  });
});

describe('replays of the game\'s own code (stratified subsets; the full sets were replayed through the same helper)', () => {
  it('the native pieces: the chance test, the standing order, the two setters, the positive-case test and the after-action application', () => {
    const f = fixture<{
      counts: Record<string, number>;
      roll: MagusRollVector[];
      store: OrderStoreVector[];
      set2: Set2Vector[];
      set4: Set4Vector[];
      positive: PositiveVector[];
      after: AfterVector[];
    }>('sisters_natives.json');
    const all = [replayMagusRoll(f.roll), replayOrderStore(f.store), replaySet2(f.set2), replaySet4(f.set4), replayPositive(f.positive), replayAfterAction(f.after)];
    for (const t of all) {
      expect(t.first).toEqual([]);
      expect(t.bad).toBe(0);
    }
    expect(all.map((t) => t.n)).toEqual([3000, 300, 1429, 1429, 2000, 2500]);
    expect(Object.values(f.counts).reduce((a, b) => a + b, 0)).toBe(183000);
  });

  it('the three menu builders on the game VM', () => {
    const f = fixture<{ counts: { all: number }; runs: MenuVector[] }>('sisters_menu.json');
    const t = replayMenu(f.runs);
    expect(t.first).toEqual([]);
    expect(t.bad).toBe(0);
    expect(t.n).toBe(1500);
    expect(f.counts.all).toBe(9000);
    // the subset reaches the branch the first model got wrong: Sandy's 128 roll drawn although someone is already below half HP
    expect(f.runs.some((r) => r[0] === 61 && r[1][7] !== 0 && r[3].some((e) => e[0] === 'roll' && e[1] === 128))).toBe(true);
  });

  it('the joint-action counters', () => {
    const f = fixture<{ counts: { all: number }; runs: JointVector[] }>('joint_ctb.json');
    const t = replayJoint(f.runs);
    expect(t.first).toEqual([]);
    expect(t.bad).toBe(0);
    expect(t.n).toBe(800);
    expect(f.counts.all).toBe(4000);
  });
});
