/**
 * The Luca Opener (the first fights of FFX-2's Chapter 1, the hidden chapter, number 52, typed word `debut`): the three scripts, decision by decision. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/luca-opener.ts` is **the game's own scripts, `m129` (Ormi), `m130` (Logos) and `m131` (Leblanc)** (`research/re-ffx2-luca-opener.md` section 3). What this file pins, with a stub context and exact draws:
 *
 * 1. **Ormi**: Attack, Attack, shield throw, for ever; the Attack is the near-weighted pick (one draw), the shield throw goes to the greatest ground distance (Rikku while she is up, then Paine, then Yuna; an unambiguous
 *    extreme draws nothing).
 * 2. **Logos**: the pistol on a uniform living girl (one draw with two or more), and ONE Potion for Ormi, the moment Ormi's HP is under a fifth of his maximum (`hp < floor(97 / 5) = 19`, so 18 is the first value that throws it and 19
 *    is not); never a second; and the script queues it at a fallen Ormi too (a fallen body reads 0 HP).
 * 3. **Leblanc**: Attack, Attack, Attack, Thunder; the Thunder is the PAIR of searches (the first draws and is thrown away, the second keeps the girls tied for the most HP and picks among them); under 8 MP she attacks instead.
 */
import { describe, expect, it } from 'vitest';

import { mem, setMem } from '../../../src/battle/ffx2/internal.ts';
import { SCENES, pickIndexByWeights, sceneWeights, type Scene } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import {
  LUCA_ABILITY, LUCA_LEBLANC_ATTACK_BELOW_MP, LUCA_LEBLANC_LAST_ATTACK_T, LUCA_LEBLANC_SCRIPT, LUCA_LEBLANC_T, LUCA_LOGOS_PORTION, LUCA_LOGOS_SCRIPT, LUCA_ORMI, LUCA_ORMI_ATTACKS_BEFORE_PITCH, LUCA_ORMI_SCRIPT,
  LUCA_ORMI_T, LUCA_POTION_DIVISOR, groundDistance,
} from '../../../src/battle/ffx2/ai/luca-opener.ts';
import { x2LucaLeblanc, x2LucaLogos, x2LucaOrmi } from '../../../src/data/ffx2/enemies/luca-opener.ts';
import {
  LUCA_LEBLANC_ATTACK_ID, LUCA_LEBLANC_THUNDER_ID, LUCA_LOGOS_PISTOL_ID, LUCA_LOGOS_POTION_ID, LUCA_ORMI_ATTACK_ID, LUCA_ORMI_PITCH_ID, LUCA_THUNDER_MP, lucaOpenerAbilities,
} from '../../../src/data/ffx2/enemies/luca-opener-abilities.ts';
import { LUCA_LEBLANC_SCRIPT_ID, LUCA_LOGOS_SCRIPT_ID, LUCA_ORMI_SCRIPT_ID, X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID } from '../../../src/data/luca-opener-ids.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';

/** Ormi (97 HP, slot 2) beside Logos (86 HP, slot 1), as the act 1 formation has them. */
function ormiBench(): Bench {
  return bench(enemy(X2_LUCA_ORMI_ID, 97, { slot: 2 }), LUCA_ORMI_SCRIPT, [enemy(X2_LUCA_LOGOS_ID, 86, { slot: 1 })]);
}

/** Logos with Ormi beside him. */
function logosBench(ormiHp = 97): Bench {
  return bench(enemy(X2_LUCA_LOGOS_ID, 86, { slot: 1 }), LUCA_LOGOS_SCRIPT, [enemy(X2_LUCA_ORMI_ID, 97, { slot: 2, hp: ormiHp })]);
}

/** Leblanc alone (101 MP). */
function leblancBench(): Bench {
  return bench(enemy(X2_LUCA_LEBLANC_ID, 130, { mp: 101 }), LUCA_LEBLANC_SCRIPT);
}

/** The first raw value the near-weighted search maps to girl `slot` in `scene`'s weights. */
function rawFor(scene: Scene, slot: 0 | 1 | 2): number {
  const weights = sceneWeights(scene, [0, 1, 2]);
  for (let raw = 0; raw < 4096; raw++) if (pickIndexByWeights(raw, weights) === slot) return raw;
  throw new Error('no raw value');
}

describe('the names are the data\'s', () => {
  it('the script ids, the ability ids and Ormi\'s combatant id the script reads are the data files\' own', () => {
    expect([LUCA_ORMI_SCRIPT, LUCA_LOGOS_SCRIPT, LUCA_LEBLANC_SCRIPT]).toEqual([LUCA_ORMI_SCRIPT_ID, LUCA_LOGOS_SCRIPT_ID, LUCA_LEBLANC_SCRIPT_ID]);
    expect([x2LucaOrmi.aiScriptId, x2LucaLogos.aiScriptId, x2LucaLeblanc.aiScriptId]).toEqual([LUCA_ORMI_SCRIPT, LUCA_LOGOS_SCRIPT, LUCA_LEBLANC_SCRIPT]);
    expect(LUCA_ORMI).toBe(X2_LUCA_ORMI_ID);
    expect(LUCA_ABILITY).toEqual({
      ormiAttack: LUCA_ORMI_ATTACK_ID, pitch: LUCA_ORMI_PITCH_ID, pistol: LUCA_LOGOS_PISTOL_ID, potion: LUCA_LOGOS_POTION_ID, leblancAttack: LUCA_LEBLANC_ATTACK_ID, thunder: LUCA_LEBLANC_THUNDER_ID,
    });
    for (const id of Object.values(LUCA_ABILITY)) expect(lucaOpenerAbilities.some((a) => a.id === id), id).toBe(true);
    expect(aiScriptFor(LUCA_ORMI_SCRIPT).id).toBe(LUCA_ORMI_SCRIPT);
    expect(aiScriptFor(LUCA_LOGOS_SCRIPT).id).toBe(LUCA_LOGOS_SCRIPT);
    expect(aiScriptFor(LUCA_LEBLANC_SCRIPT).id).toBe(LUCA_LEBLANC_SCRIPT);
  });

  it('the constants are the scripts\': two Attacks before the shield, a fifth for the Potion, three Attacks before the Thunder, the MP gate at 8 (Thunder costs 4)', () => {
    expect([LUCA_ORMI_ATTACKS_BEFORE_PITCH, LUCA_POTION_DIVISOR, LUCA_LEBLANC_LAST_ATTACK_T, LUCA_LEBLANC_ATTACK_BELOW_MP, LUCA_THUNDER_MP]).toEqual([2, 5, 2, 8, 4]);
  });
});

describe('Ormi (m129): Attack, Attack, shield throw [script]', () => {
  it('the cycle is Attack, Attack, Pirouette Pitch for ever: six polls, then the same again', () => {
    const b = ormiBench();
    const raw = rawFor(SCENES.lucaOrmi, 0);
    const order: string[] = [];
    for (let poll = 1; poll <= 9; poll++) {
      b.rng.drain();
      const c = b.poll(raw);
      order.push(b.id(c)!);
      expect(mem(b.self, LUCA_ORMI_T), `after poll ${poll}`).toBe(poll % 3 === 0 ? 0 : poll % 3);
    }
    expect(order).toEqual([LUCA_ORMI_ATTACK_ID, LUCA_ORMI_ATTACK_ID, LUCA_ORMI_PITCH_ID, LUCA_ORMI_ATTACK_ID, LUCA_ORMI_ATTACK_ID, LUCA_ORMI_PITCH_ID, LUCA_ORMI_ATTACK_ID, LUCA_ORMI_ATTACK_ID, LUCA_ORMI_PITCH_ID]);
  });

  it('the Attack is the near-weighted pick (one draw with three girls up): Yuna 43.2 percent, Rikku 27.7, Paine 29.1 from his spot; the raw value decides, the weights are the scene\'s', () => {
    const weights = sceneWeights(SCENES.lucaOrmi, [0, 1, 2]);
    expect(weights).toEqual([631, 405, 426]);
    for (const slot of [0, 1, 2] as const) {
      const b = ormiBench();
      const c = b.poll(rawFor(SCENES.lucaOrmi, slot));
      expect(b.id(c)).toBe(LUCA_ORMI_ATTACK_ID);
      expect(b.targets(c)).toEqual([['yuna', 'rikku', 'paine'][slot]!]);
      expect(b.rng.calls).toEqual([[0, 0x7fffffff]]);
    }
  });

  it('the shield throw goes to the girl at the greatest ground distance from his spot: Rikku (56.4) while she is up, with no draw; with Rikku down, Paine (51.0); with both down, Yuna alone', () => {
    expect([0, 1, 2].map((slot) => +groundDistance(SCENES.lucaOrmi, slot).toFixed(2))).toEqual([49.48, 56.36, 51]);
    const b = ormiBench();
    setMem(b.self, LUCA_ORMI_T, 2);
    const c = b.poll();
    expect(b.id(c)).toBe(LUCA_ORMI_PITCH_ID);
    expect(b.targets(c)).toEqual(['rikku']);
    expect(b.rng.calls).toEqual([]);

    const d = ormiBench();
    d.girls[1].alive = false;
    setMem(d.self, LUCA_ORMI_T, 2);
    expect(d.targets(d.poll())).toEqual(['paine']);
    expect(d.rng.calls).toEqual([]);

    const e = ormiBench();
    e.girls[1].alive = false;
    e.girls[2].alive = false;
    setMem(e.self, LUCA_ORMI_T, 2);
    expect(e.targets(e.poll())).toEqual(['yuna']);
    expect(e.rng.calls).toEqual([]);
  });

  it('with one girl left the Attack draws nothing; with no girl left he does nothing', () => {
    const b = ormiBench();
    b.girls[0].alive = false;
    b.girls[2].alive = false;
    const c = b.poll();
    expect(b.targets(c)).toEqual(['rikku']);
    expect(b.rng.calls).toEqual([]);
    const none = ormiBench();
    for (const g of none.girls) g.alive = false;
    expect(none.poll()).toBeNull();
  });

  it('his lone-45 rule is not ported (LO5): the data has him at his row\'s 97 HP', () => {
    expect([x2LucaOrmi.hp, x2LucaOrmi.stats.hp, x2LucaOrmi.stats.maxHp]).toEqual([97, 97, 97]);
  });
});

describe('Logos (m130): the pistol, and one Potion [script]', () => {
  it('the pistol goes to a uniform living girl: one draw, `raw mod 3` over the slot order', () => {
    for (const [raw, who] of [[0, 'yuna'], [1, 'rikku'], [2, 'paine'], [3, 'yuna'], [7, 'rikku']] as const) {
      const b = logosBench();
      const c = b.poll(raw);
      expect(b.id(c)).toBe(LUCA_LOGOS_PISTOL_ID);
      expect(b.targets(c)).toEqual([who]);
      expect(b.rng.calls).toEqual([[0, 0x7fffffff]]);
    }
  });

  it('with two girls up the pick is `raw mod 2` over the two; with one it draws nothing', () => {
    const b = logosBench();
    b.girls[1].alive = false;
    expect(b.targets(b.poll(1))).toEqual(['paine']);
    const c = logosBench();
    c.girls[0].alive = false;
    c.girls[1].alive = false;
    expect(c.targets(c.poll())).toEqual(['paine']);
    expect(c.rng.calls).toEqual([]);
  });

  it('the Potion comes when Ormi is UNDER a fifth of his HP, by integer division: 97 / 5 = 19, so 18 throws it and 19 does not', () => {
    const at19 = logosBench(19);
    expect(at19.id(at19.poll(0))).toBe(LUCA_LOGOS_PISTOL_ID);
    expect(mem(at19.self, LUCA_LOGOS_PORTION)).toBe(0);
    const at18 = logosBench(18);
    const c = at18.poll();
    expect(at18.id(c)).toBe(LUCA_LOGOS_POTION_ID);
    expect(at18.targets(c)).toEqual([X2_LUCA_ORMI_ID]);
    expect(at18.rng.calls).toEqual([]); // the Potion draws nothing
    expect(mem(at18.self, LUCA_LOGOS_PORTION)).toBe(1);
  });

  it('the Potion is thrown ONCE: after it he only shoots, however low Ormi falls', () => {
    const b = logosBench(10);
    const order: string[] = [];
    for (let poll = 0; poll < 6; poll++) {
      b.rng.drain();
      order.push(b.id(b.poll(0))!);
    }
    expect(order).toEqual([LUCA_LOGOS_POTION_ID, ...Array<string>(5).fill(LUCA_LOGOS_PISTOL_ID)]);
  });

  it('a fallen Ormi reads 0 HP: the script queues the Potion at him anyway (once), and a formation without an Ormi never throws one', () => {
    const b = logosBench();
    const ormi = b.others[0]!;
    ormi.hp = 0;
    ormi.alive = false;
    const c = b.poll();
    expect(b.id(c)).toBe(LUCA_LOGOS_POTION_ID);
    expect(b.targets(c)).toEqual([X2_LUCA_ORMI_ID]);
    const alone = bench(enemy(X2_LUCA_LOGOS_ID, 86, { slot: 1 }), LUCA_LOGOS_SCRIPT);
    expect(alone.id(alone.poll(0))).toBe(LUCA_LOGOS_PISTOL_ID);
  });

  it('with no girl left he does nothing', () => {
    const b = logosBench();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
  });
});

describe('Leblanc (m131): three Attacks, then Thunder [script]', () => {
  it('the cycle is Attack, Attack, Attack, Thunder for ever: eight polls, then the same again', () => {
    const b = leblancBench();
    const raw = rawFor(SCENES.lucaLeblanc, 0);
    const order: string[] = [];
    for (let poll = 1; poll <= 12; poll++) {
      b.rng.drain();
      b.rng.push(raw, 0, 0);
      const c = b.poll();
      b.rng.drain();
      order.push(b.id(c)!);
    }
    expect(order).toEqual(Array.from({ length: 3 }, () => [LUCA_LEBLANC_ATTACK_ID, LUCA_LEBLANC_ATTACK_ID, LUCA_LEBLANC_ATTACK_ID, LUCA_LEBLANC_THUNDER_ID]).flat());
  });

  it('the Attack is the near-weighted pick from her spot: Yuna 44.1 percent, Rikku and Paine 27.9 each; one draw', () => {
    expect(sceneWeights(SCENES.lucaLeblanc, [0, 1, 2])).toEqual([656, 415, 415]);
    for (const slot of [0, 1, 2] as const) {
      const b = leblancBench();
      const c = b.poll(rawFor(SCENES.lucaLeblanc, slot));
      expect(b.id(c)).toBe(LUCA_LEBLANC_ATTACK_ID);
      expect(b.targets(c)).toEqual([['yuna', 'rikku', 'paine'][slot]!]);
      expect(b.rng.calls).toEqual([[0, 0x7fffffff]]);
    }
  });

  it('the Thunder is the PAIR of searches: the first draws over the three girls and is thrown away, the second finds the most HP and, with no tie, draws nothing; the girl is the healthiest', () => {
    const b = leblancBench();
    b.girls[0].hp = 400;
    b.girls[1].hp = 900;
    b.girls[2].hp = 700;
    setMem(b.self, LUCA_LEBLANC_T, 3);
    const c = b.poll(2); // the discarded first search: `int(0, 2)`
    expect(b.id(c)).toBe(LUCA_LEBLANC_THUNDER_ID);
    expect(b.targets(c)).toEqual(['rikku']);
    expect(b.rng.calls).toEqual([[0, 2]]);
    expect(mem(b.self, LUCA_LEBLANC_T)).toBe(0);
  });

  it('a tie for the most HP draws once more and picks among the tied girls in slot order', () => {
    const b = leblancBench();
    b.girls[0].hp = 900;
    b.girls[1].hp = 400;
    b.girls[2].hp = 900;
    setMem(b.self, LUCA_LEBLANC_T, 3);
    const c = b.poll(0, 1); // the discarded search, then `int(0, 1)` among Yuna and Paine
    expect(b.targets(c)).toEqual(['paine']);
    expect(b.rng.calls).toEqual([[0, 2], [0, 1]]);
  });

  it('with two girls up the discarded search is `int(0, 1)`; with one it draws nothing', () => {
    const b = leblancBench();
    b.girls[0].alive = false;
    b.girls[1].hp = 300;
    b.girls[2].hp = 800;
    setMem(b.self, LUCA_LEBLANC_T, 3);
    expect(b.targets(b.poll(0))).toEqual(['paine']);
    expect(b.rng.calls).toEqual([[0, 1]]);
    const c = leblancBench();
    c.girls[0].alive = false;
    c.girls[1].alive = false;
    setMem(c.self, LUCA_LEBLANC_T, 3);
    expect(c.targets(c.poll())).toEqual(['paine']);
    expect(c.rng.calls).toEqual([]);
  });

  it('under 8 MP her fourth poll is an Attack instead (and the counter still restarts); at 8 it is the Thunder', () => {
    const low = leblancBench();
    low.self.mp = 7;
    setMem(low.self, LUCA_LEBLANC_T, 3);
    expect(low.id(low.poll(0))).toBe(LUCA_LEBLANC_ATTACK_ID);
    expect(mem(low.self, LUCA_LEBLANC_T)).toBe(0);
    const ok = leblancBench();
    ok.self.mp = 8;
    setMem(ok.self, LUCA_LEBLANC_T, 3);
    expect(ok.id(ok.poll(0, 0))).toBe(LUCA_LEBLANC_THUNDER_ID); // three girls at equal HP: the discarded search, then a three-way tie
  });

  it('with no girl left she does nothing', () => {
    const b = leblancBench();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
  });
});

describe('a script never reads a unit it should not', () => {
  it('Ormi\'s and Leblanc\'s polls leave the girls and the other units untouched', () => {
    const b = ormiBench();
    const before = JSON.stringify([...b.girls.map((g) => [g.hp, g.alive]), b.others.map((o) => [o.hp, o.alive])]);
    b.poll(0);
    expect(JSON.stringify([...b.girls.map((g) => [g.hp, g.alive]), b.others.map((o) => [o.hp, o.alive])])).toBe(before);
    expect(aiUnit('x', 'enemy', 1, 0).alive).toBe(true);
  });
});
