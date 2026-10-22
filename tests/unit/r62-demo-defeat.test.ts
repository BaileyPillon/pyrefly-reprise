// @vitest-environment jsdom
/**
 * Release 62, decision 173g (Bailey, 2026-10-22 ~00:00 EDT; both games, demo mode only): on a loss the defeat panel offers TRY AGAIN (the same fight, fresh, on the same demo seed) and OTHER FIGHT,
 * one button each; no long defeat scene. Chapter I is FFX, Chapter IV is FFX-2.
 *
 * Against the real flow and the real panel, with the stand-in screens `r61-booth-demo-polish.test.ts` uses:
 *  1. the panel's slabs and their words, in demo mode and out of it (the game's RETRY / CHAPTER SELECT are untouched);
 *  2. TRY AGAIN: a second battle of the SAME chapter on the SAME seed, no prep, no story; outside demo mode a retry still adds 1000;
 *  3. OTHER FIGHT: the other demo fight starts at once, the picker's memory moves to it; Back leaves for the picker and starts nothing;
 *  4. the demo seeds: a fresh attempt from the picker still rotates through the table.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { setDemoMode, attemptSeed, DEMO_SEEDS } from '../../src/app/demoMode.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { lastBoardChapter, forgetBoardChapter, rememberBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen, type ResultsScreenOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { DEFEAT_ACTIONS, DEMO_DEFEAT_ACTIONS, desktopPageHtml, type ResultsChoice, type ResultsPageModel } from '../../src/ui/common/resultsPage.ts';
import { demoDefeatPanel, noteDemoDefeatChoice, takeDemoNextFight } from '../../src/app/demo/demoDefeat.ts';

beforeEach(() => {
  forgetBoardChapter();
  setDemoMode(null);
  try {
    sessionStorage.clear();
  } catch {
    /* jsdom always has one */
  }
});
afterEach(() => {
  setDemoMode(null);
  resetFlowScreens();
  document.body.innerHTML = '';
});

const model = (over: Partial<ResultsPageModel>): ResultsPageModel => ({ victory: false, silent: false, heading: 'Defeat', clock: '2:01', tags: [], quip: undefined, ledger: [], rows: [], progress: 1, actionIndex: 0, ...over });

describe('1. the defeat panel\'s slabs', () => {
  it('the data: RETRY / CHAPTER SELECT for the game, TRY AGAIN / OTHER FIGHT for a demo fight, the first slab is the retry', () => {
    expect(DEFEAT_ACTIONS.map((a) => a.label)).toEqual(['RETRY', 'CHAPTER SELECT']);
    expect(DEMO_DEFEAT_ACTIONS.map((a) => a.label)).toEqual(['TRY AGAIN', 'OTHER FIGHT']);
    expect(DEMO_DEFEAT_ACTIONS.map((a) => a.choice)).toEqual(['retry', 'other-fight']);
  });

  it('the page prints the slabs it is given and the game\'s own when it is given none', () => {
    const own = desktopPageHtml(model({}));
    expect(own).toContain('RETRY');
    expect(own).toContain('CHAPTER SELECT');
    expect(own).not.toContain('TRY AGAIN');
    const demo = desktopPageHtml(model({ actions: DEMO_DEFEAT_ACTIONS, actionIndex: 1 }));
    expect(demo).toContain('data-action="results:retry"');
    expect(demo).toContain('data-action="results:other-fight"');
    expect(demo).toContain('TRY AGAIN');
    expect(demo).toContain('OTHER FIGHT');
    expect(demo).not.toContain('CHAPTER SELECT');
    expect(demo).toMatch(/rres__action--selected[^>]*results:other-fight/); // the cursor is on the second slab
  });

  for (const [id, game] of [['seymour-flux', 'FFX'], ['ffx2-bahamut', 'FFX-2']] as const) {
    it(`${game} ${id}: the real ResultsScreen shows TRY AGAIN and OTHER FIGHT in demo mode and RETRY and CHAPTER SELECT without it`, () => {
      for (const demo of [true, false]) {
        document.body.innerHTML = '';
        setDemoMode(demo);
        const result = { outcome: 'defeat', turns: 9, elapsedTicks: 600, elapsedMs: 80_000, ap: 0, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
        const screen = new ResultsScreen({ chapterId: id, result, elapsedMs: 80_000 });
        const root = document.createElement('div');
        document.body.appendChild(root);
        screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), uiRoot: document.body } as unknown as App;
        screen.root = root;
        screen.enter();
        const text = root.textContent ?? '';
        expect(text.includes('TRY AGAIN'), `${id} demo ${String(demo)}`).toBe(demo);
        expect(text.includes('OTHER FIGHT')).toBe(demo);
        expect(text.includes('RETRY')).toBe(!demo);
        expect(text.includes('CHAPTER SELECT')).toBe(!demo);
        // the slabs answer a click and a trigger by name
        let picked = '';
        const again = new ResultsScreen({ chapterId: id, result, elapsedMs: 80_000, onChoice: (c) => (picked = c) });
        again.app = screen.app;
        again.root = document.createElement('div');
        again.enter();
        expect(again.trigger(demo ? 'results:other-fight' : 'results:chapter-select')).toBe(true);
        expect(picked).toBe(demo ? 'other-fight' : 'chapter-select');
        screen.exit();
      }
    });
  }

  it('demoDefeatPanel is true only for a demo fight in demo mode', () => {
    expect(demoDefeatPanel('seymour-flux')).toBe(false);
    setDemoMode(true);
    expect(demoDefeatPanel('seymour-flux')).toBe(true);
    expect(demoDefeatPanel('ffx2-bahamut')).toBe(true);
    expect(demoDefeatPanel('yunalesca')).toBe(false);
  });
});

describe('2 and 3. the flow: TRY AGAIN, OTHER FIGHT, Back', () => {
  const played: string[] = [];
  const battles: Array<{ chapter: string; seed: number | undefined }> = [];
  let outcomes: Array<'victory' | 'defeat'> = [];
  let answers: ResultsChoice[] = [];

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
      battles.push({ chapter: opts.chapter.id, seed: opts.seed });
      const result = { outcome, turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
      this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome, result, elapsedMs: 120_000, links: 1, preview: false });
    }
    override enter(): void {
      played.push('battle');
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
    played.length = 0;
    battles.length = 0;
    outcomes = [];
    answers = [];
    resetFlowScreens();
    registerFlowScreens({ results: (o) => new FakeResults(o), battle: (o) => new FakeBattle(o) });
    document.body.innerHTML = '';
    app = new FakeApp();
    takeDemoNextFight();
  });

  for (const [id, game, seed] of [['seymour-flux', 'FFX', 10], ['ffx2-bahamut', 'FFX-2', 56]] as const) {
    it(`${game} ${id}: TRY AGAIN is a second battle of the same chapter on the SAME seed (${seed}), with no prep and no story, and the run ends on the win`, async () => {
      setDemoMode(true);
      outcomes = ['defeat', 'defeat', 'victory'];
      answers = ['retry', 'retry'];
      await app.flow.runChapter(id, { seed });
      expect(battles).toEqual([{ chapter: id, seed }, { chapter: id, seed }, { chapter: id, seed }]);
      expect(played).toEqual(['battle', 'results:defeat', 'battle', 'results:defeat', 'battle', 'results:victory']);
    });

    it(`${game} ${id}: OTHER FIGHT starts the other demo fight at once and moves the picker's memory to it`, async () => {
      setDemoMode(true);
      const other = id === 'seymour-flux' ? 'ffx2-bahamut' : 'seymour-flux';
      rememberBoardChapter(id);
      outcomes = ['defeat', 'victory'];
      answers = ['other-fight'];
      await app.flow.runChapter(id, { seed });
      expect(battles.map((b) => b.chapter)).toEqual([id, other]);
      expect(played).toEqual(['battle', 'results:defeat', 'battle', 'results:victory']);
      expect(lastBoardChapter(), 'so the picker then opens on the fight that is the OTHER one now').toBe(other);
    });

    it(`${game} ${id}: Back on the defeat panel (CHAPTER SELECT) leaves for the picker and starts nothing`, async () => {
      setDemoMode(true);
      outcomes = ['defeat'];
      answers = ['chapter-select'];
      await app.flow.runChapter(id, { seed });
      expect(battles).toHaveLength(1);
      expect(played).toEqual(['battle', 'results:defeat']);
    });
  }

  it('OTHER FIGHT is spent once: the next run does not start a fight on its own', async () => {
    setDemoMode(true);
    outcomes = ['defeat', 'victory', 'victory'];
    answers = ['other-fight'];
    await app.flow.runChapter('seymour-flux', { seed: 7 });
    expect(battles).toHaveLength(2);
    await app.flow.runChapter('seymour-flux', { seed: 7 });
    expect(battles).toHaveLength(3);
    expect(takeDemoNextFight()).toBeNull();
  });

  it('WITHOUT demo mode a retry is the game\'s +1000, the pick OTHER FIGHT cannot start anything, and a chapter that is not a demo fight is left alone in demo mode', async () => {
    outcomes = ['defeat', 'victory'];
    answers = ['retry'];
    await app.flow.runChapter('seymour-flux', { skipPrep: true, skipCutscenes: true, seed: 7 });
    expect(battles.map((b) => b.seed)).toEqual([7, 1007]);

    noteDemoDefeatChoice('seymour-flux', 'other-fight');
    expect(takeDemoNextFight()).toBeNull();

    setDemoMode(true);
    noteDemoDefeatChoice('yunalesca', 'other-fight');
    expect(takeDemoNextFight()).toBeNull();
    noteDemoDefeatChoice('seymour-flux', 'retry');
    expect(takeDemoNextFight()).toBeNull();
    noteDemoDefeatChoice('ffx2-bahamut', 'other-fight');
    expect(takeDemoNextFight()).toBe('seymour-flux');
  });
});

describe('4. the seeds', () => {
  it('a retry in demo mode is the same seed whichever of the table\'s seeds the run began on; outside demo mode it adds 1000; a fresh attempt from the picker is another matter (nextDemoRunSeed rotates)', () => {
    setDemoMode(true);
    for (const seed of DEMO_SEEDS['seymour-flux']!) for (const attempt of [0, 1, 2, 3]) expect(attemptSeed('seymour-flux', seed, attempt)).toBe(seed);
    expect(attemptSeed('ffx2-bahamut', 56, 4)).toBe(56);
    expect(attemptSeed('seymour-flux', 99, 1)).toBe(1099); // a seed the table does not hold is the game's rule
    setDemoMode(false);
    expect(attemptSeed('seymour-flux', 7, 1)).toBe(1007);
  });
});
