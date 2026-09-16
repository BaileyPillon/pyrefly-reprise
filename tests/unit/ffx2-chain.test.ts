/**
 * The Chain system [research/ffx2-combat-core.md §1.7].
 *
 * The multiplier table is the thing to protect. SinirothX's flowchart writes
 * step 13 as `x (1.4 + chain * 0.5)`; §1.7 records that as a typo for `0.05`,
 * because `0.5` would make the first link x1.9 against two independently
 * sourced reports of x1.45, and would blow past the sourced "600% maximum" by
 * chain 10. If this test ever starts expecting 1.9, someone has "fixed" the
 * engine against the typo.
 */

import { describe, expect, it } from 'vitest';
import {
  advanceChainWindows,
  breakChain,
  cannotEvade,
  chainMultiplier,
  CHAIN_BASE,
  CHAIN_MAX,
  CHAIN_STEP,
  CHAIN_WINDOW_TICKS,
  CHAIN_WINDOW_TICKS_CRIT,
  isActionLocked,
  isChained,
  registerHit,
  ticksUntilChainBreak,
  TICK_RATE_BASE,
} from '../../src/battle/ffx2/index.ts';
import type { FFX2Combatant } from '../../src/battle/common/types.ts';

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
});

describe('registerHit — building a chain', () => {
  it('starts a fresh target at 0 and only chains on the follow-up hit', () => {
    const t = target();
    expect(registerHit(t, false)).toBe(0);
    expect(registerHit(t, false)).toBe(1);
    expect(registerHit(t, false)).toBe(2);
    expect(chainMultiplier(t.chainCount)).toBeCloseTo(1.5, 5);
  });

  it('opens a 2 s window, or 3 s after a critical', () => {
    expect(CHAIN_WINDOW_TICKS).toBe(2 * TICK_RATE_BASE);
    expect(CHAIN_WINDOW_TICKS_CRIT).toBe(3 * TICK_RATE_BASE);
    const t = target();
    registerHit(t, false);
    expect(t.chainWindowTicks).toBe(CHAIN_WINDOW_TICKS);
    registerHit(t, true);
    expect(t.chainWindowTicks).toBe(CHAIN_WINDOW_TICKS_CRIT);
  });

  it('never exceeds the 99 cap', () => {
    const t = target();
    for (let i = 0; i < 200; i++) registerHit(t, false);
    expect(t.chainCount).toBe(CHAIN_MAX);
  });
});

describe('chain windows and their side effects', () => {
  it('breaks after more than 2 s and emits a chain event with count 0', () => {
    const t = target();
    registerHit(t, false);
    registerHit(t, false);
    expect(t.chainCount).toBe(1);

    const events: Array<{ count: number; multiplier: number }> = [];
    advanceChainWindows([t], CHAIN_WINDOW_TICKS - 1, (e) => events.push(e));
    expect(events).toHaveLength(0);
    expect(isChained(t)).toBe(true);

    advanceChainWindows([t], 2, (e) => events.push(e));
    expect(events).toEqual([{ type: 'chain', targetId: 't', count: 0, multiplier: 1 }]);
    expect(t.chainCount).toBe(0);
    expect(isChained(t)).toBe(false);
  });

  it('a chained target cannot evade and cannot start its own action', () => {
    const t = target();
    expect(cannotEvade(t)).toBe(false);
    registerHit(t, false);
    expect(cannotEvade(t)).toBe(true);
    expect(isActionLocked(t)).toBe(true);
  });

  it('does not lock an action that has already begun its charge', () => {
    // §1.7: "if the enemy has already begun its attack animation, chaining
    // will not stop it" — very visible on slow-animation enemies.
    const t = target();
    registerHit(t, false);
    t.atb.charging = { commandRef: { kind: 'attack', targets: [] }, remainingTicks: 100, totalTicks: 100 };
    expect(isActionLocked(t)).toBe(false);
  });

  it('is per target — hitting someone else starts a separate chain', () => {
    const a = target();
    const b = { ...target(), id: 'b' };
    registerHit(a, false);
    registerHit(a, false);
    registerHit(b, false);
    expect(a.chainCount).toBe(1);
    expect(b.chainCount).toBe(0);
  });

  it('reports the soonest window expiry for the tick scheduler', () => {
    const a = target();
    const b = { ...target(), id: 'b' };
    expect(ticksUntilChainBreak([a, b])).toBe(Infinity);
    registerHit(a, true);
    registerHit(b, false);
    expect(ticksUntilChainBreak([a, b])).toBe(CHAIN_WINDOW_TICKS);
  });

  it('breaks outright when the target dies or leaves the field', () => {
    const t = target();
    registerHit(t, false);
    registerHit(t, false);
    expect(breakChain(t)).toBe(true);
    expect(t.chainCount).toBe(0);
    expect(t.chainWindowTicks).toBe(0);
    expect(breakChain(t)).toBe(false);
  });
});
