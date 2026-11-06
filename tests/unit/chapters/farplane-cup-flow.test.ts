/**
 * The Farplane Cup (the hidden FFX-2 chapter): the flow around the three duels, through the app's own path (`registerBattleContent`, `setupForChapter`, `findEnemyGroup`, `setupForNextLink`, the retry checkpoint),
 * every link to a victory and to a defeat, and three seeded engine runs of each fight. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and duel 1, no escape, the chapter's five triggers; the engine offers no Escape row on any duel.
 * 2. **The chain to victory**: Auron, the masked duelist, Seymour, each link a fresh fight: the party enters links 2 and 3 at full HP and MP with a fallen girl standing, items spent stay spent, nothing else carries;
 *    each link ends in `victory`; the last has no next link. (The duelist's HP is set low once per link: a measurement rig for the flow; the fights themselves are in the engine and bench files.)
 * 3. **Three seeded runs of each fight** by the shipped bench line: each ends in a verdict, never a stalemate, the same on a second run of the same seed (determinism).
 * 4. **The defeat and the retry**: a party that only defends loses to every duelist; a defeat on duel 2 or 3 retries THAT duel through the checkpoint (full HP and MP, the duelist at full), a defeat on duel 1 has no
 *    checkpoint and starts the chapter over.
 * 5. **The triggers**: the two seams fire once each, on the KO of the first and the second duelist (never on the third's: that is the close), and the three callouts fire once, after their move.
 * 6. **The stage and the store**: the chapter's scene key is the Den of Woe's registered scene with a factory; an attempt and a clear go to the experiments' store, never the save.
 */
import { describe, expect, it } from 'vitest';

import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { playChain } from '../helpers/ffx2ChainPlay.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { BattleSetup, BattleState, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FFX2_FARPLANE_CUP } from '../../../src/data/chapter-ffx2-farplane-cup.ts';
import { farplaneCupGroups } from '../../../src/data/ffx2/enemies/farplane-cup.ts';
import * as ids from '../../../src/data/farplane-cup-ids.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { CUP_ABILITY as A } from '../../../src/data/ffx2/enemies/farplane-cup-abilities.ts';
import { GIRLS, attackOf, bossOf, fight, forced, girlsOf, logOf, move, nextInput, playUntil, unit, type Duel } from '../helpers/farplaneCupDrive.ts';

const MAX_LINKS = 5;

/** A fresh engine for a setup (the app's own engine options). */
function engineFor(setup: BattleSetup): FFX2Engine {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** Play one link: the duelist's HP is set low once (the flow rig) and the first girl to act strikes it. Returns the engine's result. */
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
    engine.submit(attackOf(d, boss));
  }
  throw new Error('the link did not end');
}

describe('the setup', () => {
  it('plays the chapter\'s party against duel 1, cannot be fled, and carries the five triggers', async () => {
    await registerBattleContent();
    const setup = setupForChapter(FFX2_FARPLANE_CUP, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.enemies).toBe(farplaneCupGroups[0]);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-shooting-star', ids.CUP_SEAM_1, 'first-blitz-ace', ids.CUP_SEAM_2, 'first-meteor']);
  });

  it('the engine offers no Escape row on any of the three duels', async () => {
    await registerBattleContent();
    for (const duel of [0, 1, 2] as Duel[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_FARPLANE_CUP, 3), enemies: farplaneCupGroups[duel]! });
      const d = nextInput(engine, 4000);
      expect(d, `duel ${duel + 1}`).not.toBeNull();
      const escapes = d!.commands.filter((c) => c.enabled && /escape|flee/i.test(c.command.kind));
      expect(escapes, `duel ${duel + 1}`).toHaveLength(0);
    }
  });

  it('the chain loop finds each next formation by id, and the data objects are the ones the chapter names', async () => {
    await registerBattleContent();
    let group: EnemyGroupDef = FFX2_FARPLANE_CUP.enemyGroupRef;
    const seen: string[] = [group.id];
    for (let i = 0; i < MAX_LINKS && group.nextGroupId; i++) {
      const next = await findEnemyGroup(group.nextGroupId);
      expect(next, group.nextGroupId).toBeDefined();
      group = next!;
      seen.push(group.id);
    }
    expect(seen).toEqual([...ids.FARPLANE_CUP_GROUP_IDS]);
    expect(group).toBe(farplaneCupGroups[2]);
  });
});

describe('the chain to a victory, every link', () => {
  it('three links, each a fresh fight: links 2 and 3 open at full HP and MP with a fallen girl standing; items spent stay spent; the last link has no next', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      let setup = setupForChapter(FFX2_FARPLANE_CUP, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      let engine = engineFor(setup);
      for (let link = 1; link <= MAX_LINKS; link++) {
        const boss = group.enemies[0]!.id;
        expect(boss, `seed ${seed} link ${link}`).toBe(ids.FARPLANE_CUP_BODY_IDS[link - 1]);
        if (link >= 2) {
          // The arena's seam: whatever the last link did to the girls, this one opens whole.
          for (const girl of girlsOf(engine)) {
            expect(girl.hp, `seed ${seed} link ${link} ${girl.id}`).toBe(girl.stats.maxHp);
            expect(girl.mp, `seed ${seed} link ${link} ${girl.id}`).toBe(girl.stats.maxMp);
            expect(girl.alive, `seed ${seed} link ${link} ${girl.id}`).toBe(true);
            expect(Object.keys(girl.statuses).filter((s) => s !== 'ko'), `seed ${seed} link ${link} ${girl.id}: nothing else carries`).toEqual([]);
          }
          expect(engine.state().flags['inventory:x2-megalixir'], `seed ${seed} link ${link}: a Megalixir spent on link ${link - 1} stays spent`).toBe(10 - (link - 1));
        }
        outcomes.push(winLink(engine, boss).outcome);
        // Wreck the party on the way out: HP 1, MP 0, Rikku down, one Megalixir spent. The next link must not care (but must keep the spent item).
        const after = engine.state();
        for (const id of GIRLS) {
          const g = after.combatants[id] as unknown as { hp: number; mp: number; alive: boolean };
          g.hp = id === 'rikku' ? 0 : 1;
          g.mp = 0;
          if (id === 'rikku') g.alive = false;
        }
        after.flags['inventory:x2-megalixir'] = 10 - link;
        if (!group.nextGroupId) break;
        const next = await findEnemyGroup(group.nextGroupId);
        expect(next).toBeDefined();
        setup = setupForNextLink(setup, next!, after as BattleState, seed + link);
        group = next!;
        engine = engineFor(setup);
      }
      expect(outcomes, `seed ${seed}`).toEqual(['victory', 'victory', 'victory']);
      expect(group.nextGroupId).toBeUndefined();
    }
  }, 120_000);
});

describe('three seeded runs of each fight (the bench line), through the real engine', () => {
  it('each duel on seeds 1 to 3 ends in a verdict (never a stalemate), and the same seed gives the same fight twice', () => {
    for (const duel of [0, 1, 2] as Duel[]) {
      for (const seed of [1, 2, 3]) {
        const a = fight(duel, seed, 'curtains', { maxDecisions: 60_000 });
        const b = fight(duel, seed, 'curtains', { maxDecisions: 60_000 });
        expect(['victory', 'defeat'], `duel ${duel + 1} seed ${seed}`).toContain(a.outcome);
        expect([b.outcome, b.ticks, b.bossHp, b.kos, b.ejects, b.moves], `duel ${duel + 1} seed ${seed}: determinism`).toEqual([a.outcome, a.ticks, a.bossHp, a.kos, a.ejects, a.moves]);
        // The duelist did act, and only with moves of its own script.
        const used = Object.keys(a.moves);
        expect(used.length, `duel ${duel + 1} seed ${seed}`).toBeGreaterThan(0);
        for (const id of used) expect(farplaneCupGroups[duel]!.enemies[0]!.abilityIds, `duel ${duel + 1} seed ${seed}: ${id}`).toContain(id);
      }
    }
  }, 120_000);
});

describe('the shipped auto-battler plays the chain (no tactic or guide is written for this chapter yet)', () => {
  it('through the app path it neither throws nor wedges: it reaches a verdict on every seed', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3, 4]) {
      const r = await playChain(FFX2_FARPLANE_CUP, seed, 'bench');
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(r.outcome);
    }
  }, 120_000);
});

describe('the defeat and the retry checkpoint', () => {
  it('a party that only defends loses to every duelist (the engine ends the fight in defeat, never in a stalemate)', async () => {
    await registerBattleContent();
    for (const duel of [0, 1, 2] as Duel[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_FARPLANE_CUP, 5), enemies: farplaneCupGroups[duel]! });
      let outcome = '';
      for (let i = 0; i < 30_000 && outcome === ''; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') outcome = String(d.result.outcome);
        else if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      expect(outcome, `duel ${duel + 1}`).toBe('defeat');
    }
  }, 120_000);

  it('duels 2 and 3 are retry checkpoints (links 2 and 3): the retry setup opens THAT duel with the party whole; duel 1 has none, so a defeat there starts the chapter over', async () => {
    await registerBattleContent();
    const first = setupForChapter(FFX2_FARPLANE_CUP, 9);
    expect(checkpointAt(1, farplaneCupGroups[0]!, first)).toBeNull();
    for (const [link, duel] of [[2, 1], [3, 2]] as Array<[number, Duel]>) {
      // The state the previous link left the party in: Rikku down, the others on 1 HP.
      const wrecked = {
        ...first,
        enemies: farplaneCupGroups[duel]!,
        party: {
          ...first.party,
          members: (first.party as { members: Array<{ id: string; hp?: number; mp?: number }> }).members.map((m) => ({ ...m, hp: m.id === 'rikku' ? 0 : 1, mp: 0 })),
        },
      } as BattleSetup;
      const cp = checkpointAt(link, farplaneCupGroups[duel]!, wrecked);
      expect(cp, `link ${link}`).not.toBeNull();
      const retry = resumeSetup(cp!, 77);
      expect(retry.enemies.id, `link ${link}`).toBe(farplaneCupGroups[duel]!.id);
      const engine = engineFor(retry);
      for (const girl of girlsOf(engine)) {
        expect(girl.hp, `link ${link} ${girl.id}`).toBe(girl.stats.maxHp);
        expect(girl.alive, `link ${link} ${girl.id}`).toBe(true);
      }
      const boss = unit(engine, bossOf(duel));
      expect(boss.hp).toBe(boss.stats.maxHp); // the duelist starts at full
    }
  });
});

describe('the story triggers fire as the real engine plays the fights', () => {
  /** Play `duel` with the duelist's script answering `commands` and the chapter's own triggers; return the names of the script-triggers that fired. */
  function fired(duel: Duel, commands: ReturnType<typeof move>[], opts: { koBoss?: boolean } = {}): string[] {
    const f = forced(duel);
    const setup = { ...setupForChapter(FFX2_FARPLANE_CUP, 4), enemies: f.group };
    const engine = engineFor(setup);
    f.forced.queue.push(...commands);
    if (opts.koBoss) {
      winLink(engine, bossOf(duel));
    } else {
      expect(playUntil(engine, (e) => logOf(e).filter((x) => x.type === 'action-end' && x.actorId === bossOf(duel)).length >= commands.length + 2, { immortal: true, maxDecisions: 2000 })).toBe(true);
    }
    return logOf(engine)
      .filter((e) => e.type === 'script-trigger')
      .map((e) => (e as unknown as { name: string }).name);
  }

  it('each callout fires once, after its move: Shooting Star, Blitz Ace, Meteor', () => {
    expect(fired(0, [move(A.shootingStar, ['yuna']), move(A.shootingStar, ['rikku'])])).toEqual(['first-shooting-star']);
    expect(fired(1, [move(A.blitzAce, ['yuna']), move(A.blitzAce, ['paine'])])).toEqual(['first-blitz-ace']);
    expect(fired(2, [move(A.meteor), move(A.meteor)])).toEqual(['first-meteor']);
  });

  it('the seams fire on the KO of the first and the second duelist, and the third\'s fall plays no seam (it is the close)', () => {
    expect(fired(0, [], { koBoss: true })).toEqual([ids.CUP_SEAM_1]);
    expect(fired(1, [], { koBoss: true })).toEqual([ids.CUP_SEAM_2]);
    expect(fired(2, [], { koBoss: true })).toEqual([]);
  });
});

describe('the stage and the store', () => {
  it('the scene key is the Den of Woe\'s registered scene (a factory, not a placeholder)', () => {
    expect(FFX2_FARPLANE_CUP.sceneKey).toBe(ids.FARPLANE_CUP_SCENE);
    const scene = getScene(FFX2_FARPLANE_CUP.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_FARPLANE_CUP.sceneKey), 'has a factory').toBeDefined();
  });

  it('an attempt and a clear go to the experiments\' store under the chapter\'s id, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ids.FARPLANE_CUP_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ids.FARPLANE_CUP_ID);
      experimentProgress.recordClear(ids.FARPLANE_CUP_ID, 900_000, 3);
      expect(experimentRecord(ids.FARPLANE_CUP_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 900_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ids.FARPLANE_CUP_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});

