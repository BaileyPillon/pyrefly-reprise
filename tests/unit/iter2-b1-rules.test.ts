/**
 * Iteration 2 batch B1: FFX-2 rule fixes, each proven by running the engine (hard rule 3).
 * **FFX-2 only** (AGENTS.md rule 14): Petrify's Game Over and the Fast-speed Sleep rule are FFX-2
 * battle-system rules (`research/ffx2-combat-core.md` §2.8, §1.5); the FFX engine is not touched.
 *
 * - PR-0145: all three girls petrified is a defeat at once (§2.8, "All three girls petrified =
 *   Game Over", `[verified: 2 sources]`), with no enemy action after it.
 * - PR-0108: at Config ATB SPEED = FAST a sleeping unit never wakes on its own (§1.5 and §2.8,
 *   `[single source: Split Infinity G1004]`); at Normal, Sleep still expires.
 *
 * **Re-parity W4 (2026-10-10; FFX-2 only, reason "game-code parity").** PR-0108 is no longer a rule the engine states, it is
 * what the game's own arithmetic does: a Sleep timer is 150,000 units and falls by the raw speed (70 / 95 / 120) each logic step, and
 * the game only looks for an expiry when the timer goes BELOW 0, so at Fast it lands exactly on 0 (1,250 steps of 120) and stays
 * (`kernel/status-timers.ts`; `research/re-ffx2-atb-status.md` section 6). The tests below run that through the engine. The PR-0107
 * opening bands are re-stated in the game's own terms: the counter starts at ((draw & 63) + 32) / 128 of a full wait, then the
 * trim, so what remains to wait is 0 to 75 percent of a full wait (it used to be a bar filled 0 to 60 percent).
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, StatusInstance } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEP_MS } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
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

describe('PR-0108: Sleep has no timed expiry at Fast (FFX-2): the arithmetic of the game', () => {
  /** A Sleep on Yuna with Bahamut asleep too (so nothing else happens), run for `steps` logic steps one call each. */
  function sleeper(speed: AtbSpeed, steps: number): Ffx2Unit {
    const engine = new FFX2Engine({ atbSpeed: speed, atbMode: 'active' });
    engine.init(bahamutSetup(3));
    const yuna = girls(engine)[0]!;
    applyStatus(yuna, { status: 'sleep', chance: 255, duration: 0 });
    const boss = Object.values(engine.state().combatants).find((c) => c.side === 'enemy') as Ffx2Unit;
    applyStatus(boss, { status: 'sleep', chance: 255, duration: 0 });
    (boss.statuses.sleep as StatusInstance).ticksRemaining = 2_000_000_000; // the boss stays out of it
    expect(yuna.statuses.sleep?.ticksRemaining).toBe(150_000);
    for (let i = 0; i < steps; i++) engine.tick(STEP_MS, { throughInput: true });
    return yuna;
  }

  it('at Normal the Sleep wears off on its clock (150,000 units at 95 a step: 1,579 steps)', () => {
    expect(sleeper('normal', 1578).statuses.sleep).toBeDefined();
    expect(sleeper('normal', 1580).statuses.sleep).toBeUndefined();
  });

  it('at Fast the same Sleep outlasts it: 150,000 at 120 a step lands exactly on 0 after 1,250 steps and is never looked at again', () => {
    const yuna = sleeper('fast', 2000);
    expect(yuna.statuses.sleep).toBeDefined();
    expect(yuna.statuses.sleep?.ticksRemaining).toBe(0);
  });

  it('at Slow it still runs out (150,000 at 70 a step: 2,143 steps)', () => {
    expect(sleeper('slow', 2100).statuses.sleep).toBeDefined();
    expect(sleeper('slow', 2200).statuses.sleep).toBeUndefined();
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
    // What remains to wait, as a fraction of the unit's own full wait (the game's counter against its maximum).
    const fills = units.map((u) => u.atb.recovery / u.gauge.recoveryMax);
    return { fills };
  }

  for (const act of [LEBLANC_ACT_II, LEBLANC_ACT_III]) {
    it(`${act}: across seeds 1-20 the wait that remains lies in 0-75 % of a full wait and is not all the same`, () => {
      const all: number[] = [];
      for (let seed = 1; seed <= 20; seed++) all.push(...opening(act, seed).fills);
      expect(Math.min(...all)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...all)).toBeLessThan(0.75); // (63 + 32) / 128 = 0.742 of a full wait, before the trim
      expect(new Set(all.map((f) => f.toFixed(6))).size).toBeGreaterThan(all.length / 2);
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
    it(`${act}: without the flag the continuation opens with every wait whole, as before`, () => {
      expect(opening(act, 5, true).fills.every((f) => f === 1)).toBe(true);
    });
  }

  // RE-PINNED on the branch `re-parity-rc9-x2-link-open-on` (NOT FOR MERGE until Bailey says yes): this test pinned the default OFF
  // ("the stop rule: VI moves outside its band", D-242, 2026-09-27) and that a default engine opened the chain "at zero". The switch is
  // ON here, so a default engine opens Act II as a fresh battle, and the option still turns it off. Re-measured 2026-10-16 on today's
  // engine the switch moves nothing outside the band (docs/handoff/re-parity-rc9-x2-link-open.md). The "at zero" check was also vacuous
  // after re-parity W4 (a unit's `atb.ticks` is the old count-up bar and nothing sets it now): the wait that remains is `atb.recovery`.
  it('the switch is ON on this branch (D-242 kept it OFF; NOT FOR MERGE until Bailey says yes), so a default engine opens Act II as a fresh battle, and the option turns it off', () => {
    expect(SEPARATE_BATTLE_GAUGES).toBe(true);
    const waits = (options: { separateBattleGauges?: boolean }): number[] => {
      const engine = new FFX2Engine({ atbMode: 'wait', ...options });
      engine.init({ game: 'ffx2', party: chateauBuild, enemies: ENEMY_GROUPS_BY_ID[LEBLANC_ACT_II]!, triggers: [], seed: 5, condition: 'scripted', canEscape: false });
      return (Object.values(engine.state().combatants) as Ffx2Unit[]).map((u) => u.atb.recovery / u.gauge.recoveryMax);
    };
    expect(waits({}).every((f) => f < 1)).toBe(true);
    expect(waits({ separateBattleGauges: false }).every((f) => f === 1)).toBe(true);
  });

  it('Act I and every other chain are untouched: only the two Chateau links carry the flag', () => {
    const flagged = Object.values(ENEMY_GROUPS_BY_ID).filter((g) => g?.opensAsSeparateBattle === true).map((g) => g!.id).sort();
    expect(flagged).toEqual([LEBLANC_ACT_II, LEBLANC_ACT_III].sort());
  });
});
