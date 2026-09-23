/**
 * `EVRAE_META` standalone content checks.
 *
 * This chapter is **not registered** in `src/data/chapter-meta.ts`'s
 * `CHAPTER_META` array yet — see `src/data/chapter-meta-evrae.ts` for why (it
 * needs `src/data/encounters.ts`, a contract file, to widen `ChapterId`
 * first). These tests apply the same shape rules
 * `tests/unit/chapter-meta.test.ts` applies to every registered chapter,
 * directly against the unregistered export — the same pattern
 * `tests/unit/chapter-meta-seymour-anima-macalania.test.ts` used before its
 * own integrator commit.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { EVRAE_META } from '../../src/data/chapter-meta-evrae.ts';

// `../..` from `tests/unit/` is the repo root.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ART_ROOT = join(REPO_ROOT, 'public', 'art');

function artExists(relativePath: string): boolean {
  return existsSync(join(ART_ROOT, relativePath));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('EVRAE_META', () => {
  it('is FFX', () => {
    expect(EVRAE_META.gameLabel).toBe('FFX');
    expect(EVRAE_META.id).toBe('evrae');
  });

  it('quote is original and under 18 words', () => {
    expect(EVRAE_META.quote.text.length).toBeGreaterThan(0);
    expect(wordCount(EVRAE_META.quote.text)).toBeLessThan(18);
    expect(EVRAE_META.quote.speaker.length).toBeGreaterThan(0);
  });

  it('handwritten aside is 4-6 words', () => {
    const n = wordCount(EVRAE_META.handwritten);
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(6);
  });

  it('subtitle is a 2-4 word tagline', () => {
    const n = wordCount(EVRAE_META.subtitle);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(4);
  });

  it('blurb is two sentences', () => {
    const sentenceEnders = EVRAE_META.blurb.match(/[.!?](?:\s|$)/g) ?? [];
    expect(sentenceEnders.length).toBe(2);
  });

  it('heroArtFallback exists under public/art (heroArt itself may not yet)', () => {
    expect(artExists(EVRAE_META.heroArtFallback)).toBe(true);
    expect(EVRAE_META.heroArt.length).toBeGreaterThan(0);
    expect(EVRAE_META.heroArt).not.toMatch(/\.(png|jpg|jpeg|webp)$/i);
  });

  it('heroArt names an installed pause plate (CANDIDATE, not Bailey-approved)', () => {
    expect(artExists(`${EVRAE_META.heroArt}.png`)).toBe(true);
  });

  it('every snapshot image exists under public/art', () => {
    for (const snap of EVRAE_META.snapshots) {
      expect(artExists(snap.image), snap.image).toBe(true);
      expect(wordCount(snap.caption)).toBeGreaterThanOrEqual(2);
      expect(wordCount(snap.caption)).toBeLessThanOrEqual(5);
    }
  });

  it('has exactly 3 objectives with unique ids and non-empty labels', () => {
    expect(EVRAE_META.objectives.length).toBe(3);
    const ids = EVRAE_META.objectives.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of EVRAE_META.objectives) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.rule.kind.length).toBeGreaterThan(0);
    }
  });

  it('has a victory objective (the mission always ends in one)', () => {
    expect(EVRAE_META.objectives.some((o) => o.rule.kind === 'victory')).toBe(true);
  });

  it('survived-ability objective names the real Poison Breath ability id by suffix', () => {
    const rule = EVRAE_META.objectives.find((o) => o.rule.kind === 'survived-ability')?.rule;
    expect(rule?.kind).toBe('survived-ability');
    if (rule?.kind === 'survived-ability') {
      // `abilityMatches` in `src/ui/common/chapterObjectives.ts` accepts an
      // exact id or a `-${want}` suffix; the real ability id
      // (`src/data/ffx/enemies/evrae-abilities.ts`) is `evrae-poison-breath`.
      expect(rule.ability === 'evrae-poison-breath' || 'evrae-poison-breath'.endsWith(`-${rule.ability}`)).toBe(true);
    }
  });

  it('status-cured objective names petrify, the status the Al Bhed Potion clears with the highest stakes', () => {
    const rule = EVRAE_META.objectives.find((o) => o.rule.kind === 'status-cured')?.rule;
    expect(rule?.kind).toBe('status-cured');
    if (rule?.kind === 'status-cured') expect(rule.status).toBe('petrify');
  });

  it('has a non-empty tip and focal character', () => {
    expect(EVRAE_META.tip.length).toBeGreaterThan(0);
    expect(EVRAE_META.focalCharacterId.length).toBeGreaterThan(0);
  });

  it('musicKeys are a recorded stopgap (§12.6 names no cue), plus the shared FFX fanfare', () => {
    expect(EVRAE_META.musicKeys).toContain('scene-gagazet');
    expect(EVRAE_META.musicKeys).toContain('boss-seymour');
    expect(EVRAE_META.musicKeys).toContain('victory-ffx');
    for (const key of EVRAE_META.musicKeys) expect(key.startsWith('ffx2') || key.includes('ffx2')).toBe(false);
  });
});
