// @vitest-environment jsdom
/**
 * The hidden FF7 experiment is registered, and the board and the save cannot see it.
 *
 * `docs/plans/ff7-guard-scorpion-architecture.md` §2 and invariants I2 and I3:
 * no card, no FF7 group, no count, `CHAPTER_IDS` unchanged, `getChapter` finds
 * it; `runChapter` hands it to `BattleScreenExperiment.ts`, which is an inert
 * holding state while `FF7_EXPERIMENT_READY` is off and, when on, never writes
 * `pyrefly-reprise:save:v1` (only `pyrefly-reprise:experiments:v1`).
 *
 * Game case: FF7 only (the record); the board, the flow and the save are shared
 * plumbing, which must come out unchanged for FFX and FFX-2.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import {
  ARC_FINALE,
  GameFlow,
  arcCleared,
  registerFlowScreens,
  resetFlowScreens,
  type FlowScreen,
} from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { buildChapterTiles, groupChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY, experimentRecord } from '../../src/app/experiments/experimentRecords.ts';

const ID = 'ff7-guard-scorpion';

describe('registration', () => {
  it('is registered, unlisted, experimental and FF7', () => {
    const chapter = getChapter(ID);
    expect(chapter?.game).toBe('ff7');
    expect(chapter?.experimental).toBe(true);
    expect(chapter?.number).toBe(0);
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).toContain(ID);
    expect(chapter?.buildRef.game).toBe('ff7');
    expect(chapter?.enemyGroupRef.game).toBe('ff7');
    expect(chapter?.enemyGroupRef.canEscape).toBe(false);
  });

  it('is silent: no FFX or FFX-2 cue is borrowed, and no retail cue exists (rules 8, 13)', () => {
    const chapter = getChapter(ID)!;
    expect(chapter.music.scene).toBeNull();
    expect(chapter.music.battle).toBeNull();
    expect(chapter.music.victory).toBeUndefined();
  });

  it('is in no list: CHAPTERS keeps eighteen, CHAPTER_IDS never names it', () => {
    expect(CHAPTERS).toHaveLength(18);
    expect(CHAPTERS.some((c) => c.game === 'ff7' || c.experimental)).toBe(false);
    expect(CHAPTER_IDS).toHaveLength(18);
    expect(CHAPTER_IDS as readonly string[]).not.toContain(ID);
  });

  it('never ends an arc and has no arc finale', () => {
    expect(arcCleared('ff7', () => true)).toBe(false);
    expect(Object.keys(ARC_FINALE).sort()).toEqual(['ffx', 'ffx2']);
  });
});

describe('the board (invariant I2)', () => {
  beforeEach(() => localStorage.clear());

  it('has eighteen tiles in two groups, none of them FF7, even with a record in the experiments store', () => {
    localStorage.setItem(EXPERIMENTS_KEY, JSON.stringify({ [ID]: { attempts: 3, clears: 2 } }));
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles).toHaveLength(18); // the eighteen: the Leblanc preview is hidden too (its word, `exp-leblanc-door.test.ts`)
    expect(tiles.some((t) => t.id === ID || (t.game as string) === 'ff7')).toBe(false);
    expect(groupChapterTiles(tiles).map((g) => g.game)).toEqual(['ffx', 'ffx2']);
    expect(boardProgress(tiles, 0).beaten).toBe(0);
  });
});

// --------------------------------------------------------------- the flow

class StandInBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions, outcome: 'victory' | 'defeat') {
    super();
    battles.push(opts);
    this.done = Promise.resolve({
      chapterId: opts.chapter.id,
      outcome,
      result: outcome === 'victory' ? ({ turns: 7, elapsedMs: 0, elapsedTicks: 0 } as never) : null,
      elapsedMs: 95_000,
      links: 1,
      preview: false,
    });
  }
}

class FakeApp {
  readonly uiRoot = document.body.appendChild(document.createElement('div'));
  readonly save = new SaveStore();
  readonly flow = new GameFlow(this as unknown as App);
  current: Screen | null = null;
  async replace(screen: Screen): Promise<void> {
    await this.current?.exit();
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    this.current = screen;
    await screen.enter();
  }
  fade(): Promise<void> {
    return Promise.resolve();
  }
  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

let battles: BattleScreenOptions[] = [];
/** No swirl and no results panel: these checks are about the save (the panel loop: `ff7-flow.test.ts`). */
const QUIET = { speed: 'skip', skipResults: true } as const;
let outcome: 'victory' | 'defeat' = 'victory';

beforeEach(() => {
  battles = [];
  outcome = 'victory';
  localStorage.clear();
  resetFlowScreens();
  registerFlowScreens({ battle: (opts) => new StandInBattle(opts, outcome) });
});

afterEach(() => {
  setFf7ExperimentReadyForTests(null);
  resetFlowScreens();
});

function seededSave(): { app: FakeApp; raw: string | null } {
  const app = new FakeApp();
  app.save.recordAttempt('seymour-flux');
  app.save.recordClear('yunalesca', 300_000, 20);
  return { app, raw: localStorage.getItem(SAVE_KEY) };
}

describe('the flow and the save (invariant I3)', () => {
  it('with the switch off, runChapter is an inert holding state: no battle, no write anywhere', async () => {
    setFf7ExperimentReadyForTests(false);
    const { app, raw } = seededSave();
    expect(raw).not.toBeNull();
    await expect(app.flow.runChapter(ID, {})).resolves.toBeNull();
    expect(battles).toHaveLength(0);
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
  });

  it('with the switch on, a win goes to the experiments store and leaves the save byte-identical', async () => {
    setFf7ExperimentReadyForTests(true);
    const { app, raw } = seededSave();
    const result = await app.flow.runChapter(ID, { seed: 7, ...QUIET });
    expect(result?.outcome).toBe('victory');
    expect(battles).toHaveLength(1);
    expect(battles[0]!.chapter.id).toBe(ID);
    expect(battles[0]!.seed).toBe(7);
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(app.save.value.chapters[ID]).toBeUndefined();
    const record = experimentRecord(ID);
    expect(record.attempts).toBe(1);
    expect(record.clears).toBe(1);
    expect(record.bestTimeMs).toBe(95_000);
  });

  it('with the switch on, a loss and an automated win never touch the save or set a best time', async () => {
    setFf7ExperimentReadyForTests(true);
    const { app, raw } = seededSave();
    outcome = 'defeat';
    expect((await app.flow.runChapter(ID, { ...QUIET }))?.outcome).toBe('defeat');
    outcome = 'victory';
    expect((await app.flow.runChapter(ID, { auto: 'aggressive' as never, ...QUIET }))?.outcome).toBe('victory');
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(experimentRecord(ID)).toMatchObject({ attempts: 2, clears: 1, bestTimeMs: null });
  });

  it('leaves every listed chapter on the old path: through prep, never the experiments store', async () => {
    const app = new FakeApp();
    let preps = 0;
    class BackOut extends Screen implements FlowScreen<boolean> {
      readonly name = 'party-prep';
      readonly done = Promise.resolve(false);
      override enter(): void {
        preps++;
      }
    }
    registerFlowScreens({ partyPrep: () => new BackOut() });
    await expect(app.flow.runChapter('seymour-flux', {})).resolves.toBeNull();
    expect(preps).toBe(1);
    expect(localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
  });
});
