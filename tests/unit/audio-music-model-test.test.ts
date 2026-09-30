/**
 * music-model-test (2026-09-30): the "N1 newer model" audition sketches (ACE-Step 1.5, official
 * MIT files), added to the "Music quality options" section after Bailey's "yes, all your
 * recommendations" (2026-09-29 ~23:00 EDT), which asked for a newer AI music model to be tested
 * before O2 or O3 is decided.
 *
 * **Game case: BOTH** [AGENTS.md rule 14]: shared audio plumbing; one FFX cue (boss-seymour,
 * Chapter I) and one FFX-2 cue (boss-ffx2-aeon, Chapter IV).
 *
 * Options only (rules 9 and 10): nothing here ships. Pins the package so it cannot rot before
 * Bailey listens: every N1 player in the section points at a listed sketch on disk, both cues
 * carry N1, every sketch is loudness-matched like the O1-O3 sketches (-16 LUFS within 0.3, true
 * peak at or under -1 dBTP, measured on the encoded file), the codec measurements that decided
 * whether to make the sketches are recorded for both models on both inputs, and the game still
 * routes both cues to public/audio/music.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const DIR = join(REPO, 'docs/audio/candidates/music-model-test');

interface Sketch {
  file: string;
  cue: string;
  game: string;
  option: string;
  lufs: number;
  truePeakDb: number;
}

interface Codec {
  input: string;
  model: string;
  hfFlatnessDb: number;
  riseMs: number;
  corr: number;
  band2k5to6kDb: number;
}

const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as { files: Sketch[]; codec: Codec[] };
const audition = readFileSync(join(REPO, 'docs/audio/audition.html'), 'utf8');
const section = audition.slice(audition.indexOf('fb-0929-music:begin'), audition.indexOf('fb-0929-music:end'));

describe('music-model-test: N1 newer model', () => {
  it('every N1 player in the music-quality section resolves to a listed sketch on disk', () => {
    const srcs = [...section.matchAll(/<audio[^>]*src="candidates\/music-model-test\/([^"]+)"/g)].map((m) => m[1] ?? '');
    expect(srcs.length).toBe(2);
    const listed = new Set(manifest.files.map((f) => f.file));
    for (const src of srcs) {
      expect(listed.has(src), src).toBe(true);
      expect(existsSync(join(DIR, src)), src).toBe(true);
    }
    expect(section).toContain('N1 newer model');
  });

  it('covers one FFX and one FFX-2 cue', () => {
    for (const [cue, game] of [['boss-seymour', 'ffx'], ['boss-ffx2-aeon', 'ffx2']] as const) {
      const rows = manifest.files.filter((f) => f.cue === cue);
      expect(rows.map((f) => f.option), cue).toEqual(['N1']);
      expect(rows.every((f) => f.game === game)).toBe(true);
    }
  });

  it('every sketch is loudness-matched with the O1-O3 sketches', () => {
    for (const f of manifest.files) {
      expect(Math.abs(f.lufs + 16), f.file).toBeLessThanOrEqual(0.3);
      expect(f.truePeakDb, f.file).toBeLessThanOrEqual(-1);
    }
  });

  it('records the codec round trip of both models on both inputs', () => {
    for (const input of ['seymour', 'aeon']) {
      const models = manifest.codec.filter((c) => c.input === input).map((c) => c.model).sort();
      expect(models, input).toEqual(['ace-step-1.5', 'ace-step-v1', 'input']);
    }
    for (const c of manifest.codec) {
      for (const v of [c.hfFlatnessDb, c.riseMs, c.corr, c.band2k5to6kDb]) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('the game still reads its shipped cues, not a sketch', () => {
    const live = JSON.parse(readFileSync(join(REPO, 'public/audio/manifest.json'), 'utf8')) as {
      music: Record<string, { file: string }>;
    };
    for (const cue of ['boss-seymour', 'boss-ffx2-aeon']) {
      expect(live.music[cue]?.file).toBe(`music/${cue}.mp3`);
    }
  });
});
