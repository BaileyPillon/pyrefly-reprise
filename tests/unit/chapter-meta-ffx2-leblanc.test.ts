/**
 * `FFX2_LEBLANC_META` standalone content checks.
 *
 * This chapter is **not registered** in `src/data/chapter-meta.ts`'s
 * `CHAPTER_META` array yet — see `src/data/chapter-meta-ffx2-leblanc.ts` for
 * why (it needs `src/data/encounters.ts`, a contract file, to widen
 * `ChapterId` first). These tests apply the same shape rules
 * `tests/unit/chapter-meta.test.ts` applies to every registered chapter,
 * directly against the unregistered export.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { FFX2_LEBLANC_META } from '../../src/data/chapter-meta-ffx2-leblanc.ts';

// `../..` from `tests/unit/` is the repo root.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ART_ROOT = join(REPO_ROOT, 'public', 'art');

function artExists(relativePath: string): boolean {
  return existsSync(join(ART_ROOT, relativePath));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('FFX2_LEBLANC_META', () => {
  it('is FFX-2', () => {
    expect(FFX2_LEBLANC_META.gameLabel).toBe('FFX-2');
    expect(FFX2_LEBLANC_META.id).toBe('ffx2-leblanc');
  });

  it('quote is original and under 18 words', () => {
    expect(FFX2_LEBLANC_META.quote.text.length).toBeGreaterThan(0);
    expect(wordCount(FFX2_LEBLANC_META.quote.text)).toBeLessThan(18);
    expect(FFX2_LEBLANC_META.quote.speaker.length).toBeGreaterThan(0);
  });

  it('handwritten aside is 4-6 words', () => {
    const n = wordCount(FFX2_LEBLANC_META.handwritten);
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(6);
  });

  it('subtitle is a 2-4 word tagline', () => {
    const n = wordCount(FFX2_LEBLANC_META.subtitle);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(4);
  });

  it('blurb is two sentences', () => {
    const sentenceEnders = FFX2_LEBLANC_META.blurb.match(/[.!?](?:\s|$)/g) ?? [];
    expect(sentenceEnders.length).toBe(2);
  });

  it('heroArtFallback exists under public/art (heroArt itself may not yet)', () => {
    expect(artExists(FFX2_LEBLANC_META.heroArtFallback)).toBe(true);
    expect(FFX2_LEBLANC_META.heroArt.length).toBeGreaterThan(0);
    expect(FFX2_LEBLANC_META.heroArt).not.toMatch(/\.(png|jpg|jpeg|webp)$/i);
  });

  it('every snapshot image exists under public/art', () => {
    for (const snap of FFX2_LEBLANC_META.snapshots) {
      expect(artExists(snap.image), snap.image).toBe(true);
      expect(wordCount(snap.caption)).toBeGreaterThanOrEqual(2);
      expect(wordCount(snap.caption)).toBeLessThanOrEqual(5);
    }
  });

  it('has exactly 3 objectives with unique ids and non-empty labels', () => {
    expect(FFX2_LEBLANC_META.objectives.length).toBe(3);
    const ids = FFX2_LEBLANC_META.objectives.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of FFX2_LEBLANC_META.objectives) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.rule.kind.length).toBeGreaterThan(0);
    }
  });

  it('has a victory objective (the mission always ends in one)', () => {
    expect(FFX2_LEBLANC_META.objectives.some((o) => o.rule.kind === 'victory')).toBe(true);
  });

  it("survived-ability objective names an ability the AI scripts actually use (suffix match)", () => {
    const rule = FFX2_LEBLANC_META.objectives.find((o) => o.rule.kind === 'survived-ability')?.rule;
    expect(rule?.kind).toBe('survived-ability');
    if (rule?.kind === 'survived-ability') {
      // `abilityMatches` in `src/ui/common/chapterObjectives.ts` accepts an
      // exact id or a `-${want}` suffix; the real ability id is
      // `x2-logos-russian-roulette`.
      expect('x2-logos-russian-roulette'.endsWith(`-${rule.ability}`)).toBe(true);
    }
  });

  it('status-cured objective names a status Not-So-Mighty Guard actually applies', () => {
    const rule = FFX2_LEBLANC_META.objectives.find((o) => o.rule.kind === 'status-cured')?.rule;
    expect(rule?.kind).toBe('status-cured');
    if (rule?.kind === 'status-cured') {
      expect(['protect', 'shell', 'regen']).toContain(rule.status);
    }
  });

  it('has a non-empty tip and focal character', () => {
    expect(FFX2_LEBLANC_META.tip.length).toBeGreaterThan(0);
    expect(FFX2_LEBLANC_META.focalCharacterId.length).toBeGreaterThan(0);
  });

  it('musicKeys are non-empty', () => {
    expect(FFX2_LEBLANC_META.musicKeys.length).toBeGreaterThan(0);
  });
});
