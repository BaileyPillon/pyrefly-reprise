// @vitest-environment jsdom
/**
 * Release 68, lane ui-input: the focus contract (`src/app/focusContract.ts`) on the real screens, with the real `Input`.
 *
 * The chapter board is one tab stop whose stop is the cursor; party prep is a real tab list whose sheet it names and whose
 * START BATTLE is a button a Tab-focused Enter presses WITHOUT also confirming whatever else has focus; the pause strip names
 * its panel; the title's chips are real buttons. The game keys that were there before are checked in `input-focus-contract.test.ts`,
 * `board-focus.test.ts`, `pause-remake.test.ts` and the rest of the suite; this file is the new semantics.
 *
 * Game case: both (the board, prep, pause and title are shared UI plumbing).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';
import { labelPausePanel, PAUSE_PANEL_ID, tabsHtml } from '../../src/app/screens/pause/markup.ts';
import { prepTabsHtml } from '../../src/app/screens/party-prep/prepTabs.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

let now = 0;
let cleanups: Array<() => void> = [];

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  forgetBoardChapter();
  document.body.innerHTML = '';
  now = 0;
});

afterEach(() => {
  for (const c of cleanups.reverse()) c();
  cleanups = [];
  document.body.innerHTML = '';
});

interface Rig<S extends { handleInput(i: ReturnType<Input['update']>): void }> {
  screen: S;
  root: HTMLElement;
  input: Input;
  key(code: string): void;
  /** One frame with no key (a click or a tap is read in it). */
  frame(): void;
  /** Tab walked to this control: the keydown first, the focus move after it. */
  tabTo(el: HTMLElement): void;
}

function wire<S extends { handleInput(i: ReturnType<Input['update']>): void }>(root: HTMLElement, screen: S): Rig<S> {
  const input = new Input({ pointerRoot: root });
  input.attach();
  cleanups.push(() => input.detach());
  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
    now += 250;
    screen.handleInput(input.update(now));
    input.endFrame();
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
  };
  const frame = (): void => {
    now += 250;
    screen.handleInput(input.update(now));
    input.endFrame();
  };
  const tabTo = (el: HTMLElement): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Tab', bubbles: true, cancelable: true }));
    el.focus();
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Tab', bubbles: true, cancelable: true }));
  };
  return { screen, root, input, key, frame, tabTo };
}

// ---------------------------------------------------------------- the board

function board(): Rig<ChapterSelectScreen> & { picked: string[] } {
  const root = document.createElement('div');
  root.dataset['screen'] = 'chapter-select';
  document.body.appendChild(root);
  const picked: string[] = [];
  const screen = new ChapterSelectScreen({ onSelect: (id) => picked.push(id) });
  screen.root = root;
  screen.app = { save: new SaveStore(), fade: () => Promise.resolve() } as unknown as ChapterSelectScreen['app'];
  screen.enter();
  cleanups.push(() => screen.exit());
  return { ...wire(root, screen), picked };
}

const cards = (root: HTMLElement): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('.fe-card[data-action]')];
const selectedId = (screen: ChapterSelectScreen): unknown => screen.snapshot()['selectedId'];

describe('the chapter board is one tab stop, and the stop is the cursor', () => {
  it('only the selected card is in the tab order, marked as the cursor and as current', () => {
    const { root } = board();
    const all = cards(root);
    expect(all.length).toBeGreaterThan(5);
    expect(all.filter((c) => c.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(all.filter((c) => c.hasAttribute('data-cursor'))).toHaveLength(1);
    const on = all.find((c) => c.hasAttribute('data-cursor'))!;
    expect(on.getAttribute('tabindex')).toBe('0');
    expect(on.getAttribute('aria-current')).toBe('true');
    expect(on.getAttribute('role')).toBe('button');
    for (const c of all) expect(c.getAttribute('aria-label'), 'every card has a name').toBeTruthy();
  });

  it('an arrow key moves the stop with the cursor', () => {
    const { root, key } = board();
    const before = cards(root).find((c) => c.hasAttribute('data-cursor'))!;
    key('ArrowRight');
    const after = cards(root).find((c) => c.hasAttribute('data-cursor'))!;
    expect(after).not.toBe(before);
    expect(after.getAttribute('tabindex')).toBe('0');
    expect(before.getAttribute('tabindex')).toBe('-1');
    expect(cards(root).filter((c) => c.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(before.hasAttribute('aria-current')).toBe(false);
  });

  it('a card that is not the stop can still be clicked or tapped', () => {
    const { root, screen, frame } = board();
    const second = cards(root)[1]!;
    expect(second.getAttribute('tabindex')).toBe('-1');
    second.click();
    frame();
    expect(selectedId(screen)).toBe(second.dataset['card']);
    expect(second.hasAttribute('data-cursor')).toBe(true);
    expect(second.getAttribute('tabindex')).toBe('0');
    expect(cards(root).filter((c) => c.hasAttribute('data-cursor'))).toHaveLength(1);
  });

  it('Tab then Enter on the hero begins the chapter the cursor is on, once', () => {
    const { root, screen, key, tabTo, picked } = board();
    const hero = root.querySelector<HTMLElement>('.fe-hero')!;
    expect(hero.getAttribute('role')).toBe('button');
    tabTo(hero);
    expect(document.activeElement).toBe(hero);
    key('Enter');
    expect(picked).toEqual([selectedId(screen)]);
  });

  it('Tab to the hero, then an arrow: Enter begins the chapter the cursor MOVED to, not the control that was Tabbed to', () => {
    const { root, screen, key, tabTo, picked } = board();
    const hero = root.querySelector<HTMLElement>('.fe-hero')!;
    tabTo(hero);
    key('ArrowRight');
    const moved = selectedId(screen);
    expect(moved).not.toBe('seymour-flux');
    const cursor = cards(root).find((c) => c.hasAttribute('data-cursor'))!;
    expect(document.activeElement, 'focus followed the cursor').toBe(cursor);
    key('Enter');
    expect(picked).toEqual([moved]);
  });

  it('Space on the Tab-focused cursor card is the board\'s Confirm too, once', () => {
    const { root, screen, key, tabTo, picked } = board();
    const cursor = cards(root).find((c) => c.hasAttribute('data-cursor'))!;
    tabTo(cursor);
    key('Space');
    expect(picked).toEqual([selectedId(screen)]);
  });

  it('Escape is Cancel with a control focused', () => {
    const { root, screen, key, tabTo } = board();
    tabTo(root.querySelector<HTMLElement>('.fe-hero')!);
    key('Escape');
    return expect(screen.done).resolves.toBeNull();
  });
});

// ---------------------------------------------------------------- party prep

type PrepModule = typeof import('../../src/app/screens/PartyPrepScreen.ts');
const ffx = CHAPTERS.find((c) => c.game === 'ffx')!;

async function prep(): Promise<{ mod: PrepModule; rig: Rig<InstanceType<PrepModule['PartyPrepScreen']>> }> {
  vi.resetModules();
  const mod = await import('../../src/app/screens/PartyPrepScreen.ts');
  for (const id of ['stats', 'grid']) {
    mod.registerPrepPanel({
      id,
      label: id === 'stats' ? 'Stats' : 'Sphere grid',
      game: 'ffx',
      fullScreen: false,
      order: id === 'stats' ? 0 : 1,
      mount(host) {
        host.textContent = id;
      },
    });
  }
  const root = document.createElement('div');
  root.dataset['screen'] = 'party-prep';
  document.body.appendChild(root);
  const screen = new mod.PartyPrepScreen({ chapter: ffx });
  screen.root = root;
  screen.app = { fade: () => Promise.resolve() } as unknown as typeof screen.app;
  screen.enter();
  cleanups.push(() => screen.exit());
  return { mod, rig: wire(root, screen) };
}

describe('party prep: a real tab list, a named sheet, real buttons', () => {
  it('the strip is a tablist; each tab has role, selected state, an id, the sheet it controls and a roving tab stop', async () => {
    const { rig } = await prep();
    const strip = rig.root.querySelector('.prep__tabs')!;
    expect(strip.getAttribute('role')).toBe('tablist');
    expect(strip.getAttribute('aria-label')).toBeTruthy();
    const tabs = [...strip.querySelectorAll<HTMLElement>('.prep__tab')];
    expect(tabs).toHaveLength(2);
    expect(tabs.map((t) => t.getAttribute('role'))).toEqual(['tab', 'tab']);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1']);
    expect(tabs[0]!.hasAttribute('data-cursor')).toBe(true);
    expect(tabs[1]!.hasAttribute('data-cursor')).toBe(false);
    const panel = rig.root.querySelector<HTMLElement>('[role="tabpanel"]')!;
    expect(panel.id).toBeTruthy();
    for (const t of tabs) {
      expect(t.id).toBeTruthy();
      expect(t.getAttribute('aria-controls')).toBe(panel.id);
    }
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0]!.id);
  });

  it('Right moves the open tab, the selection, the stop and the sheet\'s name together', async () => {
    const { rig } = await prep();
    rig.key('ArrowRight');
    const tabs = [...rig.root.querySelectorAll<HTMLElement>('.prep__tab')];
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0']);
    expect(tabs[1]!.hasAttribute('data-cursor')).toBe(true);
    expect(rig.root.querySelector('[role="tabpanel"]')!.getAttribute('aria-labelledby')).toBe(tabs[1]!.id);
  });

  it('with no panel the one tab is STATS, a real selected tab', async () => {
    const html = prepTabsHtml([], 0);
    const host = document.createElement('div');
    host.innerHTML = html;
    const tab = host.querySelector('[role="tab"]')!;
    expect(tab.textContent).toBe('STATS');
    expect(tab.getAttribute('aria-selected')).toBe('true');
    expect(tab.getAttribute('tabindex')).toBe('0');
  });

  it('START BATTLE is a named button; Tab then Enter on it begins the battle', async () => {
    const { rig } = await prep();
    const start = rig.root.querySelector<HTMLElement>('.prep__start')!;
    expect(start.getAttribute('role')).toBe('button');
    expect(start.getAttribute('tabindex')).toBe('0');
    expect(start.getAttribute('aria-label')).toBeTruthy();
    rig.tabTo(start);
    rig.key('Enter');
    expect(rig.screen.snapshot()['outcome']).toBe('begin');
  });

  it('Tab then Enter on BACK goes back and does NOT also begin the battle (the audit\'s fold-header case)', async () => {
    const { rig } = await prep();
    const back = rig.root.querySelector<HTMLElement>('[data-action="prep:back"]')!;
    rig.tabTo(back);
    rig.key('Enter');
    expect(rig.screen.snapshot()['outcome']).toBe('back');
  });

  it('Tab then Enter on a roster member selects that member and does not begin', async () => {
    const { rig } = await prep();
    const rows = [...rig.root.querySelectorAll<HTMLElement>('.prep__member')];
    expect(rows[0]!.getAttribute('aria-current')).toBe('true');
    expect(rows[1]!.hasAttribute('aria-current')).toBe(false);
    rig.tabTo(rows[1]!);
    rig.key('Enter');
    expect(rig.screen.snapshot()['outcome']).toBeNull();
    expect(rig.screen.snapshot()['member']).toBe(ffx.buildRef.members[1]!.id);
  });

  it('Enter with nothing focused still begins the battle (the hint says so)', async () => {
    const { rig } = await prep();
    rig.key('Enter');
    expect(rig.screen.snapshot()['outcome']).toBe('begin');
  });

  it('Tab itself is the browser\'s here: no triangle, focus is free to walk', async () => {
    await prep();
    const tab = new KeyboardEvent('keydown', { code: 'Tab', bubbles: true, cancelable: true });
    window.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
  });
});

// ---------------------------------------------------------------- pause and title

describe('the pause strip names its panel', () => {
  const tabs = [
    { id: 'member:tidus', label: 'Tidus', hp: 0.8, ko: false, dot: false },
    { id: 'chapter', label: 'Chapter', hp: null, ko: false, dot: false },
    { id: 'options', label: 'Options', hp: null, ko: false, dot: false },
  ] as unknown as Parameters<typeof tabsHtml>[0];

  it('every tab has role, selected state, an id, the panel it controls, and only the open one is a tab stop and the cursor', () => {
    const host = document.createElement('div');
    host.innerHTML = tabsHtml(tabs, 'chapter');
    const found = [...host.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(found).toHaveLength(3);
    expect(found.map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(found.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    expect(found.map((t) => t.hasAttribute('data-cursor'))).toEqual([false, true, false]);
    for (const t of found) {
      expect(t.id).toMatch(/^pause-tab-/);
      expect(t.getAttribute('aria-controls')).toBe(PAUSE_PANEL_ID);
      expect(t.tagName).toBe('BUTTON');
    }
    expect(new Set(found.map((t) => t.id)).size).toBe(3);
  });

  it('the panel is labelled by the open tab', () => {
    const host = document.createElement('div');
    host.innerHTML = tabsHtml(tabs, 'options');
    const body = document.createElement('div');
    labelPausePanel(body, 'options');
    expect(body.dataset['tab']).toBe('options');
    expect(body.getAttribute('aria-labelledby')).toBe(host.querySelector('[data-tab="options"]')!.id);
  });
});

describe('the title\'s controls are real buttons', () => {
  it('every action chip has a role and a tab stop; the whole-plate tap alias is not a second stop', () => {
    const host = document.createElement('div');
    host.innerHTML = titleMarkup({ briefingChip: true, host: 'echoesofspira.com' });
    const actions = [...host.querySelectorAll<HTMLElement>('[data-action]')];
    expect(actions.length).toBeGreaterThanOrEqual(3);
    const tap = host.querySelector<HTMLElement>('.fe-title__tap')!;
    for (const a of actions) {
      if (a === tap) {
        expect(a.hasAttribute('tabindex'), 'the plate is a pointer alias, not a stop').toBe(false);
        continue;
      }
      expect(a.getAttribute('role'), a.className).toBe('button');
      expect(a.getAttribute('tabindex'), a.className).toBe('0');
    }
  });
});
