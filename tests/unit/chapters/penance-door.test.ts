/**
 * The word `judgment` against the table of doors (FFX only; `src/app/screens/frontend/judgmentDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, and the word overlaps no other door's (the
 * table's invariant, restated for this row, and the reason the obvious word `penance` is not the word: it fails the table twice). **This file drives `BoardDoors` alone**; the real `Input`, the real board, the title and party
 * prep are in `penance-board.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { JUDGMENT_DOOR_CHAPTER, JUDGMENT_DOOR_WORD } from '../../../src/app/screens/frontend/judgmentDoor.ts';
import { getChapter } from '../../../src/data/encounters.ts';

const type = (doors: BoardDoors, word: string, start = 1000): string | null => {
  let opened: string | null = null;
  [...word].forEach((key, i) => {
    const feed = doors.feedKey(key, start + i * 120);
    if (feed.next !== null) opened = feed.next;
  });
  return opened;
};

/** The table's rule for two words: neither contains the other, and no suffix of one is a prefix of the other. */
function overlaps(a: string, b: string): string | null {
  if (a.includes(b) || b.includes(a)) return 'contains';
  for (let k = 1; k <= Math.min(a.length, b.length); k++) {
    if (a.slice(-k) === b.slice(0, k)) return `the last ${k} of ${a} start ${b}`;
    if (b.slice(-k) === a.slice(0, k)) return `the last ${k} of ${b} start ${a}`;
  }
  return null;
}

describe('the door', () => {
  it('the word is judgment, and it leads to the chapter getChapter finds', () => {
    expect(JUDGMENT_DOOR_WORD).toBe('judgment');
    expect(JUDGMENT_DOOR_CHAPTER).toBe('penance');
    expect(getChapter(JUDGMENT_DOOR_CHAPTER)?.number).toBe(35);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...JUDGMENT_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey('t', 1000 + (JUDGMENT_DOOR_WORD.length - 1) * 120).next).toBe('penance');
  });

  it('in capitals too, and the chapter is open on every device (not desktop-only: painted 2D)', () => {
    expect(type(new BoardDoors(), JUDGMENT_DOOR_WORD.toUpperCase())).toBe('penance');
    expect(new BoardDoors().isOpen('penance')).toBe(true);
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'judgmxnt')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...JUDGMENT_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning (the Pilgrimage\'s run door included)', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(JUDGMENT_DOOR_WORD);
    for (const other of words.filter((w) => w !== JUDGMENT_DOOR_WORD)) expect(overlaps(JUDGMENT_DOOR_WORD, other), `${JUDGMENT_DOOR_WORD} against ${other}`).toBeNull();
  });

  it('the obvious word `penance` would have failed the table: `yrp` ends in P and `experiment` begins with E', () => {
    const failing = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word).filter((w) => overlaps('penance', w) !== null);
    expect(failing.sort()).toEqual(['experiment', 'yrp']);
  });
});
