/**
 * Parity tests for the FFX-2 ATB kernel (`src/battle/ffx2/kernel/atb*.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); functions
 * 0x006349f0 (`MsChrSetDecTime`), 0x006430c0 (`MsStatCheckStop`), 0x00633f60 (`MsATBActiveCheck`), 0x00634ab0
 * (`MsSetATBwait`), 0x00634110, 0x00634170, 0x00644520 (rest, thinking and charge time), 0x00640190
 * (`MsCommandComplete`), 0x00634b10 (`atb_chr_step`), 0x006343a0 (`MsChrATBprocess`), 0x00634700, 0x00634870,
 * 0x00618b60, 0x00634280 (battle start), 0x00644f10, 0x00644770 (charge), 0x0061b620 (delay damage), 0x00618dd0
 * (magic cancel). Spec: `research/re-ffx2-atb-status.md`.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments (the cases marked "emulator" were also run on the real function);
 * - golden vectors: rows produced by running the real functions in the emulator harness (`ffxparity`, Unicorn) on
 *   generated inputs with only the random generator, the command-row lookup, the magic-execution tracker and the
 *   presentation hooks replaced. The fixture blocks at the end load `tests/fixtures/parity/ffx2/atb_*.json` (a
 *   stratified pick of 1,537 rows in six files, every branch represented); the full sets (about 119,000 function
 *   vectors, 24,529 `magic_cancel` vectors from the harness lane, and 200 lifecycle sequences of 200 to 400 steps) were
 *   all matched with no difference on 2026-10-08.
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2_ATB_SPEED,
  FFX2_ATB_SPEED_TABLE,
  FFX2_CLOCK_OPEN,
  FFX2_DELAY_COUNT,
  FFX2_NO_SPEEDS,
  Ffx2AtbState,
  Ffx2StopBit,
  STEPS_PER_SECOND_CANDIDATES,
  activeCheck,
  activePartyCounts,
  applyAtbDamage,
  applyFirstAttack,
  atbBaseSpeed,
  atbChrStep,
  atbInit,
  atbProcessGate,
  atbReset,
  atbSpeedIndex,
  atbSpeeds,
  atbTick,
  averageAgi,
  canTick,
  chargeStart,
  chargeTick,
  chargeTime,
  clockOpen,
  commandComplete,
  deadOrStone,
  firstAttackRoll,
  idleStartGate,
  isAidedChr,
  magicCancel,
  openingTrim,
  readyGate,
  readyHandoff,
  readyOrder,
  requestState,
  restTime,
  setAtbWait,
  stepsToSeconds,
  stopState,
  thinkingTime,
  unitsPerSecond,
  waitFlag,
  type Ffx2AtbRequests,
  type Ffx2AtbStepChr,
  type Ffx2AtbUnit,
  type Ffx2ClockFlags,
  type Ffx2DelayTarget,
  type Ffx2SpeedInput,
} from '../../src/battle/ffx2/kernel/atb.ts';
import {
  arr,
  clockFlags,
  inOf,
  isMon,
  kernelCheck,
  num,
  outOf,
  partyCounts,
  processUnits,
  recs,
  stepChr,
  sub,
  vectorsOf,
  type Rec,
} from './helpers/ffx2AtbAdapters.ts';
import { scriptedDraw } from './helpers/ffx2ParityFixture.ts';

/** A draw() that returns `values` in order (NaN once they run out) and records the streams asked for. */
const script = (...values: number[]): { draw: (s: number) => number; streams: number[] } => {
  const streams: number[] = [];
  return { streams, draw: (s) => (streams.push(s), values[streams.length - 1] ?? Number.NaN) };
};

const speedIn = (over: Partial<Ffx2SpeedInput> = {}): Ffx2SpeedInput => ({
  base: 95,
  hasted: false,
  slowed: false,
  stopState: 0,
  charging: false,
  hitReaction: false,
  hitReactionExempt: false,
  ...over,
});

const stepChrOf = (over: Partial<Ffx2AtbStepChr> = {}): Ffx2AtbStepChr => ({
  atbEnabled: true,
  condemned: false,
  inBattle: true,
  dead: false,
  held: false,
  state: Ffx2AtbState.Recover,
  recovery: 200,
  tick: 95,
  thinking: 0,
  thinkingTick: 1,
  pendingAnimation: false,
  motion: false,
  ...over,
});

const flagsWith = (over: Partial<Ffx2ClockFlags>): Ffx2ClockFlags => ({ ...FFX2_CLOCK_OPEN, ...over });

// ---------------------------------------------------------------------------------------------------------
describe('rom.bin speeds, the config index and the time units', () => {
  it('ATB_speed is Slow 70, Normal 95, Fast 120 (the fourth entry repeats Slow); a config byte above 2 reads as Normal', () => {
    expect(FFX2_ATB_SPEED_TABLE).toEqual([70, 95, 120, 70]);
    expect(FFX2_ATB_SPEED).toEqual({ slow: 70, normal: 95, fast: 120 });
    expect([0, 1, 2, 3, 4, 255].map(atbSpeedIndex)).toEqual([0, 1, 2, 1, 1, 1]);
    expect([0, 1, 2, 3, 200].map(atbBaseSpeed)).toEqual([70, 95, 120, 95, 95]);
  });

  it('a step is 1/30 s or 1/60 s: the same 95 units are 2,850 or 5,700 units a second', () => {
    expect(STEPS_PER_SECOND_CANDIDATES).toEqual([30, 60]);
    expect(unitsPerSecond(95, 30)).toBe(2850);
    expect(unitsPerSecond(95, 60)).toBe(5700);
    // 176 steps: 16,666 units / 95 = 175.4, so the 176th step ends a recovery of cost 70 at AGI 41
    expect(stepsToSeconds(176, 30)).toBeCloseTo(5.8667, 4);
    expect(stepsToSeconds(176, 60)).toBeCloseTo(2.9333, 4);
  });

  it('the delay amounts of the two Delay commands are 4,000 and 8,000', () => {
    expect(FFX2_DELAY_COUNT).toEqual({ weak: 4000, strong: 8000 });
  });
});

describe('stop states (MsStatCheckStop, exe 0x006430c0)', () => {
  it('asleep is 4, petrified 2, Stopped 1, combined by OR', () => {
    expect(stopState({ status1: 0, stopStage: 0, condemned: false })).toBe(0);
    expect(stopState({ status1: 4, stopStage: 0, condemned: false })).toBe(Ffx2StopBit.Asleep);
    expect(stopState({ status1: 2, stopStage: 0, condemned: false })).toBe(Ffx2StopBit.Petrified);
    expect(stopState({ status1: 0, stopStage: 9, condemned: false })).toBe(Ffx2StopBit.Stop);
    expect(stopState({ status1: 6, stopStage: 1, condemned: false })).toBe(7);
    expect(stopState({ status1: 0x20, stopStage: 0, condemned: false })).toBe(0); // Poison is not a stop state
  });

  it('a Doom victim whose death is queued (condemned) no longer counts as asleep, unless the caller asks', () => {
    expect(stopState({ status1: 4, stopStage: 0, condemned: true })).toBe(0);
    expect(stopState({ status1: 4, stopStage: 0, condemned: true, includeCondemned: true })).toBe(4);
    expect(stopState({ status1: 6, stopStage: 0, condemned: true })).toBe(2);
  });
});

describe('per-step speeds (MsChrSetDecTime, exe 0x006349f0)', () => {
  it('Normal: all four speeds are the base 95', () => {
    expect(atbSpeeds(speedIn())).toEqual({ raw: 95, awake: 95, active: 95, tick: 95 });
  });

  it('Haste is base * 21 / 20 with a truncating division, Slow is base / 2, Haste first', () => {
    // 95 * 21 = 1,995; 1,995 / 20 = 99.75 -> 99
    expect(atbSpeeds(speedIn({ hasted: true })).raw).toBe(99);
    // 95 / 2 = 47.5 -> 47
    expect(atbSpeeds(speedIn({ slowed: true })).raw).toBe(47);
    // both (the status recompute never leaves both): 99 / 2 = 49.5 -> 49
    expect(atbSpeeds(speedIn({ hasted: true, slowed: true })).raw).toBe(49);
  });

  it('the same rules at the Slow (70) and Fast (120) settings', () => {
    // 70 * 21 / 20 = 73.5 -> 73;  70 / 2 = 35
    expect([atbSpeeds(speedIn({ base: 70, hasted: true })).raw, atbSpeeds(speedIn({ base: 70, slowed: true })).raw]).toEqual([73, 35]);
    // 120 * 21 / 20 = 126;  120 / 2 = 60
    expect([atbSpeeds(speedIn({ base: 120, hasted: true })).raw, atbSpeeds(speedIn({ base: 120, slowed: true })).raw]).toEqual([126, 60]);
  });

  it('Slow leaves 0 and 1 alone (the test is "above 1"), 2 and 3 become 1; negative values truncate toward zero', () => {
    expect([0, 1, 2, 3, 4].map((base) => atbSpeeds(speedIn({ base, slowed: true })).raw)).toEqual([0, 1, 1, 1, 2]);
    // -3 * 21 = -63; -63 / 20 = -3.15 -> -3
    expect(atbSpeeds(speedIn({ base: -3, hasted: true })).raw).toBe(-3);
  });

  it('stop states: asleep keeps the awake speed (Poison, Regen, Doom still tick), Stopped and petrified lose it, all lose active', () => {
    expect(atbSpeeds(speedIn({ stopState: Ffx2StopBit.Asleep }))).toEqual({ raw: 95, awake: 95, active: 0, tick: 0 });
    expect(atbSpeeds(speedIn({ stopState: Ffx2StopBit.Stop }))).toEqual({ raw: 95, awake: 0, active: 0, tick: 0 });
    expect(atbSpeeds(speedIn({ stopState: Ffx2StopBit.Petrified }))).toEqual({ raw: 95, awake: 0, active: 0, tick: 0 });
    expect(atbSpeeds(speedIn({ stopState: 7 }))).toEqual({ raw: 95, awake: 0, active: 0, tick: 0 });
  });

  it('charging or a hit reaction halves the tick (95 -> 47); the Damage-Not-Stop bit exempts the hit reaction only; a tick of 1 is not halved', () => {
    expect(atbSpeeds(speedIn({ charging: true })).tick).toBe(47);
    expect(atbSpeeds(speedIn({ hitReaction: true })).tick).toBe(47);
    expect(atbSpeeds(speedIn({ hitReaction: true, hitReactionExempt: true })).tick).toBe(95);
    expect(atbSpeeds(speedIn({ charging: true, hitReactionExempt: true })).tick).toBe(47);
    // Hasted and charging: 99 / 2 = 49
    expect(atbSpeeds(speedIn({ hasted: true, charging: true })).tick).toBe(49);
    expect(atbSpeeds(speedIn({ base: 1, charging: true })).tick).toBe(1);
    expect(atbSpeeds(speedIn({ base: 2, charging: true })).tick).toBe(1);
    // the halving works on `active`, so a sleeping charger has no tick to halve
    expect(atbSpeeds(speedIn({ charging: true, stopState: 4 })).tick).toBe(0);
  });

  it('a character with ATB disabled gets all-zero speeds', () => {
    expect(FFX2_NO_SPEEDS).toEqual({ raw: 0, awake: 0, active: 0, tick: 0 });
  });
});

describe('the clock gate (MsATBActiveCheck 0x00633f60, MsSetATBwait 0x00634ab0, the HUD control 0x0075e200)', () => {
  it('with every flag clear the clock runs for every caller', () => {
    expect(clockOpen(FFX2_CLOCK_OPEN)).toBe(true);
    for (const mask of [0, 1, 2, 4, 7, 8, 15]) expect(activeCheck(FFX2_CLOCK_OPEN, mask)).toBe(true);
  });

  it('each of the four pause flags and the hard pause of the magic tracker stops everything', () => {
    for (const over of [{ pauseLevel: 1 }, { pauseLevel: 2 }, { pauseB: 1 }, { pauseC: 1 }, { wait: 1 }, { magicExec: 2 }]) {
      const f = flagsWith(over);
      expect(clockOpen(f)).toBe(false);
      expect(activeCheck(f, 0)).toBe(false);
      expect(atbProcessGate(f)).toBe(false);
    }
  });

  it('mask bit 1 needs the running state and no pending end; 2 no action executing; 4 no command executing; 8 no hold', () => {
    expect(activeCheck(flagsWith({ running: false }), 1)).toBe(false);
    expect(activeCheck(flagsWith({ running: false }), 2)).toBe(true);
    expect(activeCheck(flagsWith({ ending: true }), 1)).toBe(false);
    expect(activeCheck(flagsWith({ actionExecuting: true }), 2)).toBe(false);
    expect(activeCheck(flagsWith({ actionExecuting: true }), 1)).toBe(true);
    expect(activeCheck(flagsWith({ magicExec: 1 }), 4)).toBe(false);
    expect(activeCheck(flagsWith({ magicExec: 1 }), 1)).toBe(true);
    expect(activeCheck(flagsWith({ magicHold: 1 }), 8)).toBe(false);
    expect(activeCheck(flagsWith({ magicHold: 1 }), 7)).toBe(true);
  });

  it('the callers: group 1 status timers use mask 1, group 2 counters and Poison / Regen mask 7, the charge countdown mask 4', () => {
    // a command executing (exec 1) holds the group 2 clocks and the charge, but not the group 1 timers
    const executing = flagsWith({ magicExec: 1 });
    expect([activeCheck(executing, 1), activeCheck(executing, 7), activeCheck(executing, 4)]).toEqual([true, false, false]);
    // an action executing holds only mask 7
    const acting = flagsWith({ actionExecuting: true });
    expect([activeCheck(acting, 1), activeCheck(acting, 7), activeCheck(acting, 4)]).toEqual([true, false, true]);
  });

  it('the ATB process runs only in the running state with nothing executing; an idle character also needs no hold', () => {
    expect(atbProcessGate(FFX2_CLOCK_OPEN)).toBe(true);
    expect(atbProcessGate(flagsWith({ running: false }))).toBe(false);
    expect(atbProcessGate(flagsWith({ ending: true }))).toBe(false);
    expect(atbProcessGate(flagsWith({ magicExec: 1 }))).toBe(false);
    expect(atbProcessGate(flagsWith({ magicHold: 1 }))).toBe(true);
    expect(idleStartGate(flagsWith({ magicHold: 1 }))).toBe(false);
    expect(idleStartGate(flagsWith({ magicExec: 1 }))).toBe(true);
  });

  it('Wait: the flag is the HUD request kept only when the Config is Wait; the request is 1 for a girl choosing below the top list', () => {
    expect(waitFlag(true, 2, 1)).toBe(1); // a submenu or the target cursor is open
    expect(waitFlag(true, 2, 0)).toBe(0); // the top command list: time keeps running
    expect(waitFlag(true, 0xff, 3)).toBe(0); // nobody is choosing
    expect(waitFlag(false, 2, 1)).toBe(0); // Active mode
    expect(setAtbWait(true, 1, 0)).toEqual({ wait: 1, previous: 0 });
    expect(setAtbWait(false, 1, 255)).toEqual({ wait: 0, previous: -1 }); // the old value comes back as a signed byte
    expect(setAtbWait(true, 0x1ff, 5).wait).toBe(255); // a byte
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('recovery (MsATBgetRestTime, exe 0x00634110)', () => {
  it('cost * 10000 / (AGI + 1) rounded down, plus the carry, clamped to 0..99999', () => {
    // Attack costs 70: 700,000 / 42 = 16,666.67 -> 16,666 at AGI 41 (emulator: same)
    expect(restTime(70, 41, 0)).toEqual({ time: 16666, carry: 0 });
    // AGI 255: 700,000 / 256 = 2,734.4 -> 2,734; AGI 0: 700,000 -> clamped to 99,999
    expect(restTime(70, 255, 0).time).toBe(2734);
    expect(restTime(70, 0, 0).time).toBe(99999);
    // a cost of 100 at AGI 41: 1,000,000 / 42 = 23,809.5 -> 23,809
    expect(restTime(100, 41, 0).time).toBe(23809);
  });

  it('the delay carried through the command is added and consumed; a negative total clamps to 0', () => {
    expect(restTime(70, 41, 4000)).toEqual({ time: 20666, carry: 0 });
    expect(restTime(70, 41, -20000).time).toBe(0);
    expect(restTime(70, 41, 90000).time).toBe(99999);
  });

  it('the cost is an unsigned 16-bit field and the AGI an unsigned byte', () => {
    // 65,535 * 10,000 = 655,350,000 (fits 32 bits); / 42 = 15,603,571 -> clamped
    expect(restTime(65535, 41, 0).time).toBe(99999);
    expect(restTime(70 + 65536, 41, 0).time).toBe(16666); // only the low 16 bits count
    expect(restTime(70, 41 + 256, 0).time).toBe(16666); // only the low 8 bits count
  });
});

describe('thinking time (MsATBgetThinkingTime, exe 0x00634170)', () => {
  const girl = { chrId: 1, base: 0, isMonster: false, partyCount: 3, partyStanding: 3 };

  it('with the base 0 the game stores for everyone, a girl thinks 0 steps and draws nothing', () => {
    const s = script();
    expect(thinkingTime(girl, s.draw)).toBe(0);
    expect(s.streams).toEqual([]);
  });

  it('with T above 0 it is draw % T + T / 4 on the purpose-0 stream of the character', () => {
    // T 60: draw 1000 % 60 = 40, T/4 = 15 -> 55;  the range is 15 to 74
    const s = script(1000);
    expect(thinkingTime({ ...girl, base: 60 }, s.draw)).toBe(55);
    expect(s.streams).toEqual([21]); // party slot 1: 0x14 + 1
    expect(thinkingTime({ ...girl, base: 60 }, script(59).draw)).toBe(74);
    expect(thinkingTime({ ...girl, base: 60 }, script(0).draw)).toBe(15);
    // T 5: T/4 = 1; draw 7 % 5 = 2 -> 3.  T 3: T/4 = 0
    expect(thinkingTime({ ...girl, base: 5 }, script(7).draw)).toBe(3);
    expect(thinkingTime({ ...girl, base: 3 }, script(2).draw)).toBe(2);
    expect(thinkingTime({ ...girl, base: -4 }, script().draw)).toBe(0); // not above 0: no draw
  });

  it('a monster adds 30 steps for each of the three active girls that is dead or petrified', () => {
    const mon = { chrId: 18, base: 0, isMonster: true, partyCount: 3, partyStanding: 3 };
    expect(thinkingTime(mon, script().draw)).toBe(0);
    expect(thinkingTime({ ...mon, partyStanding: 2 }, script().draw)).toBe(30);
    expect(thinkingTime({ ...mon, partyStanding: 0 }, script().draw)).toBe(90);
    // a girl in the party array who is not in the battle is not counted at all
    expect(thinkingTime({ ...mon, partyCount: 2, partyStanding: 2 }, script().draw)).toBe(0);
    // with T 40 and one fallen girl: draw 100 % 40 = 20, T/4 = 10 -> 30, plus 30 = 60; monster slot 18 rolls on 18 + 0x0d = 31
    const s = script(100);
    expect(thinkingTime({ ...mon, base: 40, partyStanding: 2 }, s.draw)).toBe(60);
    expect(s.streams).toEqual([31]);
  });

  it('the active party counts: in the battle and not hidden, and alive and not petrified; a repeated slot counts once', () => {
    const e = (slot: number, over: Partial<{ inBattle: boolean; hidden: boolean; dead: boolean; petrified: boolean }> = {}) => ({
      slot, inBattle: true, hidden: false, dead: false, petrified: false, ...over,
    });
    expect(activePartyCounts([e(0), e(1), e(2)])).toEqual({ count: 3, standing: 3 });
    expect(activePartyCounts([e(0), e(1, { dead: true }), e(2, { petrified: true })])).toEqual({ count: 3, standing: 1 });
    expect(activePartyCounts([e(0), e(1, { inBattle: false }), e(0xff)])).toEqual({ count: 1, standing: 1 });
    expect(activePartyCounts([e(0), e(1, { hidden: true }), e(2)])).toEqual({ count: 2, standing: 2 });
    expect(activePartyCounts([e(1), e(1), e(1)])).toEqual({ count: 1, standing: 1 });
    expect(() => activePartyCounts([e(40)])).toThrow(RangeError);
  });

  it('Aided monsters (a player-side monster) are non-monster slots whose save index is 15 to 22; dead-or-stone is the dead flag or petrify', () => {
    expect([14, 15, 22, 23].map((i) => isAidedChr(2, i))).toEqual([false, true, true, false]);
    expect(isAidedChr(20, 18)).toBe(false); // a monster slot is never aided
    expect([deadOrStone(false, 0), deadOrStone(true, 0), deadOrStone(false, 2), deadOrStone(false, 0x20)]).toEqual([false, true, true, false]);
  });
});

describe('charge time (atb_charge_time, exe 0x00644520)', () => {
  const row = { costCast: 39, menuFlags: 0, subMenu: 2 };
  const none = () => ({ menuFlags: 0, category: 0 });

  it('cost_cast * 10000 / (AGI + 1) with no cuts', () => {
    // 390,000 / 42 = 9,285.7 -> 9,285
    expect(chargeTime(41, 0x3100, row, [], none)).toBe(9285);
    expect(chargeTime(41, 0x3100, { ...row, costCast: 0 }, [], none)).toBe(0);
  });

  it('a cut on the very command: (100 - sum) * base / 100, truncated', () => {
    // sum 25: 75 * 9,285 / 100 = 696,375 / 100 = 6,963
    expect(chargeTime(41, 0x3100, row, [{ commandId: 0x3100, percent: 25 }], none)).toBe(6963);
    // two cuts add: 25 + 25 = 50 -> 50 * 9,285 / 100 = 4,642
    expect(chargeTime(41, 0x3100, row, [{ commandId: 0x3100, percent: 25 }, { commandId: 0x3100, percent: 25 }], none)).toBe(4642);
  });

  it('a penalty (a negative percent) lengthens the cast up to twice; the sum is clamped to -100..100', () => {
    // sum -50: 150 * 9,285 / 100 = 13,927
    expect(chargeTime(41, 0x3100, row, [{ commandId: 0x3100, percent: -50 }], none)).toBe(13927);
    expect(chargeTime(41, 0x3100, row, [{ commandId: 0x3100, percent: 127 }], none)).toBe(0); // clamped to 100
    // -128 clamps to -100: 200 * 9,285 / 100 = 18,570
    expect(chargeTime(41, 0x3100, row, [{ commandId: 0x3100, percent: -128 }], none)).toBe(18570);
    // percents are signed bytes: 200 reads as -56
    expect(chargeTime(41, 0x3100, row, [{ commandId: 0x3100, percent: 200 }], none)).toBe(sdivJs(156 * 9285, 100));
  });

  it('a category entry (menu flags with a high bit) cuts every command of its category that has no low menu bits', () => {
    const cut = { commandId: 0x3200, percent: 25 };
    const rowOf = (menuFlags: number, category: number) => () => ({ menuFlags, category });
    expect(chargeTime(41, 0x3100, row, [cut], rowOf(0x08, 2))).toBe(6963); // same category 2
    expect(chargeTime(41, 0x3100, row, [cut], rowOf(0x08, 3))).toBe(9285); // other category
    expect(chargeTime(41, 0x3100, row, [cut], rowOf(0x07, 2))).toBe(9285); // the entry is not a category entry
    expect(chargeTime(41, 0x3100, { ...row, menuFlags: 1 }, [cut], rowOf(0x08, 2))).toBe(9285); // this command has low menu bits
  });

  it('a sum of exactly 0 (a cut and a penalty cancelling) leaves the base', () => {
    expect(chargeTime(41, 0x3100, row, [{ commandId: 0x3100, percent: 25 }, { commandId: 0x3100, percent: -25 }], none)).toBe(9285);
  });
});

/** Truncating integer division for the hand examples. */
function sdivJs(a: number, b: number): number {
  return Math.trunc(a / b);
}

describe('command complete (MsCommandComplete, exe 0x00640190)', () => {
  const think = { chrId: 1, base: 0, isMonster: false, partyCount: 3, partyStanding: 3 };

  it('a living character gets recovery = rest time (carry included) and the thinking time; the carry is consumed', () => {
    const s = script();
    expect(commandComplete({ dead: false, costAtb: 70, agi: 41, carry: 4000, thinking: think }, s.draw)).toEqual({
      ret: 1, recovery: 20666, thinking: 0, carry: 0,
    });
    expect(s.streams).toEqual([]);
  });

  it('with T above 0 the only draw is the thinking time, made after the rest time', () => {
    const s = script(100);
    const r = commandComplete({ dead: false, costAtb: 70, agi: 41, carry: 0, thinking: { ...think, base: 40 } }, s.draw);
    expect(r).toMatchObject({ recovery: 16666, thinking: 30 }); // 100 % 40 = 20, plus 40 / 4 = 10
    expect(s.streams).toEqual([21]);
  });

  it('a dead character is left alone (nothing written, nothing drawn)', () => {
    const s = script();
    expect(commandComplete({ dead: true, costAtb: 70, agi: 41, carry: 4000, thinking: { ...think, base: 40 } }, s.draw)).toEqual({
      ret: 0, recovery: null, thinking: null, carry: null,
    });
    expect(s.streams).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('the per-character state machine (atb_chr_step, exe 0x00634b10)', () => {
  const flags = FFX2_CLOCK_OPEN;
  const env = (over: { readyCount?: number; skipThinking?: boolean; flags?: Ffx2ClockFlags } = {}) => ({ flags, readyCount: 0, ...over });

  it('a recovery of 200 at tick 95 falls 200 -> 105 -> 10 -> -85: it ends on the third step and, with no thinking, the character is ready in that step', () => {
    let c = stepChrOf();
    const trace: number[] = [];
    let readyAt = 0;
    for (let step = 1; step <= 5 && readyAt === 0; step++) {
      const r = atbChrStep(c, env());
      c = { ...c, state: r.state, recovery: r.recovery, thinking: r.thinking };
      trace.push(r.recovery);
      if (r.ready) readyAt = step;
    }
    expect(trace).toEqual([105, 10, -85]);
    expect(readyAt).toBe(3);
    expect(c.state).toBe(Ffx2AtbState.Ready);
  });

  it('the step on which the counter reaches 0 or less ends the recovery, and the overshoot stays in the counter', () => {
    const r = atbChrStep(stepChrOf({ recovery: 95 }), env());
    expect(r).toMatchObject({ state: Ffx2AtbState.Ready, recovery: 0, ready: true, recoveryEnded: true });
    // 96 is one unit short of a second step
    expect(atbChrStep(stepChrOf({ recovery: 96 }), env())).toMatchObject({ state: Ffx2AtbState.Recover, recovery: 1, ready: false, recoveryEnded: false });
    // a counter that is already 0 or below when the state is entered ends at once and is not decremented
    expect(atbChrStep(stepChrOf({ recovery: -40 }), env())).toMatchObject({ recovery: -40, ready: true, recoveryEnded: true });
  });

  it('thinking falls by the thinking tick each step AFTER recovery has ended, and the character is ready on the step it is 0 or less', () => {
    let c = stepChrOf({ state: Ffx2AtbState.Recover, recovery: 50, thinking: 2 });
    const states: number[] = [];
    for (let step = 1; step <= 4; step++) {
      const r = atbChrStep(c, env());
      c = { ...c, state: r.state, recovery: r.recovery, thinking: r.thinking };
      states.push(r.state * 100 + r.thinking);
      if (r.ready) break;
    }
    // step 1: recovery 50 -> -45, state THINK, thinking 2 -> 1;  step 2: 1 -> 0;  step 3: ready
    expect(states).toEqual([201, 200, 300]);
  });

  it('a character that cannot tick (no tick, held, dead, out of the battle) stays in RECOVER and loses nothing', () => {
    for (const over of [{ tick: 0 }, { held: true }, { dead: true }, { inBattle: false }]) {
      expect(atbChrStep(stepChrOf(over), env())).toMatchObject({ state: Ffx2AtbState.Recover, recovery: 200, ready: false });
      expect(canTick({ inBattle: true, dead: false, tick: 95, held: false, ...over })).toBe(false);
    }
    expect(canTick({ inBattle: true, dead: false, tick: 95, held: false })).toBe(true);
  });

  it('IDLE starts recovering only when the idle gate is open, and then recovers in the same step', () => {
    const idle = stepChrOf({ state: Ffx2AtbState.Idle, recovery: 300 });
    expect(atbChrStep(idle, env())).toMatchObject({ state: Ffx2AtbState.Recover, recovery: 205 });
    expect(atbChrStep(idle, env({ flags: flagsWith({ magicHold: 1 }) }))).toMatchObject({ state: Ffx2AtbState.Idle, recovery: 300 });
    expect(atbChrStep(idle, env({ flags: flagsWith({ wait: 1 }) }))).toMatchObject({ state: Ffx2AtbState.Idle });
    expect(atbChrStep(idle, env({ flags: flagsWith({ ending: true }) }))).toMatchObject({ state: Ffx2AtbState.Idle });
  });

  it('ATB disabled, condemned (Doom) and the states 3 to 9 are left alone', () => {
    for (const over of [{ atbEnabled: false }, { condemned: true }]) {
      expect(atbChrStep(stepChrOf(over), env())).toMatchObject({ state: Ffx2AtbState.Recover, recovery: 200 });
    }
    for (const state of [3, 4, 5, 6, 7, 8, 9]) {
      expect(atbChrStep(stepChrOf({ state, recovery: 50 }), env())).toMatchObject({ state, recovery: 50, ready: false });
    }
  });

  it('a pending status animation with its motion flag set holds a THINK character back; otherwise the ready test clears the pending word', () => {
    const waiting = stepChrOf({ state: Ffx2AtbState.Think, recovery: 0, pendingAnimation: true, motion: true });
    expect(atbChrStep(waiting, env())).toMatchObject({ state: Ffx2AtbState.Think, ready: false, pendingAnimation: true });
    const free = atbChrStep({ ...waiting, motion: false }, env());
    expect(free).toMatchObject({ state: Ffx2AtbState.Ready, ready: true, pendingAnimation: false });
    expect(readyGate(true, true)).toEqual({ allowed: false, pendingAnimation: true });
    expect(readyGate(true, false)).toEqual({ allowed: true, pendingAnimation: false });
  });

  it('the ready list holds 31: with it full a THINK character with nothing left to wait for stays in THINK', () => {
    const t = stepChrOf({ state: Ffx2AtbState.Think, recovery: 0 });
    expect(atbChrStep(t, env({ readyCount: 30 })).ready).toBe(true);
    expect(atbChrStep(t, env({ readyCount: 31 }))).toMatchObject({ state: Ffx2AtbState.Think, ready: false });
  });

  it('the debug "skip thinking" switch zeroes the thinking counter when recovery ends', () => {
    const c = stepChrOf({ recovery: 50, thinking: 30 });
    expect(atbChrStep(c, env({ skipThinking: true }))).toMatchObject({ thinking: 0, ready: true });
    expect(atbChrStep(c, env())).toMatchObject({ thinking: 29, ready: false });
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('all characters in one step (MsChrATBprocess, exe 0x006343a0)', () => {
  const unitOf = (id: number, over: Partial<Ffx2AtbStepChr> = {}, extra: Partial<Ffx2AtbUnit> = {}): Ffx2AtbUnit => ({
    id,
    chr: stepChrOf(over),
    speed: { stopState: 0, hasted: false, slowed: false, charging: false, hitReaction: false, hitReactionExempt: false },
    mode: 1,
    confused: false,
    berserk: false,
    ...extra,
  });
  const ctx = { baseSpeed: 95, thinkingTick: 1 };
  const none: Ffx2AtbRequests = { ready: () => false, poll: () => 0 };

  it('the ready list is served lowest recovery counter first, so the character whose last step overshot most acts first; a tie keeps slot order', () => {
    expect(readyOrder([{ id: 0, recovery: -10 }, { id: 5, recovery: -85 }, { id: 16, recovery: -40 }])).toEqual([5, 16, 0]);
    expect(readyOrder([{ id: 3, recovery: -10 }, { id: 1, recovery: -10 }])).toEqual([3, 1]);
    const asked: number[] = [];
    const r = atbTick(
      [unitOf(0, { recovery: 10 }), unitOf(1, { recovery: 90 }), unitOf(2, { recovery: 150 })],
      FFX2_CLOCK_OPEN, ctx, { ready: (id) => (asked.push(id), false), poll: () => 0 },
    );
    // recoveries after the step: -85, -5, 55: slots 0 and 1 are ready, slot 0 first
    expect(r.readyOrder).toEqual([0, 1]);
    expect(asked).toEqual([0, 1]);
    expect(r.recoveryEnded).toEqual([0, 1]);
    expect(r.units.map((u) => [u.chr.state, u.chr.recovery])).toEqual([[4, -85], [4, -5], [1, 55]]);
    expect(r.menuOpened).toEqual([0, 1]);
  });

  it('a request that produced a command sends the character to state 9; otherwise the mode decides: 1 menu, 2 script, 3 AI', () => {
    expect(readyHandoff({ mode: 1, confused: false, berserk: false })).toBe(Ffx2AtbState.WaitCommand);
    expect(readyHandoff({ mode: 2, confused: false, berserk: false })).toBe(Ffx2AtbState.ScriptRequest);
    expect(readyHandoff({ mode: 3, confused: false, berserk: false })).toBe(Ffx2AtbState.AiRequest);
    expect(readyHandoff({ mode: 0, confused: false, berserk: false })).toBe(Ffx2AtbState.Ready);
    expect(readyHandoff({ mode: 1, confused: true, berserk: false })).toBe(Ffx2AtbState.Confused);
    expect(readyHandoff({ mode: 1, confused: false, berserk: true })).toBe(Ffx2AtbState.Berserk);
    expect(readyHandoff({ mode: 2, confused: true, berserk: true })).toBe(Ffx2AtbState.Berserk); // Berserk wins
    expect(readyHandoff({ mode: 1, confused: true, berserk: false, confuseOverride: true })).toBe(Ffx2AtbState.Ready);
    const r = atbTick([unitOf(15, { recovery: 10 }, { mode: 2 })], FFX2_CLOCK_OPEN, ctx, { ready: () => true, poll: () => 0 });
    expect(r.units[0]?.chr.state).toBe(Ffx2AtbState.Executing);
  });

  it('a monster that is ready and whose script declines is asked twice that step, then goes back to IDLE; one that produces a command is not asked again', () => {
    const calls: string[] = [];
    const declining: Ffx2AtbRequests = {
      ready: (id) => (calls.push(`ready ${id}`), false),
      poll: (id, state) => (calls.push(`poll ${id} state ${state}`), requestState(false)),
    };
    const r = atbTick([unitOf(15, { recovery: 10 }, { mode: 2 })], FFX2_CLOCK_OPEN, ctx, declining);
    expect(calls).toEqual(['ready 15', 'poll 15 state 5']);
    expect(r.units[0]?.chr.state).toBe(Ffx2AtbState.Idle);
    expect(requestState(true)).toBe(Ffx2AtbState.Executing);
    // next step: IDLE restarts the recovery, which is already below 0, so it is ready again in the same step
    const again = atbTick(r.units, FFX2_CLOCK_OPEN, ctx, none);
    expect(again.readyOrder).toEqual([15]);
  });

  it('characters in states 5 to 8 are polled once per step in slot order; the answer is stored as the new state', () => {
    const polled: Array<[number, number]> = [];
    const units = [unitOf(1, { state: 8 }), unitOf(15, { state: 5 }), unitOf(16, { state: 7 }), unitOf(17, { state: 6 })];
    const r = atbTick(units, FFX2_CLOCK_OPEN, ctx, {
      ready: () => false,
      poll: (id, state) => (polled.push([id, state]), state === 6 ? 2 : requestState(id === 1)),
    });
    expect(polled).toEqual([[1, 8], [15, 5], [16, 7], [17, 6]]);
    expect(r.units.map((u) => u.chr.state)).toEqual([9, 0, 0, 2]);
  });

  it('a closed gate changes nothing but the speeds; a unit with ATB disabled gets zero speeds', () => {
    const r = atbTick([unitOf(0), unitOf(1, { atbEnabled: false })], flagsWith({ wait: 1 }), ctx, none);
    expect(r.units.map((u) => u.chr.recovery)).toEqual([200, 200]);
    expect(r.speeds).toEqual([{ raw: 95, awake: 95, active: 95, tick: 95 }, FFX2_NO_SPEEDS]);
    expect(r.units.map((u) => u.chr.thinkingTick)).toEqual([1, 0]);
  });

  it('Haste and Slow change the speed this very step (99 and 47 against 95)', () => {
    const r = atbTick(
      [unitOf(0, {}, { speed: { stopState: 0, hasted: true, slowed: false, charging: false, hitReaction: false, hitReactionExempt: false } }),
        unitOf(1, {}, { speed: { stopState: 0, hasted: false, slowed: true, charging: false, hitReaction: false, hitReactionExempt: false } })],
      FFX2_CLOCK_OPEN, ctx, none,
    );
    expect(r.units.map((u) => u.chr.recovery)).toEqual([101, 153]);
  });

  it('units are processed in ascending id order whatever order they are listed in', () => {
    const r = atbTick([unitOf(16), unitOf(2)], FFX2_CLOCK_OPEN, ctx, none);
    expect(r.units.map((u) => u.id)).toEqual([2, 16]);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('battle start (MsChrAtbInit 0x00634700, MsChrAtbReset 0x00634870, MsCalcFirstAttack 0x00618b60, the opening trim 0x00634280)', () => {
  const init = (over: Partial<Parameters<typeof atbInit>[0]> = {}) => ({
    chrId: 1, agi: 41, costAtb: 70, carry: 0, randomStart: true, deadOrStone: false, lead: false, isMonster: false, aided: false,
    thinkingBaseArg: 0, thinking: { baseBefore: 0, partyCount: 3, partyStanding: 3 }, ...over,
  });

  it('the opening counter is a random 25 to 74 percent of the full wait: (draw & 0x3f + 0x20) * full / 128', () => {
    // full = 70 * 10,000 / 42 = 16,666. draw & 0x3f = 0: 32 * 16,666 / 128 = 533,312 / 128 = 4,166 (4,166.5)
    const low = atbInit(init(), script(0x40).draw);
    expect(low).toMatchObject({ full: 16666, start: 4166, mode: 1, thinking: 0, thinkingBase: 0, carry: 0 });
    // draw & 0x3f = 63: 95 * 16,666 / 128 = 1,583,270 / 128 = 12,369 (12,369.3)
    expect(atbInit(init(), script(63).draw).start).toBe(12369);
    // 0x20 -> 64 * 16,666 / 128 = 8,333
    expect(atbInit(init(), script(0x20).draw).start).toBe(8333);
  });

  it('it always draws once on the purpose-0 stream, even when the draw is not used; a monster rolls on its own stream', () => {
    const s = script(5);
    atbInit(init({ randomStart: false }), s.draw);
    expect(s.streams).toEqual([21]); // party slot 1: 0x14 + 1
    const m = script(5);
    atbInit(init({ chrId: 17, isMonster: true }), m.draw);
    expect(m.streams).toEqual([30]); // monster slot 17: 17 + 0x0d
  });

  it('Initiative starts at 0 (ready at once); a dead or petrified character, or a reset after a KO, starts at the full gauge', () => {
    expect(atbInit(init({ lead: true }), script(7).draw).start).toBe(0);
    expect(atbInit(init({ deadOrStone: true }), script(7).draw).start).toBe(16666);
    expect(atbInit(init({ deadOrStone: true, lead: true }), script(7).draw).start).toBe(16666); // the dead have no Initiative
    expect(atbInit(init({ randomStart: false }), script(7).draw).start).toBe(16666);
  });

  it('mode: 1 girl, 2 monster, 3 player-side monster; the thinking base argument is stored unless it is negative; the carry is folded into the gauge', () => {
    expect(atbInit(init({ isMonster: true, chrId: 15 }), script(0, 0).draw).mode).toBe(2);
    expect(atbInit(init({ aided: true }), script(0).draw).mode).toBe(3);
    const keep = atbInit(init({ thinkingBaseArg: -1, thinking: { baseBefore: 0, partyCount: 3, partyStanding: 3 } }), script(0).draw);
    expect(keep.thinkingBase).toBe(0);
    // base 40 stored: the second draw 100 % 40 = 20, plus 10 -> 30
    const set = atbInit(init({ thinkingBaseArg: 40 }), script(0, 100).draw);
    expect(set).toMatchObject({ thinkingBase: 40, thinking: 30 });
    // a carry of 4,000 raises the full gauge: 16,666 + 4,000 = 20,666
    expect(atbInit(init({ carry: 4000, randomStart: false }), script(0).draw).full).toBe(20666);
  });

  it('kind 0 (the side that struck first) gives a girl 0 and a monster 0 to 11.7 percent; kind 1 (the surprised side) 88 to 100 percent of a full wait', () => {
    const reset = (kind: number, isMonster: boolean, draw: number, over: Partial<Parameters<typeof atbReset>[0]> = {}) =>
      atbReset({ chrId: isMonster ? 17 : 1, kind, full: 16666, isMonster, lead: false, deadOrStone: false, recovery: 777, ...over }, script(draw).draw);
    expect(reset(0, false, 15).value).toBe(0); // a girl: the draw is forced to 0
    expect(reset(0, true, 15).value).toBe(1953); // 15 * 16,666 / 128 = 249,990 / 128 = 1,953
    expect(reset(1, false, 0).value).toBe(14712); // 0x71 = 113: 113 * 16,666 / 128 = 1,883,258 / 128 = 14,712
    expect(reset(1, false, 15).value).toBe(16666); // 128 * 16,666 / 128
    expect(reset(1, true, 0xff).value).toBe(16666); // only the low 4 bits of the draw
    // Initiative or dead / petrified: the counter is left alone but the value is still returned
    expect(reset(0, true, 15, { lead: true })).toMatchObject({ value: 1953, recovery: 777, wrote: false });
    expect(reset(1, false, 0, { deadOrStone: true })).toMatchObject({ recovery: 777, wrote: false });
    expect(reset(1, false, 0)).toMatchObject({ recovery: 14712, wrote: true });
  });

  it('the preemptive / ambush roll: two draws from fixed stream 1, preemptive when a + (P * 100 / M) / 5 reaches 255, ambush likewise with b and no First Strike', () => {
    // equal sides, AGI 41: P = M = 42, 4,200 / 42 = 100, 100 / 5 = 20, so a >= 235 is preemptive (21 of 256 draws)
    const roll = (a: number, b: number, extra: Partial<Parameters<typeof firstAttackRoll>[0]> = {}) => {
      const s = script(a, b);
      const r = firstAttackRoll({ preset: 0, firstStrikeCount: 0, partyAgi: 41, monsterAgi: 41, ...extra }, s.draw);
      return { ...r, streams: s.streams };
    };
    expect(roll(234, 0).result).toBe(0);
    expect(roll(235, 0).result).toBe(1);
    expect(roll(235, 0).streams).toEqual([1, 1]);
    expect(roll(0, 235).result).toBe(2);
    expect(roll(0, 234).result).toBe(0);
    expect(roll(235, 235).result).toBe(1); // preemptive wins
    // First Strike (one holder): P = (1 + 3) * 41 / 2 = 82, + 1 = 83; 8,300 / 42 = 197; 197 / 5 = 39, so a >= 216; no ambush at all
    expect(roll(216, 0, { firstStrikeCount: 1 }).result).toBe(1);
    expect(roll(215, 0, { firstStrikeCount: 1 }).result).toBe(0);
    expect(roll(0, 255, { firstStrikeCount: 1 }).result).toBe(0);
    // only the low 8 bits of each draw count
    expect(roll(0x1eb, 0).result).toBe(1); // 0x1eb & 255 = 235
    expect(roll(235, 0).resets).toEqual({ party: 0, monsters: 1 });
    expect(roll(0, 235).resets).toEqual({ party: 1, monsters: 0 });
    expect(roll(0, 0).resets).toEqual({ party: null, monsters: null });
  });

  it('a preset result skips the roll and its draws; the average agility is the integer mean of the side in battle (0 for an empty side)', () => {
    const s = script();
    expect(firstAttackRoll({ preset: 2, firstStrikeCount: 0, partyAgi: 10, monsterAgi: 99 }, s.draw).result).toBe(2);
    expect(s.streams).toEqual([]);
    expect(firstAttackRoll({ preset: 255, firstStrikeCount: 0, partyAgi: 10, monsterAgi: 99 }, s.draw).result).toBe(-1); // a signed char
    expect(averageAgi([41, 40, 40])).toBe(40); // 121 / 3 = 40.3
    expect(averageAgi([])).toBe(0);
  });

  it('the resets of a preemptive / ambush result run over all 31 slots, one draw each in slot order, whether or not anyone stands there', () => {
    const chrs = Array.from({ length: 31 }, (_, id) => ({ full: id < 2 || id === 15 ? 16666 : 0, lead: false, deadOrStone: false, recovery: 500 + id }));
    const s = script(...Array.from({ length: 31 }, () => 15));
    const out = applyFirstAttack(1, chrs, s.draw); // preemptive: girls kind 0, monsters kind 1
    expect(s.streams).toHaveLength(31);
    expect(s.streams.slice(0, 3)).toEqual([20, 21, 22]); // slots 0..2: 0x14 + slot
    expect(s.streams.slice(15, 17)).toEqual([28, 29]); // slots 15, 16: slot + 0x0d
    expect(out[0]).toBe(0); // a girl who struck first is ready at once
    expect(out[15]).toBe(16666); // a surprised monster: (113 + 15) * 16,666 / 128 = a full wait
    expect(out[3]).toBe(0); // an empty slot with full 0 is still reset to 0
    // ambush: girls kind 1, monsters kind 0
    const ambush = applyFirstAttack(2, chrs, script(...Array.from({ length: 31 }, () => 15)).draw);
    expect([ambush[0], ambush[15]]).toEqual([16666, 1953]); // 15 * 16,666 / 128 = 249,990 / 128 = 1,953
    expect(applyFirstAttack(0, chrs, script().draw)).toEqual(chrs.map((c) => c.recovery)); // a normal opening: nothing
    expect(() => applyFirstAttack(1, chrs.slice(1), script().draw)).toThrow(RangeError);
  });

  it('the opening trim takes two thirds of the smallest wait off every character that is not dead or petrified', () => {
    const mk = (recoveries: number[]) =>
      Array.from({ length: 31 }, (_, id) => ({
        atbEnabled: id < recoveries.length, inBattle: id < recoveries.length, dead: false, petrified: false, recovery: recoveries[id] ?? 0,
      }));
    // 4,166, 8,000, 12,369: the smallest is 4,166, two thirds is floor(8,332 / 3) = 2,777 -> 1,389, 5,223, 9,592
    const out = openingTrim(mk([4166, 8000, 12369]));
    expect(out.ret).toBe(2777);
    expect(out.recovery.slice(0, 3)).toEqual([1389, 5223, 9592]);
    expect(out.recovery[3]).toBe(-2777); // the empty slots are trimmed too, with no clamp
    // a dead character is neither a candidate nor trimmed; a petrified one can be the candidate but is not trimmed
    const chrs = mk([4166, 8000, 12369]);
    chrs[0] = { ...chrs[0]!, dead: true };
    chrs[1] = { ...chrs[1]!, petrified: true };
    const second = openingTrim(chrs);
    expect(second.ret).toBe(5333); // the smallest candidate is 8,000 (petrified counts): floor(16,000 / 3)
    expect(second.recovery.slice(0, 3)).toEqual([4166, 8000, 12369 - 5333]);
    // a smallest wait of 0 or less trims nothing and returns itself
    expect(openingTrim(mk([0, 500])).ret).toBe(0);
    expect(openingTrim(mk([-5, 500])).recovery.slice(0, 2)).toEqual([-5, 500]);
    expect(() => openingTrim([])).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('interrupting a wait (apply_atb_damage 0x0061b620, charge 0x00644f10 / 0x00644770, magic_cancel 0x00618dd0)', () => {
  const target = (over: Partial<Ffx2DelayTarget> = {}): Ffx2DelayTarget => ({
    state: 1, recovery: 5000, recoveryMax: 16666, carry: 0, charging: false, chargeRemaining: 0, chargeMax: 0, chargeReleased: 0, ...over,
  });

  it('delay on a recovering character adds to the counter, grows the maximum if needed, closes the menu and sends it back to IDLE', () => {
    const r = applyAtbDamage(target(), 4000);
    expect(r).toMatchObject({ recovery: 9000, recoveryMax: 16666, state: 0, closeMenu: true });
    // beyond the maximum the maximum grows with it, up to 99,999
    expect(applyAtbDamage(target({ recovery: 15000 }), 8000)).toMatchObject({ recovery: 23000, recoveryMax: 23000 });
    expect(applyAtbDamage(target({ recovery: 99000 }), 8000).recovery).toBe(99999);
  });

  it('a character that is already ready (a negative counter) starts the delay from 0, not from the overshoot', () => {
    expect(applyAtbDamage(target({ state: 4, recovery: -85 }), 4000)).toMatchObject({ recovery: 4000, state: 0, closeMenu: true });
  });

  it('a character whose command is executing (state 9) banks the delay in the carry for its next recovery; its counter is untouched', () => {
    const r = applyAtbDamage(target({ state: 9, recovery: 123, carry: 1000 }), 4000);
    expect(r).toMatchObject({ carry: 5000, recovery: 123, state: 9, closeMenu: false });
    expect(applyAtbDamage(target({ state: 9, carry: 1000 }), -4000).carry).toBe(1000); // only positive damage is banked
    // the carry is paid by the next rest time: 16,666 + 5,000
    expect(restTime(70, 41, r.carry).time).toBe(21666);
  });

  it('a character charging a cast has the cast lengthened (never cancelled) unless it has been released', () => {
    const charging = target({ state: 9, charging: true, chargeRemaining: 3000, chargeMax: 9285 });
    expect(applyAtbDamage(charging, 4000)).toMatchObject({ chargeRemaining: 7000, chargeMax: 9285, state: 9, closeMenu: false });
    expect(applyAtbDamage(charging, 8000)).toMatchObject({ chargeRemaining: 11000, chargeMax: 11000 });
    expect(applyAtbDamage(charging, -8000).chargeRemaining).toBe(0); // a negative amount shortens it, to at most 0
    expect(applyAtbDamage({ ...charging, chargeRemaining: -50 }, 4000).chargeRemaining).toBe(4000); // from 0, not from the overshoot
    // released, or with no maximum, it falls through to the ordinary rules
    expect(applyAtbDamage({ ...charging, chargeReleased: 1 }, 4000)).toMatchObject({ carry: 4000, chargeRemaining: 3000 });
    expect(applyAtbDamage({ ...charging, chargeMax: 0 }, 4000).chargeRemaining).toBe(3000);
  });

  it('a charge starts as remaining = max = the cast time (0 with the no-charge byte) and counts down by the tick while the gate allows', () => {
    const none = { remaining: 7, max: 7 };
    expect(chargeStart(none, { handle: 0, allocated: 5, noCharge: false, chargeTime: 9285 })).toEqual({ ret: 5, handle: 5, charge: { remaining: 9285, max: 9285 } });
    expect(chargeStart(none, { handle: 0, allocated: 5, noCharge: true, chargeTime: 9285 }).charge).toEqual({ remaining: 0, max: 0 });
    expect(chargeStart(none, { handle: 0, allocated: 0, noCharge: false, chargeTime: 9285 })).toEqual({ ret: 0, handle: 0, charge: none });
    expect(chargeStart(none, { handle: 3, allocated: 5, noCharge: false, chargeTime: 9285 })).toEqual({ ret: 3, handle: 3, charge: none });
    // 9,285 at tick 47 (a charging character's tick is halved): 197.5 steps
    let c = { remaining: 9285, max: 9285 };
    let steps = 0;
    while (c.remaining > 0) {
      c = chargeTick(c, 47, true, false, 0);
      steps += 1;
    }
    expect(steps).toBe(198);
    expect(c.remaining).toBe(9285 - 198 * 47);
  });

  it('the charge does not move with the gate closed, with nothing left, or while the caster is stopped (tick 0); a pending battle end finishes it at once', () => {
    const c = { remaining: 500, max: 900 };
    expect(chargeTick(c, 47, false, false, 0)).toEqual(c);
    expect(chargeTick({ remaining: 0, max: 900 }, 47, true, false, 0)).toEqual({ remaining: 0, max: 900 });
    expect(chargeTick({ remaining: -3, max: 900 }, 47, true, false, 0)).toEqual({ remaining: -3, max: 900 });
    expect(chargeTick(c, 0, true, false, 1)).toEqual(c);
    expect(chargeTick(c, 47, true, true, 0).remaining).toBe(500 - 47 - 900); // 500, minus the tick, minus the maximum
    expect(chargeTick(c, 47, true, true, 4).remaining).toBe(500 - 47); // a sleeping caster is not hurried
  });

  const cancelIn = (over: Partial<Parameters<typeof magicCancel>[0]> = {}) => ({
    attackerId: 1, chance: 50, targetImmune: false, action: { type: 3, kind: 3, released: 0 }, blockMask: 0, ...over,
  });

  it('magic cancel: one purpose-2 draw % 100 against the chance, only for a cast of class 2 to 4 that has not been released', () => {
    const hit = script(149);
    expect(magicCancel(cancelIn(), hit.draw)).toMatchObject({ cancelled: true, ret: 1, roll: 49, counter: 'cancelled' });
    expect(hit.streams).toEqual([53]); // party slot 1: 0x14 + 1 + 0x20
    expect(magicCancel(cancelIn(), script(50).draw)).toMatchObject({ cancelled: false, ret: 1, roll: 50, counter: 'failed' });
    expect(magicCancel(cancelIn({ chance: 100 }), script(99).draw).cancelled).toBe(true); // 100 or more always cancels
    expect(magicCancel(cancelIn({ chance: 200 }), script(99).draw).cancelled).toBe(true);
  });

  it('no chance or an immune target: no draw at all; a target that is not casting still costs the draw', () => {
    const s = script();
    expect(magicCancel(cancelIn({ chance: 0 }), s.draw)).toMatchObject({ ret: 0, rolled: false, counter: 'none' });
    expect(magicCancel(cancelIn({ targetImmune: true }), s.draw)).toMatchObject({ ret: 0, rolled: false, counter: 'immune' });
    expect(s.streams).toEqual([]);
    const idle = script(0);
    expect(magicCancel(cancelIn({ action: { type: 1, kind: 3, released: 0 } }), idle.draw)).toMatchObject({ cancelled: false, ret: 0, rolled: true, counter: 'failed' });
    expect(idle.streams).toHaveLength(1);
    for (const action of [{ type: 3, kind: 1, released: 0 }, { type: 3, kind: 5, released: 0 }, { type: 3, kind: 3, released: 1 }]) {
      expect(magicCancel(cancelIn({ action }), script(0).draw).cancelled).toBe(false);
    }
    expect(magicCancel(cancelIn({ blockMask: 4 }), script(0).draw)).toMatchObject({ cancelled: false, ret: 0 });
    // a monster attacker rolls on its own purpose-2 stream: slot 17 -> 17 + 0x0d + 0x20
    const m = script(0);
    magicCancel(cancelIn({ attackerId: 17 }), m.draw);
    expect(m.streams).toEqual([62]);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('multi-step: one girl from the first step of a battle to her second turn', () => {
  // atbTick is run one step at a time for one character. Her menu answer is not simulated: the state is simply set to 9 (a command is
  // queued), the gauge is checked to stand still for 8 steps of that command, and then MsCommandComplete sets the next recovery.
  it('Normal speed, AGI 41, Attack (70): opening counter 4,166 -> ready on step 44; her 8-step command leaves the gauge alone; then a recovery of 16,666 -> ready 176 steps later', () => {
    const ctx = { baseSpeed: 95, thinkingTick: 1 };
    const speed = { stopState: 0, hasted: false, slowed: false, charging: false, hitReaction: false, hitReactionExempt: false };
    const start = atbInit(
      { chrId: 0, agi: 41, costAtb: 70, carry: 0, randomStart: true, deadOrStone: false, lead: false, isMonster: false, aided: false, thinkingBaseArg: 0, thinking: { baseBefore: 0, partyCount: 3, partyStanding: 3 } },
      script(0).draw,
    );
    expect(start.start).toBe(4166);
    let u: Ffx2AtbUnit = { id: 0, chr: stepChrOf({ state: 0, recovery: start.start, thinking: start.thinking }), speed, mode: start.mode, confused: false, berserk: false };
    const readyStep = (unit: Ffx2AtbUnit): { unit: Ffx2AtbUnit; steps: number } => {
      let steps = 0;
      let cur = unit;
      for (;;) {
        steps += 1;
        const r = atbTick([cur], FFX2_CLOCK_OPEN, ctx, { ready: () => false, poll: () => 0 });
        cur = r.units[0]!;
        if (cur.chr.state === Ffx2AtbState.WaitCommand) return { unit: cur, steps };
        if (steps > 1000) throw new Error('never ready');
      }
    };
    const first = readyStep(u);
    // 4,166 / 95 = 43.9: 43 steps leave 81, the 44th takes it to -14
    expect(first.steps).toBe(44);
    expect(first.unit.chr.recovery).toBe(4166 - 44 * 95);
    // the player chooses (state 9) and the command runs 8 steps: states 3 to 9 are not stepped, so both counters stay as they were
    let running: Ffx2AtbUnit = { ...first.unit, chr: { ...first.unit.chr, state: Ffx2AtbState.Executing } };
    for (let n = 0; n < 8; n += 1) {
      running = atbTick([running], FFX2_CLOCK_OPEN, ctx, { ready: () => false, poll: () => 0 }).units[0]!;
      expect(running.chr.state).toBe(Ffx2AtbState.Executing);
      expect(running.chr.recovery).toBe(first.unit.chr.recovery);
      expect(running.chr.thinking).toBe(first.unit.chr.thinking);
    }
    // then MsCommandComplete (cost 70, no carry) writes the recovery, and the queue code sets IDLE
    const done = commandComplete({ dead: false, costAtb: 70, agi: 41, carry: 0, thinking: { chrId: 0, base: 0, isMonster: false, partyCount: 3, partyStanding: 3 } }, script().draw);
    u = { ...first.unit, chr: { ...first.unit.chr, state: Ffx2AtbState.Idle, recovery: done.recovery ?? 0, thinking: done.thinking ?? 0 } };
    const second = readyStep(u);
    // 16,666 / 95 = 175.4: 175 steps leave 41, the 176th takes it to -54
    expect(second.steps).toBe(176);
    expect(second.unit.chr.recovery).toBe(16666 - 176 * 95);
    // the same 176 steps are 5.87 s at 30 steps a second and 2.93 s at 60
    expect(stepsToSeconds(second.steps, 30)).toBeCloseTo(5.867, 3);
    expect(stepsToSeconds(second.steps, 60)).toBeCloseTo(2.933, 3);
  });

  it('Haste (99 a step) shortens the same recovery to 169 steps (16,666 / 99 = 168.3), Slow (47) lengthens it to 355', () => {
    const waitSteps = (hasted: boolean, slowed: boolean): number => {
      let rec = 16666;
      let steps = 0;
      while (rec > 0) {
        rec -= atbSpeeds(speedIn({ hasted, slowed })).tick;
        steps += 1;
      }
      return steps;
    };
    expect(waitSteps(false, false)).toBe(176);
    expect(waitSteps(true, false)).toBe(169);
    expect(waitSteps(false, true)).toBe(355); // 16,666 / 47 = 354.6
  });
});

// ---------------------------------------------------------------------------------------------------------
// Golden vectors from the emulator
// ---------------------------------------------------------------------------------------------------------
function failWith(v: { id: number; class: string }, e: unknown): never {
  throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
}

describe('golden vectors: the emulated functions (tests/fixtures/parity/ffx2/atb_clock.json)', () => {
  const fx = kernelCheck('atb_clock');
  (fx ? it : it.skip)('MsChrSetDecTime: the four speeds of every vector (the written fields and the return value)', () => {
    for (const v of vectorsOf(fx!, 'set_dec_time')) {
      const i = inOf(v);
      const s = atbSpeeds({
        base: num(i, 'base'), hasted: num(i, 'haste') !== 0, slowed: num(i, 'slow') !== 0,
        stopState: stopState({ status1: num(i, 'rootStatus1'), stopStage: num(i, 'rootStop'), condemned: num(i, 'rootCondemned') !== 0 }),
        charging: num(i, 'charging') !== 0, hitReaction: num(i, 'hitReaction') !== 0, hitReactionExempt: (num(i, 'special') & 2) !== 0,
      });
      try {
        expect({ raw: s.raw, awake: s.awake, active: s.active, tick: s.tick, ret: s.tick }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('MsStatCheckStop, MsATBActiveCheck, MsSetATBwait, the config index and atb_can_tick', () => {
    for (const v of vectorsOf(fx!, 'stop_check')) {
      const i = inOf(v);
      expect(stopState({ status1: num(i, 'status1'), stopStage: num(i, 'stop'), condemned: num(i, 'condemned') !== 0, includeCondemned: num(i, 'flag') !== 0 })).toBe(num(outOf(v), 'ret'));
    }
    for (const v of vectorsOf(fx!, 'active_check')) {
      const i = inOf(v);
      try {
        expect(activeCheck(clockFlags(i), num(i, 'mask')) ? 1 : 0).toBe(num(outOf(v), 'ret'));
      } catch (e) {
        failWith(v, e);
      }
    }
    for (const v of vectorsOf(fx!, 'set_wait')) {
      const i = inOf(v);
      const r = setAtbWait(((num(i, 'cfg') >>> 11) & 1) === 1, num(i, 'value'), num(i, 'old'));
      expect({ wait: r.wait, ret: r.previous }).toEqual(v.out);
    }
    for (const v of vectorsOf(fx!, 'cfg_speed_index')) expect(atbSpeedIndex(num(inOf(v), 'cfgByte'))).toBe(num(outOf(v), 'ret'));
    for (const v of vectorsOf(fx!, 'can_tick')) {
      const i = inOf(v);
      expect(canTick({ inBattle: num(i, 'inBattle') !== 0, dead: num(i, 'dead') !== 0, tick: num(i, 'tick'), held: num(i, 'held') !== 0 }) ? 1 : 0).toBe(num(outOf(v), 'ret'));
    }
  });
});

describe('golden vectors: recovery, thinking, charge and command complete (tests/fixtures/parity/ffx2/atb_gauge.json)', () => {
  const fx = kernelCheck('atb_gauge');
  (fx ? it : it.skip)('MsATBgetRestTime and atb_charge_time', () => {
    for (const v of vectorsOf(fx!, 'rest_time')) {
      const i = inOf(v);
      const r = restTime(num(i, 'costAtb'), num(i, 'agi'), num(i, 'carry'));
      expect({ ret: r.time, carry: r.carry }).toEqual(v.out);
    }
    for (const v of vectorsOf(fx!, 'charge_time')) {
      const i = inOf(v);
      const rows = sub(i, 'cutRows');
      const got = chargeTime(num(i, 'agi'), num(i, 'commandId'), sub(i, 'row') as never, recs(i, 'cuts') as never, (id) => rows[String(id)] as never);
      try {
        expect(got).toBe(num(outOf(v), 'ret'));
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('MsATBgetThinkingTime: the value, the stream and the number of draws, with the real party counts', () => {
    for (const v of vectorsOf(fx!, 'thinking_time')) {
      const i = inOf(v);
      const pc = partyCounts(recs(i, 'party'));
      const s = scriptedDraw(v.rngDraws);
      try {
        const ret = thinkingTime({ chrId: num(i, 'id'), base: num(i, 'base'), isMonster: isMon(num(i, 'id')), partyCount: pc.count, partyStanding: pc.standing }, s.draw);
        expect(ret).toBe(num(outOf(v), 'ret'));
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('MsCommandComplete: the counters it writes, the draw, and the follow-up request', () => {
    for (const v of vectorsOf(fx!, 'command_complete')) {
      const i = inOf(v);
      const pc = partyCounts(recs(i, 'party'));
      const s = scriptedDraw(v.rngDraws);
      try {
        const r = commandComplete({
          dead: num(i, 'dead') !== 0, costAtb: num(i, 'costAtb'), agi: num(i, 'agi'), carry: num(i, 'carry'),
          thinking: { chrId: num(i, 'id'), base: num(i, 'thinkBase'), isMonster: isMon(num(i, 'id')), partyCount: pc.count, partyStanding: pc.standing },
        }, s.draw);
        const o = outOf(v);
        expect({
          ret: r.ret, recoveryMax: r.recovery ?? 0, recovery: r.recovery ?? num(i, 'prevRecovery'), thinking: r.thinking ?? num(i, 'prevThinking'), carry: r.carry ?? num(i, 'carry'),
        }).toEqual({ ret: num(o, 'ret'), recoveryMax: num(o, 'recoveryMax'), recovery: num(o, 'recovery'), thinking: num(o, 'thinking'), carry: num(o, 'carry') });
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (e) {
        failWith(v, e);
      }
    }
  });
});

describe('golden vectors: the state machine and the whole step (tests/fixtures/parity/ffx2/atb_step.json)', () => {
  const fx = kernelCheck('atb_step');
  (fx ? it : it.skip)('atb_chr_step: the new state, counters, ready-list growth and the hooks called', () => {
    for (const v of vectorsOf(fx!, 'chr_step')) {
      const i = inOf(v);
      const c = sub(i, 'chr');
      const slot = num(i, 'slot');
      const r = atbChrStep(stepChr(c, num(c, 'tick'), num(c, 'thinkTick')), {
        flags: clockFlags(sub(i, 'globals')), readyCount: num(i, 'readyCount'),
        skipThinking: isMon(slot) ? num(i, 'dbgThinkMon') !== 0 : num(i, 'dbgThinkParty') !== 0,
      });
      const o = outOf(v);
      const names = (o['calls'] as Array<[string, ...number[]]>).map((x) => x[0]);
      try {
        expect({
          state: r.state, recovery: r.recovery, thinking: r.thinking, pending669: r.pendingAnimation ? num(c, 'pending669') : 0,
          ret: num(i, 'readyCount') + (r.ready ? 1 : 0), hooks: r.recoveryEnded ? 'garment,resetDefense,fn6363d0' : '',
        }).toEqual({
          state: num(o, 'state'), recovery: num(o, 'recovery'), thinking: num(o, 'thinking'), pending669: num(o, 'pending669'), ret: num(o, 'ret'),
          hooks: names.filter((n) => ['garment', 'resetDefense', 'fn6363d0'].includes(n)).join(),
        });
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('MsChrATBprocess: every character of every vector after one step, and the sequence of requests made', () => {
    for (const v of vectorsOf(fx!, 'atb_process')) {
      const i = inOf(v);
      const chrs = sub(i, 'chrs');
      const produced = [...arr(i, 'produced')];
      const next = (): number => produced.shift() ?? 0;
      const polls: Array<[string, number, number?]> = [];
      const requests: Ffx2AtbRequests = {
        ready: () => next() === 9,
        poll: (id, s) => {
          const val = next();
          polls.push(s === 5 ? ['req', id, 0] : s === 6 ? ['ai', id] : s === 7 ? ['confuse', id] : ['berserk', id]);
          return s === 6 ? val : requestState(val === 9);
        },
      };
      try {
        const r = atbTick(processUnits(chrs), clockFlags(sub(i, 'globals')), { baseSpeed: num(i, 'baseSpeed'), thinkingTick: num(i, 'thinkTick'), confuseOverride: num(i, 'confuseOverride') !== 0 }, requests);
        const calls: Array<[string, number, number?]> = [];
        for (const id of r.recoveryEnded) calls.push(['resetDefense', id]);
        for (const id of r.readyOrder) {
          calls.push(['req', id, 1]);
          if (r.menuOpened.includes(id)) calls.push(['hud', id]);
        }
        calls.push(...polls);
        const actual: Record<string, unknown> = {};
        r.units.forEach((u, k) => {
          const sp = r.speeds[k]!;
          actual[String(u.id)] = {
            state: u.chr.state, recovery: u.chr.recovery, thinking: u.chr.thinking, raw: sp.raw, awake: sp.awake, active: sp.active, tick: sp.tick,
            thinkTick: u.chr.thinkingTick, pending669: u.chr.pendingAnimation ? num(sub(chrs, String(u.id)), 'pending669') : 0,
          };
        });
        const o = outOf(v);
        const expected: Record<string, unknown> = {};
        for (const [k, raw] of Object.entries(sub(o, 'chrs'))) {
          const c = raw as Rec;
          expected[k] = {
            state: num(c, 'state'), recovery: num(c, 'recovery'), thinking: num(c, 'thinking'), raw: num(c, 'raw'), awake: num(c, 'awake'), active: num(c, 'active'),
            tick: num(c, 'tick'), thinkTick: num(c, 'thinkTick'), pending669: num(c, 'pending669'),
          };
        }
        expect(actual).toEqual(expected);
        expect(calls).toEqual((o['calls'] as Array<[string, ...number[]]>).map((x) => (x[0] === 'req' ? ['req', x[1], x[3]] : [x[0], x[1]])));
        expect(produced.length).toBe(num(o, 'producedLeft'));
      } catch (e) {
        failWith(v, e);
      }
    }
  });
});

describe('golden vectors: battle start (tests/fixtures/parity/ffx2/atb_start.json)', () => {
  const fx = kernelCheck('atb_start');
  (fx ? it : it.skip)('MsChrAtbInit and MsChrAtbReset: the counters, the mode, and the draws', () => {
    for (const v of vectorsOf(fx!, 'atb_init')) {
      const i = inOf(v);
      const pc = partyCounts(recs(i, 'party'));
      const id = num(i, 'id');
      const s = scriptedDraw(v.rngDraws);
      try {
        const r = atbInit({
          chrId: id, agi: num(i, 'agi'), costAtb: num(i, 'costAtb'), carry: num(i, 'carry'), randomStart: num(i, 'flag') === 0,
          deadOrStone: deadOrStone(num(i, 'dead') !== 0, num(i, 'status1')), lead: (num(i, 'auto650') & 1) !== 0, isMonster: isMon(id),
          aided: isAidedChr(id, num(i, 'saveIndex')), thinkingBaseArg: num(i, 'thinkArg'),
          thinking: { baseBefore: num(i, 'baseBefore'), partyCount: pc.count, partyStanding: pc.standing },
        }, s.draw);
        const o = outOf(v);
        expect({ full: r.full, start: r.start, mode: r.mode, thinkingBase: r.thinkingBase, thinking: r.thinking, carry: r.carry, draws: s.calls() }).toEqual({
          full: num(o, 'full'), start: num(o, 'start'), mode: num(o, 'mode'), thinkingBase: num(o, 'thinkingBase'), thinking: num(o, 'thinking'), carry: num(o, 'carry'), draws: v.rngDraws?.length ?? 0,
        });
      } catch (e) {
        failWith(v, e);
      }
    }
    for (const v of vectorsOf(fx!, 'atb_reset')) {
      const i = inOf(v);
      const id = num(i, 'id');
      const s = scriptedDraw(v.rngDraws);
      const r = atbReset({
        chrId: id, kind: num(i, 'kind'), full: num(i, 'full'), isMonster: isMon(id), lead: (num(i, 'auto650') & 1) !== 0,
        deadOrStone: deadOrStone(num(i, 'dead') !== 0, num(i, 'status1')), recovery: num(i, 'recovery'),
      }, s.draw);
      expect({ ret: r.value, recovery: r.recovery }).toEqual(v.out);
      expect(s.calls()).toBe(1);
    }
  });

  (fx ? it : it.skip)('MsCalcFirstAttack with its 31 resets, and the opening trim', () => {
    for (const v of vectorsOf(fx!, 'first_attack')) {
      const i = inOf(v);
      const cs = sub(i, 'chrs');
      const chrs = Array.from({ length: 31 }, (_, id) => ({ id, ...((cs[String(id)] as Rec | undefined) ?? { inBattle: 0, hidden: 0, agi: 0, auto650: 0, dead: 0, status1: 0, full: 0, recovery: 0 }) }));
      const side = (lo: number, hi: number) => chrs.filter((c) => c.id >= lo && c.id <= hi && num(c as Rec, 'inBattle') !== 0 && num(c as Rec, 'hidden') === 0);
      const party = side(0, 14);
      const mons = side(15, 30);
      const s = scriptedDraw(v.rngDraws);
      try {
        const roll = firstAttackRoll({
          preset: num(i, 'preset'), firstStrikeCount: party.reduce((n, c) => n + ((num(c as Rec, 'auto650') >> 1) & 1), 0),
          partyAgi: averageAgi(party.map((c) => num(c as Rec, 'agi'))), monsterAgi: averageAgi(mons.map((c) => num(c as Rec, 'agi'))),
        }, s.draw);
        const rec = applyFirstAttack(roll.result, chrs.map((c) => ({
          full: num(c as Rec, 'full'), lead: (num(c as Rec, 'auto650') & 1) !== 0, deadOrStone: deadOrStone(num(c as Rec, 'dead') !== 0, num(c as Rec, 'status1')), recovery: num(c as Rec, 'recovery'),
        })), s.draw);
        const o = outOf(v);
        expect({ ret: roll.result, preset: roll.result & 0xff, recovery: rec, draws: s.calls() }).toEqual({ ret: num(o, 'ret'), preset: num(o, 'preset'), recovery: arr(o, 'recovery'), draws: v.rngDraws?.length ?? 0 });
      } catch (e) {
        failWith(v, e);
      }
    }
    for (const v of vectorsOf(fx!, 'opening_trim')) {
      const cs = sub(inOf(v), 'chrs');
      const chrs = Array.from({ length: 31 }, (_, id) => {
        const c = (cs[String(id)] as Rec | undefined) ?? { atbEnabled: 0, inBattle: 0, dead: 0, status1: 0, recovery: 0 };
        return { atbEnabled: num(c, 'atbEnabled') !== 0, inBattle: num(c, 'inBattle') !== 0, dead: num(c, 'dead') !== 0, petrified: (num(c, 'status1') & 2) !== 0, recovery: num(c, 'recovery') };
      });
      const r = openingTrim(chrs);
      expect({ ret: r.ret, recovery: Object.fromEntries(Object.keys(cs).map((k) => [k, r.recovery[Number(k)]])) }).toEqual(v.out);
    }
  });
});

describe('golden vectors: interruptions (tests/fixtures/parity/ffx2/atb_interrupt.json)', () => {
  const fx = kernelCheck('atb_interrupt');
  (fx ? it : it.skip)('apply_atb_damage: the counters, the carry, the charge, the state and the menu close', () => {
    for (const v of vectorsOf(fx!, 'apply_atb_damage')) {
      const i = inOf(v);
      const r = applyAtbDamage({
        state: num(i, 'state'), recovery: num(i, 'recovery'), recoveryMax: num(i, 'recoveryMax'), carry: num(i, 'carry'), charging: num(i, 'charging') !== 0,
        chargeRemaining: num(i, 'chargeRemaining'), chargeMax: num(i, 'chargeMax'), chargeReleased: num(i, 'chargeReleased'),
      }, num(i, 'dmg'));
      const o = outOf(v);
      try {
        expect({
          state: r.state, recovery: r.recovery, recoveryMax: r.recoveryMax, carry: r.carry, chargeRemaining: r.chargeRemaining, chargeMax: r.chargeMax, closeMenu: r.closeMenu ? 1 : 0,
        }).toEqual({
          state: num(o, 'state'), recovery: num(o, 'recovery'), recoveryMax: num(o, 'recoveryMax'), carry: num(o, 'carry'),
          chargeRemaining: num(o, 'chargeRemaining'), chargeMax: num(o, 'chargeMax'), closeMenu: (o['closeMenu'] as unknown[]).length,
        });
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('charge_start and charge_tick', () => {
    for (const v of vectorsOf(fx!, 'charge_start')) {
      const i = inOf(v);
      if (num(i, 'dbgParty') !== 0 || num(i, 'dbgMon') !== 0 || num(i, 'dbgCharge0') !== 0) continue; // the debug switches are not modelled
      const rows = sub(i, 'cutRows');
      const ct = chargeTime(num(i, 'agi'), num(i, 'cmdId'), sub(i, 'row') as never, recs(i, 'cuts') as never, (id) => rows[String(id)] as never);
      const r = chargeStart({ remaining: num(i, 'rec0xa8'), max: num(i, 'rec0xac') }, { handle: num(i, 'handle'), allocated: num(i, 'alloc'), noCharge: num(i, 'noCharge') !== 0, chargeTime: ct });
      const o = outOf(v);
      expect({ ret: r.ret, handle: r.handle, remaining: r.charge.remaining, max: r.charge.max }).toEqual({ ret: num(o, 'ret'), handle: num(o, 'handle'), remaining: num(o, 'remaining'), max: num(o, 'max') });
    }
    for (const v of vectorsOf(fx!, 'charge_tick')) {
      const i = inOf(v);
      const g = sub(i, 'globals');
      const gate = activeCheck(clockFlags(g), 4);
      const actual = recs(i, 'entries').map((en) => {
        const c = chargeTick({ remaining: num(en, 'remaining'), max: num(en, 'max') }, num(en, 'tick'), gate, num(g, 'ending') !== 0, stopState({ status1: num(en, 'status1'), stopStage: num(en, 'stop'), condemned: false }));
        return { remaining: c.remaining, max: c.max };
      });
      expect(actual).toEqual(outOf(v)['entries']);
    }
  });

  (fx ? it : it.skip)('magic_cancel (vectors of the harness lane): the return value, the counters it bumps, the result byte and the draw', () => {
    for (const v of vectorsOf(fx!, 'magic_cancel')) {
      const i = inOf(v);
      const chrs = sub(i, 'chrs');
      const target = (chrs[String(num(i, 'targetId'))] as Rec | undefined) ?? { rootId: 0, specialFlags: 0 };
      const root = (chrs[String(num(target, 'rootId'))] as Rec | undefined) ?? { queueIndex: 0, actions: [] };
      const acts = (root['actions'] as Rec[] | undefined) ?? [];
      const rec = acts[num(root, 'queueIndex') & 7] ?? { type: 0, f10: 0, f28: 0 };
      const s = scriptedDraw(v.rngDraws);
      const r = magicCancel({
        attackerId: num(i, 'attackerId'), chance: num(sub(i, 'cmd'), 'cancelChance'), targetImmune: (num(target, 'specialFlags') & 0x200) !== 0,
        action: { type: num(rec, 'type'), kind: num(rec, 'f28'), released: num(rec, 'f10') }, blockMask: num(i, 'blockMask'),
      }, s.draw);
      const c1 = [...arr(i, 'counters1')];
      if (r.counter === 'immune') c1[5] = (c1[5] ?? 0) + 1;
      else if (r.counter === 'cancelled') {
        c1[4] = (c1[4] ?? 0) + 1;
        c1[8] = (c1[8] ?? 0) + 1;
      } else if (r.counter === 'failed') c1[6] = (c1[6] ?? 0) + 1;
      const o = outOf(v);
      try {
        expect({ ret: r.ret, counters1: c1, result32: r.cancelled ? 1 : num(i, 'result32'), draws: s.calls() }).toEqual({ ret: num(o, 'ret'), counters1: arr(o, 'counters1'), result32: num(o, 'result32'), draws: v.rngDraws?.length ?? 0 });
      } catch (e) {
        failWith(v, e);
      }
    }
  });
});

describe('golden vectors: whole-battle sequences (tests/fixtures/parity/ffx2/atb_sequence.json)', () => {
  const fx = kernelCheck('atb_sequence');
  const COSTS: Record<number, number> = { 0x3001: 70, 0x3181: 100, 0x31ea: 200, 0x30f0: 40 };
  (fx ? it : it.skip)('AtbInit, the first-attack roll, the opening trim and 120 to 160 steps of the real process with command ends, delay and hit reactions between steps', () => {
    for (const v of vectorsOf(fx!, 'atb_sequence')) {
      const e = inOf(v);
      const chrCfg = sub(e, 'chrs');
      const s = scriptedDraw(v.rngDraws);
      const order = Object.keys(chrCfg).map(Number).sort((a, b) => a - b);
      const girls = order.filter((x) => x < 15);
      const pc = activePartyCounts(girls.map((slot) => ({ slot, inBattle: true, hidden: false, dead: false, petrified: false })));
      const unit: Record<number, { id: number; full: number; thinkBase: number; mode: number; agi: number; hit: boolean; carry: number; chr: Ffx2AtbStepChr }> = {};
      try {
        for (const id of order) {
          const c = sub(chrCfg, String(id));
          const mon = id >= 15;
          const base = mon ? num(e, 'thinkBase') : 0;
          const r = atbInit({
            chrId: id, agi: num(c, 'agi'), costAtb: 70, carry: 0, randomStart: true, deadOrStone: false, lead: num(e, 'lead') !== 0 && id === order[0], isMonster: mon, aided: false,
            thinkingBaseArg: base, thinking: { baseBefore: base, partyCount: pc.count, partyStanding: pc.standing },
          }, s.draw);
          unit[id] = { id, full: r.full, thinkBase: base, mode: r.mode, agi: num(c, 'agi'), hit: false, carry: 0, chr: stepChrOf({ state: 0, recovery: r.start, thinking: r.thinking, tick: 0, thinkingTick: 0 }) };
        }
        const agis = (ids: number[]): number[] => ids.map((id) => num(sub(chrCfg, String(id)), 'agi'));
        const roll = firstAttackRoll({
          preset: num(e, 'preset'), firstStrikeCount: 0, partyAgi: averageAgi(agis(order.filter((x) => x < 15))), monsterAgi: averageAgi(agis(order.filter((x) => x >= 15))),
        }, s.draw);
        const all = Array.from({ length: 31 }, (_, id) => {
          const u = unit[id];
          return { full: u ? u.full : 0, lead: !!u && num(e, 'lead') !== 0 && id === order[0], deadOrStone: false, recovery: u ? u.chr.recovery : 0 };
        });
        const rec = applyFirstAttack(roll.result, all, s.draw);
        for (const id of order) unit[id]!.chr.recovery = rec[id]!;
        const trim = openingTrim(Array.from({ length: 31 }, (_, id) => ({ atbEnabled: !!unit[id], inBattle: !!unit[id], dead: false, petrified: false, recovery: unit[id]?.chr.recovery ?? 0 })));
        for (const id of order) unit[id]!.chr.recovery = trim.recovery[id]!;
        const o = outOf(v);
        expect(trim.ret).toBe(num(o, 'trim'));
        expect(Object.fromEntries(order.map((id) => [String(id), [unit[id]!.chr.recovery, unit[id]!.full, unit[id]!.chr.thinking, unit[id]!.mode]]))).toEqual(o['start']);

        const events = o['events'] as Array<{ step: number; kind: string; id: number; cmd?: number; dmg?: number }>;
        const trace = o['trace'] as Array<{ chrs: Record<string, number[]>; log: Array<[string, number, number?, number?]> }>;
        let ei = 0;
        for (let step = 1; step <= num(e, 'steps'); step++) {
          while (ei < events.length && events[ei]!.step === step) {
            const ev = events[ei++]!;
            const u = unit[ev.id]!;
            if (ev.kind === 'hitStart') u.hit = true;
            else if (ev.kind === 'hitEnd') u.hit = false;
            else if (ev.kind === 'choose') u.chr.state = Ffx2AtbState.Executing;
            else if (ev.kind === 'complete') {
              u.chr.state = Ffx2AtbState.Idle;
              const r = commandComplete({
                dead: false, costAtb: COSTS[ev.cmd ?? 0] ?? 0, agi: u.agi, carry: u.carry,
                thinking: { chrId: ev.id, base: u.thinkBase, isMonster: ev.id >= 15, partyCount: pc.count, partyStanding: pc.standing },
              }, s.draw);
              u.chr.recovery = r.recovery ?? 0;
              u.chr.thinking = r.thinking ?? 0;
              u.carry = r.carry ?? 0;
            } else if (ev.kind === 'delay') {
              const r = applyAtbDamage({ state: u.chr.state, recovery: u.chr.recovery, recoveryMax: u.full, carry: u.carry, charging: false, chargeRemaining: 0, chargeMax: 0, chargeReleased: 0 }, ev.dmg ?? 0);
              u.chr.state = r.state;
              u.chr.recovery = r.recovery;
              u.full = r.recoveryMax;
              u.carry = r.carry;
            }
          }
          const log = trace[step - 1]!.log.filter((x) => x[0] !== 'resetDefense' && x[0] !== 'hud');
          let li = 0;
          const units: Ffx2AtbUnit[] = order.map((id) => {
            const u = unit[id]!;
            const c = sub(chrCfg, String(id));
            return {
              id, chr: u.chr, mode: u.mode, confused: false, berserk: false,
              speed: { stopState: 0, hasted: num(c, 'haste') !== 0, slowed: num(c, 'slow') !== 0, charging: false, hitReaction: u.hit, hitReactionExempt: (num(c, 'special') & 2) !== 0 },
            };
          });
          const r = atbTick(units, FFX2_CLOCK_OPEN, { baseSpeed: num(e, 'baseSpeed'), thinkingTick: num(e, 'thinkTick') }, {
            ready: (id) => {
              const x = log[li++];
              if (!x || x[0] !== 'req' || x[1] !== id || x[2] !== 1) throw new Error(`step ${step}: ready(${id}) against ${JSON.stringify(x)}`);
              return x[3] === 9;
            },
            poll: (id, st) => {
              const x = log[li++];
              if (!x || x[1] !== id) throw new Error(`step ${step}: poll(${id}, ${st}) against ${JSON.stringify(x)}`);
              return x[3] === 9 ? 9 : 0;
            },
          });
          for (const u of r.units) unit[u.id]!.chr = u.chr;
          const row = Object.fromEntries(order.map((id) => [String(id), [unit[id]!.chr.state, unit[id]!.chr.recovery, unit[id]!.chr.thinking]]));
          expect(row, `step ${step}`).toEqual(trace[step - 1]!.chrs);
          expect(li, `step ${step}: requests left over`).toBe(log.length);
        }
        expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
      } catch (err) {
        failWith(v, err);
      }
    }
  });
});
