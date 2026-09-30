// @vitest-environment jsdom
/**
 * PR-0265 (round 17, both games): the pause screen's `Esc RESUME` button does nothing
 * when tapped or clicked. The button carries `data-action="cancel"`; `handleAction`
 * closed on it only with the chrome hidden (`panelsHidden`), so with the panels shown a
 * pointer RESUME was swallowed and a phone player (no Esc key) had to tap "H painting
 * only" first. A pointer RESUME now closes outright, from the tabs and from the body.
 * The keyboard path is unchanged: Esc in the body still only leaves the body.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Input, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { App } from '../../src/app/App.ts';

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
    lastDevice: 'pointer',
  };
}

const map = new Map<string, string>();
const storage = {
  getItem: (k: string) => map.get(k) ?? null,
  setItem: (k: string, v: string) => void map.set(k, String(v)),
  removeItem: (k: string) => void map.delete(k),
};

let dispose: (() => void) | null = null;

function mount(): { screen: PauseScreen; root: HTMLElement; resumed: () => number } {
  const store = new SaveStore('pause-resume-pointer-test', storage);
  store.setSettings({ pausePanelsHidden: false });
  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);
  let resumes = 0;
  const screen = new PauseScreen({ chapter: getChapter('seymour-flux')!, onResume: () => void resumes++ });
  screen.app = { save: store, input, screens: [screen], renderer: { camera: {} } } as unknown as App;
  screen.root = root;
  void screen.enter();
  dispose = () => {
    screen.exit();
    input.detach();
    root.remove();
  };
  return { screen, root, resumed: () => resumes };
}

/** Walk the keyboard to a tab that has rows and step into its body. */
function intoBody(screen: PauseScreen): void {
  for (let i = 0; i < 8 && (screen.snapshot()['rows'] as string[]).length === 0; i++) {
    screen.handleInput(snapshot(['right']));
  }
  expect((screen.snapshot()['rows'] as string[]).length).toBeGreaterThan(0);
  screen.handleInput(snapshot(['down']));
}

afterEach(() => {
  dispose?.();
  dispose = null;
});

describe('PR-0265: a pointer RESUME closes the pause', () => {
  it('the RESUME button is a data-action="cancel" target', () => {
    const { root } = mount();
    expect(root.querySelector('.pause__back')?.getAttribute('data-action')).toBe('cancel');
  });

  it('closes with the focus on the tabs and the panels shown', () => {
    const h = mount();
    h.screen.handleInput(snapshot([], ['cancel']));
    expect(h.resumed()).toBe(1);
  });

  it('closes with the focus in the body (after a row tap)', () => {
    const h = mount();
    intoBody(h.screen);
    h.screen.handleInput(snapshot([], ['cancel']));
    expect(h.resumed()).toBe(1);
  });

  it('closes once, not twice, when the tap repeats', () => {
    const h = mount();
    h.screen.handleInput(snapshot([], ['cancel']));
    h.screen.handleInput(snapshot([], ['cancel']));
    expect(h.resumed()).toBe(1);
  });

  it('the keyboard is unchanged: Esc in the body leaves the body, Esc on the tabs closes', () => {
    const h = mount();
    intoBody(h.screen);
    h.screen.handleInput(snapshot(['cancel']));
    expect(h.resumed()).toBe(0);
    h.screen.handleInput(snapshot(['cancel']));
    expect(h.resumed()).toBe(1);
  });
});
