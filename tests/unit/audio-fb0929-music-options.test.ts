/**
 * fb-0929 music-quality options (Bailey's friend, 2026-09-29: "Music quality sounds kinda bad").
 *
 * **Game case: BOTH** [AGENTS.md rule 14]: shared audio plumbing; one FFX cue (boss-seymour,
 * Chapter I) and one FFX-2 cue (boss-ffx2-aeon, Chapter IV) per option.
 *
 * Options only (AGENTS.md rules 9 and 10): nothing here ships. Pins the audition package so it
 * cannot rot before Bailey listens: every player in the "Music quality options (29 Sep)" section
 * of docs/audio/audition.html points at a sketch that exists and is listed in the manifest, every
 * sketch is loudness-matched (-16 LUFS, true peak at or under -1 dBTP, measured on the encoded
 * file), both cues carry the control and all three options, and the shipped game audio still
 * routes to public/audio/music (the options did not leak into the manifest the game reads).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const DIR = join(REPO, 'docs/audio/candidates/fb-0929');

interface Sketch {
  file: string;
  cue: string;
  game: string;
  option: string;
  lufs: number;
  truePeakDb: number;
}

const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as { files: Sketch[] };
const audition = readFileSync(join(REPO, 'docs/audio/audition.html'), 'utf8');
const section = audition.slice(audition.indexOf('fb-0929-music:begin'), audition.indexOf('fb-0929-music:end'));

describe('fb-0929 music-quality options', () => {
  it('sits at the top of the listening page', () => {
    expect(section.length).toBeGreaterThan(0);
    expect(audition.indexOf('fb-0929-music:begin')).toBeLessThan(audition.indexOf('<h2'));
    expect(section).toContain('Music quality options (29 Sep)');
  });

  it('every player resolves to a listed sketch on disk', () => {
    const srcs = [...section.matchAll(/<audio[^>]*src="candidates\/fb-0929\/([^"]+)"/g)].map((m) => m[1] ?? '');
    expect(srcs.length).toBe(8);
    const listed = new Set(manifest.files.map((f) => f.file));
    for (const src of srcs) {
      expect(listed.has(src), src).toBe(true);
      expect(existsSync(join(DIR, src)), src).toBe(true);
    }
  });

  it('covers the control and every option for one FFX and one FFX-2 cue', () => {
    for (const [cue, game] of [['boss-seymour', 'ffx'], ['boss-ffx2-aeon', 'ffx2']] as const) {
      const options = manifest.files.filter((f) => f.cue === cue).map((f) => f.option).sort();
      expect(options, cue).toEqual(['0', 'O1', 'O2', 'O3']);
      expect(manifest.files.filter((f) => f.cue === cue).every((f) => f.game === game)).toBe(true);
    }
  });

  it('every sketch is loudness-matched', () => {
    for (const f of manifest.files) {
      expect(Math.abs(f.lufs + 16), f.file).toBeLessThanOrEqual(0.3);
      expect(f.truePeakDb, f.file).toBeLessThanOrEqual(-1);
    }
  });

  it('the game still reads its shipped cues, not an option', () => {
    const live = JSON.parse(readFileSync(join(REPO, 'public/audio/manifest.json'), 'utf8')) as {
      music: Record<string, { file: string }>;
    };
    for (const cue of ['boss-seymour', 'boss-ffx2-aeon']) {
      expect(live.music[cue]?.file).toBe(`music/${cue}.mp3`);
    }
  });
});
