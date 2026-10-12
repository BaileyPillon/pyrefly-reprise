/**
 * ATB gauge helpers: the units of a standard wait, the HUD's mirrors of the game's recovery counter, and who counts as READY.
 *
 * Re-parity W4 (FFX-2 only): the gauge itself is the game's (`atb-engine.ts` on `kernel/atb*.ts`, proven in
 * `parity-ffx2-atb.test.ts`; the engine against the kernels in `parity-ffx2-engine-atb.test.ts`). What is pinned here is
 * what the HUD and the turn logic read of it: `floor(10000 * value / (agility + 1))` is the length of a wait in the game's
 * UNITS, and the game takes 95 of them off a gauge each logic step at the Normal speed (29.97 steps a second), where this
 * file used to divide by a 3,000-ticks-a-second clock and multiply by Haste's x1.05 and Slow's x0.5.
 */

import { describe, expect, it } from 'vitest';
import {
  ATB_BASE_VALUE,
  STEPS_PER_SECOND,
  TICKS_PER_BAR,
  atbTicks,
  applyWaitDown,
  barLengthFraction,
  barState,
  baseRequired,
  buildSnapshot,
  fillOf,
  isGaugeFrozen,
  isReady,
  newGauge,
  refreshGauge,
  type Ffx2Unit,
} from '../../src/battle/ffx2/index.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { StatusId } from '../../src/battle/common/types.ts';

/** A unit with a given Agility, a standard wait to pay and statuses. */
function unit(agi: number, over: { statuses?: StatusId[]; state?: number; recovery?: number; side?: 'party' | 'enemy' } = {}): Ffx2Unit {
  const u = aiUnit('u', over.side ?? 'party');
  u.stats = { ...u.stats, agi };
  u.atb.required = baseRequired(agi);
  u.atb.recovery = over.recovery ?? 0;
  u.gauge = newGauge(0);
  u.gauge.state = over.state ?? 0;
  for (const id of over.statuses ?? []) u.statuses[id] = { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
  return u;
}

describe('atbTicks: the length of a wait in the game\'s units, cost x 10000 / (AGI + 1)', () => {
  it('reproduces the sheet\'s worked anchor in units: Agi 42, value 70 -> 16,279', () => {
    // §1.2 "Worked anchor straight out of the sheet". The sheet read it as 5.42 s at 3,000 ticks a second; the game takes 95 units a
    // step at 29.97 steps a second, 2,847 a second, so the same 16,279 units are 172 steps = 5.74 s (research/re-ffx2-atb-status.md section 1).
    expect(atbTicks(70, 42)).toBe(16279);
    expect(Math.ceil(16279 / 95)).toBe(172);
    expect(Math.ceil(16279 / 95) / STEPS_PER_SECOND).toBeCloseTo(5.74, 2);
  });

  it('reproduces every row of the §1.2 worked turn-period table in units, and the bar a faster dressphere gets is shorter', () => {
    const rows: Array<[string, number, number, number]> = [
      ['Berserker', 66, 10447, 44],
      ['Thief', 62, 11111, 46],
      ['Gunner', 54, 12727, 53],
      ['Warrior', 51, 13461, 56],
      ['Dark Knight', 39, 17500, 73],
    ];
    for (const [name, agi, units, barPercent] of rows) {
      expect(atbTicks(ATB_BASE_VALUE, agi), name).toBe(units);
      expect(baseRequired(agi), name).toBe(units);
      expect(Math.round(barLengthFraction(units) * 100), name).toBe(barPercent);
    }
    expect(baseRequired(66)).toBeLessThan(baseRequired(39));
    expect(TICKS_PER_BAR).toBe(24000);
  });

  it('a standard wait is at least 1 so the HUD always has a bar to draw', () => {
    expect(baseRequired(10_000_000)).toBe(1);
    expect(baseRequired(0)).toBe(700000);
  });

  it('the wait-down percent of a gate shortens a cast by a share of its length (the kernel does the engine\'s arithmetic)', () => {
    const units = atbTicks(26, 51);
    expect(applyWaitDown(units, 40)).toBe(units - Math.floor((units * 40) / 100));
    expect(applyWaitDown(units, 0)).toBe(units);
  });
});

describe('who is frozen, who is ready, and the colour of the bar', () => {
  it('Stop, Sleep, Petrify and KO freeze a gauge; a dead or removed unit is frozen too', () => {
    for (const id of ['stop', 'sleep', 'petrify', 'ko'] as const) expect(isGaugeFrozen(unit(54, { statuses: [id] })), id).toBe(true);
    expect(isGaugeFrozen(unit(54))).toBe(false);
    const dead = unit(54);
    dead.alive = false;
    expect(isGaugeFrozen(dead)).toBe(true);
  });

  it('colours: green normal, red hasted, gold slowed, white stopped or dead', () => {
    expect(barState(unit(54))).toBe('normal');
    expect(barState(unit(54, { statuses: ['haste'] }))).toBe('haste');
    expect(barState(unit(54, { statuses: ['slow'] }))).toBe('slow');
    expect(barState(unit(54, { statuses: ['stop'] }))).toBe('stop');
  });

  it('a unit is READY in the states the kernel hands to a decision (3 ready, 4 menu open, 5 script, 6 AI, 7 confused, 8 berserk) and not otherwise', () => {
    for (const state of [3, 4, 5, 6, 7, 8]) expect(isReady(unit(54, { state })), `state ${state}`).toBe(true);
    for (const state of [0, 1, 2, 9]) expect(isReady(unit(54, { state })), `state ${state}`).toBe(false);
    expect(isReady(unit(54, { state: 4, statuses: ['sleep'] }))).toBe(false); // asleep: the clock cannot reach it
  });
});

describe('the HUD mirror of the recovery counter: how much of a standard wait is paid', () => {
  it('a counter at 0 or below reads full; half the standard wait left reads half; a dearer command reads empty until the counter is inside the standard wait', () => {
    const req = baseRequired(54);
    const u = unit(54, { recovery: 0, state: 1 });
    expect(fillOf(u)).toBe(1);
    u.atb.recovery = -40;
    expect(fillOf(u)).toBe(1);
    u.atb.recovery = Math.floor(req / 2);
    expect(fillOf(u)).toBeCloseTo(0.5, 2);
    u.atb.recovery = req * 2; // a command that cost twice the standard
    expect(fillOf(u)).toBe(0);
    u.atb.recovery = req;
    expect(fillOf(u)).toBe(0);
  });

  it('a unit that is executing a command (the purple bar or its action time) reads empty; a ready unit reads full', () => {
    const u = unit(54, { recovery: -10, state: 9 });
    expect(fillOf(u)).toBe(0);
    u.gauge.state = 4;
    expect(fillOf(u)).toBe(1);
  });

  it('refreshGauge writes ticks and gauge from the counter; buildSnapshot reports fill, the standard wait, readiness and the charge', () => {
    const u = unit(54, { recovery: 6000, state: 1 });
    refreshGauge(u);
    expect(u.atb.ticks).toBe(u.atb.required - 6000);
    expect(u.atb.gauge).toBe(Math.round(((u.atb.required - 6000) / u.atb.required) * 100));
    u.atb.charging = { commandRef: { kind: 'defend' } as never, remainingTicks: 300, totalTicks: 1200 };
    const bar = buildSnapshot([u], 1234).bars[0];
    expect(bar?.required).toBe(u.atb.required);
    expect(bar?.ready).toBe(false);
    expect(bar?.charge).toBeCloseTo(0.75, 5);
    expect(bar?.fill).toBeCloseTo(1 - 6000 / u.atb.required, 5);
  });
});
