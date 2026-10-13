// @vitest-environment jsdom
/**
 * OPTIONS accessibility A2 (D-285, PR-0032; frame A2 of `docs/concepts/r29-options/options.html`) put TEXT SIZE,
 * REDUCE MOTION and LOW EFFECTS in the pause; the ACCESSIBILITY tab (PR-0032, OPT-B of
 * `critic/scratch/options-additions-2026-10-12/`; Bailey, 2026-10-12, "OPT-B with NO-KEYS", answered with "I'll go with
 * all of your recommendations") moved them there, with REDUCE FLASHES and COLOUR VISION. The COMFORT column reads TEXT SIZE,
 * REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION. Each row is driven by the real input paths: keys through the
 * real `Input`, a tap (a DOM click on the row, which `Input` turns into its `pause:row:<id>` action) and a gamepad (a fake
 * `navigator.getGamepads` pad, polled by the same `Input`). A setting lives in one place: OPTIONS no longer lists the three.
 *
 * Both games: shared pause plumbing. The X-2 rows keep their per-game rule; COLOUR VISION is not in FF7.
 */
import { PerspectiveCamera } from 'three';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { accessRows, optionRows } from '../../src/app/screens/PauseScreenPanels.ts';
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
const rowIds = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('.pause__col[data-col="settings"] .pause__row')].map((r) => r.dataset['row'] ?? '');

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

describe('the ACCESSIBILITY rows, as frame OPT-B draws them', () => {
  it('COMFORT reads TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION, in that order, in both games', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      const h = mount(id);
      h.screen.trigger('pause:tab:accessibility');
      expect(rowIds(h), id).toEqual(['textSize', 'reduceMotion', 'reduceFlashes', 'lowEffects', 'colourVision']);
      expect(h.root.querySelector('.pause__col[data-col="settings"] h3')?.textContent).toBe('Comfort');
      expect(valueOf(h, 'textSize')).toBe('100%');
      expect(valueOf(h, 'reduceFlashes')).toBe('OFF');
      expect(valueOf(h, 'lowEffects')).toBe('OFF');
      expect(valueOf(h, 'colourVision')).toBe('OFF');
      expect(h.root.querySelectorAll('.pause__col'), 'one column: the mock\'s KEYS column is not built').toHaveLength(1);
      h.dispose();
      live = null;
    }
  });

  it('the tab sits right after OPTIONS, and OPTIONS no longer lists the three rows that moved (a setting lives in one place)', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      const h = mount(id);
      const ids = (h.screen.snapshot()['tabs'] as string[]).slice(-6);
      expect(ids, id).toEqual(['chapter', 'guide', 'options', 'accessibility', 'controls', 'music']);
      expect(h.root.querySelector('[data-tab="accessibility"]')?.textContent).toBe('Accessibility');
      h.screen.trigger('pause:tab:options');
      const rows = rowIds(h);
      for (const moved of ['textSize', 'reduceMotion', 'lowEffects', 'reduceFlashes', 'colourVision']) {
        expect(rows, `${id}: ${moved} is on the ACCESSIBILITY tab only`).not.toContain(moved);
      }
      const at = rows.indexOf('textSpeed');
      expect(rows.slice(at, at + 2), 'OPTIONS after the move, as the mock draws it').toEqual(['textSpeed', 'eyeCandy']);
      expect(rows.includes('ffx2Atb'), 'X-2 BATTLE stays FFX-2 only').toBe(id === 'ffx2-bahamut');
      h.dispose();
      live = null;
    }
  });

  it('every setting that was reachable is still reachable in exactly one place', () => {
    const settings = new SaveStore('x', memoryStorage()).settings;
    for (const game of ['ffx', 'ffx2', 'ff7'] as const) {
      const a = optionRows(settings, game).map((r) => r.id);
      const b = accessRows(settings, game).map((r) => r.id);
      for (const id of a) expect(b, `${game} ${id}`).not.toContain(id);
      for (const id of ['textSize', 'reduceMotion', 'lowEffects']) expect(b, `${game} ${id} moved`).toContain(id);
    }
  });

  it('the labels and values are the mock\'s words', () => {
    const rows = accessRows({ ...new SaveStore('x', memoryStorage()).settings, textSize: 1.15, reduceMotion: true, reduceFlashes: true, lowEffects: false, colourVision: 'blue-yellow' });
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by['textSize']).toMatchObject({ label: 'TEXT SIZE', value: '115%', ratio: 0.5 });
    expect(by['reduceMotion']).toMatchObject({ label: 'REDUCE MOTION', value: 'ON', ratio: null });
    expect(by['reduceFlashes']).toMatchObject({ label: 'REDUCE FLASHES', value: 'ON', ratio: null });
    expect(by['lowEffects']).toMatchObject({ label: 'LOW EFFECTS', value: 'OFF', ratio: null });
    expect(by['colourVision']).toMatchObject({ label: 'COLOUR VISION', value: 'BLUE-YELLOW', ratio: null });
  });

  it('FF7 (the hidden experiment) has no COLOUR VISION row: none of its four groups is drawn there', () => {
    const h = mount('ff7-guard-scorpion');
    h.screen.trigger('pause:tab:accessibility');
    expect(rowIds(h)).toEqual(['textSize', 'reduceMotion', 'reduceFlashes', 'lowEffects']);
  });
});

describe('keys', () => {
  it('Right and Left nudge TEXT SIZE through 100 / 115 / 130 % and clamp, like TEXT SPEED', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:accessibility');
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
    h.screen.trigger('pause:tab:accessibility');
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

  it('Enter flips REDUCE FLASHES, <html> follows at once, and the setting is saved', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:accessibility');
    selectRow(h, 'reduceFlashes');
    expect(h.store.settings.reduceFlashes).toBe(false);
    key(h, 'Enter');
    expect(h.store.settings.reduceFlashes).toBe(true);
    expect(document.documentElement.hasAttribute('data-reduce-flashes')).toBe(true);
    expect(valueOf(h, 'reduceFlashes')).toBe('ON');
    expect(h.store.snapshot().settings.reduceFlashes, 'it is in the save').toBe(true);
    key(h, 'ArrowLeft');
    expect(h.store.settings.reduceFlashes, 'Left flips a toggle too').toBe(false);
    expect(document.documentElement.hasAttribute('data-reduce-flashes')).toBe(false);
  });

  it('Right steps COLOUR VISION OFF, RED-GREEN, BLUE-YELLOW and wraps; Left goes the other way; <html> carries the mode', () => {
    const h = mount('ffx2-bahamut');
    h.screen.trigger('pause:tab:accessibility');
    selectRow(h, 'colourVision');
    const modes: string[] = [];
    for (let i = 0; i < 4; i++) {
      key(h, 'ArrowRight');
      modes.push(valueOf(h, 'colourVision'));
    }
    expect(modes).toEqual(['RED-GREEN', 'BLUE-YELLOW', 'OFF', 'RED-GREEN']);
    expect(h.store.settings.colourVision).toBe('red-green');
    expect(document.documentElement.dataset['colourVision']).toBe('red-green');
    expect(document.documentElement.style.getPropertyValue('--cvd-gate-r')).not.toBe('');
    key(h, 'ArrowLeft');
    expect(h.store.settings.colourVision, 'Left from RED-GREEN is OFF').toBe('off');
    expect(document.documentElement.hasAttribute('data-colour-vision'), 'OFF removes the attribute').toBe(false);
    expect(document.documentElement.style.getPropertyValue('--cvd-gate-r'), 'and every variable').toBe('');
    key(h, 'ArrowLeft');
    expect(h.store.settings.colourVision, 'Left from OFF wraps to BLUE-YELLOW').toBe('blue-yellow');
    key(h, 'Enter');
    expect(h.store.settings.colourVision, 'Confirm steps up too, so a phone is never stuck').toBe('off');
  });
});

describe('taps', () => {
  it('a tap on TEXT SIZE steps up and wraps from 130 back to 100 %, so a phone is never stuck', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:accessibility');
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
    tap('reduceFlashes');
    expect(h.store.settings.reduceFlashes).toBe(true);
    expect(valueOf(h, 'reduceFlashes')).toBe('ON');
    tap('colourVision');
    expect(h.store.settings.colourVision).toBe('red-green');
    tap('colourVision');
    tap('colourVision');
    expect(h.store.settings.colourVision, 'three taps come back to OFF').toBe('off');
  });
});

describe('a gamepad', () => {
  it('the d-pad nudges TEXT SIZE, Cross flips LOW EFFECTS and REDUCE FLASHES, and steps COLOUR VISION', () => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const pad = { id: 'fake', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
    try {
      const h = mount('seymour-flux');
      h.screen.trigger('pause:tab:accessibility');
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
      expect(selected(h)).toBe('reduceFlashes');
      press(0); // cross
      expect(h.store.settings.reduceFlashes).toBe(true);
      press(13);
      expect(selected(h)).toBe('lowEffects');
      press(0); // cross
      expect(h.store.settings.lowEffects).toBe(true);
      press(13);
      expect(selected(h)).toBe('colourVision');
      press(15); // d-pad right
      expect(h.store.settings.colourVision).toBe('red-green');
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

  it('REDUCE FLASHES and COLOUR VISION are settings rows: adjustSetting answers true and writes the save', () => {
    const store = new SaveStore('adjust-access', memoryStorage());
    expect(adjustSetting(store, 'reduceFlashes', 1, true)).toBe(true);
    expect(store.settings.reduceFlashes).toBe(true);
    expect(adjustSetting(store, 'colourVision', 1, true)).toBe(true);
    expect(store.settings.colourVision).toBe('red-green');
    expect(adjustSetting(store, 'colourVision', -1)).toBe(true);
    expect(store.settings.colourVision).toBe('off');
  });
});
