// @vitest-environment jsdom
/**
 * FA3 = b through the real `GameFlow`: RETRY after a loss past a Save Sphere
 * re-enters the battle **at that link**, and every other retry is unchanged.
 *
 * **Game case:** the behaviour is FFX-2 only (Chapter XI's Sisters and Anima
 * are the only checkpoints); the flow code is shared plumbing, so the second
 * block pins the FFX and other FFX-2 retries as they were: back through the
 * prep menu, from the first formation.
 *
 * Same `FakeApp` shape as `pause-restart-flow.test.ts`: the real flow, no
 * renderer, a battle stand-in that ends each attempt the way the test says.
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
import { checkpointAt, type ChainCheckpoint } from '../../src/app/screens/BattleChainCheckpoint.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { roadAnimaGroup, roadSistersGroup } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';

const ROAD = getChapter('ffx2-fallen-aeons')!;

type Ending = { outcome: 'victory' | 'defeat'; elapsedMs: number; checkpoint?: ChainCheckpoint };

const shown: string[] = [];
const battles: BattleScreenOptions[] = [];
let endings: Ending[] = [];

class ScriptedBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    battles.push(opts);
    const end = endings.shift() ?? { outcome: 'defeat', elapsedMs: 1 };
    this.done = Promise.resolve({
      chapterId: opts.chapter.id,
      outcome: end.outcome,
      result: end.outcome === 'victory' ? ({ turns: 9, elapsedMs: 0, elapsedTicks: 0 } as never) : null,
      elapsedMs: end.elapsedMs,
      links: end.checkpoint?.link ?? 1,
      preview: false,
      ...(end.checkpoint ? { checkpoint: end.checkpoint } : {}),
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

/** What the defeat panel answers, in order; victory panels are not asked. */
let choices: Array<'retry' | 'chapter-select'> = [];
const panels: Array<{ outcome: string; elapsedMs: number | undefined }> = [];

let app: FakeApp;

beforeEach(() => {
  pinRunSeed(1); // this file pins the flow's seed arithmetic on seed 1 (a real run draws one, PR-0008)
  shown.length = 0;
  battles.length = 0;
  panels.length = 0;
  endings = [];
  choices = [];
  document.body.innerHTML = '';
  resetFlowScreens();
  registerFlowScreens({
    partyPrep: () => new Done('party-prep', true),
    battle: (opts) => new ScriptedBattle(opts),
    results: (opts) => {
      panels.push({ outcome: opts.outcome, elapsedMs: opts.elapsedMs });
      if (opts.outcome === 'defeat') opts.onChoice?.(choices.shift() ?? 'chapter-select');
      return new Done('results', undefined);
    },
  });
  app = new FakeApp();
});

afterEach(() => {
  resetFlowScreens();
  pinRunSeed(null);
});

/** The checkpoint a real chain would hand back after entering `link`. */
function checkpoint(link: 2 | 3): ChainCheckpoint {
  const group = link === 2 ? roadSistersGroup : roadAnimaGroup;
  const setup = { ...setupForChapter(ROAD, 1), enemies: group, condition: 'scripted' as const };
  return checkpointAt(link, group, setup)!;
}

describe('Chapter XI: RETRY lands on the link that was lost (FA3 = b)', () => {
  it('lose to the Sisters, RETRY: the next battle opens on the Sisters, with no prep menu', async () => {
    const sisters = checkpoint(2);
    endings = [
      { outcome: 'defeat', elapsedMs: 40_000, checkpoint: sisters },
      { outcome: 'victory', elapsedMs: 70_000, checkpoint: checkpoint(3) },
    ];
    choices = ['retry'];
    const result = await app.flow.runChapter(ROAD.id, { skipCutscenes: true, speed: 'skip' });

    expect(battles).toHaveLength(2);
    expect(battles[0]!.resumeAt).toBeUndefined();
    expect(battles[1]!.resumeAt).toBe(sisters);
    expect(battles[1]!.resumeAt?.group.id).toBe('ffx2-road-magus-sisters');
    // Reseeded like every retry, so the lost fight does not replay verbatim.
    expect(battles[1]!.seed).toBe(1001);
    expect(shown).toEqual(['party-prep', 'battle', 'results', 'battle', 'results']);
    // The clear is timed from the chapter's start, the lost attempt included.
    expect(result?.elapsedMs).toBe(110_000);
    expect(panels.at(-1)).toEqual({ outcome: 'victory', elapsedMs: 110_000 });
  });

  it('lose to Anima after a Sisters retry: the next retry opens on Anima', async () => {
    endings = [
      { outcome: 'defeat', elapsedMs: 10, checkpoint: checkpoint(2) },
      { outcome: 'defeat', elapsedMs: 10, checkpoint: checkpoint(3) },
      { outcome: 'defeat', elapsedMs: 10, checkpoint: checkpoint(3) },
    ];
    choices = ['retry', 'retry', 'chapter-select'];
    const result = await app.flow.runChapter(ROAD.id, { skipCutscenes: true, speed: 'skip' });
    expect(battles.map((b) => b.resumeAt?.link ?? 1)).toEqual([1, 2, 3]);
    expect(result?.outcome).toBe('defeat');
  });

  it('a loss at Shiva has no checkpoint: RETRY starts the Road over, through prep', async () => {
    endings = [{ outcome: 'defeat', elapsedMs: 10 }, { outcome: 'defeat', elapsedMs: 10 }];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true, speed: 'skip' });
    expect(battles.map((b) => b.resumeAt)).toEqual([undefined, undefined]);
    expect(shown.filter((s) => s === 'party-prep')).toHaveLength(2);
  });

  it('the checkpoint is kept for the run only: CHAPTER SELECT then a new run starts at Shiva', async () => {
    endings = [{ outcome: 'defeat', elapsedMs: 10, checkpoint: checkpoint(2) }];
    choices = ['chapter-select'];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true, speed: 'skip' });
    endings = [{ outcome: 'defeat', elapsedMs: 10 }];
    choices = ['chapter-select'];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true, speed: 'skip' });
    expect(battles.map((b) => b.resumeAt)).toEqual([undefined, undefined]);
    expect(JSON.stringify(app.save)).not.toContain('checkpoint');
  });

  it('the debug harness (gotoChapter: no prep, results shown) retries at the checkpoint too', async () => {
    endings = [
      { outcome: 'defeat', elapsedMs: 10, checkpoint: checkpoint(2) },
      { outcome: 'defeat', elapsedMs: 10, checkpoint: checkpoint(2) },
    ];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true, skipPrep: true, speed: 'skip' });
    expect(battles.map((b) => b.resumeAt?.link ?? 1)).toEqual([1, 2]);
    expect(shown).not.toContain('party-prep');
  });
});

describe('every other chapter retries exactly as before', () => {
  for (const chapter of CHAPTERS) {
    it(`${chapter.number}. ${chapter.id}: RETRY goes back through prep to the first formation`, async () => {
      endings = [{ outcome: 'defeat', elapsedMs: 5_000 }, { outcome: 'victory', elapsedMs: 6_000 }];
      choices = ['retry'];
      const result = await app.flow.runChapter(chapter.id, { skipCutscenes: true, speed: 'skip' });
      expect(battles.map((b) => b.resumeAt)).toEqual([undefined, undefined]);
      expect(shown).toEqual(['party-prep', 'battle', 'results', 'party-prep', 'battle', 'results']);
      // No carried time without a checkpoint: the clear is the winning attempt's own.
      expect(result?.elapsedMs).toBe(6_000);
    });
  }
});
