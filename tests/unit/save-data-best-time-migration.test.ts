/**
 * `SaveData.migrate` — the `best-time-flow` cleanup.
 *
 * Before this fix, `BattleScreenFlow.runChapter` could record a chapter's
 * best time from the raw wall clock, including an automated run at
 * `speed: 'skip'` (a few milliseconds). Those bogus times are already
 * sitting in players' `localStorage`, and `migrate` runs on every load
 * (`SaveStore.load`), so this is where they get scrubbed.
 */
import { describe, expect, it } from 'vitest';
import {
  IMPLAUSIBLE_BEST_TIME_MS,
  migrate,
  type ChapterRecord,
  type SaveData,
} from '../../src/app/SaveData.ts';

function makeChapterRecord(overrides: Partial<ChapterRecord> = {}): ChapterRecord {
  return {
    id: 'yunalesca',
    cleared: true,
    bestTimeMs: null,
    bestTurns: null,
    attempts: 1,
    ...overrides,
  };
}

/** `out.chapters[id]`, asserted present — `migrate` always fills what it was given. */
function chapterOf(out: SaveData, id: string): ChapterRecord {
  const rec = out.chapters[id];
  if (!rec) throw new Error(`expected chapter "${id}" in migrated save`);
  return rec;
}

describe('migrate — implausible best-time cleanup', () => {
  it('drops a stored best time under the implausible-time floor', () => {
    const raw: Partial<SaveData> = {
      chapters: {
        yunalesca: makeChapterRecord({ bestTimeMs: 8, bestTurns: 3 }),
      },
    };
    const out = migrate(raw);
    expect(chapterOf(out, 'yunalesca').bestTimeMs).toBeNull();
    // Only the timing is discarded — the clear itself was real.
    expect(chapterOf(out, 'yunalesca').cleared).toBe(true);
    expect(chapterOf(out, 'yunalesca').bestTurns).toBe(3);
  });

  it('drops a best time right up to the floor (exclusive)', () => {
    const raw: Partial<SaveData> = {
      chapters: {
        yunalesca: makeChapterRecord({ bestTimeMs: IMPLAUSIBLE_BEST_TIME_MS - 1 }),
      },
    };
    expect(chapterOf(migrate(raw), 'yunalesca').bestTimeMs).toBeNull();
  });

  it('keeps a plausible best time at or above the floor', () => {
    const raw: Partial<SaveData> = {
      chapters: {
        yunalesca: makeChapterRecord({ bestTimeMs: IMPLAUSIBLE_BEST_TIME_MS }),
        'seymour-flux': makeChapterRecord({ id: 'seymour-flux', bestTimeMs: 42_000 }),
      },
    };
    const out = migrate(raw);
    expect(chapterOf(out, 'yunalesca').bestTimeMs).toBe(IMPLAUSIBLE_BEST_TIME_MS);
    expect(chapterOf(out, 'seymour-flux').bestTimeMs).toBe(42_000);
  });

  it('leaves a chapter with no recorded best time alone', () => {
    const raw: Partial<SaveData> = {
      chapters: { yunalesca: makeChapterRecord({ cleared: false, bestTimeMs: null }) },
    };
    expect(chapterOf(migrate(raw), 'yunalesca').bestTimeMs).toBeNull();
  });

  it('runs on every load regardless of the stored version', () => {
    const raw: Partial<SaveData> & { version?: number } = {
      version: 1,
      chapters: { yunalesca: makeChapterRecord({ bestTimeMs: 3 }) },
    };
    expect(chapterOf(migrate(raw), 'yunalesca').bestTimeMs).toBeNull();
  });
});
