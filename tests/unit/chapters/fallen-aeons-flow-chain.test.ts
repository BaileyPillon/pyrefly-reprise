/**
 * Chapter XI's chain loop: FA3 = b (retry at the lost link) and O-4 = C (the
 * Save Sphere between links). **FFX-2 only** in effect [AGENTS.md rule 14]:
 * the flag that drives both, `restoresPartyOnEntry`, sits on the Sisters and
 * Anima links and nowhere else, and the last block proves every other chapter
 * chains exactly as before (no card, no checkpoint).
 *
 * The real FFX-2 engine and the real `runEncounterChain`; the presenter is a
 * script of outcomes, because what is under test is what the loop does between
 * links, not who wins them.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleSetup, BattleState, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain, type EncounterChainOptions } from '../../../src/app/screens/BattleEncounterChain.ts';
import { resumeSetup, type ChainCheckpoint } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import type { BattleOutcome, BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { CHAPTERS, getChapter, type Chapter } from '../../../src/data/encounters.ts';
import { UNLISTED_CHAPTERS } from '../../../src/data/chapters-unlisted.ts';
import { ROAD_ANIMA, ROAD_SHIVA, ROAD_SISTERS } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';

const CHAPTER = getChapter('ffx2-fallen-aeons')!;
const GIRLS = ['yuna', 'rikku', 'paine'];

type Kind = 'victory' | 'defeat';

/** A presenter that answers each link with the next scripted outcome. */
function scriptedPresenter(kinds: Kind[]) {
  const rec = { synced: 0, fought: [] as string[][] };
  const presenter = {
    syncHud: () => {
      rec.synced++;
    },
    run: async (engine: BattleEngine): Promise<BattleOutcome> => {
      rec.fought.push(engine.state().enemyIds.slice());
      const kind = kinds.shift() ?? 'defeat';
      return { kind, result: {} } as unknown as BattleOutcome;
    },
  };
  return { presenter: presenter as unknown as BattlePresenter, rec };
}

async function ffx2Engine(setup: BattleSetup): Promise<FFX2Engine> {
  await registerBattleContent();
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** The chapter's opening setup with every girl at 1 HP and 0 MP, so a restore shows. */
function battered(seed: number): BattleSetup {
  const setup = setupForChapter(CHAPTER, seed);
  const party = setup.party as Extract<BattleSetup['party'], { game: 'ffx2' }>;
  const members = party.members.map((m) => ({ ...m, hp: 1, mp: 0 })) as typeof party.members;
  return { ...setup, party: { ...party, members } };
}

function hpMp(engine: BattleEngine): Array<[number, number, number, number]> {
  const s = engine.state() as BattleState;
  return GIRLS.map((id) => {
    const c = s.combatants[id] as unknown as { hp: number; mp: number; stats: { maxHp: number; maxMp: number } };
    return [c.hp, c.stats.maxHp, c.mp, c.stats.maxMp];
  });
}

interface Run {
  outcome: BattleOutcome;
  links: number;
  checkpoint: ChainCheckpoint | null;
  spheres: Array<{ link: number; group: string; enemiesBefore: string[]; enemiesAfter: string[]; hpAfter: ReturnType<typeof hpMp> }>;
  fought: string[][];
  onLinks: number[];
  synced: number;
}

async function road(kinds: Kind[], extra: Partial<EncounterChainOptions> = {}, setup = battered(7)): Promise<Run> {
  const engine = await ffx2Engine(setup);
  const { presenter, rec } = scriptedPresenter(kinds);
  const spheres: Run['spheres'] = [];
  const onLinks: number[] = [];
  const result = await runEncounterChain({
    chapter: CHAPTER,
    presenter,
    engine,
    stage: { stage: async () => {} },
    group: extra.group ?? CHAPTER.enemyGroupRef,
    setup,
    seed: 7,
    findGroup: findEnemyGroup,
    saveSphere: async (swap, info) => {
      const enemiesBefore = engine.state().enemyIds.slice();
      await swap();
      spheres.push({ link: info.link, group: info.group.id, enemiesBefore, enemiesAfter: engine.state().enemyIds.slice(), hpAfter: hpMp(engine) });
    },
    onLink: ({ links }) => onLinks.push(links),
    ...extra,
  });
  return { ...result, spheres, fought: rec.fought, onLinks, synced: rec.synced };
}

describe('FA3 = b: a defeat retries at the link it was lost on', () => {
  it('a loss at Shiva leaves no checkpoint: the retry starts the Road over', async () => {
    const run = await road(['defeat']);
    expect(run.outcome.kind).toBe('defeat');
    expect(run.checkpoint).toBeNull();
    expect(run.spheres).toEqual([]);
  });

  it('win Shiva, lose to the Sisters: the checkpoint is the Sisters, link 2', async () => {
    const run = await road(['victory', 'defeat']);
    expect(run.outcome.kind).toBe('defeat');
    expect(run.links).toBe(2);
    expect(run.checkpoint?.group.id).toBe(ROAD_SISTERS);
    expect(run.checkpoint?.link).toBe(2);
    // The checkpoint is the setup the Sisters were entered on: the party as
    // carried out of Shiva (still battered here), which the engine refills.
    expect(run.checkpoint?.setup.enemies.id).toBe(ROAD_SISTERS);
    expect(run.checkpoint?.setup.condition).toBe('scripted');
  });

  it('win Shiva and the Sisters, lose to Anima: the checkpoint moves to Anima, link 3', async () => {
    const run = await road(['victory', 'victory', 'defeat']);
    expect(run.checkpoint?.group.id).toBe(ROAD_ANIMA);
    expect(run.checkpoint?.link).toBe(3);
    expect(run.links).toBe(3);
  });

  it('a retry from the Sisters checkpoint opens on the Sisters, numbered link 2, at full HP and MP', async () => {
    const first = await road(['victory', 'defeat']);
    const cp = first.checkpoint!;
    const retrySeed = 1007;
    const setup = resumeSetup(cp, retrySeed);
    expect(setup.seed).toBe(retrySeed + 1);
    const engine = await ffx2Engine(setup);
    // Opening state of the retry: the Sisters, every girl refilled.
    expect(engine.state().enemyIds).toEqual(['sandy', 'cindy', 'mindy']);
    for (const [hp, maxHp, mp, maxMp] of hpMp(engine)) {
      expect(hp).toBe(maxHp);
      expect(mp).toBe(maxMp);
    }
    const retry = await road(['defeat'], { group: cp.group, startLink: cp.link }, setup);
    expect(retry.onLinks).toEqual([2]);
    expect(retry.fought).toEqual([['sandy', 'cindy', 'mindy']]);
    expect(retry.checkpoint?.group.id).toBe(ROAD_SISTERS);
    expect(retry.links).toBe(2);
  });

  it('a Sisters retry that wins goes on to Anima through the Save Sphere, as link 3', async () => {
    const cp = (await road(['victory', 'defeat'])).checkpoint!;
    const retry = await road(['victory', 'defeat'], { group: cp.group, startLink: cp.link }, resumeSetup(cp, 2007));
    expect(retry.onLinks).toEqual([2, 3]);
    expect(retry.spheres.map((s) => [s.link, s.group])).toEqual([[3, ROAD_ANIMA]]);
    expect(retry.checkpoint?.link).toBe(3);
  });
});

describe('O-4 = C: the Save Sphere plays between links, and the swap happens under it', () => {
  it('plays once before the Sisters and once before Anima, never before Shiva', async () => {
    const run = await road(['victory', 'victory', 'victory']);
    expect(run.outcome.kind).toBe('victory');
    expect(run.spheres.map((s) => [s.link, s.group])).toEqual([
      [2, ROAD_SISTERS],
      [3, ROAD_ANIMA],
    ]);
  });

  it('the next formation is staged inside the card, and the HUD sees the refill before it clears', async () => {
    const run = await road(['victory', 'defeat']);
    const sphere = run.spheres[0]!;
    expect(sphere.enemiesBefore).toEqual(['x2-shiva']);
    expect(sphere.enemiesAfter).toEqual(['sandy', 'cindy', 'mindy']);
    for (const [hp, maxHp, mp, maxMp] of sphere.hpAfter) {
      expect(hp).toBe(maxHp);
      expect(mp).toBe(maxMp);
    }
    // Two link heads plus the one sync under the card.
    expect(run.synced).toBe(3);
  });

  it('with no card wired (an automated caller) the chain still restores and advances', async () => {
    const run = await road(['victory', 'defeat'], { saveSphere: undefined });
    expect(run.spheres).toEqual([]);
    expect(run.fought).toEqual([['x2-shiva'], ['sandy', 'cindy', 'mindy']]);
    expect(run.checkpoint?.group.id).toBe(ROAD_SISTERS);
  });

  it('a card that never calls swap cannot strand the fight', async () => {
    const run = await road(['victory', 'defeat'], { saveSphere: async () => {} });
    expect(run.fought).toEqual([['x2-shiva'], ['sandy', 'cindy', 'mindy']]);
  });
});

describe('every other chapter chains exactly as before', () => {
  /** A stand-in engine: the loop only needs init, a seed and a state to carry from. */
  function inertEngine(): BattleEngine {
    let enemies: string[] = [];
    return {
      setSeed: () => {},
      init: (setup: BattleSetup) => {
        enemies = setup.enemies.enemies.map((e) => e.id);
      },
      state: () => ({ combatants: {}, flags: {}, enemyIds: enemies }) as unknown as BattleState,
    } as unknown as BattleEngine;
  }

  async function groupsOf(chapter: Chapter): Promise<EnemyGroupDef[]> {
    const out = [chapter.enemyGroupRef];
    for (let g = chapter.enemyGroupRef; g.nextGroupId && out.length < 16; ) {
      const next = await findEnemyGroup(g.nextGroupId);
      if (!next) break;
      out.push(next);
      g = next;
    }
    return out;
  }

  const others = [...CHAPTERS, ...UNLISTED_CHAPTERS].filter((c) => c.id !== CHAPTER.id);

  it('covers every registered chapter but Chapter XI', () => {
    expect(others.length).toBeGreaterThanOrEqual(10);
  });

  for (const chapter of others) {
    it(`${chapter.number}. ${chapter.id}: no Save Sphere, no checkpoint, win or lose on any link`, async () => {
      const groups = await groupsOf(chapter);
      expect(groups.some((g) => g.restoresPartyOnEntry === true)).toBe(false);
      for (let lostAt = 1; lostAt <= groups.length; lostAt++) {
        const kinds: Kind[] = [...Array(lostAt - 1).fill('victory'), 'defeat'];
        let cards = 0;
        const { presenter } = scriptedPresenter(kinds);
        const setup = setupForChapter(chapter, 3);
        const engine = inertEngine();
        engine.init(setup);
        const result = await runEncounterChain({
          chapter,
          presenter,
          engine,
          stage: { stage: async () => {} },
          group: chapter.enemyGroupRef,
          setup,
          seed: 3,
          findGroup: findEnemyGroup,
          saveSphere: async (swap) => {
            cards++;
            await swap();
          },
        });
        expect(cards).toBe(0);
        expect(result.checkpoint).toBeNull();
        expect(result.links).toBe(lostAt);
      }
    });
  }
});

describe('the chain data behind it', () => {
  it('only the Sisters and Anima links carry the Save Sphere flag', async () => {
    const shiva = await findEnemyGroup(ROAD_SHIVA);
    expect(shiva?.restoresPartyOnEntry).toBeUndefined();
    expect((await findEnemyGroup(ROAD_SISTERS))?.restoresPartyOnEntry).toBe(true);
    expect((await findEnemyGroup(ROAD_ANIMA))?.restoresPartyOnEntry).toBe(true);
  });
});
