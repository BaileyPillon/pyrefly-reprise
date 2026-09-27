/**
 * PR-0104 (FFX-2 only): under FFX-2's ATB a confirmed spell charges, and the
 * next girl's menu opens while it does. Her cut-in now waits until the charge
 * has resolved and its action has played (so the effect or the status tag
 * reads first), capped so it is never lost, and is dropped if her menu has
 * already been answered. The menu itself never waits (it opens as before).
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
  it("waits while Yuna's Shell charges and plays, then shows Rikku's", async () => {
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
        // The charge completes after 300 ms and the action plays for 600 ms more.
        const y = s.combatants['yuna'] as unknown as { atb: { charging: unknown } };
        if (slept >= 300 && y.atb.charging) {
          y.atb.charging = null;
          acting = true;
        }
        if (slept >= 900) acting = false;
      },
    });
    await beat.play(s, 'rikku');
    expect(calls.map((c) => c.actorId)).toEqual(['rikku']);
    expect(slept).toBeGreaterThanOrEqual(900);
    expect(slept).toBeLessThan(CUT_IN_WAIT_CAP_MS);
  });

  it('gives up waiting at the cap and still shows it', async () => {
    const calls: Req[] = [];
    let slept = 0;
    const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal', acting: () => true, menuFor: () => 'rikku', sleep: async (ms) => void (slept += ms) });
    await beat.play(state('ffx2', ['yuna']), 'rikku');
    expect(calls).toHaveLength(1);
    expect(slept).toBeGreaterThanOrEqual(CUT_IN_WAIT_CAP_MS);
  });

  it("drops it when her menu was answered while it waited", async () => {
    const calls: Req[] = [];
    let menu: string | null = 'rikku';
    const beat = new TurnCutInBeat({ moments: port(calls), speed: () => 'normal', acting: () => true, menuFor: () => menu, sleep: async () => void (menu = null) });
    await beat.play(state('ffx2', ['yuna']), 'rikku');
    expect(calls).toHaveLength(0);
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

