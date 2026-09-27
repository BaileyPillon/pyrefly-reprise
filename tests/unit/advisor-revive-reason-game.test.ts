/**
 * The revive reason names only what the fallen member can do in *this* game
 * (critic round 13 PR-0192).
 *
 * Before: "Only Yuna can call an aeon — stand Yuna up" was shown in Chapter VI
 * with Yuna as a Gunner. FFX-2 Yuna has no Summon command; calling an aeon is
 * an FFX concept.
 *
 * **Game case: FFX-2 only** for the change [AGENTS.md rule 14]; the FFX half of
 * this file pins that FFX still says it.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { reviveReason } from '../../src/engine/tactics/advisor-revive.ts';

function withYunaDown(chapterId: string): BattleState {
  const { engine } = harnessFor(chapterId, 1);
  const state = structuredClone(engine.state()) as BattleState;
  const yuna = state.combatants['yuna'];
  if (!yuna) throw new Error(`${chapterId}: no Yuna on the board`);
  yuna.hp = 0;
  yuna.alive = false;
  return state;
}

describe('revive reason is game-aware (PR-0192)', () => {
  it('FFX-2 Chapter VI: no aeon in the reason', () => {
    const reason = reviveReason(withYunaDown('ffx2-leblanc'), 'yuna');
    expect(reason).not.toMatch(/aeon/i);
    expect(reason).toContain('Yuna');
  });

  it('FFX-2 Chapter IV: no aeon in the reason', () => {
    expect(reviveReason(withYunaDown('ffx2-bahamut'), 'yuna')).not.toMatch(/aeon/i);
  });

  it('FFX Chapter I still says she is the one who can call an aeon', () => {
    expect(reviveReason(withYunaDown('seymour-flux'), 'yuna')).toMatch(/call an aeon/);
  });
});
