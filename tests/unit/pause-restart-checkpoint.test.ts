// @vitest-environment jsdom
/**
 * RESTART ENCOUNTER past a Save Sphere restarts that link, exactly as the
 * defeat panel's RETRY does (FA3 = b; `src/app/screens/pause/restartCarry.ts`).
 *
 * The pause row aborts the fight (`BattleScreen.requestExit('restart')`) and,
 * once the flow has unwound, asks `App.runChapter` for the same chapter with
 * `restart: true`. Driven here through the real `GameFlow` with the same
 * `FakeApp` shape as `flow-checkpoint-retry.test.ts`: the first run ends the
 * way the pause ends it (aborted, carrying the checkpoint the chain reached),
 * the second is the restart's own call.
 *
 * **Game case:** FFX-2 only in effect (Chapter XI's Sisters and Anima are the
 * only checkpoints); the second block pins every other chapter's restart, both
 * games, as it was: a fresh run from the first formation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { MAX_DRAWN_SEED, drawRunSeed, pinRunSeed } from '../../src/app/runSeed.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import {
  GameFlow,
  registerFlowScreens,
  resetFlowScreens,
  type FlowScreen,
  type RunChapterOptions,
} from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { checkpointAt, type ChainCheckpoint } from '../../src/app/screens/BattleChainCheckpoint.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { roadAnimaGroup, roadSistersGroup } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';

const ROAD = getChapter('ffx2-fallen-aeons')!;
/** What `BattleScreen.requestExit('restart')` passes. */
const RESTART: RunChapterOptions = { skipPrep: true, skipCutscenes: true, restart: true };

type Ending = { outcome: 'victory' | 'defeat' | 'aborted'; elapsedMs: number; checkpoint?: ChainCheckpoint };

const shown: string[] = [];
const battles: BattleScreenOptions[] = [];
let endings: Ending[] = [];

class ScriptedBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    battles.push(opts);
    const end = endings.shift() ?? { outcome: 'aborted', elapsedMs: 1 };
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

function checkpoint(link: 2 | 3): ChainCheckpoint {
  const group = link === 2 ? roadSistersGroup : roadAnimaGroup;
  const setup = { ...setupForChapter(ROAD, 1), enemies: group, condition: 'scripted' as const };
  return checkpointAt(link, group, setup)!;
}

/** Where `main.ts` sends the player between the two runs: the board, by `goto`. */
async function board(): Promise<void> {
  await app.replace(new Done('chapter-select', null));
}

describe('Chapter XI: RESTART ENCOUNTER past a Save Sphere restarts that link (FA3 = b)', () => {
  it('restart at the Sisters re-enters the Sisters, reseeded, no prep, timed from the start: as RETRY does', async () => {
    const sisters = checkpoint(2);
    endings = [
      { outcome: 'aborted', elapsedMs: 40_000, checkpoint: sisters },
      { outcome: 'victory', elapsedMs: 70_000, checkpoint: checkpoint(3) },
    ];
    const first = await app.flow.runChapter(ROAD.id, { skipCutscenes: true, speed: 'skip' });
    expect(first?.outcome).toBe('aborted');
    await board();
    const result = await app.flow.runChapter(ROAD.id, RESTART);

    expect(battles.map((b) => b.resumeAt?.link ?? 1)).toEqual([1, 2]);
    expect(battles[1]!.resumeAt).toBe(sisters);
    // The same values the RETRY test pins (`flow-checkpoint-retry.test.ts`).
    expect(battles[1]!.seed).toBe(1001);
    expect(battles[1]!.speed).toBe('skip');
    expect(shown).toEqual(['party-prep', 'battle', 'chapter-select', 'battle', 'results']);
    expect(result?.elapsedMs).toBe(110_000);
    expect(panels.at(-1)).toEqual({ outcome: 'victory', elapsedMs: 110_000 });
  });

  it('RESTART and RETRY land on the same link with the same seed', async () => {
    endings = [{ outcome: 'defeat', elapsedMs: 10, checkpoint: checkpoint(2) }, { outcome: 'defeat', elapsedMs: 10 }];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true, seed: 7 });
    const retried = battles[1]!;

    battles.length = 0;
    endings = [{ outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(2) }, { outcome: 'aborted', elapsedMs: 10 }];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true, seed: 7 });
    await board();
    await app.flow.runChapter(ROAD.id, RESTART);
    const restarted = battles[1]!;

    expect(restarted.resumeAt?.link).toBe(retried.resumeAt?.link);
    expect(restarted.seed).toBe(retried.seed);
    expect(restarted.seed).toBe(1007);
  });

  it('restart at Anima after a Sisters restart re-enters Anima, reseeded per attempt as RETRY is', async () => {
    endings = [
      { outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(2) },
      { outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(3) },
      { outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(3) },
    ];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true });
    await app.flow.runChapter(ROAD.id, RESTART);
    await app.flow.runChapter(ROAD.id, RESTART);
    expect(battles.map((b) => b.resumeAt?.link ?? 1)).toEqual([1, 2, 3]);
    expect(battles.map((b) => b.seed)).toEqual([1, 1001, 2001]);
  });

  it('restart before the first Save Sphere (at Shiva) starts the Road over, as before', async () => {
    endings = [{ outcome: 'aborted', elapsedMs: 10 }];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true });
    await app.flow.runChapter(ROAD.id, RESTART);
    expect(battles.map((b) => b.resumeAt)).toEqual([undefined, undefined]);
    expect(battles.map((b) => b.seed)).toEqual([1, 1]);
  });

  it('the checkpoint is for the restart only: CHAPTER SELECT then picking the Road starts at Shiva, through prep', async () => {
    endings = [{ outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(2) }];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true });
    await board();
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true });
    // Even a restart after that fresh run has nothing to resume.
    await app.flow.runChapter(ROAD.id, RESTART);
    expect(battles.map((b) => b.resumeAt)).toEqual([undefined, undefined, undefined]);
    expect(shown.filter((s) => s === 'party-prep')).toHaveLength(2);
    expect(JSON.stringify(app.save)).not.toContain('checkpoint');
  });

  it('a run that is not a restart never picks the memory up (the debug harness, another chapter)', async () => {
    endings = [{ outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(2) }];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true });
    await app.flow.runChapter(ROAD.id, { skipPrep: true, skipCutscenes: true, seed: 3 });
    endings = [{ outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(2) }];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true });
    await app.flow.runChapter(CHAPTERS[0]!.id, RESTART);
    expect(battles.map((b) => b.resumeAt)).toEqual([undefined, undefined, undefined, undefined]);
  });
});

describe('every other chapter restarts exactly as before (both games)', () => {
  const others = [...CHAPTERS, ...UNLISTED_CHAPTERS].filter((c) => c.id !== ROAD.id);
  for (const chapter of others) {
    it(`${chapter.number}. ${chapter.id}: RESTART is a fresh run from the first formation, on the restart's options`, async () => {
      endings = [{ outcome: 'aborted', elapsedMs: 5_000 }, { outcome: 'victory', elapsedMs: 6_000 }];
      await app.flow.runChapter(chapter.id, { skipCutscenes: true, seed: 9, speed: 'skip' });
      await board();
      const result = await app.flow.runChapter(chapter.id, RESTART);
      expect(battles.map((b) => b.resumeAt)).toEqual([undefined, undefined]);
      expect(battles[1]!.seed).toBe(1);
      expect(battles[1]!.speed).toBeUndefined();
      expect(shown).toEqual(['party-prep', 'battle', 'chapter-select', 'battle', 'results']);
      expect(result?.elapsedMs).toBe(6_000);
    });
  }
});

/**
 * PR-0008 (decisions-2026-09-25 item 5, option B). **Both games (shared plumbing).** A run that
 * names no seed draws a fresh one, so a newcomer's first attempt is not seed 1 every time; a
 * RETRY still adds 1000; a RESTART that resumes a checkpoint keeps the run's drawn seed; and a
 * caller that names a seed (tests, the critic, `__pyrefly.gotoChapter`) gets exactly that seed.
 */
describe('the first attempt draws a fresh seed (PR-0008)', () => {
  const FLUX = getChapter('seymour-flux')!;
  const seedAt = (r: number) => 1 + Math.floor(r * MAX_DRAWN_SEED);
  beforeEach(() => pinRunSeed(null));
  afterEach(() => vi.restoreAllMocks());

  it('draws in 1..MAX, and a pin (the debug setSeed) overrides the draw', () => {
    expect(drawRunSeed(() => 0)).toBe(1);
    expect(drawRunSeed(() => 1 - 2 ** -53)).toBe(MAX_DRAWN_SEED); // Math.random's largest value
    pinRunSeed(1);
    expect(drawRunSeed(() => 0.5)).toBe(1);
  });

  it('a run from real keys fights on a drawn seed, and RETRY adds 1000 to it', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    endings = [{ outcome: 'defeat', elapsedMs: 10 }, { outcome: 'defeat', elapsedMs: 10 }];
    choices = ['retry', 'chapter-select'];
    await app.flow.runChapter(FLUX.id, { skipCutscenes: true });
    expect(battles.map((b) => b.seed)).toEqual([seedAt(0.25), seedAt(0.25) + 1000]);
    expect(seedAt(0.25)).not.toBe(1);
  });

  it('two fresh runs draw two seeds; a named seed is used as given', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);
    await app.flow.runChapter(FLUX.id, { skipCutscenes: true });
    await app.flow.runChapter(FLUX.id, { skipCutscenes: true });
    await app.flow.runChapter(FLUX.id, { skipCutscenes: true, seed: 7 });
    expect(battles.map((b) => b.seed)).toEqual([seedAt(0.1), seedAt(0.2), 7]);
  });

  it('RESTART past a Save Sphere keeps the run’s drawn seed rather than drawing again', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.3).mockReturnValueOnce(0.9);
    endings = [{ outcome: 'aborted', elapsedMs: 10, checkpoint: checkpoint(2) }, { outcome: 'aborted', elapsedMs: 10 }];
    await app.flow.runChapter(ROAD.id, { skipCutscenes: true });
    await board();
    await app.flow.runChapter(ROAD.id, RESTART);
    expect(battles.map((b) => b.seed)).toEqual([seedAt(0.3), seedAt(0.3) + 1000]);
  });
});
