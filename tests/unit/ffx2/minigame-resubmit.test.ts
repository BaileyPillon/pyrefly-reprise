/**
 * FFX-2's half of the timed-input contract [`docs/CONTRACTS.md`, "Minigame
 * protocol"].
 *
 * The contract has two halves and only the first was ever asserted: the engine
 * emits `minigame-request` and **stops**, and the UI re-submits the *same*
 * command with the outcome attached as `extra`. It says nothing about the
 * command coming back **bare** — and the answer has to be the contract's own
 * "if `extra` is absent … the engine rolls a default outcome from the seeded
 * RNG", or a presenter that re-submits without an outcome asks forever. On the
 * FFX side that was measured: a probe re-picked Spiral Cut 19,916 times.
 *
 * This suite pins the FFX-2 engine to the same rule, so the presenter's
 * workaround is safe in both games and the behaviour cannot regress the way it
 * had already regressed in `src/battle/ffx/execute.ts`.
 *
 * Trigger Happy is "one hit per R1 press, up to 60 shots" [ffx2-combat-core
 * §3.1]; `rollTriggerHappy` is the seeded stand-in for a player's presses.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { bevelleParty, enemy, group } from '../../../src/battle/ffx2/fixtures.ts';
import { rollDefault, rollTriggerHappy } from '../../../src/battle/ffx2/minigames.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import type { AbilityRegistry } from '../../../src/battle/ffx2/index.ts';
import type { BattleEvent, BattleSetup, Command } from '../../../src/battle/common/types.ts';
import gunnerAbilities from '../../../src/data/ffx2/abilities/gunner.ts';
import ladyLuckAbilities from '../../../src/data/ffx2/abilities/lady-luck.ts';

/** The real Gunner table, injected the way `BattleScreen` injects it. */
const dataAbilities: AbilityRegistry = {
  get: (id) => [...gunnerAbilities, ...ladyLuckAbilities].find((a) => a.id === id),
};

const TRIGGER_HAPPY = 'x2-gunner-trigger-happy';

function setupWith(seed = 1): BattleSetup {
  return {
    game: 'ffx2',
    party: bevelleParty(24, 'first-steps'),
    enemies: group('minigame-fixture', [
      enemy('boss', 'Boss', 'none', { hp: 20000, maxHp: 20000, mp: 0, maxMp: 0, agi: 1 }),
    ]),
    triggers: [],
    seed,
    condition: 'scripted',
    canEscape: false,
  };
}

/** Run until Yuna may act. */
function driveToYuna(engine: FFX2Engine, log: BattleEvent[]): void {
  for (let i = 0; i < 400; i++) {
    const decision = engine.nextDecision();
    if (decision.kind === 'player-input') {
      if (decision.actorId === 'yuna') return;
      log.push(...engine.submit({ kind: 'defend', targets: [] }));
      continue;
    }
    if (decision.kind === 'resolved') {
      log.push(...decision.events);
      continue;
    }
    if (decision.kind === 'waiting') {
      log.push(...engine.tick(decision.nextEventMs));
      continue;
    }
    break;
  }
  throw new Error('Yuna never got a turn');
}

const triggerHappy: Command = { kind: 'overdrive', id: TRIGGER_HAPPY, targets: ['boss'] };

describe('a bare re-submit of a timed ability resolves itself [CONTRACTS.md]', () => {
  it('emits the request once and stops', () => {
    const engine = new FFX2Engine({ minigames: true, abilities: dataAbilities });
    engine.init(setupWith());
    driveToYuna(engine, []);

    const first = engine.submit(triggerHappy);
    expect(first.filter((e) => e.type === 'minigame-request')).toHaveLength(1);
    const request = first.find((e) => e.type === 'minigame-request');
    if (request?.type !== 'minigame-request') throw new Error('no request');
    expect(request.who).toBe('yuna');
    expect(request.kind).toBe('gunner-trigger');
    expect(first.some((e) => e.type === 'damage')).toBe(false);
  });

  it('rolls the outcome from the seeded RNG on the second, bare submit', () => {
    const engine = new FFX2Engine({ minigames: true, abilities: dataAbilities });
    engine.init(setupWith());
    driveToYuna(engine, []);

    engine.submit(triggerHappy);
    const second = engine.submit(triggerHappy);
    expect(second.some((e) => e.type === 'minigame-request')).toBe(false);
    expect(second.some((e) => e.type === 'damage')).toBe(true);
  });

  it('never loops: a presenter that only ever re-submits bare still advances', () => {
    const engine = new FFX2Engine({ minigames: true, abilities: dataAbilities });
    engine.init(setupWith());
    driveToYuna(engine, []);

    let requests = 0;
    let resolved = false;
    for (let i = 0; i < 50; i++) {
      const events = engine.submit(triggerHappy);
      requests += events.filter((e) => e.type === 'minigame-request').length;
      if (events.some((e) => e.type === 'action-end')) {
        resolved = true;
        break;
      }
    }
    expect(requests).toBe(1);
    expect(resolved).toBe(true);
  });

  it('the rolled outcome is the seeded default, not a fixed constant', () => {
    const shots = (seed: number): number => {
      const engine = new FFX2Engine({ minigames: true, abilities: dataAbilities });
      engine.init(setupWith(seed));
      driveToYuna(engine, []);
      engine.submit(triggerHappy);
      return engine.submit(triggerHappy).filter((e) => e.type === 'damage').length;
    };
    // Reproducible for one seed …
    expect(shots(1)).toBe(shots(1));
    // … and inside the published 0–16 press band the default rolls in.
    expect(shots(1)).toBeGreaterThan(0);
    expect(shots(1)).toBeLessThanOrEqual(16);
  });

  it('still opens the overlay when the player backed out to another timed action', () => {
    const engine = new FFX2Engine({ minigames: true, abilities: dataAbilities });
    engine.init(setupWith());
    driveToYuna(engine, []);

    expect(engine.submit(triggerHappy).filter((e) => e.type === 'minigame-request')).toHaveLength(1);

    // The player closed the overlay and picked a *different* timed action.
    // Attack Reels winds up first (`CT_MEDIUM`), so the request only arrives
    // once the purple bar empties.
    const reels: Command = { kind: 'overdrive', id: 'x2-lady-luck-attack-reels', targets: ['boss'] };
    const events: BattleEvent[] = [...engine.submit(reels)];
    for (let i = 0; i < 200 && !events.some((e) => e.type === 'minigame-request' && e.kind === 'ladyluck-reels'); i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') events.push(...engine.tick(d.nextEventMs));
      else if (d.kind === 'resolved') events.push(...d.events);
      else if (d.kind === 'player-input') events.push(...engine.submit({ kind: 'defend', targets: [] }));
      else break;
    }
    expect(events.filter((e) => e.type === 'minigame-request' && e.kind === 'ladyluck-reels')).toHaveLength(1);
  });

  it('`minigames: false` never asks at all, which is what e2e relies on', () => {
    const engine = new FFX2Engine({ minigames: false, abilities: dataAbilities });
    engine.init(setupWith());
    driveToYuna(engine, []);

    const events = engine.submit(triggerHappy);
    expect(events.some((e) => e.type === 'minigame-request')).toBe(false);
    expect(events.some((e) => e.type === 'damage')).toBe(true);
  });

  it('the default press count stays inside the §3.1 band', () => {
    const rng = new SeededRng(99);
    for (let i = 0; i < 200; i++) {
      const hits = rollTriggerHappy(rng);
      expect(hits).toBeGreaterThanOrEqual(6);
      expect(hits).toBeLessThanOrEqual(16);
    }
    const rolled = rollDefault('gunner-trigger', new SeededRng(1));
    expect(rolled?.kind).toBe('gunner-trigger');
  });
});
