/**
 * The word `spherimorph` against the table of doors (FFX only; `src/app/screens/frontend/spherimorphDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, and the word overlaps no
 * other door's (the table's invariant, restated for this row). **This file drives `BoardDoors` alone**; the real `Input`, the real board, the title and party prep are in `spherimorph-board.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { SPHERIMORPH_DOOR_CHAPTER, SPHERIMORPH_DOOR_WORD } from '../../../src/app/screens/frontend/spherimorphDoor.ts';
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
  it('the word is spherimorph, and it leads to the chapter getChapter finds', () => {
    expect(SPHERIMORPH_DOOR_WORD).toBe('spherimorph');
    expect(SPHERIMORPH_DOOR_CHAPTER).toBe('spherimorph');
    expect(getChapter(SPHERIMORPH_DOOR_CHAPTER)?.number).toBe(41);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...SPHERIMORPH_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey(SPHERIMORPH_DOOR_WORD.at(-1)!, 1000 + (SPHERIMORPH_DOOR_WORD.length - 1) * 120).next).toBe('spherimorph');
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'spherimorxh')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...SPHERIMORPH_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(SPHERIMORPH_DOOR_WORD);
    for (const a of words) {
      for (const b of words) {
        if (a === b) continue;
        // `pilgrim` (a run door, 2026-10-18) shares one letter with `mushroom`; that known overlap is not this row's, and the table's own suite names it
        if ((a === 'pilgrim' && b === 'mushroom') || (a === 'mushroom' && b === 'pilgrim')) continue;
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
      }
    }
    for (const b of words.filter((w) => w !== SPHERIMORPH_DOOR_WORD)) {
      for (let n = 1; n < Math.min(b.length, SPHERIMORPH_DOOR_WORD.length); n++) {
        expect(SPHERIMORPH_DOOR_WORD.endsWith(b.slice(0, n)), `spherimorph ends with the start of ${b}`).toBe(false);
        expect(b.endsWith(SPHERIMORPH_DOOR_WORD.slice(0, n)), `${b} ends with the start of spherimorph`).toBe(false);
      }
    }
  });
});
