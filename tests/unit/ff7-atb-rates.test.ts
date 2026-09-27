/**
 * FF7's turn-gauge rates (core §2.1 to §2.4). Rates only: the clock, modes and
 * queue are the engine step. FF7 only.
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import {
  battleStartTimers,
  DEFAULT_BATTLE_SPEED,
  normalSpeed,
  PREEMPTIVE_PARTY_TIMER,
  stepTurnTimer,
  ticksToFill,
  TURN_TIMER_FULL,
  turnTimerIncrease,
  speedValue,
  vTimerIncrease,
} from '../../src/battle/ff7/index.ts';
import { guardScorpion, sector1ReactorBuild } from '../../src/data/ff7/index.ts';

describe('FF7 Battle Speed (core §2.1)', () => {
  it('the Speed Value table', () => {
    const table: Array<[number, number]> = [[0, 273], [32, 182], [64, 136], [96, 109], [128, 91], [160, 78], [192, 68], [224, 60], [255, 54]];
    for (const [bs, sv] of table) expect(speedValue(bs), `Battle Speed ${bs}`).toBe(sv);
  });
  it('default 128; V-Timer 182 per tick; Haste x2, Slow x0.5, Stop 0 (core §2.2)', () => {
    expect(DEFAULT_BATTLE_SPEED).toBe(128);
    expect(vTimerIncrease(128)).toBe(182);
    expect(vTimerIncrease(128, 'haste')).toBe(364);
    expect(vTimerIncrease(128, 'slow')).toBe(91);
    expect(vTimerIncrease(128, 'stop')).toBe(0);
  });
});

describe('FF7 Turn Timer at the Guard Scorpion (core §2.3, derived table)', () => {
  const [cloud, barret] = sector1ReactorBuild.members;
  if (!cloud || !barret) throw new Error('build missing a member');
  const bossDex = guardScorpion.ff7?.stats.dex ?? 0;
  const v = vTimerIncrease(DEFAULT_BATTLE_SPEED);

  it('NormalSpeed 60 from base Dex 9 and 10 (rounded up)', () => {
    expect(normalSpeed([cloud.base.dex, barret.base.dex])).toBe(60);
  });
  it('Cloud 178 per tick, 369 ticks; Barret 182, 361; Guard Scorpion 182, 361', () => {
    const ns = normalSpeed([cloud.base.dex, barret.base.dex]);
    const c = turnTimerIncrease(cloud.base.dex, false, v, ns);
    const b = turnTimerIncrease(barret.base.dex, false, v, ns);
    const g = turnTimerIncrease(bossDex, true, v, ns);
    expect([c, ticksToFill(c)]).toEqual([178, 369]);
    expect([b, ticksToFill(b)]).toEqual([182, 361]);
    expect([g, ticksToFill(g)]).toEqual([182, 361]);
  });
  it('at the lowest Dex rolls (Cloud 7, Barret 6): NormalSpeed 57, the boss 344 ticks, Cloud 361, Barret 369', () => {
    const ns = normalSpeed([7, 6]);
    expect(ns).toBe(57);
    expect(ticksToFill(turnTimerIncrease(bossDex, true, v, ns))).toBe(344);
    expect(ticksToFill(turnTimerIncrease(7, false, v, ns))).toBe(361);
    expect(ticksToFill(turnTimerIncrease(6, false, v, ns))).toBe(369);
  });
  it('enemies get no +50; Paralysed / Petrify / Sleep halt the timer', () => {
    expect(turnTimerIncrease(60, true, 182, 60)).toBe(182);
    expect(turnTimerIncrease(60, false, 182, 60)).toBe(333);
    expect(turnTimerIncrease(60, true, 182, 60, true)).toBe(0);
    expect(ticksToFill(0)).toBe(Number.POSITIVE_INFINITY);
  });
  it('the gauge is full at 65,535 and clamps there', () => {
    expect(stepTurnTimer(65400, 182)).toBe(TURN_TIMER_FULL);
    expect(stepTurnTimer(0, 182, 360)).toBe(65520);
    expect(stepTurnTimer(0, 182, 361)).toBe(TURN_TIMER_FULL);
  });
});

describe('FF7 battle-start timers (core §2.4)', () => {
  const units = [{ isEnemy: false }, { isEnemy: false }, { isEnemy: true }];
  it('Normal: the highest at 57,344 (87.5%), everyone between 37.5% and 87.5%, one draw each', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const t = battleStartTimers(units, 'normal', new SeededRng(seed));
      expect(Math.max(...t)).toBe(57344);
      for (const x of t) {
        expect(x).toBeGreaterThanOrEqual(24576);
        expect(x).toBeLessThanOrEqual(57344);
      }
    }
  });
  it('Pre-emptive: the party at 65,534, enemies divided by 8', () => {
    const t = battleStartTimers(units, 'preemptive', new SeededRng(5));
    expect(t.slice(0, 2)).toEqual([PREEMPTIVE_PARTY_TIMER, PREEMPTIVE_PARTY_TIMER]);
    expect(t[2]).toBeLessThanOrEqual(4095);
  });
  it('Back Attack: the party reset to 0 after the lift to 61,440', () => {
    const t = battleStartTimers(units, 'back', new SeededRng(5));
    expect(t.slice(0, 2)).toEqual([0, 0]);
    expect(t[2]).toBeGreaterThan(61440 - 32768);
  });
  it('the same seed gives the same timers', () => {
    expect(battleStartTimers(units, 'normal', new SeededRng(42))).toEqual(battleStartTimers(units, 'normal', new SeededRng(42)));
  });
});
