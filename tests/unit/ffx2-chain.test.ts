/**
 * The Chain system [research/ffx2-combat-core.md §1.7].
 *
 * The multiplier table is the thing to protect. SinirothX's flowchart writes
 * step 13 as `x (1.4 + chain * 0.5)`; §1.7 records that as a typo for `0.05`,
 * because `0.5` would make the first link x1.9 against two independently
 * sourced reports of x1.45, and would blow past the sourced "600% maximum" by
 * chain 10. If this test ever starts expecting 1.9, someone has "fixed" the
 * engine against the typo.
 *
 * **Re-parity W3 (FFX-2 only; reason "game-code parity").** The counter is the game's own byte on the target
 * (`research/re-ffx2-damage.md` section 4, `kernel/apply.ts`): it is read BEFORE a hit (`chainBefore`: a target with
 * counter n takes a positive hit x(n + 28) / 20, n = 0 is no multiplier) and raised by one, stopping at 99, when a
 * positive HP number is applied to it (`bumpChain`). `registerHit` and `cannotEvade` are gone. The multipliers, the cap
 * and the windows are unchanged; `chainCount` is now the number of landed hits (it was the count the last hit carried,
 * one less), a Stopped or Petrified target reads 0, and an evadable hit on a target inside its window is forced to
 * land by the hit kernel (the window stands in for the game's hit-reaction state, an open item in the W3 handoff).
 */

import { describe, expect, it } from 'vitest';
import {
  advanceChainWindows,
  breakChain,
  bumpChain,
  chainBefore,
  chainMultiplier,
  CHAIN_BASE,
  CHAIN_MAX,
  CHAIN_STEP,
  CHAIN_WINDOW_TICKS,
  CHAIN_WINDOW_TICKS_CRIT,
  hitPercent,
  isActionLocked,
  isChained,
  ticksUntilChainBreak,
  TICK_RATE_BASE,
} from '../../src/battle/ffx2/index.ts';
import type { AbilityDef, FFX2Combatant } from '../../src/battle/common/types.ts';
import { chainAdjusted } from '../../src/battle/ffx2/kernel/apply.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';

function target(): FFX2Combatant {
  return {
    id: 't',
    name: 't',
    side: 'enemy',
    spriteKey: 't',
    stats: { hp: 100, mp: 0, str: 1, def: 0, mag: 1, mdef: 0, agi: 50, luck: 1, eva: 0, acc: 0, maxHp: 100, maxMp: 0 },
    hp: 100,
    mp: 0,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'ai',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 20,
    atb: { ticks: 0, required: 10000, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
  };
}

/** One landed positive hit, the way the strike does it: read the counter, then raise it. Returns the counter the hit read. */
function land(t: FFX2Combatant, crit = false): number {
  const before = chainBefore(t);
  bumpChain(t, before, crit);
  return before;
}

describe('chainMultiplier — the published table', () => {
  it('is 1.40 + 0.05 * chain, NOT SinirothX’s 0.5 typo', () => {
    expect(CHAIN_BASE).toBe(1.4);
    expect(CHAIN_STEP).toBe(0.05);
    expect(chainMultiplier(1)).toBeCloseTo(1.45, 5);
    expect(chainMultiplier(2)).toBeCloseTo(1.5, 5);
    expect(chainMultiplier(10)).toBeCloseTo(1.9, 5);
    // The 0.5 reading would have put 1.9 at chain 1, not chain 10.
    expect(chainMultiplier(1)).not.toBeCloseTo(1.9, 5);
  });

  it('tops out at x6.35 at the Full Chain count of 99', () => {
    expect(CHAIN_MAX).toBe(99);
    expect(chainMultiplier(99)).toBeCloseTo(6.35, 5);
    expect(chainMultiplier(500)).toBeCloseTo(6.35, 5);
    // "more than 600%" from the sourced description.
    expect(chainMultiplier(99)).toBeGreaterThan(6);
  });

  it('treats chain 0 as a clean x1.0, which is why the event range starts at 1.0', () => {
    expect(chainMultiplier(0)).toBe(1);
    expect(chainMultiplier(-3)).toBe(1);
  });

  it('the damage is multiplied in integers, (counter + 28) * damage / 20 truncated — the float 1.4 + 0.05n loses a point', () => {
    // Counter 3: the float sum is 1.5499999999999998, so base 20 gave 30 where the game's integer chain gives 31.
    expect(chainAdjusted(3, 20)).toBe(31);
    expect(Math.trunc(20 * (CHAIN_BASE + CHAIN_STEP * 3))).toBe(30);
    expect(chainAdjusted(0, 20)).toBe(20); // no counter, no multiplier
    expect(chainAdjusted(5, -20)).toBe(-20); // a heal is never chained
    expect(chainAdjusted(99, 100)).toBe(635);
  });
});

describe('chainBefore / bumpChain — building a chain', () => {
  it('starts a fresh target at 0 and only chains on the follow-up hit', () => {
    const t = target();
    expect(land(t)).toBe(0);
    expect(t.chainCount).toBe(1); // the number of landed hits
    expect(land(t)).toBe(1); // the second hit reads 1: x1.45
    expect(land(t)).toBe(2);
    expect(chainMultiplier(chainBefore(t))).toBeCloseTo(1.55, 5); // what a fourth hit would carry
    expect(chainMultiplier(2)).toBeCloseTo(1.5, 5);
  });

  it('opens a 2 s window, or 3 s after a critical', () => {
    expect(CHAIN_WINDOW_TICKS).toBe(2 * TICK_RATE_BASE);
    expect(CHAIN_WINDOW_TICKS_CRIT).toBe(3 * TICK_RATE_BASE);
    const t = target();
    land(t);
    expect(t.chainWindowTicks).toBe(CHAIN_WINDOW_TICKS);
    land(t, true);
    expect(t.chainWindowTicks).toBe(CHAIN_WINDOW_TICKS_CRIT);
  });

  it('never exceeds the 99 cap', () => {
    const t = target();
    for (let i = 0; i < 200; i++) land(t);
    expect(t.chainCount).toBe(CHAIN_MAX);
  });

  it('a Stopped or Petrified target reads 0 whatever its window says (the game clears the counter for both)', () => {
    const t = target();
    land(t);
    land(t);
    expect(chainBefore(t)).toBe(2);
    t.statuses['stop'] = { id: 'stop', turnsRemaining: null, ticksRemaining: 1000, charges: null, stacks: 0, permanent: false } as never;
    expect(chainBefore(t)).toBe(0);
    delete t.statuses['stop'];
    expect(chainBefore(t)).toBe(2);
    t.statuses['petrify'] = { id: 'petrify', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
    expect(chainBefore(t)).toBe(0);
  });
});

describe('chain windows and their side effects', () => {
  it('breaks after more than 2 s and emits a chain event with count 0', () => {
    const t = target();
    land(t);
    land(t);
    expect(t.chainCount).toBe(2);

    const events: Array<{ count: number; multiplier: number }> = [];
    advanceChainWindows([t], CHAIN_WINDOW_TICKS - 1, (e) => events.push(e));
    expect(events).toHaveLength(0);
    expect(isChained(t)).toBe(true);

    advanceChainWindows([t], 2, (e) => events.push(e));
    expect(events).toEqual([{ type: 'chain', targetId: 't', count: 0, multiplier: 1 }]);
    expect(t.chainCount).toBe(0);
    expect(isChained(t)).toBe(false);
  });

  it('a chained target cannot evade (the hit kernel forces the hit) and cannot start its own action', () => {
    const attack = { id: 'x2-test-attack', name: 'Attack', game: 'ffx2', category: 'attack', mpCost: 0, power: 16, formula: 'strength', damageType: 'physical', element: ['none'], targeting: 'single-enemy', hits: 1, statusEffects: [], removesStatuses: [], flags: ['crit-eligible'], messageTemplate: '' } as unknown as AbilityDef;
    const girl = aiUnit('girl', 'party');
    girl.stats.acc = 40;
    const t = aiUnit('foe', 'enemy');
    t.stats.eva = 60;
    t.stats.luck = 40;
    expect(hitPercent(girl, t, attack)).toBeLessThan(100); // evadable at rest
    land(t);
    expect(isChained(t)).toBe(true);
    expect(hitPercent(girl, t, attack)).toBe(100); // inside its window: in hit reaction, the hit is forced
    expect(isActionLocked(t)).toBe(true);
  });

  it('does not lock an action that has already begun its charge', () => {
    // §1.7: "if the enemy has already begun its attack animation, chaining
    // will not stop it" — very visible on slow-animation enemies.
    const t = target();
    land(t);
    t.atb.charging = { commandRef: { kind: 'attack', targets: [] }, remainingTicks: 100, totalTicks: 100 };
    expect(isActionLocked(t)).toBe(false);
  });

  it('is per target — hitting someone else starts a separate chain', () => {
    const a = target();
    const b = { ...target(), id: 'b' };
    land(a);
    land(a);
    land(b);
    expect(a.chainCount).toBe(2);
    expect(b.chainCount).toBe(1);
    expect(chainBefore(b)).toBe(1);
  });

  it('reports the soonest window expiry for the tick scheduler', () => {
    const a = target();
    const b = { ...target(), id: 'b' };
    expect(ticksUntilChainBreak([a, b])).toBe(Infinity);
    land(a, true);
    land(b);
    expect(ticksUntilChainBreak([a, b])).toBe(CHAIN_WINDOW_TICKS);
  });

  it('breaks outright when the target dies or leaves the field', () => {
    const t = target();
    land(t);
    land(t);
    expect(breakChain(t)).toBe(true);
    expect(t.chainCount).toBe(0);
    expect(t.chainWindowTicks).toBe(0);
    expect(breakChain(t)).toBe(false);
  });
});
