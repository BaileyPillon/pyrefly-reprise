// @vitest-environment jsdom
/**
 * **The onboarding switch, now live.**
 *
 * The approved briefing's fourth line says of FFX-2 *"the clock does not
 * wait"*. That was not true of the build behind round 05's dark launch — the
 * FFX-2 engine stood still under an open command menu — so `ONBOARDING_LIVE`
 * shipped `false` rather than ship a line that was not yet true (AGENTS.md
 * hard rule 15). Active ATB (PR-0046) made the line true, measured on the
 * shipped build (`src/ui/coach/CoachMark.ts`), and Bailey approved switching
 * the whole feature on for this release (2026-09-21, "Yes to all
 * recommendations").
 *
 * This file is the proof that the switch still works both ways: on by
 * default now, and the debug API (`__pyrefly.setCoaching(false)`) can still
 * take it back out for a capture that must not show it.
 *
 * Game case: **both**. One switch over one shared subsystem (CHK-020).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { App } from '../../src/app/App.ts';
import {
  ONBOARDING_LIVE,
  coachingAllowed,
  onboardingLive,
  resetCoach,
  setCoachingEnabled,
  setOnboardingLive,
  shouldShow,
} from '../../src/ui/coach/coachState.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

interface Harness {
  screen: PauseScreen;
  input: Input;
  root: HTMLElement;
  dispose(): void;
}

/** The pause menu, mounted for real, so the rows asserted are the rows drawn. */
function mountPause(): Harness {
  const store = new SaveStore('coach-dark-launch', memoryStorage());
  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);

  const screen = new PauseScreen({ chapter: getChapter('seymour-flux')!, onResume: () => {} });
  screen.app = { save: store, input, screens: [screen], renderer: { camera: {} } } as unknown as App;
  screen.root = root;
  void screen.enter();
  // The Until Dawn remake dissolved the left-hand command column into tabs:
  // REPLAY BRIEFING and BATTLE HELP are rows of the OPTIONS tab now
  // (docs/concepts/pause-until-dawn/options.json, preservedFunctions).
  screen.trigger('pause:tab:options');

  return {
    screen,
    input,
    root,
    dispose: () => {
      screen.exit();
      input.detach();
      root.remove();
    },
  };
}

/** Every row of the tab that is open, in reading order. */
function rowLabels(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.pause__row')).map((r) =>
    (r.textContent ?? '').trim().toUpperCase(),
  );
}

/** Every tab on the strip, in strip order. */
function tabLabels(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.pause__tab')).map((t) =>
    (t.textContent ?? '').trim().toUpperCase(),
  );
}

describe('onboarding, live', () => {
  let pause: Harness | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
    resetCoach();
  });

  afterEach(() => {
    pause?.dispose();
    pause = null;
    resetCoach();
  });

  it('ships live in this release', () => {
    expect(ONBOARDING_LIVE, 'the switch this build ships with').toBe(true);
    expect(onboardingLive()).toBe(true);
  });

  it('on first entry of a chapter, a fresh profile is shown the briefing and the coach marks', () => {
    // A first launch is exactly this: a fresh profile, nothing seen, help on.
    new SaveStore('coach-dark-launch-fresh', memoryStorage());
    expect(coachingAllowed(), 'a surface may appear').toBe(true);
    expect(shouldShow('briefing'), 'the briefing plays between title and board').toBe(true);
    expect(shouldShow('ffx-turn-order'), 'and the FFX first-use line').toBe(true);
    expect(shouldShow('ffx2-gauge'), 'and the FFX-2 one').toBe(true);
  });

  it('the pause menu advertises onboarding, replayable from the OPTIONS tab', () => {
    pause = mountPause();
    const labels = rowLabels(pause.root);
    expect(labels.some((l) => l.includes('REPLAY BRIEFING'))).toBe(true);
    expect(labels.some((l) => l.includes('BATTLE HELP'))).toBe(true);
    // The tabs it must still have, so this is a guard and not a broken menu.
    const tabs = tabLabels(pause.root);
    expect(tabs).toContain('OPTIONS');
    expect(tabs).toContain('CHAPTER');
    expect(tabs).toContain('MUSIC');
  });

  it('flipping the switch off (a future dark launch) hides the briefing, the lines and both pause rows', () => {
    setOnboardingLive(false);
    new SaveStore('coach-dark-launch-off', memoryStorage());
    expect(coachingAllowed()).toBe(false);
    expect(shouldShow('briefing')).toBe(false);
    expect(shouldShow('ffx2-gauge')).toBe(false);

    pause = mountPause();
    const labels = rowLabels(pause.root);
    expect(labels.some((l) => l.includes('REPLAY BRIEFING'))).toBe(false);
    expect(labels.some((l) => l.includes('BATTLE HELP'))).toBe(false);
  });

  it('the debug API can still force the whole feature off for a capture that must not show it', () => {
    // `__pyrefly.setCoaching(false)` is how a screenshot run or a spec that
    // presses Enter on the title keeps this feature out of frame.
    setCoachingEnabled(false);
    expect(coachingAllowed(), 'the harness override outranks the switch').toBe(false);
    expect(shouldShow('briefing')).toBe(false);
    // `onboardingLive()` only answers "should the furniture be drawn at all",
    // which the live switch alone already satisfies; the override here
    // suppresses individual surfaces (`coachingAllowed`), not the menu rows.
    expect(onboardingLive(), 'the switch itself is untouched by the surface override').toBe(true);
  });

  it('the debug API can still force the whole feature on, independent of the switch', () => {
    setOnboardingLive(false);
    setCoachingEnabled(true);
    expect(coachingAllowed(), 'the harness override outranks the switch').toBe(true);
    expect(shouldShow('briefing')).toBe(true);
    expect(onboardingLive(), 'and the furniture comes back with it').toBe(true);

    pause = mountPause();
    expect(rowLabels(pause.root).some((l) => l.includes('REPLAY BRIEFING'))).toBe(true);
  });

  it('resetting puts the switch back where the build ships it', () => {
    setOnboardingLive(false);
    resetCoach();
    expect(onboardingLive()).toBe(ONBOARDING_LIVE);
  });
});
