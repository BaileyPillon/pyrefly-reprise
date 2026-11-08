/**
 * The eight scripts of the Youth League Tournament (the hidden chapter): Yaibal, Lucil, Elma and the five League types, poll by poll, on a stub context with exact draws. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/youth-league.ts` and `youth-league-league.ts` are the game's own order (`m183`, `m184`, `m279`, `m210`, `m211`, `m193`, `m214`, `m215`; `research/re-ffx2-youth-league-tournament.md` §5). What this
 * file pins, each fact tagged `[RE]`:
 *
 * 1. **Yaibal** [RE §5.1]: Yuna KO'd: `random() mod 3`, 0 Attack, 1 and 2 Phoenix Down on her; Yuna below a quarter: `mod 3`, 0 Attack Paine (else Rikku, else the potion), 1 and 2 Hi-Potion on her; else `mod 4`, 0 the "Sorry"
 *    grenade, 1 to 3 Attack. He heals no other girl.
 * 2. **Lucil** [RE §5.2]: the fifth poll is Harbinger on a girl without Doom (Attack when all have it); between them the potion twice at most below a quarter, then one-in-eight tests in the source's order (Shell,
 *    Protect, Fire, Ice, Lightning and Water Gem once each, Gold Hourglass once), each drawing only when its own condition holds.
 * 3. **Elma** [RE §5.3]: Not-So-Mighty Guard first, then a girl without Reflect (a search) and `random() mod 11`; Dispel or Attack when all three reflect.
 * 4. **The League** [RE §5.4]: the Warrior's Hi-Potion for a friend under a quarter (an Attack when it has been stolen from), the Veteran's Critical Attack on the lowest HP, the Slasher's Flash Bomb, the Mage's MP gates
 *    and coin, the Master's element drawn once.
 * 5. **The draws**: `random() mod n` is stream 2 (0 to 0xFFFF), a target search draws only with two or more candidates, the pair "search, then the extreme of the set" draws twice.
 * 6. **`[inferred]`** (named in the files): the near-weighted `searchr` is the uniform pick (no start positions exist, RE §4); "a girl who does not carry Doom" is a living girl.
 */
import { describe, expect, it } from 'vitest';

import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import {
  ELMA_GUARD,
  ELMA_SCRIPT,
  LUCIL_COLD,
  LUCIL_FIRE,
  LUCIL_POTION,
  LUCIL_SCRIPT,
  LUCIL_SLOW,
  LUCIL_THUNDER,
  LUCIL_TURN,
  LUCIL_WATER,
  YAIBAL_SCRIPT,
} from '../../../src/battle/ffx2/ai/youth-league.ts';
import { MAGE_SCRIPT, MASTER_ELEMENT, MASTER_SCRIPT, SLASHER_SCRIPT, VETERAN_SCRIPT, WARRIOR_SCRIPT } from '../../../src/battle/ffx2/ai/youth-league-league.ts';
import { mem, setMem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { KINDS, act1YaibalGroup } from '../../../src/data/ffx2/enemies/youth-league.ts';
import { x2YouthLeagueAbilities, YL_ABILITY as A } from '../../../src/data/ffx2/enemies/youth-league-abilities.ts';
import { YL_SCRIPTS } from '../../../src/data/youth-league-ids.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const ROLL_RANGE: [number, number] = [0, 0xffff];

/** A status, the way the engine lays one (a bare instance). */
function give(unit: Ffx2Unit, status: string): void {
  unit.statuses[status as 'petrify'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
}
/** A girl down: not alive, so no search sees her. */
function down(unit: Ffx2Unit): void {
  unit.alive = false;
  unit.hp = 0;
}

const yaibal = (): Bench => bench(enemy('x2-yl-yaibal', 4330, { mp: 48 }), YAIBAL_SCRIPT);
const lucil = (hp?: number): Bench => bench(enemy('x2-yl-lucil', 7324, { mp: 370, ...(hp !== undefined ? { hp } : {}) }), LUCIL_SCRIPT);
const elma = (others: Ffx2Unit[] = []): Bench => bench(enemy('x2-yl-elma', 4882, { mp: 870 }), ELMA_SCRIPT, others);

describe('the ids the scripts name are the data files\'', () => {
  it('every script id is registered, the enemy data names the same scripts, and every ability a script queues is in the chapter\'s ability list', () => {
    for (const script of Object.values(YL_SCRIPTS)) expect(aiScriptFor(script).id, script).toBe(script);
    expect(KINDS.yaibal.script).toBe(YAIBAL_SCRIPT);
    expect(KINDS.lucil.script).toBe(LUCIL_SCRIPT);
    expect(KINDS.elma.script).toBe(ELMA_SCRIPT);
    expect([KINDS.warrior.script, KINDS.veteran.script, KINDS.slasher.script, KINDS.mage.script, KINDS.master.script]).toEqual([WARRIOR_SCRIPT, VETERAN_SCRIPT, SLASHER_SCRIPT, MAGE_SCRIPT, MASTER_SCRIPT]);
    const have = new Set(x2YouthLeagueAbilities.map((a) => a.id));
    for (const id of Object.values(A)) expect(have.has(id), id).toBe(true);
    expect(Object.values(A)).toHaveLength(33);
    expect(act1YaibalGroup.enemies[0]!.aiScriptId).toBe(YAIBAL_SCRIPT);
  });
});

describe('Yaibal [RE §5.1]', () => {
  it('Yuna KO\'d: random() mod 3: 0 Attack a living girl (a search), 1 and 2 Phoenix Down on Yuna; the potion is not thrown', () => {
    for (const [roll, id] of [[0, A.attack], [1, A.phoenixDown], [2, A.phoenixDown], [3, A.attack], [4, A.phoenixDown]] as const) {
      const b = yaibal();
      down(b.girls[0]);
      const c = b.poll(roll, 0);
      expect(b.id(c), `roll ${roll}`).toBe(id);
      if (id === A.phoenixDown) {
        expect(b.targets(c)).toEqual(['yuna']);
        expect(b.rng.calls).toEqual([ROLL_RANGE]);
      } else {
        expect(b.targets(c)).toEqual(['rikku']); // the search over Rikku and Paine, value 0
        expect(b.rng.calls).toEqual([ROLL_RANGE, [0, 1]]);
      }
    }
  });

  it('Yuna below a quarter of her maximum HP (249 of 1,000; 250 is not): 0 Attack Paine, else Rikku, else the Hi-Potion; 1 and 2 the Hi-Potion on her', () => {
    const low = (): Bench => {
      const b = yaibal();
      b.girls[0].hp = 249;
      return b;
    };
    for (const roll of [1, 2]) {
      const b = low();
      const c = b.poll(roll);
      expect([b.id(c), b.targets(c), b.rng.calls]).toEqual([A.yaibalHiPotion, ['yuna'], [ROLL_RANGE]]);
    }
    const paine = low();
    expect([paine.id(paine.poll(0)), paine.targets(paine.poll(0, 0))]).toEqual([A.attack, ['paine']]);
    const rikku = low();
    down(rikku.girls[2]);
    expect(rikku.targets(rikku.poll(0))).toEqual(['rikku']);
    const both = low();
    down(both.girls[1]);
    down(both.girls[2]);
    const c = both.poll(0);
    expect([both.id(c), both.targets(c)]).toEqual([A.yaibalHiPotion, ['yuna']]);

    const edge = yaibal();
    edge.girls[0].hp = 250;
    edge.poll(1, 0); // the full-health draw is mod 4: a 1 is an Attack, not the potion
    expect(edge.id(edge.poll(1, 0))).toBe(A.attack);
  });

  it('at ease: random() mod 4: 0 the "Sorry" grenade on the party (no search), 1 to 3 Attack a living girl; a quarter of the turns over 400 values', () => {
    const tally: Record<string, number> = {};
    for (let v = 0; v < 400; v++) {
      const b = yaibal();
      const c = b.poll(v, 1);
      tally[b.id(c)!] = (tally[b.id(c)!] ?? 0) + 1;
      if (v % 4 === 0) expect([b.id(c), b.targets(c), b.rng.calls]).toEqual([A.sorry, [], [ROLL_RANGE]]);
      else expect(b.targets(c)).toEqual(['rikku']);
    }
    expect(tally).toEqual({ [A.sorry]: 100, [A.attack]: 300 });
  });

  it('heals no other girl: Rikku and Paine at 1 HP and Yuna whole get the same draw as everyone', () => {
    const b = yaibal();
    b.girls[1].hp = 1;
    b.girls[2].hp = 1;
    expect(b.id(b.poll(1, 0))).toBe(A.attack);
    const c = yaibal();
    down(c.girls[1]);
    expect(c.id(c.poll(1, 0))).toBe(A.attack);
  });
});

describe('Lucil [RE §5.2]', () => {
  it('the fifth poll is Harbinger on a girl who does not carry Doom (a search); the counter then starts again', () => {
    const b = lucil();
    give(b.self, 'shell'); // no Shell/Protect test draws
    give(b.self, 'protect');
    for (let i = 1; i <= 4; i++) {
      b.rng.drain();
      // every one-in-eight test fires nothing (a non-zero roll) on polls 1 to 4: five tests (the Gems and the Hourglass) draw; the attack is a search
      const c = b.poll(1, 1, 1, 1, 1, 0);
      expect(b.id(c), `poll ${i}`).toBe(A.lucilAttack);
      expect(mem(b.self, LUCIL_TURN)).toBe(i);
    }
    b.rng.drain();
    const c = b.poll(0);
    expect([b.id(c), b.targets(c)]).toEqual([A.harbinger, ['yuna']]);
    expect(mem(b.self, LUCIL_TURN)).toBe(0);
    // The search skipped the girl with Doom: Yuna and Paine carry it, only Rikku can be picked
    const d = lucil();
    give(d.girls[0], 'doom');
    give(d.girls[2], 'doom');
    setMem(d.self, LUCIL_TURN, 4);
    const c2 = d.poll(); // one candidate: no draw
    expect([d.id(c2), d.targets(c2), d.rng.calls]).toEqual([A.harbinger, ['rikku'], []]);
  });

  it('with Doom on all three she Attacks instead (a search over the living girls, no Harbinger)', () => {
    const b = lucil();
    for (const g of b.girls) give(g, 'doom');
    setMem(b.self, LUCIL_TURN, 4);
    const c = b.poll(1);
    expect([b.id(c), b.targets(c)]).toEqual([A.lucilAttack, ['rikku']]);
    expect(mem(b.self, LUCIL_TURN)).toBe(0);
  });

  it('below a quarter (1,830 of 7,324; 1,831 is not): a Hi-Potion on herself with no draw, twice a fight; the third and later polls fall through to the tests', () => {
    const b = lucil(1830);
    give(b.self, 'shell');
    give(b.self, 'protect');
    for (const n of [1, 2]) {
      b.rng.drain();
      const c = b.poll();
      expect([b.id(c), b.targets(c), b.rng.calls], `potion ${n}`).toEqual([A.lucilHiPotion, ['x2-yl-lucil'], []]);
      expect(mem(b.self, LUCIL_POTION)).toBe(n);
    }
    b.rng.drain();
    const c = b.poll(1, 1, 1, 1, 1, 0);
    expect(b.id(c)).toBe(A.lucilAttack);
    expect(mem(b.self, LUCIL_POTION)).toBe(3);
    const edge = lucil(1831);
    give(edge.self, 'shell');
    give(edge.self, 'protect');
    expect(edge.id(edge.poll(1, 1, 1, 1, 1, 0))).toBe(A.lucilAttack);
    expect(mem(edge.self, LUCIL_POTION)).toBe(0);
  });

  it('the tests, in the source\'s order, each a one-in-eight draw made only while its condition holds: Shell, Protect, Fire, Ice, Lightning, Water, Gold Hourglass', () => {
    const order: Array<[string, string]> = [
      [A.lunarCurtain, 'shell'],
      [A.lightCurtain, 'protect'],
      [A.fireGem, LUCIL_FIRE],
      [A.iceGem, LUCIL_COLD],
      [A.lightningGem, LUCIL_THUNDER],
      [A.waterGem, LUCIL_WATER],
      [A.goldHourglass, LUCIL_SLOW],
    ];
    // Each test fires on a roll of 0 (a multiple of 8) after the earlier ones drew a non-zero roll.
    order.forEach(([id], i) => {
      const b = lucil();
      const rolls = [...Array(i).fill(1), 0];
      const c = b.poll(...rolls);
      expect(b.id(c), `test ${i + 1}`).toBe(id);
      expect(b.rng.calls, `test ${i + 1} draws`).toHaveLength(i + 1);
    });
    // Shell already up: that test draws nothing, Protect is the first draw.
    const shelled = lucil();
    give(shelled.self, 'shell');
    expect(shelled.id(shelled.poll(0))).toBe(A.lightCurtain);
    expect(shelled.rng.calls).toHaveLength(1);
    // A Gem is thrown once: the flag is set, the next poll with the same roll skips it.
    const gem = lucil();
    give(gem.self, 'shell');
    give(gem.self, 'protect');
    expect(gem.id(gem.poll(0))).toBe(A.fireGem);
    expect(mem(gem.self, LUCIL_FIRE)).toBe(1);
    gem.rng.drain();
    expect(gem.id(gem.poll(0))).toBe(A.iceGem);
    expect(gem.targets(gem.poll(0))).toEqual([]);
  });

  it('every thrown item is a whole-party or self move the engine fills in: Gems and the Hourglass have no named target', () => {
    const b = lucil();
    give(b.self, 'shell');
    give(b.self, 'protect');
    const c = b.poll(1, 1, 1, 0);
    expect([b.id(c), b.targets(c)]).toEqual([A.waterGem, []]);
  });
});

describe('Elma [RE §5.3]', () => {
  it('the first poll is Not-So-Mighty Guard on her whole side with no draw; the flag is set', () => {
    const b = elma();
    const c = b.poll();
    expect([b.id(c), b.targets(c), b.rng.calls]).toEqual([A.guard, [], []]);
    expect(mem(b.self, ELMA_GUARD)).toBe(1);
  });

  it('then, a girl without Reflect (a search) and random() mod 11: 0 to 3 the four -ra spells on her, 4 Flash Bomb, 5 Confuse on her, 6 Hush Grenade, 7 Sleep on her, 8 Osmose, 9 and 10 Attack', () => {
    const want: Array<[number, string, string[]]> = [
      [0, A.fira, ['yuna']], [1, A.blizzara, ['yuna']], [2, A.thundara, ['yuna']], [3, A.watera, ['yuna']],
      [4, A.flashBomb, []], [5, A.confuse, ['yuna']], [6, A.hushGrenade, []], [7, A.sleep, ['yuna']],
    ];
    for (const [roll, id, targets] of want) {
      const b = elma();
      setMem(b.self, ELMA_GUARD, 1);
      const c = b.poll(0, roll); // the search draws first (value 0: Yuna), then the roll
      expect([b.id(c), b.targets(c)], `roll ${roll}`).toEqual([id, targets]);
      expect(b.rng.calls).toEqual([[0, 2], ROLL_RANGE]);
    }
    for (const roll of [9, 10]) {
      const b = elma();
      setMem(b.self, ELMA_GUARD, 1);
      const c = b.poll(1, roll, 2); // the mark Rikku, the roll, then the Attack's own search over three girls: Paine
      expect([b.id(c), b.targets(c)], `roll ${roll}`).toEqual([A.elmaAttack, ['paine']]);
    }
  });

  it('only a girl without Reflect can be the mark: with Yuna and Paine reflecting the spells go to Rikku, and no search is drawn for a lone candidate', () => {
    const b = elma();
    setMem(b.self, ELMA_GUARD, 1);
    give(b.girls[0], 'reflect');
    give(b.girls[2], 'reflect');
    const c = b.poll(2); // a single candidate: no search, so the only draw is the roll
    expect([b.id(c), b.targets(c), b.rng.calls]).toEqual([A.thundara, ['rikku'], [ROLL_RANGE]]);
  });

  it('Osmose goes to the girl with the most MP: the first search is made and thrown away, then the extreme (ties pick among the tied)', () => {
    const b = elma();
    setMem(b.self, ELMA_GUARD, 1);
    b.girls[0].mp = 50;
    b.girls[1].mp = 400;
    b.girls[2].mp = 100;
    const c = b.poll(0, 8, 0, 0); // mark, roll 8, the discarded search, the extreme (one candidate: no draw needed)
    expect([b.id(c), b.targets(c)]).toEqual([A.osmose, ['rikku']]);
    expect(b.rng.calls).toEqual([[0, 2], ROLL_RANGE, [0, 2]]);
  });

  it('with all three reflecting: random() mod 3: 0 Attack a living girl, 1 and 2 Dispel on a uniformly drawn girl', () => {
    for (const girl of [0, 1, 2]) {
      const b = elma();
      setMem(b.self, ELMA_GUARD, 1);
      for (const g of b.girls) give(g, 'reflect');
      const c = b.poll(1, girl);
      expect([b.id(c), b.targets(c)], `girl ${girl}`).toEqual([A.dispel, [['yuna', 'rikku', 'paine'][girl]]]);
    }
    const attack = elma();
    setMem(attack.self, ELMA_GUARD, 1);
    for (const g of attack.girls) give(g, 'reflect');
    expect([attack.id(attack.poll(0, 1)), attack.targets(attack.poll(0, 1))]).toEqual([A.elmaAttack, ['rikku']]);
    expect(attack.rng.calls.every(([lo, hi]) => (lo === 0 && hi === 0xffff) || hi === 2)).toBe(true);
  });
});

describe('the Warrior [RE §5.4]', () => {
  const warrior = (id = 'x2-yl-warrior-1a', hp?: number, others: Ffx2Unit[] = []): Bench => bench(enemy(id, 422, { mp: 26, ...(hp !== undefined ? { hp } : {}) }), WARRIOR_SCRIPT, others);

  it('nobody on its side under a quarter of its HP (104 of 422 is; 105 is not): Attack a living girl', () => {
    const friend = enemy('x2-yl-warrior-1b', 422, { slot: 1, hp: 105 });
    const b = warrior('x2-yl-warrior-1a', undefined, [friend]);
    const c = b.poll(2);
    expect([b.id(c), b.targets(c), b.rng.calls]).toEqual([A.attack, ['paine'], [[0, 2]]]); // no search for friends (nobody qualifies): one candidate pool is empty
  });

  it('a friend under a quarter: Hi-Potion on it (the search draws only with two candidates)', () => {
    const friend = enemy('x2-yl-warrior-1b', 422, { slot: 1, hp: 104 });
    const b = warrior('x2-yl-warrior-1a', undefined, [friend]);
    const c = b.poll();
    expect([b.id(c), b.targets(c), b.rng.calls]).toEqual([A.hiPotion, ['x2-yl-warrior-1b'], []]);
    // Itself counts: the Warrior under a quarter with a hurt friend is a two-candidate search
    const both = warrior('x2-yl-warrior-1a', 50, [friend]); // itself (50) and its friend (104) are both under a quarter: two candidates
    const c2 = both.poll(1);
    expect([both.id(c2), both.targets(c2), both.rng.calls]).toEqual([A.hiPotion, ['x2-yl-warrior-1b'], [[0, 1]]]);
  });

  it('a Warrior that has been stolen from Attacks instead (the search was still made)', () => {
    const friend = enemy('x2-yl-warrior-1b', 422, { slot: 1, hp: 5 });
    const b = warrior('x2-yl-warrior-1a', undefined, [friend]);
    b.self.stolenFrom = true;
    const c = b.poll(0);
    expect([b.id(c), b.targets(c)]).toEqual([A.attack, ['yuna']]);
  });
});

describe('the Veteran, Slasher [RE §5.4]', () => {
  const veteran = (): Bench => bench(enemy('x2-yl-veteran-2', 1720, { mp: 42 }), VETERAN_SCRIPT);
  const slasher = (): Bench => bench(enemy('x2-yl-slasher-4a', 1650, { mp: 58 }), SLASHER_SCRIPT);

  it('Veteran: random() mod 5: 0 Critical Attack on the girl with the LOWEST HP (a search, then the extreme), 1 to 4 Attack a living girl; a fifth of the turns', () => {
    let crit = 0;
    for (let v = 0; v < 500; v++) {
      const b = veteran();
      b.girls[1].hp = 300; // Rikku is the lowest
      const c = b.poll(v, 0, 0);
      if (b.id(c) === A.criticalAttack) {
        crit++;
        expect(b.targets(c), `value ${v}`).toEqual(['rikku']);
      } else {
        expect(b.id(c)).toBe(A.attack);
      }
    }
    expect(crit).toBe(100);
  });

  it('Veteran: the lowest HP is the lowest current HP, not the lowest fraction; ties are picked among', () => {
    const b = veteran();
    b.girls[0].hp = 400;
    b.girls[0].stats.maxHp = 500; // 80 percent, but not the lowest HP
    b.girls[1].hp = 300;
    b.girls[2].hp = 300;
    const c = b.poll(0, 0, 1); // the discarded search, then a pick among the two tied at 300: index 1, Paine
    expect([b.id(c), b.targets(c)]).toEqual([A.criticalAttack, ['paine']]);
    expect(b.rng.calls).toEqual([ROLL_RANGE, [0, 2], [0, 1]]);
  });

  it('Slasher: random() mod 6: 0 Flash Bomb on the party (no search), 1 to 5 Attack; a sixth of the turns', () => {
    let bombs = 0;
    for (let v = 0; v < 600; v++) {
      const b = slasher();
      const c = b.poll(v, 0);
      if (b.id(c) === A.flashBomb) {
        bombs++;
        expect([b.targets(c), b.rng.calls]).toEqual([[], [ROLL_RANGE]]);
      } else {
        expect(b.id(c)).toBe(A.attack);
      }
    }
    expect(bombs).toBe(100);
  });
});

describe('the Mage [RE §5.4]', () => {
  const mage = (mp: number): Bench => bench(enemy('x2-yl-mage-2a', 1020, { mp }), MAGE_SCRIPT);

  it('MP below 27 (26; 27 is not): Attack a living girl, no roll', () => {
    const b = mage(26);
    const c = b.poll(1);
    expect([b.id(c), b.targets(c), b.rng.calls]).toEqual([A.attack, ['rikku'], [[0, 2]]]);
    const edge = mage(27);
    expect(edge.id(edge.poll(1, 0, 0))).toBe(A.fira); // mod 5 = 1 is Fira, then the coin
  });

  it('random() mod 5: 0 Confuse on a girl who is not confused; none such: Demi on the party from 36 MP, an Attack below', () => {
    const b = mage(100);
    const c = b.poll(0, 2); // the roll, then the search over three unconfused girls: Paine
    expect([b.id(c), b.targets(c)]).toEqual([A.confuse, ['paine']]);
    const some = mage(100);
    give(some.girls[0], 'confuse');
    give(some.girls[1], 'confuse');
    expect([some.id(some.poll(0)), some.targets(some.poll(0))]).toEqual([A.confuse, ['paine']]); // one candidate: no search
    const all = mage(36);
    for (const g of all.girls) give(g, 'confuse');
    const d = all.poll(0);
    expect([all.id(d), all.targets(d), all.rng.calls]).toEqual([A.demi, [], [ROLL_RANGE]]);
    const poor = mage(35);
    for (const g of poor.girls) give(g, 'confuse');
    expect(poor.id(poor.poll(0, 1))).toBe(A.attack);
  });

  it('1 Fira, 2 Watera, 3 Blizzara, 4 Thundara, each with a coin: 0 one uniformly drawn girl, 1 the whole party', () => {
    const spells: Array<[number, string, string]> = [[1, A.fira, A.firaParty], [2, A.watera, A.wateraParty], [3, A.blizzara, A.blizzaraParty], [4, A.thundara, A.thundaraParty]];
    for (const [roll, one, party] of spells) {
      const single = mage(100);
      const c = single.poll(roll, 0, 1);
      expect([single.id(c), single.targets(c), single.rng.calls], `roll ${roll}`).toEqual([one, ['rikku'], [ROLL_RANGE, ROLL_RANGE, [0, 2]]]);
      const all = mage(100);
      const d = all.poll(roll, 1);
      expect([all.id(d), all.targets(d), all.rng.calls], `roll ${roll}`).toEqual([party, [], [ROLL_RANGE, ROLL_RANGE]]);
    }
  });
});

describe('the Master [RE §5.4]', () => {
  const master = (mp = 670): Bench => bench(enemy('x2-yl-master-4', 1732, { mp }), MASTER_SCRIPT);

  it('draws its element once, at its first poll (random() mod 4: 0 Thundara, 1 Fira, 2 Watera, 3 Blizzara) and keeps it', () => {
    const want = [[0, A.thundara, A.thundaraParty], [1, A.fira, A.firaParty], [2, A.watera, A.wateraParty], [3, A.blizzara, A.blizzaraParty]] as const;
    for (const [draw, one, party] of want) {
      const b = master();
      const c = b.poll(draw, 0, 0); // the element, the coin (single), the search over three girls (Yuna)
      expect([b.id(c), b.targets(c), mem(b.self, MASTER_ELEMENT)], `element ${draw}`).toEqual([one, ['yuna'], draw]);
      b.rng.drain();
      const before = b.rng.calls.length;
      const d = b.poll(1); // the coin only: the whole party; no second element draw
      expect([b.id(d), b.targets(d), b.rng.calls.slice(before)], `element ${draw} again`).toEqual([party, [], [ROLL_RANGE]]);
    }
  });

  it('MP below 12 (11; 12 is not): Attack a living girl; the element is still drawn at the first poll', () => {
    const b = master(11);
    const c = b.poll(2, 1);
    expect([b.id(c), b.targets(c), mem(b.self, MASTER_ELEMENT)]).toEqual([A.attack, ['rikku'], 2]);
    const edge = master(12);
    expect(edge.id(edge.poll(1, 1))).toBe(A.firaParty);
  });
});
