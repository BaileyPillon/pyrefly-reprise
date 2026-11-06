/**
 * The possessed Rikku and the possessed Paine (the hidden chapter "Yuna's Ballad"): the two scripts, poll by poll, on a stub context with exact draws. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/yunas-ballad.ts` is the game's own order (`m254`, `m256`; `research/re-ffx2-yunas-ballad.md` §6.2 and §6.3). What this file pins, each fact tagged `[RE]`:
 *
 * 1. **Rikku** [RE §6.2]: the target is picked first (a near-weighted search over the living girls, drawn even for the party-wide throw), then one `random() % 10`: 0 to 3 a throw at the picked girl (Bomb Core, Arctic Wind,
 *    Lightning Marble, Dragon Scale), 4 and 5 Grenade on the party, 6 to 9 Spider Attack at the picked girl. So 40 percent Spider Attack, 20 Grenade, 10 each for the four throws; the repo's wiki-level draw of nine is
 *    superseded by the script's draw of ten.
 * 2. **Paine** [RE §6.3]: Attack on the living girl with the most current HP, every poll (the ties are kept), no draw at all with one girl.
 * 3. **The draws**: `random() % n` is stream 2 (0 to 0xFFFF), a target search is stream 4 and draws only with two or more candidates, so **with Yuna alone no search is drawn**.
 */
import { describe, expect, it } from 'vitest';

import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { RIKKU_DRAW_MODULUS, RIKKU_GRENADE_DRAWS, RIKKU_THROWS } from '../../../src/battle/ffx2/ai/yunas-ballad.ts';
import {
  POSSESSED_PAINE_ATTACK_ID as PAINE_ATTACK,
  POSSESSED_RIKKU_ARCTIC_WIND_ID,
  POSSESSED_RIKKU_BOMB_CORE_ID,
  POSSESSED_RIKKU_DRAGON_SCALE_ID,
  POSSESSED_RIKKU_GRENADE_ID as GRENADE,
  POSSESSED_RIKKU_LIGHTNING_MARBLE_ID,
  POSSESSED_RIKKU_SPIDER_ATTACK_ID as SPIDER,
  x2YunasBalladAbilities,
} from '../../../src/data/ffx2/enemies/yunas-ballad-abilities.ts';
import { x2PossessedPaine, x2PossessedRikku } from '../../../src/data/ffx2/enemies/yunas-ballad.ts';
import { POSSESSED_PAINE_SCRIPT_ID, POSSESSED_RIKKU_SCRIPT_ID } from '../../../src/data/yunas-ballad-ids.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const ROLL_RANGE: [number, number] = [0, 0xffff];
const THROWS = [POSSESSED_RIKKU_BOMB_CORE_ID, POSSESSED_RIKKU_ARCTIC_WIND_ID, POSSESSED_RIKKU_LIGHTNING_MARBLE_ID, POSSESSED_RIKKU_DRAGON_SCALE_ID];

const rikku = (): Bench => bench(enemy('x2-possessed-rikku', 7_800, { mp: 92 }), POSSESSED_RIKKU_SCRIPT_ID);
const paine = (): Bench => bench(enemy('x2-possessed-paine', 9_200, { mp: 55 }), POSSESSED_PAINE_SCRIPT_ID);

/** Yuna alone: the other two girls are not in the party (a party of one, as the chapter fields it). */
function aloneRikku(): Bench {
  const b = rikku();
  b.girls[1].alive = false;
  b.girls[2].alive = false;
  return b;
}
function alonePaine(): Bench {
  const b = paine();
  b.girls[1].alive = false;
  b.girls[2].alive = false;
  return b;
}

describe('the ids the scripts name are the data files\'', () => {
  it('every ability id of the scripts is a registered ability, and the enemy data names the same scripts', () => {
    expect(x2PossessedRikku.aiScriptId).toBe(POSSESSED_RIKKU_SCRIPT_ID);
    expect(x2PossessedPaine.aiScriptId).toBe(POSSESSED_PAINE_SCRIPT_ID);
    for (const id of [SPIDER, GRENADE, PAINE_ATTACK, ...THROWS]) expect(x2YunasBalladAbilities.some((a) => a.id === id), id).toBe(true);
    for (const script of [POSSESSED_RIKKU_SCRIPT_ID, POSSESSED_PAINE_SCRIPT_ID]) expect(aiScriptFor(script).id, script).toBe(script);
    expect(RIKKU_THROWS).toEqual(THROWS);
    expect(RIKKU_DRAW_MODULUS).toBe(10);
    expect([...RIKKU_GRENADE_DRAWS]).toEqual([4, 5]);
  });
});

describe('Rikku [RE §6.2]', () => {
  it('random() % 10: 0 to 3 are the four throws in order (Bomb Core, Arctic Wind, Lightning Marble, Dragon Scale), each at the picked girl', () => {
    for (let v = 0; v < 4; v++) {
      const b = rikku();
      const c = b.poll(1 /* the search */, v);
      expect(b.id(c), `value ${v}`).toBe(THROWS[v]);
      expect(b.targets(c), `value ${v}`).toHaveLength(1);
    }
  });

  it('4 and 5 are the Grenade on the whole party (no target), and 6 to 9 are Spider Attack at the picked girl', () => {
    for (const v of [4, 5]) {
      const b = rikku();
      const c = b.poll(1, v);
      expect(b.id(c), `value ${v}`).toBe(GRENADE);
      expect(b.targets(c), `value ${v}`).toEqual([]);
    }
    for (const v of [6, 7, 8, 9]) {
      const b = rikku();
      const c = b.poll(1, v);
      expect(b.id(c), `value ${v}`).toBe(SPIDER);
      expect(b.targets(c), `value ${v}`).toHaveLength(1);
    }
  });

  it('the shares over 1,000 consecutive values are 40 percent Spider Attack, 20 Grenade and 10 each of the four throws (the modulus is ten, not nine)', () => {
    const counts: Record<string, number> = {};
    for (let v = 0; v < 1000; v++) {
      const b = aloneRikku();
      const id = b.id(b.poll(v))!; // one girl: no search draw, only the roll
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts).toEqual({ [SPIDER]: 400, [GRENADE]: 200, [POSSESSED_RIKKU_BOMB_CORE_ID]: 100, [POSSESSED_RIKKU_ARCTIC_WIND_ID]: 100, [POSSESSED_RIKKU_LIGHTNING_MARBLE_ID]: 100, [POSSESSED_RIKKU_DRAGON_SCALE_ID]: 100 });
  });

  it('with three girls alive the target search is drawn FIRST and even for the Grenade (range 0 to 2, one draw), then the roll: two draws every poll', () => {
    for (const v of [0, 4, 6]) {
      const b = rikku();
      b.rng.drain();
      const before = b.rng.calls.length;
      b.poll(2 /* the search */, v);
      const calls = b.rng.calls.slice(before);
      expect(calls, `value ${v}`).toHaveLength(2);
      expect(calls[0]![0], `value ${v} search`).toBe(0); // the search over three girls
      expect(calls[0]![1], `value ${v} search`).toBe(2);
      expect(calls[1], `value ${v} roll`).toEqual(ROLL_RANGE);
    }
  });

  it('with Yuna alone no search is drawn: one draw per poll, the roll, and the target is Yuna', () => {
    for (const v of [0, 4, 9]) {
      const b = aloneRikku();
      b.rng.drain();
      const before = b.rng.calls.length;
      const c = b.poll(v);
      expect(b.rng.calls.slice(before), `value ${v}`).toEqual([ROLL_RANGE]);
      if (b.id(c) !== GRENADE) expect(b.targets(c), `value ${v}`).toEqual(['yuna']);
    }
  });

  it('with no girl alive the poll is nothing', () => {
    const b = rikku();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
  });

  it('has no state: the same draws give the same moves poll after poll (no counter, no HP branch)', () => {
    const b = aloneRikku();
    const ids = [3, 3, 3, 8, 8, 5].map((v) => b.id(b.poll(v)));
    expect(ids).toEqual([POSSESSED_RIKKU_DRAGON_SCALE_ID, POSSESSED_RIKKU_DRAGON_SCALE_ID, POSSESSED_RIKKU_DRAGON_SCALE_ID, SPIDER, SPIDER, GRENADE]);
    b.self.hp = 1; // a sliver of HP changes nothing
    expect(b.id(b.poll(8))).toBe(SPIDER);
    expect(b.self.aiMemory ?? {}).toEqual({});
  });
});

describe('Paine [RE §6.3]', () => {
  it('Attack on the living girl with the most current HP, every poll', () => {
    const b = paine();
    b.girls[0].hp = 300;
    b.girls[1].hp = 900;
    b.girls[2].hp = 500;
    // the first search is made and thrown away, then the girls tied for the highest HP: one candidate, so one draw in total
    const c = b.poll(0 /* the first (discarded) search */);
    expect(b.id(c)).toBe(PAINE_ATTACK);
    expect(b.targets(c)).toEqual(['rikku']);
  });

  it('a tie for the highest HP keeps every girl tied and picks among them', () => {
    const seen = new Set<string>();
    for (const v of [0, 1]) {
      const b = paine();
      b.girls[0].hp = 700;
      b.girls[1].hp = 700;
      b.girls[2].hp = 100;
      const c = b.poll(0 /* the discarded search over three */, v /* the pick among the two tied */);
      expect(b.id(c)).toBe(PAINE_ATTACK);
      seen.add(b.targets(c)[0]!);
    }
    expect([...seen].sort()).toEqual(['rikku', 'yuna']);
  });

  it('with Yuna alone it is Attack on Yuna and NO draw is made at all', () => {
    const b = alonePaine();
    b.rng.drain();
    const before = b.rng.calls.length;
    for (let i = 0; i < 5; i++) {
      const c = b.poll();
      expect(b.id(c)).toBe(PAINE_ATTACK);
      expect(b.targets(c)).toEqual(['yuna']);
    }
    expect(b.rng.calls.length - before).toBe(0);
  });

  it('with no girl alive the poll is nothing; and it never queues anything but Attack', () => {
    const b = paine();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    const ids = new Set<string | null>();
    for (let i = 0; i < 20; i++) {
      const c = paine();
      c.girls[0].hp = 5000 + i; // the unique highest, so only the discarded search is drawn
      ids.add(c.id(c.poll(0)));
    }
    expect([...ids]).toEqual([PAINE_ATTACK]);
  });
});
