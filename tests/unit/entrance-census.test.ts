/**
 * The entrance census (round 25's PR-0380; decision 61e; rule 3: proved by running the engine and the presenter, not by grepping).
 *
 * Every chapter of the game, the hidden ones included, is played to its end by the REAL engines, the REAL `BattlePresenter`, the REAL chain loop and the REAL `PaintedStage`
 * (`helpers/EntranceCensus.ts`), twice: once as the game was (`setEntrances(false)`: the stage builds each figure at full strength) and once as it is (the stage holds each enemy and aeon
 * unseen and the opening lets it in). For every figure the stage builds, on the first frame after it was built:
 *
 * - **before**, every enemy and aeon the stage builds enters in one frame: whole, with nothing between it and the player (the first staging is covered by the battle-start card and a link's
 *   re-staging by a wash or by nothing at all, but the continuity probe, which reads the canvas, sees it, and CHAPTER FRAMING's plan or a scene's follower then changes its size in one more);
 * - **after**, every one is held, and the opening lets it in by the entrance its body calls for (pyreflies for a fiend, an unsent, an aeon; a fade for a living person or a machine),
 *   whole by the first menu, and the first menu comes at the very time it did (nothing added).
 *
 * The party is untouched (the opening's own slide-in and fade carry it, as before). Set PYREFLY_PRINT=1 to print the list. Game case: both; each row is its own game's.
 */
import { describe, expect, it } from 'vitest';
import { observe, clock, built, stageCalls, running, makeStage, advance, CensusStage, FRAME, type CensusRun } from './helpers/EntranceCensus.ts';
import { FakeAudio } from './helpers/FakeStage.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { BattleEngine } from '../../src/battle/common/types.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { entranceBodyOf, sceneStagesEntrance } from '../../src/engine/entrance/entranceCanon.ts';
import { GATHER_MS } from '../../src/engine/entrance/entranceLook.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

/** Chapter III is walked on the seed that reaches its later links (the flow test's note). */
const SEED = (c: Chapter): number => (c.id === 'braskas-final-aeon' ? 7 : 1);
/** The chapters the census plays: the board's, the hidden ones, the experiments. FF7's Guard Scorpion is not Spira (no pyreflies): the stage never holds a figure there, so it is left out. */
const ALL: Chapter[] = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game !== 'ff7');

async function engineFor(chapter: Chapter, setup: ReturnType<typeof setupForChapter>): Promise<BattleEngine> {
  await registerBattleContent();
  const engine: BattleEngine = chapter.game === 'ffx' ? new FFXEngine({ autoResolveMinigames: true }) : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

async function runChapter(chapter: Chapter, entrances: boolean): Promise<CensusRun> {
  built.length = 0;
  stageCalls.n = 0;
  clock.now = 0;
  const seed = SEED(chapter);
  const setup = setupForChapter(chapter, seed);
  const engine = await engineFor(chapter, setup);
  const stage = makeStage(entrances);
  const census = new CensusStage(stage);
  running.stage = stage;
  const runStart: number[] = [];
  const firstMenuAt: number[] = [];
  const kinds = new Map<string, string>();
  let link = 0;
  observe.fn = (): void => {
    for (const p of stage.entranceSnapshot().playing) kinds.set(`${p.id}@${stageCalls.n}`, p.kind);
  };
  const presenter = new BattlePresenter({ stage: census, audio: new FakeAudio(), sleep: (ms: number) => (advance(stage, ms), Promise.resolve()) });
  presenter.setSpeed('normal');
  setCappedAutoPlay(presenter, (actorId, commands, e) => {
    if (firstMenuAt[link] === undefined) firstMenuAt[link] = clock.now;
    return intendedStrategy(actorId, commands, e);
  });
  await stage.stage(engine.state()); // the battle screen's first staging
  const result = await runEncounterChain({
    chapter,
    presenter,
    engine,
    stage: {
      stage: async (s) => {
        stageCalls.n++;
        await stage.stage(s);
      },
    },
    group: chapter.enemyGroupRef,
    setup,
    seed,
    findGroup: findEnemyGroup,
    audio: new FakeAudio(),
    onLink: (info) => {
      link = info.links;
      runStart[link] = clock.now;
    },
  });
  observe.fn = null;
  return { chapter: chapter.id, game: chapter.game, stage, census, built: [...built], firstMenuAt: firstMenuAt.map((t, i) => t - (runStart[i] ?? 0)), menuAbs: [...firstMenuAt], kinds, outcome: result.outcome.kind, links: result.links };
}

interface Row {
  chapter: string;
  game: string;
  number: number;
  link: number;
  id: string;
  side: string;
  /** `'stage'`: built by `PaintedStage.stage` (the first staging, a link's re-staging); `'added'`: a summon, a switch or a reveal, which the presenter fades in itself; `'part'`: a figure-less part on its parent's painting. */
  how: 'stage' | 'added' | 'part';
  /** How much of it is drawn on the first frame after it was built, 0..1. */
  first: number;
  /** The entrance it was played with (after), or ''. */
  entrance: string;
}

const rows = (run: CensusRun, number: number): Row[] =>
  run.built
    .filter((b) => b.side === 'enemy' || b.side === 'aeon')
    .map((b) => ({
      chapter: run.chapter,
      game: run.game,
      number,
      link: b.stageCall + 1,
      id: b.id,
      side: b.side,
      how: !b.figure ? ('part' as const) : b.viaStage ? ('stage' as const) : ('added' as const),
      first: Math.round(b.actor.shownAt(b.actor.built + FRAME) * 1000) / 1000,
      entrance: run.kinds.get(`${b.id}@${b.stageCall}`) ?? '',
    }));

const before = new Map<string, CensusRun>();
const after = new Map<string, CensusRun>();

describe('the census: every chapter, as the game was and as it is', () => {
  for (const chapter of ALL) {
    it(`${String(chapter.number).padStart(2)} ${chapter.id} (${chapter.game}): before, each enemy and aeon the stage builds is whole on its first frame; after, each is held, let in by the opening, whole by the first menu, which comes at the same time`, async () => {
      const b = await runChapter(chapter, false);
      const a = await runChapter(chapter, true);
      before.set(chapter.id, b);
      after.set(chapter.id, a);
      const rb = rows(b, chapter.number);
      const ra = rows(a, chapter.number);
      const stagedB = rb.filter((r) => r.how === 'stage');
      const stagedA = ra.filter((r) => r.how === 'stage');
      expect(stagedB.length, 'the chapter staged no enemy').toBeGreaterThan(0);
      // the same fight (the engine and the presenter are the same; only the stage differs) up to the links both reached
      const links = Math.min(b.links, a.links);
      const same = (r: Row): boolean => r.link <= links;
      expect(stagedA.filter(same).map((r) => `${r.link}:${r.id}`)).toEqual(stagedB.filter(same).map((r) => `${r.link}:${r.id}`));

      // a figure-less part (Vegnagun's Nodes, Bulwarks and Redoubts; Seymour Omnis's discs) has no painting to bring in: the stage never holds it, before or after
      const partsB = rb.filter((r) => r.how === 'part' && r.link <= links).map((r) => `${r.link}:${r.id}:${r.first}`);
      const partsA = ra.filter((r) => r.how === 'part' && r.link <= links).map((r) => `${r.link}:${r.id}:${r.first}`);
      expect(partsA.slice(0, Math.min(partsA.length, partsB.length)), 'a part is built the same before and after').toEqual(partsB.slice(0, Math.min(partsA.length, partsB.length)));
      // BEFORE: every enemy and aeon the stage builds is whole in one frame
      for (const r of stagedB) expect(r.first, `${r.id} (link ${r.link}) before`).toBeGreaterThan(0.9);

      // AFTER: held on the first frame, then let in by the entrance its body calls for (a figure whose scene stages its own entrance is left to it: the stage builds it, as before)
      for (const r of stagedA.filter((r) => sceneStagesEntrance(r.id))) expect(r.first, `${r.id} is the scene's to bring in`).toBeGreaterThan(0.9);
      for (const r of stagedA.filter((r) => !sceneStagesEntrance(r.id))) {
        expect(r.first, `${r.id} (link ${r.link}) is held on its first frame`).toBeLessThan(0.02);
        if (r.link > links) continue; // a link only one of the two runs reached
        expect(r.entrance, `${r.id} (link ${r.link}) was let in by an entrance`).toBe(entranceBodyOf(r.id) === 'plain' ? 'fade' : 'gather');
      }
      // whole at the first menu of its link
      for (const x of a.built.filter((x) => x.viaStage && !sceneStagesEntrance(x.id) && (x.side === 'enemy' || x.side === 'aeon') && x.stageCall + 1 <= links)) {
        const menu = a.menuAbs[x.stageCall + 1];
        if (menu === undefined) continue;
        expect(x.actor.alphaAt(menu), `${x.id} (link ${x.stageCall + 1}) is whole at the first menu`).toBeGreaterThan(0.99);
        expect(x.actor.dissolveAt(menu), `${x.id} (link ${x.stageCall + 1}) has nothing of its dissolve left at the first menu`).toBe(0);
      }
      // the first menu came at the very time it did: nothing was added before it
      for (let k = 1; k <= links; k++) {
        if (b.firstMenuAt[k] === undefined || a.firstMenuAt[k] === undefined) continue;
        expect(a.firstMenuAt[k], `link ${k}: the first menu's time after the link began`).toBeCloseTo(b.firstMenuAt[k]!, 6);
      }
      // what the presenter adds itself (a summon, a switch-in, a reveal) fades in, before and after, exactly as it did
      const addedB = rb.filter((r) => r.how === 'added').map((r) => `${r.link}:${r.id}:${r.first}`);
      const addedA = ra.filter((r) => r.how === 'added' && r.link <= links).map((r) => `${r.link}:${r.id}:${r.first}`);
      expect(addedA.slice(0, Math.min(addedA.length, addedB.length))).toEqual(addedB.slice(0, Math.min(addedA.length, addedB.length)));
      for (const r of rb.filter((r) => r.how === 'added')) expect(r.first, `${r.id} (added) is not whole on its first frame`).toBeLessThan(0.9);
      // the opening lets the figures in once per link, never instantly at normal speed
      expect(a.census.entered.length).toBe(a.links);
      expect(a.census.entered.every((e) => !e.instant)).toBe(true);
      expect(a.stage.entranceSnapshot()).toEqual({ held: [], playing: [] });
    }, 60_000);
  }

  it('the three entrances round 25 named, and the list of every one (set PYREFLY_PRINT=1 to print it)', () => {
    const find = (chapter: string, id: string, link = 1): { b: Row; a: Row } => {
      const b = rows(before.get(chapter)!, 0).find((r) => r.id === id && r.link === link && r.how === 'stage');
      const a = rows(after.get(chapter)!, 0).find((r) => r.id === id && r.link === link && r.how === 'stage');
      expect(b, `${chapter}/${id} before`).toBeDefined();
      expect(a, `${chapter}/${id} after`).toBeDefined();
      return { b: b!, a: a! };
    };
    // Anima at the Fallen Aeons seam (FFX-2, Chapter XI, link 3, under the Save Sphere's wash), Overdrive Sin (FFX, Chapter XVIII), Paragon (FFX-2, Chapter XIII)
    for (const [chapter, id, link, game] of [['ffx2-fallen-aeons', 'x2-anima', 3, 'ffx2'], ['sin-face', 'overdrive-sin', 1, 'ffx'], ['ffx2-trema', 'paragon', 1, 'ffx2']] as const) {
      if (!before.has(chapter)) continue; // run alone
      const { b, a } = find(chapter, id, link);
      expect(b.first).toBeGreaterThan(0.9);
      expect(a.first).toBeLessThan(0.02);
      expect(a.entrance).toBe('gather');
      expect(before.get(chapter)!.game).toBe(game);
    }
    const all = [...before.keys()].flatMap((c) => rows(before.get(c)!, 0).filter((r) => r.how === 'stage' && !sceneStagesEntrance(r.id)).map((rb) => ({ rb, ra: rows(after.get(c)!, 0).find((r) => r.id === rb.id && r.link === rb.link && r.how === 'stage') })));
    if (process.env['PYREFLY_PRINT']) {
      const lines = all.map(({ rb, ra }) => `${rb.game.padEnd(4)} ${rb.chapter.padEnd(24)} link ${rb.link} ${rb.id.padEnd(22)} ${rb.side.padEnd(5)} before ${rb.first} -> after ${ra?.first ?? '-'} (${ra?.entrance || 'not reached'})`);
      console.log(`\nENTRANCE CENSUS: ${all.length} figures in ${before.size} chapters\n${lines.join('\n')}`);
    }
    expect(all.length).toBeGreaterThan(30);
    void GATHER_MS;
  });
});
