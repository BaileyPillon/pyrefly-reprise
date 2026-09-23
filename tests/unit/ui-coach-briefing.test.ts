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
import {
  battleHelpOn,
  hasSeen,
  resetCoach,
  setOnboardingLive,
  shouldShow,
} from '../../src/ui/coach/coachState.ts';
import { SaveStore, activeSave } from '../../src/app/SaveData.ts';
import { setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';

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
    // This file is about the briefing's own behaviour, so it runs with the
    // feature switched on. The dark launch itself is
    // `tests/unit/ui-coach-dark-launch.test.ts`.
    setOnboardingLive(true);
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
    press('KeyD');
    await expect(done).resolves.toBe('never-again');

    expect(battleHelpOn(), 'the switch the pause row reads is off').toBe(false);
    // Which is what silences the in-battle lines, not just the briefing.
    expect(shouldShow('ffx-turn-order')).toBe(false);
    expect(shouldShow('ffx2-gauge')).toBe(false);
  });

  /**
   * PR-0049. The opt-out is a **persisted** preference and it was written by
   * four different keys while the footer advertised one — Tab among them, which
   * is the key a keyboard or switch player presses to reach the chip they
   * actually want.
   */
  describe('the permanent opt-out answers to one named key and the chip', () => {
    function chip(action: string): HTMLElement {
      return el()!.querySelector<HTMLElement>(`[data-action="${action}"]`)!;
    }

    it('names the key the approved frame names, and binds that key', async () => {
      const briefing = new Briefing({ root, reduceMotion: true });
      const done = briefing.show();
      const foot = chip('briefing:never');
      expect(foot.querySelector('b')?.textContent, 'the footer prints the frame’s key').toBe('D');
      press('KeyD');
      await expect(done).resolves.toBe('never-again');
      expect(battleHelpOn()).toBe(false);
    });

    it('Tab only moves focus between the two chips: it never opts out and never dismisses', () => {
      const briefing = new Briefing({ root, reduceMotion: true });
      void briefing.show();

      press('Tab');
      expect(document.activeElement, 'the first Tab lands on SKIP').toBe(chip('briefing:skip'));
      expect(briefing.finished, 'and the briefing is still up').toBe(false);

      press('Tab');
      expect(document.activeElement, 'the second reaches NEVER SHOW THIS AGAIN').toBe(
        chip('briefing:never'),
      );
      expect(briefing.finished).toBe(false);
      expect(battleHelpOn(), 'reaching the control is not choosing it').toBe(true);
      expect(hasSeen('briefing'), 'nor does it count the briefing as seen').toBe(false);

      briefing.skip();
    });

    it('Enter on the focused chip activates that chip, the way a real button does', async () => {
      const briefing = new Briefing({ root, reduceMotion: true });
      const done = briefing.show();
      press('Tab');
      press('Tab');
      press('Enter');
      await expect(done).resolves.toBe('never-again');
      expect(battleHelpOn()).toBe(false);
    });

    it('the keys the old build also bound no longer write the preference', async () => {
      // Shift is half a chord and now does nothing at all; Q is an ordinary
      // key and skips, like any other — what neither may do is opt out.
      const first = new Briefing({ root, reduceMotion: true });
      const firstDone = first.show();
      press('ShiftLeft');
      expect(first.finished, 'a bare modifier is not a decision').toBe(false);
      press('ShiftRight');
      expect(first.finished).toBe(false);
      expect(battleHelpOn()).toBe(true);
      first.skip();
      await firstDone;

      const second = new Briefing({ root, reduceMotion: true });
      const secondDone = second.show();
      press('KeyQ');
      await expect(secondDone, 'Q skips, as any unnamed key does').resolves.toBe('skipped');
      expect(battleHelpOn(), 'and leaves the teaching on').toBe(true);
    });

    it('the chip itself still writes it, for mouse and touch', async () => {
      const briefing = new Briefing({ root, reduceMotion: true });
      const done = briefing.show();
      chip('briefing:never').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await expect(done).resolves.toBe('never-again');
      expect(battleHelpOn()).toBe(false);
    });
  });

  it('a browser with no storage shows it once per session, not once per navigation', async () => {
    resetCoach();
    setOnboardingLive(true);
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

  it('the pause replay dismisses itself while every other HUD watcher is muted', async () => {
    // The pause overlay mutes raw HUD input so a pad cannot drive the command
    // menu behind it. The briefing is the overlay that mute protects the fight
    // from, so it has to keep hearing input itself — the pause screen forwards
    // it nothing, which is what made the replay unskippable in the first build.
    setRawInputSuspended(true);
    try {
      const briefing = new Briefing({ root, reduceMotion: true });
      const done = briefing.show();
      press('Enter');
      await expect(done).resolves.toBe('skipped');
    } finally {
      setRawInputSuspended(false);
    }
  });

  it('prints Auron’s four lines and nothing else', () => {
    // His approved fourth line is the ACTIVE reading (D-029 follow-up 3); the
    // Wait reading is `ui-coach-briefing-mode.test.ts`.
    activeSave()?.setSettings({ ffx2Atb: 'active' });
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
