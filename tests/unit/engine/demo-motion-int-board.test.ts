// @vitest-environment jsdom
/**
 * The playtest switchboard's keys (integration review m2 and m4; both games; behind ?pack=demo&switchboard=1): they are heard in the CAPTURE phase and swallowed, so the pause screen's keyboard
 * claim (which stops a key dead in the capture phase, `app/Input.ts`) cannot take them, and a key the game never hears cannot turn the pad's hints and rumble over to the keyboard.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installSwitchboard, type SwitchboardHandle } from '../../../src/app/demo/switchboard.ts';
import { resetFeelForTests } from '../../../src/engine/feel/FeelSwitch.ts';
import { setFxMode, setFxPiece } from '../../../src/engine/spellfx/FxSwitch.ts';
import { setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';

let board: SwitchboardHandle | null = null;

beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no art server in a unit test')));
  window.history.replaceState({}, '', '/?demo=1&pack=demo&switchboard=1');
  resetFeelForTests(window.location.search);
});
afterEach(() => {
  board?.dispose();
  board = null;
  setFxMode(null);
  setFxPiece(null);
  setCurvesMode(null);
  setSmearStyle(null);
  setMomentsMode(null);
  resetFeelForTests();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

const press = (code: string, init: KeyboardEventInit = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init }));
};

describe('the switchboard hears its keys before the game does', () => {
  it('a key flips its piece even when an earlier-or-later capture listener (the pause screen\'s claim) stops every key, and the game never hears it', () => {
    board = installSwitchboard();
    expect(board).not.toBeNull();
    const heard: string[] = [];
    // What `Input.onKeyDown` does under a claim: a capture listener on window that stops the event dead. It is added AFTER the board's, as at boot.
    const claim = (e: KeyboardEvent): void => {
      heard.push(e.code);
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', claim, true);
    const before = board!.text();
    expect(before).toContain('6 fx new');
    press('Digit6');
    expect(board!.text()).toContain('6 fx today');
    expect(heard).not.toContain('Digit6'); // swallowed: the game (and its "last input was the keyboard") never heard it
    press('KeyW');
    expect(heard).toContain('KeyW'); // any other key goes on to the game as it always did
    window.removeEventListener('keydown', claim, true);
  });
  it('a held key flips once; chords and text fields are left alone', () => {
    board = installSwitchboard();
    press('Digit6');
    press('Digit6', { repeat: true });
    press('Digit6', { repeat: true });
    expect(board!.text()).toContain('6 fx today'); // not flipped back by the auto-repeat
    press('Digit6', { ctrlKey: true });
    expect(board!.text()).toContain('6 fx today');
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit6', bubbles: true, cancelable: true }));
    expect(board!.text()).toContain('6 fx today');
    input.remove();
  });
});
