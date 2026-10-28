// @vitest-environment jsdom
/**
 * PORTABLE SAVES (ChatGPT point 9): the SAVE FILE page in the pause screen (`savePortPage.ts`, wired by
 * `PauseOverlays.ts`, `panels.ts`, `actions.ts`), behind the address word `?saveport=on`, default off.
 *
 * Part A drives the page itself with a stand-in browser (no download folder, no file chooser): export, import to a
 * confirm view, replace, keep, undo, and every refusal, with the store and the slot checked after each. Part B drives
 * the real PauseScreen with real keys and clicks: the row exists only with the word on, Enter opens the page, Esc goes
 * back to the row, a tab change closes it, and a whole export, choose-a-file, replace, undo round trip runs through
 * the real DOM file input.
 *
 * Game case: both games (a save is one file for the whole product). Part B runs on Chapter I (FFX) and Chapter IV (FFX-2).
 */
import { PerspectiveCamera } from 'three';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Input, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import type { App } from '../../src/app/App.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { SavePortPage, type SavePortDeps } from '../../src/app/screens/pause/savePortPage.ts';
import { MAX_SAVE_FILE_BYTES, buildSaveFile, readSaveFile } from '../../src/app/savePort.ts';
import { undoSteps } from '../../src/app/savePortFlow.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';

class Slot {
  readonly map = new Map<string, string>();
  writes = 0;
  failWrites = false;
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.writes++;
    this.map.set(k, String(v));
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}

function pad(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const set = new Set(pressed);
  return {
    pressed: (b) => set.has(b),
    justPressed: (b) => set.has(b),
    justReleased: () => false,
    consume: (b) => set.has(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: true,
    lastDevice: 'gamepad',
  };
}

const T0 = new Date(2026, 9, 28, 12, 0, 0).getTime();

/** A store that has cleared `clears`, on its own slot. */
function played(clears: string[], volume = 0.8): { store: SaveStore; slot: Slot } {
  const slot = new Slot();
  const store = new SaveStore(SAVE_KEY, slot);
  for (const id of clears) {
    store.recordAttempt(id);
    store.addPlayTime(id, 1000);
    store.recordClear(id, 120_000, 10);
  }
  store.setSettings({ masterVolume: volume });
  return { store, slot };
}
const fileText = (clears: string[], volume = 0.3): string => buildSaveFile(played(clears, volume).store.value, T0);

beforeAll(async () => {
  await registerBattleContent();
});
afterEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/');
  resetCoach();
  vi.restoreAllMocks();
});

// =============================================================== part A: the page

interface Rig {
  page: SavePortPage;
  store: SaveStore;
  slot: Slot;
  root: HTMLElement;
  downloads: Array<{ filename: string; text: string }>;
  changed: number;
  pickers: number;
  pickerWorks: boolean;
  downloadWorks: boolean;
  files: Map<File, string | Error>;
}

function rig(clears = ['braskas-final-aeon'], volume = 0.9): Rig {
  const { store, slot } = played(clears, volume);
  const root = document.createElement('div');
  root.innerHTML = '<div data-role="ui"></div>';
  document.body.appendChild(root);
  const r = { store, slot, root, downloads: [], changed: 0, pickers: 0, pickerWorks: true, downloadWorks: true, files: new Map() } as unknown as Rig;
  const deps: Partial<SavePortDeps> = {
    now: () => T0 + 5000,
    download: (filename, text) => {
      r.downloads.push({ filename, text });
      return r.downloadWorks;
    },
    openPicker: () => {
      r.pickers++;
      return r.pickerWorks;
    },
    readText: (file) => {
      const v = r.files.get(file);
      return v instanceof Error || v === undefined ? Promise.reject(v ?? new Error('unknown file')) : Promise.resolve(v);
    },
    changed: () => void r.changed++,
  };
  r.page = new SavePortPage(root, store, deps);
  return r;
}

const rowsOf = (r: Rig): string[] => [...r.root.querySelectorAll<HTMLElement>('.pause__ec-row')].map((e) => e.dataset['row'] ?? '');
const cursorOf = (r: Rig): string | undefined => r.root.querySelector<HTMLElement>('.pause__row--sel')?.dataset['row'];
const statusOf = (r: Rig): string => r.root.querySelector('[data-role="sp-status"]')?.textContent ?? '';
const helpOf = (r: Rig): string[] => [...r.root.querySelectorAll('[data-role="sp-help-desk"] span')].map((e) => e.textContent ?? '');
const press = (r: Rig, ...buttons: Button[]): void => r.page.input(pad(buttons));
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Choose `text` as a file through the page's real file input. */
async function choose(r: Rig, text: string | Error, size?: number): Promise<void> {
  const input = r.root.querySelector<HTMLInputElement>('[data-role="sp-file"]')!;
  const file = new File([typeof text === 'string' ? text : ''], 'save.json');
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
  r.files.set(file, text);
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}

describe('the SAVE FILE page, with a stand-in browser', () => {
  let r: Rig;
  beforeEach(() => {
    r = rig();
  });
  afterEach(() => r.page.dispose());

  it('opens on EXPORT SAVE and IMPORT SAVE; no UNDO until an import has happened', () => {
    expect(rowsOf(r)).toEqual(['export', 'import']);
    expect(cursorOf(r)).toBe('export');
    expect(r.root.querySelector('[data-row="export"] .pause__v')?.textContent).toBe('1 CLEARED');
    expect(r.root.querySelector('.pause__ec-h')?.textContent).toMatch(/^Save file/);
    expect(helpOf(r)).toEqual(['Export save', expect.stringContaining('Nothing leaves this device unless you move the file yourself'), 'Both games.']);
    expect(r.page.snapshot()).toMatchObject({ open: true, mode: 'menu', row: 'export', undoSteps: 0, file: null, status: null });
  });

  it('Up and Down walk the rows and wrap, and the help follows the cursor', () => {
    press(r, 'down');
    expect(cursorOf(r)).toBe('import');
    expect(helpOf(r)[0]).toBe('Import save');
    expect(helpOf(r)[1]).toContain('be asked before anything is replaced');
    press(r, 'down');
    expect(cursorOf(r)).toBe('export');
    press(r, 'up');
    expect(cursorOf(r)).toBe('import');
  });

  it('EXPORT hands over a file that reads back as the save, and changes nothing', () => {
    const writes = r.slot.writes;
    const before = JSON.stringify(r.store.value);
    press(r, 'confirm');
    expect(r.downloads).toHaveLength(1);
    expect(r.downloads[0]!.filename).toBe('echoes-of-spira-save-2026-10-28.json');
    const back = readSaveFile(r.downloads[0]!.text);
    expect(back.ok && back.save.chapters['braskas-final-aeon']?.cleared).toBe(true);
    expect(statusOf(r)).toContain('echoes-of-spira-save-2026-10-28.json');
    expect(r.slot.writes).toBe(writes);
    expect(JSON.stringify(r.store.value)).toBe(before);
    expect(r.changed).toBe(0);
  });

  it('EXPORT does not hand over a file the importer would refuse', () => {
    r.store.setSettings({ masterVolume: Number.NaN });
    press(r, 'confirm');
    expect(r.downloads).toHaveLength(0);
    expect(statusOf(r)).toBe('Your save cannot be made into a file: part of it is damaged. Nothing was saved.');
  });

  it('EXPORT says so when the browser will not keep the file', () => {
    r.downloadWorks = false;
    press(r, 'confirm');
    expect(statusOf(r)).toBe('The browser would not save the file.');
    expect(r.root.querySelector('[data-role="sp-status"]')?.getAttribute('data-tone')).toBe('bad');
  });

  it('IMPORT opens the chooser; when the browser will not (a pad press), it says to use the keyboard or a click', () => {
    press(r, 'down');
    press(r, 'confirm');
    expect(r.pickers).toBe(1);
    expect(statusOf(r)).toBe('Choose a save file.');
    r.pickerWorks = false;
    press(r, 'confirm');
    expect(statusOf(r)).toMatch(/Enter on the keyboard, or click or tap IMPORT SAVE/);
  });

  it('a good file shows what it holds beside what you have, and replaces NOTHING until you say so', async () => {
    const writes = r.slot.writes;
    const before = JSON.stringify(r.store.value);
    await choose(r, fileText(['seymour-flux', 'yunalesca', 'ffx2-bahamut']));
    expect(rowsOf(r)).toEqual(['keep', 'replace']);
    expect(cursorOf(r), 'the safe choice first').toBe('keep');
    const [title, body] = helpOf(r);
    expect(title).toBe('Replace your save?');
    expect(body).toContain('THE FILE HOLDS\n3 CLEARED');
    expect(body).toContain('YOUR SAVE NOW\n1 CLEARED');
    expect(body).toContain('LAST SAVED 2026-10-28');
    expect(r.page.snapshot()).toMatchObject({ mode: 'confirm', file: { cleared: 3, older: false } });
    expect(r.slot.writes).toBe(writes);
    expect(JSON.stringify(r.store.value)).toBe(before);
    expect(undoSteps(r.store)).toBe(0);
  });

  it('REPLACE swaps the whole save, shows UNDO IMPORT, and tells the screen', async () => {
    await choose(r, fileText(['seymour-flux', 'yunalesca']));
    press(r, 'down');
    expect(cursorOf(r)).toBe('replace');
    press(r, 'confirm');
    expect(Object.keys(r.store.value.chapters).sort()).toEqual(['seymour-flux', 'yunalesca']);
    expect(r.store.settings.masterVolume).toBe(0.3);
    expect(new SaveStore(SAVE_KEY, r.slot).isCleared('yunalesca')).toBe(true);
    expect(rowsOf(r)).toEqual(['export', 'import', 'undo']);
    expect(cursorOf(r)).toBe('undo');
    expect(statusOf(r)).toMatch(/^Save replaced\. UNDO IMPORT puts your earlier save back/);
    expect(r.changed).toBe(1);
    expect(r.store.value.updatedAt).toBe(T0 + 5000);
    expect(r.page.snapshot()).toMatchObject({ mode: 'menu', undoSteps: 1, file: null });
  });

  it('KEEP MY SAVE drops the file and changes nothing', async () => {
    const before = JSON.stringify(r.store.value);
    const writes = r.slot.writes;
    await choose(r, fileText(['seymour-flux']));
    press(r, 'confirm'); // the cursor starts on KEEP
    expect(rowsOf(r)).toEqual(['export', 'import']);
    expect(statusOf(r)).toBe('Nothing was changed.');
    expect(JSON.stringify(r.store.value)).toBe(before);
    expect(r.slot.writes).toBe(writes);
    expect(r.page.snapshot()).toMatchObject({ mode: 'menu', file: null });
  });

  it('UNDO IMPORT puts the earlier save back exactly, and the row goes away', async () => {
    const strip = (s: unknown): string => JSON.stringify({ ...(JSON.parse(JSON.stringify(s)) as object), updatedAt: 0 });
    const original = strip(r.store.value);
    await choose(r, fileText(['seymour-flux']));
    press(r, 'down');
    press(r, 'confirm'); // replace
    press(r, 'confirm'); // the cursor is on UNDO IMPORT
    expect(strip(r.store.value)).toBe(original);
    expect(statusOf(r)).toBe('Your earlier save is back.');
    expect(rowsOf(r)).toEqual(['export', 'import']);
    expect(cursorOf(r)).toBe('export');
    expect(r.changed).toBe(2);
  });

  it('two wrong imports in a row can both be undone', async () => {
    const strip = (s: unknown): string => JSON.stringify({ ...(JSON.parse(JSON.stringify(s)) as object), updatedAt: 0 });
    const original = strip(r.store.value);
    for (const id of ['seymour-flux', 'yunalesca']) {
      press(r, 'up'); // wrap to the last row, then walk to IMPORT SAVE
      while (cursorOf(r) !== 'import') press(r, 'down');
      await choose(r, fileText([id]));
      press(r, 'down');
      press(r, 'confirm');
    }
    expect(undoSteps(r.store)).toBe(2);
    expect(r.root.querySelector('[data-row="undo"] .pause__v')?.textContent).toBe('2 STEPS');
    while (cursorOf(r) !== 'undo') press(r, 'down');
    press(r, 'confirm');
    press(r, 'confirm');
    expect(strip(r.store.value)).toBe(original);
  });

  describe('a refused file says why and touches nothing', () => {
    const good = fileText(['seymour-flux']);
    const cases: Array<[string, () => string, RegExp]> = [
      ['a damaged file', () => good.replace('"attempts": 1', '"attempts": 7'), /does not match its checksum/],
      ['a cut-off file', () => good.slice(0, good.length >> 1), /cannot be read as a save file/],
      ['another game’s file', () => JSON.stringify({ format: 'other-game', save: {} }), /not an Echoes of Spira save file/],
      ['a bare copy of the stored blob', () => JSON.stringify(played(['seymour-flux']).store.value), /not an Echoes of Spira save file/],
      ['a newer save', () => good.replace(/"saveVersion": 1/, '"saveVersion": 2').replace(/"version": 1/, '"version": 2'), /newer version of the game/],
      ['an empty file', () => '', /cannot be read as a save file/],
      ['a list', () => '[1,2,3]', /cannot be read as a save file/],
    ];
    for (const [name, make, message] of cases) {
      it(name, async () => {
        const before = JSON.stringify(r.store.value);
        const writes = r.slot.writes;
        await choose(r, make());
        expect(statusOf(r)).toMatch(message);
        expect(r.root.querySelector('[data-role="sp-status"]')?.getAttribute('data-tone')).toBe('bad');
        expect(rowsOf(r)).toEqual(['export', 'import']);
        expect(JSON.stringify(r.store.value)).toBe(before);
        expect(r.slot.writes).toBe(writes);
        expect(undoSteps(r.store)).toBe(0);
        expect(r.changed).toBe(0);
      });
    }

    it('a huge file is refused by its size, before it is read', async () => {
      const read = vi.fn();
      const file = new File(['x'], 'big.json');
      Object.defineProperty(file, 'size', { value: MAX_SAVE_FILE_BYTES + 1 });
      const input = r.root.querySelector<HTMLInputElement>('[data-role="sp-file"]')!;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      r.files.set(file, 'x');
      const original = r.page as unknown as { deps: SavePortDeps };
      original.deps.readText = (f) => (read(f), Promise.resolve('x'));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await settle();
      expect(read).not.toHaveBeenCalled();
      expect(statusOf(r)).toBe('That file is too big to be a save file.');
    });

    it('a file the browser cannot read', async () => {
      await choose(r, new Error('NotReadableError'));
      expect(statusOf(r)).toBe('The browser could not read that file.');
      expect(rowsOf(r)).toEqual(['export', 'import']);
    });
  });

  it('a store that will not write is left as it was, and the page says so', async () => {
    await choose(r, fileText(['seymour-flux']));
    const before = JSON.stringify(r.store.value);
    r.slot.failWrites = true;
    press(r, 'down');
    press(r, 'confirm'); // REPLACE
    expect(statusOf(r)).toBe('The browser would not let the game write the save. Nothing was changed.');
    expect(JSON.stringify(r.store.value)).toBe(before);
    expect(undoSteps(r.store)).toBe(0);
    expect(rowsOf(r)).toEqual(['export', 'import']);
    expect(r.changed).toBe(0);
  });

  it('closing the page with a file chosen and not confirmed drops it: nothing is replaced', async () => {
    const before = JSON.stringify(r.store.value);
    await choose(r, fileText(['seymour-flux']));
    r.page.dispose();
    expect(JSON.stringify(r.store.value)).toBe(before);
    expect(undoSteps(r.store)).toBe(0);
  });

  it('closing the page while a file is still being read ends quietly', async () => {
    const before = JSON.stringify(r.store.value);
    let release: (text: string) => void = () => {};
    (r.page as unknown as { deps: SavePortDeps }).deps.readText = () => new Promise<string>((resolve) => (release = resolve));
    const input = r.root.querySelector<HTMLInputElement>('[data-role="sp-file"]')!;
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.json')], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(r.page.snapshot()['busy']).toBe(true);
    // while it is read, a second press does nothing
    press(r, 'confirm');
    r.page.dispose();
    release(fileText(['seymour-flux']));
    await settle();
    expect(JSON.stringify(r.store.value)).toBe(before);
  });

  it('a tap on a row acts on it (the Input’s row action)', () => {
    r.page.input(pad([], ['pause:sp:row:export']));
    expect(r.downloads).toHaveLength(1);
    r.page.input(pad([], ['pause:sp:row:replace'])); // not a row of this view: ignored
    r.page.input(pad([], ['pause:sp:row:nonsense']));
    expect(r.changed).toBe(0);
  });

  it('a click on IMPORT SAVE opens the chooser inside the click itself (no wait for the next frame), and the row has no data-action to open it twice', () => {
    const row = r.root.querySelector<HTMLElement>('[data-row="import"]')!;
    expect(row.hasAttribute('data-action')).toBe(false);
    row.click();
    expect(r.pickers).toBe(1);
    expect(cursorOf(r)).toBe('import');
    expect(statusOf(r)).toBe('Choose a save file.');
    // the other rows keep their action for the Input
    expect(r.root.querySelector('[data-row="export"]')!.getAttribute('data-action')).toBe('pause:sp:row:export');
  });

  it('a click on IMPORT SAVE while a file is being read, or in the confirm view, does nothing', async () => {
    await choose(r, fileText(['seymour-flux']));
    expect(rowsOf(r)).toEqual(['keep', 'replace']);
    r.root.querySelector<HTMLElement>('[data-row="keep"]')!.click();
    expect(r.pickers).toBe(0);
  });

  it('is drawn in the EYE CANDY page’s classes and stays out of the way of the OPTIONS rows', () => {
    expect(r.root.querySelector('.pause__ec')).not.toBeNull();
    expect(r.root.className).toContain('pause--ec');
    r.page.dispose();
    expect(r.root.className).not.toContain('pause--ec');
    expect(r.root.querySelector('.pause__ec')).toBeNull();
  });
});

// ================================================= part B: the real pause screen

interface Harness {
  screen: PauseScreen;
  store: SaveStore;
  slot: Slot;
  input: Input;
  root: HTMLElement;
  clock: number;
  dispose(): void;
}
let live: Harness | null = null;

function mount(chapterId: string): Harness {
  const chapter = getChapter(chapterId)!;
  const slot = new Slot();
  const store = new SaveStore(SAVE_KEY, slot);
  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);
  const h = { store, slot, input, root, clock: 0 } as unknown as Harness;
  const screen = new PauseScreen({ chapter, chainLength: 1, onResume: () => {}, onRestart: () => {}, onChapterSelect: () => {}, onQuitToTitle: () => {} });
  const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 100);
  screen.app = { save: store, input, screens: [screen], renderer: { camera } } as unknown as App;
  screen.root = root;
  void screen.enter();
  h.screen = screen;
  h.dispose = () => {
    screen.exit();
    input.detach();
    root.remove();
  };
  live = h;
  return h;
}
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
const tap = (h: Harness, selector: string): void => {
  h.root.querySelector<HTMLElement>(selector)!.click();
  frame(h);
};
const snap = (h: Harness): Record<string, unknown> => h.screen.snapshot();
const page = (h: Harness): Record<string, unknown> | null => (snap(h)['saveFile'] as Record<string, unknown> | null | undefined) ?? null;
const encounterRows = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('.pause__col[data-col="encounter"] .pause__row[data-row]')].map((e) => e.dataset['row'] ?? '');
const withWord = (): void => window.history.replaceState({}, '', '/?saveport=on');

afterEach(() => {
  live?.dispose();
  live = null;
});

describe.each([
  ['FFX', 'seymour-flux'],
  ['FFX-2', 'ffx2-bahamut'],
] as const)('the SAVE FILE row in the real pause screen, %s', (_game, chapterId) => {
  it('with the word OFF there is no row, no page and no key in the debug view', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    expect(encounterRows(h)).not.toContain('saveFile');
    expect(h.root.querySelector('[data-row="saveFile"]')).toBeNull();
    expect(Object.keys(snap(h))).not.toContain('saveFile');
    expect(Object.keys(snap(h))).toEqual(expect.arrayContaining(['credits', 'eyeCandy', 'presentation']));
  });

  it('any other word is off too', () => {
    for (const word of ['off', '0', 'yes', '']) {
      window.history.replaceState({}, '', `/?saveport=${word}`);
      const h = mount(chapterId);
      h.screen.trigger('pause:tab:options');
      expect(encounterRows(h), word).not.toContain('saveFile');
      h.dispose();
      live = null;
    }
  });

  it('with the word ON the row sits under Credits, in a PROGRESS group, and a click opens the page', () => {
    withWord();
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    const rows = encounterRows(h);
    expect(rows.slice(-4)).toEqual(['about', 'credits', 'data', 'saveFile']);
    expect(h.root.querySelector('.pause__col[data-col="encounter"] [data-row="saveFile"] .pause__k')?.textContent).toBe('Save file');
    expect(h.root.querySelector('.pause__col[data-col="encounter"] [data-row="data"]')?.textContent).toContain('Progress');
    tap(h, '[data-row="saveFile"]');
    expect(page(h)).toMatchObject({ open: true, mode: 'menu', row: 'export' });
    expect(snap(h)['credits']).toBeNull();
    expect(h.root.querySelector('.pause__ec-h')?.textContent).toMatch(/^Save file/);
  });

  it('Esc goes back to the row; a tab change closes the page; the other pages cannot open over it', () => {
    withWord();
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    tap(h, '[data-row="saveFile"]');
    expect(page(h)).not.toBeNull();
    tap(h, '[data-row="credits"]'); // already hidden behind the page, and the pages exclude one another
    expect(snap(h)['credits']).toBeNull();
    key(h, 'Escape');
    expect(page(h)).toBeNull();
    expect(h.root.querySelector('.pause__ec')).toBeNull();
    expect((document.activeElement as HTMLElement | null)?.dataset['row']).toBe('saveFile');
    tap(h, '[data-row="saveFile"]');
    expect(page(h)).not.toBeNull();
    h.screen.trigger('pause:tab:accessibility');
    expect(page(h)).toBeNull();
  });

  it('a whole round trip through the real file input: export, choose a file, replace, undo', async () => {
    withWord();
    // The browser's side: a download that can be read back, and a chooser that is only asked for.
    const kept: Array<{ name: string; blob: Blob }> = [];
    let pending: Blob | null = null;
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (b) => ((pending = b), 'blob:save');
    (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {};
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      kept.push({ name: this.download, blob: pending! });
    });
    const picked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});

    const h = mount(chapterId);
    h.store.recordClear('seymour-flux', 120_000, 11);
    h.store.setSettings({ masterVolume: 0.4 });
    h.screen.trigger('pause:tab:options');
    tap(h, '[data-row="saveFile"]');

    // EXPORT by Enter (the cursor starts there)
    key(h, 'Enter');
    expect(kept).toHaveLength(1);
    expect(kept[0]!.name).toMatch(/^echoes-of-spira-save-\d{4}-\d{2}-\d{2}\.json$/);
    const exported = await kept[0]!.blob.text();
    const readBack = readSaveFile(exported);
    expect(readBack.ok && readBack.save.settings.masterVolume).toBe(0.4);

    // The player carries on: more progress, a different volume.
    h.store.recordClear('yunalesca', 100_000, 9);
    h.store.setSettings({ masterVolume: 1 });

    // IMPORT: a real click opens the chooser inside the click (before any frame runs); then Enter (the polled path) opens it again.
    h.root.querySelector<HTMLElement>('[data-row="import"]')!.click();
    expect(picked).toHaveBeenCalledTimes(1);
    key(h, 'Enter'); // the click left the cursor on IMPORT SAVE
    expect(picked).toHaveBeenCalledTimes(2);
    expect(kept).toHaveLength(1); // ...and that Enter did not export again
    const input = h.root.querySelector<HTMLInputElement>('[data-role="sp-file"]')!;
    Object.defineProperty(input, 'files', { value: [new File([exported], kept[0]!.name)], configurable: true });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(page(h)?.['mode']).toBe('confirm'));
    expect(page(h)).toMatchObject({ row: 'keep', file: { cleared: 1 } });
    expect(h.store.isCleared('yunalesca'), 'nothing is replaced yet').toBe(true);

    // REPLACE by Down, Enter.
    key(h, 'ArrowDown');
    key(h, 'Enter');
    expect(h.store.isCleared('yunalesca')).toBe(false);
    expect(h.store.isCleared('seymour-flux')).toBe(true);
    expect(h.store.settings.masterVolume).toBe(0.4);
    expect(page(h)).toMatchObject({ mode: 'menu', row: 'undo', undoSteps: 1 });
    expect(new SaveStore(SAVE_KEY, h.slot).settings.masterVolume).toBe(0.4);

    // UNDO by Enter.
    key(h, 'Enter');
    expect(h.store.isCleared('yunalesca')).toBe(true);
    expect(h.store.settings.masterVolume).toBe(1);
    expect(page(h)).toMatchObject({ undoSteps: 0, row: 'export' });
  });
});
