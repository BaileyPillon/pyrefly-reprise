// @vitest-environment jsdom
/**
 * The word `bluelight` against the REAL `Input` and the real chapter-select board (FF7 only; the hidden Jenova LIFE,
 * `src/app/screens/frontend/bluelightDoor.ts`). The Sanctuary Keeper's and Yuna's Ballad's suites with this chapter's letters,
 * minus party prep (FF7 has none: the flow hands an experiment straight to its battle, `BattleScreenExperiment.ts`).
 *
 * What it pins: which of the word's letters are bound keys (E is `start`, which the board ignores; B, L, U, I, G, H and T
 * are bound to nothing, so the last letter leaves no latched press); the chapter is hidden from the board's tiles and
 * cards; the word opens it on the last letter, remembering and writing nothing; every letter after the first is claimed by
 * the word; a wrong letter and a long pause reset it; it stays shut while the FF7 switch is off; it is not desktop-only.
 * Every case reads the word from its one constant, never a literal.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { BoardDoors, CHAPTER_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { BLUELIGHT_DOOR_CHAPTER, BLUELIGHT_DOOR_WORD } from '../../src/app/screens/frontend/bluelightDoor.ts';
import { KEY_GAP_MS } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { CHAPTERS, CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';

const WORD = BLUELIGHT_DOOR_WORD;
const CHAPTER = BLUELIGHT_DOOR_CHAPTER;
const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

let clock = 0;
let inputs: Input[] = [];
let rigs: Array<{ screen: ChapterSelectScreen; input: Input; root: HTMLElement }> = [];

/** The abstract buttons one real key event latches: the key goes down, one frame reads it, the key goes up. */
function buttonsFor(key: string): Button[] {
  const input = new Input({ pointerRoot: document.body });
  input.attach();
  inputs.push(input);
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: codeOf(key), bubbles: true }));
  clock += 100;
  const snap = input.update(clock);
  const pressed = (['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle', 'start', 'select', 'l1', 'r1'] as Button[]).filter((b) => snap.justPressed(b));
  input.endFrame();
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code: codeOf(key), bubbles: true }));
  return pressed;
}

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  picked: string[];
  settled: string[];
  type(key: string, code?: string): void;
  typeWord(word: string): void;
}

function mount(): Rig {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const input = new Input({ pointerRoot: root });
  input.attach();
  forgetBoardChapter();
  const picked: string[] = [];
  const settled: string[] = [];
  const screen = new ChapterSelectScreen({ onSelect: (id) => picked.push(id) });
  screen.root = root;
  screen.app = { save: new SaveStore(), fade: () => Promise.resolve() } as unknown as ChapterSelectScreen['app'];
  screen.enter();
  void screen.done.then((id) => settled.push(String(id)));
  rigs.push({ screen, input, root });
  const frame = (): void => {
    clock += 100;
    screen.handleInput(input.update(clock));
    input.endFrame();
  };
  const type = (key: string, code = codeOf(key)): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
    frame();
    window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
  };
  return { screen, root, picked, settled, type, typeWord: (word) => [...word].forEach((ch) => type(ch)) };
}

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  window.localStorage.clear();
  setFf7ExperimentReadyForTests(true);
});

afterEach(() => {
  for (const { screen, input, root } of rigs) {
    screen.exit();
    input.detach();
    root.remove();
  }
  rigs = [];
  for (const input of inputs) input.detach();
  inputs = [];
  setFf7ExperimentReadyForTests(null);
  forgetBoardChapter();
  vi.restoreAllMocks();
});

describe('the word against the table of doors', () => {
  it('is bluelight, leads to the chapter getChapter finds (number 44, FF7, hidden), and is a row of the table in chapter-number order (only the doors of higher-numbered chapters follow it: the table was bluelight-last until release 78 added 46), behind the FF7 switch and not the secret door', () => {
    expect(WORD).toBe('bluelight');
    expect(getChapter(CHAPTER)).toMatchObject({ id: 'ff7-jenova-life', number: 44, game: 'ff7', experimental: true });
    const at = CHAPTER_DOORS.findIndex((d) => d.word === WORD);
    const row = CHAPTER_DOORS[at]!;
    for (const later of CHAPTER_DOORS.slice(at + 1)) expect(getChapter(later.chapter)?.number ?? 0, later.word).toBeGreaterThan(44);
    expect(row).toMatchObject({ word: WORD, chapter: CHAPTER });
    expect(row.secret).toBeUndefined();
    expect(row.gate).toBeTypeOf('function');
  });

  it('typed in time on BoardDoors it opens on the last letter and not before; a wrong letter or a long pause resets it', () => {
    const doors = new BoardDoors();
    let early: string | null = null;
    [...WORD.slice(0, -1)].forEach((key, i) => {
      const feed = doors.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) early = feed.next;
    });
    expect(early).toBeNull();
    expect(doors.feedKey(WORD.at(-1)!, 1000 + (WORD.length - 1) * 120).next).toBe(CHAPTER);
    const wrong = new BoardDoors();
    let opened: string | null = null;
    [...`${WORD.slice(0, 4)}x${WORD.slice(4)}`].forEach((key, i) => {
      const feed = wrong.feedKey(key, 1000 + i * 120);
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
    const slow = new BoardDoors();
    [...WORD].forEach((key, i) => {
      const feed = slow.feedKey(key, 1000 + i * 5000);
      if (feed.next !== null) opened = feed.next;
    });
    expect(opened).toBeNull();
  });

  it('the gate: with the FF7 switch off the door is shut for this chapter alone (the word is typed and nothing opens)', () => {
    const doors = new BoardDoors();
    setFf7ExperimentReadyForTests(false);
    expect(doors.isOpen(CHAPTER)).toBe(false);
    expect(doors.isOpen('ffx2-yunas-ballad')).toBe(true);
    setFf7ExperimentReadyForTests(true);
    expect(doors.isOpen(CHAPTER)).toBe(true);
  });
});

describe('every letter of the word is a known key', () => {
  it('E is start (the board ignores it); B, L, U, I, G, H and T are bound to nothing', () => {
    expect(buttonsFor('e')).toEqual(['start']);
    for (const letter of ['b', 'l', 'u', 'i', 'g', 'h', 't']) expect(buttonsFor(letter), letter).toEqual([]);
    expect(new Set(WORD)).toEqual(new Set(['b', 'l', 'u', 'e', 'i', 'g', 'h', 't'])); // ...and that is every distinct letter of the word
  });
});

describe('hidden by default', () => {
  it('the board holds the listed chapters only: no tile and no card for Jenova LIFE, no EXP numeral', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(CHAPTERS.length);
    expect(tiles.some((t) => t.id === (CHAPTER as never) || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect((CHAPTER_IDS as readonly string[]).includes(CHAPTER)).toBe(false);
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(CHAPTERS.length);
    expect(rig.root.querySelector(`[data-card="${CHAPTER}"]`)).toBeNull();
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(CHAPTER);
  });
});

describe('the word opens it on chapter select', () => {
  it('settles on the chapter on the last letter, remembers nothing and writes nothing; the later letters, the E included, move nothing', async () => {
    const rig = mount();
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored();
    rig.type(WORD[0]!);
    const afterFirst = rig.screen.snapshot()['selectedIndex'];
    for (const ch of WORD.slice(1, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(afterFirst);
      expect(rig.picked, `after "${ch}"`).toEqual([]);
    }
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
    expect(rig.settled).toEqual([CHAPTER]);
    expect(lastBoardChapter()).toBeNull();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(window.localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
    expect(stored(), 'the door wrote nothing, under any key').toEqual(before);
  });

  it('opens in capitals too (Shift held), and with the FF7 switch off it does nothing at all', async () => {
    const rig = mount();
    for (const ch of WORD) rig.type(ch.toUpperCase(), codeOf(ch));
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
    setFf7ExperimentReadyForTests(false);
    const shut = mount();
    shut.typeWord(WORD);
    await flush();
    expect(shut.picked).toEqual([]);
    expect(shut.settled).toEqual([]);
  });

  it('a wrong letter resets it, and a pause over the gap ends the match (the word typed again after it opens)', async () => {
    const wrong = mount();
    wrong.typeWord(`${WORD.slice(0, 4)}x${WORD.slice(4)}`);
    await flush();
    expect(wrong.picked).toEqual([]);
    let t = 5_000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const rig = mount();
    const typeAll = (letters: string): void => [...letters].forEach((ch) => (rig.type(ch), (t += 100)));
    typeAll(WORD.slice(0, 4));
    t += KEY_GAP_MS + 500;
    typeAll(WORD.slice(4, 5));
    await flush();
    expect(rig.picked, 'the pause ended the match').toEqual([]);
    typeAll(WORD);
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
  });

  it('keeps the board working: a plain L, U, I, G, H or T does nothing, and a lone letter finishes no word', async () => {
    const rig = mount();
    const start = rig.screen.snapshot()['selectedIndex'] as number;
    for (const ch of ['l', 'u', 'i', 'g', 'h', 't']) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `a plain "${ch}"`).toBe(start);
    }
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.settled).toEqual([]);
  });
});
