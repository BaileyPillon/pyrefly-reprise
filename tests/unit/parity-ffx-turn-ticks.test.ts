/**
 * Parity tests for the FFX per-turn tick kernels (`src/battle/ffx/kernel/turn-ticks.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the end-of-turn status tick
 * (VA 0x007af390), the start-of-turn tick with Regen (0x007af4f0), Poison (0x007afab0), Doom (0x00799cd0), the Threaten
 * link (0x0078e410, 0x0078e460) and the action-done function (0x007b20e0). Spec: `research/re-ffx-ctb-status.md`
 * section 14. Every hand-worked number has its arithmetic in the comment next to it. The last blocks replay golden
 * vectors from `tests/fixtures/parity/ffx/turn_ticks_*.json`: each one is a run of the game's own machine code in an
 * x86-32 emulator, with the animation callees replaced by recorders and every character structure filled with random
 * bytes first (so a byte the code reads and the kernel does not model would show as a difference).
 */

import { describe, expect, it } from 'vitest';
import {
  TICK_SLOTS,
  actionDone,
  doomTick,
  endOfTurnTick,
  poisonTick,
  regenAmount,
  releaseThreaten,
  startOfTurnTick,
  subHp,
  threatProcess,
  type TickChr,
} from '../../src/battle/ffx/kernel/turn-ticks.ts';
import { TemporalSlot } from '../../src/battle/ffx/kernel/status-types.ts';
import { loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

function chr(over: Partial<TickChr> = {}): TickChr {
  return {
    inBattle: false,
    dead: false,
    petrified: false,
    silent: false,
    reentered: false,
    hp: 0,
    maxHp: 0,
    perm: 0,
    counters: new Array<number>(13).fill(0),
    extra: 0,
    autoExtra: 0,
    tickCounter: 0,
    threatenedBy: 0xff,
    threatening: 0xff,
    doomCounter: 0,
    poisonPercent: 0,
    ...over,
  };
}

function field(over: Record<number, Partial<TickChr>> = {}): TickChr[] {
  return Array.from({ length: TICK_SLOTS }, (_, i) => chr(over[i] ?? {}));
}

const counters = (over: Record<number, number>): number[] => {
  const c = new Array<number>(13).fill(0);
  for (const [k, v] of Object.entries(over)) c[Number(k)] = v;
  return c;
};

describe('the end-of-turn status tick (0x7af390)', () => {
  it('counts down Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow by one', () => {
    const r = endOfTurnTick({
      inBattle: true,
      silent: false,
      counters: counters({ [TemporalSlot.Sleep]: 3, [TemporalSlot.Silence]: 5, [TemporalSlot.Darkness]: 7, [TemporalSlot.Shell]: 9, [TemporalSlot.Protect]: 11, [TemporalSlot.Reflect]: 13, [TemporalSlot.Haste]: 20, [TemporalSlot.Slow]: 22 }),
    });
    expect(r.counters).toEqual(counters({ 0: 2, 1: 4, 2: 6, 3: 8, 4: 10, 5: 12, 11: 19, 12: 21 }));
    expect(r.ticked).toEqual([0, 1, 2, 3, 4, 5, 11, 12]);
    expect(r.reaction).toBe('none');
  });

  it('leaves Regen (it counts down at the start of the holder\'s turn) and the four Nul charges alone', () => {
    const r = endOfTurnTick({
      inBattle: true,
      silent: false,
      counters: counters({ [TemporalSlot.Regen]: 8, [TemporalSlot.NulTide]: 1, [TemporalSlot.NulBlaze]: 2, [TemporalSlot.NulShock]: 3, [TemporalSlot.NulFrost]: 4 }),
    });
    expect(r.ticked).toEqual([]);
    expect(r.counters).toEqual(counters({ 10: 8, 6: 1, 7: 2, 8: 3, 9: 4 }));
  });

  it('never moves a counter of 254 (until removed) or 255 (given by equipment), and 0 stays 0', () => {
    const c = counters({ 0: 254, 1: 255, 2: 0, 3: 254, 11: 255, 12: 254 });
    expect(endOfTurnTick({ inBattle: true, silent: false, counters: c }).counters).toEqual(c);
    // 253 is the last number that counts down (the exe compares counter - 1 against 0xfc unsigned)
    expect(endOfTurnTick({ inBattle: true, silent: false, counters: counters({ 3: 253 }) }).counters[3]).toBe(252);
  });

  it('a Sleep that reaches 0 wakes the sleeper and nothing else is checked after it', () => {
    const r = endOfTurnTick({ inBattle: true, silent: false, counters: counters({ 0: 1, 1: 1, 2: 1 }) });
    expect(r.counters.slice(0, 3)).toEqual([0, 0, 0]);
    expect(r.reaction).toBe('wake');
  });

  it('a Silence or a Darkness that reaches 0 asks for the recovery pose', () => {
    expect(endOfTurnTick({ inBattle: true, silent: false, counters: counters({ 1: 1 }) }).reaction).toBe('ended');
    expect(endOfTurnTick({ inBattle: true, silent: false, counters: counters({ 2: 1 }) }).reaction).toBe('ended');
    expect(endOfTurnTick({ inBattle: true, silent: false, counters: counters({ 3: 1 }) }).reaction).toBe('none'); // Shell has no event
  });

  it('fires the end-of-turn event for the statuses that have one, unless the silent flag is on', () => {
    const c = counters({ 0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 11: 5, 12: 5 });
    const loud = endOfTurnTick({ inBattle: true, silent: false, counters: c });
    // Sleep, Silence, Darkness, Haste and Slow carry bit 8 in their behaviour byte; Shell, Protect and Reflect (0x14) do not
    expect(loud.events.map((e) => e.slot)).toEqual([0, 1, 2, 11, 12]);
    expect(loud.events.every((e) => e.value === 4)).toBe(true);
    const quiet = endOfTurnTick({ inBattle: true, silent: true, counters: c });
    expect(quiet.events).toEqual([]);
    expect(quiet.counters).toEqual(loud.counters); // the count still happens
  });

  it('does nothing to a character that is not on the field', () => {
    const c = counters({ 0: 3, 11: 3 });
    const r = endOfTurnTick({ inBattle: false, silent: false, counters: c });
    expect(r.counters).toEqual(c);
    expect(r.ticked).toEqual([]);
  });
});

describe('Regen\'s payout and the start-of-turn tick (0x7af4f0)', () => {
  it('pays (tickCounter * maxHP >> 8) + 100', () => {
    // 14 * 2700 = 37800; 37800 >> 8 = 147 (37800 / 256 = 147.66); + 100 = 247
    expect(regenAmount(14, 2700)).toBe(247);
    // a counter of 0 still pays the flat 100; 255 * 9999 = 2549745 >> 8 = 9959; + 100 = 10059
    expect(regenAmount(0, 9999)).toBe(100);
    expect(regenAmount(255, 9999)).toBe(10059);
    // 99999 * 255 = 25499745 >> 8 = 99608; + 100 = 99708 (the product fits in 32 bits)
    expect(regenAmount(255, 99999)).toBe(99708);
    // the tick counter is a byte: the game reads one byte, so 270 acts as 14
    expect(regenAmount(256 + 14, 2700)).toBe(247);
  });

  it('pays EVERY Regen holder at the start of ANY actor\'s turn, and resets its own tick counter', () => {
    const f = field({
      0: { inBattle: true, hp: 1000, maxHp: 2700, counters: counters({ [TemporalSlot.Regen]: 10 }), tickCounter: 14 }, // Tidus: the holder
      1: { inBattle: true, hp: 500, maxHp: 1500, counters: counters({ [TemporalSlot.Regen]: 4 }), tickCounter: 3 }, // Yuna: another holder
      2: { inBattle: true, hp: 800, maxHp: 3000 }, // Auron: the actor, no Regen
    });
    const r = startOfTurnTick(f, 2);
    // Tidus 14 * 2700 >> 8 = 147, + 100 = 247; Yuna 3 * 1500 = 4500 >> 8 = 17, + 100 = 117
    expect(r.payouts).toEqual([
      { slot: 0, amount: 247, damage: false, hpBefore: 1000, hpAfter: 1247 },
      { slot: 1, amount: 117, damage: false, hpBefore: 500, hpAfter: 617 },
    ]);
    expect(r.chrs[0]?.tickCounter).toBe(0);
    expect(r.chrs[1]?.tickCounter).toBe(0);
    // Regen counts down at the start of its HOLDER's own turn only: the actor (Auron) has none, so both stay
    expect(r.chrs[0]?.counters[TemporalSlot.Regen]).toBe(10);
  });

  it('the payout is capped by maximum HP', () => {
    const r = startOfTurnTick(field({ 0: { inBattle: true, hp: 2650, maxHp: 2700, counters: counters({ 10: 9 }), tickCounter: 28 } }), 0);
    // 28 * 2700 = 75600 >> 8 = 295, + 100 = 395; 2650 + 395 = 3045, clamped to 2700
    expect(r.payouts[0]).toMatchObject({ amount: 395, hpAfter: 2700 });
  });

  it('a Zombie takes the payout as damage', () => {
    const r = startOfTurnTick(field({ 0: { inBattle: true, hp: 300, maxHp: 2700, perm: 0x02, counters: counters({ 10: 9 }), tickCounter: 0 } }), 0);
    // the flat 100 against 300 HP
    expect(r.payouts[0]).toEqual({ slot: 0, amount: 100, damage: true, hpBefore: 300, hpAfter: 200 });
    const dead = startOfTurnTick(field({ 0: { inBattle: true, hp: 60, maxHp: 2700, perm: 0x02, counters: counters({ 10: 9 }) } }), 0);
    expect(dead.payouts[0]?.hpAfter).toBe(0); // clamped at 0; the death check is the engine's
  });

  it('pays nobody who is off the field, at 0 HP, dead or Petrified, and does not reset their tick counter', () => {
    const holder = { hp: 1000, maxHp: 2700, counters: counters({ 10: 9 }), tickCounter: 20 };
    const f = field({
      0: { ...holder, inBattle: false },
      1: { ...holder, inBattle: true, hp: 0 },
      2: { ...holder, inBattle: true, dead: true },
      3: { ...holder, inBattle: true, petrified: true },
      4: { ...holder, inBattle: true },
    });
    const r = startOfTurnTick(f, 4);
    expect(r.payouts.map((p) => p.slot)).toEqual([4]);
    expect(r.resets).toEqual([4]);
    for (const i of [0, 1, 2, 3]) expect(r.chrs[i]?.tickCounter).toBe(20);
  });

  it('a re-entered turn (a refused command, a hand-off) neither pays nor counts down, but the stances and the Threaten release still run', () => {
    const f = field({
      0: { inBattle: true, hp: 100, maxHp: 1000, counters: counters({ 10: 5 }), tickCounter: 9, reentered: true, extra: 0x0800 },
    });
    const r = startOfTurnTick(f, 0);
    expect(r.payouts).toEqual([]);
    expect(r.chrs[0]?.counters[TemporalSlot.Regen]).toBe(5);
    expect(r.chrs[0]?.tickCounter).toBe(9);
    expect(r.chrs[0]?.extra).toBe(0); // Defend ended
  });

  it('the actor\'s own Regen counter counts down at the start of its turn: 1..253 only, 254 and 255 never', () => {
    const run = (n: number): number => (startOfTurnTick(field({ 0: { inBattle: true, counters: counters({ 10: n }) } }), 0).chrs[0] as TickChr).counters[10] as number;
    expect(run(10)).toBe(9);
    expect(run(1)).toBe(0);
    expect(run(253)).toBe(252);
    expect(run(254)).toBe(254);
    expect(run(255)).toBe(255);
    expect(run(0)).toBe(0);
    const r = startOfTurnTick(field({ 0: { inBattle: true, counters: counters({ 10: 10 }) } }), 0);
    expect(r.events).toEqual([{ slot: 10, value: 9 }]); // Regen's behaviour byte (0x03) also has the event bit
  });

  it('ends Defend, Guard, Sentinel, Shield and Boost unless the equipment gives them', () => {
    const all = 0x0800 | 0x1000 | 0x2000 | 0x0040 | 0x0080;
    const r = startOfTurnTick(field({ 3: { inBattle: true, extra: all | 0x0001, autoExtra: 0 } }), 3);
    expect(r.chrs[3]?.extra).toBe(0x0001); // Scan is not a stance
    expect(r.stancesCleared).toEqual([0x0800, 0x1000, 0x2000, 0x0040, 0x0080]);
    const kept = startOfTurnTick(field({ 3: { inBattle: true, extra: all, autoExtra: 0x0800 | 0x0040 } }), 3);
    expect(kept.chrs[3]?.extra).toBe(0x0800 | 0x0040);
  });

  it('only the actor\'s stances end: another character\'s Defend stays', () => {
    const r = startOfTurnTick(field({ 0: { inBattle: true, extra: 0x0800 }, 1: { inBattle: true } }), 1);
    expect(r.chrs[0]?.extra).toBe(0x0800);
  });
});

describe('the Threaten link (0x78e410, 0x78e460)', () => {
  /** U (slot 0) threatened T (slot 0x14): both carry the bit and name each other. */
  const pair = (): TickChr[] =>
    field({
      0: { inBattle: true, perm: 0x0800, threatening: 0x14 },
      0x14: { inBattle: true, perm: 0x0800, threatenedBy: 0 },
    });

  it('a Threaten landing links the user to the target', () => {
    const f = field({ 0: { inBattle: true }, 0x14: { inBattle: true, perm: 0x0800, threatenedBy: 0 } });
    const r = threatProcess(f, 0x14);
    expect(r[0]?.perm).toBe(0x0800);
    expect(r[0]?.threatening).toBe(0x14);
    expect(r[0x14]?.threatenedBy).toBe(0);
  });

  it('is released at the start of the USER\'s next turn: the bit leaves both ends and the link bytes reset', () => {
    const r = startOfTurnTick(pair(), 0);
    expect(r.chrs[0]).toMatchObject({ perm: 0, threatening: 0xff, threatenedBy: 0xff });
    expect(r.chrs[0x14]).toMatchObject({ perm: 0, threatening: 0xff, threatenedBy: 0xff });
  });

  it('is released at the start of the TARGET\'s turn too, if its turn comes first', () => {
    const r = startOfTurnTick(pair(), 0x14);
    expect(r.chrs[0]?.perm).toBe(0);
    expect(r.chrs[0x14]?.perm).toBe(0);
    expect(r.chrs[0]?.threatening).toBe(0xff);
  });

  it('a character without the bit releases nothing', () => {
    const f = pair();
    expect(releaseThreaten(f, 5)).toEqual(f);
  });

  it('keeps the bits of the other statuses in the word', () => {
    const f = field({ 0: { perm: 0x0800 | 0x0008, threatening: 2 }, 2: { perm: 0x0800 | 0x0200, threatenedBy: 0 } });
    const r = releaseThreaten(f, 0);
    expect(r[0]?.perm).toBe(0x0008);
    expect(r[2]?.perm).toBe(0x0200);
  });

  it('refuses a partner byte that is not a character slot (the exe would index outside its array)', () => {
    expect(() => threatProcess(field({ 0: { perm: 0x0800, threatenedBy: 40 } }), 0)).toThrow(RangeError);
    expect(() => threatProcess(field({ 0: { perm: 0x0800, threatenedBy: 31 } }), 0)).toThrow(RangeError); // the array has 31 slots, 0..30
    expect(() => releaseThreaten(field(), 31)).toThrow(RangeError);
  });
});

describe('Poison (0x7afab0) and the action-done function (0x7b20e0)', () => {
  it('pays poisonPercent * maxHP / 100, unsigned 32-bit, clamped at 0', () => {
    // 25 * 2700 / 100 = 675
    expect(poisonTick({ hp: 2000, maxHp: 2700, poisonPercent: 25 }, 3, 3)).toEqual({ marker: 0xff, fired: true, amount: 675, hpAfter: 1325 });
    // 25 * 9999 = 249975; / 100 = 2499 (the fraction is dropped)
    expect(poisonTick({ hp: 5000, maxHp: 9999, poisonPercent: 25 }, 0, 0).amount).toBe(2499);
    expect(poisonTick({ hp: 300, maxHp: 2700, poisonPercent: 25 }, 1, 1).hpAfter).toBe(0);
    // a monster's byte: 10 percent of 99999
    expect(poisonTick({ hp: 99999, maxHp: 99999, poisonPercent: 10 }, 0x14, 0x14).amount).toBe(9999);
  });

  it('pays only the character the marker names, and clears the marker whoever it named', () => {
    const r = poisonTick({ hp: 2000, maxHp: 2700, poisonPercent: 25 }, 3, 0xff);
    expect(r).toEqual({ marker: 0xff, fired: false, amount: 0, hpAfter: 2000 });
    expect(poisonTick({ hp: 2000, maxHp: 2700, poisonPercent: 25 }, 3, 4).fired).toBe(false);
  });

  const done = (over: Partial<Parameters<typeof actionDone>[0]> = {}): Parameters<typeof actionDone>[0] => ({
    ctb: 0,
    rank: 3,
    agi: 10,
    counters: new Array<number>(13).fill(0),
    inBattle: true,
    silent: false,
    perm: 0,
    dead: false,
    skipPoison: false,
    ...over,
  });

  it('adds the recovery to the CTB counter before the end-of-turn tick, so the Haste that ends here still halved it', () => {
    // AGI 10 -> tick speed 14; rank 3 -> 42; Haste halves it to 21; the same call counts the Haste down from 1 to 0
    const r = actionDone(done({ counters: counters({ [TemporalSlot.Haste]: 1 }) }), true);
    expect(r.recovery).toBe(21);
    expect(r.ctb).toBe(21);
    expect(r.end.counters[TemporalSlot.Haste]).toBe(0);
    // and a Slow doubles it: 84
    expect(actionDone(done({ counters: counters({ [TemporalSlot.Slow]: 5 }) }), true).recovery).toBe(84);
  });

  it('the CTB add is a byte add that wraps; the recovery itself is clamped to 255', () => {
    expect(actionDone(done({ agi: 1, rank: 10 }), true).recovery).toBe(255); // 28 * 10 = 280 -> 255
    expect(actionDone(done({ ctb: 250 }), true).ctb).toBe((250 + 42) & 0xff);
  });

  it('marks Poison only after an action whose results were applied', () => {
    const poisoned = done({ perm: 0x08 });
    expect(actionDone(poisoned, true).poisonMarked).toBe(true);
    expect(actionDone(poisoned, false).poisonMarked).toBe(false); // a passed turn (a sleeper) takes no Poison tick
    expect(actionDone(done({ perm: 0x08, dead: true }), true).poisonMarked).toBe(false);
    expect(actionDone(done({ perm: 0x08, inBattle: false }), true).poisonMarked).toBe(false);
    expect(actionDone(done({ perm: 0x08, skipPoison: true }), true).poisonMarked).toBe(false);
    expect(actionDone(done({ perm: 0x10 }), true).poisonMarked).toBe(false); // Power Break is not Poison
  });

  it('subHp clamps at 0 and at maximum HP, and a negative maximum wins', () => {
    expect(subHp(100, 300, 1000)).toBe(0);
    expect(subHp(900, -300, 1000)).toBe(1000);
    expect(subHp(5, 0, -5)).toBe(-5);
  });
});

describe('Doom (0x799cd0)', () => {
  const doomed = (over: Partial<Pick<TickChr, 'extra' | 'reentered' | 'doomCounter'>> = {}): Pick<TickChr, 'extra' | 'reentered' | 'doomCounter'> => ({
    extra: 0x4000,
    reentered: false,
    doomCounter: 5,
    ...over,
  });

  it('counts down at the doomed character\'s own turn and kills when the count reaches 0', () => {
    expect(doomTick(doomed({ doomCounter: 5 }))).toEqual({ counter: 4, fires: false });
    expect(doomTick(doomed({ doomCounter: 2 }))).toEqual({ counter: 1, fires: false });
    expect(doomTick(doomed({ doomCounter: 1 }))).toEqual({ counter: 0, fires: true });
  });

  it('a counter that already stands at 0 fires at once', () => {
    expect(doomTick(doomed({ doomCounter: 0 }))).toEqual({ counter: 0, fires: true });
  });

  it('needs the Doom bit, a turn that is not re-entered and an action buffer', () => {
    expect(doomTick(doomed({ extra: 0x0001 }))).toEqual({ counter: 5, fires: false });
    expect(doomTick(doomed({ reentered: true }))).toEqual({ counter: 5, fires: false });
    expect(doomTick(doomed(), false)).toEqual({ counter: 5, fires: false });
  });
});

// ------------------------------------------------------------------------------------------------ the golden vectors

type Row = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number[]];

/** A fixture holder row ([inBattle, dead, stone, silent, reentered, hp, maxHp, perm, extra, autoExtra, tick, p5c5, p5c6, ddb, counters]). */
function fromRow(r: Row): TickChr {
  return chr({
    inBattle: r[0] !== 0,
    dead: r[1] !== 0,
    petrified: r[2] !== 0,
    silent: r[3] !== 0,
    reentered: r[4] !== 0,
    hp: r[5],
    maxHp: r[6],
    perm: r[7],
    extra: r[8],
    autoExtra: r[9],
    tickCounter: r[10],
    threatenedBy: r[11],
    threatening: r[12],
    counters: r[14].slice(),
  });
}

/** A character back to a fixture row. The kernel never writes the silent flag (3), the re-entered byte (4) or the byte 0xddb (13), so those come from the original row. */
function toRow(c: TickChr, orig: Row): Row {
  return [c.inBattle ? 1 : 0, c.dead ? 1 : 0, c.petrified ? 1 : 0, orig[3], orig[4], c.hp, c.maxHp, c.perm, c.extra, c.autoExtra, c.tickCounter, c.threatenedBy, c.threatening, orig[13], c.counters.slice()];
}

const BLANK_ROW: Row = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 0, new Array<number>(13).fill(0)];

interface Vec<I, O> {
  class: string;
  in: I;
  out: O;
}

function vectorsOf<I, O>(file: string, cls: string): Array<Vec<I, O>> {
  const fx = loadFfxParityFixture(file);
  expect(fx, `tests/fixtures/parity/ffx/${file}.json is missing`).not.toBeNull();
  return (fx as unknown as { vectors: Array<Vec<I, O>> }).vectors.filter((v) => v.class === cls);
}

describe('golden vectors: the end-of-turn tick', () => {
  type In = { inBattle: number; silent: number; x508: number; x432: number; c: number[] };
  type Out = { c: number[]; calls: Array<Array<number | string>> };
  const vs = vectorsOf<In, Out>('turn_ticks_end', 'end');

  it('has vectors', () => expect(vs.length).toBeGreaterThan(150));

  it('replays every vector: the counters, the events, the wake-up and the recovery pose', () => {
    const reactions = { wake: 0, ended: 0, none: 0 };
    for (const v of vs) {
      const r = endOfTurnTick({ inBattle: v.in.inBattle !== 0, silent: v.in.silent !== 0, counters: v.in.c });
      expect(r.counters, JSON.stringify(v.in)).toEqual(v.out.c);
      const events = v.out.calls.filter((c) => c[0] === 'event').map((c) => ({ slot: c[2] as number, value: c[3] as number }));
      expect(r.events, JSON.stringify(v.in)).toEqual(events);
      const wake = v.out.calls.some((c) => c[0] === 'queueanim' && c[2] === 0x1b);
      const ended = v.out.calls.some((c) => c[0] === 'f320');
      expect(r.reaction === 'wake', JSON.stringify(v.in)).toBe(wake);
      expect(r.reaction === 'ended', JSON.stringify(v.in)).toBe(ended);
      reactions[r.reaction] += 1;
    }
    expect(reactions.wake).toBeGreaterThan(5);
    expect(reactions.ended).toBeGreaterThan(5);
    expect(reactions.none).toBeGreaterThan(20);
  });
});

describe('golden vectors: the action-done recovery, end tick and Poison marker', () => {
  type In = {
    id: number; queue: Array<[number, number]>; param2: number; param3: number; param4: number; de4: number; de6: number; rank: number;
    ctb: number; agi: number; perm: number; dead: number; inBattle: number; silent: number; df8: number; c: number[];
  };
  type Out = { ret: number; ctb: number; c: number[]; marker: number; de4: number; de6: number; count: number };
  const vs = vectorsOf<In, Out>('turn_ticks_end', 'done');

  it('has vectors', () => expect(vs.length).toBeGreaterThan(100));

  it('replays every vector', () => {
    let ended = 0;
    let marked = 0;
    let untouched = 0;
    for (const v of vs) {
      const i = v.in;
      const entry = i.queue[i.param2];
      // The queue bookkeeping the engine does not need: the entry that ends the turn is the one at queue index param2, for this
      // character, and a skip request (param4) leaves the entry the character is currently on alone.
      const matched = i.param2 !== 0xff && entry !== undefined && entry[0] === i.id && !(i.param4 !== 0 && i.param2 === i.de4);
      if (!matched || entry === undefined || entry[1] !== 0) {
        expect(v.out.ctb, JSON.stringify(i)).toBe(i.ctb);
        expect(v.out.c, JSON.stringify(i)).toEqual(i.c);
        expect(v.out.marker, JSON.stringify(i)).toBe(0xff);
        untouched += 1;
        continue;
      }
      const r = actionDone(
        { ctb: i.ctb, rank: i.rank, agi: i.agi, counters: i.c.slice(), inBattle: i.inBattle !== 0, silent: i.silent !== 0, perm: i.perm, dead: i.dead !== 0, skipPoison: i.df8 !== 0 },
        i.param3 !== 0,
      );
      expect(r.ctb, JSON.stringify(i)).toBe(v.out.ctb);
      expect(r.end.counters, JSON.stringify(i)).toEqual(v.out.c);
      expect(r.poisonMarked ? i.id : 0xff, JSON.stringify(i)).toBe(v.out.marker);
      ended += 1;
      if (r.poisonMarked) marked += 1;
    }
    expect(ended).toBeGreaterThan(60);
    expect(marked).toBeGreaterThan(10);
    expect(untouched).toBeGreaterThan(5);
  });
});

describe('golden vectors: the start-of-turn tick', () => {
  type In = { actor: number; death: number; holders: Record<string, Row> };
  type Out = { changed: Record<string, Row>; calls: Array<Array<number | string>> };
  const vs = vectorsOf<In, Out>('turn_ticks_start', 'start');

  it('has vectors', () => expect(vs.length).toBeGreaterThan(80));

  it('replays every vector: every holder\'s state, the damage numbers, the events, the stances and the Threaten release', () => {
    let payouts = 0;
    let zombies = 0;
    let stances = 0;
    let released = 0;
    for (const v of vs) {
      const rows: Row[] = Array.from({ length: TICK_SLOTS }, (_, s) => v.in.holders[String(s)] ?? BLANK_ROW);
      const before = rows.map(fromRow);
      const r = startOfTurnTick(before, v.in.actor);
      for (let s = 0; s < TICK_SLOTS; s++) {
        const want = v.out.changed[String(s)] ?? rows[s];
        expect(toRow(r.chrs[s] as TickChr, rows[s] as Row), `slot ${s} of ${JSON.stringify(v.in)}`).toEqual(want);
      }
      const numbers = v.out.calls.filter((c) => c[0] === 'num').map((c) => c[3] as number);
      expect(r.payouts.map((p) => (p.damage ? p.amount : -p.amount)), JSON.stringify(v.in)).toEqual(numbers);
      const events = v.out.calls.filter((c) => c[0] === 'event').map((c) => ({ slot: c[2] as number, value: c[3] as number }));
      expect(r.events, JSON.stringify(v.in)).toEqual(events);
      // Defend, Sentinel and Shield also request a pose (0x7af840) when they end; Guard and Boost do not
      const poses = v.out.calls.filter((c) => c[0] === 'stance').length;
      expect(r.stancesCleared.filter((b) => b === 0x0800 || b === 0x2000 || b === 0x0040).length, JSON.stringify(v.in)).toBe(poses);
      // every damaging payout is followed by the death check
      expect(v.out.calls.filter((c) => c[0] === 'dcd').length, JSON.stringify(v.in)).toBe(r.payouts.filter((p) => p.damage).length);
      payouts += r.payouts.length;
      zombies += r.payouts.filter((p) => p.damage).length;
      stances += r.stancesCleared.length;
      const a = before[v.in.actor] as TickChr;
      if ((a.perm & 0x0800) !== 0 && ((r.chrs[v.in.actor] as TickChr).perm & 0x0800) === 0) released += 1;
    }
    expect(payouts).toBeGreaterThan(80);
    expect(zombies).toBeGreaterThan(5);
    expect(stances).toBeGreaterThan(30);
    expect(released).toBeGreaterThan(10);
  });
});

describe('golden vectors: the Threaten release on its own', () => {
  type In = { actor: number; holders: Record<string, Row> };
  type Out = { changed: Record<string, Row> };
  const vs = vectorsOf<In, Out>('turn_ticks_start', 'threat');

  it('has vectors', () => expect(vs.length).toBeGreaterThan(50));

  it('replays every vector', () => {
    let linked = 0;
    for (const v of vs) {
      const rows: Row[] = Array.from({ length: TICK_SLOTS }, (_, s) => v.in.holders[String(s)] ?? BLANK_ROW);
      const r = releaseThreaten(rows.map(fromRow), v.in.actor);
      for (let s = 0; s < TICK_SLOTS; s++) {
        const want = v.out.changed[String(s)] ?? rows[s];
        expect(toRow(r[s] as TickChr, rows[s] as Row), `slot ${s} of ${JSON.stringify(v.in)}`).toEqual(want);
      }
      if ((rows[v.in.actor] as Row)[7] & 0x0800) linked += 1;
    }
    expect(linked).toBeGreaterThan(30);
  });
});

describe('golden vectors: Poison', () => {
  type In = { id: number; pct: number; maxHp: number; hp: number; df8: number; marker: number };
  type Out = { hp: number; marker: number; df8: number; num: number[] };
  const vs = vectorsOf<In, Out>('turn_ticks_misc', 'poison');

  it('has vectors', () => expect(vs.length).toBeGreaterThan(80));

  it('replays every vector', () => {
    let fired = 0;
    for (const v of vs) {
      const r = poisonTick({ hp: v.in.hp, maxHp: v.in.maxHp, poisonPercent: v.in.pct }, v.in.id, v.in.marker);
      expect(r.hpAfter, JSON.stringify(v.in)).toBe(v.out.hp);
      expect(r.marker, JSON.stringify(v.in)).toBe(v.out.marker);
      expect(r.fired ? [r.amount] : [], JSON.stringify(v.in)).toEqual(v.out.num);
      if (r.fired) fired += 1;
    }
    expect(fired).toBeGreaterThan(30);
  });
});

describe('golden vectors: Doom', () => {
  type In = { id: number; extra: number; reentered: number; counter: number; hasBuffer: number };
  type Out = { ret: number; counter: number; buf: number[] | null; touched: number[] | null };
  const vs = vectorsOf<In, Out>('turn_ticks_misc', 'doom');

  it('has vectors', () => expect(vs.length).toBeGreaterThan(60));

  it('replays every vector: the counter, whether the kill is queued, and what is written into the action buffer', () => {
    let fires = 0;
    for (const v of vs) {
      const r = doomTick({ extra: v.in.extra, reentered: v.in.reentered !== 0, doomCounter: v.in.counter }, v.in.hasBuffer !== 0);
      expect(r.counter, JSON.stringify(v.in)).toBe(v.out.counter);
      expect(r.fires ? 1 : 0, JSON.stringify(v.in)).toBe(v.out.ret);
      if (r.fires) {
        fires += 1;
        // the kill is the doomed character's own action: the buffer gets its id, byte 3 = 1, the Doom kill command (0x3120 at
        // VA 0x00ff3120) and a target mask of only itself
        expect(v.out.buf, JSON.stringify(v.in)).toEqual([v.in.id, 1, 0x00ff3120, 1 << (v.in.id & 31)]);
      } else {
        expect(v.out.touched ?? [], JSON.stringify(v.in)).toEqual([]);
      }
    }
    expect(fires).toBeGreaterThan(8);
  });
});
