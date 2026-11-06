/**
 * The word `beast` against the table of doors (FFX only; `src/app/screens/frontend/beastDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, and the word overlaps no other door's (the table's invariant,
 * restated for this row). **This file drives `BoardDoors` alone**; the real `Input`, the real board, the title and party prep are in `sanctuary-keeper-board.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { BEAST_DOOR_CHAPTER, BEAST_DOOR_WORD } from '../../../src/app/screens/frontend/beastDoor.ts';
import { getChapter } from '../../../src/data/encounters.ts';

const type = (doors: BoardDoors, word: string, start = 1000): string | null => {
  let opened: string | null = null;
  [...word].forEach((key, i) => {
    const feed = doors.feedKey(key, start + i * 120);
    if (feed.next !== null) opened = feed.next;
  });
  return opened;
};

describe('the door', () => {
  it('the word is beast, and it leads to the chapter getChapter finds', () => {
    expect(BEAST_DOOR_WORD).toBe('beast');
    expect(BEAST_DOOR_CHAPTER).toBe('sanctuary-keeper');
    expect(getChapter(BEAST_DOOR_CHAPTER)?.number).toBe(39);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...BEAST_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey('t', 1000 + 4 * 120).next).toBe('sanctuary-keeper');
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'beaxt')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...BEAST_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(BEAST_DOOR_WORD);
    for (const a of words) {
      for (const b of words) {
        if (a === b) continue;
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
      }
    }
    for (const b of words.filter((w) => w !== BEAST_DOOR_WORD)) {
      for (let n = 1; n < Math.min(b.length, BEAST_DOOR_WORD.length); n++) {
        expect(BEAST_DOOR_WORD.endsWith(b.slice(0, n)), `beast ends with the start of ${b}`).toBe(false);
        expect(b.endsWith(BEAST_DOOR_WORD.slice(0, n)), `${b} ends with the start of beast`).toBe(false);
      }
    }
  });
});
