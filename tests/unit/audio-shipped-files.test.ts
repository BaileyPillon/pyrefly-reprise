/**
 * The manifest against the files it describes.
 *
 * `audio-manifest.test.ts` checks the parser with fixtures. This checks the
 * real `public/audio/manifest.json` against the real MP3s beside it, because
 * every defect this file pins was found in the shipped tree and none of them
 * were visible to a fixture:
 *
 *   - a manifest entry restored from an older render, pointing `loopEnd` a
 *     second and a half past the end of the file it names;
 *   - byte counts left behind by a re-encode, so the size budget was adding up
 *     numbers that no longer existed;
 *   - loop points rounded to four decimal places, which is 4.4 samples at
 *     44.1 kHz, so the wrap landed beside the sample the renderer crossfaded
 *     and ticked once per loop on the quietest cues in the game.
 *
 * Every one of those came from several agents rendering into one shared
 * manifest with read-modify-write, which is a race this test turns into a red
 * line instead of a listening session.
 */

import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseManifest } from '../../src/audio/manifest.ts';
import { trackNames } from '../../src/audio/tracks/index.ts';
import { sfxNames } from '../../src/audio/sfx/index.ts';

const AUDIO_DIR = new URL('../../public/audio/', import.meta.url);
const raw = JSON.parse(readFileSync(new URL('manifest.json', AUDIO_DIR), 'utf8'));
const manifest = parseManifest(raw);

const sizeOf = (file: string) => statSync(new URL(file, AUDIO_DIR)).size;

describe('the shipped audio manifest', () => {
  it('parses', () => {
    expect(manifest).not.toBeNull();
    expect(Object.keys(manifest!.music).length).toBeGreaterThan(0);
  });

  it('names a file that exists, at the size it claims', () => {
    for (const [name, entry] of Object.entries(manifest!.music)) {
      expect(() => sizeOf(entry.file), `${name} file missing`).not.toThrow();
      // Byte drift means a re-encode landed without its manifest update, which
      // is how a stale duration and a broken loop point arrive together.
      expect(entry.bytes, `${name} byte count is stale`).toBe(sizeOf(entry.file));
    }
    expect(manifest!.sfx!.bytes).toBe(sizeOf(manifest!.sfx!.file));
  });

  it('keeps every loop inside its own file', () => {
    for (const [name, entry] of Object.entries(manifest!.music)) {
      expect(entry.loopStart, `${name} loopStart`).toBeGreaterThanOrEqual(0);
      expect(entry.loopEnd, `${name} loop is empty`).toBeGreaterThan(entry.loopStart);
      // The renderer writes three seconds of the loop body again past
      // `loopEnd`, so a correct entry always has room to spare.
      expect(entry.loopEnd, `${name} loopEnd runs past the file`).toBeLessThanOrEqual(
        entry.duration!,
      );
      expect(entry.loopEnd - entry.loopStart, `${name} loop body is too short`).toBeGreaterThan(5);
    }
  });

  it('stores loop points at sample resolution, not rounded seconds', () => {
    const rate = manifest!.sampleRate ?? 44100;
    for (const [name, entry] of Object.entries(manifest!.music)) {
      for (const [label, seconds] of [
        ['loopStart', entry.loopStart],
        ['loopEnd', entry.loopEnd],
      ] as const) {
        const samples = seconds * rate;
        const slip = Math.abs(samples - Math.round(samples));
        // Four decimal places leaves up to 2.2 samples of slip and audibly
        // ticks; a value written from a sample index lands on one.
        expect(slip, `${name} ${label} is ${slip.toFixed(2)} samples off a sample boundary`)
          .toBeLessThan(0.5);
      }
    }
  });

  it('resolves every cue and effect the game can ask for', () => {
    for (const name of trackNames()) {
      expect(manifest!.music[name], `no pre-render for the cue "${name}"`).toBeDefined();
    }
    for (const name of sfxNames()) {
      expect(manifest!.sfx!.cues[name], `no sprite slice for the effect "${name}"`).toBeDefined();
    }
  });

  it('lists nothing the game cannot play', () => {
    const tracks = new Set(trackNames());
    for (const name of Object.keys(manifest!.music)) {
      expect(tracks.has(name), `manifest lists "${name}", which is not a track`).toBe(true);
    }
    const effects = new Set(sfxNames());
    for (const name of Object.keys(manifest!.sfx!.cues)) {
      expect(effects.has(name), `sprite lists "${name}", which is not an effect`).toBe(true);
    }
  });

  it('keeps every sprite slice inside the sprite, in order and without overlap', () => {
    const sprite = manifest!.sfx!;
    let previousEnd = 0;
    for (const [name, cue] of Object.entries(sprite.cues)) {
      expect(cue.offset, `${name} starts before the previous cue ends`).toBeGreaterThanOrEqual(
        previousEnd - 1e-6,
      );
      previousEnd = cue.offset + cue.duration;
      expect(previousEnd, `${name} runs past the sprite`).toBeLessThanOrEqual(
        sprite.duration! + 1e-3,
      );
    }
  });

  it('stays inside the 60 MB shipping budget', () => {
    const total =
      Object.values(manifest!.music).reduce((sum, entry) => sum + (entry.bytes ?? 0), 0) +
      (manifest!.sfx!.bytes ?? 0);
    expect(total).toBeLessThan(60e6);
  });
});
