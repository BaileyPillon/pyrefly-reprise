/**
 * Chapter VII's unlock readiness (`src/data/chapter-macalania-ship.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * Pins what the unlock depended on, so the chapter cannot stand unlocked on a half-switched
 * state: the scene cue is one constant that the record, the pre-battle scene and the meta all
 * read, it always names a registered track, and it is the chapter's own `scene-macalania-temple`
 * (D-278: sketch A in remaster R1), shipped with a sample-exact loop; no pick is left open;
 * Anima's approved folder and the picked pause plate (A2) are locked; the party stands on the
 * picked layout B; and the lock line is gone (unlocked 2026-09-29).
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { getTrack, hasTrack } from '../../../src/audio/tracks/index.ts';
import {
  MACALANIA_OPEN_PICKS,
  MACALANIA_SCENE_CUE,
  MACALANIA_SCENE_CUE_PLANNED,
  MACALANIA_SCENE_CUE_STAND_IN,
} from '../../../src/data/chapter-macalania-ship.ts';
import { SEYMOUR_ANIMA_MACALANIA } from '../../../src/data/chapter-seymour-anima-macalania.ts';
import { MACALANIA_PARTY_LAYOUT } from '../../../src/scenes/macalania-temple-layout.ts';
import { SEYMOUR_ANIMA_MACALANIA_META } from '../../../src/data/chapter-meta-seymour-anima-macalania.ts';
import { LOCKED_CHAPTER_IDS } from '../../../src/app/screens/frontend/comingChapters.ts';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));

describe('Chapter VII ship layer', () => {
  it('the scene cue is one constant: record, pre-battle scene and meta all read it', () => {
    expect(SEYMOUR_ANIMA_MACALANIA.music.scene).toBe(MACALANIA_SCENE_CUE);
    const firstMusic = SEYMOUR_ANIMA_MACALANIA.scriptsRef.pre.find((s) => s.type === 'music');
    expect(firstMusic && 'track' in firstMusic ? firstMusic.track : undefined).toBe(MACALANIA_SCENE_CUE);
    expect(SEYMOUR_ANIMA_MACALANIA_META.musicKeys[0]).toBe(MACALANIA_SCENE_CUE);
  });

  it('the scene cue always names a registered track', () => {
    expect(hasTrack(MACALANIA_SCENE_CUE)).toBe(true);
  });

  it('switches to the planned cue as soon as that cue is registered (never both half-way)', () => {
    if (hasTrack(MACALANIA_SCENE_CUE_PLANNED)) expect(MACALANIA_SCENE_CUE).toBe(MACALANIA_SCENE_CUE_PLANNED);
    else expect(MACALANIA_SCENE_CUE).toBe(MACALANIA_SCENE_CUE_STAND_IN);
  });

  it('plays its own scene cue now, not the stand-in (D-278)', () => {
    expect(MACALANIA_SCENE_CUE).toBe(MACALANIA_SCENE_CUE_PLANNED);
    expect(MACALANIA_SCENE_CUE).not.toBe(MACALANIA_SCENE_CUE_STAND_IN);
    expect(getTrack(MACALANIA_SCENE_CUE).bpm).toBe(56);
  });

  it('ships the cue as a loop the game can wrap sample-exactly, at the game loudness', () => {
    const manifest = JSON.parse(readFileSync(join(REPO, 'public/audio/manifest.json'), 'utf8')) as {
      music: Record<string, { file: string; loopStart: number; loopEnd: number; duration: number; lufs: number; truePeakDb: number }>;
    };
    const entry = manifest.music[MACALANIA_SCENE_CUE_PLANNED]!;
    expect(entry.file).toBe('music/scene-macalania-temple.mp3');
    expect(existsSync(join(REPO, 'public/audio', entry.file))).toBe(true);
    // Beat 12 (the walk) to beat 56 at 56 bpm, and the 3 s run-on of the shipped layout.
    expect(Math.round(entry.loopStart * 44100)).toBe(567000);
    expect(Math.round(entry.loopEnd * 44100)).toBe(2646000);
    expect(entry.duration).toBe(entry.loopEnd + 3);
    expect(Math.abs(entry.lufs + 16)).toBeLessThanOrEqual(0.2);
    expect(entry.truePeakDb).toBeLessThanOrEqual(-1);
  });

  it('no pick is left open, and the sketches the cue came from stay in the repo', () => {
    // The pause plate (A2) and the party layout (B) were picked on 2026-09-25, the scene cue on 2026-09-29.
    expect(MACALANIA_OPEN_PICKS).toEqual([]);
    const audition = readFileSync(join(REPO, 'docs/audio/audition.html'), 'utf8');
    for (const f of ['macalania-scene-a-frozen-temple', 'macalania-scene-b-wedding-proposal', 'macalania-scene-c-crystal-and-pyreflies']) {
      expect(audition).toContain(`sketches/2026-09-24/${f}.mp3`);
      expect(existsSync(join(REPO, `docs/audio/sketches/2026-09-24/${f}.mp3`))).toBe(true);
    }
  });

  it('the pause fallback is the approved human-form speaker portrait (D-065), not the Flux-era face', () => {
    expect(SEYMOUR_ANIMA_MACALANIA_META.heroArtFallback).toBe('portraits/seymour-macalania.png');
  });

  it("Anima's approved folder is locked (D-108, D-141), and matches the files when they are on disk", () => {
    const sets = JSON.parse(readFileSync(join(REPO, 'docs/target/approved-hashes.json'), 'utf8')).sets as Record<
      string,
      Record<string, { sha256?: string }>
    >;
    const set = sets['chapter:macalania-anima:2026-09-25'];
    expect(set).toBeDefined();
    const pngs = ['idle', 'attack', 'overdrive', 'hurt', 'ko'].map((p) => `public/art/characters/anima/${p}.png`);
    for (const f of pngs) {
      const sha = set![f]?.sha256;
      expect(sha, f).toMatch(/^[0-9a-f]{64}$/);
      const abs = join(REPO, f);
      if (existsSync(abs)) expect(createHash('sha256').update(readFileSync(abs)).digest('hex'), f).toBe(sha);
    }
  });

  it("the picked pause plate (A2) is locked, and the files on disk are the lock's", () => {
    const sets = JSON.parse(readFileSync(join(REPO, 'docs/target/approved-hashes.json'), 'utf8')).sets as Record<
      string,
      Record<string, { sha256?: string }> & { words?: string }
    >;
    const set = sets['chapter:macalania-pause:2026-09-25'];
    expect(set?.words).toBe('All your recommendations');
    for (const f of ['public/art/pause/macalania.png', 'public/art/pause/macalania.2x.webp']) {
      const sha = set![f]?.sha256;
      expect(sha, f).toMatch(/^[0-9a-f]{64}$/);
      const abs = join(REPO, f);
      if (existsSync(abs)) expect(createHash('sha256').update(readFileSync(abs)).digest('hex'), f).toBe(sha);
    }
    const sidecar = join(REPO, 'public/art/pause/macalania.json');
    if (existsSync(sidecar)) {
      const side = JSON.parse(readFileSync(sidecar, 'utf8')) as { status: string; focal: { x: number; y: number } };
      expect(side.status).toMatch(/^APPROVED \(pause plate redo option A2/);
      expect(side.focal).toEqual({ x: 0.45, y: 0.43 });
    }
    expect(SEYMOUR_ANIMA_MACALANIA_META.heroArt).toBe('pause/macalania');
  });

  it('stands on the picked party layout B', () => {
    expect(MACALANIA_PARTY_LAYOUT).toBe('b');
  });

  it('is unlocked: its lock line is gone', () => {
    expect(LOCKED_CHAPTER_IDS.has('seymour-anima-macalania')).toBe(false);
  });
});
