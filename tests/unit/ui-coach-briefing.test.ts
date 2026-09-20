// @vitest-environment jsdom
/**
 * **Auron's briefing: once, skippable from the first frame, and never again.**
 *
 * The approved end state C1
 * (`docs/concepts/onboarding/c-aurons-briefing/c1-briefing.png`) makes four
 * promises a player can actually catch us breaking, and this file is one test
 * per promise:
 *
 * | promise | asserted by |
 * |---|---|
 * | twenty seconds, then it ends by itself | a fake clock, not a real wait |
 * | skippable **from the first frame** | a real `KeyboardEvent` dispatched before the opening fade has run |
 * | mouse and touch too | a real `click`, which is what a tap fires |
 * | never again | the seen-set through a real `SaveStore` over a real storage double |
 *
 * Plus the two the critique demanded: "never show this again" must actually
 * turn the first-use lines off as well (`docs/plans/onboarding-review.md`
 * REQUIRED 7), and a browser with no storage must show it **once per session**
 * rather than on every navigation.
 *
 * Game case: both. The briefing is the one shared surface.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Briefing } from '../../src/ui/coach/Briefing.ts';
import { BRIEFING_MS } from '../../src/ui/coach/coachCopy.ts';
import { battleHelpOn, hasSeen, resetCoach, shouldShow } from '../../src/ui/coach/coachState.ts';
import { SaveStore } from '../../src/app/SaveData.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function press(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
}

function el(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>('[data-role="coach-briefing"]');
}

describe("Auron's briefing", () => {
  let root: HTMLElement;
  let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    resetCoach();
    storage = memoryStorage();
    // Constructing a store makes it the active one, which is how the module
    // under test reaches the save at all.
    new SaveStore('k', storage);
  });

  it('runs for twenty seconds and then ends by itself', async () => {
    const briefing = new Briefing({ root, reduceMotion: true });
    const done = briefing.show();
    expect(el(), 'it is on screen immediately').not.toBeNull();

    vi.advanceTimersByTime(BRIEFING_MS - 1000);
    expect(briefing.finished, 'still running at nineteen seconds').toBe(false);
    const fill = el()?.querySelector<HTMLElement>('[data-role="coach-brief-fill"]');
    expect(parseFloat(fill?.style.width ?? '0'), 'the timer is visibly running').toBeGreaterThan(90);

    vi.advanceTimersByTime(1000);
    await expect(done).resolves.toBe('finished');
    expect(el(), 'and it takes itself down').toBeNull();
  });

  it('is skippable from the very first frame with a real key press', async () => {
    const briefing = new Briefing({ root, reduceMotion: true });
    const done = briefing.show();
    // No timer advanced at all: not even the 16 ms that starts the fade.
    press('Escape');
    await expect(done).resolves.toBe('skipped');
    expect(el()).toBeNull();
  });

  it('is skippable with a real click, which is what a tap fires', async () => {
    const briefing = new Briefing({ root, reduceMotion: true });
    const done = briefing.show();
    el()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect(done).resolves.toBe('skipped');
  });

  it('a skip still counts as seen, so it never plays a second time', async () => {
    expect(shouldShow('briefing')).toBe(true);
    const done = new Briefing({ root, reduceMotion: true }).show();
    press('Enter');
    await done;

    expect(hasSeen('briefing')).toBe(true);
    expect(shouldShow('briefing'), 'the next launch goes straight to the board').toBe(false);
    // And it survives a reload of the same storage.
    const reloaded = new SaveStore('k', storage);
    expect(reloaded.hasSeenCoach('briefing')).toBe(true);
  });

  it('"never show this again" turns the first-use lines off as well', async () => {
    expect(battleHelpOn()).toBe(true);
    const done = new Briefing({ root, reduceMotion: true }).show();
    press('ShiftLeft');
    await expect(done).resolves.toBe('never-again');

    expect(battleHelpOn(), 'the switch the pause row reads is off').toBe(false);
    // Which is what silences the in-battle lines, not just the briefing.
    expect(shouldShow('ffx-turn-order')).toBe(false);
    expect(shouldShow('ffx2-gauge')).toBe(false);
  });

  it('a browser with no storage shows it once per session, not once per navigation', async () => {
    resetCoach();
    // A store with no storage behind it: every write is dropped, exactly as in
    // a private window with site data blocked.
    new SaveStore('k', null);
    expect(shouldShow('briefing')).toBe(true);
    const done = new Briefing({ root, reduceMotion: true }).show();
    press('Enter');
    await done;
    expect(shouldShow('briefing'), 'the session remembers even when the disk cannot').toBe(false);
  });

  it('it claims the keyboard, so nothing behind it acts on the same press', async () => {
    let claimed: ((e: KeyboardEvent) => void) | null = null;
    let released = false;
    const briefing = new Briefing({
      root,
      reduceMotion: true,
      claimKeyboard: (onKey) => {
        claimed = onKey;
        return () => {
          released = true;
        };
      },
    });
    const done = briefing.show();
    expect(claimed, 'the claim is taken as it goes up').not.toBeNull();

    // The claim is how the key arrives; `window` is no longer the route,
    // because `app/Input.ts` stops the event in the capture phase.
    claimed!(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(done).resolves.toBe('skipped');
    expect(released, 'and handed back on the way out').toBe(true);
  });

  it('a driven briefing (the pause replay) takes input from the screen above it', async () => {
    const briefing = new Briefing({ root, reduceMotion: true, driven: true });
    const done = briefing.show();
    briefing.handleInput({ justPressed: (b) => b === 'confirm' });
    await expect(done).resolves.toBe('skipped');
  });

  it('prints Auron’s four lines and nothing else', () => {
    const briefing = new Briefing({ root, reduceMotion: true });
    void briefing.show();
    const node = el()!;
    expect(node.querySelectorAll('.coach-brief__line')).toHaveLength(4);
    expect(node.textContent).toContain('Auron');
    const text = node.textContent ?? '';
    expect(text).toContain('nothing moves until you move');
    expect(text).toContain('the clock does not wait');
    // The off switch is on the first surface, exactly as every option promised.
    expect(text.toLowerCase()).toContain('never show this again');
    expect(text.toLowerCase()).toContain('skip');
    briefing.skip();
  });
});
