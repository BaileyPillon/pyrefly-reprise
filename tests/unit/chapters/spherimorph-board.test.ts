// @vitest-environment jsdom
/**
 * The word `spherimorph` against the REAL `Input`, the real chapter-select board, the real title screen and the real party-prep screen (FFX only; `spherimorph-door.test.ts` drives only `BoardDoors`; this is the real-board
 * suite, the Last Summoning's (`summon-door.test.ts`, whose word also opens with an S) and the Sanctuary Keeper's with this chapter's letters).
 *
 * What it pins: the letters of the word are known keys (S is `down`, E is `start`, R is `r1`, M is `select`; P, H, I and O are bound to nothing: so the word is typed on the board and the title answers only its E); the
 * chapter is hidden from the board's tiles and cards; the word opens it on the last letter, remembering nothing and writing nothing (the first S is a plain `down` and moves the cursor one step, as the first letter of
 * `summon` and `daigoro` do; every later letter is the word's and moves nothing); an E typed mid-word is not a Start press on the board, and a lone `down`, `start`, `r1` or `select` does not open a card; the opening
 * letters of the board never begin the fight in party prep; a wrong letter and a long pause reset it. Every case reads the word from its one constant, never a literal.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PartyPrepScreen } from '../../../src/app/screens/PartyPrepScreen.ts';
import { TitleScreen } from '../../../src/app/screens/TitleScreen.ts';
import { ChapterSelectScreen } from '../../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../../src/app/screens/frontend/boardFocus.ts';
import { buildChapterTiles } from '../../../src/app/screens/frontend/chapterGrid.ts';
import { SPHERIMORPH_DOOR_CHAPTER, SPHERIMORPH_DOOR_WORD } from '../../../src/app/screens/frontend/spherimorphDoor.ts';
import { KEY_GAP_MS } from '../../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../../src/audio/index.ts';
import { CHAPTERS, CHAPTER_IDS, getChapter } from '../../../src/data/encounters.ts';

const WORD = SPHERIMORPH_DOOR_WORD;
const CHAPTER = SPHERIMORPH_DOOR_CHAPTER;
const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

let clock = 0;
let inputs: Input[] = [];
let rigs: Array<{ screen: ChapterSelectScreen; input: Input; root: HTMLElement }> = [];
let preps: PartyPrepScreen[] = [];

function realInput(): Input {
  const input = new Input({ pointerRoot: document.body });
  input.attach();
  inputs.push(input);
  return input;
}

/** The abstract buttons one real key event latches: the key goes down, one frame reads it, the key goes up. */
function buttonsFor(key: string): Button[] {
  const input = realInput();
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: codeOf(key), bubbles: true }));
  clock += 100;
  const snap = input.update(clock);
  const pressed = (['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle', 'start', 'select', 'l1', 'r1'] as Button[]).filter((b) => snap.justPressed(b));
  input.endFrame();
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code: codeOf(key), bubbles: true }));
  return pressed;
}

/** The real title screen's `handleInput` fed one real key; `advance` (the start of the flow) is the thing watched. */
function titleAdvancesOn(key: string): boolean {
  const advance = vi.spyOn(TitleScreen.prototype as unknown as { advance: () => Promise<void> }, 'advance').mockResolvedValue();
  const title = new TitleScreen();
  const input = realInput();
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: codeOf(key), bubbles: true }));
  clock += 100;
  title.handleInput(input.update(clock));
  input.endFrame();
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code: codeOf(key), bubbles: true }));
  const began = advance.mock.calls.length > 0;
  advance.mockRestore();
  return began;
}

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  input: Input;
  picked: string[];
  settled: string[];
  frame(gap?: number): void;
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
  const frame = (gap = 100): void => {
    clock += gap;
    screen.handleInput(input.update(clock));
    input.endFrame();
  };
  rigs.push({ screen, input, root });
  const type = (key: string, code = codeOf(key)): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
    frame();
    window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
  };
  return { screen, root, input, picked, settled, frame, type, typeWord: (word) => [...word].forEach((ch) => type(ch)) };
}

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};
const keyDown = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: codeOf(key), bubbles: true }));
};
const keyUp = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code: codeOf(key), bubbles: true }));
};

/** The board as the flow runs it: the real `Input`, the real board, and the real `PartyPrepScreen` mounted in the microtask after the board settles. */
function mountFlow() {
  const rig = mount();
  let prep: PartyPrepScreen | null = null;
  void rig.screen.done.then((id) => {
    const chapter = id ? getChapter(id) : undefined;
    if (!chapter) return;
    rig.screen.exit(); // the flow replaces the board
    const root = document.createElement('div');
    document.body.appendChild(root);
    prep = new PartyPrepScreen({ chapter });
    prep.root = root;
    prep.app = { fade: () => Promise.resolve() } as unknown as PartyPrepScreen['app'];
    prep.enter();
    preps.push(prep);
  });
  const step = async (): Promise<void> => {
    clock += 100;
    (prep ?? rig.screen).handleInput(rig.input.update(clock));
    rig.input.endFrame();
    await flush();
  };
  const press = async (key: string): Promise<void> => {
    keyDown(key);
    await flush();
    await step();
    keyUp(key);
  };
  return { ...rig, prep: () => prep, step, press };
}

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
  for (const prep of preps) {
    prep.exit();
    prep.root.remove();
  }
  preps = [];
  setFf7ExperimentReadyForTests(null);
  forgetBoardChapter();
  vi.restoreAllMocks();
});

describe('every letter of the word is a known key', () => {
  it('S is down, E is start, R is r1, M is select; P, H, I and O are bound to nothing', () => {
    expect(buttonsFor('s')).toEqual(['down']);
    expect(buttonsFor('p')).toEqual([]);
    expect(buttonsFor('h')).toEqual([]);
    expect(buttonsFor('e')).toEqual(['start']);
    expect(buttonsFor('r')).toEqual(['r1']);
    expect(buttonsFor('i')).toEqual([]);
    expect(buttonsFor('m')).toEqual(['select']);
    expect(buttonsFor('o')).toEqual([]);
    expect(new Set(WORD)).toEqual(new Set(['s', 'p', 'h', 'e', 'r', 'i', 'm', 'o'])); // ...and that is every distinct letter of the word
  });

  it('on the title screen only the E begins the flow (so the word is typed on the board, never on the title)', () => {
    for (const letter of new Set(WORD)) expect(titleAdvancesOn(letter), `the title started on "${letter}"`).toBe(letter === 'e');
  });

  it('the control: Enter, Space, Z, E and C, which the title does answer, do begin it (so the check above can fail)', () => {
    for (const key of ['Enter', ' ', 'z', 'e', 'c']) expect(titleAdvancesOn(key), key).toBe(true);
  });
});

describe('hidden by default', () => {
  it('the board holds the listed chapters only: no tile and no card for Spherimorph, no EXP numeral', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(CHAPTERS.length);
    expect(tiles.some((t) => t.id === CHAPTER || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect((CHAPTER_IDS as readonly string[]).includes(CHAPTER)).toBe(false);
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(CHAPTERS.length);
    expect(rig.root.querySelector(`[data-card="${CHAPTER}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/\bEXP\b/);
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(CHAPTER);
  });
});

describe('the word opens it on chapter select, and its E, R and M never start a fight, open a card or move the cursor', () => {
  it('settles on the chapter on the last letter, remembers nothing and writes nothing (the first S moved the cursor one step, as the first letter of summon does)', async () => {
    const rig = mount();
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored();
    const cursor = vi.spyOn(audio, 'playSfx');
    rig.type(WORD[0]!); // the S: a plain `down` on the board
    const afterFirst = rig.screen.snapshot()['selectedIndex'];
    for (const ch of WORD.slice(1, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(afterFirst); // the later letters belong to the word: the cursor does not move
      expect(rig.picked, `after "${ch}"`).toEqual([]);
    }
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
    expect(rig.settled).toEqual([CHAPTER]);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(afterFirst);
    expect(lastBoardChapter()).toBeNull();
    expect(cursor.mock.calls.filter(([name]) => name === 'confirm')).toEqual([]);
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(window.localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
    expect(stored(), 'the door wrote nothing, under any key').toEqual(before);
  });

  it('opens in capitals too (Shift held)', async () => {
    const rig = mount();
    for (const ch of WORD.toUpperCase()) {
      rig.type('Shift', 'ShiftLeft');
      rig.type(ch);
    }
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
  });

  it('a wrong letter resets it: every typo, half of each other door\'s word, an unrelated word', async () => {
    const wrongs = ['spherimorxh', `${WORD.slice(0, 5)}x${WORD.slice(5)}`, WORD.slice(0, -1), 'sphere'];
    for (const wrong of wrongs) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      expect(rig.picked.includes(CHAPTER), wrong).toBe(false);
    }
  });

  it('a pause over the gap between letters ends the match, and the word typed again after it opens', async () => {
    let t = 5_000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const rig = mount();
    const typeAll = (letters: string): void => [...letters].forEach((ch) => (rig.type(ch), (t += 100)));
    typeAll(WORD.slice(0, 3));
    t += KEY_GAP_MS + 500;
    typeAll(WORD.slice(3, 4));
    await flush();
    expect(rig.picked, 'the pause ended the match').toEqual([]);
    typeAll(WORD);
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
  });

  it('keeps the board working: a plain S moves the cursor down, a plain P, H, I or O does nothing, and the E, R and M inside the live word do nothing either', async () => {
    const rig = mount();
    const rest = rig.screen.snapshot()['selectedIndex'] as number;
    for (const ch of ['p', 'h', 'i', 'o']) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `a plain "${ch}"`).toBe(rest);
    }
    rig.type('s');
    expect(rig.screen.snapshot()['selectedIndex'], 'a plain S is down').not.toBe(rest);
    const after = rig.screen.snapshot()['selectedIndex'];
    for (const ch of ['p', 'h', 'e', 'r', 'i', 'm']) rig.type(ch); // the live word "sphe...": its letters are the word's
    expect(rig.screen.snapshot()['selectedIndex']).toBe(after);
    await flush();
    expect(rig.picked).toEqual([]);
  });

  it('a lone E (start), R (r1) or M (select) on the board opens no card and finishes no word', async () => {
    const rig = mount();
    rig.type('e');
    rig.type('r');
    rig.type('m');
    rig.type('p');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.settled).toEqual([]);
  });
});

describe('the word opens party prep, and its last letter is not a press', () => {
  it('a key per letter and a frame after each: party prep is up for the chapter, holds through more frames, and Enter begins it', async () => {
    const flow = mountFlow();
    for (const ch of WORD) await flow.press(ch);
    expect([flow.picked, flow.settled]).toEqual([[CHAPTER], [CHAPTER]]);
    const prep = flow.prep();
    expect(prep, 'the flow mounted party prep').not.toBeNull();
    expect(prep!.snapshot()['chapter']).toBe(CHAPTER);
    for (let i = 0; i < 6; i++) await flow.step();
    expect(prep!.snapshot()['outcome'], 'party prep began the fight on the press that finished the word').toBeNull();
    keyDown('Enter');
    await flush();
    await flow.step();
    keyUp('Enter');
    expect(prep!.snapshot()['outcome']).toBe('begin');
  });

  it('every letter dispatched back to back, up and down before any frame: the same', async () => {
    const flow = mountFlow();
    for (const ch of WORD) keyDown(ch);
    for (const ch of WORD) keyUp(ch);
    await flush();
    for (let i = 0; i < 6; i++) await flow.step();
    expect(flow.settled).toEqual([CHAPTER]);
    expect(flow.picked).toEqual([CHAPTER]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the last letter (H is bound to nothing) held down through the opening frames does not start the fight either', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    keyDown(WORD.at(-1)!);
    await flush();
    for (let i = 0; i < 8; i++) await flow.step();
    keyUp(WORD.at(-1)!);
    await flush();
    expect(flow.settled).toEqual([CHAPTER]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the first letters also held through the title are never a start: E mid-word on the board is swallowed by the live match', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, 4)) await flow.press(ch); // "sphe": the E is a start press on its own
    expect(flow.settled).toEqual([]);
    expect(flow.prep()).toBeNull();
  });
});
