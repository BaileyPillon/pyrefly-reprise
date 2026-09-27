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
import { SEPARATE_BATTLE_GAUGES, type AtbSpeed } from '../../src/battle/ffx2/constants.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_II, LEBLANC_ACT_III } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';

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

describe('PR-0107: Chapter VI Acts II and III open as separate battles, an OFF switch (FFX-2)', () => {
  // `research/ffx2-leblanc-syndicate.md` §2 (three battles with puzzles between) and
  // `ffx2-combat-core.md` §1.6 (a normal battle opens on randomised bars, `[single source]`).
  function opening(groupId: string, seed: number, strip = false): { fills: number[] } {
    const group = { ...ENEMY_GROUPS_BY_ID[groupId]! };
    if (strip) delete (group as { opensAsSeparateBattle?: boolean }).opensAsSeparateBattle;
    const engine = new FFX2Engine({ atbMode: 'wait', separateBattleGauges: true });
    engine.setSeed(seed);
    // A chained link, as `setupForNextLink` hands it on: condition 'scripted'.
    engine.init({ game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed, condition: 'scripted', canEscape: false });
    const units = Object.values(engine.state().combatants) as Ffx2Unit[];
    const fills = units.map((u) => u.atb.ticks / u.atb.required);
    return { fills };
  }

  for (const act of [LEBLANC_ACT_II, LEBLANC_ACT_III]) {
    it(`${act}: across seeds 1-20 the fills lie in 0-60 % and are not all zero`, () => {
      const all: number[] = [];
      for (let seed = 1; seed <= 20; seed++) all.push(...opening(act, seed).fills);
      expect(Math.min(...all)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...all)).toBeLessThanOrEqual(0.6);
      expect(all.filter((f) => f > 0).length).toBeGreaterThan(all.length / 2);
    });
    it(`${act}: across seeds 1-20 the first actor varies`, () => {
      const firsts = new Set<string>();
      for (let seed = 1; seed <= 20; seed++) {
        const engine = new FFX2Engine({ atbMode: 'wait', separateBattleGauges: true });
        engine.setSeed(seed);
        engine.init({ game: 'ffx2', party: chateauBuild, enemies: ENEMY_GROUPS_BY_ID[act]!, triggers: [], seed, condition: 'scripted', canEscape: false });
        for (let i = 0; i < 200; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'waiting') { engine.tick(d.nextEventMs); continue; }
          const start = engine.state().log.find((e) => e.type === 'turn-start');
          firsts.add(d.kind === 'player-input' ? d.actorId : (start as { actorId: string } | undefined)?.actorId ?? '?');
          break;
        }
      }
      expect(firsts.size).toBeGreaterThan(1);
    });
    it(`${act}: without the flag the continuation opens at zero, as before`, () => {
      expect(opening(act, 5, true).fills.every((f) => f === 0)).toBe(true);
    });
  }

  it('the switch ships OFF (the stop rule: VI moves outside its band), so the chain still opens at zero', () => {
    expect(SEPARATE_BATTLE_GAUGES).toBe(false);
    const engine = new FFX2Engine({ atbMode: 'wait' });
    engine.init({ game: 'ffx2', party: chateauBuild, enemies: ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II]!, triggers: [], seed: 5, condition: 'scripted', canEscape: false });
    expect((Object.values(engine.state().combatants) as Ffx2Unit[]).every((u) => u.atb.ticks === 0)).toBe(true);
  });

  it('Act I and every other chain are untouched: only the two Chateau links carry the flag', () => {
    const flagged = Object.values(ENEMY_GROUPS_BY_ID).filter((g) => g?.opensAsSeparateBattle === true).map((g) => g!.id).sort();
    expect(flagged).toEqual([LEBLANC_ACT_II, LEBLANC_ACT_III].sort());
  });
});
