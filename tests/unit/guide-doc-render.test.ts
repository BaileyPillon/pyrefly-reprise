// @vitest-environment jsdom
/**
 * How a document is drawn (`src/ui/common/guideDocHtml.ts`) and what the panel makes of it
 * (`src/ui/common/StrategyGuide.ts`).
 *
 * Every piece of text is a `.sgd__u` unit with the first unit of each block marked `data-block`, which is how the
 * sheet finds the boss it opens on. The sheet's scrolling, its opening place and its keys are pinned in
 * `strategy-guide-sheet.test.ts`; this file is the markup and the boards the panel will and will not draw.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { GuideDoc } from '../../src/data/guides/doc-types.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { docHtml } from '../../src/ui/common/guideDocHtml.ts';
import { fakeBoard } from './helpers/guideDocStrings.ts';

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
    anchors: { top: 44, bottom: 34 },
    readVisible: () => true,
    writeVisible: () => undefined,
  });
  guide.mount(stage);
  guide.sync(board);
  return { stage, guide };
}

afterEach(() => {
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

  it('carries no paging hooks: nothing is kept with the next block, nothing is split by lines', () => {
    expect(host.querySelector('.sgd__kn, .sgd__split, .sgd__part, .sgd__cont, .sgd__u--out')).toBeNull();
  });

  it('marks the first unit of every block, which is how the sheet finds where to open', () => {
    const marks = Array.from(host.querySelectorAll('[data-block]')).map((e) => Number(e.getAttribute('data-block')));
    expect(marks).toEqual([...marks].sort((a, b) => a - b));
    expect(new Set(marks).size).toBe(SAMPLE.blocks.length);
  });

  it('labels the boxed notes the way that page does', () => {
    expect(host.querySelector('.sgd__hint--warning .sgd__hint-kind')!.textContent).toBe('Warning');
    expect(host.querySelector('.sgd__hint-title')!.textContent).toBe('Careful');
  });
});

describe('the panel draws a real document', () => {
  it('prints the whole page for the boss on the field, in both games, and names the heading it opens under', () => {
    const ffx = mount('ffx', fakeBoard('ffx', [{ id: 'yunalesca', formIndex: 2 }]));
    expect(ffx.guide.view()).toMatchObject({ chapterId: 'yunalesca', title: 'Yunalesca' });
    expect(ffx.stage.querySelectorAll('.sgd__doc-head').length).toBeGreaterThan(0);
    const ffx2 = mount('ffx2', fakeBoard('ffx2', [{ id: 'bahamut' }]));
    expect(ffx2.guide.view()).toMatchObject({ chapterId: 'ffx2-bahamut', title: 'Bahamut' });
    expect(ffx2.stage.querySelector('.sgd--ffx2')).not.toBeNull();
    ffx.guide.unmount();
    ffx2.guide.unmount();
  });

  it('keeps the document while the fight goes on, and writes a new one when the boss changes', () => {
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
