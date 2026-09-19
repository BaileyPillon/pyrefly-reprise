// @vitest-environment jsdom
/**
 * Three round-02 fixes that all live between the script and the screen:
 *
 * - **#30** Confirm could not fast-forward a cutscene. `DialogueBox.handleInput`
 *   returns early when no line is in flight, and a scene spends most of its
 *   length in exactly that state — Chapter 1's opening carries 24 `beat`/`wait`
 *   steps totalling 38.6 s — so runs of 13, 17, 29 and 36 consecutive presses
 *   changed nothing. `CutsceneRunner.nudge()` is the press's new destination.
 * - **#04** the `results()` marker used to end a `post` script for good.
 *   `run(script, ref, { from })` plus `CutsceneRunResult.resumeAt` let the rest
 *   of it play after the panel.
 * - **#10** the approved battle-start boss card was never built.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  CutsceneRunner,
  createNoopPorts,
  type CutscenePorts,
} from '../../src/story/runner/CutsceneRunner.ts';
import { battleStart, beat, narrate, results, say, wait } from '../../src/story/dsl.ts';
import { DialogueBox } from '../../src/ui/common/DialogueBox.ts';
import { BattleStartBanner, splitBossName } from '../../src/ui/common/BattleStartBanner.ts';
import { PAUSE_CUE, setPauseMusic, type PauseMusicPort } from '../../src/ui/common/pauseMusic.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

// ---------------------------------------------------------------------------
// #04 — resuming a script past its results() marker
// ---------------------------------------------------------------------------

describe('CutsceneRunner resumes past the results marker — #04', () => {
  const script = [say('yuna', 'one'), results(), say('auron', 'two'), narrate('three')];

  it('reports the step after the marker', async () => {
    const said: string[] = [];
    const ports = createNoopPorts({
      dialogue: {
        say: (s) => {
          said.push(s.text);
          return Promise.resolve();
        },
        narrate: (s) => {
          said.push(s.text);
          return Promise.resolve();
        },
        choice: () => Promise.resolve(''),
      },
    });
    const runner = new CutsceneRunner(ports);
    const first = await runner.run(script);
    expect(first.type).toBe('results');
    expect(first.resumeAt).toBe(2);
    expect(said).toEqual(['one']);

    const rest = await runner.run(script, undefined, { from: first.resumeAt });
    expect(rest.type).toBe('end');
    expect(said).toEqual(['one', 'two', 'three']);
  });

  it('reports a resumeAt for battleStart and for falling off the end', async () => {
    const runner = new CutsceneRunner(createNoopPorts());
    const pre = await runner.run([say('tidus', 'x'), battleStart(), say('tidus', 'unreachable')]);
    expect(pre).toMatchObject({ type: 'battleStart', resumeAt: 2 });
    const mid = await runner.run([say('tidus', 'x')]);
    expect(mid).toMatchObject({ type: 'end', resumeAt: 1 });
  });

  it('clamps a silly resume index instead of throwing', async () => {
    const runner = new CutsceneRunner(createNoopPorts());
    await expect(runner.run(script, undefined, { from: 99 })).resolves.toMatchObject({ type: 'end' });
    await expect(runner.run(script, undefined, { from: -5 })).resolves.toMatchObject({ type: 'results' });
  });

  it('every shipped post script has lines after its marker, which is what #04 lost', () => {
    for (const chapter of CHAPTERS) {
      const post = chapter.scriptsRef.post;
      const at = post.findIndex((s) => s.type === 'results');
      expect(at, `${chapter.id} has no results() marker`).toBeGreaterThanOrEqual(0);
      const after = post.slice(at + 1).filter((s) => s.type === 'say' || s.type === 'narrate').length;
      expect(after, `${chapter.id} authors nothing after results()`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// #30 — Confirm during a hold
// ---------------------------------------------------------------------------

describe('nudge unblocks the step in flight — #30', () => {
  /** A `wait` port that never resolves on its own, so only a nudge can free it. */
  function stuckWaitPorts(): CutscenePorts {
    return createNoopPorts({
      wait: () =>
        new Promise<void>(() => {
          /* never */
        }),
    });
  }

  it('releases a hold that would otherwise never end', async () => {
    const runner = new CutsceneRunner(stuckWaitPorts());
    const run = runner.run([beat(4000), say('auron', 'after')]);
    // Let the runner reach the wait.
    await Promise.resolve();
    await Promise.resolve();
    runner.nudge();
    await expect(run).resolves.toMatchObject({ type: 'end' });
  });

  it('is one-shot: the next timed step still waits its full length', async () => {
    const second: { resolve: (() => void) | null } = { resolve: null };
    let seen = 0;
    const ports = createNoopPorts({
      wait: () => {
        seen++;
        if (seen === 1) {
          return new Promise<void>(() => {
            /* only a nudge frees this one */
          });
        }
        return new Promise<void>((r) => {
          second.resolve = r;
        });
      },
    });
    const runner = new CutsceneRunner(ports);
    const run = runner.run([wait(1000), wait(1000)]);
    await Promise.resolve();
    await Promise.resolve();
    runner.nudge();
    // The second wait is now in flight and has not been freed.
    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toBe(2);
    expect(runner.skipped, 'nudge must not latch the skip').toBe(false);
    second.resolve?.();
    await expect(run).resolves.toMatchObject({ type: 'end' });
  });

  it('skip() still latches, so SKIP SCENE keeps its old meaning', async () => {
    const runner = new CutsceneRunner(stuckWaitPorts());
    const run = runner.run([wait(1000), wait(1000), wait(1000)]);
    await Promise.resolve();
    runner.skip();
    await expect(run).resolves.toMatchObject({ type: 'end' });
    expect(runner.skipped).toBe(true);
  });
});

describe('DialogueBox says whether Confirm has anywhere to go — #30', () => {
  function mount(): { box: DialogueBox; root: HTMLElement } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const box = new DialogueBox({ root });
    box.mount();
    return { box, root };
  }

  it('is false with no line in flight and true while one is typing', () => {
    const { box } = mount();
    expect(box.awaitingAdvance).toBe(false);
    void box.say(say('auron', 'It is not over.'));
    expect(box.awaitingAdvance).toBe(true);
  });

  it('goes back to false once the line has been advanced past', async () => {
    const { box } = mount();
    const line = box.say(say('auron', 'Hmph.'));
    box.forceAdvance(); // completes the reveal
    box.forceAdvance(); // advances
    await line;
    expect(box.awaitingAdvance).toBe(false);
  });

  it('is true while a choice is open', () => {
    const { box } = mount();
    void box.choice({ type: 'choice', options: [{ label: 'a', value: 'a' }], resultKey: 'k' });
    expect(box.awaitingAdvance).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// #10 — the battle-start card
// ---------------------------------------------------------------------------

describe('the battle-start boss card — #10', () => {
  function root(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  }

  it('splits a two-word name the way the mockup does, and leaves one word alone', () => {
    expect(splitBossName('Seymour Flux')).toEqual(['Seymour', 'Flux']);
    expect(splitBossName("Braska's Final Aeon")).toEqual(["Braska's Final", 'Aeon']);
    expect(splitBossName('Bahamut')).toEqual(['Bahamut']);
  });

  it('carries every element the approved picture has', async () => {
    const el = root();
    const banner = new BattleStartBanner({
      root: el,
      chapterNumber: 1,
      location: 'Mt. Gagazet — the Prominence',
      bossName: 'Seymour Flux',
      subline: 'with Mortiorchis',
      party: [
        { id: 'tidus', name: 'Tidus' },
        { id: 'yuna', name: 'Yuna' },
        { id: 'auron', name: 'Auron' },
      ],
      holdMs: 5,
    });
    const shown = banner.show();
    const card = el.querySelector('[data-role="battle-start"]');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain('CHAPTER I');
    expect(card!.textContent).toContain('MT. GAGAZET');
    expect(card!.textContent).toContain('Seymour');
    expect(card!.textContent).toContain('Flux');
    expect(card!.textContent).toContain('Battle Start');
    expect(card!.querySelectorAll('.bstart__member')).toHaveLength(3);
    expect(card!.textContent).toContain('Tidus');
    await shown;
  });

  it('takes itself down on its own, and only once', async () => {
    const el = root();
    const banner = new BattleStartBanner({ root: el, bossName: 'Bahamut', holdMs: 5 });
    const shown = banner.show();
    expect(banner.visible).toBe(true);
    await shown;
    expect(banner.visible).toBe(false);
    expect(el.querySelector('[data-role="battle-start"]')).toBeNull();
    // A second dismiss is a no-op rather than a second resolve.
    banner.dismiss();
  });

  it('resolves when dismissed early, which is what a keypress does', async () => {
    const el = root();
    const banner = new BattleStartBanner({ root: el, bossName: 'Vegnagun', holdMs: 60_000 });
    const shown = banner.show();
    banner.dismiss();
    await expect(shown).resolves.toBeUndefined();
  });

  it('takes the FFX-2 accent for an FFX-2 chapter, and the FFX one otherwise', () => {
    const a = new BattleStartBanner({ root: root(), bossName: 'Shuyin', game: 'ffx2' });
    const b = new BattleStartBanner({ root: root(), bossName: 'Yunalesca', game: 'ffx' });
    expect(a.el.className).toContain('ig--ffx2');
    expect(b.el.className).not.toContain('ig--ffx2');
    a.dismiss();
    b.dismiss();
  });
});

// ---------------------------------------------------------------------------
// #02 — the pause cue
// ---------------------------------------------------------------------------

describe('the pause cue is wired — #02', () => {
  function fakeAudio(playing: string | null): PauseMusicPort & { played: string[] } {
    const port = {
      currentMusic: playing,
      played: [] as string[],
      playMusic(name: string) {
        port.played.push(name);
        port.currentMusic = name;
        return Promise.resolve();
      },
    };
    return port;
  }

  it('hushes the boss theme and brings it back', () => {
    const audio = fakeAudio('boss-seymour');
    setPauseMusic(audio, true);
    expect(audio.played).toEqual([PAUSE_CUE]);
    setPauseMusic(audio, false);
    expect(audio.played).toEqual([PAUSE_CUE, 'boss-seymour']);
  });

  it('does not stack when the menu reports paused twice', () => {
    const audio = fakeAudio('boss-shuyin');
    setPauseMusic(audio, true);
    setPauseMusic(audio, true);
    setPauseMusic(audio, false);
    expect(audio.played).toEqual([PAUSE_CUE, 'boss-shuyin']);
  });

  it('has nothing to restore when nothing was playing', () => {
    const audio = fakeAudio(null);
    setPauseMusic(audio, true);
    setPauseMusic(audio, false);
    expect(audio.played).toEqual([PAUSE_CUE]);
  });

  it('never lets a missing cue take the menu down', () => {
    const audio = {
      currentMusic: 'boss-jecht',
      playMusic: vi.fn(() => Promise.reject(new Error('unknown track'))),
    };
    expect(() => setPauseMusic(audio, true)).not.toThrow();
    expect(() => setPauseMusic(audio, false)).not.toThrow();
  });
});
