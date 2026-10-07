// @vitest-environment jsdom
/**
 * The hidden door to the experimental Leblanc chapter (FFX-2 only; branch `exp-leblanc`).
 *
 * Bailey, 2026-10-06: "put the experimental new chapter in the live build but make it hidden like you did with ff7 how i had to type limit at
 * the main menu"; the word, confirmed: "leblanc". What this pins, with the real `Input`, real key events and the real board:
 *
 * 1. **Hidden by default**: the board holds the eighteen and nothing else; no EXP card, no pip, no word on screen, "of 18" unchanged.
 * 2. **The word opens it** (and only the word), the way "limit" opens FF7's: the board settles on the chapter, the cursor stays put, nothing is
 *    remembered and nothing is written to the save or the experiments' store. The tests read the word from its one constant.
 * 3. **The two doors do not interfere**: "limit" still opens FF7's; "limitleblanc" opens FF7's alone, "leblanclimit" the Leblanc one alone, a typo neither.
 * 4. **Chapter VI is unchanged** (its record and its card; the pinned art hashes are in `exp-leblanc.test.ts`) and the experiment's own store stays separate.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { buildChapterTiles, groupChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { EXP_LEBLANC_DOOR_CHAPTER, EXP_LEBLANC_DOOR_WORD } from '../../src/app/screens/frontend/leblancDoor.ts';
import { DOOR_WORD, KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord } from '../../src/app/experiments/experimentRecords.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, FFX2_LEBLANC, getChapter } from '../../src/data/encounters.ts';

const WORD = EXP_LEBLANC_DOOR_WORD;
const FF7 = 'ff7-guard-scorpion';
const EXP = 'exp-leblanc';

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
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to the experiment', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(EXP_LEBLANC_DOOR_CHAPTER).toBe(EXP);
    expect(getChapter(EXP)?.experimental).toBe(true);
  });

  it("stays clear of FF7's word: neither begins the other, so one door can never fire before the other", () => {
    expect(WORD.startsWith(DOOR_WORD)).toBe(false);
    expect(DOOR_WORD.startsWith(WORD)).toBe(false);
    expect(WORD.includes(DOOR_WORD) || DOOR_WORD.includes(WORD)).toBe(false);
  });

  it('opens on the last letter only, in either case, and ignores keys that are not characters', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
    const door = new WordDoor(WORD);
    const feed = [...WORD].flatMap((ch, i) => (i % 2 ? ['Shift', ch] : [ch, 'CapsLock']));
    const results = feed.map((k, i) => door.feedKey(k, i * 50));
    expect(results.filter((r) => r === 'open')).toHaveLength(1); // on the last letter, whatever non-character key follows it
    expect(results.indexOf('open')).toBe(feed.lastIndexOf(WORD.at(-1)!));
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

// ------------------------------------------------------------------ board

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  picked: string[];
  settled: string[];
  type(key: string, code?: string): void;
  typeWord(word: string): void;
}

let rigs: Array<{ screen: ChapterSelectScreen; input: Input; root: HTMLElement }> = [];
let clock = 0;

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
  const type = (key: string, code = /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
    frame();
    window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
  };
  return { screen, root, picked, settled, type, typeWord: (word) => [...word].forEach((ch) => type(ch)) };
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
  setFf7ExperimentReadyForTests(null);
  forgetBoardChapter();
  vi.restoreAllMocks();
});

describe('hidden by default', () => {
  it('the board holds the eighteen: no experiment tile, no EXP numeral, no pip, "of 18" unchanged', () => {
    const tiles = buildChapterTiles(new SaveStore());
    expect(new Set(tiles.map((t) => t.id))).toEqual(new Set(CHAPTERS.map((c) => c.id as string)));
    expect(tiles).toHaveLength(18);
    expect(tiles.some((t) => t.id === EXP || t.chapter?.experimental || t.numeral === 'EXP')).toBe(false);
    expect(groupChapterTiles(tiles).map((g) => g.tiles.length)).toEqual([11, 7]);
    const progress = boardProgress(tiles, 0);
    expect(progress.total).toBe(18);
    expect(progress.pips).toHaveLength(18);
  });

  it('the mounted board draws eighteen cards and says nothing of the experiment', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card')).toHaveLength(18);
    expect(rig.root.querySelector(`[data-card="${EXP}"]`)).toBeNull();
    expect(rig.root.textContent).not.toMatch(/experiment|EXP\b/i);
    expect(rig.root.textContent).toMatch(/of 18 beaten/);
    expect(rig.screen.snapshot()['order'] as string[]).not.toContain(EXP);
  });

  it('with no word typed, nothing leads in: every key of the board, the arrows around the whole list included, never selects it', async () => {
    const rig = mount();
    for (let i = 0; i < 40; i++) rig.type('ArrowRight');
    for (let i = 0; i < 40; i++) rig.type('ArrowLeft');
    rig.type('ArrowDown');
    rig.type('ArrowUp');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.screen.snapshot()['selectedId']).not.toBe(EXP);
  });

  it('a card can still be built when a test hands the experiment in (the data path is intact)', () => {
    const tiles = buildChapterTiles(new SaveStore(), { experiments: EXPERIMENT_CHAPTERS });
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
      expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    }
    expect(rig.picked).toEqual([]);
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

  it('a wrong word does nothing at all: every typo of it, a wrong first letter, half of the FF7 word, an unrelated word', async () => {
    for (const wrong of [...typos(WORD), 'k' + WORD.slice(1), DOOR_WORD.slice(0, -1), 'lemon']) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      expect(rig.picked, wrong).toEqual([]);
      expect(rig.settled, wrong).toEqual([]);
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

describe('the two doors do not interfere', () => {
  it('"limit" still opens the FF7 experiment and nothing else', async () => {
    const rig = mount();
    rig.typeWord(DOOR_WORD);
    await flush();
    expect(rig.picked).toEqual([FF7]);
    expect(rig.settled).toEqual([FF7]);
  });

  it('"limit" then the word: FF7 opens on its last letter and the board is done (the Leblanc letters after it are ignored)', async () => {
    const rig = mount();
    rig.typeWord(DOOR_WORD + WORD);
    await flush();
    expect(rig.picked).toEqual([FF7]);
  });

  it('the word then "limit": the Leblanc door opens on its last letter and the board is done', async () => {
    const rig = mount();
    rig.typeWord(WORD + DOOR_WORD);
    await flush();
    expect(rig.picked).toEqual([EXP]);
  });

  it('a half-typed word before the other one does not spoil either', async () => {
    const a = mount();
    a.typeWord(DOOR_WORD.slice(0, -1) + WORD);
    await flush();
    expect(a.picked).toEqual([EXP]);
    const b = mount();
    b.typeWord(WORD.slice(0, -1) + DOOR_WORD);
    await flush();
    expect(b.picked).toEqual([FF7]);
  });

  it('with the FF7 switch off, "limit" does nothing and the Leblanc word still opens (the doors are independent)', async () => {
    setFf7ExperimentReadyForTests(false);
    const rig = mount();
    rig.typeWord(DOOR_WORD);
    await flush();
    expect(rig.picked).toEqual([]);
    rig.typeWord(WORD);
    await flush();
    expect(rig.picked).toEqual([EXP]);
  });

  it("FF7's seven taps and its pad sequence (F R F R M on a keyboard) open FF7 alone", async () => {
    const taps = mount();
    const eyebrow = taps.root.querySelector('.fe-cselect__eyebrow')!;
    for (let i = 0; i < 7; i++) eyebrow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(taps.picked).toEqual([FF7]);
    const pad = mount();
    for (const ch of 'frfrm') pad.type(ch);
    await flush();
    expect(pad.picked).toEqual([FF7]);
  });
});

describe('Chapter VI is unchanged, and the experiment keeps its own store', () => {
  it("Chapter VI's record and its card are as they were (the pinned art hashes: exp-leblanc.test.ts)", () => {
    expect(getChapter('ffx2-leblanc')).toBe(FFX2_LEBLANC);
    expect(FFX2_LEBLANC.experimental).toBeUndefined();
    expect(CHAPTERS).toContain(FFX2_LEBLANC);
    const card = buildChapterTiles(new SaveStore()).find((t) => t.id === 'ffx2-leblanc')!;
    expect(card).toMatchObject({ numeral: 'VI', title: 'Leblanc', game: 'ffx2', playable: true });
    expect(card.chapter).toBe(FFX2_LEBLANC);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toEqual([EXP]);
  });

  it("the experiment's attempts land in the experiments' store and never in the save", () => {
    const save = new SaveStore();
    const before = JSON.stringify(save.snapshot());
    experimentProgress.recordAttempt(EXP);
    expect(experimentRecord(EXP).attempts).toBe(1);
    expect(Object.keys(JSON.parse(window.localStorage.getItem(EXPERIMENTS_KEY)!))).toEqual([EXP]);
    expect(JSON.stringify(save.snapshot())).toBe(before);
    expect(window.localStorage.getItem(SAVE_KEY) ?? '').not.toContain(EXP);
  });
});
