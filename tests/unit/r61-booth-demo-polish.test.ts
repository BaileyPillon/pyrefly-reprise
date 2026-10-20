// @vitest-environment jsdom
/**
 * R61 booth fix 3 (Bailey, 2026-10-20, the conference demo, `?demo=1`): the demo does not teach a visitor, and a win goes back to the board fast.
 *
 * Three claims, each against the real code and not a copy of it:
 *  1. **No first-run teaching card in demo mode** (both games): `shouldShow` answers false for every surface, the guided first run never arms, and the first-use line a battle would raise is not
 *     raised. Nothing is marked seen, so the save is untouched; with the switch off every one of them is exactly what it was.
 *  2. **A win goes back to the board** (both games): in demo mode the part of the post scene AFTER the results panel is not played, and the board opens on the OTHER demo chapter, once. A loss, a retry,
 *     a chapter that is not a demo chapter and a Pilgrimage fight are untouched.
 *  3. The rules are not touched: the switch is the one `demoMode.ts` has always been; no engine is imported here.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { DEMO_CHAPTERS, demoBoardTarget, noteDemoWin, setDemoMode, takeDemoBoardFocus } from '../../src/app/demoMode.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { forgetBoardChapter, initialBoardIndex, lastBoardChapter, rememberBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import {
  GameFlow,
  registerFlowScreens,
  resetFlowScreens,
  type CutsceneScreenOptions,
  type FlowScreen,
  type ResultsScreenOptions,
} from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { AvailableCommand, BattleEvent, BattleState, Command, CombatantId, MinigameKind, MinigameResult, TurnPreview, AtbSnapshot, BattleResult } from '../../src/battle/common/types.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { ALL_COACH_IDS } from '../../src/ui/coach/coachCopy.ts';
import { hasSeen, resetCoach, shouldShow } from '../../src/ui/coach/coachState.ts';
import { FIRST_RUN_IDS } from '../../src/ui/coach/firstRunCopy.ts';
import { armFirstRunGuide, firstRunActive, stopFirstRun } from '../../src/ui/coach/firstRunGuide.ts';
import { briefingDue } from '../../src/app/screens/raiseBriefing.ts';

beforeEach(() => {
  resetCoach();
  stopFirstRun();
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
  stopFirstRun();
  resetFlowScreens();
  document.body.innerHTML = '';
});

describe('1. no first-run teaching card in demo mode', () => {
  it('shouldShow is false for every briefing, first-use line and guided-first-run card, and true for all of them with the switch off', () => {
    const ids = [...ALL_COACH_IDS, ...FIRST_RUN_IDS, 'sphere-grid-card'];
    for (const id of ids) expect(shouldShow(id), `${id} off`).toBe(true);
    setDemoMode(true);
    for (const id of ids) expect(shouldShow(id), `${id} in demo mode`).toBe(false);
    setDemoMode(false);
    for (const id of ids) expect(shouldShow(id), `${id} after`).toBe(true);
  });

  it('the guided first run never arms in demo mode, and arms for a first run otherwise', () => {
    setDemoMode(true);
    armFirstRunGuide({ root: document.body, absorbInput: () => undefined });
    expect(firstRunActive()).toBe(false);
    expect(document.querySelector('[data-role="firstrun"]')).toBeNull();
    setDemoMode(false);
    armFirstRunGuide({ root: document.body, absorbInput: () => undefined });
    expect(firstRunActive()).toBe(true);
  });

  it('the address says so: ?demo=1 is the switch (kept for the tab), ?demo=0 turns it off', () => {
    window.history.replaceState(null, '', '/?demo=1');
    expect(shouldShow('briefing')).toBe(false);
    window.history.replaceState(null, '', '/?demo=0');
    expect(shouldShow('briefing')).toBe(true);
    window.history.replaceState(null, '', '/');
  });

  /** A HUD double that records the menu it was asked for. */
  class SpyHud implements HudPort {
    menus = 0;
    mount(): void {}
    unmount(): void {}
    sync(_s: BattleState, _p: TurnPreview[] | AtbSnapshot): void {}
    chooseCommand(): Promise<Command> {
      this.menus += 1;
      return Promise.resolve({ kind: 'attack', actor: 'a' as CombatantId, targets: [] } as Command);
    }
    onEvent(_e: BattleEvent): void {}
    openMinigame(_k: MinigameKind, _p: Record<string, unknown>): Promise<MinigameResult> {
      return Promise.resolve({} as MinigameResult);
    }
    setVisible(): void {}
    setProjector(): void {}
  }

  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: the first command menu opens and no first-use card is raised in demo mode (the card is raised without it)`, async () => {
      for (const demo of [true, false]) {
        resetCoach();
        document.body.innerHTML = '';
        setDemoMode(demo);
        const hud = new SpyHud();
        const coached = withCoach(game, hud, { reduceMotion: true, setTimer: () => 0, clearTimer: () => undefined });
        coached.mount(document.body);
        const answered = coached.chooseCommand('tidus' as CombatantId, [] as AvailableCommand[], () => []);
        await answered;
        expect(hud.menus, 'the menu is never held back').toBe(1);
        expect(document.querySelector('.coach-mark') !== null, `demo ${String(demo)}`).toBe(!demo);
        if (demo) for (const id of ALL_COACH_IDS) expect(hasSeen(id), `${id} stays unseen: nothing is written to the save`).toBe(false);
        coached.unmount();
      }
    });
  }

  it('Auron\'s briefing is not due in demo mode (the title does not wait for it), and is due for a first launch without it', () => {
    const app = { input: { claimKeyboard: () => () => undefined }, uiRoot: document.body } as unknown as App;
    expect(briefingDue(app)).toBe(true);
    setDemoMode(true);
    expect(briefingDue(app)).toBe(false);
  });
});

describe('2. a win goes back to the board fast', () => {
  it('the board opens on the other demo chapter: Chapter I -> Chapter IV -> Chapter I; anything else gives nothing', () => {
    expect(DEMO_CHAPTERS).toEqual(['seymour-flux', 'ffx2-bahamut']);
    expect(demoBoardTarget('seymour-flux')).toBe('ffx2-bahamut');
    expect(demoBoardTarget('ffx2-bahamut')).toBe('seymour-flux');
    expect(demoBoardTarget('yunalesca')).toBeNull();
    expect(demoBoardTarget(null)).toBeNull();
  });

  it('noteDemoWin + takeDemoBoardFocus: once, and only for a demo chapter in demo mode', () => {
    noteDemoWin('seymour-flux'); // demo mode off
    setDemoMode(true);
    expect(takeDemoBoardFocus()).toBeNull();
    noteDemoWin('yunalesca'); // not a demo chapter
    expect(takeDemoBoardFocus()).toBeNull();
    noteDemoWin('seymour-flux');
    expect(takeDemoBoardFocus()).toBe('ffx2-bahamut');
    expect(takeDemoBoardFocus(), 'taken once').toBeNull();
    noteDemoWin('ffx2-bahamut');
    setDemoMode(false);
    expect(takeDemoBoardFocus(), 'demo mode off: the board is the game\'s own').toBeNull();
  });

  const tiles = [
    { id: 'seymour-flux', playable: true },
    { id: 'yunalesca', playable: true },
    { id: 'ffx2-bahamut', playable: true },
  ];

  it('the board\'s first cursor after a demo win is the other demo chapter, remembered; a rebuild (a prep Esc) stays there; an explicit index wins', () => {
    setDemoMode(true);
    rememberBoardChapter('seymour-flux');
    noteDemoWin('seymour-flux');
    expect(initialBoardIndex(tiles, undefined)).toBe(2);
    expect(lastBoardChapter()).toBe('ffx2-bahamut');
    expect(initialBoardIndex(tiles, undefined), 'the next build is the remembered chapter, as ever').toBe(2);
    noteDemoWin('ffx2-bahamut');
    expect(initialBoardIndex(tiles, 1), 'an explicit initialIndex is untouched').toBe(1);
    expect(initialBoardIndex(tiles, undefined), 'and the win is still waiting for the next plain build').toBe(0);
  });

  it('without a win the board is exactly what it was (the remembered chapter, else the first playable)', () => {
    setDemoMode(true);
    expect(initialBoardIndex(tiles, undefined)).toBe(0);
    rememberBoardChapter('yunalesca');
    expect(initialBoardIndex(tiles, undefined)).toBe(1);
  });

  // ------------------------------------------------------------------ the flow, with stand-in screens (the harness `flow-post-scene.test.ts` uses)

  const played: string[] = [];
  let outcomeOf: 'victory' | 'defeat' = 'victory';

  class FakeCutscene extends Screen implements FlowScreen<void> {
    readonly name = 'cutscene';
    readonly done: Promise<void>;
    private resolve!: () => void;
    constructor(private readonly opts: CutsceneScreenOptions) {
      super();
      this.done = new Promise<void>((r) => (this.resolve = r));
    }
    override enter(): void {
      const from = this.opts.resumeFrom ?? 0;
      const at = this.opts.script.findIndex((s, i) => i >= from && s.type === 'results');
      played.push(`${this.opts.phase}${from > 0 ? `@${from}` : ''}`);
      if (at >= 0) this.opts.onResultsMarker?.({ silent: false, resumeAt: at + 1 });
      this.resolve();
    }
    override exit(): void {
      this.resolve();
    }
  }
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
      const result = { outcome: outcomeOf, turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
      this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome: outcomeOf, result, elapsedMs: 120_000, links: 1, preview: false });
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
    outcomeOf = 'victory';
    resetFlowScreens();
    registerFlowScreens({
      cutscene: (o) => new FakeCutscene(o),
      results: (o) => new FakeResults(o),
      battle: (o) => new FakeBattle(o),
    });
    document.body.innerHTML = '';
    app = new FakeApp();
  });

  for (const [chapter, game] of [
    ['seymour-flux', 'FFX'],
    ['ffx2-bahamut', 'FFX-2'],
  ] as const) {
    it(`${game} ${chapter}: the story after the panel is not played in demo mode (post, results, done); outside it, it is`, async () => {
      setDemoMode(true);
      await app.flow.runChapter(chapter, { skipPrep: true, seed: 1 });
      expect(played).toEqual(['pre', 'battle', 'post', 'results']);
      expect(takeDemoBoardFocus(), 'and the board will open on the other demo chapter').toBe(chapter === 'seymour-flux' ? 'ffx2-bahamut' : 'seymour-flux');

      played.length = 0;
      setDemoMode(false);
      await app.flow.runChapter(chapter, { skipPrep: true, seed: 1 });
      expect(played).toEqual(['pre', 'battle', 'post', 'results', expect.stringMatching(/^post@\d+$/)]);
      expect(takeDemoBoardFocus()).toBeNull();
    });
  }

  it('any other chapter a visitor reaches also goes straight back, and the board only moves for a demo chapter', async () => {
    setDemoMode(true);
    await app.flow.runChapter('yunalesca', { skipPrep: true, seed: 1 });
    expect(played).toEqual(['pre', 'battle', 'post', 'results']);
    expect(takeDemoBoardFocus()).toBeNull();
  });

  it('a Pilgrimage fight keeps its rules and its story: no quick way back, no board move', async () => {
    setDemoMode(true);
    const progress = { recordAttempt: () => undefined, chapter: () => ({ bestTimeMs: null }), recordClear: () => undefined };
    const pilgrim = { chapter: (c: unknown) => c, progress } as unknown as NonNullable<Parameters<GameFlow['runChapter']>[1]['pilgrim']>;
    await app.flow.runChapter('seymour-flux', { skipPrep: true, seed: 1, pilgrim });
    expect(played.filter((p) => p.startsWith('post')).length).toBe(2);
    expect(takeDemoBoardFocus()).toBeNull();
  });
});
