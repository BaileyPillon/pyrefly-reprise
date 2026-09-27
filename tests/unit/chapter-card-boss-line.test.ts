/**
 * PR-0134 and FOC19-06: the chapter card's BOSS row names who the chapter is
 * about, and Chapter XV's card and prep tell one premise.
 *
 * Game case: FFX-2 only for the two lines (Chapter VI: the Leblanc Syndicate,
 * research ffx2-leblanc-syndicate.md; Chapter XV: the three shades, research
 * ffx2-gippal-den-of-woe.md §2). The fallback (every enemy of the first
 * formation) is unchanged for every other chapter, in both games.
 */

import { describe, expect, it } from 'vitest';

import { bossNames } from '../../src/app/screens/frontend/chapterCards.ts';
import { CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';

describe('chapter card BOSS row', () => {
  it('Chapter VI names Leblanc, not Act I\'s Ormi and goons', () => {
    const line = bossNames(getChapter('ffx2-leblanc')!);
    expect(line).toMatch(/Leblanc/);
    expect(line).not.toMatch(/Goon/);
    expect(line).toBe('Leblanc, Logos and Ormi');
  });

  it('Chapter XV names all three shades', () => {
    expect(bossNames(getChapter('ffx2-den-of-woe')!)).toBe('Baralai, Gippal and Nooj');
  });

  it('every other chapter still lists its first formation', () => {
    for (const c of CHAPTERS) {
      if (c.id === 'ffx2-leblanc' || c.id === 'ffx2-den-of-woe') continue;
      expect(bossNames(c), c.id).toBe(c.enemyGroupRef.enemies.map((e) => e.name).join(' + '));
    }
  });
});

describe('Chapter XV premise (FOC19-06)', () => {
  it('the prep card tells the same premise as the chapter card', () => {
    expect(getChapterMeta('ffx2-den-of-woe')!.blurb).toBe(getChapter('ffx2-den-of-woe')!.blurb);
  });
});
