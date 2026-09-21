// @vitest-environment jsdom
/**
 * The keyboard claim, and `H` on the remade pause screen.
 *
 * Two halves of one bug report, and the half that is not about the layout is
 * unchanged by the Until Dawn remake:
 *
 *  * **The claim.** `Esc` and `P` did nothing in a live battle because the
 *    pause refused to open over a command menu, and it refused because both
 *    command menus read the keyboard straight off `window`.
 *    `Input.claimKeyboard` closes that at the source: `Input` listens in the
 *    **capture** phase, so a claim can stop the event before any other
 *    `window` listener in the page sees it. The remake leans on the claim for
 *    more than it used to — `Q`, `E`, `F` and `Tab` all arrive through it
 *    (`pause/keys.ts`) — so these tests matter more, not less.
 *  * **The toggle.** `H`, Triangle and the hint drop every line and leave the
 *    painting; the choice survives into `Settings.pausePanelsHidden`, and a
 *    pause opened afterwards comes up bare without being asked twice.
 *
 * The rest of the remake is in `pause-remake.test.ts` (tabs, the nineteen
 * preserved functions, the game-aware rows, the mirror, reduced motion) and
 * `pause-remake-css.test.ts` (the type floors and the grade).
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
 * Which children that *hides* is a stylesheet rule
 * (`.pause--bare .pause__ui { display: none }`), and vitest does not load CSS —
 * asserting computed `display` here would pass or fail for reasons that have
 * nothing to do with this code. The rule itself is read out of the sheet by
 * `pause-remake-css.test.ts` and looked at in a browser under
 * `docs/screenshots/pause-remake/`.
 */
function isBare(root: HTMLElement): boolean {
  return root.querySelector('.pause__stage')?.classList.contains('pause--bare') ?? false;
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

describe('PauseScreen: H hides everything but the painting', () => {
  let h: Harness;

  beforeEach(() => {
    h = mountPause();
  });

  afterEach(() => {
    h.dispose();
    vi.restoreAllMocks();
  });

  it('starts with the chrome up and the hint offering to hide it', () => {
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
    expect(isBare(h.root)).toBe(false);
    expect(h.root.querySelector('.pause__ui')).not.toBeNull();
    expect(h.root.querySelector('.pause__hide')!.textContent).toContain('hide panels');
  });

  it('H leaves the painting and one line, and nothing else', () => {
    keydown('KeyH');
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    expect(isBare(h.root)).toBe(true);
    // The painting is still mounted; the bare rule spares it by class.
    expect(h.root.querySelector('.pause__art')).not.toBeNull();
    const bare = h.root.querySelector<HTMLElement>('.pause__baseline');
    expect(bare).not.toBeNull();
    expect(bare!.textContent).toContain('show panels');
    expect(bare!.textContent).toContain('resume');
  });

  it('H again brings everything back', () => {
    keydown('KeyH');
    keydown('KeyH');
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
    expect(isBare(h.root)).toBe(false);
  });

  it('ignores a held H and a Ctrl+H', () => {
    keydown('KeyH', { repeat: true });
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
    keydown('KeyH', { ctrlKey: true });
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
  });

  it('Triangle (the pad) toggles it too', () => {
    h.screen.handleInput(snapshot(['triangle']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    h.screen.handleInput(snapshot(['triangle']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
  });

  it('the hint fires it for a mouse', () => {
    h.screen.handleInput(snapshot([], ['pause:panels']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
  });

  it('with the chrome down the strip does not move under Q or E', () => {
    const before = h.screen.snapshot()['tab'];
    keydown('KeyH');
    keydown('KeyE');
    keydown('KeyQ');
    expect(h.screen.snapshot()['tab']).toBe(before);
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

  it('Esc still resumes with the chrome down', () => {
    keydown('KeyH');
    h.screen.handleInput(snapshot(['cancel']));
    expect(h.resumed()).toBe(1);
  });
});
