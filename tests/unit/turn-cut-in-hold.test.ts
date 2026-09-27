/**
 * PR-0104 (FFX-2 only): under FFX-2's ATB a confirmed spell charges, and the
 * next girl's menu opens while it does. Her cut-in waits for the charge to
 * resolve and its action to play (so the effect or the status tag reads
 * first), but for at most {@link CUT_IN_WAIT_CAP_MS} (the plan's "at most
 * 0.8 s"), so the slab never lands seconds into her open menu (iter2-b2 check,
 * CHK-B2-1). A charge still running at the cap, or a menu answered while it
 * waited, moves her cut-in to her next turn, once; the second time it shows
 * at the cap regardless. The menu itself never waits (it opens as before).
 * FFX's CTB has no charge: its cut-in plays at once, as before.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import { CUT_IN_WAIT_CAP_MS, TurnCutInBeat } from '../../src/engine/TurnCutIn.ts';

type Req = Parameters<NonNullable<MomentsPort['turnCutIn']>>[0];

function state(game: 'ffx' | 'ffx2', charging: string[] = []): BattleState {
  const c = (id: string, name: string) =>
    ({ id, name, atb: { ticks: 0, required: 1, gauge: 0, recovery: 0, charging: charging.includes(id) ? { commandRef: {}, remainingTicks: 100, totalTicks: 200 } : null } }) as never;
  return {
    game,
    activeIds: ['yuna', 'rikku', 'paine'],
    enemyIds: ['shiva'],
    combatants: { yuna: c('yuna', 'Yuna'), rikku: c('rikku', 'Rikku'), paine: c('paine', 'Paine'), shiva: c('shiva', 'Shiva') },
  } as unknown as BattleState;
}

function port(calls: Req[]): MomentsPort {
  return { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, turnCutIn: async (r) => void calls.push(r) };
}

describe('the next cut-in waits for the charging action (PR-0104)', () => {
  it('never waits longer than the plan allows (at most 0.8 s)', () => {
    expect(CUT_IN_WAIT_CAP_MS).toBeLessThanOrEqual(800);
  });

  it("waits while Yuna's Shell charges and plays, then shows Rikku's, all inside the cap", async () => {
    const calls: Req[] = [];
    const s = state('ffx2', ['yuna']);
    let acting = false;
    let slept = 0;
    const beat = new TurnCutInBeat({
      moments: port(calls),
      speed: () => 'normal',
      acting: () => acting,
      menuFor: () => 'rikku',
      sleep: async (ms) => {
        slept += ms;
        // The charge completes after 200 ms and the action plays for 200 ms more.
        const y = s.combatants['yuna'] as unknown as { atb: { charging: unknown } };
        if (slept >= 200 && y.atb.charging) {
          y.atb.charging = null;
          acting = true;
        }
        if (slept >= 400) acting = false;
      },
    });
    await beat.play(s, 'rikku');
    expect(calls.map((c) => c.actorId)).toEqual(['rikku']);
    expect(slept).toBeGreaterThanOrEqual(400);
    expect(slept).toBeLessThanOrEqual(CUT_IN_WAIT_CAP_MS);
  });

  it('a charge still running at the cap moves the cut-in to her next turn, without covering this menu', async () => {
    const calls: Req[] = [];
    let slept = 0;
    const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal', acting: () => false, menuFor: () => 'rikku', sleep: async (ms) => void (slept += ms) });
    await beat.play(state('ffx2', ['yuna']), 'rikku');
    expect(calls).toHaveLength(0);
    expect(slept).toBeLessThanOrEqual(CUT_IN_WAIT_CAP_MS);
    // Her menu re-asked within the same turn (an abandoned FFX-2 menu): still not.
    await beat.play(state('ffx2'), 'rikku');
    expect(calls).toHaveLength(0);
    // Her next turn, after she submitted a command, the charge long resolved: it plays at once.
    beat.acted('rikku');
    slept = 0;
    await beat.play(state('ffx2'), 'rikku');
    expect(calls.map((c) => c.actorId)).toEqual(['rikku']);
    expect(slept).toBe(0);
    // And never a third time.
    await beat.play(state('ffx2'), 'rikku');
    expect(calls).toHaveLength(1);
  });

  it('moved once, it shows at the cap the second time rather than being lost', async () => {
    const calls: Req[] = [];
    let slept = 0;
    const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal', acting: () => true, menuFor: () => 'rikku', sleep: async (ms) => void (slept += ms) });
    await beat.play(state('ffx2', ['yuna']), 'rikku');
    expect(calls).toHaveLength(0);
    beat.acted('rikku');
    slept = 0;
    await beat.play(state('ffx2', ['yuna']), 'rikku');
    expect(calls).toHaveLength(1);
    expect(slept).toBeLessThanOrEqual(CUT_IN_WAIT_CAP_MS);
  });

  it('a menu answered while it waited moves it to her next turn', async () => {
    const calls: Req[] = [];
    let menu: string | null = 'rikku';
    // Paine answers her menu 60 ms in, while Yuna's charge still runs.
    const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal', acting: () => false, menuFor: () => menu, sleep: async () => void (menu = null) });
    await beat.play(state('ffx2', ['yuna']), 'rikku');
    expect(calls).toHaveLength(0);
    beat.acted('rikku');
    menu = 'rikku';
    await beat.play(state('ffx2'), 'rikku');
    expect(calls).toHaveLength(1);
  });

  it('a menu answered before the wait ended counts that answer as her turn', async () => {
    const calls: Req[] = [];
    let menu: string | null = 'rikku';
    let beatRef: TurnCutInBeat | null = null;
    const beat = new TurnCutInBeat({
      moments: port(calls),
      speed: () => 'normal',
      acting: () => false,
      menuFor: () => menu,
      sleep: async () => {
        if (menu) beatRef!.acted('rikku'); // she answers 60 ms in
        menu = null;
      },
    });
    beatRef = beat;
    await beat.play(state('ffx2', ['yuna']), 'rikku');
    expect(calls).toHaveLength(0);
    menu = 'rikku';
    await beat.play(state('ffx2'), 'rikku');
    expect(calls).toHaveLength(1);
  });

  it('does not wait with nothing charging or acting, nor in FFX', async () => {
    for (const s of [state('ffx2'), state('ffx', ['yuna'])]) {
      const calls: Req[] = [];
      let slept = 0;
      const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal', acting: () => false, menuFor: () => 'rikku', sleep: async (ms) => void (slept += ms) });
      await beat.play(s, 'rikku');
      expect(calls).toHaveLength(1);
      expect(slept).toBe(0);
    }
  });
});
