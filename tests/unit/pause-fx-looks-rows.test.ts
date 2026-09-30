// @vitest-environment jsdom
/**
 * Eye-candy D's three look rows on the approved OPTIONS tab (Bailey, 2026-09-29 ~23:45 EDT: "in the
 * settings I want to be able to turn each one off. Default will be on."): CINEMA LIGHT, LIVING
 * PAINTINGS and BATTLE SPECTACLE sit under LOW EFFECTS and work exactly like it, by the real input
 * paths (keys through the real `Input`, a tap as a DOM click on the row), and each switches its look
 * live (no reload). FF7 draws no eye candy, so its pause shows none of the three.
 *
 * Game case: both (FFX and FFX-2 share the rows).
 */
import { PerspectiveCamera } from 'three';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { optionRows } from '../../src/app/screens/PauseScreenPanels.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
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
  const store = new SaveStore(`pause-fx-looks-${chapterId}`, memoryStorage());
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
  applyComfort({ fxLight: true, fxLiving: true, fxSpectacle: true });
});


const LOOK_IDS = ['fxLight', 'fxLiving', 'fxSpectacle'] as const;
const settingsRows = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('.pause__col[data-col="settings"] .pause__row')].map((r) => r.dataset['row'] ?? '');

describe('the three rows, in the A2 style', () => {
  it('sit under LOW EFFECTS, ON by default, in both games', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      const h = mount(id);
      h.screen.trigger('pause:tab:options');
      const rows = settingsRows(h);
      const at = rows.indexOf('lowEffects');
      expect(rows.slice(at, at + 4), id).toEqual(['lowEffects', 'fxLight', 'fxLiving', 'fxSpectacle']);
      for (const r of LOOK_IDS) expect(valueOf(h, r), r).toBe('ON');
      h.dispose();
      live = null;
    }
  });

  it('use the plain uppercase words and the ON / OFF values of the rows above them', () => {
    const rows = optionRows({ ...new SaveStore('x', memoryStorage()).settings, fxLiving: false });
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by['fxLight']).toMatchObject({ label: 'CINEMA LIGHT', value: 'ON', ratio: null });
    expect(by['fxLiving']).toMatchObject({ label: 'LIVING PAINTINGS', value: 'OFF', ratio: null });
    expect(by['fxSpectacle']).toMatchObject({ label: 'BATTLE SPECTACLE', value: 'ON', ratio: null });
  });

  it('are not in the FF7 pause, which draws no eye candy', () => {
    const h = mount('ff7-guard-scorpion');
    h.screen.trigger('pause:tab:options');
    const rows = settingsRows(h);
    expect(rows).toContain('lowEffects');
    for (const r of LOOK_IDS) expect(rows).not.toContain(r);
  });
});

describe('keys and taps switch the look live', () => {
  it('Enter, Right and Left flip each row, the save and the live look follow at once', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    const opt = { fxLight: 'a', fxLiving: 'b', fxSpectacle: 'c' } as const;
    for (const r of LOOK_IDS) {
      selectRow(h, r);
      key(h, 'Enter');
      expect(h.store.settings[r], r).toBe(false);
      expect(valueOf(h, r)).toBe('OFF');
      expect(eyeCandy.on[opt[r]], `${r} switches option ${opt[r]} off live`).toBe(false);
      key(h, 'ArrowRight');
      expect(h.store.settings[r]).toBe(true);
      expect(eyeCandy.on[opt[r]]).toBe(true);
      key(h, 'ArrowLeft');
      expect(h.store.settings[r], 'Left flips a toggle too').toBe(false);
    }
    expect(eyeCandy.on).toEqual({ a: false, b: false, c: false });
    expect(h.store.settings.lowEffects, 'nothing else moved').toBe(false);
  });

  it('a tap flips a row, as it does LOW EFFECTS', () => {
    const h = mount('ffx2-bahamut');
    h.screen.trigger('pause:tab:options');
    const tap = (id: string): void => {
      h.root.querySelector<HTMLElement>(`.pause__row[data-row="${id}"]`)!.click();
      frame(h);
    };
    tap('fxSpectacle');
    expect(h.store.settings.fxSpectacle).toBe(false);
    expect(eyeCandy.on.c).toBe(false);
    expect(valueOf(h, 'fxSpectacle')).toBe('OFF');
    tap('fxSpectacle');
    expect(eyeCandy.on.c).toBe(true);
  });

  it('adjustSetting knows the three ids and nothing else changes', () => {
    const store = new SaveStore('adjust-fx', memoryStorage());
    const before = { ...store.settings };
    expect(adjustSetting(store, 'fxLight', 1, true)).toBe(true);
    expect(adjustSetting(store, 'fxLight', -1)).toBe(true);
    expect(adjustSetting(store, 'fxLight', 1)).toBe(true);
    expect(store.settings.fxLight).toBe(false);
    const { fxLight: _a, ...rest } = store.settings;
    const { fxLight: _b, ...restBefore } = before;
    expect(rest).toEqual(restBefore);
  });
});
