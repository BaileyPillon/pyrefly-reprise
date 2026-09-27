/**
 * Iteration 2 batch B1: FFX-2 rule fixes, each proven by running the engine (hard rule 3).
 * **FFX-2 only** (AGENTS.md rule 14): Petrify's Game Over and the Fast-speed Sleep rule are FFX-2
 * battle-system rules (`research/ffx2-combat-core.md` §2.8, §1.5); the FFX engine is not touched.
 *
 * - PR-0145: all three girls petrified is a defeat at once (§2.8, "All three girls petrified =
 *   Game Over", `[verified: 2 sources]`), with no enemy action after it.
 * - PR-0108: at Config ATB SPEED = FAST a sleeping unit never wakes on its own (§1.5 and §2.8,
 *   `[single source: Split Infinity G1004]`); at Normal, Sleep still expires.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, StatusInstance } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import { durationToTicks } from '../../src/battle/ffx2/statuses.ts';
import type { AtbSpeed } from '../../src/battle/ffx2/constants.ts';

function inst(id: string, ticksRemaining: number | null): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining, charges: null, stacks: 0, permanent: ticksRemaining === null } as StatusInstance;
}

function girls(engine: FFX2Engine): Ffx2Unit[] {
  return Object.values(engine.state().combatants).filter((c) => c.side === 'party') as Ffx2Unit[];
}

describe('PR-0145: all three petrified is a Game Over (FFX-2)', () => {
  it('ends the battle as a defeat with no enemy action once every girl is stone', () => {
    const engine = new FFX2Engine();
    engine.init(bahamutSetup(3));
    for (const g of girls(engine)) g.statuses.petrify = inst('petrify', null);
    const d = engine.nextDecision();
    expect(d.kind).toBe('battle-over');
    if (d.kind === 'battle-over') expect(d.result.outcome).toBe('defeat');
    const actions = engine.state().log.filter((e: BattleEvent) => e.type === 'action-start');
    expect(actions).toHaveLength(0);
  });

  it('keeps fighting while one girl is free of Petrify', () => {
    const engine = new FFX2Engine();
    engine.init(bahamutSetup(3));
    const [a, b] = girls(engine);
    a!.statuses.petrify = inst('petrify', null);
    b!.statuses.petrify = inst('petrify', null);
    expect(engine.nextDecision().kind).not.toBe('battle-over');
  });
});

describe('PR-0108: Sleep has no timed expiry at Fast (FFX-2)', () => {
  function sleeper(speed: AtbSpeed): Ffx2Unit {
    const engine = new FFX2Engine({ atbSpeed: speed, atbMode: 'active' });
    engine.init(bahamutSetup(3));
    const yuna = girls(engine)[0]!;
    // A Sleep with 30 ticks left: 10 ms of game time at Normal.
    yuna.statuses.sleep = inst('sleep', 30);
    engine.tick(20, { throughInput: true });
    engine.tick(20, { throughInput: true });
    return yuna;
  }

  it('at Normal the Sleep wears off on its clock', () => {
    expect(sleeper('normal').statuses.sleep).toBeUndefined();
  });

  it('at Fast the same Sleep outlasts its Normal duration', () => {
    const yuna = sleeper('fast');
    expect(yuna.statuses.sleep).toBeDefined();
    expect(yuna.statuses.sleep?.ticksRemaining).toBe(30);
  });

  it('a real Sleep row (duration 97) still runs at Slow', () => {
    expect(durationToTicks(97)).toBeGreaterThan(0);
    const engine = new FFX2Engine({ atbSpeed: 'slow', atbMode: 'active' });
    engine.init(bahamutSetup(3));
    const yuna = girls(engine)[0]!;
    yuna.statuses.sleep = inst('sleep', 30);
    engine.tick(100, { throughInput: true });
    expect(yuna.statuses.sleep).toBeUndefined();
  });
});
