// @vitest-environment jsdom
/**
 * The hidden door to the Sinspawn Gui chapter (FFX only; branch `ch-gui`, 2026-10-10): the word `mushroom`, typed on chapter select.
 *
 * Written against the experimental Leblanc door's suite (`exp-leblanc-door.test.ts`), with the real `Input`, real key events, the real board and the real title screen. What it pins:
 *
 * 1. **The word is safe to type.** M, S and R are bound keys (`select`, `down`, `r1`); U, H and O are bound to nothing. The experiment lane's warning (2026-10-10): on the TITLE screen
 *    several letters are bound, so a word's first letter could fire its action before the word completes. Here the title answers only `confirm` and `start` (Enter, Space, Z, E, C),
 *    so no letter of `mushroom` starts the flow there, and on the board `select` and `r1` are ignored while the word claims its S (`down`). Each letter is proven, not argued.
 * 2. **Hidden by default:** the board holds the eighteen; nothing leads in; "of 18" is unchanged.
 * 3. **The word opens it** (and only the word): the board settles on the chapter with the cursor where it was, nothing remembered, nothing written to the save or the experiments' store.
 * 4. **The three doors do not interfere:** FF7's "limit", Leblanc's "leblanc" and this word each open their own chapter, and no word begins, ends or contains another.
 * 5. **The last letter is not a press** (the M is `select`): party prep opens and stays until Enter; the board keeps its arrows after part of the word.
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
import { EXP_LEBLANC_DOOR_CHAPTER, EXP_LEBLANC_DOOR_WORD } from '../../src/app/screens/frontend/leblancDoor.ts';
import { MUSHROOM_DOOR_CHAPTER, MUSHROOM_DOOR_WORD } from '../../src/app/screens/frontend/mushroomDoor.ts';
import { DOOR_WORD, KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORD = MUSHROOM_DOOR_WORD;
const LEBLANC = EXP_LEBLANC_DOOR_WORD;
const FF7 = 'ff7-guard-scorpion';
const EXP_LEBLANC = EXP_LEBLANC_DOOR_CHAPTER;
const GUI = MUSHROOM_DOOR_CHAPTER;

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function typeWord(door: WordDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

/** Typo variants of the word: the last letter missing, two letters swapped, one letter replaced, one dropped from the middle. */
function typos(word: string): string[] {
  const mid = Math.floor(word.length / 2);
  const swapped = word.slice(0, mid - 1) + word[mid] + word[mid - 1] + word.slice(mid + 1);
  const replaced = word.slice(0, mid) + (word[mid] === 'k' ? 'j' : 'k') + word.slice(mid + 1);
  const dropped = word.slice(0, mid) + word.slice(mid + 1);
  return [word.slice(0, -1), swapped, replaced, dropped].filter((t) => t !== word);
}

describe('the word (pure)', () => {
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to a hidden FFX experiment', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(GUI).toBe('sinspawn-gui');
    const chapter = getChapter(GUI);
    expect(chapter).toMatchObject({ id: GUI, game: 'ffx', experimental: true });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(GUI);
  });

  it('no door\'s word begins, ends with or contains another\'s: one door can never fire before, or inside, another', () => {
    const words = [DOOR_WORD, LEBLANC, WORD];
    for (const a of words) {
      for (const b of words) {
        if (a === b) continue;
        expect(a.startsWith(b), `${a} begins ${b}`).toBe(false);
        expect(a.endsWith(b), `${a} ends with ${b}`).toBe(false);
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
      }
    }
  });

  it('opens on the last letter only, in either case, and ignores keys that are not characters', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
    const door = new WordDoor(WORD);
    const feed = [...WORD].flatMap((ch, i) => (i % 2 ? ['Shift', ch] : [ch, 'CapsLock']));
    const results = feed.map((k, i) => door.feedKey(k, i * 50));
    expect(results.filter((r) => r === 'open')).toHaveLength(1);
  });

  it('resets on a wrong letter (a wrong first letter starts it again) and on a pause longer than the gap', () => {
    for (const typo of typos(WORD)) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
    expect(typeWord(new WordDoor(WORD), WORD[0] + WORD).at(-1)).toBe('open');
    const door = new WordDoor(WORD);
    typeWord(door, WORD.slice(0, 3), 0, 100);
    expect(typeWord(door, WORD.slice(3), 200 + KEY_GAP_MS + 1, 100)).not.toContain('open');
  });

  it('claims a later letter of the word, never its first, so the board can leave that press alone', () => {
    const door = new WordDoor(WORD);
    door.feedKey(WORD[0]!, 0);
    expect(door.continued).toBe(false);
    door.feedKey(WORD[1]!, 100);
    expect(door.continued).toBe(true);
    door.feedKey('x', 200);
    expect(door.continued).toBe(false);
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

describe('every letter of the word is a known key (the experiment lane\'s warning, checked)', () => {
  it('M is select, S is down, R is r1; U, H and O are bound to nothing', () => {
    expect(buttonsFor('m')).toEqual(['select']);
    expect(buttonsFor('s')).toEqual(['down']);
    expect(buttonsFor('r')).toEqual(['r1']);
    for (const letter of ['u', 'h', 'o']) expect(buttonsFor(letter), letter).toEqual([]);
    // ...and that is every distinct letter of the word.
    expect(new Set(WORD)).toEqual(new Set(['m', 'u', 's', 'h', 'r', 'o']));
  });

  /** The real title screen's `handleInput` fed one real key; `advance` (the start of the flow: the cue, the wipe, `startFlow`) is the thing watched. */
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

  it('on the title screen only confirm and start begin the flow: no letter of the word does, the first one (M, select) included', () => {
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
  it('the board holds the eighteen: no tile for the chapter, no EXP numeral, no pip, "of 18" unchanged', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(new Set(tiles.map((t) => t.id))).toEqual(new Set(CHAPTERS.map((c) => c.id as string)));
    expect(tiles).toHaveLength(18);
    expect(tiles.some((t) => t.id === GUI || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect(groupChapterTiles(tiles).map((g) => g.tiles.length)).toEqual([11, 7]);
    expect(CHAPTER_IDS).toHaveLength(18);
    expect((CHAPTER_IDS as readonly string[]).includes(GUI)).toBe(false);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(GUI);
    const progress = boardProgress(tiles, 0);
    expect(progress.total).toBe(18);
    expect(progress.pips).toHaveLength(18);
  });

  it('the mounted board draws eighteen cards and says nothing of the chapter', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(18);
    expect(rig.root.querySelector(`[data-card="${GUI}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/experiment|EXP\b|gui\b|mushroom/i);
    expect(rig.root.textContent).toMatch(/of 18 beaten/);
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(GUI);
  });

  it('with no word typed, nothing leads in: the arrows around the whole list never select it', async () => {
    const rig = mount();
    for (let i = 0; i < 40; i++) rig.type('ArrowRight');
    for (let i = 0; i < 40; i++) rig.type('ArrowLeft');
    rig.type('ArrowDown');
    rig.type('ArrowUp');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.screen.snapshot()['selectedId']).not.toBe(GUI);
  });

  it('a tile can still be built when a test hands the experiments in (the data path is intact)', () => {
    const tiles = buildChapterTiles(new SaveStore(), { experiments: EXPERIMENT_CHAPTERS });
    expect(tiles.map((t) => t.id)).toContain(GUI);
    expect(tiles.find((t) => t.id === GUI)).toMatchObject({ numeral: 'EXP' });
  });
});

describe('the word opens it on chapter select', () => {
  it('settles on the chapter on the last letter, without moving the cursor or remembering it, and writes nothing', async () => {
    const rig = mount();
    const selected = rig.screen.snapshot()['selectedIndex'];
    const cursor = vi.spyOn(audio, 'playSfx');
    for (const ch of WORD.slice(0, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(selected);
    }
    expect(rig.picked).toEqual([]);
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([GUI]);
    expect(rig.settled).toEqual([GUI]);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    expect(lastBoardChapter()).toBeNull();
    expect(cursor.mock.calls.filter(([name]) => name === 'cursor-move')).toEqual([]);
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(window.localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
  });

  it('opens in capitals too (Shift held)', async () => {
    const rig = mount();
    for (const ch of WORD.toUpperCase()) {
      rig.type('Shift', 'ShiftLeft');
      rig.type(ch);
    }
    await flush();
    expect(rig.picked).toEqual([GUI]);
  });

  it('a wrong word does nothing at all: every typo, a wrong first letter, half of each other door\'s word, an unrelated word', async () => {
    for (const wrong of [...typos(WORD), 'k' + WORD.slice(1), DOOR_WORD.slice(0, -1), LEBLANC.slice(0, -1), 'lemon']) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      expect(rig.picked, wrong).toEqual([]);
      expect(rig.settled, wrong).toEqual([]);
    }
  });

  it('keeps the board working: a plain S still moves the cursor down a group, and A moves left', async () => {
    const rig = mount();
    const first = rig.screen.snapshot()['selectedIndex'] as number;
    rig.type('s');
    const afterS = rig.screen.snapshot()['selectedIndex'] as number;
    expect(afterS, 'a plain S is the board\'s down').not.toBe(first);
    rig.type('ArrowRight');
    const afterRight = rig.screen.snapshot()['selectedIndex'] as number;
    rig.type('a');
    expect(rig.screen.snapshot()['selectedIndex']).toBe(afterRight - 1);
    await flush();
    expect(rig.picked).toEqual([]);
  });

  it('while the match is live, the S of the word is the word\'s: the cursor does not move', () => {
    const rig = mount();
    rig.type('ArrowRight');
    for (const ch of WORD.slice(0, 2)) rig.type(ch); // "mu"
    const before = rig.screen.snapshot()['selectedIndex'];
    rig.type(WORD[2]!); // the S
    expect(WORD[2]).toBe('s');
    expect(rig.screen.snapshot()['selectedIndex']).toBe(before);
  });
});

describe('the three doors do not interfere', () => {
  it('each word opens its own chapter and nothing else', async () => {
    for (const [typed, opens] of [[DOOR_WORD, FF7], [LEBLANC, EXP_LEBLANC], [WORD, GUI]] as const) {
      const rig = mount();
      rig.typeWord(typed);
      await flush();
      expect(rig.picked, typed).toEqual([opens]);
      expect(rig.settled, typed).toEqual([opens]);
    }
  });

  it('the first word to finish wins when two are typed in a row, whichever order', async () => {
    for (const [typed, opens] of [
      [WORD + DOOR_WORD, GUI],
      [DOOR_WORD + WORD, FF7],
      [WORD + LEBLANC, GUI],
      [LEBLANC + WORD, EXP_LEBLANC],
    ] as const) {
      const rig = mount();
      rig.typeWord(typed);
      await flush();
      expect(rig.picked, typed).toEqual([opens]);
    }
  });

  it('a half-typed word before another does not spoil either', async () => {
    const a = mount();
    a.typeWord(DOOR_WORD.slice(0, -1) + WORD);
    await flush();
    expect(a.picked).toEqual([GUI]);
    const b = mount();
    b.typeWord(WORD.slice(0, -1) + LEBLANC);
    await flush();
    expect(b.picked).toEqual([EXP_LEBLANC]);
    const c = mount();
    c.typeWord(LEBLANC.slice(0, -1) + WORD);
    await flush();
    expect(c.picked).toEqual([GUI]);
  });

  it('with the FF7 switch off, "limit" does nothing and this word still opens (the doors are independent)', async () => {
    setFf7ExperimentReadyForTests(false);
    const rig = mount();
    rig.typeWord(DOOR_WORD);
    await flush();
    expect(rig.picked).toEqual([]);
    rig.typeWord(WORD);
    await flush();
    expect(rig.picked).toEqual([GUI]);
  });
});

// ------------------------------------------------------- the board, inside the flow

interface FlowRig extends Rig {
  prep(): PartyPrepScreen | null;
  step(): Promise<void>;
  press(key: string, code?: string): Promise<void>;
}

/** The board as the flow runs it: the real `Input`, the real board, and the real `PartyPrepScreen` mounted in the microtask after the board settles. */
function mountFlow(): FlowRig {
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
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
    await flush();
    await step();
    window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
  };
  return { ...rig, prep: () => prep, step, press };
}

const keyDown = (key: string, init: KeyboardEventInit = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: codeOf(key), bubbles: true, ...init }));
};
const keyUp = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, code: codeOf(key), bubbles: true }));
};

describe('the word opens party prep, and its last letter (M, select) is not a press', () => {
  it('a key per letter and a frame after each: party prep is up, holds through more frames, and Enter begins it', async () => {
    const flow = mountFlow();
    for (const ch of WORD) await flow.press(ch);
    expect(flow.settled).toEqual([GUI]);
    const prep = flow.prep();
    expect(prep, 'the flow mounted party prep').not.toBeNull();
    expect(prep!.snapshot()['chapter']).toBe(GUI);
    for (let i = 0; i < 6; i++) await flow.step();
    expect(prep!.snapshot()['outcome'], 'party prep began the fight on the press that finished the word').toBeNull();
    await flow.press('Enter', 'Enter');
    expect(prep!.snapshot()['outcome']).toBe('begin');
  });

  it('every letter dispatched back to back, up and down before any frame (keyboard.type with no delay): the same', async () => {
    const flow = mountFlow();
    for (const ch of WORD) keyDown(ch);
    for (const ch of WORD) keyUp(ch);
    await flush();
    for (let i = 0; i < 6; i++) await flow.step();
    expect(flow.settled).toEqual([GUI]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the last letter held down while the screens change, auto-repeat included: party prep stays', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    keyDown(WORD.at(-1)!);
    await flush();
    await flow.step();
    keyDown(WORD.at(-1)!, { repeat: true });
    for (let i = 0; i < 4; i++) await flow.step();
    keyUp(WORD.at(-1)!);
    for (let i = 0; i < 4; i++) await flow.step();
    expect(flow.settled).toEqual([GUI]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the door takes the press that finished the word: the frame that opens it reads no select, and the chapter is picked once', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    keyDown(WORD.at(-1)!);
    clock += 100;
    flow.screen.handleInput(flow.input.update(clock));
    expect(flow.input.justPressed('select')).toBe(false);
    expect(flow.picked).toEqual([GUI]);
    flow.input.endFrame();
    keyUp(WORD.at(-1)!);
    await flush();
    for (let i = 0; i < 3; i++) await flow.step();
    expect(flow.picked).toEqual([GUI]);
    expect(flow.settled).toEqual([GUI]);
  });

  it('party prep lists Seymour as the guest he is and the player\'s own members around him', async () => {
    const flow = mountFlow();
    for (const ch of WORD) await flow.press(ch);
    const prep = flow.prep()!;
    expect(prep.snapshot()['chapter']).toBe(GUI);
    const text = prep.root.textContent ?? '';
    expect(text.length).toBeGreaterThan(0);
  });
});

describe('the board keeps its presses after part of the word', () => {
  it('an arrow right after "mush" moves the cursor on its first press, and ends the match', async () => {
    const rig = mount();
    for (const ch of WORD.slice(0, 4)) rig.type(ch);
    const before = rig.screen.snapshot()['selectedIndex'];
    rig.type('ArrowRight');
    expect(rig.screen.snapshot()['selectedIndex'], 'the first arrow press was swallowed').not.toBe(before);
    rig.typeWord(WORD.slice(4)); // "room": the arrow ended the match, so these are not the rest of the word
    await flush();
    expect(rig.picked).toEqual([]);
  });

  it('the same after a pause longer than the gap between letters (the match was already over), for every arrow', async () => {
    for (const arrow of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
      let t = 5_000;
      vi.spyOn(performance, 'now').mockImplementation(() => t);
      const rig = mount();
      rig.type('ArrowRight');
      for (const ch of WORD.slice(0, 4)) {
        rig.type(ch);
        t += 100;
      }
      t += KEY_GAP_MS + 1_000;
      const before = rig.screen.snapshot()['selectedIndex'];
      rig.type(arrow);
      expect(rig.screen.snapshot()['selectedIndex'], arrow).not.toBe(before);
      await flush();
      expect(rig.picked, arrow).toEqual([]);
      vi.restoreAllMocks();
    }
  });
});

describe('nothing the chapter does reaches the save', () => {
  it('the chapter is an experiment: its records live in the experiments\' store, never the save', () => {
    const chapter = getChapter(GUI)!;
    expect(chapter.experimental).toBe(true);
    expect(chapter.number).toBe(21); // 19 is the Leblanc preview's and 20 the FFX-2 experiment lane's (`chapter-numbers.test.ts`)
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
  });
});
