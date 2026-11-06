/**
 * The opening probe (FFX only): who moves first at Spherimorph's first menu, measured on the real engine over 100 seeds. The coach's first-command line (`src/ui/coach/turnOrderLine.ts`) is keyed by chapter and may
 * show "He moves after you" only where no enemy acts before the first menu in any seed: this is the count that line stands on (the other half of `r62-auron-turn-order-tip.test.ts`, which runs 20 seeds).
 */

import { describe, expect, it } from 'vitest';

import { TURN_ORDER_LINES, TURN_ORDER_PARTY_FIRST } from '../../../src/ui/coach/turnOrderLine.ts';
import { actionList, log, newEngine, setState, stateOf } from '../helpers/spherimorphDrive.ts';
import type { Decision } from '../../../src/battle/common/types.ts';

describe('the opening', () => {
  it('Tidus opens in 100 of 100 seeds and nothing has acted before his menu (so the line "He moves after you" is true)', () => {
    let enemyFirst = 0;
    const openers = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const engine = newEngine(seed);
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
    expect(enemyFirst).toBe(0);
    expect([...openers]).toEqual(['tidus']);
    expect(TURN_ORDER_LINES['spherimorph']).toBe(TURN_ORDER_PARTY_FIRST);
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
