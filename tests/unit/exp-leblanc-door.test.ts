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
 *
 * Release 39.3's focused review (`critic/reviews/b80f772f-focused.json`) found three faults in the door; these pin their repairs (FFX-2 only for the chapter, both games for the board):
 * 5. **F393-03, the last letter is START.** The word's C is the board's START key, and party prep begins the fight on START: the press that finished the word reached prep one frame after
 *    the flow mounted it, so the chapter skipped party prep. Now the door takes that press (it opens on the frame that reads it) and party prep stays up until Enter. Driven with the real
 *    `PartyPrepScreen` mounted the way the flow mounts it (in the microtask after the board settles), in three typing styles.
 * 6. **F393-04, the arrow after part of the word.** `WordDoor.continued` stayed true after a letter, so the next key, an arrow, was read as a letter of the word and the board swallowed it.
 *    A letter is the word's only while it extends a live match; an arrow always moves the cursor and ends the match.
 * 7. **F393-05, the coach wrote into the save.** A hidden run marked its coach hints seen in `pyrefly-reprise:save:v1`. While an experimental chapter runs, what the coach shows is
 *    remembered for the session only, and the save stays byte-identical (CHK-025).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { Screen } from '../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { PartyPrepScreen } from '../../src/app/screens/PartyPrepScreen.ts';
import { beginExperimentRun, experimentRunActive } from '../../src/app/experiments/experimentRun.ts';
import { hasSeen, markSeen, resetCoach } from '../../src/ui/coach/coachState.ts';
import { armFirstRunGuide, firstRunBattleBegan, stopFirstRun } from '../../src/ui/coach/firstRunGuide.ts';
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

  it('claims nothing that is not a letter, however fresh the match: an arrow stays the board\'s (F393-04)', () => {
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'Enter', 'Escape', 'Tab', 'Shift', 'CapsLock']) {
      const door = new WordDoor(WORD);
      typeWord(door, WORD.slice(0, 4));
      expect(door.continued, `${key}: after a letter`).toBe(true);
      door.feedKey(key, 450);
      expect(door.continued, key).toBe(false);
    }
  });

  it('claims no letter that comes after a pause longer than the gap: the match was already over', () => {
    const door = new WordDoor(WORD);
    typeWord(door, WORD.slice(0, 4));
    door.feedKey(WORD[4]!, 300 + KEY_GAP_MS + 1);
    expect(door.continued).toBe(false);
  });

  it('an arrow, Enter, Escape, Backspace, Tab or a page key ends the match; Shift, CapsLock and the other typing aids do not', () => {
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Backspace', 'Tab', 'PageUp', 'PageDown']) {
      const door = new WordDoor(WORD);
      typeWord(door, WORD.slice(0, 3));
      door.feedKey(key, 350);
      expect(typeWord(door, WORD.slice(3), 450), key).not.toContain('open');
    }
    for (const key of ['Shift', 'CapsLock', 'AltGraph', 'Dead', 'Process', 'Unidentified']) {
      const door = new WordDoor(WORD);
      typeWord(door, WORD.slice(0, 3));
      door.feedKey(key, 350);
      expect(typeWord(door, WORD.slice(3), 450).at(-1), key).toBe('open');
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
let preps: PartyPrepScreen[] = []; // the party prep screens the flow rigs mounted (`mountFlow`)
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

// ------------------------------------------------------- the board, inside the flow

interface FlowRig extends Rig {
  /** Party prep, once the flow has mounted it. */
  prep(): PartyPrepScreen | null;
  /** One browser frame for the screen on top, then the microtasks it queued (the flow swaps screens there). */
  step(): Promise<void>;
  /** A real key: down, the microtasks that follow it, a frame, up. */
  press(key: string, code?: string): Promise<void>;
}

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key);

/**
 * The board as the flow runs it: the real `Input`, the real board, and when the board settles on a chapter the real `PartyPrepScreen` mounted in the microtask after, as
 * `main.ts` -> `runChapter` -> `show(prep)` does it (the review found party prep mounted and gone 2 ms apart); every frame goes to whichever screen is on top.
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
    prep.app = { fade: () => Promise.resolve() } as unknown as PartyPrepScreen['app']; // enter() only reaches App for the fade
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

describe('the word opens party prep, and its last letter is not a START press (F393-03)', () => {
  it('the word\'s last letter is the board\'s START key, which is the whole trouble (the test would prove nothing otherwise)', () => {
    expect(WORD.at(-1)).toBe('c');
    const rig = mount();
    keyDown('c');
    expect(rig.input.justPressed('start')).toBe(true);
    keyUp('c');
  });

  it('a key per letter and a frame after each: party prep is up, holds through more frames, and Enter begins it', async () => {
    const flow = mountFlow();
    for (const ch of WORD) await flow.press(ch);
    expect(flow.settled).toEqual([EXP]);
    const prep = flow.prep();
    expect(prep, 'the flow mounted party prep').not.toBeNull();
    expect(prep!.snapshot()['chapter']).toBe(EXP);
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
    expect(flow.settled).toEqual([EXP]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the last letter held down while the screens change, auto-repeat included: no START, party prep stays', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    keyDown(WORD.at(-1)!);
    await flush();
    await flow.step();
    keyDown(WORD.at(-1)!, { repeat: true });
    for (let i = 0; i < 4; i++) await flow.step();
    keyUp(WORD.at(-1)!);
    for (let i = 0; i < 4; i++) await flow.step();
    expect(flow.settled).toEqual([EXP]);
    expect(flow.prep()!.snapshot()['outcome']).toBeNull();
  });

  it('the door takes the press that finished the word: the frame that opens it reads no START, and the chapter is picked once', async () => {
    const flow = mountFlow();
    for (const ch of WORD.slice(0, -1)) await flow.press(ch);
    keyDown('c');
    clock += 100;
    flow.screen.handleInput(flow.input.update(clock));
    expect(flow.input.justPressed('start')).toBe(false);
    expect(flow.picked).toEqual([EXP]);
    flow.input.endFrame();
    keyUp('c');
    await flush();
    for (let i = 0; i < 3; i++) await flow.step();
    expect(flow.picked).toEqual([EXP]);
    expect(flow.settled).toEqual([EXP]);
  });

  it('"limit" is unchanged: FF7\'s door still opens on its own last key (T is bound to no button, so nothing is left to take)', async () => {
    const rig = mount();
    for (const ch of DOOR_WORD.slice(0, -1)) rig.type(ch);
    keyDown(DOOR_WORD.at(-1)!);
    expect(rig.picked, 'opened by the key itself, before any frame').toEqual([FF7]);
    keyUp(DOOR_WORD.at(-1)!);
    rig.frame();
    await flush();
    expect(rig.settled).toEqual([FF7]);
  });

  it('"leblanclimit" and "limitleblanc" typed with no frame between the letters: the first word to finish wins, as before', async () => {
    for (const [typed, opens] of [[WORD + DOOR_WORD, EXP], [DOOR_WORD + WORD, FF7]] as const) {
      const rig = mount();
      for (const ch of typed) keyDown(ch);
      for (const ch of typed) keyUp(ch);
      rig.frame();
      rig.frame();
      await flush();
      expect(rig.picked, typed).toEqual([opens]);
      expect(rig.settled, typed).toEqual([opens]);
    }
  });
});

describe('the board keeps its presses after part of the word (F393-04)', () => {
  it('an arrow right after "lebl" moves the cursor on its first press, and ends the match', async () => {
    const rig = mount();
    for (const ch of WORD.slice(0, 4)) rig.type(ch);
    const before = rig.screen.snapshot()['selectedIndex'];
    rig.type('ArrowRight');
    expect(rig.screen.snapshot()['selectedIndex'], 'the first arrow press was swallowed').not.toBe(before);
    rig.typeWord(WORD.slice(4)); // "anc": the arrow ended the match, so these are not the rest of the word
    await flush();
    expect(rig.picked).toEqual([]);
  });

  it('the same after a pause longer than the gap between letters (the match was already over), for every arrow', async () => {
    for (const arrow of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
      let t = 5_000;
      vi.spyOn(performance, 'now').mockImplementation(() => t);
      const rig = mount();
      rig.type('ArrowRight'); // off the first card, so a move left and a move up are both visible
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

  it('a letter of the word is the board\'s again once it no longer extends a live match: the A after a pause moves the cursor left', () => {
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
    rig.type(WORD[4]!); // the A: the word's fifth letter, but the match is over
    expect(rig.screen.snapshot()['selectedIndex']).not.toBe(before);
  });

  it('while the match is live, the A of the word is the word\'s: the cursor does not move (the reason the board claims it)', () => {
    const rig = mount();
    rig.type('ArrowRight');
    for (const ch of WORD.slice(0, 4)) rig.type(ch);
    const before = rig.screen.snapshot()['selectedIndex'];
    rig.type(WORD[4]!);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(before);
  });

  it('a mid-word typo ends the match: the letters after it are the board\'s again, and the word does not open', async () => {
    const rig = mount();
    rig.type('ArrowRight');
    for (const ch of 'lebk') rig.type(ch); // k: wrong, and bound to nothing
    const before = rig.screen.snapshot()['selectedIndex'];
    rig.type('a'); // would be the word's fifth letter, but the typo ended it
    expect(rig.screen.snapshot()['selectedIndex']).not.toBe(before);
    rig.typeWord('nc');
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

// ------------------------------------------------------- the coach and the save (F393-05)

/** The six hints the review found in the main save after one hidden win: the guide's three steps and the three FFX-2 lines (`CoachLayer`). */
const TAUGHT = ['firstrun-board', 'firstrun-prep', 'firstrun-battle', 'ffx2-gauge', 'ffx2-dressphere', 'ffx2-chain'] as const;

let shownInside: boolean[] = [];
let battleOutcome: 'victory' | 'defeat' = 'victory';
let battleThrows = false;

/** What a first FFX-2 battle does to a first-time player's coach memory, with no engine behind it: the first-run guide's end and the three lines. */
class StandInBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    const won = battleOutcome === 'victory';
    this.done = Promise.resolve({
      chapterId: opts.chapter.id,
      outcome: battleOutcome,
      result: won ? ({ turns: 7, elapsedMs: 0, elapsedTicks: 0 } as never) : null,
      elapsedMs: 95_000,
      links: 1,
      preview: false,
    });
  }
  override enter(): void {
    if (battleThrows) throw new Error('the battle failed to start');
    firstRunBattleBegan('ffx2');
    for (const id of TAUGHT) markSeen(id);
    shownInside.push(TAUGHT.every((id) => hasSeen(id)));
  }
}

class FlowApp {
  readonly uiRoot = document.body.appendChild(document.createElement('div'));
  readonly save = new SaveStore();
  readonly flow = new GameFlow(this as unknown as App);
  current: Screen | null = null;
  get overlayActive(): boolean {
    return false;
  }
  async replace(screen: Screen): Promise<void> {
    await this.current?.exit();
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    this.current = screen;
    await screen.enter();
  }
  async goto(): Promise<boolean> {
    return true;
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

/** No prep, no scenes, no results panel, no entry animation: these checks are about the save. */
const QUIET = { seed: 7, speed: 'skip', skipPrep: true, skipCutscenes: true, skipResults: true } as const;

describe('the coach never writes the save during a hidden run (F393-05, CHK-025)', () => {
  beforeEach(() => {
    shownInside = [];
    battleOutcome = 'victory';
    battleThrows = false;
    resetCoach();
    resetFlowScreens();
    registerFlowScreens({ battle: (opts) => new StandInBattle(opts) });
  });

  afterEach(() => {
    stopFirstRun();
    resetFlowScreens();
    resetCoach();
  });

  /** A save with some history, and its bytes: the thing a hidden run must leave alone. */
  function seeded(): { app: FlowApp; raw: string | null } {
    const app = new FlowApp();
    app.save.recordAttempt('seymour-flux');
    app.save.recordClear('yunalesca', 300_000, 20);
    return { app, raw: window.localStorage.getItem(SAVE_KEY) };
  }
  const armGuide = (): void => armFirstRunGuide({ root: document.body, absorbInput: () => undefined });

  it('a win marks the six hints seen for the session only: the save is byte-identical, and the player has still been taught nothing', async () => {
    const { app, raw } = seeded();
    expect(raw).not.toBeNull();
    armGuide();
    const result = await app.flow.runChapter(EXP, { ...QUIET });
    expect(result?.outcome).toBe('victory');
    expect(shownInside, 'inside the run the hints read as shown').toEqual([true]);
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(app.save.seenCoach).toEqual([]);
    expect(TAUGHT.filter((id) => hasSeen(id))).toEqual([]);
    expect(experimentRecord(EXP)).toMatchObject({ attempts: 1, clears: 1 });
    expect(app.save.value.chapters[EXP]).toBeUndefined();
  });

  it('a loss leaves the save byte-identical too, and so does a retry of it', async () => {
    const { app, raw } = seeded();
    armGuide();
    battleOutcome = 'defeat';
    expect((await app.flow.runChapter(EXP, { ...QUIET }))?.outcome).toBe('defeat');
    battleOutcome = 'victory';
    expect((await app.flow.runChapter(EXP, { ...QUIET }))?.outcome).toBe('victory');
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(experimentRecord(EXP)).toMatchObject({ attempts: 2, clears: 1 });
  });

  it('the same battle in a listed chapter still records what the coach showed (so the hidden run is saved by its scope, not by the stand-in)', async () => {
    const { app, raw } = seeded();
    armGuide();
    await app.flow.runChapter('ffx2-leblanc', { ...QUIET });
    expect([...app.save.seenCoach].sort()).toEqual([...TAUGHT].sort());
    expect(window.localStorage.getItem(SAVE_KEY)).not.toBe(raw);
  });

  it('the scope ends with the run, even one that throws: the coach writes the save again afterwards', async () => {
    const { app } = seeded();
    battleThrows = true;
    await expect(app.flow.runChapter(EXP, { ...QUIET })).rejects.toThrow('the battle failed to start');
    expect(experimentRunActive()).toBe(false);
    markSeen('after-the-run');
    expect(app.save.seenCoach).toEqual(['after-the-run']);
  });

  it('a hint the player already saw in a listed chapter stays seen inside the hidden run', async () => {
    const { app } = seeded();
    app.save.markCoachSeen('ffx2-gauge');
    const raw = window.localStorage.getItem(SAVE_KEY);
    await app.flow.runChapter(EXP, { ...QUIET });
    expect(window.localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(app.save.seenCoach).toEqual(['ffx2-gauge']);
  });
});

describe('the coach memory inside an experiment run (the scope)', () => {
  beforeEach(() => resetCoach());
  afterEach(() => resetCoach());

  it('writes nothing to the save, remembers for the session, and forgets when the run ends', () => {
    const save = new SaveStore();
    const end = beginExperimentRun();
    expect(experimentRunActive()).toBe(true);
    markSeen('a-hint');
    expect(save.seenCoach).toEqual([]);
    expect(hasSeen('a-hint')).toBe(true);
    end();
    expect(experimentRunActive()).toBe(false);
    expect(hasSeen('a-hint'), 'outside a run the save is the memory').toBe(false);
    markSeen('another');
    expect(save.seenCoach).toEqual(['another']);
  });

  it('runs nest, and ending one twice ends it once', () => {
    const outer = beginExperimentRun();
    const inner = beginExperimentRun();
    inner();
    inner();
    expect(experimentRunActive(), 'the outer run is still on').toBe(true);
    outer();
    expect(experimentRunActive()).toBe(false);
  });
});
