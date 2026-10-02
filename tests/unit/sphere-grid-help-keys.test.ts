// @vitest-environment jsdom
/**
 * F6 / PR-0292 (FFX only: the Sphere Grid prep): AUTO-LEARN and `?` had no key or
 * pad route (Tab is WALK, A is Left). AUTO-LEARN is the `select` button (M / V,
 * the pad's Select); `?` is H or the `?` key, or the pad's X / Square (button 2).
 * No existing binding changes, and the open explainer stays modal. The explainer
 * says tap, not click, under a touch pointer (the swap is CSS; both are in the DOM).
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { Button, InputSnapshot } from '../../src/app/Input.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';
import { SphereGridHelp } from '../../src/ui/ffx/party-prep/sphereGridHelp.ts';
import { SphereGridModel } from '../../src/ui/ffx/party-prep/sphereGridModel.ts';
import { SphereGridView } from '../../src/ui/ffx/party-prep/SphereGridView.ts';
import { sphereGridMarkup } from '../../src/ui/ffx/party-prep/sphereGridSide.ts';
import { explainerHtml } from '../../src/ui/ffx/party-prep/sphereGridHelpCards.ts';

function input(...down: Button[]): InputSnapshot & { eaten: Set<Button> } {
  const eaten = new Set<Button>();
  return {
    eaten,
    pressed: (b) => down.includes(b),
    justPressed: (b) => down.includes(b) && !eaten.has(b),
    justReleased: () => false,
    consume: (b) => {
      if (!down.includes(b) || eaten.has(b)) return false;
      eaten.add(b);
      return true;
    },
    axis: { x: 0, y: 0 },
    actions: [],
    gamepadConnected: false,
    lastDevice: 'keyboard',
  };
}

function rig() {
  document.body.innerHTML = `<div class="prep"><div class="prep__stage"><div class="prep__panel">${sphereGridMarkup()}</div></div></div>`;
  const container = document.querySelector<HTMLElement>('.prep__panel')!;
  const model = new SphereGridModel(structuredClone(gagazetBuild));
  const view = new SphereGridView();
  view.show(model, 'tidus');
  return new SphereGridHelp({
    container,
    model: () => model,
    view: () => view,
    memberId: () => 'tidus',
    memberName: () => 'Tidus',
    refresh: () => undefined,
    say: () => undefined,
  });
}

const press = (code: string, key = ''): void => void window.dispatchEvent(new KeyboardEvent('keydown', { code, key }));

afterEach(() => {
  resetCoach();
  document.body.innerHTML = '';
});

describe('AUTO-LEARN and ? have a key route', () => {
  it('the select button (M, V, the pad Select) runs AUTO-LEARN and is taken from the shell', () => {
    const help = rig();
    const sel = input('select');
    expect(help.handleInput(sel)).toBe(true);
    expect(sel.eaten.has('select')).toBe(true);
    expect(help.pending).not.toBeNull();
    expect(document.querySelector('.sgx-layer--result')).not.toBeNull();
  });

  it('H and the ? key open the explainer, once per press', () => {
    for (const [code, key] of [['KeyH', 'h'], ['Slash', '?']] as const) {
      const help = rig();
      expect(help.handleInput(input())).toBe(false);
      press(code, key);
      expect(help.handleInput(input())).toBe(true);
      expect(document.querySelector('.sgx-layer--card')).not.toBeNull();
      help.press('got');
      expect(help.handleInput(input())).toBe(false); // the press was taken; nothing re-opens it
      help.destroy();
    }
  });

  it('a held key or a chord does not open it, and the open explainer takes no new route', () => {
    const help = rig();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', repeat: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', ctrlKey: true }));
    expect(help.handleInput(input())).toBe(false);
    help.openCard();
    const sel = input('select');
    help.handleInput(sel);
    expect(help.pending).toBeNull(); // modal: SELECT does nothing under the card
  });

  it('the desktop buttons carry their key, and the pad button name while a pad is connected', () => {
    const help = rig();
    const labels = (): string[] => [...document.querySelectorAll('.ffxprep-sg__key')].map((e) => e.textContent ?? '');
    expect(labels()).toEqual(['M', 'H']);
    (navigator as unknown as { getGamepads: () => unknown[] }).getGamepads = () => [{ connected: true, buttons: [] }];
    help.handleInput(input());
    expect(labels()).toEqual(['SELECT', 'X']);
    (navigator as unknown as { getGamepads: () => unknown[] }).getGamepads = () => [];
    help.handleInput(input());
    expect(labels()).toEqual(['M', 'H']);
  });
});

describe('the explainer under a touch pointer', () => {
  it('has tap wording next to the click wording, and no Enter or wheel in the touch half', () => {
    const html = explainerHtml('Tidus');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const touch = [...doc.querySelectorAll('.sgx-touch')].map((e) => e.textContent ?? '').join(' | ');
    const pointer = [...doc.querySelectorAll('.sgx-pointer')].map((e) => e.textContent ?? '').join(' | ');
    expect(touch).toMatch(/TAP TWICE|^TAP/);
    expect(touch).toContain('Tap a node to select it; tap it again');
    expect(touch).toContain('pinch to zoom');
    expect(touch).not.toMatch(/click|enter|wheel/i);
    expect(pointer).toContain('Click a node to select it; click it again, or press Enter');
    expect(pointer).toContain('wheel to zoom');
  });
});
