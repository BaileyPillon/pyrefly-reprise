/**
 * Gullwings, Chapter 1 (FFX-2's four hotspot missions, the hidden chapter): the flow around the four fights, through the app's own path (`registerBattleContent`, `setupForChapter`, `findEnemyGroup`, `setupForNextLink`, the
 * retry checkpoint), every link to a victory and to a defeat. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and act 1 (Boris), no escape, the chapter's eight triggers; the engine offers no Escape row on any act.
 * 2. **The chain to victory**: Boris, the Flame Dragon, the Guardian Beast, YSLS-Zero, each link a fresh fight: the party enters links 2 to 4 at full HP and MP with a fallen girl standing, items spent stay spent, nothing
 *    else carries; each link ends in `victory`; the last has no next link.
 * 3. **The shipped auto-battler** plays the chain through the app path and reaches a verdict; **the advisor line** wins all four links in a row through `setupForNextLink`.
 * 4. **The defeat and the retry**: a party that only defends loses every act; a defeat on act 2, 3 or 4 retries THAT act through the checkpoint (full HP and MP, the boss at full), a defeat on act 1 has no checkpoint and
 *    starts the chapter over.
 * 5. **The triggers**: the three seams fire on the KO of Boris, of the Flame Dragon and of the Guardian Beast (never on YSLS-Zero's: that is the close); the five callouts fire once, after their move.
 * 6. **The stage and the store**: the chapter's scene key is the Zanarkand Dome's registered scene; an attempt and a clear go to the experiments' store, never the save.
 */
import { describe, expect, it } from 'vitest';

import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { playChain } from '../helpers/ffx2ChainPlay.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FFX2_GULLWINGS_CH1 } from '../../../src/data/chapter-ffx2-gullwings-ch1.ts';
import { gullwingsCh1Groups } from '../../../src/data/ffx2/enemies/gullwings-ch1.ts';
import * as ids from '../../../src/data/gullwings-ch1-ids.ts';
import { ffx2GullwingsCh1 } from '../../../src/engine/tactics/ffx2-gullwings-ch1.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { GIRLS, bossOf, forced, girlsOf, logOf, moveCmd, unit, type Act } from '../helpers/gullwingsCh1Drive.ts';
import { GULLWINGS_ABILITY as A } from '../../../src/battle/ffx2/ai/gullwings-ch1.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
const MAX_LINKS = 6;

/** A fresh engine for a setup (the app's own engine options). */
function engineFor(setup: BattleSetup): FFX2Engine {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

function attackOf(d: Input, boss: string): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  return row ? ({ ...row.command, targets: [boss] } as Command) : { kind: 'defend', targets: [] };
}

/** The next player menu, ticking through the waits; null when the battle is over first. */
function nextInput(engine: FFX2Engine, max = 4000): Input | null {
  for (let i = 0; i < max; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'player-input') return d;
  }
  return null;
}

/** Play one link: the boss's HP is set low once (the flow rig) and Paine strikes it; the other girls defend. Returns the engine's result. */
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
  it('plays the chapter\'s party against act 1, cannot be fled, and carries the eight triggers', async () => {
    await registerBattleContent();
    const setup = setupForChapter(FFX2_GULLWINGS_CH1, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.enemies).toBe(gullwingsCh1Groups[0]);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-sticky-end', ids.GULLWINGS_SEAM_1, 'first-flame-breath', ids.GULLWINGS_SEAM_2, 'first-curse', 'first-damocles-photon', ids.GULLWINGS_SEAM_3, 'first-blast-punch']);
  });

  it('the engine offers no Escape row on any of the four acts', async () => {
    await registerBattleContent();
    for (const act of [0, 1, 2, 3] as Act[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_GULLWINGS_CH1, 3), enemies: gullwingsCh1Groups[act]! });
      const d = nextInput(engine);
      expect(d, `act ${act + 1}`).not.toBeNull();
      expect(d!.commands.filter((c) => c.enabled && /escape|flee/i.test(c.command.kind)), `act ${act + 1}`).toHaveLength(0);
    }
  });

  it('the chain loop finds each next formation by id, and the data objects are the ones the chapter names', async () => {
    await registerBattleContent();
    let group: EnemyGroupDef = FFX2_GULLWINGS_CH1.enemyGroupRef;
    const seen: string[] = [group.id];
    for (let i = 0; i < MAX_LINKS && group.nextGroupId; i++) {
      const next = await findEnemyGroup(group.nextGroupId);
      expect(next, group.nextGroupId).toBeDefined();
      group = next!;
      seen.push(group.id);
    }
    expect(seen).toEqual([...ids.GULLWINGS_CH1_GROUP_IDS]);
    expect(group).toBe(gullwingsCh1Groups[3]);
  });
});

describe('the chain to a victory, every link', () => {
  it('four links, each a fresh fight: links 2 to 4 open at full HP and MP with a fallen girl standing; items spent stay spent; the last link has no next', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      let setup = setupForChapter(FFX2_GULLWINGS_CH1, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      let engine = engineFor(setup);
      const start = engine.state().flags['inventory:x2-phoenix-down'] as number;
      expect(start, 'the bag starts with Phoenix Downs').toBeGreaterThan(3);
      for (let link = 1; link <= MAX_LINKS; link++) {
        const boss = group.enemies[0]!.id;
        expect(boss, `seed ${seed} link ${link}`).toBe(ids.GULLWINGS_CH1_BODY_IDS[link - 1]);
        if (link >= 2) {
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
      expect(outcomes, `seed ${seed}`).toEqual(['victory', 'victory', 'victory', 'victory']);
      expect(group.nextGroupId).toBeUndefined();
    }
  }, 120_000);
});

describe('the lines play the chain through the app path', () => {
  it('the shipped auto-battler neither throws nor wedges: it wins act 1 and reaches a verdict on every seed', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3, 4]) {
      const r = await playChain(FFX2_GULLWINGS_CH1, seed, 'bench');
      expect(r.link1Won, `seed ${seed}`).toBe(true);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(r.outcome);
    }
  }, 120_000);

  it('the advisor line (the tactic the guide teaches) wins all four links through setupForNextLink, the bag and the spent items carrying, on three seeds', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3]) {
      let setup = setupForChapter(FFX2_GULLWINGS_CH1, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      for (let link = 1; link <= MAX_LINKS; link++) {
        const engine = engineFor(setup);
        let outcome = '';
        for (let i = 0; i < 40_000 && outcome === ''; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') outcome = String(d.result.outcome);
          else if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
          else if (d.kind === 'player-input') engine.submit(ffx2GullwingsCh1(d.actorId, d.commands, engine) ?? attackOf(d, group.enemies[0]!.id));
        }
        outcomes.push(outcome);
        if (outcome !== 'victory' || !group.nextGroupId) break;
        const next = await findEnemyGroup(group.nextGroupId);
        setup = setupForNextLink(setup, next!, engine.state() as BattleState, seed + link);
        group = next!;
      }
      expect(outcomes, `seed ${seed}`).toEqual(['victory', 'victory', 'victory', 'victory']);
    }
  }, 240_000);
});

describe('the defeat and the retry checkpoint', () => {
  it('a party that only defends loses every act (the engine ends the fight in defeat, never in a stalemate)', async () => {
    await registerBattleContent();
    for (const act of [0, 1, 2, 3] as Act[]) {
      const engine = engineFor({ ...setupForChapter(FFX2_GULLWINGS_CH1, 5), enemies: gullwingsCh1Groups[act]! });
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

  it('acts 2 to 4 are retry checkpoints (links 2 to 4): the retry setup opens THAT act with the party whole; act 1 has none, so a defeat there starts the chapter over', async () => {
    await registerBattleContent();
    const first = setupForChapter(FFX2_GULLWINGS_CH1, 9);
    expect(checkpointAt(1, gullwingsCh1Groups[0]!, first)).toBeNull();
    for (const [link, act] of [[2, 1], [3, 2], [4, 3]] as Array<[number, Act]>) {
      const wrecked = {
        ...first,
        enemies: gullwingsCh1Groups[act]!,
        party: { ...first.party, members: (first.party as { members: Array<{ id: string; hp?: number; mp?: number }> }).members.map((m) => ({ ...m, hp: m.id === 'rikku' ? 0 : 1, mp: 0 })) },
      } as BattleSetup;
      const cp = checkpointAt(link, gullwingsCh1Groups[act]!, wrecked);
      expect(cp, `link ${link}`).not.toBeNull();
      const retry = resumeSetup(cp!, 77);
      expect(retry.enemies.id, `link ${link}`).toBe(gullwingsCh1Groups[act]!.id);
      const engine = engineFor(retry);
      for (const girl of girlsOf(engine)) {
        expect(girl.hp, `link ${link} ${girl.id}`).toBe(girl.stats.maxHp);
        expect(girl.alive, `link ${link} ${girl.id}`).toBe(true);
      }
      const boss = unit(engine, bossOf(act));
      expect(boss.hp).toBe(boss.stats.maxHp);
    }
  });
});

describe('the story triggers fire as the real engine plays the fights', () => {
  /** Play `act` with the boss's script answering `commands` and the chapter's own triggers; return the names of the script-triggers that fired. */
  function fired(act: Act, commands: Command[], opts: { koBoss?: boolean } = {}): string[] {
    const f = forced(act);
    const setup = { ...setupForChapter(FFX2_GULLWINGS_CH1, 4), enemies: f.group };
    const engine = engineFor(setup);
    f.forced.queue.push(...commands);
    if (opts.koBoss) winLink(engine, bossOf(act));
    else {
      for (let i = 0; i < 2000 && logOf(engine).filter((e) => e.type === 'action-end' && e.actorId === bossOf(act)).length < commands.length + 2; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') {
          for (const g of girlsOf(engine)) if (g.alive) g.hp = g.stats.maxHp;
          engine.submit({ kind: 'defend', targets: [] });
        }
      }
    }
    return logOf(engine)
      .filter((e) => e.type === 'script-trigger')
      .map((e) => String(e.name));
  }

  it('each callout fires once, after its move: the first Sticky End, Flame Breath, Curse, Damocles Photon and Blast Punch (a second use fires nothing more)', () => {
    expect(fired(0, [moveCmd(A.stickyEnd), moveCmd(A.stickyEnd)])).toEqual(['first-sticky-end']);
    expect(fired(1, [moveCmd(A.flameBreath), moveCmd(A.flameBreath)])).toEqual(['first-flame-breath']);
    expect(fired(2, [moveCmd(A.curse, ['yuna']), moveCmd(A.curse, ['rikku'])])).toEqual(['first-curse']);
    expect(fired(2, [moveCmd(A.damoclesPhoton), moveCmd(A.damoclesPhoton)])).toEqual(['first-damocles-photon']);
    expect(fired(3, [moveCmd(A.blastPunch, ['paine']), moveCmd(A.blastPunch, ['yuna'])])).toEqual(['first-blast-punch']);
  });

  it('the seams fire on the KO of Boris, of the Flame Dragon and of the Guardian Beast, and YSLS-Zero\'s fall plays no seam (it is the close)', () => {
    expect(fired(0, [], { koBoss: true })).toEqual([ids.GULLWINGS_SEAM_1]);
    expect(fired(1, [], { koBoss: true })).toEqual([ids.GULLWINGS_SEAM_2]);
    expect(fired(2, [], { koBoss: true })).toEqual([ids.GULLWINGS_SEAM_3]);
    expect(fired(3, [], { koBoss: true })).toEqual([]);
  });
});

describe('the stage and the store', () => {
  it('the scene key is the Zanarkand Dome\'s registered scene (a factory, not a placeholder): one plate for all four acts (DR4, a flagged stand-in)', () => {
    expect(FFX2_GULLWINGS_CH1.sceneKey).toBe(ids.GULLWINGS_CH1_SCENE);
    const scene = getScene(FFX2_GULLWINGS_CH1.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_GULLWINGS_CH1.sceneKey), 'has a factory').toBeDefined();
  });

  it('an attempt and a clear go to the experiments\' store under the chapter\'s id, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ids.GULLWINGS_CH1_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ids.GULLWINGS_CH1_ID);
      experimentProgress.recordClear(ids.GULLWINGS_CH1_ID, 600_000, 4);
      expect(experimentRecord(ids.GULLWINGS_CH1_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 600_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ids.GULLWINGS_CH1_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
