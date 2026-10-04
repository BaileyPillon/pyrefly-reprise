// @vitest-environment jsdom
/**
 * How a document is drawn and paged (`src/ui/common/guideDocHtml.ts`, `StrategyGuide.ts`).
 *
 * The panel pages by whole blocks, so every piece of text must be a `.sgd__u` unit, a unit that
 * introduces what follows must never end a page, and the page the panel opens on is the one for the
 * boss that is standing. jsdom has no layout, so the paging cases use the layout stub the fold test
 * uses (`helpers/guideLayoutStub.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { GuideDoc } from '../../src/data/guides/doc-types.ts';
import { docForChapter } from '../../src/data/guides/docs/index.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { docHtml } from '../../src/ui/common/guideDocHtml.ts';
import { fakeBoard } from './helpers/guideDocStrings.ts';
import { stubGuideLayout } from './helpers/guideLayoutStub.ts';

const SAMPLE: GuideDoc = {
  id: 'sample',
  game: 'ffx',
  bossIds: ['x'],
  blocks: [
    { t: 'p', text: 'Before the fight. <b>not markup</b> & "quotes"' },
    { t: 'head', at: ['x'], title: 'A Boss', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '1,000' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ul', items: ['one', 'two'] },
    { t: 'ol', items: ['first', 'second'] },
    { t: 'h3', text: 'A part' },
    { t: 'hint', kind: 'warning', title: 'Careful', text: 'It bites.' },
    { t: 'table', head: ['Attack', 'Answer'], rows: [['Physical', 'a lot'], ['Magic', 'less']] },
    { t: 'list', label: 'Steal', items: ['Elixir (common)'] },
    { t: 'loot', rows: [{ enemy: 'A Boss', hp: '1,000', steal: 'Elixir', drop: 'None' }, { enemy: 'Its Arm', hp: '5', steal: '-', drop: '-' }] },
  ],
};

function mount(game: 'ffx' | 'ffx2', board: ReturnType<typeof fakeBoard>): { stage: HTMLElement; guide: StrategyGuide } {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const guide = new StrategyGuide({
    game,
    anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    readVisible: () => true,
    writeVisible: () => undefined,
  });
  guide.mount(stage);
  guide.sync(board);
  return { stage, guide };
}

function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

const original = Range.prototype.getClientRects;
afterEach(() => {
  Range.prototype.getClientRects = original;
  delete document.documentElement.dataset['phoneBattle'];
  document.body.innerHTML = '';
});

describe('the markup of a document', () => {
  const html = docHtml(SAMPLE);
  const host = document.createElement('div');
  host.innerHTML = html;
  const units = Array.from(host.querySelectorAll('.sgd__u'));

  it('escapes every string instead of injecting it', () => {
    expect(host.querySelector('b')).toBeNull();
    expect(host.textContent).toContain('<b>not markup</b> & "quotes"');
  });

  it('makes every piece of text a unit, one per list item and one box per enemy', () => {
    // 1 p + 1 head + 1 field + 1 lead + 2 + 2 items + 1 h3 + 1 hint + (1 head line + 2 rows) + (1 label + 1 item) + 2 loot boxes
    expect(units).toHaveLength(1 + 1 + 1 + 1 + 2 + 2 + 1 + 1 + 3 + 2 + 2);
    expect(host.querySelectorAll('.sgd__loot')).toHaveLength(2);
    expect(host.querySelectorAll('li.sgd__u')).toHaveLength(2 + 2 + 1);
  });

  it('never lets a page end on a header, a run-in line, a sub-heading, a table head or a list label', () => {
    const kn = Array.from(host.querySelectorAll('.sgd__kn')).map((e) => e.className);
    expect(kn.some((c) => c.includes('sgd__doc-head'))).toBe(true);
    expect(kn.some((c) => c.includes('sgd__lead'))).toBe(true);
    expect(kn.some((c) => c.includes('sgd__h3'))).toBe(true);
    expect(kn.some((c) => c.includes('sgd__thead'))).toBe(true);
    expect(kn.some((c) => c.includes('sgd__listlabel'))).toBe(true);
    expect(host.querySelector('.sgd__p')!.classList.contains('sgd__kn')).toBe(false);
  });

  it('marks the first unit of every block, which is how the panel finds where to open', () => {
    const marks = Array.from(host.querySelectorAll('[data-block]')).map((e) => Number(e.getAttribute('data-block')));
    expect(marks).toEqual([...marks].sort((a, b) => a - b));
    expect(new Set(marks).size).toBe(SAMPLE.blocks.length);
  });

  it('labels the boxed notes the way that page does', () => {
    expect(host.querySelector('.sgd__hint--warning .sgd__hint-kind')!.textContent).toBe('Warning');
    expect(host.querySelector('.sgd__hint-title')!.textContent).toBe('Careful');
  });
});

describe('the panel pages a real document by whole blocks', () => {
  it('opens on the boss that is standing and turns pages with MORE, wrapping at the foot', () => {
    const d = docForChapter('yunalesca')!;
    const { stage, guide } = mount('ffx', fakeBoard('ffx', [{ id: 'yunalesca', formIndex: 2 }]));
    expect(guide.view()).toMatchObject({ chapterId: 'yunalesca', title: 'Yunalesca' });
    const stub = stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);

    // Phase 3's stat line opens the page: everything above it is out of the flow.
    const first = stub.units.findIndex((u) => !u.classList.contains('sgd__u--out'));
    const phase3 = stage.querySelector<HTMLElement>(`[data-block="${d.blocks.findIndex((b) => b.t === 'field' && b.label === 'Phase 3: HP')}"]`)!;
    expect(stub.units[first]).toBe(phase3);
    const more = stage.querySelector<HTMLButtonElement>('[data-role="strategy-guide-more"]')!;
    expect(more.hidden).toBe(false);

    // MORE starts the next page at the first block this one could not show...
    const shownNow = stub.units.filter((u) => !u.classList.contains('sgd__u--out'));
    const next = stub.units[stub.units.indexOf(shownNow[shownNow.length - 1]!) + 1]!;
    more.click();
    const after = stub.units.find((u) => !u.classList.contains('sgd__u--out'))!;
    expect(after).toBe(next);

    // ...and at the foot of the document it comes back to the top.
    let guard = 0;
    while (!more.hidden && guard++ < 40) {
      const visible = stub.units.filter((u) => !u.classList.contains('sgd__u--out'));
      if (visible[visible.length - 1] === stub.units[stub.units.length - 1]) break;
      more.click();
    }
    expect(guard).toBeLessThan(40);
    more.click();
    expect(stub.units.find((u) => !u.classList.contains('sgd__u--out'))).toBe(stub.units[0]);
    guide.unmount();
  });

  it('re-solves the fit when the status hint card arrives after it, so the panel never outgrows its rail', () => {
    // FFX-2's rail does not move with the menu, so nothing but the card's own height can tell the guide it
    // has to give the card room. The rail here is 175 high (240 - 5 - 60).
    const { stage, guide } = mount('ffx2', fakeBoard('ffx2', [{ id: 'bahamut' }]));
    const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
    const body = stage.querySelector<HTMLElement>('.sgd__body')!;
    let hint = 0;
    const card = document.createElement('div');
    card.className = 'sthint';
    Object.defineProperty(card, 'offsetHeight', { configurable: true, get: () => hint });
    panel.insertBefore(card, body);
    stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11, extraChrome: () => hint });
    guide.update(0.016);
    const free = Number.parseFloat(body.style.height);
    expect(free + 11 + 11).toBeLessThanOrEqual(175.5);
    expect(free).toBeGreaterThan(100);

    hint = 60; // the card arrives: same rail, same page, nothing else changed
    guide.update(0.016);
    const squeezed = Number.parseFloat(body.style.height);
    // padding 11, the card 60, the MORE row 11 and the body fill the rail and no more
    expect(squeezed + 11 + 60 + 11).toBeLessThanOrEqual(175.5);
    expect(squeezed).toBeLessThan(free);

    hint = 0; // and gone again: the page gets its room back
    guide.update(0.016);
    expect(Number.parseFloat(body.style.height)).toBeCloseTo(free, 1);
    guide.unmount();
  });

  it('shows every block at full length on the phone, opened on the boss that is standing', () => {
    document.documentElement.dataset['phoneBattle'] = 'ffx';
    const d = docForChapter('yunalesca')!;
    const { stage, guide } = mount('ffx', fakeBoard('ffx', [{ id: 'yunalesca', formIndex: 2 }]));
    const stub = stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);
    expect(stage.querySelectorAll('.sgd__u--out').length).toBe(0);
    expect(stage.querySelector<HTMLElement>('.sgd__body')!.style.height).toBe('');
    // The sheet scrolls to Phase 3's stat line (its offsetTop in the stub) and not to the top.
    const target = stage.querySelector<HTMLElement>(`[data-block="${d.blocks.findIndex((b) => b.t === 'field' && b.label === 'Phase 3: HP')}"]`)!;
    expect(stub.units).toContain(target);
    const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
    expect(panel.scrollTop).toBeGreaterThan(0);
    expect(panel.scrollTop).toBeLessThanOrEqual(target.offsetTop);
    guide.unmount();
  });

  it('keeps the player’s page while the fight goes on, and moves it when the boss changes', () => {
    const { stage, guide } = mount('ffx2', fakeBoard('ffx2', [{ id: 'vegnagun-tail' }]));
    const first = stage.querySelector('.sgd__body')!.innerHTML;
    guide.sync(fakeBoard('ffx2', [{ id: 'vegnagun-tail', hp: 500 }]));
    expect(stage.querySelector('.sgd__body')!.innerHTML).toBe(first); // same fight: nothing re-written
    expect(guide.view()?.title).toBe('Vegnagun (Tail)');
    guide.sync(fakeBoard('ffx2', [{ id: 'vegnagun-leg' }]));
    expect(guide.view()?.title).toBe('Vegnagun (Leg) and Node A/B/C');
    expect(guide.view()?.chapterId).toBe('ffx2-vegnagun-shuyin');
    guide.unmount();
  });

  it('has no panel at all for a board with no written guide, and says nothing about a decision', () => {
    const { stage, guide } = mount('ffx', fakeBoard('ffx', [{ id: 'a-random-fiend' }]));
    expect(stage.querySelector<HTMLElement>('[data-role="strategy-guide"]')!.hidden).toBe(true);
    expect(guide.view()).toBeNull();
    guide.unmount();
  });
});

describe('a paragraph carries over to the next page, between two lines and never through one', () => {
  // Every split unit (a paragraph or a list item) is four 10-px lines; every other unit is one atomic 40-px block.
  const PITCH = 10;
  const NATURAL_LINES = 4;
  type Seg = { unit: number; from: number; to: number };

  function readPage(units: HTMLElement[]): Seg[] {
    const out: Seg[] = [];
    units.forEach((u, unit) => {
      if (u.classList.contains('sgd__u--out')) return;
      const text = u.firstElementChild as HTMLElement | null;
      if (u.classList.contains('sgd__part')) {
        const count = Math.round(Number.parseFloat(u.style.height) / PITCH);
        const from = u.classList.contains('sgd__cont') ? Math.round(-Number.parseFloat(text!.style.marginTop) / PITCH) : 0;
        out.push({ unit, from, to: from + count });
      } else {
        out.push({ unit, from: 0, to: u.classList.contains('sgd__split') ? NATURAL_LINES : 1 });
      }
    });
    return out;
  }

  it('shows every line of every paragraph exactly once, in order, and never leaves one line alone', () => {
    const { stage, guide } = mount('ffx', fakeBoard('ffx', [{ id: 'seymour-flux' }]));
    const stub = stubGuideLayout(stage, { scale: 1, unitHeight: 40, glyphSlack: 2, bodyTop: 5, chrome: 11, lineHeight: PITCH });
    guide.update(0.016);
    const more = stage.querySelector<HTMLButtonElement>('[data-role="strategy-guide-more"]')!;
    const naturalLines = (u: HTMLElement): number => (u.classList.contains('sgd__split') ? NATURAL_LINES : 1);

    const pages: Seg[][] = [readPage(stub.units)];
    const last = stub.units.length - 1;
    for (let guard = 0; guard < 80; guard++) {
      const tail = pages[pages.length - 1]!.slice(-1)[0]!;
      if (tail.unit === last && tail.to === naturalLines(stub.units[last]!)) break; // the foot of the document
      more.click();
      pages.push(readPage(stub.units));
    }
    expect(pages[pages.length - 1]!.slice(-1)[0]!.unit, 'the document never reached its foot').toBe(last);

    // The opening page starts at the boss's header; every later page starts exactly where the last one stopped.
    let unit = pages[0]![0]!.unit;
    let line = 0;
    for (const [i, page] of pages.entries()) {
      for (const seg of page) {
        expect({ page: i, unit: seg.unit, from: seg.from }).toEqual({ page: i, unit, from: line });
        line = seg.to;
        if (line === naturalLines(stub.units[unit]!)) {
          unit += 1;
          line = 0;
        }
      }
    }
    expect(unit).toBe(stub.units.length);

    const partial = pages.flat().filter((seg) => seg.to - seg.from < naturalLines(stub.units[seg.unit]!));
    expect(partial.length, 'no paragraph ever carried over: the case is not exercised').toBeGreaterThan(2);
    for (const seg of partial) {
      expect(seg.to - seg.from, 'a single line alone on a page').toBeGreaterThanOrEqual(2);
      expect(NATURAL_LINES - (seg.to - seg.from), 'a single line left for the next page').not.toBe(1);
    }
    // Only plain text is ever split: a header, a stat line or a boxed note stays whole.
    for (const seg of pages.flat()) {
      const el = stub.units[seg.unit]!;
      if (!el.classList.contains('sgd__split')) expect(seg).toEqual({ unit: seg.unit, from: 0, to: 1 });
    }
    guide.unmount();
  });

  it('does not split anything when the line pitch cannot be read (no layout, or line-height: normal)', () => {
    const { stage, guide } = mount('ffx', fakeBoard('ffx', [{ id: 'seymour-flux' }]));
    const stub = stubGuideLayout(stage, { scale: 1, unitHeight: 40, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);
    expect(stub.units.some((u) => u.classList.contains('sgd__part'))).toBe(false);
    guide.unmount();
  });
});
