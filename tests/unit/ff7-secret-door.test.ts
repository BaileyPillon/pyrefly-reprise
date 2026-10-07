// @vitest-environment jsdom
/**
 * The secret door to the hidden FF7 experiment (Guard Scorpion).
 *
 * Bailey, 2026-09-27: "also the secret door to guard scorpion i really like
 * your ideas there i will go with it" (option A of
 * `docs/plans/ff7-guard-scorpion-architecture.md` §2.2): type L-I-M-I-T on
 * chapter select; tap the "Chapter select" label seven times within about 4 s;
 * or L1 R1 L1 R1 Select on a gamepad. None of it moves the cursor or starts a
 * chapter, nothing visible changes, and while `FF7_EXPERIMENT_READY` is off the
 * door does nothing at all.
 *
 * The matcher is pure (first block); the board is driven through the real
 * `Input` with real key and click events (second block), as `chapter-select-c.test.ts` does.
 * Game case: FF7 only (the door); the board is shared plumbing and must not change.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import {
  KEY_GAP_MS,
  PAD_GAP_MS,
  SecretDoor,
  TAP_COUNT,
  TAP_WINDOW_MS,
} from '../../src/app/screens/frontend/secretDoor.ts';
import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, lastBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests, FF7_EXPERIMENT_READY } from '../../src/app/experiments/ff7Flag.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function typeWord(door: SecretDoor, word: string, start = 0, step = 100): Array<'open' | null> {
  return [...word].map((ch, i) => door.feedKey(ch, start + i * step));
}

describe('the door matcher (pure)', () => {
  it('opens on L-I-M-I-T, in either case, and only on the last letter', () => {
    expect(typeWord(new SecretDoor(), 'limit')).toEqual([null, null, null, null, 'open']);
    expect(typeWord(new SecretDoor(), 'LIMIT').at(-1)).toBe('open');
  });

  it('ignores the typing aids (Shift for the capitals, CapsLock), and a key the board answers (an arrow, Enter, Escape) ends the word', () => {
    const door = new SecretDoor();
    const feed = ['Shift', 'l', 'Shift', 'i', 'CapsLock', 'm', 'i', 'Shift', 't'];
    expect(feed.map((k, i) => door.feedKey(k, i * 50)).at(-1)).toBe('open');
    for (const key of ['ArrowLeft', 'ArrowRight', 'Enter', 'Escape']) {
      const broken = new SecretDoor(); // release 39.3, F393-04: the arrow that moves the cursor must not also be a pause in the word
      expect(['l', 'i', 'm', key, 'i', 't'].map((k, i) => broken.feedKey(k, i * 50)), key).not.toContain('open');
    }
  });

  it('resets on a wrong letter, and a wrong L starts it again', () => {
    expect(typeWord(new SecretDoor(), 'limxt')).not.toContain('open');
    expect(typeWord(new SecretDoor(), 'lilimit').at(-1)).toBe('open');
    expect(typeWord(new SecretDoor(), 'llimit').at(-1)).toBe('open');
  });

  it('resets when a letter comes more than KEY_GAP_MS after the last', () => {
    const door = new SecretDoor();
    expect(typeWord(door, 'lim', 0, 100)).not.toContain('open');
    expect(door.feedKey('i', 200 + KEY_GAP_MS + 1)).toBeNull();
    expect(door.feedKey('t', 200 + KEY_GAP_MS + 50)).toBeNull();
    expect(typeWord(door, 'limit', 10_000, KEY_GAP_MS).at(-1)).toBe('open');
  });

  it(`opens on ${TAP_COUNT} taps within ${TAP_WINDOW_MS} ms, never on ${TAP_COUNT - 1}`, () => {
    const six = new SecretDoor();
    expect(Array.from({ length: TAP_COUNT - 1 }, (_, i) => six.feedTap(i * 300))).not.toContain('open');
    const seven = new SecretDoor();
    const taps = Array.from({ length: TAP_COUNT }, (_, i) => seven.feedTap(i * 300));
    expect(taps.at(-1)).toBe('open');
    expect(taps.slice(0, -1)).not.toContain('open');
  });

  it('does not open on seven taps spread wider than the window', () => {
    const door = new SecretDoor();
    const spacing = TAP_WINDOW_MS / (TAP_COUNT - 1) + 50;
    expect(Array.from({ length: TAP_COUNT * 2 }, (_, i) => door.feedTap(i * spacing))).not.toContain('open');
  });

  it('opens on L1 R1 L1 R1 Select, and any other button resets it', () => {
    const door = new SecretDoor();
    const seq = ['l1', 'r1', 'l1', 'r1', 'select'];
    expect(seq.map((b, i) => door.feedButton(b, i * 100)).at(-1)).toBe('open');
    const broken = new SecretDoor();
    expect(['l1', 'r1', 'left', 'l1', 'r1', 'select'].map((b, i) => broken.feedButton(b, i * 100))).not.toContain('open');
    const slow = new SecretDoor();
    expect(seq.map((b, i) => slow.feedButton(b, i * (PAD_GAP_MS + 1)))).not.toContain('open');
  });

  it('never opens from any board navigation: arrows, WASD, confirm, cancel, the shoulder buttons alone', () => {
    const door = new SecretDoor();
    const keys = ['w', 'a', 's', 'd', 'z', 'x', 'q', 'e', 'c', 'v', 'r', 'f', ' ', 'ArrowLeft', 'Enter', 'Escape', 'Tab'];
    const buttons = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'triangle', 'start', 'l1', 'r1', 'select'];
    let t = 0;
    for (let round = 0; round < 20; round++) {
      for (const k of keys) expect(door.feedKey(k, (t += 40))).toBeNull();
      for (const b of buttons) expect(door.feedButton(b, (t += 40))).toBeNull();
    }
  });
});

// ------------------------------------------------------------------ board

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  picked: string[];
  settled: string[];
  type(key: string, code: string): void;
  tap(el: Element): void;
}

let rigs: Array<{ screen: ChapterSelectScreen; input: Input; root: HTMLElement }> = [];
let clock = 0;

function mount(): Rig {
  const save = new SaveStore();
  const root = document.createElement('div');
  document.body.appendChild(root);
  const input = new Input({ pointerRoot: root });
  input.attach();
  forgetBoardChapter();
  const picked: string[] = [];
  const settled: string[] = [];
  const screen = new ChapterSelectScreen({ onSelect: (id) => picked.push(id) });
  screen.root = root;
  screen.app = { save, fade: () => Promise.resolve() } as unknown as ChapterSelectScreen['app'];
  screen.enter();
  void screen.done.then((id) => settled.push(String(id)));
  const frame = (): void => {
    clock += 100;
    screen.handleInput(input.update(clock));
    input.endFrame();
  };
  rigs.push({ screen, input, root });
  return {
    screen,
    root,
    picked,
    settled,
    type(key, code) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
      frame();
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
    },
    tap(el) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      frame();
    },
  };
}

const LIMIT: Array<[string, string]> = [['l', 'KeyL'], ['i', 'KeyI'], ['m', 'KeyM'], ['i', 'KeyI'], ['t', 'KeyT']];
const PAD_BY_KEYS: Array<[string, string]> = [['f', 'KeyF'], ['r', 'KeyR'], ['f', 'KeyF'], ['r', 'KeyR'], ['m', 'KeyM']];

afterEach(() => {
  for (const { screen, input, root } of rigs) {
    screen.exit();
    input.detach();
    root.remove();
  }
  rigs = [];
  setFf7ExperimentReadyForTests(null);
  forgetBoardChapter();
});

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('the door on chapter select', () => {
  it('ships open since the FF7 engine, HUD and stage are wired: FF7_EXPERIMENT_READY is true (D-237 to D-240)', () => {
    expect(FF7_EXPERIMENT_READY).toBe(true);
  });

  it('with the switch off, LIMIT, seven taps and the pad sequence change nothing at all', async () => {
    setFf7ExperimentReadyForTests(false);
    const rig = mount();
    const before = { snap: rig.screen.snapshot(), html: rig.root.innerHTML };
    for (const [key, code] of LIMIT) rig.type(key, code);
    const eyebrow = rig.root.querySelector('.fe-cselect__eyebrow')!;
    for (let i = 0; i < 7; i++) rig.tap(eyebrow);
    for (const [key, code] of PAD_BY_KEYS) rig.type(key, code);
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.settled).toEqual([]);
    expect(rig.screen.snapshot()).toEqual(before.snap);
    expect(rig.root.innerHTML).toBe(before.html);
  });

  it('with the switch on, LIMIT settles on the hidden chapter without moving the cursor or remembering it', async () => {
    setFf7ExperimentReadyForTests(true);
    const rig = mount();
    const selected = rig.screen.snapshot()['selectedIndex'];
    for (const [key, code] of LIMIT.slice(0, 4)) {
      rig.type(key, code);
      expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    }
    expect(rig.picked).toEqual([]);
    rig.type('t', 'KeyT');
    await flush();
    expect(rig.picked).toEqual(['ff7-guard-scorpion']);
    expect(rig.settled).toEqual(['ff7-guard-scorpion']);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    expect(lastBoardChapter()).toBeNull();
  });

  it('with the switch on, seven taps on the label open it; six do not', async () => {
    setFf7ExperimentReadyForTests(true);
    const rig = mount();
    const eyebrow = rig.root.querySelector('.fe-cselect__eyebrow')!;
    for (let i = 0; i < 6; i++) rig.tap(eyebrow);
    await flush();
    expect(rig.settled).toEqual([]);
    rig.tap(eyebrow);
    await flush();
    expect(rig.settled).toEqual(['ff7-guard-scorpion']);
  });

  it('with the switch on, L1 R1 L1 R1 Select (F R F R M on a keyboard) opens it', async () => {
    setFf7ExperimentReadyForTests(true);
    const rig = mount();
    const selected = rig.screen.snapshot()['selectedIndex'];
    for (const [key, code] of PAD_BY_KEYS) rig.type(key, code);
    await flush();
    expect(rig.settled).toEqual(['ff7-guard-scorpion']);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
  });

  it('keeps the board working: arrows still move the cursor, and the door never answers them', async () => {
    setFf7ExperimentReadyForTests(true);
    const rig = mount();
    const selected = rig.screen.snapshot()['selectedIndex'];
    rig.type('ArrowRight', 'ArrowRight');
    expect(rig.screen.snapshot()['selectedIndex']).not.toBe(selected);
    await flush();
    expect(rig.settled).toEqual([]);
  });

  it('gives the label no data-action (no pointer, no hint switch) and styles it cursor: default', () => {
    const rig = mount();
    const eyebrow = rig.root.querySelector('.fe-cselect__eyebrow')!;
    expect(eyebrow.hasAttribute('data-action')).toBe(false);
    const css = readFileSync(join(ROOT, 'src/app/screens/frontend/chapter-select-c.css'), 'utf8');
    const rule = /\.fe-cselect__eyebrow\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/cursor:\s*default/);
    expect(rule).toMatch(/pointer-events:\s*auto/);
    expect(rule).toMatch(/touch-action:\s*manipulation/);
  });
});
