// @vitest-environment jsdom
/**
 * CHK-015 (`t1-b4a` finding): the scene strip told a mouse player "Hold click
 * skip", but `Input` reports only clicks, never a held button, so the hold did
 * nothing. The mouse strip now names only what `Input` reports: a click on the
 * advance chip and a click on the menu chip (where SKIP SCENE lives).
 *
 * Game case: both (the scene strip is shared by every chapter of both games).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ControlsHint, type ControlHintItem } from '../../src/ui/common/ControlsHint.ts';
import { CUTSCENE_HINTS } from '../../src/app/screens/CutsceneScreen.ts';

function fine(): void {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
  window.matchMedia = globalThis.matchMedia as typeof window.matchMedia;
}

function strip(items: ControlHintItem[]): ControlsHint {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hint = new ControlsHint({ root, items });
  hint.mount();
  return hint;
}

const text = (h: ControlsHint): string => (h.el.textContent ?? '').replace(/\s+/g, ' ').trim();
const mouse = { lastDevice: 'pointer' } as Parameters<ControlsHint['handleInput']>[0];

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('the scene strip for a mouse (CHK-015)', () => {
  it('names no hold, and every chip it names is a click target', () => {
    fine();
    const h = strip(CUTSCENE_HINTS);
    h.handleInput(mouse);
    expect(text(h)).not.toMatch(/hold/i);
    for (const chip of h.el.querySelectorAll<HTMLElement>('.chint__item')) {
      expect(chip.dataset['action'], chip.textContent ?? '').toBeTruthy();
    }
  });

  it('keyboard and pad strips still name the hold, which their inputs do report', () => {
    fine();
    const h = strip(CUTSCENE_HINTS);
    expect(text(h)).toBe('Enter advance·Hold Enter skip·Esc menu');
    h.handleInput({ lastDevice: 'gamepad' } as Parameters<ControlsHint['handleInput']>[0]);
    expect(text(h)).toMatch(/Hold Cross skip/);
  });

  it('an entry with `pointer: null` is left off for a mouse only', () => {
    fine();
    const h = strip([{ keyboard: 'K', gamepad: 'G', pointer: null, label: 'x' }]);
    expect(text(h)).toBe('K x');
    h.handleInput(mouse);
    expect(text(h)).toBe('');
  });
});
