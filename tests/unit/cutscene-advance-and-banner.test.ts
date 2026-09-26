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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
      // Chapter IX's draft puts `[BEAT: results()]` after its last line
      // (docs/plans/yojimbo-story-draft.md, post-battle beat 5): nothing follows.
      // Chapter XII's draft does the same (docs/plans/omnis-story-draft.md, "Post-battle": Auron's line, then `results()`),
      // and so does Chapter X's (docs/plans/natus-story-draft.md, "Post-battle": the Calm Lands line, then `results()`),
      // and Chapter XIV's (docs/plans/isaaru-story-draft.md: the stairs interlude, then `results()`).
      const endsOnResults = ['yojimbo-cavern', 'seymour-natus', 'seymour-omnis', 'isaaru-via-purifico'];
      if (endsOnResults.includes(chapter.id)) {
        expect(after).toBe(0);
        continue;
      }
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

  /**
   * The refutation of the first pass at #10: the card was right and its foot
   * strip was not. `portrait.ts` adopts **any** `art/portraits/` `<img>` in the
   * document and writes `position:absolute` plus a several-hundred-percent
   * width inline; the tile had no `position`, so three full-size paintings
   * escaped its `overflow:hidden`, resolved against `.bstart` and covered the
   * words BATTLE START. Measured live: tile 40x40, img 2322x3394 at x=-149.
   *
   * Two halves, so neither can regress alone: the markup must ask for a
   * managed head crop, and the frame must be a containing block for it.
   * (Shared plumbing, so it is a "both games" fix — CHECKS.md CHK-020. The
   * card's only game-specific part is the accent token, untouched here.)
   */
  it('gives each party portrait a managed head crop inside a positioned frame', () => {
    const el = root();
    const banner = new BattleStartBanner({
      root: el,
      bossName: 'Seymour Flux',
      party: [
        { id: 'tidus', name: 'Tidus' },
        { id: 'yuna', name: 'Yuna' },
        { id: 'kimahri', name: 'Kimahri' },
      ],
      holdMs: 60_000,
    });
    const tiles = [...banner.el.querySelectorAll('.bstart__tile')];
    expect(tiles).toHaveLength(3);
    for (const tile of tiles) {
      // The initial is a floor of its own, not the tile's text, so the
      // painting has something to cover rather than something to fight.
      expect(tile.querySelector('.bstart__initial')).not.toBeNull();
      const img = tile.querySelector('img');
      expect(img).not.toBeNull();
      // `faceImgHtml`'s signature: the sweep will correct this element in
      // place rather than adopt it and guess.
      expect(img!.getAttribute('data-face-crop')).toBeTruthy();
      // …and it is already placed as a crop on the first paint.
      expect(img!.getAttribute('style') ?? '').toContain('position:absolute');
    }
    banner.dismiss();
  });

  /**
   * FFX-2 only, and for an FFX-2 reason: a Gullwing's sprite key is her
   * dressphere, which the fleet paints as a full body and not as a portrait,
   * so the card asked for `portraits/yuna-gunner.png`, missed, and drew a Y.
   * An FFX guardian's sprite key is her id, so her path must not change.
   */
  it('falls from a dressphere key back to the character portrait — FFX-2 only', () => {
    const ffx2 = new BattleStartBanner({
      root: root(),
      bossName: 'Bahamut',
      game: 'ffx2',
      party: [
        { id: 'yuna', artId: 'yuna-gunner', name: 'Yuna' },
        { id: 'paine', artId: 'paine-warrior', name: 'Paine' },
      ],
      holdMs: 60_000,
    });
    const srcs = [...ffx2.el.querySelectorAll('.bstart__tile img')].map(
      (i) => i.getAttribute('src') ?? '',
    );
    // Yuna: the dressphere portrait first, then her own; Paine has no portrait
    // file at all, so the head of her dressphere painting is the floor.
    expect(srcs.some((s) => s.includes('portraits/yuna'))).toBe(true);
    expect(srcs.some((s) => s.includes('characters/paine-warrior/idle.png'))).toBe(true);
    ffx2.dismiss();

    // FFX: sprite key === id, so one image and nothing new asked for.
    const ffx = new BattleStartBanner({
      root: root(),
      bossName: 'Seymour Flux',
      game: 'ffx',
      party: [{ id: 'auron', artId: 'auron', name: 'Auron' }],
      holdMs: 60_000,
    });
    const ffxSrcs = [...ffx.el.querySelectorAll('.bstart__tile img')].map(
      (i) => i.getAttribute('src') ?? '',
    );
    expect(ffxSrcs).toHaveLength(1);
    expect(ffxSrcs[0]).toContain('portraits/auron.png');
    ffx.dismiss();
  });

  it('frames those crops in a positioned, clipping tile', () => {
    // `import.meta.url` is an http URL under jsdom, so this resolves from the
    // runner's root instead (vitest runs from the repo root).
    const css = readFileSync(join(process.cwd(), 'src/ui/common/battle-start-banner.css'), 'utf8');
    const block = /\.bstart__tile\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(block).not.toBe('');
    // Without this the absolutely-positioned crop resolves against `.bstart`.
    expect(block).toMatch(/position:\s*relative/);
    expect(block).toMatch(/overflow:\s*hidden/);
    const initial = /\.bstart__initial\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(initial).toMatch(/position:\s*absolute/);
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
