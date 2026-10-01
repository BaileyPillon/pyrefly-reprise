// @vitest-environment jsdom
/**
 * PR-0284 (critic round 18b, both games): REPLAY BRIEFING opened *under* the
 * pause UI. `.pause` is fixed at `z-index: 999`, the top of the codebase
 * (`ui-pause-stack.test.ts`); the briefing mounted on `#ui` at `coach.css`'s
 * 90, so it played unseen while it held the keyboard, and `elementFromPoint`
 * over it found `DIV.pause__ui` at 0.5 s and 2 s.
 *
 * The replay now mounts inside the pause layer. jsdom does not lay out or
 * stack, so the stacking is proven by real input in the browser
 * (`docs/handoff/r34fix-restart.md`); these pin the halves that make it: the
 * replay mounts in the pause's own layer, nothing inside that layer declares a
 * `z-index` that could cover the briefing's 90, and the first-launch briefing
 * still mounts on `#ui`.
 */

import fs from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import type { Screen } from '../../src/app/Screen.ts';
import { PauseOverlays } from '../../src/app/screens/pause/PauseOverlays.ts';
import { makeBriefing } from '../../src/app/screens/raiseBriefing.ts';

let overlays: PauseOverlays | null = null;

afterEach(() => {
  overlays?.dispose();
  overlays = null;
  document.body.innerHTML = '';
});

function fakeApp(uiRoot: HTMLElement, onRelease: () => void): App {
  return {
    uiRoot,
    save: { settings: { reduceMotion: true } },
    input: { claimKeyboard: () => onRelease },
    screens: [],
  } as unknown as App;
}

describe('PR-0284: the replayed briefing is drawn inside the pause layer', () => {
  it('REPLAY BRIEFING mounts in the pause stage, and a click takes it down', () => {
    const uiRoot = document.createElement('div');
    const pause = document.createElement('div');
    pause.className = 'pause';
    const stage = document.createElement('div');
    stage.className = 'pause__stage';
    pause.appendChild(stage);
    uiRoot.appendChild(pause);
    document.body.appendChild(uiRoot);
    let released = 0;
    let refreshed = 0;
    overlays = new PauseOverlays({
      app: fakeApp(uiRoot, () => void released++),
      self: {} as Screen,
      chrome: () => null,
      root: () => stage,
      setBaselineVisible: () => undefined,
      refresh: () => void refreshed++,
    });

    const done = overlays.replayBriefing();
    const el = uiRoot.querySelector<HTMLElement>('.coach-brief');
    expect(el, 'the briefing is up').not.toBeNull();
    expect(el!.parentElement, 'inside the pause layer, not beside it on #ui').toBe(stage);
    expect(stage.lastElementChild, 'last in the layer, so it paints over the pause chrome').toBe(el);
    expect(overlays.briefingUp).toBe(true);

    // A click anywhere on it takes it down (the critic's "a click or tap advances it").
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(uiRoot.querySelector('.coach-brief')).toBeNull();
    expect(released, 'the keyboard goes back to the pause').toBe(1);
    return done.then(() => {
      expect(overlays!.briefingUp).toBe(false);
      expect(refreshed).toBe(1);
    });
  });

  it('nothing in the pause sheet but .pause itself declares a z-index, so the briefing (90) tops the pause chrome', () => {
    const css = fs.readFileSync('src/ui/common/pause-screen.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const zs = [...css.matchAll(/z-index:\s*(-?\d+)/g)].map((m) => Number(m[1]));
    expect(zs).toEqual([999]);
    const coach = fs.readFileSync('src/ui/coach/coach.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(coach).toMatch(/\.coach-brief\s*\{[^}]*z-index:\s*90;/);
  });

  it('the first-launch briefing (title -> board) still mounts on #ui', () => {
    const uiRoot = document.createElement('div');
    document.body.appendChild(uiRoot);
    const briefing = makeBriefing(fakeApp(uiRoot, () => undefined));
    void briefing.show();
    expect(briefing.el.parentElement).toBe(uiRoot);
    briefing.skip();
  });
});
