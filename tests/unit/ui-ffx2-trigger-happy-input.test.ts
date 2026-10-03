// @vitest-environment jsdom
/**
 * FOC37-02 (FFX-2 only): Trigger Happy's press count decides the damage (release 37), so a keyboard,
 * a pad and a finger must all be able to press, and the overlay must say which button each one has.
 * Round 20 measured Enter, touch and pad all resolving to 0 hits (one 118 hit); R alone worked.
 *
 * Every route is driven the way the page drives it: real `KeyboardEvent`s on `window`, the Gamepad
 * API's `navigator.getGamepads()` polled from `requestAnimationFrame` (so a pad dispatches no event
 * at all), and `PointerEvent`s on the slab. The abstract button is pinned against the real
 * `src/app/Input.ts`: the overlay counts exactly the presses `Input` reports as `r1`.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../../src/app/Input.ts';
import { setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';
import { createTriggerHappy, type TriggerHappyHandle } from '../../src/ui/ffx2/TriggerHappy.ts';

// ---------------------------------------------------------------- helpers

function keydown(code: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
}

function pointerdown(el: Element, pointerType: string): PointerEvent {
  const e = new PointerEvent('pointerdown', { pointerType, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
}

const hitsOf = (h: TriggerHappyHandle): number => {
  const m = /(\d+) HITS?/.exec(h.el.querySelector('.ig-minigame__bonus')?.textContent ?? '');
  return m ? Number(m[1]) : -1;
};
const subtitleOf = (h: TriggerHappyHandle): string => h.el.querySelector('.ig-minigame__subtitle')?.textContent ?? '';

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

describe('Trigger Happy: every input can press (FOC37-02)', () => {
  let container: HTMLElement;
  const savedPointerEvent = window.PointerEvent;

  beforeEach(() => {
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

  // ---------------------------------------------------------------- keyboard

  describe('keyboard', () => {
    it('R and PageDown each press once; Enter, Space and Z do not', async () => {
      const h = createTriggerHappy(container, { windowMs: 1000 });
      keydown('KeyR');
      keydown('PageDown');
      expect(hitsOf(h)).toBe(2);
      keydown('Enter');
      keydown('Space');
      keydown('KeyZ');
      keydown('NumpadEnter');
      expect(hitsOf(h)).toBe(2);
      await vi.advanceTimersByTimeAsync(1050);
      expect((await h.result).hits).toBe(2);
    });

    it('three presses give three hits and twelve give twelve (the live measurement)', async () => {
      const three = createTriggerHappy(container, { windowMs: 1000 });
      for (let i = 0; i < 3; i++) keydown('KeyR');
      await vi.advanceTimersByTimeAsync(1050);
      expect((await three.result).hits).toBe(3);

      const twelve = createTriggerHappy(container, { windowMs: 1000 });
      for (let i = 0; i < 12; i++) keydown('KeyR');
      await vi.advanceTimersByTimeAsync(1050);
      expect((await twelve.result).hits).toBe(12);
    });

    it('a held key (auto-repeat) is one press', () => {
      const h = createTriggerHappy(container, { windowMs: 1000 });
      keydown('KeyR');
      for (let i = 0; i < 5; i++) keydown('KeyR', { repeat: true });
      expect(hitsOf(h)).toBe(1);
      h.cancel();
    });

    it('names the key a keyboard player has', () => {
      const h = createTriggerHappy(container, { windowMs: 1000 });
      expect(subtitleOf(h)).toBe('MASH R');
      expect(h.el.dataset['input']).toBe('keyboard');
      h.cancel();
    });
  });

  // ------------------------------------------------------------------ gamepad

  describe('gamepad', () => {
    it('R1 (standard button 5) presses once per press, three give three, and the words say R1', async () => {
      const { pad, set } = makePad();
      stubPads([pad]);
      const h = createTriggerHappy(container, { windowMs: 1500 });
      expect(subtitleOf(h)).toBe('MASH R1'); // a connected pad is the best guess before the first press
      for (let i = 0; i < 3; i++) await tapPad(set, 5);
      expect(hitsOf(h)).toBe(3);
      expect(h.el.dataset['input']).toBe('gamepad');
      await vi.advanceTimersByTimeAsync(1500);
      expect((await h.result).hits).toBe(3);
    });

    it('twelve pad presses give twelve', async () => {
      const { pad, set } = makePad();
      stubPads([pad]);
      const h = createTriggerHappy(container, { windowMs: 3000 });
      for (let i = 0; i < 12; i++) await tapPad(set, 5);
      await vi.advanceTimersByTimeAsync(3000);
      expect((await h.result).hits).toBe(12);
    });

    it('Cross, Circle, L1 and the d-pad press nothing', async () => {
      const { pad, set } = makePad();
      stubPads([pad]);
      const h = createTriggerHappy(container, { windowMs: 1500 });
      for (const index of [0, 1, 3, 4, 8, 9, 12, 13, 14, 15]) await tapPad(set, index);
      expect(hitsOf(h)).toBe(0);
      h.cancel();
    });

    it('a held R1 is one press, not a stream', async () => {
      const { pad, set } = makePad();
      stubPads([pad]);
      const h = createTriggerHappy(container, { windowMs: 1500 });
      set(5, true);
      await vi.advanceTimersByTimeAsync(600);
      expect(hitsOf(h)).toBe(1);
      h.cancel();
    });

    it('a press while input is suspended (the pause is open) counts nothing, on every route', async () => {
      const { pad, set } = makePad();
      stubPads([pad]);
      const h = createTriggerHappy(container, { windowMs: 1500 });
      setRawInputSuspended(true);
      await tapPad(set, 5);
      keydown('KeyR');
      pointerdown(h.el, 'touch');
      expect(hitsOf(h)).toBe(0);
      setRawInputSuspended(false);
      await tapPad(set, 5);
      expect(hitsOf(h)).toBe(1);
      h.cancel();
    });
  });

  // ------------------------------------------------------------------ pointer

  describe('pointer (touch and mouse)', () => {
    it('three taps on the slab give three hits and a touch screen is told TAP', async () => {
      stubCoarsePointer(true);
      const h = createTriggerHappy(container, { windowMs: 1500 });
      expect(subtitleOf(h)).toBe('MASH TAP');
      for (let i = 0; i < 3; i++) pointerdown(h.el.querySelector('.ig-minigame__title')!, 'touch'); // a tap lands on a child and bubbles
      expect(hitsOf(h)).toBe(3);
      expect(h.el.dataset['input']).toBe('pointer');
      await vi.advanceTimersByTimeAsync(1600);
      expect((await h.result).hits).toBe(3);
    });

    it('a tap is cancelled so the touch does not also click through to what is under the slab', () => {
      const h = createTriggerHappy(container, { windowMs: 1000 });
      expect(pointerdown(h.el, 'touch').defaultPrevented).toBe(true);
      h.cancel();
    });

    it('a mouse click presses too, and says CLICK', () => {
      const h = createTriggerHappy(container, { windowMs: 1000 });
      pointerdown(h.el, 'mouse');
      expect(hitsOf(h)).toBe(1);
      expect(subtitleOf(h)).toBe('MASH CLICK');
      h.cancel();
    });

    it('stops taking pointer events once the window has closed, and counts nothing late', async () => {
      const h = createTriggerHappy(container, { windowMs: 400 });
      pointerdown(h.el, 'touch');
      await vi.advanceTimersByTimeAsync(450);
      expect((await h.result).hits).toBe(1);
      expect(h.el.style.pointerEvents).toBe('none'); // the slab lingers 300 ms; a late tap belongs to what is under it
      pointerdown(h.el, 'touch');
      expect(hitsOf(h)).toBe(1);
    });

    it('the slab takes pointer events back from its host layer, and sits above the HUD cards', () => {
      const css = readFileSync('src/ui/ffx2/minigames.css', 'utf8');
      const rule = /\.ffx2-trigger\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
      expect(rule).toMatch(/pointer-events:\s*auto/);
      expect(rule).toMatch(/touch-action:\s*manipulation/);
      const z = Number(/z-index:\s*(\d+)/.exec(rule)?.[1]);
      // Above the intent slab (2), the guide (3), the advisor (4) and the phone's guide chip (12); below the phone's pause chip (40).
      expect(z).toBeGreaterThan(12);
      expect(z).toBeLessThan(30);
      // The Lady Luck reels' slab keeps the layer it had.
      expect(/\.ffx2-reels[^{]*\{[^}]*z-index/.test(css)).toBe(false);
    });
  });

  // -------------------------------------------- the abstract button is Input's

  describe('the bound button is the abstract r1 of src/app/Input.ts', () => {
    const CODES = ['KeyR', 'PageDown', 'KeyF', 'PageUp', 'Enter', 'NumpadEnter', 'Space', 'KeyZ', 'KeyX', 'Escape', 'KeyQ', 'ShiftLeft', 'Tab', 'KeyE', 'KeyC', 'KeyM', 'KeyV', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Backspace'];

    it('the keys that press are exactly the keys Input reports as r1', () => {
      const pressing: string[] = [];
      const r1: string[] = [];
      for (const code of CODES) {
        const input = new Input({ keyboardTarget: window });
        input.attach();
        keydown(code);
        input.update();
        if (input.pressed('r1')) r1.push(code);
        input.detach();

        const h = createTriggerHappy(container, { windowMs: 1000 });
        keydown(code);
        if (hitsOf(h) === 1) pressing.push(code);
        h.cancel();
      }
      expect(r1).toEqual(['KeyR', 'PageDown']);
      expect(pressing).toEqual(r1);
    });

    it('the pad buttons that press are exactly the buttons Input reports as r1', async () => {
      const r1: number[] = [];
      const pressing: number[] = [];
      for (let index = 0; index < 17; index++) {
        const { pad, set } = makePad();
        stubPads([pad]);

        const input = new Input({ keyboardTarget: window });
        set(index, true);
        input.update();
        if (input.pressed('r1')) r1.push(index);
        set(index, false);

        const h = createTriggerHappy(container, { windowMs: 1500 });
        await tapPad(set, index);
        if (hitsOf(h) === 1) pressing.push(index);
        h.cancel();
      }
      expect(r1).toEqual([5]);
      expect(pressing).toEqual(r1);
    });
  });

  // ------------------------------------------- the words follow the active input

  describe('the words name the input being used', () => {
    it('a keyboard player who taps is told TAP, and R takes it back', () => {
      const h = createTriggerHappy(container, { windowMs: 1500 });
      expect(subtitleOf(h)).toBe('MASH R');
      pointerdown(h.el, 'touch');
      vi.advanceTimersByTime(40); // the ticker redraws; a press redraws at once
      expect(subtitleOf(h)).toBe('MASH TAP');
      keydown('KeyR');
      expect(subtitleOf(h)).toBe('MASH R');
      h.cancel();
    });

    it('a pad player on a keyboard machine is told R1 once R1 has pressed', async () => {
      const { pad, set } = makePad();
      stubPads([pad]);
      const h = createTriggerHappy(container, { windowMs: 1500 });
      keydown('KeyR');
      expect(subtitleOf(h)).toBe('MASH R');
      await tapPad(set, 5);
      expect(subtitleOf(h)).toBe('MASH R1');
      h.cancel();
    });
  });

  // ------------------------------------------------------------------- guard

  describe('an input with no way to press here never answers 0', () => {
    it('a touch screen with no Pointer Events takes the release-36 roll (6 to 16), not a silent 0', async () => {
      stubCoarsePointer(true);
      // @ts-expect-error simulate a browser that has no Pointer Events
      window.PointerEvent = undefined;
      const h = createTriggerHappy(container, { windowMs: 400 });
      await vi.advanceTimersByTimeAsync(450);
      const { hits } = await h.result;
      expect(hits).toBeGreaterThanOrEqual(6);
      expect(hits).toBeLessThanOrEqual(16);
    });

    it('but a player who presses nothing on an input that works still gets 0 (the faithful rule)', async () => {
      stubCoarsePointer(true);
      const h = createTriggerHappy(container, { windowMs: 400 });
      await vi.advanceTimersByTimeAsync(450);
      expect((await h.result).hits).toBe(0);
    });

    it('and one real press is never overruled by the roll', async () => {
      stubCoarsePointer(true);
      // @ts-expect-error simulate a browser that has no Pointer Events
      window.PointerEvent = undefined;
      const h = createTriggerHappy(container, { windowMs: 400 });
      h.press();
      await vi.advanceTimersByTimeAsync(450);
      expect((await h.result).hits).toBe(1);
    });
  });

  // ---------------------------------------------------------------- teardown

  describe('teardown', () => {
    it('the window closing releases all three routes', async () => {
      const { pad, set } = makePad();
      stubPads([pad]);
      const removed = vi.spyOn(window, 'removeEventListener');
      const h = createTriggerHappy(container, { windowMs: 300 });
      await vi.advanceTimersByTimeAsync(350);
      await h.result;
      expect(removed.mock.calls.some(([type]) => type === 'keydown')).toBe(true);
      const after = padCalls;
      await vi.advanceTimersByTimeAsync(200);
      expect(padCalls).toBe(after); // the pad is no longer polled
      keydown('KeyR');
      await tapPad(set, 5);
      pointerdown(h.el, 'touch');
      expect((await h.result).hits).toBe(0);
      removed.mockRestore();
    });

    it('cancel() releases all three routes and takes the slab off the field', async () => {
      const { pad } = makePad();
      stubPads([pad]);
      const h = createTriggerHappy(container, { windowMs: 1500 });
      h.cancel();
      expect(container.contains(h.el)).toBe(false);
      const after = padCalls;
      await vi.advanceTimersByTimeAsync(200);
      expect(padCalls).toBe(after);
      expect(() => keydown('KeyR')).not.toThrow();
    });
  });
});
