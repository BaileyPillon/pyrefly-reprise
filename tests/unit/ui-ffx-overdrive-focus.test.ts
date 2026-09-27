// @vitest-environment jsdom
/**
 * PR-0128 (FFX only): while an Overdrive overlay is open the strategy-guide
 * card steps aside, so it no longer covers the "Tidus · OVERDRIVE" plate above
 * the Swordplay slab (the approved "Swordplay Overdrive" tile,
 * docs/screenshots/mockups/A-swordplay-overlay.jpg). It comes back when the
 * overlay closes, however the overlay ends.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX_HUD_OVERDRIVE_OPEN } from '../../src/ui/ffx/overdriveFocus.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

afterEach(() => {
  document.body.innerHTML = '';
});

function mountHud(): { hud: FFXBattleHud; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  return { hud, root };
}

const hudEl = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('[data-role="ffx-battle-hud"]')!;

describe('the guide card steps aside while an Overdrive overlay is open (PR-0128)', () => {
  it('marks the HUD while the Swordplay overlay is up, and clears it when the overlay settles', async () => {
    const { hud, root } = mountHud();
    expect(hudEl(root).classList.contains(FFX_HUD_OVERDRIVE_OPEN)).toBe(false);
    const pending = hud.openMinigame('tidus-timing', { timerMs: 60 });
    expect(root.querySelector('.ffx-mg'), 'the overlay is open').not.toBeNull();
    expect(hudEl(root).classList.contains(FFX_HUD_OVERDRIVE_OPEN)).toBe(true);
    await pending;
    expect(hudEl(root).classList.contains(FFX_HUD_OVERDRIVE_OPEN)).toBe(false);
    hud.unmount();
  });

  it('clears the mark even when the overlay rejects', async () => {
    const { hud, root } = mountHud();
    await expect(hud.openMinigame('gunner-trigger', {})).rejects.toThrow();
    expect(hudEl(root).classList.contains(FFX_HUD_OVERDRIVE_OPEN)).toBe(false);
    hud.unmount();
  });

  it('ffx-hud.css hides the guide card under the mark', () => {
    const css = readFileSync(join(HERE, '../../src/ui/ffx/ffx-hud.css'), 'utf8').replace(/\s+/g, ' ');
    expect(css).toContain(`.ffxhud.${FFX_HUD_OVERDRIVE_OPEN} .sgd { visibility: hidden; }`);
  });
});
