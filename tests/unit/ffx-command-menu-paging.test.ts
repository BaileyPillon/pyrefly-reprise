// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, Command } from '../../src/battle/common/types.ts';
import { computeMenuWindow } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { canPage, pageStartFor, pagerCounter, selectionAfterPage } from '../../src/ui/ffx/CommandMenuPaging.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

/**
 * R31 (Bailey D-286, PR-0218; option B1 of docs/concepts/r29-options): a long FFX
 * command list gets two real page buttons and an "N-M OF T" counter on a phone.
 * FFX only: FFX-2's list is `ui/ffx2/CommandMenu.ts`, which has no such marks.
 * The desktop keyboard window (`computeMenuWindow`) is unchanged.
 */

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
});

const ROWS = 27;

function openItems(rows = ROWS): { root: HTMLElement; chosen: Command[] } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  cleanup = () => hud.unmount();
  hud.setProjector(() => ({ x: 0, y: 0 }));
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  const items: AvailableCommand[] = Array.from({ length: rows }, (_, i) => ({
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
const btn = (root: HTMLElement, dir: -1 | 1): HTMLButtonElement =>
  root.querySelector<HTMLButtonElement>(`.ffx-cmd-pager button[data-page="${dir}"]`)!;
const count = (root: HTMLElement): string => root.querySelector('.ffx-cmd-pager__count')!.firstChild!.textContent!;

describe('page arithmetic', () => {
  it('steps one window and clamps to the ends (27 rows, 6 visible)', () => {
    expect(pageStartFor(27, 0, 6, 1)).toBe(6);
    expect(pageStartFor(27, 18, 6, 1)).toBe(21);
    expect(pageStartFor(27, 21, 6, 1)).toBe(21);
    expect(pageStartFor(27, 3, 6, -1)).toBe(0);
    expect(pageStartFor(4, 0, 6, 1)).toBe(0);
  });
  it('writes the counter one-based, inclusive', () => {
    expect(pagerCounter({ start: 0, end: 6 }, 27)).toBe('1–6 OF 27');
    expect(pagerCounter({ start: 21, end: 27 }, 27)).toBe('22–27 OF 27');
  });
  it('says which way is exhausted', () => {
    expect(canPage({ start: 0, end: 6 }, 27, -1)).toBe(false);
    expect(canPage({ start: 0, end: 6 }, 27, 1)).toBe(true);
    expect(canPage({ start: 21, end: 27 }, 27, 1)).toBe(false);
  });
  it('carries the selection to the same place in the new page', () => {
    expect(selectionAfterPage(3, { start: 0, end: 6 }, { start: 6, end: 12 })).toBe(9);
    expect(selectionAfterPage(20, { start: 18, end: 24 }, { start: 21, end: 27 })).toBe(23);
  });
  it('leaves the desktop keyboard window as it was', () => {
    expect(computeMenuWindow(27, 0, 6)).toEqual({ start: 0, end: 6 });
    expect(computeMenuWindow(27, 10, 6)).toEqual({ start: 7, end: 13 });
    expect(computeMenuWindow(27, 26, 6)).toEqual({ start: 21, end: 27 });
  });
});

describe('the page buttons in the list header (FFX only)', () => {
  it('shows the counter and a dimmed up button on the first page', () => {
    const { root } = openItems();
    expect(root.querySelector<HTMLElement>('.ffx-cmd-pager')!.hidden).toBe(false);
    expect(count(root)).toBe('1–6 OF 27');
    expect(btn(root, -1).disabled).toBe(true);
    expect(btn(root, 1).disabled).toBe(false);
  });

  it('a page tap moves the window one page and confirms no row', () => {
    const { root, chosen } = openItems();
    expect(labels(root)).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']);
    btn(root, 1).click();
    expect(labels(root)[0]).toBe('Item 7');
    expect(count(root)).toBe('7–12 OF 27');
    expect(btn(root, -1).disabled).toBe(false);
    btn(root, 1).click();
    btn(root, 1).click();
    expect(labels(root)[0]).toBe('Item 19');
    btn(root, -1).click();
    expect(labels(root)[0]).toBe('Item 13');
    expect(chosen).toHaveLength(0);
    expect(root.querySelector<HTMLElement>('.ffx-cmd-pager')!.hidden).toBe(false);
  });

  it('dims the down button on the last page, which shows rows 22-27', () => {
    const { root } = openItems();
    for (let i = 0; i < 5; i++) btn(root, 1).click();
    expect(count(root)).toBe('22–27 OF 27');
    expect(labels(root)).toContain('Item 23');
    expect(btn(root, 1).disabled).toBe(true);
    expect(btn(root, -1).disabled).toBe(false);
    // A dimmed button is inert: a click does nothing.
    btn(root, 1).click();
    expect(count(root)).toBe('22–27 OF 27');
  });

  it('the highlight follows the page into it', () => {
    const { root } = openItems();
    btn(root, 1).click();
    const sel = root.querySelector('.ig-cmd--selected .ffx-cmd__label')!.textContent!.trim();
    expect(labels(root)).toContain(sel);
    expect(sel).not.toBe('Item 1');
  });

  it('keyboard navigation still centres the window, and drops a tapped page', () => {
    const { root } = openItems();
    btn(root, 1).click();
    for (let i = 0; i < 2; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    const sel = root.querySelector('.ig-cmd--selected .ffx-cmd__label')!.textContent!.trim();
    expect(labels(root)).toContain(sel);
    const start = Number(count(root).split('–')[0]) - 1;
    const selIdx = Number(sel.replace('Item ', '')) - 1;
    expect(start).toBe(computeMenuWindow(ROWS, selIdx, 6).start);
  });

  it('is hidden for a short list', () => {
    const { root } = openItems(5);
    expect(root.querySelector<HTMLElement>('.ffx-cmd-pager')!.hidden).toBe(true);
  });

  it('is hidden again after Esc back to the top', () => {
    const { root } = openItems();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    expect(root.querySelector<HTMLElement>('.ffx-cmd-pager')!.hidden).toBe(true);
  });

  it('has 44 px touch targets and shows only on a phone', () => {
    const css = readFileSync(join(process.cwd(), 'src/ui/ffx/phone-hud.css'), 'utf8');
    expect(css).toMatch(/\.ffx-cmd-pager__btn\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/);
    const desk = readFileSync(join(process.cwd(), 'src/ui/ffx/ffx-hud.css'), 'utf8');
    expect(desk).toMatch(/\.ffx-cmd-pager\s*\{\s*display:\s*none/);
    expect(css).toContain(".ffxhud .ffx-cmd-pager:not([hidden])");
  });
});
