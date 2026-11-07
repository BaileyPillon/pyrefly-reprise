/**
 * The Youth League Tournament (the hidden FFX-2 chapter): the flow around the seven fights, through the app's own path (`registerBattleContent`, `setupForChapter`, `findEnemyGroup`, `setupForNextLink`, the retry
 * checkpoint), every act to a victory and to a defeat, and three seeded engine runs of each fight. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and act 1, no escape, the chapter's nine triggers; the engine offers no Escape row on any act.
 * 2. **The chain to victory**: seven acts in the road's order, each a fresh fight with the party CARRIED whole (HP, MP, KO, items, statuses, the dressphere worn); the last act has no next link and its win ends the tournament.
 * 3. **Three seeded runs of each fight** by the sourced line: each ends in a verdict, never a stalemate, the same on a second run of the same seed (determinism), and every fighter uses only moves of its own list.
 * 4. **The defeat and the retry**: a party that only defends loses every act; a defeat on act 2 to 7 retries THAT act from the state the party entered it (kept as it was: this chapter never restores the party), a defeat on
 *    act 1 has no checkpoint and starts the chapter over.
 * 5. **The triggers**: the six barks fire once each, when the act's last fighter falls (the FFX-2 \`all-ko\`), never in another act, and act 7's fall plays no bark (it is the close); the three callouts fire once, after their move.
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
import { FFX2_YOUTH_LEAGUE } from '../../../src/data/chapter-ffx2-youth-league.ts';
import { youthLeagueGroups } from '../../../src/data/ffx2/enemies/youth-league.ts';
import { YL_ABILITY as A } from '../../../src/data/ffx2/enemies/youth-league-abilities.ts';
import * as ids from '../../../src/data/youth-league-ids.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { ACTS, GIRLS, attackOf, driveChain, fight, forced, foesOf, girlsOf, logOf, move, nextInput, playUntil, unit, type Act } from '../helpers/youthLeagueDrive.ts';

const MAX_LINKS = 9;

/** A fresh engine for a setup (the app's own engine options). */
function engineFor(setup: BattleSetup): FFX2Engine {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** Win the act: every fighter but the last is rigged down (HP 0), the last is put at 1 HP and the first girl to act strikes it. Returns the engine's outcome. */
function winAct(engine: FFX2Engine): { outcome: string } {
  const foes = foesOf(engine);
  foes.forEach((f, i) => {
    if (i < foes.length - 1) {
      f.hp = 0;
      f.alive = false;
      (f.statuses as Record<string, unknown>)['ko'] = { id: 'ko', ticksRemaining: null, stacks: 1 };
    } else f.hp = 1;
  });
  const last = foes[foes.length - 1]!;
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: String(d.result.outcome) };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    engine.submit(attackOf(d, last.id));
  }
  throw new Error('the act did not end');
}

describe('the setup', () => {
  it('plays the chapter\'s party against act 1, cannot be fled, and carries the nine triggers', async () => {
    await registerBattleContent();
    const setup = setupForChapter(FFX2_YOUTH_LEAGUE, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.enemies).toBe(youthLeagueGroups[0]);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-phoenix-down', ...ids.YL_SEAM_IDS.slice(0, 5), 'first-guard', ids.YL_SEAM_IDS[5], 'first-harbinger']);
  });

  it('the engine offers no Escape row on any act', async () => {
    await registerBattleContent();
    for (const act of ACTS) {
      const engine = engineFor({ ...setupForChapter(FFX2_YOUTH_LEAGUE, 3), enemies: youthLeagueGroups[act]! });
      const d = nextInput(engine, 4000);
      expect(d, `act ${act + 1}`).not.toBeNull();
      expect(d!.commands.filter((c) => c.enabled && /escape|flee/i.test(c.command.kind)), `act ${act + 1}`).toHaveLength(0);
    }
  });

  it('the chain loop finds each next formation by id, and the data objects are the ones the chapter names', async () => {
    await registerBattleContent();
    let group: EnemyGroupDef = FFX2_YOUTH_LEAGUE.enemyGroupRef;
    const seen: string[] = [group.id];
    for (let i = 0; i < MAX_LINKS && group.nextGroupId; i++) {
      const next = await findEnemyGroup(group.nextGroupId);
      expect(next, group.nextGroupId).toBeDefined();
      group = next!;
      seen.push(group.id);
    }
    expect(seen).toEqual([...ids.YOUTH_LEAGUE_GROUP_IDS]);
    expect(group).toBe(youthLeagueGroups[6]);
  });
});

describe('the chain to a victory, every act', () => {
  it('seven acts, each a fresh fight with the party CARRIED whole: HP, MP, a fallen girl, statuses and items spent all stay as the last act left them; the last act has no next', async () => {
    await registerBattleContent();
    for (const seed of [1, 2]) {
      let setup = setupForChapter(FFX2_YOUTH_LEAGUE, seed);
      let group: EnemyGroupDef = setup.enemies;
      const outcomes: string[] = [];
      let engine = engineFor(setup);
      for (let act = 0; act < 7; act++) {
        expect(group.enemies.map((e) => e.id), `seed ${seed} act ${act + 1}`).toEqual([...ids.ACT_ENEMY_IDS[act]!]);
        outcomes.push(winAct(engine).outcome);
        // Wreck the party on the way out: Yuna 123 HP and 7 MP, Rikku down, Paine hasted, one Megalixir... a Hi-Potion... spent. The next act must open exactly so.
        const after = engine.state();
        const yuna = after.combatants['yuna'] as unknown as { hp: number; mp: number };
        const rikku = after.combatants['rikku'] as unknown as { hp: number; mp: number; alive: boolean; statuses: Record<string, unknown> };
        const paine = after.combatants['paine'] as unknown as { statuses: Record<string, unknown> };
        yuna.hp = 123;
        yuna.mp = 7;
        rikku.hp = 0;
        rikku.alive = false;
        rikku.statuses['ko'] = { id: 'ko', ticksRemaining: null, stacks: 1 };
        paine.statuses['haste'] = { id: 'haste', turnsRemaining: null, ticksRemaining: 99_999, charges: null, stacks: 0, permanent: false };
        const bag = after.flags['inventory:x2-hi-potion'];
        after.flags['inventory:x2-hi-potion'] = Number(bag) - act - 1;
        if (!group.nextGroupId) break;
        const next = await findEnemyGroup(group.nextGroupId);
        expect(next).toBeDefined();
        setup = setupForNextLink(setup, next!, after as BattleState, seed + act + 1);
        group = next!;
        engine = engineFor(setup);
        expect([unit(engine, 'yuna').hp, unit(engine, 'yuna').mp], `seed ${seed} act ${act + 2}: carried, not restored`).toEqual([123, 7]);
        expect([unit(engine, 'rikku').alive, unit(engine, 'rikku').hp], `seed ${seed} act ${act + 2}`).toEqual([false, 0]);
        expect(unit(engine, 'paine').statuses['haste'], `seed ${seed} act ${act + 2}: statuses carry`).toBeDefined();
        expect(engine.state().flags['inventory:x2-hi-potion'], `seed ${seed} act ${act + 2}: items spent stay spent`).toBe(Number(bag) - act - 1);
        // Put the party back on its feet for the next act (the rig above is the test's, the next act's carry is what is measured).
        unit(engine, 'rikku').alive = true;
        unit(engine, 'rikku').hp = 500;
        delete (unit(engine, 'rikku').statuses as Record<string, unknown>)['ko'];
      }
      expect(outcomes, `seed ${seed}`).toEqual(Array(7).fill('victory'));
      expect(group.nextGroupId).toBeUndefined();
      expect(group.id).toBe(ids.ACT_7_GROUP_ID);
    }
  }, 180_000);
});

describe('three seeded runs of each fight (the sourced line), through the real engine', () => {
  it('each act on seeds 1 to 3 ends in a verdict (never a stalemate), the same seed gives the same fight twice, and every fighter uses only moves of its own list', () => {
    for (const act of ACTS) {
      for (const seed of [1, 2, 3]) {
        const a = fight(act, seed, 'darkness', { maxDecisions: 60_000 });
        const b = fight(act, seed, 'darkness', { maxDecisions: 60_000 });
        expect(['victory', 'defeat'], `act ${act + 1} seed ${seed}`).toContain(a.outcome);
        expect([b.outcome, b.ticks, b.kos, b.moves], `act ${act + 1} seed ${seed}: determinism`).toEqual([a.outcome, a.ticks, a.kos, a.moves]);
        const used = new Set(youthLeagueGroups[act]!.enemies.flatMap((e) => e.abilityIds));
        for (const id of Object.keys(a.moves)) expect(used.has(id), `act ${act + 1} seed ${seed}: ${id}`).toBe(true);
        expect(Object.keys(a.moves).length, `act ${act + 1} seed ${seed}`).toBeGreaterThan(0);
      }
    }
  }, 240_000);
});

describe('the shipped auto-battler plays the chain through the app path', () => {
  it('it neither throws nor wedges: it reaches a verdict on every seed', async () => {
    await registerBattleContent();
    for (const seed of [1, 2, 3, 4]) {
      const r = await playChain(FFX2_YOUTH_LEAGUE, seed, 'bench');
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(r.outcome);
    }
  }, 240_000);

  it('the driver of the chain (the sourced line, the app\'s carry and checkpoint) plays act after act and a defeat stops it unless a retry is allowed', async () => {
    await registerBattleContent();
    const run = await driveChain('darkness', 1, { retries: 3 });
    expect(run.outcomes.length).toBeGreaterThanOrEqual(7);
    expect(['victory', 'defeat']).toContain(run.outcome);
  }, 240_000);
});

describe('the defeat and the retry checkpoint', () => {
  it('a party that only defends loses to every act (the engine ends the fight in defeat, never in a stalemate)', async () => {
    await registerBattleContent();
    for (const act of ACTS) {
      const engine = engineFor({ ...setupForChapter(FFX2_YOUTH_LEAGUE, 5), enemies: youthLeagueGroups[act]! });
      let outcome = '';
      for (let i = 0; i < 40_000 && outcome === ''; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') outcome = String(d.result.outcome);
        else if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      expect(outcome, `act ${act + 1}`).toBe('defeat');
    }
  }, 240_000);

  it('acts 2 to 7 are retry checkpoints (links 2 to 7): the retry opens THAT act with fresh fighters and the party as it entered, kept as it was (no restore); act 1 has none, so a defeat there starts the chapter over', async () => {
    await registerBattleContent();
    const first = setupForChapter(FFX2_YOUTH_LEAGUE, 9);
    expect(checkpointAt(1, youthLeagueGroups[0]!, first)).toBeNull();
    for (let act = 1; act < 7; act++) {
      const wrecked = {
        ...first,
        enemies: youthLeagueGroups[act]!,
        party: {
          ...first.party,
          members: (first.party as { members: Array<{ id: string; hp?: number; mp?: number }> }).members.map((m) => ({ ...m, hp: m.id === 'rikku' ? 0 : 1000, mp: 5 })),
        },
      } as BattleSetup;
      const cp = checkpointAt(act + 1, youthLeagueGroups[act]!, wrecked);
      expect(cp, `link ${act + 1}`).not.toBeNull();
      const retry = resumeSetup(cp!, 77);
      expect(retry.enemies.id, `link ${act + 1}`).toBe(youthLeagueGroups[act]!.id);
      const engine = engineFor(retry);
      expect(unit(engine, 'yuna').hp, `link ${act + 1}: the party is as it entered`).toBe(1000);
      expect(unit(engine, 'rikku').alive, `link ${act + 1}`).toBe(false);
      for (const foe of foesOf(engine)) expect(foe.hp, `link ${act + 1} ${foe.id}`).toBe(foe.stats.maxHp);
    }
  });
});

describe('the story triggers fire as the real engine plays the fights', () => {
  /** Play `act` with fighter `index`'s script answering `commands` and the chapter\'s own triggers; return the names of the script-triggers that fired. */
  function fired(act: Act, index: number, commands: ReturnType<typeof move>[], opts: { winAct?: boolean } = {}): string[] {
    const f = forced(act, index, { quiet: true });
    const setup = { ...setupForChapter(FFX2_YOUTH_LEAGUE, 4), enemies: f.group };
    const engine = engineFor(setup);
    f.forced.queue.push(...commands);
    if (opts.winAct) {
      winAct(engine);
    } else {
      expect(playUntil(engine, (e) => logOf(e).filter((x) => x.type === 'action-end' && x.actorId === f.group.enemies[index]!.id).length >= commands.length + 2, { immortal: true, maxDecisions: 2000 })).toBe(true);
    }
    return logOf(engine)
      .filter((e) => e.type === 'script-trigger')
      .map((e) => (e as unknown as { name: string }).name);
  }

  it('each callout fires once, after its move: Yaibal\'s Phoenix Down, Elma\'s Guard, Lucil\'s Harbinger', () => {
    // Yuna is rigged down before Yaibal raises her.
    const f = forced(0, 0, { quiet: true });
    const engine = engineFor({ ...setupForChapter(FFX2_YOUTH_LEAGUE, 4), enemies: f.group });
    const yuna = unit(engine, 'yuna');
    yuna.hp = 0;
    yuna.alive = false;
    (yuna.statuses as Record<string, unknown>)['ko'] = { id: 'ko', ticksRemaining: null, stacks: 1 };
    f.forced.queue.push(move(A.phoenixDown, ['yuna']), move(A.phoenixDown, ['yuna']));
    expect(playUntil(engine, (e) => logOf(e).filter((x) => x.type === 'action-end' && x.actorId === ids.X2_YAIBAL_ID).length >= 2, { immortal: false, maxDecisions: 2000 })).toBe(true);
    expect(logOf(engine).filter((e) => e.type === 'script-trigger').map((e) => (e as unknown as { name: string }).name)).toEqual(['first-phoenix-down']);
    expect(fired(5, 0, [move(A.guard, []), move(A.guard, [])])).toEqual(['first-guard']);
    expect(fired(6, 0, [move(A.harbinger, ['yuna']), move(A.harbinger, ['rikku'])])).toEqual(['first-harbinger']);
  });

  it('a bark fires when the act\'s LAST fighter falls (the fighters falling one by one play nothing), once, and only in its own act', () => {
    for (let act = 0; act < 6; act++) {
      const names = fired(act as Act, 0, [], { winAct: true });
      expect(names, `act ${act + 1}`).toEqual([ids.YL_SEAM_IDS[act]]);
    }
    // Rigged down but one: nothing has fired yet.
    const setup = setupForChapter(FFX2_YOUTH_LEAGUE, 4);
    const engine = engineFor(setup);
    const foes = foesOf(engine);
    foes[0]!.hp = 1;
    for (let i = 0; i < 4000 && foesOf(engine)[0]!.alive; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') engine.submit(attackOf(d, foes[0]!.id));
    }
    expect(foesOf(engine)[0]!.alive).toBe(false);
    expect(foesOf(engine).some((f) => f.alive), 'two warriors still stand').toBe(true);
    expect(logOf(engine).filter((e) => e.type === 'script-trigger')).toEqual([]);
  });

  it('act 7\'s fall plays no bark (it is the close): no trigger fires when Lucil falls', () => {
    expect(fired(6, 0, [], { winAct: true })).toEqual([]);
  });
});

describe('the stage and the store', () => {
  it('the scene key is the Den of Woe\'s registered scene (a factory, not a placeholder)', () => {
    expect(FFX2_YOUTH_LEAGUE.sceneKey).toBe(ids.YOUTH_LEAGUE_SCENE);
    const scene = getScene(FFX2_YOUTH_LEAGUE.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_YOUTH_LEAGUE.sceneKey), 'has a factory').toBeDefined();
  });

  it('an attempt and a clear go to the experiments\' store under the chapter\'s id, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ids.YOUTH_LEAGUE_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ids.YOUTH_LEAGUE_ID);
      experimentProgress.recordClear(ids.YOUTH_LEAGUE_ID, 900_000, 3);
      expect(experimentRecord(ids.YOUTH_LEAGUE_ID)).toMatchObject({ attempts: 1, clears: 1, bestTimeMs: 900_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ids.YOUTH_LEAGUE_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});

void GIRLS;
void girlsOf;
