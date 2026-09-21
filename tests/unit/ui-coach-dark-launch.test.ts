// @vitest-environment jsdom
/**
 * **The onboarding dark launch.**
 *
 * The approved briefing's fourth line says of FFX-2 *"the clock does not
 * wait"*. That becomes true when Active ATB lands (PR-0046; the owner chose
 * Active on 2026-09-21), which is a combat-core change with its own paper
 * preflight and deep review — the next candidate, not this one. Approved copy
 * may not be edited to fit a build, so this candidate ships the whole feature
 * switched off rather than ship a line that is not yet true (AGENTS.md hard
 * rule 15: what cannot pass is taken out and ships later).
 *
 * One switch does it, `ONBOARDING_LIVE` in `src/ui/coach/coachState.ts`. This
 * file is the proof that it is a switch and not a deletion: with it off a first
 * launch shows nothing and the pause menu advertises nothing, and with it on
 * every part comes back untouched.
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

describe('onboarding, dark launched', () => {
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

  it('ships off in this candidate', () => {
    expect(ONBOARDING_LIVE, 'the switch this build ships with').toBe(false);
    expect(onboardingLive()).toBe(false);
  });

  it('with the switch off a first launch is shown nothing at all', () => {
    // A first launch is exactly this: a fresh profile, nothing seen, help on.
    new SaveStore('coach-dark-launch-fresh', memoryStorage());
    expect(coachingAllowed(), 'no surface may appear').toBe(false);
    expect(shouldShow('briefing'), 'the briefing does not play between title and board').toBe(false);
    expect(shouldShow('ffx-turn-order'), 'nor the FFX first-use line').toBe(false);
    expect(shouldShow('ffx2-gauge'), 'nor the FFX-2 one').toBe(false);
  });

  it('with the switch off the pause menu advertises no onboarding', () => {
    pause = mountPause();
    const labels = rowLabels(pause.root);
    expect(labels.length, 'the rest of the menu is untouched').toBeGreaterThan(3);
    expect(labels.some((l) => l.includes('REPLAY BRIEFING'))).toBe(false);
    expect(labels.some((l) => l.includes('BATTLE HELP'))).toBe(false);
    // The tabs it must still have, so this is a guard and not a broken menu.
    const tabs = tabLabels(pause.root);
    expect(tabs).toContain('OPTIONS');
    expect(tabs).toContain('CHAPTER');
    expect(tabs).toContain('MUSIC');
  });

  it('flipping it on restores the briefing, the lines and both pause rows', () => {
    setOnboardingLive(true);
    new SaveStore('coach-dark-launch-on', memoryStorage());
    expect(coachingAllowed()).toBe(true);
    expect(shouldShow('briefing')).toBe(true);
    expect(shouldShow('ffx2-gauge')).toBe(true);

    pause = mountPause();
    const labels = rowLabels(pause.root);
    expect(labels.some((l) => l.includes('REPLAY BRIEFING'))).toBe(true);
    expect(labels.some((l) => l.includes('BATTLE HELP'))).toBe(true);
  });

  it('the debug API still forces the whole feature on over the dark launch', () => {
    // `__pyrefly.setCoaching(true)` is how the next review exercises a feature
    // that is switched off in the shipped build.
    setCoachingEnabled(true);
    expect(coachingAllowed(), 'the harness override outranks the switch').toBe(true);
    expect(shouldShow('briefing')).toBe(true);
    expect(onboardingLive(), 'and the furniture comes back with it').toBe(true);

    pause = mountPause();
    expect(rowLabels(pause.root).some((l) => l.includes('REPLAY BRIEFING'))).toBe(true);
  });

  it('resetting puts the switch back where the build ships it', () => {
    setOnboardingLive(true);
    resetCoach();
    expect(onboardingLive()).toBe(ONBOARDING_LIVE);
  });
});
