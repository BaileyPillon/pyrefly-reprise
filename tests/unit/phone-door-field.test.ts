// @vitest-environment jsdom
/**
 * The phone's door field (release candidate r50-rc; shared plumbing, **both games**): Bailey could not open the hidden chapters on his phone, because the board's doors only listen for physical key presses
 * and the one tap door, FF7's seven taps on the "Chapter select" label, cannot carry a word. A **long press** (600 ms) on that label now puts up one small text field; what is typed in it feeds the doors'
 * own matcher (`BoardDoors`, the table `CHAPTER_DOORS`); Enter, a blur or Escape close it. Nothing is shown before the press and nothing is left after it.
 *
 * Written against the board's other door suites (`gagazet-door.test.ts`, `ff7-secret-door.test.ts`): the real `ChapterSelectScreen`, the real `Input`, real pointer, input and key events. It pins that
 *
 * 1. **nothing is drawn until asked for**: no field, no extra element, the label as before; a press shorter than 600 ms, a press that drifts and a cancelled press put nothing up;
 * 2. **a long press puts the field up and the release asks for the keyboard** (the field is focused on the release: a phone shows a keyboard only from a gesture), and it is a plain text field built not to
 *    capitalise, correct, complete or remember (the attributes), 18px type or more (the style sheet: a phone zooms into anything smaller);
 * 3. **every door's word, read from the table and never a literal, opens its chapter when typed in the field**, in either case, with any pause between letters, and the field is gone when it does; a word added to
 *    the table works here with no change;
 * 4. **Enter, a blur and Escape close it**; a wrong word opens nothing, a half word is not remembered by the next long press, and the board is byte for byte what it was (the markup, the storage, the sounds);
 * 5. **while it is up it owns the keyboard**: the Z of "gagazet" (CONFIRM) and the A of "angra" (left) press no board button and do not reach the visit's own door matcher; the control: the same keys with the field
 *    closed move the cursor, open the card and open the door;
 * 6. **it does not disturb the label's taps or the keyboard**: seven taps still open FF7's door, the click a long press leaves is never the seventh tap and a long press that leaves none does not swallow the next
 *    tap, a short press is a tap, and the typed words on a keyboard work as before; leaving the board takes the field and its claim with it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { CHAPTER_DOORS } from '../../src/app/screens/frontend/chapterDoors.ts';
import { HOLD_MS, HOLD_SLOP_PX, SETTLE_MS } from '../../src/app/screens/frontend/doorField.ts';
import { KEY_GAP_MS, TAP_COUNT } from '../../src/app/screens/frontend/secretDoor.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { audio } from '../../src/audio/index.ts';

const ROOT = process.cwd();

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  input: Input;
  label: HTMLElement;
  picked: string[];
  settled: string[];
  cancelled: number;
  frame(): void;
  key(key: string, code?: string): void;
  down(init?: Record<string, unknown>): void;
  move(dx: number, dy: number): void;
  up(): void;
  cancelPointer(): void;
  /** A long press, let go: the field is up and focused. */
  longPress(): void;
  tap(): void;
  field(): HTMLInputElement | null;
  /** What a phone's keyboard does to the field: the text becomes `text`, and the `input` event fires. */
  set(text: string): void;
  /** One letter appended, the way a keyboard types it. */
  typeIn(letters: string, pauseMs?: number): void;
}

let clock = 0;
let rigs: Rig[] = [];

const codeOf = (key: string): string => (/^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key === ' ' ? 'Space' : key);

function pointer(el: Element, type: string, init: Record<string, unknown> = {}): void {
  const Ctor = typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
  el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, clientX: 24, clientY: 18, button: 0, pointerId: 1, ...init } as PointerEventInit));
}

function mount(opts: { withInput?: boolean } = {}): Rig {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const input = new Input({ pointerRoot: root });
  input.attach();
  forgetBoardChapter();
  const picked: string[] = [];
  const settled: string[] = [];
  const screen = new ChapterSelectScreen({ onSelect: (id) => picked.push(id), onCancel: () => { rig.cancelled += 1; } });
  screen.root = root;
  screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), ...(opts.withInput === false ? {} : { input }) } as unknown as ChapterSelectScreen['app'];
  screen.enter();
  void screen.done.then((id) => settled.push(String(id)));
  const label = root.querySelector<HTMLElement>('.fe-cselect__eyebrow')!;
  const frame = (): void => {
    clock += 100;
    screen.handleInput(input.update(clock));
    input.endFrame();
  };
  const rig: Rig = {
    screen, root, input, label, picked, settled, cancelled: 0, frame,
    key(key, code = codeOf(key)) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }));
      frame();
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
    },
    down: (init) => pointer(label, 'pointerdown', init),
    move: (dx, dy) => pointer(label, 'pointermove', { clientX: 24 + dx, clientY: 18 + dy }),
    up: () => pointer(label, 'pointerup'),
    cancelPointer: () => pointer(label, 'pointercancel'),
    longPress() {
      pointer(label, 'pointerdown');
      vi.advanceTimersByTime(HOLD_MS);
      pointer(label, 'pointerup');
    },
    tap() {
      pointer(label, 'pointerdown');
      vi.advanceTimersByTime(80);
      pointer(label, 'pointerup');
      label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      frame();
    },
    field: () => root.querySelector<HTMLInputElement>('.fe-doorfield__input'),
    set(text) {
      const f = rig.field()!;
      f.value = text;
      f.dispatchEvent(new Event('input', { bubbles: true }));
    },
    typeIn(letters, pauseMs = 0) {
      for (const ch of letters) {
        rig.set(rig.field()!.value + ch);
        if (pauseMs) vi.advanceTimersByTime(pauseMs);
      }
    },
  };
  rigs.push(rig);
  return rig;
}

const stored = (): Record<string, string | null> => Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) ?? '').map((k) => [k, window.localStorage.getItem(k)]));
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
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
  setFf7ExperimentReadyForTests(null);
  forgetBoardChapter();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('nothing is drawn until asked for', () => {
  it('the board has no field and no extra element, and the label has no data-action', () => {
    const rig = mount();
    expect(rig.root.querySelector('.fe-doorfield')).toBeNull();
    expect(rig.root.querySelector('input')).toBeNull();
    expect(rig.label.hasAttribute('data-action')).toBe(false);
    expect(rig.label.textContent?.trim()).toBe('Chapter select');
  });

  it('a press shorter than the hold, a press that drifts and a cancelled press put nothing up', () => {
    const rig = mount();
    rig.down();
    vi.advanceTimersByTime(HOLD_MS - 1);
    expect(rig.field()).toBeNull();
    rig.up();
    vi.advanceTimersByTime(HOLD_MS * 2);
    expect(rig.field(), 'let go before the hold').toBeNull();

    rig.down();
    vi.advanceTimersByTime(200);
    rig.move(HOLD_SLOP_PX + 1, 0);
    vi.advanceTimersByTime(HOLD_MS * 2);
    expect(rig.field(), 'a drift past the slop is a scroll, not a press').toBeNull();
    rig.up();

    rig.down();
    vi.advanceTimersByTime(HOLD_MS - 100);
    rig.cancelPointer();
    vi.advanceTimersByTime(HOLD_MS * 2);
    expect(rig.field(), 'the browser took the press').toBeNull();
  });

  it('a drift inside the slop does not cancel the press, and the hold is 600 ms', () => {
    expect(HOLD_MS).toBe(600);
    const rig = mount();
    rig.down();
    vi.advanceTimersByTime(300);
    rig.move(HOLD_SLOP_PX - 2, 0);
    vi.advanceTimersByTime(HOLD_MS - 300);
    expect(rig.field()).not.toBeNull();
  });
});

describe('a long press puts the field up and the release asks for the keyboard', () => {
  it('shows one text field at the hold, focuses it on the release, and is built not to capitalise, correct or remember', () => {
    const rig = mount();
    rig.down();
    vi.advanceTimersByTime(HOLD_MS);
    const field = rig.field()!;
    expect(field, 'at the hold, finger still down').not.toBeNull();
    expect(rig.root.querySelectorAll('.fe-doorfield')).toHaveLength(1);
    expect(document.activeElement, 'a phone shows a keyboard only from a gesture: not yet').not.toBe(field);
    rig.up();
    expect(document.activeElement, 'on the release').toBe(field);
    expect(field.type).toBe('text');
    expect(field.getAttribute('autocapitalize')).toBe('off');
    expect(field.getAttribute('autocorrect')).toBe('off');
    expect(field.getAttribute('autocomplete')).toBe('off');
    expect(field.getAttribute('spellcheck')).toBe('false');
    expect(field.getAttribute('enterkeyhint')).toBe('done');
    expect(field.value).toBe('');
    expect(field.placeholder, 'nothing is shown in it').toBe('');
    expect(rig.root.querySelector('.fe-doorfield')!.textContent).toBe('');
  });

  it("the mouse events a phone sends after the release (a mousedown that takes the focus away, then the click) do not close it, and the click gives the focus back", () => {
    const rig = mount();
    rig.longPress();
    const field = rig.field()!;
    field.blur(); // the browser's compatibility mousedown on the label: the label is not focusable, so the focus goes to the page
    expect(rig.field(), 'a blur in the settling time is the phone, not the player').toBe(field);
    expect(document.activeElement).not.toBe(field);
    rig.label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); // the click that follows: a gesture, taken by the field
    expect(document.activeElement, 'the click puts the focus (and so the keyboard) back').toBe(field);
    expect(rig.picked).toEqual([]);
    vi.advanceTimersByTime(SETTLE_MS + 100);
    field.blur();
    expect(rig.field(), 'a blur after the settling time is the player').toBeNull();
  });

  it('a second long press does not stack a second field', () => {
    const rig = mount();
    rig.longPress();
    rig.longPress();
    expect(rig.root.querySelectorAll('.fe-doorfield')).toHaveLength(1);
  });

  it('is an Ink & Gold slab with a 16px-or-more input (the style sheet), placed by the same units as the label', () => {
    const css = readFileSync(join(ROOT, 'src/app/screens/frontend/chapter-select-c.css'), 'utf8');
    const slab = /\.fe-doorfield\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(slab).toMatch(/background:\s*var\(--ig-ink\)/); // opaque ink: the label under it must not show through the typed letters
    expect(slab).toMatch(/border-left:[^;]*var\(--ig-gold\)/);
    expect(slab).toMatch(/border:\s*1px solid rgba\(227, 185, 74, 0\.5\)/); // a hairline of the label's gold: the empty field reads as a field on the dark board
    const input = /\.fe-doorfield__input\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(input).toMatch(/font-family:\s*var\(--ig-font-display\)/);
    expect(input).toMatch(/font-size:\s*max\(18px,/); // a phone zooms the page into a field set under 16px
    expect(input).toMatch(/caret-color:\s*var\(--ig-gold\)/);
    const label = /\.fe-cselect__eyebrow\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(label).toMatch(/user-select:\s*none/); // a long press must not select the label
    expect(label).toMatch(/-webkit-touch-callout:\s*none/);
  });
});

describe('every door word opens its chapter when typed in the field', () => {
  it('reads the words from the table: nothing but the table names a word here', () => {
    expect(CHAPTER_DOORS.length).toBeGreaterThanOrEqual(10); // limit, leblanc, experiment, mushroom, fayth, daigoro, valefor, gagazet, angra, yojimbo
    // Chapter XXVII's word (release 50): the table names it, so the loop below types it in the field like every other and the field opens the listed chapter.
    expect(CHAPTER_DOORS.find((d) => d.word === 'yojimbo')?.chapter).toBe('mirror-aeons');
  });

  for (const door of CHAPTER_DOORS) {
    it(`${door.chapter}: its word opens it on its last letter, and the field is gone`, async () => {
      const rig = mount();
      rig.longPress();
      const before = [...door.word].slice(0, -1).join('');
      rig.typeIn(before);
      expect(rig.picked, 'a word is not a door until its last letter').toEqual([]);
      expect(rig.field(), 'still up').not.toBeNull();
      rig.typeIn(door.word.slice(-1));
      await flush();
      expect(rig.picked).toEqual([door.chapter]);
      expect(rig.settled).toEqual([door.chapter]);
      expect(rig.field(), 'the field went with the door').toBeNull();
      expect(rig.input.keyboardClaimed, 'and gave the keyboard back').toBe(false);
    });
  }

  it('in capitals, and with a pause far over the keyboard\'s 2 s gap between letters (a thumb hunting for a letter)', async () => {
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'biran-yenke')!.word;
    const rig = mount();
    rig.longPress();
    rig.typeIn(word.toUpperCase(), KEY_GAP_MS * 3);
    await flush();
    expect(rig.picked).toEqual(['biran-yenke']);
  });

  it('a letter removed or rewritten starts the match again from what the field says (backspace, a suggestion)', async () => {
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'ffx2-angra-mainyu')!.word;
    const rig = mount();
    rig.longPress();
    rig.typeIn(word.slice(0, -2) + 'x'); // a typo
    rig.set(word.slice(0, -2)); // backspace
    expect(rig.picked).toEqual([]);
    rig.typeIn(word.slice(-2));
    await flush();
    expect(rig.picked, 'the word as it stands now').toEqual(['ffx2-angra-mainyu']);

    const second = mount();
    second.longPress();
    second.set('zzzz');
    second.set(word); // the whole word arrives at once, as a composed word or a pasted one does
    await flush();
    expect(second.picked).toEqual(['ffx2-angra-mainyu']);
  });

  it('a wrong letter in the middle ends the match, as on a keyboard; the word typed again after it opens', async () => {
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'ffx2-valefor-besaid')!.word;
    const rig = mount();
    rig.longPress();
    rig.typeIn(word.slice(0, 3) + 'q' + word.slice(3, -1));
    expect(rig.picked).toEqual([]);
    rig.typeIn(word); // typed again behind the typo: it opens at the end
    await flush();
    expect(rig.picked).toEqual(['ffx2-valefor-besaid']);
  });

  it("FF7's word stays behind its switch: with the switch off, the field types it, nothing opens, and the field stays as it was (the word looks like any other)", async () => {
    setFf7ExperimentReadyForTests(false);
    const rig = mount();
    rig.longPress();
    rig.typeIn('limit');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.settled).toEqual([]);
    expect(rig.field(), 'a shut door does not close the field by itself: that would tell it was a door word').not.toBeNull();
    expect(rig.field()!.value).toBe('limit');
    rig.key('Enter');
    expect(rig.field()).toBeNull();
    setFf7ExperimentReadyForTests(true);
    const open = mount();
    open.longPress();
    open.typeIn('limit');
    await flush();
    expect(open.picked, 'the same word with the switch on opens').toEqual(['ff7-guard-scorpion']);
    expect(open.field()).toBeNull();
  });
});

describe('Enter, a blur and Escape close it; a wrong word leaves no trace', () => {
  it('Enter closes it (the keyboard\'s Done), and the board is not cancelled or confirmed by it', async () => {
    const rig = mount();
    rig.longPress();
    rig.typeIn('gagaze');
    rig.key('Enter');
    rig.frame();
    await flush();
    expect(rig.field()).toBeNull();
    expect(rig.picked).toEqual([]);
    expect(rig.settled).toEqual([]);
    expect(rig.cancelled).toBe(0);
  });

  it('Escape closes it and does not go back to the title', async () => {
    const rig = mount();
    rig.longPress();
    rig.typeIn('gaga');
    rig.key('Escape');
    rig.frame();
    rig.frame();
    await flush();
    expect(rig.field()).toBeNull();
    expect(rig.cancelled, 'Escape is the field\'s while it is up').toBe(0);
    expect(rig.settled).toEqual([]);
    expect(rig.input.keyboardClaimed).toBe(false);
  });

  it('a blur closes it (the keyboard put away, a tap elsewhere)', () => {
    const rig = mount();
    rig.longPress();
    expect(document.activeElement).toBe(rig.field());
    vi.advanceTimersByTime(SETTLE_MS + 100); // the player types a while, then puts the keyboard away
    rig.field()!.blur();
    expect(rig.field()).toBeNull();
    expect(rig.input.keyboardClaimed).toBe(false);
  });

  it('a wrong word opens nothing and leaves nothing: the markup, the storage and the sounds are what they were', async () => {
    const rig = mount();
    const sound = vi.spyOn(audio, 'playSfx');
    const markup = rig.root.innerHTML;
    const keep = stored();
    const selected = rig.screen.snapshot()['selectedIndex'];
    rig.longPress();
    rig.typeIn('gazette');
    rig.key('Enter');
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.settled).toEqual([]);
    expect(rig.screen.snapshot()['selectedIndex']).toBe(selected);
    expect(rig.root.innerHTML, 'the board is byte for byte what it was').toBe(markup);
    expect(stored(), 'nothing was written, under any key').toEqual(keep);
    expect(sound.mock.calls, 'no sound, no sign').toEqual([]);
  });

  it('a half word is not remembered: the next long press starts from nothing', async () => {
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'biran-yenke')!.word;
    const rig = mount();
    rig.longPress();
    rig.typeIn(word.slice(0, 4));
    rig.key('Escape');
    rig.longPress();
    rig.typeIn(word.slice(4));
    await flush();
    expect(rig.picked, 'the rest of the word alone opens nothing').toEqual([]);
    rig.set('');
    rig.typeIn(word);
    await flush();
    expect(rig.picked).toEqual(['biran-yenke']);
  });
});

describe('while it is up it owns the keyboard', () => {
  it('the letters of a word press no board button: the Z of gagazet is CONFIRM and the A of angra is left, and the visit\'s door matcher is not fed', async () => {
    const rig = mount();
    const selected = rig.screen.snapshot()['selectedIndex'];
    rig.longPress();
    for (const k of ['z', 'a', 'e', 'c', 'ArrowRight', 'ArrowDown']) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: codeOf(k), bubbles: true, cancelable: true }));
      rig.frame();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: k, code: codeOf(k), bubbles: true }));
    }
    await flush();
    expect(rig.picked, 'no card opened by a Z while the field is up').toEqual([]);
    expect(rig.screen.snapshot()['selectedIndex'], 'no cursor moved by an A or an arrow').toBe(selected);
    // the keys of a whole word, as physical key events with no text typed in the field: the visit's own matcher must not see them
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'biran-yenke')!.word;
    for (const ch of word) rig.key(ch);
    await flush();
    expect(rig.picked, 'the keyboard door was not fed from inside the field').toEqual([]);
  });

  it('the control: the same keys with the field closed move the cursor, open the card and open the door', async () => {
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'biran-yenke')!.word;
    const a = mount();
    const selected = a.screen.snapshot()['selectedIndex'];
    a.key('ArrowRight');
    expect(a.screen.snapshot()['selectedIndex']).not.toBe(selected);
    a.key('z');
    await flush();
    expect(a.picked).toHaveLength(1);
    expect(a.picked[0]).not.toBe('biran-yenke');

    const b = mount();
    for (const ch of word) b.key(ch);
    await flush();
    b.frame();
    expect(b.picked, 'the keyboard door is untouched').toEqual(['biran-yenke']);
  });

  it('typing by physical key events while the field is up (a desktop test of the gesture) reads the text the browser inserts, not the keys', async () => {
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'exp-fayth')!.word;
    const rig = mount();
    rig.longPress();
    for (const ch of word) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: codeOf(ch), bubbles: true, cancelable: true })); // the claim takes the key; the browser then inserts the letter
      rig.set(rig.field()!.value + ch);
    }
    await flush();
    expect(rig.picked).toEqual(['exp-fayth']);
  });

  it('without an Input (a standalone board, a test): the field\'s own key handler stops the letters at the field and Enter closes it', async () => {
    const rig = mount({ withInput: false });
    rig.longPress();
    const f = rig.field()!;
    const down = new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', bubbles: true, cancelable: true });
    const seen = vi.fn();
    window.addEventListener('keydown', seen);
    f.dispatchEvent(down);
    window.removeEventListener('keydown', seen);
    expect(seen, 'the letter stopped at the field: the door key listener never saw it').not.toHaveBeenCalled();
    f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
    expect(rig.field()).toBeNull();
  });
});

describe('it does not disturb the label\'s taps or the keyboard', () => {
  it(`${TAP_COUNT} taps still open FF7's door, ${TAP_COUNT - 1} do not (pointer events and clicks, as a phone sends them)`, async () => {
    const rig = mount();
    for (let i = 0; i < TAP_COUNT - 1; i++) rig.tap();
    await flush();
    expect(rig.picked).toEqual([]);
    expect(rig.field(), 'a tap is not a long press').toBeNull();
    rig.tap();
    await flush();
    expect(rig.picked).toEqual(['ff7-guard-scorpion']);
  });

  it('the click a long press leaves is not the seventh tap', async () => {
    const rig = mount();
    for (let i = 0; i < TAP_COUNT - 1; i++) rig.tap();
    rig.longPress();
    rig.label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); // the click a mouse leaves after the release
    rig.key('Escape');
    rig.frame();
    await flush();
    expect(rig.picked, 'six taps and a long press are not seven taps').toEqual([]);
    rig.tap();
    await flush();
    expect(rig.picked, 'the seventh real tap').toEqual(['ff7-guard-scorpion']);
  });

  it('a long press that leaves no click (most phones) does not swallow the next tap', async () => {
    const rig = mount();
    for (let i = 0; i < TAP_COUNT - 1; i++) rig.tap();
    rig.longPress(); // no click follows
    rig.key('Escape');
    rig.frame();
    rig.tap();
    await flush();
    expect(rig.picked).toEqual(['ff7-guard-scorpion']);
  });

  it('typed words on a keyboard work as before, with the field never raised', async () => {
    const word = CHAPTER_DOORS.find((d) => d.chapter === 'ffx2-angra-mainyu')!.word;
    const rig = mount();
    for (const ch of word) rig.key(ch);
    rig.frame();
    await flush();
    expect(rig.picked).toEqual(['ffx2-angra-mainyu']);
    expect(rig.field()).toBeNull();
  });

  it('leaving the board takes the field, its claim and its listeners with it', () => {
    const rig = mount();
    rig.longPress();
    expect(rig.field()).not.toBeNull();
    expect(rig.input.keyboardClaimed).toBe(true);
    rig.screen.exit();
    expect(rig.root.querySelector('.fe-doorfield')).toBeNull();
    expect(rig.input.keyboardClaimed).toBe(false);
    pointer(rig.label, 'pointerdown');
    vi.advanceTimersByTime(HOLD_MS * 2);
    expect(rig.root.querySelector('.fe-doorfield'), 'a left board answers no press').toBeNull();
  });
});

describe('house style', () => {
  it('the board screen and the field stay under 400 lines', () => {
    for (const file of ['src/app/screens/ChapterSelectScreen.ts', 'src/app/screens/frontend/doorField.ts']) {
      expect(readFileSync(join(ROOT, file), 'utf8').split('\n').length, file).toBeLessThan(400);
    }
  });
});
