// @vitest-environment jsdom
/**
 * **The press that dismisses an overlay must die with the overlay.**
 *
 * The first build of Auron's briefing shipped a leak an adversarial pass caught
 * on the running game: the briefing printed `Enter / Esc Skip`, both keys took
 * it down, and one frame later the screen *behind* it acted on the very same
 * press — Enter walked a first-timer past the chapter board into party prep,
 * Escape backed the board out to the title, and the pause replay re-raised
 * itself forever because confirm reached `PauseScreen.handleAction` after the
 * briefing had already resolved.
 *
 * The cause was not in the briefing. `Input.claimKeyboard` stopped the **DOM
 * event** in the capture phase but still latched the **abstract button**, so
 * `justPressed('confirm')` was true for everyone downstream. A gamepad had a
 * worse version of it: the pad is polled inside `Input.update()` and by the
 * overlay's own `requestAnimationFrame`, and whichever ran first decided
 * whether the screen behind saw the press.
 *
 * So this file asserts the property, not the implementation: **while an
 * exclusive claim is up, and for one frame after it is handed back, no screen
 * sees any button at all** — on keyboard and on the pad.
 *
 * Game case: **both**. `app/Input.ts` is shared plumbing and a bug fix
 * (`critic/CHECKS.md` CHK-020), and the briefing is the one shared surface.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../../src/app/Input.ts';
import { Briefing } from '../../src/ui/coach/Briefing.ts';
import { RawInputWatcher, setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';
import { SaveStore } from '../../src/app/SaveData.ts';

function keydown(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

function keyup(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
}

/** One pad with button 0 (cross / A) held. */
function padDown(): void {
  const pad = {
    connected: true,
    buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 0, touched: false, value: i === 0 ? 1 : 0 })),
    axes: [0, 0],
  } as unknown as Gamepad;
  (navigator as unknown as { getGamepads: () => (Gamepad | null)[] }).getGamepads = () => [pad];
}

function padUp(): void {
  (navigator as unknown as { getGamepads: () => (Gamepad | null)[] }).getGamepads = () => [];
}

describe('an exclusive input claim', () => {
  let input: Input;
  let root: HTMLElement;
  let frame = 0;

  /** One whole app frame: update, let a screen look, roll the edges forward. */
  function step(): { confirm: boolean; cancel: boolean; actions: readonly string[] } {
    frame += 16;
    const snap = input.update(frame);
    const seen = { confirm: snap.justPressed('confirm'), cancel: snap.justPressed('cancel'), actions: [...snap.actions] };
    input.endFrame();
    return seen;
  }

  beforeEach(() => {
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    frame = 0;
    padUp();
    setRawInputSuspended(false);
    resetCoach();
    new SaveStore('leak-test', null);
    input = new Input({ keyboardTarget: window, pointerRoot: root });
    input.attach();
  });

  afterEach(() => {
    input.detach();
    padUp();
    setRawInputSuspended(false);
  });

  it('never hands the screen behind it the key that dismissed it (Enter)', async () => {
    const briefing = new Briefing({
      root,
      reduceMotion: true,
      claimKeyboard: (onKey) => input.claimKeyboard(onKey, { exclusive: true }),
    });
    const done = briefing.show();

    keydown('Enter');
    keyup('Enter');
    await expect(done).resolves.toBe('skipped');

    // The frame the press landed on, and the frame after it: the chapter board
    // behind the briefing must see nothing, or a first-timer is thrown into
    // party prep having never seen the board.
    expect(step().confirm, 'the dismissing press is not delivered to the screen behind').toBe(false);
    expect(step().confirm, 'nor one frame later, when the claim has been handed back').toBe(false);
  });

  it('never hands the screen behind it the key that dismissed it (Escape)', async () => {
    const briefing = new Briefing({
      root,
      reduceMotion: true,
      claimKeyboard: (onKey) => input.claimKeyboard(onKey, { exclusive: true }),
    });
    const done = briefing.show();

    keydown('Escape');
    keyup('Escape');
    await expect(done).resolves.toBe('skipped');

    expect(step().cancel, 'a cancel behind the briefing would back the board out to the title').toBe(false);
    expect(step().cancel).toBe(false);
  });

  it('a click on the briefing never reaches the delegated action listener', async () => {
    const briefing = new Briefing({
      root,
      reduceMotion: true,
      claimKeyboard: (onKey) => input.claimKeyboard(onKey, { exclusive: true }),
    });
    const done = briefing.show();
    const skip = briefing.el.querySelector<HTMLElement>('[data-action="briefing:skip"]');
    expect(skip, 'the foot prints a clickable skip').not.toBeNull();
    skip?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect(done).resolves.toBe('skipped');

    expect(step().actions, 'no queued action survives the overlay').toEqual([]);
    expect(step().actions).toEqual([]);
  });

  it('swallows the pad however the two poll loops are ordered', () => {
    const release = input.claimKeyboard(() => {}, { exclusive: true });
    padDown();

    // Overlay-first: the pad is already held when the claim goes up.
    expect(step().confirm, 'nothing behind an exclusive claim sees the pad').toBe(false);
    expect(step().confirm).toBe(false);

    // Input-first: the claim is handed back while the button is still down.
    // The frame after the hand-back is deaf on purpose — that press belonged
    // to the overlay.
    release();
    expect(step().confirm, 'the press that dismissed the overlay is not re-delivered').toBe(false);
    expect(step().confirm, 'and a held button never produces a second edge').toBe(false);

    // A genuinely new press afterwards still works, or the game is dead.
    padUp();
    step();
    padDown();
    expect(step().confirm, 'a fresh press after the overlay is live input again').toBe(true);
  });

  it('leaves an ordinary claim (the pause menu) reading its own keys', () => {
    input.claimKeyboard();
    keydown('Escape');
    expect(step().cancel, 'the pause screen still reads Esc while it owns the keyboard').toBe(true);
  });
});

describe('a briefing replayed over the pause menu', () => {
  afterEach(() => setRawInputSuspended(false));

  it('still hears the pad, which is muted for every other HUD widget', () => {
    setRawInputSuspended(true);
    const heard: string[] = [];
    const muted = new RawInputWatcher((b) => heard.push(b));
    const own = new RawInputWatcher((b) => heard.push(`brief:${b}`), { ignoreSuspend: true });
    muted.attach();
    own.attach();
    try {
      keydown('Enter');
    } finally {
      muted.detach();
      own.detach();
    }
    expect(heard, 'the command menu stays muted; the briefing does not').toEqual(['brief:confirm']);
  });
});

describe('the briefing is dismissible by every device it advertises', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    resetCoach();
    new SaveStore('leak-test-2', null);
  });

  it('resolves on a pad press with no keyboard and no mouse', async () => {
    vi.useFakeTimers();
    try {
      const root = document.createElement('div');
      document.body.appendChild(root);
      const briefing = new Briefing({ root, reduceMotion: true });
      const done = briefing.show();
      padDown();
      // The briefing's own watcher polls on a frame; jsdom runs those on a timer.
      await vi.advanceTimersByTimeAsync(64);
      await expect(done).resolves.toBe('skipped');
    } finally {
      padUp();
      vi.useRealTimers();
    }
  });
});
