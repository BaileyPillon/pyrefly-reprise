// @vitest-environment jsdom
/**
 * **The CHAPTER tab's card takes the lines its title wraps onto** (release 80; both games: the party prep's card is one component; `src/ui/ffx/party-prep/chapterTitleGrow.ts`).
 *
 * The live review of release 79 saw Belgemine's Challenge (a two-line title) at 1600 x 900 with its photo row cut by the card's bottom edge: the card is a fixed 120 grid px band sized for a one-line title.
 * jsdom has no layout, so the title's box and line height are stubbed with the numbers a browser read gave (title 38 px high at a 19.04 px line: two lines). The browser read itself (the tile row's bottom against the card, before
 * and after, four sizes, and the pixel comparison of the one-line chapters) is in `docs/screenshots/r80-prep-tabs/` and the lane's note.
 *
 * What is pinned: the pure arithmetic, the watcher (sets the property for two lines, writes nothing for one, follows a resize, stops), the panel wiring, and the stylesheet geometry: the base band is still 120, the growth
 * rule is in a `min-width: 600px` block (the phone's stacked card has no band), its cap is the module's constant, and the card with the cap added still ends above the hint line.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { TITLE_GROW_CAP_PX, TITLE_GROW_PROP, titleExtraPx, watchTitleGrow } from '../../../src/ui/ffx/party-prep/chapterTitleGrow.ts';
import { makeChapterPanel } from '../../../src/ui/ffx/party-prep/ChapterPanel.ts';

const css = (file: string): string => readFileSync(resolve(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n');

/** The title's layout box height the stub answers (px); a test sets it to 19.04 for one line or 38 for two. */
let titleBox = 38;
const LINE = 19.04;
let resizeCallbacks: Array<() => void> = [];
let disconnected = 0;

const ORIGINAL_OFFSET_HEIGHT = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

beforeEach(() => {
  titleBox = 38;
  resizeCallbacks = [];
  disconnected = 0;
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('cpanel__title') ? titleBox : 0;
    },
  });
  vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({ lineHeight: `${LINE}px`, fontSize: '18.67px' }) as unknown as CSSStyleDeclaration);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        resizeCallbacks.push(cb);
      }
      observe(): void {}
      disconnect(): void {
        disconnected++;
      }
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (ORIGINAL_OFFSET_HEIGHT) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', ORIGINAL_OFFSET_HEIGHT);
});

function bandWithTitle(): HTMLElement {
  const band = document.createElement('div');
  band.className = 'prepchap';
  band.innerHTML = '<h2 class="cpanel__title">Belgemine\'s Challenge</h2>';
  return band;
}

describe('titleExtraPx: the lines beyond the first', () => {
  it('one line adds nothing, two lines add one line, three add two', () => {
    expect(titleExtraPx(19.04, 19.04)).toBe(0);
    expect(titleExtraPx(38, 19.04)).toBeCloseTo(19.04, 5);
    expect(titleExtraPx(57, 19.04)).toBeCloseTo(38.08, 5);
  });

  it('reads the number of lines by rounding, so the integer offsetHeight does not leak into the card', () => {
    expect(titleExtraPx(38, 19.04)).toBe(titleExtraPx(38.08, 19.04));
    expect(titleExtraPx(19, 19.04)).toBe(0);
  });

  it('a hidden panel (box 0) or an unreadable line height adds nothing', () => {
    expect(titleExtraPx(0, 19.04)).toBe(0);
    expect(titleExtraPx(38, 0)).toBe(0);
    expect(titleExtraPx(38, Number.NaN)).toBe(0);
    expect(titleExtraPx(Number.NaN, 19.04)).toBe(0);
  });
});

describe('watchTitleGrow', () => {
  it('a two-line title sets the card\'s growth to one title line', () => {
    const band = bandWithTitle();
    watchTitleGrow(band);
    expect(band.style.getPropertyValue(TITLE_GROW_PROP)).toBe('19.04px');
  });

  it('a one-line title writes nothing at all (those chapters stay exactly as they were)', () => {
    titleBox = 19;
    const band = bandWithTitle();
    watchTitleGrow(band);
    expect(band.style.getPropertyValue(TITLE_GROW_PROP)).toBe('');
    expect(band.getAttribute('style') ?? '').toBe('');
  });

  it('follows the title when its box changes, and takes the growth back when it fits on one line again', () => {
    titleBox = 19;
    const band = bandWithTitle();
    watchTitleGrow(band);
    expect(band.style.getPropertyValue(TITLE_GROW_PROP)).toBe('');
    titleBox = 38;
    for (const cb of resizeCallbacks) cb();
    expect(band.style.getPropertyValue(TITLE_GROW_PROP)).toBe('19.04px');
    titleBox = 19;
    for (const cb of resizeCallbacks) cb();
    expect(band.style.getPropertyValue(TITLE_GROW_PROP)).toBe('');
  });

  it('stops watching when told to', () => {
    const stop = watchTitleGrow(bandWithTitle());
    expect(disconnected).toBe(0);
    stop();
    expect(disconnected).toBe(1);
  });

  it('a card with no title (the shell\'s fallback) is left alone', () => {
    const band = document.createElement('div');
    expect(() => watchTitleGrow(band)()).not.toThrow();
    expect(band.getAttribute('style')).toBeNull();
  });

  it('a browser with no ResizeObserver still measures once', () => {
    vi.unstubAllGlobals();
    const band = bandWithTitle();
    const stop = watchTitleGrow(band);
    expect(band.style.getPropertyValue(TITLE_GROW_PROP)).toBe('19.04px');
    expect(() => stop()).not.toThrow();
  });
});

describe('the CHAPTER panel wires it', () => {
  const belgemine = getChapter('belgemine')!;
  const bahamut = CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!;

  it('mounting a chapter with a two-line title grows the card; unmounting stops the watch', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const panel = makeChapterPanel('ffx');
    panel.mount(el, { chapter: belgemine, memberId: 'yuna' });
    expect(el.querySelector<HTMLElement>('.prepchap')!.style.getPropertyValue(TITLE_GROW_PROP)).toBe('19.04px');
    panel.unmount?.();
    expect(disconnected).toBeGreaterThan(0);
  });

  it('a one-line title leaves the card with no inline style at all (FFX-2 as well: the panel is shared)', () => {
    titleBox = 19;
    const el = document.createElement('div');
    document.body.appendChild(el);
    makeChapterPanel('ffx2').mount(el, { chapter: bahamut, memberId: 'yuna-x2' });
    expect(el.querySelector<HTMLElement>('.prepchap')!.getAttribute('style') ?? '').toBe('');
  });
});

describe('the stylesheet geometry', () => {
  const tab = css('src/ui/ffx/party-prep/chapter-panel-tab.css');
  const shell = css('src/ui/common/party-prep.css');

  it('the base band is still the fixed 120 grid px (the line model of the briefing column reads it)', () => {
    expect(tab).toMatch(/\n\.prepchap \{[^}]*\n {2}height: 120px;/);
  });

  it('the growth is one rule in a min-width 600 block, adds the property to the 120 and caps it at the module\'s constant', () => {
    const block = /@media \(min-width: 600px\) \{\n {2}\.prepchap \{\n {4}height: calc\(120px \+ min\(var\(--prepchap-grow, 0px\), (\d+)px\)\);/.exec(tab);
    expect(block, 'the growth rule').not.toBeNull();
    expect(Number(block![1])).toBe(TITLE_GROW_CAP_PX);
    expect(tab).toContain(`var(${TITLE_GROW_PROP}, 0px)`);
  });

  it('the card with the cap added still ends above the hint line, with room to spare', () => {
    const topRule = /\.prep__sheet:has\(> \.prep__sheet-inner > \.prep__panel\[data-panel='chapter'\]:not\(\[hidden\]\)\) \{\n\s+top: ([\d.]+)px;/.exec(tab);
    const hintRule = /\n\.prep__hint \{[^}]*?\n\s+top: ([\d.]+)px;/.exec(shell);
    expect(topRule, 'the raised sheet top').not.toBeNull();
    expect(hintRule, 'the hint line top').not.toBeNull();
    const bottom = Number(topRule![1]) + 120 + TITLE_GROW_CAP_PX;
    expect(bottom).toBeLessThan(Number(hintRule![1]) - 5);
  });
});
