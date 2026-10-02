// @vitest-environment jsdom
/**
 * Eye-candy D's three looks (Bailey, 2026-09-29 ~23:45 EDT: "in the settings I want to be able to turn
 * each one off. Default will be on."): CINEMA LIGHT, LIVING PAINTINGS and BATTLE SPECTACLE. Since D-317
 * (option A, 2026-10-02) they are no longer three OPTIONS rows: one EYE CANDY row sits where they were,
 * under LOW EFFECTS, and opens a page on which they are the masters of their parts. They keep their ids,
 * their `adjustSetting` path and their meaning: by the real input paths (keys through the real `Input`, a
 * tap as a DOM click on the row) each flips and switches its look live (no reload). FF7 draws no eye
 * candy, so its pause shows no EYE CANDY row.
 *
 * Game case: both (FFX and FFX-2 share the three switches).
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
import { FX_SWITCH_FIELDS, fxAllOnPatch } from '../../src/app/fxParts.ts';
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
/** The page's cursor while it is up (the OPTIONS list keeps its own under it), else the list's. */
const selected = (h: Harness): string | undefined =>
  (h.root.querySelector<HTMLElement>('.pause__ec .pause__row--sel') ?? h.root.querySelector<HTMLElement>('.pause__row--sel'))?.dataset['row'];
const valueOf = (h: Harness, id: string): string =>
  (h.root.querySelector<HTMLElement>(`.pause__row[data-row="${id}"] .pause__v`)?.textContent ?? '').trim();

/** Real Down presses until `id` is the selected row (the OPTIONS list or the page, whichever is up). */
function selectRow(h: Harness, id: string): void {
  for (let i = 0; i < 20 && selected(h) !== id; i++) key(h, 'ArrowDown');
  expect(selected(h)).toBe(id);
}

/** OPTIONS, then real keys to the EYE CANDY row and Enter: the page is up. */
function openPage(h: Harness): void {
  h.screen.trigger('pause:tab:options');
  selectRow(h, 'eyeCandy');
  key(h, 'Enter');
  expect(h.root.querySelector('.pause__ec'), 'the EYE CANDY page').not.toBeNull();
}

beforeAll(async () => {
  await registerBattleContent();
});
afterEach(() => {
  live?.dispose();
  live = null;
  resetCoach();
  setOnboardingLive(false);
  applyComfort(fxAllOnPatch());
});

const LOOK_IDS = ['fxLight', 'fxLiving', 'fxSpectacle'] as const;
const settingsRows = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('.pause__col[data-col="settings"] .pause__row')].map((r) => r.dataset['row'] ?? '');

describe('one EYE CANDY row where the three were', () => {
  it('sits under LOW EFFECTS, reads ALL ON by default, in both games; the three look rows are gone', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      const h = mount(id);
      h.screen.trigger('pause:tab:options');
      const rows = settingsRows(h);
      const at = rows.indexOf('lowEffects');
      expect(rows.slice(at, at + 2), id).toEqual(['lowEffects', 'eyeCandy']);
      for (const r of LOOK_IDS) expect(rows, r).not.toContain(r);
      expect(valueOf(h, 'eyeCandy')).toBe('ALL ON');
      h.dispose();
      live = null;
    }
  });

  it('uses the plain uppercase words; its value counts what plays (ALL ON, n OF 11, ALL OFF)', () => {
    const base = new SaveStore('x', memoryStorage()).settings;
    const row = (s: typeof base, game: 'ffx' | 'ffx2') => optionRows(s, game).find((r) => r.id === 'eyeCandy');
    expect(row(base, 'ffx')).toMatchObject({ label: 'EYE CANDY', value: 'ALL ON', ratio: null });
    // LIVING PAINTINGS off stops its two parts too: 11 - 3 = 8 play.
    expect(row({ ...base, fxLiving: false }, 'ffx')!.value).toBe('8 OF 11');
    // OVERDRIVE SHOT is FFX only: switched off, it costs FFX one and FFX-2 nothing.
    expect(row({ ...base, fxHero: false }, 'ffx')!.value).toBe('10 OF 11');
    expect(row({ ...base, fxHero: false }, 'ffx2')!.value).toBe('ALL ON');
    expect(row({ ...base, fxLight: false, fxLiving: false, fxSpectacle: false }, 'ffx2')!.value).toBe('ALL OFF');
  });

  it('is not in the FF7 pause, which draws no eye candy', () => {
    const h = mount('ff7-guard-scorpion');
    h.screen.trigger('pause:tab:options');
    const rows = settingsRows(h);
    expect(rows).toContain('lowEffects');
    expect(rows).not.toContain('eyeCandy');
    for (const r of LOOK_IDS) expect(rows).not.toContain(r);
  });
});

describe('the three looks on the page: keys and taps switch the look live', () => {
  it('Enter, Right and Left flip each look; the save and the live look follow at once', () => {
    const h = mount('seymour-flux');
    openPage(h);
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
    expect(h.store.settings.fxDof, 'a look never rewrites its parts').toBe(true);
  });

  it('a tap flips a look, as it did on the OPTIONS list', () => {
    const h = mount('ffx2-bahamut');
    h.screen.trigger('pause:tab:options');
    const tap = (id: string): void => {
      h.root.querySelector<HTMLElement>(`.pause__row[data-row="${id}"]`)!.click();
      frame(h);
    };
    tap('eyeCandy');
    tap('fxSpectacle');
    expect(h.store.settings.fxSpectacle).toBe(false);
    expect(eyeCandy.on.c).toBe(false);
    expect(valueOf(h, 'fxSpectacle')).toBe('OFF');
    tap('fxSpectacle');
    expect(eyeCandy.on.c).toBe(true);
  });

  it('adjustSetting knows the twelve ids, flips only the one named, and nothing else changes', () => {
    const store = new SaveStore('adjust-fx', memoryStorage());
    const before = { ...store.settings };
    expect(adjustSetting(store, 'fxLight', 1, true)).toBe(true);
    expect(adjustSetting(store, 'fxLight', -1)).toBe(true);
    expect(adjustSetting(store, 'fxLight', 1)).toBe(true);
    expect(store.settings.fxLight).toBe(false);
    const { fxLight: _a, ...rest } = store.settings;
    const { fxLight: _b, ...restBefore } = before;
    expect(rest).toEqual(restBefore);
    for (const f of FX_SWITCH_FIELDS) {
      const was = store.settings[f];
      expect(adjustSetting(store, f, 1, true), f).toBe(true);
      expect(store.settings[f], f).toBe(!was);
    }
    expect(adjustSetting(store, 'fxAll', 1, true), 'ALL LOOKS is the page’s, not a setting').toBe(false);
  });
});
