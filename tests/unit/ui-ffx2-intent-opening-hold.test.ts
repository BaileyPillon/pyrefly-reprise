// @vitest-environment jsdom
/**
 * The FFX-2 enemy-move slab waits for the opening (critic round 13 PR-0146).
 *
 * Chapter IV from the title: the "Curse" slab showed over the fading title
 * card at 363 ms, before the battle-start moment took the HUD down (658 ms) and
 * long before the boss caption. The HUD is mounted and synced before the
 * presenter plays the opening, and the slab rendered on that first sync.
 *
 * No new hook: the HUD already hears the opening through `setVisible` (the
 * moment takes it down and hands it back) and the first decision through
 * `chooseCommand`. The slab is held (suspended, the pause screen's own switch)
 * until the first of: the HUD handed back after being taken down, or the first
 * command menu.
 *
 * **Game case: FFX-2 only** for this change (the FFX-2 HUD). The FFX HUD's half
 * is in `ui/ffx/FFXBattleHud.ts`, another batch's file.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, AvailableCommand, BattleState } from '../../src/battle/common/types.ts';
import type { IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

const view = {
  enemyId: 'bahamut',
  enemyName: 'BAHAMUT',
  turnsAway: 0,
  actsNext: true,
  kind: 'action',
  moveName: 'Curse',
  abilityId: 'curse',
  description: 'Curses one girl.',
  elements: ['none'],
  statusText: [],
  confidence: 'scripted',
  branches: [],
  charge: null,
  counters: [],
  formNote: null,
  notes: [],
  cite: 'ffx2-bahamut §4',
} as unknown as IntentView;

const live: FFX2BattleHud[] = [];
afterEach(() => {
  for (const h of live.splice(0)) h.unmount();
  document.body.innerHTML = '';
});

function mount(): FFX2BattleHud {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFX2BattleHud();
  hud.mount(root);
  live.push(hud);
  hud.setIntentSource(() => view);
  return hud;
}

describe('FFX-2 intent slab holds through the opening (PR-0146)', () => {
  it('is held from mount until the battle-start moment hands the HUD back', () => {
    const hud = mount();
    expect(hud.enemyIntent.isSuspended).toBe(true);
    hud.setVisible(false); // the moment takes the HUD down
    expect(hud.enemyIntent.isSuspended).toBe(true);
    hud.setVisible(true); // ...and hands it back after the caption
    expect(hud.enemyIntent.isSuspended).toBe(false);
  });

  it('is released by the first command menu if no opening plays', () => {
    const hud = mount();
    const s = { game: 'ffx2', combatants: {}, activeIds: [], reserveIds: [], enemyIds: [], flags: {}, log: [], result: null } as unknown as BattleState;
    const snap: AtbSnapshot = { elapsedMs: 0, bars: [] };
    hud.sync(s, snap);
    const row: AvailableCommand = { command: { kind: 'defend', targets: [] }, label: 'Defend', category: 'attack', mpCost: 0, enabled: true, validTargets: [] };
    void hud.chooseCommand('yuna', [row], () => snap);
    expect(hud.enemyIntent.isSuspended).toBe(false);
  });

  it('the pause screen still suspends and restores it after the opening', () => {
    const hud = mount();
    hud.setVisible(false);
    hud.setVisible(true);
    hud.setIntentSuspended(true);
    expect(hud.enemyIntent.isSuspended).toBe(true);
    hud.setIntentSuspended(false);
    expect(hud.enemyIntent.isSuspended).toBe(false);
  });

  it('a pause during the opening does not release the hold on resume', () => {
    const hud = mount();
    hud.setIntentSuspended(true);
    hud.setIntentSuspended(false);
    expect(hud.enemyIntent.isSuspended).toBe(true);
  });
});
