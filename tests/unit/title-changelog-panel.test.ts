// @vitest-environment jsdom
/**
 * The title screen's CHANGELOG entry and panel (Bailey, 2026-10-08, option A of the measured mock-up; "all your
 * recommendations"): the entry in the hint row after "B Briefing", L or a click or a tap opens an Ink & Gold panel over the
 * dimmed title, releases newest first, each line tagged FFX / FFX-2 / Both; Up, Down, PageUp and PageDown scroll it; Esc,
 * Enter or the same letter closes it, and Enter never starts the game from inside; phone taps are at least 44 px and text
 * is at least 14 px.
 *
 * This file drives the real `Input` and the real `TitleScreen` in jsdom (real key events, real click events), the way
 * `tests/unit/title-art-choice.test.ts` shows the screen. What jsdom cannot do (lay a page out, scroll a list, measure a
 * rectangle) is the browser proof: headless Chromium with real key presses and taps, `docs/screenshots/r395-int/title-changelog/`.
 *
 * Game case: both (the title is the front door of FFX and FFX-2 alike).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { Input } from '../../src/app/Input.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { RELEASE_NOTES } from '../../src/app/changelog/releaseNotes.ts';
import { TitleScreen } from '../../src/app/screens/TitleScreen.ts';
import { CHANGELOG_ACTION, changelogEntryHtml, changelogPanelHtml, infoEntriesHtml } from '../../src/app/screens/frontend/titleInfoHtml.ts';
import { TitleInfo } from '../../src/app/screens/frontend/titleInfo.ts';
import { titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';

const REPO = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(REPO, rel), 'utf8');

// jsdom lays nothing out and has no Element.scrollBy: a list that scrolls by what it is told.
beforeEach(() => {
  HTMLElement.prototype.scrollBy = function (this: HTMLElement, opts?: ScrollToOptions | number): void {
    this.scrollTop += typeof opts === 'object' ? (opts.top ?? 0) : 0;
  };
});
afterEach(() => {
  document.body.innerHTML = '';
});

const key = (code: string, extra: KeyboardEventInit = {}): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...extra }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
};

class FakeApp {
  readonly uiRoot = document.body.appendChild(document.createElement('div'));
  readonly save: SaveStore;
  readonly input: Input;
  constructor() {
    const slot = new Map<string, string>();
    slot.set(SAVE_KEY, JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings: { reduceMotion: true }, seenCoach: [], flags: {} }));
    this.save = new SaveStore(SAVE_KEY, { getItem: (k) => slot.get(k) ?? null, setItem: (k, v) => void slot.set(k, v), removeItem: (k) => void slot.delete(k) });
    this.input = new Input({ pointerRoot: this.uiRoot, keyboardTarget: window });
    this.input.attach();
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
}

async function showTitle(): Promise<{ app: FakeApp; screen: TitleScreen; root: HTMLElement }> {
  const app = new FakeApp();
  const screen = new TitleScreen();
  screen.app = app as unknown as App;
  screen.root = app.uiRoot.appendChild(document.createElement('div'));
  await screen.enter();
  return { app, screen, root: screen.root };
}

/** One frame, as `App` runs it: read the input, hand it to the screen. */
const frame = (app: FakeApp, screen: TitleScreen): void => {
  app.input.update();
  screen.handleInput(app.input);
  app.input.endFrame();
};

const overlay = (root: HTMLElement): HTMLElement | null => root.querySelector<HTMLElement>('.fe-info');
const snap = (screen: TitleScreen): { open: string | null; claimed: boolean } => screen.snapshot()['info'] as { open: string | null; claimed: boolean };

describe('the entry in the hint row', () => {
  it('is the third word of the key hints: after "B Briefing", behind a hairline, as a button the tap resolves to its own action', () => {
    const root = document.createElement('div');
    root.innerHTML = titleMarkup({ briefingChip: true });
    const hint = root.querySelector('.fe-hint')!;
    const children = [...hint.children].map((c) => c.className || c.getAttribute('data-action'));
    expect(children.slice(-3)).toEqual(['title:briefing', 'fe-hint__sep', 'fe-hint__entry']);
    const entry = hint.querySelector<HTMLElement>('.fe-hint__entry')!;
    expect(entry.getAttribute('data-action')).toBe(CHANGELOG_ACTION);
    expect(entry.getAttribute('role')).toBe('button');
    expect(entry.getAttribute('tabindex')).toBe('0');
    expect(entry.querySelector('b')?.textContent).toBe('L');
    expect(entry.textContent?.replace(/\s+/g, ' ').trim()).toBe('L Changelog');
    // the closest [data-action] of the entry is the entry itself, not the plate's confirm: a click on it cannot start the game
    expect(entry.closest('[data-action]')).toBe(entry);
    expect(hint.closest('[data-action]')?.getAttribute('data-action')).toBe('confirm');
  });

  it('is in the row whether or not the briefing chip is, and leaves the three key hints and the tap hint as they were', () => {
    for (const briefingChip of [true, false]) {
      const html = titleMarkup({ briefingChip });
      expect(html).toContain('class="fe-hint__tap"><b>Tap</b> begin</span>');
      expect(html.match(/class="fe-hint__key"/g) ?? []).toHaveLength(3);
      expect(html.match(/data-action="title:changelog"/g) ?? []).toHaveLength(1);
    }
    expect(infoEntriesHtml()).toBe(changelogEntryHtml());
  });
});

describe('opening and closing, with the real Input', () => {
  it('L opens the panel and the keyboard is claimed exclusively: Enter closes it and never starts the game', async () => {
    const { app, screen, root } = await showTitle();
    expect(overlay(root)).toBeNull();
    key('KeyL');
    expect(overlay(root)?.dataset['infoKind']).toBe('changelog');
    expect(app.input.keyboardClaimed).toBe(true);
    expect(snap(screen)).toEqual({ open: 'changelog', claimed: true });
    key('Enter');
    frame(app, screen);
    expect(overlay(root)).toBeNull();
    expect(app.input.keyboardClaimed).toBe(false);
    frame(app, screen);
    expect(screen.snapshot()['advancing']).toBe(false);
    screen.exit();
  });

  it('closes on Esc, X, Backspace, Space, Z, NumpadEnter and the same letter, each time handing the keyboard back', async () => {
    const { app, screen, root } = await showTitle();
    for (const code of ['Escape', 'KeyX', 'Backspace', 'Space', 'KeyZ', 'NumpadEnter', 'Enter', 'KeyL']) {
      key('KeyL');
      expect(overlay(root), `${code}: open`).not.toBeNull();
      key(code);
      frame(app, screen);
      expect(overlay(root), `${code}: closed`).toBeNull();
      expect(app.input.keyboardClaimed, `${code}: handed back`).toBe(false);
      expect(screen.snapshot()['advancing'], code).toBe(false);
    }
    screen.exit();
  });

  it('opens once for a held key: the repeats neither close it nor open a second', async () => {
    const { app, screen, root } = await showTitle();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL', bubbles: true, cancelable: true }));
    for (let i = 0; i < 4; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL', repeat: true, bubbles: true, cancelable: true }));
    expect(root.querySelectorAll('.fe-info')).toHaveLength(1);
    expect(app.input.keyboardClaimed).toBe(true);
    key('Escape');
    // a repeat of L after it closed (the key is still down) opens nothing
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL', repeat: true, bubbles: true, cancelable: true }));
    expect(overlay(root)).toBeNull();
    screen.exit();
  });

  it('scrolls on Up, Down, PageUp and PageDown (and W, S, F, R), by the measured steps', async () => {
    const { screen, root } = await showTitle();
    key('KeyL');
    const list = overlay(root)!.querySelector<HTMLElement>('[data-role="info-scroll"]')!;
    expect(list.scrollTop).toBe(0);
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowDown');
    expect(list.scrollTop).toBe(216); // 3 x 72
    key('PageDown');
    expect(list.scrollTop).toBe(216 + 80); // a page is the list's height less 60, never under 80 (jsdom has no height)
    key('ArrowUp');
    expect(list.scrollTop).toBe(216 + 80 - 72);
    key('PageUp');
    expect(list.scrollTop).toBe(216 + 80 - 72 - 80);
    key('KeyS');
    key('KeyW');
    key('KeyR');
    key('KeyF');
    expect(list.scrollTop).toBe(216 + 80 - 72 - 80);
    expect(overlay(root)).not.toBeNull();
    key('Escape');
    screen.exit();
  });

  it('is opened by a click or a tap on the entry (its own action), and a click anywhere else on the plate begins the game', async () => {
    const { app, screen, root } = await showTitle();
    root.querySelector<HTMLElement>('[data-action="title:changelog"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    frame(app, screen);
    expect(overlay(root)?.dataset['infoKind']).toBe('changelog');
    expect(screen.snapshot()['advancing']).toBe(false);
    key('Escape');
    frame(app, screen);
    // the plate itself resolves to confirm
    const plate = root.querySelector<HTMLElement>('.fe-title__tap')!;
    expect(plate.closest('[data-action]')?.getAttribute('data-action')).toBe('confirm');
    screen.exit();
  });

  it('closes on the scrim and on its CLOSE button, never on a click inside the sheet, and a click inside it starts nothing', async () => {
    const { app, screen, root } = await showTitle();
    key('KeyL');
    overlay(root)!.querySelector('.fe-info__panel')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    overlay(root)!.querySelector('.fe-info__li')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    frame(app, screen);
    expect(overlay(root)).not.toBeNull();
    expect(screen.snapshot()['advancing']).toBe(false);
    overlay(root)!.querySelector('.fe-info__scrim')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay(root)).toBeNull();
    expect(app.input.keyboardClaimed).toBe(false);
    key('KeyL');
    overlay(root)!.querySelector('.fe-info__close')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay(root)).toBeNull();
    screen.exit();
  });

  it('does not open while the title is already leaving, and not at all once the screen has exited', async () => {
    const { app, screen, root } = await showTitle();
    const info = new TitleInfo(root, app as unknown as App, () => false, () => true);
    info.open('changelog');
    expect(info.openKind).toBeNull();
    screen.exit();
    expect(overlay(root)).toBeNull();
    key('KeyL');
    expect(overlay(root)).toBeNull();
    expect(app.input.keyboardClaimed).toBe(false);
  });

  it('leaves nothing behind when the screen exits with the panel open: no panel, no claim, no key handler', async () => {
    const { app, screen, root } = await showTitle();
    key('KeyL');
    expect(app.input.keyboardClaimed).toBe(true);
    screen.exit();
    expect(overlay(root)).toBeNull();
    expect(app.input.keyboardClaimed).toBe(false);
    key('KeyL');
    expect(overlay(root)).toBeNull();
  });

  it('gives focus back to the entry that opened it', async () => {
    const { screen, root } = await showTitle();
    const entry = root.querySelector<HTMLElement>('[data-action="title:changelog"]')!;
    entry.focus();
    expect(document.activeElement).toBe(entry);
    key('KeyL');
    expect(document.activeElement).toBe(overlay(root)!.querySelector('[data-role="info-scroll"]'));
    key('Escape');
    expect(document.activeElement).toBe(entry);
    screen.exit();
  });

  it('does nothing with a modifier held (the browser shortcuts stay the browser’s)', async () => {
    const { screen, root } = await showTitle();
    for (const extra of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) key('KeyL', extra);
    expect(overlay(root)).toBeNull();
    screen.exit();
  });
});

describe('the panel itself', () => {
  const panel = (): HTMLElement => {
    const host = document.createElement('div');
    host.innerHTML = changelogPanelHtml();
    return host;
  };

  it('is a modal dialog named Changelog, with a title, a CLOSE button and the keys in its foot', () => {
    const p = panel();
    const dialog = p.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Changelog');
    expect(p.querySelector('.fe-info__eyebrow')?.textContent).toBe('Changelog');
    expect(p.querySelector('.fe-info__title')?.textContent).toBe('Latest releases');
    expect(p.querySelector('.fe-info__close')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Esc Close');
    expect(p.querySelector('.fe-info__foot')?.textContent?.replace(/\s+/g, ' ')).toMatch(/scroll.*Esc or Enter close/);
  });

  it('lists the releases newest first with the name and the day, and each line behind its tag', () => {
    const p = panel();
    const releases = [...p.querySelectorAll<HTMLElement>('.fe-info__rel')];
    expect(releases.map((r) => r.dataset['release'])).toEqual(RELEASE_NOTES.map((n) => n.release));
    expect(releases[0]!.querySelector('.fe-info__relname')?.textContent).toBe('Release 39.4.2');
    expect(releases[0]!.querySelector('.fe-info__relmeta')?.textContent).toBe('2026-10-08');
    RELEASE_NOTES.forEach((note, i) => {
      const lines = [...releases[i]!.querySelectorAll('.fe-info__li')];
      expect(lines).toHaveLength(note.lines.length);
      lines.forEach((li, k) => {
        expect(li.querySelector('.fe-info__chip')?.textContent).toBe(note.lines[k]!.tag);
        expect(li.lastElementChild?.textContent).toBe(note.lines[k]!.text);
      });
    });
  });

  it('prints text, never markup: a note with a tag in it is shown, not run', () => {
    const host = document.createElement('div');
    host.innerHTML = changelogPanelHtml([{ release: '99', date: '2026-10-09', lines: [{ tag: 'Both', text: 'A <img src=x onerror=1> line & more.' }] }]);
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('.fe-info__li')?.lastElementChild?.textContent).toBe('A <img src=x onerror=1> line & more.');
  });

  it('says so when there is no release to list', () => {
    const host = document.createElement('div');
    host.innerHTML = changelogPanelHtml([]);
    expect(host.querySelector('.fe-info__none')?.textContent).toMatch(/No releases/);
  });
});

describe('title-info.css keeps the mock-up’s measured promises', () => {
  const css = read('src/app/screens/frontend/title-info.css');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');

  it('never sets a font under the 14 px floor: every size is the floor-wrapped grid size, a floor variable or a relative size', () => {
    const sizes = [...code.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(sizes.length).toBeGreaterThan(10);
    for (const s of sizes) expect(s, s).toMatch(/^(max\(var\(--fe-fs-floor\), calc\(\d+(\.\d+)? \* var\(--fe-k\)\)\)|1\.1em)$/);
    expect(code).not.toMatch(/font-size:\s*calc|font-size:\s*\d+(?:\.\d+)?px/);
  });

  it('makes every touch target 44 px or more on a coarse pointer: the entries and the close button', () => {
    const coarse = code.slice(code.indexOf('@media (pointer: coarse)'));
    expect(coarse).toMatch(/\.fe-hint \.fe-hint__entry\s*\{[^}]*min-height:\s*44px/);
    expect(coarse).toMatch(/\.fe-info__close\s*\{[^}]*min-height:\s*44px/);
    expect(coarse).toMatch(/\.fe-info__close b[^{]*\{\s*display:\s*none/);
  });

  it('makes the whole bar the entry’s click area, so a click just above the word opens it and does not start the game', () => {
    const entry = code.slice(code.indexOf('.fe-hint .fe-hint__entry {'));
    expect(entry).toMatch(/margin:\s*calc\(-9 \* var\(--fe-k\)\) calc\(-11 \* var\(--fe-k\)\)/);
    expect(entry).toMatch(/padding:\s*calc\(9 \* var\(--fe-k\)\) calc\(11 \* var\(--fe-k\)\)/);
  });

  it('opts the whole overlay back in to the pointer, or a click on its dimmed margin would fall through to the plate', () => {
    expect(code).toMatch(/\.fe-info\s*\{[^}]*pointer-events:\s*auto/);
    expect(read('index.html')).toMatch(/#ui[^{]*\{[^}]*pointer-events:\s*none/);
  });

  it('is a bottom sheet on a phone and a right-hand panel otherwise, with the foot keys hidden where there is no keyboard', () => {
    const phone = code.slice(code.indexOf('@media (max-width: 760px), (max-aspect-ratio: 3 / 4) {'));
    expect(phone).toMatch(/\.fe-info__wrap\s*\{[^}]*left:\s*0;[^}]*right:\s*0;[^}]*bottom:\s*0/);
    expect(phone).toMatch(/\.fe-info__foot\s*\{\s*display:\s*none/);
    expect(code).toMatch(/\.fe-info__wrap\s*\{[^}]*right:\s*calc\(58 \* var\(--fe-k\)\)[^}]*width:\s*calc\(680 \* var\(--fe-k\)\)/);
  });
});
