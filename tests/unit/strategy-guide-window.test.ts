// @vitest-environment jsdom
/**
 * PR-0385 (release 39.1; both games: the sheet is shared plumbing): the guide's reading sheet says it scrolls and never shows half a line.
 * Round 22 found the foot of the sheet cut through the middle of a line in Chapters I, XII and XVII (FFX) and V and XI (FFX-2), with no scroll bar in a
 * headless capture and no word anywhere that the sheet scrolls.
 *
 * jsdom has no layout, so the sheet runs on the fake one of `helpers/guideSheetStub.ts` plus the two things the line measure reads that it lacks: the
 * panel's own rectangle and one text box per block (a `Range`'s rectangles). What is pinned: the text is clipped to whole lines at every scroll position
 * (no stubbed block is cut by either edge of what is left), the scroll chip is up exactly while the sheet has more than it shows and a click pages down, the
 * marks say which way there is more, nothing is written on the phone or for a sheet that fits, and the document itself is untouched. The browser half
 * (real text boxes, real pixels at 1280x720 to 2560x1440) is `docs/handoff/r391-ui.md`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { fakeBoard } from './helpers/guideDocStrings.ts';
import { stubSheetLayout, type SheetStub } from './helpers/guideSheetStub.ts';

const live: StrategyGuide[] = [];
const rangeProto = Range.prototype as unknown as { selectNodeContents: (n: Node) => void; getClientRects?: () => unknown[] };
const realSelect = rangeProto.selectNodeContents;
let selected: Node | null = null;

beforeEach(() => {
  // One text box per block: the block's own rectangle, in the screen's coordinates (the content's, less how far the sheet is scrolled).
  rangeProto.selectNodeContents = function (this: Range, n: Node): void {
    selected = n;
    realSelect.call(this, n);
  };
  rangeProto.getClientRects = function (): unknown[] {
    let el: HTMLElement | null = (selected as Node).parentElement;
    while (el && !Object.prototype.hasOwnProperty.call(el, 'offsetTop')) el = el.parentElement;
    const panel = document.querySelector<HTMLElement>('.sgd__panel')!;
    if (!el) return [];
    return [{ top: el.offsetTop - panel.scrollTop, bottom: el.offsetTop + el.offsetHeight - panel.scrollTop, width: 60, height: el.offsetHeight }];
  };
});

afterEach(() => {
  while (live.length) live.pop()!.unmount();
  delete document.documentElement.dataset['phoneBattle'];
  delete rangeProto.getClientRects;
  rangeProto.selectNodeContents = realSelect;
  document.body.innerHTML = '';
});

function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

/** A guide on a board with a long document, its layout stubbed: `clientHeight` is what the sheet shows, and the blocks are 20 tall 4 apart. */
function mount(clientHeight = 90): { stage: HTMLElement; guide: StrategyGuide; stub: SheetStub; body: HTMLElement; keys: HTMLElement; stack: HTMLElement } {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const guide = new StrategyGuide({
    game: 'ffx',
    anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    readVisible: () => true,
    writeVisible: () => undefined,
  });
  guide.mount(stage);
  guide.sync(fakeBoard('ffx', [{ id: 'yunalesca', formIndex: 2 }]));
  live.push(guide);
  const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight });
  const body = stage.querySelector<HTMLElement>('.sgd__body')!;
  Object.defineProperty(body, 'offsetTop', { value: 5, configurable: true });
  Object.defineProperty(body, 'offsetHeight', { value: stub.panel.scrollHeight - 11, configurable: true });
  stub.panel.getBoundingClientRect = (): DOMRect => ({ top: 0, bottom: clientHeight, left: 0, right: 100, width: 100, height: clientHeight, x: 0, y: 0, toJSON: () => ({}) });
  // The body is the box the line measure reads its scale and its origin off: 1:1 here, its top 5 px into the sheet, less how far the sheet is scrolled.
  const bodyHeight = stub.panel.scrollHeight - 11;
  body.getBoundingClientRect = (): DOMRect => {
    const top = 5 - stub.panel.scrollTop;
    return { top, bottom: top + bodyHeight, left: 0, right: 100, width: 100, height: bodyHeight, x: 0, y: top, toJSON: () => ({}) };
  };
  Object.defineProperty(stub.panel, 'offsetWidth', { value: 100, configurable: true });
  guide.update(0.016);
  return { stage, guide, stub, body, keys: stage.querySelector<HTMLElement>('.sgd__keys')!, stack: stage.querySelector<HTMLElement>('.sgd__stack')! };
}

/** The part of the content the clipped text shows, from the lengths the guide wrote on the body. */
function shown(body: HTMLElement): { top: number; bottom: number } {
  const clipTop = Number.parseFloat(body.style.getPropertyValue('--sgd-clip-top') || '0');
  const clipBottom = Number.parseFloat(body.style.getPropertyValue('--sgd-clip-bottom') || '0');
  return { top: 5 + clipTop, bottom: 5 + body.offsetHeight - clipBottom };
}

/** The stubbed lines: a block is one line, and a list is one line per item (the stub gives a list the height of its items, one unit each). */
const blocksOf = (stub: SheetStub): Array<{ top: number; bottom: number }> =>
  stub.blocks.flatMap((b) => {
    const items = Array.from(b.el.querySelectorAll<HTMLElement>(':scope > li'));
    return items.length ? items.map((li) => ({ top: li.offsetTop, bottom: li.offsetTop + li.offsetHeight })) : [{ top: b.top, bottom: b.top + b.height }];
  });

describe('the sheet never shows half a line', () => {
  it('clips the text at every scroll position so that no line is cut by what is left, and the clip stays inside the window', () => {
    const { guide, stub, body } = mount(90);
    const start = stub.panel.scrollTop;
    expect(stub.maxScroll).toBeGreaterThan(300);
    let cutSomething = 0;
    for (const at of [0, start, start + 7, start + 33, start + 61, 250, stub.maxScroll - 5, stub.maxScroll]) {
      stub.panel.scrollTop = at;
      guide.update(0.016);
      const w = shown(body);
      expect(w.top, `scrollTop ${at}`).toBeGreaterThanOrEqual(at - 0.01);
      expect(w.bottom, `scrollTop ${at}`).toBeLessThanOrEqual(at + 90 + 0.01);
      // An edge may stand a little inside a line's box where that part holds no ink (a descender's overshoot below the line above, the air above the capitals
      // of the line below: the first 40 percent of a box at the head, the first quarter at the foot); it may not stand in the part that holds the glyphs.
      for (const b of blocksOf(stub)) {
        const h = b.bottom - b.top;
        expect(w.top > b.top + h * 0.4 + 0.01 && w.top < b.bottom - 0.4, `scrollTop ${at}: a line crosses the head ${w.top}`).toBe(false);
        expect(w.bottom > b.top + h * 0.25 + 0.4 && w.bottom < b.bottom - 0.01, `scrollTop ${at}: a line crosses the foot ${w.bottom}`).toBe(false);
      }
      if (w.top > at + 0.01 || w.bottom < at + 90 - 0.01) cutSomething++;
    }
    expect(cutSomething, 'the positions chosen do cut a line without the clip').toBeGreaterThan(2);
  });

  it('leaves the document and the panel alone: only the body clip lengths are written', () => {
    const { stage, guide, stub } = mount(90);
    const before = stage.querySelector('.sgd__body')!.innerHTML;
    stub.panel.scrollTop = 61;
    guide.update(0.016);
    expect(stage.querySelector('.sgd__body')!.innerHTML).toBe(before);
    expect(stub.panel.style.cssText).toBe('');
    expect(stub.panel.hidden).toBe(false);
  });

  it('writes nothing for a frame that looks like the last', () => {
    const { guide, stub, body } = mount(90);
    stub.panel.scrollTop = 61;
    guide.update(0.016);
    let writes = 0;
    const set = body.style.setProperty.bind(body.style);
    body.style.setProperty = (n: string, v: string | null, p?: string): void => {
      writes++;
      set(n, v, p);
    };
    for (let i = 0; i < 30; i++) guide.update(0.016);
    expect(writes).toBe(0);
  });
});

describe('the sheet says it scrolls', () => {
  it('stands the chip up while there is more than the sheet shows, with the keys on it', () => {
    const { keys, guide } = mount(90);
    expect(keys.classList.contains('sgd__keys--on')).toBe(true);
    expect(keys.textContent).toMatch(/\[ \]/);
    expect(keys.textContent?.toLowerCase()).toContain('scroll');
    expect(keys.title).toMatch(/\[ and \]/);
    guide.toggle(); // the guide away: no chip for a sheet that is not there
    expect(keys.classList.contains('sgd__keys--on')).toBe(false);
  });

  it('puts the chip on the toggle line and just past it, in the same grid px', () => {
    const { stage, guide } = mount(90);
    const toggle = stage.querySelector<HTMLElement>('.sgd__toggle')!;
    const keys = stage.querySelector<HTMLElement>('.sgd__keys')!;
    Object.defineProperty(toggle, 'offsetLeft', { value: 21.33, configurable: true });
    Object.defineProperty(toggle, 'offsetWidth', { value: 52, configurable: true });
    guide.update(0.016);
    expect(keys.style.top).toBe(toggle.style.top);
    expect(Number.parseFloat(keys.style.left)).toBeCloseTo(21.33 + 52 + 3, 2);
  });

  it('is not up for a sheet that fits, and says nothing about scrolling there', () => {
    const { keys, stack, body, stub, guide } = mount(90);
    Object.defineProperty(stub.panel, 'scrollHeight', { value: 80, configurable: true });
    guide.update(0.016);
    expect(keys.classList.contains('sgd__keys--on')).toBe(false);
    expect(stack.dataset['scroll']).toBeUndefined();
    expect(body.style.getPropertyValue('--sgd-clip-top')).toBe('');
    expect(body.style.getPropertyValue('--sgd-clip-bottom')).toBe('');
  });

  it('marks which way there is more: below at the top, both ways in the middle, above at the foot', () => {
    const { guide, stub, stack } = mount(90);
    stub.panel.scrollTop = 0;
    guide.update(0.016);
    expect(stack.dataset['scroll']).toBe('down');
    stub.panel.scrollTop = 120;
    guide.update(0.016);
    expect(stack.dataset['scroll']).toBe('up down');
    stub.panel.scrollTop = stub.maxScroll;
    guide.update(0.016);
    expect(stack.dataset['scroll']).toBe('up');
    expect(Number.parseFloat(stack.style.getPropertyValue('--sgd-panel-top'))).toBe(stub.panel.offsetTop);
  });

  it('pages down on a click, and from the foot back to the top; the chip never keeps the keyboard', () => {
    const { guide, stub, keys } = mount(90);
    stub.panel.scrollTop = 100;
    const down = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
    keys.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    keys.click();
    expect(stub.panel.scrollTop).toBeCloseTo(100 + 90 * 0.85, 5);
    stub.panel.scrollTop = stub.maxScroll;
    keys.click();
    expect(stub.panel.scrollTop).toBe(0);
    guide.update(0.016);
  });

  it('says R-Stick for a pad, as the toggle says its button', () => {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => [{ connected: true, buttons: [], axes: [] }] });
    try {
      const { keys, guide } = mount(90);
      guide.update(0.016);
      expect(keys.textContent).toContain('R-Stick');
    } finally {
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => [] });
    }
  });
});

describe('not on the phone, and not while the faces load', () => {
  it('writes nothing on the upright phone (its sheet is the player to swipe)', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const { keys, stack, body } = mount(90);
    expect(keys.classList.contains('sgd__keys--on')).toBe(false);
    expect(stack.dataset['scroll']).toBeUndefined();
    expect(body.style.getPropertyValue('--sgd-clip-bottom')).toBe('');
  });

  it('measures nothing while the faces are loading (the boxes are not final), and measures once they are in', () => {
    const fonts = { status: 'loading' };
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    try {
      const { guide, body, stub } = mount(90);
      stub.panel.scrollTop = 61;
      guide.update(0.016);
      expect(body.style.getPropertyValue('--sgd-clip-bottom')).toBe('');
      fonts.status = 'loaded';
      guide.update(0.016);
      expect(body.style.getPropertyValue('--sgd-clip-bottom')).not.toBe('');
    } finally {
      delete (document as unknown as { fonts?: unknown }).fonts;
    }
  });
});

describe('the stylesheet', () => {
  const CSS = readFileSync(resolve(process.cwd(), 'src/ui/common/strategy-guide.css'), 'utf8');
  const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');
  /** The declaration block of the first rule that starts with exactly this selector. */
  const rule = (selector: string): string => {
    const css = strip(CSS);
    const at = css.indexOf(`${selector} {`);
    expect(at, `${selector} is gone`).toBeGreaterThan(-1);
    return css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
  };

  it('clips the body text, hard-edged, on the desktop only: an inset by the two lengths the guide writes, no gradient, no mask', () => {
    const clip = rule('html:not([data-phone-battle]) .sgd__body');
    expect(clip).toMatch(/clip-path:\s*inset\(var\(--sgd-clip-top, 0px\) 0 var\(--sgd-clip-bottom, 0px\) 0\)/);
    expect(clip).not.toMatch(/gradient|mask/);
    expect(rule('.sgd__body')).not.toMatch(/clip-path/);
  });

  it('draws the scroll marks on the column pseudo-elements (its rows stay two), from its data-scroll word, on the desktop only', () => {
    const css = strip(CSS);
    expect(css).toContain(".sgd__stack[data-scroll~='down']::after");
    expect(css).toContain(".sgd__stack[data-scroll~='up']::before");
    expect(css).toMatch(/html:not\(\[data-phone-battle\]\) \.sgd__stack::after\s*\{\s*bottom:/);
    expect(css).not.toContain('.sgd__more');
  });

  it('keeps the scroll chip off until the guide stands it up, and off the phone altogether', () => {
    expect(rule('.sgd__keys')).toMatch(/display:\s*none/);
    expect(rule('.sgd__keys--on')).toMatch(/display:\s*flex/);
    expect(rule('html[data-phone-battle] .sgd__keys')).toMatch(/display:\s*none !important/);
    expect(rule('.sgd__keys')).toMatch(/font-size:\s*5\.7px/);
  });
});
