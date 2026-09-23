import { describe, expect, it } from 'vitest';

import type { BattleState } from '../../src/battle/common/types.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import { CUT_IN_HOLD_MS, TurnCutInBeat } from '../../src/engine/TurnCutIn.ts';

/** PR-0005: the approved turn cut-in plays on each party member's first turn of a battle, once. */
type Req = Parameters<NonNullable<MomentsPort['turnCutIn']>>[0];

function fakeState(game: 'ffx' | 'ffx2'): BattleState {
  const c = (id: string, name: string) => ({ id, name }) as never;
  return {
    game,
    activeIds: ['tidus', 'yuna', 'auron'],
    enemyIds: ['boss'],
    combatants: { tidus: c('tidus', 'Tidus'), yuna: c('yuna', 'Yuna'), auron: c('auron', 'Auron'), boss: c('boss', 'Boss') },
  } as unknown as BattleState;
}

function port(calls: Req[]): MomentsPort {
  return {
    letterbox: async () => {},
    nameSlab: async () => {},
    vignette: () => {},
    clear: () => {},
    turnCutIn: async (req) => {
      calls.push(req);
    },
  };
}

describe('TurnCutInBeat (PR-0005)', () => {
  it('plays once per party member per battle, never for an enemy', async () => {
    const calls: Req[] = [];
    const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal' });
    const s = fakeState('ffx');
    await beat.play(s, 'tidus');
    await beat.play(s, 'yuna');
    await beat.play(s, 'tidus');
    await beat.play(s, 'boss');
    expect(calls.map((c) => c.actorId)).toEqual(['tidus', 'yuna']);
    expect(calls[0]).toMatchObject({ name: 'Tidus', label: 'CTB 1 OF 3', side: 'left', game: 'ffx', holdMs: CUT_IN_HOLD_MS });
    expect(calls[1]!.label).toBe('CTB 2 OF 3');
  });

  it('says ATB in FFX-2 and scales the hold with the playback speed', async () => {
    const calls: Req[] = [];
    const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'fast' });
    await beat.play(fakeState('ffx2'), 'yuna');
    expect(calls[0]).toMatchObject({ label: 'ATB 2 OF 3', game: 'ffx2' });
    expect(calls[0]!.holdMs).toBeLessThan(CUT_IN_HOLD_MS);
  });

  it('shows nothing at skip speed or without a moments port', async () => {
    const calls: Req[] = [];
    await new TurnCutInBeat({ moments: port(calls), speed: () => 'skip' }).play(fakeState('ffx'), 'tidus');
    await new TurnCutInBeat({ moments: null, speed: () => 'normal' }).play(fakeState('ffx'), 'tidus');
    expect(calls).toEqual([]);
  });
});
