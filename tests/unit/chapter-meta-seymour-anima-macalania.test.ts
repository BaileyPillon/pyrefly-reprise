/**
 * `SEYMOUR_ANIMA_MACALANIA_META` standalone content checks.
 *
 * This chapter is **not registered** in `src/data/chapter-meta.ts`'s
 * `CHAPTER_META` array yet — see
 * `src/data/chapter-meta-seymour-anima-macalania.ts` for why (it needs
 * `src/data/encounters.ts`, a contract file, to widen `ChapterId` first).
 * These tests apply the same shape rules `tests/unit/chapter-meta.test.ts`
 * applies to every registered chapter, directly against the unregistered
 * export — the same pattern `tests/unit/chapter-meta-ffx2-leblanc.test.ts`
 * used before its own integrator commit.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { SEYMOUR_ANIMA_MACALANIA_META } from '../../src/data/chapter-meta-seymour-anima-macalania.ts';

// `../..` from `tests/unit/` is the repo root.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ART_ROOT = join(REPO_ROOT, 'public', 'art');

function artExists(relativePath: string): boolean {
  return existsSync(join(ART_ROOT, relativePath));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('SEYMOUR_ANIMA_MACALANIA_META', () => {
  it('is FFX', () => {
    expect(SEYMOUR_ANIMA_MACALANIA_META.gameLabel).toBe('FFX');
    expect(SEYMOUR_ANIMA_MACALANIA_META.id).toBe('seymour-anima-macalania');
  });

  it('quote is original and under 18 words', () => {
    expect(SEYMOUR_ANIMA_MACALANIA_META.quote.text.length).toBeGreaterThan(0);
    expect(wordCount(SEYMOUR_ANIMA_MACALANIA_META.quote.text)).toBeLessThan(18);
    expect(SEYMOUR_ANIMA_MACALANIA_META.quote.speaker.length).toBeGreaterThan(0);
  });

  it('handwritten aside is 4-6 words', () => {
    const n = wordCount(SEYMOUR_ANIMA_MACALANIA_META.handwritten);
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(6);
  });

  it('subtitle is a 2-4 word tagline', () => {
    const n = wordCount(SEYMOUR_ANIMA_MACALANIA_META.subtitle);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(4);
  });

  it('blurb is two sentences', () => {
    const sentenceEnders = SEYMOUR_ANIMA_MACALANIA_META.blurb.match(/[.!?](?:\s|$)/g) ?? [];
    expect(sentenceEnders.length).toBe(2);
  });

  it('heroArtFallback exists under public/art (heroArt itself may not yet)', () => {
    expect(artExists(SEYMOUR_ANIMA_MACALANIA_META.heroArtFallback)).toBe(true);
    expect(SEYMOUR_ANIMA_MACALANIA_META.heroArt.length).toBeGreaterThan(0);
    expect(SEYMOUR_ANIMA_MACALANIA_META.heroArt).not.toMatch(/\.(png|jpg|jpeg|webp)$/i);
  });

  // Critic pass on 62b4927: `heroArt` named a file that was never rendered
  // ('pause/ch7-seymour-anima-macalania'), so the pause tab fell back to the
  // Flux-era portrait while the installed plate (`pause/macalania.png`, CANDIDATE)
  // was wired to nothing. The plate exists, so the name must reach it.
  it('heroArt names the installed pause plate', () => {
    expect(artExists(`${SEYMOUR_ANIMA_MACALANIA_META.heroArt}.png`)).toBe(true);
  });

  it('every snapshot image exists under public/art', () => {
    for (const snap of SEYMOUR_ANIMA_MACALANIA_META.snapshots) {
      expect(artExists(snap.image), snap.image).toBe(true);
      expect(wordCount(snap.caption)).toBeGreaterThanOrEqual(2);
      expect(wordCount(snap.caption)).toBeLessThanOrEqual(5);
    }
  });

  it('has exactly 3 objectives with unique ids and non-empty labels', () => {
    expect(SEYMOUR_ANIMA_MACALANIA_META.objectives.length).toBe(3);
    const ids = SEYMOUR_ANIMA_MACALANIA_META.objectives.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of SEYMOUR_ANIMA_MACALANIA_META.objectives) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.rule.kind.length).toBeGreaterThan(0);
    }
  });

  it('has a victory objective (the mission always ends in one)', () => {
    expect(SEYMOUR_ANIMA_MACALANIA_META.objectives.some((o) => o.rule.kind === 'victory')).toBe(true);
  });

  it('parts-downed objective names both Guado Guardian combatant ids', () => {
    const rule = SEYMOUR_ANIMA_MACALANIA_META.objectives.find((o) => o.rule.kind === 'parts-downed')?.rule;
    expect(rule?.kind).toBe('parts-downed');
    if (rule?.kind === 'parts-downed') {
      expect(rule.targetIds).toContain('guado-guardian-a');
      expect(rule.targetIds).toContain('guado-guardian-b');
    }
  });

  it('survived-ability objective names the real Anima Pain ability id', () => {
    const rule = SEYMOUR_ANIMA_MACALANIA_META.objectives.find((o) => o.rule.kind === 'survived-ability')?.rule;
    expect(rule?.kind).toBe('survived-ability');
    if (rule?.kind === 'survived-ability') {
      // `abilityMatches` in `src/ui/common/chapterObjectives.ts` accepts an
      // exact id or a `-${want}` suffix; the real ability id (distinct from
      // the player's `pain` ability, see
      // `src/data/ffx/enemies/seymour-anima-macalania-abilities.ts`) is
      // `anima-pain-boss`.
      expect(
        rule.ability === 'anima-pain-boss' || 'anima-pain-boss'.endsWith(`-${rule.ability}`),
      ).toBe(true);
    }
  });

  it('has a non-empty tip and focal character', () => {
    expect(SEYMOUR_ANIMA_MACALANIA_META.tip.length).toBeGreaterThan(0);
    expect(SEYMOUR_ANIMA_MACALANIA_META.focalCharacterId.length).toBeGreaterThan(0);
  });

  it("musicKeys are the chapter's own battle cue, the scene stopgap and the shared FFX fanfare", () => {
    // `boss-seymour-macalania` is the fight's own cue (2026-09-24); the scene
    // still borrows Chapter 1's `scene-gagazet` until `scene-macalania-temple`
    // exists (docs/handoff/chapter-macalania.md).
    expect(SEYMOUR_ANIMA_MACALANIA_META.musicKeys).toContain('scene-gagazet');
    expect(SEYMOUR_ANIMA_MACALANIA_META.musicKeys).toContain('boss-seymour-macalania');
    expect(SEYMOUR_ANIMA_MACALANIA_META.musicKeys).not.toContain('boss-seymour');
    expect(SEYMOUR_ANIMA_MACALANIA_META.musicKeys).toContain('victory-ffx');
  });
});
