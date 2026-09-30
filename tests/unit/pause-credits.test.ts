// @vitest-environment jsdom
/**
 * The credits screen, option O1 (D-305: Bailey, 2026-09-30): an ABOUT heading
 * and a CREDITS row in the pause OPTIONS tab, opening a scrolling credits
 * panel. Reachable by pointer / touch (`pause:row:credits`, the prompt's
 * `data-action`) and keys / pad (Down to the row, Confirm); closed by Esc /
 * cancel / Start / the `Esc BACK` prompt, with the cursor and the DOM focus
 * back on CREDITS; a tab change closes it too. The row is a button, never a
 * setting: nothing is written to the save.
 *
 * Game case: both — run on one FFX and one FFX-2 chapter.
 */

import { PerspectiveCamera } from 'three';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import type { App } from '../../src/app/App.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { optionsColumns } from '../../src/app/screens/pause/panels.ts';
import { CREDITS_CLOSE_ACTION, CREDITS_OPEN_CLASS, creditsHtml } from '../../src/app/screens/pause/creditsPanel.ts';
import { CREDIT_GROUPS, FAN_NOTICE } from '../../src/app/credits/creditsData.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { BattleEngine } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, String(v)), removeItem: (k) => void map.delete(k) };
}

function snap(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const set = new Set(pressed);
  return {
    pressed: (b) => set.has(b),
    justPressed: (b) => set.has(b),
    justReleased: () => false,
    consume: (b) => set.has(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: false,
    lastDevice: 'keyboard',
  };
}

function engineFor(id: string): BattleEngine {
  const chapter = getChapter(id)!;
  const setup = setupForChapter(chapter, 1);
  const engine: BattleEngine =
    chapter.game === 'ffx' ? new FFXEngine({ autoResolveMinigames: true }) : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

interface Harness {
  screen: PauseScreen;
  store: SaveStore;
  root: HTMLElement;
  resumed: () => number;
  dispose(): void;
}

let live: Harness | null = null;

function mount(chapterId: string): Harness {
  const chapter = getChapter(chapterId)!;
  const engine = engineFor(chapterId);
  const store = new SaveStore(`pause-credits-${chapterId}`, memoryStorage());
  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);
  let resumed = 0;
  const screen = new PauseScreen({
    chapter,
    state: () => engine.state(),
    chainLength: 1,
    onResume: () => void resumed++,
    onRestart: () => {},
    onChapterSelect: () => {},
    onQuitToTitle: () => {},
  });
  const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 100);
  screen.app = { save: store, input, screens: [screen], renderer: { camera } } as unknown as App;
  screen.root = root;
  void screen.enter();
  live = {
    screen,
    store,
    root,
    resumed: () => resumed,
    dispose: () => {
      screen.exit();
      input.detach();
      root.remove();
    },
  };
  return live;
}

const s = (h: Harness): Record<string, unknown> => h.screen.snapshot();
const panel = (h: Harness): HTMLElement | null => h.root.querySelector('.pause__credits');

beforeAll(async () => {
  await registerBattleContent();
});

afterEach(() => {
  live?.dispose();
  live = null;
  resetCoach();
  document.body.innerHTML = '';
});

describe('OPTIONS: ABOUT, then CREDITS', () => {
  it('ends THIS ENCOUNTER with an ABOUT heading and a selectable CREDITS command, in every game', () => {
    for (const game of ['ffx', 'ffx2', 'ff7'] as const) {
      const cols = optionsColumns({
        settings: new SaveStore('x', memoryStorage()).settings,
        battleHelpOn: null,
        canRestart: true,
        canChapterSelect: true,
        canQuit: true,
        extraRows: [],
        game,
      });
      const rows = cols.find((c) => c.id === 'encounter')!.rows;
      expect(rows.slice(-2).map((r) => r.id), game).toEqual(['about', 'credits']);
      expect(rows.at(-2)).toMatchObject({ sub: true, selectable: false });
      expect(rows.at(-1)).toMatchObject({ selectable: true, cmd: true, label: 'Credits' });
    }
  });
});

describe.each([
  ['FFX', 'seymour-flux'],
  ['FFX-2', 'ffx2-bahamut'],
])('the credits panel, %s', (_game, chapterId) => {
  it('opens by pointer / touch, lists every group and the notice, and Esc returns to CREDITS', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    const settingsBefore = JSON.stringify(h.store.settings);
    expect(h.root.querySelector('[data-row="about"]')!.textContent).toMatch(/About/i);

    h.screen.handleInput(snap([], ['pause:row:credits']));
    expect(panel(h)).not.toBeNull();
    const swapped = h.root.querySelector(`.${CREDITS_OPEN_CLASS}`);
    expect(swapped?.querySelector('[data-role="body"]'), 'the class that hides the columns sits above them').toBeTruthy();
    expect(s(h)['credits']).toMatchObject({ open: true, groups: CREDIT_GROUPS.map((g) => g.id) });
    const text = panel(h)!.textContent ?? '';
    for (const g of CREDIT_GROUPS) {
      expect(text).toContain(g.heading);
      for (const e of g.entries) expect(text).toContain(`${e.by} ${e.licence}`);
    }
    expect(text).toContain(FAN_NOTICE);
    // Focus sits in the list, for a screen reader and a Tab key.
    expect(document.activeElement?.getAttribute('data-role')).toBe('credits-scroll');

    // Up / Down scroll the list and never walk the hidden rows underneath.
    h.screen.handleInput(snap(['down']));
    h.screen.handleInput(snap(['up']));
    expect(s(h)['row']).toBe('credits');

    h.screen.handleInput(snap(['cancel']));
    expect(panel(h)).toBeNull();
    expect(h.root.querySelector(`.${CREDITS_OPEN_CLASS}`)).toBeNull();
    expect(h.resumed(), 'Esc in the panel goes back one level, it does not resume').toBe(0);
    expect(s(h)).toMatchObject({ tab: 'options', focus: 'body', row: 'credits', credits: null });
    expect((document.activeElement as HTMLElement | null)?.dataset['row']).toBe('credits');
    expect(JSON.stringify(h.store.settings), 'CREDITS is a button, not a setting').toBe(settingsBefore);
  });

  it('opens by keys (Down into the tab, Up to CREDITS, Confirm) and closes by the Esc BACK prompt', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    h.screen.handleInput(snap(['down'])); // into the body, first row
    h.screen.handleInput(snap(['up'])); // wraps to the last selectable row: CREDITS
    expect(s(h)['row']).toBe('credits');
    h.screen.handleInput(snap(['confirm']));
    expect(panel(h)).not.toBeNull();
    const back = h.root.querySelector<HTMLElement>(`[data-action="${CREDITS_CLOSE_ACTION}"]`)!;
    expect(back.textContent).toMatch(/Esc\s*Back/i);
    h.screen.handleInput(snap([], [CREDITS_CLOSE_ACTION]));
    expect(panel(h)).toBeNull();
    expect(s(h)).toMatchObject({ tab: 'options', focus: 'body', row: 'credits' });
  });

  it('closes on the pad’s Start as a back, and on a tab change without moving the cursor back', () => {
    const h = mount(chapterId);
    h.screen.trigger('pause:tab:options');
    h.screen.handleInput(snap([], ['pause:row:credits']));
    h.screen.handleInput(snap(['start']));
    expect(panel(h)).toBeNull();
    expect(h.resumed()).toBe(0);

    h.screen.handleInput(snap([], ['pause:row:credits']));
    h.screen.handleInput(snap(['r1']));
    expect(panel(h)).toBeNull();
    expect(s(h)['tab']).toBe('controls');

    h.screen.trigger('pause:tab:options');
    h.screen.handleInput(snap([], ['pause:row:credits']));
    h.screen.handleInput(snap([], ['pause:tab:music']));
    expect(panel(h)).toBeNull();
    expect(s(h)['tab']).toBe('music');
  });
});

describe('creditsHtml', () => {
  it('escapes and prints the REQUIRED lines with their notes', () => {
    const html = creditsHtml();
    expect(html).toContain('pause__credit--req');
    expect(html).toContain('doi:10.5281/zenodo.20098848');
    expect(html).not.toMatch(/<script/i);
  });
});
