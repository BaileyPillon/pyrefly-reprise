// @vitest-environment jsdom
/**
 * PR-0284 (critic round 18b, both games): REPLAY BRIEFING opened *under* the
 * pause UI. `.pause` is fixed at `z-index: 999`; the briefing mounts on `#ui`
 * at `coach.css`'s 90, so it played unseen while it held the keyboard, and
 * `elementFromPoint` over it found `DIV.pause__ui` at 0.5 s and 2 s.
 *
 * jsdom does not lay out or stack, so the stacking itself is proven by real
 * input in the browser (docs/handoff/r34fix-restart.md); these pin the two
 * halves that make it: the replay carries the over-pause class, and that class
 * outranks the pause layer's `z-index` as the stylesheets stand.
 */

import fs from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import type { Screen } from '../../src/app/Screen.ts';
import { PauseOverlays } from '../../src/app/screens/pause/PauseOverlays.ts';

function zIndexOf(cssPath: string, selector: RegExp): number {
  const css = fs.readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const block = css.match(new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`));
  const z = block?.[1]?.match(/z-index:\s*(\d+)/);
  if (!z) throw new Error(`no z-index for ${selector} in ${cssPath}`);
  return Number(z[1]);
}

let overlays: PauseOverlays | null = null;

afterEach(() => {
  overlays?.dispose();
  overlays = null;
  document.body.innerHTML = '';
});

describe('PR-0284: the replayed briefing is drawn over the pause', () => {
  it('REPLAY BRIEFING mounts the briefing with the over-pause layer', () => {
    const uiRoot = document.createElement('div');
    document.body.appendChild(uiRoot);
    let released = 0;
    const app = {
      uiRoot,
      save: { settings: { reduceMotion: true } },
      input: { claimKeyboard: () => () => void released++ },
      screens: [],
    } as unknown as App;
    let refreshed = 0;
    overlays = new PauseOverlays({
      app,
      self: {} as Screen,
      chrome: () => null,
      root: () => null,
      setBaselineVisible: () => undefined,
      refresh: () => void refreshed++,
    });

    const done = overlays.replayBriefing();
    const el = uiRoot.querySelector<HTMLElement>('.coach-brief');
    expect(el, 'the briefing is up').not.toBeNull();
    expect(el!.classList.contains('coach-brief--over-pause')).toBe(true);
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

  it('the over-pause layer outranks the pause layer; the first-launch briefing keeps its own tier', () => {
    const pause = zIndexOf('src/ui/common/pause-screen.css', /\n\.pause/);
    const over = zIndexOf('src/app/screens/pause/pause-briefing.css', /\.coach-brief\.coach-brief--over-pause/);
    const base = zIndexOf('src/ui/coach/coach.css', /\n\.coach-brief/);
    expect(over).toBeGreaterThan(pause);
    expect(base, 'unchanged for the title -> board briefing').toBe(90);
  });
});
