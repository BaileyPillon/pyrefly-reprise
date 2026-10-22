// @vitest-environment jsdom
/**
 * Release 62, decision 173d (Bailey, 2026-10-22 ~00:00 EDT; both games, demo mode only; Chapter I is FFX, Chapter IV is FFX-2): a 3-line controls card under the two picker cards,
 * with pad / keyboard glyphs that follow the device last touched.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { DemoBoardScreen } from '../../src/app/demo/demoBoard.ts';
import { CONTROLS_TEXT, controlsCardHtml, mountControlsCard } from '../../src/app/demo/demoControls.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { noteInputDevice, resetInputDeviceForTests } from '../../src/app/inputDevice.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';

const css = readFileSync('src/app/demo/demo.css', 'utf8');

beforeEach(() => {
  document.body.innerHTML = '';
  forgetBoardChapter();
  resetInputDeviceForTests();
});
afterEach(() => {
  setDemoMode(null);
  resetInputDeviceForTests();
});

describe('173d: the controls card', () => {
  it('is three lines: two rows of keys and the one line a first-timer needs', () => {
    const el = mountControlsCard(document.body);
    expect(el.children).toHaveLength(3);
    expect(el.querySelectorAll('.demo-controls__row')).toHaveLength(2);
    expect(el.querySelector('.demo-controls__tip')!.textContent).toBe('Follow the NEXT tip to win');
    expect(CONTROLS_TEXT.tip).toBe('Follow the NEXT tip to win');
  });

  it('every key is written once with the pad\'s button beside it: the d-pad, A, B and Y on a pad; the arrows, Enter, Esc and T on a keyboard', () => {
    const el = mountControlsCard(document.body);
    const keys = [...el.querySelectorAll('.kh-k')].map((k) => k.textContent);
    expect(keys).toEqual(['◀ ▶', 'Enter', 'Esc', 'T']);
    const pads = [...el.querySelectorAll('.kh-p .pg')].map((g) => g.getAttribute('data-pg'));
    expect(pads).toEqual(['dpad', 'cross', 'circle', 'triangle']);
    // the xbox faces are the A / B / Y of Bailey's words (the labels travel in the element, one family shown by html[data-pad])
    const faces = [...el.querySelectorAll('.kh-p .pg')].map((g) => g.getAttribute('data-x'));
    expect(faces).toEqual([null, 'A', 'B', 'Y']); // the d-pad is a drawing, not a lettered face
  });

  it('the words say what each button does here: choose, fight, back to the title, swap its art (Y swaps the title\'s art; the picker has none to swap)', () => {
    const text = controlsCardHtml();
    expect(text).toContain('choose');
    expect(text).toContain('fight');
    expect(text).toContain('back to the title');
    expect(text).toContain('swap its art');
  });

  it('it takes no input (pointer-events none in demo.css) and replaces the strip under the cards, which demo.css hides', () => {
    expect(css).toMatch(/\.demo-controls \{[^}]*pointer-events: none/);
    expect(css).toMatch(/\.fe-cselect--demo \.chint \{\s*display: none;/);
  });

  it('the picker mounts it in the board\'s own scroll frame (the rail\'s containing block), in demo mode', () => {
    setDemoMode(true);
    const screen = new DemoBoardScreen();
    const root = document.createElement('div');
    document.body.appendChild(root);
    screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), uiRoot: document.body } as unknown as App;
    screen.root = root;
    screen.enter();
    const card = root.querySelector('.demo-controls');
    expect(card).not.toBeNull();
    expect(card!.parentElement!.classList.contains('fe-cselect__scroll')).toBe(true);
    expect(root.classList.contains('fe-cselect--demo')).toBe(true);
    // the QR plate and the picker's own two cards are still there
    expect(root.querySelector('[data-role="demo-qr"]')).not.toBeNull();
    expect(root.querySelectorAll('.fe-card')).toHaveLength(2);
    screen.exit();
  });

  it('the glyphs follow the device: html[data-input] is what the stylesheet reads (a pad shows the buttons, a key press shows the keys)', () => {
    mountControlsCard(document.body);
    noteInputDevice('gamepad', 'Xbox Wireless Controller');
    expect(document.documentElement.dataset['input']).toBe('gamepad');
    noteInputDevice('keyboard');
    expect(document.documentElement.dataset['input']).toBe('keyboard');
  });
});
