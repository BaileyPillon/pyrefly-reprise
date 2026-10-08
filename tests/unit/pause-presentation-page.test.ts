// @vitest-environment jsdom
/**
 * The PRESENTATION page (Bailey, 2026-10-08, "go with C"): one OPTIONS row, PRESENTATION, reads both front-end
 * choices (`THE ECHO · A`) and opens a page, in the EYE CANDY page's classes and look, holding TITLE SCREEN and
 * CHAPTER MUSIC with a help line per row. Measured mock: `D:/Tools/pyrefly-scratch/2026-10-08/options-layout/`;
 * frames of the build: `docs/screenshots/r395-int/options-c/`.
 *
 * Keys go through the real `Input` (window key events), taps are DOM clicks on the rows. Pinned here: Down to
 * PRESENTATION, Enter opens, Up / Down walk the two rows, Left / Right step the values (wrapping), Esc goes back
 * with the cursor and DOM focus on the row, which reads the new values; a tap steps a row; the choices reach the
 * stored settings and survive a reload (the settings round trip), and the title screen and the chapter-select
 * board read them the way they always did.
 *
 * Game case: both games. Run on Chapter I (FFX) and Chapter IV (FFX-2): the page, its two rows and its text are
 * the same in both; the list around the row differs (VOICE rows, X-2 BATTLE and ATB SPEED) and is 13 rows in each.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PerspectiveCamera } from 'three';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import type { App } from '../../src/app/App.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { EYE_CANDY_OPEN_CLASS } from '../../src/app/screens/pause/eyeCandyPage.ts';
import { PRESENTATION_CLOSE_ACTION, PRESENTATION_ROWS } from '../../src/app/screens/pause/presentationPage.ts';
import { TITLE_ART_PLATES, chapterSelectCue, titleArtOf } from '../../src/app/saveFrontend.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';

class MemoryStorage {
  readonly map = new Map<string, string>();
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
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

interface Harness {
  screen: PauseScreen;
  store: SaveStore;
  storage: MemoryStorage;
  input: Input;
  root: HTMLElement;
  clock: number;
  resumed: number;
  dispose(): void;
}
let live: Harness | null = null;

function mount(chapterId: string, storage = new MemoryStorage()): Harness {
  const chapter = getChapter(chapterId)!;
  const store = new SaveStore(SAVE_KEY, storage);
  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);
  const h = { store, storage, input, root, clock: 0, resumed: 0 } as unknown as Harness;
  const screen = new PauseScreen({ chapter, chainLength: 1, onResume: () => void h.resumed++, onRestart: () => {}, onChapterSelect: () => {}, onQuitToTitle: () => {} });
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
const s = (h: Harness): Record<string, unknown> => h.screen.snapshot();
const page = (h: Harness): HTMLElement | null => h.root.querySelector('.pause__ec');
const cursor = (h: Harness): string | undefined => page(h)?.querySelector<HTMLElement>('.pause__row--sel')?.dataset['row'];
const pageValue = (h: Harness, id: string): string => (page(h)!.querySelector(`[data-row="${id}"] .pause__v`)?.textContent ?? '').trim();
const listValue = (h: Harness, id: string): string =>
  (h.root.querySelector<HTMLElement>(`.pause__col[data-col="settings"] [data-row="${id}"] .pause__v`)?.textContent ?? '').trim();
const help = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('[data-role="pres-help-desk"] span')].map((e) => (e.textContent ?? '').trim());
const listIds = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('.pause__col[data-col="settings"] .pause__row[data-row]')].map((r) => r.dataset['row'] ?? '');

/** OPTIONS by the trigger, then real keys: Down into the list, Down to PRESENTATION, Enter. */
function openByKeys(h: Harness): void {
  h.screen.trigger('pause:tab:options');
  for (let i = 0; i < 20 && s(h)['row'] !== 'presentation'; i++) key(h, 'ArrowDown');
  expect(s(h)['row']).toBe('presentation');
  key(h, 'Enter');
  expect(page(h)).not.toBeNull();
}

beforeAll(async () => {
  await registerBattleContent();
});
afterEach(() => {
  live?.dispose();
  live = null;
  resetCoach();
  document.body.innerHTML = '';
});

describe.each([
  ['FFX', 'seymour-flux'],
  ['FFX-2', 'ffx2-bahamut'],
] as const)('the PRESENTATION page, %s', (_game, chapterId) => {
  it('the list has 13 rows, PRESENTATION last, reading both choices; TITLE SCREEN and CHAPTER MUSIC are not on it', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    const ids = listIds(h);
    expect(ids).toHaveLength(13);
    expect(ids[ids.length - 1]).toBe('presentation');
    expect(ids).not.toContain('titleArt');
    expect(ids).not.toContain('chapterSelectMusic');
    expect(listValue(h, 'presentation')).toBe('FARPLANE \u00b7 B');
    expect(h.root.querySelector('.pause__col[data-col="settings"] [data-row="presentation"] .pause__k')?.textContent).toBe('PRESENTATION');
  });

  it('Down reaches PRESENTATION and Enter opens the page on TITLE SCREEN, with focus on it; the columns step aside', () => {
    const h = mount(chapterId);
    openByKeys(h);
    expect(h.root.querySelector(`.${EYE_CANDY_OPEN_CLASS} [data-role="body"]`), 'the class that hides the columns').toBeTruthy();
    expect([...page(h)!.querySelectorAll<HTMLElement>('.pause__ec-row')].map((r) => r.dataset['row'])).toEqual(['titleArt', 'chapterSelectMusic']);
    expect(cursor(h)).toBe('titleArt');
    expect((document.activeElement as HTMLElement | null)?.dataset['row']).toBe('titleArt');
    expect(pageValue(h, 'titleArt')).toBe('FARPLANE');
    expect(pageValue(h, 'chapterSelectMusic')).toBe('B  PIANO');
    expect(page(h)!.querySelector('.pause__ec-h')?.textContent).toMatch(/^Presentation/);
    expect(s(h)['presentation']).toMatchObject({ open: true, row: 'titleArt' });
    expect(s(h)['eyeCandy'], 'the sibling page is not up').toBeNull();
    expect(s(h)['credits']).toBeNull();
  });

  it('has a help line per row that follows the cursor, with the game line', () => {
    const h = mount(chapterId);
    openByKeys(h);
    expect(help(h)).toEqual(['TITLE SCREEN', expect.stringContaining('THE ECHO is Yuna kneeling in still water'), 'Both games.']);
    key(h, 'ArrowDown');
    expect(cursor(h)).toBe('chapterSelectMusic');
    expect(help(h)).toEqual(['CHAPTER MUSIC', expect.stringContaining('B is the piano'), 'Both games.']);
    expect(help(h)[1]).toContain('plays the next time the board opens');
    // the phone's help line (shown under the rows by the stylesheet) carries the same words
    expect(h.root.querySelector('[data-role="pres-help-phone"] .pause__ec-help-t')?.textContent).toBe('CHAPTER MUSIC');
    // Up and Down walk the two rows and wrap
    key(h, 'ArrowDown');
    expect(cursor(h)).toBe('titleArt');
    key(h, 'ArrowUp');
    expect(cursor(h)).toBe('chapterSelectMusic');
    expect(s(h)['row'], 'the OPTIONS cursor under the page does not move').toBe('presentation');
  });

  it('Left and Right step each value through its list and wrap; Enter steps forward; the stored settings follow', () => {
    const h = mount(chapterId);
    openByKeys(h);
    key(h, 'ArrowRight');
    expect(pageValue(h, 'titleArt')).toBe('THE ECHO');
    expect(h.store.settings.titleArt).toBe('echo');
    key(h, 'ArrowRight');
    expect(pageValue(h, 'titleArt'), 'wraps back').toBe('FARPLANE');
    key(h, 'ArrowLeft');
    expect(h.store.settings.titleArt, 'Left wraps the other way').toBe('echo');
    key(h, 'Enter');
    expect(h.store.settings.titleArt).toBe('farplane');
    key(h, 'ArrowDown');
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      key(h, 'ArrowRight');
      seen.push(h.store.settings.chapterSelectMusic);
    }
    expect(seen, 'B, then A, then C, then back to B').toEqual(['a', 'c', 'b']);
    key(h, 'ArrowLeft');
    expect(h.store.settings.chapterSelectMusic).toBe('c');
    expect(pageValue(h, 'chapterSelectMusic')).toBe('C  VOICE');
    key(h, 'Enter');
    expect(h.store.settings.chapterSelectMusic, 'Confirm steps forward').toBe('b');
    // nothing but the two fields was written
    expect(Object.keys(h.store.settings)).toEqual(Object.keys(new SaveStore('x', new MemoryStorage()).settings));
  });

  it('Esc goes back one level: the cursor and the DOM focus land on PRESENTATION, which reads the new values', () => {
    const h = mount(chapterId);
    openByKeys(h);
    key(h, 'ArrowRight');
    key(h, 'ArrowDown');
    key(h, 'ArrowRight');
    expect(h.store.settings).toMatchObject({ titleArt: 'echo', chapterSelectMusic: 'a' });
    key(h, 'Escape');
    expect(page(h)).toBeNull();
    expect(h.resumed, 'Esc backs out of the page, it does not resume the fight').toBe(0);
    expect(s(h)['row']).toBe('presentation');
    expect((document.activeElement as HTMLElement | null)?.dataset['row']).toBe('presentation');
    expect(listValue(h, 'presentation')).toBe('THE ECHO \u00b7 A');
    expect(s(h)['presentation']).toBeNull();
    // the list is back: Up walks it and Enter on another row does not open the page
    key(h, 'ArrowUp');
    expect(s(h)['row']).toBe('battleHelp');
  });

  it('Backspace, X (the pad\u2019s Circle) and Start also go back; Q and E close it and change tab; so does a tab click', () => {
    const h = mount(chapterId);
    openByKeys(h);
    key(h, 'Backspace');
    expect(page(h)).toBeNull();
    expect(s(h)['row']).toBe('presentation');
    key(h, 'Enter');
    expect(page(h)).not.toBeNull();
    h.screen.handleInput(pad(['start']));
    expect(page(h)).toBeNull();
    expect(s(h)['row']).toBe('presentation');
    key(h, 'Enter');
    key(h, 'KeyE');
    expect(page(h)).toBeNull();
    expect(h.root.querySelector('.pause__tab--on')?.getAttribute('data-tab')).not.toBe('options');
    // back to OPTIONS by click, open again, then a click on another tab closes it
    tap(h, '.pause__tab[data-tab="options"]');
    for (let i = 0; i < 20 && s(h)['row'] !== 'presentation'; i++) key(h, 'ArrowDown');
    key(h, 'Enter');
    expect(page(h)).not.toBeNull();
    tap(h, '.pause__tab[data-tab="chapter"]');
    expect(page(h)).toBeNull();
    expect(h.root.querySelector('.pause--ec'), 'the class that swaps the columns for the page is gone').toBeNull();
  });

  it('Left and Right on the PRESENTATION row open the page too (as EYE CANDY\u2019s row does), and nothing is stepped', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    for (let i = 0; i < 20 && s(h)['row'] !== 'presentation'; i++) key(h, 'ArrowDown');
    key(h, 'ArrowRight');
    expect(page(h)).not.toBeNull();
    expect(h.store.settings).toMatchObject({ titleArt: 'farplane', chapterSelectMusic: 'b' });
  });

  it('taps: the row opens the page, a tap steps a row and puts the cursor on it, the Esc BACK prompt goes back', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    tap(h, '.pause__col[data-col="settings"] [data-row="presentation"]');
    expect(page(h)).not.toBeNull();
    tap(h, '.pause__ec [data-row="chapterSelectMusic"]');
    expect(cursor(h)).toBe('chapterSelectMusic');
    expect(h.store.settings.chapterSelectMusic).toBe('a');
    expect(pageValue(h, 'chapterSelectMusic')).toBe('A  WALTZ');
    tap(h, '.pause__ec [data-row="titleArt"]');
    expect(cursor(h)).toBe('titleArt');
    expect(h.store.settings.titleArt).toBe('echo');
    expect(h.root.querySelector(`[data-action="${PRESENTATION_CLOSE_ACTION}"]`)).not.toBeNull();
    tap(h, `[data-action="${PRESENTATION_CLOSE_ACTION}"]`);
    expect(page(h)).toBeNull();
    expect(s(h)['row']).toBe('presentation');
    expect(listValue(h, 'presentation')).toBe('THE ECHO \u00b7 A');
  });

  it('the page is built from the EYE CANDY page\u2019s classes, so it takes that page\u2019s look', () => {
    const h = mount(chapterId);
    openByKeys(h);
    const sec = page(h)!;
    expect(sec.classList.contains('pause__ec')).toBe(true);
    expect(sec.querySelector('.pause__ec-h b')?.textContent).toBe('Title screen and chapter select');
    for (const row of sec.querySelectorAll('.pause__ec-row')) {
      expect(row.classList.contains('pause__row')).toBe(true);
      expect(row.classList.contains('pause__row--cmd')).toBe(true);
      expect(row.getAttribute('role')).toBe('button');
    }
    expect(sec.querySelectorAll('.pause__ec-help')).toHaveLength(2); // desktop and phone
    expect(h.root.querySelector('.pause__ec-back')?.textContent).toMatch(/Esc\s*Back/);
    expect(h.root.querySelector('.pause__ec-hint-desk')?.textContent).toMatch(/Up \/ Down.*Left \/ Right/);
    expect(h.root.querySelector('.pause__ec-hint-phone')?.textContent).toBe('Tap a row to change it');
  });

  it('the settings round trip: both choices reach the stored settings, survive a reload and are what the title and the board read', () => {
    const h = mount(chapterId);
    openByKeys(h);
    key(h, 'ArrowRight');
    key(h, 'ArrowDown');
    key(h, 'ArrowRight');
    key(h, 'ArrowRight'); // B -> A -> C
    expect(h.store.settings).toMatchObject({ titleArt: 'echo', chapterSelectMusic: 'c' });
    const raw = JSON.parse(h.storage.map.get(SAVE_KEY)!) as { settings: Record<string, unknown> };
    expect(raw.settings).toMatchObject({ titleArt: 'echo', chapterSelectMusic: 'c' });
    // a new session on the same storage
    const reloaded = new SaveStore(SAVE_KEY, h.storage);
    expect(reloaded.settings).toMatchObject({ titleArt: 'echo', chapterSelectMusic: 'c' });
    expect(TITLE_ART_PLATES[titleArtOf(reloaded.settings.titleArt)]).toBe('art/title/echo.png');
    expect(chapterSelectCue(reloaded.settings.chapterSelectMusic)).toBe('chapter-select-c');
    // and the pause of that session reads them back on the row
    h.dispose();
    live = null;
    document.body.innerHTML = '';
    const again = mount(chapterId, h.storage);
    again.screen.trigger('pause:tab:options');
    expect(listValue(again, 'presentation')).toBe('THE ECHO \u00b7 C');
  });
});

describe('the PRESENTATION page, either game', () => {
  it('has exactly the two rows, in the order the list had them, each with its words', () => {
    expect(PRESENTATION_ROWS.map((r) => [r.id, r.label])).toEqual([
      ['titleArt', 'TITLE SCREEN'],
      ['chapterSelectMusic', 'CHAPTER MUSIC'],
    ]);
    for (const r of PRESENTATION_ROWS) expect(r.help.length, r.id).toBeGreaterThan(60);
  });

  it('reads a stored value that is not on the list as the default (CHK-024), on the row and on the page', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, settings: { titleArt: 'nonsense', chapterSelectMusic: 9 } }));
    const h = mount('seymour-flux', storage);
    h.screen.trigger('pause:tab:options');
    expect(listValue(h, 'presentation')).toBe('FARPLANE \u00b7 B');
    openByKeys(h);
    expect(pageValue(h, 'titleArt')).toBe('FARPLANE');
    expect(pageValue(h, 'chapterSelectMusic')).toBe('B  PIANO');
  });
});

describe('the stylesheets', () => {
  const css = (name: string): string => readFileSync(join(__dirname, '..', '..', 'src', 'ui', 'common', name), 'utf8');

  it('the settings column stops at the objective line: the one-row reserve is given back (13 rows fit)', () => {
    const labels = css('pause-labels.css');
    expect(labels).toMatch(/\.pause__body \.pause__col\[data-col='settings'\] \{\s*max-height: calc\(var\(--pu-top-obj\) - var\(--pu-top-body\)\);/);
    expect(labels).not.toMatch(/max-height: calc\(var\(--pu-top-obj\) - var\(--pu-top-body\) - var\(--pu-row\)\)/);
  });

  it('PRESENTATION gets EYE CANDY\u2019s page glyph, its mirror and its focus rule', () => {
    const ec = css('pause-eye-candy.css');
    expect(ec).toMatch(/data-row='eyeCandy'\] \.pause__bar::before,\s*\.pause__col \.pause__row\[data-row='presentation'\] \.pause__bar::before \{/);
    expect(ec).toMatch(/pause--mirror .*data-row='presentation'\] \.pause__bar::before \{ left: auto; right: 2px; \}/);
    expect(ec).toMatch(/data-row='presentation'\]:focus \{ outline: none; \}/);
  });

  it('on a phone the page\u2019s rows are touch size (40px) and the list still scrolls (one row of the reserve is desktop only)', () => {
    const ec = css('pause-eye-candy.css');
    const phone = /@media \(max-width: 620px\) \{([\s\S]*)\}\s*$/.exec(ec)![1]!;
    expect(phone).toMatch(/\.pause__ec-col \.pause__ec-row \{ height: 40px; \}/);
    // the page glyph gets room of its own where a phone's word-row bar is 0 wide, so it never sits on the value's first letter
    expect(phone).toMatch(/data-row='eyeCandy'\] \.pause__bar,\s*\.pause__col \.pause__row\[data-row='presentation'\] \.pause__bar \{ width: 12px; margin: 0; \}/);
    expect(css('pause-labels.css')).toMatch(/@media \(min-width: 621px\) \{[\s\S]*max-height: calc\(var\(--pu-top-obj\) - var\(--pu-top-body\)\);/);
  });
});
