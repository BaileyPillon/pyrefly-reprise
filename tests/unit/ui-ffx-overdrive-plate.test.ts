// @vitest-environment jsdom
/**
 * PR-0128 (FFX only): the approved "Swordplay Overdrive" tile
 * (docs/screenshots/mockups/A-swordplay-overlay.jpg) puts the actor's plate,
 * "Tidus · OVERDRIVE", above the slab. `docs/target/targets.json` says the
 * other Overdrive overlays follow the Swordplay pattern, so every FFX overlay
 * the HUD opens gets the plate.
 *
 * The round-13 check found no plate at all under real keys: the engine emits
 * `minigame-request` before any `message`, and `chooseCommand` had already
 * hidden the banner, so the field showed the slab alone. These tests drive the
 * HUD the way the presenter does (`notifyHud(minigame-request)`, then
 * `openMinigame`) and never call a message path by hand.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function mountHud(): { hud: FFXBattleHud; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  return { hud, root };
}

function request(who: string, kind: 'tidus-timing' | 'gunner-trigger'): BattleEvent {
  return { type: 'minigame-request', seq: 1, who, kind, params: {} } as unknown as BattleEvent;
}

const banner = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('.ig-banner')!;
const text = (root: HTMLElement, role: string): string =>
  banner(root).querySelector<HTMLElement>(`[data-role="${role}"]`)!.textContent ?? '';

describe('the actor plate above an Overdrive slab (PR-0128)', () => {
  it('shows "Tidus · Overdrive" while the Swordplay overlay is open, from the request alone', async () => {
    const { hud, root } = mountHud();
    expect(banner(root).hidden, 'no plate before the request').toBe(true);
    hud.onEvent(request('tidus', 'tidus-timing'));
    const pending = hud.openMinigame('tidus-timing', { timerMs: 60 });
    expect(root.querySelector('.ffx-mg'), 'the overlay is open').not.toBeNull();
    expect(banner(root).hidden).toBe(false);
    expect(text(root, 'name')).toBe('Tidus');
    expect(text(root, 'chip')).toBe('Overdrive');
    await pending;
    expect(banner(root).hidden, 'the plate goes with the overlay').toBe(true);
    hud.unmount();
  });

  it('takes the plate down when the overlay rejects', async () => {
    const { hud, root } = mountHud();
    hud.onEvent(request('tidus', 'gunner-trigger'));
    await expect(hud.openMinigame('gunner-trigger', {})).rejects.toThrow();
    expect(banner(root).hidden).toBe(true);
    hud.unmount();
  });

  it('leaves a message that replaced the plate on the field', async () => {
    const { hud, root } = mountHud();
    hud.onEvent(request('tidus', 'tidus-timing'));
    const pending = hud.openMinigame('tidus-timing', { timerMs: 60 });
    hud.onEvent({ type: 'message', seq: 2, text: 'Tidus uses Spiral Cut' } as unknown as BattleEvent);
    await pending;
    expect(banner(root).hidden).toBe(false);
    expect(text(root, 'chip')).toContain('Spiral Cut');
    hud.unmount();
  });

  // RCHK-B2A-01: on an upright phone (`html[data-phone-battle='ffx']`) the
  // plate lands under the rail and overlaps the Overdrive slab. Under that
  // layout the plate stays off, matching main's behaviour (the banner stayed
  // hidden while an overlay was open, on every size, before a8bb6434).
  // Desktop and landscape phone (no `data-phone-battle` attribute) keep it.
  describe('the upright phone battle layout (RCHK-B2A-01)', () => {
    afterEach(() => {
      delete document.documentElement.dataset['phoneBattle'];
    });

    it('does not show the plate while data-phone-battle="ffx" is set', async () => {
      const { hud, root } = mountHud();
      document.documentElement.dataset['phoneBattle'] = 'ffx';
      hud.onEvent(request('tidus', 'tidus-timing'));
      const pending = hud.openMinigame('tidus-timing', { timerMs: 60 });
      expect(root.querySelector('.ffx-mg'), 'the overlay is open').not.toBeNull();
      expect(banner(root).hidden, 'no plate under the phone battle layout').toBe(true);
      await pending;
      expect(banner(root).hidden).toBe(true);
      hud.unmount();
    });

    it('still shows the plate when data-phone-battle is not set (desktop and landscape phone)', async () => {
      const { hud, root } = mountHud();
      hud.onEvent(request('tidus', 'tidus-timing'));
      const pending = hud.openMinigame('tidus-timing', { timerMs: 60 });
      expect(banner(root).hidden).toBe(false);
      expect(text(root, 'name')).toBe('Tidus');
      await pending;
      hud.unmount();
    });
  });
});
