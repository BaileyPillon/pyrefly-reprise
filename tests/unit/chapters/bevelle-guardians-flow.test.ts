/**
 * The Bevelle Guardians (the hidden FFX-2 chapter): the flow around the three fights, through the app's own path (`registerBattleContent`, `setupForChapter`, `findEnemyGroup`, `setupForNextLink`, the retry checkpoint),
 * every link to a victory and to a defeat. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and act 1 (Georapella), no escape, the chapter's four triggers; the engine offers no Escape row on any act.
 * 2. **The chain to victory**: Georapella, the Precepts Guard, Baralai, each link a fresh fight: the party enters links 2 and 3 at full HP and MP with a fallen girl standing, items spent stay spent, nothing else carries;
 *    each link ends in `victory`; the last has no next link. (The guardian's HP is set low once per link: a measurement rig for the flow, as the Angra Mainyu browser proof's device; the fights themselves are in the
 *    engine and bench files.)
 * 3. **The defeat and the retry**: a party that only defends loses every act; a defeat on act 2 or 3 retries THAT act through the checkpoint (full HP and MP, the guardian at full), a defeat on act 1 has no checkpoint and
 *    starts the chapter over.
 * 4. **The triggers**: the two seams fire once each, on the KO of Georapella and of the Precepts Guard (never on Baralai's: that is the close), the two callouts fire once, after their move, and the AI's own callout
 *    (Baralai's blow count at nine) fires once, by its name.
 * 5. **The stage and the store**: the chapter's scene key is the Bevelle Underground's registered scene with a factory; an attempt and a clear go to the experiments' store, never the save.
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
import { FFX2_BEVELLE_GUARDIANS } from '../../../src/data/chapter-ffx2-bevelle-guardians.ts';
import { bevelleGuardiansGroups } from '../../../src/data/ffx2/enemies/bevelle-guardians.ts';
import * as ids from '../../../src/data/bevelle-guardians-ids.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import {
  GIRLS,
  attackOf,
  bossOf,
  forced,
  girlsOf,
  logOf,
  move,
  nextInput,
  playUntil,
  unit,
  type Act,
} from '../helpers/bevelleGuardiansDrive.ts';

const MAX_LINKS = 6;

/** A fresh engine for a setup (the app's own engine options). */
function engineFor(setup: BattleSetup): FFX2Engine {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** Play one link: the guardian's HP is set low once (the flow rig) and Paine strikes it; the other girls defend. Returns the engine's result. */
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
    engine.submit(d.actorId === 'paine' ? attackOf(d, boss) : { kind: 'defend', targets: [] });
  }
  throw new Error('the link did not end');
}

describe('the setup', () => {
  it('plays the chapter\'s party against act 1, cannot be fled, and carries the four triggers', async () => {
    await registerBattleContent();
    const setup = setupForChapter(FFX2_BEVELLE_GUARDIANS, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.enemies).toBe(bevelleGuardiansGroups[0]);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-ga', ids.GUARDIANS_SEAM_1, 'first-death', ids.GUARDIANS_SEAM_2]);
  });

  it('the engine offers no Escape row on any of the three acts', async () => {
    await registerBattleContent();
    for (const act of [0, 1, 2] as Act[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_BEVELLE_GUARDIANS, 3), enemies: bevelleGuardiansGroups[act]! });
      const d = nextInput(engine, 4000);
      expect(d, `act ${act + 1}`).not.toBeNull();
      const escapes = d!.commands.filter((c) => c.enabled && /escape|flee/i.test(c.command.kind));
      expect(escapes, `act ${act + 1}`).toHaveLength(0);
    }
  });

  it('the chain loop finds each next formation by id, and the data objects are the ones the chapter names', async () => {
    await registerBattleContent();
    let group: EnemyGroupDef = FFX2_BEVELLE_GUARDIANS.enemyGroupRef;
    const seen: string[] = [group.id];
    for (let i = 0; i < MAX_LINKS && group.nextGroupId; i++) {
      const next = await findEnemyGroup(group.nextGroupId);
      expect(next, group.nextGroupId).toBeDefined();
      group = next!;
      seen.push(group.id);
    }
    expect(seen).toEqual([...ids.BEVELLE_GUARDIANS_GROUP_IDS]);
    expect(group).toBe(bevelleGuardiansGroups[2]);
  });
});

describe('the chain to a victory, every link', () => {
  it('three links, each a fresh fight: links 2 and 3 open at full HP and MP with a fallen girl standing; items spent stay spent; the last link has no next', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      let setup = setupForChapter(FFX2_BEVELLE_GUARDIANS, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      let engine = engineFor(setup);
      const start = engine.state().flags['inventory:x2-phoenix-down'] as number;
      expect(start, 'the bag starts with Phoenix Downs').toBeGreaterThan(3);
      for (let link = 1; link <= MAX_LINKS; link++) {
        const boss = group.enemies[0]!.id;
        expect(boss, `seed ${seed} link ${link}`).toBe(ids.BEVELLE_GUARDIANS_BODY_IDS[link - 1]);
        if (link >= 2) {
          // Whatever the last link did to the girls, this one opens whole.
          for (const girl of girlsOf(engine)) {
            expect(girl.hp, `seed ${seed} link ${link} ${girl.id}`).toBe(girl.stats.maxHp);
            expect(girl.mp, `seed ${seed} link ${link} ${girl.id}`).toBe(girl.stats.maxMp);
            expect(girl.alive, `seed ${seed} link ${link} ${girl.id}`).toBe(true);
            expect(Object.keys(girl.statuses).filter((s) => s !== 'ko'), `seed ${seed} link ${link} ${girl.id}: nothing else carries`).toEqual([]);
          }
          expect(engine.state().flags['inventory:x2-phoenix-down'], `seed ${seed} link ${link}: a Phoenix Down spent on link ${link - 1} stays spent`).toBe(start - (link - 1));
        }
        outcomes.push(winLink(engine, boss).outcome);
        // Wreck the party on the way out: HP 1, MP 0, Rikku down, one Phoenix Down spent. The next link must not care (but must keep the spent item).
        const after = engine.state();
        for (const id of GIRLS) {
          const g = after.combatants[id] as unknown as { hp: number; mp: number; alive: boolean };
          g.hp = id === 'rikku' ? 0 : 1;
          g.mp = 0;
          if (id === 'rikku') g.alive = false;
        }
        after.flags['inventory:x2-phoenix-down'] = start - link;
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

describe('the shipped auto-battler plays the chain (no tactic or guide is written for this chapter yet)', () => {
  it('through the app path it neither throws nor wedges: it wins act 1 and reaches a verdict on every seed', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3, 4]) {
      const r = await playChain(FFX2_BEVELLE_GUARDIANS, seed, 'bench');
      expect(r.link1Won, `seed ${seed}`).toBe(true);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(r.outcome);
    }
  }, 120_000);
});

describe('the defeat and the retry checkpoint', () => {
  it('a party that only defends loses every act (the engine ends the fight in defeat, never in a stalemate)', async () => {
    await registerBattleContent();
    for (const act of [0, 1, 2] as Act[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_BEVELLE_GUARDIANS, 5), enemies: bevelleGuardiansGroups[act]! });
      let outcome = '';
      for (let i = 0; i < 30_000 && outcome === ''; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') outcome = String(d.result.outcome);
        else if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      expect(outcome, `act ${act + 1}`).toBe('defeat');
    }
  }, 120_000);

  it('acts 2 and 3 are retry checkpoints (links 2 and 3): the retry setup opens THAT act with the party whole; act 1 has none, so a defeat there starts the chapter over', async () => {
    await registerBattleContent();
    const first = setupForChapter(FFX2_BEVELLE_GUARDIANS, 9);
    expect(checkpointAt(1, bevelleGuardiansGroups[0]!, first)).toBeNull();
    for (const [link, act] of [[2, 1], [3, 2]] as Array<[number, Act]>) {
      // The state the previous link left the party in: Rikku down, the others on 1 HP.
      const wrecked = {
        ...first,
        enemies: bevelleGuardiansGroups[act]!,
        party: {
          ...first.party,
          members: (first.party as { members: Array<{ id: string; hp?: number; mp?: number }> }).members.map((m) => ({ ...m, hp: m.id === 'rikku' ? 0 : 1, mp: 0 })),
        },
      } as BattleSetup;
      const cp = checkpointAt(link, bevelleGuardiansGroups[act]!, wrecked);
      expect(cp, `link ${link}`).not.toBeNull();
      const retry = resumeSetup(cp!, 77);
      expect(retry.enemies.id, `link ${link}`).toBe(bevelleGuardiansGroups[act]!.id);
      const engine = engineFor(retry);
      for (const girl of girlsOf(engine)) {
        expect(girl.hp, `link ${link} ${girl.id}`).toBe(girl.stats.maxHp);
        expect(girl.alive, `link ${link} ${girl.id}`).toBe(true);
      }
      const boss = unit(engine, bossOf(act));
      expect(boss.hp).toBe(boss.stats.maxHp); // the guardian starts at full
    }
  });
});

describe('the story triggers fire as the real engine plays the fights', () => {
  /** Play `act` with the guardian's script answering `commands` and the chapter's own triggers; return the names of the script-triggers that fired. */
  function fired(act: Act, commands: ReturnType<typeof move>[], opts: { koBoss?: boolean } = {}): string[] {
    const f = forced(act);
    const setup = { ...setupForChapter(FFX2_BEVELLE_GUARDIANS, 4), enemies: f.group };
    const engine = engineFor(setup);
    f.forced.queue.push(...commands);
    if (opts.koBoss) {
      winLink(engine, bossOf(act));
    } else {
      expect(playUntil(engine, (e) => logOf(e).filter((x) => x.type === 'action-end' && x.actorId === bossOf(act)).length >= commands.length + 2, { immortal: true, maxDecisions: 2000 })).toBe(true);
    }
    return logOf(engine)
      .filter((e) => e.type === 'script-trigger')
      .map((e) => (e as unknown as { name: string }).name);
  }

  it('each callout fires once, after its move: Georapella\'s first Ga spell and the Precepts Guard\'s first Death', () => {
    expect(fired(0, [move('x2-georapella-thundaga'), move('x2-georapella-waterga')])).toEqual(['first-ga']);
    expect(fired(1, [move('x2-precepts-guard-death', ['yuna']), move('x2-precepts-guard-death', ['paine'])])).toEqual(['first-death']);
  });

  it('the seams fire on the KO of Georapella and of the Precepts Guard, and Baralai\'s fall plays no seam (it is the close)', () => {
    expect(fired(0, [], { koBoss: true })).toEqual([ids.GUARDIANS_SEAM_1]);
    expect(fired(1, [], { koBoss: true })).toEqual([ids.GUARDIANS_SEAM_2]);
    expect(fired(2, [], { koBoss: true })).toEqual([]);
  });

  it('Baralai\'s own callout (the AI emits it, once, by name) fires when the ninth result lands, and never again', () => {
    const engine = engineFor({ ...setupForChapter(FFX2_BEVELLE_GUARDIANS, 6), enemies: bevelleGuardiansGroups[2]! });
    const names = (): string[] => logOf(engine).filter((e) => e.type === 'script-trigger').map((e) => (e as unknown as { name: string }).name);
    let rounds = 0;
    while (names().length === 0 && rounds++ < 400) {
      const d = nextInput(engine, 4000);
      if (d === null) break;
      for (const id of GIRLS) {
        const g = unit(engine, id); // keep the girls up: the count is what is measured
        (g as unknown as { hp: number }).hp = g.stats.maxHp;
      }
      engine.submit(attackOf(d, 'x2-baralai'));
    }
    expect(names()).toEqual([ids.BARALAI_COUNT_NINE_TRIGGER]);
    const hits = unit(engine, 'x2-baralai').aiMemory?.['baralaiHits'];
    expect(hits, 'the callout fired at the ninth result (or the tenth, if one action landed two), before the Drill Shot resets the count').toBeGreaterThanOrEqual(9);
  });
});

describe('the stage and the store', () => {
  it('the scene key is the Bevelle Underground\'s registered scene (a factory, not a placeholder): one plate for all three acts (BG3)', () => {
    expect(FFX2_BEVELLE_GUARDIANS.sceneKey).toBe(ids.BEVELLE_GUARDIANS_SCENE);
    const scene = getScene(FFX2_BEVELLE_GUARDIANS.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_BEVELLE_GUARDIANS.sceneKey), 'has a factory').toBeDefined();
  });

  it('an attempt and a clear go to the experiments\' store under the chapter\'s id, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ids.BEVELLE_GUARDIANS_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ids.BEVELLE_GUARDIANS_ID);
      experimentProgress.recordClear(ids.BEVELLE_GUARDIANS_ID, 600_000, 3);
      expect(experimentRecord(ids.BEVELLE_GUARDIANS_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 600_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ids.BEVELLE_GUARDIANS_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
