/**
 * The word `blitz` against the table of doors (FFX only; `src/app/screens/frontend/blitzDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, it overlaps no other door's word, and it is NOT
 * desktop-only (painted 2D). **This file drives `BoardDoors` alone**; the real `Input` and the real board's keys are in `oblitzerator-board.test.ts` and `chapter-doors.test.ts` (which pins the whole table).
 */

import { afterEach, describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { BLITZ_DOOR_CHAPTER, BLITZ_DOOR_WORD } from '../../../src/app/screens/frontend/blitzDoor.ts';
import { KEY_MAP } from '../../../src/app/inputKeyMap.ts';
import { setArtTier } from '../../../src/engine/ArtDevice.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { DOORS_IN_ORDER } from '../helpers/doorWords.ts';

afterEach(() => setArtTier(null));

const type = (doors: BoardDoors, word: string, start = 1000): string | null => {
  let opened: string | null = null;
  [...word].forEach((key, i) => {
    const feed = doors.feedKey(key, start + i * 120);
    if (feed.next !== null) opened = feed.next;
  });
  return opened;
};

describe('the door', () => {
  it('the word is blitz, and it leads to the chapter getChapter finds (number 50, FFX, hidden)', () => {
    expect(BLITZ_DOOR_WORD).toBe('blitz');
    expect(BLITZ_DOOR_CHAPTER).toBe('oblitzerator');
    expect(getChapter(BLITZ_DOOR_CHAPTER)).toMatchObject({ number: 50, game: 'ffx', experimental: true });
    expect(DOORS_IN_ORDER.find(([w]) => w === BLITZ_DOOR_WORD)).toEqual(['blitz', 'ffx']);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...BLITZ_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey(BLITZ_DOOR_WORD.at(-1)!, 1000 + (BLITZ_DOOR_WORD.length - 1) * 120).next).toBe('oblitzerator');
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'blitx')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...BLITZ_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(BLITZ_DOOR_WORD);
    for (const a of words) {
      for (const b of words) {
        if (a === b) continue;
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
      }
    }
    for (const b of words.filter((w) => w !== BLITZ_DOOR_WORD)) {
      for (let n = 1; n < Math.min(b.length, BLITZ_DOOR_WORD.length); n++) {
        expect(BLITZ_DOOR_WORD.endsWith(b.slice(0, n)), `blitz ends with the start of ${b}`).toBe(false);
        expect(b.endsWith(BLITZ_DOOR_WORD.slice(0, n)), `${b} ends with the start of blitz`).toBe(false);
      }
    }
  });

  it('the letters: B, L, I and T are bound to nothing and Z is confirm (the real key map is read, not assumed)', () => {
    const keys = KEY_MAP as unknown as Record<string, unknown>;
    const bound = (letter: string): boolean => Object.keys(keys).some((k) => k.toLowerCase() === `key${letter}`);
    for (const free of ['b', 'l', 'i', 't']) expect(bound(free), `${free} is bound`).toBe(false);
    expect(bound('z')).toBe(true);
    expect(keys['KeyZ']).toBe('confirm');
  });
});

describe('not desktop-only (painted 2D)', () => {
  it('every art tier, the phone tier included, leaves the door open', () => {
    const doors = new BoardDoors();
    for (const tier of ['phone', 'low', 'mid', 'high', null] as const) {
      setArtTier(tier);
      expect(doors.isOpen('oblitzerator'), String(tier)).toBe(true);
    }
    expect(CHAPTER_DOORS.find((d) => d.chapter === 'oblitzerator')?.gate).toBeUndefined();
  });
});
