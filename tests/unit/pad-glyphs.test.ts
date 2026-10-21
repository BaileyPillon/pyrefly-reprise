// @vitest-environment jsdom
/**
 * Release 61, the conference demo (decision 169); both games, presentation plumbing.
 *
 * Every key hint has a pad twin, shown when the last thing the player pressed was a pad button. `inputDevice.ts` is the one fact ("which device did the
 * player use last") the page reads, as `html[data-input]` and `html[data-pad]`; `padGlyphs.ts` writes hints that carry both halves. The stylesheet shows one
 * by those attributes, so a chip switches on the press with nothing re-rendered. jsdom does not load the stylesheet, so these tests pin the markup and the store.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Input } from '../../src/app/Input.ts';
import {
  inputDevice,
  installInputDevice,
  noteInputDevice,
  onInputDevice,
  padActive,
  padFamily,
  resetInputDeviceForTests,
} from '../../src/app/inputDevice.ts';
import { glyphize, keyHint, keyHintLabel, padGlyph, padLabel } from '../../src/ui/common/padGlyphs.ts';
import { ControlsHint } from '../../src/ui/common/ControlsHint.ts';

const XBOX = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';
const DUALSENSE = 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)';

beforeEach(() => {
  resetInputDeviceForTests();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the device store', () => {
  it('starts on the keyboard with Xbox names, and publishes both on <html>', () => {
    expect(inputDevice()).toBe('keyboard');
    expect(padActive()).toBe(false);
    expect(padFamily()).toBe('xbox');
    expect(document.documentElement.dataset['input']).toBe('keyboard');
    expect(document.documentElement.dataset['pad']).toBe('xbox');
  });

  it('a pad press flips the page to the pad and learns the family from the pad\'s id', () => {
    noteInputDevice('gamepad', DUALSENSE);
    expect(padActive()).toBe(true);
    expect(padFamily()).toBe('playstation');
    expect(document.documentElement.dataset['input']).toBe('gamepad');
    expect(document.documentElement.dataset['pad']).toBe('playstation');
    noteInputDevice('keyboard');
    expect(padActive()).toBe(false);
    expect(document.documentElement.dataset['input']).toBe('keyboard');
    expect(padFamily(), 'the family is the pad\'s, it does not reset when the keyboard is used').toBe('playstation');
  });

  it('notifies listeners only when something changed', () => {
    const seen: string[] = [];
    const off = onInputDevice((d, f) => seen.push(`${d}/${f}`));
    noteInputDevice('keyboard'); // no change
    noteInputDevice('gamepad', XBOX);
    noteInputDevice('gamepad', XBOX); // no change
    noteInputDevice('pointer');
    off();
    noteInputDevice('keyboard');
    expect(seen).toEqual(['gamepad/xbox', 'pointer/xbox']);
  });

  it('a booth (assumePad) starts on the pad, and a key puts it right', () => {
    installInputDevice({ assumePad: true });
    expect(padActive()).toBe(true);
    expect(document.documentElement.dataset['input']).toBe('gamepad');
    noteInputDevice('keyboard');
    expect(padActive()).toBe(false);
  });

  it('a pointerdown is the pointer, not the pad', () => {
    installInputDevice({ assumePad: true });
    window.dispatchEvent(new Event('pointerdown'));
    expect(inputDevice()).toBe('pointer');
    expect(padActive()).toBe(false);
  });

  it('a pad that is only plugged in (gamepadconnected) teaches its family but is not a press', () => {
    installInputDevice();
    const e = new Event('gamepadconnected') as Event & { gamepad: { id: string } };
    e.gamepad = { id: DUALSENSE };
    window.dispatchEvent(e);
    expect(inputDevice()).toBe('keyboard');
    expect(padFamily()).toBe('playstation');
  });
});

describe('Input writes the store', () => {
  function pad(buttons: number[], axes: [number, number] = [0, 0], id = XBOX): void {
    const list = Array.from({ length: 17 }, (_, i) => ({ pressed: buttons.includes(i), touched: false, value: buttons.includes(i) ? 1 : 0 }));
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      writable: true,
      value: () => [{ id, index: 0, connected: true, mapping: 'standard', axes: [axes[0], axes[1], 0, 0], buttons: list, timestamp: 0 }],
    });
  }

  it('a button the abstract map does not know (X, 2) still means "the player is on the pad"', () => {
    const input = new Input({ pointerRoot: document.body, keyboardTarget: window });
    pad([2]);
    input.update(0);
    expect(inputDevice()).toBe('gamepad');
    expect(input.lastDevice).toBe('gamepad');
  });

  it('a trigger (7) and a stick push count, and the pad\'s id names the family', () => {
    const input = new Input({ pointerRoot: document.body, keyboardTarget: window });
    pad([7], [0, 0], DUALSENSE);
    input.update(0);
    expect(padFamily()).toBe('playstation');
    noteInputDevice('keyboard');
    pad([], [0.9, 0], DUALSENSE);
    input.update(16);
    expect(inputDevice()).toBe('gamepad');
  });

  it('any trusted key (G has no abstract button) puts the hints back on the keyboard; a synthetic tap, a chord or a bare modifier does not', () => {
    const handlers = new Map<string, (e: unknown) => void>();
    const target = { addEventListener: (t: string, h: (e: unknown) => void) => void handlers.set(t, h), removeEventListener: () => undefined } as unknown as EventTarget;
    const input = new Input({ pointerRoot: document.body, keyboardTarget: target });
    input.attach();
    noteInputDevice('gamepad', XBOX);
    const fire = (code: string, extra: Record<string, unknown> = {}): void => handlers.get('keydown')!({ code, repeat: false, preventDefault() {}, ...extra });
    fire('ShiftLeft', { isTrusted: true });
    expect(inputDevice(), 'a lone Shift is not a choice of device').toBe('gamepad');
    fire('KeyG', { isTrusted: false });
    expect(inputDevice(), "the phone HUD's synthetic key is a tap").toBe('gamepad');
    fire('KeyG', { isTrusted: true, ctrlKey: true });
    expect(inputDevice(), 'a browser chord').toBe('gamepad');
    fire('KeyG', { isTrusted: true });
    expect(inputDevice()).toBe('keyboard');
    expect(input.lastDevice).toBe('keyboard');
    input.detach();
  });

  it('the shared stick feel: a diagonal push is one direction through Input', () => {
    const input = new Input({ pointerRoot: document.body, keyboardTarget: window });
    pad([], [0.8, 0.7]);
    const snap = input.update(0);
    expect(snap.pressed('right')).toBe(true);
    expect(snap.pressed('down')).toBe(false);
  });

  it('the stick at the edge of the dead zone does not flicker into extra presses', () => {
    const input = new Input({ pointerRoot: document.body, keyboardTarget: window });
    let edges = 0;
    let t = 0;
    for (const x of [0.7, 0.45, 0.6, 0.38, 0.55, 0.33, 0.7]) {
      pad([], [x, 0]);
      if (input.update(t).justPressed('right')) edges++;
      input.endFrame();
      t += 16;
    }
    expect(edges).toBe(1);
  });
});

describe('every family of pad reads the same buttons (the standard mapping), and names them its own way', () => {
  const PADS: Array<[string, string]> = [
    ['Xbox', XBOX],
    ['DualSense (PlayStation)', DUALSENSE],
    ['Pro Controller (Switch)', 'Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)'],
  ];
  const WANT: Array<[number, string]> = [
    [0, 'confirm'],
    [1, 'cancel'],
    [3, 'triangle'],
    [4, 'l1'],
    [5, 'r1'],
    [8, 'select'],
    [9, 'start'],
    [12, 'up'],
    [13, 'down'],
    [14, 'left'],
    [15, 'right'],
  ];
  function press(id: string, index: number): void {
    const list = Array.from({ length: 17 }, (_, i) => ({ pressed: i === index, touched: false, value: i === index ? 1 : 0 }));
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      writable: true,
      value: () => [{ id, index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: list, timestamp: 0 }],
    });
  }
  it.each(PADS)('%s: the eleven abstract buttons, each from its standard index', (_name, id) => {
    for (const [index, button] of WANT) {
      const input = new Input({ pointerRoot: document.body, keyboardTarget: window });
      press(id, index);
      const snap = input.update(0);
      expect(snap.justPressed(button as never), `index ${index} is ${button}`).toBe(true);
    }
  });
  it('and the glyphs it draws follow the family: the same bottom face button is A, the cross or B', () => {
    noteInputDevice('gamepad', XBOX);
    expect(padLabel('cross')).toBe('A');
    noteInputDevice('gamepad', DUALSENSE);
    expect(padLabel('cross')).toBe('✕');
    noteInputDevice('gamepad', 'Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)');
    expect(padLabel('cross')).toBe('B');
  });
});

describe('glyphs', () => {
  it('a glyph carries the three families\' labels and its name', () => {
    const html = padGlyph('cross');
    expect(html).toContain('data-pg="cross"');
    expect(html).toContain('data-x="A"');
    expect(html).toContain('data-p="✕"');
    expect(html).toContain('data-n="B"');
    expect(html).toContain('aria-label="A"');
  });

  it('the drawn ones (d-pad, Start, Back) are SVG, and the sticks say L / R', () => {
    expect(padGlyph('dpad')).toContain('<svg');
    expect(padGlyph('start')).toContain('<svg');
    expect(padGlyph('select')).toContain('<svg');
    expect(padGlyph('rstick')).toContain('data-x="R"');
    expect(padGlyph('dpad')).not.toContain('data-x');
  });

  it('glyphize swaps the build\'s button words for glyphs and keeps the rest as text', () => {
    const html = glyphize('Hold Cross');
    expect(html).toContain('Hold');
    expect(html).toContain('data-pg="cross"');
    expect(glyphize('R-Stick')).toContain('data-pg="rstick"');
    expect(glyphize('D-pad')).toContain('data-pg="dpad"');
    expect(glyphize('Circle twice')).toMatch(/data-pg="circle".*twice/);
    expect(glyphize('<script>')).toBe('&lt;script&gt;');
  });

  it('keyHint writes both halves of a chip, key first, and the pad half carries the glyph', () => {
    const html = keyHint('G', 'Square');
    expect(html).toBe(`<span class="kh-k">G</span><span class="kh-p">${padGlyph('square')}</span>`);
    const b = document.createElement('b');
    b.innerHTML = html;
    expect(b.textContent, 'the pad half has no text, so the chip reads as its key').toBe('G');
    expect(b.querySelector('.kh-p .pg')?.getAttribute('data-pg')).toBe('square');
  });

  it('escapes the key', () => {
    expect(keyHint('<', 'Cross')).toContain('&lt;');
  });

  it('names a chip for a screen reader with both the key and the button', () => {
    expect(keyHintLabel('G', 'Square')).toBe('G or X');
    noteInputDevice('gamepad', DUALSENSE);
    expect(keyHintLabel('G', 'Square')).toBe('G or Square');
    expect(keyHintLabel('Esc', 'nonsense')).toBe('Esc');
  });

  it('padLabel is the text a sentence prints for the pad in use', () => {
    expect(padLabel('cross')).toBe('A');
    noteInputDevice('gamepad', DUALSENSE);
    expect(padLabel('cross')).toBe('✕');
    expect(padLabel('l2')).toBe('L2');
  });
});

describe('ControlsHint draws the pad\'s buttons', () => {
  it('a pad player sees glyphs (named by the pad), a keyboard player sees the keys', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hint = new ControlsHint({
      root,
      items: [
        { label: 'select', keyboard: 'Enter', gamepad: 'Cross' },
        { label: 'back', keyboard: 'Esc', gamepad: 'Circle' },
        { label: 'scroll', keyboard: '[ ]', gamepad: 'R-Stick' },
      ],
    });
    hint.mount();
    expect(hint.el.textContent).toContain('Enter');
    expect(hint.el.querySelectorAll('.pg').length).toBe(0);
    hint.handleInput({ lastDevice: 'gamepad' } as Parameters<ControlsHint['handleInput']>[0]);
    expect([...hint.el.querySelectorAll('.pg')].map((e) => (e as HTMLElement).dataset['pg'])).toEqual(['cross', 'circle', 'rstick']);
    expect(hint.el.textContent).not.toContain('Enter');
    hint.handleInput({ lastDevice: 'keyboard' } as Parameters<ControlsHint['handleInput']>[0]);
    expect(hint.el.textContent).toContain('Esc');
    hint.unmount();
  });

  it('starts on the pad\'s words when the page does (a booth)', () => {
    installInputDevice({ assumePad: true });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hint = new ControlsHint({ root, items: [{ label: 'begin', keyboard: 'Enter', gamepad: 'Cross' }] });
    expect(hint.el.querySelector('.pg[data-pg="cross"]')).not.toBeNull();
  });
});
