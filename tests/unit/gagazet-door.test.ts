// @vitest-environment jsdom
/**
 * The hidden door to the Biran and Yenke chapter (FFX only; branch `ch-biran-yenke`, 2026-10-14): the word `gagazet`, typed on chapter select, opens Kimahri's solo trial at the Mountain Gate
 * (hidden chapter 25, `biran-yenke`).
 *
 * Written against the Valefor, Fayth and Mushroom door suites: the real `Input`, real key events, the real board and title screen. It pins that
 *
 * 1. **the word is safe to type**: G and T are bound to nothing, A is `left`, E is `start`, and **Z is `confirm`**, the first door with a `confirm` letter: the board swallows the Z of a live match
 *    (`wordKey` consumes `confirm`), so it never opens the card the cursor stands on. The test types the word with a card selected and asserts that nothing but this chapter opens, and has the
 *    control that a plain Z does open the selected card (so the check can fail). The title answers `confirm` and `start`, so the word is typed on the board, never on the title;
 * 2. **the chapter is hidden by default** (asserted on its id, its EXP numeral and the tile count, never on the word);
 * 3. **the word opens it**, and only the word: the cursor stays, nothing is remembered or written; a wrong letter resets, and so does a pause over 2 s between letters;
 * 4. **the nine doors do not interfere** (eight on this branch alone; `angra`, the Angra Mainyu lane's, joins them in release candidate r49-rc), the chapter opens party prep, and the word overlaps no other door word in any position (the shared rule of `chapter-doors.test.ts`, run here too).
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
import { GAGAZET_DOOR_CHAPTER, GAGAZET_DOOR_WORD } from '../../src/app/screens/frontend/gagazetDoor.ts';
import { KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORD = GAGAZET_DOOR_WORD;
const CHAPTER = GAGAZET_DOOR_CHAPTER;

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function typeWord(door: WordDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

describe('the word (pure)', () => {
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to a hidden FFX experiment numbered 25', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(CHAPTER).toBe('biran-yenke');
    expect(getChapter(CHAPTER)).toMatchObject({ id: CHAPTER, game: 'ffx', experimental: true, number: 25 });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(CHAPTER);
    expect(CHAPTER_DOORS.find((d) => d.word === WORD)?.chapter).toBe(CHAPTER);
  });

  it('opens on the last letter only, in either case, and a wrong first letter typed again starts it over', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), `gag${WORD}`).at(-1)).toBe('open'); // a wrong "g" that is the first letter again starts it over
  });

  it('a wrong letter resets; a pause over the gap ends the match', () => {
    for (const typo of [WORD.slice(0, -1), 'gagazat', 'gagazit', 'gagzet', 'gagagzet', 'agazet', 'gagazez']) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
    const door = new WordDoor(WORD);
    typeWord(door, WORD.slice(0, 4), 0, 100);
    expect(typeWord(door, WORD.slice(4), 300 + KEY_GAP_MS + 1, 100)).not.toContain('open');
    const exact = new WordDoor(WORD);
    typeWord(exact, WORD.slice(0, 4), 0, 100);
    expect(typeWord(exact, WORD.slice(4), 300 + KEY_GAP_MS, 100).at(-1)).toBe('open'); // exactly the gap is in time
  });
});

describe('the word against every other door word', () => {
  const others = CHAPTER_DOORS.map((d) => d.word).filter((w) => w !== WORD);

  it('no word begins with, ends with or contains the other, and no end of one is the beginning of the other, in either order', () => {
    expect(others).toEqual(['limit', 'leblanc', 'experiment', 'mushroom', 'fayth', 'daigoro', 'valefor', 'angra', 'summon']); // `angra` is the Angra Mainyu lane's (FFX-2, hidden chapter 26), merged in release candidate r49-rc; `summon` is The Last Summoning's (FFX, hidden chapter 28)
    for (const other of others) {
      for (const [a, b] of [[WORD, other], [other, WORD]] as const) {
        expect(a.startsWith(b), `${a} begins ${b}`).toBe(false);
        expect(a.endsWith(b), `${a} ends with ${b}`).toBe(false);
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
        for (let k = 1; k <= Math.min(a.length, b.length); k++) expect(a.slice(-k) === b.slice(0, k), `the last ${k} of ${a} start ${b}`).toBe(false);
      }
    }
  });

  it('typed back to back with each other word in either order, each word finishes exactly once and the other never fires early', () => {
    for (const other of others) {
      for (const run of [WORD + other, other + WORD]) {
        const mine = new WordDoor(WORD);
        const theirs = new WordDoor(other);
        const fedMine = [...run].map((ch, i) => mine.feedKey(ch, i * 100));
        const fedTheirs = [...run].map((ch, i) => theirs.feedKey(ch, i * 100));
        expect(fedMine.filter((r) => r === 'open'), run).toHaveLength(1);
        expect(fedTheirs.filter((r) => r === 'open'), run).toHaveLength(1);
        expect(fedMine.indexOf('open'), run).toBe(run.indexOf(WORD) + WORD.length - 1);
        expect(fedTheirs.indexOf('open'), run).toBe(run.indexOf(other) + other.length - 1);
      }
    }
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
  it('G is bound to nothing, A is left, Z is CONFIRM, E is start, T is bound to nothing', () => {
    expect(buttonsFor('g')).toEqual([]);
    expect(buttonsFor('a')).toEqual(['left']);
    expect(buttonsFor('z')).toEqual(['confirm']);
    expect(buttonsFor('e')).toEqual(['start']);
    expect(buttonsFor('t')).toEqual([]);
    expect(new Set(WORD)).toEqual(new Set(['g', 'a', 'z', 'e', 't'])); // ...and that is every distinct letter of the word
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

  it('on the title screen only confirm and start begin the flow: of the word\'s letters the Z and the E are (so the word is typed on the board, never on the title)', () => {
    for (const letter of new Set(WORD)) expect(titleAdvancesOn(letter), `the title started on "${letter}"`).toBe(letter === 'e' || letter === 'z');
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
  it('the board holds the eighteen: no tile for the chapter, no EXP numeral, "of 18" unchanged', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(18);
    expect(new Set(tiles.map((t) => t.id))).toEqual(new Set(CHAPTERS.map((c) => c.id as string)));
    expect(tiles.some((t) => t.id === CHAPTER || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect(groupChapterTiles(tiles).map((g) => g.tiles.length)).toEqual([11, 7]);
    expect((CHAPTER_IDS as readonly string[]).includes(CHAPTER)).toBe(false);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(CHAPTER);
    const progress = boardProgress(tiles, 0);
    expect([progress.total, progress.pips.length]).toEqual([18, 18]);
  });

  it('the mounted board draws eighteen cards, none for the chapter, and counts "of 18 beaten"', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(18);
    expect(rig.root.querySelector(`[data-card="${CHAPTER}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/\bEXP\b/);
    expect(rig.root.textContent).toMatch(/of 18 beaten/);
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(CHAPTER);
  });
});

describe('the word opens it on chapter select, and its Z never opens the card under the cursor', () => {
  it('settles on the chapter on the last letter, without moving the cursor or remembering it, and writes nothing', async () => {
    const rig = mount();
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored();
    const selected = rig.screen.snapshot()['selectedIndex'];
    const cursor = vi.spyOn(audio, 'playSfx');
    for (const ch of WORD.slice(0, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(selected);
      expect(rig.picked, `after "${ch}"`).toEqual([]); // above all after the Z: confirm is swallowed
    }
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
    expect(rig.settled).toEqual([CHAPTER]);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    expect(lastBoardChapter()).toBeNull();
    expect(cursor.mock.calls.filter(([name]) => name === 'cursor-move' || name === 'confirm')).toEqual([]);
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(window.localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
    expect(stored(), 'the door wrote nothing, under any key').toEqual(before);
  });

  it('the control: a plain Z (not in a live match) DOES open the card the cursor stands on, so the swallowed Z above is a real check', async () => {
    const rig = mount();
    rig.type('ArrowRight'); // a card with the cursor on it
    const id = rig.screen.snapshot()['selectedId'] as string;
    rig.type('z');
    await flush();
    expect(rig.picked).toEqual([id]);
    expect(id).not.toBe(CHAPTER);
  });

  it('a Z typed right after the first letters of another word is just a confirm: only the live match swallows it', async () => {
    const rig = mount();
    rig.typeWord('gagaz'.slice(0, 2)); // "ga": the match is live
    rig.type('x'); // a wrong letter ends it
    rig.type('z'); // no live match: a plain confirm
    await flush();
    expect(rig.picked).toHaveLength(1);
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

  it("a wrong letter resets: every typo, half of each other door's word, an unrelated word", async () => {
    const others = CHAPTER_DOORS.filter((d) => d.word !== WORD).map((d) => d.word.slice(0, -1));
    for (const wrong of ['gagazat', 'gagzet', 'agazet', WORD.slice(0, -1), ...others, 'gazette']) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      // A stray Z outside a live match is a plain confirm, which opens a card: nothing may open THIS chapter, and a word that never reached its Z opens nothing at all.
      expect(rig.picked.includes(CHAPTER), wrong).toBe(false);
      if (!wrong.includes('z')) expect(rig.picked, wrong).toEqual([]);
    }
  });

  it('a pause over 2 s between letters resets it, and the word typed again after the pause opens', async () => {
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

  it('keeps the board working: a plain A moves the cursor left and a plain G, E or T does nothing, but while the match is live the A belongs to the word and the cursor stays', async () => {
    const rig = mount();
    rig.type('ArrowRight');
    const afterRight = rig.screen.snapshot()['selectedIndex'] as number;
    rig.type('a');
    expect(rig.screen.snapshot()['selectedIndex']).toBe(afterRight - 1);
    const rest = rig.screen.snapshot()['selectedIndex'];
    for (const ch of ['g', 'e', 't']) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `a plain "${ch}"`).toBe(rest);
    }
    rig.type('g'); // the G of the word, and the A after it
    const live = rig.screen.snapshot()['selectedIndex'];
    rig.type(WORD[1]!);
    expect(WORD[1]).toBe('a');
    expect(rig.screen.snapshot()['selectedIndex']).toBe(live);
    await flush();
    expect(rig.picked).toEqual([]);
  });
});

describe('the nine doors do not interfere', () => {
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
      expect(a.picked, `${WORD}${other.word}`).toEqual([CHAPTER]);
      const b = mount();
      b.typeWord(other.word + WORD);
      await flush();
      expect(b.picked, `${other.word}${WORD}`).toEqual([other.chapter]);
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
    expect([flow.picked, flow.settled]).toEqual([[CHAPTER], [CHAPTER]]);
    const prep = flow.prep();
    expect(prep, 'the flow mounted party prep').not.toBeNull();
    expect(prep!.snapshot()['chapter']).toBe(CHAPTER);
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
    expect(flow.settled).toEqual([CHAPTER]);
    expect(flow.picked).toEqual([CHAPTER]); // the Z latched confirm, and the board took it with the word: no other card opened
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the last letter held down through the opening frames does not start the fight either (T is bound to nothing)', async () => {
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
});
