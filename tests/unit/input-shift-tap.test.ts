// @vitest-environment jsdom
/**
 * Shift is the game's `triangle`, and the first half of Shift+Tab (review of 62ff4feca, lane ui-input, major M2).
 *
 * On the screens whose Tab is the browser's (title, chapter board, party prep) Shift+Tab is how a keyboard player walks BACK, so a Shift key-down must
 * not be a triangle there: on FFX prep it flipped the Sphere Grid's WALKS mode (the arrows then stopped moving the party and the tabs), and on a phone
 * with a keyboard it folded every prep section. The press is deferred to the Shift's release and latched only if the Shift was let go alone.
 * Everywhere else (the battle, the pause menu, an exclusive overlay) Shift is the triangle on key-down, exactly as it was.
 *
 * Game case: both (shared input plumbing; the FFX Sphere Grid is the one screen that read the press, the prep fold is both games).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Input } from '../../src/app/Input.ts';

let root: HTMLElement;
let input: Input;
let clock = 0;

function mount(screen: string): void {
  document.body.innerHTML = '';
  root = document.createElement('div');
  root.dataset['screen'] = screen;
  document.body.appendChild(root);
  input = new Input({ pointerRoot: root });
  input.attach();
  clock = 0;
}

beforeEach(() => mount('party-prep'));

afterEach(() => {
  input.detach();
  document.body.innerHTML = '';
});

function down(code: string, opts: { repeat?: boolean; shift?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, repeat: opts.repeat === true, shiftKey: opts.shift === true });
  window.dispatchEvent(event);
  return event;
}

function up(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
}

/** One frame as `App.step` runs it: update, read, endFrame. */
function frame<T>(read: (snap: ReturnType<Input['update']>) => T): T {
  clock += 50;
  const value = read(input.update(clock));
  input.endFrame();
  return value;
}

const triangle = (): boolean => frame((s) => s.justPressed('triangle'));

describe('a Shift on a screen whose Tab is the browser\'s', () => {
  it.each(['title', 'chapter-select', 'party-prep'])('%s: Shift down is no triangle, a lone tap is one on release', (screen) => {
    mount(screen);
    down('ShiftLeft', { shift: true });
    expect(triangle(), 'held back while it may become Shift+Tab').toBe(false);
    up('ShiftLeft');
    expect(triangle(), 'let go alone: the game\'s triangle').toBe(true);
    expect(triangle(), 'once').toBe(false);
  });

  it('Shift+Tab walks back and presses nothing: not the Shift, not the Tab', () => {
    down('ShiftLeft', { shift: true });
    const tab = down('Tab', { shift: true });
    expect(tab.defaultPrevented, 'Shift+Tab is the browser\'s').toBe(false);
    expect(triangle()).toBe(false);
    up('Tab');
    up('ShiftLeft');
    expect(triangle(), 'the Shift was part of a chord').toBe(false);
  });

  it('holds across frames: the triangle is the release, not the hold', () => {
    down('ShiftRight', { shift: true });
    expect(triangle()).toBe(false);
    expect(triangle()).toBe(false);
    up('ShiftRight');
    expect(triangle()).toBe(true);
  });

  it('auto-repeat of the same Shift does not turn it into a chord', () => {
    down('ShiftLeft', { shift: true });
    down('ShiftLeft', { shift: true, repeat: true });
    down('ShiftLeft', { shift: true, repeat: true });
    up('ShiftLeft');
    expect(triangle()).toBe(true);
  });

  it('Shift with an arrow or any other key is a chord, mapped or not', () => {
    down('ShiftLeft', { shift: true });
    down('ArrowRight', { shift: true });
    up('ArrowRight');
    up('ShiftLeft');
    expect(frame((s) => [s.justPressed('right'), s.justPressed('triangle')])).toEqual([true, false]);

    down('ShiftLeft', { shift: true });
    down('KeyG', { shift: true }); // G carries no abstract button: still a key pressed under Shift
    up('KeyG');
    up('ShiftLeft');
    expect(triangle()).toBe(false);
  });

  it('both Shift keys together are a chord; the next lone tap still works', () => {
    down('ShiftLeft', { shift: true });
    down('ShiftRight', { shift: true });
    up('ShiftRight');
    up('ShiftLeft');
    expect(triangle()).toBe(false);
    down('ShiftLeft', { shift: true });
    up('ShiftLeft');
    expect(triangle()).toBe(true);
  });

  it('Q and Tab-less keys are untouched: Q is still the triangle on key-down', () => {
    down('KeyQ');
    expect(triangle()).toBe(true);
    up('KeyQ');
  });

  it('a window that lost focus forgets the held Shift', () => {
    down('ShiftLeft', { shift: true });
    window.dispatchEvent(new Event('blur'));
    up('ShiftLeft');
    expect(triangle()).toBe(false);
  });

  it('an overlay that took the keyboard in between gets no triangle behind it', () => {
    down('ShiftLeft', { shift: true });
    const release = input.claimKeyboard(() => undefined, { exclusive: true });
    up('ShiftLeft');
    expect(triangle()).toBe(false);
    release();
    frame(() => undefined); // handing an exclusive claim back drops one frame of edges (`swallowFrames`)
    down('ShiftLeft', { shift: true });
    up('ShiftLeft');
    expect(triangle(), 'the record was cleared by the first release').toBe(true);
  });

  it('a text field keeps its own Shift (capitals): the game latches nothing', () => {
    const field = document.createElement('input');
    field.type = 'text';
    root.appendChild(field);
    field.focus();
    down('ShiftLeft', { shift: true });
    up('ShiftLeft');
    expect(triangle()).toBe(false);
  });
});

describe('a Shift anywhere else is the triangle on key-down, as it was', () => {
  it.each(['battle', 'pause', 'results', 'cutscene'])('%s', (screen) => {
    mount(screen);
    down('ShiftLeft', { shift: true });
    expect(triangle()).toBe(true);
    up('ShiftLeft');
    down('ShiftRight', { shift: true });
    expect(triangle()).toBe(true);
    up('ShiftRight');
  });

  it('a root that says Tab is the browser\'s (data-tab-owner) defers too; one that says game does not', () => {
    root.dataset['screen'] = 'battle';
    root.dataset['tabOwner'] = 'browser';
    down('ShiftLeft', { shift: true });
    expect(triangle()).toBe(false);
    up('ShiftLeft');
    expect(triangle()).toBe(true);
    root.dataset['screen'] = 'party-prep';
    root.dataset['tabOwner'] = 'game';
    down('ShiftLeft', { shift: true });
    expect(triangle()).toBe(true);
    up('ShiftLeft');
  });
});
