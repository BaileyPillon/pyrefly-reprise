/**
 * **The chapter-select board's doors, as one table** (`src/app/screens/frontend/chapterDoors.ts`): the one test over every word at once.
 *
 * Each door's own suite (`ff7-secret-door`, `exp-leblanc-door`, `ffx2-experiment-door`, `mushroom-door`, `fayth-door`, `daigoro-door`, `valefor-door`, `gagazet-door`, `angra-door`, `yojimbo-door`) drives the board with real key events and compared its word with its neighbours' by hand,
 * each with the neighbours it knew of. This one reads the table, so a word added tomorrow is checked against every word that is already there:
 *
 * - **no word begins with, ends with or contains another**, and **no end of one word is the beginning of another** (a run of letters that finishes one word must not also start, or finish, a second one:
 *   the shorter door would fire first, or two would fire on one run);
 * - every word is a distinct run of lower-case letters long enough to type by hand, every chapter is distinct and resolves, every hidden one is an experiment the board has no card for, and
 *   exactly one row is FF7's secret door (its taps and pad sequence are the same door);
 * - `BoardDoors` does what the table says: each word opens its row's chapter and no other, the FF7 word opens at once and the others a frame later (`next`), a later letter of a plain word is
 *   claimed from the board and never FF7's, the gate shuts only the chapter it is on, and nothing survives into a new visit.
 *
 * Game case: shared plumbing (both). Pure: no DOM.
 */
import { describe, expect, it } from 'vitest';

import { BoardDoors, CHAPTER_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { DOOR_WORD, KEY_GAP_MS, PAD_SEQUENCE, TAP_COUNT } from '../../src/app/screens/frontend/secretDoor.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { CHAPTER_IDS, CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORDS = CHAPTER_DOORS.map((d) => d.word);

/** Type `word` one letter at a time, `step` ms apart from `start`; the result of each key. */
function type(doors: BoardDoors, word: string, start = 0, step = 100) {
  return [...word].map((ch, i) => doors.feedKey(ch, start + i * step));
}

describe('the table', () => {
  it('holds the ten doors in the order they were added, each word a run of lower-case letters long enough to be typed by hand', () => {
    expect(WORDS).toEqual(['limit', 'leblanc', 'experiment', 'mushroom', 'fayth', 'daigoro', 'valefor', 'gagazet', 'angra', 'yojimbo']);
    expect(WORDS[0]).toBe(DOOR_WORD);
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (const w of WORDS) expect(w, w).toMatch(/^[a-z]{4,}$/);
  });

  it('no word begins with, ends with or contains another, and no end of one word is the beginning of another', () => {
    for (const a of WORDS) {
      for (const b of WORDS) {
        if (a === b) continue;
        expect(a.startsWith(b), `${a} begins ${b}`).toBe(false);
        expect(a.endsWith(b), `${a} ends with ${b}`).toBe(false);
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
        // A suffix of `a` (the last k letters, any k up to its length) equal to a prefix of `b`: one run of letters could finish `a` while starting `b`.
        for (let k = 1; k <= Math.min(a.length, b.length); k++) expect(a.slice(-k) === b.slice(0, k), `the last ${k} of ${a} start ${b}`).toBe(false);
      }
    }
  });

  it('every chapter is distinct and resolves; every hidden one is an experiment with no card on the board; exactly one row is FF7\'s secret door', () => {
    const chapters = CHAPTER_DOORS.map((d) => d.chapter);
    expect(new Set(chapters).size).toBe(chapters.length);
    for (const id of chapters) expect(getChapter(id), id).toBeDefined();
    for (const id of chapters) {
      expect(CHAPTERS.map((c) => c.id as string), id).not.toContain(id);
      expect((CHAPTER_IDS as readonly string[]).includes(id), id).toBe(false);
    }
    expect(CHAPTER_DOORS.filter((d) => d.secret === true).map((d) => d.chapter)).toEqual(['ff7-guard-scorpion']);
    expect(CHAPTER_DOORS.filter((d) => d.gate !== undefined).map((d) => d.chapter)).toEqual(['ff7-guard-scorpion']);
    for (const d of CHAPTER_DOORS.filter((x) => x.secret !== true)) expect(getChapter(d.chapter), d.chapter).toMatchObject({ experimental: true });
  });

  it('leads the FFX words to FFX chapters and the FFX-2 words to FFX-2 chapters (the game of the row is the chapter\'s)', () => {
    const game = (word: string): string | undefined => getChapter(CHAPTER_DOORS.find((d) => d.word === word)!.chapter)?.game;
    expect([game('limit'), game('leblanc'), game('experiment'), game('mushroom'), game('fayth'), game('daigoro'), game('valefor'), game('gagazet'), game('angra'), game('yojimbo')]).toEqual(['ff7', 'ffx2', 'ffx2', 'ffx', 'ffx', 'ffx2', 'ffx2', 'ffx', 'ffx2', 'ffx']);
  });
});

describe('BoardDoors feeds the table', () => {
  it('each word opens its own chapter on its last letter, in either case, and no other chapter: FF7\'s at once, the rest a frame later', () => {
    for (const row of CHAPTER_DOORS) {
      for (const word of [row.word, row.word.toUpperCase()]) {
        const fed = type(new BoardDoors(), word);
        expect(fed.slice(0, -1).every((f) => f.now === null && f.next === null), `${word}: nothing before the last letter`).toBe(true);
        const last = fed.at(-1)!;
        expect([last.now, last.next], word).toEqual(row.secret === true ? [row.chapter, null] : [null, row.chapter]);
      }
    }
  });

  it('a wrong letter resets, a wrong first letter starts the word again, and a pause over the gap ends the match', () => {
    for (const row of CHAPTER_DOORS) {
      const typo = row.word.slice(0, 2) + (row.word[2] === 'k' ? 'j' : 'k') + row.word.slice(3);
      expect(type(new BoardDoors(), typo).some((f) => f.now || f.next), typo).toBe(false);
      expect(type(new BoardDoors(), row.word[0]! + row.word).at(-1), `${row.word[0]}${row.word}`).toMatchObject(row.secret === true ? { now: row.chapter } : { next: row.chapter });
      const doors = new BoardDoors();
      type(doors, row.word.slice(0, 3), 0, 100);
      expect(type(doors, row.word.slice(3), 200 + KEY_GAP_MS + 1, 100).some((f) => f.now || f.next), `${row.word} after a pause`).toBe(false);
    }
  });

  it('claims a later letter of a plain word from the board (never the first, never FF7\'s), and a key after the word\'s end claims nothing', () => {
    for (const row of CHAPTER_DOORS) {
      const doors = new BoardDoors();
      const fed = type(doors, row.word);
      expect(fed[0]!.claimed, `${row.word}: the first letter is never claimed`).toBe(false);
      for (const f of fed.slice(1)) expect(f.claimed, `${row.word}: a later letter`).toBe(row.secret !== true);
      expect(doors.feedKey('z', 5_000).claimed).toBe(false);
    }
  });

  it('opens FF7\'s chapter by seven taps and by the pad sequence, as the same door; six taps and a broken sequence open nothing', () => {
    const taps = new BoardDoors();
    expect(Array.from({ length: TAP_COUNT - 1 }, (_, i) => taps.feedTap(i * 300))).toEqual(Array(TAP_COUNT - 1).fill(null));
    expect(taps.feedTap((TAP_COUNT - 1) * 300)).toBe('ff7-guard-scorpion');
    const pad = new BoardDoors();
    expect(PAD_SEQUENCE.map((b, i) => pad.feedButton(b, i * 100)).at(-1)).toBe('ff7-guard-scorpion');
    const broken = new BoardDoors();
    expect(['l1', 'r1', 'left', 'l1', 'r1', 'select'].map((b, i) => broken.feedButton(b, i * 100))).not.toContain('ff7-guard-scorpion');
  });

  it('the gate shuts FF7\'s chapter alone: with the switch off isOpen is false for it and true for every other door', () => {
    const doors = new BoardDoors();
    try {
      setFf7ExperimentReadyForTests(false);
      expect(doors.isOpen('ff7-guard-scorpion')).toBe(false);
      for (const d of CHAPTER_DOORS.filter((x) => x.secret !== true)) expect(doors.isOpen(d.chapter), d.chapter).toBe(true);
      setFf7ExperimentReadyForTests(true);
      expect(doors.isOpen('ff7-guard-scorpion')).toBe(true);
    } finally {
      setFf7ExperimentReadyForTests(null);
    }
  });

  it('remembers nothing between visits: half a word typed on one visit does not finish on the next', () => {
    for (const row of CHAPTER_DOORS) {
      const first = new BoardDoors();
      type(first, row.word.slice(0, -1));
      const second = new BoardDoors();
      const last = second.feedKey(row.word.at(-1)!, 300);
      expect(last.now ?? last.next, row.word).toBeNull();
    }
  });
});
