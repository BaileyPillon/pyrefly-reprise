// @vitest-environment jsdom
/**
 * PR-0012 / D-040 (FFX-2 only: FFX has its own always-on command-help slab,
 * `src/ui/ffx/commandHelp.ts` + `.ffx-cmd-info`, unaffected by this file).
 *
 * The FFX-2 command menu never said what the highlighted row does
 * (`src/ui/ffx2/commandHelp.ts` is the description logic). The slab that
 * shows it was gated off (194fa87) over a measured collision with the party
 * column; `docs/target/decisions.json` D-040 picked a placement — a
 * full-width band pinned to the top of the screen — and
 * `FFX2_COMMAND_HELP_PLACEMENT_RESOLVED` in `FFX2BattleHud.ts` flips it back
 * on. This test is jsdom, so it cannot measure real layout (that is the
 * screenshot acceptance under `docs/screenshots/picks/`); it pins the
 * behaviour a layout test cannot: the slab is hidden until a row is
 * highlighted, prints that row's label and sentence, respects the BATTLE
 * HELP setting, and clears itself when the menu closes.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { setBattleHelp } from '../../src/ui/coach/coachState.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import type { AtbSnapshot, AvailableCommand, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

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
      current: 'gunner',
      owned: ['gunner'],
      garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] },
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
    combatants: { rikku: girl('rikku', 'Rikku') },
    activeIds: ['rikku'],
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
    seed: 1,
    flags: {},
  };
}

const SNAPSHOT: AtbSnapshot = {
  elapsedMs: 0,
  bars: [{ actorId: 'rikku', fill: 1, required: 16000, ready: true, charge: null, state: 'normal' }],
};

const ROWS: AvailableCommand[] = [
  { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] },
];

describe('FFX-2 command-help slab (PR-0012, D-040)', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    // A real save, so `setBattleHelp`/`battleHelpOn` have something to read
    // and write — with no active save `battleHelpOn()` always falls back to
    // the shipped default (on).
    new SaveStore('k', memoryStorage());
    setBattleHelp(true);
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(state(), SNAPSHOT);
  });

  function slab(): HTMLElement {
    return root.querySelector('.ffx2-cmd-info') as HTMLElement;
  }

  it('is hidden before any command menu opens', () => {
    expect(slab().hidden).toBe(true);
  });

  it('shows the highlighted row\'s label and sentence once the menu opens, and hides again once it closes', async () => {
    const pending = hud.chooseCommand('rikku', ROWS, () => SNAPSHOT);
    expect(slab().hidden).toBe(false);
    expect(slab().querySelector('[data-role="label"]')?.textContent).toBe('Attack');
    expect(slab().querySelector('[data-role="text"]')?.textContent?.length).toBeGreaterThan(0);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    await pending;
    expect(slab().hidden).toBe(true);
  });

  it('stays off when the player has BATTLE HELP switched off', () => {
    setBattleHelp(false);
    void hud.chooseCommand('rikku', ROWS, () => SNAPSHOT);
    expect(slab().hidden).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
  });
});
