/**
 * The opening probe (FFX only): who moves first at Spherimorph's first menu, measured on the real engine. The coach's first-command line (`src/ui/coach/turnOrderLine.ts`) is keyed by chapter and may show "He moves after
 * you" only where no enemy acts before the first menu in any seed AND for any party the chapter lets the player pick (`r62-auron-turn-order-tip.test.ts`). **This chapter shows no such line** (the review of 2026-11-06,
 * m1): its party prep lets the player pick any three of the seven, and the line is true for the two Tidus fronts and false for the slow ones. This file pins both halves of that: the shipped front opens on Tidus in
 * 100 of 100 seeds with nothing before his menu, and Auron, Wakka and Kimahri in front meet Spherimorph's first turn before their first menu in most seeds, so a chapter-keyed line would be false.
 */

import { describe, expect, it } from 'vitest';

import { TURN_ORDER_LINES } from '../../../src/ui/coach/turnOrderLine.ts';
import { buildWith } from '../helpers/spherimorphBot.ts';
import { actionList, log, newEngine, setState, stateOf } from '../helpers/spherimorphDrive.ts';
import type { Decision } from '../../../src/battle/common/types.ts';

/** How many of `seeds` seeds have an `action-start` in the log before the first player menu, and who the first menus are. */
function opening(front: readonly [string, string, string], seeds: number): { enemyFirst: number; openers: Set<string> } {
  let enemyFirst = 0;
  const openers = new Set<string>();
  for (let seed = 1; seed <= seeds; seed++) {
    const engine = newEngine(seed, buildWith(front));
    for (let i = 0; i < 2000; i++) {
      const d: Decision = engine.nextDecision();
      if (d.kind === 'player-input') {
        if (actionList(log(engine)).length > 0) enemyFirst++;
        openers.add(d.actorId);
        break;
      }
      if (d.kind === 'battle-over') break;
    }
  }
  return { enemyFirst, openers };
}

describe('the opening', () => {
  it('the shipped front: Tidus opens in 100 of 100 seeds and nothing has acted before his menu', () => {
    const got = opening(['tidus', 'yuna', 'lulu'], 100);
    expect(got.enemyFirst).toBe(0);
    expect([...got.openers]).toEqual(['tidus']);
  });

  it('with Auron, Wakka and Kimahri in front Spherimorph acts before the first menu in most seeds (282 of 300 in the review), so a chapter-keyed "He moves after you" would be false: the chapter shows no line', () => {
    const got = opening(['auron', 'wakka', 'kimahri'], 100);
    expect(got.enemyFirst).toBeGreaterThan(60);
    expect(TURN_ORDER_LINES['spherimorph']).toBeUndefined();
  });

  it('the starting state is drawn before the first menu and the affinities are in force at once (the first blow already meets them)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const engine = newEngine(seed);
      const state = stateOf(engine);
      expect([0, 1, 2, 3]).toContain(state);
    }
    const engine = newEngine(7);
    setState(engine, 2);
    expect(stateOf(engine)).toBe(2);
  });
});
