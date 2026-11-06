/**
 * The hidden Flooded Ways chapter's chain (FFX only): Evrae Altana's HP rides from area to area, the members the water shattered stand again, a link whose boss already fell is skipped, the Baaj Temple is a fresh fight,
 * and the spoils are paid once at the end (`src/app/screens/BattleScreenFloodedCarry.ts`, `BattleScreenSetup.ts#setupForNextLink`, `BattleEncounterChain.ts`). Every case plays the real engine, seeded, and carries the
 * party as the chapter's flow does. A seeded run of every fight on three seeds closes it.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleResult, BattleSetup, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { ejectActor } from '../../../src/battle/ffx/hp.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { chainSpoils } from '../../../src/app/screens/BattleChainSpoils.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { carriedEnemyGroup, returnShattered, skipSpentLinks } from '../../../src/app/screens/BattleScreenFloodedCarry.ts';
import { actions, actor, content, ctxOf, defend, groupOf, invincible, log, newEngine, nextInput, nextInputOf, playChain, playEngine, row, setup } from '../helpers/floodedDrive.ts';
import { evraeOrdinary, evraePhoenix, geosgaenoLine } from '../helpers/floodedBench.ts';

const find = async (id: string) => ENEMY_GROUPS_BY_ID[id] ?? null;
const SWIM = ['tidus', 'wakka', 'rikku'] as const;

/** Area 1 played until both locks are open, the party kept alive; returns the engine and the setup it ran on. */
function areaOneCleared(seed: number): { engine: BattleEngine; start: BattleSetup } {
  const start = setup(seed, 'area-1');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(start);
  for (const lock of ['gate-lock-1', 'gate-lock-2']) {
    invincible(engine);
    const d = nextInput(engine);
    engine.submit(row(d, 'trigger', 'open-lock', lock)!);
  }
  return { engine, start };
}

describe("Evrae Altana's HP rides from area to area", () => {
  it('the next area opens with the HP the last one left it; the group data is not touched', () => {
    const { engine, start } = areaOneCleared(4);
    // Wear it down first: a different run where Tidus strikes before the locks open.
    const hurt = createFFXEngine({ content, autoResolveMinigames: true });
    hurt.init(start);
    invincible(hurt);
    hurt.submit(row(nextInput(hurt), 'attack', undefined, 'evrae-altana')!);
    const worn = actor(hurt, 'evrae-altana').hp;
    expect(worn).toBeLessThan(16_384);
    for (const lock of ['gate-lock-1', 'gate-lock-2']) {
      invincible(hurt);
      hurt.submit(row(nextInput(hurt), 'trigger', 'open-lock', lock)!);
    }
    const over = hurt.nextDecision();
    expect(over.kind).toBe('battle-over');
    const next = setupForNextLink(start, groupOf('area-2'), hurt.state(), 99) as BattleSetup;
    expect(next.enemies.enemies[0]!.hp).toBe(worn);
    expect(next.enemies.enemies[0]!.stats.maxHp).toBe(16_384);
    expect(next.enemies.enemies[1]!.hp).toBe(500); // the locks are new
    expect(groupOf('area-2').enemies[0]!.hp).toBe(16_384); // the shared data is not mutated
    // The full area-1 (no strike): 16,384 carried.
    const clean = setupForNextLink(start, groupOf('area-2'), engine.state(), 99) as BattleSetup;
    expect(clean.enemies.enemies[0]!.hp).toBe(16_384);
  });

  it('the engine opens area 2 with it: the same Zombie, a fresh Gaze first, and the party\'s HP as it stood', () => {
    const start = setup(5, 'area-1');
    const a1 = createFFXEngine({ content, autoResolveMinigames: true });
    a1.init(start);
    a1.submit(row(nextInput(a1), 'attack', undefined, 'evrae-altana')!);
    const evraeHp = actor(a1, 'evrae-altana').hp;
    for (const lock of ['gate-lock-1', 'gate-lock-2']) {
      invincible(a1);
      a1.submit(row(nextInput(a1), 'trigger', 'open-lock', lock)!);
    }
    a1.nextDecision();
    const next = setupForNextLink(start, groupOf('area-2'), a1.state(), 6) as BattleSetup;
    const hp = Object.fromEntries(next.party.members.map((m) => [m.id, m.hp])); // the carried HP (clamped under each member's own maximum)
    const a2 = createFFXEngine({ content, autoResolveMinigames: true });
    a2.init(next);
    expect(actor(a2, 'evrae-altana')).toMatchObject({ hp: evraeHp, alive: true });
    expect(actor(a2, 'evrae-altana').statuses['zombie']).toMatchObject({ permanent: true });
    for (const id of SWIM) expect(actor(a2, id).hp, id).toBe(hp[id]);
    playEngine(a2, () => defend(), 6);
    expect(actions(log(a2), 'evrae-altana')[0]).toBe('evrae-altana-stone-gaze'); // the flag starts at 0 in every area
  });

  it('a group without the flag comes back untouched (the same object)', () => {
    const e = newEngine(1, 'area-1');
    expect(carriedEnemyGroup(groupOf('area-1'), e.state())).toBe(groupOf('area-1'));
    expect(carriedEnemyGroup(groupOf('geosgaeno'), e.state())).toBe(groupOf('geosgaeno'));
  });
});

describe('the members the water shattered stand again, and nobody else does', () => {
  it('a shattered member returns in the next area with 1 HP; a member who was only knocked out stays knocked out', () => {
    const { engine, start } = areaOneCleared(6);
    ejectActor(ctxOf(engine), actor(engine, 'rikku'), 'shatter', true);
    actor(engine, 'wakka').hp = 0;
    actor(engine, 'wakka').alive = false;
    const next = setupForNextLink(start, groupOf('area-2'), engine.state(), 7) as BattleSetup;
    const rikku = next.party.members.find((m) => m.id === 'rikku')!;
    const wakka = next.party.members.find((m) => m.id === 'wakka')!;
    expect(rikku.hp).toBe(1);
    expect(wakka.hp).toBe(0);
    const a2 = createFFXEngine({ content, autoResolveMinigames: true });
    a2.init(next);
    expect(actor(a2, 'rikku')).toMatchObject({ hp: 1, alive: true, removed: false });
    expect(actor(a2, 'rikku').statuses['eject']).toBeUndefined();
    expect(actor(a2, 'wakka').alive).toBe(false);
  });

  it('only a link that says so brings them back: the same seam into a group without returnsShattered keeps the shattered at 0', () => {
    const { engine, start } = areaOneCleared(6);
    ejectActor(ctxOf(engine), actor(engine, 'rikku'), 'shatter', true);
    expect(returnShattered(start.party as FFXPartyBuild, engine.state(), groupOf('area-1'))).toBe(start.party);
    const kept = setupForNextLink(start, { ...groupOf('area-2'), returnsShattered: undefined }, engine.state(), 7) as BattleSetup;
    expect(kept.party.members.find((m) => m.id === 'rikku')!.hp).toBe(0);
  });
});

describe('a link whose boss already fell is skipped', () => {
  it('Evrae Altana down in area 1, 2 or 3: the chain goes on to Geosgaeno; standing: to the next area', async () => {
    const e = newEngine(1, 'area-1');
    const state = e.state();
    const boss = actor(e, 'evrae-altana');
    expect((await skipSpentLinks(groupOf('area-2'), state, find)).id).toBe('flooded-area-2');
    boss.hp = 0;
    boss.alive = false;
    expect((await skipSpentLinks(groupOf('area-2'), state, find)).id).toBe('flooded-geosgaeno');
    expect((await skipSpentLinks(groupOf('area-3'), state, find)).id).toBe('flooded-geosgaeno');
    expect((await skipSpentLinks(groupOf('geosgaeno'), state, find)).id).toBe('flooded-geosgaeno'); // not a carrying link: as it stands
  });

  it('through the chapter: Evrae falls to two Phoenix Downs in area 1, and the party fights Geosgaeno next, not areas 2 and 3', async () => {
    const result = await playChain(3, (engine, key) => playEngine(engine, key === 'geosgaeno' ? geosgaenoLine('smart') : evraePhoenix, 600));
    expect(result.steps.map((s) => s.key)).toEqual(['area-1', 'geosgaeno']);
    expect(result.steps[0]!.run).toMatchObject({ outcome: 'victory', nextGroupId: 'flooded-area-2' });
  });
});

describe('Geosgaeno is a fresh fight, and the spoils are paid once, at the end', () => {
  it('everyone is up and whole on entry, the bag keeps what was spent', () => {
    const { engine, start } = areaOneCleared(8);
    // Lose two members and spend Phoenix Downs before the seam.
    actor(engine, 'tidus').hp = 0;
    actor(engine, 'tidus').alive = false;
    ejectActor(ctxOf(engine), actor(engine, 'rikku'), 'shatter', true);
    engine.state().flags['inventory:phoenix-down'] = 7;
    const next = setupForNextLink(start, groupOf('geosgaeno'), engine.state(), 9) as BattleSetup;
    const geo = createFFXEngine({ content, autoResolveMinigames: true });
    geo.init(next);
    for (const id of SWIM) expect(actor(geo, id), id).toMatchObject({ alive: true, removed: false, hp: actor(geo, id).stats.maxHp });
    expect(geo.state().combatants['geosgaeno']).toBeDefined();
    const pd = nextInput(geo).commands.find((c) => c.command.kind === 'item' && c.command.id === 'phoenix-down');
    expect(pd?.enabled).toBe(true);
    expect(ctxOf(geo).rt.inventory.get('phoenix-down')).toBe(7);
  });

  it('the last link pays every link\'s gil: Evrae Altana\'s 3,000 and Geosgaeno\'s 1,000', async () => {
    const results: BattleResult[] = [];
    const { steps, outcome } = await playChain(
      2,
      (engine, key) => {
        const run = playEngine(engine, key === 'geosgaeno' ? geosgaenoLine('smart') : evraePhoenix, 600);
        const over = engine.nextDecision();
        if (over.kind === 'battle-over') results.push(over.result);
        return run;
      },
    );
    expect(outcome).toBe('victory');
    expect(steps.map((s) => s.run.outcome)).toEqual(['victory', 'victory']);
    expect(results).toHaveLength(2);
    const pooled = chainSpoils('ffx', results.slice(0, -1), results[results.length - 1]!, groupOf('geosgaeno').poolsChainSpoils === true);
    expect(pooled.gil).toBe(4_000);
    expect(pooled.ap).toBeGreaterThanOrEqual(5_800 + 4_200);
  });
});

describe('a seeded run of every fight on three seeds ends in a result and replays the same', () => {
  const lines = { 'area-1': evraeOrdinary, 'area-2': evraeOrdinary, 'area-3': evraeOrdinary, geosgaeno: geosgaenoLine('smart') } as const;
  for (const link of ['area-1', 'area-2', 'area-3', 'geosgaeno'] as const) {
    it(`${link}: seeds 1, 2 and 3 end (victory or defeat, never unfinished) and a second run of each is the same fight`, () => {
      for (const seed of [1, 2, 3]) {
        const play = (): { outcome: string; inputs: number; events: number } => {
          const e = newEngine(seed, link);
          const r = playEngine(e, lines[link], 700);
          return { outcome: r.outcome, inputs: r.inputs, events: log(e).length };
        };
        const a = play();
        expect(['victory', 'defeat'], `${link} seed ${seed}`).toContain(a.outcome);
        expect(play(), `${link} seed ${seed} replays`).toEqual(a);
      }
    });
  }

  it('the resumed link of a retry is the link as it was entered: replaying the carried setup twice is the same fight', () => {
    const { engine, start } = areaOneCleared(9);
    const next = setupForNextLink(start, groupOf('area-2'), engine.state(), 10) as BattleSetup;
    const play = (): string => {
      const e = createFFXEngine({ content, autoResolveMinigames: true });
      e.init(next);
      playEngine(e, () => defend(), 30);
      return JSON.stringify(log(e).map((x) => [x.type, 'amount' in x ? x.amount : '']));
    };
    expect(play()).toBe(play());
    void nextInputOf;
  });
});
