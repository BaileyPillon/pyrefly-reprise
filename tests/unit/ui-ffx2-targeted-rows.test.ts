// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import type { AtbSnapshot, AvailableCommand, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';

/**
 * D-044 (FFX-2 only): the focused review of a999d133 aimed at Node A with real
 * keys and found its NODE A row in the boss strip unlit, while stepping to
 * Node B lit that one. The first aim of every cursor lost its row outline:
 * `applySelection` lit the rows, and the next row render (a preview, a vitals
 * or gauge sync) rebuilt them unlit. The lit set now survives every render.
 */
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
    flags: id === 'node-a' ? { isPart: true, partOf: 'vegnagun-leg' } : {},
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

const STATE: BattleState = {
  game: 'ffx2',
  combatants: { rikku: unit('rikku', 'Rikku', 'party'), 'vegnagun-leg': unit('vegnagun-leg', 'Vegnagun', 'enemy'), 'node-a': unit('node-a', 'Node A', 'enemy') },
  activeIds: ['rikku'],
  reserveIds: [],
  enemyIds: ['vegnagun-leg', 'node-a'],
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
const SNAP: AtbSnapshot = { elapsedMs: 0, bars: [{ actorId: 'rikku', fill: 1, required: 16000, ready: true, charge: null, state: 'normal' }] };
const ATTACK: AvailableCommand = {
  command: { kind: 'attack', targets: [] },
  label: 'Attack',
  category: 'attack',
  mpCost: 0,
  enabled: true,
  validTargets: ['node-a'],
};

describe('FFX-2 targeted rows', () => {
  it("keeps the aimed-at Node's row lit through the row renders that follow the first aim", () => {
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(STATE, SNAP);
    void hud.chooseCommand('rikku', [ATTACK], () => SNAP);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    const row = (): Element | null => root.querySelector('.ffx2hud__enemies [data-actor-id="node-a"]');
    expect(row()?.classList.contains('ffx2--targeted')).toBe(true);
    hud.syncGauges(SNAP);
    hud.syncVitals(STATE);
    expect(row()?.classList.contains('ffx2--targeted')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    hud.syncGauges(SNAP);
    expect(row()?.classList.contains('ffx2--targeted')).toBe(false);
    hud.unmount();
  });
});
