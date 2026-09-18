import { describe, expect, it } from 'vitest';

import {
  EMPTY_MANIFEST,
  clampLoopPoints,
  evictionPlan,
  hasPrerenderedMusic,
  hasPrerenderedSfx,
  musicEntry,
  parseManifest,
  resolveAudioUrl,
  sfxCue,
  type MusicEntry,
} from '../../src/audio/manifest.ts';

const GOOD = {
  version: 1,
  sampleRate: 44100,
  music: {
    'boss-seymour': {
      file: 'music/boss-seymour.mp3',
      loopStart: 7.27,
      loopEnd: 109.09,
      duration: 112.09,
      bytes: 1642774,
      lufs: -16.02,
      truePeakDb: -1.4,
    },
  },
  sfx: {
    file: 'sfx/sprite.mp3',
    duration: 152.3,
    bytes: 1769811,
    cues: {
      confirm: { offset: 0.05, duration: 0.18 },
      'sword-slash-1': { offset: 0.28, duration: 0.42 },
    },
  },
};

describe('manifest parsing', () => {
  it('reads a well-formed manifest', () => {
    const m = parseManifest(GOOD);
    expect(Object.keys(m.music)).toEqual(['boss-seymour']);
    expect(m.music['boss-seymour']!.loopEnd).toBeCloseTo(109.09, 5);
    expect(m.sfx?.cues.confirm).toEqual({ offset: 0.05, duration: 0.18 });
  });

  it('treats junk as "nothing is pre-rendered" rather than throwing', () => {
    // Every one of these has to end in silence-free fallback, not an exception:
    // a broken manifest must never be able to take the audio down with it.
    for (const junk of [null, undefined, 42, 'nope', [], { music: 'no' }]) {
      const m = parseManifest(junk);
      expect(m.music).toEqual({});
      expect(m.sfx).toBeNull();
    }
  });

  it('drops only the bad entries, keeping the good ones', () => {
    const m = parseManifest({
      ...GOOD,
      music: {
        ...GOOD.music,
        'no-file': { loopStart: 1, loopEnd: 2, duration: 3 },
        'backwards-loop': { file: 'a.mp3', loopStart: 9, loopEnd: 4, duration: 12 },
        'loop-past-end': { file: 'b.mp3', loopStart: 99, loopEnd: 120, duration: 40 },
        'nan-loop': { file: 'c.mp3', loopStart: Number.NaN, loopEnd: 4, duration: 12 },
      },
    });
    // One cue failing to encode cannot be allowed to take the other twenty.
    expect(Object.keys(m.music)).toEqual(['boss-seymour']);
  });

  it('clamps a loopEnd that overruns the declared duration', () => {
    const m = parseManifest({
      ...GOOD,
      music: { t: { file: 't.mp3', loopStart: 2, loopEnd: 99, duration: 40 } },
    });
    expect(m.music.t!.loopEnd).toBe(40);
  });

  it('rejects a sprite with no usable cues', () => {
    expect(parseManifest({ ...GOOD, sfx: { file: 's.mp3', duration: 2, cues: {} } }).sfx).toBeNull();
    expect(
      parseManifest({ ...GOOD, sfx: { file: 's.mp3', duration: 2, cues: { a: { offset: 1 } } } })
        .sfx,
    ).toBeNull();
  });

  it('answers lookups against an absent manifest without blowing up', () => {
    expect(hasPrerenderedMusic(null, 'title')).toBe(false);
    expect(musicEntry(null, 'title')).toBeNull();
    expect(hasPrerenderedSfx(null, 'confirm')).toBe(false);
    expect(sfxCue(null, 'confirm')).toBeNull();
    expect(hasPrerenderedMusic(EMPTY_MANIFEST, 'title')).toBe(false);
  });

  it('does not treat inherited Object properties as cues', () => {
    const m = parseManifest(GOOD);
    expect(hasPrerenderedMusic(m, 'constructor')).toBe(false);
    expect(hasPrerenderedSfx(m, 'toString')).toBe(false);
  });
});

describe('audio urls', () => {
  it('joins a base url to a manifest-relative file', () => {
    expect(resolveAudioUrl('/', 'music/title.mp3')).toBe('/audio/music/title.mp3');
    expect(resolveAudioUrl('/pyrefly-reprise/', 'manifest.json')).toBe(
      '/pyrefly-reprise/audio/manifest.json',
    );
    // A base without its trailing slash is the classic way to get "//" or a
    // path that silently resolves one directory too high.
    expect(resolveAudioUrl('/pyrefly-reprise', 'sfx/sprite.mp3')).toBe(
      '/pyrefly-reprise/audio/sfx/sprite.mp3',
    );
  });
});

describe('loop point maths', () => {
  const entry: MusicEntry = {
    file: 'x.mp3',
    loopStart: 10,
    loopEnd: 100,
    duration: 103,
  };

  it('leaves loop points alone when the decode came back long enough', () => {
    const { loopStart, loopEnd } = clampLoopPoints(entry, 103.02);
    expect(loopStart).toBe(10);
    expect(loopEnd).toBe(100);
  });

  it('pulls loopEnd inside a buffer the decoder returned short', () => {
    // MP3 frames are 1152 samples, so the decoded length is rarely exactly what
    // the encoder was handed. A loopEnd past the end makes Web Audio ignore the
    // loop entirely and the music stops dead — ninety seconds in, where nobody
    // is looking.
    const { loopStart, loopEnd } = clampLoopPoints(entry, 99.5);
    expect(loopEnd).toBeLessThan(99.5);
    expect(loopEnd).toBeGreaterThan(99);
    expect(loopStart).toBe(10);
  });

  it('keeps loopStart below loopEnd even on a badly truncated file', () => {
    const { loopStart, loopEnd } = clampLoopPoints(entry, 10.01);
    expect(loopEnd).toBeGreaterThan(loopStart);
  });

  it('loops the whole buffer rather than not looping at all', () => {
    const { loopStart, loopEnd } = clampLoopPoints(entry, 0.01);
    expect(loopStart).toBe(0);
    expect(loopEnd).toBeCloseTo(0.01, 6);
  });

  it('passes the entry through when the duration is not a number', () => {
    expect(clampLoopPoints(entry, Number.NaN)).toEqual({ loopStart: 10, loopEnd: 100 });
    expect(clampLoopPoints(entry, 0)).toEqual({ loopStart: 10, loopEnd: 100 });
  });
});

describe('decoded-buffer eviction', () => {
  it('keeps what is playing and what is coming, drops the rest', () => {
    const cached = ['title', 'chapter-select', 'boss-seymour', 'victory-ffx', 'ending-ffx'];
    const dropped = evictionPlan(cached, 'boss-seymour', ['victory-ffx']);
    expect(dropped).toEqual(['title', 'chapter-select', 'ending-ffx']);
  });

  it('never drops the cue that is currently playing', () => {
    expect(evictionPlan(['a', 'b'], 'a', [])).toEqual(['b']);
  });

  it('honours the keep budget when more cues are announced than fit', () => {
    const dropped = evictionPlan(['a', 'b', 'c', 'd'], 'a', ['b', 'c', 'd'], 2);
    // current + one upcoming = 2 protected; c and d go.
    expect(dropped).toEqual(['c', 'd']);
  });

  it('drops everything when nothing is playing', () => {
    expect(evictionPlan(['a', 'b'], null, [])).toEqual(['a', 'b']);
  });
});
