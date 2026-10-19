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
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let requested: string[] = [];
/** Every request for something other than the chapter list (`voice/index.json` is asked for once per page, by the first chapter). */
const chapterRequests = (): string[] => requested.filter((p) => !p.endsWith('/audio/voice/index.json'));

const VOICE_DIR = fileURLToPath(new URL('../../public/audio/voice/', import.meta.url));
const shippedIndex = existsSync(`${VOICE_DIR}index.json`) ? readFileSync(`${VOICE_DIR}index.json`, 'utf8') : null;
const voiced = new Set<string>(shippedIndex ? Object.keys((JSON.parse(shippedIndex) as { chapters: Record<string, unknown> }).chapters) : []);

beforeEach(() => {
  requested = [];
  // The shipped chapter list answers 200 as the host does; every other voice file answers 404 (no manifest is served here).
  vi.stubGlobal('fetch', vi.fn(async (input: unknown) => {
    requested.push(String(input));
    if (shippedIndex && String(input).endsWith('/audio/voice/index.json')) return new Response(shippedIndex, { status: 200 });
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
    if (game !== 'ffx') expect(requested, `${id} is an ${game} chapter: it requests no voice file`).toEqual([]);
    else if (!shippedIndex || voiced.has(id)) expect(chapterRequests()).toEqual([`/audio/voice/${id}.json`]);
    // LV55-1: a hidden FFX chapter the chapter list does not name asks for no manifest at all (the host answered 404 and the console logged it)
    else expect(chapterRequests(), `${id} is not in voice/index.json: no request for its manifest`).toEqual([]);
  });

  it('the hidden FFX chapters with no recording are not in the chapter list, and ask for nothing (LV55-1)', async () => {
    const hidden = allChapters.filter((c) => ['biran-yenke', 'sinspawn-gui', 'exp-fayth', 'last-summoning'].includes(c.id)).map((c) => c.id);
    expect(hidden.length).toBeGreaterThan(0);
    for (const id of hidden) {
      expect(voiced.has(id), `${id} has a manifest after all: drop it from this list`).toBe(false);
      const end = voiceChapter(id, () => {});
      await tick();
      await tick();
      end();
    }
    expect(requested.filter((p) => hidden.some((id) => p.endsWith(`/audio/voice/${id}.json`)))).toEqual([]);
    expect(requested.filter((p) => p.endsWith('/audio/voice/index.json')).length).toBeLessThanOrEqual(1);
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
    for (const c of allChapters.filter((x) => x.game !== 'ffx')) {
      expect(existsSync(`${VOICE_DIR}${c.id}.json`), `${c.id}.json`).toBe(false);
      expect(existsSync(`${VOICE_DIR}${c.id}`), `${c.id}/`).toBe(false);
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
