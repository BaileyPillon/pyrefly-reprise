// @vitest-environment jsdom
/**
 * PR-0220 (critic round 15, R15-AUD-02): a gamepad-only player heard nothing
 * until they touched the keyboard, mouse or screen, because the only unlock
 * listeners were `pointerdown`, `keydown` and `touchstart`.
 *
 * Game case: both (shared audio plumbing; CHK-020).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { installPadUnlock, type PadUnlockPort } from '../../src/audio/padUnlock.ts';

function fakePad(pressed: boolean): Gamepad {
  return {
    connected: true,
    buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed && i === 0, touched: false, value: 0 })),
    axes: [0, 0, 0, 0],
  } as unknown as Gamepad;
}

describe('PR-0220: the first pad press starts the audio', () => {
  const frames: Array<() => void> = [];
  let pads: Array<Gamepad | null> = [];
  afterEach(() => {
    vi.unstubAllGlobals();
    frames.length = 0;
  });

  function stubs(): void {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
  }
  const step = (): void => {
    const cb = frames.shift();
    cb?.();
  };

  it('does nothing while no button is pressed, unlocks on the first press, and stops once running', () => {
    stubs();
    const port: PadUnlockPort & { calls: number; context: { state: string } | null } = {
      calls: 0,
      context: null,
      unlock() {
        port.calls++;
        port.context = { state: 'running' };
        return true;
      },
    };
    pads = [fakePad(false)];
    installPadUnlock(port);
    step();
    step();
    expect(port.calls).toBe(0);
    expect(frames.length).toBe(1);

    pads = [fakePad(true)];
    step();
    expect(port.calls).toBe(1);
    expect(frames.length).toBe(0); // the loop has ended
  });

  it('keeps trying while the context stays suspended (a browser that grants no activation from a pad)', () => {
    stubs();
    const port: PadUnlockPort & { calls: number; context: { state: string } | null } = {
      calls: 0,
      context: null,
      unlock() {
        port.calls++;
        port.context = { state: 'suspended' };
        return true;
      },
    };
    pads = [fakePad(true)];
    installPadUnlock(port);
    step();
    step();
    expect(port.calls).toBe(2);
    expect(frames.length).toBe(1);
    port.context = { state: 'running' }; // a key press resumed it
    step();
    expect(frames.length).toBe(0);
  });
});
