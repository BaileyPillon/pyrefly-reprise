/**
 * The word `sidequest` against the table of doors (FFX only; `src/app/screens/frontend/sidequestDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, it overlaps no other door's word,
 * and it is NOT desktop-only (painted 2D). **This file drives `BoardDoors` alone**; `chapter-doors.test.ts` pins the whole table and the older door suites drive the real board.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { SIDEQUEST_DOOR_CHAPTER, SIDEQUEST_DOOR_WORD } from '../../../src/app/screens/frontend/sidequestDoor.ts';
import { KEY_MAP } from '../../../src/app/inputKeyMap.ts';
import { setArtTier } from '../../../src/engine/ArtDevice.ts';
import { getChapter } from '../../../src/data/encounters.ts';

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
  it('the word is sidequest, and it leads to the chapter getChapter finds', () => {
    expect(SIDEQUEST_DOOR_WORD).toBe('sidequest');
    expect(SIDEQUEST_DOOR_CHAPTER).toBe('belgemine');
    expect(getChapter(SIDEQUEST_DOOR_CHAPTER)?.number).toBe(45);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...SIDEQUEST_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey('t', 1000 + (SIDEQUEST_DOOR_WORD.length - 1) * 120).next).toBe('belgemine');
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'sidequesx')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...SIDEQUEST_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(SIDEQUEST_DOOR_WORD);
    for (const a of words) {
      for (const b of words) {
        if (a === b) continue;
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
      }
    }
    for (const b of words.filter((w) => w !== SIDEQUEST_DOOR_WORD)) {
      for (let n = 1; n <= Math.min(b.length, SIDEQUEST_DOOR_WORD.length); n++) {
        expect(SIDEQUEST_DOOR_WORD.endsWith(b.slice(0, n)), `sidequest ends with the start of ${b}`).toBe(false);
        expect(b.endsWith(SIDEQUEST_DOOR_WORD.slice(0, n)), `${b} ends with the start of sidequest`).toBe(false);
      }
    }
  });

  it('the letters the board answers are claimed by the word and the rest are unbound: S is down, D is right, E is start, Q is triangle; I, U and T are bound to nothing', () => {
    const keys = KEY_MAP as unknown as Record<string, unknown>;
    const bound = (letter: string): boolean => Object.keys(keys).some((k) => k.toLowerCase() === `key${letter}`);
    for (const free of ['i', 'u', 't']) expect(bound(free), `${free} is bound`).toBe(false);
    for (const used of ['s', 'd', 'e', 'q']) expect(bound(used), `${used} is bound`).toBe(true);
  });
});

describe('not desktop-only (painted 2D)', () => {
  it('the door opens on every tier, the phone included', () => {
    const doors = new BoardDoors();
    for (const tier of ['phone', 'low', 'mid', 'high', null] as const) {
      setArtTier(tier);
      expect(doors.isOpen('belgemine'), String(tier)).toBe(true);
    }
  });
});
