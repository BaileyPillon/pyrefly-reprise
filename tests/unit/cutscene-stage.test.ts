// @vitest-environment jsdom
/**
 * The cutscene stage (`src/app/screens/CutsceneStage.ts`): figures, the
 * sending and the pyreflies in a pre- or post-battle scene.
 *
 * Chapter IX (FFX only) is why it exists: the post scene's sending of Lady
 * Ginnem was told only in dialogue, because `CutsceneScreen` drew every `fx()`
 * as a flash and ignored `hideActor()`. The screen now honours both for every
 * chapter (game case: both, shared plumbing), so this file also **measures**
 * which other chapters' scenes change, and pins the list.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CutsceneStage } from '../../src/app/screens/CutsceneStage.ts';
import { CUTSCENE_FIGURES, cutsceneFigure, figureBox, figuresIn } from '../../src/app/screens/cutsceneFigures.ts';
import { isStagedFx } from '../../src/app/screens/cutsceneFx.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { fx, hideActor, showActor, type Step, type StoryScript } from '../../src/story/dsl.ts';
import { CutsceneRunner, createNoopPorts } from '../../src/story/runner/CutsceneRunner.ts';
import { yojimboCavernScripts } from '../../src/story/scripts/yojimbo-cavern.ts';

function flat(steps: readonly Step[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    out.push(s);
    if (s.type === 'parallel') out.push(...flat(s.steps));
    if (s.type === 'ifFlag') out.push(...flat([...s.then, ...(s.else ?? [])]));
  }
  return out;
}

/**
 * What the stage does with a scene, step by step, without a DOM: the drawn
 * effects, and the figures it brings on and takes off. Everything else a
 * script asks of it (a `showActor` for someone with no cutscene figure, a
 * `hideActor` for someone not on stage, any other `fx` key) is exactly what
 * the screen did before.
 */
function stagedSteps(script: StoryScript): string[] {
  const onStage = new Set<string>();
  const out: string[] = [];
  for (const s of flat(script)) {
    if (s.type === 'fx' && isStagedFx(s.key)) out.push(`fx ${s.key}${s.at ? ` @${s.at}` : ''}`);
    if (s.type === 'showActor' && cutsceneFigure(s.actor)) {
      onStage.add(s.actor);
      out.push(`show ${s.actor}`);
    }
    if (s.type === 'hideActor' && onStage.delete(s.actor)) out.push(`hide ${s.actor}`);
  }
  return out;
}

describe('which chapters the stage changes (measured, pinned)', () => {
  it('lists every pre/post scene whose picture changes, and nothing else', () => {
    const changed: Record<string, string[]> = {};
    for (const c of CHAPTERS) {
      for (const phase of ['pre', 'post'] as const) {
        const script = c.scriptsRef?.[phase];
        if (!script) continue;
        const staged = stagedSteps(script);
        if (staged.length) changed[`${c.number} ${c.id} ${phase}`] = staged;
      }
    }
    expect(changed).toEqual({
      // Chapter IX, the reason for the stage: Ginnem stands, is sent, is gone.
      '9 yojimbo-cavern pre': ['fx pyreflies-rising @ginnem', 'fx sending-dance @yuna'],
      '9 yojimbo-cavern post': ['show ginnem', 'fx sending-dance @yuna', 'fx pyreflies-rising @ginnem', 'hide ginnem'],
      // Scenes that already called these keys, and now draw them instead of
      // a 90 ms flash. No figure appears in any of them.
      '1 seymour-flux post': ['fx sending-dance @yuna', 'fx pyreflies-rising'],
      '2 yunalesca post': ['fx pyreflies-rising'],
      '3 braskas-final-aeon post': ['fx sending-dance @yuna', 'fx pyreflies-rising @auron'],
      '5 ffx2-vegnagun-shuyin post': ['fx pyreflies-rising'],
      '7 seymour-anima-macalania post': ['fx sending-dance @yuna'],
    });
  });

  it('stands only Chapter IX\'s own figure, so no other chapter\'s showActor puts anyone on stage', () => {
    // Plus Trema (FFX-2 only, Chapter XIII, unlisted): his post scene; no listed chapter shows him.
    expect(Object.keys(CUTSCENE_FIGURES)).toEqual(['ginnem', 'trema']);
    for (const c of CHAPTERS) {
      const shown = [...figuresIn(c.scriptsRef?.pre ?? []), ...figuresIn(c.scriptsRef?.post ?? [])];
      expect(shown, c.id).toEqual(c.id === 'yojimbo-cavern' ? ['ginnem'] : []);
    }
  });
});

describe('figure placement', () => {
  it('stands Ginnem right of the dialogue box on a wide screen, feet on the floor', () => {
    const box = figureBox(CUTSCENE_FIGURES['ginnem'], 1600, 900);
    expect(box.cx).toBe(1280);
    expect(box.feet).toBe(810);
    // The box's right edge is 1120 px at 1600 wide: she stands clear of it.
    expect(box.cx - box.width / 2).toBeGreaterThan(1110);
    expect(box.top).toBeGreaterThan(0);
  });

  it('stands her centred above the box on a phone', () => {
    const box = figureBox(CUTSCENE_FIGURES['ginnem'], 390, 844);
    expect(box.cx).toBe(195);
    expect(box.cx - box.width / 2).toBeGreaterThan(0);
    expect(box.cx + box.width / 2).toBeLessThan(390);
    expect(box.top).toBeGreaterThan(40);
  });
});

describe('CutsceneStage', () => {
  let root: HTMLElement;
  let stage: CutsceneStage;
  let skipping = false;

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
    skipping = false;
    stage = new CutsceneStage(root, { skipping: () => skipping });
    stage.mount();
  });

  afterEach(() => {
    stage.unmount();
    root.remove();
    vi.useRealTimers();
  });

  const figureEl = (actor: string): HTMLElement | null => root.querySelector(`.cutscene__figure[data-actor="${actor}"]`);
  const motes = (): number => root.querySelectorAll('.cutscene__pyrefly').length;

  it('mounts the stage layers under the flash, and gives the dialogue box a shake layer to live in', () => {
    expect([...root.children].map((c) => c.className)).toEqual(['cutscene__shake', 'cutscene__flash']);
    expect([...stage.shakeEl.children].map((c) => c.className)).toEqual(['cutscene__figures', 'cutscene__fx']);
  });

  it('stands a staged figure with her painting, and ignores anyone without one', async () => {
    await stage.showActor(showActor('ginnem', { ms: 0, facing: -1 }));
    const el = figureEl('ginnem');
    expect(el?.classList.contains('is-on')).toBe(true);
    expect(el?.classList.contains('is-unsent')).toBe(true);
    expect(el?.classList.contains('is-flipped')).toBe(false); // the painting already faces left
    expect(el?.querySelector('img')?.getAttribute('src')).toMatch(/art\/characters\/ginnem\/idle\.png$/);
    await stage.showActor(showActor('seymour', { ms: 0 }));
    expect(figureEl('seymour')).toBeNull();
    expect(stage.cast()).toEqual(['ginnem']);
  });

  it('hideActor fades an on-stage figure over its ms and resolves after it', async () => {
    await stage.showActor(showActor('ginnem', { ms: 0 }));
    let done = false;
    void stage.hideActor(hideActor('ginnem', 1600)).then(() => (done = true));
    const el = figureEl('ginnem');
    expect(el?.classList.contains('is-leaving')).toBe(true);
    expect(el?.style.transitionDuration).toBe('1600ms');
    await vi.advanceTimersByTimeAsync(1500);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(done).toBe(true);
    expect(stage.cast()).toEqual([]);
  });

  it('hideActor for someone not on stage is the no-op it always was', async () => {
    await stage.hideActor(hideActor('seymour-macalania', 600));
    await stage.hideActor(hideActor('ginnem', 600));
    expect(root.querySelectorAll('.cutscene__figure')).toHaveLength(0);
  });

  it('draws pyreflies and resolves at once, then clears them', async () => {
    await stage.fx('pyreflies-rising', 'ginnem');
    expect(motes()).toBeGreaterThan(20);
    await vi.advanceTimersByTimeAsync(6000);
    expect(motes()).toBe(0);
  });

  it('draws the sending as an arc and a floor ring', async () => {
    await stage.fx('sending-dance', 'yuna');
    expect(root.querySelectorAll('.cutscene__sending path')).toHaveLength(2);
    expect(root.querySelectorAll('.cutscene__sending-ring')).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(root.querySelectorAll('.cutscene__sending, .cutscene__sending-ring')).toHaveLength(0);
  });

  it('keeps the flash for every other fx key, and draws nothing while the scene is skipped', async () => {
    const flash = root.querySelector<HTMLElement>('.cutscene__flash');
    void stage.fx('pyreflies-cold', 'bahamut');
    expect(flash?.style.opacity).toBe('0.7');
    expect(motes()).toBe(0);
    skipping = true;
    await stage.fx('pyreflies-rising', 'ginnem');
    expect(motes()).toBe(0);
  });
});

describe('Chapter IX post scene through the runner, on the stage', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('Ginnem stands from the first frame, the sending plays, and she is gone by Yuna\'s first line', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const stage = new CutsceneStage(root);
    stage.mount();
    stage.prepare(yojimboCavernScripts.post);
    const seen: Array<{ line: string; cast: string[]; leaving: boolean; motes: number; arcs: number }> = [];
    const runner = new CutsceneRunner(
      createNoopPorts({
        dialogue: {
          say: (s) => {
            seen.push({
              line: s.text,
              cast: stage.cast(),
              leaving: root.querySelector('.cutscene__figure.is-leaving') !== null,
              motes: root.querySelectorAll('.cutscene__pyrefly').length,
              arcs: root.querySelectorAll('.cutscene__sending').length,
            });
            return Promise.resolve();
          },
          narrate: () => Promise.resolve(),
          choice: () => Promise.resolve(''),
        },
        wait: (ms) => new Promise((r) => setTimeout(r, ms)),
        fx: (key, at) => stage.fx(key, at),
        showActor: (s) => stage.showActor(s),
        hideActor: (s) => stage.hideActor(s),
      }),
    );
    // Before the script runs, her painting is already loading, off stage.
    expect(root.querySelector('.cutscene__figure[data-actor="ginnem"]')?.classList.contains('is-on')).toBe(false);
    const run = runner.run(yojimboCavernScripts.post);
    await vi.advanceTimersByTimeAsync(0);
    expect(stage.cast()).toEqual(['ginnem']);
    await vi.advanceTimersByTimeAsync(20_000);
    const result = await run;
    expect(result.type).toBe('results');
    expect(seen[0]).toMatchObject({ line: "She's gone. Truly, this time.", cast: [], leaving: true });
    // Pyreflies still rising as she speaks (the fade is 1.6 s, the beat 1.4 s).
    expect(seen[0]?.motes).toBeGreaterThan(0);
    stage.unmount();
    root.remove();
  });

  it('the stage acts only on the steps the script already had, plus the one line that stands her up', () => {
    const post = flat(yojimboCavernScripts.post);
    expect(post.filter((s) => s.type === 'showActor')).toEqual([showActor('ginnem', { ms: 0, facing: -1 })]);
    expect(post.filter((s) => s.type === 'fx')).toEqual([fx('sending-dance', 'yuna'), fx('pyreflies-rising', 'ginnem')]);
    expect(post.filter((s) => s.type === 'hideActor')).toEqual([hideActor('ginnem', 1600)]);
  });
});
