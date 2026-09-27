// @vitest-environment jsdom
/**
 * PR-0146, FFX half: no FFX HUD panel before the boss caption.
 *
 * Chapter I, 1600x900, real keys (iter2-b5 probe): the enemy-intent chip
 * (`.eint__toggle`) showed at 5.2 s, over the opening sweep, while the boss
 * caption came at 8.3 s and every other panel at 11.2 s. The HUD is mounted and
 * synced before the presenter plays the opening, exactly as FFX-2's was.
 *
 * The fix reuses FFX-2's `IntentOpeningHold`: the slab and its chip are held
 * (the pause screen's own suspension) until the battle-start moment hands the
 * HUD back, or the first command menu opens, whichever comes first.
 *
 * **Game case: FFX only** (the FFX HUD; FFX-2's half shipped in t1).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

const live: FFXBattleHud[] = [];
afterEach(() => {
  for (const h of live.splice(0)) h.unmount();
  document.body.innerHTML = '';
});

function mount(): FFXBattleHud {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  live.push(hud);
  return hud;
}

describe('FFX intent slab holds through the opening (PR-0146)', () => {
  it('is held from mount until the battle-start moment hands the HUD back', () => {
    const hud = mount();
    expect(hud.enemyIntent.isSuspended).toBe(true);
    hud.setVisible(false); // the moment takes the HUD down
    expect(hud.enemyIntent.isSuspended).toBe(true);
    hud.setVisible(true); // ...and hands it back after the caption
    expect(hud.enemyIntent.isSuspended).toBe(false);
  });

  it('a visible(true) with no take-down first does not release it', () => {
    const hud = mount();
    hud.setVisible(true);
    expect(hud.enemyIntent.isSuspended).toBe(true);
  });

  it('is released by the first command menu if no opening plays', () => {
    const hud = mount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    expect(hud.enemyIntent.isSuspended).toBe(false);
  });

  it('the pause screen still suspends it after the release, and gives it back', () => {
    const hud = mount();
    hud.setVisible(false);
    hud.setVisible(true);
    hud.setIntentSuspended(true);
    expect(hud.enemyIntent.isSuspended).toBe(true);
    hud.setIntentSuspended(false);
    expect(hud.enemyIntent.isSuspended).toBe(false);
  });

  it('a pause during the opening cannot release it early', () => {
    const hud = mount();
    hud.setIntentSuspended(true);
    hud.setIntentSuspended(false);
    expect(hud.enemyIntent.isSuspended).toBe(true);
  });
});
