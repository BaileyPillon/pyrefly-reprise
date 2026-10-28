// @vitest-environment jsdom
/**
 * Release 67, round 30's PR-0481 "retry from the fight itself" (the driver's call under Bailey's delegation, 2026-10-28; his to overturn). **FFX only, Chapter I (`seymour-flux`)**: on the PUBLIC address, the second
 * attempt of a fight and every later one open hurried, as the demo path's quick retry has since release 63 (the card for 0.7 s, the sweep cut, the boss's reveal and its recorded roar skipped; nothing of the fight
 * itself changes). The first attempt keeps the authored opening, and so does every other chapter (Chapter IV FFX-2 included: it has no recorded opening). `?retryopening=full` is release 66's retry.
 *
 * Through the real flow with stand-in screens (the same harness `r62-demo-intro.test.ts` uses):
 *  1. the gate: the pure answer for each chapter, attempt, mode and word;
 *  2. the flow: the battle options each attempt is built with, on the public address, in demo mode, and with the word;
 *  3. nothing else the demo's quick retry does is borrowed (the retry theme and the stage warm are demo-only).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { PUBLIC_QUICK_RETRY_CHAPTERS, demoQuickRetry, publicQuickRetry, retryOpeningFull } from '../../src/app/demo/demoDefeat.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type CutsceneScreenOptions, type FlowScreen, type ResultsScreenOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import type { ChapterId } from '../../src/data/encounters.ts';

const visit = (search: string): void => window.history.pushState({}, '', `/${search}`);

beforeEach(() => {
  forgetBoardChapter();
  setDemoMode(null);
  visit('');
});
afterEach(() => {
  setDemoMode(null);
  visit('');
  resetFlowScreens();
  document.body.innerHTML = '';
});

describe('1. the gate', () => {
  it('Chapter I (FFX) alone, from the second attempt on, off the demo path', () => {
    expect([...PUBLIC_QUICK_RETRY_CHAPTERS]).toEqual(['seymour-flux']);
    expect(publicQuickRetry('seymour-flux', 0)).toBe(false);
    expect(publicQuickRetry('seymour-flux', 1)).toBe(true);
    expect(publicQuickRetry('seymour-flux', 4)).toBe(true);
    for (const other of ['ffx2-bahamut', 'yunalesca', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'gagazet']) {
      expect(publicQuickRetry(other, 1), other).toBe(false);
      expect(publicQuickRetry(other, 3), other).toBe(false);
    }
  });

  it('the demo path is the demo gate\'s, unchanged: in demo mode the public gate stays out of it, and the demo gate still hurries both demo chapters', () => {
    setDemoMode(true);
    try {
      expect(publicQuickRetry('seymour-flux', 1)).toBe(false);
      expect(demoQuickRetry('seymour-flux', 1)).toBe(true);
      expect(demoQuickRetry('ffx2-bahamut', 1)).toBe(true);
      expect(demoQuickRetry('seymour-flux', 0)).toBe(false);
    } finally {
      setDemoMode(null);
    }
    expect(demoQuickRetry('seymour-flux', 1)).toBe(false); // off the demo path the demo gate is closed; the public gate is the one that opens
    expect(demoQuickRetry('ffx2-bahamut', 1)).toBe(false);
  });

  it('?retryopening=full is release 66: nothing else turns it off, and the word is read from the address', () => {
    expect(retryOpeningFull('')).toBe(false);
    expect(retryOpeningFull('?retryopening=quick')).toBe(false);
    expect(retryOpeningFull('?retrytheme=off')).toBe(false);
    expect(retryOpeningFull('?retryopening=full')).toBe(true);
    expect(publicQuickRetry('seymour-flux', 2, '?retryopening=full')).toBe(false);
    expect(publicQuickRetry('seymour-flux', 2, '?pack=off&retryopening=quick')).toBe(true); // not pack-gated (the opening is the battle's own)
    visit('?retryopening=full');
    expect(publicQuickRetry('seymour-flux', 2)).toBe(false); // no search given: the page's own address
    visit('');
    expect(publicQuickRetry('seymour-flux', 2)).toBe(true);
  });
});

describe('2. the flow', () => {
  const battles: Array<{ chapter: string; hurry: boolean | undefined; retryTheme: boolean | undefined }> = [];
  let outcomes: Array<'victory' | 'defeat'> = [];
  let answers: Array<'retry' | 'chapter-select'> = [];

  class FakeStory extends Screen implements FlowScreen<void> {
    readonly name = 'cutscene';
    readonly done = Promise.resolve();
    constructor(readonly opts: CutsceneScreenOptions) {
      super();
    }
  }
  class FakeResults extends Screen implements FlowScreen<void> {
    readonly name = 'results';
    readonly done = Promise.resolve();
    constructor(readonly opts: ResultsScreenOptions) {
      super();
    }
    override enter(): void {
      if (this.opts.outcome !== 'victory') this.opts.onChoice?.(answers.shift() ?? 'chapter-select');
    }
  }
  class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
    readonly name = 'battle';
    readonly done: Promise<BattleScreenResult>;
    constructor(opts: BattleScreenOptions) {
      super();
      const outcome = outcomes.shift() ?? 'victory';
      battles.push({ chapter: opts.chapter.id, hurry: opts.openingHurry, retryTheme: opts.retryTheme });
      const result = { outcome, turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
      this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome, result, elapsedMs: 120_000, links: 1, preview: false });
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
  beforeEach(() => {
    battles.length = 0;
    outcomes = [];
    answers = [];
    resetFlowScreens();
    registerFlowScreens({
      results: (o: ResultsScreenOptions) => new FakeResults(o),
      battle: (o: BattleScreenOptions) => new FakeBattle(o),
      cutscene: (o: CutsceneScreenOptions) => new FakeStory(o),
    } as never);
    document.body.innerHTML = '';
    app = new FakeApp();
  });

  /** Lose `losses` times in a row (each answered TRY AGAIN / RETRY), then win; the options of every battle, in order. */
  async function loseThenWin(chapter: string, losses: number): Promise<Array<boolean | undefined>> {
    outcomes = [...Array.from({ length: losses }, () => 'defeat' as const), 'victory'];
    answers = Array.from({ length: losses }, () => 'retry' as const);
    await app.flow.runChapter(chapter as ChapterId, { skipPrep: true, seed: 11 });
    expect(battles).toHaveLength(losses + 1);
    return battles.map((b) => b.hurry);
  }

  it('Chapter I on the public address: attempt 1 opens as authored, attempt 2 and every later one open hurried', async () => {
    expect(await loseThenWin('seymour-flux', 3)).toEqual([undefined, true, true, true]);
  }, 30_000);

  it('Chapter I, one loss: the retry is the only hurried opening', async () => {
    expect(await loseThenWin('seymour-flux', 1)).toEqual([undefined, true]);
  });

  it('a first-attempt win is the authored opening, as ever', async () => {
    expect(await loseThenWin('seymour-flux', 0)).toEqual([undefined]);
  });

  it('?retryopening=full: every attempt opens as authored (release 66)', async () => {
    visit('?retryopening=full');
    expect(await loseThenWin('seymour-flux', 2)).toEqual([undefined, undefined, undefined]);
  }, 30_000);

  // One test a chapter (a battle takes about 1.5 s in jsdom: the entry transition runs on real timers), one loss each.
  for (const [chapter, label] of [['ffx2-bahamut', 'Chapter IV (FFX-2)'], ['yunalesca', 'Chapter II (FFX)'], ['braskas-final-aeon', 'Chapter III (FFX)'], ['ffx2-vegnagun-shuyin', 'Chapter V (FFX-2)']] as const) {
    it(`${label} keeps its authored retry`, async () => {
      expect(await loseThenWin(chapter, 1)).toEqual([undefined, undefined]);
    }, 30_000);
  }

  it('the demo path is unchanged: both demo chapters hurry a retry and ask for the retried fight\'s theme; the public retry asks for no theme', async () => {
    setDemoMode(true);
    for (const chapter of ['seymour-flux', 'ffx2-bahamut']) {
      battles.length = 0;
      outcomes = ['defeat', 'victory'];
      answers = ['retry'];
      await app.flow.runChapter(chapter as ChapterId, { seed: 7 });
      expect(battles.map((b) => b.hurry), chapter).toEqual([undefined, true]);
      expect(battles.map((b) => b.retryTheme), chapter).toEqual([undefined, true]);
    }
    setDemoMode(null);
    battles.length = 0;
    expect(await loseThenWin('seymour-flux', 1)).toEqual([undefined, true]);
    expect(battles.map((b) => b.retryTheme)).toEqual([undefined, undefined]); // the theme ask and the stage warm are the demo's alone
  }, 30_000);
});
