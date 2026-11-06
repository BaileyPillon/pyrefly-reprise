/**
 * Yuna's Ballad (the hidden FFX-2 chapter): the flow around the two duels, through the app's own path (`registerBattleContent`, `setupForChapter`, `findEnemyGroup`, `setupForNextLink`, the retry checkpoint), every link
 * to a victory and to a defeat. **FFX-2 only** [AGENTS.md rule 14]. The Fallen Maesters' flow test (`fallen-maesters-flow.test.ts`) is the model.
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party of one and the possessed Rikku, no escape, the chapter's three triggers; the engine offers no Escape row in either duel.
 * 2. **The chain to victory**: Rikku, then Paine; the second link opens with the HP and MP Yuna left the first with, NOT restored (YB2: the game does not heal between the Den's five fights), the bag as it stood; each
 *    link ends in `victory`; the last has no next link.
 * 3. **The defeat and the retry**: a Yuna who only defends loses; a defeat in the second duel retries THAT duel from the state she entered it in (the checkpoint, the Den's GP4 b seam); a defeat in the first has no
 *    checkpoint and starts the chapter over.
 * 4. **The shipped auto-battler plays the chain** without throwing or wedging (no tactic or guide is written for this chapter yet).
 * 5. **The triggers**: the seam fires once on the KO of the possessed Rikku and not on Paine's (that is the close), the two callouts fire once after their move.
 * 6. **The stage and the store**: the Den of Woe's registered scene with a factory; an attempt and a clear go to the experiments' store, never the save.
 */
import { describe, expect, it } from 'vitest';

import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { playChain } from '../helpers/ffx2ChainPlay.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { BattleSetup, BattleState, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FFX2_YUNAS_BALLAD } from '../../../src/data/chapter-ffx2-yunas-ballad.ts';
import { yunasBalladGroups } from '../../../src/data/ffx2/enemies/yunas-ballad.ts';
import * as ids from '../../../src/data/yunas-ballad-ids.ts';
import { DEN_FIGURE_HEIGHTS, DEN_IDS, DEN_PARTY_HEIGHT, DEN_SPOTS, WRAITH_FIGURE_HEIGHTS, WRAITH_SPOTS } from '../../../src/scenes/den-of-woe.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { attackOf, bossOf, forced, logOf, move, unit, yunaOf, type Duel } from '../helpers/yunasBalladDrive.ts';

/** A fresh engine for a setup (the app's own engine options). */
function engineFor(setup: BattleSetup): FFX2Engine {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** The first command menu of an engine, or null. */
function firstMenu(engine: FFX2Engine) {
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'battle-over') return null;
  }
  return null;
}

/** Play one link: the fighter's HP is set low once (the flow rig) and Yuna strikes it. Returns the engine's result. */
function winLink(engine: FFX2Engine, boss: string): { outcome: string } {
  (unit(engine, boss) as unknown as { hp: number }).hp = 1;
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: String(d.result.outcome) };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const change = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' && c.command.extra.toDressphere === 'warrior');
    const worn = yunaOf(engine).dresspheres?.current;
    engine.submit(worn !== 'warrior' && change ? (change.command as never) : attackOf(d, boss));
  }
  throw new Error('the link did not end');
}

describe('the setup', () => {
  it('plays the chapter\'s party of one against the possessed Rikku, cannot be fled, and carries the three triggers', async () => {
    await registerBattleContent();
    const setup = setupForChapter(FFX2_YUNAS_BALLAD, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.enemies).toBe(yunasBalladGroups[0]);
    expect((setup.party as FFX2PartyBuild).members.map((m) => m.id)).toEqual(['yuna']);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-grenade', ids.BALLAD_SEAM_RIKKU, 'first-blade']);
  });

  it('the engine offers no Escape row in either duel', async () => {
    await registerBattleContent();
    for (const duel of [0, 1] as Duel[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_YUNAS_BALLAD, 3), enemies: yunasBalladGroups[duel]! });
      const d = firstMenu(engine);
      expect(d, `duel ${duel}`).not.toBeNull();
      expect(d!.commands.filter((c) => c.enabled && /escape|flee/i.test(c.command.kind)), `duel ${duel}`).toHaveLength(0);
    }
  });

  it('the chain loop finds each next formation by id, and the data objects are the ones the chapter names', async () => {
    await registerBattleContent();
    let group: EnemyGroupDef = FFX2_YUNAS_BALLAD.enemyGroupRef;
    const seen: string[] = [group.id];
    for (let i = 0; i < 4 && group.nextGroupId; i++) {
      const next = await findEnemyGroup(group.nextGroupId);
      expect(next, group.nextGroupId).toBeDefined();
      group = next!;
      seen.push(group.id);
    }
    expect(seen).toEqual([...ids.YUNAS_BALLAD_GROUP_IDS]);
    expect(group).toBe(yunasBalladGroups[1]);
  });
});

describe('the chain to a victory, both links', () => {
  it('the second link opens with the HP and MP the first left, NOT restored, no status riding along that was not hers, the bag as it stood; the last link has no next', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      let setup = setupForChapter(FFX2_YUNAS_BALLAD, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      let engine = engineFor(setup);
      for (let link = 1; link <= 2; link++) {
        const boss = group.enemies[0]!.id;
        expect(boss, `seed ${seed} link ${link}`).toBe(ids.YUNAS_BALLAD_BODY_IDS[link - 1]);
        if (link === 2) {
          const yuna = yunaOf(engine);
          expect(yuna.hp, `seed ${seed}: the HP she left with`).toBe(777);
          expect(yuna.mp, `seed ${seed}: the MP she left with`).toBe(33);
          expect(engine.state().flags['inventory:x2-hero-drink'], `seed ${seed}: a Hero Drink spent on link 1 stays spent`).toBe(2);
        }
        outcomes.push(winLink(engine, boss).outcome);
        // Wreck Yuna on the way out: HP 777, MP 33, one of the three Hero Drinks spent. The next link must keep exactly that.
        const after = engine.state();
        const yuna = after.combatants['yuna'] as unknown as { hp: number; mp: number };
        yuna.hp = 777;
        yuna.mp = 33;
        after.flags['inventory:x2-hero-drink'] = 2;
        if (!group.nextGroupId) break;
        const next = await findEnemyGroup(group.nextGroupId);
        expect(next).toBeDefined();
        setup = setupForNextLink(setup, next!, after as BattleState, seed + link);
        group = next!;
        engine = engineFor(setup);
      }
      expect(outcomes, `seed ${seed}`).toEqual(['victory', 'victory']);
      expect(group.nextGroupId).toBeUndefined();
    }
  }, 120_000);
});

describe('the shipped auto-battler plays the chain (no tactic or guide is written for this chapter yet)', () => {
  it('through the app path it neither throws nor wedges: it reaches a verdict on every seed', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      const r = await playChain(FFX2_YUNAS_BALLAD, seed, 'bench');
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(r.outcome);
      expect(r.partyTurns, `seed ${seed}`).toBeGreaterThan(0);
    }
  }, 120_000);
});

describe('the defeat and the retry checkpoint', () => {
  it('a Yuna who only defends loses to Rikku (the engine ends the fight in defeat, never in a stalemate)', async () => {
    await registerBattleContent();
    const engine = engineFor(setupForChapter(FFX2_YUNAS_BALLAD, 5));
    let outcome = '';
    for (let i = 0; i < 30_000 && outcome === ''; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') outcome = String(d.result.outcome);
      else if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
      else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
    }
    expect(outcome).toBe('defeat');
  }, 120_000);

  it('the second duel is the retry checkpoint: the retry setup opens Paine\'s duel with Yuna in the state she entered it in; the first duel has none, so a defeat there starts the chapter over', async () => {
    await registerBattleContent();
    const first = setupForChapter(FFX2_YUNAS_BALLAD, 9);
    expect(checkpointAt(1, yunasBalladGroups[0]!, first)).toBeNull();
    // the state the first duel left her in: 1,234 HP and 56 MP
    const entered = {
      ...first,
      enemies: yunasBalladGroups[1]!,
      party: { ...first.party, members: (first.party as { members: Array<{ id: string; hp?: number; mp?: number }> }).members.map((m) => ({ ...m, hp: 1234, mp: 56 })) },
    } as BattleSetup;
    const cp = checkpointAt(2, yunasBalladGroups[1]!, entered);
    expect(cp).not.toBeNull();
    const retry = resumeSetup(cp!, 77);
    expect(retry.enemies.id).toBe(ids.PAINE_DUEL_GROUP_ID);
    const engine = engineFor(retry);
    expect([yunaOf(engine).hp, yunaOf(engine).mp], 'she is NOT restored: the game does not heal between these fights').toEqual([1234, 56]);
    const paine = unit(engine, bossOf(1));
    expect(paine.hp).toBe(paine.stats.maxHp); // Paine starts at full
  });
});

describe('the story triggers fire as the real engine plays the fights', () => {
  /** Play `duel` with the fighter's script answering `commands` and the chapter's own triggers; return the names of the script-triggers that fired. */
  function fired(duel: Duel, commands: ReturnType<typeof move>[], opts: { koBoss?: boolean } = {}): string[] {
    const f = forced(duel);
    const engine = engineFor({ ...setupForChapter(FFX2_YUNAS_BALLAD, 4), enemies: f.group });
    f.forced.queue.push(...commands);
    if (opts.koBoss) {
      winLink(engine, bossOf(duel));
    } else {
      for (let i = 0; i < 4000; i++) {
        if (logOf(engine).filter((x) => x.type === 'action-end' && x.actorId === bossOf(duel)).length >= commands.length + 1) break;
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') {
          const y = yunaOf(engine);
          y.hp = y.stats.maxHp; // keep Yuna up: a measurement rig for the trigger, not a fight
          engine.submit({ kind: 'defend', targets: [] });
        }
      }
    }
    return logOf(engine)
      .filter((e) => e.type === 'script-trigger')
      .map((e) => (e as unknown as { name: string }).name);
  }

  it('each callout fires once, after its move: Rikku\'s Grenade, Paine\'s Attack', () => {
    expect(fired(0, [move('x2-possessed-rikku-grenade'), move('x2-possessed-rikku-grenade')])).toEqual(['first-grenade']);
    expect(fired(1, [move('x2-possessed-paine-attack', ['yuna']), move('x2-possessed-paine-attack', ['yuna'])])).toEqual(['first-blade']);
  });

  it('the seam fires on the KO of the possessed Rikku, and Paine\'s fall plays no seam (it is the close)', () => {
    expect(fired(0, [], { koBoss: true })).toEqual([ids.BALLAD_SEAM_RIKKU]);
    expect(fired(1, [], { koBoss: true })).toEqual([]);
  });
});

describe('the stage and the store', () => {
  it('the scene key is the Den of Woe\'s registered scene (a factory, not a placeholder): the game fights the duels in the shades\' own map', () => {
    expect(FFX2_YUNAS_BALLAD.sceneKey).toBe(ids.YUNAS_BALLAD_SCENE);
    const scene = getScene(FFX2_YUNAS_BALLAD.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_YUNAS_BALLAD.sceneKey), 'has a factory').toBeDefined();
  });

  it('the Den\'s staging stands the two girls at the party\'s own world height on a spot of their own, and leaves the shades\' entries exactly as they were', () => {
    const slots = getScene(FFX2_YUNAS_BALLAD.sceneKey)!.slots;
    for (const id of ids.YUNAS_BALLAD_BODY_IDS) {
      expect(slots.figureHeights?.[id], id).toBe(DEN_PARTY_HEIGHT);
      expect(slots.enemySpots?.[id], id).toEqual(WRAITH_SPOTS[id]);
      expect(WRAITH_FIGURE_HEIGHTS[id], id).toBe(DEN_PARTY_HEIGHT);
    }
    for (const id of Object.values(DEN_IDS)) {
      expect(slots.figureHeights?.[id], id).toBe(DEN_FIGURE_HEIGHTS[id]);
      expect(slots.enemySpots?.[id], id).toEqual(DEN_SPOTS[id]);
    }
    expect(Object.keys(DEN_SPOTS).sort(), 'the shades\' own table is not widened').toEqual(Object.values(DEN_IDS).sort());
    // the duelling girl stands nearer the party than a shade does (a girl-sized figure at the shades' z would read small)
    expect(WRAITH_SPOTS[ids.X2_POSSESSED_RIKKU_ID]![2]).toBeGreaterThan(DEN_SPOTS[DEN_IDS.baralai]![2]);
  });

  it('an attempt and a clear go to the experiments\' store under the chapter\'s id, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ids.YUNAS_BALLAD_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ids.YUNAS_BALLAD_ID);
      experimentProgress.recordClear(ids.YUNAS_BALLAD_ID, 400_000, 2);
      expect(experimentRecord(ids.YUNAS_BALLAD_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 400_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ids.YUNAS_BALLAD_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
