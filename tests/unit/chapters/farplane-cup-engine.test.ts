/**
 * The three duelists of the Farplane Cup on the real engine (the hidden FFX-2 chapter): the moves one at a time, with the duelist's script swapped for a queue of commands (`forced`), against the Lv 99 party.
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * The scripts have their own file (`farplane-cup-ai.test.ts`); the data has its own (`farplane-cup-data.test.ts`). This file checks what the ENGINE does with the rows, move by move, against what the research note says each
 * does (`research/re-ffx2-farplane-cup.md` §6 and §7), and pins the findings of the paper preflight's T0 checks (`docs/handoff/ch-farplane-cup.md`), each by a number the engine produced and not by the note:
 *
 * 1. **Auron** [RE §7]: Shooting Star ejects a girl (accuracy formula 3, Eject 254) and deals no HP damage; an Eject resist byte of 255 stops it. Dragon Fang hits all three, capped at 9,999. Full Break lands four stat
 *    stages at -2 where it hits. Mega-Potion is a fixed 2,000 and the X-Potion is capped at 9,999.
 * 2. **Tidus** [RE §7]: Blitz Ace is nine hits on one girl, Spiral Cut one; Hastega gives him Haste and the Hero Drink Invincible.
 * 3. **Seymour** [RE §7]: Demi takes 25 percent of each girl's current HP, Black Sky ten hits and Meteor twelve spread over the girls, Ultima is capped at 9,999 a girl, Dispel strips Shell, Protect, Haste and Regen from every
 *    girl, the Ups are +2 a cast. He absorbs Fire and Gravity (they heal him).
 * 4. **T0 finding (a), the Lv 99 party and the weak-chance statuses.** The status roll lands when `roll < chance + 5 x (attacker level - target level) - resist` (`kernel/statusGroup1.ts`), and the duelists are Lv 67 to 74
 *    against Lv 99: **every move whose chance byte is below about 160 can never land** (Shin Zantetsu's Death 80, Break's Petrify 80, Confuse 100, Slowga's Slow 130); only the 254 and 255 rows (Shooting Star's Eject) land.
 *    The moves are the game's rows and are not touched; the same rows land on a party of Lv 60 (pinned below with the girls' level lowered by the test, a rig).
 * 5. **T0 finding (b), Luck.** The girls wear Rabite's Foot (Luck 111): a physical move that rolls (the three Attacks, Full Break, Delay Buster, Shin Zantetsu, Drain Attack) is evaded nearly always; without it they land.
 */
import { describe, expect, it } from 'vitest';

import { farplaneCupBuild } from '../../../src/data/ffx2/builds/farplane-cup.ts';
import { CUP_ABILITY as A } from '../../../src/data/ffx2/enemies/farplane-cup-abilities.ts';
import {
  GIRLS,
  bossOf,
  damageOn,
  forced,
  girlsOf,
  logOf,
  move,
  openDuel,
  playUntilBossActed,
  rowOf,
  unit,
  type Duel,
  type Unit,
} from '../helpers/farplaneCupDrive.ts';

/** The build without the girls' accessories (no Rabite's Foot): the physical rolls and the Luck-free statuses land. */
const bareBuild = () => {
  const build = structuredClone(farplaneCupBuild);
  for (const m of build.members) m.accessories = [];
  return build;
};

/** Open a duel with the forced script and run until the duelist has done `commands`. */
function run(duel: Duel, commands: ReturnType<typeof move>[], seed = 1, setup?: (engine: ReturnType<typeof openDuel>) => void, build = structuredClone(farplaneCupBuild)) {
  const f = forced(duel);
  const engine = openDuel(duel, seed, { group: f.group, build, immortal: false });
  setup?.(engine);
  f.forced.queue.push(...commands);
  expect(playUntilBossActed(engine, bossOf(duel), commands.length)).toBe(true);
  return engine;
}

/** A rig: the girls' HP raised so that no multi-hit move puts one down before its last hit (the real HP is 10,710, 5,106 and 10,710). */
const bigHp = (engine: ReturnType<typeof openDuel>): void => {
  for (const g of girlsOf(engine)) {
    g.stats.maxHp = 900_000;
    g.hp = 900_000;
  }
};

const give = (u: Unit, status: string): void => {
  u.statuses[status as 'petrify'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
};
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

describe('Auron [RE §7]', () => {
  it('Shooting Star: no HP damage, Eject on the girl it is aimed at (20 of 20 seeds), and a girl whose Eject resist byte is 255 is never ejected', () => {
    let ejected = 0;
    for (const seed of SEEDS) {
      const engine = run(0, [move(A.shootingStar, ['yuna'])], seed);
      expect(damageOn(engine, 'yuna'), `seed ${seed}: no HP damage`).toEqual([]);
      if (unit(engine, 'yuna').statuses['eject'] !== undefined) ejected += 1;
    }
    expect(ejected, 'the Lv 99 party has no Eject resist, and the 254 byte lands').toBe(20);
    for (const seed of SEEDS) {
      const engine = run(0, [move(A.shootingStar, ['yuna'])], seed, (e) => {
        unit(e, 'yuna').immunities['eject'] = 255;
      });
      expect(unit(engine, 'yuna').statuses['eject'], `seed ${seed}: a resist byte of 255 is immune`).toBeUndefined();
    }
  });

  it('Dragon Fang: one hit on each of the three girls, none above 9,999 (the cap with the limit not broken), and nobody is put down at full HP', () => {
    const engine = run(0, [move(A.dragonFang)]);
    for (const id of GIRLS) {
      const hits = damageOn(engine, id);
      expect(hits, id).toHaveLength(1);
      expect(hits[0]!.amount, id).toBeGreaterThan(1_000);
      expect(hits[0]!.amount, id).toBeLessThanOrEqual(9_999);
      expect(unit(engine, id).alive, id).toBe(true);
    }
  });

  it('Full Break (accuracy formula 2): the Luck 111 of Rabite\'s Foot evades it; where it lands (the bare party) it is a real blow, but the four stat drops (chance 100) do not land on a Lv 99 girl (T0 a); on a Lv 74 girl they do, two stages each', () => {
    let evaded = 0;
    for (const seed of SEEDS) {
      const engine = run(0, [move(A.fullBreak, ['paine'])], seed);
      if (damageOn(engine, 'paine').length === 0) evaded += 1;
    }
    expect(evaded, 'with Luck 111 nearly every roll is a miss').toBeGreaterThanOrEqual(18);
    const engine = run(0, [move(A.fullBreak, ['paine'])], 1, undefined, bareBuild());
    expect(damageOn(engine, 'paine')).toHaveLength(1);
    expect(damageOn(engine, 'paine')[0]!.amount).toBeGreaterThan(1_000);
    expect(Object.keys(unit(engine, 'paine').statuses), 'chance 100 + 5 x (74 - 99) is below zero').toEqual([]);
    const low = run(0, [move(A.fullBreak, ['paine'])], 1, (e) => {
      for (const g of girlsOf(e)) g.level = 74;
    }, bareBuild());
    const statuses = unit(low, 'paine').statuses;
    for (const stage of ['str-down', 'mag-down', 'def-down', 'mdef-down']) expect((statuses[stage as 'petrify'] as unknown as { stacks: number } | undefined)?.stacks, stage).toBe(2);
    expect(Object.keys(statuses).filter((s) => s.endsWith('-down')).sort()).toEqual(['def-down', 'mag-down', 'mdef-down', 'str-down']);
  });

  it('Shin Zantetsu (Death at 80): never lands on the Lv 99 party (T0 a: 80 + 5 x (74 - 99) is below zero), even with no Luck; with the girls at Lv 74 and no Luck it does', () => {
    for (const seed of SEEDS) {
      const engine = run(0, [move(A.shinZantetsu)], seed, undefined, bareBuild());
      expect(girlsOf(engine).filter((g) => !g.alive), `seed ${seed}`).toEqual([]);
    }
    let killed = 0;
    for (const seed of SEEDS) {
      const engine = run(0, [move(A.shinZantetsu)], seed, (e) => {
        for (const g of girlsOf(e)) g.level = 74;
      }, bareBuild());
      killed += girlsOf(engine).filter((g) => !g.alive).length;
    }
    expect(killed, 'at equal levels the chance is the row\'s 80 percent').toBeGreaterThan(20);
  });

  it('Mega-Potion is a fixed 2,000 on his side (formula 5, power 40, no variance); the X-Potion heals 100 percent of max HP but is capped at 9,999', () => {
    const mega = run(0, [move(A.auronMegaPotion)], 1, (e) => {
      unit(e, 'x2-cup-auron').hp = 100_000;
    });
    expect(unit(mega, 'x2-cup-auron').hp).toBe(102_000);
    const x = run(0, [move(A.auronXPotion, ['x2-cup-auron'])], 1, (e) => {
      unit(e, 'x2-cup-auron').hp = 20_000;
    });
    expect(unit(x, 'x2-cup-auron').hp).toBe(29_999);
  });
});

describe('Tidus [RE §7]', () => {
  it('Blitz Ace: nine hits on one girl, always hitting (formula 0), each a real blow, together enough to put Rikku (5,106 HP) down; with the girls\' HP raised by the test (a rig) all nine are seen', () => {
    const engine = run(1, [move(A.blitzAce, ['rikku'])], 1, bigHp);
    const hits = damageOn(engine, 'rikku');
    expect(hits).toHaveLength(9);
    for (const h of hits) expect(h.amount).toBeGreaterThan(500);
    expect(hits.reduce((s, h) => s + (h.amount ?? 0), 0)).toBeGreaterThan(5_106);
    expect(new Set(hits.map((h) => h.hitCount))).toEqual(new Set([9]));
    // At Rikku's real HP, nine hits put her down.
    const real = run(1, [move(A.blitzAce, ['rikku'])]);
    expect(unit(real, 'rikku').alive).toBe(false);
  });

  it('Spiral Cut: one hit on one girl, harder than a single Blitz Ace hit (power 32 against 10)', () => {
    const spiral = run(1, [move(A.spiralCut, ['paine'])], 1, bigHp);
    const hits = damageOn(spiral, 'paine');
    expect(hits).toHaveLength(1);
    const blitz = run(1, [move(A.blitzAce, ['paine'])], 1, bigHp);
    const perHit = damageOn(blitz, 'paine')[0]!.amount ?? 0;
    expect(hits[0]!.amount ?? 0).toBeGreaterThan(perHit * 2);
  });

  it('Delay Buster (accuracy formula 2, ACC 139): Luck 111 lets it land on fewer than three seeds in five (8 of 20 here), a bare party takes it every time', () => {
    let hit = 0;
    let bareHits = 0;
    for (const seed of SEEDS) {
      hit += damageOn(run(1, [move(A.delayBuster, ['yuna'])], seed), 'yuna').length;
      bareHits += damageOn(run(1, [move(A.delayBuster, ['yuna'])], seed, undefined, bareBuild()), 'yuna').length;
    }
    expect(hit, 'Luck 111').toBeLessThan(13);
    expect(hit, 'but not never').toBeGreaterThan(0);
    expect(bareHits).toBe(20);
  });

  it('Hastega gives him Haste (his own, from Hastega); the Hero Drink gives him Invincible', () => {
    const engine = run(1, [move(A.hastega), move(A.heroDrink, ['x2-cup-tidus'])]);
    const t = unit(engine, 'x2-cup-tidus');
    expect(Object.keys(t.statuses).sort()).toEqual(['haste', 'invincible', 'spellspring']);
    expect((t.statuses['haste'] as unknown as { sourceAbilityId: string }).sourceAbilityId).toBe(A.hastega);
    expect((t.statuses['invincible'] as unknown as { sourceAbilityId: string }).sourceAbilityId).toBe(A.heroDrink);
  });

  it('Mega-Potion is the same fixed 2,000 on his side', () => {
    const engine = run(1, [move(A.tidusMegaPotion)], 1, (e) => {
      unit(e, 'x2-cup-tidus').hp = 50_000;
    });
    expect(unit(engine, 'x2-cup-tidus').hp).toBe(52_000);
  });
});

describe('the special words and the resist bytes on the engine [RE §4.1]', () => {
  /** A girl casts an ability on a target in a duel (the duelist's script is the forced empty one); returns the engine once the cast has resolved. */
  function castAs(duel: Duel, actor: string, abilityId: string, target: string, build = structuredClone(farplaneCupBuild)) {
    const f = forced(duel);
    const engine = openDuel(duel, 1, { build, group: f.group });
    unit(engine, target).hp = Math.floor(unit(engine, target).stats.maxHp / 2);
    let sent = false;
    let after = 0; // decisions after the cast: enough game time for it to resolve
    for (let i = 0; i < 800; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
      else if (d.kind === 'player-input') {
        const row = !sent && d.actorId === actor ? rowOf(d, 'ability', abilityId, [target]) : null;
        if (row) {
          engine.submit(row);
          sent = true;
        } else engine.submit({ kind: 'defend', targets: [] });
      }
      if (sent && ++after > 120) break;
    }
    expect(sent, abilityId).toBe(true);
    return engine;
  }

  it("special bit 0 (the percent formulas do nothing): Paine's Demi, 25 percent of current HP, takes nothing from Auron or Tidus", () => {
    for (const [duel, id] of [[0, 'x2-cup-auron'], [1, 'x2-cup-tidus']] as Array<[Duel, string]>) {
      const engine = castAs(duel, 'paine', 'x2-dark-knight-demi', id);
      const before = Math.floor(unit(engine, id).stats.maxHp / 2);
      expect(unit(engine, id).hp, id).toBe(before);
      expect(damageOn(engine, id).filter((e) => (e.amount ?? 0) !== 0), id).toEqual([]);
    }
  });
});

describe('Seymour [RE §7]', () => {
  it('Demi takes 25 percent of each girl\'s CURRENT HP (a Gravity move: 2,677, 1,276 and 2,677 of 10,710, 5,106 and 10,710)', () => {
    const engine = run(2, [move(A.demi)]);
    expect(GIRLS.map((id) => damageOn(engine, id)[0]!.amount)).toEqual([2_677, 1_276, 2_677]);
  });

  it('Black Sky is ten hits and Meteor twelve, spread over random girls, each a real blow (Black Sky about 900, Meteor about 2,000 or more)', () => {
    const sky = run(2, [move(A.blackSky)], 3, bigHp);
    const skyHits = GIRLS.flatMap((id) => damageOn(sky, id));
    expect(skyHits).toHaveLength(10);
    for (const h of skyHits) expect(h.amount, 'a Black Sky hit').toBeGreaterThan(300);
    expect(new Set(GIRLS.filter((id) => damageOn(sky, id).length > 0)).size, 'spread over more than one girl').toBeGreaterThan(1);

    const meteor = run(2, [move(A.meteor)], 3, bigHp);
    const meteorHits = GIRLS.flatMap((id) => damageOn(meteor, id));
    expect(meteorHits).toHaveLength(12);
    for (const h of meteorHits) expect(h.amount, 'a Meteor hit').toBeGreaterThan(1_000);
  });

  it('Ultima: one hit on each girl, capped at 9,999; Critical Attack always a critical; Absorb takes HP and MP together from the girl and gives them to him', () => {
    const ultima = run(2, [move(A.ultima)]);
    for (const id of GIRLS) {
      const hits = damageOn(ultima, id);
      expect(hits, id).toHaveLength(1);
      expect(hits[0]!.amount, id).toBeGreaterThan(5_000);
      expect(hits[0]!.amount, id).toBeLessThanOrEqual(9_999);
    }
    const crit = run(2, [move(A.criticalAttack, ['paine'])]);
    expect((damageOn(crit, 'paine')[0] as unknown as { crit: boolean }).crit).toBe(true);
    const absorb = run(2, [move(A.absorb, ['yuna'])], 1, (e) => {
      unit(e, 'x2-cup-seymour').hp = 50_000;
    });
    expect(damageOn(absorb, 'yuna')[0]!.amount).toBeGreaterThan(0);
    expect(logOf(absorb).some((e) => e.type === 'mp-damage' && e.targetId === 'yuna' && (e.amount ?? 0) > 0)).toBe(true);
    expect(unit(absorb, 'x2-cup-seymour').hp).toBeGreaterThan(50_000);
  });

  it('Curaga heals him; Shell, Protect, Magic Up and Strength Up are his statuses, the Ups +2 a cast (three casts: six stages)', () => {
    const heal = run(2, [move(A.curaga, ['x2-cup-seymour'])], 1, (e) => {
      unit(e, 'x2-cup-seymour').hp = 50_000;
    });
    expect(unit(heal, 'x2-cup-seymour').hp).toBeGreaterThan(50_000);
    const buffs = run(2, [move(A.shell, ['x2-cup-seymour']), move(A.protect, ['x2-cup-seymour'])]);
    expect(Object.keys(unit(buffs, 'x2-cup-seymour').statuses).sort()).toEqual(['protect', 'shell', 'spellspring']);
    const ups = run(2, [move(A.magicUp, ['x2-cup-seymour']), move(A.magicUp, ['x2-cup-seymour']), move(A.magicUp, ['x2-cup-seymour']), move(A.strengthUp, ['x2-cup-seymour'])]);
    const s = unit(ups, 'x2-cup-seymour').statuses;
    expect((s['mag-up'] as unknown as { stacks: number }).stacks).toBe(6);
    expect((s['str-up'] as unknown as { stacks: number }).stacks).toBe(2);
  });

  it('Dispel strips Shell, Protect, Haste and Regen from EVERY girl (chance 254 lands whatever the level); Slowga, Confuse and Break, with weak chance bytes, land on none of the Lv 99 party in 20 seeds (T0 a)', () => {
    const dispelled = run(2, [move(A.dispel)], 1, (e) => {
      for (const g of girlsOf(e)) for (const s of ['shell', 'protect', 'haste', 'regen']) give(g, s);
    });
    for (const g of girlsOf(dispelled)) expect(Object.keys(g.statuses), g.id).toEqual([]);
    for (const seed of SEEDS) {
      const e = run(2, [move(A.slowga), move(A.confuse), move(A.break, ['rikku'])], seed, undefined, bareBuild());
      for (const g of girlsOf(e)) expect(Object.keys(g.statuses), `seed ${seed} ${g.id}`).toEqual([]);
    }
  });

  it('the same Break, Confuse and Slowga land on a party of Lv 60 (the girls\' level lowered by the test, a rig): the rows are the game\'s, the Lv 99 level is what stops them', () => {
    let petrified = 0;
    let confused = 0;
    let slowed = 0;
    for (const seed of SEEDS) {
      const low = (e: ReturnType<typeof openDuel>): void => {
        for (const g of girlsOf(e)) g.level = 60;
      };
      petrified += unit(run(2, [move(A.break, ['rikku'])], seed, low, bareBuild()), 'rikku').statuses['petrify'] !== undefined ? 1 : 0;
      confused += girlsOf(run(2, [move(A.confuse)], seed, low, bareBuild())).filter((g) => g.statuses['confuse'] !== undefined).length;
      slowed += girlsOf(run(2, [move(A.slowga)], seed, low, bareBuild())).filter((g) => g.statuses['slow'] !== undefined).length;
    }
    expect(petrified).toBeGreaterThan(10);
    expect(confused).toBeGreaterThan(20);
    expect(slowed).toBeGreaterThan(20);
  });

  it('he ABSORBS: a Fire spell heals him (the affinity reads "absorb" and the amount is negative), and so does Paine Demi (Gravity, capped at 9,999)', () => {
    const build = structuredClone(farplaneCupBuild);
    const yuna = build.members[0]!;
    yuna.currentDressphere = 'black-mage';
    yuna.spriteKey = 'yuna-black-mage';
    yuna.abilitiesLearned['black-mage'] = { learned: ['x2-black-mage-attack', 'x2-black-mage-fire'], ap: 0 };
    const cast = (actor: string, abilityId: string): ReturnType<typeof damageOn> => {
      const f = forced(2);
      const engine = openDuel(2, 1, { build: structuredClone(build), group: f.group });
      unit(engine, 'x2-cup-seymour').hp = 100_000;
      let sent = false;
      for (let i = 0; i < 800; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') engine.tick(Math.max(25, d.nextEventMs));
        else if (d.kind === 'player-input') {
          const row = !sent && d.actorId === actor ? rowOf(d, 'ability', abilityId, ['x2-cup-seymour']) : null;
          if (row) {
            engine.submit(row);
            sent = true;
          } else engine.submit({ kind: 'defend', targets: [] });
        }
        if (sent && damageOn(engine, 'x2-cup-seymour').length > 0) break;
      }
      expect(sent, abilityId).toBe(true);
      return damageOn(engine, 'x2-cup-seymour');
    };
    const fire = cast('yuna', 'x2-black-mage-fire')[0]!;
    expect([fire.element, fire.affinity]).toEqual(['fire', 'absorb']);
    expect(fire.amount ?? 0).toBeLessThan(0);
    const demi = cast('paine', 'x2-dark-knight-demi')[0]!;
    expect([demi.element, demi.affinity, demi.amount]).toEqual(['gravity', 'absorb', -9_999]);
  });
});
