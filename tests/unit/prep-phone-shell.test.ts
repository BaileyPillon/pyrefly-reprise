// @vitest-environment jsdom
/**
 * PR-0295 at phone width, option PREP-A "one long page" (Bailey, 2026-10-12, D-781; both games: the prep shell and its
 * eight tab panels are shared, the FFX and FFX-2 tabs differ). The layout is CSS inside a `(max-width: 599px)` query keyed
 * on `.prep[data-phone='page']`; this file checks the shell and the sheets: the shell keeps `data-phone` and `is-scrolled`
 * current, the open tab is kept in view in the pinned strip, the browser's own PageDown stays out of the way on the
 * stacked tabs, R1 and L1 reach the open tab, and the stylesheets cannot reach a desktop size or print under the 14 px
 * floor. The panels, the fold and the keys are `prep-phone-page.test.ts`; the views' numbers `prep-phone-views.test.ts`; the
 * real layout is checked in a browser at 390x844 and 430x932 (docs/screenshots/r43-prepphone/).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InputSnapshot } from '../../src/app/Input.ts';
import type { PrepPanel } from '../../src/app/screens/PartyPrepScreen.ts';
import { PHONE_PREP_QUERY } from '../../src/app/screens/party-prep/phonePrep.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { makeEquipmentPanel, makeItemsPanel, makeOverdrivePanel, makeStatsPanel } from '../../src/ui/ffx/party-prep/panels.ts';
import { makeAccessoryPanel, makeDresspherePanel, makeItemsPanel as makeX2ItemsPanel } from '../../src/ui/ffx2/party-prep/panels.ts';
import { makeStatsPanel as makeX2StatsPanel } from '../../src/ui/ffx2/party-prep/StatsPanel.ts';

const chapterOf = (id: string) => CHAPTERS.find((c) => c.id === id)!;

function keys(...pressed: string[]): InputSnapshot {
  const left = new Set(pressed);
  return {
    actions: [],
    justPressed: (b: string) => left.has(b),
    consume: (b: string) => left.delete(b),
    pressed: () => false,
    justReleased: () => false,
    axis: { x: 0, y: 0 },
    gamepadConnected: false,
    lastDevice: 'keyboard',
  } as unknown as InputSnapshot;
}

function stubScroll(el: HTMLElement, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
}

const FFX_TABS: ReadonlyArray<[string, () => PrepPanel]> = [
  ['stats', makeStatsPanel],
  ['equipment', makeEquipmentPanel],
  ['items', makeItemsPanel],
  ['overdrive', makeOverdrivePanel],
];
const X2_TABS: ReadonlyArray<[string, () => PrepPanel]> = [
  ['dresspheres', makeDresspherePanel],
  ['stats', makeX2StatsPanel],
  ['accessories', makeAccessoryPanel],
  ['items', makeX2ItemsPanel],
];

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the prep shell on the stacked page', () => {
  type ScreenModule = typeof import('../../src/app/screens/PartyPrepScreen.ts');
  let mod: ScreenModule;
  const had = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  const offsetLeft = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft');

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    mod = await import('../../src/app/screens/PartyPrepScreen.ts');
  });
  afterEach(() => {
    if (had) Object.defineProperty(window, 'matchMedia', had);
    else delete (window as { matchMedia?: unknown }).matchMedia;
    if (offsetLeft) Object.defineProperty(HTMLElement.prototype, 'offsetLeft', offsetLeft);
  });

  const phone = (matches: boolean): void => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (q: string) => ({ matches: matches && q === PHONE_PREP_QUERY, media: q, addEventListener() {}, removeEventListener() {} }),
    });
  };

  async function mountShell(chapterId: string) {
    const chapter = chapterOf(chapterId);
    const { makeChapterPanel } = await import('../../src/ui/ffx/party-prep/ChapterPanel.ts');
    mod.registerPrepPanel(makeChapterPanel(chapter.game));
    for (const [, make] of chapter.game === 'ffx' ? FFX_TABS : X2_TABS) mod.registerPrepPanel(make());
    mod.registerPrepPanel({ id: 'sphere-grid', label: 'Sphere Grid', game: chapter.game, order: 5, mount() {} });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const screen = new mod.PartyPrepScreen({ chapter });
    screen.root = root;
    screen.app = { fade: () => Promise.resolve() } as unknown as typeof screen.app;
    screen.enter();
    return { screen, root, prep: root.querySelector<HTMLElement>('.prep')! };
  }

  it.each([['seymour-flux', ['stats', 'equipment', 'items', 'overdrive']], ['ffx2-bahamut', ['dresspheres', 'stats', 'accessories', 'items']]] as const)(
    '%s: data-phone is "page" on the heavy tabs and gone on CHAPTER and SPHERE GRID, which keep their own phone pages',
    async (id, tabs) => {
      const { screen, prep } = await mountShell(id);
      expect(prep.dataset['tab']).toBe('chapter');
      expect(prep.dataset['phone']).toBeUndefined();
      for (const tab of tabs) {
        screen.trigger(`prep:tab:${tab}`);
        expect(prep.dataset['tab']).toBe(tab);
        expect(prep.dataset['phone']).toBe('page');
      }
      screen.trigger('prep:tab:sphere-grid');
      expect(prep.dataset['phone']).toBeUndefined();
      screen.trigger('prep:tab:chapter');
      expect(prep.dataset['phone']).toBeUndefined();
      screen.exit();
    },
  );

  it('marks the page is-scrolled once content has passed under the pinned bar, and clears it at the top', async () => {
    const { screen, prep } = await mountShell('seymour-flux');
    screen.trigger('prep:tab:stats');
    expect(prep.classList.contains('is-scrolled')).toBe(false);
    prep.scrollTop = 80;
    prep.dispatchEvent(new Event('scroll'));
    expect(prep.classList.contains('is-scrolled')).toBe(true);
    prep.scrollTop = 0;
    prep.dispatchEvent(new Event('scroll'));
    expect(prep.classList.contains('is-scrolled')).toBe(false);
    screen.exit();
  });

  it('a new tab starts at the top of its page, and the strip brings the open tab and the one before it into reach', async () => {
    phone(true);
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('prep__tab') ? [...(this.parentElement?.children ?? [])].indexOf(this) * 100 : 0;
      },
    });
    const { screen, prep, root } = await mountShell('seymour-flux');
    prep.scrollTop = 300;
    screen.trigger('prep:tab:overdrive'); // 0 chapter, 1 sphere-grid, 2 stats?, ... the tab's own index in the strip
    const strip = root.querySelector<HTMLElement>('.prep__tabs')!;
    const tabs = [...strip.children];
    const at = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    expect(tabs[at]!.getAttribute('data-action')).toBe('prep:tab:overdrive');
    expect(prep.scrollTop).toBe(0);
    expect(strip.scrollLeft).toBe((at - 1) * 100 - 16);
    screen.trigger('prep:tab:chapter'); // not a stacked page: the strip is left as it is
    screen.exit();
  });

  it('puts the open tab back into view when the window crosses the 600 px line, and lets go of the query with the screen', async () => {
    let onChange: (() => void) | null = null;
    const mql = {
      matches: false,
      media: PHONE_PREP_QUERY,
      addEventListener: (_type: string, fn: () => void) => {
        onChange = fn;
      },
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => mql });
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('prep__tab') ? [...(this.parentElement?.children ?? [])].indexOf(this) * 100 : 0;
      },
    });
    const { screen, root } = await mountShell('seymour-flux');
    screen.trigger('prep:tab:overdrive');
    const strip = root.querySelector<HTMLElement>('.prep__tabs')!;
    const at = [...strip.children].findIndex((t) => t.getAttribute('aria-selected') === 'true');
    expect(strip.scrollLeft).toBe(0); // a desktop width: the strip is left alone
    mql.matches = true;
    onChange!();
    expect(strip.scrollLeft).toBe((at - 1) * 100 - 16);
    screen.exit();
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', onChange);
  });

  it('keeps the browser from paging the page a second time on PageDown, on the stacked tabs and CHAPTER only', async () => {
    phone(true);
    const { screen } = await mountShell('ffx2-bahamut');
    const press = (): boolean => {
      const ev = new KeyboardEvent('keydown', { code: 'PageDown', cancelable: true });
      window.dispatchEvent(ev);
      return ev.defaultPrevented;
    };
    expect(press()).toBe(true); // CHAPTER
    screen.trigger('prep:tab:accessories');
    expect(press()).toBe(true);
    screen.trigger('prep:tab:sphere-grid');
    expect(press()).toBe(false);
    screen.trigger('prep:tab:stats');
    expect(press()).toBe(true);
    screen.exit();
    expect(press()).toBe(false);
  });

  it('does not touch the keyboard at a desktop width', async () => {
    phone(false);
    const { screen } = await mountShell('seymour-flux');
    screen.trigger('prep:tab:items');
    const ev = new KeyboardEvent('keydown', { code: 'PageDown', cancelable: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    screen.exit();
  });

  it('R1 and L1 reach the open tab through the shell, as they reach the CHAPTER tab', async () => {
    const { screen, prep } = await mountShell('ffx2-bahamut');
    screen.trigger('prep:tab:dresspheres');
    prep.style.overflowY = 'auto'; // what the phone query makes it
    stubScroll(prep, 1138, 844);
    screen.handleInput(keys('r1'));
    expect(prep.scrollTop).toBe(294);
    screen.handleInput(keys('l1'));
    expect(prep.scrollTop).toBe(0);
    screen.exit();
  });
});

describe('the stylesheets cannot reach a desktop size, and print nothing under the 14 px floor', () => {
  const read = (p: string): string => readFileSync(join(__dirname, '..', '..', p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const sheets = ['src/ui/common/party-prep-phone-tabs.css', 'src/ui/common/prep-phone-sections.css', 'src/ui/common/prep-phone-parts.css'];

  it.each(sheets)('%s: every rule sits inside the one phone media query and is keyed on the stacked page', (file) => {
    const css = read(file);
    const at = css.indexOf('@media (max-width: 599px)');
    expect(at).toBeGreaterThanOrEqual(0);
    expect('(max-width: 599px)').toBe(PHONE_PREP_QUERY);
    expect(css.match(/@media/g)).toHaveLength(1);
    // Outside the query at most the host's `display: none` default (the sections sheet), nothing else.
    const outside = css.slice(0, at).trim();
    expect(outside === '' || outside.replace(/\s+/g, ' ') === '.prph { display: none; }').toBe(true);
    const inner = css.slice(css.indexOf('{', at) + 1);
    const selectors = [...inner.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1]!.trim()).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(5);
    for (const s of selectors) {
      for (const part of s.split(',')) expect(part.trim(), `${file}: ${s}`).toMatch(/^\.prep\[data-phone='page'\]/);
    }
  });

  it.each(sheets)('%s: no font-size under the 14 px floor (CHK-003)', (file) => {
    const declared = [...read(file).matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(declared.length).toBeGreaterThan(0);
    // Only two forms: a plain px size, or a clamp() whose floor is a px size. Both are held to 14 px; nothing relative.
    for (const v of declared) {
      const px = /^([\d.]+)px$/.exec(v) ?? /^clamp\(\s*([\d.]+)px\s*,/.exec(v);
      expect(px, `${file}: font-size: ${v}`).not.toBeNull();
      expect(Number(px![1]), `${file}: font-size: ${v}`).toBeGreaterThanOrEqual(14);
    }
  });

  it('the tab sheet keeps CHAPTER and SPHERE GRID out of it, and a finger-sized row is at least 44 px tall', () => {
    const all = sheets.map(read).join('\n');
    expect(all).not.toMatch(/data-tab=['"](?:chapter|sphere-grid)['"]/);
    for (const sel of ['.prph-sec__h', '.prph-mode']) {
      const rule = new RegExp(`${sel.replace('.', '\\.')}\\s*\\{[^}]*min-height:\\s*(\\d+)px`).exec(all);
      expect(rule, sel).not.toBeNull();
      expect(Number(rule![1])).toBeGreaterThanOrEqual(44);
    }
  });

  it.each([
    'src/ui/common/party-prep-phone-tabs.css',
    'src/ui/common/prep-phone-sections.css',
    'src/ui/common/prep-phone-parts.css',
    'src/ui/common/prepPhoneKit.ts',
    'src/ui/common/prepPhoneFold.ts',
    'src/ui/ffx/party-prep/phoneViews.ts',
    'src/ui/ffx/party-prep/overdriveText.ts',
    'src/ui/ffx/party-prep/panels.ts',
    'src/ui/ffx2/party-prep/phoneViews.ts',
    'src/ui/ffx2/party-prep/panels.ts',
    'src/ui/ffx2/party-prep/StatsPanel.ts',
    'src/app/screens/party-prep/phonePrep.ts',
  ])('%s is under the house 400-line limit (rule 7)', (file) => {
    expect(readFileSync(join(__dirname, '..', '..', file), 'utf8').split('\n').length).toBeLessThan(400);
  });
});
