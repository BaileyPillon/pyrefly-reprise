// @vitest-environment jsdom
/**
 * The hidden door to the anime chapter (FFX-2 only; branch `ch-anime`, 2026-11-06): the word `gear`, typed on chapter select, opens hidden chapter 24's Valefor fight drawn in an anime cel-shaded style (`exp-anime`,
 * number 33). **The word and the number are driver picks, his to overturn**: `genshin` (the first word of his "genshin / guilty gear") fails the door rule against `infinito`, `gear` passes it.
 *
 * Written against the Wind Waker door's suite (`windwaker-door.test.ts`), shorter: the real `Input`, real key events, the real board and title screen, without that suite's loops over every other door (the door suites cost
 * the square of the number of doors; `chapter-doors.test.ts` and `r74-hidden-3d-phone-doors.test.ts` already run the whole table). It pins that
 *
 * 1. **the word is safe to type**: G is bound to nothing, E is `start`, A is `left`, R is `r1`; the title answers only `confirm` and `start`, so the word is typed on the board and never on the title;
 * 2. **the chapter is hidden by default**: no card, no EXP numeral, "of 19" unchanged, the arrows never find it;
 * 3. **the word opens it**, and only the word: on its last letter, in either case, nothing remembered or written; a wrong letter or a pause resets;
 * 4. **the word overlaps no other door word** (the shared rule of `chapter-doors.test.ts`, run here too) and is typed back to back with every other word in either order without either firing early;
 * 5. **it is desktop-only** like the other two hidden 3D chapters (driver decision 219q): on the phone tier the word opens nothing.
 *
 * The tests read the word from its one constant, never a literal.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDoorClock } from './helpers/doorClock.ts';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { BoardDoors, CHAPTER_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { ANIME_DOOR_CHAPTER, ANIME_DOOR_WORD } from '../../src/app/screens/frontend/animeDoor.ts';
import { KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { setArtTier } from '../../src/engine/ArtDevice.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';

const WORD = ANIME_DOOR_WORD;
const ANIME = ANIME_DOOR_CHAPTER;
const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function typeWord(door: WordDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

describe('the word (pure)', () => {
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to a hidden FFX-2 experiment numbered 33', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(ANIME).toBe('exp-anime');
    expect(getChapter(ANIME)).toMatchObject({ id: ANIME, game: 'ffx2', experimental: true, number: 33 });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(ANIME);
    expect(CHAPTER_DOORS.find((d) => d.word === WORD)?.chapter).toBe(ANIME);
    expect(CHAPTER_DOORS.at(-1)?.word, 'the last row of the table').toBe(WORD);
  });

  it('opens on the last letter only, in either case; a wrong letter resets, a wrong first letter starts it again, a pause over the gap ends the match', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
    for (const typo of [WORD.slice(0, -1), 'gaer', 'gear'.replace('e', 'i'), 'tear', 'ear', 'geaa']) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
    expect(typeWord(new WordDoor(WORD), WORD[0] + WORD).at(-1)).toBe('open');
    const door = new WordDoor(WORD);
    typeWord(door, WORD.slice(0, 2), 0, 100);
    expect(typeWord(door, WORD.slice(2), 100 + KEY_GAP_MS + 1, 100)).not.toContain('open');
  });

  it('passes the shared rule against every other word, in either order (no begin, end, containment or suffix-prefix overlap), and `genshin`, the word it replaced, would not have', () => {
    const others = CHAPTER_DOORS.map((d) => d.word).filter((w) => w !== WORD);
    expect(others.length).toBeGreaterThanOrEqual(15);
    const clash = (a: string, b: string): string[] => {
      const out: string[] = [];
      if (a.startsWith(b)) out.push(`${a} begins ${b}`);
      if (a.endsWith(b)) out.push(`${a} ends with ${b}`);
      if (a.includes(b)) out.push(`${a} contains ${b}`);
      for (let k = 1; k <= Math.min(a.length, b.length); k++) if (a.slice(-k) === b.slice(0, k)) out.push(`the last ${k} of ${a} start ${b}`);
      return out;
    };
    for (const other of others) expect([...clash(WORD, other), ...clash(other, WORD)], other).toEqual([]);
    expect(others.flatMap((o) => [...clash('genshin', o), ...clash(o, 'genshin')]).length, 'genshin overlaps `infinito` (its last two letters are its first two)').toBeGreaterThan(0);
  });

  it('typed back to back with each other door word, in either order, each word finishes exactly once and at its own last letter', () => {
    for (const other of CHAPTER_DOORS.map((d) => d.word).filter((w) => w !== WORD)) {
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
  it('G is bound to nothing, E is start, A is left, R is r1 (the same shape as `waker`)', () => {
    expect(buttonsFor('g')).toEqual([]);
    expect(buttonsFor('e')).toEqual(['start']);
    expect(buttonsFor('a')).toEqual(['left']);
    expect(buttonsFor('r')).toEqual(['r1']);
    expect(new Set(WORD)).toEqual(new Set(['g', 'e', 'a', 'r'])); // ...and that is every distinct letter of the word
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

  it('on the title screen only confirm and start begin the flow: of the word\'s letters only the E is one (so the word is typed on the board, never on the title); the control keys do', () => {
    for (const letter of new Set(WORD)) expect(titleAdvancesOn(letter), `the title started on "${letter}"`).toBe(letter === 'e');
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
  setArtTier('high');
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
  setArtTier(null);
  forgetBoardChapter();
  vi.restoreAllMocks();
});

describe('hidden by default', () => {
  it('the board holds the nineteen: no tile for the chapter, no EXP numeral, "of 19" unchanged (asserted on the id, the numeral and the count, never on the word)', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(19);
    expect(tiles.some((t) => t.id === ANIME || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(19);
    expect((CHAPTER_IDS as readonly string[]).includes(ANIME)).toBe(false);
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain(ANIME);
  });

  it('the mounted board draws nineteen cards, none for the chapter, and with no word typed the arrows around the whole list never select it', async () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(19);
    expect(rig.root.querySelector(`[data-card="${ANIME}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/\bEXP\b/);
    expect(rig.root.textContent).toMatch(/of 19 beaten/);
    for (let i = 0; i < 40; i++) rig.type('ArrowRight');
    for (let i = 0; i < 40; i++) rig.type('ArrowLeft');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.screen.snapshot()['selectedId']).not.toBe(ANIME);
  });
});

describe('the word opens it on chapter select', () => {
  it('settles on the chapter on the last letter, without moving the cursor, remembering it or writing anything', async () => {
    const rig = mount();
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored();
    const at = rig.screen.snapshot()['selectedIndex'] as number;
    for (const ch of WORD.slice(0, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(at); // G is unbound and the A is claimed by the word
    }
    expect(rig.picked).toEqual([]);
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([ANIME]);
    expect(rig.settled).toEqual([ANIME]);
    expect(lastBoardChapter()).toBeNull();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(window.localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
    expect(stored(), 'the door wrote nothing, under any key').toEqual(before);
  });

  it('opens in capitals too (Shift held); a wrong letter resets; a pause over 2 s resets', async () => {
    const caps = mount();
    for (const ch of WORD.toUpperCase()) {
      caps.type('Shift', 'ShiftLeft');
      caps.type(ch);
    }
    await flush();
    expect(caps.picked).toEqual([ANIME]);
    for (const wrong of ['gaer', 'gea', 'xgea', 'wak']) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      expect(rig.picked, wrong).toEqual([]);
    }
    let t = 5_000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const slow = mount();
    const typeAll = (letters: string): void => [...letters].forEach((ch) => (slow.type(ch), (t += 100)));
    typeAll(WORD.slice(0, 2));
    t += KEY_GAP_MS + 500;
    typeAll(WORD.slice(2));
    await flush();
    expect(slow.picked, 'the pause ended the match').toEqual([]);
    typeAll(WORD);
    await flush();
    expect(slow.picked).toEqual([ANIME]);
  });

  it('keeps the board working: a plain A moves the cursor left and a plain G, E or R does nothing', () => {
    const rig = mount();
    rig.type('ArrowRight');
    const afterRight = rig.screen.snapshot()['selectedIndex'] as number;
    rig.type('a');
    expect(rig.screen.snapshot()['selectedIndex']).toBe(afterRight - 1);
    const rest = rig.screen.snapshot()['selectedIndex'];
    for (const ch of ['g', 'e', 'r']) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `a plain "${ch}"`).toBe(rest);
    }
  });

  it('never opens FF7\'s experiment, and the word does not disturb the two doors it sits beside: `waker` and `yrp` still open their own chapters on the same board', async () => {
    useDoorClock();
    const rig = mount();
    rig.typeWord(WORD);
    await flush();
    expect(rig.picked).toEqual([ANIME]);
    expect(rig.picked).not.toContain('ff7-guard-scorpion');
    for (const word of ['waker', 'yrp', 'limit']) {
      const other = mount();
      other.typeWord(word);
      await flush();
      expect(other.picked, word).toEqual([CHAPTER_DOORS.find((d) => d.word === word)!.chapter]);
    }
  });
});

describe('desktop only', () => {
  it('the door carries the table\'s gate: shut on the phone tier, open on every other; the word typed on a phone opens nothing', async () => {
    const row = CHAPTER_DOORS.find((d) => d.word === WORD)!;
    expect(typeof row.gate).toBe('function');
    const doors = new BoardDoors();
    setArtTier('phone');
    expect(doors.isOpen(ANIME)).toBe(false);
    const phone = mount();
    phone.typeWord(WORD);
    await flush();
    expect(phone.picked, 'on the phone tier the word opens nothing').toEqual([]);
    for (const tier of ['low', 'mid', 'high', null] as const) {
      setArtTier(tier);
      expect(doors.isOpen(ANIME), String(tier)).toBe(true);
    }
  });
});
