// @vitest-environment jsdom
/**
 * r63-rc, driver call 201c (the r64 defaults and art review, minor m2): after the fight picker idled back to the title (r64 item 200i), the title counted its own 60 s before the attract card came up, two
 * minutes in all from the last press. Now the picker notes the idle return and the title that opens next starts its clock as already run out, so the card is up on its first frame.
 *
 * Claims: the note is spent by one title and only counts while fresh; a title with no note counts its minute as it always did (a visitor's Esc included); a title after the idle return puts the card up at
 * once (booth screens on) and starts the reel at once with `?attract=reel`; the picker's own idle exit makes the note; the card, once woken, counts a fresh minute.
 *
 * **Game case: both games** (the booth flow is shared; demo mode with the booth screens on only; every other address is release 62).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { setAttractRunner } from '../../src/app/demo/attractHook.ts';
import { setBoothMode } from '../../src/app/demo/boothSwitch.ts';
import { enterDemoTitle } from '../../src/app/demo/demoTitle.ts';
import { ATTRACT_AFTER_MS, IDLE_RETURN_FRESH_MS, PICKER_IDLE_MS, noteIdleReturn, takeIdleReturn } from '../../src/app/demo/demoIdle.ts';
import { DemoBoardScreen } from '../../src/app/demo/demoBoard.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import type { App } from '../../src/app/App.ts';

let now = 0;
const cardEl = (): Element | null => document.querySelector('.booth-attract');
const appOf = (): never => ({ uiRoot: document.getElementById('ui') }) as never;

beforeEach(() => {
  now = 1000;
  vi.useFakeTimers();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  document.body.innerHTML = '<div id="ui"></div>';
  document.documentElement.removeAttribute('data-reduce-motion');
  takeIdleReturn(now); // a note left by another test is spent
});
afterEach(async () => {
  await vi.runAllTimersAsync();
  setDemoMode(null);
  setBoothMode(null);
  setAttractRunner(null);
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  delete (navigator as unknown as { getGamepads?: unknown }).getGamepads;
});

describe('the idle-return note', () => {
  it('is false with no note, true once after one, and spent', () => {
    expect(takeIdleReturn(now)).toBe(false);
    noteIdleReturn(now);
    expect(takeIdleReturn(now + 500)).toBe(true);
    expect(takeIdleReturn(now + 500)).toBe(false);
  });

  it('goes stale: a title that opens later than the fresh window is an ordinary one, and the note is spent either way', () => {
    noteIdleReturn(now);
    expect(takeIdleReturn(now + IDLE_RETURN_FRESH_MS + 1)).toBe(false);
    expect(takeIdleReturn(now + 1)).toBe(false);
    noteIdleReturn(now);
    expect(takeIdleReturn(now + IDLE_RETURN_FRESH_MS)).toBe(true);
  });
});

describe('the title after the picker idled (booth screens on)', () => {
  it('puts the attract card up on its first frame, not a minute later', () => {
    setDemoMode(true);
    setBoothMode('new');
    noteIdleReturn(now);
    now += 400; // the flow took a moment to open the title
    const title = enterDemoTitle(appOf())!;
    expect(cardEl()).toBeNull(); // nothing before the first frame
    title.update(false);
    expect(cardEl()).not.toBeNull();
    expect(title.holding()).toBe(true);
    title.dispose();
  });

  it('a title with no idle return (a visitor pressed Esc, or the first title of the day) still waits its minute', () => {
    setDemoMode(true);
    setBoothMode('new');
    const title = enterDemoTitle(appOf())!;
    title.update(false);
    expect(cardEl()).toBeNull();
    now += ATTRACT_AFTER_MS - 1;
    title.update(false);
    expect(cardEl()).toBeNull();
    now += 1;
    title.update(false);
    expect(cardEl()).not.toBeNull();
    title.dispose();
  });

  it('the note is spent by the first title: the next one counts its minute', () => {
    setDemoMode(true);
    setBoothMode('new');
    noteIdleReturn(now);
    const first = enterDemoTitle(appOf())!;
    first.update(false);
    expect(cardEl()).not.toBeNull();
    first.dispose();
    const second = enterDemoTitle(appOf())!;
    second.update(false);
    expect(cardEl()).toBeNull();
    second.dispose();
  });

  it('a card woken after the idle return counts a fresh minute from the press (the earlier behaviour)', async () => {
    setDemoMode(true);
    setBoothMode('new');
    noteIdleReturn(now);
    const title = enterDemoTitle(appOf())!;
    title.update(false);
    expect(cardEl()).not.toBeNull();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);
    now += 5000;
    title.update(false);
    expect(cardEl()).toBeNull();
    now += ATTRACT_AFTER_MS;
    title.update(false);
    expect(cardEl()).not.toBeNull();
    title.dispose();
  });

  it('a pad button held on the first frame is somebody there: no card', () => {
    setDemoMode(true);
    setBoothMode('new');
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{ buttons: [{ pressed: true }], axes: [0, 0] }] });
    noteIdleReturn(now);
    const title = enterDemoTitle(appOf())!;
    title.update(false);
    expect(cardEl()).toBeNull();
    title.dispose();
  });

  it('with ?attract=reel the reel starts at once instead', async () => {
    setDemoMode(true);
    setBoothMode('new');
    window.history.replaceState(null, '', '/?attract=reel');
    const run = vi.fn(() => new Promise<{ left: boolean }>(() => undefined));
    setAttractRunner(run);
    noteIdleReturn(now);
    const title = enterDemoTitle(appOf())!;
    title.update(false);
    expect(run).toHaveBeenCalledTimes(1);
    expect(cardEl()).toBeNull();
    title.dispose();
    window.history.replaceState(null, '', '/');
  });
});

describe('the picker makes the note when it idles out, and only then', () => {
  function openPicker(): DemoBoardScreen {
    const screen = new DemoBoardScreen();
    const root = document.createElement('div');
    document.body.appendChild(root);
    screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), uiRoot: document.body } as unknown as App;
    screen.root = root;
    screen.enter();
    return screen;
  }

  it('60 s with nobody there: the pick is null and the title that opens takes the note', async () => {
    forgetBoardChapter();
    setDemoMode(true);
    setBoothMode('new');
    const screen = openPicker();
    now += PICKER_IDLE_MS;
    screen.update(1 / 60);
    expect(takeIdleReturn(now + 300)).toBe(true);
    screen.exit();
  });

  it('a pick made in time leaves no note', () => {
    forgetBoardChapter();
    setDemoMode(true);
    setBoothMode('new');
    const screen = openPicker();
    now += PICKER_IDLE_MS - 1;
    screen.update(1 / 60);
    expect(takeIdleReturn(now)).toBe(false);
    screen.exit();
  });
});
