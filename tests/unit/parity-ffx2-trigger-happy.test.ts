/**
 * **RE parity RC10, FFX-2 only: Trigger Happy, a window nobody pressed in plays no hit** (lane `re-parity-rc10-x2-minigames`; row S10 of the gap scan of 2026-10-17; source FFX2-H05, a private working note: the row plans 60 hits per target, every shot executes one, the rest is dropped when the window closes).
 *
 * Game case: FFX-2 only (Trigger Happy and Lady Luck are FFX-2 content; nothing here is read from FFX.exe).
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, hitsFromOutcome, rollDefault } from '../../src/battle/ffx2/index.ts';
import { bevelleParty, enemy, group } from '../../src/battle/ffx2/fixtures.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { AbilityRegistry } from '../../src/battle/ffx2/index.ts';
import type { BattleEvent, BattleSetup, Command, MinigameResult } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';

/** The real ability catalog (with the game's command rows attached), the way `BattleScreen` injects it. */
const catalog: AbilityRegistry = { get: (id) => data.ABILITIES[id] };

const TRIGGER_HAPPY = 'x2-gunner-trigger-happy';

function setupWith(seed = 1, hp = 200000): BattleSetup {
  return {
    game: 'ffx2',
    party: bevelleParty(24, 'first-steps'),
    enemies: group('minigame-fixture', [enemy('boss', 'Boss', 'none', { hp, maxHp: hp, mp: 0, maxMp: 0, agi: 1 })]),
    triggers: [],
    seed,
    condition: 'scripted',
    canEscape: false,
  };
}

/** Run until Yuna may act. */
function driveToYuna(engine: FFX2Engine): void {
  for (let i = 0; i < 400; i++) {
    const decision = engine.nextDecision();
    if (decision.kind === 'player-input') {
      if (decision.actorId === 'yuna') return;
      engine.submit({ kind: 'defend', targets: [] });
      continue;
    }
    if (decision.kind === 'waiting') {
      engine.tick(decision.nextEventMs);
      continue;
    }
    if (decision.kind !== 'resolved') break;
  }
  throw new Error('Yuna never got a turn');
}

const shotsOf = (presses: number): MinigameResult => ({ kind: 'gunner-trigger', trigger: { hits: presses } });

/** Yuna's Trigger Happy with `presses` presses (or none attached: the engine's own roll), on a fresh battle of `seed`. */
function cast(presses: number | null, seed = 1): { events: BattleEvent[]; engine: FFX2Engine } {
  const engine = new FFX2Engine({ minigames: true, abilities: catalog });
  engine.init(setupWith(seed));
  driveToYuna(engine);
  const command: Command =
    presses === null
      ? { kind: 'overdrive', id: TRIGGER_HAPPY, targets: ['boss'] }
      : { kind: 'overdrive', id: TRIGGER_HAPPY, targets: ['boss'], extra: shotsOf(presses) };
  const events = engine.submit(command);
  // A bare command asks for the overlay first; the bare re-submit is "nobody is going to play it" and rolls the seeded default.
  return { events: presses === null ? engine.submit(command) : events, engine };
}

const hitsOnBoss = (events: readonly BattleEvent[]): number => events.filter((e) => e.type === 'damage' && e.targetId === 'boss').length;

describe('Trigger Happy: a window nobody pressed in plays no hit (FFX2-H05 3.5; gap scan S10)', () => {
  it('the row the hit determination plans from is the game\'s: 60 hits per target', () => {
    expect(data.ABILITIES[TRIGGER_HAPPY]?.ffx2Record?.hits).toBe(60);
    expect(data.ABILITIES[TRIGGER_HAPPY]?.ffx2Record?.id).toBe(0x3032);
  });

  // The note's own engine check (`engine_check/zero_presses.mjs`) read, before the fix: 0 presses planned 60, 1 planned 1, 5 planned 5, 20 planned 16.
  // The game: the shots executed are the presses (a shot is the poll finding a press), at most the planned 60; the engine keeps its cap of 16.
  it.each([
    [0, 0],
    [1, 1],
    [5, 5],
    [16, 16],
    [20, 16],
    [60, 16],
  ])('%i presses play %i hits on the target', (presses, hits) => {
    expect(hitsOnBoss(cast(presses).events)).toBe(hits);
  });

  it('zero presses play no hit at all: no damage, no miss, no result on the target', () => {
    const { events } = cast(0);
    expect(events.filter((e) => e.type === 'damage' || e.type === 'miss' || e.type === 'heal')).toEqual([]);
    expect(events.some((e) => e.type === 'minigame-request')).toBe(false); // the outcome was attached: the overlay is not asked again
    expect(events.some((e) => e.type === 'action-start')).toBe(true);
    expect(events.some((e) => e.type === 'action-end')).toBe(true);
  });

  it('zero presses still pay the command: her bar is spent exactly as it is after five presses', () => {
    const none = cast(0);
    const five = cast(5);
    const bar = (e: FFX2Engine) => JSON.stringify(e.state().combatants['yuna']);
    expect(bar(none.engine)).toBe(bar(five.engine));
  });

  it('the boss is untouched by zero presses and loses HP to one', () => {
    const hpAfter = (presses: number): number => cast(presses).engine.state().combatants['boss']!.hp;
    expect(hpAfter(0)).toBe(200000);
    expect(hpAfter(1)).toBeLessThan(200000);
  });

  it('"no minigame result" is not "zero presses": a bare Trigger Happy rolls the engine\'s own 6 to 16 on every seed', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const n = hitsOnBoss(cast(null, seed).events);
      expect(n).toBeGreaterThanOrEqual(6);
      expect(n).toBeLessThanOrEqual(16);
    }
  });

  it('the shot count a result carries: 0 stays 0, a negative is 0, more than 16 is 16, no result is null', () => {
    expect(hitsFromOutcome(null)).toBeNull();
    expect(hitsFromOutcome(shotsOf(0))).toBe(0);
    expect(hitsFromOutcome(shotsOf(-3))).toBe(0);
    expect(hitsFromOutcome(shotsOf(7))).toBe(7);
    expect(hitsFromOutcome(shotsOf(99))).toBe(16);
    expect(hitsFromOutcome(rollDefault('ladyluck-reels', new SeededRng(1)))).toBeNull(); // the reels never change a hit count
    const rolled = hitsFromOutcome(rollDefault('gunner-trigger', new SeededRng(1)));
    expect(rolled).toBeGreaterThanOrEqual(6);
  });
});
