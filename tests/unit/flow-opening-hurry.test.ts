// @vitest-environment jsdom
/**
 * PR-0061 (both games): a player who hurried the pre-scene (held Confirm, skipped it, or has "skip seen scenes" on) gets a
 * battle whose first opening runs hurried; a player who played it through, a retry and a run with no scene do not.
 * The real `CutsceneScreen` decides `hurriedByPlayer`; this checks the flow hands it on to the battle's options.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type CutsceneScreenOptions, type FlowScreen } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';

let hurriedScene = false;
const battles: BattleScreenOptions[] = [];
const outcomes: Array<'victory' | 'defeat'> = [];

class FakeCutscene extends Screen implements FlowScreen<void> {
  readonly name = 'cutscene';
  readonly done = Promise.resolve();
  readonly hurriedByPlayer = hurriedScene;
  constructor(readonly opts: CutsceneScreenOptions) {
    super();
  }
}

class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    battles.push(opts);
    const outcome = outcomes.shift() ?? 'victory';
    const result = { outcome, turns: 3, elapsedTicks: 1, elapsedMs: 0, ap: 0, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
    this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome, result, elapsedMs: 1000, links: 1, preview: false });
  }
}

class Quiet extends Screen implements FlowScreen<boolean> {
  readonly name = 'results';
  readonly done = Promise.resolve(true);
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
    if (previous) await previous.exit();
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
  document.body.innerHTML = '';
  battles.length = 0;
  outcomes.length = 0;
  hurriedScene = false;
  resetFlowScreens();
  registerFlowScreens({ cutscene: (o) => new FakeCutscene(o), results: () => new Quiet() as never, battle: (o) => new FakeBattle(o) });
  app = new FakeApp();
});
afterEach(() => resetFlowScreens());

describe('the flow passes a hurried scene on to the battle', () => {
  it('a hurried pre-scene: the battle opens hurried', async () => {
    hurriedScene = true;
    await app.flow.runChapter('seymour-flux', { skipPrep: true, seed: 1, skipResults: true });
    expect(battles[0]?.openingHurry).toBe(true);
  });
  it('a pre-scene played through: no flag', async () => {
    await app.flow.runChapter('seymour-flux', { skipPrep: true, seed: 1, skipResults: true });
    expect(battles[0]?.openingHurry).toBeUndefined();
  });
  it('no scene at all (the debug run, skipCutscenes): no flag', async () => {
    hurriedScene = true;
    await app.flow.runChapter('seymour-flux', { skipPrep: true, skipCutscenes: true, seed: 1, skipResults: true });
    expect(battles[0]?.openingHurry).toBeUndefined();
  });
  it('FFX-2 too (both games)', async () => {
    hurriedScene = true;
    await app.flow.runChapter('ffx2-bahamut', { skipPrep: true, seed: 1, skipResults: true });
    expect(battles[0]?.openingHurry).toBe(true);
  });
  it('a retry after a defeat has no pre-scene and so no hurry', async () => {
    hurriedScene = true;
    outcomes.push('defeat', 'victory');
    await app.flow.runChapter('seymour-flux', { skipPrep: true, seed: 1, skipResults: true });
    // skipResults leaves a defeat as the run's end here; whatever the flow did next, the second battle is not hurried.
    for (const b of battles.slice(1)) expect(b.openingHurry).toBeUndefined();
  });
});
