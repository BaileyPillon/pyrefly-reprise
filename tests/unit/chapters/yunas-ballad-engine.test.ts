/**
 * Yuna's Ballad (the possessed Rikku, then the possessed Paine; the hidden FFX-2 chapter) on the real engine: the party of ONE, the moves with the game's rows, and the seam between the duels. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The T0 check of the preflight (`docs/plans/ch-wraith-review.md` §3 row 1, the risk that decided the lane's size): `FFX2PartyBuild.members` is a union of tuples since 2026-11-06, and the core already built the
 * line-up from the list's length, so a party of one needs no engine change. This file pins that a party of one PLAYS (builds, takes decisions, ends), and that nothing of it leaks into the three-girl chapters
 * (`yunas-ballad-party.test.ts`).
 *
 * What it pins, each against the engine and not the script (a forced script returns the move the test names, `helpers/yunasBalladDrive.ts#forced`):
 * 1. **The party of one**: one combatant on the party side, `activeIds` is Yuna alone, slot 0, no reserve; a duel ends in a result.
 * 2. **The moves with the rows' numbers** [RE §7]: the four throws are a flat 281 to 317 whatever Shell and Protect do; the Grenade is 187 to 211 on the party and Protect halves it; Spider Attack is two hits; Paine's Attack
 *    is one hit of about 417 before Defense and Protect halves it.
 * 3. **Status** [RE §4.2]: a Silver Hourglass slows either fighter (Slow lands); a Confused Rikku keeps throwing the script's strong items (the weak ones of her record list are unreachable: pick YB9, a known gap).
 * 4. **The seam**: the second duel is entered with the HP and MP Yuna left the first with (YB2) and the bag as it stood.
 * 5. **Three seeds of each duel to a result** under a named line, deterministic (the same seed, the same log).
 */
import { describe, expect, it } from 'vitest';

import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import { yunasBalladBuild } from '../../../src/data/ffx2/builds/yunas-ballad.ts';
import {
  POSSESSED_PAINE_ATTACK_ID,
  POSSESSED_RIKKU_ARCTIC_WIND_ID,
  POSSESSED_RIKKU_BOMB_CORE_ID,
  POSSESSED_RIKKU_DRAGON_SCALE_ID,
  POSSESSED_RIKKU_GRENADE_ID,
  POSSESSED_RIKKU_LIGHTNING_MARBLE_ID,
  POSSESSED_RIKKU_SPIDER_ATTACK_ID,
} from '../../../src/data/ffx2/enemies/yunas-ballad-abilities.ts';
import { paineDuelGroup } from '../../../src/data/ffx2/enemies/yunas-ballad.ts';
import {
  LINES,
  bossOf,
  driveChapter,
  endsOf,
  forced,
  logOf,
  move,
  openDuel,
  outcomeOf,
  playUntilBossActed,
  runDuel,
  setupOf,
  turnOf,
  unit,
  yunaOf,
  type Duel,
} from '../helpers/yunasBalladDrive.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

const THROWS = [POSSESSED_RIKKU_BOMB_CORE_ID, POSSESSED_RIKKU_ARCTIC_WIND_ID, POSSESSED_RIKKU_LIGHTNING_MARBLE_ID, POSSESSED_RIKKU_DRAGON_SCALE_ID];

/** A status the way a cast lays it (a rig: the damage tests give Yuna Protect or Shell without spending her turn). */
function give(engine: FFX2Engine, status: 'protect' | 'shell'): void {
  applyStatus(yunaOf(engine) as never, { status, chance: 255, duration: 255 });
}

/** The damage amounts the fighter's first move put on Yuna, in order. */
function hitsOn(engine: FFX2Engine, target = 'yuna'): number[] {
  return logOf(engine).filter((e) => e.type === 'damage' && e.targetId === target).map((e) => e.amount as number);
}

/** Open a duel whose fighter does `command` once, on seed `seed`, with `setup` applied to the engine before it acts. */
function moveOnce(duel: Duel, id: string, targets: string[], seed: number, setup?: (e: FFX2Engine) => void): FFX2Engine {
  const f = forced(duel);
  const engine = openDuel(duel, seed, { group: f.group });
  setup?.(engine);
  f.forced.queue.push(move(id, targets));
  expect(playUntilBossActed(engine, bossOf(duel), 1), `${id} on seed ${seed}`).toBe(true);
  return engine;
}

describe('a party of one plays (T0)', () => {
  it('the chapter\'s party is Yuna alone; the engine builds one party combatant, activeIds is her, no reserve, slot 0', () => {
    expect(yunasBalladBuild.members).toHaveLength(1);
    expect(yunasBalladBuild.members[0].id).toBe('yuna');
    for (const duel of [0, 1] as const) {
      const engine = openDuel(duel, 5);
      const state = engine.state();
      expect(state.activeIds).toEqual(['yuna']);
      expect(state.reserveIds).toEqual([]);
      expect(state.enemyIds).toEqual([bossOf(duel)]);
      expect(Object.values(state.combatants).filter((c) => c.side === 'party').map((c) => c.id)).toEqual(['yuna']);
      expect(yunaOf(engine).slot).toBe(0);
      expect(yunaOf(engine).hp).toBe(yunaOf(engine).stats.maxHp);
    }
  });

  it('takes decisions: Yuna is offered a command menu, and it holds her White Mage spells, the Changes to Gunner, Warrior and Lady Luck, and the bag', () => {
    const engine = openDuel(0, 1);
    let rows: string[] = [];
    for (let i = 0; i < 400 && rows.length === 0; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') rows = d.commands.filter((c) => c.enabled).map((c) => (c.command.kind === 'spherechange' ? `change:${c.command.extra.toDressphere}` : `${c.command.kind}:${'id' in c.command ? (c.command as { id: string }).id : ''}`));
    }
    expect(rows).toEqual(expect.arrayContaining(['ability:x2-white-mage-cura', 'change:gunner', 'change:warrior', 'change:lady-luck', 'item:x2-hero-drink', 'item:x2-x-potion']));
  });

  it('a battle is over when Yuna falls: a defending Yuna loses duel 1 to Rikku, and the result says so', () => {
    const engine = openDuel(0, 2);
    const run = runDuel(engine, 0, () => null);
    expect(run.outcome).toBe('defeat');
    expect(outcomeOf(engine)).toBe('defeat');
    expect(yunaOf(engine).alive).toBe(false);
  });
});

describe('the moves, with the rows\' numbers [RE §7]', () => {
  it('each of the four throws is a flat 281 to 317 on Yuna, on every seed, and whatever Protect and Shell do (the row has no type bit)', () => {
    for (const id of THROWS) {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const engine = moveOnce(0, id, ['yuna'], seed, (e) => {
          if (seed % 2 === 0) {
            give(e, 'protect');
            give(e, 'shell');
          }
        });
        const hits = hitsOn(engine);
        expect(hits, `${id} seed ${seed}`).toHaveLength(1);
        expect(hits[0]!, `${id} seed ${seed}`).toBeGreaterThanOrEqual(281);
        expect(hits[0]!, `${id} seed ${seed}`).toBeLessThanOrEqual(317);
      }
    }
  });

  it('Grenade is 187 to 211 on the party (Yuna alone: one hit), and Protect halves it (the row\'s physical bit) while Shell does not', () => {
    const plain = [1, 2, 3, 4].map((seed) => hitsOn(moveOnce(0, POSSESSED_RIKKU_GRENADE_ID, [], seed)));
    for (const hits of plain) {
      expect(hits).toHaveLength(1);
      expect(hits[0]!).toBeGreaterThanOrEqual(187);
      expect(hits[0]!).toBeLessThanOrEqual(211);
    }
    const protectedHits = [1, 2, 3, 4].map((seed) => hitsOn(moveOnce(0, POSSESSED_RIKKU_GRENADE_ID, [], seed, (e) => give(e, 'protect'))));
    for (const hits of protectedHits) {
      expect(hits).toHaveLength(1);
      expect(hits[0]!).toBeGreaterThanOrEqual(Math.floor(187 / 2));
      expect(hits[0]!).toBeLessThanOrEqual(Math.ceil(211 / 2));
    }
    const shelled = [1, 2, 3, 4].map((seed) => hitsOn(moveOnce(0, POSSESSED_RIKKU_GRENADE_ID, [], seed, (e) => give(e, 'shell'))));
    for (const hits of shelled) {
      expect(hits[0]!).toBeGreaterThanOrEqual(187);
      expect(hits[0]!).toBeLessThanOrEqual(211);
    }
  });

  it('Spider Attack is two hits at Yuna (each may miss), each of the order of the row\'s attacker term 248 before Defense', () => {
    const counts: number[] = [];
    for (let seed = 1; seed <= 12; seed++) {
      const engine = moveOnce(0, POSSESSED_RIKKU_SPIDER_ATTACK_ID, ['yuna'], seed);
      const damage = logOf(engine).filter((e) => e.type === 'damage' && e.targetId === 'yuna');
      expect(damage.length, `seed ${seed}`).toBeLessThanOrEqual(2);
      for (const d of damage) {
        expect(d.amount as number, `seed ${seed}`).toBeGreaterThan(100);
        expect(d.amount as number, `seed ${seed}`).toBeLessThan(900);
      }
      counts.push(damage.length);
    }
    expect(Math.max(...counts), 'two hits land on at least one seed').toBe(2);
  });

  it('Paine\'s Attack is one hit of the order of 417 before Defense (Yuna\'s Defense is low), and Protect halves it', () => {
    let landed = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const plain = hitsOn(moveOnce(1, POSSESSED_PAINE_ATTACK_ID, ['yuna'], seed));
      const guarded = hitsOn(moveOnce(1, POSSESSED_PAINE_ATTACK_ID, ['yuna'], seed, (e) => give(e, 'protect')));
      expect(plain.length, `seed ${seed}`).toBeLessThanOrEqual(1);
      expect(guarded.length, `seed ${seed}`).toBeLessThanOrEqual(1);
      if (plain.length === 1) {
        landed++;
        expect(plain[0]!, `seed ${seed}`).toBeGreaterThan(250);
        expect(plain[0]!, `seed ${seed}`).toBeLessThan(700);
      }
      if (plain.length === 1 && guarded.length === 1) expect(guarded[0]!, `seed ${seed}`).toBeLessThan(plain[0]! * 0.6);
    }
    expect(landed, 'the Attack lands on most seeds').toBeGreaterThanOrEqual(3);
  });

  it('the fighter acts on her own clock: Paine (AGI 51) is slower than Rikku (AGI 82): six of Rikku\'s actions take less game time than six of Paine\'s', () => {
    const rikku = openDuel(0, 9);
    const paine = openDuel(1, 9);
    playUntilBossActed(rikku, bossOf(0), 6);
    playUntilBossActed(paine, bossOf(1), 6);
    expect(endsOf(rikku, bossOf(0))).toBeGreaterThanOrEqual(6);
    expect(endsOf(paine, bossOf(1))).toBeGreaterThanOrEqual(6);
    expect(rikku.state().ticks).toBeLessThan(paine.state().ticks);
  });
});

describe('status [RE §4.2]', () => {
  it('Slow lands on both fighters (a Silver Hourglass; Slow reads 0)', () => {
    for (const duel of [0, 1] as const) {
      const build = structuredClone(yunasBalladBuild);
      build.inventory = [...build.inventory, { itemId: 'x2-silver-hourglass', count: 3 }];
      const engine = openDuel(duel, 3, { build });
      let thrown = false;
      for (let i = 0; i < 400 && !thrown; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') {
          const row = d.commands.find((c) => c.enabled && c.command.kind === 'item' && c.command.id === 'x2-silver-hourglass');
          expect(row, 'the bag offers the hourglass').toBeDefined();
          engine.submit({ ...row!.command, targets: [bossOf(duel)] } as never);
          thrown = true;
        }
      }
      let slowed = false;
      for (let i = 0; i < 400 && !slowed; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
        else if (d.kind === 'battle-over') break;
        slowed = unit(engine, bossOf(duel)).statuses['slow'] !== undefined;
      }
      expect(slowed, `the ${duel === 0 ? 'possessed Rikku' : 'possessed Paine'} can be slowed`).toBe(true);
    }
  });

  it('KNOWN GAP (pick YB9): a Confused Rikku is left to her script, so she still throws the STRONG items; the weak versions of her record list are unreachable', () => {
    const engine = openDuel(0, 4);
    applyStatus(unit(engine, bossOf(0)) as never, { status: 'confuse', chance: 255, duration: 255 });
    playUntilBossActed(engine, bossOf(0), 8, () => null);
    const used = logOf(engine).filter((e) => e.type === 'action-start' && e.actorId === bossOf(0)).map((e) => e.abilityId as string);
    expect(used.length).toBeGreaterThanOrEqual(1);
    const strong = new Set<string>([POSSESSED_RIKKU_SPIDER_ATTACK_ID, POSSESSED_RIKKU_GRENADE_ID, ...THROWS]);
    for (const id of used) expect(strong.has(id), id).toBe(true);
  });
});

describe('the seam between the duels (YB2)', () => {
  it('duel 2 is entered with the HP and MP Yuna left duel 1 with, the bag as it stood, and nothing healed', () => {
    const engine = openDuel(0, 6);
    const run = runDuel(engine, 0, turnOf(LINES.warrior));
    expect(run.outcome).toBe('victory');
    const yuna = yunaOf(engine);
    const left = { hp: yuna.hp, mp: yuna.mp };
    const stock = engine.state().flags['inventory:x2-x-potion'];
    const next = setupForNextLink(setupOf(0, 6), paineDuelGroup, engine.state(), 7);
    expect(next.party.game).toBe('ffx2');
    if (next.party.game !== 'ffx2') return;
    expect(next.party.members).toHaveLength(1);
    expect(next.enemies).toBe(paineDuelGroup);
    expect(next.condition).toBe('scripted');
    const second = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    second.setSeed(7);
    second.init(next);
    const entered = yunaOf(second);
    expect([entered.hp, entered.mp]).toEqual([Math.min(left.hp, entered.stats.maxHp), left.mp]);
    expect(entered.mp, 'her MP is what she left with, not full').toBeLessThanOrEqual(entered.stats.maxMp);
    expect(next.party.inventory.find((i) => i.itemId === 'x2-x-potion')?.count).toBe(stock);
  });

  it('the whole chapter on a seed: both duels end in a victory, and the second one begins where the first left off', () => {
    const run = driveChapter(turnOf(LINES.warrior), 11);
    expect(run.outcome).toBe('victory');
    expect(run.duels).toHaveLength(2);
    expect(run.duels[0]!.outcome).toBe('victory');
    expect(run.duels[1]!.outcome).toBe('victory');
  });

  it('a defeat in duel 1 ends the run (the retry starts over); there is nothing to carry', () => {
    const run = driveChapter(() => null, 12);
    expect(run.outcome).toBe('defeat');
    expect(run.duels).toHaveLength(1);
  });
});

describe('three seeds of each duel to a result, deterministic', () => {
  for (const duel of [0, 1] as const) {
    for (const seed of [21, 22, 23]) {
      it(`${duel === 0 ? 'the possessed Rikku' : 'the possessed Paine'} on seed ${seed}: a warrior line wins, and the same seed gives the same log`, () => {
        const a = openDuel(duel, seed);
        const b = openDuel(duel, seed);
        const runA = runDuel(a, duel, turnOf(LINES.warrior));
        const runB = runDuel(b, duel, turnOf(LINES.warrior));
        expect(runA.outcome).toBe('victory');
        expect(JSON.stringify(logOf(a))).toBe(JSON.stringify(logOf(b)));
        expect(runA.ticks).toBe(runB.ticks);
        expect(runA.bossActions).toBeGreaterThan(2);
        // only the moves of the fighter's own script were used
        const allowed = duel === 0 ? new Set([POSSESSED_RIKKU_SPIDER_ATTACK_ID, POSSESSED_RIKKU_GRENADE_ID, ...THROWS]) : new Set([POSSESSED_PAINE_ATTACK_ID]);
        for (const id of Object.keys(runA.moves)) expect(allowed.has(id), id).toBe(true);
      });
    }
  }
});
