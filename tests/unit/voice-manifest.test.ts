/**
 * A chapter's voice manifest is read defensively: anything wrong with it means text only, never a crash, and never a request for a
 * file outside the voice folder. Game case: both (shared plumbing); only FFX has recordings today (rule 14).
 */
import { describe, expect, it } from 'vitest';

import {
  GAMES_WITH_VOICE,
  chapterManifestPath,
  gameHasVoice,
  isSafeVoiceFile,
  parseChapterVoiceManifest,
  partOfId,
  voiceFilePath,
} from '../../src/story/voice/voiceManifest.ts';

const entry = { id: 'seymour-flux.pre.003', file: 'seymour-flux/seymour-flux.pre.003.mp3', ms: 1800, who: 'tidus' };
const good = { version: 1, chapter: 'seymour-flux', game: 'ffx', lines: { '0123456789abcd': entry } };

describe('which games have voice', () => {
  it('is FFX alone until Bailey picks voices for FFX-2 (his scope, 2026-10-07)', () => {
    expect(GAMES_WITH_VOICE).toEqual(['ffx']);
    expect(gameHasVoice('ffx')).toBe(true);
    expect(gameHasVoice('ffx2')).toBe(false);
    expect(gameHasVoice('ff7')).toBe(false);
    expect(gameHasVoice(undefined)).toBe(false);
  });
});

describe('parseChapterVoiceManifest', () => {
  it('accepts a well-formed FFX manifest', () => {
    const m = parseChapterVoiceManifest(good, 'seymour-flux');
    expect(m?.lines['0123456789abcd']).toEqual(entry);
  });

  it('rejects other versions, another chapter, an unvoiced game, a non-object and an HTML fallback page', () => {
    expect(parseChapterVoiceManifest({ ...good, version: 2 })).toBeNull();
    expect(parseChapterVoiceManifest(good, 'yunalesca')).toBeNull();
    expect(parseChapterVoiceManifest({ ...good, game: 'ffx2' })).toBeNull(); // an FFX-2 manifest is never read, even if one appeared
    expect(parseChapterVoiceManifest({ ...good, game: 'ff7' })).toBeNull();
    expect(parseChapterVoiceManifest('<!doctype html><html>')).toBeNull();
    expect(parseChapterVoiceManifest(null)).toBeNull();
    expect(parseChapterVoiceManifest([])).toBeNull();
    expect(parseChapterVoiceManifest({ ...good, lines: {} })).toBeNull();
  });

  it('drops a bad entry on its own and keeps the rest', () => {
    const m = parseChapterVoiceManifest({
      ...good,
      lines: {
        ok: entry,
        noFile: { ...entry, file: undefined },
        badMs: { ...entry, ms: 5 },
        hugeMs: { ...entry, ms: 600000 },
        noWho: { ...entry, who: 3 },
        traversal: { ...entry, file: '../../index.html' },
        absolute: { ...entry, file: '/etc/passwd.mp3' },
        scheme: { ...entry, file: 'https://example.com/a.mp3' },
        notMp3: { ...entry, file: 'seymour-flux/a.wav' },
      },
    });
    expect(Object.keys(m?.lines ?? {})).toEqual(['ok']);
  });

  it('rounds the length to whole milliseconds', () => {
    const m = parseChapterVoiceManifest({ ...good, lines: { a: { ...entry, ms: 1800.6 } } });
    expect(m?.lines['a']?.ms).toBe(1801);
  });
});

describe('paths', () => {
  it('only climbs down from the voice folder', () => {
    expect(isSafeVoiceFile('braskas-final-aeon/braskas-final-aeon.mid-bfa-sword.002.mp3')).toBe(true);
    expect(isSafeVoiceFile('a/../b.mp3')).toBe(false);
    expect(isSafeVoiceFile('..\\a.mp3')).toBe(false);
    expect(isSafeVoiceFile('a b.mp3')).toBe(false);
    expect(isSafeVoiceFile(42)).toBe(false);
    expect(chapterManifestPath('sin-face')).toBe('voice/sin-face.json');
    expect(voiceFilePath('sin-face/sin-face.pre.001.mp3')).toBe('voice/sin-face/sin-face.pre.001.mp3');
  });

  it('reads the script part from a line id, stand-ins included', () => {
    expect(partOfId('seymour-flux.pre.017')).toBe('pre');
    expect(partOfId('yunalesca.post.003')).toBe('post');
    expect(partOfId('braskas-final-aeon.mid-jecht-falls.003')).toBe('mid');
    expect(partOfId('braskas-final-aeon.mid-jecht-falls.003.fb1')).toBe('mid');
    expect(partOfId('sin-face.quip-tidus.001')).toBe('quip');
    expect(partOfId('weird')).toBe('other');
  });
});
