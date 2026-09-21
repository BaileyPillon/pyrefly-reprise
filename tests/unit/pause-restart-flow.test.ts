// @vitest-environment jsdom
/**
 * RESTART ENCOUNTER, on the path a player actually takes.
 *
 * Preserved function 2 of `docs/concepts/pause-until-dawn/options.json`: the
 * remade pause screen keeps the old menu's RESTART ENCOUNTER, on the OPTIONS
 * tab. It calls `BattleScreen.requestExit('restart')`, which aborts the fight,
 * lets the flow unwind and then asks `App.runChapter` for the same chapter
 * again.
 *
 * Measured against the live build: through the debug one-shot harness
 * (`gotoChapter`, `skipPrep`) the row restarts; entered the way a player
 * enters a chapter — board, prep, fight — the pause closes and the screen sits
 * on chapter select for good. The difference is nothing to do with the pause
 * screen. `GameFlow.owned` still points at the battle screen from the previous
 * run, `main.ts` sent the player back to the board with `goto`, which is not a
 * flow navigation and never touched `owned`, and so the next run's first
 * `show` read a fresh start as "something navigated out from under us". Under
 * the debug harness there is no follow-up `goto`, `current` still equalled
 * `owned`, and the same row worked.
 *
 * This drives `GameFlow` against the same `FakeApp` shape
 * `flow-post-scene.test.ts` uses — the real flow, no renderer — and asserts
 * the second run actually puts a battle up.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import {
  GameFlow,
  registerFlowScreens,
  resetFlowScreens,
  type FlowScreen,
} from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

const CHAPTER = CHAPTERS[0]!;

const shown: string[] = [];

/** A fight that ends the way RESTART ENCOUNTER ends one: aborted. */
class AbortedBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    this.done = Promise.resolve({
      chapterId: opts.chapter.id,
      outcome: 'aborted' as const,
      result: null,
      elapsedMs: 4000,
      links: 1,
      preview: false,
    });
  }
  override enter(): void {
    shown.push('battle');
  }
}

class FakePrep extends Screen implements FlowScreen<boolean> {
  readonly name = 'party-prep';
  readonly done = Promise.resolve(true);
  override enter(): void {
    shown.push('party-prep');
  }
}

/** Where `main.ts` sends the player once a chapter returns: `goto`, not `show`. */
class FakeBoard extends Screen {
  readonly name = 'chapter-select';
  override enter(): void {
    shown.push('chapter-select');
  }
}

/** Just enough `App` for `GameFlow`: the screen stack, the save store, `uiRoot`. */
class FakeApp {
  readonly uiRoot: HTMLElement;
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;

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
  shown.length = 0;
  document.body.innerHTML = '';
  resetFlowScreens();
  registerFlowScreens({
    partyPrep: () => new FakePrep(),
    battle: (opts) => new AbortedBattle(opts),
  });
  app = new FakeApp();
});

afterEach(() => {
  resetFlowScreens();
});

describe('a run started from outside the flow loop owns the stack', () => {
  it('restarts the encounter after the board has been shown in between', async () => {
    // 1. The chapter, entered the way a player enters one.
    const first = await app.flow.runChapter(CHAPTER.id, { skipCutscenes: true, skipResults: true });
    expect(first?.outcome, 'the fight ends aborted, as RESTART ends one').toBe('aborted');
    expect(shown).toEqual(['party-prep', 'battle']);

    // 2. `main.ts` sends the player back to the board: a `goto`, not a `show`.
    await app.replace(new FakeBoard());
    expect(app.current?.name).toBe('chapter-select');

    // 3. What `BattleScreen.requestExit('restart')` asks for once the unwind
    //    has finished.
    const again = await app.flow.runChapter(CHAPTER.id, {
      skipPrep: true,
      skipCutscenes: true,
      skipResults: true,
    });

    expect(again, 'the restart ran a chapter rather than standing down').not.toBeNull();
    expect(app.current?.name, 'RESTART ENCOUNTER puts a fight up, not the board').toBe('battle');
    expect(shown).toEqual(['party-prep', 'battle', 'chapter-select', 'battle']);
  });

  it('starts the next chapter the player picks, for the same reason', async () => {
    // The same stale `owned` sat under every second chapter of a session, not
    // only under RESTART: pick a chapter, finish it, come back to the board,
    // pick another.
    await app.flow.runChapter(CHAPTER.id, { skipCutscenes: true, skipResults: true });
    await app.replace(new FakeBoard());

    const second = CHAPTERS[1] ?? CHAPTER;
    const result = await app.flow.runChapter(second.id, { skipCutscenes: true, skipResults: true });
    expect(result).not.toBeNull();
    expect(app.current?.name).toBe('battle');
  });
});
