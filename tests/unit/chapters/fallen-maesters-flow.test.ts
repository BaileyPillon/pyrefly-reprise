/**
 * The Fallen Maesters (the hidden FFX-2 chapter): the flow around the four fights, through the app's own path (`registerBattleContent`, `setupForChapter`, `findEnemyGroup`, `setupForNextLink`, the retry checkpoint),
 * every link to a victory and to a defeat. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and floor 20, no escape, the chapter's seven triggers; the engine offers no Escape row on any floor.
 * 2. **The chain to victory**: Aranea, the Black Elemental, Concherer, Chac, each link a fresh fight: the party enters links 2 to 4 at full HP and MP with a fallen girl standing, items spent stay spent, nothing else carries;
 *    each link ends in `victory`; the last has no next link. (The fiend's HP is set low once per link: a measurement rig for the flow, as the Angra Mainyu browser proof's device; the fights themselves are in the engine
 *    and bench files.)
 * 3. **The defeat and the retry**: a party that only defends loses to Concherer and to Chac; a defeat on floors 40, 60 or 80 retries THAT floor through the checkpoint (full HP and MP, the fiend at full), a defeat on floor 20
 *    has no checkpoint and starts the chapter over.
 * 4. **The triggers**: the three seams fire once each, on the KO of the fiend of floors 20, 40 and 60 (never on floor 80's: that is the close), and the four callouts fire once, after their move.
 * 5. **The stage and the store**: the chapter's scene key is the Via Infinito's registered scene with a factory; an attempt and a clear go to the experiments' store, never the save.
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
import { FFX2_FALLEN_MAESTERS } from '../../../src/data/chapter-ffx2-fallen-maesters.ts';
import { fallenMaestersGroups } from '../../../src/data/ffx2/enemies/fallen-maesters.ts';
import * as ids from '../../../src/data/fallen-maesters-ids.ts';
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
  type Floor,
} from '../helpers/fallenMaestersDrive.ts';

const MAX_LINKS = 6;

/** A fresh engine for a setup (the app's own engine options). */
function engineFor(setup: BattleSetup): FFX2Engine {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** Play one link: the fiend's HP is set low once (the flow rig) and Paine strikes it; the other girls defend. Returns the engine's result. */
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
  it('plays the chapter\'s party against floor 20, cannot be fled, and carries the seven triggers', async () => {
    await registerBattleContent();
    const setup = setupForChapter(FFX2_FALLEN_MAESTERS, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.enemies).toBe(fallenMaestersGroups[0]);
    expect(setup.triggers.map((t) => t.id)).toEqual([
      'first-gooey-end', ids.MAESTERS_SEAM_20, 'first-magic-up', ids.MAESTERS_SEAM_40, 'first-megaton-press', ids.MAESTERS_SEAM_60, 'first-stony-glare',
    ]);
  });

  it('the engine offers no Escape row on any of the four floors', async () => {
    await registerBattleContent();
    for (const floor of [0, 1, 2, 3] as Floor[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_FALLEN_MAESTERS, 3), enemies: fallenMaestersGroups[floor]! });
      const d = nextInput(engine, 4000);
      expect(d, `floor ${floor}`).not.toBeNull();
      const escapes = d!.commands.filter((c) => c.enabled && /escape|flee/i.test(c.command.kind));
      expect(escapes, `floor ${floor}`).toHaveLength(0);
    }
  });

  it('the chain loop finds each next formation by id, and the data objects are the ones the chapter names', async () => {
    await registerBattleContent();
    let group: EnemyGroupDef = FFX2_FALLEN_MAESTERS.enemyGroupRef;
    const seen: string[] = [group.id];
    for (let i = 0; i < MAX_LINKS && group.nextGroupId; i++) {
      const next = await findEnemyGroup(group.nextGroupId);
      expect(next, group.nextGroupId).toBeDefined();
      group = next!;
      seen.push(group.id);
    }
    expect(seen).toEqual([...ids.FALLEN_MAESTERS_GROUP_IDS]);
    expect(group).toBe(fallenMaestersGroups[3]);
  });
});

describe('the chain to a victory, every link', () => {
  it('four links, each a fresh fight: links 2 to 4 open at full HP and MP with a fallen girl standing; items spent stay spent; the last link has no next', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      let setup = setupForChapter(FFX2_FALLEN_MAESTERS, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      let engine = engineFor(setup);
      for (let link = 1; link <= MAX_LINKS; link++) {
        const boss = group.enemies[0]!.id;
        expect(boss, `seed ${seed} link ${link}`).toBe(ids.FALLEN_MAESTERS_BODY_IDS[link - 1]);
        if (link >= 2) {
          // The glyph: whatever the last link did to the girls, this one opens whole.
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
      expect(outcomes, `seed ${seed}`).toEqual(['victory', 'victory', 'victory', 'victory']);
      expect(group.nextGroupId).toBeUndefined();
    }
  }, 120_000);
});

describe('the shipped auto-battler plays the chain (no tactic or guide is written for this chapter yet)', () => {
  it('through the app path it neither throws nor wedges: it wins floor 20 and reaches a verdict on every seed', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3, 4]) {
      const r = await playChain(FFX2_FALLEN_MAESTERS, seed, 'bench');
      expect(r.link1Won, `seed ${seed}`).toBe(true);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(r.outcome);
    }
  }, 120_000);
});

describe('the defeat and the retry checkpoint', () => {
  it('a party that only defends loses to Concherer and to Chac (the engine ends the fight in defeat, never in a stalemate)', async () => {
    await registerBattleContent();
    for (const floor of [2, 3] as Floor[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_FALLEN_MAESTERS, 5), enemies: fallenMaestersGroups[floor]! });
      let outcome = '';
      for (let i = 0; i < 30_000 && outcome === ''; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') outcome = String(d.result.outcome);
        else if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      expect(outcome, `floor ${floor}`).toBe('defeat');
    }
  }, 120_000);

  it('floors 40, 60 and 80 are retry checkpoints (links 2 to 4): the retry setup opens THAT floor with the party whole; floor 20 has none, so a defeat there starts the chapter over', async () => {
    await registerBattleContent();
    const first = setupForChapter(FFX2_FALLEN_MAESTERS, 9);
    expect(checkpointAt(1, fallenMaestersGroups[0]!, first)).toBeNull();
    for (const [link, floor] of [[2, 1], [3, 2], [4, 3]] as Array<[number, Floor]>) {
      // The state the previous link left the party in: Rikku down, the others on 1 HP.
      const wrecked = {
        ...first,
        enemies: fallenMaestersGroups[floor]!,
        party: {
          ...first.party,
          members: (first.party as { members: Array<{ id: string; hp?: number; mp?: number }> }).members.map((m) => ({ ...m, hp: m.id === 'rikku' ? 0 : 1, mp: 0 })),
        },
      } as BattleSetup;
      const cp = checkpointAt(link, fallenMaestersGroups[floor]!, wrecked);
      expect(cp, `link ${link}`).not.toBeNull();
      const retry = resumeSetup(cp!, 77);
      expect(retry.enemies.id, `link ${link}`).toBe(fallenMaestersGroups[floor]!.id);
      const engine = engineFor(retry);
      for (const girl of girlsOf(engine)) {
        expect(girl.hp, `link ${link} ${girl.id}`).toBe(girl.stats.maxHp);
        expect(girl.alive, `link ${link} ${girl.id}`).toBe(true);
      }
      const boss = unit(engine, bossOf(floor));
      expect(boss.hp).toBe(boss.stats.maxHp); // the fiend starts at full
    }
  });
});

describe('the story triggers fire as the real engine plays the fights', () => {
  /** Play `floor` with the fiend's script answering `commands` and the chapter's own triggers; return the names of the script-triggers that fired. */
  function fired(floor: Floor, commands: ReturnType<typeof move>[], opts: { koBoss?: boolean } = {}): string[] {
    const f = forced(floor);
    const setup = { ...setupForChapter(FFX2_FALLEN_MAESTERS, 4), enemies: f.group };
    const engine = engineFor(setup);
    f.forced.queue.push(...commands);
    if (opts.koBoss) {
      winLink(engine, bossOf(floor));
    } else {
      expect(playUntil(engine, (e) => logOf(e).filter((x) => x.type === 'action-end' && x.actorId === bossOf(floor)).length >= commands.length + 2, { immortal: true, maxDecisions: 2000 })).toBe(true);
    }
    return logOf(engine)
      .filter((e) => e.type === 'script-trigger')
      .map((e) => (e as unknown as { name: string }).name);
  }

  it('each callout fires once, after its move: Gooey End, Magic Up, Megaton Press, Stony Glare', () => {
    expect(fired(0, [move('x2-aranea-gooey-end'), move('x2-aranea-gooey-end')])).toEqual(['first-gooey-end']);
    expect(fired(1, [move('x2-black-elemental-magic-up', [bossOf(1)]), move('x2-black-elemental-magic-up', [bossOf(1)])])).toEqual(['first-magic-up']);
    expect(fired(2, [move('x2-concherer-megaton-press', ['yuna']), move('x2-concherer-megaton-press', ['paine'])])).toEqual(['first-megaton-press']);
    expect(fired(3, [move('x2-chac-stony-glare', ['yuna']), move('x2-chac-stony-glare', ['rikku'])])).toEqual(['first-stony-glare']);
  });

  it('the seams fire on the KO of the fiend of floors 20, 40 and 60, and floor 80\'s fall plays no seam (it is the close)', () => {
    expect(fired(0, [], { koBoss: true })).toEqual([ids.MAESTERS_SEAM_20]);
    expect(fired(1, [], { koBoss: true })).toEqual([ids.MAESTERS_SEAM_40]);
    expect(fired(2, [], { koBoss: true })).toEqual([ids.MAESTERS_SEAM_60]);
    expect(fired(3, [], { koBoss: true })).toEqual([]);
  });
});

describe('the stage and the store', () => {
  it('the scene key is the Via Infinito\'s registered scene (a factory, not a placeholder): the game shares one battle map across the floors', () => {
    expect(FFX2_FALLEN_MAESTERS.sceneKey).toBe(ids.FALLEN_MAESTERS_SCENE);
    const scene = getScene(FFX2_FALLEN_MAESTERS.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_FALLEN_MAESTERS.sceneKey), 'has a factory').toBeDefined();
  });

  it('an attempt and a clear go to the experiments\' store under the chapter\'s id, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ids.FALLEN_MAESTERS_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ids.FALLEN_MAESTERS_ID);
      experimentProgress.recordClear(ids.FALLEN_MAESTERS_ID, 900_000, 4);
      expect(experimentRecord(ids.FALLEN_MAESTERS_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 900_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ids.FALLEN_MAESTERS_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
