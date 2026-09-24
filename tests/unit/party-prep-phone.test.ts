// @vitest-environment jsdom
/**
 * PR-0127 at phone width, option A "stacked cards" (Bailey, D-071; both games,
 * the prep shell and its CHAPTER card are shared). The layout is CSS inside a
 * `(max-width: 599px)` query keyed on `.prep[data-tab='chapter']`; this checks
 * the parts jsdom can see: the shell keeps `data-tab` current, the helper adds
 * its phone-only chrome, the MORE BELOW cue follows the page's scroll, L1 / R1
 * page the stacked page, and the stylesheets cannot reach a desktop size or
 * print under the 14 px floor. The real layout is checked in a browser at
 * 390x844 (docs/screenshots/pr-0127-phone/).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InputSnapshot } from '../../src/app/Input.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { romanNumeral } from '../../src/ui/common/roman.ts';

type ScreenModule = typeof import('../../src/app/screens/PartyPrepScreen.ts');
type PanelModule = typeof import('../../src/ui/ffx/party-prep/ChapterPanel.ts');
type PhoneModule = typeof import('../../src/app/screens/party-prep/phonePrep.ts');
let mod: ScreenModule;
let chap: PanelModule;
let phone: PhoneModule;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  mod = await import('../../src/app/screens/PartyPrepScreen.ts');
  chap = await import('../../src/ui/ffx/party-prep/ChapterPanel.ts');
  phone = await import('../../src/app/screens/party-prep/phonePrep.ts');
});

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

/** Give an element a real-looking vertical scroll box. */
function stubScroll(el: HTMLElement, scrollHeight: number, clientHeight: number): void {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
}

function mountPrep(chapterId: string) {
  const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
  mod.registerPrepPanel(chap.makeChapterPanel(chapter.game));
  mod.registerPrepPanel({ id: 'other', label: 'Other', game: chapter.game, order: 5, mount() {} });
  const root = document.createElement('div');
  document.body.appendChild(root);
  const screen = new mod.PartyPrepScreen({ chapter });
  screen.root = root;
  screen.app = { fade: () => Promise.resolve() } as unknown as typeof screen.app;
  screen.enter();
  return { screen, root, prep: root.querySelector<HTMLElement>('.prep')! };
}

describe('phoneWhereLabel', () => {
  it('names the game and the numeral, as the sheet draws the corner', () => {
    expect(phone.phoneWhereLabel({ game: 'ffx2', number: 6 })).toBe('FFX-2 · VI');
    expect(phone.phoneWhereLabel({ game: 'ffx', number: 1 })).toBe('FFX · I');
  });
  it('keeps the numeral past VIII for the registered but unlisted chapters 9 and 10', () => {
    expect(phone.phoneWhereLabel({ game: 'ffx', number: 9 })).toBe('FFX · IX');
    expect(phone.phoneWhereLabel({ game: 'ffx', number: 10 })).toBe('FFX · X');
    expect(romanNumeral(4)).toBe('IV');
    expect(romanNumeral(14)).toBe('XIV');
    expect(romanNumeral(0)).toBe('0');
  });
});

describe('the prep shell at phone width (both games)', () => {
  it.each(['seymour-flux', 'ffx2-leblanc'])('%s: keeps data-tab on .prep and adds the phone chrome once', (id) => {
    const { screen, root, prep } = mountPrep(id);
    expect(prep.dataset['tab']).toBe('chapter');
    for (const cls of ['prep__phone-where', 'prep__phone-party', 'prep__phone-dock', 'prep__phone-cue']) {
      expect(root.querySelectorAll(`.${cls}`)).toHaveLength(1);
    }
    expect(root.querySelector('.prep__phone-where')!.textContent).toBe(id === 'ffx2-leblanc' ? 'FFX-2 · VI' : 'FFX · I');
    screen.trigger('prep:tab:other');
    expect(prep.dataset['tab']).toBe('other');
    screen.trigger('prep:tab:chapter');
    expect(prep.dataset['tab']).toBe('chapter');
    // The shell's own markup is untouched: the long location line stays.
    expect(root.querySelector('.prep__where')!.textContent).toContain(id === 'ffx2-leblanc' ? 'LEBLANC' : 'SEYMOUR');
    screen.exit();
  });

  it('shows MORE BELOW while the stacked page has more under it, and not at its end', () => {
    const { prep, root } = mountPrep('ffx2-leblanc');
    const cue = root.querySelector('.prep__phone-cue')!;
    stubScroll(prep, 982, 844);
    prep.scrollTop = 0;
    prep.dispatchEvent(new Event('scroll'));
    expect(cue.classList.contains('is-visible')).toBe(true);
    prep.scrollTop = 138;
    prep.dispatchEvent(new Event('scroll'));
    expect(cue.classList.contains('is-visible')).toBe(false);
    // A page that fits (every desktop size: `.prep` is overflow hidden and its
    // scroll box is its own size) never shows it.
    stubScroll(prep, 844, 844);
    prep.scrollTop = 0;
    prep.dispatchEvent(new Event('scroll'));
    expect(cue.classList.contains('is-visible')).toBe(false);
  });

  it('R1 / L1 page the stacked page when it is the scroller, and leave it alone when it is not', () => {
    const { screen, prep } = mountPrep('seymour-flux');
    stubScroll(prep, 961, 844);
    // Desktop: `.prep` does not scroll (overflow hidden), so paging ignores it.
    screen.handleInput(keys('r1'));
    expect(prep.scrollTop).toBe(0);
    // Phone: the media query makes it `overflow-y: auto`.
    prep.style.overflowY = 'auto';
    screen.handleInput(keys('r1'));
    expect(prep.scrollTop).toBe(117);
    screen.handleInput(keys('l1'));
    expect(prep.scrollTop).toBe(0);
  });

  it('keeps the browser from paging the phone page a second time on PageDown, on the CHAPTER tab only', () => {
    const had = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (q: string) => ({ matches: q === '(max-width: 599px)', media: q, addEventListener() {}, removeEventListener() {} }),
    });
    try {
      const { screen } = mountPrep('ffx2-leblanc');
      const press = (): boolean => {
        const ev = new KeyboardEvent('keydown', { code: 'PageDown', cancelable: true });
        window.dispatchEvent(ev);
        return ev.defaultPrevented;
      };
      expect(press()).toBe(true);
      screen.trigger('prep:tab:other');
      expect(press()).toBe(false);
      screen.trigger('prep:tab:chapter');
      screen.exit();
      // Gone with the screen.
      expect(press()).toBe(false);
    } finally {
      if (had) Object.defineProperty(window, 'matchMedia', had);
      else delete (window as { matchMedia?: unknown }).matchMedia;
    }
  });
});

describe('the phone stylesheets cannot touch a desktop size', () => {
  const read = (p: string): string => readFileSync(join(__dirname, '..', '..', p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const files = ['src/ui/common/party-prep-phone.css', 'src/ui/ffx/party-prep/chapter-panel-phone.css'];

  it.each(files)('%s: every layout rule sits inside the phone media query', (file) => {
    const text = read(file);
    const at = text.indexOf('@media (max-width: 599px)');
    expect(at).toBeGreaterThanOrEqual(0);
    expect(`(max-width: 599px)`).toBe(phone.PHONE_PREP_QUERY);
    // Outside the query only the phone-only chrome's `display: none` default.
    const outside = text.slice(0, at).trim();
    const allowed = outside.replace(/\.prep__phone-[a-z]+,?\s*/g, '').replace(/\{\s*display:\s*none;\s*\}/, '').trim();
    expect(allowed).toBe('');
    expect(text.slice(at).match(/@media/g)).toHaveLength(1);
    // And each rule inside it is scoped to the CHAPTER tab's page.
    const inner = text.slice(text.indexOf('{', at) + 1);
    const selectors = [...inner.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1]!.trim()).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(5);
    for (const s of selectors) {
      for (const part of s.split(',')) expect(part.trim()).toMatch(/^\.prep\[data-tab='chapter'\]/);
    }
  });

  it.each(files)('%s: no font-size under the 14 px floor (CHK-003)', (file) => {
    const sizes = [...read(file).matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(14);
    const tokens = [...read(file).matchAll(/--cp-fs-[a-z-]+:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    for (const s of tokens) expect(s).toBeGreaterThanOrEqual(14);
  });
});
