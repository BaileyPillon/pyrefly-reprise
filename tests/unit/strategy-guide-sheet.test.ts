// @vitest-environment jsdom
/**
 * The strategy guide on the desktop is a scrolling reading sheet, not a paged rail (R38, 2026-10-03; Bailey took the
 * recommendation: a scrollable reading view like the phone's instead of paging the side rail, which made Chapter I
 * fourteen pages and Vegnagun more than sixty).
 *
 * What is pinned here: the whole document is in the sheet and nothing is hidden or cut; the sheet is a scroller that
 * shrinks to the room its column has; it opens scrolled to the boss that is standing, with no half line of the
 * block before it left at the top; the player's place is kept while the fight goes on and the sheet opens on the
 * boss again when it is brought back or a new boss takes the field; the scroll keys and the pad's right stick move
 * it and nothing else does; and none of this reaches the phone, which has its own sheet.
 *
 * jsdom has no layout, so the opening position and the keys run on the fake layout in `helpers/guideSheetStub.ts`,
 * and the scrolling itself is read out of the stylesheet. The browser half is in `docs/handoff/r38-guide-jegged.md`.
 *
 * **Game case: both** [AGENTS.md rule 14]: the sheet, its scrolling and its column are shared plumbing for both HUDs.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GUIDE_DOCS, docForChapter } from '../../src/data/guides/docs/index.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { SCROLL_KEYS, gapAbove, padScrollStep, padScrollTravel, scrollSheetByKey, wheelStep } from '../../src/ui/common/guideScroll.ts';
import { fakeBoard } from './helpers/guideDocStrings.ts';
import { stubSheetLayout } from './helpers/guideSheetStub.ts';

const CSS = readFileSync(resolve(process.cwd(), 'src/ui/common/strategy-guide.css'), 'utf8');
const PHONE_CSS = readFileSync(resolve(process.cwd(), 'src/ui/common/phone-battle.css'), 'utf8');

/** The declaration block of the first rule that starts with exactly this selector. */
function rule(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`);
  expect(at, `${selector} is gone`).toBeGreaterThan(-1);
  return css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
}

function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

let pad: { connected: boolean; buttons: Array<{ pressed: boolean }>; axes: number[] } | null = null;
const live: StrategyGuide[] = [];

beforeEach(() => {
  pad = null;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => (pad ? [pad] : []) });
});

afterEach(() => {
  while (live.length) live.pop()!.unmount();
  delete document.documentElement.dataset['phoneBattle'];
  document.body.innerHTML = '';
});

function mount(board: ReturnType<typeof fakeBoard>, visible = true): { stage: HTMLElement; guide: StrategyGuide; written: boolean[] } {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const written: boolean[] = [];
  const guide = new StrategyGuide({
    game: board.game,
    anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    readVisible: () => visible,
    writeVisible: (on) => void written.push(on),
  });
  guide.mount(stage);
  guide.sync(board);
  live.push(guide);
  return { stage, guide, written };
}

const key = (code: string, init: KeyboardEventInit = {}): KeyboardEvent => {
  const e = new KeyboardEvent('keydown', { code, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
};

/** Yunalesca in her third form opens on Phase 3's stat line: a block deep in a long document. */
const YUNALESCA_FORM_3 = (): ReturnType<typeof fakeBoard> => fakeBoard('ffx', [{ id: 'yunalesca', formIndex: 2 }]);
const phase3Block = (): number => docForChapter('yunalesca')!.blocks.findIndex((b) => b.t === 'field' && b.label === 'Phase 3: HP');

describe('the whole document is in the sheet', () => {
  it('has every block of the boss’s page, and no MORE row, no hidden block and no clamped body', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    const doc = docForChapter('yunalesca')!;
    const marked = new Set(Array.from(stage.querySelectorAll('[data-block]')).map((e) => Number(e.getAttribute('data-block'))));
    expect(marked.size).toBe(doc.blocks.length);
    expect(stage.querySelector('[data-role="strategy-guide-more"]')).toBeNull();
    expect(stage.querySelector('.sgd__more')).toBeNull();
    expect(stage.querySelectorAll('[hidden]').length).toBe(0);
    expect(stage.querySelector<HTMLElement>('.sgd__body')!.style.height).toBe('');
    expect(Array.from(stage.querySelectorAll<HTMLElement>('.sgd__u')).every((u) => u.style.height === '' && u.style.display === '')).toBe(true);
  });

  it('is a column of two rows, the card’s slot and then the sheet, and the sheet is the guide’s alone', () => {
    const { stage } = mount(YUNALESCA_FORM_3());
    const stack = stage.querySelector<HTMLElement>('[data-role="strategy-guide-stack"]')!;
    expect(Array.from(stack.children).map((c) => (c as HTMLElement).dataset['role'])).toEqual(['strategy-guide-slot', 'strategy-guide-panel']);
    // Nothing of the status hint card is in the sheet: the slot is its own row, empty until the card stands in it.
    expect(stage.querySelector('.sgd__panel .sthint')).toBeNull();
    expect(stage.querySelector('.sgd__slot')!.children.length).toBe(0);
  });
});

describe('the sheet scrolls (the stylesheet)', () => {
  it('is a scroller that shrinks to what its column has and is as tall as a short document', () => {
    const body = rule(CSS, '.sgd__panel');
    expect(body).toMatch(/overflow-y:\s*auto/);
    expect(body).toMatch(/overflow-x:\s*hidden/);
    expect(body).toMatch(/flex:\s*0 1 auto/);
    expect(body).toMatch(/min-height:\s*0/);
    expect(body).not.toMatch(/mask|(?<![-\w])height:\s*\d/);
  });

  it('keeps its column a flex column with the card’s slot as the first row, and no row for paging', () => {
    expect(rule(CSS, '.sgd__stack')).toMatch(/flex-direction:\s*column/);
    expect(rule(CSS, '.sgd__slot')).toMatch(/flex:\s*0 0 auto/);
    for (const gone of ['.sgd__more', '.sgd__u--out', '.sgd__part', '.sgd__cont']) expect(CSS, gone).not.toContain(gone);
  });

  it('is its own offset parent, contains the wheel and draws a thin accent scroll bar, on the desktop only', () => {
    const desktop = rule(CSS, "html:not([data-phone-battle]) .sgd__panel");
    expect(desktop).toMatch(/position:\s*relative/);
    expect(desktop).toMatch(/overscroll-behavior:\s*contain/);
    const thumb = rule(CSS, "html:not([data-phone-battle]) .sgd__panel::-webkit-scrollbar-thumb");
    expect(thumb).toMatch(/background:\s*var\(--ig-accent\)/);
    expect(Number.parseFloat(/width:\s*([\d.]+)px/.exec(rule(CSS, "html:not([data-phone-battle]) .sgd__panel::-webkit-scrollbar"))![1]!)).toBeGreaterThan(1);
    // The unscoped sheet rule says nothing of any of it, so the phone's sheet is the one it was.
    const shared = rule(CSS, '.sgd__panel');
    expect(shared).not.toMatch(/position:|overscroll|scrollbar/);
  });

  it('leaves the phone’s own sheet rules where they were', () => {
    expect(PHONE_CSS).toContain("html[data-phone-battle] [data-phone-guide='open'] .sgd__panel {");
    expect(PHONE_CSS).toMatch(/\.sgd__panel \{[^}]*overflow-y:\s*auto/);
    expect(PHONE_CSS).not.toContain('.sgd__more');
  });
});

describe('where the sheet opens', () => {
  it('on the boss that is standing, with only the empty gap above its header showing', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    const target = stage.querySelector<HTMLElement>(`[data-block="${phase3Block()}"]`)!;
    expect(target.offsetTop).toBeGreaterThan(100);
    // The 4-px gap is what the stylesheet leaves between two blocks: the sheet opens on exactly that, never on a line.
    expect(stub.panel.scrollTop).toBe(target.offsetTop - 4);
    expect(gapAbove(target, stage.querySelector<HTMLElement>('.sgd__body')!)).toBe(4);
  });

  it('shows at most the lead above a header when the gap is wider, and the top of the document when it opens at the top', () => {
    const wide = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(wide.stage, { unitHeight: 20, gap: 14, padTop: 5, clientHeight: 100 });
    wide.guide.update(0.016);
    const target = wide.stage.querySelector<HTMLElement>(`[data-block="${phase3Block()}"]`)!;
    expect(stub.panel.scrollTop).toBe(target.offsetTop - 6);

    const top = mount(fakeBoard('ffx', [{ id: 'yunalesca', formIndex: 0 }]));
    const topStub = stubSheetLayout(top.stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    top.guide.update(0.016);
    const head = top.stage.querySelector<HTMLElement>(`[data-block="${top.guide.view()!.start}"]`)!;
    expect(topStub.panel.scrollTop).toBe(Math.max(0, head.offsetTop - Math.min(6, gapAbove(head, top.stage.querySelector<HTMLElement>('.sgd__body')!))));
  });

  it('measures a list item from its list: the gap above the first item is the gap above the list', () => {
    const doc = GUIDE_DOCS.find((d) => d.blocks.some((b) => b.t === 'ul'))!;
    const { stage } = mount(fakeBoard(doc.game, [{ id: doc.bossIds[0]! }]));
    stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    const body = stage.querySelector<HTMLElement>('.sgd__body')!;
    const li = body.querySelector<HTMLElement>('ul > li[data-block]')!;
    expect(li, `${doc.id} has a bulleted list to measure`).not.toBeNull();
    expect(gapAbove(li, body)).toBe(4);
  });

  it('waits until the sheet is laid out, and then opens once', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
    guide.update(0.016); // nothing is painted yet: the sheet has no height
    expect(panel.scrollTop).toBe(0);
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    const opened = stub.panel.scrollTop;
    expect(opened).toBeGreaterThan(0);
    stub.panel.scrollTop = 33; // the player scrolls
    guide.update(0.016);
    guide.sync(YUNALESCA_FORM_3());
    expect(stub.panel.scrollTop).toBe(33); // and the fight going on does not move the page
  });

  it('waits for the fonts: a line that re-wraps under a late face would move the header it opened on', () => {
    const fonts = { status: 'loading' };
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    try {
      const { stage, guide } = mount(YUNALESCA_FORM_3());
      const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
      guide.update(0.016);
      guide.update(0.016);
      expect(stub.panel.scrollTop).toBe(0); // laid out, but the faces are not in
      fonts.status = 'loaded';
      guide.update(0.016);
      expect(stub.panel.scrollTop).toBeGreaterThan(0);
    } finally {
      delete (document as unknown as { fonts?: unknown }).fonts;
    }
  });

  it('keeps the player’s page while the fight goes on, and moves it when the boss changes', () => {
    const { stage, guide } = mount(fakeBoard('ffx2', [{ id: 'vegnagun-tail' }]));
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    stub.panel.scrollTop = 411;
    guide.sync(fakeBoard('ffx2', [{ id: 'vegnagun-tail', hp: 500 }]));
    guide.update(0.016);
    expect(stub.panel.scrollTop).toBe(411);
    guide.sync(fakeBoard('ffx2', [{ id: 'vegnagun-leg' }]));
    const again = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    expect(again.panel.scrollTop).not.toBe(411);
    expect(guide.view()?.title).toBe('Vegnagun (Leg) and Node A/B/C');
  });

  it('opens on the boss again each time the sheet is brought back', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    const opened = stub.panel.scrollTop;
    stub.panel.scrollTop = 9;
    key('KeyG'); // hide
    expect(guide.isVisible).toBe(false);
    key('KeyG'); // show
    expect(guide.isVisible).toBe(true);
    guide.update(0.016);
    expect(stub.panel.scrollTop).toBe(opened);
  });
});

describe('what scrolls it', () => {
  it('`[` and `]` move a page up and down, `Home` and `End` go to the top and the foot', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    stub.panel.scrollTop = 300;
    const down = key('BracketRight');
    expect(down.defaultPrevented).toBe(true);
    expect(stub.panel.scrollTop).toBeCloseTo(385, 5); // 85% of the 100 px the sheet shows
    key('BracketLeft');
    expect(stub.panel.scrollTop).toBeCloseTo(300, 5);
    key('Home');
    expect(stub.panel.scrollTop).toBe(0);
    key('End');
    expect(stub.panel.scrollTop).toBe(stub.panel.scrollHeight);
  });

  it('claims only keys nothing else uses: not the arrows, not PageUp or PageDown (the pad’s L1 and R1)', () => {
    expect([...SCROLL_KEYS].sort()).toEqual(['BracketLeft', 'BracketRight', 'End', 'Home']);
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    stub.panel.scrollTop = 120;
    for (const code of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space', 'Enter', 'KeyS', 'KeyW']) {
      const e = key(code);
      expect(e.defaultPrevented, code).toBe(false);
    }
    expect(stub.panel.scrollTop).toBe(120);
  });

  it('ignores the keys with a modifier held, while the sheet is off, and on the phone', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    stub.panel.scrollTop = 120;
    expect(key('BracketRight', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key('Home', { altKey: true }).defaultPrevented).toBe(false);
    expect(key('End', { metaKey: true }).defaultPrevented).toBe(false);
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    expect(key('End').defaultPrevented).toBe(false);
    delete document.documentElement.dataset['phoneBattle'];
    expect(stub.panel.scrollTop).toBe(120);
    guide.toggle(); // off: the keys are nobody's
    expect(key('End').defaultPrevented).toBe(false);
    expect(stub.panel.scrollTop).toBe(120);
  });

  it('answers nothing on a board with no written guide', () => {
    const { guide } = mount(fakeBoard('ffx', [{ id: 'a-random-fiend' }]));
    expect(guide.view()).toBeNull();
    expect(key('Home').defaultPrevented).toBe(false);
    expect(key('BracketRight').defaultPrevented).toBe(false);
  });

  /** The sheet drawn at the stage's scale: 132 layout px wide, `scale` times that on the screen. */
  function drawnAt(panel: HTMLElement, scale: number): void {
    Object.defineProperty(panel, 'offsetWidth', { value: 132, configurable: true });
    panel.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 132 * scale, bottom: 100 * scale, width: 132 * scale, height: 100 * scale, toJSON: () => ({}) }) as DOMRect;
  }
  const wheel = (panel: HTMLElement, init: WheelEventInit): WheelEvent => {
    const e = new WheelEvent('wheel', { cancelable: true, bubbles: true, ...init });
    panel.dispatchEvent(e);
    return e;
  };

  it('moves the text by what the wheel says, not by the stage’s scale: a notch is 100 screen px at any scale', () => {
    for (const scale of [2, 2.5, 2.8125, 4]) {
      const { stage, guide } = mount(YUNALESCA_FORM_3());
      const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
      guide.update(0.016);
      drawnAt(stub.panel, scale);
      stub.panel.scrollTop = 200;
      const e = wheel(stub.panel, { deltaY: 100, deltaMode: 0 });
      expect(e.defaultPrevented, `scale ${scale}`).toBe(true);
      expect(stub.panel.scrollTop, `scale ${scale}`).toBeCloseTo(200 + 100 / scale, 6);
      wheel(stub.panel, { deltaY: -100, deltaMode: 0 });
      expect(stub.panel.scrollTop, `scale ${scale}`).toBeCloseTo(200, 6);
      guide.unmount();
    }
  });

  it('leaves the wheel to the browser on the phone, for a pinch, sideways, and when the sheet has no layout', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    stub.panel.scrollTop = 200;
    expect(wheel(stub.panel, { deltaY: 100 }).defaultPrevented).toBe(false); // no layout: offsetWidth is 0
    drawnAt(stub.panel, 2.5);
    expect(wheel(stub.panel, { deltaY: 100, ctrlKey: true }).defaultPrevented).toBe(false);
    expect(wheel(stub.panel, { deltaX: 100, deltaY: 0 }).defaultPrevented).toBe(false);
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    expect(wheel(stub.panel, { deltaY: 100 }).defaultPrevented).toBe(false);
    expect(stub.panel.scrollTop).toBe(200);
  });

  it('takes the pad’s right stick, past the dead zone, and nothing else on the pad', () => {
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 100 });
    guide.update(0.016);
    stub.panel.scrollTop = 200;
    pad = { connected: true, buttons: [{ pressed: false }, { pressed: false }, { pressed: false }], axes: [0, 0, 0, 0.1] };
    guide.update(0.1);
    expect(stub.panel.scrollTop).toBe(200); // inside the dead zone
    pad.axes = [0, 0, 0, 1];
    guide.update(0.1);
    expect(stub.panel.scrollTop).toBeCloseTo(200 + padScrollStep(1, 0.1), 5);
    pad.axes = [0.9, 1, 0, -1]; // the left stick is the menu's: only axis 3 scrolls
    guide.update(0.1);
    expect(stub.panel.scrollTop).toBeCloseTo(200, 5);
    // the guide's toggle button is still the only button it reads
    expect(guide.isVisible).toBe(true);
  });
});

describe('the scroll arithmetic', () => {
  it('moves a page up or down by 85% of the sheet, jumps to either end, and does nothing for any other key', () => {
    const sheet = document.createElement('div');
    Object.defineProperty(sheet, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(sheet, 'scrollHeight', { value: 900, configurable: true });
    sheet.scrollTop = 400;
    scrollSheetByKey(sheet, 'BracketRight');
    expect(sheet.scrollTop).toBe(570);
    scrollSheetByKey(sheet, 'BracketLeft');
    expect(sheet.scrollTop).toBe(400);
    scrollSheetByKey(sheet, 'KeyZ');
    expect(sheet.scrollTop).toBe(400);
    scrollSheetByKey(sheet, 'Home');
    expect(sheet.scrollTop).toBe(0);
    scrollSheetByKey(sheet, 'End');
    expect(sheet.scrollTop).toBe(900);
  });

  it('turns the stick into a speed past a dead zone, and caps a long frame so a stalled tab cannot fling the sheet', () => {
    expect(padScrollTravel(undefined)).toBe(0);
    expect(padScrollTravel(0.29)).toBe(0);
    expect(padScrollTravel(-0.29)).toBe(0);
    expect(padScrollTravel(0.5)).toBe(0.5);
    expect(padScrollTravel(-2)).toBe(-1);
    expect(padScrollStep(1, 0.016)).toBeCloseTo(130 * 0.016, 6);
    expect(padScrollStep(-1, 0.016)).toBeCloseTo(-130 * 0.016, 6);
    expect(padScrollStep(1, 5)).toBeCloseTo(13, 6); // capped at 0.1 s
    expect(padScrollStep(1, -1)).toBe(0);
  });

  it('converts a wheel event to layout px: pixels by the scale, lines at 19 px, pages by the sheet', () => {
    expect(wheelStep(100, 0, 2.5, 71)).toBeCloseTo(40, 6);
    expect(wheelStep(-100, 0, 4, 71)).toBeCloseTo(-25, 6);
    expect(wheelStep(3, 1, 2.5, 71)).toBeCloseTo((3 * 19) / 2.5, 6);
    expect(wheelStep(1, 2, 2.5, 71)).toBeCloseTo(71, 6);
    expect(wheelStep(100, 0, 0, 71)).toBe(0); // no layout: the browser's
    expect(wheelStep(100, 0, Number.NaN, 71)).toBe(0);
  });

  it('reads the gap above the first block of a document as its distance from the top', () => {
    const body = document.createElement('div');
    const first = document.createElement('p');
    body.append(first);
    Object.defineProperty(first, 'offsetTop', { value: 5, configurable: true });
    expect(gapAbove(first, body)).toBe(5);
  });
});

describe('the phone’s sheet is the one it was', () => {
  it('shows the whole document at full length and opens on the boss with its own lead, from its own column', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const { stage, guide } = mount(YUNALESCA_FORM_3());
    const stub = stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 10, clientHeight: 300 });
    guide.update(0.016);
    const target = stage.querySelector<HTMLElement>(`[data-block="${phase3Block()}"]`)!;
    // Old rule, unchanged: the block's offset in its column, less the sheet's own offset, less 6.
    expect(stub.panel.scrollTop).toBe(target.offsetTop - stub.panel.offsetTop - 6);
    expect(stage.querySelectorAll('[hidden]').length).toBe(0);
    expect(stage.querySelector('.sgd__body')!.getAttribute('style')).toBeNull();
    // and the desktop's scroll keys do not touch it
    stub.panel.scrollTop = 50;
    expect(key('BracketRight').defaultPrevented).toBe(false);
    expect(stub.panel.scrollTop).toBe(50);
  });
});
