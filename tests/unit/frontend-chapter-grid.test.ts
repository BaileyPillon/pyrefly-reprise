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

import { CHAPTERS } from '../../src/data/encounters.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { COMING_CHAPTERS } from '../../src/app/screens/frontend/comingChapters.ts';
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

  it('holds eight cards: five built chapters and three approved and coming', () => {
    const tiles = buildChapterTiles(save);
    expect(tiles).toHaveLength(CHAPTERS.length + COMING_CHAPTERS.length);
    expect(tiles.filter((t) => t.playable)).toHaveLength(CHAPTERS.length);
    expect(tiles.filter((t) => t.kind === 'coming').map((t) => t.title)).toEqual([
      'Seymour and Anima',
      'Evrae',
      'The Leblanc Syndicate',
    ]);
  });

  it('splits them into two game groups, FFX first, coming chapters last in their own group', () => {
    const groups = groupChapterTiles(buildChapterTiles(save));
    expect(groups.map((g) => g.game)).toEqual(['ffx', 'ffx2']);
    expect(groups[0]!.label).toBe('Final Fantasy X');
    expect(groups[1]!.label).toBe('Final Fantasy X-2');
    // Five FFX cards (3 built + 2 coming), three FFX-2 (2 built + 1 coming).
    expect(groups[0]!.tiles).toHaveLength(5);
    expect(groups[1]!.tiles).toHaveLength(3);
    for (const group of groups) {
      const firstComing = group.tiles.findIndex((t) => !t.playable);
      if (firstComing >= 0) {
        expect(group.tiles.slice(firstComing).every((t) => !t.playable)).toBe(true);
      }
    }
  });

  it('never invents a chapter: every coming id is absent from the registry', () => {
    const live = new Set(CHAPTERS.map((c) => c.id as string));
    for (const row of COMING_CHAPTERS) expect(live.has(row.id)).toBe(false);
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
    // Wrapping backwards from the first card lands on the last *playable* one.
    expect(tiles[stepSelection(tiles, 0, -1)]!.id).toBe('ffx2-vegnagun-shuyin');
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
