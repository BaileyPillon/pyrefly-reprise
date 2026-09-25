// @vitest-environment jsdom
/**
 * A cutscene's `fade('black')` (ISA-CHK-M1): the black goes on the stage,
 * **under** the dialogue box, so a line narrated after it can be read.
 *
 * `CutsceneScreen` used to hand the fade to `App.fade('opaque')`, and the
 * `#fade` layer (index.html, z-index 20) sits over the whole of `#ui` (10),
 * which holds the box: every line after a fade to black played on a blank
 * screen. Game case: both (shared plumbing, CHK-020). The first block
 * measures which scenes that was, and pins the list.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

import { CutsceneStage } from '../../src/app/screens/CutsceneStage.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import type { Step, StoryScript } from '../../src/story/dsl.ts';
import { isaaruScripts } from '../../src/story/scripts/ffx-isaaru.ts';

/**
 * Lines (`say` / `narrate`) that play while a fade to black or white is up:
 * the ones #fade used to hide. Each `ifFlag` branch is walked from the state
 * it is entered in, so a fade at the end of one branch never darkens the
 * other's lines; the scene is dark after the branch if either path left it so.
 */
function linesUnderFade(steps: readonly Step[], dark = false): { n: number; dark: boolean } {
  let n = 0;
  for (const s of steps) {
    if (s.type === 'fade') dark = s.to !== 'clear';
    if (dark && (s.type === 'say' || s.type === 'narrate')) n++;
    if (s.type === 'parallel') ({ n, dark } = add(n, linesUnderFade(s.steps, dark)));
    if (s.type === 'ifFlag') {
      const a = linesUnderFade(s.then, dark);
      const b = linesUnderFade(s.else ?? [], dark);
      n += a.n + b.n;
      dark = a.dark || b.dark;
    }
  }
  return { n, dark };
}

function add(n: number, r: { n: number; dark: boolean }): { n: number; dark: boolean } {
  return { n: n + r.n, dark: r.dark };
}

describe('which scenes narrate under a fade (measured, pinned)', () => {
  it('lists every pre/post scene with a line after a fade to black, and nothing else', () => {
    const hidden: Record<string, number> = {};
    const scenes: Array<[string, StoryScript | undefined]> = [];
    for (const c of CHAPTERS) {
      scenes.push([`${c.number} ${c.id} pre`, c.scriptsRef?.pre], [`${c.number} ${c.id} post`, c.scriptsRef?.post]);
    }
    // Chapter XIV (FFX only) is unlisted, so it is not in CHAPTERS yet.
    scenes.push(['14 isaaru pre', isaaruScripts.pre], ['14 isaaru post', isaaruScripts.post]);
    for (const [key, script] of scenes) {
      if (!script) continue;
      const { n } = linesUnderFade(script);
      if (n) hidden[key] = n;
    }
    // Every one of these lines was a blank black frame before the veil.
    expect(hidden).toEqual({
      '1 seymour-flux post': 4,
      '2 yunalesca post': 4,
      '3 braskas-final-aeon post': 3,
      '4 ffx2-bahamut post': 2,
      '5 ffx2-vegnagun-shuyin post': 3,
      '6 ffx2-leblanc post': 2,
      '7 seymour-anima-macalania post': 4,
      '8 evrae-airship post': 3,
      // Chapter X (FFX only), listed on main while Chapter XIV was on its branch: the veil reaches it too.
      '10 seymour-natus pre': 9,
      '10 seymour-natus post': 5,
      '14 isaaru post': 2,
    });
  });
});

describe('CutsceneStage.veil', () => {
  let root: HTMLElement;
  let stage: CutsceneStage;

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    root.className = 'screen cutscene ig';
    document.body.appendChild(root);
    stage = new CutsceneStage(root);
    stage.mount();
  });

  afterEach(() => {
    stage.unmount();
    root.remove();
    vi.useRealTimers();
  });

  it('puts the black in the shake layer before the dialogue box, which DialogueBox.mount appends after it', () => {
    const box = document.createElement('div');
    box.className = 'dbox';
    stage.shakeEl.appendChild(box);
    const veil = root.querySelector('.cutscene__veil');
    expect(veil?.parentElement).toBe(stage.shakeEl);
    const kids = [...stage.shakeEl.children];
    expect(kids.indexOf(veil as Element)).toBeLessThan(kids.indexOf(box));
  });

  it('goes on and off for a fade, awaiting its ms, and says so', async () => {
    const veil = root.querySelector<HTMLElement>('.cutscene__veil');
    expect(stage.veiled).toBe(false);
    let done = false;
    void stage.veil(true, 1400).then(() => (done = true));
    expect(stage.veiled).toBe(true);
    expect(veil?.classList.contains('is-on')).toBe(true);
    expect(root.classList.contains('is-veiled')).toBe(true);
    expect(veil?.style.transitionDuration).toBe('1400ms');
    await vi.advanceTimersByTimeAsync(1399);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);

    await stage.veil(false, 0);
    expect(stage.veiled).toBe(false);
    expect(veil?.classList.contains('is-on')).toBe(false);
    expect(root.classList.contains('is-veiled')).toBe(false);
  });

  it('sits between the scene (and its scrim) and the box in the stylesheet', () => {
    const css = readFileSync('src/app/screens/cutsceneStage.css', 'utf8');
    const box = readFileSync('src/ui/common/dialogue-box.css', 'utf8');
    const veilZ = Number(/\.cutscene__veil \{[^}]*z-index: (\d+)/.exec(css)?.[1]);
    const boxZ = Number(/\n\.dbox \{[^}]*z-index: (\d+)/.exec(box)?.[1]);
    expect(veilZ).toBeGreaterThan(0);
    expect(veilZ).toBeLessThan(boxZ);
  });
});

describe('CutsceneScreen wiring', () => {
  it('sends a fade to black to the stage, never to #fade over the box', () => {
    const src = readFileSync('src/app/screens/CutsceneScreen.ts', 'utf8');
    const port = /fadeScreen: \(to, ms\) => ([^\n]+)/.exec(src)?.[1] ?? '';
    expect(port).toContain("stage.veil(true, ms)");
    expect(port).not.toContain("'opaque'");
    // A scene that ends under the veil hands the black on, so the next screen fades in from it as before.
    expect(src).toContain("if (this.stage?.veiled) void this.app.fade('opaque', 0);");
  });
});
