// @vitest-environment jsdom
/**
 * The hidden door to the Angra Mainyu chapter (FFX-2 only; branch `ch-angra-mainyu`, 2026-10-14): the word `angra`, typed on chapter select, opens FFX-2 Chapter 5's
 * "Showdown in the Sands" (chapter 26, `ffx2-angra-mainyu`).
 *
 * Written against the Daigoro and Valefor door suites (`daigoro-door.test.ts`, `valefor-door.test.ts`): the real `Input`, real key events, the real board and title screen. It pins that
 *
 * 1. **the word is safe to type**: A is `left` (twice), R is `r1`, N and G are bound to nothing. The board's cursor takes ONE step on the first A (a first letter cannot be claimed: the word does not
 *    yet exist when it is pressed); the last A is claimed by the word (`WordDoor.continued`) and consumed by the opening frame, so it moves nothing. The title answers only `confirm` and `start`, and no
 *    letter of the word is one of those, so the word cannot start the flow from the title either;
 * 2. **the chapter is hidden by default**: the assertions are on its id, its EXP numeral and the tile count, never on the word in the board's text;
 * 3. **the word opens it**, and only the word: nothing is remembered or written; a wrong letter resets, and so does a pause over 2 s between letters;
 * 4. **the eight doors do not interfere**, the chapter opens party prep, and **the word overlaps no other door word, `gagazet` (the Biran and Yenke lane's, branch `ch-biran-yenke`, hidden chapter 25)
 *    included**: the shared rule of `chapter-doors.test.ts` (no begin, end, containment or suffix-prefix overlap) is run here over the table's words plus `gagazet`, and the two words are typed back to back.
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
import { ANGRA_DOOR_CHAPTER, ANGRA_DOOR_WORD } from '../../src/app/screens/frontend/angraDoor.ts';
import { KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORD = ANGRA_DOOR_WORD;
const ANGRA = ANGRA_DOOR_CHAPTER;
/** The sibling lane's word (branch `ch-biran-yenke`, hidden chapter 25): not in the table of the branch this file was written on, so it is named here and tested against; once merged it is in the table too. */
const SIBLING_WORDS = ['gagazet'] as const;

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function typeWord(door: WordDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

describe('the word (pure)', () => {
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to a hidden FFX-2 experiment numbered 26', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(ANGRA).toBe('ffx2-angra-mainyu');
    expect(getChapter(ANGRA)).toMatchObject({ id: ANGRA, game: 'ffx2', experimental: true, number: 26 });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(ANGRA);
    expect(CHAPTER_DOORS.find((d) => d.word === WORD)?.chapter).toBe(ANGRA);
  });

  it('opens on the last letter only, in either case, and ignores keys that are not characters', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
  });

  it('a wrong letter resets (a wrong first letter starts it again); a pause over the gap ends the match', () => {
    for (const typo of [WORD.slice(0, -1), 'angre', 'anbra', 'ongra', 'ngra']) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
    expect(typeWord(new WordDoor(WORD), WORD[0] + WORD).at(-1)).toBe('open');
    const door = new WordDoor(WORD);
    typeWord(door, WORD.slice(0, 3), 0, 100);
    expect(typeWord(door, WORD.slice(3), 200 + KEY_GAP_MS + 1, 100)).not.toContain('open');
    const exact = new WordDoor(WORD);
    typeWord(exact, WORD.slice(0, 3), 0, 100);
    expect(typeWord(exact, WORD.slice(3), 200 + KEY_GAP_MS, 100).at(-1)).toBe('open'); // exactly the gap is in time
  });
});

describe('the word against every other door word, the sibling lane\'s `gagazet` included (the shared rule of chapter-doors.test.ts, run with it present)', () => {
  const others = [...CHAPTER_DOORS.map((d) => d.word).filter((w) => w !== WORD), ...SIBLING_WORDS];

  it('no word begins with, ends with or contains the other, and no end of one is the beginning of the other, in either order', () => {
    expect(others).toContain('gagazet');
    expect(others).toContain('valefor');
    expect(others).toContain('daigoro');
    for (const other of others) {
      for (const [a, b] of [[WORD, other], [other, WORD]] as const) {
        expect(a.startsWith(b), `${a} begins ${b}`).toBe(false);
        expect(a.endsWith(b), `${a} ends with ${b}`).toBe(false);
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
        for (let k = 1; k <= Math.min(a.length, b.length); k++) expect(a.slice(-k) === b.slice(0, k), `the last ${k} of ${a} start ${b}`).toBe(false);
      }
    }
  });

  it('typed back to back with `gagazet` in either order, each word finishes exactly once and the other never fires early', () => {
    for (const other of SIBLING_WORDS) {
      for (const run of [WORD + other, other + WORD]) {
        const mine = new WordDoor(WORD);
        const theirs = new WordDoor(other);
        const fedMine = [...run].map((ch, i) => mine.feedKey(ch, i * 100));
        const fedTheirs = [...run].map((ch, i) => theirs.feedKey(ch, i * 100));
        expect(fedMine.filter((r) => r === 'open'), run).toHaveLength(1);
        expect(fedTheirs.filter((r) => r === 'open'), run).toHaveLength(1);
        const mineAt = run.indexOf(WORD) + WORD.length - 1;
        const theirsAt = run.indexOf(other) + other.length - 1;
        expect(fedMine.indexOf('open'), run).toBe(mineAt);
        expect(fedTheirs.indexOf('open'), run).toBe(theirsAt);
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
  it('A is left, R is r1; N and G are bound to nothing', () => {
    expect(buttonsFor('a')).toEqual(['left']);
    expect(buttonsFor('r')).toEqual(['r1']);
    for (const letter of ['n', 'g']) expect(buttonsFor(letter), letter).toEqual([]);
    expect(new Set(WORD)).toEqual(new Set(['a', 'n', 'g', 'r'])); // ...and that is every distinct letter of the word
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

  it('on the title screen only confirm and start begin the flow: none of the word\'s letters is one, so the word typed there starts nothing', () => {
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
    expect(tiles.some((t) => t.id === ANGRA || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect(groupChapterTiles(tiles).map((g) => g.tiles.length)).toEqual([11, 7]);
    expect(CHAPTER_IDS).toHaveLength(18);
    expect((CHAPTER_IDS as readonly string[]).includes(ANGRA)).toBe(false);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ANGRA);
    const progress = boardProgress(tiles, 0);
    expect([progress.total, progress.pips.length]).toEqual([18, 18]);
  });

  it('the mounted board draws eighteen cards, none for the chapter, and counts "of 18 beaten"', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(18);
    expect(rig.root.querySelector(`[data-card="${ANGRA}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/\bEXP\b/);
    expect(rig.root.textContent).toMatch(/of 18 beaten/);
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(ANGRA);
    expect(rig.screen.snapshot()['tiles']).toBe(18);
  });

  it('with no word typed, nothing leads in: the arrows around the whole list never select it', async () => {
    const rig = mount();
    for (let i = 0; i < 40; i++) rig.type('ArrowRight');
    for (let i = 0; i < 40; i++) rig.type('ArrowLeft');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.screen.snapshot()['selectedId']).not.toBe(ANGRA);
  });
});

describe('the word opens it on chapter select', () => {
  it('settles on the chapter on the last letter; the cursor takes one step on the first A and no other; nothing is remembered or written', async () => {
    const rig = mount();
    rig.type('ArrowRight'); // so the first A, a step left, has somewhere to go
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored(); // whatever the board itself keeps, taken before the word
    const selected = rig.screen.snapshot()['selectedIndex'] as number;
    const cursor = vi.spyOn(audio, 'playSfx');
    rig.type(WORD[0]!);
    const afterFirst = rig.screen.snapshot()['selectedIndex'];
    expect(afterFirst, 'the first A is a press of left: one step, stated in angraDoor.ts').toBe(selected - 1);
    for (const ch of WORD.slice(1, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(afterFirst);
    }
    expect(rig.picked).toEqual([]);
    rig.type(WORD.at(-1)!); // the last A: a left press the word claims, so the cursor stays
    await flush();
    expect(rig.picked).toEqual([ANGRA]);
    expect(rig.settled).toEqual([ANGRA]);
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
    expect(rig.picked).toEqual([ANGRA]);
  });

  it('a wrong letter resets: every typo, a wrong first letter, half of each other door\'s word, an unrelated word', async () => {
    const others = CHAPTER_DOORS.filter((d) => d.word !== WORD).map((d) => d.word.slice(0, -1));
    for (const wrong of ['angre', 'anbra', 'ongra', 'ngra', WORD.slice(0, -1), ...others, 'angry']) {
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
    expect(rig.picked).toEqual([ANGRA]);
  });

  it('keeps the board working: a plain A moves left, a plain N, G or R does nothing, and while the match is live the last A belongs to the word and the cursor stays', async () => {
    const lone = mount();
    lone.type('ArrowRight');
    const afterRight = lone.screen.snapshot()['selectedIndex'] as number;
    lone.type('a'); // a plain A, with no match live, moves left
    expect(lone.screen.snapshot()['selectedIndex']).toBe(afterRight - 1);
    const rest = lone.screen.snapshot()['selectedIndex'];
    for (const ch of ['n', 'g', 'r']) {
      lone.type(ch);
      expect(lone.screen.snapshot()['selectedIndex'], `a plain "${ch}"`).toBe(rest);
    }
    const rig = mount();
    rig.type('ArrowRight');
    rig.type('ArrowRight');
    const start = rig.screen.snapshot()['selectedIndex'] as number;
    for (const ch of WORD.slice(0, -1)) rig.type(ch); // the first A takes its one step, the rest of the match leaves the cursor alone
    expect(rig.screen.snapshot()['selectedIndex']).toBe(start - 1);
    await flush();
    expect(rig.picked).toEqual([]);
    rig.type(WORD.at(-1)!);
    expect(rig.screen.snapshot()['selectedIndex'], 'the last A, a left press, is the word\'s').toBe(start - 1);
    await flush();
    expect(rig.picked).toEqual([ANGRA]);
  });

  it('never opens FF7\'s experiment: the R of the word is a third of its pad sequence L1 R1 L1 R1 Select, which the word does not complete', async () => {
    const rig = mount();
    rig.typeWord(WORD);
    await flush();
    expect(rig.picked).toEqual([ANGRA]);
    expect(rig.picked).not.toContain('ff7-guard-scorpion');
    // The sequence typed after the word on a fresh visit still needs all five of its presses.
    const fresh = mount();
    for (const ch of ['f', 'r', 'f', 'r']) fresh.type(ch);
    await flush();
    expect(fresh.picked).toEqual([]);
  });
});

describe('the eight doors do not interfere', () => {
  it('each word opens its own chapter and nothing else', async () => {
    expect(CHAPTER_DOORS.map((d) => d.word)).toContain(WORD);
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
      expect(a.picked, `${WORD}${other.word}`).toEqual([ANGRA]);
      const b = mount();
      b.typeWord(other.word + WORD);
      await flush();
      expect(b.picked, `${other.word}${WORD}`).toEqual([other.chapter]);
      const c = mount();
      c.typeWord(other.word.slice(0, -1) + WORD);
      await flush();
      expect(c.picked, `${other.word.slice(0, -1)}${WORD}`).toEqual([ANGRA]);
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
    expect([flow.picked, flow.settled]).toEqual([[ANGRA], [ANGRA]]);
    const prep = flow.prep();
    expect(prep, 'the flow mounted party prep').not.toBeNull();
    expect(prep!.snapshot()['chapter']).toBe(ANGRA);
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
    expect(flow.settled).toEqual([ANGRA]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the last letter held down through the opening frames does not start the fight either (A is left, which party prep does not take as a begin)', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    keyDown(WORD.at(-1)!); // the last letter goes down and stays down
    await flush();
    for (let i = 0; i < 8; i++) await flow.step();
    keyUp(WORD.at(-1)!);
    await flush();
    expect(flow.settled).toEqual([ANGRA]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });
});
