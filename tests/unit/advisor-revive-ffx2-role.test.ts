/**
 * B6 (t1-b3a's finding): the revive value weighted FFX-2 Yuna as a Summoner.
 *
 * `PARTY_ROLES` are FFX's archetypes (`ui/common/party-roles.ts`), keyed by id, and FFX-2 shares
 * the id `yuna`, so an FFX-2 raise of Yuna carried the Summoner's 2,500 for an aeon X-2 has no row
 * for. FFX-2's ranking now carries no role weight at all; FFX's is unchanged.
 *
 * Game case: FFX-2 only for the change; the FFX half pins that FFX still weighs the Summoner.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { reviveValue } from '../../src/engine/tactics/advisor-revive.ts';

function down(chapterId: string, ids: readonly string[]): BattleState {
  const { engine } = harnessFor(chapterId, 1);
  const state = structuredClone(engine.state()) as BattleState;
  for (const id of ids) {
    const c = state.combatants[id]!;
    c.hp = 0;
    c.alive = false;
  }
  return state;
}

describe('revive value: no Summoner weight in FFX-2', () => {
  for (const chapter of ['ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc']) {
    it(`${chapter}: Yuna down is worth what Rikku down is worth, with the same board around them`, () => {
      const yuna = reviveValue(down(chapter, ['yuna']), 'yuna');
      const rikku = reviveValue(down(chapter, ['rikku']), 'rikku');
      expect(yuna).toBe(rikku);
    });
  }

  it('FFX Chapter I: the Summoner is still worth more than the Warrior', () => {
    const yuna = reviveValue(down('seymour-flux', ['yuna']), 'yuna');
    const tidus = reviveValue(down('seymour-flux', ['tidus']), 'tidus');
    expect(yuna - tidus).toBeGreaterThanOrEqual(2_500);
  });
});
