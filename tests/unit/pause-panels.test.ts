// @vitest-environment jsdom
/**
 * The pause screen's HIDE PANELS toggle, and the keyboard claim that makes the
 * whole pause fix possible.
 *
 * Two things are under test here and they are two halves of the same bug report:
 *
 *  * **The claim.** `Esc` and `P` did nothing in a live battle because the pause
 *    refused to open over a command menu, and it refused because both command
 *    menus read the keyboard straight off `window` — a pause stacked on one
 *    would have had two screens on the same arrow keys and an Enter that
 *    resolves a real command from behind the menu. `Input.claimKeyboard` closes
 *    that at the source: `Input` listens in the **capture** phase, so a claim
 *    can stop the event before any other `window` listener in the page sees it.
 *    The tests below assert exactly that — a foreign listener goes silent while
 *    a claim is up, the claimant still plays normally, and the claim is handed
 *    back on release.
 *  * **The toggle.** `H`, Triangle, the HIDE PANELS row and the chip all drop
 *    every slab and leave the painting, the choice survives into
 *    `Settings.pausePanelsHidden`, and a pause opened afterwards comes up bare
 *    without being asked twice.
 *
 * jsdom, because all of it is DOM and listeners; nothing here needs a battle.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { SaveStore, defaultSettings } from '../../src/app/SaveData.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { App } from '../../src/app/App.ts';

// ------------------------------------------------------------------ helpers

/** A `StorageLike` that lives and dies with one test. */
function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

/** One frame of input with a fixed set of buttons down. */
function snapshot(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const set = new Set(pressed);
  return {
    pressed: (b) => set.has(b),
    justPressed: (b) => set.has(b),
    justReleased: () => false,
    consume: (b) => set.has(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: false,
    lastDevice: 'keyboard',
  };
}

function keydown(code: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const e = new window.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
}

interface Harness {
  screen: PauseScreen;
  store: SaveStore;
  input: Input;
  root: HTMLElement;
  resumed: () => number;
  dispose(): void;
}

function mountPause(settings: Partial<ReturnType<typeof defaultSettings>> = {}): Harness {
  const store = new SaveStore('pause-panels-test', memoryStorage());
  store.setSettings(settings);

  const input = new Input({ keyboardTarget: window });
  input.attach();

  const root = document.createElement('div');
  document.body.appendChild(root);

  let resumes = 0;
  const screen = new PauseScreen({
    chapter: getChapter('seymour-flux')!,
    onResume: () => void resumes++,
  });
  screen.app = {
    save: store,
    input,
    screens: [screen],
    renderer: { camera: {} },
  } as unknown as App;
  screen.root = root;
  void screen.enter();

  return {
    screen,
    store,
    input,
    root,
    resumed: () => resumes,
    dispose: () => {
      screen.exit();
      input.detach();
      root.remove();
    },
  };
}

/**
 * Whether the stage is in bare mode.
 *
 * Which children that *hides* is a stylesheet rule (`.pause--bare > *:not(
 * .pause__art)`), and vitest does not load CSS — asserting computed `display`
 * here would pass or fail for reasons that have nothing to do with this code.
 * The rule itself is checked where it can be: in the browser, by
 * `tests/e2e/pause.spec.ts` and the `pause-hidden.png` capture.
 */
function isBare(root: HTMLElement): boolean {
  return root.querySelector('.pause__stage')?.classList.contains('pause--bare') ?? false;
}

/** The stage children the bare rule is written against. */
function slabs(root: HTMLElement): string[] {
  const stage = root.querySelector('.pause__stage');
  return stage ? [...stage.children].map((el) => el.className.split(' ')[0]!) : [];
}

// ------------------------------------------------------------- the claim

describe('Input.claimKeyboard', () => {
  let input: Input;
  let heard: string[];
  const spy = (e: Event): void => void heard.push((e as KeyboardEvent).code);

  beforeEach(() => {
    heard = [];
    input = new Input({ keyboardTarget: window });
    input.attach();
    // Stands in for the command menus' own `window` listeners
    // (`ui/ffx/rawInput.ts`, `ui/ffx2/CommandMenu.ts`), which is the thing a
    // claim has to be able to silence.
    window.addEventListener('keydown', spy);
  });

  afterEach(() => {
    window.removeEventListener('keydown', spy);
    input.detach();
  });

  it('lets other window listeners hear the keyboard when nothing is claimed', () => {
    keydown('Escape');
    expect(heard).toEqual(['Escape']);
    expect(input.keyboardClaimed).toBe(false);
  });

  it('cuts every other listener off while a claim is up', () => {
    const release = input.claimKeyboard();
    expect(input.keyboardClaimed).toBe(true);
    keydown('Escape');
    keydown('ArrowDown');
    keydown('Enter');
    expect(heard).toEqual([]);
    release();
    keydown('Escape');
    expect(heard).toEqual(['Escape']);
  });

  it('still records the press for the claimant itself', () => {
    input.claimKeyboard();
    keydown('Escape');
    input.update(0);
    // The pause screen has to keep reading Esc while it owns the keyboard —
    // swallowing the event for everyone else must not swallow it for us.
    expect(input.justPressed('cancel')).toBe(true);
  });

  it('hands unmapped keys to the claimant, which is how H arrives', () => {
    const seen: string[] = [];
    input.claimKeyboard((e) => seen.push(e.code));
    keydown('KeyH');
    keydown('Escape');
    expect(seen).toEqual(['KeyH', 'Escape']);
  });

  it('leaves chords alone so browser shortcuts still work', () => {
    input.claimKeyboard();
    keydown('KeyR', { ctrlKey: true });
    expect(heard).toEqual(['KeyR']);
  });

  it('nests, and releasing twice is a no-op', () => {
    const first = input.claimKeyboard();
    const second = input.claimKeyboard();
    second();
    expect(input.keyboardClaimed).toBe(true); // back to the first claim
    second();
    expect(input.keyboardClaimed).toBe(true);
    first();
    expect(input.keyboardClaimed).toBe(false);
  });
});

// ------------------------------------------------------------- the toggle

describe('PauseScreen — HIDE PANELS', () => {
  let h: Harness;

  beforeEach(() => {
    h = mountPause();
  });

  afterEach(() => {
    h.dispose();
    vi.restoreAllMocks();
  });

  it('starts with the panels up and the row offering to hide them', () => {
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
    expect(h.screen.snapshot()['rows']).toContain('panels');
    const labels = [...h.root.querySelectorAll('.pause__row-label')].map((e) => e.textContent);
    expect(labels).toContain('HIDE PANELS');
    expect(isBare(h.root)).toBe(false);
    expect(slabs(h.root)).toContain('pause__menu');
  });

  it('H leaves the painting and one line, and nothing else', () => {
    keydown('KeyH');
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    // The art is the only child the bare rule spares, and it is still there.
    expect(isBare(h.root)).toBe(true);
    expect(slabs(h.root)).toContain('pause__art');
    const bare = h.root.querySelector<HTMLElement>('.pause__bare-hint');
    expect(bare).not.toBeNull();
    expect(bare!.style.display).not.toBe('none');
    expect(bare!.textContent).toContain('show panels');
    expect(bare!.textContent).toContain('resume');
  });

  it('H again brings everything back', () => {
    keydown('KeyH');
    keydown('KeyH');
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
    expect(isBare(h.root)).toBe(false);
    expect(slabs(h.root)).toContain('pause__panel');
    expect(h.root.querySelector<HTMLElement>('.pause__bare-hint')!.style.display).toBe('none');
  });

  it('ignores a held H and a Ctrl+H', () => {
    keydown('KeyH', { repeat: true });
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
    keydown('KeyH', { ctrlKey: true });
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
  });

  it('Triangle (the pad, or Shift/Tab/Q) toggles it too', () => {
    h.screen.handleInput(snapshot(['triangle']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    h.screen.handleInput(snapshot(['triangle']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
  });

  it('the hint chip fires it for a mouse', () => {
    h.screen.handleInput(snapshot([], ['pause:panels']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
  });

  it('the menu row fires it, and flips its own label', () => {
    h.screen.handleInput(snapshot([], ['pause:row:panels']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    const labels = [...h.root.querySelectorAll('.pause__row-label')].map((e) => e.textContent);
    expect(labels).toContain('SHOW PANELS');
    expect(labels).not.toContain('HIDE PANELS');
  });

  it('remembers the answer in the save', () => {
    keydown('KeyH');
    expect(h.store.settings.pausePanelsHidden).toBe(true);
    expect(new SaveStore('pause-panels-test', memoryStorage()).settings.pausePanelsHidden).toBe(false);
  });

  it('a later pause opens bare without being asked again', () => {
    keydown('KeyH');
    h.dispose();
    h = mountPause({ pausePanelsHidden: true });
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    expect(isBare(h.root)).toBe(true);
  });

  it('while bare, Esc still resumes and the cursor keys do nothing', () => {
    keydown('KeyH');
    const row = h.screen.snapshot()['row'];
    h.screen.handleInput(snapshot(['down']));
    h.screen.handleInput(snapshot(['confirm']));
    expect(h.screen.snapshot()['row']).toBe(row);
    expect(h.resumed()).toBe(0);
    h.screen.handleInput(snapshot(['cancel']));
    expect(h.resumed()).toBe(1);
  });

  it('claims the keyboard for as long as it is up, and gives it back', () => {
    const heard: string[] = [];
    const spy = (e: Event): void => void heard.push((e as KeyboardEvent).code);
    window.addEventListener('keydown', spy);
    keydown('ArrowDown');
    expect(heard).toEqual([]); // the pause owns it
    h.dispose();
    keydown('ArrowDown');
    expect(heard).toEqual(['ArrowDown']);
    window.removeEventListener('keydown', spy);
    // `dispose` already ran; make the shared teardown harmless.
    h = mountPause();
  });
});
