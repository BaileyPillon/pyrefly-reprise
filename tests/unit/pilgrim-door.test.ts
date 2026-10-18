// @vitest-environment jsdom
/**
 * The door to the hidden Pilgrimage (FFX only, prototype; Bailey, 2026-10-18, decision 122): the word `pilgrim`, typed on chapter select, settles the board on the run's first stop and arms the flow, so the flow's next
 * `runChapter` for that stop is the whole run and not the chapter alone. Nothing changes for a player who never types it.
 *
 * Written against the Yojimbo, Gagazet and Mushroom door suites: the real `Input`, real key events, the real board and title screen. It pins that
 *
 * 1. **the word is safe to type**: P, I, L and G are bound to nothing, R is `r1` and M is `select` (neither moves the board), the title answers `confirm` and `start` only;
 * 2. **it opens, and only it**: the board settles on the first stop on the last letter with the cursor where it was and nothing remembered or written; a wrong letter, a pause or another door's word does not arm;
 * 3. **it overlaps no table word except the one harmless `m`** (`pilgrim` ends where `mushroom` begins), which `chapter-doors.test.ts` forbids inside the table and which is why the row is kept beside it;
 * 4. **the flow takes the arm once**: `GameFlow.armPilgrimage` then `runChapter(first stop)` is the Pilgrimage; any other chapter, a second call, or a fight of the run itself is not.
 *
 * The tests read the word from its one constant, never a literal.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { PILGRIM_DOOR_CHAPTER, PILGRIM_DOOR_WORD } from '../../src/app/screens/frontend/pilgrimDoor.ts';
import { KEY_GAP_MS, WordDoor } from '../../src/app/screens/frontend/secretDoor.ts';
import { GameFlow } from '../../src/app/screens/BattleScreenFlow.ts';
import { Input, type Button } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY } from '../../src/app/experiments/experimentRecords.ts';
import { PILGRIM_KEY } from '../../src/app/pilgrim/runStore.ts';
import { PILGRIM_FIRST_CHAPTER } from '../../src/app/pilgrim/route.ts';
import { audio } from '../../src/audio/index.ts';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';

const WORD = PILGRIM_DOOR_WORD;
const CHAPTER = PILGRIM_DOOR_CHAPTER;

const hostCalls: unknown[] = [];
vi.mock('../../src/app/pilgrim/PilgrimFlow.ts', () => ({ runPilgrimage: vi.fn(async (host: unknown) => { hostCalls.push(host); return null; }) }));

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function typeWord(door: WordDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

describe('the word (pure)', () => {
  it('is one constant: lower-case letters, long enough to be typed by hand, leading to the first stop, a listed FFX chapter no other door opens', () => {
    expect(WORD).toMatch(/^[a-z]{4,}$/);
    expect(CHAPTER).toBe(PILGRIM_FIRST_CHAPTER);
    expect(getChapter(CHAPTER)).toMatchObject({ id: CHAPTER, game: 'ffx', number: 7 });
    expect(getChapter(CHAPTER)?.experimental, 'a listed chapter is no experiment').toBeUndefined();
    expect((CHAPTER_IDS as readonly string[]).includes(CHAPTER)).toBe(true);
    expect(CHAPTER_DOORS.some((d) => d.chapter === CHAPTER), 'no table door opens the first stop').toBe(false);
    expect(RUN_DOORS).toEqual([{ word: WORD, chapter: CHAPTER }]);
  });

  it('opens on the last letter only, in either case, and a wrong first letter typed again starts it over', () => {
    const open = typeWord(new WordDoor(WORD), WORD);
    expect(open.slice(0, -1)).not.toContain('open');
    expect(open.at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), WORD.toUpperCase()).at(-1)).toBe('open');
    expect(typeWord(new WordDoor(WORD), `pi${WORD}`).at(-1)).toBe('open');
  });

  it('a wrong letter resets; a pause over the gap ends the match', () => {
    for (const typo of [WORD.slice(0, -1), 'pilgrin', 'pilgim', 'plgrim', 'ilgrim', 'pilgriim']) expect(typeWord(new WordDoor(WORD), typo), typo).not.toContain('open');
    const door = new WordDoor(WORD);
    typeWord(door, WORD.slice(0, 4), 0, 100);
    expect(typeWord(door, WORD.slice(4), 300 + KEY_GAP_MS + 1, 100)).not.toContain('open');
  });
});

describe('the word against every table word', () => {
  const others = CHAPTER_DOORS.map((d) => d.word);

  it('no word begins with, ends with or contains the other, and the only end-of-one-is-the-start-of-the-other is the single letter m (pilgrim, mushroom)', () => {
    const overlaps: string[] = [];
    for (const other of others) {
      for (const [a, b] of [[WORD, other], [other, WORD]] as const) {
        expect(a.startsWith(b), `${a} begins ${b}`).toBe(false);
        expect(a.endsWith(b), `${a} ends with ${b}`).toBe(false);
        expect(a.includes(b), `${a} contains ${b}`).toBe(false);
        for (let k = 1; k <= Math.min(a.length, b.length); k++) if (a.slice(-k) === b.slice(0, k)) overlaps.push(`${a}>${b}:${a.slice(-k)}`);
      }
    }
    expect(overlaps).toEqual(['pilgrim>mushroom:m']);
  });

  it('typed back to back with each table word in either order, each word finishes exactly once at its own last letter', () => {
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

  it('BoardDoors: the word finishes the first stop on the next frame (next, claimed later letters), and isRun names it; no table word does', () => {
    const doors = new BoardDoors();
    const fed = [...WORD].map((ch, i) => doors.feedKey(ch, i * 100));
    expect(fed.slice(0, -1).every((f) => f.now === null && f.next === null)).toBe(true);
    expect(fed.at(-1)).toMatchObject({ now: null, next: CHAPTER });
    expect(fed[0]!.claimed).toBe(false);
    expect(fed.slice(1).every((f) => f.claimed)).toBe(true);
    expect(doors.isRun(CHAPTER)).toBe(true);
    for (const row of CHAPTER_DOORS) expect(doors.isRun(row.chapter), row.chapter).toBe(false);
    for (const row of CHAPTER_DOORS) {
      const typed = [...row.word].map((ch, i) => new BoardDoors().feedKey(ch, i * 100));
      expect(typed.some((f) => f.next === CHAPTER || f.now === CHAPTER), row.word).toBe(false);
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
  it('P, I, L and G are bound to nothing, R is r1 and M is select', () => {
    for (const k of ['p', 'i', 'l', 'g']) expect(buttonsFor(k), k).toEqual([]);
    expect(buttonsFor('r')).toEqual(['r1']);
    expect(buttonsFor('m')).toEqual(['select']);
    expect(new Set(WORD)).toEqual(new Set(['p', 'i', 'l', 'g', 'r', 'm'])); // ...and that is every distinct letter of the word
  });

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

  it('on the title screen none of the word\'s letters begins the flow, and the keys it does answer still do', () => {
    for (const letter of new Set(WORD)) expect(titleAdvancesOn(letter), `the title started on "${letter}"`).toBe(false);
    for (const key of ['Enter', ' ', 'z', 'e', 'c']) expect(titleAdvancesOn(key), key).toBe(true);
  });
});

// ------------------------------------------------------------------ board

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  picked: string[];
  settled: string[];
  armed: string[];
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
  const armed: string[] = [];
  const screen = new ChapterSelectScreen({ onSelect: (id) => picked.push(id) });
  screen.root = root;
  screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), flow: { armPilgrimage: (id: string) => armed.push(id) } } as unknown as ChapterSelectScreen['app'];
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
  return { screen, root, picked, settled, armed, type, typeWord: (word) => [...word].forEach((ch) => type(ch)) };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  window.localStorage.clear();
  setFf7ExperimentReadyForTests(true);
  hostCalls.length = 0;
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
  forgetBoardChapter();
  vi.restoreAllMocks();
});

describe('the word on chapter select', () => {
  it('settles on the first stop on the last letter and arms the flow once, without moving the cursor, remembering it or writing anything', async () => {
    const rig = mount();
    const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
    const before = stored();
    const selected = rig.screen.snapshot()['selectedIndex'];
    const sfx = vi.spyOn(audio, 'playSfx');
    for (const ch of WORD.slice(0, -1)) {
      rig.type(ch);
      expect(rig.screen.snapshot()['selectedIndex'], `after "${ch}"`).toBe(selected);
      expect(rig.picked, `after "${ch}"`).toEqual([]);
      expect(rig.armed, `after "${ch}"`).toEqual([]);
    }
    rig.type(WORD.at(-1)!);
    await flush();
    expect(rig.picked).toEqual([CHAPTER]);
    expect(rig.settled).toEqual([CHAPTER]);
    expect(rig.armed).toEqual([CHAPTER]);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    expect(lastBoardChapter()).toBeNull();
    expect(sfx.mock.calls.filter(([name]) => name === 'cursor-move' || name === 'confirm')).toEqual([]);
    for (const key of [SAVE_KEY, EXPERIMENTS_KEY, PILGRIM_KEY]) expect(window.localStorage.getItem(key), key).toBeNull();
    expect(stored(), 'the door wrote nothing, under any key').toEqual(before);
  });

  it('opens in capitals too (Shift held)', async () => {
    const rig = mount();
    for (const ch of WORD.toUpperCase()) {
      rig.type('Shift', 'ShiftLeft');
      rig.type(ch);
    }
    await flush();
    expect(rig.armed).toEqual([CHAPTER]);
  });

  it('a wrong letter resets: every typo and half of each table word arms nothing, and a table word still opens its own chapter', async () => {
    for (const wrong of ['pilgrin', 'pilgim', 'ilgrim', WORD.slice(0, -1), ...CHAPTER_DOORS.map((d) => d.word.slice(0, -1)), 'pilgrimage'.slice(0, 5)]) {
      const rig = mount();
      rig.typeWord(wrong);
      await flush();
      expect(rig.armed, wrong).toEqual([]);
    }
    const rig = mount();
    rig.typeWord(CHAPTER_DOORS.find((d) => d.word === 'yojimbo')!.word);
    await flush();
    expect(rig.picked).toEqual(['mirror-aeons']);
    expect(rig.armed).toEqual([]);
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
    expect(rig.armed).toEqual([]);
    typeAll(WORD);
    await flush();
    expect(rig.armed).toEqual([CHAPTER]);
  });
});

// -------------------------------------------------------------------- the flow

function flowWithStubApp(): GameFlow {
  const app = { current: null, save: new SaveStore(), uiRoot: document.body, replace: () => Promise.resolve(), goto: () => Promise.resolve(), fade: () => Promise.resolve() };
  return new GameFlow(app as unknown as ConstructorParameters<typeof GameFlow>[0]);
}

describe('the flow takes the arm once', () => {
  it('armPilgrimage then runChapter for that stop hands the run a host; the arm is spent by the call', async () => {
    const flow = flowWithStubApp();
    flow.armPilgrimage(CHAPTER);
    await flow.runChapter(CHAPTER, {});
    expect(hostCalls).toHaveLength(1);
    const host = hostCalls[0] as { app: unknown; show: unknown; fight: unknown; away: () => boolean; claim: () => void; setStep: (s: string) => void };
    expect(typeof host.show).toBe('function');
    expect(typeof host.fight).toBe('function');
    expect(host.away()).toBe(false);
    host.setStep('pilgrimage');
    expect(flow.step).toBe('pilgrimage');
  });

  it('a different chapter spends the arm and starts nothing of the run (so a door that opened and never ran cannot hijack a later chapter)', async () => {
    const flow = flowWithStubApp();
    const armed = (): unknown => (flow as unknown as { pilgrimArmed: unknown }).pilgrimArmed;
    flow.armPilgrimage(CHAPTER);
    expect(armed()).toBe(CHAPTER);
    await flow.runChapter('not-a-chapter' as never, {}); // some other chapter runs
    expect(armed()).toBeNull();
    expect(hostCalls).toHaveLength(0);
  });
});
