// @vitest-environment jsdom
/**
 * The hidden door to the Tourist Trap chapter (FFX-2 only; branch `ch-tourist-trap`, 2026-10-14): the word `daigoro`, typed on chapter select, opens Yojimbo and Daigoro in the Cavern of the
 * Stolen Fayth (chapter 23, `ffx2-tourist-trap`).
 *
 * Written against the Fayth door's suite (`fayth-door.test.ts`): the real `Input`, real key events, the real board and the real title screen. It pins that
 *
 * 1. **the word is safe to type**: D is `right`, A is `left`, R is `r1`; I, G and O are bound to nothing. The board's cursor takes ONE step on the first D (a first letter cannot be claimed: the
 *    board cannot know a word is coming; stated in `daigoroDoor.ts`), the A of the word is claimed by it (no second step), R1 is not a board action, the last letter O is unbound, and the title
 *    answers only `confirm` and `start`, none of them a letter of the word;
 * 2. **the chapter is hidden by default**: the assertions are on its id, its EXP numeral and the tile count, never on the word in the board's text (Chapter IX's card reads "Cavern of the Stolen Fayth");
 * 3. **the word opens it**, and only the word: nothing is remembered or written; a wrong letter resets, and so does a pause over 2 s between letters;
 * 4. **the six doors do not interfere**, and the chapter opens party prep, whose fight does not begin on the press that finished the word.
 *
 * The tests read the word from its one constant, never a literal.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PartyPrepScreen } from '../../src/app/screens/PartyPrepScreen.ts';
import { TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { buildChapterTiles, groupChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { CHAPTER_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { DAIGORO_DOOR_CHAPTER, DAIGORO_DOOR_WORD } from '../../src/app/screens/frontend/daigoroDoor.ts';
import { KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORD = DAIGORO_DOOR_WORD;
const TRAP = DAIGORO_DOOR_CHAPTER;

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function typeWord(door: WordDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

describe('the word (pure)', () => {
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to a hidden FFX-2 experiment numbered 23', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(TRAP).toBe('ffx2-tourist-trap');
    expect(getChapter(TRAP)).toMatchObject({ id: TRAP, game: 'ffx2', experimental: true, number: 23 });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(TRAP);
    expect(CHAPTER_DOORS.find((d) => d.word === WORD)?.chapter).toBe(TRAP);
  });

  it('is not a prefix, suffix or part of any other door word, and no other word is part of it', () => {
    for (const other of CHAPTER_DOORS.filter((d) => d.word !== WORD).map((d) => d.word)) {
      expect(other.startsWith(WORD), `${other} begins ${WORD}`).toBe(false);
      expect(WORD.startsWith(other), `${WORD} begins ${other}`).toBe(false);
      expect(other.endsWith(WORD) || WORD.endsWith(other), `${other} / ${WORD} share an end`).toBe(false);
      expect(other.includes(WORD) || WORD.includes(other), `${other} / ${WORD} contain one another`).toBe(false);
    }
  });

  it('opens on the last letter only, in either case, and ignores keys that are not characters', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
  });

  it('a wrong letter resets (a wrong first letter starts it again); a pause over the gap ends the match', () => {
    for (const typo of [WORD.slice(0, -1), 'daigro', 'dagoro', 'daigoo', 'taigoro', 'dogoro']) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
    expect(typeWord(new WordDoor(WORD), WORD[0] + WORD).at(-1)).toBe('open');
    const door = new WordDoor(WORD);
    typeWord(door, WORD.slice(0, 3), 0, 100);
    expect(typeWord(door, WORD.slice(3), 200 + KEY_GAP_MS + 1, 100)).not.toContain('open');
    const exact = new WordDoor(WORD);
    typeWord(exact, WORD.slice(0, 3), 0, 100);
    expect(typeWord(exact, WORD.slice(3), 200 + KEY_GAP_MS, 100).at(-1)).toBe('open'); // exactly the gap is in time
  });
});

// ------------------------------------------------------------ what each letter does

let clock = 0;
let inputs: Input[] = [];

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

describe('every letter of the word is a known key', () => {
  it('D is right, A is left, R is r1; I, G and O are bound to nothing', () => {
    expect(buttonsFor('d')).toEqual(['right']);
    expect(buttonsFor('a')).toEqual(['left']);
    expect(buttonsFor('r')).toEqual(['r1']);
    for (const letter of ['i', 'g', 'o']) expect(buttonsFor(letter), letter).toEqual([]);
    expect(new Set(WORD)).toEqual(new Set(['d', 'a', 'i', 'g', 'o', 'r'])); // ...and that is every distinct letter of the word
    expect(buttonsFor(WORD.at(-1)!), 'the last letter leaves no press for party prep').toEqual([]);
  });

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

  it('on the title screen only confirm and start begin the flow: no letter of the word does', () => {
    for (const letter of new Set(WORD)) expect(titleAdvancesOn(letter), `the title started on "${letter}"`).toBe(false);
  });

  it('the control: Enter, Space, Z, E and C, which the title does answer, do begin it (so the check above can fail)', () => {
    for (const key of ['Enter', ' ', 'z', 'e', 'c']) expect(titleAdvancesOn(key), key).toBe(true);
  });
});

// ------------------------------------------------------------------ board

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  input: Input;
  picked: string[];
  settled: string[];
  frame(): void;
  type(key: string, code?: string): void;
  typeWord(word: string): void;
}

let rigs: Array<{ screen: ChapterSelectScreen; input: Input; root: HTMLElement }> = [];
let preps: PartyPrepScreen[] = [];

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
  const frame = (): void => {
    clock += 100;
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

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
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

describe('hidden by default', () => {
  it('the board holds the eighteen: no tile for the chapter, no EXP numeral, "of 18" unchanged (asserted on the id, the numeral and the count, never on the word)', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(18);
    expect(new Set(tiles.map((t) => t.id))).toEqual(new Set(CHAPTERS.map((c) => c.id as string)));
    expect(tiles.some((t) => t.id === TRAP || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect(groupChapterTiles(tiles).map((g) => g.tiles.length)).toEqual([11, 7]);
    expect(CHAPTER_IDS).toHaveLength(18);
    expect((CHAPTER_IDS as readonly string[]).includes(TRAP)).toBe(false);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(TRAP);
    const progress = boardProgress(tiles, 0);
    expect([progress.total, progress.pips.length]).toEqual([18, 18]);
  });

  it('the mounted board draws eighteen cards, none for the chapter, and counts "of 18 beaten"', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(18);
    expect(rig.root.querySelector(`[data-card="${TRAP}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/\bEXP\b/);
    expect(rig.root.textContent).toMatch(/of 18 beaten/);
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(TRAP);
    expect(rig.screen.snapshot()['tiles']).toBe(18);
  });

  it('with no word typed, nothing leads in: the arrows around the whole list never select it', async () => {
    const rig = mount();
    for (let i = 0; i < 40; i++) rig.type('ArrowRight');
    for (let i = 0; i < 40; i++) rig.type('ArrowLeft');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.screen.snapshot()['selectedId']).not.toBe(TRAP);
  });
});

describe('the word opens it on chapter select', () => {
  it('settles on the chapter on the last letter; the cursor takes one step on the first D and no other; nothing is remembered or written', async () => {
    const rig = mount();
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored(); // whatever the board itself keeps, taken before the word
    const selected = rig.screen.snapshot()['selectedIndex'] as number;
    const cursor = vi.spyOn(audio, 'playSfx');
    rig.type(WORD[0]!);
    const afterFirst = rig.screen.snapshot()['selectedIndex'];
    expect(afterFirst, 'the first D is a press of right: one step, stated in daigoroDoor.ts').toBe(selected + 1);
    for (const ch of WORD.slice(1, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(afterFirst);
    }
    expect(rig.picked).toEqual([]);
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([TRAP]);
    expect(rig.settled).toEqual([TRAP]);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(afterFirst);
    expect(lastBoardChapter()).toBeNull();
    expect(cursor.mock.calls.filter(([name]) => name === 'cursor-move'), 'one cursor sound, the first letter\'s step').toHaveLength(1);
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
    expect(rig.picked).toEqual([TRAP]);
  });

  it('a wrong letter resets: every typo, a wrong first letter, half of each other door\'s word, an unrelated word', async () => {
    const others = CHAPTER_DOORS.filter((d) => d.word !== WORD).map((d) => d.word.slice(0, -1));
    for (const wrong of ['daigro', 'dagoro', 'daigoo', 'taigoro', WORD.slice(0, -1), ...others, 'dagger']) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      expect(rig.picked, wrong).toEqual([]);
      expect(rig.settled, wrong).toEqual([]);
    }
  });

  it('a pause over 2 s between letters resets it, and the word typed again after the pause opens', async () => {
    let t = 5_000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const rig = mount();
    const typeAll = (letters: string): void => [...letters].forEach((ch) => (rig.type(ch), (t += 100)));
    typeAll(WORD.slice(0, 3));
    t += KEY_GAP_MS + 500;
    typeAll(WORD.slice(3));
    await flush();
    expect(rig.picked, 'the pause ended the match').toEqual([]);
    typeAll(WORD);
    await flush();
    expect(rig.picked).toEqual([TRAP]);
  });

  it('keeps the board working: a plain D moves right and a plain A moves left, but while the match is live the A belongs to the word and the cursor stays', async () => {
    const rig = mount();
    const start = rig.screen.snapshot()['selectedIndex'] as number;
    rig.type('d'); // alone, a D is just a step right (the first letter of the word: it starts a match)
    expect(rig.screen.snapshot()['selectedIndex']).toBe(start + 1);
    const live = rig.screen.snapshot()['selectedIndex'];
    rig.type(WORD[1]!); // ...and the A that follows, with the match live, belongs to the word
    expect(WORD[1]).toBe('a');
    expect(rig.screen.snapshot()['selectedIndex']).toBe(live);
    await flush();
    expect(rig.picked).toEqual([]);
    const lone = mount();
    lone.type('ArrowRight');
    const afterRight = lone.screen.snapshot()['selectedIndex'] as number;
    lone.type('a'); // a plain A, with no match live, moves left
    expect(lone.screen.snapshot()['selectedIndex']).toBe(afterRight - 1);
  });
});

describe('the six doors do not interfere', () => {
  it('each word opens its own chapter and nothing else', async () => {
    for (const row of CHAPTER_DOORS) {
      const rig = mount();
      rig.typeWord(row.word);
      await flush();
      expect(rig.picked, row.word).toEqual([row.chapter]);
      expect(rig.settled, row.word).toEqual([row.chapter]);
    }
  });

  it('the first word to finish wins when two are typed in a row, and a half-typed word before another spoils neither', async () => {
    for (const other of CHAPTER_DOORS.filter((d) => d.word !== WORD)) {
      const a = mount();
      a.typeWord(WORD + other.word);
      await flush();
      expect(a.picked, `${WORD}${other.word}`).toEqual([TRAP]);
      const b = mount();
      b.typeWord(other.word + WORD);
      await flush();
      expect(b.picked, `${other.word}${WORD}`).toEqual([other.chapter]);
      const c = mount();
      c.typeWord(other.word.slice(0, -1) + WORD);
      await flush();
      expect(c.picked, `${other.word.slice(0, -1)}${WORD}`).toEqual([TRAP]);
    }
  });
});

const keyDown = (key: string, init: KeyboardEventInit = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: codeOf(key), bubbles: true, ...init }));
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
  const press = async (key: string, code = codeOf(key)): Promise<void> => {
    keyDown(key);
    await flush();
    await step();
    window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
  };
  return { ...rig, prep: () => prep, step, press };
}

describe('the word opens party prep, and its last letter is not a press', () => {
  it('a key per letter and a frame after each: party prep is up for the chapter, holds through more frames, and Enter begins it', async () => {
    const flow = mountFlow();
    for (const ch of WORD) await flow.press(ch);
    expect([flow.picked, flow.settled]).toEqual([[TRAP], [TRAP]]);
    const prep = flow.prep();
    expect(prep, 'the flow mounted party prep').not.toBeNull();
    expect(prep!.snapshot()['chapter']).toBe(TRAP);
    for (let i = 0; i < 6; i++) await flow.step();
    expect(prep!.snapshot()['outcome'], 'party prep began the fight on the press that finished the word').toBeNull();
    await flow.press('Enter', 'Enter');
    expect(prep!.snapshot()['outcome']).toBe('begin');
  });

  it('every letter dispatched back to back, up and down before any frame: the same', async () => {
    const flow = mountFlow();
    for (const ch of WORD) keyDown(ch);
    for (const ch of WORD) keyUp(ch);
    await flush();
    for (let i = 0; i < 6; i++) await flow.step();
    expect(flow.settled).toEqual([TRAP]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });
});
