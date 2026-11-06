/**
 * The three duelists of the Farplane Cup (the hidden chapter): the three scripts, poll by poll, on a stub context with exact draws. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/farplane-cup.ts` is the game's own order (`m311`, `m317`, `m319`; `research/re-ffx2-farplane-cup.md` §6.2 to §6.4). What this file pins, each fact tagged `[RE]`:
 *
 * 1. **Auron** [RE §6.2]: one X-Potion below an eighth of his HP, then the low band (below a quarter) with `random() mod 8`, else `random() mod 6`; Shooting Star goes to the first Death-resistant girl (`[I]`) and
 *    Shin Zantetsu to the party when none resists.
 * 2. **Tidus** [RE §6.3]: Blitz Ace on the first poll, Hastega until he is hasted, then `random() mod 4` with the heal band (below a third), the Hero Drink band (below a tenth) and the count Blitz Ace waits for (above 4);
 *    a Blitz Ace that resets the count is followed by another (the count is 0 again).
 * 3. **Seymour** [RE §6.4]: eight cases of `random() mod 8`, the half and quarter bands, the Shell and Protect ladder, five Magic Ups then five Strength Ups then Confuse, the Reflect branches.
 * 4. **The draws**: `random() mod n` is stream 2 (0 to 0xFFFF), a target search is stream 4 (0 to 0x7FFFFFFF) and draws only with two or more candidates. **`[inferred]`**: the near-weighted picks use Trema's scene
 *    (`CUP_SCENE`), because the cup ships no start positions; pick DU10 (Break to one girl, Dispel and Confuse to the party) is pinned here too.
 */
import { describe, expect, it } from 'vitest';

import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { pickIndexByWeights, sceneWeights } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import {
  AURON_POTION,
  CUP_AURON_SCRIPT,
  CUP_MOVE as M,
  CUP_SCENE,
  CUP_SEYMOUR_SCRIPT,
  CUP_TIDUS_SCRIPT,
  SEYMOUR_MAGIC_UPS,
  SEYMOUR_STRENGTH_UPS,
  TIDUS_COUNT,
} from '../../../src/battle/ffx2/ai/farplane-cup.ts';
import { mem, setMem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { x2FarplaneCupAbilities } from '../../../src/data/ffx2/enemies/farplane-cup-abilities.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const ability = (id: string) => x2FarplaneCupAbilities.find((a) => a.id === id);
const ROLL_RANGE: [number, number] = [0, 0xffff];
const SEARCH_RANGE: [number, number] = [0, 0x7fffffff];

/** A status, the way the engine lays one (a bare instance). */
function give(unit: Ffx2Unit, status: string): void {
  unit.statuses[status as 'petrify'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
}

const auron = (hp?: number): Bench => bench(enemy('x2-cup-auron', 187_500, { mp: 999, ...(hp !== undefined ? { hp } : {}) }), CUP_AURON_SCRIPT);
const tidus = (hp?: number): Bench => bench(enemy('x2-cup-tidus', 136_200, { mp: 257, ...(hp !== undefined ? { hp } : {}) }), CUP_TIDUS_SCRIPT);
const seymour = (hp?: number): Bench => bench(enemy('x2-cup-seymour', 145_500, { mp: 999, ...(hp !== undefined ? { hp } : {}) }), CUP_SEYMOUR_SCRIPT);

/** The girl a near-weighted search picks for a raw value, from the stand-in scene (all three standing). */
const nearPick = (raw: number): string => ['yuna', 'rikku', 'paine'][pickIndexByWeights(raw, sceneWeights(CUP_SCENE, [0, 1, 2]))]!;

describe('the ids the scripts name are the data files\'', () => {
  it('every ability and script id of the script is a registered ability and the enemy data names the same scripts', async () => {
    const ids = await import('../../../src/data/farplane-cup-ids.ts');
    const data = await import('../../../src/data/ffx2/enemies/farplane-cup.ts');
    expect([ids.CUP_AURON_SCRIPT_ID, ids.CUP_TIDUS_SCRIPT_ID, ids.CUP_SEYMOUR_SCRIPT_ID]).toEqual([CUP_AURON_SCRIPT, CUP_TIDUS_SCRIPT, CUP_SEYMOUR_SCRIPT]);
    expect([data.x2CupAuron.aiScriptId, data.x2CupTidus.aiScriptId, data.x2CupSeymour.aiScriptId]).toEqual([CUP_AURON_SCRIPT, CUP_TIDUS_SCRIPT, CUP_SEYMOUR_SCRIPT]);
    for (const id of Object.values(M)) expect(ability(id), id).toBeDefined();
    expect(Object.values(M)).toHaveLength(33);
    for (const script of [CUP_AURON_SCRIPT, CUP_TIDUS_SCRIPT, CUP_SEYMOUR_SCRIPT]) expect(aiScriptFor(script).id, script).toBe(script);
  });
});

describe('Auron [RE §6.2]', () => {
  it('above a quarter: random() mod 6: 0 Shooting Star, 1 Dragon Fang, 2 Full Break, 3 to 5 Attack; over 600 values it is a sixth, a sixth, a sixth and a half', () => {
    const tally: Record<string, number> = {};
    for (let v = 0; v < 600; v++) {
      const b = auron();
      const id = b.id(b.poll(v, 0))!;
      tally[id] = (tally[id] ?? 0) + 1;
      const expected = [M.shootingStar, M.dragonFang, M.fullBreak, M.auronAttack, M.auronAttack, M.auronAttack][v % 6];
      expect(id, `value ${v}`).toBe(expected);
    }
    expect(tally).toEqual({ [M.shootingStar]: 100, [M.dragonFang]: 100, [M.fullBreak]: 100, [M.auronAttack]: 300 });
  });

  it('the draws: a single-girl move makes the roll and one near-weighted search, the party move only the roll; the pick is the stand-in scene\'s weighted one', () => {
    for (const raw of [0, 1, 400, 900, 5_000, 123_456]) {
      const b = auron();
      const c = b.poll(0, raw); // Shooting Star
      expect(b.targets(c), `raw ${raw}`).toEqual([nearPick(raw)]);
      expect(b.rng.calls, `raw ${raw}`).toEqual([ROLL_RANGE, SEARCH_RANGE]);
    }
    const fang = auron();
    const c = fang.poll(1);
    expect([fang.id(c), fang.targets(c), fang.rng.calls]).toEqual([M.dragonFang, [], [ROLL_RANGE]]);
  });

  it('the X-Potion: below an eighth of his HP (23,436 or less of 187,500), once, on himself, with no draw; 23,437 is not below', () => {
    const b = auron(23_436);
    const c = b.poll();
    expect([b.id(c), b.targets(c)]).toEqual([M.auronXPotion, ['x2-cup-auron']]);
    expect(b.rng.calls).toHaveLength(0);
    expect(mem(b.self, AURON_POTION)).toBe(1);
    // The flag is set: the next poll at the same HP is the low band's draw.
    b.rng.drain();
    expect(b.id(b.poll(4))).toBe(M.dragonFang);

    const edge = auron(23_437);
    expect(edge.id(edge.poll(4))).toBe(M.dragonFang); // already the low band, no X-Potion
    expect(mem(edge.self, AURON_POTION)).toBe(0);
  });

  it('the low band (below a quarter: 46,874 or less; 46,875 is not): random() mod 8: 1 and 5 Mega-Potion on his side, 2 Shooting Star, 3 Full Break, 4 Dragon Fang, 6 and 7 Attack', () => {
    const cases: Array<[number, string]> = [[1, M.auronMegaPotion], [2, M.shootingStar], [3, M.fullBreak], [4, M.dragonFang], [5, M.auronMegaPotion], [6, M.auronAttack], [7, M.auronAttack]];
    for (const [roll, id] of cases) {
      const b = auron(46_874);
      expect(b.id(b.poll(roll, 0)), `roll ${roll}`).toBe(id);
    }
    const mega = auron(46_874);
    const c = mega.poll(1);
    expect([mega.targets(c), mega.rng.calls]).toEqual([[], [ROLL_RANGE]]); // the whole side, no search
    const above = auron(46_875);
    expect(above.id(above.poll(1, 0)), 'at 46,875 the draw is mod 6: a 1 is Dragon Fang').toBe(M.dragonFang);
  });

  it('roll 0 in the low band: Shooting Star on the FIRST living girl, in the order Yuna, Rikku, Paine, whose Death resist byte is not 0 (`[I]`); Shin Zantetsu on the party when none has one', () => {
    const none = auron(46_874);
    const c = none.poll(0);
    expect([none.id(c), none.targets(c), none.rng.calls]).toEqual([M.shinZantetsu, [], [ROLL_RANGE]]);

    const rikkuAndPaine = auron(46_874);
    rikkuAndPaine.girls[1].immunities['ko'] = 255;
    rikkuAndPaine.girls[2].immunities['ko'] = 255;
    const c2 = rikkuAndPaine.poll(0);
    expect([rikkuAndPaine.id(c2), rikkuAndPaine.targets(c2), rikkuAndPaine.rng.calls]).toEqual([M.shootingStar, ['rikku'], [ROLL_RANGE]]);

    const yuna = auron(46_874);
    for (const g of yuna.girls) g.immunities['ko'] = 255;
    expect(yuna.targets(yuna.poll(0))).toEqual(['yuna']);

    // A girl who is down is skipped, however resistant.
    const downed = auron(46_874);
    downed.girls[0].immunities['ko'] = 255;
    downed.girls[0].alive = false;
    expect(downed.id(downed.poll(0)), 'Yuna is down and the others resist nothing').toBe(M.shinZantetsu);
  });

  it('with no girl standing he has no move and spends nothing', () => {
    const b = auron();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
  });
});

describe('Tidus [RE §6.3]', () => {
  it('the opening: Blitz Ace on a near-weighted girl with one search and NO roll; the count becomes 1', () => {
    for (const raw of [0, 1, 400, 900, 5_000, 123_456]) {
      const b = tidus();
      const c = b.poll(raw);
      expect([b.id(c), b.targets(c), b.rng.calls], `raw ${raw}`).toEqual([M.blitzAce, [nearPick(raw)], [SEARCH_RANGE]]);
      expect(mem(b.self, TIDUS_COUNT)).toBe(1);
    }
  });

  it('then, un-hasted, Hastega on his side (no draw) until Haste holds; hasted, the draw begins', () => {
    const b = tidus();
    b.poll(0); // the opening
    for (let i = 0; i < 3; i++) {
      b.rng.drain();
      const before = b.rng.calls.length;
      const c = b.poll();
      expect([b.id(c), b.targets(c), b.rng.calls.length - before], `poll ${i + 2}`).toEqual([M.hastega, [], 0]);
    }
    give(b.self, 'haste');
    b.rng.drain();
    const c = b.poll(3, 0); // mod 4 = 3: Attack
    expect(b.id(c)).toBe(M.tidusAttack);
  });

  it('hasted: random() mod 4: 0 Attack, 1 Spiral Cut (count + 1), 2 Delay Buster (count + 1), 3 Attack', () => {
    const rig = (): Bench => {
      const b = tidus();
      give(b.self, 'haste');
      setMem(b.self, TIDUS_COUNT, 1);
      return b;
    };
    const expected = [M.tidusAttack, M.spiralCut, M.delayBuster, M.tidusAttack];
    for (let roll = 0; roll < 4; roll++) {
      const b = rig();
      const c = b.poll(roll, 0);
      expect(b.id(c), `roll ${roll}`).toBe(expected[roll]);
      expect(b.rng.calls, `roll ${roll}`).toEqual([ROLL_RANGE, SEARCH_RANGE]);
      expect(mem(b.self, TIDUS_COUNT), `roll ${roll}`).toBe(roll === 1 || roll === 2 ? 2 : 1);
    }
  });

  it('below a third of his HP (45,399 or less of 136,200; 45,400 is not): rolls 0 and 1 are a Mega-Potion on his side (count + 1, no search)', () => {
    for (const roll of [0, 1]) {
      const b = tidus(45_399);
      give(b.self, 'haste');
      setMem(b.self, TIDUS_COUNT, 1);
      const c = b.poll(roll);
      expect([b.id(c), b.targets(c), b.rng.calls, mem(b.self, TIDUS_COUNT)], `roll ${roll}`).toEqual([M.tidusMegaPotion, [], [ROLL_RANGE], 2]);
    }
    const edge = tidus(45_400);
    give(edge.self, 'haste');
    setMem(edge.self, TIDUS_COUNT, 1);
    expect(edge.id(edge.poll(0, 0)), 'at 45,400 roll 0 is an Attack').toBe(M.tidusAttack);
  });

  it('roll 3 below a tenth (13,619 or less; 13,620 is not): a Hero Drink on himself (count + 1); roll 2 is unaffected by his HP', () => {
    const b = tidus(13_619);
    give(b.self, 'haste');
    setMem(b.self, TIDUS_COUNT, 1);
    const c = b.poll(3);
    expect([b.id(c), b.targets(c), mem(b.self, TIDUS_COUNT)]).toEqual([M.heroDrink, ['x2-cup-tidus'], 2]);
    const edge = tidus(13_620);
    give(edge.self, 'haste');
    setMem(edge.self, TIDUS_COUNT, 1);
    expect(edge.id(edge.poll(3, 0))).toBe(M.tidusAttack);
    const low = tidus(1_000);
    give(low.self, 'haste');
    setMem(low.self, TIDUS_COUNT, 1);
    expect(low.id(low.poll(2, 0))).toBe(M.delayBuster);
  });

  it('Blitz Ace again once the count is ABOVE 4, on roll 2: four Delay Busters take the count from 1 to 5, the next roll 2 is Blitz Ace and the count is 0, and the poll after it is ANOTHER Blitz Ace (the opening again)', () => {
    const b = tidus();
    give(b.self, 'haste');
    setMem(b.self, TIDUS_COUNT, 1);
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      b.rng.drain();
      seen.push(b.id(b.poll(2, 0))!);
    }
    expect(seen).toEqual([M.delayBuster, M.delayBuster, M.delayBuster, M.delayBuster]);
    expect(mem(b.self, TIDUS_COUNT)).toBe(5);
    b.rng.drain();
    expect(b.id(b.poll(2, 0))).toBe(M.blitzAce);
    expect(mem(b.self, TIDUS_COUNT)).toBe(0);
    b.rng.drain();
    const again = b.poll(0); // count 0: the opening branch, which draws only the search
    expect([b.id(again), mem(b.self, TIDUS_COUNT)]).toEqual([M.blitzAce, 1]);
    // At count exactly 4 the roll is still a Delay Buster (the test is "above 4").
    const four = tidus();
    give(four.self, 'haste');
    setMem(four.self, TIDUS_COUNT, 4);
    expect(four.id(four.poll(2, 0))).toBe(M.delayBuster);
  });

  it('a Reflect on his side (impossible by his record, kept for the script\'s sake) and no Haste: a Dispel Tonic on it, not Hastega', () => {
    const b = tidus();
    setMem(b.self, TIDUS_COUNT, 1);
    give(b.self, 'reflect');
    const c = b.poll();
    expect([b.id(c), b.targets(c)]).toEqual([M.dispelTonic, ['x2-cup-tidus']]);
    expect(b.rng.calls).toHaveLength(0);
  });

  it('with no girl standing he has no move and spends nothing', () => {
    const b = tidus();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
    expect(mem(b.self, TIDUS_COUNT)).toBe(0);
  });
});

describe('Seymour [RE §6.4]', () => {
  it('random() mod 8 above half HP: 0 Demi, 1 Critical Attack, 2 Black Sky, 3 Meteor, 4 Shell, 5 Magic Up, 6 Slowga, 7 Dispel on the party; over 800 values each is an eighth', () => {
    const expected = [M.demi, M.criticalAttack, M.blackSky, M.meteor, M.shell, M.magicUp, M.slowga, M.dispel];
    const tally: Record<string, number> = {};
    for (let v = 0; v < 800; v++) {
      const b = seymour();
      const id = b.id(b.poll(v, 0))!;
      expect(id, `value ${v}`).toBe(expected[v % 8]);
      tally[id] = (tally[id] ?? 0) + 1;
    }
    for (const id of expected) expect(tally[id], id).toBe(100);
  });

  it('the party moves draw only the roll (Demi, Black Sky, Meteor, Slowga, Dispel, Confuse, Ultima) and name no target; the single-girl moves draw a near-weighted search too', () => {
    for (const [roll, id] of [[0, M.demi], [2, M.blackSky], [3, M.meteor], [6, M.slowga], [7, M.dispel]] as Array<[number, string]>) {
      const b = seymour();
      const c = b.poll(roll);
      expect([b.id(c), b.targets(c), b.rng.calls], `roll ${roll}`).toEqual([id, [], [ROLL_RANGE]]);
    }
    for (const raw of [0, 1, 400, 900, 5_000, 123_456]) {
      const b = seymour();
      const c = b.poll(1, raw); // Critical Attack
      expect([b.id(c), b.targets(c), b.rng.calls], `raw ${raw}`).toEqual([M.criticalAttack, [nearPick(raw)], [ROLL_RANGE, SEARCH_RANGE]]);
    }
  });

  it('below half his HP (72,749 or less of 145,500; 72,750 is not): 1 Curaga on himself, 2 and 6 Drain Attack, 3 Absorb; the draws that were Critical Attack, Black Sky, Meteor and Slowga stop appearing', () => {
    const low = (roll: number): [string | null, string[]] => {
      const b = seymour(72_749);
      const c = b.poll(roll, 0);
      return [b.id(c), b.targets(c)];
    };
    expect(low(1)).toEqual([M.curaga, ['x2-cup-seymour']]);
    expect(low(2)[0]).toBe(M.drainAttack);
    expect(low(3)[0]).toBe(M.absorb);
    expect(low(6)[0]).toBe(M.drainAttack);
    const seen = new Set<string>();
    for (let v = 0; v < 800; v++) {
      const b = seymour(72_749);
      seen.add(b.id(b.poll(v, 0))!);
    }
    for (const gone of [M.criticalAttack, M.blackSky, M.meteor, M.slowga]) expect(seen.has(gone), gone).toBe(false);
    const edge = seymour(72_750);
    expect(edge.id(edge.poll(1, 0)), 'at 72,750 a roll of 1 is still the Critical Attack').toBe(M.criticalAttack);
  });

  it('roll 7 below a quarter (36,374 or less; 36,375 is not): Ultima on the party instead of Dispel', () => {
    const low = seymour(36_374);
    expect(low.id(low.poll(7))).toBe(M.ultima);
    const edge = seymour(36_375);
    expect(edge.id(edge.poll(7))).toBe(M.dispel);
  });

  it('roll 4, the ladder: no Shell: Shell on himself; Shell but no Protect: Protect; both: Break on ONE girl, picked uniformly (pick DU10), with a search draw', () => {
    const b = seymour();
    const first = b.poll(4);
    expect([b.id(first), b.targets(first), b.rng.calls]).toEqual([M.shell, ['x2-cup-seymour'], [ROLL_RANGE]]);
    give(b.self, 'shell');
    const second = b.poll(4);
    expect([b.id(second), b.targets(second)]).toEqual([M.protect, ['x2-cup-seymour']]);
    give(b.self, 'protect');
    for (const [raw, girl] of [[0, 'yuna'], [1, 'rikku'], [2, 'paine'], [3, 'yuna']] as Array<[number, string]>) {
      b.rng.drain();
      const before = b.rng.calls.length;
      const c = b.poll(4, raw);
      expect([b.id(c), b.targets(c), b.rng.calls.slice(before)], `raw ${raw}`).toEqual([M.break, [girl], [ROLL_RANGE, SEARCH_RANGE]]);
    }
  });

  it('roll 4 with a Reflect on himself (impossible by his record): a Dispel on himself instead of Shell, and instead of Protect', () => {
    const b = seymour();
    give(b.self, 'reflect');
    const c = b.poll(4);
    expect([b.id(c), b.targets(c)]).toEqual([M.dispelSelf, ['x2-cup-seymour']]);
    give(b.self, 'shell');
    const d = b.poll(4);
    expect([b.id(d), b.targets(d)]).toEqual([M.dispelSelf, ['x2-cup-seymour']]);
    const heal = seymour(72_749);
    give(heal.self, 'reflect');
    const e = heal.poll(1);
    expect([heal.id(e), heal.targets(e)], 'below half, roll 1: Dispel instead of Curaga').toEqual([M.dispelSelf, ['x2-cup-seymour']]);
  });

  it('roll 5: Magic Up five times, then Strength Up five times, then Confuse on the party for ever (the names in the source are crossed)', () => {
    const b = seymour();
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      b.rng.drain();
      const c = b.poll(5);
      seen.push(b.id(c)!);
      if (i < 10) expect(b.targets(c)).toEqual(['x2-cup-seymour']);
      else expect(b.targets(c)).toEqual([]);
    }
    expect(seen).toEqual([...Array(5).fill(M.magicUp), ...Array(5).fill(M.strengthUp), M.confuse, M.confuse]);
    expect([mem(b.self, SEYMOUR_MAGIC_UPS), mem(b.self, SEYMOUR_STRENGTH_UPS)]).toEqual([5, 5]);
  });

  it('with no girl standing he has no move and spends nothing', () => {
    const b = seymour();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
  });
});
