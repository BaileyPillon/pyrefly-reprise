// @vitest-environment jsdom
/**
 * **THE TWO HIDDEN 3D CHAPTERS ARE DESKTOP-ONLY** (driver decision 219q, 2026-11-03; FFX-2 only for the chapters, shared door plumbing for both games).
 *
 * The 3D Bahamut (`yrp`, hidden chapter 31) and the Wind Waker chapter (`waker`, 32) are not staged for a phone (r74.md section 7 question 6: the Wind Waker is expected to miss the phone budgets, and the 3D Bahamut's
 * models are 141 MB). On the PHONE TIER (`ArtDevice.deviceClass() === 'phone'`: an upright window under 600 px, or a coarse pointer on a screen whose short side is under 600 px, or `?arttier=phone`) their doors
 * refuse with the board's existing refusal for a shut door (`ChapterDoor.gate`, read when the door opens, `BoardDoors.isOpen`): the word is typed, nothing opens, nothing is shown or said, and the phone's long-press
 * field stays as it was, so the word looks like any other. No screen, no word on screen, no sound. Pins:
 *
 * 1. `BoardDoors.isOpen`: on the phone tier both are shut, on every other tier both are open, and EVERY other door answers the same on the phone as on the desktop;
 * 2. the keyboard on a board: on the phone tier `yrp` and `waker` open nothing and leave the board usable (the cursor moves, another door's word opens right after); on the desktop both open their chapter;
 * 3. the phone's long-press field: `yrp` and `waker` typed there open nothing and the field stays up as for any wrong word; every other door's word opens as before;
 * 4. the decision is read when the door opens (a window that is a phone at the word's last letter refuses; one that is wide again opens), so a rotated phone is judged as it is.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { BoardDoors, CHAPTER_DOORS, RUN_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { HOLD_MS } from '../../src/app/screens/frontend/doorField.ts';
import { WINDWAKER_DOOR_CHAPTER, WINDWAKER_DOOR_WORD } from '../../src/app/screens/frontend/windwakerDoor.ts';
import { YRP_DOOR_CHAPTER, YRP_DOOR_WORD } from '../../src/app/screens/frontend/yrpDoor.ts';
import { ANIME_DOOR_CHAPTER, ANIME_DOOR_WORD } from '../../src/app/screens/frontend/animeDoor.ts';
import { WENDIGO_DOOR_CHAPTER, WENDIGO_DOOR_WORD } from '../../src/app/screens/frontend/wendigoDoor.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { audio } from '../../src/audio/index.ts';
import { setArtTier } from '../../src/engine/ArtDevice.ts';
import type { ChapterId } from '../../src/data/encounters.ts';
import { DOOR_LOOP_TEST_TIMEOUT_MS } from './helpers/doorWords.ts';

const DESKTOP_ONLY = [
  { word: YRP_DOOR_WORD, chapter: YRP_DOOR_CHAPTER },
  { word: WINDWAKER_DOOR_WORD, chapter: WINDWAKER_DOOR_CHAPTER },
  { word: ANIME_DOOR_WORD, chapter: ANIME_DOOR_CHAPTER }, // the third, 2026-11-06 (the anime chapter's textures are the Wind Waker chapter's and its girls' own)
  { word: WENDIGO_DOOR_WORD, chapter: WENDIGO_DOOR_CHAPTER }, // the fourth, 2026-11-06 (FFX; the Meshy tech demo: 4k textures on every figure)
] as const;
const DESKTOP_ONLY_IDS: readonly string[] = DESKTOP_ONLY.map((d) => d.chapter);
/** Every other door of the table, the FF7 secret door aside (its word is matched by the visit's `SecretDoor`, a pad and tap sequence the board suites own). */
const OTHERS = CHAPTER_DOORS.filter((d) => !DESKTOP_ONLY_IDS.includes(d.chapter) && d.secret !== true);

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);
let clock = 0;
const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  input: Input;
  label: HTMLElement;
  picked: string[];
  settled: string[];
  key(key: string): void;
  typeWord(word: string): void;
  longPress(): void;
  field(): HTMLInputElement | null;
  typeIn(letters: string): void;
  set(text: string): void;
  index(): number;
}
let rigs: Rig[] = [];

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
  screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), input } as unknown as ChapterSelectScreen['app'];
  screen.enter();
  void screen.done.then((id) => settled.push(String(id)));
  const label = root.querySelector<HTMLElement>('.fe-cselect__eyebrow')!;
  const frame = (): void => {
    clock += 100;
    screen.handleInput(input.update(clock));
    input.endFrame();
  };
  const pointer = (type: string): void => {
    const Ctor = typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
    label.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, clientX: 24, clientY: 18, button: 0, pointerId: 1 } as PointerEventInit));
  };
  const rig: Rig = {
    screen, root, input, label, picked, settled,
    key(key) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code: codeOf(key), bubbles: true, cancelable: true }));
      frame();
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code: codeOf(key), bubbles: true }));
    },
    typeWord: (word) => [...word].forEach((ch) => rig.key(ch)),
    longPress() {
      pointer('pointerdown');
      vi.advanceTimersByTime(HOLD_MS);
      pointer('pointerup');
    },
    field: () => root.querySelector<HTMLInputElement>('.fe-doorfield__input'),
    set(text) {
      const f = rig.field()!;
      f.value = text;
      f.dispatchEvent(new Event('input', { bubbles: true }));
    },
    typeIn(letters) {
      for (const ch of letters) rig.set(rig.field()!.value + ch);
    },
    index: () => rig.screen.snapshot()['selectedIndex'] as number,
  };
  rigs.push(rig);
  return rig;
}

beforeEach(() => {
  vi.useFakeTimers();
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
  setArtTier(null);
  setFf7ExperimentReadyForTests(null);
  forgetBoardChapter();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('BoardDoors.isOpen: the phone tier shuts the three 3D chapters and nothing else', () => {
  it('the three doors are the table\'s rows, and all carry a gate (the table\'s own way to shut a door)', () => {
    for (const d of DESKTOP_ONLY) {
      const row = CHAPTER_DOORS.find((r) => r.word === d.word);
      expect(row?.chapter, d.word).toBe(d.chapter);
      expect(typeof row?.gate, `${d.word} has a gate`).toBe('function');
    }
    expect(DESKTOP_ONLY_IDS).toEqual(['exp-yrp-3d', 'exp-windwaker', 'exp-anime', 'wendigo']);
  });

  it('phone tier: both shut; every other tier (low, mid, high, none): both open', () => {
    const doors = new BoardDoors();
    setArtTier('phone');
    for (const d of DESKTOP_ONLY) expect(doors.isOpen(d.chapter), `${d.chapter} on a phone`).toBe(false);
    for (const tier of ['low', 'mid', 'high', null] as const) {
      setArtTier(tier);
      for (const d of DESKTOP_ONLY) expect(doors.isOpen(d.chapter), `${d.chapter} on ${String(tier)}`).toBe(true);
    }
  });

  it('every other door, the run door and an id with no door at all answer the same on a phone as on a desktop', () => {
    const doors = new BoardDoors();
    const ids = [...CHAPTER_DOORS, ...RUN_DOORS].map((d) => d.chapter).filter((id) => !DESKTOP_ONLY_IDS.includes(id));
    expect(ids.length).toBe(CHAPTER_DOORS.length + RUN_DOORS.length - DESKTOP_ONLY.length);
    setArtTier('high');
    const desktop = ids.map((id) => doors.isOpen(id));
    setArtTier('phone');
    const phone = ids.map((id) => doors.isOpen(id));
    expect(phone).toEqual(desktop);
    expect(phone.every((open) => open)).toBe(true); // FF7's switch is on in this file, so even its door is open: the gate of the two 3D chapters is not shared with it
    expect(doors.isOpen('chapter-with-no-door' as ChapterId)).toBe(true);
    setFf7ExperimentReadyForTests(false);
    expect(doors.isOpen('ff7-guard-scorpion'), 'FF7\'s own switch still shuts FF7\'s door on the phone').toBe(false);
    setArtTier('high');
    expect(doors.isOpen('ff7-guard-scorpion'), 'and on the desktop').toBe(false);
  });

  it('the answer is read when the door opens, never earlier: the same BoardDoors follows a window that turns into a phone and back', () => {
    const doors = new BoardDoors();
    const id = YRP_DOOR_CHAPTER;
    setArtTier('high');
    expect(doors.isOpen(id)).toBe(true);
    setArtTier('phone');
    expect(doors.isOpen(id)).toBe(false);
    setArtTier('high');
    expect(doors.isOpen(id)).toBe(true);
  });
});

describe('the keyboard on the board', () => {
  for (const d of DESKTOP_ONLY) {
    it(`${d.word}: on the phone tier the word opens nothing, shows nothing, says nothing and leaves the board usable; on a desktop it opens ${d.chapter}`, async () => {
      setArtTier('phone');
      const sfx = vi.spyOn(audio, 'playSfx');
      const rig = mount();
      rig.key(d.word[0]!); // the first letter is the board's own press (W is the `up` button and moves the cursor one step, as the first letters of other words do); what the REST of the word does is the question
      const html = rig.root.innerHTML;
      const index = rig.index();
      const sounds = sfx.mock.calls.length;
      rig.typeWord(d.word.slice(1));
      await flush();
      expect(rig.picked, 'nothing opened').toEqual([]);
      expect(rig.settled, 'the board did not settle').toEqual([]);
      expect(rig.root.innerHTML, 'nothing was drawn or written on the board').toBe(html);
      expect(sfx.mock.calls.length, 'no sound').toBe(sounds);
      expect(rig.index(), 'the board did not move for the later letters of the word').toBe(index);
      expect(window.localStorage.length, 'nothing was stored').toBe(0);
      // the board is not stuck behind the refused word (it is not shut, as the board is for a door that opens): a word that does open opens right after
      rig.typeWord(OTHERS[0]!.word);
      await flush();
      expect(rig.picked, 'the next door still opens').toEqual([OTHERS[0]!.chapter]);

      setArtTier('high');
      const wide = mount();
      wide.typeWord(d.word);
      await flush();
      expect(wide.picked, 'on the desktop the same word opens it').toEqual([d.chapter]);
      expect(wide.settled).toEqual([d.chapter]);
    });
  }

  it('every other plain door opens on the phone tier, each by its own word, exactly as on a desktop', async () => {
    expect(OTHERS.length).toBeGreaterThanOrEqual(12);
    for (const tier of ['phone', 'high'] as const) {
      for (const d of OTHERS) {
        setArtTier(tier);
        const rig = mount();
        rig.typeWord(d.word);
        await flush();
        expect(rig.picked, `${d.word} on ${tier}`).toEqual([d.chapter]);
      }
    }
  }, 2 * DOOR_LOOP_TEST_TIMEOUT_MS); // a real board per door on each of the two tiers: twice the door-scaled allowance (`helpers/doorWords.ts`)

  it('a window that is a phone when the word finishes refuses; the same word on a wide window opens (the tier is read at the last letter)', async () => {
    const rig = mount();
    setArtTier('phone');
    rig.typeWord(YRP_DOOR_WORD);
    await flush();
    expect(rig.picked).toEqual([]);
    setArtTier('high');
    rig.typeWord(YRP_DOOR_WORD);
    await flush();
    expect(rig.picked).toEqual([YRP_DOOR_CHAPTER]);
  });
});

describe('the phone\'s long-press field', () => {
  for (const d of DESKTOP_ONLY) {
    it(`${d.word}: typed in the field on the phone tier it opens nothing and the field stays up as for any wrong word; the next word typed there opens its door`, async () => {
      setArtTier('phone');
      const rig = mount();
      rig.longPress();
      expect(rig.field()).not.toBeNull();
      rig.typeIn(d.word);
      await flush();
      expect(rig.picked, 'nothing opened').toEqual([]);
      expect(rig.settled).toEqual([]);
      expect(rig.field(), 'the field is still up, as after a word that is no door').not.toBeNull();
      expect(rig.input.keyboardClaimed, 'and still owns the keyboard').toBe(true);
      // a word that does open: the field is cleared the way a player would, and the next door opens as on a desktop
      rig.set('');
      rig.typeIn(OTHERS[0]!.word);
      await flush();
      expect(rig.picked).toEqual([OTHERS[0]!.chapter]);
      expect(rig.field(), 'the field went with that door').toBeNull();
    });

    it(`${d.word}: typed in the field on a desktop-sized window it opens ${d.chapter} (the control)`, async () => {
      setArtTier('high');
      const rig = mount();
      rig.longPress();
      rig.typeIn(d.word);
      await flush();
      expect(rig.picked).toEqual([d.chapter]);
      expect(rig.field()).toBeNull();
    });
  }

  it('every other door word opens in the field on the phone tier', async () => {
    setArtTier('phone');
    for (const d of OTHERS) {
      const rig = mount();
      rig.longPress();
      rig.typeIn(d.word);
      await flush();
      expect(rig.picked, d.word).toEqual([d.chapter]);
    }
  }, DOOR_LOOP_TEST_TIMEOUT_MS); // one real board per door (`helpers/doorWords.ts`)
});

describe('the record', () => {
  it('the two door notes say the phone refuses, and the door table says why', async () => {
    const { readFileSync } = await import('node:fs');
    const read = (p: string): string => readFileSync(p, 'utf8');
    for (const [file, label] of [['src/app/screens/frontend/yrpDoor.ts', 'yrp'], ['src/app/screens/frontend/windwakerDoor.ts', 'waker'], ['src/app/screens/frontend/animeDoor.ts', 'gear'], ['src/app/screens/frontend/wendigoDoor.ts', 'wendigo']] as const) {
      expect(read(file), label).toMatch(/desktop-only/i);
    }
    expect(read('src/app/screens/frontend/chapterDoors.ts')).toMatch(/219q/);
  });
});
