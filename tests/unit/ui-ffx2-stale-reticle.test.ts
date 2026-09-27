// @vitest-environment jsdom
/**
 * No reticle or plate for a combatant outside the current link, and never a
 * raw id on a plate (critic round 13 PR-0175).
 *
 * Chapter V, link 5 opening dialogue: a flower sat at the top-left corner with
 * a plate reading `vegnagun-leg`, then `vegnagun-head`, over the boss bar. That
 * is the target cursor of a menu opened on link 4 and never torn down: when a
 * new menu opened, the HUD overwrote its close handle, so the old cursor stayed
 * in the overlay, still listening for arrow keys. The Leg and the Head are not
 * on link 5's board, so the cursor's projector found nothing (the corner
 * fallback) and its name lookup fell back to the id.
 *
 * **Game case: FFX-2 only** (the FFX-2 HUD's menu lifecycle and plates; the
 * Vegnagun chain is Chapter V's).
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, AvailableCommand, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { targetPlateText } from '../../src/ui/ffx2/TargetPlates.ts';

function unit(id: string, name: string, side: 'party' | 'enemy'): FFX2Combatant {
  return {
    id,
    name,
    side,
    spriteKey: id,
    stats: { hp: 500, mp: 50, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 500, maxMp: 50 },
    hp: 500,
    mp: 50,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: side === 'party' ? 'player' : 'ai',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 10,
    ...(side === 'party'
      ? { dresspheres: { current: 'gunner', owned: ['gunner'], garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] }, abilitiesLearned: {} } }
      : {}),
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
  } as FFX2Combatant;
}

function state(enemies: Array<[string, string]>): BattleState {
  const combatants: BattleState['combatants'] = { rikku: unit('rikku', 'Rikku', 'party') };
  for (const [id, name] of enemies) combatants[id] = unit(id, name, 'enemy');
  return {
    game: 'ffx2',
    combatants,
    activeIds: ['rikku'],
    reserveIds: [],
    enemyIds: enemies.map(([id]) => id),
    aeonId: null,
    turn: 1,
    ticks: 0,
    log: [],
    nextSeq: 1,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  };
}

const SNAP: AtbSnapshot = { elapsedMs: 0, bars: [{ actorId: 'rikku', fill: 1, required: 16000, ready: true, charge: null, state: 'normal' }] };
const attackOn = (...ids: string[]): AvailableCommand => ({
  command: { kind: 'attack', targets: [] },
  label: 'Attack',
  category: 'attack',
  mpCost: 0,
  enabled: true,
  validTargets: ids,
});
const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('stale reticles (PR-0175)', () => {
  it('a new menu tears down the one it replaces: one cursor, none from the last link', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(state([['vegnagun-leg', 'Leg'], ['vegnagun-head', 'Head']]), SNAP);
    void hud.chooseCommand('rikku', [attackOn('vegnagun-leg', 'vegnagun-head')], () => SNAP);
    key('Enter'); // into target select on the Leg
    expect(root.querySelectorAll('.ffx-targeting').length).toBe(1);

    // The link ends under the open menu and link 5 opens without that menu
    // having been closed: the next decision's menu replaces it.
    hud.sync(state([['shuyin', 'Shuyin']]), SNAP);
    void hud.chooseCommand('rikku', [attackOn('shuyin')], () => SNAP);
    expect(root.querySelectorAll('.ffx-targeting').length).toBe(1);
    const plates = [...root.querySelectorAll('.ffx-target__plate, .ffx2-tplate')].map((e) => e.textContent ?? '');
    for (const t of plates) expect(t).not.toMatch(/vegnagun-(leg|head)/);
    hud.unmount();
  });

  it('a plate never prints a raw id for a combatant that is not on the board', () => {
    const s = state([['shuyin', 'Shuyin']]);
    const text = targetPlateText({ mode: 'single', ids: ['vegnagun-leg'], activeId: 'vegnagun-leg', kind: 'enemy' } as never, 1, s, 'rikku');
    expect(text.target.name).not.toMatch(/^[a-z]+-[a-z-]+$/);
  });
});
