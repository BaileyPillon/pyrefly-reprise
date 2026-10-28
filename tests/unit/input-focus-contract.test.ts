// @vitest-environment jsdom
/**
 * The input and focus contract (release 68, lane ui-input; `src/app/focusContract.ts`, docs/handoff/ui-input-contract.md).
 *
 * Who owns a key press when a control has focus: a text field owns everything; the browser owns Tab on the screens that
 * give it up; a Tab-focused control owns Enter and Space (and the game's Confirm is not also pressed); the game owns the
 * rest, exactly as before. Every case runs the real `Input` against a real DOM, with the events a browser sends.
 *
 * Game case: both (shared UI plumbing; nothing here knows which game is on screen).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Input } from '../../src/app/Input.ts';
import { isActivator, isCursor, isNativeActivator, isTextEntry, tabOwnerOf } from '../../src/app/focusContract.ts';

let root: HTMLElement;
let input: Input;
let clock = 0;

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  root.dataset['screen'] = 'chapter-select';
  document.body.appendChild(root);
  input = new Input({ pointerRoot: root });
  input.attach();
  clock = 0;
});

afterEach(() => {
  input.detach();
  document.body.innerHTML = '';
});

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, parent: HTMLElement = root): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent.appendChild(e);
  return e;
}

interface Press {
  event: KeyboardEvent;
  prevented: boolean;
}

/** One real key press on the window, as the browser would send it, then one frame of the game. */
function press(code: string, opts: { repeat?: boolean; shift?: boolean } = {}): Press {
  const event = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, repeat: opts.repeat === true, shiftKey: opts.shift === true });
  window.dispatchEvent(event);
  return { event, prevented: event.defaultPrevented };
}

function frame(): ReturnType<Input['update']> {
  clock += 50;
  return input.update(clock);
}

/** The snapshot of the next frame, read before `endFrame` as `App.step` does. */
function read<T>(f: (snap: ReturnType<Input['update']>) => T): T {
  const value = f(frame());
  input.endFrame();
  return value;
}

function release(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
}

/** Tab walked to `target`: the keydown comes first, the focus move after it, as in a browser. */
function tabTo(target: HTMLElement, shift = false): void {
  press('Tab', { shift });
  target.focus();
  release('Tab');
}

/** A mouse click focuses the control: the pointer event first, the focus move after it. */
function clickFocus(target: HTMLElement): void {
  window.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  target.focus();
}

describe('the predicates', () => {
  it('tells a text field from a control', () => {
    expect(isTextEntry(el('input', { type: 'text' }))).toBe(true);
    expect(isTextEntry(el('input'))).toBe(true);
    expect(isTextEntry(el('textarea'))).toBe(true);
    expect(isTextEntry(el('select'))).toBe(true);
    expect(isTextEntry(el('div', { contenteditable: 'true' }))).toBe(true);
    expect(isTextEntry(el('div', { contenteditable: 'false' }))).toBe(false);
    expect(isTextEntry(el('input', { type: 'checkbox' }))).toBe(false);
    expect(isTextEntry(el('button'))).toBe(false);
    expect(isTextEntry(null)).toBe(false);
  });

  it('knows an activator: native, or a role that says so; never a disabled one', () => {
    expect(isActivator(el('button'))).toBe(true);
    expect(isNativeActivator(el('button', { role: 'tab' }))).toBe(true);
    expect(isActivator(el('a', { href: '#x' }))).toBe(true);
    expect(isActivator(el('a'))).toBe(false);
    expect(isActivator(el('div', { role: 'button', tabindex: '0' }))).toBe(true);
    expect(isNativeActivator(el('div', { role: 'button', tabindex: '0' }))).toBe(false);
    for (const role of ['tab', 'switch', 'checkbox', 'radio', 'menuitem', 'option', 'link']) expect(isActivator(el('div', { role }))).toBe(true);
    expect(isActivator(el('div', { tabindex: '0' }))).toBe(false);
    expect(isActivator(el('canvas', { tabindex: '0', role: 'application' }))).toBe(false);
    expect(isActivator(el('button', { disabled: '' }))).toBe(false);
    expect(isActivator(el('div', { role: 'button', 'aria-disabled': 'true' }))).toBe(false);
    expect(isActivator(null)).toBe(false);
    expect(isCursor(el('div', { 'data-cursor': '' }))).toBe(true);
    expect(isCursor(el('div'))).toBe(false);
  });

  it('gives Tab to the browser only on the screens that say so', () => {
    const screen = (name: string, extra: Record<string, string> = {}): Element => {
      const d = document.createElement('div');
      d.dataset['screen'] = name;
      for (const [k, v] of Object.entries(extra)) d.setAttribute(k, v);
      return d;
    };
    for (const name of ['title', 'chapter-select', 'party-prep']) expect(tabOwnerOf(screen(name)), name).toBe('browser');
    for (const name of ['pause', 'battle', 'results', 'cutscene']) expect(tabOwnerOf(screen(name)), name).toBe('game');
    expect(tabOwnerOf(screen('pause', { 'data-tab-owner': 'browser' }))).toBe('browser');
    expect(tabOwnerOf(screen('title', { 'data-tab-owner': 'game' }))).toBe('game');
    expect(tabOwnerOf(null)).toBe('game');
  });
});

describe('every game key still works with nothing focused', () => {
  it('Enter, Space and Z are Confirm; the arrows move; Space and the arrows are kept from scrolling', () => {
    const enter = press('Enter');
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
    release('Enter');
    const space = press('Space');
    expect(space.prevented).toBe(true);
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
    release('Space');
    press('KeyZ');
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
    release('KeyZ');
    const down = press('ArrowDown');
    expect(down.prevented).toBe(true);
    expect(read((s) => s.justPressed('down'))).toBe(true);
    release('ArrowDown');
    press('Escape');
    expect(read((s) => s.justPressed('cancel'))).toBe(true);
    expect(enter.prevented, 'Enter was never prevented').toBe(false);
  });

  it('Tab on a screen that does not give it up is still the game\'s triangle, kept from moving focus', () => {
    root.dataset['screen'] = 'battle';
    const tab = press('Tab');
    expect(tab.prevented).toBe(true);
    expect(read((s) => s.justPressed('triangle'))).toBe(true);
  });
});

describe('Tab on the screens that give it to the browser', () => {
  it('is not prevented and is not the game\'s triangle', () => {
    for (const name of ['title', 'chapter-select', 'party-prep']) {
      root.dataset['screen'] = name;
      const tab = press('Tab');
      expect(tab.prevented, name).toBe(false);
      expect(read((s) => s.justPressed('triangle')), name).toBe(false);
      release('Tab');
    }
  });

  it('follows the screen on top: a pause over the board takes Tab back', () => {
    const pause = el('div', { 'data-screen': 'pause' }, document.body);
    const tab = press('Tab');
    expect(tab.prevented).toBe(true);
    expect(read((s) => s.justPressed('triangle'))).toBe(true);
    release('Tab');
    pause.remove();
    expect(press('Tab').prevented).toBe(false);
  });

  it('Shift alone is still the game\'s triangle (the press every screen already ignores or answers), Shift+Tab walks backwards', () => {
    const a = el('div', { role: 'button', tabindex: '0', 'data-action': 'a' });
    const b = el('div', { role: 'button', tabindex: '0', 'data-action': 'b' });
    tabTo(b);
    press('ShiftLeft', { shift: true });
    read(() => undefined);
    expect(document.activeElement, 'holding Shift does not move focus').toBe(b);
    const back = press('Tab', { shift: true });
    expect(back.prevented, 'Shift+Tab is the browser\'s').toBe(false);
    a.focus();
    expect(document.activeElement).toBe(a);
  });
});

describe('text entry owns every key', () => {
  it('latches nothing and prevents nothing while a field has focus', () => {
    const field = el('input', { type: 'text' });
    field.focus();
    for (const code of ['Enter', 'Space', 'ArrowLeft', 'KeyZ', 'KeyW', 'Escape', 'Tab', 'Backspace']) {
      const p = press(code);
      expect(p.prevented, code).toBe(false);
      release(code);
    }
    const snap = frame();
    for (const b of ['confirm', 'cancel', 'left', 'up', 'triangle'] as const) expect(snap.justPressed(b), b).toBe(false);
    input.endFrame();
  });
});

describe('Enter and Space on a Tab-focused control are that control\'s', () => {
  it('a div role=button: one click, as the mouse would, and no Confirm', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'prep:back' });
    tabTo(chip);
    expect(document.activeElement).toBe(chip);
    const enter = press('Enter');
    expect(enter.prevented).toBe(true);
    const snap = frame();
    expect(snap.actions).toEqual(['prep:back']);
    expect(snap.justPressed('confirm'), 'the screen does not also Confirm').toBe(false);
    input.endFrame();
    release('Enter');
  });

  it('Space does the same, and a held key does not click again', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'x' });
    tabTo(chip);
    const clicks: string[] = [];
    chip.addEventListener('click', () => clicks.push('click'));
    press('Space');
    press('Space', { repeat: true });
    press('Space', { repeat: true });
    expect(clicks).toEqual(['click']);
    expect(read((s) => s.justPressed('confirm'))).toBe(false);
  });

  it('the bridge\'s click does not turn the key hints into the mouse\'s', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'x' });
    tabTo(chip);
    press('Enter');
    expect(read((s) => s.lastDevice)).not.toBe('pointer');
  });

  it('a real mouse click on it is still the mouse\'s', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'x' });
    chip.click();
    const snap = frame();
    expect(snap.actions).toEqual(['x']);
    expect(snap.lastDevice).toBe('pointer');
    input.endFrame();
  });

  it('a native button is left to the browser: not prevented, no click from us, no Confirm', () => {
    const btn = el('button', { type: 'button', 'data-action': 'native' });
    tabTo(btn);
    const clicks: string[] = [];
    btn.addEventListener('click', () => clicks.push('click'));
    const enter = press('Enter');
    expect(enter.prevented, 'the browser presses it').toBe(false);
    expect(clicks, 'we did not press it as well').toEqual([]);
    expect(read((s) => s.justPressed('confirm'))).toBe(false);
    release('Enter');
    const space = press('Space');
    expect(space.prevented, 'Space presses a native button on key up').toBe(false);
    expect(read((s) => s.justPressed('confirm'))).toBe(false);
  });

  it('a focus nobody explains (assistive technology) is a control focus too', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'at' });
    chip.focus(); // no key or pointer event came first
    press('Enter');
    const snap = frame();
    expect(snap.actions).toEqual(['at']);
    expect(snap.justPressed('confirm')).toBe(false);
    input.endFrame();
  });

  it('an activator that is disabled, or not an activator at all, leaves Enter to the game', () => {
    const off = el('div', { role: 'button', tabindex: '0', 'aria-disabled': 'true', 'data-action': 'off' });
    tabTo(off);
    press('Enter');
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
    release('Enter');
    const plain = el('div', { tabindex: '0' });
    tabTo(plain);
    press('Enter');
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
  });

  it('Z stays the game\'s Confirm with a control focused (it is not a DOM activation key)', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'x' });
    tabTo(chip);
    press('KeyZ');
    const snap = frame();
    expect(snap.justPressed('confirm')).toBe(true);
    expect(snap.actions).toEqual([]);
    input.endFrame();
  });
});

describe('the screen\'s cursor and the mouse\'s controls keep Enter for the game', () => {
  it('Enter on the cursor is the screen\'s Confirm, once: the browser\'s click is prevented', () => {
    const card = el('button', { type: 'button', 'data-cursor': '', 'data-action': 'fe-card-3' });
    tabTo(card);
    const clicks: string[] = [];
    card.addEventListener('click', () => clicks.push('click'));
    const enter = press('Enter');
    expect(enter.prevented).toBe(true);
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
    expect(clicks).toEqual([]);
  });

  it('a control the mouse clicked is not the keyboard\'s: Enter is Confirm and the control lets go', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'hint' });
    clickFocus(chip);
    expect(document.activeElement).toBe(chip);
    const clicks: string[] = [];
    chip.addEventListener('click', () => clicks.push('click'));
    press('Enter');
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
    expect(clicks).toEqual([]);
  });

  it('the first game key lets a clicked control go', () => {
    const chip = el('button', { type: 'button' });
    clickFocus(chip);
    press('ArrowRight');
    expect(document.activeElement).toBe(document.body);
    read(() => undefined);
    expect(document.activeElement).toBe(document.body);
  });

  it('a focus the game restored keeps what the control was: a clicked one stays the mouse\'s', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'hint' });
    clickFocus(chip);
    chip.blur();
    chip.focus(); // the panel handing focus back, no input behind it
    press('Enter');
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
  });
});

describe('a game key hands the keys back: focus follows the cursor', () => {
  function board(): { back: HTMLElement; cursor: HTMLElement; next: HTMLElement } {
    const back = el('div', { role: 'button', tabindex: '0', 'data-action': 'cancel' });
    const cursor = el('div', { role: 'button', tabindex: '0', 'data-cursor': '', 'data-action': 'fe-card-0' });
    const next = el('div', { role: 'button', tabindex: '-1', 'data-action': 'fe-card-1' });
    return { back, cursor, next };
  }

  it('an arrow moves focus from a Tab-focused control to the cursor, after the frame', () => {
    const { back, cursor } = board();
    tabTo(back);
    press('ArrowRight');
    expect(document.activeElement, 'not before the screen has answered').toBe(back);
    read(() => undefined);
    expect(document.activeElement).toBe(cursor);
  });

  it('the cursor the screen moved in that frame is the one that gets focus', () => {
    const { cursor, next } = board();
    tabTo(cursor);
    press('ArrowRight');
    const snap = frame();
    expect(snap.justPressed('right')).toBe(true);
    cursor.removeAttribute('data-cursor'); // the screen's answer
    next.setAttribute('data-cursor', '');
    next.setAttribute('tabindex', '0');
    input.endFrame();
    expect(document.activeElement).toBe(next);
  });

  it('then Enter is the cursor\'s Confirm, not the control that was Tabbed to', () => {
    const { back, cursor } = board();
    const clicks: string[] = [];
    back.addEventListener('click', () => clicks.push('back'));
    tabTo(back);
    press('ArrowRight');
    read(() => undefined);
    release('ArrowRight');
    expect(document.activeElement).toBe(cursor);
    const enter = press('Enter');
    expect(enter.prevented).toBe(true);
    expect(read((s) => s.justPressed('confirm'))).toBe(true);
    expect(clicks).toEqual([]);
  });

  it('with no cursor on the screen the control lets go', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'x' });
    tabTo(chip);
    press('ArrowDown');
    read(() => undefined);
    expect(document.activeElement).toBe(document.body);
  });

  it('focus the screen put somewhere itself while it answered the key is left alone (the pause pages focus their selected row)', () => {
    const { back } = board();
    const own = el('div', { role: 'button', tabindex: '0', 'data-action': 'own' });
    tabTo(back);
    press('Escape');
    own.focus(); // the screen's own focus(), inside its frame
    read(() => undefined);
    expect(document.activeElement).toBe(own);
  });

  it('Escape is Cancel and hands the keys back like any game key', () => {
    const { back, cursor } = board();
    tabTo(back);
    press('Escape');
    expect(read((s) => s.justPressed('cancel'))).toBe(true);
    expect(document.activeElement).toBe(cursor);
  });

  it('a modifier, Enter or Space do not take focus away from a control', () => {
    const { back } = board();
    tabTo(back);
    press('ShiftLeft', { shift: true });
    press('ControlLeft');
    read(() => undefined);
    expect(document.activeElement).toBe(back);
    press('Enter');
    release('Enter');
    read(() => undefined);
    expect(document.activeElement).toBe(back);
  });

  it('with a strip and rows both marked (the pause menu), the one nearest the content gets the focus', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'x' });
    const tab = el('div', { role: 'tab', tabindex: '0', 'data-cursor': '' });
    const row = el('div', { role: 'button', tabindex: '0', 'data-cursor': '' });
    expect(tab).not.toBe(row);
    tabTo(chip);
    press('ArrowDown');
    read(() => undefined);
    expect(document.activeElement).toBe(row);
  });

  it('the cursor is found on the screen on top, not on one buried under it', () => {
    const { back } = board();
    const under = el('div', { 'data-cursor': '', tabindex: '0', role: 'button' });
    const top = el('div', { 'data-screen': 'party-prep' }, document.body);
    const mine = el('div', { 'data-cursor': '', tabindex: '0', role: 'button' }, top);
    const chip = el('div', { role: 'button', tabindex: '0' }, top);
    expect(under).not.toBe(mine);
    expect(back).not.toBe(chip);
    tabTo(chip);
    press('ArrowLeft');
    read(() => undefined);
    expect(document.activeElement).toBe(mine);
  });
});

describe('claims', () => {
  it('an exclusive claim keeps every key from the contract: no bridge, no release', () => {
    const chip = el('div', { role: 'button', tabindex: '0', 'data-action': 'x' });
    tabTo(chip);
    const seen: string[] = [];
    const drop = input.claimKeyboard((e) => seen.push(e.code), { exclusive: true });
    const clicks: string[] = [];
    chip.addEventListener('click', () => clicks.push('click'));
    press('Enter');
    expect(seen).toEqual(['Enter']);
    expect(clicks).toEqual([]);
    expect(read((s) => s.justPressed('confirm'))).toBe(false);
    drop();
  });

  it('a non-exclusive claim (the pause) still sees the key first, and a Tab on a game-owned screen is still its own', () => {
    root.dataset['screen'] = 'pause';
    const seen: string[] = [];
    input.claimKeyboard((e) => seen.push(e.code));
    const tab = press('Tab', { shift: false });
    expect(seen).toEqual(['Tab']);
    expect(tab.prevented).toBe(true);
  });
});
