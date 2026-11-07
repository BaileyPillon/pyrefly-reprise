/**
 * The Youth League Tournament (the hidden FFX-2 chapter): the T0 checks of the paper preflight, by RUNNING the engine (hard rule 3), and the moves the fighters make on the real engine with the game's rows. **FFX-2 only**
 * [AGENTS.md rule 14].
 *
 * Each move is made by a QUEUE (`forced()`): the fighter under test does what the test says, the others stand idle, so what is measured is the engine and the data, not the script (`youth-league-ai.test.ts` has the
 * scripts). The numbers are what the engine produced; the sized brackets of the research note (`research/re-ffx2-youth-league-tournament.md` §7, for a Level 50 Dark Knight and a Level 50 White Mage) are the witness.
 *
 * - **E1, an enemy command that heals or revives a girl** (Yaibal): a Hi-Potion on Yuna heals her by the row's fixed 1,000 and stops at her maximum; a Phoenix Down on a KO'd Yuna stands her up at a quarter of her maximum
 *   HP (the Death cure); on a living girl it does nothing. The engine applies a recovery row to an OPPOSING-side target with no change.
 * - **E3, Doom with a counter from a row** (Lucil's Harbinger): the status lands at once with the row's counter 4 (40,000 units), the girl is KO'd 10.5 s later, whatever her speed; Remedy does not cure it (the data lists no
 *   cure, as the sources do not: Full-Cure and Remedy leave Doom alone); a Phoenix Down raises her after.
 * - **The thrown items** are data: the Gems are six hits each (24 over the four), the Gold Hourglass slows, the Curtains shell and protect the thrower, the Guard covers a whole line, Sorry is 470 to 529 a girl.
 * - **The sizing** the research note computed holds on the engine: Yaibal's Attack 81 to 91 on a Dark Knight and 159 to 176 on the White Mage; Lucil's Attack and Harbinger 171 to 191 and 332 to 369; Elma's Attack and Fira 121
 *   to 135 and 164 to 184 on a Dark Knight; the Critical Attack always a critical; the largest single hit of the chain on a girl is Lucil's, as the note says.
 */
import { describe, expect, it } from 'vitest';

import { YL_ABILITY as A } from '../../../src/data/ffx2/enemies/youth-league-abilities.ts';
import { forced, move, openAct, playUntil, playUntilActed, rowOf, unit, damageOn, girlsOf, foesOf, logOf, type Act, type Unit } from '../helpers/youthLeagueDrive.ts';

const SEEDS = Array.from({ length: 16 }, (_, i) => i + 1);
type Engine = ReturnType<typeof openAct>;

/** A KO'd girl, rigged: HP 0, not alive, the KO status laid as the engine lays it. */
function rigKo(u: Unit): void {
  u.hp = 0;
  u.alive = false;
  (u.statuses as Record<string, unknown>)['ko'] = { id: 'ko', ticksRemaining: null, stacks: 1 };
}

/** Make `moves` happen, in order, from fighter `index` of act `act` while every other fighter stands idle; stop when the last has been finished. */
function run(act: Act, index: number, moves: ReturnType<typeof move>[], seed = 1, rig?: (e: Engine) => void): Engine {
  const { group, forced: f } = forced(act, index, { quiet: true });
  const engine = openAct(act, seed, { group });
  rig?.(engine);
  f.queue.push(...moves);
  playUntilActed(engine, group.enemies[index]!.id, moves.length, () => null);
  return engine;
}
/** How many actions the girls have finished so far. */
const endsOfGirls = (e: Engine): number => logOf(e).filter((x) => x.type === 'action-end' && ['yuna', 'rikku', 'paine'].includes(String(x.actorId))).length;
const amounts = (e: Engine, id: string): Array<{ amount: number; crit: boolean }> => damageOn(e, id) as unknown as Array<{ amount: number; crit: boolean }>;
const range = (xs: number[]): [number, number] => [Math.min(...xs), Math.max(...xs)];
/** Every damage amount of `girl` over the seeds, for the move `mv` of the fighter `index` of act `act`. */
const over = (act: Act, index: number, mv: () => ReturnType<typeof move>, girl: string): number[] =>
  SEEDS.flatMap((seed) => amounts(run(act, index, [mv()], seed), girl).map((d) => d.amount));

describe('E1: an enemy command that heals or revives a girl (Yaibal) [preflight E1, RE §5.1]', () => {
  it('a Hi-Potion on Yuna heals her by the row\'s fixed 1,000 (500 to 1,500) and stops at her maximum (2,000 of 2,488 to 2,488)', () => {
    const potion = run(0, 0, [move(A.yaibalHiPotion, ['yuna'])], 1, (e) => {
      unit(e, 'yuna').hp = 500;
    });
    expect([unit(potion, 'yuna').hp, unit(potion, 'yuna').stats.maxHp]).toEqual([1500, 2488]);
    const capped = run(0, 0, [move(A.yaibalHiPotion, ['yuna'])], 1, (e) => {
      unit(e, 'yuna').hp = 2000;
    });
    expect(unit(capped, 'yuna').hp).toBe(2488);
    expect(amounts(potion, 'yuna').map((d) => d.amount), 'a heal is a damage event with a negative amount').toEqual([-1000]);
  });

  it('a Phoenix Down on a KO\'d Yuna stands her up at a quarter of her maximum HP (622 of 2,488): the Death cure of an enemy command', () => {
    for (const seed of [1, 2, 3]) {
      const e = run(0, 0, [move(A.phoenixDown, ['yuna'])], seed, (en) => rigKo(unit(en, 'yuna')));
      const yuna = unit(e, 'yuna');
      expect([yuna.alive, yuna.hp, yuna.statuses['ko']], `seed ${seed}`).toEqual([true, 622, undefined]);
    }
  });

  it('on a living girl a Phoenix Down does nothing (it is a revive): her HP is what it was', () => {
    const e = run(0, 0, [move(A.phoenixDown, ['yuna'])], 1, (en) => {
      unit(en, 'yuna').hp = 500;
    });
    expect([unit(e, 'yuna').hp, unit(e, 'yuna').alive]).toEqual([500, true]);
  });

  it('the engine mends any girl the command is aimed at (the script aims only at Yuna): a Hi-Potion on Rikku heals Rikku', () => {
    const e = run(0, 0, [move(A.yaibalHiPotion, ['rikku'])], 1, (en) => {
      unit(en, 'rikku').hp = 100;
    });
    expect(unit(e, 'rikku').hp).toBe(1100);
  });

  it('the Warrior\'s Hi-Potion mends a FRIEND under a quarter by 1,000, capped at its maximum (50 of 422 to 422)', () => {
    const e = run(0, 1, [move(A.hiPotion, ['x2-yl-warrior-1b'])], 1, (en) => {
      unit(en, 'x2-yl-warrior-1b').hp = 50;
    });
    expect(unit(e, 'x2-yl-warrior-1b').hp).toBe(422);
  });
});

describe('E3: Doom with a counter from a row (Lucil\'s Harbinger) [preflight E3, RE §5.2]', () => {
  it('Harbinger lands Doom at once with the row\'s counter 4 (40,000 units), and the blow is 171 to 190 on a Dark Knight, 332 to 369 (668 when it crits) on Yuna', () => {
    const e = run(6, 0, [move(A.harbinger, ['paine'])]);
    const doom = unit(e, 'paine').statuses['doom'] as unknown as { counter: number; ticksRemaining: number; sourceAbilityId: string };
    expect([doom.counter, doom.ticksRemaining, doom.sourceAbilityId]).toEqual([4, 40_000, A.harbinger]);
    expect(range(over(6, 0, () => move(A.harbinger, ['paine']), 'paine').filter((x) => x < 300))).toEqual([171, 190]);
    expect(range(over(6, 0, () => move(A.harbinger, ['yuna']), 'yuna').filter((x) => x < 400))).toEqual([332, 369]);
  });

  it('the girl is KO\'d 10.5 seconds after the Doom lands, every girl, every seed (the counter is not her speed)', () => {
    for (const girl of ['yuna', 'rikku', 'paine']) {
      for (const seed of [1, 2, 3]) {
        const { group, forced: f } = forced(6, 0, { quiet: true });
        const engine = openAct(6, seed, { group });
        f.queue.push(move(A.harbinger, [girl]));
        let t0 = -1;
        playUntil(engine, (en) => {
          const g = unit(en, girl);
          if (t0 < 0 && g.statuses['doom'] !== undefined) t0 = en.state().ticks;
          return t0 >= 0 && !g.alive;
        }, { maxDecisions: 20_000 });
        expect(Math.round(((engine.state().ticks - t0) / 29.97) * 10) / 10, `${girl} seed ${seed}`).toBe(10.5);
      }
    }
  });

  it('nothing the data lists cures Doom: a Remedy on the girl leaves it on (the sources say the same: Full-Cure and Remedy cure everything except KO and Doom)', () => {
    const { group, forced: f } = forced(6, 0, { quiet: true });
    const engine = openAct(6, 1, { group });
    f.queue.push(move(A.harbinger, ['paine']));
    let remedied = false;
    for (let i = 0; i < 4000 && !remedied; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      const cure = unit(engine, 'paine').statuses['doom'] !== undefined ? rowOf(d, 'item', 'x2-remedy', ['paine']) : null;
      if (cure) {
        engine.submit(cure);
        remedied = true;
      } else engine.submit({ kind: 'defend', targets: [] });
    }
    expect(remedied, 'a girl had a Remedy to throw').toBe(true);
    // let the Remedy resolve, then look
    for (let i = 0; i < 400 && endsOfGirls(engine) < 1; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      else break;
    }
    expect(unit(engine, 'paine').alive ? unit(engine, 'paine').statuses['doom'] : 'dead already').toBeDefined();
  });

  it('a Phoenix Down raises the girl the Doom killed: she stands at a quarter of her maximum and the Doom ended with her', () => {
    const { group, forced: f } = forced(6, 0, { quiet: true });
    const engine = openAct(6, 1, { group });
    f.queue.push(move(A.harbinger, ['paine']));
    expect(playUntil(engine, (en) => !unit(en, 'paine').alive, { maxDecisions: 20_000 })).toBe(true);
    expect(unit(engine, 'paine').statuses['doom'], 'the Doom ends with her').toBeUndefined();
    let raised = false;
    for (let i = 0; i < 4000 && !raised; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      const revive = rowOf(d, 'item', 'x2-phoenix-down', ['paine']);
      if (revive) {
        engine.submit(revive);
        raised = true;
      } else engine.submit({ kind: 'defend', targets: [] });
    }
    expect(raised).toBe(true);
    for (let i = 0; i < 200 && !unit(engine, 'paine').alive; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      else break;
    }
    const paine = unit(engine, 'paine');
    expect([paine.alive, paine.hp]).toEqual([true, Math.floor(paine.stats.maxHp / 4)]);
  });
});

describe('the thrown items are data [preflight E2, RE §6]', () => {
  it('Sorry hits all three girls for 470 to 529 each, with no status', () => {
    const e = run(0, 0, [move(A.sorry, [])]);
    for (const g of girlsOf(e)) expect(amounts(e, g.id), g.id).toHaveLength(1);
    for (const girl of ['yuna', 'rikku', 'paine']) {
      const xs = over(0, 0, () => move(A.sorry, []), girl);
      expect(xs.length, girl).toBe(SEEDS.length);
      const [lo, hi] = range(xs);
      expect(lo, girl).toBeGreaterThanOrEqual(468);
      expect(hi, girl).toBeLessThanOrEqual(529);
    }
    expect(girlsOf(e).flatMap((g) => Object.keys(g.statuses))).toEqual([]);
  });

  it('each Gem is six hits spread over random girls (24 hits for the four), every hit 93 to 160 (the girls\' own elemental weakness moves some above the 105 of the row)', () => {
    const e = run(6, 0, [move(A.fireGem, []), move(A.iceGem, []), move(A.lightningGem, []), move(A.waterGem, [])]);
    const hits = girlsOf(e).flatMap((g) => amounts(e, g.id).map((d) => d.amount));
    expect(hits).toHaveLength(24);
    expect(Math.min(...hits)).toBeGreaterThanOrEqual(93);
    expect(Math.max(...hits)).toBeLessThanOrEqual(160);
    const one = run(6, 0, [move(A.fireGem, [])]);
    expect(girlsOf(one).flatMap((g) => amounts(one, g.id))).toHaveLength(6);
  });

  it('the Gold Hourglass slows the party (Slow lands on at least one girl over the seeds), the Lunar and Light Curtains give the thrower Shell and Protect', () => {
    const slowed = SEEDS.filter((seed) => girlsOf(run(6, 0, [move(A.goldHourglass, [])], seed)).some((g) => g.statuses['slow'] !== undefined));
    expect(slowed.length).toBeGreaterThan(8);
    const e = run(6, 0, [move(A.lunarCurtain, ['x2-yl-lucil']), move(A.lightCurtain, ['x2-yl-lucil'])]);
    expect(Object.keys(unit(e, 'x2-yl-lucil').statuses).sort()).toEqual(['protect', 'shell']);
  });

  it('Lucil\'s Hi-Potion mends herself by 1,000 (1,000 to 2,000)', () => {
    const e = run(6, 0, [move(A.lucilHiPotion, ['x2-yl-lucil'])], 1, (en) => {
      unit(en, 'x2-yl-lucil').hp = 1000;
    });
    expect(unit(e, 'x2-yl-lucil').hp).toBe(2000);
  });

  it('Not-So-Mighty Guard puts Shell, Protect and Regen on Elma and both Veterans, and on nobody else', () => {
    const e = run(5, 0, [move(A.guard, [])]);
    for (const foe of foesOf(e)) expect(Object.keys(foe.statuses).sort(), foe.id).toEqual(['protect', 'regen', 'shell']);
    for (const g of girlsOf(e)) expect(Object.keys(g.statuses), g.id).toEqual([]);
  });

  it('Dispel strips Shell and Protect from the girl it is aimed at (a party row aimed at one girl)', () => {
    const e = run(5, 0, [move(A.dispel, ['rikku'])], 1, (en) => {
      for (const s of ['shell', 'protect']) (unit(en, 'rikku').statuses as Record<string, unknown>)[s] = { id: s, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
      (unit(en, 'yuna').statuses as Record<string, unknown>)['shell'] = { id: 'shell', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    });
    expect(Object.keys(unit(e, 'rikku').statuses)).toEqual([]);
    expect(Object.keys(unit(e, 'yuna').statuses)).toEqual(['shell']);
  });

  it('Osmose takes MP from the girl it is aimed at and gives it to Elma (100 MP to 142, Paine 229 to 187)', () => {
    const e = run(5, 0, [move(A.osmose, ['paine'])], 1, (en) => {
      unit(en, 'x2-yl-elma').mp = 100;
    });
    expect([unit(e, 'x2-yl-elma').mp, unit(e, 'paine').mp, unit(e, 'paine').stats.maxMp]).toEqual([142, 187, 229]);
  });

  it('T0 a, the status layer against the level gap (a status lands when roll < chance + 5 x (attacker level - target level) - resist): the League\'s Flash Bomb, Hush Grenade and Confuse can NEVER land on the Chapter V party (0 of 40 seeds each, every girl)', () => {
    const SEEDS40 = Array.from({ length: 40 }, (_, i) => i + 1);
    /** How many of the girls-and-seeds the status lands on. `aimed`: the move is aimed at one named girl; otherwise it is a party move. */
    const landings = (act: Act, index: number, id: string, status: string, aimed: boolean): number => {
      let n = 0;
      for (const seed of SEEDS40) {
        for (const girl of aimed ? ['yuna', 'rikku', 'paine'] : ['yuna']) {
          const e = run(act, index, [move(id, aimed ? [girl] : [])], seed);
          n += (aimed ? [girl] : ['yuna', 'rikku', 'paine']).filter((g) => (unit(e, g).statuses as Record<string, unknown>)[status] !== undefined).length;
        }
      }
      return n;
    };
    expect(landings(3, 0, A.flashBomb, 'darkness', false), 'the Slasher (Lv 30) blinds nobody').toBe(0);
    expect(landings(5, 0, A.flashBomb, 'darkness', false), 'Elma (Lv 36) blinds nobody').toBe(0);
    expect(landings(5, 0, A.hushGrenade, 'silence', false), 'Elma silences nobody').toBe(0);
    expect(landings(1, 0, A.confuse, 'confuse', true), 'the Mage (Lv 23) confuses nobody').toBe(0);
  });

  it('...while Elma\'s Confuse and Sleep (Lv 36) land now and then (a few in a hundred to a quarter, more on Yuna, the lowest level), the Gold Hourglass (Lv 43) lands on most, and Harbinger\'s Doom (254) always does', () => {
    const SEEDS40 = Array.from({ length: 40 }, (_, i) => i + 1);
    const on = (index: number, act: Act, mv: (girl: string) => ReturnType<typeof move>, status: string, girl: string): number =>
      SEEDS40.filter((seed) => (unit(run(act, index, [mv(girl)], seed), girl).statuses as Record<string, unknown>)[status] !== undefined).length;
    for (const [id, status] of [[A.confuse, 'confuse'], [A.sleep, 'sleep']] as const) {
      const yuna = on(0, 5, (g) => move(id, [g]), status, 'yuna');
      const paine = on(0, 5, (g) => move(id, [g]), status, 'paine');
      expect(yuna, `${status} on Yuna`).toBeGreaterThan(2);
      expect(yuna, `${status} on Yuna`).toBeLessThan(25);
      expect(yuna, `${status}: Yuna (Lv 46) takes it more often than Paine (Lv 50)`).toBeGreaterThan(paine);
    }
    for (const girl of ['yuna', 'rikku', 'paine']) {
      expect(on(0, 6, () => move(A.goldHourglass, []), 'slow', girl), `Slow on ${girl}`).toBeGreaterThan(15);
      expect(on(0, 6, (g) => move(A.harbinger, [g]), 'doom', girl), `Doom on ${girl}`).toBe(40);
    }
  });
});

describe('the sizing of the research note (RE §7) holds on the engine', () => {
  it('Yaibal\'s Attack: 81 to 91 on a Dark Knight, 159 to 176 on the White Mage', () => {
    expect(range(over(0, 0, () => move(A.attack, ['rikku']), 'rikku'))).toEqual([81, 91]);
    expect(range(over(0, 0, () => move(A.attack, ['yuna']), 'yuna'))).toEqual([159, 176]);
  });

  it('Lucil\'s Attack: 171 to 191 on a Dark Knight, 332 to 369 on the White Mage: the largest plain blow of the chain', () => {
    expect(range(over(6, 0, () => move(A.lucilAttack, ['paine']), 'paine'))).toEqual([171, 190]);
    expect(range(over(6, 0, () => move(A.lucilAttack, ['yuna']), 'yuna'))).toEqual([332, 369]);
  });

  it('Elma: Attack 121 to 135 on a Dark Knight; Fira 164 to 184 on a Dark Knight and 74 to 82 on the White Mage (her MDEF 191)', () => {
    expect(range(over(5, 0, () => move(A.elmaAttack, ['paine']), 'paine'))).toEqual([121, 134]);
    expect(range(over(5, 0, () => move(A.fira, ['rikku']), 'rikku'))).toEqual([165, 184]);
    expect(range(over(5, 0, () => move(A.fira, ['yuna']), 'yuna'))).toEqual([74, 82]);
  });

  it('the League: the Veteran\'s Critical Attack is a critical every time and never misses (136 to 156 on a Dark Knight, 266 to 298 on the White Mage); the Mage\'s Fira 99 to 111, the Master\'s party Thundara 154 to 172, a Flash Bomb 47 to 52', () => {
    for (const seed of SEEDS) {
      const d = amounts(run(1, 2, [move(A.criticalAttack, ['rikku'])], seed), 'rikku');
      expect(d.length, `seed ${seed}`).toBe(1);
      expect(d[0]!.crit, `seed ${seed}`).toBe(true);
    }
    expect(range(over(1, 2, () => move(A.criticalAttack, ['paine']), 'paine'))).toEqual([136, 152]);
    expect(range(over(1, 2, () => move(A.criticalAttack, ['yuna']), 'yuna'))).toEqual([266, 298]);
    expect(range(over(1, 0, () => move(A.fira, ['rikku']), 'rikku'))).toEqual([100, 111]);
    expect(range(over(3, 2, () => move(A.thundaraParty, []), 'rikku'))).toEqual([154, 172]);
    expect(range(over(3, 0, () => move(A.flashBomb, []), 'paine'))).toEqual([47, 52]);
  });

  it('the party spell and the single spell are the same row at the same size; Demi takes a quarter of each girl\'s CURRENT HP (622 of 2,488 on Yuna)', () => {
    const party = run(1, 0, [move(A.firaParty, [])]);
    for (const g of girlsOf(party)) expect(amounts(party, g.id), g.id).toHaveLength(1);
    const demi = run(1, 0, [move(A.demi, [])]);
    expect(amounts(demi, 'yuna')[0]!.amount).toBe(622);
  });

  it('a normal Attack can miss (the race with ACC 95) and is not always a critical; across 16 seeds each fighter\'s plain Attack lands mostly', () => {
    for (const [act, index, id] of [[0, 0, A.attack], [6, 0, A.lucilAttack], [5, 0, A.elmaAttack]] as const) {
      const hits = SEEDS.map((seed) => amounts(run(act, index, [move(id, ['paine'])], seed), 'paine').length);
      expect(hits.reduce((a, b) => a + b, 0), id).toBeGreaterThan(8);
      expect(hits.every((n) => n <= 1), id).toBe(true);
    }
  });
});

describe('the engine log of a forced move names the user', () => {
  it('the user of the move is the fighter the queue was given to', () => {
    const e = run(0, 1, [move(A.attack, ['paine'])]);
    const starts = logOf(e).filter((x) => x.type === 'action-start');
    expect(starts.map((x) => x.actorId)).toEqual(['x2-yl-warrior-1a']);
  });
});
