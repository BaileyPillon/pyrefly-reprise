/**
 * The recorded voice follows the chapter being played, and only FFX chapters ask for it.
 *
 * Runs the real `voiceChapter` hook (the one `BattleScreenFlow.runChapter` wraps every chapter run in) over every chapter the game
 * has, with the real director and a spy for `fetch`: an FFX chapter fetches its own voice manifest, and an FFX-2 chapter, FF7's
 * hidden fight and the experimental FFX-2 Leblanc chapter request no voice file at all (rule 14; Bailey, 2026-10-07: the voices he
 * picked are FFX's, FFX-2 Yuna stays unvoiced until he picks). Game case: FFX only for the voice; both for the hook.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { voiceChapter } from '../../src/app/voiceChapter.ts';
import { voice } from '../../src/audio/voice/index.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let requested: string[] = [];

beforeEach(() => {
  requested = [];
  vi.stubGlobal('fetch', vi.fn(async (input: unknown) => {
    requested.push(String(input));
    return new Response('not a manifest', { status: 404 });
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const allChapters = [...CHAPTERS, ...EXPERIMENT_CHAPTERS];

describe('which chapters ask for voice', () => {
  it('covers the eighteen chapters, the experimental one, and both games', () => {
    expect(allChapters.length).toBeGreaterThanOrEqual(19);
    expect(new Set(allChapters.map((c) => c.game))).toEqual(new Set(['ffx', 'ffx2']));
  });

  it.each(allChapters.map((c) => [c.id, c.game] as const))('%s (%s) asks for exactly what its game allows', async (id, game) => {
    const end = voiceChapter(id, () => {});
    await tick();
    await tick();
    end();
    if (game === 'ffx') expect(requested).toEqual([`/audio/voice/${id}.json`]);
    else expect(requested, `${id} is an ${game} chapter: it requests no voice file`).toEqual([]);
  });

  it('an FF7 or unknown id asks for nothing', async () => {
    expect(getChapter('ff7-guard-scorpion')?.game).toBe('ff7');
    const end = voiceChapter('ff7-guard-scorpion', () => {});
    await tick();
    end();
    expect(requested).toEqual([]);
  });

  it('runs the release it was given when the chapter ends, once', () => {
    const release = vi.fn();
    const end = voiceChapter('seymour-flux', release);
    end();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('no FFX-2 chapter has a voice manifest or a recordings folder in the repo', () => {
    const dir = fileURLToPath(new URL('../../public/audio/voice/', import.meta.url));
    for (const c of allChapters.filter((x) => x.game !== 'ffx')) {
      expect(existsSync(`${dir}${c.id}.json`), `${c.id}.json`).toBe(false);
      expect(existsSync(`${dir}${c.id}`), `${c.id}/`).toBe(false);
    }
  });

  it('a line in an FFX-2 chapter never plays, even one that matches an FFX recording word for word', async () => {
    const end = voiceChapter('ffx2-leblanc', () => {});
    await tick();
    expect(voice.begin({ who: 'auron', text: 'Hmph.' })).toBeNull();
    expect(voice.spokenMs({ who: 'auron', text: 'Hmph.' })).toBe(0);
    end();
    expect(requested).toEqual([]);
  });
});
