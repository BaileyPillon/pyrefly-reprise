// @vitest-environment jsdom
/**
 * OPTIONS accessibility A2 (D-285, PR-0032; frame A2 of
 * `docs/concepts/r29-options/options.html`): TEXT SIZE, REDUCE MOTION and LOW
 * EFFECTS sit under TEXT SPEED in the pause SETTINGS column, and each is driven
 * by the real input paths: keys through the real `Input`, a tap (a DOM click on
 * the row, which `Input` turns into its `pause:row:<id>` action) and a gamepad
 * (a fake `navigator.getGamepads` pad, polled by the same `Input`).
 *
 * Both games: shared pause plumbing. The X-2 rows keep their per-game rule.
 */
import { PerspectiveCamera } from 'three';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { optionRows } from '../../src/app/screens/PauseScreenPanels.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { App } from '../../src/app/App.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { resetCoach, setOnboardingLive } from '../../src/ui/coach/coachState.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, String(v)), removeItem: (k) => void map.delete(k) };
}

interface Harness {
  screen: PauseScreen;
  store: SaveStore;
  input: Input;
  root: HTMLElement;
  clock: number;
  dispose(): void;
}
let live: Harness | null = null;

function mount(chapterId: string): Harness {
  const chapter = getChapter(chapterId)!;
  const store = new SaveStore(`pause-comfort-${chapterId}`, memoryStorage());
  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);
  const screen = new PauseScreen({ chapter, chainLength: 1, onResume: () => undefined });
  const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 100);
  screen.app = { save: store, input, screens: [screen], renderer: { camera } } as unknown as App;
  screen.root = root;
  void screen.enter();
  const h: Harness = { screen, store, input, root, clock: 0, dispose: () => { screen.exit(); input.detach(); root.remove(); } };
  live = h;
  return h;
}

/** One frame of the real input loop. */
function frame(h: Harness): void {
  h.clock += 50;
  h.screen.handleInput(h.input.update(h.clock));
  h.input.endFrame();
}
function key(h: Harness, code: string): void {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
  frame(h);
  window.dispatchEvent(new window.KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
  frame(h);
}
const selected = (h: Harness): string | undefined => h.root.querySelector<HTMLElement>('.pause__row--sel')?.dataset['row'];
const valueOf = (h: Harness, id: string): string =>
  (h.root.querySelector<HTMLElement>(`.pause__row[data-row="${id}"] .pause__v`)?.textContent ?? '').trim();

/** Real Down presses until `id` is the selected row. */
function selectRow(h: Harness, id: string): void {
  for (let i = 0; i < 20 && selected(h) !== id; i++) key(h, 'ArrowDown');
  expect(selected(h)).toBe(id);
}

beforeAll(async () => {
  await registerBattleContent();
});
afterEach(() => {
  live?.dispose();
  live = null;
  resetCoach();
  setOnboardingLive(false);
});

describe('the OPTIONS rows, as frame A2 draws them', () => {
  it('TEXT SIZE, REDUCE MOTION and LOW EFFECTS sit under TEXT SPEED, in that order, in both games', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      const h = mount(id);
      h.screen.trigger('pause:tab:options');
      const rows = [...h.root.querySelectorAll<HTMLElement>('.pause__col[data-col="settings"] .pause__row')].map((r) => r.dataset['row']);
      const at = rows.indexOf('textSpeed');
      expect(rows.slice(at, at + 4), id).toEqual(['textSpeed', 'textSize', 'reduceMotion', 'lowEffects']);
      expect(valueOf(h, 'textSize')).toBe('100%');
      expect(valueOf(h, 'lowEffects')).toBe('OFF');
      expect(rows.includes('ffx2Atb'), 'X-2 BATTLE stays FFX-2 only').toBe(id === 'ffx2-bahamut');
      h.dispose();
      live = null;
    }
  });

  it('the labels and values are the mock\'s words', () => {
    const rows = optionRows({ ...new SaveStore('x', memoryStorage()).settings, textSize: 1.15, reduceMotion: true, lowEffects: false });
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by['textSize']).toMatchObject({ label: 'TEXT SIZE', value: '115%', ratio: 0.5 });
    expect(by['reduceMotion']).toMatchObject({ label: 'REDUCE MOTION', value: 'ON', ratio: null });
    expect(by['lowEffects']).toMatchObject({ label: 'LOW EFFECTS', value: 'OFF', ratio: null });
  });
});

describe('keys', () => {
  it('Right and Left nudge TEXT SIZE through 100 / 115 / 130 % and clamp, like TEXT SPEED', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    selectRow(h, 'textSize');
    key(h, 'ArrowRight');
    expect(h.store.settings.textSize).toBe(1.15);
    expect(valueOf(h, 'textSize')).toBe('115%');
    expect(document.documentElement.dataset['textSize']).toBe('115');
    key(h, 'ArrowRight');
    key(h, 'ArrowRight');
    expect(h.store.settings.textSize, 'clamped at 130 %').toBe(1.3);
    key(h, 'ArrowLeft');
    key(h, 'ArrowLeft');
    key(h, 'ArrowLeft');
    expect(h.store.settings.textSize, 'clamped at 100 %').toBe(1);
  });

  it('Enter flips REDUCE MOTION and LOW EFFECTS, and <html> follows at once', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    selectRow(h, 'reduceMotion');
    const before = h.store.settings.reduceMotion;
    key(h, 'Enter');
    expect(h.store.settings.reduceMotion).toBe(!before);
    expect(document.documentElement.hasAttribute('data-reduce-motion')).toBe(!before);
    expect(valueOf(h, 'reduceMotion')).toBe(before ? 'OFF' : 'ON');
    selectRow(h, 'lowEffects');
    key(h, 'Enter');
    expect(h.store.settings.lowEffects).toBe(true);
    expect(document.documentElement.hasAttribute('data-low-effects')).toBe(true);
    key(h, 'ArrowLeft');
    expect(h.store.settings.lowEffects, 'Left flips a toggle too').toBe(false);
  });
});

describe('taps', () => {
  it('a tap on TEXT SIZE steps up and wraps from 130 back to 100 %, so a phone is never stuck', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    const tap = (id: string): void => {
      h.root.querySelector<HTMLElement>(`.pause__row[data-row="${id}"]`)!.click();
      frame(h);
    };
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      tap('textSize');
      seen.push(h.store.settings.textSize);
    }
    expect(seen).toEqual([1.15, 1.3, 1, 1.15]);
    tap('lowEffects');
    expect(h.store.settings.lowEffects).toBe(true);
    expect(valueOf(h, 'lowEffects')).toBe('ON');
    const rm = h.store.settings.reduceMotion;
    tap('reduceMotion');
    expect(h.store.settings.reduceMotion).toBe(!rm);
  });
});

describe('a gamepad', () => {
  it('the d-pad nudges TEXT SIZE and Cross flips LOW EFFECTS', () => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const pad = { id: 'fake', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
    try {
      const h = mount('seymour-flux');
      h.screen.trigger('pause:tab:options');
      const press = (i: number): void => {
        buttons[i]!.pressed = true;
        frame(h);
        buttons[i]!.pressed = false;
        frame(h);
      };
      for (let n = 0; n < 20 && selected(h) !== 'textSize'; n++) press(13); // d-pad down
      expect(selected(h)).toBe('textSize');
      press(15); // d-pad right
      expect(h.store.settings.textSize).toBe(1.15);
      press(14); // d-pad left
      expect(h.store.settings.textSize).toBe(1);
      press(13);
      press(13);
      expect(selected(h)).toBe('lowEffects');
      press(0); // cross
      expect(h.store.settings.lowEffects).toBe(true);
    } finally {
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    }
  });
});

describe('adjustSetting', () => {
  it('Confirm (press) wraps TEXT SIZE; an arrow never does', () => {
    const store = new SaveStore('adjust', memoryStorage());
    store.setSettings({ textSize: 1.3 });
    adjustSetting(store, 'textSize', 1);
    expect(store.settings.textSize).toBe(1.3);
    adjustSetting(store, 'textSize', 1, true);
    expect(store.settings.textSize).toBe(1);
  });
});
