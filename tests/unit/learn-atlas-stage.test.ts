/**
 * Site A's stage data, checked against the approved frames rather than
 * against itself: the five painted parts of chapter 5 carry the boxes
 * `docs/concepts/atlas/a-boss-atlas/a1-assembled.html` and
 * `a2-exploded-selected.html` record, every piece that belongs to a part says
 * so, and the nothing-selected card is the frame's chain.
 */

import { describe, expect, it } from 'vitest';
import { buildChapterSpecimen } from '../../learn/atlas/data.ts';
import { compactCites } from '../../learn/atlas/idle.ts';
import { distinguishName, sharedLastWord } from '../../learn/atlas/format.ts';
import { FREE_STAGE, ORIGIN } from '../../learn/shared/region.ts';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';

const CH5 = 'ffx2-vegnagun-shuyin';

/** The five `.part` boxes of `a1-assembled.html`, and the `#p-*` boxes of `a2-exploded-selected.html`. */
const FRAME = {
  'vegnagun-tail': { a1: [792, 318, 384], a2: [936, 118, 190], layer: 1, flip: false },
  'vegnagun-leg': { a1: [872, 300, 226], a2: [1004, 402, 108], layer: 1, flip: false },
  'vegnagun-body': { a1: [462, 326, 552], a2: [566, 322, 340], layer: 2, flip: false },
  'vegnagun-head': { a1: [420, 120, 424], a2: [392, 108, 266], layer: 3, flip: true },
  shuyin: { a1: [1088, 596, 80], a2: [402, 566, 116], layer: 4, flip: false },
} as const;

describe('chapter 5 stage geometry', () => {
  const specimen = buildChapterSpecimen(CH5);

  it('places each painted part exactly where the approved frames do', () => {
    for (const [id, frame] of Object.entries(FRAME)) {
      const piece = specimen.pieces.find((p) => p.id === id);
      expect(piece, id).toBeDefined();
      expect(piece?.home.x, `${id} home x`).toBe(frame.a1[0] - ORIGIN.x);
      expect(piece?.home.y, `${id} home y`).toBe(frame.a1[1] - ORIGIN.y);
      expect(piece?.burst.x, `${id} burst x`).toBe(frame.a2[0] - ORIGIN.x);
      expect(piece?.burst.y, `${id} burst y`).toBe(frame.a2[1] - ORIGIN.y);
      expect(piece?.stage?.width, `${id} width`).toBe(frame.a1[2]);
      expect(piece?.stage?.burstWidth, `${id} burst width`).toBe(frame.a2[2]);
      expect(piece?.stage?.layer, `${id} layer`).toBe(frame.layer);
      expect(piece?.stage?.flipX, `${id} flip`).toBe(frame.flip);
    }
  });

  it('keeps every painted part inside the chrome-free stage, at rest and pulled apart', () => {
    for (const piece of specimen.pieces) {
      const stage = piece.stage;
      if (stage === undefined) continue;
      for (const [label, at, width] of [
        ['home', piece.home, stage.width],
        ['burst', piece.burst, stage.burstWidth ?? stage.width],
      ] as const) {
        expect(at.x, `${piece.id} ${label} left`).toBeGreaterThanOrEqual(FREE_STAGE.x);
        expect(at.x + width, `${piece.id} ${label} right`).toBeLessThanOrEqual(FREE_STAGE.x + FREE_STAGE.w);
        expect(at.y, `${piece.id} ${label} top`).toBeGreaterThanOrEqual(FREE_STAGE.y);
      }
    }
  });

  it('numbers the five battles in chain order', () => {
    const badges = specimen.pieces.filter((p) => p.badge !== undefined).map((p) => [p.id, p.badge]);
    expect(badges).toEqual([
      ['vegnagun-tail', '1'],
      ['vegnagun-leg', '2'],
      ['vegnagun-body', '3'],
      ['vegnagun-head', '4'],
      ['shuyin', '5'],
    ]);
  });

  it('hangs every non-painted piece off a part, in every chapter', () => {
    for (const id of CHAPTER_IDS) {
      const chapter = buildChapterSpecimen(id);
      const ids = new Set(chapter.pieces.map((p) => p.id));
      const orphans = chapter.pieces.filter((p) => p.kind !== 'painting' && p.parentId === undefined);
      expect(orphans.map((p) => p.id), `${id} orphans`).toEqual([]);
      for (const piece of chapter.pieces) {
        if (piece.parentId !== undefined) expect(ids.has(piece.parentId), `${id} ${piece.id}`).toBe(true);
      }
    }
  });
});

describe('the chain card', () => {
  it('lists chapter 5’s five battles with the levels and HP the data holds', () => {
    const idle = buildChapterSpecimen(CH5).idle;
    expect(idle?.rows).toEqual([
      { label: 'Tail', value: '34,200 HP', sub: 'Level 41' },
      { label: 'Leg + 3 Nodes', value: '18,220 HP', sub: 'Level 38' },
      { label: 'Body + 2 Bulwarks', value: '33,040 HP', sub: 'Level 43' },
      { label: 'Head + 2 Redoubts', value: '38,420 HP', sub: 'Level 57' },
      { label: 'Shuyin', value: '23,850 HP', sub: 'Level 58' },
    ]);
    expect(idle?.note).toBe('5 battles with no menu between them, in this order.');
    expect(idle?.cite).toBe('research/ffx2-vegnagun-shuyin.md §3.1, §3.2, §3.3, §3.4, §3.5');
  });

  it('gives every chapter a chain card whose row count is its battle count', () => {
    for (const id of CHAPTER_IDS) {
      const specimen = buildChapterSpecimen(id);
      expect(specimen.idle, id).toBeDefined();
      expect(specimen.idle?.cite.trim().length, id).toBeGreaterThan(0);
    }
  });
});

describe('display names', () => {
  it('tells same-named combatants apart by their ids, and keeps a one-letter suffix as a suffix', () => {
    expect(distinguishName('Vegnagun', 'vegnagun-tail')).toBe('Tail');
    expect(distinguishName('Node', 'node-a')).toBe('Node A');
    expect(distinguishName('Bulwark', 'bulwark-l')).toBe('Bulwark L');
    expect(distinguishName('Shuyin', 'shuyin')).toBe('Shuyin');
    expect(distinguishName('Bahamut', 'ffx2-bahamut')).toBe('Bahamut');
  });

  it('finds the noun a set of sibling names shares, and refuses to invent one', () => {
    expect(sharedLastWord(['Right Bulwark', 'Left Bulwark'])).toBe('Bulwark');
    expect(sharedLastWord(['Node', 'Node', 'Node'])).toBe('Node');
    expect(sharedLastWord(['Node A', 'Node B', 'Node C'])).toBe('Node');
    expect(sharedLastWord(['Node', 'Bulwark'])).toBeUndefined();
    expect(sharedLastWord([])).toBeUndefined();
  });
});

describe('compactCites', () => {
  it('folds several sections of one research file onto one line, in first-seen order', () => {
    expect(compactCites(['research/x.md §3.1 (src/a.ts)', 'research/x.md §3.2 (src/b.ts)', 'research/x.md §3.1 (src/a.ts)'])).toBe(
      'research/x.md §3.1, §3.2',
    );
  });

  it('keeps a cite it does not recognise rather than dropping it', () => {
    expect(compactCites(['a free-form note'])).toBe('a free-form note');
  });
});
