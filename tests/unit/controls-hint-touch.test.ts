// @vitest-environment jsdom
/**
 * PR-0073: on a touch screen the pre-battle scene's strip and Auron's briefing
 * name taps, not keys; each named tap works. A desktop keyboard player's strip
 * is unchanged (the approved C1 frame).
 *
 * Game case: both (the strip and the briefing are shared by every chapter of
 * both games).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ControlsHint, type ControlHintItem } from '../../src/ui/common/ControlsHint.ts';
import { CUTSCENE_HINTS } from '../../src/app/screens/CutsceneScreen.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

function coarse(on: boolean): void {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('pointer: coarse'), media: q, addEventListener() {}, removeEventListener() {} }));
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
const KEY_WORDS = /\b(Enter|Esc|Hold Enter|click|Space|Cross|Circle)\b/i;

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('the pre-battle scene strip on touch (PR-0073)', () => {
  it('names only taps from the first frame, and every chip it names is a button', () => {
    coarse(true);
    const h = strip(CUTSCENE_HINTS);
    expect(text(h)).not.toMatch(KEY_WORDS);
    expect(text(h)).toMatch(/Tap/);
    for (const chip of h.el.querySelectorAll<HTMLElement>('.chint__item')) {
      expect(chip.dataset['action'], chip.textContent ?? '').toBeTruthy();
    }
  });

  it('stays on taps when the input still reports its default keyboard, and follows a real key press', () => {
    coarse(true);
    const h = strip(CUTSCENE_HINTS);
    h.handleInput({ lastDevice: 'keyboard' } as Parameters<ControlsHint['handleInput']>[0]);
    expect(text(h)).not.toMatch(KEY_WORDS);
    window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'Enter' }));
    h.handleInput({ lastDevice: 'keyboard' } as Parameters<ControlsHint['handleInput']>[0]);
    expect(text(h)).toMatch(/Enter/);
  });

  it('a desktop keyboard strip is unchanged', () => {
    coarse(false);
    expect(text(strip(CUTSCENE_HINTS))).toBe('Enter advance·Hold Enter skip·Esc menu');
  });
});

describe('Auron\'s briefing on touch (PR-0073)', () => {
  it('carries a tap wording for each chip, swapped in by a coarse pointer and nothing else', () => {
    const src = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'coach', 'Briefing.ts'), 'utf8');
    const css = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'coach', 'coach.css'), 'utf8');
    expect(src).toMatch(/coach-brief__tap/);
    expect(src).toMatch(/coach-brief__key/);
    expect(css).toMatch(/@media \(pointer: coarse\)[^}]*\.coach-brief__key[^}]*display: none/);
  });
});
