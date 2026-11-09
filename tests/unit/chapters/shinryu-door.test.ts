/**
 * The word `shinryu` against the table of doors (FFX only; `src/app/screens/frontend/shinryuDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, and the word overlaps no other door's
 * (the table's invariant, restated for this row; the preflight's alternative was `leviathan`). **This file drives `BoardDoors` alone**; the real `Input`, the real board, the title and party prep are in
 * `shinryu-board.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { SHINRYU_DOOR_CHAPTER, SHINRYU_DOOR_WORD } from '../../../src/app/screens/frontend/shinryuDoor.ts';
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
  it('the word is shinryu, and it leads to the chapter getChapter finds', () => {
    expect(SHINRYU_DOOR_WORD).toBe('shinryu');
    expect(SHINRYU_DOOR_CHAPTER).toBe('shinryu');
    expect(getChapter(SHINRYU_DOOR_CHAPTER)?.number).toBe(48);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...SHINRYU_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey('u', 1000 + (SHINRYU_DOOR_WORD.length - 1) * 120).next).toBe('shinryu');
  });

  it('in capitals too, and the chapter is open on every device (not desktop-only: painted 2D)', () => {
    expect(type(new BoardDoors(), SHINRYU_DOOR_WORD.toUpperCase())).toBe('shinryu');
    expect(new BoardDoors().isOpen('shinryu')).toBe(true);
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'shinrxu')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...SHINRYU_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning (the Pilgrimage\'s run door included)', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(SHINRYU_DOOR_WORD);
    for (const other of words.filter((w) => w !== SHINRYU_DOOR_WORD)) expect(overlaps(SHINRYU_DOOR_WORD, other), `${SHINRYU_DOOR_WORD} against ${other}`).toBeNull();
  });

  it("FINDING: the alternative the preflight names (SH9), `leviathan`, would have failed the table: its last two letters, an, begin `angra` (the plan's door check looked at the last letter only)", () => {
    const failing = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word).filter((w) => overlaps('leviathan', w) !== null);
    expect(failing).toEqual(['angra']);
  });
});
