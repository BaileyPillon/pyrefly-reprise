import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../../src/app/Input.ts';
import { msSincePadActivity, notePadActivity, resetPadActivity } from '../../src/app/padActivity.ts';
import { PAD } from '../../src/app/padMap.ts';

/**
 * r64-fixes (both games; the conference demo's swallowed picker presses). The pad is read once a frame, and a press that began and ended inside the gap between two frames was never seen
 * (measured: a 106 ms RIGHT with no frame inside it, the page's frame interval 367 ms, the main thread free). `Input.sample` reads the pad between frames (a 4 ms timer while a pad is connected):
 * a press seen there is reported by the next frame, and its release by the frame after.
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
}

const pad = { index: 0, id: 'Xbox pad', connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
const setDown = (i: number, down: boolean): void => {
  pad.buttons[i]!.pressed = down;
};

let input: Input;
let savedWindow: unknown;
let savedNav: PropertyDescriptor | undefined;

/** One game frame, as `App.step` runs it: update, read, endFrame. */
const frame = (read: (i: Input) => void): void => {
  input.update(performance.now());
  read(input);
  input.endFrame();
};

beforeEach(() => {
  vi.useFakeTimers();
  resetPadActivity();
  for (const b of pad.buttons) b.pressed = false;
  savedWindow = (globalThis as { window?: unknown }).window;
  savedNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  (globalThis as { window?: unknown }).window = new FakeTarget();
  Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [pad, null, null, null] }, configurable: true });
  input = new Input({ keyboardTarget: new FakeTarget(), pointerRoot: new FakeTarget() as unknown as HTMLElement });
  input.attach();
});

afterEach(() => {
  input.detach();
  vi.useRealTimers();
  (globalThis as { window?: unknown }).window = savedWindow;
  if (savedNav) Object.defineProperty(globalThis, 'navigator', savedNav);
  else delete (globalThis as { navigator?: unknown }).navigator;
});

describe('a pad press that begins and ends between two frames', () => {
  it('is lost by a frame-only read (the old behaviour, for reference): nothing to see at the next frame', () => {
    frame(() => {}); // a first frame, with the pad connected
    input.detach(); // no sampler
    input.attach();
    setDown(PAD.RIGHT, true);
    setDown(PAD.RIGHT, false); // down and up inside the gap, no poll in it
    let seen = false;
    frame((i) => void (seen = i.justPressed('right')));
    expect(seen).toBe(false);
  });

  it('is reported by the next frame when the background sample saw it down, and its release by the frame after', () => {
    frame(() => {}); // starts the 4 ms sampler (a pad is connected)
    setDown(PAD.RIGHT, true);
    vi.advanceTimersByTime(8); // the sampler reads the pad: down
    setDown(PAD.RIGHT, false);
    vi.advanceTimersByTime(8); // and reads it again: up
    const log: string[] = [];
    frame((i) => log.push(`f1 pressed=${i.pressed('right')} just=${i.justPressed('right')} rel=${i.justReleased('right')}`));
    frame((i) => log.push(`f2 pressed=${i.pressed('right')} just=${i.justPressed('right')} rel=${i.justReleased('right')}`));
    frame((i) => log.push(`f3 pressed=${i.pressed('right')} just=${i.justPressed('right')} rel=${i.justReleased('right')}`));
    expect(log).toEqual([
      'f1 pressed=true just=true rel=false',
      'f2 pressed=false just=false rel=true',
      'f3 pressed=false just=false rel=false',
    ]);
  });

  it('a press held across frames is one press and one release, as before', () => {
    frame(() => {});
    setDown(PAD.A, true);
    vi.advanceTimersByTime(8);
    const log: string[] = [];
    frame((i) => log.push(`${i.justPressed('confirm')}/${i.pressed('confirm')}`));
    frame((i) => log.push(`${i.justPressed('confirm')}/${i.pressed('confirm')}`));
    setDown(PAD.A, false);
    vi.advanceTimersByTime(8); // seen up between frames, after a frame had already reported the press: released at once
    frame((i) => log.push(`${i.justReleased('confirm')}/${i.pressed('confirm')}`));
    expect(log).toEqual(['true/true', 'false/true', 'true/false']);
  });

  it('pressed again before the frame that reports the first tap: still one press, held (no stuck release)', () => {
    frame(() => {});
    setDown(PAD.B, true);
    vi.advanceTimersByTime(8);
    setDown(PAD.B, false);
    vi.advanceTimersByTime(8);
    setDown(PAD.B, true); // the second press, same gap
    vi.advanceTimersByTime(8);
    const log: string[] = [];
    frame((i) => log.push(`${i.justPressed('cancel')}/${i.pressed('cancel')}`));
    frame((i) => log.push(`${i.justPressed('cancel')}/${i.pressed('cancel')}`));
    setDown(PAD.B, false);
    vi.advanceTimersByTime(8);
    frame((i) => log.push(`${i.justReleased('cancel')}/${i.pressed('cancel')}`));
    expect(log).toEqual(['true/true', 'false/true', 'true/false']);
  });

  it('the sampler stops with detach', () => {
    frame(() => {});
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    input.detach();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('the pad activity clock the demo warm waits on', () => {
  it('a press stamps it', () => {
    frame(() => {});
    expect(msSincePadActivity(1000)).toBe(Number.POSITIVE_INFINITY);
    setDown(PAD.LEFT, true);
    vi.advanceTimersByTime(8);
    expect(msSincePadActivity(performance.now())).toBeLessThan(50);
  });

  it('notePadActivity is a plain stamp', () => {
    notePadActivity(100);
    expect(msSincePadActivity(350)).toBe(250);
  });
});
