/**
 * The word `wendigo` against the table of doors (FFX only; `src/app/screens/frontend/wendigoDoor.ts`): typed on `BoardDoors` it finishes on the last letter and leads to the chapter, it overlaps no other door's word, and it is
 * desktop-only: on the phone tier the door stays shut (the fourth hidden 3D chapter after `yrp`, `waker` and `gear`, driver decision 219q). **This file drives `BoardDoors` alone**; the real `Input` and the real board's keys are
 * in `r74-hidden-3d-phone-doors.test.ts` (which lists this door among the desktop-only ones) and `chapter-doors.test.ts` (which pins the whole table).
 */

import { afterEach, describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { WENDIGO_DOOR_CHAPTER, WENDIGO_DOOR_WORD } from '../../../src/app/screens/frontend/wendigoDoor.ts';
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
  it('the word is wendigo, and it leads to the chapter getChapter finds', () => {
    expect(WENDIGO_DOOR_WORD).toBe('wendigo');
    expect(WENDIGO_DOOR_CHAPTER).toBe('wendigo');
    expect(getChapter(WENDIGO_DOOR_CHAPTER)?.number).toBe(49);
  });

  it('typed in time on the board it opens on the last letter, and not before', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...WENDIGO_DOOR_WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey('o', 1000 + (WENDIGO_DOOR_WORD.length - 1) * 120).next).toBe('wendigo');
  });

  it('a wrong letter or a long pause resets it', () => {
    expect(type(new BoardDoors(), 'wendigx')).toBeNull();
    const doors = new BoardDoors();
    let opened: string | null = null;
    [...WENDIGO_DOOR_WORD].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 5000); // a pause between every letter
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('no door\'s word begins with, ends with or contains another\'s, and no word\'s end is another\'s beginning', () => {
    const words = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.word);
    expect(new Set(words).size).toBe(words.length);
    expect(words).toContain(WENDIGO_DOOR_WORD);
    for (const a of words) {
      for (const b of words) {
        if (a === b) continue;
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
      }
    }
    for (const b of words.filter((w) => w !== WENDIGO_DOOR_WORD)) {
      for (let n = 1; n < Math.min(b.length, WENDIGO_DOOR_WORD.length); n++) {
        expect(WENDIGO_DOOR_WORD.endsWith(b.slice(0, n)), `wendigo ends with the start of ${b}`).toBe(false);
        expect(b.endsWith(WENDIGO_DOOR_WORD.slice(0, n)), `${b} ends with the start of wendigo`).toBe(false);
      }
    }
  });

  it('the letters the board answers are claimed by the word and the rest are unbound: W is up, E is start, D is right; N, I, G and O are bound to nothing', () => {
    const keys = KEY_MAP as unknown as Record<string, unknown>;
    const bound = (letter: string): boolean => Object.keys(keys).some((k) => k.toLowerCase() === `key${letter}` || k.toLowerCase() === letter);
    // The key map is the real one; the letters the word uses are checked, not assumed. N, I, G and O must be free so the word never fires a command.
    for (const free of ['n', 'i', 'g', 'o']) expect(bound(free), `${free} is bound`).toBe(false);
    for (const used of ['w', 'e', 'd']) expect(bound(used), `${used} is bound`).toBe(true);
  });
});

describe('desktop only (the fourth hidden 3D chapter)', () => {
  it('the phone tier shuts the door and every other tier opens it, the gate read when the door opens', () => {
    const doors = new BoardDoors();
    setArtTier('phone');
    expect(doors.isOpen('wendigo')).toBe(false);
    for (const tier of ['low', 'mid', 'high', null] as const) {
      setArtTier(tier);
      expect(doors.isOpen('wendigo'), String(tier)).toBe(true);
    }
  });

  it('the chapter card text and the word are the chapter\'s own: the door note names the gate', async () => {
    const { readFileSync } = await import('node:fs');
    const note = readFileSync('src/app/screens/frontend/wendigoDoor.ts', 'utf8');
    expect(note).toMatch(/desktop-only/i);
    expect(note).toMatch(/219q/);
  });
});
