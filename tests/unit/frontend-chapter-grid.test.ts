// @vitest-environment jsdom
/**
 * The showpiece chapter board — `src/app/screens/frontend/chapterGrid.ts`.
 *
 * Approved end state: docs/concepts/polish/showpiece-frontend/chapter-select.png.
 * The three facts this pins are the ones the brief names: eight cards in two
 * game groups, card state read from a **real** `SaveStore`, and a coming
 * chapter that lights up by itself the day its data lands.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { CHAPTERS, type Chapter, type ChapterId } from '../../src/data/encounters.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { COMING_CHAPTERS, LOCKED_CHAPTER_IDS } from '../../src/app/screens/frontend/comingChapters.ts';
import {
  buildChapterTiles,
  groupChapterTiles,
  silhouetteKeysFor,
  stepGroup,
  stepSelection,
} from '../../src/app/screens/frontend/chapterGrid.ts';

function freshStore(): SaveStore {
  window.localStorage.clear();
  return new SaveStore();
}

describe('the board', () => {
  let save: SaveStore;
  beforeEach(() => {
    save = freshStore();
  });

  it('holds eight cards: six playable chapters (Leblanc now landed) and two still coming', () => {
    const tiles = buildChapterTiles(save);
    // Leblanc's own COMING_CHAPTERS row is filtered out by id now that the
    // real chapter is registered, so the raw `COMING_CHAPTERS.length` (3)
    // overcounts by one — this asserts what the board actually shows.
    // Macalania (Chapter 7) and Evrae (Chapter 8) are registered but LOCKED,
    // so each real tile is withheld and its COMING row stays.
    expect(tiles).toHaveLength(8);
    expect(tiles.filter((t) => t.playable)).toHaveLength(CHAPTERS.length - LOCKED_CHAPTER_IDS.size);
    expect(tiles.filter((t) => t.kind === 'coming').map((t) => t.title)).toEqual([
      'Seymour and Anima',
      'Fahrenheit',
    ]);
  });

  it('splits them into two game groups, FFX first, coming chapters last in their own group', () => {
    const groups = groupChapterTiles(buildChapterTiles(save));
    expect(groups.map((g) => g.game)).toEqual(['ffx', 'ffx2']);
    expect(groups[0]!.label).toBe('Final Fantasy X');
    expect(groups[1]!.label).toBe('Final Fantasy X-2');
    // Five FFX cards (3 built + 2 coming), three FFX-2 (3 built, Leblanc's
    // coming row now dropped).
    expect(groups[0]!.tiles).toHaveLength(5);
    expect(groups[1]!.tiles).toHaveLength(3);
    for (const group of groups) {
      const firstComing = group.tiles.findIndex((t) => !t.playable);
      if (firstComing >= 0) {
        expect(group.tiles.slice(firstComing).every((t) => !t.playable)).toBe(true);
      }
    }
  });

  it('never invents a chapter: every still-coming id is absent from the registry', () => {
    const live = new Set(CHAPTERS.map((c) => c.id as string));
    // Leblanc's row is the one deliberate exception: its id now matches the
    // real, landed chapter on purpose, which is what drops it off the board
    // automatically (see `comingChapters.ts`'s own comment on that row).
    // Macalania is the other: registered as Chapter 7, but its row stays
    // on the board while `LOCKED_CHAPTER_IDS` holds it.
    for (const row of COMING_CHAPTERS) {
      if (row.id === 'ffx2-leblanc' || LOCKED_CHAPTER_IDS.has(row.id)) {
        expect(live.has(row.id)).toBe(true);
      } else {
        expect(live.has(row.id)).toBe(false);
      }
    }
  });

  /**
   * The branch the track exists to make automatic: the day Macalania's data
   * lands in `src/data/encounters.ts`, its COMING card has to stop being a
   * COMING card by itself. Driven by handing `buildChapterTiles` a registry
   * that already holds it — the real filter, the real rows, no fake chapter
   * written into `src/data` (hard rule 6).
   */
  it('drops a coming row the day its real chapter lands — matched by id', () => {
    const landed: Chapter = { ...CHAPTERS[0]!, id: 'seymour-anima-macalania' as ChapterId, game: 'ffx' };
    // Unlocked: what the board does once its `LOCKED_CHAPTER_IDS` line goes.
    const tiles = buildChapterTiles(save, { chapters: [landed], locked: new Set() });
    expect(tiles.filter((t) => t.id === 'seymour-anima-macalania')).toHaveLength(1);
    const card = tiles.find((t) => t.id === 'seymour-anima-macalania')!;
    expect(card.kind).toBe('chapter');
    expect(card.playable).toBe(true);
    // Only that one row goes: the other two are still coming.
    expect(tiles.filter((t) => t.kind === 'coming').map((t) => t.title)).toEqual([
      'Fahrenheit',
      'The Leblanc Syndicate',
    ]);
  });

  it('keeps a registered but LOCKED chapter as its COMING card, and unlocks it with its one line', () => {
    const macalania = CHAPTERS.find((c) => c.id === 'seymour-anima-macalania');
    expect(macalania, 'Chapter 7 is registered').toBeDefined();
    expect(LOCKED_CHAPTER_IDS.has('seymour-anima-macalania')).toBe(true);

    const locked = buildChapterTiles(save);
    const card = locked.filter((t) => t.id === 'seymour-anima-macalania');
    expect(card).toHaveLength(1);
    expect(card[0]!.kind).toBe('coming');
    expect(card[0]!.playable).toBe(false);
    expect(card[0]!.chapter).toBeNull();

    // The unlock: the same real registries with the lock line removed.
    const unlocked = buildChapterTiles(save, { locked: new Set() });
    const live = unlocked.filter((t) => t.id === 'seymour-anima-macalania');
    expect(live).toHaveLength(1);
    expect(live[0]!.kind).toBe('chapter');
    expect(live[0]!.playable).toBe(true);
    expect(live[0]!.numeral).toBe('VII');
    expect(live[0]!.silhouetteKeys).toEqual(['seymour-macalania']);
    expect(unlocked.filter((t) => t.playable)).toHaveLength(CHAPTERS.length);
  });

  it('keeps Chapter 8 (Evrae) as its COMING card while LOCKED, and unlocks it with its one line', () => {
    expect(CHAPTERS.find((c) => c.id === 'evrae-airship'), 'Chapter 8 is registered').toBeDefined();
    expect(LOCKED_CHAPTER_IDS.has('evrae-airship')).toBe(true);

    const card = buildChapterTiles(save).filter((t) => t.id === 'evrae-airship');
    expect(card).toHaveLength(1);
    expect(card[0]!.kind).toBe('coming');
    expect(card[0]!.playable).toBe(false);

    // The unlock: every lock line but Evrae's kept.
    const locked = new Set([...LOCKED_CHAPTER_IDS].filter((id) => id !== 'evrae-airship'));
    const live = buildChapterTiles(save, { locked }).filter((t) => t.id === 'evrae-airship');
    expect(live).toHaveLength(1);
    expect(live[0]!.kind).toBe('chapter');
    expect(live[0]!.playable).toBe(true);
    expect(live[0]!.numeral).toBe('VIII');
    expect(live[0]!.silhouetteKeys).toEqual(['evrae']);
  });

  it('drops a coming row matched by title alone, whatever id the chapter lands under', () => {
    // The likely real case: the data agent picks its own id and keeps the name.
    const landed: Chapter = { ...CHAPTERS[3]!, id: 'leblanc' as ChapterId, title: 'The Leblanc Syndicate', game: 'ffx2' };
    const tiles = buildChapterTiles(save, { chapters: [landed] });
    expect(tiles.filter((t) => t.title === 'The Leblanc Syndicate')).toHaveLength(1);
    expect(tiles.find((t) => t.title === 'The Leblanc Syndicate')!.playable).toBe(true);
    expect(tiles.filter((t) => t.kind === 'coming').map((t) => t.title)).toEqual([
      'Seymour and Anima',
      'Fahrenheit',
    ]);
  });

  it('passing the real registries through explicitly matches the default board', () => {
    // Leblanc really has landed now, so its own coming row is still dropped
    // here too — this pins that passing the real registries explicitly
    // behaves exactly like the defaults, not that nothing has landed.
    const tiles = buildChapterTiles(save, { chapters: CHAPTERS, coming: COMING_CHAPTERS, locked: LOCKED_CHAPTER_IDS });
    expect(tiles.filter((t) => t.kind === 'coming')).toHaveLength(COMING_CHAPTERS.length - 1);
    expect(tiles).toEqual(buildChapterTiles(save));
  });

  it('reads cleared state from a real SaveStore, and only for the chapter cleared', () => {
    expect(buildChapterTiles(save).some((t) => t.cleared)).toBe(false);
    save.recordClear('yunalesca', 210_000, 24);
    const tiles = buildChapterTiles(save);
    expect(tiles.filter((t) => t.cleared).map((t) => t.id)).toEqual(['yunalesca']);
    // A coming chapter can never be cleared.
    expect(tiles.filter((t) => !t.playable).every((t) => !t.cleared)).toBe(true);
  });

  it('gives every built chapter at least one silhouette painting, and Seymour the two the board uses', () => {
    for (const chapter of CHAPTERS) {
      expect(silhouetteKeysFor(chapter).length).toBeGreaterThan(0);
    }
    expect(silhouetteKeysFor(CHAPTERS[0]!)).toEqual(['mortiorchis', 'seymour-flux-body']);
  });
});

describe('the cursor', () => {
  let save: SaveStore;
  beforeEach(() => {
    save = freshStore();
  });

  it('skips the COMING cards rather than landing on one', () => {
    const tiles = buildChapterTiles(save);
    // Index 2 is the last built FFX chapter; +1 must jump the two coming ones.
    const fromLastFfx = tiles.findIndex((t) => t.id === 'braskas-final-aeon');
    expect(tiles[stepSelection(tiles, fromLastFfx, 1)]!.id).toBe('ffx2-bahamut');
    // Wrapping backwards from the first card lands on the last *playable* one
    // — Leblanc now, since it landed as the sixth chapter.
    expect(tiles[stepSelection(tiles, 0, -1)]!.id).toBe('ffx2-leblanc');
    for (let i = 0; i < tiles.length; i++) {
      if (!tiles[i]!.playable) continue;
      expect(tiles[stepSelection(tiles, i, 1)]!.playable).toBe(true);
      expect(tiles[stepSelection(tiles, i, -1)]!.playable).toBe(true);
    }
  });

  it('up and down cross to the other game', () => {
    const tiles = buildChapterTiles(save);
    expect(tiles[stepGroup(tiles, 0, 1)]!.game).toBe('ffx2');
    expect(tiles[stepGroup(tiles, 0, 1)]!.playable).toBe(true);
    const inX2 = tiles.findIndex((t) => t.id === 'ffx2-vegnagun-shuyin');
    expect(tiles[stepGroup(tiles, inX2, 1)]!.game).toBe('ffx');
  });
});
