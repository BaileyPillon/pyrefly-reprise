// @vitest-environment jsdom
/**
 * PR-0283 (critic round 18b, both games): after RESTART ENCOUNTER the title
 * root stayed mounted over the whole restarted fight.
 *
 * The cause, traced on 95e62e38 by real keys at 1600x900: the pause row
 * aborted the fight and then started a **second** chapter run beside the one
 * that owned it. The owner (the title's `GameFlow.start` loop) carried on as
 * if the chapter had ended and put the board up; the restart's battle replaced
 * the board, the board's teardown answered "no chapter", and the loop sent the
 * stack to the title while the restarted battle was being pushed: roots
 * `["title","battle"]` from 2 s to the results.
 *
 * The fix (`pause/restartCarry.ts` `runWithRestarts`): a fight ended by
 * RESTART ENCOUNTER says so on its result, and the run that owns it plays the
 * chapter again in place. These tests drive the real `GameFlow` against the
 * same `FakeApp` shape as `pause-restart-flow.test.ts`.
 *
 * Game case: both (shared plumbing, CHK-020); one FFX and one FFX-2 chapter.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { pinRunSeed } from '../../src/app/runSeed.ts';
import {
  GameFlow,
  registerFlowScreens,
  resetFlowScreens,
  type FlowScreen,
} from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { flowOwnsRun, RESTART_RUN } from '../../src/app/screens/pause/restartCarry.ts';
import { getChapter, type ChapterId } from '../../src/data/encounters.ts';

type Ending = 'restart' | 'quit' | 'victory';

const shown: string[] = [];
const battles: BattleScreenOptions[] = [];
const ownedDuringFight: boolean[] = [];
let endings: Ending[] = [];
let app: FakeApp;

class ScriptedBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    battles.push(opts);
    const end = endings.shift() ?? 'victory';
    this.done = Promise.resolve().then(() => {
      ownedDuringFight.push(flowOwnsRun(app.flow));
      return {
        chapterId: opts.chapter.id,
        outcome: end !== 'victory' ? ('aborted' as const) : ('victory' as const),
        result: end === 'victory' ? ({ turns: 9, elapsedMs: 0, elapsedTicks: 0 } as never) : null,
        elapsedMs: 5000,
        links: 1,
        preview: false,
        ...(end === 'restart' ? { restartRequested: true as const } : {}),
        ...(end === 'quit' ? { quitToTitle: true as const } : {}),
      };
    });
  }
  override enter(): void {
    shown.push(this.name);
  }
}

class Done<T> extends Screen implements FlowScreen<T> {
  readonly done: Promise<T>;
  constructor(readonly name: string, value: T) {
    super();
    this.done = Promise.resolve(value);
  }
  override enter(): void {
    shown.push(this.name);
  }
}

class FakeApp {
  readonly uiRoot: HTMLElement;
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;
  readonly went: string[] = [];
  constructor() {
    this.uiRoot = document.createElement('div');
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
    screen.root.dataset['screen'] = screen.name;
    this.uiRoot.appendChild(screen.root);
    this.current = screen;
    await screen.enter();
  }
  async goto(name: string): Promise<boolean> {
    this.went.push(name);
    shown.push(`goto:${name}`);
    return true;
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

/** A board that answers with `picks` in turn, then backs out (null). */
function board(picks: ChapterId[]): () => FlowScreen<ChapterId | null> {
  const queue = [...picks];
  return () => new Done<ChapterId | null>('chapter-select', queue.shift() ?? null);
}

beforeEach(() => {
  pinRunSeed(1);
  shown.length = 0;
  battles.length = 0;
  ownedDuringFight.length = 0;
  endings = [];
  document.body.innerHTML = '';
  resetFlowScreens();
  registerFlowScreens({
    partyPrep: () => new Done('party-prep', true),
    cutscene: () => new Done('cutscene', undefined),
    results: () => new Done('results', undefined),
    battle: (opts) => new ScriptedBattle(opts),
  });
  app = new FakeApp();
});

afterEach(() => {
  resetFlowScreens();
});

describe('PR-0283: RESTART ENCOUNTER is played by the run that owns the fight', () => {
  for (const id of ['seymour-flux', 'ffx2-bahamut'] as ChapterId[]) {
    const game = getChapter(id)?.game;

    it(`${game}: from the title's flow loop, the board and the title never come up between the fights (${id})`, async () => {
      registerFlowScreens({ chapterSelect: board([id]) });
      endings = ['restart', 'victory'];

      await app.flow.start();

      // Board -> prep -> scene -> fight -> RESTART -> fight -> results -> board -> (backs out) title.
      const firstBattle = shown.indexOf('battle');
      const secondBattle = shown.indexOf('battle', firstBattle + 1);
      expect(secondBattle, 'the restart put a second fight up').toBeGreaterThan(firstBattle);
      expect(shown.slice(firstBattle + 1, secondBattle), 'nothing between the two fights').toEqual([]);
      expect(shown.slice(secondBattle + 1)).toEqual(['results', 'chapter-select', 'goto:title']);
      expect(battles).toHaveLength(2);
      // The restart's own options, as before: a fresh run, no prep, no scene.
      expect(shown.filter((s) => s === 'party-prep')).toHaveLength(1);
      expect(ownedDuringFight).toEqual([true, true]);
      expect(flowOwnsRun(app.flow), 'the run is over').toBe(false);
    });

    it(`${game}: from a run the board started (main.ts), runChapter answers with the restarted fight (${id})`, async () => {
      endings = ['restart', 'victory'];
      const out = await app.flow.runChapter(id, { skipCutscenes: true });
      expect(out?.outcome).toBe('victory');
      expect(out?.restartRequested).toBeUndefined();
      expect(shown).toEqual(['party-prep', 'battle', 'battle', 'results']);
      expect(app.went, 'no navigation from under the run').toEqual([]);
    });
  }

  it('restarts as often as the player asks, each one in place', async () => {
    endings = ['restart', 'restart', 'restart', 'victory'];
    const out = await app.flow.runChapter('seymour-flux', { skipCutscenes: true, skipResults: true });
    expect(out?.outcome).toBe('victory');
    // A restart runs with RESTART ENCOUNTER's own options, as it always has, so its results panel shows.
    expect(shown).toEqual(['party-prep', 'battle', 'battle', 'battle', 'battle', 'results']);
  });

  it('a fight no run owns is not claimed: the screen starts its own run (direct goto)', () => {
    expect(flowOwnsRun(app.flow)).toBe(false);
    expect(flowOwnsRun(undefined)).toBe(false);
    expect(RESTART_RUN).toEqual({ skipPrep: true, skipCutscenes: true, restart: true });
  });
});

describe('r34fix-quit: QUIT TO TITLE is taken by the run that owns the fight, once', () => {
  for (const id of ['seymour-flux', 'ffx2-bahamut'] as ChapterId[]) {
    const game = getChapter(id)?.game;

    it(`${game}: from the title's flow loop, one title and no board in between (${id})`, async () => {
      registerFlowScreens({ chapterSelect: board([id]) });
      endings = ['quit'];

      await app.flow.start();

      // Board -> prep -> scene -> fight -> QUIT TO TITLE: exactly one navigation, straight from the fight.
      const fight = shown.indexOf('battle');
      expect(shown.slice(fight + 1), 'only one goto, and no board put up first').toEqual(['goto:title']);
      expect(app.went).toEqual(['title']);
      expect(flowOwnsRun(app.flow)).toBe(false);
    });

    it(`${game}: after a restart first, QUIT TO TITLE is still one goto (${id})`, async () => {
      registerFlowScreens({ chapterSelect: board([id]) });
      endings = ['restart', 'quit'];
      await app.flow.start();
      expect(app.went).toEqual(['title']);
      expect(shown.filter((s) => s === 'chapter-select')).toHaveLength(1);
    });

    it(`${game}: from a run the board started (main.ts), runChapter goes once and says so (${id})`, async () => {
      endings = ['quit'];
      const out = await app.flow.runChapter(id, { skipCutscenes: true });
      expect(out?.quitToTitle).toBe(true);
      expect(app.went).toEqual(['title']);
    });
  }
});
