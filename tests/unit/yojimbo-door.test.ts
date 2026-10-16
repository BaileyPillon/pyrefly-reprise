// @vitest-environment jsdom
/**
 * The door to the Mirror Aeons chapter (FFX only; branch `ch-mirror-aeons`, 2026-10-15): the word `yojimbo`, typed on chapter select, opens the Dark Magus Sisters and Dark Yojimbo against Yuna's own
 * Sisters and Yojimbo (chapter 27, `mirror-aeons`). **The chapter was built hidden and is now LISTED (Bailey, 2026-10-15: "It needs to go live over night and not be hidden"): it has a card, and the word still opens it.**
 *
 * Written against the Gagazet, Angra, Valefor and Mushroom door suites: the real `Input`, real key events, the real board and title screen. It pins that
 *
 * 1. **the word is safe to type**: Y, O, J, I and B are bound to nothing and M is `select`, which the board ignores and a live match claims. There is **no `confirm` letter**, and that is the point of the word: the brief's
 *    `zanmato` starts with Z, a first letter is never claimed from the board, and a first-letter confirm would open the card under the cursor. The test has that control (a plain Z does open the selected card, and a
 *    first Z is not claimed), so the rejection is a fact and not a taste. The title answers `confirm` and `start` only;
 * 2. **the chapter is listed** (a card, the numeral XXVII, last of the FFX group, "of 19"; asserted on its id, its numeral and the tile count, never on the word);
 * 3. **the word opens it**, and only the word: the cursor stays, nothing is remembered or written; a wrong letter resets, and so does a pause over 2 s between letters;
 * 4. **the ten doors do not interfere**, the chapter opens party prep, and the word overlaps no other door word in any position (the shared rule of `chapter-doors.test.ts`, run here too).
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
import { YOJIMBO_DOOR_CHAPTER, YOJIMBO_DOOR_WORD } from '../../src/app/screens/frontend/yojimboDoor.ts';
import { KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORD = YOJIMBO_DOOR_WORD;
const CHAPTER = YOJIMBO_DOOR_CHAPTER;

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function typeWord(door: WordDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

describe('the word (pure)', () => {
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to the listed FFX chapter numbered 27', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(CHAPTER).toBe('mirror-aeons');
    expect(getChapter(CHAPTER)).toMatchObject({ id: CHAPTER, game: 'ffx', number: 27 });
    expect(getChapter(CHAPTER)?.experimental, 'a listed chapter is no experiment').toBeUndefined();
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).not.toContain(CHAPTER); // listed on 2026-10-15: no longer an experiment
    expect(CHAPTER_DOORS.find((d) => d.word === WORD)?.chapter).toBe(CHAPTER);
  });

  it('opens on the last letter only, in either case, and a wrong first letter typed again starts it over', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), `yo${WORD}`).at(-1)).toBe('open'); // "yo" then the word again: the first letter restarts it
  });

  it('a wrong letter resets; a pause over the gap ends the match', () => {
    for (const typo of [WORD.slice(0, -1), 'yojimbi', 'yojimo', 'yojmbo', 'yojimmbo', 'ojimbo', 'yojimbq']) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
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
    expect(others).toEqual(['limit', 'leblanc', 'experiment', 'mushroom', 'fayth', 'daigoro', 'valefor', 'gagazet', 'angra']);
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

  it('the rejected word: `zanmato` would break the shared rule that a first letter is never claimed (its Z is confirm)', () => {
    const zanmato = new WordDoor('zanmato');
    const fed = [...'zanmato'].map((ch, i) => zanmato.feedKey(ch, i * 100));
    expect(fed.at(-1)).toBe('open'); // as a pure matcher it works...
    expect(zanmato.continued).toBe(true);
    const fresh = new WordDoor('zanmato');
    fresh.feedKey('z', 0);
    // ...but the first letter is the one the door cannot claim: the matcher reports no claim for it on a fresh visit
    expect(new WordDoor('zanmato').continued).toBeFalsy();
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
  it('Y, O, J, I and B are bound to nothing, M is select; Z, the brief\'s rejected first letter, is CONFIRM', () => {
    for (const k of ['y', 'o', 'j', 'i', 'b']) expect(buttonsFor(k), k).toEqual([]);
    expect(buttonsFor('m')).toEqual(['select']);
    expect(buttonsFor('z')).toEqual(['confirm']); // the control for the word's rule: zanmato starts with this
    expect(new Set(WORD)).toEqual(new Set(['y', 'o', 'j', 'i', 'm', 'b'])); // ...and that is every distinct letter of the word
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

  it('on the title screen none of the word\'s letters begins the flow (only confirm and start do)', () => {
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

describe('listed on the board', () => {
  it('the board holds the nineteen: a card for the chapter, numbered XXVII, last of the FFX group, "of 19"', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(19);
    expect(new Set(tiles.map((t) => t.id))).toEqual(new Set(CHAPTERS.map((c) => c.id as string)));
    const tile = tiles.find((t) => t.id === CHAPTER)!;
    expect([tile.numeral, tile.game, tile.playable, tile.cleared]).toEqual(['XXVII', 'ffx', true, false]);
    expect(tiles.some((t) => t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    const groups = groupChapterTiles(tiles);
    expect(groups.map((g) => g.tiles.length)).toEqual([12, 7]);
    expect(groups[0]!.tiles[groups[0]!.tiles.length - 1]!.id, 'the FFX group ends with the chapter').toBe(CHAPTER);
    expect((CHAPTER_IDS as readonly string[]).includes(CHAPTER)).toBe(true);
    expect(CHAPTERS.map((c) => c.id as string)).toContain(CHAPTER);
    const progress = boardProgress(tiles, 0);
    expect([progress.total, progress.pips.length]).toEqual([19, 19]);
  });

  it('the mounted board draws nineteen cards, one for the chapter, with no EXP mark, and counts "of 19 beaten"', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(19);
    expect(rig.root.querySelector(`[data-card="${CHAPTER}"]`)).not.toBeNull();
    expect(rig.root.textContent).not.toMatch(/\bEXP\b/);
    expect(rig.root.textContent).toMatch(/of 19 beaten/);
    expect(rig.screen.snapshot()['order'] as string[]).toContain(CHAPTER);
  });
});

describe('the word opens it on chapter select, and nothing else opens or moves', () => {
  it('settles on the chapter on the last letter, without moving the cursor or remembering it, and writes nothing', async () => {
    const rig = mount();
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored();
    const selected = rig.screen.snapshot()['selectedIndex'];
    const cursor = vi.spyOn(audio, 'playSfx');
    for (const ch of WORD.slice(0, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(selected);
      expect(rig.picked, `after "${ch}"`).toEqual([]);
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

  it('the control that rejects `zanmato`: a plain Z DOES open the card the cursor stands on, and typed as the first letter of a word it still does', async () => {
    const rig = mount();
    rig.type('ArrowRight');
    const id = rig.screen.snapshot()['selectedId'] as string;
    rig.type('z'); // the first letter of "zanmato": not a claimed letter, so a plain confirm
    await flush();
    expect(rig.picked).toEqual([id]);
    expect(id).not.toBe(CHAPTER);
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
    for (const wrong of ['yojimbi', 'yojmbo', 'ojimbo', WORD.slice(0, -1), ...others, 'yoga']) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      // A stray Z outside a live match is a plain confirm, which opens a card: nothing may open THIS chapter.
      expect(rig.picked.includes(CHAPTER), wrong).toBe(false);
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

  it('keeps the board working: a plain Y, O, J, I, B or M does nothing, and while the match is live the M belongs to the word', async () => {
    const rig = mount();
    rig.type('ArrowRight');
    const rest = rig.screen.snapshot()['selectedIndex'];
    for (const ch of ['y', 'o', 'j', 'i', 'b', 'm']) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `a plain "${ch}"`).toBe(rest);
    }
    await flush();
    expect(rig.picked).toEqual([]);
  });
});

describe('the ten doors do not interfere', () => {
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
    expect(flow.picked).toEqual([CHAPTER]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the last letter held down through the opening frames does not start the fight either (O is bound to nothing)', async () => {
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
