/**
 * Parity tests for the FFX-2 status-timer kernels (`src/battle/ffx2/kernel/status-timers.ts`, `status-timers-set.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); functions 0x00636e80
 * (`MsStatusProcess`), 0x00636c70 (`MsSetStatus`), 0x00636660 (`pp_status_expire`, Doom), 0x006368d0
 * (`MsResetDefenseStatus`), 0x0061a800 (`pp_has_auto_life`), 0x006218c0 (the group 2 flag word) and the rom.bin
 * constants. Spec: `research/re-ffx2-atb-status.md` sections 6 and 7.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments (counts, steps, and the seconds at 30 and at 60 steps a second);
 * - golden vectors: rows produced by running the real functions in the emulator harness (`ffxparity`, Unicorn) with a
 *   scripted generator and the presentation routines recorded. The fixture blocks at the end load
 *   `tests/fixtures/parity/ffx2/status_*.json` (a stratified pick of 179 rows in three files); the full sets (8,000 process
 *   vectors, 7,722 MsSetStatus vectors, 1,300 smaller ones and 210 lifecycle sequences of 300 to 1,500 steps) matched
 *   with no difference on 2026-10-08.
 */

import { describe, expect, it } from 'vitest';
import { FFX2_CLOCK_OPEN, atbSpeeds, stopState, type Ffx2ClockFlags } from '../../src/battle/ffx2/kernel/atb.ts';
import {
  FFX2_AUTO_LIFE_COMMAND,
  FFX2_DOOM_DEATH_COMMAND,
  FFX2_STATUS_ROM,
  clampAdd,
  hasAutoLife,
  recomputeStatus,
  resetDefense,
  startPhase,
  status2Speed,
  statusProcess,
  statusTimersStep,
  type Ffx2SetStatusInput,
  type Ffx2TimerChr,
} from '../../src/battle/ffx2/kernel/status-timers.ts';
import { STATUS2_INFO } from '../../src/battle/ffx2/kernel/statusTypes.ts';
import { arr, clockFlags, inOf, kernelCheck, num, outOf, sub, unsignedBytes, vectorsOf, type Rec } from './helpers/ffx2AtbAdapters.ts';
import { scriptedDraw } from './helpers/ffx2ParityFixture.ts';

const z24 = (): number[] => new Array<number>(24).fill(0);
const with24 = (entries: Record<number, number>, base: number[] = z24()): number[] => {
  const a = [...base];
  for (const [i, v] of Object.entries(entries)) a[Number(i)] = v;
  return a;
};
const script = (...values: number[]): { draw: (s: number) => number; streams: number[] } => {
  const streams: number[] = [];
  return { streams, draw: (s) => (streams.push(s), values[streams.length - 1] ?? Number.NaN) };
};

/** A healthy character in the battle at Normal speed (95 on every speed) with nothing running. */
const chr = (over: Partial<Ffx2TimerChr> = {}): Ffx2TimerChr => ({
  inBattle: true,
  hidden: false,
  hp: 1000,
  dead: false,
  status1: 0,
  applied: 0,
  timers: z24(),
  counters: z24(),
  accumulators: z24(),
  regenByte: 0,
  poisonAcc: 0,
  regenAcc: 0,
  poisonPeriod: 16000,
  regenPeriod: 16000,
  poisonDamage: 8,
  regenDamage: 8,
  maxHp: 1234,
  speeds: { raw: 95, awake: 95, active: 95 },
  stopState: 0,
  condemned: false,
  ...over,
});

const flagsWith = (over: Partial<Ffx2ClockFlags>): Ffx2ClockFlags => ({ ...FFX2_CLOCK_OPEN, ...over });
const step = (c: Ffx2TimerChr, gate1 = true, gate7 = true) => statusTimersStep(c, gate1, gate7);

/** Runs `n` steps (or until `until` says stop) and returns the last character and the step it stopped at. */
function run(c0: Ffx2TimerChr, n: number, until: (r: ReturnType<typeof step>) => boolean = () => false) {
  let c = c0;
  for (let s = 1; s <= n; s++) {
    const r = step(c);
    c = r.chr;
    if (until(r)) return { chr: c, steps: s, last: r };
  }
  return { chr: c, steps: n, last: null };
}

describe('rom.bin constants (battle/kernel/rom.bin, the btl_rom struct loaded to VA 0x00df7e74)', () => {
  it('Poison and Regen: period 16,000, factor 8 (1/32 of max HP); the count steps are 1,500 and 10,000', () => {
    expect(FFX2_STATUS_ROM).toMatchObject({ poisonTime: 16000, poisonDamage: 8, regenTime: 16000, regenDamage: 8 });
    expect(FFX2_STATUS_ROM.countValue).toEqual([1500, 10000]);
  });

  it('only Sleep (150,000), Confusion (200,000) and Berserk (200,000) start with a timer; everything else never expires by time', () => {
    const nonZero = FFX2_STATUS_ROM.offCount.map((v, i) => [i, v]).filter(([, v]) => v !== 0);
    expect(nonZero).toEqual([[2, 150000], [6, 200000], [7, 200000]]);
  });

  it('the group 2 flag words: 4 is a 1,500-unit count, 8 a 10,000-unit count that ends in death, 0x40 / 0x80 pick the speed', () => {
    expect(STATUS2_INFO.slice(0, 7)).toEqual([0x05, 0x05, 0x05, 0x04, 0x04, 0x24, 0x5a4]);
    expect(STATUS2_INFO[14]).toBe(0x68);
    expect([15, 16, 17].map((i) => STATUS2_INFO[i])).toEqual([4, 4, 4]);
    expect(STATUS2_INFO.slice(7, 14)).toEqual([0, 0, 0, 0, 0, 0, 0]); // the stat stages do not count down
    const sp = { raw: 95, awake: 60, active: 47 };
    expect([0, 3, 5, 14, 6].map((i) => status2Speed(STATUS2_INFO[i] ?? 0, sp))).toEqual([47, 47, 47, 60, 95]); // Shell, Regen, Slow: active; Doom: awake; Stop: raw
  });
});

describe('group 1 timers: Sleep, Confusion, Berserk (MsStatusProcess, exe 0x00636e80)', () => {
  it('Sleep starts at 150,000 and loses the raw speed each step: it wakes on step 1,579 (150,000 / 95 = 1,578.9)', () => {
    const c = chr({ applied: 1 << 2, status1: 4, timers: with24({ 2: 150000 }), speeds: { raw: 95, awake: 95, active: 0 }, stopState: 4 });
    const after1 = step(c).chr;
    expect(after1.timers[2]).toBe(149905);
    const woke = run(c, 3000, (r) => r.events.expiredGroup1.length > 0);
    // 1,578 * 95 = 149,910 leaves 90; step 1,579 takes it below 0
    expect(woke.steps).toBe(1579);
    expect(woke.last?.events).toMatchObject({ expiredGroup1: [2], recompute: true, effectCheck: true, notice: 0xc });
    expect(woke.chr.timers[2]).toBe(0);
    expect(woke.chr.applied).toBe(0);
    // 1,579 steps are 52.6 s at 30 steps a second and 26.3 s at 60
    expect(1579 / 30).toBeCloseTo(52.633, 3);
    expect(1579 / 60).toBeCloseTo(26.317, 3);
  });

  it('Confusion and Berserk start at 200,000: they run out on step 2,106 (70.2 s at 30 steps a second, 35.1 s at 60)', () => {
    for (const bit of [6, 7]) {
      const c = chr({ applied: 1 << bit, status1: 1 << bit, timers: with24({ [bit]: 200000 }) });
      const r = run(c, 5000, (x) => x.events.expiredGroup1.length > 0);
      expect(r.steps).toBe(2106);
      expect(r.last?.events.notice).toBe(2); // not asleep: the plain "ended" notice
    }
  });

  it('a timer that lands exactly on 0 stays at 0 with its bit set and never wakes: Sleep at the Fast speed (120 divides 150,000 exactly)', () => {
    const c = chr({ applied: 1 << 2, timers: with24({ 2: 150000 }), speeds: { raw: 120, awake: 120, active: 0 } });
    const r = run(c, 2000);
    expect(r.chr.timers[2]).toBe(0);
    expect(r.chr.applied).toBe(1 << 2);
    // 1,250 * 120 = 150,000; from step 1,251 on the "above 0" test fails and nothing moves
    expect(run(c, 1249).chr.timers[2]).toBe(120);
    expect(run(c, 1250).chr.timers[2]).toBe(0);
    expect(run(c, 1250).chr.applied).toBe(1 << 2);
    // the same at 60 (Fast and Slowed); at 95 or Hasted at Normal (99) it wakes
    expect(run({ ...c, speeds: { raw: 60, awake: 60, active: 0 } }, 3000).chr.applied).toBe(1 << 2);
    expect(run({ ...c, speeds: { raw: 99, awake: 99, active: 0 } }, 3000).chr.applied).toBe(0);
    expect(run({ ...c, speeds: { raw: 70, awake: 70, active: 0 } }, 3000).chr.applied).toBe(0); // the Slow setting wakes
    // Confusion at 200,000 is not a multiple of 70, 95, 120, 99, 47 or 126, so it always ends
    for (const sp of [70, 95, 120, 99, 47, 126, 60, 35, 73]) {
      expect(run(chr({ applied: 1 << 6, timers: with24({ 6: 200000 }), speeds: { raw: sp, awake: sp, active: sp } }), 8000).chr.applied, `speed ${sp}`).toBe(0);
    }
  });

  it('the timer runs at the raw speed, so a Stopped, asleep or petrified status keeps counting; a zero timer (Poison) never expires', () => {
    const stopped = chr({ applied: 1 << 6, timers: with24({ 6: 1000 }), speeds: { raw: 95, awake: 0, active: 0 }, stopState: 1 });
    expect(step(stopped).chr.timers[6]).toBe(905);
    const poisoned = chr({ applied: 1 << 5, status1: 0x20, timers: with24({ 5: 0 }), poisonAcc: 0 });
    expect(run(poisoned, 5000).chr.applied).toBe(1 << 5);
  });

  it('only bits set in the applied mask count down; two statuses ending on one step both go, and a Sleep among them gives notice 0xc', () => {
    const c = chr({ applied: (1 << 2) | (1 << 7), timers: with24({ 2: 50, 7: 60, 6: 10 }) });
    const r = step(c);
    expect(r.chr.timers[6]).toBe(10); // bit 6 is not in the mask
    expect(r.events).toMatchObject({ expiredGroup1: [2, 7], notice: 0xc });
    // Berserk alone gives the plain notice
    expect(step(chr({ applied: 1 << 7, timers: with24({ 7: 60 }) })).events.notice).toBe(2);
  });

  it('skipped: petrified, dead, hidden, out of the battle, no HP, or the status clock gate closed', () => {
    const base = chr({ applied: 1 << 2, timers: with24({ 2: 500 }) });
    for (const over of [{ status1: 2 }, { dead: true }, { hidden: true }, { inBattle: false }, { hp: 0 }, { hp: -5 }]) {
      expect(step({ ...base, ...over }).chr.timers[2], JSON.stringify(over)).toBe(500);
    }
    expect(step(base, false, true).chr.timers[2]).toBe(500);
    expect(step(base, true, false).chr.timers[2]).toBe(405); // group 1 only needs gate 1
  });
});

describe('group 2 counters (Shell ... Slow, Stop, Doom, the immunities)', () => {
  it('Shell with a counter of 3 at the active speed 95: each count is 1,500 units, so it expires on step 48 (4,500 / 95 = 47.4; the remainder is carried)', () => {
    const c = chr({ counters: with24({ 0: 3 }) });
    const counts: Array<[number, number, number]> = [];
    let cur = c;
    let expiredAt = 0;
    for (let s = 1; s <= 60 && expiredAt === 0; s++) {
      const r = step(cur);
      if (r.chr.counters[0] !== cur.counters[0]) counts.push([s, r.chr.accumulators[0] ?? 0, r.chr.counters[0] ?? 0]);
      cur = r.chr;
      if (r.events.expiredGroup2.length > 0) expiredAt = s;
    }
    // step 16: 16 * 95 = 1,520 -> counter 2, carry 20;  step 32: 20 + 16 * 95 = 1,540 -> counter 1, carry 40;  step 48: -> 0, carry 60
    expect(counts).toEqual([[16, 20, 2], [32, 40, 1], [48, 60, 0]]);
    expect(expiredAt).toBe(48);
  });

  it('a count of 20 (Haste from a 20-count row) lasts 316 steps: 10.5 s at 30 steps a second, 5.3 s at 60', () => {
    const r = run(chr({ counters: with24({ 4: 20 }) }), 1000, (x) => x.events.expiredGroup2.length > 0);
    expect(r.steps).toBe(316);
    expect(r.steps / 30).toBeCloseTo(10.533, 3);
    expect(r.steps / 60).toBeCloseTo(5.267, 3);
    expect(r.last?.events.expiredGroup2).toEqual([{ index: 4, flags: 0x04 }]);
  });

  it('they use the ACTIVE speed, so a sleeping or Stopped character stops counting; Stop counts at the raw speed and Doom at the awake speed', () => {
    const sleeping = { raw: 95, awake: 95, active: 0 };
    const counters = with24({ 0: 125, 6: 125, 14: 125 });
    const after = run(chr({ counters, speeds: sleeping, stopState: 4 }), 100).chr;
    expect(after.accumulators[0]).toBe(0); // Shell frozen: no active speed
    // Stop: 100 * 95 = 9,500 raw units = 6 counts of 1,500 (9,000) with 500 left
    expect([after.counters[6], after.accumulators[6]]).toEqual([119, 500]);
    // Doom: 100 * 95 = 9,500 awake units, one short of a 10,000 count
    expect([after.counters[14], after.accumulators[14]]).toEqual([125, 9500]);
  });

  it('Stop counts down at the raw speed even while the character is Stopped; the other counters and Poison wait', () => {
    const stopped = chr({ counters: with24({ 6: 2, 0: 2 }), speeds: { raw: 95, awake: 0, active: 0 }, stopState: 1 });
    const r = run(stopped, 32);
    // 1,500 per count at 95: counter 2 -> 1 on step 16, -> 0 on step 32 (accumulator carries 40)
    expect(r.chr.counters[6]).toBe(0);
    expect(r.chr.accumulators[0]).toBe(0); // Shell did not move
  });

  it('Doom counts in 10,000 units at the awake speed and ends at 1: a counter of 3 needs 2 counts (211 steps), one of 6 needs 5 (527 steps)', () => {
    const doom3 = run(chr({ counters: with24({ 14: 3 }) }), 1000, (x) => x.events.doom);
    expect(doom3.steps).toBe(211);
    expect(doom3.chr.condemned).toBe(true);
    expect(doom3.chr.counters[14]).toBe(1);
    expect(doom3.last?.events.expiredGroup2).toEqual([{ index: 14, flags: 0x68 }]);
    const doom6 = run(chr({ counters: with24({ 14: 6 }) }), 2000, (x) => x.events.doom);
    expect(doom6.steps).toBe(527);
    expect(doom6.steps / 30).toBeCloseTo(17.567, 3); // 17.6 s at 30 steps a second, 8.8 s at 60
    expect(doom6.steps / 60).toBeCloseTo(8.783, 3);
    // asleep keeps the awake speed (Doom still runs); Stopped or petrified does not
    expect(run(chr({ counters: with24({ 14: 3 }), speeds: { raw: 95, awake: 95, active: 0 }, stopState: 4 }), 1000, (x) => x.events.doom).steps).toBe(211);
    expect(run(chr({ counters: with24({ 14: 3 }), speeds: { raw: 95, awake: 0, active: 0 }, stopState: 1 }), 1000, (x) => x.events.doom).last).toBeNull();
  });

  it('a Doom counter of 1, 0, 126 or more, or a negative one, never counts; the stat stages (index 7 to 13) never count', () => {
    for (const v of [0, 1, 126, 127, -128, -1]) {
      expect(run(chr({ counters: with24({ 14: v }) }), 400).chr.counters[14], `doom ${v}`).toBe(v);
    }
    const stages = chr({ counters: with24({ 7: 3, 8: -3, 13: 10 }), accumulators: with24({ 7: 7 }) });
    const r = run(stages, 500).chr;
    expect(r.counters.slice(7, 14)).toEqual([3, -3, 0, 0, 0, 0, 10]);
    expect(r.accumulators[7]).toBe(7);
  });

  it('the accumulator is a signed 16-bit number: 32,767 + 95 wraps negative and the count waits for it to climb back', () => {
    const c = chr({ counters: with24({ 0: 3 }), accumulators: with24({ 0: 32767 }) });
    expect(step(c).chr.accumulators[0]).toBe(-32674); // 32,767 + 95 = 32,862 -> 32,862 - 65,536
    expect(step(c).chr.counters[0]).toBe(3);
  });

  it('speed 0 adds nothing and never counts, even with a full accumulator', () => {
    const c = chr({ counters: with24({ 0: 3 }), accumulators: with24({ 0: 1600 }), speeds: { raw: 0, awake: 0, active: 0 } });
    expect(step(c).chr).toMatchObject({ accumulators: with24({ 0: 1600 }), counters: with24({ 0: 3 }) });
  });

  it('the gate for mask 7 (no action, no command executing) freezes the group 2 counters and Poison, but not the group 1 timers', () => {
    const c = chr({ counters: with24({ 0: 3 }), applied: 1 << 2, timers: with24({ 2: 500 }) });
    const r = statusProcess([{ id: 0, chr: c }], flagsWith({ actionExecuting: true }));
    expect(r[0]?.chr.accumulators[0]).toBe(0);
    expect(r[0]?.chr.timers[2]).toBe(405);
  });
});

describe('Poison and Regen ticks', () => {
  it('Poison adds the awake speed each step and ticks when the accumulator is ABOVE 16,000, subtracting the period: 15,905 + 95 = 16,000 does not tick, the next step does', () => {
    const c = chr({ status1: 0x20, poisonAcc: 15905 });
    const first = step(c);
    expect(first.events.tick).toBeNull();
    expect(first.chr.poisonAcc).toBe(16000);
    const second = step(first.chr);
    // 16,095 > 16,000: 16,095 - 16,000 = 95
    expect(second.events.tick).toEqual({ kind: 'poison', amount: 38 }); // (8 * 1234) >> 8 = 9,872 >> 8 = 38 (38.56)
    expect(second.chr.poisonAcc).toBe(95);
  });

  it('from an empty accumulator the first tick is on step 169 (169 * 95 = 16,055), then 337, 506: every 168 or 169 steps (5.6 s at 30 steps a second)', () => {
    const ticks: number[] = [];
    let c = chr({ status1: 0x20 });
    for (let s = 1; s <= 520; s++) {
      const r = step(c);
      c = r.chr;
      if (r.events.tick) ticks.push(s);
    }
    expect(ticks).toEqual([169, 337, 506]);
    expect(168.42 / 30).toBeCloseTo(5.614, 3);
    expect(168.42 / 60).toBeCloseTo(2.807, 3);
  });

  it('the damage is (factor * max HP) >> 8 with an unsigned shift and no minimum: 1,234 -> 38, 9,999 -> 312, 31 -> 0; Regen is the negative of the same', () => {
    const tick = (maxHp: number, k: 'poison' | 'regen') =>
      step(chr(k === 'poison' ? { status1: 0x20, poisonAcc: 16000, maxHp } : { regenByte: 1, regenAcc: 16000, maxHp })).events.tick;
    expect(tick(1234, 'poison')).toEqual({ kind: 'poison', amount: 38 });
    expect(tick(9999, 'poison')).toEqual({ kind: 'poison', amount: 312 }); // 79,992 >> 8
    expect(tick(31, 'poison')).toEqual({ kind: 'poison', amount: 0 }); // 248 >> 8
    expect(tick(1234, 'regen')).toEqual({ kind: 'regen', amount: -38 });
    // HP x2 doubles max HP and so the tick: 2,468 -> 77 (19,744 >> 8)
    expect(tick(2468, 'poison')).toEqual({ kind: 'poison', amount: 77 });
    // the product wraps at 32 bits: 8 * 0x20000000 = 2^32 -> 0
    expect(tick(0x20000000, 'poison')).toEqual({ kind: 'poison', amount: 0 });
  });

  it('when Poison ticks, Regen is not looked at that step: its accumulator does not advance', () => {
    const c = chr({ status1: 0x20, poisonAcc: 16000, regenByte: 1, regenAcc: 100 });
    const r = step(c);
    expect(r.events.tick?.kind).toBe('poison');
    expect(r.chr.regenAcc).toBe(100);
    // without a Poison tick both advance
    const both = step(chr({ status1: 0x20, poisonAcc: 0, regenByte: 1, regenAcc: 100 }));
    expect([both.chr.poisonAcc, both.chr.regenAcc]).toEqual([95, 195]);
  });

  it('they use the awake speed: asleep still ticks, Stopped and petrified do not; a petrified, dead or absent character is skipped entirely', () => {
    const base = chr({ status1: 0x20, poisonAcc: 100 });
    const sleeping = step({ ...base, speeds: { raw: 95, awake: 95, active: 0 }, stopState: 4 }).chr.poisonAcc;
    const stopped = step({ ...base, speeds: { raw: 95, awake: 0, active: 0 }, stopState: 1 }).chr.poisonAcc;
    expect([sleeping, stopped]).toEqual([195, 100]);
    // the speeds are re-gated against the stop state NOW: stale speeds from before a status landed this step do not matter
    expect(step({ ...base, stopState: 1 }).chr.poisonAcc).toBe(100);
    expect(step({ ...base, stopState: 4 }).chr.poisonAcc).toBe(195);
    expect(step({ ...base, status1: 0x22 }).chr.poisonAcc).toBe(100);
  });

  it('the period 16,000 and a speed of 0: nothing ever ticks', () => {
    expect(run(chr({ status1: 0x20, speeds: { raw: 0, awake: 0, active: 0 } }), 600).last).toBeNull();
    expect(run(chr({ status1: 0x20, poisonPeriod: 0, poisonAcc: 0 }), 1, (r) => r.events.tick !== null).steps).toBe(1); // a period of 0 ticks at once
  });
});

describe('Doom (pp_status_expire, exe 0x00636660) and Auto-Life (pp_has_auto_life, exe 0x0061a800)', () => {
  it('the expiry condemns the character once and queues command 0x3026 on itself (its own bit as the target mask) after closing its menu', () => {
    const r = run(chr({ counters: with24({ 14: 2 }), accumulators: with24({ 14: 9950 }) }), 5, (x) => x.events.doom);
    expect(r.steps).toBe(1);
    expect(r.chr.condemned).toBe(true);
    expect(FFX2_DOOM_DEATH_COMMAND).toBe(0x3026);
    // an already condemned character does not queue it again
    const again = step(chr({ counters: with24({ 14: 2 }), accumulators: with24({ 14: 9950 }), condemned: true }));
    expect(again.events.doom).toBe(false);
    expect(again.events.expiredGroup2).toEqual([{ index: 14, flags: 0x68 }]);
  });

  it('a condemned sleeper is no longer reported asleep, so the ATB and the status clocks stop treating it as sleeping', () => {
    expect(stopState({ status1: 4, stopStage: 0, condemned: true })).toBe(0);
  });

  it('Auto-Life triggers on a dead character who does not leave the fight on death, has the status (0x40000) and is not ejected (0x400); the command is 0x3025', () => {
    expect(hasAutoLife(true, false, 0x40000)).toBe(true);
    expect(hasAutoLife(true, false, 0x40001)).toBe(true);
    expect(hasAutoLife(false, false, 0x40000)).toBe(false);
    expect(hasAutoLife(true, true, 0x40000)).toBe(false);
    expect(hasAutoLife(true, false, 0x40400)).toBe(false);
    expect(hasAutoLife(true, false, 0)).toBe(false);
    expect(FFX2_AUTO_LIFE_COMMAND).toBe(0x3025);
  });

  it('Defense is cleared from the APPLIED mask when a character becomes ready; a Defense held by a permanent source stays and MsSetStatus is not needed', () => {
    expect(resetDefense(0x200, 0x200)).toEqual({ ret: 1, applied: 0, recompute: true });
    expect(resetDefense(0x201, 0x3ff)).toEqual({ ret: 1, applied: 0x1ff, recompute: true });
    expect(resetDefense(0x1ff, 0x1ff)).toEqual({ ret: 0, applied: 0x1ff, recompute: false }); // no Defense in the effective word
    // a permanent source (in the effective word but not applied): the bit comes off the applied mask, which had none; the effective word is recomputed
    expect(resetDefense(0x200, 0)).toEqual({ ret: 1, applied: 0, recompute: true });
  });
});

describe('MsSetStatus (exe 0x00636c70): merging the layers, the clean-up, the starting timers and phases', () => {
  const input = (over: Partial<Ffx2SetStatusInput> = {}): Ffx2SetStatusInput => ({
    id: 1,
    linkRefresh: true,
    oldStatus1: 0,
    oldRegenByte: 0,
    stopBefore: 0,
    stopAfter: (s1, sb) => stopState({ status1: s1, stopStage: sb, condemned: false }),
    masks: { m570: 0, m550: 0, m4fc: 0, m450: 0 },
    layers: { l4b4: z24(), l500: z24(), l574: z24(), l554: z24() },
    timers: z24(),
    poisonPeriod: 16000,
    regenPeriod: 16000,
    poisonAcc: 0,
    regenAcc: 0,
    ...over,
  });

  it('the effective status word is the OR of the four masks', () => {
    const r = recomputeStatus(input({ masks: { m570: 1, m550: 2, m4fc: 4, m450: 0x20 } }), script().draw);
    expect(r.status1).toBe(0x27);
  });

  it('each stage byte is the saturating sum of the four layers over -125..125; an operand already above the limit is returned unclamped (the larger one)', () => {
    expect(clampAdd(100, 100, -125, 125)).toBe(125);
    expect(clampAdd(-100, -100, -125, 125)).toBe(-125);
    expect(clampAdd(126, 5, -125, 125)).toBe(126);
    expect(clampAdd(5, 127, -125, 125)).toBe(127);
    expect(clampAdd(-3, 10, -125, 125)).toBe(7);
    const r = recomputeStatus(input({ layers: { l4b4: with24({ 0: 100, 7: 3 }), l500: with24({ 0: 100 }), l574: with24({ 7: 2 }), l554: with24({ 7: -1 }) } }), script().draw);
    expect([r.bytes[0], r.bytes[7]]).toEqual([125, 4]);
  });

  it('Stop clears Haste and Slow; Haste clears Slow; Slow alone stays', () => {
    const bytes = (b: Record<number, number>) => recomputeStatus(input({ layers: { l4b4: with24(b), l500: z24(), l574: z24(), l554: z24() } }), script().draw).bytes.slice(4, 7);
    expect(bytes({ 4: 10, 5: 10, 6: 10 })).toEqual([0, 0, 10]);
    expect(bytes({ 4: 10, 5: 10 })).toEqual([10, 0, 0]);
    expect(bytes({ 5: 10 })).toEqual([0, 10, 0]);
  });

  it('a bit that has just appeared loads its starting timer: Sleep 150,000, Confusion and Berserk 200,000, the others 0; bits already set are not reloaded', () => {
    const r = recomputeStatus(input({ oldStatus1: 1 << 7, masks: { m570: 0, m550: 0, m4fc: 0, m450: (1 << 2) | (1 << 6) | (1 << 7) | (1 << 3) }, timers: with24({ 7: 12345, 3: 77 }) }), script().draw);
    expect([r.timers[2], r.timers[6], r.timers[7], r.timers[3]]).toEqual([150000, 200000, 12345, 0]);
  });

  it('a new Poison draws draw % (16000 / 4 + 1) = draw % 4001 for its first tick; a new Regen the same, Poison first, on the purpose-0 stream', () => {
    const s = script(10000, 9);
    const r = recomputeStatus(input({ id: 1, masks: { m570: 0, m550: 0, m4fc: 0, m450: 0x20 }, layers: { l4b4: with24({ 3: 5 }), l500: z24(), l574: z24(), l554: z24() } }), s.draw);
    // 10,000 % 4,001 = 1,998; Regen byte 5 is new: 9 % 4,001 = 9
    expect([r.poisonAcc, r.regenAcc]).toEqual([1998, 9]);
    expect(s.streams).toEqual([21, 21]);
    expect(startPhase(script(4001).draw, 1, 16000)).toBe(0);
    expect(startPhase(script(4000).draw, 1, 16000)).toBe(4000);
    // already poisoned, or Regen already on: no draw
    const quiet = script();
    recomputeStatus(input({ oldStatus1: 0x20, oldRegenByte: 3, masks: { m570: 0, m550: 0, m4fc: 0, m450: 0x20 }, layers: { l4b4: with24({ 3: 5 }), l500: z24(), l574: z24(), l554: z24() } }), quiet.draw);
    expect(quiet.streams).toEqual([]);
  });

  it('the petrify, death and eject bits changing flag their callbacks; the status link is refreshed only if the stop state changed', () => {
    const r = recomputeStatus(input({ oldStatus1: 0, masks: { m570: 0, m550: 0, m4fc: 0, m450: 0x403 } }), script().draw);
    expect([r.petrifyChanged, r.deathChanged, r.ejectChanged]).toEqual([true, true, true]);
    expect(r.linkRefresh).toBe(true); // petrified: the stop state went from 0 to 2
    const quiet = recomputeStatus(input({ oldStatus1: 0, masks: { m570: 0, m550: 0, m4fc: 0, m450: 0x20 } }), script(5).draw);
    expect([quiet.petrifyChanged, quiet.deathChanged, quiet.ejectChanged, quiet.linkRefresh]).toEqual([false, false, false, false]);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('multi-step: a status lifecycle through the process and MsSetStatus, by hand', () => {
  it('a Haste counter of 20, then Slow replaces it: the speed read each step follows the recomputed bytes', () => {
    // the glue an engine adapter writes: speeds from the bytes, the process, then MsSetStatus when anything counted
    let counters = with24({ 4: 20 });
    let bytes = recomputeStatus(
      {
        id: 0, linkRefresh: true, oldStatus1: 0, oldRegenByte: 0, stopBefore: 0, stopAfter: () => 0,
        masks: { m570: 0, m550: 0, m4fc: 0, m450: 0 }, layers: { l4b4: counters, l500: z24(), l574: z24(), l554: z24() },
        timers: z24(), poisonPeriod: 16000, regenPeriod: 16000, poisonAcc: 0, regenAcc: 0,
      },
      script().draw,
    ).bytes;
    expect(atbSpeeds({ base: 95, hasted: bytes[4] !== 0, slowed: bytes[5] !== 0, stopState: 0, charging: false, hitReaction: false, hitReactionExempt: false }).raw).toBe(99);
    // slow lands: Slow wins over nothing, Haste is cleared by Slow only through the Stop rule, so both bytes stand until Haste expires
    counters = with24({ 4: 20, 5: 3 });
    bytes = recomputeStatus(
      {
        id: 0, linkRefresh: true, oldStatus1: 0, oldRegenByte: 0, stopBefore: 0, stopAfter: () => 0,
        masks: { m570: 0, m550: 0, m4fc: 0, m450: 0 }, layers: { l4b4: counters, l500: z24(), l574: z24(), l554: z24() },
        timers: z24(), poisonPeriod: 16000, regenPeriod: 16000, poisonAcc: 0, regenAcc: 0,
      },
      script().draw,
    ).bytes;
    // Haste (byte 4 non-zero) clears Slow in the recompute: the speed stays hasted (99)
    expect([bytes[4], bytes[5]]).toEqual([20, 0]);
  });

  it('Poison from nothing: the start phase 3,000 puts the first tick on step 137 ((16,000 - 3,000) / 95 = 136.8), then every 168 or 169 steps', () => {
    const phase = startPhase(script(3000).draw, 0, 16000);
    expect(phase).toBe(3000);
    let c = chr({ status1: 0x20, poisonAcc: phase });
    const ticks: number[] = [];
    for (let s = 1; s <= 520; s++) {
      const r = step(c);
      c = r.chr;
      if (r.events.tick) ticks.push(s);
    }
    // 3,000 + 137 * 95 = 16,015 > 16,000 -> 15 left; then 15 + 169 * 95 = 16,070 -> step 306; 70 + 168 * 95 = 16,030 -> step 474
    expect(ticks).toEqual([137, 306, 474]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Golden vectors from the emulator
// ---------------------------------------------------------------------------------------------------------
function failWith(v: { id: number; class: string }, e: unknown): never {
  throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
}
const s8 = (x: number): number => (x << 24) >> 24;

describe('golden vectors: MsStatusProcess (tests/fixtures/parity/ffx2/status_process.json)', () => {
  const fx = kernelCheck('status_process');
  (fx ? it : it.skip)('every character after one step: applied mask, timers, counters, accumulators, Poison / Regen accumulators, the condemned flag, and the calls made in order', () => {
    for (const v of vectorsOf(fx!, 'status_process')) {
      const i = inOf(v);
      const chrs = sub(i, 'chrs');
      const units = Object.entries(chrs).map(([k, raw]) => {
        const c = raw as Rec;
        return {
          id: Number(k),
          chr: {
            inBattle: num(c, 'inBattle') !== 0, hidden: num(c, 'hidden') !== 0, hp: num(c, 'hp'), dead: num(c, 'dead') !== 0, status1: num(c, 'status1'), applied: num(c, 'applied'),
            timers: arr(c, 'timers'), counters: arr(c, 'counters').map(s8), accumulators: arr(c, 'acc'), regenByte: num(c, 'regen'), poisonAcc: num(c, 'poisonAcc'), regenAcc: num(c, 'regenAcc'),
            poisonPeriod: num(c, 'poisonPeriod'), regenPeriod: num(c, 'regenPeriod'), poisonDamage: num(c, 'poisonDmg'), regenDamage: num(c, 'regenDmg'), maxHp: num(c, 'maxHp'),
            speeds: { raw: num(c, 'raw'), awake: num(c, 'awake'), active: num(c, 'active') },
            stopState: stopState({ status1: num(c, 'status1'), stopStage: num(c, 'stop'), condemned: num(c, 'condemned') !== 0 }), condemned: num(c, 'condemned') !== 0,
          } satisfies Ffx2TimerChr,
        };
      });
      const res = statusProcess(units, clockFlags(sub(i, 'globals')));
      const actualChrs: Record<string, unknown> = {};
      const calls: Array<Array<string | number>> = [];
      for (const r of res) {
        const c = r.chr;
        actualChrs[String(r.id)] = {
          applied: c.applied >>> 0, timers: c.timers, counters: unsignedBytes(c.counters), acc: c.accumulators, poisonAcc: c.poisonAcc, regenAcc: c.regenAcc, condemned: c.condemned ? 1 : 0,
        };
        const ev = r.events;
        if (ev.doom) {
          calls.push(['hudClose', r.id, 3]);
          calls.push(['queue', r.id, FFX2_DOOM_DEATH_COMMAND, (1 << (r.id & 31)) >>> 0, 0, 0]);
        }
        if (ev.tick) calls.push(['damage', r.id, r.id, r.id, 255, 1, ev.tick.amount]);
        if (ev.recompute) {
          calls.push(['setStatus', r.id, 255, 1, 1]);
          calls.push(['fn61b060', r.id, 4294967295]);
        }
        if (ev.effectCheck) calls.push(['effectCheck', r.id]);
        if (ev.notice !== null) calls.push(['fn6330c0', r.id, ev.notice]);
      }
      const o = outOf(v);
      const expectedChrs: Record<string, unknown> = {};
      for (const [k, raw] of Object.entries(sub(o, 'chrs'))) {
        const c = raw as Rec;
        expectedChrs[k] = {
          applied: num(c, 'applied'), timers: arr(c, 'timers'), counters: arr(c, 'counters'), acc: arr(c, 'acc'), poisonAcc: num(c, 'poisonAcc'), regenAcc: num(c, 'regenAcc'), condemned: num(c, 'condemned') !== 0 ? 1 : 0,
        };
      }
      try {
        expect(actualChrs).toEqual(expectedChrs);
        expect(calls).toEqual(o['calls']);
      } catch (e) {
        failWith(v, e);
      }
    }
  });
});

describe('golden vectors: MsSetStatus, Doom, Defense, Auto-Life (tests/fixtures/parity/ffx2/status_set.json)', () => {
  const fx = kernelCheck('status_set');
  (fx ? it : it.skip)('MsSetStatus: the merged word and bytes, the loaded timers, the start phases (stream and count) and the callbacks flagged', () => {
    for (const v of vectorsOf(fx!, 'set_status')) {
      const i = inOf(v);
      const s = scriptedDraw(v.rngDraws);
      const stopOf = (status1: number, stopByte: number): number => stopState({ status1, stopStage: stopByte, condemned: false });
      try {
        const r = recomputeStatus({
          id: num(i, 'id'), linkRefresh: num(i, 'flag') !== 0, oldStatus1: num(i, 'old434'), oldRegenByte: num(i, 'oldRegen'),
          stopBefore: stopOf(num(i, 'old434'), num(i, 'b43e')), stopAfter: stopOf,
          masks: { m570: num(i, 'm570'), m550: num(i, 'm550'), m4fc: num(i, 'm4fc'), m450: num(i, 'm450') },
          layers: { l4b4: arr(i, 'c4b4'), l500: arr(i, 'l500'), l574: arr(i, 'l574'), l554: arr(i, 'l554') },
          timers: arr(i, 'timers'), poisonPeriod: num(i, 'poisonPeriod'), regenPeriod: num(i, 'regenPeriod'), poisonAcc: num(i, 'poisonAcc'), regenAcc: num(i, 'regenAcc'),
        }, s.draw);
        const o = outOf(v);
        const names = (o['calls'] as Array<[string, ...number[]]>).map((x) => x[0]);
        expect({
          status1: r.status1 >>> 0, bytes: r.bytes, timers: r.timers, poisonAcc: r.poisonAcc, regenAcc: r.regenAcc,
          petrify: r.petrifyChanged, death: r.deathChanged, eject: r.ejectChanged, link: r.linkRefresh, draws: s.calls(),
        }).toEqual({
          status1: num(o, 'status1'), bytes: arr(o, 'bytes438'), timers: arr(o, 'timers'), poisonAcc: num(o, 'poisonAcc'), regenAcc: num(o, 'regenAcc'),
          petrify: names.includes('petrifyChanged'), death: names.includes('deathChanged'), eject: names.includes('ejectChanged'), link: names.includes('link'), draws: v.rngDraws?.length ?? 0,
        });
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('pp_status_expire, MsResetDefenseStatus and pp_has_auto_life', () => {
    for (const v of vectorsOf(fx!, 'status_expire')) {
      const i = inOf(v);
      const doom = (num(i, 'flags') & 8) !== 0 && num(i, 'condemned') === 0;
      const id = num(i, 'id');
      expect({ ret: doom ? 1 : 0, condemned: doom ? 1 : num(i, 'condemned'), calls: doom ? [['hudClose', id, 3], ['queue', id, 0x3026, (1 << (id & 31)) >>> 0, 0, 0]] : [] }).toEqual(v.out);
    }
    for (const v of vectorsOf(fx!, 'reset_defense')) {
      const i = inOf(v);
      const r = resetDefense(num(i, 'status1'), num(i, 'applied'));
      expect({ ret: r.ret, applied: r.applied, calls: r.recompute ? [['setStatus', num(i, 'id'), 255, 1, 1]] : [] }).toEqual(v.out);
    }
    for (const v of vectorsOf(fx!, 'has_auto_life')) {
      const i = inOf(v);
      expect(hasAutoLife(num(i, 'dead') !== 0, num(i, 'leaves') !== 0, num(i, 'status1')) ? 1 : 0).toBe(num(outOf(v), 'ret'));
    }
  });
});

describe('golden vectors: status lifecycle sequences (tests/fixtures/parity/ffx2/status_sequence.json)', () => {
  const fx = kernelCheck('status_sequence');
  const open = FFX2_CLOCK_OPEN;

  interface C {
    id: number; maxHp: number; hp: number; m570: number; m550: number; m4fc: number; applied: number; counters: number[]; l500: number[]; l574: number[]; l554: number[];
    status1: number; bytes: number[]; timers: number[]; acc: number[]; poisonAcc: number; regenAcc: number; condemned: boolean;
  }

  (fx ? it : it.skip)('300 steps of the real MsChrSetDecTime, MsStatusProcess and MsSetStatus, with statuses inflicted between steps', () => {
    for (const v of vectorsOf(fx!, 'status_sequence')) {
      const e = inOf(v);
      const s = scriptedDraw(v.rngDraws);
      const cfg = sub(e, 'chrs');
      const order = Object.keys(cfg).map(Number).sort((a, b) => a - b);
      const C: Record<number, C> = {};
      for (const id of order) {
        const c = sub(cfg, String(id));
        C[id] = { id, maxHp: num(c, 'maxHp'), hp: num(c, 'hp'), m570: 0, m550: 0, m4fc: num(c, 'perm4fc'), applied: 0, counters: z24(), l500: z24(), l574: z24(), l554: z24(), status1: 0, bytes: z24(), timers: z24(), acc: z24(), poisonAcc: 0, regenAcc: 0, condemned: false };
      }
      const stopOf = (c: C): number => stopState({ status1: c.status1, stopStage: c.bytes[6] ?? 0, condemned: c.condemned });
      const recompute = (c: C): Array<Array<string | number>> => {
        const r = recomputeStatus({
          id: c.id, linkRefresh: true, oldStatus1: c.status1, oldRegenByte: c.bytes[3] ?? 0, stopBefore: stopOf(c),
          stopAfter: (s1, sb) => stopState({ status1: s1, stopStage: sb, condemned: c.condemned }),
          masks: { m570: c.m570, m550: c.m550, m4fc: c.m4fc, m450: c.applied }, layers: { l4b4: c.counters, l500: c.l500, l574: c.l574, l554: c.l554 },
          timers: c.timers, poisonPeriod: 16000, regenPeriod: 16000, poisonAcc: c.poisonAcc, regenAcc: c.regenAcc,
        }, s.draw);
        c.status1 = r.status1 >>> 0;
        c.bytes = r.bytes;
        c.timers = r.timers;
        c.poisonAcc = r.poisonAcc;
        c.regenAcc = r.regenAcc;
        const log: Array<Array<string | number>> = [];
        if (r.petrifyChanged) log.push(['petrifyChanged', c.id]);
        if (r.deathChanged) log.push(['deathChanged', c.id]);
        if (r.ejectChanged) log.push(['ejectChanged', c.id]);
        if (r.linkRefresh) log.push(['link', c.id, 3]);
        return log;
      };
      const snap = (c: C) => ({
        status1: c.status1 >>> 0, applied: c.applied >>> 0, bytes: c.bytes, timers: c.timers, counters: unsignedBytes(c.counters), acc: c.acc,
        poisonAcc: c.poisonAcc, regenAcc: c.regenAcc, condemned: c.condemned ? 1 : 0,
      });
      try {
        for (const id of order) recompute(C[id]!);
        const o = outOf(v);
        expect(Object.fromEntries(order.map((id) => [String(id), snap(C[id]!)]))).toEqual(o['initial']);
        const evs = o['events'] as Array<{ step: number; id: number; kind: string; bit?: number; index?: number; count?: number; timer?: number; log: unknown }>;
        const trace = o['trace'] as Array<{ chrs: Record<string, unknown> | null; log: unknown }>;
        let ei = 0;
        for (let n = 1; n <= num(e, 'steps'); n++) {
          while (ei < evs.length && evs[ei]!.step === n) {
            const ev = evs[ei++]!;
            const c = C[ev.id]!;
            if (ev.kind === 'g1') c.applied = (c.applied | (1 << (ev.bit ?? 0))) >>> 0;
            else c.counters[ev.index ?? 0] = ev.count ?? 0;
            expect(recompute(c), `event at step ${n}`).toEqual(ev.log);
            if (ev.kind === 'g1' && ev.timer !== undefined) c.timers[ev.bit ?? 0] = ev.timer;
          }
          const units = order.map((id) => {
            const c = C[id]!;
            const sp = atbSpeeds({ base: num(e, 'baseSpeed'), hasted: (c.bytes[4] ?? 0) !== 0, slowed: (c.bytes[5] ?? 0) !== 0, stopState: stopOf(c), charging: false, hitReaction: false, hitReactionExempt: false });
            return {
              id,
              chr: {
                inBattle: true, hidden: false, hp: c.hp, dead: false, status1: c.status1, applied: c.applied, timers: c.timers, counters: c.counters.map(s8), accumulators: c.acc,
                regenByte: c.bytes[3] ?? 0, poisonAcc: c.poisonAcc, regenAcc: c.regenAcc, poisonPeriod: 16000, regenPeriod: 16000, poisonDamage: 8, regenDamage: 8, maxHp: c.maxHp,
                speeds: { raw: sp.raw, awake: sp.awake, active: sp.active }, stopState: stopOf(c), condemned: c.condemned,
              } satisfies Ffx2TimerChr,
            };
          });
          const log: Array<Array<string | number>> = [];
          for (const r of statusProcess(units, open)) {
            const c = C[r.id]!;
            const o2 = r.chr;
            c.applied = o2.applied >>> 0;
            c.timers = Array.from(o2.timers);
            c.counters = Array.from(o2.counters);
            c.acc = Array.from(o2.accumulators);
            c.poisonAcc = o2.poisonAcc;
            c.regenAcc = o2.regenAcc;
            c.condemned = o2.condemned;
            const ev = r.events;
            if (ev.doom) {
              log.push(['hudClose', r.id, 3]);
              log.push(['queue', r.id, FFX2_DOOM_DEATH_COMMAND, (1 << (r.id & 31)) >>> 0]);
            }
            if (ev.tick) log.push(['damage', r.id, ev.tick.amount]);
            if (ev.recompute) log.push(...recompute(c));
            if (ev.notice !== null) log.push(['notice', r.id, ev.notice]);
          }
          const row = trace[n - 1]!;
          expect(log, `step ${n}: calls`).toEqual(row.log);
          if (row.chrs !== null) expect(Object.fromEntries(order.map((id) => [String(id), snap(C[id]!)])), `step ${n}: state`).toEqual(row.chrs);
        }
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (err) {
        failWith(v, err);
      }
    }
  });
});
