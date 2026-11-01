// @vitest-environment jsdom
/**
 * r73-sinface (both games; shared plumbing, the keyboard path): fast-forward is held, and a keyboard tap that began and ended between two frames must not leave the presenter on `fast`.
 *
 * The REAL `Input` (real keydown and keyup events, the frame cycle `update` / `endFrame`) drives the REAL `FastForwardHold` against a presenter stand-in that keeps `BattlePresenter`'s own two rules
 * (`fastForward`: normal to fast, fast to skip; `setSpeed`). The review harness taps R with `page.keyboard.press` (the Bushido chip row has an R1 chip; `critic/runner/lib/route-minigame.mjs`), which dispatches
 * keydown and keyup back to back; `critic/reviews/4c01379d4-focused` Chapter XVIII then ran every action after Auron's Dragon Fang at `fast` (`docs/handoff/r73-sinface.md`).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Input, type InputSnapshot } from '../../src/app/Input.ts';
import { FastForwardHold } from '../../src/app/screens/FastForwardHold.ts';
import type { PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import { battleScreenSource } from './helpers/battleScreenSource.ts';

/** `BattlePresenterBase`'s two rules for the speed (`fastForward`: normal to fast, anything else to skip; `setSpeed`). */
class PresenterStandIn {
  speed: PlaybackSpeed = 'normal';
  fastForward(): void {
    this.speed = this.speed === 'normal' ? 'fast' : 'skip';
  }
  setSpeed(speed: PlaybackSpeed): void {
    this.speed = speed;
  }
}

let input: Input;
let now = 0;
const key = (type: 'keydown' | 'keyup', code = 'KeyR'): void => void window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));

beforeEach(() => {
  now = 0;
  input = new Input({ pointerRoot: document.body });
  input.attach();
});
afterEach(() => input.detach());

/** One displayed frame: the screen's `handleInput` runs on the frame's snapshot, then the frame ends. */
function frame(handle: (i: InputSnapshot) => void): void {
  now += 16.7;
  handle(input.update(now));
  input.endFrame();
}

/** The old two lines of `BattleScreenPause.handleInput`, kept here as the control. */
const legacy = (p: PresenterStandIn) => (i: InputSnapshot): void => {
  if (i.justPressed('r1')) p.fastForward();
  if (i.justReleased('r1')) p.setSpeed('normal');
};

describe('a tap of R shorter than a frame (keydown and keyup between two frames, as page.keyboard.press sends them)', () => {
  it('reads as a press and never as a release: the gap the pad closed in release 64 (Input.pendingRelease) and the keyboard did not', () => {
    key('keydown');
    key('keyup');
    let pressed = false;
    let released = false;
    let held = true;
    frame((i) => ((pressed = i.justPressed('r1')), (released = i.justReleased('r1')), (held = i.pressed('r1'))));
    expect({ pressed, released, held }).toEqual({ pressed: true, released: false, held: false });
    frame((i) => (released = i.justReleased('r1')));
    expect(released).toBe(false); // the next frame does not report it either
  });

  it('the old logic leaves the presenter on fast for good (the bug)', () => {
    const p = new PresenterStandIn();
    key('keydown');
    key('keyup');
    for (let n = 0; n < 5; n++) frame(legacy(p));
    expect(p.speed).toBe('fast');
  });

  it('FastForwardHold leaves it on normal: a tap that is no hold changes nothing', () => {
    const p = new PresenterStandIn();
    const hold = new FastForwardHold();
    key('keydown');
    key('keyup');
    for (let n = 0; n < 5; n++) frame((i) => hold.update(i, p));
    expect(p.speed).toBe('normal');
    expect(hold.active).toBe(false);
  });
});

describe('a real hold is unchanged', () => {
  it('fast while R is down, normal the frame it comes up, and the same on the next hold', () => {
    const p = new PresenterStandIn();
    const hold = new FastForwardHold();
    const seen: PlaybackSpeed[] = [];
    const run = (frames: number): void => {
      for (let n = 0; n < frames; n++) {
        frame((i) => hold.update(i, p));
        seen.push(p.speed);
      }
    };
    key('keydown');
    run(4);
    expect(seen).toEqual(['fast', 'fast', 'fast', 'fast']);
    key('keyup');
    run(2);
    expect(seen.slice(4)).toEqual(['normal', 'normal']);
    seen.length = 0;
    key('keydown');
    run(3);
    key('keyup');
    run(1);
    expect(seen).toEqual(['fast', 'fast', 'fast', 'normal']);
  });

  it('a release the input never reported (the key came up while the screen was not reading input) ends the hold on the next frame', () => {
    const p = new PresenterStandIn();
    const hold = new FastForwardHold();
    key('keydown');
    frame((i) => hold.update(i, p));
    expect(p.speed).toBe('fast');
    window.dispatchEvent(new Event('blur')); // the window lost focus: every button is released without an edge the screen can read (`Input.onBlur`)
    input.update(now + 16.7);
    input.endFrame(); // a frame the screen did not read (a pause, an overlay)
    frame((i) => hold.update(i, p));
    expect(p.speed).toBe('normal');
    expect(hold.active).toBe(false);
  });

  it('does nothing without a presenter and remembers nothing', () => {
    const hold = new FastForwardHold();
    key('keydown');
    frame((i) => hold.update(i, null));
    expect(hold.active).toBe(false);
  });
});

describe('the battle screen runs its fast-forward through the hold', () => {
  it('BattleScreenPause calls FastForwardHold.update and no longer ends the hold on justReleased alone', () => {
    const src = battleScreenSource();
    expect(src).toContain('this.fastHold.update(input, this.presenter)');
    expect(src).not.toMatch(/if \(input\.justReleased\('r1'\)\) this\.presenter\?\.setSpeed\('normal'\)/);
  });
});
