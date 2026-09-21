/**
 * Site B's rule wall (`learn/studio/wall.ts`): the 137 tiles at `explode` 1.
 *
 * The counts the captions print are the thing to protect — the frame says
 * "17 mechanisms", "89 named rules", "31 single values", and a caption that
 * drifts from its own tiles is a lie in a teaching tool. Nothing below types a
 * count: each is read back out of the block it describes.
 */

import { describe, expect, it } from 'vitest';
import { buildWall, componentBadge } from '../../learn/studio/wall.ts';
import { STUDIO_COMPONENTS, STUDIO_RULES } from '../../learn/studio/rules.ts';
import { tilePieceId } from '../../learn/studio/specimen.ts';

const all = (): boolean => true;

describe('the wall covers every rule exactly once', () => {
  it('has one tile per rule', () => {
    const blocks = buildWall(STUDIO_RULES, all);
    const tiles = blocks.flatMap((block) => block.tiles);
    expect(tiles).toHaveLength(STUDIO_RULES.length);
    expect(new Set(tiles.map((t) => t.pieceId)).size).toBe(STUDIO_RULES.length);
  });

  it('names every tile — no anonymous squares', () => {
    for (const tile of buildWall(STUDIO_RULES, all).flatMap((block) => block.tiles)) {
      expect(tile.name.trim().length).toBeGreaterThan(0);
      expect(tile.line.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('largest first, then component order', () => {
  it('runs L, M, S', () => {
    expect(buildWall(STUDIO_RULES, all).map((block) => block.size)).toEqual(['L', 'M', 'S']);
  });

  it('keeps each block in panel order', () => {
    const order = STUDIO_COMPONENTS.map((c) => c.id);
    for (const block of buildWall(STUDIO_RULES, all)) {
      const indexes = block.tiles.map((tile) => order.indexOf(tile.component));
      expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
    }
  });
});

describe('the captions count their own tiles', () => {
  it('leads each caption with the number of tiles in that block', () => {
    for (const block of buildWall(STUDIO_RULES, all)) {
      expect(block.caption.startsWith(`${block.tiles.length} `)).toBe(true);
    }
  });

  it('follows a hidden component down', () => {
    const hidden = new Set(STUDIO_RULES.filter((rule) => rule.component === 'status').map((rule) => tilePieceId(rule.id)));
    const blocks = buildWall(STUDIO_RULES, (id) => !hidden.has(id));
    const tiles = blocks.flatMap((block) => block.tiles);
    expect(tiles).toHaveLength(STUDIO_RULES.length - hidden.size);
    expect(tiles.some((tile) => tile.component === 'status')).toBe(false);
    for (const block of blocks) expect(block.caption.startsWith(`${block.tiles.length} `)).toBe(true);
  });

  it('drops a block that has nothing left in it rather than captioning an empty row', () => {
    expect(buildWall(STUDIO_RULES, () => false)).toEqual([]);
  });
});

describe('badges match the panel numbering', () => {
  it('numbers the components 01 to 08', () => {
    expect(STUDIO_COMPONENTS.map((c) => componentBadge(c.id))).toEqual(['01', '02', '03', '04', '05', '06', '07', '08']);
  });
});
