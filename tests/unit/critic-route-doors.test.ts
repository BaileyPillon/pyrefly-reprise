/**
 * FOC52-003 (the deep review of release 52): the critic's route could not open a hidden chapter. `critic/runner/lib/route.mjs` walks the chapter board with the arrow keys until the chapter's
 * card is selected, and a hidden chapter has no card ("ASSERT-FAIL card sinspawn-gui got yunalesca"). The board opens such a chapter when its word is typed on it
 * (`src/app/screens/frontend/chapterDoors.ts#CHAPTER_DOORS`); the route now types the word. Game case: both (shared critic plumbing); each door's game is its chapter's.
 */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BoardDoors, CHAPTER_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { DOOR_WORDS, doorWordFor } from '../../critic/runner/lib/route-pure.mjs';

/** The route's cadence: one letter, then 150 ms (`route.mjs#typeDoor`). */
const GAP_MS = 150;

describe('the route\'s table of door words is the board\'s', () => {
  it('has one word for every door of the board and no other, chapter for chapter', () => {
    const app = Object.fromEntries(CHAPTER_DOORS.map((d) => [d.chapter, d.word]));
    expect({ ...DOOR_WORDS }).toEqual(app);
    expect(Object.keys(DOOR_WORDS)).toHaveLength(11); // limit, leblanc, experiment, mushroom, fayth, daigoro, valefor, gagazet, angra, yojimbo, summon
  });

  it('answers null for a chapter that has a card on the board (the arrow-key walk finds it)', () => {
    const listed = CHAPTERS.map((c) => c.id).filter((id) => !(id in DOOR_WORDS));
    expect(listed.length).toBeGreaterThan(10);
    for (const id of listed) expect(doorWordFor(id), id).toBeNull();
    expect(doorWordFor('sinspawn-gui')).toBe('mushroom');
    expect(doorWordFor('last-summoning')).toBe('summon');
    expect(doorWordFor('toString')).toBeNull(); // not an inherited property
  });
});

describe('typing the word at the route\'s cadence opens its chapter on the board', () => {
  it.each(CHAPTER_DOORS.map((d) => [d.word, d.chapter, d.secret === true] as const))('%s opens %s', (word, chapter, secret) => {
    const doors = new BoardDoors();
    let last = { now: null as string | null, next: null as string | null };
    for (let i = 0; i < word.length; i++) {
      const fed = doors.feedKey(word[i]!, i * GAP_MS);
      if (i < word.length - 1) {
        expect(fed.now, `${word}: not yet open after "${word.slice(0, i + 1)}"`).toBeNull();
        expect(fed.next, `${word}: not yet open after "${word.slice(0, i + 1)}"`).toBeNull();
      }
      last = fed;
    }
    expect(secret ? last.now : last.next).toBe(chapter);
  });
});

describe('route.mjs uses it', () => {
  const src = fs.readFileSync('critic/runner/lib/route.mjs', 'utf8');

  it('looks the word up once and types it instead of walking to a card, then goes on to party prep without an Enter', () => {
    expect(src).toMatch(/const door = doorWordFor\(id\)/);
    expect(src).toMatch(/if \(door\) \{[^]*?await typeDoor\(\);[^]*?\} else \{[^]*?rec\.boardWalk = await findCard\(id\);/);
    expect(src).toMatch(/if \(!door\) await input\.press\('Enter'\)/);
  });

  it('types the word again after Esc from party prep (a fresh board visit keeps nothing of it) and still asserts the card for every other chapter', () => {
    expect(src).toMatch(/if \(door\) await typeDoor\(\);/);
    expect(src).toMatch(/ASSERT-FAIL card \$\{id\} got/);
  });

  it('types the letters one key at a time, inside the door\'s two-second gap', () => {
    expect(src).toMatch(/const typeDoor = async \(\) => \{ for \(const ch of door\) \{ await input\.press\(ch\); await page\.waitForTimeout\(150\); \} \};/);
    expect(GAP_MS).toBeLessThan(2000);
  });
});
