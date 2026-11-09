// @vitest-environment jsdom
/**
 * The hidden Jenova LIFE chapter is registered, hidden, and runs end to end (chapter 44; FF7 only): the record, the numbers
 * (no two chapters share one), the scene and its registrations, the flow into the experiments' store, and that nothing it
 * added disturbs the Guard Scorpion chapter's staging.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { ff7LayoutFor } from '../../src/scenes/forgotten-capital-staging.ts';
import { sector1Layout, strikeSpot, SECTOR1_DESK, SECTOR1_BOSS_FRONT } from '../../src/scenes/sector1-reactor-staging.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { plateUrlFor } from '../../src/app/screens/battlePreload.ts';
import { pyreflyCanonFor } from '../../src/engine/pyreflyCanon.ts';
import { getSceneFactory, sceneKeys } from '../../src/scenes/index.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { FORGOTTEN_CAPITAL_HEIGHTS } from '../../src/scenes/forgotten-capital-staging.ts';
import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { EXPERIMENTS_KEY, experimentRecord } from '../../src/app/experiments/experimentRecords.ts';
import { ff7Registry, forgottenCapitalBuild, jenovaLifeGroup } from '../../src/data/ff7/index.ts';
import { ff7FxFor } from '../../src/engine/spellfx/ff7/ff7FxSpecs.ts';

const ID = 'ff7-jenova-life';

describe('registration', () => {
  it('is registered as a hidden FF7 experiment, number 44, in EXPERIMENT_CHAPTERS and nowhere else', () => {
    const chapter = getChapter(ID);
    expect(chapter).toMatchObject({ id: ID, game: 'ff7', number: 44, experimental: true, sceneKey: 'forgotten-capital' });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(ID);
    expect(CHAPTERS.some((c) => c.id === (ID as never))).toBe(false);
    expect((CHAPTER_IDS as readonly string[]).includes(ID)).toBe(false);
    expect(chapter?.buildRef).toBe(forgottenCapitalBuild);
    expect(chapter?.enemyGroupRef).toBe(jenovaLifeGroup);
    expect(chapter?.enemyGroupRef.canEscape).toBe(false);
  });

  it('is silent (no retail cue may ship, rule 8, and an original needs Bailey\'s ear, rule 13) and has no pause record', () => {
    const chapter = getChapter(ID)!;
    expect(chapter.music.scene).toBeNull();
    expect(chapter.music.battle).toBeNull();
    expect(chapter.music.victory).toBeUndefined();
  });

  it('holds three party members and one enemy, all FF7\'s', () => {
    const chapter = getChapter(ID)!;
    expect(chapter.buildRef.game).toBe('ff7');
    expect((chapter.buildRef as typeof forgottenCapitalBuild).activeSlots).toEqual(['cloud', 'tifa', 'barret']);
    expect(chapter.enemyGroupRef.game).toBe('ff7');
    expect(chapter.enemyGroupRef.enemies.map((e) => e.id)).toEqual(['jenova-life']);
  });

  it('shares no number with any other chapter and puts no tile on the board', () => {
    const numbers = EXPERIMENT_CHAPTERS.map((c) => c.number);
    expect(numbers.filter((n) => n === 44)).toHaveLength(1);
    const tiles = buildChapterTiles(new SaveStore());
    expect(tiles.some((t) => t.id === (ID as never))).toBe(false);
  });
});

describe('the scene', () => {
  it('is registered with a factory and slots for three, and stands on the reactor plate until the altar is painted', () => {
    expect(sceneKeys()).toContain('forgotten-capital');
    expect(getSceneFactory('forgotten-capital')).toBeTypeOf('function');
    expect(plateUrlFor('forgotten-capital')).toMatch(/art\/backdrops\/ff7-film-reactor\.png$/);
    expect(pyreflyCanonFor('forgotten-capital')).toMatchObject({ game: 'ff7', verdict: 'absent' });
  });

  it('the layout follows the boss: Jenova\'s field for her, the reactor\'s for the Guard Scorpion (so the older chapter reads what it always read)', () => {
    expect(ff7LayoutFor('guard-scorpion', 16 / 9)).toBe(sector1Layout(16 / 9));
    expect(ff7LayoutFor(undefined, 16 / 9)).toBe(sector1Layout(16 / 9));
    const jl = ff7LayoutFor('jenova-life', 16 / 9);
    expect(jl).not.toBe(sector1Layout(16 / 9));
    expect(jl.front).toHaveLength(3);
    expect(jl.boss).toEqual(SECTOR1_DESK.boss);
    expect(ff7LayoutFor('jenova-life', 390 / 844).front).toHaveLength(3);
    // Tifa (slot 1) stands on the reactor frame's nearest spot and Barret (slot 2) on his upstage one.
    expect(jl.front[1]).toEqual(SECTOR1_DESK.front[2]);
    expect(jl.front[2]).toEqual(SECTOR1_DESK.front[1]);
    expect(FORGOTTEN_CAPITAL_HEIGHTS['jenova-life']).toBeGreaterThan(FORGOTTEN_CAPITAL_HEIGHTS.cloud);
  });

  it('a melee attacker stops in front of Jenova, not of the scorpion\'s rifles; the Guard Scorpion\'s strike point is unchanged', () => {
    expect(strikeSpot(SECTOR1_DESK)[0]).toBeCloseTo(SECTOR1_DESK.boss[0] - SECTOR1_BOSS_FRONT - SECTOR1_DESK.strikeGap, 9);
    const jl = ff7LayoutFor('jenova-life', 16 / 9);
    expect(strikeSpot(jl)[0]).toBeCloseTo(jl.boss[0] - (jl.bossFront ?? 0) - jl.strikeGap, 9);
    expect(strikeSpot(jl)[0]).not.toBeCloseTo(strikeSpot(SECTOR1_DESK)[0], 3);
  });
});

describe('the effects are stand-ins on the existing kit (the art list says what is owed)', () => {
  it('every ability of the chapter resolves to an FF7 effect or the house bloom, never to nothing', () => {
    const reg = ff7Registry();
    for (const id of Object.keys(reg.abilities)) {
      const fx = ff7FxFor(id, id === 'attack' ? 'tifa' : undefined, reg.abilities[id]?.heals === true);
      expect(typeof fx, id).toBe('string');
    }
    expect(ff7FxFor('bolt3', 'cloud', false)).toBe('ff7-bolt');
    expect(ff7FxFor('satellite-beam', 'barret', false)).toBe('ff7-bigshot');
    expect(ff7FxFor('dolphin-blow', 'tifa', false)).toBe('ff7-slash');
    expect(ff7FxFor('attack', 'tifa', false)).toBe('ff7-slash');
    for (const own of ['quake2', 'fire3', 'blue-light', 'blue-flame', 'aqualung', 'jenova-reflect']) expect(ff7FxFor(own, undefined, false), own).toBe('bloom');
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
      result: outcome === 'victory' ? ({ turns: 12, elapsedMs: 0, elapsedTicks: 0 } as never) : null,
      elapsedMs: 110_000,
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
let outcome: 'victory' | 'defeat' = 'victory';
const QUIET = { speed: 'skip', skipResults: true } as const;

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

describe('the flow and the save', () => {
  it('with the switch off the chapter is an inert holding state: no battle, no write anywhere', async () => {
    setFf7ExperimentReadyForTests(false);
    const app = new FakeApp();
    const raw = localStorage.getItem(SAVE_KEY);
    await expect(app.flow.runChapter(ID, {})).resolves.toBeNull();
    expect(battles).toHaveLength(0);
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(localStorage.getItem(EXPERIMENTS_KEY)).toBeNull();
  });

  it('with the switch on, a win goes to the experiments\' store and the save is untouched; a loss reseeds the retry; an automated win sets no best time', async () => {
    setFf7ExperimentReadyForTests(true);
    const app = new FakeApp();
    app.save.recordAttempt('seymour-flux');
    const raw = localStorage.getItem(SAVE_KEY);
    const result = await app.flow.runChapter(ID, { seed: 9, ...QUIET });
    expect(result?.outcome).toBe('victory');
    expect(battles[0]!.chapter.id).toBe(ID);
    expect(battles[0]!.seed).toBe(9);
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
    expect(app.save.value.chapters[ID as never]).toBeUndefined();
    expect(experimentRecord(ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 110_000 });
    outcome = 'defeat';
    expect((await app.flow.runChapter(ID, { ...QUIET }))?.outcome).toBe('defeat');
    outcome = 'victory';
    await app.flow.runChapter(ID, { auto: 'aggressive' as never, ...QUIET });
    expect(experimentRecord(ID)).toMatchObject({ attempts: 3, clears: 2, bestTimeMs: 110_000 });
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw);
  });
});
