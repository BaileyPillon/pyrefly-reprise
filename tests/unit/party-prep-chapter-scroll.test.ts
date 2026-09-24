// @vitest-environment jsdom
/**
 * PR-0127 desktop caveats (both games: the prep card is shared). At 1280x720
 * Chapter 6's TIP sat below the fold of its column and only a mouse wheel
 * could scroll it; now L1 / R1 (PageUp / PageDown, F / R, pad LB / RB) page the
 * CHAPTER tab's columns, and the shell's controls hint names the keys while a
 * column holds more copy. jsdom has no layout, so the column boxes are stubbed
 * with the live measurements (1280x720, Chapter 6: 149 tall, 102 shown).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrepPanel } from '../../src/app/screens/PartyPrepScreen.ts';
import type { InputSnapshot } from '../../src/app/Input.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

type ScreenModule = typeof import('../../src/app/screens/PartyPrepScreen.ts');
type PanelModule = typeof import('../../src/ui/ffx/party-prep/ChapterPanel.ts');
let mod: ScreenModule;
let chap: PanelModule;

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '';
  mod = await import('../../src/app/screens/PartyPrepScreen.ts');
  chap = await import('../../src/ui/ffx/party-prep/ChapterPanel.ts');
});

/** Give every `[data-scrollcol]` a real-looking scroll box. */
function stubCols(root: HTMLElement, scrollHeight: number, clientHeight = 102): HTMLElement[] {
  const cols = [...root.querySelectorAll<HTMLElement>('[data-scrollcol]')];
  for (const c of cols) {
    Object.defineProperty(c, 'scrollHeight', { configurable: true, get: () => scrollHeight });
    Object.defineProperty(c, 'clientHeight', { configurable: true, get: () => clientHeight });
  }
  return cols;
}

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

const leblanc = CHAPTERS.find((c) => c.id === 'ffx2-leblanc')!;

function mountPrep(panels: PrepPanel[]) {
  for (const p of panels) mod.registerPrepPanel(p);
  const root = document.createElement('div');
  document.body.appendChild(root);
  const screen = new mod.PartyPrepScreen({ chapter: leblanc });
  screen.root = root;
  screen.app = { fade: () => Promise.resolve() } as unknown as typeof screen.app;
  screen.enter();
  return { screen, root };
}

describe('pageChapterColumns', () => {
  it('pages every scrollable column within its own range, and back', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div data-scrollcol></div><div data-scrollcol></div>';
    const [a, b] = stubCols(root, 149);
    expect(chap.pageChapterColumns(root, 1)).toBe(true);
    // One press covers the whole 47 px the TIP needs.
    expect(a!.scrollTop).toBe(47);
    expect(b!.scrollTop).toBe(47);
    expect(chap.pageChapterColumns(root, 1)).toBe(false);
    expect(chap.pageChapterColumns(root, -1)).toBe(true);
    expect(a!.scrollTop).toBe(0);
  });

  it('does nothing to columns that already fit', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div data-scrollcol></div>';
    const [a] = stubCols(root, 102);
    expect(chap.pageChapterColumns(root, 1)).toBe(false);
    expect(a!.scrollTop).toBe(0);
  });
});

describe('the CHAPTER tab in the prep shell (both games)', () => {
  it('R1 (PageDown) scrolls the columns and the hint names the keys only while there is more copy', () => {
    const { screen, root } = mountPrep([chap.makeChapterPanel('ffx2'), { id: 'other', label: 'Other', game: 'ffx2', order: 5, mount() {} }]);
    const hint = () => root.querySelector('[data-role="panel-hint"]')!.textContent!.replace(/\s+/g, ' ').trim();
    const cols = stubCols(root, 149);
    expect(cols).toHaveLength(2);

    screen.handleInput(keys());
    expect(hint()).toBe('· PG UP / PG DN SCROLL');

    screen.handleInput(keys('r1'));
    expect(cols.map((c) => c.scrollTop)).toEqual([47, 47]);
    screen.handleInput(keys('l1'));
    expect(cols.map((c) => c.scrollTop)).toEqual([0, 0]);

    // Nothing to scroll: no hint.
    stubCols(root, 102);
    screen.handleInput(keys());
    expect(hint()).toBe('');
  });

  it('another tab carries no scroll hint', () => {
    const { screen, root } = mountPrep([chap.makeChapterPanel('ffx2'), { id: 'other', label: 'Other', game: 'ffx2', order: 5, mount() {} }]);
    stubCols(root, 149);
    screen.handleInput(keys());
    expect(root.querySelector('[data-role="panel-hint"]')!.textContent).toContain('SCROLL');
    screen.trigger('prep:tab:other');
    screen.handleInput(keys());
    expect(root.querySelector('[data-role="panel-hint"]')!.textContent).toBe('');
  });
});
