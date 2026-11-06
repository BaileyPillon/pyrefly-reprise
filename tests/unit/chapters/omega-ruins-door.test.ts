/**
 * The word `weapon` against the table of doors (FFX only; `src/app/screens/frontend/weaponDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, and the word overlaps no other door's (the
 * table's invariant, restated for this row, and the program plan's reason for the pick: `omega` and `ultima` fail it). **This file drives `BoardDoors` alone**; the board test drives the real `Input` and the real board.
 */

import { describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { WEAPON_DOOR_CHAPTER, WEAPON_DOOR_WORD } from '../../../src/app/screens/frontend/weaponDoor.ts';
import { getChapter } from '../../../src/data/encounters.ts';

const type = (doors: BoardDoors, word: string, start = 1000): string | null => {
  let opened: string | null = null;
  [...word].forEach((key, i) => {
    const feed = doors.feedKey(key, start + i * 120);
    if (feed.next !== null) opened = feed.next;
  });
  return opened;
};

/** The rule of `tests/unit/chapter-doors.test.ts`, written out for any word. */
function clashes(a: string, b: string): boolean {
  if (a === b || a.includes(b) || b.includes(a)) return true;
  for (let n = 1; n < Math.min(a.length, b.length); n++) {
    if (a.endsWith(b.slice(0, n)) || b.endsWith(a.slice(0, n))) return true;
  }
  return false;
}

describe('the door', () => {
  it('the word is weapon, and it leads to the chapter getChapter finds', () => {
    expect(WEAPON_DOOR_WORD).toBe('weapon');
    expect(WEAPON_DOOR_CHAPTER).toBe('omega-ruins');
    expect(getChapter(WEAPON_DOOR_CHAPTER)?.number).toBe(43);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...WEAPON_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey('n', 1000 + 5 * 120).next).toBe('omega-ruins');
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'weapxn')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...WEAPON_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(WEAPON_DOOR_WORD);
    for (const b of words.filter((w) => w !== WEAPON_DOOR_WORD)) expect(clashes(WEAPON_DOOR_WORD, b), `weapon against ${b}`).toBe(false);
  });

  it('the program plan\'s reason for the pick: the natural words fail the rule (omega, ultima), the pick does not', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word).filter((w) => w !== WEAPON_DOOR_WORD);
    expect(words.some((w) => clashes('omega', w))).toBe(true); // the end of `mushroom` starts it
    expect(words.some((w) => clashes('ultima', w))).toBe(true); // its last letter starts `angra`
    expect(words.some((w) => clashes(WEAPON_DOOR_WORD, w))).toBe(false);
  });
});
