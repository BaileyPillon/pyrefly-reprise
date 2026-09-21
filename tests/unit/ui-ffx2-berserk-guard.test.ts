// @vitest-environment jsdom
/**
 * Critic round 05, PR-0045 — the HUD half of the repair. **FFX-2 only**: this
 * is the ATB HUD; FFX has its own `chooseCommand` and no dressphere concept.
 *
 * `FFX2BattleHud.chooseCommand` used to hand whatever it was given straight to
 * `openCommandMenu`. With an empty list that drew a menu with no submittable
 * row, so the promise it awaits could never resolve: a hard lock at the menu,
 * not a stall. The engine now guarantees the list is never empty (see
 * `ffx2-berserk-zero-rows.test.ts`); this is the belt behind that brace, so a
 * future data change cannot lock the battle again.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import type { AtbSnapshot, AvailableCommand, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';

function girl(id: string, name: string): FFX2Combatant {
  return {
    id,
    name,
    side: 'party',
    spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 1000, maxMp: 100 },
    hp: 1000,
    mp: 80,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 46,
    dresspheres: {
      current: 'white-mage',
      owned: ['white-mage'],
      garmentGrid: { id: 'tempered-will', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: {},
    },
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
  };
}

function state(): BattleState {
  return {
    game: 'ffx2',
    combatants: { yuna: girl('yuna', 'Yuna') },
    activeIds: ['yuna'],
    reserveIds: [],
    enemyIds: [],
    aeonId: null,
    turn: 1,
    ticks: 0,
    log: [],
    nextSeq: 1,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 3,
    flags: {},
  };
}

const SNAPSHOT: AtbSnapshot = {
  elapsedMs: 0,
  bars: [{ actorId: 'yuna', fill: 1, required: 16000, ready: true, charge: null, state: 'normal' }],
};

const ROW: AvailableCommand = {
  command: { kind: 'attack', targets: [] },
  label: 'Attack',
  category: 'attack',
  mpCost: 0,
  enabled: true,
  validTargets: [],
};

describe('FFX2BattleHud zero-row guard (PR-0045)', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(state(), SNAPSHOT);
  });

  it('passes the turn instead of opening a menu that cannot be answered', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const command = await hud.chooseCommand('yuna', [], () => SNAPSHOT);
    expect(command).toEqual({ kind: 'defend', targets: [] });
    // Nothing was drawn, so nothing is waiting for a click that will never come.
    expect(root.querySelectorAll('[class*="ffx2cmd"]').length).toBe(0);
    expect(root.querySelector<HTMLElement>('.ffx2hud__command')?.hidden).not.toBe(false);
    expect(errors).toHaveBeenCalledOnce();
    errors.mockRestore();
  });

  it('still opens the menu when there is a row to pick', async () => {
    const pending = hud.chooseCommand('yuna', [ROW], () => SNAPSHOT);
    const box = root.querySelector<HTMLElement>('.ffx2hud__command');
    expect(box?.hidden).toBe(false);
    expect(box?.querySelectorAll('[class*="ffx2cmd"]').length).toBeGreaterThan(0);
    // Answer it so the promise does not dangle into the next test.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    await expect(pending).resolves.toMatchObject({ kind: 'attack' });
  });
});
