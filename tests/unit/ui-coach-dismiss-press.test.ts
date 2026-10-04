// @vitest-environment jsdom
/**
 * PR-0362 (FFX only, release 39): the press that dismisses the first-turn coach card does nothing else.
 *
 * Round 21, real runs on the live site (release 38), fresh profile, Chapter I: one Enter took the guided first run's
 * third card ("AURON 3 OF 3 ... Pick ATTACK, then pick who it hits") down AND confirmed the highlighted Attack, so the
 * target cursor was up (targets 2, selecting true) within 100 ms. The O2 guide had a deliberate exception that let a confirm
 * through when the cursor rested on the ringed ATTACK (`docs/plans/firstrun-o2-review.md` risk 1); the critic's rule is the one
 * the build adopted in e30ea5e for every other overlay: "An overlay's dismissing press dies with the overlay".
 * A pad is the same story, and worse: it is polled, so no capture listener can take the Cross first.
 *
 * The line runs for real here (jsdom, real `keydown` events, a polled pad); the "menu behind it" is a second real
 * `RawInputWatcher`, which is exactly what the FFX command menu is for input.
 *
 * FFX only (rule 14). The FFX-2 line fades on its own and its pad behaviour is deliberately left as it was (the last test).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachMark } from '../../src/ui/coach/CoachMark.ts';
import { marksFor } from '../../src/ui/coach/coachCopy.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';
import { armFirstRunGuide, firstRunBattleBegan, firstRunTurnGuide, stopFirstRun } from '../../src/ui/coach/firstRunGuide.ts';
import { RawInputWatcher, setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';

const key = (code: string): KeyboardEvent => new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true });

function makePad(): { pad: Gamepad; set(index: number, down: boolean): void } {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'test pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 } as unknown as Gamepad;
  return { pad, set: (i, down) => { buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 }; } };
}

/** Hold a pad button for three frames, then let go for three (a press every poller sees). */
async function tapPad(set: (i: number, down: boolean) => void, index: number): Promise<void> {
  set(index, true);
  await vi.advanceTimersByTimeAsync(50);
  set(index, false);
  await vi.advanceTimersByTimeAsync(50);
}

let padSet!: (i: number, down: boolean) => void;
let heard: string[] = [];
let menu: RawInputWatcher | null = null;

/** The command menu's own input: a watcher that records what it hears. Attached in the order the HUD does it. */
function attachMenu(): RawInputWatcher {
  menu = new RawInputWatcher((b) => heard.push(b));
  menu.attach();
  return menu;
}

function mountLine(opts: { game?: 'ffx' | 'ffx2'; guide?: boolean; menuFirst?: boolean } = {}): CoachMark {
  const { game = 'ffx', guide = true, menuFirst = false } = opts;
  const root = document.createElement('div');
  root.innerHTML = '<div class="ffxhud"><div class="ig-cmd-stack"><div class="ig-cmd">Talk</div><div class="ig-cmd ig-cmd--selected">Attack</div></div></div><div class="coach-layer"></div>';
  document.body.appendChild(root);
  if (guide) {
    armFirstRunGuide({ root: document.body, absorbInput: () => undefined });
    firstRunBattleBegan('ffx');
  }
  const mark = marksFor(game)[0]!;
  const line = new CoachMark({
    root: root.querySelector('.coach-layer') as HTMLElement,
    mark,
    game,
    reduceMotion: true,
    setTimer: () => 0,
    clearTimer: () => undefined,
    guide: guide && game === 'ffx' ? firstRunTurnGuide() : null,
  });
  // `CoachLayer.chooseCommand` raises the line, then opens the menu in the same turn: the line's watcher attaches first.
  if (menuFirst) attachMenu();
  void line.show();
  if (!menuFirst) attachMenu();
  return line;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  resetCoach();
  stopFirstRun();
  heard = [];
  const p = makePad();
  padSet = p.set;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [p.pad] });
});

afterEach(() => {
  menu?.detach();
  menu = null;
  stopFirstRun();
  setRawInputSuspended(false);
  vi.useRealTimers();
  delete (navigator as { getGamepads?: unknown }).getGamepads;
  document.body.innerHTML = '';
});

describe('the keyboard: one Enter takes the card down and does nothing else', () => {
  it('guide mode, cursor on the ringed ATTACK (Chapter I): the menu hears nothing and the press is prevented', async () => {
    const line = mountLine({ guide: true });
    const enter = key('Enter');
    window.dispatchEvent(enter);
    expect(line.finished).toBe(true);
    expect(enter.defaultPrevented).toBe(true);
    expect(heard).toEqual([]); // no Attack confirmed, so no target cursor
  });

  it('the plain first-command line behaves the same (the rule every other overlay follows)', () => {
    const line = mountLine({ guide: false });
    window.dispatchEvent(key('Enter'));
    expect(line.finished).toBe(true);
    expect(heard).toEqual([]);
  });

  it('Space and Z are the same press', () => {
    for (const code of ['Space', 'KeyZ']) {
      heard = [];
      const line = mountLine({ guide: false });
      window.dispatchEvent(key(code));
      expect(line.finished).toBe(true);
      expect(heard).toEqual([]);
      document.body.innerHTML = '';
      menu?.detach();
    }
  });

  it('the NEXT Enter is the player\'s pick: the menu hears it', () => {
    mountLine({ guide: true });
    window.dispatchEvent(key('Enter'));
    expect(heard).toEqual([]);
    window.dispatchEvent(key('Enter'));
    expect(heard).toEqual(['confirm']);
  });

  it('after the player moved the cursor under the line, the confirm answers the row (PR-0182 still holds)', () => {
    const line = mountLine({ guide: true });
    window.dispatchEvent(key('ArrowDown'));
    expect(heard).toEqual(['down']);
    window.dispatchEvent(key('Enter'));
    expect(line.finished).toBe(true);
    expect(heard).toEqual(['down', 'confirm']);
  });
});

describe('the pad: one Cross takes the card down and does nothing else (the pad is polled, so the press is claimed)', () => {
  it('the menu polls after the line, as the HUD attaches them: it hears nothing', async () => {
    const line = mountLine({ guide: true });
    await tapPad(padSet, 0);
    expect(line.finished).toBe(true);
    expect(heard).toEqual([]);
  });

  it('the menu polls BEFORE the line (a held line that comes back after a beat card): it hears nothing either', async () => {
    const line = mountLine({ guide: true, menuFirst: true });
    await tapPad(padSet, 0);
    expect(line.finished).toBe(true);
    expect(heard).toEqual([]);
  });

  it('a Cross held across the dismissal is not fired late once the line is gone', async () => {
    const line = mountLine({ guide: false });
    padSet(0, true);
    await vi.advanceTimersByTimeAsync(400); // held for many frames: the claim stands the whole time
    expect(line.finished).toBe(true);
    expect(heard).toEqual([]);
    padSet(0, false);
    await vi.advanceTimersByTimeAsync(50);
    expect(heard).toEqual([]);
  });

  it('the next Cross is the player\'s pick: the claim ended with the first press', async () => {
    mountLine({ guide: true });
    await tapPad(padSet, 0);
    expect(heard).toEqual([]);
    await tapPad(padSet, 0);
    expect(heard).toEqual(['confirm']);
  });

  it('other pad buttons are untouched by the reserve: the d-pad moves the menu cursor under the line', async () => {
    const line = mountLine({ guide: true });
    await tapPad(padSet, 13); // d-pad down
    expect(heard).toEqual(['down']);
    expect(line.finished).toBe(false);
  });

  it('after the cursor was moved under the line the Cross answers the row: it takes the line down and the menu hears it', async () => {
    const line = mountLine({ guide: true });
    await tapPad(padSet, 13);
    await tapPad(padSet, 0);
    expect(line.finished).toBe(true);
    expect(heard).toEqual(['down', 'confirm']);
  });

  it('a line taken down by something else (a beat card) releases the pad: the next Cross reaches the menu', async () => {
    const line = mountLine({ guide: true });
    line.dismiss();
    await tapPad(padSet, 0);
    expect(heard).toEqual(['confirm']);
  });

  it('Circle skips as before and leaves the next Cross to the menu', async () => {
    const line = mountLine({ guide: true });
    await tapPad(padSet, 1);
    expect(line.finished).toBe(true);
    expect(heard).toEqual(['cancel']); // the menu hears Circle too: the pause opens on it (FR-34-01)
    await tapPad(padSet, 0);
    expect(heard).toEqual(['cancel', 'confirm']);
  });
});

describe('scope: FFX only', () => {
  it('an FFX-2 line leaves the pad as it was (its Cross still reaches the menu behind the fading line)', async () => {
    const line = mountLine({ game: 'ffx2', guide: false });
    await tapPad(padSet, 0);
    expect(line.finished).toBe(true);
    expect(heard).toEqual(['confirm']);
  });
});
