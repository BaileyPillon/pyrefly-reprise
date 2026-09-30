// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtbSnapshot, AvailableCommand, Command } from '../../src/battle/common/types.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { wheelRows } from '../../src/ui/ffx/CommandMenuScroll.ts';
import { followedIndex } from '../../src/ui/ffx2/CommandMenuScroll.ts';

/**
 * Feedback 2026-09-29 ("items scrollbar doesn't work"), both games.
 *
 * Live, at 1600x900, Chapter I (FFX): the Items list shows 6 of its rows with a
 * gold triangle under the last one. The mouse wheel over the list did nothing, and
 * clicking the triangle did nothing (it was `pointer-events: none`). Chapter V
 * (FFX-2): the list is a native scroller (wheel, the OS scrollbar, touch all
 * scroll it), but the highlight stayed on a row that had scrolled out of the box,
 * so Enter confirmed a row the player could not see and the help line described
 * it; the fold marks did not update after a scroll; and a click on a fold mark
 * fell through to the row under it and confirmed that row.
 */

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('wheel arithmetic', () => {
  it('turns a notch into two rows and keeps the remainder of a touchpad flick', () => {
    const acc = { px: 0 };
    expect(wheelRows(acc, { deltaY: 100, deltaMode: 0 })).toBe(2);
    expect(wheelRows(acc, { deltaY: -100, deltaMode: 0 })).toBe(-2);
    expect(wheelRows(acc, { deltaY: 20, deltaMode: 0 })).toBe(0);
    expect(wheelRows(acc, { deltaY: 20, deltaMode: 0 })).toBe(0);
    expect(wheelRows(acc, { deltaY: 20, deltaMode: 0 })).toBe(1);
    expect(wheelRows(acc, { deltaY: 3, deltaMode: 1 })).toBeGreaterThanOrEqual(2);
  });
});

// ------------------------------------------------------------------ FFX (Ch. I to IX)

const ROWS = 27;

function openItems(): { root: HTMLElement; chosen: Command[] } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  cleanup = () => hud.unmount();
  hud.setProjector(() => ({ x: 0, y: 0 }));
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  const items: AvailableCommand[] = Array.from({ length: ROWS }, (_, i) => ({
    command: { kind: 'item', id: `item-${i}`, targets: [] },
    label: `Item ${i + 1}`,
    category: 'item' as const,
    mpCost: 0,
    enabled: true,
    validTargets: ['seymour-flux'],
  }));
  const chosen: Command[] = [];
  void hud
    .chooseCommand(
      'tidus',
      [{ command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] }, ...items],
      () => makeFakeTurnPreview(),
    )
    .then((c) => chosen.push(c));
  const group = [...root.querySelectorAll('.ig-cmd')].find((r) => r.textContent?.includes('Item')) as HTMLElement;
  group.click();
  return { root, chosen };
}

const labels = (root: HTMLElement): string[] =>
  [...root.querySelectorAll('.ig-cmd-stack .ffx-cmd__label')].map((e) => e.textContent!.trim());
const selected = (root: HTMLElement): string => root.querySelector('.ig-cmd--selected .ffx-cmd__label')!.textContent!.trim();
const wheel = (root: HTMLElement, deltaY: number): WheelEvent => {
  const ev = new WheelEvent('wheel', { deltaY, deltaMode: 0, bubbles: true, cancelable: true });
  root.querySelector('.ig-cmd-stack')!.dispatchEvent(ev);
  return ev;
};
const mark = (root: HTMLElement, dir: 'up' | 'down'): HTMLElement => root.querySelector<HTMLElement>(`.ffx-cmd-more--${dir}`)!;

describe('FFX long list: the wheel and the fold marks (Chapters I to IX)', () => {
  it('a wheel notch over the list moves the window two rows, and the highlight and help follow', () => {
    const { root, chosen } = openItems();
    expect(labels(root)[0]).toBe('Item 1');
    const ev = wheel(root, 100);
    expect(ev.defaultPrevented).toBe(true);
    expect(labels(root)[0]).toBe('Item 3');
    expect(selected(root)).toBe('Item 3');
    wheel(root, 100);
    wheel(root, 100);
    expect(labels(root)[0]).toBe('Item 7');
    expect(selected(root)).toBe('Item 7');
    wheel(root, -50);
    expect(labels(root)[0]).toBe('Item 6');
    expect(chosen).toHaveLength(0);
  });

  it('the wheel stops at both ends of the list', () => {
    const { root } = openItems();
    wheel(root, -100);
    expect(labels(root)[0]).toBe('Item 1');
    for (let i = 0; i < 40; i++) wheel(root, 100);
    expect(labels(root)).toEqual(['Item 22', 'Item 23', 'Item 24', 'Item 25', 'Item 26', 'Item 27']);
    expect(selected(root)).toBe('Item 22');
  });

  it('the gold triangle under the list is a real control: a click pages, and confirms nothing', () => {
    const { root, chosen } = openItems();
    mark(root, 'down').click();
    expect(labels(root)[0]).toBe('Item 7');
    expect(mark(root, 'up')).not.toBeNull();
    mark(root, 'up').click();
    expect(labels(root)[0]).toBe('Item 1');
    expect(chosen).toHaveLength(0);
  });

  it('the marks take the pointer (the old rule let a click fall through)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const css = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx', 'ffx-hud.css'), 'utf8');
    const rule = /\.ffx-cmd-more \{([\s\S]*?)\n\}/.exec(css);
    expect(rule, '.ffx-cmd-more not found').not.toBeNull();
    expect(rule![1]!).not.toMatch(/pointer-events:\s*none/);
    expect(rule![1]!).toMatch(/cursor:\s*pointer/);
  });

  it('keyboard Down past the window still scrolls it', () => {
    const { root } = openItems();
    for (let i = 0; i < 10; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    expect(labels(root)).toContain(selected(root));
    expect(selected(root)).toBe('Item 11');
  });

  it('a wheel over a list that fits leaves the page alone', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    void hud.chooseCommand(
      'tidus',
      [
        { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] },
      ],
      () => makeFakeTurnPreview(),
    );
    expect(wheel(root, 100).defaultPrevented).toBe(false);
  });
});

// ------------------------------------------------------------------ FFX-2 (Ch. IV, V and the new ones)

const EMPTY_SNAPSHOT: AtbSnapshot = { elapsedMs: 0, bars: [] };
const ROW_H = 30;
const BOX_H = 90;

function whiteMagic(n: number): AvailableCommand[] {
  return Array.from({ length: n }, (_, i) => ({
    command: { kind: 'ability', id: `wm-${i}`, targets: [] },
    label: `Spell ${i + 1}`,
    category: 'whitemagic',
    mpCost: 4,
    enabled: true,
    validTargets: ['yuna'],
  })) as AvailableCommand[];
}

/**
 * jsdom lays nothing out, so the box is a 90 px scroller over 30 px rows: the
 * rectangles are computed from `scrollTop`, which a test moves by hand.
 */
function fakeLayout(box: HTMLElement, rowCount: number): { setTop: (n: number) => void } {
  let top = 0;
  Object.defineProperty(box, 'scrollTop', { configurable: true, get: () => top, set: (v: number) => { top = Math.max(0, Math.min(v, rowCount * ROW_H - BOX_H)); } });
  Object.defineProperty(box, 'clientHeight', { configurable: true, get: () => BOX_H });
  Object.defineProperty(box, 'scrollHeight', { configurable: true, get: () => rowCount * ROW_H });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const rect = (y: number, h: number): DOMRect => ({ x: 0, y, top: y, left: 0, right: 100, bottom: y + h, width: 100, height: h, toJSON: () => ({}) }) as DOMRect;
    if (this === box) return rect(0, BOX_H);
    const idx = this.getAttribute?.('data-idx');
    if (idx !== null && idx !== undefined) return rect(Number(idx) * ROW_H - top, ROW_H);
    return rect(0, 0);
  });
  return { setTop: (n) => { top = n; box.dispatchEvent(new Event('scroll')); } };
}

function openWhiteMagic(n = 16): { box: HTMLElement; help: string[]; chosen: Command[]; layout: ReturnType<typeof fakeLayout> } {
  const box = document.createElement('div');
  const targetLayer = document.createElement('div');
  document.body.append(box, targetLayer);
  const help: string[] = [];
  const chosen: Command[] = [];
  const layout = fakeLayout(box, n);
  const commands: AvailableCommand[] = [
    { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['bahamut'] },
    ...whiteMagic(n),
  ];
  void openCommandMenu({
    container: box,
    targetLayer,
    commands,
    previewRank: () => EMPTY_SNAPSHOT,
    project: () => null,
    onPreview: () => {},
    onHelp: (label) => help.push(label),
    actorName: 'Yuna',
  }).then((c) => chosen.push(c));
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', cancelable: true }));
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', cancelable: true }));
  return { box, help, chosen, layout };
}

const sel2 = (box: HTMLElement): string => box.querySelector('.ig-cmd--selected .ffx2cmd__label')!.textContent!.trim();

describe('FFX-2 long list: the highlight follows a scroll (Chapters IV, V and later)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('opens on the first row of the submenu', () => {
    const { box } = openWhiteMagic();
    expect(sel2(box)).toBe('Spell 1');
  });

  it('a scroll that takes the highlight out of the box moves it to the first visible row, and the help follows', () => {
    const { box, help, layout } = openWhiteMagic();
    layout.setTop(150); // rows 6..8 show
    expect(sel2(box)).toBe('Spell 6');
    expect(help.at(-1)).toBe('Spell 6');
    layout.setTop(0);
    // The highlight was below the fold, so scrolling back up takes the last visible row.
    expect(sel2(box)).toBe('Spell 3');
    expect(help.at(-1)).toBe('Spell 3');
  });

  it('a scroll that keeps the highlight in view leaves it alone', () => {
    const { box, layout } = openWhiteMagic();
    layout.setTop(30);
    expect(sel2(box)).toBe('Spell 2');
    layout.setTop(0);
    expect(sel2(box)).toBe('Spell 2');
  });

  it('enter after a scroll confirms the row the player can see', () => {
    const { box, chosen, layout } = openWhiteMagic();
    layout.setTop(150);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', cancelable: true }));
    expect(box.querySelector('.ig-cmd--selected')!.textContent).toContain('Spell 6');
    expect(chosen).toHaveLength(0); // it went on to aim it (Yuna), which is a target step
  });

  it('the fold marks are rebuilt by a scroll: up appears, and down goes at the end', () => {
    const { box, layout } = openWhiteMagic();
    expect(box.querySelector('.ffx2cmd__fold--up')).toBeNull();
    expect(box.querySelector('.ffx2cmd__fold--down')).not.toBeNull();
    layout.setTop(75);
    expect(box.querySelector('.ffx2cmd__fold--up')).not.toBeNull();
    expect(box.querySelector('.ffx2cmd__fold--down')).not.toBeNull();
    layout.setTop(16 * ROW_H - BOX_H);
    expect(box.querySelector('.ffx2cmd__fold--up')).not.toBeNull();
    expect(box.querySelector('.ffx2cmd__fold--down')).toBeNull();
  });

  it('a click on a fold mark pages the list and confirms no row', () => {
    const { box, chosen, layout } = openWhiteMagic();
    box.querySelector<HTMLElement>('.ffx2cmd__fold--down')!.click();
    expect(box.scrollTop).toBeGreaterThan(0);
    layout.setTop(box.scrollTop); // the browser's own scroll event
    expect(chosen).toHaveLength(0);
    expect(box.querySelector('.ffx2cmd__title')).not.toBeNull(); // still on the list, not a target step
    expect(Number(box.querySelector('.ig-cmd--selected')!.getAttribute('data-idx'))).toBeGreaterThan(0);
  });

  it('the fold marks take the pointer (the old rule let a click confirm the row under them)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const css = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx2', 'ffx2-hud.css'), 'utf8');
    const rule = /\.ffx2cmd__fold \{([\s\S]*?)\n\}/.exec(css);
    expect(rule).not.toBeNull();
    expect(rule![1]!).not.toMatch(/pointer-events:\s*none/);
    expect(rule![1]!).toMatch(/cursor:\s*pointer/);
  });

  it('keeps the follow rule pure: nothing is chosen when the highlight is at least half in view', () => {
    const box = document.createElement('div');
    const rows = [0, 1, 2, 3].map((i) => {
      const r = document.createElement('div');
      r.setAttribute('data-idx', String(i));
      return r;
    });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const y = this === box ? 0 : (Number(this.getAttribute('data-idx')) * 30) - 20;
      const h = this === box ? 60 : 30;
      return { x: 0, y, top: y, left: 0, right: 10, bottom: y + h, width: 10, height: h, toJSON: () => ({}) } as DOMRect;
    });
    // Row 0 is 10 of 30 px in view (a third): out. Row 1 is whole: in.
    expect(followedIndex(rows, box, 0)).toBe(1);
    expect(followedIndex(rows, box, 1)).toBe(1);
    // Row 3 sits below the 60 px box (y 70..100): out, so the last visible row is chosen.
    expect(followedIndex(rows, box, 3)).toBe(2);
  });
});
