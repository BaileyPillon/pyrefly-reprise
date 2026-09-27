// @vitest-environment jsdom
/**
 * PR-0215 (round 13, R13G-04): the FFX engine's stalemate watch ends a stuck
 * fight with `'escape'` ("The battle cannot be won from here.",
 * `src/battle/ffx/engine.ts`). The flow used to hand that outcome straight
 * back to `main.ts`, which put the player on chapter select with no results
 * and no RETRY after a 25-minute Chapter III.
 *
 * **Game case:** the stalemate rule is FFX only (the engine is unchanged);
 * the routing is shared plumbing, so it is pinned for both games: an
 * `'escape'` goes through the existing defeat panel, and its RETRY re-enters
 * the chapter exactly as a defeat's does.
 *
 * Restored in iter2-b5 (it was backed out with the routing in 7d3d9081 for want
 * of the card's wording). Bailey picked option B on 2026-09-27 (D-249, plan
 * section 8 Q6): the caption reads WITHDREW, and the engine's own line is set
 * where a victory card puts its quip. The flow hands that line to the panel.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { pinRunSeed } from '../../src/app/runSeed.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import {
  GameFlow,
  registerFlowScreens,
  resetFlowScreens,
  type FlowScreen,
} from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';

type Outcome = 'victory' | 'defeat' | 'escape';

const shown: string[] = [];
let endings: Outcome[] = [];
let choices: Array<'retry' | 'chapter-select'> = [];
const panels: string[] = [];
const lines: Array<string | undefined> = [];

class ScriptedBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    const outcome = endings.shift() ?? 'defeat';
    this.done = Promise.resolve({
      chapterId: opts.chapter.id,
      outcome,
      result: { outcome, turns: 334, elapsedTicks: 0 } as never,
      elapsedMs: 1_500_000,
      links: 1,
      preview: false,
      ...(outcome === 'escape' ? { withdrawLine: 'The battle cannot be won from here.' } : {}),
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
  pinRunSeed(1);
  shown.length = 0;
  panels.length = 0;
  lines.length = 0;
  endings = [];
  choices = [];
  document.body.innerHTML = '';
  resetFlowScreens();
  registerFlowScreens({
    partyPrep: () => new Done('party-prep', true),
    battle: (opts) => new ScriptedBattle(opts),
    results: (opts) => {
      panels.push(opts.outcome);
      lines.push(opts.withdrawLine);
      if (opts.outcome !== 'victory') opts.onChoice?.(choices.shift() ?? 'chapter-select');
      return new Done('results', undefined);
    },
  });
  app = new FakeApp();
});

afterEach(() => {
  resetFlowScreens();
  pinRunSeed(null);
});

describe('PR-0215: a stalemate (outcome "escape") gets the defeat panel with RETRY', () => {
  it('FFX Chapter III: the stalemate shows a results panel instead of dropping to chapter select', async () => {
    endings = ['escape'];
    choices = ['chapter-select'];
    const result = await app.flow.runChapter('braskas-final-aeon', { skipCutscenes: true, speed: 'skip' });
    expect(panels).toEqual(['escape']);
    expect(lines).toEqual(['The battle cannot be won from here.']);
    expect(shown).toEqual(['party-prep', 'battle', 'results']);
    expect(result?.outcome).toBe('escape');
  });

  it('RETRY on that panel re-enters the chapter through prep, like a defeat', async () => {
    endings = ['escape', 'victory'];
    choices = ['retry'];
    const result = await app.flow.runChapter('braskas-final-aeon', { skipCutscenes: true, speed: 'skip' });
    expect(shown).toEqual(['party-prep', 'battle', 'results', 'party-prep', 'battle', 'results']);
    expect(result?.outcome).toBe('victory');
  });

  it('an automated run (skipResults) still returns the outcome without a panel', async () => {
    endings = ['escape'];
    const result = await app.flow.runChapter('braskas-final-aeon', {
      skipCutscenes: true,
      skipPrep: true,
      skipResults: true,
      speed: 'skip',
    });
    expect(panels).toEqual([]);
    expect(result?.outcome).toBe('escape');
  });
});
