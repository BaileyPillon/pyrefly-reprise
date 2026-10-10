// @vitest-environment jsdom
/**
 * The hidden door to the Experiment chapter (FFX-2 only; branch `ch-experiment`).
 *
 * Bailey, 2026-10-10: "I'll add in those 2 chapter recommendations"; "i want those chapters added in over night while im sleep". The driver's reading, recorded as his
 * delegation: the chapter ships HIDDEN behind a typed word, the way the Leblanc preview does (`tests/unit/exp-leblanc-door.test.ts`, whose method this follows with the
 * real `Input`, real key events and the real board). What this pins:
 *
 * 1. **The word is one constant** and stays clear of the other two doors' words: neither may begin the other (the shorter door would fire first).
 * 2. **Hidden by default**: the board holds the eighteen and nothing else, no EXP card, no word on screen, "of 18" unchanged.
 * 3. **The word opens it** (and only the word): the board settles on the chapter, the cursor stays put, nothing is remembered, nothing is written.
 * 4. **The hazard of this word.** Four of its letters are buttons (`app/Input.ts`): E is START, X is CANCEL, R is R1, M is SELECT. The board answers CANCEL (it leaves for the
 *    title): the X typed second must never reach it. A stray X, outside the word, still cancels. START (the first E, and two more) must not begin anything, and the press
 *    that finishes the word (the T, bound to nothing) must leave party prep standing until Enter.
 * 5. **The three doors do not interfere** ("limit" is FF7's, "leblanc" the Leblanc preview's, this one's own), in either order and with typos between them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { PartyPrepScreen } from '../../src/app/screens/PartyPrepScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { buildChapterTiles, groupChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { EXP_LEBLANC_DOOR_WORD } from '../../src/app/screens/frontend/leblancDoor.ts';
import { EXPERIMENT_DOOR_CHAPTER, EXPERIMENT_DOOR_WORD } from '../../src/app/screens/frontend/experimentDoor.ts';
import { DOOR_WORD, KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORD = EXPERIMENT_DOOR_WORD;
const LEBLANC = EXP_LEBLANC_DOOR_WORD;
/** The third hidden word, the Sinspawn Gui chapter's (FFX, branch `ch-gui`; its constant is not on this branch, so the literal is pinned here): no word may begin with, end with or contain another. */
const MUSHROOM = 'mushroom';
const FF7 = 'ff7-guard-scorpion';
const EXP = 'ffx2-masterpiece-theatre';
const LEBLANC_CHAPTER = 'exp-leblanc';

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
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to the Experiment', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(EXPERIMENT_DOOR_CHAPTER).toBe(EXP);
    expect(getChapter(EXP)?.experimental).toBe(true);
  });

  it("stays clear of the other doors' words: neither begins the other or contains it", () => {
    for (const other of [DOOR_WORD, LEBLANC, MUSHROOM]) {
      expect(WORD.startsWith(other), other).toBe(false);
      expect(other.startsWith(WORD), other).toBe(false);
      expect(WORD.endsWith(other), other).toBe(false);
      expect(other.endsWith(WORD), other).toBe(false);
      expect(WORD.includes(other) || other.includes(WORD), other).toBe(false);
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
    expect(results.indexOf('open')).toBe(feed.lastIndexOf(WORD.at(-1)!));
  });

  it('resets on a wrong letter (a wrong first letter starts it again) and on a pause longer than the gap', () => {
    for (const typo of typos(WORD)) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
    expect(typeWord(new WordDoor(WORD), 'k' + WORD).at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD[0] + WORD).at(-1), 'a wrong letter that is the first starts it again: "eexperiment"').toBe('open');
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
    door.feedKey('k', 200);
    expect(door.continued).toBe(false);
  });

  it('claims nothing that is not a letter, however fresh the match: an arrow stays the board\'s', () => {
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'Enter', 'Escape', 'Tab', 'Shift', 'CapsLock']) {
      const door = new WordDoor(WORD);
      typeWord(door, WORD.slice(0, 4));
      expect(door.continued, `${key}: after a letter`).toBe(true);
      door.feedKey(key, 450);
      expect(door.continued, key).toBe(false);
    }
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
let clock = 0;

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key);

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
  it('the board holds the eighteen: no experiment tile, no EXP numeral, "of 18" unchanged', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(new Set(tiles.map((t) => t.id))).toEqual(new Set(CHAPTERS.map((c) => c.id as string)));
    expect(tiles).toHaveLength(18);
    expect(tiles.some((t) => t.id === EXP || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect(groupChapterTiles(tiles).map((g) => g.tiles.length)).toEqual([11, 7]);
    const progress = boardProgress(tiles, 0);
    expect(progress.total).toBe(18);
    expect(progress.pips).toHaveLength(18);
  });

  it('the Experiment is registered beside the Leblanc preview, outside CHAPTERS and found by getChapter', () => {
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toEqual(expect.arrayContaining([LEBLANC_CHAPTER, EXP])); // beside the other hidden experiments: each is its own suite's
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(EXP);
    expect(getChapter(EXP)).toBe(EXPERIMENT_CHAPTERS.find((c) => c.id === EXP));
    expect(getChapter(EXP)).toMatchObject({ game: 'ffx2', experimental: true });
  });

  it('the mounted board draws eighteen cards and says nothing of the Experiment', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(18);
    expect(rig.root.querySelector(`[data-card="${EXP}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/experiment|EXP\b/i);
    expect(rig.root.textContent).toMatch(/of 18 beaten/);
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(EXP);
  });

  it('with no word typed, nothing leads in: the arrows around the whole list never select it', async () => {
    const rig = mount();
    for (let i = 0; i < 40; i++) rig.type('ArrowRight');
    for (let i = 0; i < 40; i++) rig.type('ArrowLeft');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.screen.snapshot()['selectedId']).not.toBe(EXP);
  });

  it('a card can still be built when a test hands the experiments in (the data path is intact)', () => {
    const tiles = buildChapterTiles(new SaveStore(), { experiments: EXPERIMENT_CHAPTERS.filter((c) => c.id === EXP) });
    expect(tiles).toHaveLength(19);
    expect(tiles.at(-1)).toMatchObject({ id: EXP, numeral: 'EXP' });
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
    expect(rig.settled, 'the board is still up before the last letter (the X is not a CANCEL)').toEqual([]);
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([EXP]);
    expect(rig.settled).toEqual([EXP]);
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
    expect(rig.picked).toEqual([EXP]);
  });

  it('a wrong word does nothing at all: every typo of it, a wrong first letter, half of another door\'s word, an unrelated word', async () => {
    for (const wrong of [...typos(WORD), 'k' + WORD.slice(1), DOOR_WORD.slice(0, -1), LEBLANC.slice(0, -1), 'excellent']) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      expect(rig.picked, wrong).toEqual([]);
    }
  });

  it('keeps the board working: a plain A still moves the cursor left, and the arrows still answer', async () => {
    const rig = mount();
    rig.type('ArrowRight');
    const afterRight = rig.screen.snapshot()['selectedIndex'];
    rig.type('a');
    expect(rig.screen.snapshot()['selectedIndex']).toBe((afterRight as number) - 1);
    await flush();
    expect(rig.picked).toEqual([]);
  });
});

describe('the keys of the word are buttons (E START, X CANCEL, R R1, M SELECT)', () => {
  it('the letters really are bound, so the tests below prove something', () => {
    const rig = mount();
    for (const [letter, button] of [['e', 'start'], ['x', 'cancel'], ['r', 'r1'], ['m', 'select']] as const) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: letter, code: codeOf(letter), bubbles: true }));
      expect(rig.input.justPressed(button), `${letter} is ${button}`).toBe(true);
      window.dispatchEvent(new KeyboardEvent('keyup', { key: letter, code: codeOf(letter), bubbles: true }));
      rig.input.endFrame();
    }
    expect(WORD.at(-1), 'the last letter is bound to nothing: no press is left for party prep').toBe('t');
    for (const button of ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle', 'start', 'select', 'r1', 'l1'] as const) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', code: 'KeyT', bubbles: true }));
      expect(rig.input.justPressed(button), `t is not ${button}`).toBe(false);
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 't', code: 'KeyT', bubbles: true }));
      rig.input.endFrame();
    }
  });

  it('the X typed second is the word\'s: the board is not left, whatever the typing style', async () => {
    const rig = mount();
    rig.type('e');
    rig.type('x');
    await flush();
    expect(rig.settled, 'CANCEL left the board (the title)').toEqual([]);
    expect(rig.picked).toEqual([]);
    rig.typeWord(WORD.slice(2));
    await flush();
    expect(rig.picked).toEqual([EXP]);
  });

  it('every letter dispatched back to back, up and down before any frame (keyboard.type with no delay): the board is not left and the word opens', async () => {
    const rig = mount();
    for (const ch of WORD) window.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: codeOf(ch), bubbles: true }));
    for (const ch of WORD) window.dispatchEvent(new KeyboardEvent('keyup', { key: ch, code: codeOf(ch), bubbles: true }));
    rig.frame();
    rig.frame();
    await flush();
    expect(rig.picked).toEqual([EXP]);
    expect(rig.settled).toEqual([EXP]);
  });

  it('a stray X, outside the word, is still the board\'s CANCEL', async () => {
    const rig = mount();
    rig.type('x');
    await flush();
    expect(rig.settled, 'a lone X leaves the board as it always did').toEqual(['null']);
  });

  it('an X after a wrong letter is the board\'s again: the word was over', async () => {
    const rig = mount();
    rig.type('e');
    rig.type('k'); // the typo ends the match
    rig.type('x');
    await flush();
    expect(rig.settled).toEqual(['null']);
    expect(rig.picked).toEqual([]);
  });

  it('START, R1 and SELECT inside the word begin and move nothing: the cursor stays and no chapter is picked before the last letter', async () => {
    const rig = mount();
    const selected = rig.screen.snapshot()['selectedIndex'];
    for (const ch of WORD.slice(0, -1)) rig.type(ch);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    expect(rig.picked).toEqual([]);
    await flush();
    expect(rig.settled).toEqual([]);
  });
});

describe('the three doors do not interfere', () => {
  it('"limit" still opens the FF7 experiment, "leblanc" the Leblanc preview, and the word this chapter, each alone', async () => {
    for (const [word, opens] of [[DOOR_WORD, FF7], [LEBLANC, LEBLANC_CHAPTER], [WORD, EXP]] as const) {
      const rig = mount();
      rig.typeWord(word);
      await flush();
      expect(rig.picked, word).toEqual([opens]);
      expect(rig.settled, word).toEqual([opens]);
    }
  });

  it('two words in a row: the first to finish opens, and the board is done', async () => {
    for (const [first, second, opens] of [
      [WORD, DOOR_WORD, EXP],
      [DOOR_WORD, WORD, FF7],
      [WORD, LEBLANC, EXP],
      [LEBLANC, WORD, LEBLANC_CHAPTER],
    ] as const) {
      const rig = mount();
      rig.typeWord(first + second);
      await flush();
      expect(rig.picked, `${first}${second}`).toEqual([opens]);
    }
  });

  it('a half-typed word before another does not spoil either', async () => {
    const pairs: ReadonlyArray<readonly [string, string, string]> = [
      [WORD, LEBLANC, LEBLANC_CHAPTER],
      [LEBLANC, WORD, EXP],
      [WORD, DOOR_WORD, FF7],
      [DOOR_WORD, WORD, EXP],
    ];
    for (const [half, whole, opens] of pairs) {
      const rig = mount();
      rig.typeWord(half.slice(0, -1) + whole);
      await flush();
      expect(rig.picked, `${half.slice(0, -1)}|${whole}`).toEqual([opens]);
    }
  });

  it('with the FF7 switch off, "limit" does nothing and the Experiment word still opens (the doors are independent)', async () => {
    setFf7ExperimentReadyForTests(false);
    const rig = mount();
    rig.typeWord(DOOR_WORD);
    await flush();
    expect(rig.picked).toEqual([]);
    rig.typeWord(WORD);
    await flush();
    expect(rig.picked).toEqual([EXP]);
  });

  it("FF7's pad sequence on a keyboard (F R F R M) opens FF7 alone, though R and M are in this word", async () => {
    const pad = mount();
    for (const ch of 'frfrm') pad.type(ch);
    await flush();
    expect(pad.picked).toEqual([FF7]);
  });
});

// ------------------------------------------------------- the board, inside the flow

interface FlowRig extends Rig {
  prep(): PartyPrepScreen | null;
  step(): Promise<void>;
  press(key: string, code?: string): Promise<void>;
}

/**
 * The board as the flow runs it: the real `Input`, the real board, and when the board settles on a chapter the real `PartyPrepScreen` mounted in the microtask after, as
 * `main.ts` -> `runChapter` -> `show(prep)` does it; every frame goes to whichever screen is on top.
 */
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

describe('the word opens party prep, and nothing the word leaves behind begins the fight', () => {
  it('a key per letter and a frame after each: party prep is up for the Experiment, holds through more frames, and Enter begins it', async () => {
    const flow = mountFlow();
    for (const ch of WORD) await flow.press(ch);
    expect(flow.settled).toEqual([EXP]);
    const prep = flow.prep();
    expect(prep, 'the flow mounted party prep').not.toBeNull();
    expect(prep!.snapshot()['chapter']).toBe(EXP);
    for (let i = 0; i < 6; i++) await flow.step();
    expect(prep!.snapshot()['outcome'], 'party prep began the fight on a press the word left behind').toBeNull();
    await flow.press('Enter', 'Enter');
    expect(prep!.snapshot()['outcome']).toBe('begin');
  });

  it('every letter dispatched back to back, up and down before any frame: party prep is up and stays', async () => {
    const flow = mountFlow();
    for (const ch of WORD) window.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: codeOf(ch), bubbles: true }));
    for (const ch of WORD) window.dispatchEvent(new KeyboardEvent('keyup', { key: ch, code: codeOf(ch), bubbles: true }));
    await flush();
    for (let i = 0; i < 6; i++) await flow.step();
    expect(flow.settled).toEqual([EXP]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the last letter held down while the screens change, auto-repeat included: party prep stays', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    const last = WORD.at(-1)!;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: last, code: codeOf(last), bubbles: true }));
    await flush();
    await flow.step();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: last, code: codeOf(last), bubbles: true, repeat: true }));
    for (let i = 0; i < 4; i++) await flow.step();
    window.dispatchEvent(new KeyboardEvent('keyup', { key: last, code: codeOf(last), bubbles: true }));
    for (let i = 0; i < 4; i++) await flow.step();
    expect(flow.settled).toEqual([EXP]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the door takes the press that finished the word: the frame that opens it reads nothing, and the chapter is picked once', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', code: 'KeyT', bubbles: true }));
    clock += 100;
    flow.screen.handleInput(flow.input.update(clock));
    expect(flow.picked).toEqual([EXP]);
    flow.input.endFrame();
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 't', code: 'KeyT', bubbles: true }));
    await flush();
    for (let i = 0; i < 3; i++) await flow.step();
    expect(flow.picked).toEqual([EXP]);
    expect(flow.settled).toEqual([EXP]);
  });
});

describe('the board keeps its presses after part of the word', () => {
  it('an arrow right after "expe" moves the cursor on its first press and ends the match', async () => {
    const rig = mount();
    for (const ch of WORD.slice(0, 4)) rig.type(ch);
    const before = rig.screen.snapshot()['selectedIndex'];
    rig.type('ArrowRight');
    expect(rig.screen.snapshot()['selectedIndex'], 'the first arrow press was swallowed').not.toBe(before);
    rig.typeWord(WORD.slice(4)); // "riment": the arrow ended the match, so these are not the rest of the word
    await flush();
    expect(rig.picked).toEqual([]);
  });

  it('a mid-word typo ends the match: the letters after it are the board\'s again, and the word does not open', async () => {
    const rig = mount();
    for (const ch of 'expk') rig.type(ch); // k: wrong, and bound to nothing
    rig.typeWord('eriment');
    await flush();
    expect(rig.picked).toEqual([]);
    rig.typeWord(WORD); // and the word, typed whole after the typo, still opens
    await flush();
    expect(rig.picked).toEqual([EXP]);
  });

  it('Shift, held for a capital in the middle of the word, neither ends the match nor is taken from the board', async () => {
    const rig = mount();
    for (const ch of WORD.slice(0, 2)) rig.type(ch);
    rig.type('Shift', 'ShiftLeft');
    rig.type(WORD[2]!.toUpperCase());
    rig.typeWord(WORD.slice(3));
    await flush();
    expect(rig.picked).toEqual([EXP]);
  });
});
