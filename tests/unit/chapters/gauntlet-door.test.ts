/**
 * The word `gauntlet` against the table of doors (FFX only; `src/app/screens/frontend/gauntletDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, and the word overlaps no other
 * door's (the table's invariant, restated for this row; the preflight's alternative was `catastrophe`, which fails it). **This file drives `BoardDoors` alone**; the real `Input`, the real board, the title and party prep
 * are in `gauntlet-board.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { GAUNTLET_DOOR_CHAPTER, GAUNTLET_DOOR_WORD } from '../../../src/app/screens/frontend/gauntletDoor.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { DOORS_IN_ORDER } from '../helpers/doorWords.ts';

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
  it('the word is gauntlet, and it leads to the chapter getChapter finds, number 54', () => {
    expect(GAUNTLET_DOOR_WORD).toBe('gauntlet');
    expect(GAUNTLET_DOOR_CHAPTER).toBe('gauntlet');
    expect(getChapter(GAUNTLET_DOOR_CHAPTER)?.number).toBe(54);
    expect(getChapter(GAUNTLET_DOOR_CHAPTER)).toMatchObject({ game: 'ffx', experimental: true });
  });

  it('is the last row of the table and of the shared list of words, FFX', () => {
    expect(CHAPTER_DOORS.at(-1)).toMatchObject({ word: 'gauntlet', chapter: 'gauntlet' });
    expect(DOORS_IN_ORDER.at(-1)).toEqual(['gauntlet', 'ffx']);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...GAUNTLET_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey('t', 1000 + (GAUNTLET_DOOR_WORD.length - 1) * 120).next).toBe('gauntlet');
  });

  it('in capitals too, and the chapter is open on every device (not desktop-only: painted 2D)', () => {
    expect(type(new BoardDoors(), GAUNTLET_DOOR_WORD.toUpperCase())).toBe('gauntlet');
    expect(new BoardDoors().isOpen('gauntlet')).toBe(true);
    expect(CHAPTER_DOORS.find((d) => d.chapter === 'gauntlet')?.gate).toBeUndefined();
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'gauntxet')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...GAUNTLET_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('gagazet, which shares its first two letters with it, opens only its own chapter, and the two typed one after the other each open only their own', () => {
    expect(type(new BoardDoors(), 'gagazet')).toBe(getChapterIdOf('gagazet'));
    expect(type(new BoardDoors(), 'gauntlet')).toBe('gauntlet');
    const doors = new BoardDoors();
    expect(type(doors, 'gagazet', 1000)).toBe(getChapterIdOf('gagazet'));
    expect(type(doors, 'gauntlet', 9000)).toBe('gauntlet');
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning (the Pilgrimage\'s run door included)', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(GAUNTLET_DOOR_WORD);
    for (const other of words.filter((w) => w !== GAUNTLET_DOOR_WORD)) expect(overlaps(GAUNTLET_DOOR_WORD, other), `${GAUNTLET_DOOR_WORD} against ${other}`).toBeNull();
  });

  it("FINDING: the alternative the preflight names (GA1), `catastrophe`, would have failed the table (it clashes with `leblanc`, whose last letter starts it, and with `experiment`, whose first letter ends it)", () => {
    const failing = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word).filter((w) => overlaps('catastrophe', w) !== null);
    expect(failing).toEqual(expect.arrayContaining(['leblanc', 'experiment']));
  });
});

function getChapterIdOf(word: string): string {
  const row = CHAPTER_DOORS.find((d) => d.word === word);
  if (row === undefined) throw new Error(`no door for ${word}`);
  return row.chapter;
}
