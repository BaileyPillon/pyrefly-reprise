import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BUTTONS, Input, type InputSnapshot } from '../../src/app/Input.ts';

/**
 * `Input` only needs two event targets and a `window` for blur/gamepad; the
 * node environment has neither, so this is the smallest stub that lets the real
 * class run unmodified.
 */
class FakeTarget implements EventTarget {
  readonly handlers = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (typeof listener !== 'function') return;
    const set = this.handlers.get(type) ?? new Set<EventListener>();
    set.add(listener);
    this.handlers.set(type, set);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (typeof listener !== 'function') return;
    this.handlers.get(type)?.delete(listener);
  }

  dispatchEvent(): boolean {
    return true;
  }

  fire(type: string, event: unknown): void {
    for (const handler of this.handlers.get(type) ?? []) handler(event as Event);
  }
}

const keyEvent = (code: string): unknown => ({ code, repeat: false, preventDefault: () => {} });

let keyboard: FakeTarget;
let pointer: FakeTarget;
let input: Input;
let savedWindow: unknown;

beforeEach(() => {
  keyboard = new FakeTarget();
  pointer = new FakeTarget();
  savedWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = new FakeTarget();
  input = new Input({
    keyboardTarget: keyboard,
    pointerRoot: pointer as unknown as HTMLElement,
  });
  input.attach();
});

afterEach(() => {
  input.detach();
  (globalThis as { window?: unknown }).window = savedWindow;
});

/**
 * One game frame: sample, read what the screen would read, then roll the edges
 * forward. The read has to happen before `endFrame()`, exactly as in `App.step`.
 */
function frame<T>(nowMs: number, read: (snap: InputSnapshot) => T): T {
  const value = read(input.update(nowMs));
  input.endFrame();
  return value;
}

describe('Input', () => {
  it('maps M to select', () => {
    expect(BUTTONS).toContain('select');
    keyboard.fire('keydown', keyEvent('KeyM'));
    const snap = input.update(0);
    expect(snap.justPressed('select')).toBe(true);
    expect(snap.pressed('select')).toBe(true);
    input.endFrame();
    expect(input.update(16).justPressed('select')).toBe(false);
  });

  it('still reports a tap that goes down and up between two frames', () => {
    // Playwright's keyboard.press() and very fast real taps do exactly this.
    frame(0, () => undefined);
    keyboard.fire('keydown', keyEvent('KeyM'));
    keyboard.fire('keyup', keyEvent('KeyM'));
    const snap = input.update(16);
    expect(snap.justPressed('select')).toBe(true);
    expect(snap.pressed('select')).toBe(false);
    input.endFrame();
    expect(input.update(32).justPressed('select')).toBe(false);
  });

  it('does not repeat a held non-direction button', () => {
    keyboard.fire('keydown', keyEvent('KeyZ'));
    expect(frame(0, (s) => s.justPressed('confirm'))).toBe(true);
    for (let t = 16; t < 2000; t += 16) {
      expect(input.update(t).justPressed('confirm'), `t=${t}`).toBe(false);
      input.endFrame();
    }
  });

  it('auto-repeats a held direction after the delay', () => {
    keyboard.fire('keydown', keyEvent('ArrowRight'));
    expect(frame(0, (s) => s.justPressed('right'))).toBe(true);
    let edges = 0;
    for (let t = 16; t <= 1200; t += 16) {
      if (input.update(t).justPressed('right')) edges++;
      input.endFrame();
    }
    expect(edges).toBeGreaterThan(3);
  });

  it('consume() hides an edge from the rest of the frame', () => {
    keyboard.fire('keydown', keyEvent('KeyZ'));
    const snap = input.update(0);
    expect(snap.consume('confirm')).toBe(true);
    expect(snap.justPressed('confirm')).toBe(false);
  });

  it('releases everything on blur', () => {
    keyboard.fire('keydown', keyEvent('KeyZ'));
    frame(0, () => undefined);
    const win = (globalThis as unknown as { window: FakeTarget }).window;
    win.fire('blur', {});
    expect(frame(16, (s) => s.pressed('confirm'))).toBe(false);
  });
});
