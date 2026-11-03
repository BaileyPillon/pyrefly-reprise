/**
 * **The hidden 3D Bahamut answers every chapter-id lookup the way Chapter IV does** (ch-yrp review MAJOR-1, 2026-11-02; **FFX-2 only**, AGENTS.md rule 14). The chapter is Chapter IV's fight by reference
 * (`data/chapter-exp-yrp-3d.ts`: the record is Chapter IV's spread with its own id, number, scene key and title), but several tables are keyed by chapter id and a derived record is in none of them until someone adds it.
 * The first registry run found three (the results tables, `resultsMath.ts` and `quietResults.ts`) and missed a fourth: `BOSS_PACKS` had no row, so the chapter loaded only the FFX-2 core pack and Bahamut's own roar
 * (`ffx2.boss.bahamut`) fell back to the generic aeon one. This is the census: every exported table keyed by chapter id that Chapter IV is in is named below, with the chapter's answer, so the next table fails here and
 * not in the live chapter. What it pins:
 *
 * 1. **The tables the chapter needs a row in** (sound packs, results, game of the tactic registry) give the same answer for both ids.
 * 2. **The tables it is deliberately not in**, each with the reason (the booth treatment, the board, the painted figures, the story registry): Chapter IV is in them, the chapter is not, on purpose.
 * 3. **The sound coverage reads the chapter**: `tools/audio/sfx-parity-coverage.mjs` lists the hidden chapters by hand, and the chapter was not in it, which is why the pack gap passed the existing coverage test. Every row of
 *    Bahamut's pack that the chapter can play is now inside the chapters that load that pack.
 *
 * Game case: FFX-2 only (Chapter IV's fight); the census is shared test plumbing.
 */
import { describe, expect, it } from 'vitest';

import { PASS_SILENT_WIN } from '../../../src/audio/pass/passResults.ts';
import { BOSS_PACKS, packsFor } from '../../../src/audio/sfxV2/packs.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { EXP_YRP_ID } from '../../../src/data/yrp-ids.ts';
import { CHAPTER_LOOKS } from '../../../src/engine/look/LookConfig.ts';
import { WIDE_CHAPTERS } from '../../../src/engine/motion/SwapSwitch.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { STORY_CHAPTERS } from '../../../src/story/registry.ts';
import { GRIM_CHAPTER_IDS, isGrimChapter, isSilentResultsChapter } from '../../../src/ui/common/resultsMath.ts';
import { QUIET_RESULTS, quietResultsOf } from '../../../src/ui/common/quietResults.ts';
import { createCoverage } from '../../../tools/audio/sfx-parity-coverage.mjs';

const FOUR = 'ffx2-bahamut';

describe('the tables the chapter needs a row in', () => {
  it('loads Chapter IV\'s sound pack: Bahamut\'s roar and Impulse, then the FFX-2 core pack (not the generic aeon roar)', () => {
    expect(BOSS_PACKS[EXP_YRP_ID]).toEqual(BOSS_PACKS[FOUR]);
    expect(packsFor('ffx2', EXP_YRP_ID)).toEqual(['ffx2-bahamut', 'ffx2-core']);
    expect(packsFor('ffx2', EXP_YRP_ID)).toEqual(packsFor('ffx2', FOUR));
  });

  it('keeps the games apart: an FFX run of this id (there is none) is handed no FFX-2 pack', () => {
    expect(packsFor('ffx', EXP_YRP_ID)).toEqual(['ffx-core']);
  });

  it('ends as Chapter IV does (the results tables) and plays on the FFX-2 board for the advisor and the guide', () => {
    expect(isSilentResultsChapter(EXP_YRP_ID)).toBe(isSilentResultsChapter(FOUR));
    expect(isGrimChapter(EXP_YRP_ID)).toBe(isGrimChapter(FOUR));
    expect(quietResultsOf(EXP_YRP_ID)).toEqual(quietResultsOf(FOUR));
    expect(CHAPTER_GAME[EXP_YRP_ID]).toBe(CHAPTER_GAME[FOUR]);
    expect(CHAPTER_GAME[EXP_YRP_ID]).toBe('ffx2');
    expect(getChapter(EXP_YRP_ID)?.game).toBe('ffx2');
  });

  it('is in every table that lists Chapter IV by id and decides how its fight sounds, ends or is advised', () => {
    // The census: each is a table the chapter must be in because Chapter IV is. A table added to this list is checked for both ids at once.
    const keyed: Array<[string, ReadonlySet<string> | readonly string[] | Readonly<Record<string, unknown>>]> = [
      ['BOSS_PACKS', BOSS_PACKS],
      ['QUIET_RESULTS', QUIET_RESULTS],
      ['GRIM_CHAPTER_IDS', GRIM_CHAPTER_IDS],
      ['CHAPTER_GAME', CHAPTER_GAME],
    ];
    const has = (t: ReadonlySet<string> | readonly string[] | Readonly<Record<string, unknown>>, id: string): boolean =>
      t instanceof Set ? t.has(id) : Array.isArray(t) ? t.includes(id) : Object.prototype.hasOwnProperty.call(t, id);
    for (const [name, table] of keyed) {
      expect(has(table, FOUR), `${name} lists Chapter IV`).toBe(true);
      expect(has(table, EXP_YRP_ID), `${name} lists the hidden 3D Bahamut`).toBe(true);
    }
  });
});

describe('the tables it is deliberately not in (Chapter IV is; each with the reason)', () => {
  it('the booth treatment: the look table, the demo sound pass and the wide swap scope are the demo pack\'s (P9, handoff section 4); a 3D scene is a different surface', () => {
    expect(Object.prototype.hasOwnProperty.call(CHAPTER_LOOKS, FOUR)).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(CHAPTER_LOOKS, EXP_YRP_ID)).toBe(false);
    expect([...PASS_SILENT_WIN]).toEqual([FOUR]);
    expect(WIDE_CHAPTERS).toContain(FOUR);
    expect(WIDE_CHAPTERS).not.toContain(EXP_YRP_ID); // "A hidden or experimental chapter is NOT here" (SwapSwitch.ts)
  });

  it('the story registry: the chapter plays Chapter IV\'s scripts by reference (`scriptsRef`, P7), so it is not a second entry', () => {
    expect(Object.prototype.hasOwnProperty.call(STORY_CHAPTERS, FOUR)).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(STORY_CHAPTERS, EXP_YRP_ID)).toBe(false);
    expect(getChapter(EXP_YRP_ID)?.scriptsRef).toBe(getChapter(FOUR)?.scriptsRef);
  });
});

describe('the sound coverage reads the chapter', () => {
  const cov = createCoverage();

  it('lists the hidden chapter among the chapters the sounds can be heard in', () => {
    const ids = cov.facts.map((f: { id: string }) => f.id);
    expect(ids).toContain(EXP_YRP_ID);
    expect(ids).toContain(FOUR);
  });

  it('hears Bahamut\'s own rows in both chapters, and both chapters load the pack those rows sit in', () => {
    for (const row of ['ffx2.boss.bahamut', 'ffx2.boss.impulse']) {
      const heard = [...cov.rowChapters(row)].sort();
      expect(heard, row).toEqual([EXP_YRP_ID, FOUR].sort());
    }
    const loaded = [...cov.packChapters('ffx2-bahamut')].sort();
    expect(loaded).toEqual([EXP_YRP_ID, FOUR].sort());
  });
});
