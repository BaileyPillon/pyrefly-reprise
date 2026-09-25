// @vitest-environment jsdom
/**
 * The FFX-2 enemy-move slab lets go of an enemy the moment it is KO'd.
 *
 * Before: the slab re-read the engine only at the `sync` that closes a burst, so
 * a mid-battle seam triggered by a KO (Chapter XIII's link seam, on Paragon's
 * KO) played its whole 26 s under "PARAGON / Attack / ACTS NEXT" with a damage
 * forecast, while Paragon broke into pyreflies and Trema spoke. Now the HUD's
 * `ko` event re-reads the engine when the KO'd enemy is the one the slab names;
 * the engine never names a dead enemy, so the slab clears as the seam starts.
 *
 * **Game case: FFX-2 only** (the FFX-2 HUD; the FFX HUD's CTB slab is not
 * touched).
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

function view(enemyId: string): IntentView {
  return {
    enemyId,
    enemyName: enemyId.toUpperCase(),
    turnsAway: 0,
    actsNext: true,
    kind: 'action',
    moveName: 'Attack',
    abilityId: 'attack',
    description: 'Physical damage to one girl.',
    elements: ['none'],
    statusText: [],
    confidence: 'scripted',
    branches: [],
    charge: null,
    counters: [],
    formNote: null,
    notes: [],
    cite: 'ffx2-trema §4.1',
  } as unknown as IntentView;
}

const live: FFX2BattleHud[] = [];
afterEach(() => {
  for (const h of live.splice(0)) h.unmount();
  document.body.innerHTML = '';
});

function mount(): { hud: FFX2BattleHud; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFX2BattleHud();
  hud.mount(root);
  live.push(hud);
  return { hud, root };
}

const ko = (targetId: string): BattleEvent => ({ type: 'ko', seq: 1, targetId }) as unknown as BattleEvent;

describe("the FFX-2 enemy-move slab clears on its enemy's KO (FFX-2 only)", () => {
  it("a KO of the enemy it names re-reads the engine, and a dead enemy's move is gone", () => {
    const { hud, root } = mount();
    let paragonAlive = true;
    hud.setIntentSource(() => (paragonAlive ? view('paragon') : null));
    const slab = root.querySelector<HTMLElement>('[data-role="enemy-intent"]')!;
    expect(slab.hidden).toBe(false);
    expect(hud.enemyIntent.view()?.enemyId).toBe('paragon');

    paragonAlive = false; // the engine's end-of-burst state: Paragon KO'd, link 1 won
    void hud.onEvent(ko('paragon'));
    expect(hud.enemyIntent.view()).toBeNull();
    expect(slab.hidden).toBe(true);
  });

  it("a KO of anyone else leaves the slab alone (no re-read)", () => {
    const { hud } = mount();
    let reads = 0;
    hud.setIntentSource(() => {
      reads += 1;
      return view('paragon');
    });
    const before = reads;
    void hud.onEvent(ko('rikku'));
    expect(reads).toBe(before);
    expect(hud.enemyIntent.view()?.enemyId).toBe('paragon');
  });
});
