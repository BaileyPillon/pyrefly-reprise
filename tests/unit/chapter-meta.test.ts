import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CHAPTER_IDS, CHAPTERS } from '../../src/data/encounters.ts';
import { CHAPTER_META, GAME_LABELS, getChapterMeta, type ChapterMeta } from '../../src/data/chapter-meta.ts';

// `../..` from `tests/unit/` is the repo root.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ART_ROOT = join(REPO_ROOT, 'public', 'art');

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

/** True when a path relative to `public/art/` names a file that exists on disk. */
function artExists(relativePath: string): boolean {
  return existsSync(join(ART_ROOT, relativePath));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe('CHAPTER_META', () => {
  it('has exactly one entry per chapter, in the same play order as CHAPTERS', () => {
    expect(CHAPTER_META.length).toBe(CHAPTERS.length);
    expect(CHAPTER_META.map((m) => m.id)).toEqual([...CHAPTER_IDS]);
  });

  it.each(CHAPTER_META)('$id: gameLabel and numeral agree with encounters.ts', (meta) => {
    const chapter = CHAPTERS.find((c) => c.id === meta.id);
    expect(chapter).toBeDefined();
    if (!chapter) return;
    expect(meta.gameLabel).toBe(GAME_LABELS[chapter.game]);
    expect(meta.numeral).toBe(NUMERALS[chapter.number - 1]);
  });

  it.each(CHAPTER_META)('$id: quote is original and under 18 words', (meta) => {
    expect(meta.quote.text.length).toBeGreaterThan(0);
    expect(wordCount(meta.quote.text)).toBeLessThan(18);
    expect(meta.quote.speaker.length).toBeGreaterThan(0);
  });

  it.each(CHAPTER_META)('$id: handwritten aside is 4-6 words', (meta) => {
    const n = wordCount(meta.handwritten);
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(6);
  });

  it.each(CHAPTER_META)('$id: subtitle is a 2-4 word tagline', (meta) => {
    const n = wordCount(meta.subtitle);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(4);
  });

  it.each(CHAPTER_META)('$id: blurb is two sentences', (meta) => {
    // Sentence-ending punctuation followed by a space or end of string.
    const sentenceEnders = meta.blurb.match(/[.!?](?:\s|$)/g) ?? [];
    expect(sentenceEnders.length).toBe(2);
  });

  it.each(CHAPTER_META)(
    '$id: heroArtFallback exists under public/art (heroArt itself may not yet)',
    (meta) => {
      expect(artExists(meta.heroArtFallback)).toBe(true);
      // heroArt has no extension yet (art pipeline hasn't rendered it) —
      // just make sure it at least names a plausible relative path.
      expect(meta.heroArt.length).toBeGreaterThan(0);
      expect(meta.heroArt).not.toMatch(/\.(png|jpg|jpeg|webp)$/i);
    },
  );

  it.each(CHAPTER_META)('$id: every snapshot image exists under public/art', (meta) => {
    for (const snap of meta.snapshots) {
      expect(artExists(snap.image)).toBe(true);
      expect(wordCount(snap.caption)).toBeGreaterThanOrEqual(2);
      expect(wordCount(snap.caption)).toBeLessThanOrEqual(5);
    }
  });

  it.each(CHAPTER_META)('$id: has exactly 3 objectives with unique ids and non-empty labels', (meta) => {
    expect(meta.objectives.length).toBe(3);
    const ids = meta.objectives.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of meta.objectives) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.rule.kind.length).toBeGreaterThan(0);
    }
  });

  it.each(CHAPTER_META)('$id: has a non-empty tip and focal character', (meta) => {
    expect(meta.tip.length).toBeGreaterThan(0);
    expect(meta.focalCharacterId.length).toBeGreaterThan(0);
  });

  it.each(CHAPTER_META)('$id: musicKeys are non-empty and match the chapter record', (meta) => {
    const chapter = CHAPTERS.find((c) => c.id === meta.id);
    expect(chapter).toBeDefined();
    if (!chapter) return;
    expect(meta.musicKeys.length).toBeGreaterThan(0);
    // The dossier lists the cues a player hears in this chapter, which is the
    // `Chapter.music` record **plus** anything the chapter's own scripts cue —
    // Chapter 3's `ending-ffx` and Chapter 5's `ending-ffx2` are played by the
    // coda after `results()`, not by a field.
    const fromScripts: string[] = [];
    for (const script of [chapter.scriptsRef.pre, chapter.scriptsRef.post]) {
      for (const step of script) if (step.type === 'music' && step.track) fromScripts.push(step.track);
    }
    const chapterKeys = new Set(
      [
        chapter.music.scene,
        chapter.music.battle,
        chapter.music.phase2,
        chapter.music.victory,
        chapter.music.post,
        ...fromScripts,
      ].filter((k): k is string => typeof k === 'string'),
    );
    for (const key of meta.musicKeys) {
      expect(chapterKeys.has(key)).toBe(true);
    }
  });

  it('getChapterMeta finds every real chapter id and rejects an unknown one', () => {
    for (const id of CHAPTER_IDS) {
      expect(getChapterMeta(id)?.id).toBe(id);
    }
    expect(getChapterMeta('not-a-chapter')).toBeUndefined();
  });

  it('Braska\'s Final Aeon downs both Yu Pagodas the sensor panel knows by id', () => {
    const meta = getChapterMeta('braskas-final-aeon') as ChapterMeta;
    const chapter = CHAPTERS.find((c) => c.id === 'braskas-final-aeon');
    const rule = meta.objectives[0].rule;
    expect(rule.kind).toBe('parts-downed');
    if (rule.kind === 'parts-downed') {
      for (const targetId of rule.targetIds) {
        expect(chapter?.sensorTexts[targetId]).toBeDefined();
      }
    }
  });

  it('Chapter 4 (FFX-2 Bahamut) has no `victory` music key, matching the suppressed victory pose', () => {
    const chapter = CHAPTERS.find((c) => c.id === 'ffx2-bahamut');
    expect(chapter?.music.victory).toBeUndefined();
    // The pause-screen metadata still tracks the fight's objectives even
    // though the battle-end flourish is silent [writing-bible §5.4].
    const meta = getChapterMeta('ffx2-bahamut') as ChapterMeta;
    expect(meta.objectives.some((o) => o.rule.kind === 'victory')).toBe(true);
  });
});
