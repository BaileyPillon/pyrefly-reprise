// @vitest-environment jsdom
/**
 * Release 62, PR-0481 (the conference booth): a gamepad's A or Start ends the battle's opening sweep, as Enter does. BOTH games (shared presenter and input plumbing).
 *
 * Round 28 timed a pad visitor's A press to the first command at 12 to 14 s: the card took the pad's A (it is read through `Input`), but the opening's own watch
 * (`ui/common/transitions/confirmPress.ts`) listened for `keydown` only. The chain tested here is the real one except the screen: a fake pad -> the real `Input` -> `padEndsOpening`
 * (what `BattleScreen.handleInput` calls) -> the real `MomentOverlay` -> the real `playOpening`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Input } from '../../src/app/Input.ts';
import { padEndsOpening } from '../../src/app/screens/padOpeningSkip.ts';
import { playOpening } from '../../src/engine/OpeningSkip.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { PAD } from '../../src/app/padMap.ts';
import { confirmPress } from '../../src/ui/common/transitions/confirmPress.ts';
import { MomentOverlay } from '../../src/ui/common/transitions/MomentOverlay.ts';

const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
const pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02fd)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 };

let input: Input;
let overlay: MomentOverlay;
let clock = 1000;

/** One game frame: the real `Input` polls the pad and hands its snapshot on. */
function frame(): ReturnType<Input['update']> {
  clock += 16;
  const snap = input.update(clock);
  return snap;
}

function endFrame(): void {
  input.endFrame();
}

beforeEach(() => {
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
  for (const b of buttons) b.pressed = false;
  document.body.innerHTML = '<div id="ui"></div>';
  input = new Input({ pointerRoot: document.getElementById('ui') as HTMLElement });
  input.attach();
  overlay = new MomentOverlay(document.getElementById('ui') as HTMLElement);
  // The page's first frame: the pad is connected and nothing is down.
  frame();
  endFrame();
});

afterEach(() => {
  input.detach();
  overlay.dispose();
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
});

/** A press of pad button `i`: down on one frame (the edge), up on the next. Returns whether the opening was ended on the edge frame. */
function tap(i: number): boolean {
  buttons[i]!.pressed = true;
  const snap = frame();
  const ended = padEndsOpening(snap, overlay);
  endFrame();
  buttons[i]!.pressed = false;
  frame();
  endFrame();
  return ended;
}

describe('confirmPress.press()', () => {
  it('counts a press that did not arrive as a key, and a key still counts', async () => {
    const a = confirmPress(window);
    let seen = false;
    void a.pressed.then(() => (seen = true));
    await Promise.resolve();
    expect(seen).toBe(false);
    a.press();
    await a.pressed;
    expect(seen).toBe(true);
    a.dispose();

    const b = confirmPress(window);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await b.pressed; // resolves: the keyboard path is as it was
    b.dispose();
  });
});

describe('MomentOverlay: the openings waiting for a Confirm', () => {
  it('knows when an opening is waiting, ends it on pressConfirm, and forgets it on dispose', async () => {
    expect(overlay.confirmWaiting).toBe(false);
    expect(overlay.pressConfirm()).toBe(false); // nobody waiting: nothing to end
    const watch = overlay.confirmPress();
    expect(overlay.confirmWaiting).toBe(true);
    expect(overlay.pressConfirm()).toBe(true);
    await watch.pressed;
    watch.dispose();
    expect(overlay.confirmWaiting).toBe(false);
  });

  it('a key still ends it through the overlay, as before', async () => {
    const watch = overlay.confirmPress();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    await watch.pressed;
    watch.dispose();
    expect(overlay.confirmWaiting).toBe(false);
  });
});

describe('padEndsOpening (what BattleScreen.handleInput calls)', () => {
  it('A ends the opening and the edge is taken', () => {
    const watch = overlay.confirmPress();
    buttons[PAD.A]!.pressed = true;
    const snap = frame();
    expect(padEndsOpening(snap, overlay)).toBe(true);
    expect(snap.justPressed('confirm')).toBe(false); // taken: nothing else on this frame sees it
    watch.dispose();
  });

  it('Start ends the opening and is taken, so it does not also open the pause', () => {
    const watch = overlay.confirmPress();
    buttons[PAD.START]!.pressed = true;
    const snap = frame();
    expect(snap.justPressed('start')).toBe(true);
    expect(padEndsOpening(snap, overlay)).toBe(true);
    expect(snap.justPressed('start')).toBe(false);
    watch.dispose();
  });

  it('A and Start together take both edges', () => {
    const watch = overlay.confirmPress();
    buttons[PAD.A]!.pressed = true;
    buttons[PAD.START]!.pressed = true;
    const snap = frame();
    expect(padEndsOpening(snap, overlay)).toBe(true);
    expect(snap.justPressed('confirm')).toBe(false);
    expect(snap.justPressed('start')).toBe(false);
    watch.dispose();
  });

  it('does nothing while no opening is waiting, and leaves the edge for the screen', () => {
    buttons[PAD.A]!.pressed = true;
    const snap = frame();
    expect(padEndsOpening(snap, overlay)).toBe(false);
    expect(snap.justPressed('confirm')).toBe(true);
  });

  it('other pad buttons (B, the d-pad, X, Y) do not end it', () => {
    const watch = overlay.confirmPress();
    for (const i of [PAD.B, PAD.X, PAD.Y, PAD.LB, PAD.RB, PAD.UP, PAD.DOWN, PAD.LEFT, PAD.RIGHT]) expect(tap(i)).toBe(false);
    expect(overlay.confirmWaiting).toBe(true);
    watch.dispose();
  });

  it('a keyboard press is not this path: the key already reached the watch, and E / C (start) are the enemy-move slab\'s', () => {
    const watch = overlay.confirmPress();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' }));
    const snap = frame();
    expect(snap.lastDevice).toBe('keyboard');
    expect(padEndsOpening(snap, overlay)).toBe(false);
    expect(snap.justPressed('start')).toBe(true); // left for the slab
    watch.dispose();
  });

  it('no overlay (FF7 has none) is nothing to do', () => {
    buttons[PAD.A]!.pressed = true;
    expect(padEndsOpening(frame(), null)).toBe(false);
  });

  it('a button still held from before the opening is not a press', () => {
    buttons[PAD.A]!.pressed = true;
    frame(); // the card took this edge
    endFrame();
    const watch = overlay.confirmPress(); // the opening starts with A still down
    const snap = frame();
    expect(padEndsOpening(snap, overlay)).toBe(false);
    watch.dispose();
  });
});

describe('the real playOpening, ended by a pad', () => {
  function ctxFor(moments: MomentOverlay, calls: string[]): EventCtx {
    const mom = { hurry: false, pick: () => 'idle' };
    return {
      speed: () => 'normal',
      moments: mom,
      stage: { camera: { snapTo: (r: string) => calls.push(`snap:${r}`), release: async (ms: number) => void calls.push(`release:${ms}`) } },
      deps: { moments: { takeOpeningHurry: () => false, confirmPress: () => moments.confirmPress(), clear: () => calls.push('clear') } },
    } as unknown as EventCtx;
  }

  it('A cuts the sweep to the idle shot and collapses every wait left, like Enter', async () => {
    const calls: string[] = [];
    const ctx = ctxFor(overlay, calls);
    let ended = false;
    const opening = playOpening(ctx, () => new Promise<void>((resolve) => {
      const poll = setInterval(() => {
        if ((ctx.moments as unknown as { hurry: boolean }).hurry) {
          ended = true;
          clearInterval(poll);
          resolve();
        }
      }, 2);
    }));
    await new Promise((r) => setTimeout(r, 20));
    expect(ended).toBe(false);
    expect(overlay.confirmWaiting).toBe(true);
    expect(tap(PAD.A)).toBe(true);
    await opening;
    expect(ended).toBe(true);
    expect(calls).toContain('snap:idle');
    expect(calls).toContain('clear');
    expect(overlay.confirmWaiting).toBe(false); // the watch is disposed with the opening
  });

  it('Start does the same', async () => {
    const calls: string[] = [];
    const ctx = ctxFor(overlay, calls);
    const opening = playOpening(ctx, () => new Promise<void>((resolve) => {
      const poll = setInterval(() => {
        if ((ctx.moments as unknown as { hurry: boolean }).hurry) {
          clearInterval(poll);
          resolve();
        }
      }, 2);
    }));
    await new Promise((r) => setTimeout(r, 10));
    expect(tap(PAD.START)).toBe(true);
    await opening;
    expect(calls).toContain('snap:idle');
  });
});
