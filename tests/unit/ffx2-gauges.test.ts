/**
 * ATB gauge maths, pinned to the published tick model
 * [research/ffx2-combat-core.md §1.2–1.4].
 *
 * The load-bearing claim: `ticks = floor(10000 * value / (agility + 1))`
 * consumed at a fixed 3000 ticks/s. Every worked figure in §1.2's tables falls
 * out of that one line, so if these numbers move, the model is wrong — not the
 * test.
 */

import { describe, expect, it } from 'vitest';
import {
  ATB_BASE_VALUE,
  ATB_DOUBLE_RECOVERY_VALUE,
  atbTicks,
  applyWaitDown,
  barLengthFraction,
  baseRequired,
  chargeTicksFor,
  extraRecoveryTicks,
  HASTE_TICK_MULTIPLIER,
  SLOW_TICK_MULTIPLIER,
  TICKS_PER_BAR,
  TICK_RATE_BASE,
  tickMultiplier,
  ticksToMs,
  msToTicks,
} from '../../src/battle/ffx2/index.ts';
import type { FFX2Combatant } from '../../src/battle/common/types.ts';

/** A bare combatant shell — only the fields the gauge helpers read. */
function unit(agi: number, statuses: Partial<FFX2Combatant['statuses']> = {}): FFX2Combatant {
  return {
    id: 'u',
    name: 'u',
    side: 'party',
    spriteKey: 'u',
    stats: {
      hp: 1, mp: 0, str: 1, def: 0, mag: 1, mdef: 0,
      agi, luck: 1, eva: 0, acc: 0, maxHp: 1, maxMp: 0,
    },
    hp: 1,
    mp: 0,
    statuses: statuses as FFX2Combatant['statuses'],
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 24,
    atb: { ticks: 0, required: baseRequired(agi), gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
  };
}

describe('atbTicks — the decoded gauge length', () => {
  it('reproduces the sheet’s worked anchor: Agi 42, value 70 -> 16,279 ticks', () => {
    // §1.2 "Worked anchor straight out of the sheet" — 16,279 ticks, 5.42 s.
    expect(atbTicks(70, 42)).toBe(16279);
    // The sheet prints 5.42 s; 16,279 / 3000 = 5.4263, i.e. the source rounds
    // down to two places rather than to nearest.
    expect(ticksToMs(16279) / 1000).toBeCloseTo(5.43, 2);
  });

  it('reproduces every row of the §1.2 worked turn-period table', () => {
    // [dressphere, Agi, ticks, bar %, seconds] straight off the table.
    const rows: Array<[string, number, number, number, number]> = [
      ['Berserker', 66, 10447, 44, 3.48],
      ['Thief', 62, 11111, 46, 3.7],
      ['Gunner', 54, 12727, 53, 4.24],
      ['Warrior', 51, 13461, 56, 4.49],
      ['Dark Knight', 39, 17500, 73, 5.83],
    ];
    for (const [name, agi, ticks, barPercent, seconds] of rows) {
      expect(atbTicks(ATB_BASE_VALUE, agi), name).toBe(ticks);
      expect(Math.round(barLengthFraction(ticks) * 100), name).toBe(barPercent);
      expect(ticksToMs(ticks) / 1000, name).toBeCloseTo(seconds, 1);
    }
  });

  it('is a runway LENGTH, so a faster dressphere gets a visibly shorter bar', () => {
    // §1.2's decision: use the bar-LENGTH reading. Agility shortens the runway;
    // the fill rate is global. This is what `visual-bible` §4.3 draws.
    expect(baseRequired(66)).toBeLessThan(baseRequired(39));
    expect(barLengthFraction(baseRequired(39))).toBeLessThan(1);
    expect(TICKS_PER_BAR).toBe(24000);
    expect(TICK_RATE_BASE).toBe(3000);
  });

  it('collapses to secondsToAct = 3.3333 * value / (agi + 1)', () => {
    for (const agi of [1, 20, 54, 115, 133]) {
      const expected = (3.33333 * ATB_BASE_VALUE) / (agi + 1);
      expect(ticksToMs(atbTicks(ATB_BASE_VALUE, agi)) / 1000).toBeCloseTo(expected, 1);
    }
  });
});

describe('Haste and Slow are tick-rate multipliers, never Agility changes', () => {
  it('Haste is x1.05 — NOT the spell table’s boilerplate "double"', () => {
    // §1.2 records the conflict: the FF Wiki spell table says "doubles"; the
    // dedicated status article and the calculator both say ~5%. Implement 1.05.
    expect(HASTE_TICK_MULTIPLIER).toBe(1.05);
    expect(tickMultiplier(unit(54, { haste: statusOf('haste') }))).toBe(1.05);
  });

  it('Slow halves the rate', () => {
    expect(SLOW_TICK_MULTIPLIER).toBe(0.5);
    expect(tickMultiplier(unit(54, { slow: statusOf('slow') }))).toBe(0.5);
  });

  it('Stop, Sleep, Petrify and KO freeze the gauge entirely', () => {
    for (const id of ['stop', 'sleep', 'petrify', 'ko'] as const) {
      expect(tickMultiplier(unit(54, { [id]: statusOf(id) })), id).toBe(0);
    }
  });

  it('leaves the Agility stat untouched, so the bar length never moves', () => {
    const hasted = unit(54, { haste: statusOf('haste') });
    expect(hasted.atb.required).toBe(baseRequired(54));
  });
});

describe('charge (CTIM) and recovery (RECTIM)', () => {
  it('charges on the same tick formula as the gauge', () => {
    // §1.3 tiers at Agi 51: short 16 -> 1.03 s, medium 26 -> 1.67 s, long 39 -> 2.50 s.
    const u = unit(51);
    for (const [value, seconds] of [[16, 1.03], [26, 1.67], [39, 2.5]] as const) {
      const ticks = chargeTicksFor({ chargeTicks: value }, u);
      expect(ticksToMs(ticks) / 1000).toBeCloseTo(seconds, 2);
    }
  });

  it('Slow doubles the CTIM value on top of halving the rate — net x4', () => {
    const normal = chargeTicksFor({ chargeTicks: 26 }, unit(51));
    const slowed = chargeTicksFor({ chargeTicks: 26 }, unit(51, { slow: statusOf('slow') }));
    expect(slowed).toBe(normal * 2);
    // ...and the rate halving is the other x2, applied by `tickMultiplier`.
    expect(tickMultiplier(unit(51, { slow: statusOf('slow') }))).toBe(0.5);
  });

  it('applies a "wait down" reducer as a percentage of the TICK count', () => {
    // §1.3: `ticks - floor(ticks * percent / 100)`, not a flat number of seconds.
    const ticks = atbTicks(26, 51);
    expect(applyWaitDown(ticks, 40)).toBe(ticks - Math.floor((ticks * 40) / 100));
    expect(chargeTicksFor({ chargeTicks: 26 }, unit(51), 40)).toBe(applyWaitDown(ticks, 40));
  });

  it('charges instantly for the untagged tier', () => {
    expect(chargeTicksFor({ chargeTicks: 0 }, unit(51))).toBe(0);
    expect(chargeTicksFor({}, unit(51))).toBe(0);
  });

  it('2xRT costs exactly one extra baseline runway', () => {
    // §1.4: untagged 70 -> 4.24 s at Agi 54; 2xRT 140 -> 8.49 s. The baseline
    // gauge IS the normal recovery, so `2xRT` owes one more of it.
    const agi = 54;
    expect(extraRecoveryTicks(ATB_BASE_VALUE, agi)).toBe(0);
    const extra = extraRecoveryTicks(ATB_DOUBLE_RECOVERY_VALUE, agi);
    const total = baseRequired(agi) + extra;
    expect(ticksToMs(baseRequired(agi)) / 1000).toBeCloseTo(4.24, 1);
    expect(ticksToMs(total) / 1000).toBeCloseTo(8.49, 1);
  });
});

describe('tick <-> millisecond conversion', () => {
  it('round-trips at the base rate', () => {
    expect(msToTicks(1000)).toBe(TICK_RATE_BASE);
    expect(ticksToMs(TICK_RATE_BASE)).toBe(1000);
    expect(ticksToMs(TICKS_PER_BAR) / 1000).toBe(8);
  });
});

function statusOf(id: string) {
  return { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
}
