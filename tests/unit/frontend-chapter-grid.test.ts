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

  it('holds thirteen cards: twelve playable chapters (Leblanc, Evrae, Yojimbo, Natus, Omnis, Trema and Isaaru now landed) and one still coming', () => {
    const tiles = buildChapterTiles(save);
    // Leblanc's and Evrae's own COMING_CHAPTERS rows are filtered out by id
    // now that their real chapters are registered and unlocked, so the raw
    // `COMING_CHAPTERS.length` (3) overcounts by two — this asserts what the
    // board actually shows. Macalania (Chapter 7) is registered but still
    // LOCKED, so its real tile is withheld and its COMING row stays.
    // Chapter IX (Yojimbo) was listed 2026-09-24 and Chapters X (Natus), XII (Omnis)
    // XIII (Trema) and XIV (Isaaru) on 2026-09-25, none with a COMING row of its own.
    expect(tiles).toHaveLength(13);
    expect(tiles.filter((t) => t.playable)).toHaveLength(CHAPTERS.length - LOCKED_CHAPTER_IDS.size);
    expect(tiles.filter((t) => t.kind === 'coming').map((t) => t.title)).toEqual([
      'Seymour and Anima',
    ]);
  });

  it('splits them into two game groups, FFX first, each in chapter-number order with the coming card in its place', () => {
    const groups = groupChapterTiles(buildChapterTiles(save));
    expect(groups.map((g) => g.game)).toEqual(['ffx', 'ffx2']);
    expect(groups[0]!.label).toBe('Final Fantasy X');
    expect(groups[1]!.label).toBe('Final Fantasy X-2');
    // Nine FFX cards (8 built — Evrae, Yojimbo, Natus, Omnis and Isaaru now landed — + 1 still
    // coming, Macalania), four FFX-2 (IV, V, VI and XIII, Leblanc's coming row dropped).
    expect(groups[0]!.tiles).toHaveLength(9);
    // D-183 (Bailey, 2026-09-25, "All recommendations"): the COMING Chapter
    // VII sits at its number's place, between III and VIII, not at the end.
    expect(groups[0]!.tiles.map((t) => t.numeral)).toEqual(['I', 'II', 'III', 'VII', 'VIII', 'IX', 'X', 'XII', 'XIV']);
    expect(groups[0]!.tiles[3]!.playable).toBe(false);
    expect(groups[0]!.tiles.filter((t) => t.playable).map((t) => t.numeral)).toEqual(['I', 'II', 'III', 'VIII', 'IX', 'X', 'XII', 'XIV']);
    expect(groups[1]!.tiles.map((t) => t.numeral)).toEqual(['IV', 'V', 'VI', 'XIII']);
    for (const group of groups) {
      const numbers = group.tiles.map((t) => t.number ?? Number.MAX_SAFE_INTEGER);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    }
  });

  it('never invents a chapter: every still-coming id is absent from the registry', () => {
    const live = new Set(CHAPTERS.map((c) => c.id as string));
    // Leblanc's and Evrae's rows are the deliberate exceptions: their ids
    // now match real, landed (and, for Evrae, unlocked) chapters on purpose,
    // which is what drops each off the board automatically (see
    // `comingChapters.ts`'s own comment on those rows). Macalania is the
    // other: registered as Chapter 7, but its row stays on the board while
    // `LOCKED_CHAPTER_IDS` holds it.
    for (const row of COMING_CHAPTERS) {
      if (row.id === 'ffx2-leblanc' || row.id === 'evrae-airship' || LOCKED_CHAPTER_IDS.has(row.id)) {
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
      'Evrae',
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

  it('Chapter 8 (Evrae) is UNLOCKED by Bailey\'s word and shows as a playable card; Chapter 7 (Macalania) stays LOCKED', () => {
    expect(CHAPTERS.find((c) => c.id === 'evrae-airship'), 'Chapter 8 is registered').toBeDefined();
    expect(LOCKED_CHAPTER_IDS.has('evrae-airship')).toBe(false);
    expect(LOCKED_CHAPTER_IDS.has('seymour-anima-macalania')).toBe(true);

    const live = buildChapterTiles(save).filter((t) => t.id === 'evrae-airship');
    expect(live).toHaveLength(1);
    expect(live[0]!.kind).toBe('chapter');
    expect(live[0]!.playable).toBe(true);
    expect(live[0]!.numeral).toBe('VIII');
    expect(live[0]!.silhouetteKeys).toEqual(['evrae']);

    // Re-locking it (the state before Bailey's word) still works — the
    // COMING row it leaves behind is the one this file pins for Macalania.
    const relocked = new Set([...LOCKED_CHAPTER_IDS, 'evrae-airship']);
    const card = buildChapterTiles(save, { locked: relocked }).filter((t) => t.id === 'evrae-airship');
    expect(card).toHaveLength(1);
    expect(card[0]!.kind).toBe('coming');
    expect(card[0]!.playable).toBe(false);
  });

  it('drops a coming row matched by title alone, whatever id the chapter lands under', () => {
    // The likely real case: the data agent picks its own id and keeps the name.
    const landed: Chapter = { ...CHAPTERS[3]!, id: 'leblanc' as ChapterId, title: 'The Leblanc Syndicate', game: 'ffx2' };
    const tiles = buildChapterTiles(save, { chapters: [landed] });
    expect(tiles.filter((t) => t.title === 'The Leblanc Syndicate')).toHaveLength(1);
    expect(tiles.find((t) => t.title === 'The Leblanc Syndicate')!.playable).toBe(true);
    expect(tiles.filter((t) => t.kind === 'coming').map((t) => t.title)).toEqual([
      'Seymour and Anima',
      'Evrae',
    ]);
  });

  it('passing the real registries through explicitly matches the default board', () => {
    // Leblanc and Evrae have both really landed (and Evrae is unlocked) now,
    // so their own coming rows are still dropped here too — this pins that
    // passing the real registries explicitly behaves exactly like the
    // defaults, not that nothing has landed.
    const tiles = buildChapterTiles(save, { chapters: CHAPTERS, coming: COMING_CHAPTERS, locked: LOCKED_CHAPTER_IDS });
    expect(tiles.filter((t) => t.kind === 'coming')).toHaveLength(COMING_CHAPTERS.length - 2);
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
    // Chapter IX's card cuts Lady Ginnem's Yojimbo (locked O-1 A), never the
    // player's aeon painting `yojimbo`, which D-054 did not approve.
    const ix = CHAPTERS.find((c) => c.id === 'yojimbo-cavern')!;
    expect(silhouetteKeysFor(ix)).toEqual(['yojimbo-cavern']);
  });
});

describe('the cursor', () => {
  let save: SaveStore;
  beforeEach(() => {
    save = freshStore();
  });

  it('skips the COMING cards rather than landing on one', () => {
    const tiles = buildChapterTiles(save);
    // Isaaru (Chapter 14) is the last built FFX chapter since 2026-09-25;
    // +1 must jump the one still-coming card (Macalania).
    const fromLastFfx = tiles.findIndex((t) => t.id === 'isaaru-via-purifico');
    expect(tiles[stepSelection(tiles, fromLastFfx, 1)]!.id).toBe('ffx2-bahamut');
    // Wrapping backwards from the first card lands on the last *playable* one
    // — Trema now, listed 2026-09-25 after Chapter VI in the FFX-2 group.
    expect(tiles[stepSelection(tiles, 0, -1)]!.id).toBe('ffx2-trema');
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
