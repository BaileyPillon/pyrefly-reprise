// @vitest-environment jsdom
/**
 * r64 DEFAULTS, part 2 of 2 (conference demo, Bailey 2026-10-24 ~13:40 EDT, item 200: "you can make all the decisions for me, ill go with all your recommendations"; the driver's calls under it, his to overturn).
 * Both games (shared plumbing); Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) are the only chapters any of it acts in.
 * Split from r64-defaults.test.ts on 2026-10-24 (the r64 review's m6: the house rule is 400 lines per file); the tests are the same ones.
 *
 *  3. 200i  the Echo end card after a fight: the "Press any button" hint in the card's own type (28 px at 2560 x 1440), the end by timer or by press, and the flow's return to the TITLE only after a timer;
 *  4. 200i  60 s idle on the fight picker returns to the title (the cancel's own path), and only with the booth screens on.
 * Parts 1, 2 and 5 (the pack default, the party rim, the notice) are in r64-defaults.test.ts.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { BUTTONS, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { setBoothMode } from '../../src/app/demo/boothSwitch.ts';
import { END_PRESS, endCardMarkup } from '../../src/app/demo/boothCards.ts';
import { DemoBoardScreen } from '../../src/app/demo/demoBoard.ts';
import { PICKER_IDLE_MS } from '../../src/app/demo/demoIdle.ts';
import { DemoThanksScreen, THANKS_GUARD_MS, THANKS_MS } from '../../src/app/demo/demoThanks.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen, type ResultsScreenOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import type { ChapterId } from '../../src/data/encounters.ts';
// ------------------------------------------------------------------------------------------------ 3. the end card

function snapshot(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const edges = new Set(pressed);
  return {
    pressed: (b) => edges.has(b),
    justPressed: (b) => edges.has(b),
    justReleased: () => false,
    consume: (b) => edges.delete(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: true,
    lastDevice: 'gamepad',
  };
}

function openCard(chapterId: string): { screen: DemoThanksScreen; root: HTMLElement } {
  const screen = new DemoThanksScreen({ chapterId });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { fade: () => Promise.resolve(), uiRoot: document.body } as unknown as App;
  screen.root = root;
  screen.enter();
  return { screen, root };
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const cssOf = (p: string): string => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('3. 200i: the end card after a fight', () => {
  beforeEach(() => {
    setDemoMode(true);
    setBoothMode('new');
    document.body.innerHTML = '';
  });
  afterEach(() => {
    setDemoMode(null);
    setBoothMode(null);
    document.body.innerHTML = '';
  });

  it('the card after a fight carries "Press any button" in the card\'s own type; the booth loop\'s own card (?card=end) does not', () => {
    expect(END_PRESS).toBe('Press any button');
    const { root } = openCard('seymour-flux');
    const hint = root.querySelector('.booth-end__press');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('Press any button');
    expect(hint!.querySelector('.booth-scan')).not.toBeNull(); // the card's own label type
    expect(endCardMarkup({ afterFight: true })).toContain('Press any button');
    expect(endCardMarkup()).not.toContain('Press any button');
    expect(endCardMarkup()).not.toContain('booth-end__press');
  });

  it('the hint is at least 28 px at 2560 x 1440 (16 grid units; the grid unit is 1.78 px there) and the card holds about 8 s', () => {
    const css = cssOf('src/app/demo/boothCards.css');
    const scan = /\.booth-scan \{[^}]*font-size: calc\((\d+) \* var\(--bk\)\)/.exec(css);
    expect(scan, '.booth-scan has a grid-unit font size').not.toBeNull();
    const bk = Math.min(2560 / 1440, 1440 / 810); // --bk: max(0.5px, min(100vw / 1440, 100vh / 810)) at 2560 x 1440
    expect(Number(scan![1]) * bk).toBeGreaterThanOrEqual(28);
    const press = /\.booth-end__press \{[^}]*\}/.exec(css)![0];
    expect(press).not.toContain('font-size'); // it takes .booth-scan's, never a smaller one of its own
    expect(THANKS_MS).toBe(8000);
  });

  it('it ends by the timer after 8 s (endedBy timer), by a press after the guard (press), by a click (press) and by leaving (left); a press inside the guard does nothing', async () => {
    const a = openCard('seymour-flux');
    expect(a.screen.endedBy).toBeNull();
    for (let i = 0; i < 7 * 60; i++) a.screen.update(1 / 60);
    expect(a.screen.endedBy).toBeNull();
    for (let i = 0; i < 61; i++) a.screen.update(1 / 60);
    await tick();
    expect(a.screen.endedBy).toBe('timer');

    for (const b of BUTTONS) {
      const c = openCard('ffx2-bahamut');
      c.screen.update(THANKS_GUARD_MS / 1000 / 2);
      c.screen.handleInput(snapshot([b]));
      expect(c.screen.endedBy, `${b} inside the guard`).toBeNull();
      c.screen.update(THANKS_GUARD_MS / 1000);
      c.screen.handleInput(snapshot([b]));
      expect(c.screen.endedBy, `${b} after the guard`).toBe('press');
    }

    const d = openCard('seymour-flux');
    d.screen.update(1);
    d.screen.handleInput(snapshot([], ['thanks:end']));
    expect(d.screen.endedBy).toBe('press');

    const e = openCard('seymour-flux');
    e.screen.exit();
    expect(e.screen.endedBy).toBe('left');
  });

  it('whichever comes first stays: a press after the timer does not change how it ended', async () => {
    const { screen } = openCard('seymour-flux');
    for (let i = 0; i < 8 * 60 + 5; i++) screen.update(1 / 60);
    screen.handleInput(snapshot(['confirm']));
    expect(screen.endedBy).toBe('timer');
  });
});

// ------------------------------------------------------------------------------------------------ 3b. the flow after the card

describe('3b. 200i: the flow goes to the TITLE only when the card ran out its time', () => {
  const played: string[] = [];
  let ending: 'timer' | 'press' | 'left' = 'timer';

  class FakeResults extends Screen implements FlowScreen<void> {
    readonly name = 'results';
    readonly done = Promise.resolve();
    constructor(readonly opts: ResultsScreenOptions) {
      super();
    }
    override enter(): void {
      played.push('results');
    }
  }
  class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
    readonly name = 'battle';
    readonly done: Promise<BattleScreenResult>;
    constructor(opts: BattleScreenOptions) {
      super();
      const result = { outcome: 'victory', turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
      this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome: 'victory', result, elapsedMs: 120_000, links: 1, preview: false });
    }
    override enter(): void {
      played.push('battle');
    }
  }
  class FakeThanks extends Screen implements FlowScreen<void> {
    readonly name = 'demo-thanks';
    readonly done = Promise.resolve();
    readonly endedBy = ending;
    override enter(): void {
      played.push(`thanks:${this.endedBy}`);
    }
  }
  class FakeApp {
    readonly uiRoot = document.createElement('div');
    readonly save = new SaveStore();
    readonly flow: GameFlow;
    readonly went: string[] = [];
    current: Screen | null = null;
    constructor() {
      document.body.appendChild(this.uiRoot);
      this.flow = new GameFlow(this as unknown as App);
    }
    get overlayActive(): boolean {
      return false;
    }
    async replace(screen: Screen): Promise<void> {
      const previous = this.current;
      this.current = null;
      if (previous) {
        await previous.exit();
        previous.root?.remove();
      }
      screen.app = this as unknown as App;
      screen.root = document.createElement('div');
      this.uiRoot.appendChild(screen.root);
      this.current = screen;
      await screen.enter();
    }
    async goto(name: string): Promise<boolean> {
      this.went.push(name);
      return true;
    }
    fade(): Promise<void> {
      return Promise.resolve();
    }
    nextFrame(): Promise<void> {
      return Promise.resolve();
    }
  }

  /** The picker: answers the queued picks, then backs out (Esc). */
  function picker(picks: ChapterId[]): () => FlowScreen<ChapterId | null> {
    const queue = [...picks];
    return () => {
      const next = queue.shift() ?? null;
      return new (class extends Screen implements FlowScreen<ChapterId | null> {
        readonly name = 'chapter-select';
        readonly done = Promise.resolve(next);
        override enter(): void {
          played.push('picker');
        }
      })();
    };
  }

  let app: FakeApp;
  const start = async (): Promise<void> => {
    resetFlowScreens();
    registerFlowScreens({
      results: (o: ResultsScreenOptions) => new FakeResults(o),
      battle: (o: BattleScreenOptions) => new FakeBattle(o),
      demoThanks: () => new FakeThanks(),
      chapterSelect: picker(['seymour-flux']),
    } as never);
    app = new FakeApp();
    await app.flow.start();
  };

  beforeEach(() => {
    played.length = 0;
    forgetBoardChapter();
    setDemoMode(true);
    setBoothMode('new');
    document.body.innerHTML = '';
  });
  afterEach(() => {
    setDemoMode(null);
    setBoothMode(null);
    resetFlowScreens();
    document.body.innerHTML = '';
  });

  it('a card that ran out its 8 s sends the visit to the title: no second picker', async () => {
    ending = 'timer';
    await start();
    expect(played).toEqual(['picker', 'battle', 'results', 'thanks:timer']);
    expect(app.went).toEqual(['title']);
  });

  it('a press on the card goes to the picker at once, as it always did', async () => {
    ending = 'press';
    await start();
    expect(played).toEqual(['picker', 'battle', 'results', 'thanks:press', 'picker']); // the second picker answers null (Esc) and the flow leaves for the title the way the picker always did
    expect(app.went).toEqual(['title']);
    expect(played.filter((p) => p === 'picker')).toHaveLength(2);
  });

  it('a card taken away (the hold-reset, a navigation) does not count as the time running out', async () => {
    ending = 'left';
    await start();
    expect(played.filter((p) => p === 'picker')).toHaveLength(2);
  });

  it('with the booth screens off (?booth=today / ?pack=off) the timer goes to the picker, as release 62 did', async () => {
    setBoothMode('today');
    ending = 'timer';
    await start();
    expect(played.filter((p) => p === 'picker')).toHaveLength(2);
  });
});

// ------------------------------------------------------------------------------------------------ 4. the picker's idle return

describe('4. 200i: 60 s idle on the fight picker returns to the title', () => {
  let now = 5000;
  const settled = async (screen: DemoBoardScreen): Promise<unknown> => {
    let value: unknown = 'pending';
    void screen.done.then((v) => (value = v));
    await tick();
    return value;
  };
  function openPicker(): DemoBoardScreen {
    const screen = new DemoBoardScreen();
    const root = document.createElement('div');
    document.body.appendChild(root);
    screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), uiRoot: document.body } as unknown as App;
    screen.root = root;
    screen.enter();
    return screen;
  }

  beforeEach(() => {
    now = 5000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    document.body.innerHTML = '';
    forgetBoardChapter();
    setDemoMode(true);
    setBoothMode('new');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setDemoMode(null);
    setBoothMode(null);
    document.body.innerHTML = '';
    delete (navigator as unknown as { getGamepads?: unknown }).getGamepads;
  });

  it('the minute is 60 s; nobody there for 59.9 s changes nothing, and the next frame after 60 s resolves the pick with null (the flow reads null as Esc: the title)', async () => {
    expect(PICKER_IDLE_MS).toBe(60_000);
    const screen = openPicker();
    now += PICKER_IDLE_MS - 1;
    screen.update(1 / 60);
    expect(await settled(screen)).toBe('pending');
    now += 1;
    screen.update(1 / 60);
    expect(await settled(screen)).toBeNull();
    screen.exit();
  });

  it('a key, a click, a touch, a wheel turn or real mouse travel starts the minute over', async () => {
    const screen = openPicker();
    for (const make of [() => new KeyboardEvent('keydown', { code: 'ArrowRight' }), () => new MouseEvent('mousedown'), () => new Event('touchstart'), () => new Event('wheel')]) {
      window.dispatchEvent(make()); // a visitor: the minute starts over
      now += PICKER_IDLE_MS - 1000;
      screen.update(1 / 60); // 59 s of nobody since: still waiting
      expect(await settled(screen)).toBe('pending');
    }
    now += 1000;
    screen.update(1 / 60);
    expect(await settled(screen)).toBeNull(); // 60 s after the last touch
    screen.exit();
  });

  it('a pad button or a stick pushed past its rest starts the minute over (a pad raises no DOM event: it is read each frame)', async () => {
    const screen = openPicker();
    (navigator as unknown as { getGamepads: () => unknown[] }).getGamepads = () => [{ connected: true, buttons: [{ pressed: true }], axes: [0, 0] }];
    now += PICKER_IDLE_MS - 1000;
    screen.update(1 / 60); // the pad is down: touched now
    (navigator as unknown as { getGamepads: () => unknown[] }).getGamepads = () => [{ connected: true, buttons: [{ pressed: false }], axes: [0, 0] }];
    now += PICKER_IDLE_MS - 1000;
    screen.update(1 / 60);
    expect(await settled(screen)).toBe('pending');
    now += 1000;
    screen.update(1 / 60);
    expect(await settled(screen)).toBeNull();
    screen.exit();
  });

  it('with the booth screens off (?booth=today / ?pack=off) the picker waits for ever, as before', async () => {
    setBoothMode('today');
    const screen = openPicker();
    now += 10 * PICKER_IDLE_MS;
    screen.update(1 / 60);
    expect(await settled(screen)).toBe('pending');
    screen.exit();
  });

  it('a pick made in time wins (the idle clock is gone with the screen)', async () => {
    const screen = openPicker();
    screen.exit();
    now += 2 * PICKER_IDLE_MS;
    screen.update(1 / 60); // a frame after the screen left changes nothing and throws nothing
    expect(await settled(screen)).toBeNull(); // exit resolves a leaving board with null, as it always did
  });
});
