/**
 * PR-0099 (docs half): `docs/audio/THEMES.md` carries a chapter cue map, one
 * row per listed chapter with its stand-ins and owed cues, and the themes
 * audit fails a chapter with no row or with cells that differ from the
 * chapter's `music` record.
 *
 * Game case: both (the map covers FFX chapters I-III, VII-X, XII, XIV and
 * FFX-2 chapters IV-VI, XI, XIII, XV; each row carries its own game).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { auditChapterCueMap, parseChapterCueMap } from '../../tools/audio/chapter-cue-map.mjs';
import { CHAPTERS } from '../../src/data/encounters.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THEMES = readFileSync(join(ROOT, 'docs', 'audio', 'THEMES.md'), 'utf8');

describe('the chapter cue map in THEMES.md', () => {
  it('has a row for every listed chapter, and every row matches the chapter data', () => {
    const rows = parseChapterCueMap(THEMES);
    expect(rows.map((r) => r.id).sort()).toEqual(CHAPTERS.map((c) => c.id).sort());
    expect(auditChapterCueMap(CHAPTERS, rows)).toEqual([]);
  });

  it('names each chapter the round-13 grep looked for, with its stand-in and decision', () => {
    for (const name of ['Leblanc', 'Natus', 'Omnis', 'Isaaru', 'Fallen Aeons', 'Trema', 'Den of Woe', 'Macalania']) {
      expect(THEMES, name).toContain(name);
    }
    const rows = parseChapterCueMap(THEMES);
    for (const [id, decision] of [
      ['ffx2-leblanc', 'D-018'],
      ['seymour-anima-macalania', 'D-190'],
      ['seymour-natus', 'D-091'],
      ['ffx2-fallen-aeons', 'D-112'],
      ['seymour-omnis', 'D-145'],
      ['ffx2-trema', 'D-146'],
      ['isaaru-via-purifico', 'D-147'],
      ['ffx2-den-of-woe', 'D-148'],
    ] as const) {
      const row = rows.find((r) => r.id === id);
      expect(row, id).toBeDefined();
      expect(`${row!.status} ${row!.owed}`, id).toContain(decision);
      expect(row!.owed, id).toContain('D-209');
    }
  });

  it('fails a chapter with no row', () => {
    const rows = parseChapterCueMap(THEMES).filter((r) => r.id !== 'seymour-omnis');
    const failures = auditChapterCueMap(CHAPTERS, rows);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({ id: 'seymour-omnis' });
    expect(failures[0]!.problem).toMatch(/no row/);
  });

  it('fails a row whose cues differ from the chapter data', () => {
    const rows = parseChapterCueMap(THEMES).map((r) =>
      r.id === 'ffx2-den-of-woe' ? { ...r, battle: ['boss-den-of-woe'] } : r,
    );
    const failures = auditChapterCueMap(CHAPTERS, rows);
    expect(failures.map((f) => f.id)).toEqual(['ffx2-den-of-woe']);
    expect(failures[0]!.problem).toMatch(/battle/);
  });
});
