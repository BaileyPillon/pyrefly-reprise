// @vitest-environment jsdom
/**
 * Lady Luck's timed reels, the overlay (Bailey's pick A of 2026-10-04, "the slow strip"; FFX-2 only).
 *
 * The rule under test: the three reels run at a constant rate, a press stops the reel the pink arrow marks, and **the symbol
 * on the gold line at the instant of the press is what it stops on**. Everything runs on a manual clock (`params.now`), so a
 * press lands on an exact millisecond and the expected symbol is plain arithmetic written out here (5 symbols a second and a
 * 12 s timer, both OUR ESTIMATES: no source gives these reels a rate or a timer; the symbol nearest the line), not read back
 * from the module under test. The pure rule has its own file
 * (`ladyluck-timing.test.ts`); the engine's half (the seeded layout) is `ffx2-lady-luck-layout.test.ts`.
 *
 * Every input is driven the way the page drives it, as the Trigger Happy test does: real `KeyboardEvent`s on `window`, the
 * Gamepad API polled from `requestAnimationFrame` (a pad dispatches no event), and `PointerEvent`s on the slab. The abstract
 * button is pinned against the real `src/app/Input.ts`: the overlay stops a reel on exactly the presses `Input` reports as
 * `confirm`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../../src/app/Input.ts';
import { setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';
import { createLadyLuckReels, type LadyLuckHandle } from '../../src/ui/ffx2/LadyLuckReels.ts';

const MAGIC = ['red7', 'bar', 'cherry', 'skull', 'hat', 'staff'];

let t = 0;
let container: HTMLElement;
const savedPointerEvent = window.PointerEvent;

/** One overlay on the manual clock: reels 0, 1, 2 stopped in that order, every strip starting dead on Red 7. */
function open(params: Record<string, unknown> = {}): LadyLuckHandle {
  return createLadyLuckReels(container, { symbols: MAGIC, stopOrder: [0, 1, 2], phases: [0, 0, 0], now: () => t, ...params });
}

const armed = (h: LadyLuckHandle): string => h.el.dataset['armed'] ?? '?';
const armedClass = (h: LadyLuckHandle): string => [...h.el.querySelectorAll('.ffx2-reels__reel--armed')].map((r) => (r as HTMLElement).dataset['reel']).join(',');
const subtitleOf = (h: LadyLuckHandle): string => h.el.querySelector('.ig-minigame__subtitle')?.textContent ?? '';
const symbolsOf = (h: LadyLuckHandle): string[] => [...h.el.querySelectorAll('.ffx2-reels__reel')].map((r) => (r as HTMLElement).dataset['sym'] ?? '');

function keydown(code: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
}

function pointerdown(el: Element, pointerType: string, init: PointerEventInit = {}): PointerEvent {
  const e = new PointerEvent('pointerdown', { pointerType, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(e);
  return e;
}

/** One standard-mapping pad (17 buttons) and the way to hold a button on it. */
function makePad(): { pad: Gamepad; set(index: number, down: boolean): void } {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'test pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 } as unknown as Gamepad;
  return { pad, set: (i, down) => { buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 }; } };
}

let padCalls = 0;
function stubPads(pads: Array<Gamepad | null>): void {
  padCalls = 0;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => { padCalls++; return pads; } });
}

function stubCoarsePointer(coarse: boolean): void {
  window.matchMedia = ((query: string) => ({ matches: coarse && query.includes('coarse'), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

/** Hold a pad button for two frames, then let go for two (a press the poller can see). */
async function tapPad(set: (i: number, down: boolean) => void, index: number): Promise<void> {
  set(index, true);
  await vi.advanceTimersByTimeAsync(40);
  set(index, false);
  await vi.advanceTimersByTimeAsync(40);
}

beforeEach(() => {
  t = 0;
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  setRawInputSuspended(false);
  vi.useRealTimers();
  delete (navigator as { getGamepads?: unknown }).getGamepads;
  delete (window as { matchMedia?: unknown }).matchMedia;
  window.PointerEvent = savedPointerEvent;
  container.remove();
});

describe('the press stops the reel the arrow marks, on the symbol on the line at that instant', () => {
  it('three presses at three moments: each reel stops on the symbol that was on the line then, read left to right', async () => {
    // every strip starts on Red 7 and runs 5 symbols a second: x = 5 * seconds, the symbol nearest the line
    const h = open({ stopOrder: [2, 0, 1] });
    expect(armed(h)).toBe('2');
    expect(armedClass(h)).toBe('2');
    t = 650; // x = 3.25: the Skull
    h.press();
    expect(armed(h)).toBe('0');
    t = 1000; // x = 5: the Staff
    h.press();
    expect(armed(h)).toBe('1');
    t = 1450; // x = 7.25: the strip has wrapped; symbol 7 is symbol 1, the BAR
    h.press();
    expect(armed(h)).toBe('');
    const r = await h.result;
    expect(r.symbols).toEqual(['staff', 'bar', 'skull']); // reel 0, reel 1, reel 2: the order they were stopped in does not matter
    expect(r.threeOfAKind).toBe(false);
    expect(r.timeRemainingMs).toBe(12_000 - 1450);
  });

  it('a sweep: at every 37 ms from 0 to 2.4 s the symbol it stops on is the one nearest the line, 5 symbols a second', async () => {
    const strip = MAGIC;
    for (let ms = 0; ms <= 2400; ms += 37) {
      t = 0;
      const h = open({ phases: [0.4, 0.4, 0.4] });
      t = ms;
      h.press();
      h.press();
      h.press();
      const r = await h.result;
      const expected = strip[Math.round(0.4 + (5 * ms) / 1000) % 6]!;
      expect(r.symbols, `${ms} ms`).toEqual([expected, expected, expected]);
      expect(r.threeOfAKind).toBe(true);
    }
  });

  it('a press 99 ms either side of a symbol being dead centre gets it, 101 ms does not (200 ms a symbol)', async () => {
    const stopsAt = async (ms: number): Promise<string> => {
      t = 0;
      const h = open();
      t = ms;
      h.press();
      h.cancel();
      return h.el.querySelector<HTMLElement>('.ffx2-reels__reel[data-reel="0"]')!.dataset['sym']!;
    };
    // the Cherry is dead centre at 400 ms
    expect(await stopsAt(400)).toBe('cherry');
    expect(await stopsAt(301)).toBe('cherry');
    expect(await stopsAt(499)).toBe('cherry');
    expect(await stopsAt(299)).toBe('bar');
    expect(await stopsAt(501)).toBe('skull');
  });

  it('strips start where the layout says: three different phases give three different symbols at the same instant', async () => {
    const h = open({ phases: [0, 1.4, 3.1] });
    t = 100; // +0.5: a half, which goes to the symbol that is arriving
    h.press();
    h.press();
    h.press();
    const r = await h.result;
    // 0.5 -> 1 (bar); 1.9 -> 2 (cherry); 3.6 -> 4 (hat)
    expect(r.symbols).toEqual(['bar', 'cherry', 'hat']);
  });

  it('a fourth press once all three reels have stopped is ignored', async () => {
    const h = open();
    t = 410;
    h.press();
    h.press();
    h.press();
    t = 900;
    h.press();
    expect((await h.result).symbols).toEqual(['cherry', 'cherry', 'cherry']);
  });

  it('press(atMs) names the instant (ms since the spin began), whatever the clock says', async () => {
    const h = open();
    h.press(650);
    h.press(1000);
    h.press(1450);
    expect((await h.result).symbols).toEqual(['skull', 'staff', 'bar']);
  });

  it('three of a kind is reported, and a pair or a lone Cherry is not claimed by the overlay (the engine reads the pay table)', async () => {
    const three = open();
    t = 410;
    three.press();
    three.press();
    three.press();
    const r = await three.result;
    expect(r.threeOfAKind).toBe(true);
    expect(three.el.classList.contains('ffx2-reels--three')).toBe(true);

    t = 0;
    const mixed = open({ phases: [0, 0, 0] });
    t = 410;
    mixed.press();
    t = 610; // x = 3.05: the Skull
    mixed.press();
    t = 810; // x = 4.05: the Hat
    mixed.press();
    const m = await mixed.result;
    expect(m.symbols).toEqual(['cherry', 'skull', 'hat']);
    expect(m.threeOfAKind).toBe(false);
    expect(Object.keys(m).sort()).toEqual(['symbols', 'threeOfAKind', 'timeRemainingMs']);
  });
});

describe('the safety timer: the reels still running stop where they are', () => {
  it('after 12 s with one reel pressed, the other two stop on the symbol on the line at the deadline, and no time is left', async () => {
    const h = open({ stopOrder: [1, 2, 0], phases: [0.2, 1.1, 2.4] });
    t = 650; // reel 1: x = 1.1 + 3.25 = 4.35 -> the Hat
    h.press();
    t = 11_990;
    await vi.advanceTimersByTimeAsync(40);
    expect(h.el.isConnected).toBe(true); // 12 s has not run out
    t = 12_000;
    await vi.advanceTimersByTimeAsync(40);
    const r = await h.result;
    // reel 2 (x = 2.4 + 60 = 62.4 -> 62 -> index 2): the Cherry; reel 0 (x = 0.2 + 60 -> 60 -> 0): Red 7
    expect(r.symbols).toEqual(['red7', 'hat', 'cherry']);
    expect(r.timeRemainingMs).toBe(0);
  });

  it('is decided at the deadline, not when the timer got round to noticing it (here 5 s late)', async () => {
    const h = open({ phases: [0.2, 1.1, 2.4] });
    t = 12_000 + 5_000;
    await vi.advanceTimersByTimeAsync(40);
    // 60.2 -> symbol 0, 61.1 -> symbol 1, 62.4 -> symbol 2: where the strips stood at 12 s, not at 17 s
    expect((await h.result).symbols).toEqual(['red7', 'bar', 'cherry']);
  });

  it('a spin nobody presses is three reels stopped at the deadline; params.timerMs shortens it', async () => {
    const h = open({ timerMs: 1000, phases: [0, 0, 0] });
    t = 999;
    await vi.advanceTimersByTimeAsync(40);
    expect(h.el.dataset['stops']).toBeUndefined();
    t = 1000; // x = 5: the Staff on every reel
    await vi.advanceTimersByTimeAsync(40);
    expect((await h.result).symbols).toEqual(['staff', 'staff', 'staff']);
  });

  it('the default is 12 s and the bar under the title fills as it runs', async () => {
    const h = open();
    const fill = h.el.querySelector<HTMLElement>('.ffx2-reels__time > i')!;
    t = 3000;
    await vi.advanceTimersByTimeAsync(40);
    expect(Number.parseFloat(fill.style.width)).toBeCloseTo(25, 0);
    t = 6000;
    await vi.advanceTimersByTimeAsync(40);
    expect(Number.parseFloat(fill.style.width)).toBeCloseTo(50, 0);
    h.cancel();
  });
});

describe('the random half of a spin is the request’s (seeded), and the overlay draws nothing of its own when it has it', () => {
  it('reads the stop order and the phases off the layout, and publishes them for the browser checks', () => {
    const random = vi.spyOn(Math, 'random');
    const h = open({ stopOrder: [2, 1, 0], phases: [3.5, 4.5, 5.5] });
    const layout = JSON.parse(h.el.dataset['layout']!) as { strip: string[]; stopOrder: number[]; phases: number[]; timerMs: number };
    expect(layout.stopOrder).toEqual([2, 1, 0]);
    expect(layout.phases).toEqual([3.5, 4.5, 5.5]);
    expect(layout.strip).toEqual(MAGIC);
    expect(layout.timerMs).toBe(12_000);
    expect(h.el.dataset['t0']).toBe('0.00');
    expect(random).not.toHaveBeenCalled();
    h.cancel();
    random.mockRestore();
  });

  it('without a layout (a bare mount) it draws one from params.rng, the same each time for the same rng', () => {
    const make = (seed: number): string => {
      let s = seed;
      const rng = (): number => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
      const h = createLadyLuckReels(container, { symbols: MAGIC, now: () => t, rng });
      const layout = h.el.dataset['layout']!;
      h.cancel();
      return layout;
    };
    expect(make(5)).toBe(make(5));
    expect(make(5)).not.toBe(make(6));
    const parsed = JSON.parse(make(5)) as { stopOrder: number[]; phases: number[] };
    expect([...parsed.stopOrder].sort()).toEqual([0, 1, 2]);
    for (const p of parsed.phases) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(6);
    }
  });

  it('draws six pictures a reel, one per symbol, and a symbol it has no drawing for still shows as a labelled plate', () => {
    const h = open({ symbols: ['red7', 'bar', 'cherry', 'sword', 'helmet', 'paw'] });
    const reel = h.el.querySelector('.ffx2-reels__reel')!;
    expect([...reel.querySelectorAll('.ffx2-reels__cell')].map((c) => (c as HTMLElement).dataset['symbol'])).toEqual(['red7', 'bar', 'cherry', 'sword', 'helmet', 'paw']);
    expect(reel.querySelectorAll('.ffx2-reels__cell svg').length).toBe(6);
    h.cancel();
    const odd = open({ symbols: ['zzz', 'red7'] });
    expect(odd.el.querySelector('.ffx2-reels__cell svg text')?.textContent).toBe('ZZZ');
    odd.cancel();
  });

  it('shows the symbol on the line on each reel, frame by frame (data-sym), and the stops once they are made', async () => {
    const h = open({ phases: [0, 1, 2] });
    t = 410; // x = 2.05, 3.05, 4.05
    await vi.advanceTimersByTimeAsync(40);
    expect(symbolsOf(h)).toEqual(['cherry', 'skull', 'hat']);
    h.press();
    h.press();
    h.press();
    expect(h.el.dataset['stops']).toBe('cherry,skull,hat');
    await h.result;
  });
});

describe('keyboard', () => {
  it('Enter, NumpadEnter, Space and Z each stop a reel; R, Escape and the arrows do not', async () => {
    const h = open();
    t = 410;
    keydown('KeyR');
    keydown('Escape');
    keydown('ArrowDown');
    keydown('KeyE');
    expect(armed(h)).toBe('0');
    keydown('Enter');
    keydown('NumpadEnter');
    keydown('Space');
    expect(armed(h)).toBe('');
    expect((await h.result).symbols).toEqual(['cherry', 'cherry', 'cherry']);
    const z = open();
    keydown('KeyZ');
    expect(armed(z)).toBe('1');
    z.cancel();
  });

  it('the keys that stop a reel are exactly the keys Input reports as confirm', () => {
    const CODES = ['Enter', 'NumpadEnter', 'Space', 'KeyZ', 'KeyR', 'PageDown', 'KeyF', 'KeyX', 'Escape', 'Backspace', 'KeyQ', 'ShiftLeft', 'Tab', 'KeyE', 'KeyC', 'KeyM', 'KeyV', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
    const stopping: string[] = [];
    const confirm: string[] = [];
    for (const code of CODES) {
      const input = new Input({ keyboardTarget: window });
      input.attach();
      keydown(code);
      input.update();
      if (input.pressed('confirm')) confirm.push(code);
      input.detach();

      const h = open();
      keydown(code);
      if (armed(h) === '1') stopping.push(code);
      h.cancel();
    }
    expect(confirm).toEqual(['Enter', 'NumpadEnter', 'Space', 'KeyZ']);
    expect(stopping).toEqual(confirm);
  });

  it('a held key (auto-repeat) is one press, and the page does not scroll on Space', () => {
    const h = open();
    keydown('Enter');
    for (let i = 0; i < 5; i++) keydown('Enter', { repeat: true });
    expect(armed(h)).toBe('1');
    expect(keydown('Space').defaultPrevented).toBe(true);
    h.cancel();
  });

  it('names the key a keyboard player has, in the game’s own words for the confirm button', () => {
    const h = open();
    expect(subtitleOf(h)).toBe('PRESS ENTER TO STOP');
    expect(h.el.dataset['input']).toBe('keyboard');
    h.cancel();
  });

  it('an event’s own timestamp is the instant of the press when it is on the clock and recent; a stale or future one is not trusted', async () => {
    const withStamp = (ts: number): KeyboardEvent => {
      const e = new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true });
      Object.defineProperty(e, 'timeStamp', { value: ts });
      return e;
    };
    const h = open();
    t = 1000; // the clock reads x = 5 (the Staff) by the time the handler runs
    window.dispatchEvent(withStamp(840)); // the key went down 160 ms earlier, at x = 4.2: the Hat
    expect(h.el.querySelector<HTMLElement>('[data-reel="0"]')!.dataset['sym']).toBe('hat');
    window.dispatchEvent(withStamp(700)); // 300 ms old: the handler was badly late, so the clock is believed (the Staff)
    expect(h.el.querySelector<HTMLElement>('[data-reel="1"]')!.dataset['sym']).toBe('staff');
    window.dispatchEvent(withStamp(5000)); // from the future (another clock): ignored too
    expect(h.el.querySelector<HTMLElement>('[data-reel="2"]')!.dataset['sym']).toBe('staff');
    await h.result;
  });
});

describe('gamepad', () => {
  it('Cross (standard button 0) stops a reel once per press, and the words say CROSS', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const h = open();
    expect(subtitleOf(h)).toBe('PRESS CROSS TO STOP'); // a connected pad is the best guess before the first press
    t = 410;
    for (let i = 0; i < 3; i++) await tapPad(set, 0);
    expect(armed(h)).toBe('');
    expect(h.el.dataset['input']).toBe('gamepad');
    expect((await h.result).symbols).toEqual(['cherry', 'cherry', 'cherry']);
  });

  it('no other button stops one: Circle, the shoulders, Start and the d-pad', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const h = open();
    for (const index of [1, 2, 3, 4, 5, 8, 9, 12, 13, 14, 15]) await tapPad(set, index);
    expect(armed(h)).toBe('0');
    h.cancel();
  });

  it('a held Cross is one press, not a stream', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const h = open();
    set(0, true);
    await vi.advanceTimersByTimeAsync(600);
    expect(armed(h)).toBe('1');
    h.cancel();
  });

  it('the pad buttons that stop a reel are exactly the buttons Input reports as confirm', async () => {
    const confirm: number[] = [];
    const stopping: number[] = [];
    for (let index = 0; index < 17; index++) {
      const { pad, set } = makePad();
      stubPads([pad]);
      const input = new Input({ keyboardTarget: window });
      set(index, true);
      input.update();
      if (input.pressed('confirm')) confirm.push(index);
      set(index, false);
      const h = open();
      await tapPad(set, index);
      if (armed(h) === '1') stopping.push(index);
      h.cancel();
    }
    expect(confirm).toEqual([0]);
    expect(stopping).toEqual(confirm);
  });
});

describe('pointer (touch and mouse)', () => {
  it('a tap on the slab stops a reel, a touch screen is told TAP, and the tap is not passed on to what is under the slab', async () => {
    stubCoarsePointer(true);
    const h = open();
    expect(subtitleOf(h)).toBe('TAP TO STOP');
    t = 410;
    const first = pointerdown(h.el.querySelector('.ffx2-reels__win')!, 'touch'); // a tap lands on a child and bubbles
    pointerdown(h.el.querySelector('.ig-minigame__title')!, 'touch');
    pointerdown(h.el, 'touch');
    expect(first.defaultPrevented).toBe(true);
    expect(armed(h)).toBe('');
    expect(h.el.dataset['input']).toBe('pointer');
    expect((await h.result).symbols).toEqual(['cherry', 'cherry', 'cherry']);
  });

  it('a mouse click stops a reel too, and says CLICK; a right click does not', () => {
    const h = open();
    pointerdown(h.el, 'mouse', { button: 2 });
    expect(armed(h)).toBe('0');
    pointerdown(h.el, 'mouse');
    expect(armed(h)).toBe('1');
    expect(subtitleOf(h)).toBe('CLICK TO STOP');
    h.cancel();
  });

  it('once the last reel is stopped the slab lingers but takes no more pointer events, and comes off after 300 ms', async () => {
    const h = open();
    t = 410;
    h.press();
    h.press();
    h.press();
    await h.result;
    expect(h.el.style.pointerEvents).toBe('none');
    expect(h.el.isConnected).toBe(true);
    await vi.advanceTimersByTimeAsync(250);
    expect(h.el.isConnected).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(h.el.isConnected).toBe(false);
  });
});

describe('the words follow the input being used', () => {
  it('a keyboard player who taps is told TAP, and Enter takes it back; a pad takes it to CROSS', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const h = open({ phases: [0, 0, 0] });
    expect(subtitleOf(h)).toBe('PRESS CROSS TO STOP');
    keydown('Enter');
    expect(subtitleOf(h)).toBe('PRESS ENTER TO STOP');
    pointerdown(h.el, 'touch');
    expect(subtitleOf(h)).toBe('TAP TO STOP');
    await tapPad(set, 0);
    expect(subtitleOf(h)).toBe('PRESS CROSS TO STOP');
    expect(armed(h)).toBe('');
    await h.result;
  });
});

describe('the pause (raw input suspended)', () => {
  it('counts no press on any route while it is open', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const h = open();
    setRawInputSuspended(true);
    keydown('Enter');
    pointerdown(h.el, 'touch');
    await tapPad(set, 0);
    h.press();
    expect(armed(h)).toBe('0');
    setRawInputSuspended(false);
    keydown('Enter');
    expect(armed(h)).toBe('1');
    h.cancel();
  });

  it('stops the reels and the timer: five minutes of pause cost nothing and line nothing up', async () => {
    const h = open({ phases: [0, 0, 0] });
    t = 400; // x = 2: the Cherry
    await vi.advanceTimersByTimeAsync(40);
    setRawInputSuspended(true);
    await vi.advanceTimersByTimeAsync(40); // the clock notices the pause at 400 ms
    t = 400 + 300_000;
    await vi.advanceTimersByTimeAsync(40);
    expect(h.el.isConnected).toBe(true); // the 12 s did not run out while the pause was open
    expect(h.el.dataset['stops']).toBeUndefined();
    setRawInputSuspended(false);
    await vi.advanceTimersByTimeAsync(40); // the clock notices it is over, and the reels carry on from where they stood
    t = 400 + 300_000 + 250; // 250 ms of running since: x = 2 + 1.25 = 3.25 -> the Skull (not where five minutes would have put it)
    h.press();
    expect(h.el.querySelector<HTMLElement>('[data-reel="0"]')!.dataset['sym']).toBe('skull');
    h.cancel();
  });
});

describe('teardown', () => {
  it('finishing releases all three routes: nothing counts after the last stop, and the pad is no longer polled', async () => {
    const { pad, set } = makePad();
    stubPads([pad]);
    const removed = vi.spyOn(window, 'removeEventListener');
    const h = open();
    t = 410;
    h.press();
    h.press();
    h.press();
    await h.result;
    expect(removed.mock.calls.some(([type]) => type === 'keydown')).toBe(true);
    await vi.advanceTimersByTimeAsync(50);
    const after = padCalls;
    await vi.advanceTimersByTimeAsync(200);
    expect(padCalls).toBe(after);
    keydown('Enter');
    await tapPad(set, 0);
    pointerdown(h.el, 'touch');
    expect((await h.result).symbols).toEqual(['cherry', 'cherry', 'cherry']);
    removed.mockRestore();
  });

  it('cancel() releases the routes and takes the slab off the field without answering', async () => {
    const { pad } = makePad();
    stubPads([pad]);
    const h = open();
    h.cancel();
    expect(container.contains(h.el)).toBe(false);
    const after = padCalls;
    await vi.advanceTimersByTimeAsync(200);
    expect(padCalls).toBe(after);
    expect(() => keydown('Enter')).not.toThrow();
    let answered = false;
    void h.result.then(() => { answered = true; });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(answered).toBe(false);
  });
});
