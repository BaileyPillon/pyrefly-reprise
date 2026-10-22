// @vitest-environment jsdom
/**
 * Release 62, decision 173h (Bailey, 2026-10-22 ~00:00 EDT; both games, demo mode only): after a win, a short "Thanks for playing" card with the QR, then back to the picker (any button, or about 8 s).
 * Chapter I is FFX, Chapter IV is FFX-2.
 *
 *  1. the card: its words (Bailey's), the booth's QR, the game's accent (gold for FFX, pyre pink for FFX-2);
 *  2. how it ends: the timer, a press after the guard, a click, and not a press inside the guard;
 *  3. the flow: shown after a won demo fight and nowhere else (not out of demo mode, not after a loss, not on another chapter, not on a Pilgrimage fight, not where no card is registered).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { BUTTONS, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen, type ResultsScreenOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { THANKS_GUARD_MS, THANKS_LINE, THANKS_MS, THANKS_TITLE, DemoThanksScreen, demoThanksDue } from '../../src/app/demo/demoThanks.ts';
import { BOOTH_URL } from '../../src/app/demo/demoFlow.ts';
import { boothQrSvg } from '../../src/app/demo/demoQr.ts';

beforeEach(() => {
  forgetBoardChapter();
  setDemoMode(null);
});
afterEach(() => {
  setDemoMode(null);
  resetFlowScreens();
  document.body.innerHTML = '';
});

/** An input snapshot with the buttons named pressed this frame, and the clicked actions. */
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

function open(chapterId: string, opts: { holdMs?: number; guardMs?: number } = {}): { screen: DemoThanksScreen; root: HTMLElement; ended: () => boolean } {
  const screen = new DemoThanksScreen({ chapterId, ...opts });
  const root = document.createElement('div');
  document.body.appendChild(root);
  let fades = 0;
  screen.app = { fade: () => ((fades += 1), Promise.resolve()), uiRoot: document.body } as unknown as App;
  screen.root = root;
  screen.enter();
  let over = false;
  void screen.done.then(() => (over = true));
  return { screen, root, ended: () => over };
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('1. the card', () => {
  it('Bailey\'s words, the host, and the booth\'s own QR code (the same SVG the title and the picker carry)', () => {
    const { root } = open('seymour-flux');
    const text = root.textContent ?? '';
    expect(text).toContain(THANKS_TITLE);
    expect(THANKS_TITLE).toBe('Thanks for playing');
    expect(text).toContain('Echoes of Spira, an unofficial fan tribute.');
    expect(THANKS_LINE).toBe('Echoes of Spira, an unofficial fan tribute.');
    expect(text).toMatch(/Play it at\s+echoesofspira\.com/);
    expect(BOOTH_URL).toBe('https://echoesofspira.com');
    expect(root.querySelector('.demo-thanks__code svg')).not.toBeNull();
    const same = document.createElement('div');
    same.innerHTML = boothQrSvg();
    expect(root.querySelector('.demo-thanks__code')!.innerHTML).toBe(same.innerHTML);
    expect(root.querySelector('[role="img"]')!.getAttribute('aria-label')).toContain('echoesofspira.com');
  });

  it('shows the key and the pad\'s button for "continue" (the r61 glyph chips, switched by html[data-input])', () => {
    const { root } = open('seymour-flux');
    expect(root.querySelector('.demo-thanks__hint .kh-k')!.textContent).toBe('Enter');
    expect(root.querySelector('.demo-thanks__hint .kh-p .pg')).not.toBeNull();
  });

  it('FFX keeps the gold accent; FFX-2 takes the pyre-pink one (`.ig--ffx2`, as every FFX-2 screen does)', () => {
    expect(open('seymour-flux').root.classList.contains('ig--ffx2')).toBe(false);
    expect(open('ffx2-bahamut').root.classList.contains('ig--ffx2')).toBe(true);
    expect(open('seymour-flux').root.classList.contains('ig')).toBe(true);
  });
});

describe('2. how it ends', () => {
  it('by itself after 8 seconds (the game\'s own frame time), not before', async () => {
    expect(THANKS_MS).toBe(8000);
    const { screen, ended } = open('seymour-flux');
    for (let i = 0; i < 7 * 60; i++) screen.update(1 / 60);
    await tick();
    expect(ended()).toBe(false);
    for (let i = 0; i < 61; i++) screen.update(1 / 60);
    await tick();
    expect(ended()).toBe(true);
  });

  it('the bar drains with the time', () => {
    const { screen, root } = open('seymour-flux', { holdMs: 1000 });
    screen.update(0.5);
    expect((root.querySelector('.demo-thanks__bar > i') as HTMLElement).style.transform).toBe('scaleX(0.5)');
  });

  it('a press inside the guard does not end it (and is taken, so nothing behind sees it); a press after it does, for every button', async () => {
    expect(THANKS_GUARD_MS).toBeGreaterThan(300);
    for (const b of BUTTONS) {
      const { screen, ended } = open('ffx2-bahamut');
      screen.update(0.3);
      const early = snapshot([b]);
      screen.handleInput(early);
      expect(early.justPressed(b), `${b} is taken inside the guard`).toBe(false);
      await tick();
      expect(ended(), `${b} early`).toBe(false);
      screen.update(0.6);
      screen.handleInput(snapshot([b]));
      await tick();
      expect(ended(), `${b} late`).toBe(true);
    }
  });

  it('a click or a tap (the card\'s data-action) ends it after the guard; a quiet frame does nothing', async () => {
    const { screen, root, ended } = open('seymour-flux');
    expect(root.dataset['action']).toBe('thanks:end');
    screen.update(1);
    screen.handleInput(snapshot());
    await tick();
    expect(ended()).toBe(false);
    screen.handleInput(snapshot([], ['thanks:end']));
    await tick();
    expect(ended()).toBe(true);
  });

  it('leaving the screen (the hold-reset, a navigation) ends it too, so the flow never waits on a card nobody sees', async () => {
    const { screen, ended } = open('seymour-flux');
    screen.exit();
    await tick();
    expect(ended()).toBe(true);
  });
});

describe('3. the flow shows it after a won demo fight, and only then', () => {
  const played: string[] = [];
  let outcomes: Array<'victory' | 'defeat'> = [];
  let answers: Array<'retry' | 'chapter-select'> = [];

  class FakeResults extends Screen implements FlowScreen<void> {
    readonly name = 'results';
    readonly done = Promise.resolve();
    constructor(readonly opts: ResultsScreenOptions) {
      super();
    }
    override enter(): void {
      played.push(`results:${this.opts.outcome}`);
      if (this.opts.outcome !== 'victory') this.opts.onChoice?.(answers.shift() ?? 'chapter-select');
    }
  }
  class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
    readonly name = 'battle';
    readonly done: Promise<BattleScreenResult>;
    constructor(opts: BattleScreenOptions) {
      super();
      const outcome = outcomes.shift() ?? 'victory';
      const result = { outcome, turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
      this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome, result, elapsedMs: 120_000, links: 1, preview: false });
    }
    override enter(): void {
      played.push('battle');
    }
  }
  /** The story scenes a non-demo run plays: they end at once (the harness `r61-booth-demo-polish.test.ts` uses). */
  class FakeCutscene extends Screen implements FlowScreen<void> {
    readonly name = 'cutscene';
    readonly done = Promise.resolve();
    override enter(): void {
      played.push('story');
    }
  }
  class FakeThanks extends Screen implements FlowScreen<void> {
    readonly name = 'demo-thanks';
    readonly done = Promise.resolve();
    constructor(readonly chapterId: string) {
      super();
    }
    override enter(): void {
      played.push(`thanks:${this.chapterId}`);
    }
  }
  class FakeApp {
    readonly uiRoot = document.createElement('div');
    readonly save = new SaveStore();
    readonly flow: GameFlow;
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
    async goto(): Promise<boolean> {
      return true;
    }
    fade(): Promise<void> {
      return Promise.resolve();
    }
    nextFrame(): Promise<void> {
      return Promise.resolve();
    }
  }

  let app: FakeApp;
  const register = (withThanks: boolean): void => {
    resetFlowScreens();
    registerFlowScreens({
      results: (o: ResultsScreenOptions) => new FakeResults(o),
      battle: (o: BattleScreenOptions) => new FakeBattle(o),
      cutscene: () => new FakeCutscene(),
      ...(withThanks ? { demoThanks: (o: { chapter: { id: string } }) => new FakeThanks(o.chapter.id) } : {}),
    } as never);
  };
  beforeEach(() => {
    played.length = 0;
    outcomes = [];
    answers = [];
    register(true);
    document.body.innerHTML = '';
    app = new FakeApp();
  });

  it('demoThanksDue: demo mode and one of the two fights', () => {
    expect(demoThanksDue('seymour-flux')).toBe(false);
    setDemoMode(true);
    expect(demoThanksDue('seymour-flux')).toBe(true);
    expect(demoThanksDue('ffx2-bahamut')).toBe(true);
    expect(demoThanksDue('yunalesca')).toBe(false);
  });

  for (const [id, game] of [['seymour-flux', 'FFX'], ['ffx2-bahamut', 'FFX-2']] as const) {
    it(`${game} ${id}: a won demo fight runs battle, results, THANKS, and the run ends (the picker comes next)`, async () => {
      setDemoMode(true);
      await app.flow.runChapter(id, { seed: 1 });
      expect(played).toEqual(['battle', 'results:victory', `thanks:${id}`]);
    });

    it(`${game} ${id}: after a loss and TRY AGAIN the card stands only after the win, once`, async () => {
      setDemoMode(true);
      outcomes = ['defeat', 'victory'];
      answers = ['retry'];
      await app.flow.runChapter(id, { seed: 1 });
      expect(played).toEqual(['battle', 'results:defeat', 'battle', 'results:victory', `thanks:${id}`]);
    });

    it(`${game} ${id}: no card after a loss that leaves for the picker`, async () => {
      setDemoMode(true);
      outcomes = ['defeat'];
      answers = ['chapter-select'];
      await app.flow.runChapter(id, { seed: 1 });
      expect(played).toEqual(['battle', 'results:defeat']);
    });

    it(`${game} ${id}: outside demo mode the run has no thanks card (the whole run is the game's)`, async () => {
      await app.flow.runChapter(id, { skipPrep: true, seed: 1 });
      expect(played.some((p) => p.startsWith('thanks'))).toBe(false);
    });
  }

  it('a chapter that is not a demo fight gets none in demo mode', async () => {
    setDemoMode(true);
    await app.flow.runChapter('yunalesca', { skipPrep: true, seed: 1 });
    expect(played.some((p) => p.startsWith('thanks'))).toBe(false);
  });

  it('where no card is registered (a harness, the debug API\'s automated runs) the flow is what it was', async () => {
    register(false);
    setDemoMode(true);
    await app.flow.runChapter('seymour-flux', { seed: 1 });
    expect(played).toEqual(['battle', 'results:victory']);
  });

  it('an automated run that skips the results panel skips the card too', async () => {
    setDemoMode(true);
    await app.flow.runChapter('seymour-flux', { seed: 1, skipResults: true });
    expect(played).toEqual(['battle']);
  });
});
