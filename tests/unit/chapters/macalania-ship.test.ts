/**
 * Chapter VII's unlock readiness (`src/data/chapter-macalania-ship.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * Pins what the unlock depends on so the driver's one-line flip cannot land on a half-switched
 * chapter: the scene cue is one constant that the record, the pre-battle scene and the meta all
 * read, it always names a registered track, and registering the planned cue without switching
 * the constant fails here; every open pick's candidates exist in the repo; Anima's approved folder
 * is locked; and the chapter is still behind its lock line.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { hasTrack } from '../../../src/audio/tracks/index.ts';
import {
  MACALANIA_OPEN_PICKS,
  MACALANIA_SCENE_CUE,
  MACALANIA_SCENE_CUE_PLANNED,
  MACALANIA_SCENE_CUE_STAND_IN,
} from '../../../src/data/chapter-macalania-ship.ts';
import { SEYMOUR_ANIMA_MACALANIA } from '../../../src/data/chapter-seymour-anima-macalania.ts';
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

  it("every open pick's candidates are in the repo", () => {
    expect(MACALANIA_OPEN_PICKS.map((p) => p.id)).toEqual(['pause-plate', 'scene-cue', 'party-layout']);
    for (const pick of MACALANIA_OPEN_PICKS) {
      const path = pick.candidates.split(' ')[0]!;
      expect(existsSync(join(REPO, path)), path).toBe(true);
    }
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

  it('is still behind its one lock line until the driver flips it', () => {
    expect(LOCKED_CHAPTER_IDS.has('seymour-anima-macalania')).toBe(true);
  });
});
