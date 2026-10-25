// @vitest-environment jsdom
/**
 * THE ATTRACT CARD, RUNNING (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b; both games, demo mode only; `src/app/demo/boothAttract.ts`, `demoTitle.ts`, `TitleScreen.ts`).
 *
 * Claims: the card is on the screen until anyone is there (a key, a click, a tap, the wheel, a mouse that has really moved, a pad button or a stick pushed), and the press that wakes it is the card's alone: the game never
 * hears it, the click and the release behind it are taken for a moment, and the title does nothing with its input while the card is up or just gone ({@link AttractCard.holding}). The 60 s idle count of the title puts it up
 * in place of the reel (and only with the booth screens on); `?attract=reel` keeps the reel. It writes nothing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { attractRunner, setAttractRunner } from '../../src/app/demo/attractHook.ts';
import { AttractCard, CARD_OUT_MS, PAD_POLL_MS, SWALLOW_MS } from '../../src/app/demo/boothAttract.ts';
import { setBoothMode } from '../../src/app/demo/boothSwitch.ts';
import { enterDemoTitle } from '../../src/app/demo/demoTitle.ts';
import { ATTRACT_AFTER_MS, POINTER_ACTIVE_PX } from '../../src/app/demo/demoIdle.ts';

let now = 0;
let parent: HTMLElement;

beforeEach(() => {
  now = 1000;
  vi.useFakeTimers();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  document.body.innerHTML = '<div id="ui"></div>';
  parent = document.getElementById('ui') as HTMLElement;
  document.documentElement.removeAttribute('data-reduce-motion');
});
afterEach(async () => {
  await vi.runAllTimersAsync(); // a woken card's swallow listeners come off on a timer; a test that ends before it must not leave them on the window
  setDemoMode(null);
  setBoothMode(null);
  setAttractRunner(null);
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  window.history.replaceState(null, '', '/');
});

const cardEl = (): Element | null => document.querySelector('.booth-attract');

describe('the attract card: what wakes it', () => {
  it('stands on the UI layer until something happens', async () => {
    const card = new AttractCard(parent);
    card.show();
    expect(cardEl()).not.toBeNull();
    expect(cardEl()!.parentElement).toBe(parent);
    expect(card.up).toBe(true);
    expect(card.holding()).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(card.up).toBe(true);
    card.dispose();
  });

  it.each([['keydown'], ['pointerdown'], ['mousedown'], ['touchstart'], ['wheel']])('wakes on a %s, and the game never hears that press', async (type) => {
    const heard = vi.fn();
    window.addEventListener(type, heard); // the game's own listener, bubble phase, registered first
    const card = new AttractCard(parent);
    card.show();
    document.body.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    await card.done;
    expect(card.up).toBe(false);
    expect(heard).not.toHaveBeenCalled();
    window.removeEventListener(type, heard);
  });

  it('does not wake for a mouse resting on the table, and wakes for one that has really moved', async () => {
    const card = new AttractCard(parent);
    card.show();
    const move = (x: number, y: number): void => {
      const e = new Event('pointermove', { bubbles: true }) as Event & { clientX: number; clientY: number };
      e.clientX = x;
      e.clientY = y;
      document.body.dispatchEvent(e);
    };
    move(100, 100);
    move(100 + POINTER_ACTIVE_PX - 2, 100);
    expect(card.up).toBe(true);
    move(100 + POINTER_ACTIVE_PX + 2, 100);
    await card.done;
    expect(card.up).toBe(false);
  });

  it('wakes on a pad button or a stick pushed, which raise no DOM event', async () => {
    let pads: Array<{ buttons: Array<{ pressed: boolean }>; axes: number[] } | null> = [{ buttons: [{ pressed: false }], axes: [0, 0.1] }];
    const card = new AttractCard(parent, window, () => pads as never);
    card.show();
    await vi.advanceTimersByTimeAsync(PAD_POLL_MS * 3);
    expect(card.up).toBe(true); // a stick at rest and no button: nobody there
    pads = [{ buttons: [{ pressed: true }], axes: [0, 0] }];
    await vi.advanceTimersByTimeAsync(PAD_POLL_MS + 1);
    await card.done;
    expect(card.up).toBe(false);
    pads = [{ buttons: [{ pressed: false }], axes: [0.9, 0] }];
    const stick = new AttractCard(parent, window, () => pads as never);
    stick.show();
    await vi.advanceTimersByTimeAsync(PAD_POLL_MS + 1);
    await stick.done;
    expect(stick.up).toBe(false);
  });

  it('wakes on the frame a pad button goes down, however short the tap: the title looks at the pads each frame, not only on the 50 ms timer', async () => {
    let pads: Array<{ buttons: Array<{ pressed: boolean }>; axes: number[] } | null> = [{ buttons: [{ pressed: false }], axes: [0, 0] }];
    const card = new AttractCard(parent, window, () => pads as never);
    card.show();
    card.pollPads();
    expect(card.up).toBe(true); // nobody there
    pads = [{ buttons: [{ pressed: true }], axes: [0, 0] }];
    card.pollPads(); // the frame's look, no timer has run
    await card.done;
    expect(card.up).toBe(false);
    expect(card.holding()).toBe(true);
    card.pollPads(); // after the wake it does nothing more
    expect(card.up).toBe(false);
  });
});

describe('the attract card: the press that wakes it is its own', () => {
  it('holds the title for a moment after it goes, then lets go', async () => {
    const card = new AttractCard(parent);
    card.show();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    expect(card.up).toBe(false);
    expect(card.holding()).toBe(true);
    now += SWALLOW_MS - 1;
    expect(card.holding()).toBe(true);
    now += 2;
    expect(card.holding()).toBe(false);
  });

  it('takes the click and the release behind a swallowed press for that moment only', async () => {
    const card = new AttractCard(parent);
    card.show();
    const tap = vi.fn();
    document.body.addEventListener('click', tap); // the title's tap plate
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    document.body.dispatchEvent(new Event('pointerup', { bubbles: true, cancelable: true }));
    expect(tap).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(SWALLOW_MS + 5);
    document.body.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    expect(tap).toHaveBeenCalledTimes(1); // a later click is the next visitor's
    document.body.removeEventListener('click', tap);
  });

  it('fades out and is gone from the page after its fade; at once under REDUCE MOTION', async () => {
    const card = new AttractCard(parent);
    card.show();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', bubbles: true }));
    expect(cardEl()!.classList.contains('booth-card--out')).toBe(true);
    await vi.advanceTimersByTimeAsync(CARD_OUT_MS + 5);
    expect(cardEl()).toBeNull();

    document.documentElement.setAttribute('data-reduce-motion', '');
    const still = new AttractCard(parent);
    still.show();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', bubbles: true }));
    expect(cardEl()).toBeNull();
  });

  it('is taken away at once, with nothing swallowed, when the title leaves', () => {
    const card = new AttractCard(parent);
    card.show();
    card.dispose();
    expect(cardEl()).toBeNull();
    expect(card.holding()).toBe(false);
  });

  it('listens to nothing once it is woken', () => {
    const card = new AttractCard(parent);
    card.show();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', bubbles: true }));
    const heard = vi.fn();
    window.addEventListener('keydown', heard);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB', bubbles: true }));
    expect(heard).toHaveBeenCalledTimes(1); // the next key is the game's again
    window.removeEventListener('keydown', heard);
  });
});

describe('the title\'s 60 s idle count', () => {
  const appOf = (): never => ({ uiRoot: parent }) as never;

  it('puts the card up in place of the reel, once, with the booth screens on', () => {
    setDemoMode(true);
    setBoothMode('new');
    const run = vi.fn(() => new Promise<{ left: boolean }>(() => undefined));
    setAttractRunner(run);
    const title = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS - 1;
    title.update(false);
    expect(cardEl()).toBeNull();
    expect(title.holding()).toBe(false);
    now += 1;
    title.update(false);
    title.update(false);
    expect(document.querySelectorAll('.booth-attract')).toHaveLength(1);
    expect(run).not.toHaveBeenCalled();
    expect(title.holding()).toBe(true);
    title.dispose();
    expect(cardEl()).toBeNull();
  });

  it('counts the idle minute again after the card is woken, and holds the title for the swallow window', async () => {
    setDemoMode(true);
    setBoothMode('new');
    const title = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS;
    title.update(false);
    expect(cardEl()).not.toBeNull();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    await vi.advanceTimersByTimeAsync(CARD_OUT_MS + 5);
    expect(title.holding()).toBe(true); // `now` is mocked: no swallow time has passed
    now += SWALLOW_MS + 1;
    expect(title.holding()).toBe(false);
    title.update(false);
    expect(cardEl()).toBeNull(); // the count began again at the press
    now += ATTRACT_AFTER_MS - 1000;
    title.update(false);
    expect(cardEl()).toBeNull();
    now += 1500;
    title.update(false);
    expect(cardEl()).not.toBeNull(); // a minute after the press, the next one
    title.dispose();
  });

  it('wakes the card from the title\'s own frame when a pad button goes down (the frame loop, not the 50 ms timer)', async () => {
    setDemoMode(true);
    setBoothMode('new');
    let pads: Array<{ buttons: Array<{ pressed: boolean }>; axes: number[] } | null> = [];
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
    const title = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS;
    title.update(false);
    expect(cardEl()).not.toBeNull();
    pads = [{ buttons: [{ pressed: true }], axes: [0, 0] }];
    title.update(false); // one frame later, before any timer has run
    expect(cardEl()!.classList.contains('booth-card--out')).toBe(true); // already on its way out: the frame woke it
    expect(title.holding()).toBe(true);
    await vi.advanceTimersByTimeAsync(CARD_OUT_MS + 5);
    expect(cardEl()).toBeNull();
    title.dispose();
    delete (navigator as unknown as { getGamepads?: unknown }).getGamepads;
  });

  it('starts the reel, not the card, with the booth screens off or ?attract=reel in the address', async () => {
    setDemoMode(true);
    const run = vi.fn(() => new Promise<{ left: boolean }>(() => undefined));
    setAttractRunner(run);
    setBoothMode('today');
    let title = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS;
    title.update(false);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(1);
    expect(cardEl()).toBeNull();
    title.dispose();

    setBoothMode('new');
    window.history.replaceState(null, '', '/?attract=reel');
    title = enterDemoTitle(appOf())!;
    now += ATTRACT_AFTER_MS;
    title.update(false);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(2);
    expect(cardEl()).toBeNull();
    title.dispose();
    expect(attractRunner()).toBe(run);
  });

  it('is nothing outside demo mode', () => {
    setDemoMode(false);
    setBoothMode('new');
    expect(enterDemoTitle(appOf())).toBeNull();
    expect(cardEl()).toBeNull();
  });
});
