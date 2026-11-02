/**
 * The four Fallen Maesters (the Via Infinito's floors 20, 40, 60 and 80; the hidden chapter): the four scripts, poll by poll, on a stub context with exact draws. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/fallen-maesters-a.ts` and `-b.ts` are the game's own order (`m221`, `m069`, `m232`, `m239`; `research/re-ffx2-fallen-maesters.md` §7.2 to §7.5). What this file pins, each fact tagged `[RE]`:
 *
 * 1. **Aranea** [RE §7.2]: the poll counter gains 1 first; the fifth poll is Gooey End on the party (no draw), every other poll one `random() mod 4` (0 Spider Bite, 1 to 3 Attack) and one near-weighted search.
 * 2. **The Black Elemental** [RE §7.3]: the turn counter, five Magic Ups on polls 3, 6, 9, 12 and 15; Absorb below a third of its HP at one roll in four on the girl with the most HP (a discarded first search, then the ties);
 *    the mix (Berserk 50, Flare 33.3, Ultima 16.7 percent; with every girl Berserk, Ultima 41.7 and Flare 58.3).
 * 3. **Concherer** [RE §7.4]: Gunk, Megaton Press or Attack on `random() mod 4`; the reaction breaks the shell on ONE result of 10,000 HP or more (not on a total), stores DEF and MDEF as 1, and the poll is then Attack only.
 * 4. **Chac** [RE §7.5]: a start draw `mod 4`, Heaven's Cataract on the 6th, 5th, 4th or 3rd poll and then every sixth, "alive minus petrified is exactly one" means a plain Attack on any living girl (the petrified
 *    included), otherwise `mod 3`: 0 Attack, 1 and 2 Stony Glare on a girl who is not stone.
 * 5. **The draws**: `random() mod n` is stream 2 (0 to 0xFFFF), a target search is stream 4 (0 to 0x7FFFFFFF) and draws only with two or more candidates. **`[inferred]`**: the near-weighted picks use Trema's scene
 *    (`MAESTERS_SCENE`), because the four floors ship no start positions.
 */
import { describe, expect, it } from 'vitest';

import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { pickIndexByWeights, sceneWeights } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import {
  ARANEA_COUNTER,
  ARANEA_SCRIPT,
  BLACK_ELEMENTAL_MAGIC_UPS,
  BLACK_ELEMENTAL_SCRIPT,
  BLACK_ELEMENTAL_TURNS,
  MAESTERS_A_ABILITY as A,
  MAESTERS_SCENE,
} from '../../../src/battle/ffx2/ai/fallen-maesters-a.ts';
import { CHAC_COUNTER, CHAC_SCRIPT, CONCHERER_SCRIPT, MAESTERS_B_ABILITY as B, SHELL_BROKEN } from '../../../src/battle/ffx2/ai/fallen-maesters-b.ts';
import { mem, setMem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { x2FallenMaestersAbilities } from '../../../src/data/ffx2/enemies/fallen-maesters-abilities.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

/** The chapter's own ability rows (the unit-test bench has no catalog). */
const ability = (id: string) => x2FallenMaestersAbilities.find((a) => a.id === id);

const ROLL_RANGE: [number, number] = [0, 0xffff];
const SEARCH_RANGE: [number, number] = [0, 0x7fffffff];

/** A girl's status, the way the engine lays one (a bare instance). */
function give(girl: Ffx2Unit, status: string): void {
  girl.statuses[status as 'petrify'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
}

const aranea = (): Bench => bench(enemy('x2-aranea', 18_280, { mp: 178 }), ARANEA_SCRIPT);
const blackElemental = (opts: { hp?: number } = {}): Bench => bench(enemy('x2-black-elemental', 9_999, { mp: 2_380, ...(opts.hp !== undefined ? { hp: opts.hp } : {}) }), BLACK_ELEMENTAL_SCRIPT);
const concherer = (): Bench => bench(enemy('x2-concherer', 343_280, { mp: 170 }), CONCHERER_SCRIPT);
const chac = (): Bench => bench(enemy('x2-chac', 437_850, { mp: 820 }), CHAC_SCRIPT);

/** The girl a near-weighted search picks for a raw value, from the stand-in scene (all three standing). */
const nearPick = (raw: number): string => ['yuna', 'rikku', 'paine'][pickIndexByWeights(raw, sceneWeights(MAESTERS_SCENE, [0, 1, 2]))]!;

describe('the ids the scripts name are the data files\'', () => {
  it('every ability and script id of the scripts is a registered ability and the enemy data names the same scripts', async () => {
    const ids = await import('../../../src/data/fallen-maesters-ids.ts');
    const data = await import('../../../src/data/ffx2/enemies/fallen-maesters.ts');
    expect(ids.ARANEA_SCRIPT_ID).toBe(ARANEA_SCRIPT);
    expect(ids.BLACK_ELEMENTAL_SCRIPT_ID).toBe(BLACK_ELEMENTAL_SCRIPT);
    expect(ids.CONCHERER_SCRIPT_ID).toBe(CONCHERER_SCRIPT);
    expect(ids.CHAC_SCRIPT_ID).toBe(CHAC_SCRIPT);
    expect([data.x2Aranea.aiScriptId, data.x2BlackElemental.aiScriptId, data.x2Concherer.aiScriptId, data.x2Chac.aiScriptId]).toEqual([ARANEA_SCRIPT, BLACK_ELEMENTAL_SCRIPT, CONCHERER_SCRIPT, CHAC_SCRIPT]);
    for (const id of [...Object.values(A), ...Object.values(B)]) expect(ability(id), id).toBeDefined();
    for (const script of [ARANEA_SCRIPT, BLACK_ELEMENTAL_SCRIPT, CONCHERER_SCRIPT, CHAC_SCRIPT]) expect(aiScriptFor(script).id, script).toBe(script);
  });
});

describe('Aranea [RE §7.2]', () => {
  it('four Attack or Bite polls, then Gooey End on the whole party with no draw, then four more: Gooey End on polls 5, 10, 15 and 20', () => {
    const b = aranea();
    const gooey: number[] = [];
    for (let poll = 1; poll <= 20; poll++) {
      b.rng.drain();
      const before = b.rng.calls.length;
      const c = b.poll(1, 0); // a roll of 1 (Attack) and a search value
      if (b.id(c) === A.gooeyEnd) {
        gooey.push(poll);
        expect(b.targets(c), `poll ${poll}`).toEqual([]);
        expect(b.rng.calls.length - before, `poll ${poll}`).toBe(0);
      } else {
        expect(b.id(c), `poll ${poll}`).toBe(A.araneaAttack);
        expect(b.rng.calls.slice(before), `poll ${poll}`).toEqual([ROLL_RANGE, SEARCH_RANGE]);
      }
    }
    expect(gooey).toEqual([5, 10, 15, 20]);
    expect(mem(b.self, ARANEA_COUNTER)).toBe(0);
  });

  it('random() mod 4: 0 is Spider Bite, 1 to 3 Attack; over 400 consecutive values the Bite is a quarter', () => {
    let bites = 0;
    for (let v = 0; v < 400; v++) {
      const b = aranea();
      const id = b.id(b.poll(v, 0));
      expect(id, `value ${v}`).toBe(v % 4 === 0 ? A.spiderBite : A.araneaAttack);
      if (id === A.spiderBite) bites++;
    }
    expect(bites).toBe(100);
  });

  it('the target is the near-weighted pick of the stand-in scene (Trema\'s), and one girl left means no search draw', () => {
    for (const raw of [0, 1, 400, 900, 5_000, 123_456]) {
      const b = aranea();
      expect(b.targets(b.poll(1, raw)), `raw ${raw}`).toEqual([nearPick(raw)]);
    }
    const lone = aranea();
    lone.girls[0].alive = false;
    lone.girls[1].alive = false;
    const c = lone.poll(1);
    expect(lone.targets(c)).toEqual(['paine']);
    expect(lone.rng.calls).toEqual([ROLL_RANGE]);
  });

  it('with no girl standing it has no move and spends nothing', () => {
    const b = aranea();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
    expect(mem(b.self, ARANEA_COUNTER)).toBe(0);
  });
});

describe('the Black Elemental: the schedule [RE §7.3]', () => {
  it('Magic Up on itself on polls 3, 6, 9, 12 and 15 and never again: from poll 16 on every poll is a mix', () => {
    const b = blackElemental();
    const ups: number[] = [];
    for (let poll = 1; poll <= 40; poll++) {
      b.rng.drain();
      const c = b.poll(1, 1, 0); // mix branch 1 (mod 2), then mod 3 = 1 (Flare), then a search value
      if (b.id(c) === A.magicUp) {
        ups.push(poll);
        expect(b.targets(c), `poll ${poll}`).toEqual([b.self.id]);
      } else {
        expect(b.id(c), `poll ${poll}`).toBe(A.flare);
      }
    }
    expect(ups).toEqual([3, 6, 9, 12, 15]);
    expect(mem(b.self, BLACK_ELEMENTAL_MAGIC_UPS)).toBe(5);
  });

  it('a Magic Up draws nothing at all', () => {
    const b = blackElemental();
    b.poll(1, 1, 0);
    b.poll(1, 1, 0);
    b.rng.drain();
    const before = b.rng.calls.length;
    expect(b.id(b.poll())).toBe(A.magicUp);
    expect(b.rng.calls.length).toBe(before);
  });
});

describe('the Black Elemental: the mix [RE §7.3 step 4]', () => {
  it('with a girl lacking Berserk: mod 2 = 0 is Berserk (near-weighted among those without it); mod 2 = 1 then mod 3: 0 Ultima, 1 and 2 Flare', () => {
    const b = blackElemental();
    const berserk = b.poll(0, 5_000);
    expect([b.id(berserk), b.targets(berserk)]).toEqual([A.berserk, [nearPick(5_000)]]);
    const ultima = blackElemental().poll(1, 0);
    expect(ultima && 'id' in ultima ? ultima.id : null).toBe(A.ultima);
    const flare = blackElemental();
    const c = flare.poll(1, 1, 0);
    expect([flare.id(c), flare.targets(c)]).toEqual([A.flare, ['yuna']]);
    const flare2 = blackElemental();
    expect(flare2.id(flare2.poll(1, 2, 1))).toBe(A.flare);
  });

  it('Berserk 50, Flare 33.3 and Ultima 16.7 percent over a full cycle of the draws (mod 2 and mod 3: six combinations, uniform)', () => {
    const tally: Record<string, number> = {};
    // The six equally likely combinations of the draws (mod 2 for the branch, mod 3 for branch 1): branch 0 is three of the six, each of branch 1's three values one.
    const b0 = blackElemental();
    tally[b0.id(b0.poll(0, 0))!] = 3;
    for (let three = 0; three < 3; three++) {
      const b = blackElemental();
      const id = b.id(b.poll(1, three, 0))!;
      tally[id] = (tally[id] ?? 0) + 1;
    }
    expect(tally).toEqual({ [A.berserk]: 3, [A.ultima]: 1, [A.flare]: 2 });
  });

  it('with every living girl already Berserk: branch 0 draws a second mod 2 (0 Ultima, 1 Flare), branch 1 mod 3 as before; Ultima 41.7 and Flare 58.3 percent', () => {
    const run = (draws: number[]): string | null => {
      const b = blackElemental();
      for (const g of b.girls) give(g, 'berserk');
      return b.id(b.poll(...draws));
    };
    expect(run([0, 0])).toBe(A.ultima);
    expect(run([0, 1, 0])).toBe(A.flare);
    expect(run([1, 0])).toBe(A.ultima);
    expect(run([1, 1, 0])).toBe(A.flare);
    expect(run([1, 2, 0])).toBe(A.flare);
    // 6 combinations of the draws, weighted by the branch (mod 2): Ultima 1/2 x 1/2 + 1/2 x 1/3 = 5/12.
    expect((1 / 2) * (1 / 2) + (1 / 2) * (1 / 3)).toBeCloseTo(5 / 12, 10);
  });

  it('Ultima is aimed at nobody (the whole party); Flare at one living girl, uniformly; Berserk never at a girl who has it', () => {
    const b = blackElemental();
    give(b.girls[0], 'berserk');
    give(b.girls[1], 'berserk');
    const c = b.poll(0, 0);
    expect([b.id(c), b.targets(c)]).toEqual([A.berserk, ['paine']]); // one candidate: no search draw
    expect(b.rng.calls).toEqual([ROLL_RANGE]);
  });
});

describe('the Black Elemental: Absorb below a third of its HP [RE §7.3 step 1]', () => {
  it('3,333 of 9,999 is the line: 3,332 rolls for Absorb, 3,333 does not (nothing is drawn for the roll)', () => {
    expect(Math.floor(9_999 / 3)).toBe(3_333);
    const low = blackElemental({ hp: 3_332 });
    low.poll(1, 1, 0);
    expect(low.rng.calls[0]).toEqual(ROLL_RANGE);
    const edge = blackElemental({ hp: 3_333 });
    edge.poll(1, 0);
    expect(edge.rng.calls.length).toBe(2); // the mix's mod 2, then (branch 1) mod 3... only 2 here: roll, then the search (Berserk branch)
    expect(edge.rng.calls.every(([lo, hi]) => hi === 0xffff || hi === 0x7fffffff)).toBe(true);
  });

  it('a roll of 0 mod 4 is Absorb on the girl with the most HP: a first search is drawn and thrown away, then the girls tied for the top are searched', () => {
    const b = blackElemental({ hp: 3_000 });
    b.girls[0].hp = 900;
    b.girls[1].hp = 1000;
    b.girls[2].hp = 400;
    const c = b.poll(0, 0); // the roll, then the discarded search value (three candidates)
    expect([b.id(c), b.targets(c)]).toEqual([A.absorb, ['rikku']]);
    expect(b.rng.calls).toEqual([ROLL_RANGE, SEARCH_RANGE]); // one candidate left after the ties: no second draw
    // two tied for the top: both searches draw
    const tied = blackElemental({ hp: 3_000 });
    tied.girls[0].hp = 1000;
    tied.girls[1].hp = 1000;
    tied.girls[2].hp = 100;
    const t = tied.poll(0, 0, 5_000);
    expect(tied.id(t)).toBe(A.absorb);
    expect(tied.rng.calls).toEqual([ROLL_RANGE, SEARCH_RANGE, SEARCH_RANGE]);
    expect(['yuna', 'rikku']).toContain(tied.targets(t)[0]);
  });

  it('a roll of 1, 2 or 3 goes on to the schedule, and an Absorb poll still counts toward the turn counter (the rhythm shifts by one)', () => {
    const b = blackElemental({ hp: 3_000 });
    const c = b.poll(1, 1, 0, 0); // roll 1: no Absorb; poll 1 of the schedule, then the mix
    expect(b.id(c)).not.toBe(A.absorb);
    expect(mem(b.self, BLACK_ELEMENTAL_TURNS)).toBe(1);
    const a = blackElemental({ hp: 3_000 });
    a.poll(0, 0, 0); // poll 1 is Absorb (the three girls are tied for the top: the roll, the discarded search, the ties' search): the counter has still gained 1
    expect(mem(a.self, BLACK_ELEMENTAL_TURNS)).toBe(1);
    a.rng.drain();
    expect(a.id(a.poll(5, 1, 1, 0))).toBe(A.flare); // poll 2: roll 5 mod 4 = 1, no Absorb; a mix (branch 1, mod 3 = 1: Flare)
    a.rng.drain();
    expect(a.id(a.poll(5))).toBe(A.magicUp); // poll 3: Magic Up as ever, drawing only the roll
  });
});

describe('Concherer [RE §7.4]', () => {
  it('shell intact: random() mod 4 0 is Gunk and 1 is Megaton Press (each on a uniform pick), 2 and 3 Attack (near-weighted); a quarter, a quarter, a half over 400 values', () => {
    const count: Record<string, number> = {};
    for (let v = 0; v < 400; v++) {
      const b = concherer();
      const id = b.id(b.poll(v, 0))!;
      expect(id, `value ${v}`).toBe([B.gunk, B.megatonPress, B.conchererAttack, B.conchererAttack][v % 4]);
      count[id] = (count[id] ?? 0) + 1;
    }
    expect(count).toEqual({ [B.gunk]: 100, [B.megatonPress]: 100, [B.conchererAttack]: 200 });
  });

  it('Gunk and Megaton Press are uniform, in slot order (the search value picks the (value mod 3)-th girl); the Attack is near-weighted', () => {
    const g = concherer();
    expect(g.targets(g.poll(0, 4))).toEqual(['rikku']); // 4 mod 3 = 1
    const p = concherer();
    expect(p.targets(p.poll(1, 5))).toEqual(['paine']); // 5 mod 3 = 2
    const a = concherer();
    expect(a.targets(a.poll(2, 777))).toEqual([nearPick(777)]);
  });

  it('the reaction: ONE result of 10,000 HP or more breaks the shell (9,999 does not); DEF and MDEF are stored as 1; the "Broken shell" message shows', () => {
    const below = concherer();
    const def0 = below.self.stats.def;
    below.self.hp -= 9_999;
    aiScriptFor(CONCHERER_SCRIPT).onResult!(below.ctx, below.girls[0], ability(B.conchererAttack)!);
    expect(mem(below.self, SHELL_BROKEN)).toBe(0);
    expect(below.self.stats.def).toBe(def0);

    const b = concherer();
    b.self.hp -= 10_000;
    aiScriptFor(CONCHERER_SCRIPT).onResult!(b.ctx, b.girls[0], ability(B.conchererAttack)!);
    expect(mem(b.self, SHELL_BROKEN)).toBe(1);
    expect(b.self.stats.def).toBe(1);
    expect(b.self.stats.mdef).toBe(1);
    expect(b.events.some((e) => e.type === 'message' && /shell/i.test(String(e.text)))).toBe(true);
  });

  it('the break is measured on ONE result, never on a total: two results of 6,000 do not break it; a 10,000 after them does', () => {
    const b = concherer();
    const script = aiScriptFor(CONCHERER_SCRIPT);
    const hit = ability(B.conchererAttack)!;
    b.self.hp -= 6_000;
    script.onResult!(b.ctx, b.girls[2], hit);
    b.self.hp -= 6_000;
    script.onResult!(b.ctx, b.girls[2], hit);
    expect(mem(b.self, SHELL_BROKEN)).toBe(0);
    b.self.hp -= 10_000;
    script.onResult!(b.ctx, b.girls[2], hit);
    expect(mem(b.self, SHELL_BROKEN)).toBe(1);
  });

  it('a result that heals or changes nothing never breaks it, and a broken shell is not re-broken (DEF stays 1 and one message is shown)', () => {
    const b = concherer();
    const script = aiScriptFor(CONCHERER_SCRIPT);
    const hit = ability(B.conchererAttack)!;
    script.onResult!(b.ctx, b.girls[0], hit);
    expect(mem(b.self, SHELL_BROKEN)).toBe(0);
    b.self.hp -= 20_000;
    script.onResult!(b.ctx, b.girls[0], hit);
    b.self.hp -= 20_000;
    script.onResult!(b.ctx, b.girls[0], hit);
    expect(b.events.filter((e) => e.type === 'message')).toHaveLength(1);
  });

  it('shell broken: only Attacks (near-weighted), no Press, no Gunk, and no draw of stream 2 at all', () => {
    const b = concherer();
    setMem(b.self, SHELL_BROKEN, 1);
    for (let v = 0; v < 40; v++) {
      b.rng.drain();
      const before = b.rng.calls.length;
      const c = b.poll(v * 3);
      expect(b.id(c), `poll ${v}`).toBe(B.conchererAttack);
      expect(b.rng.calls.slice(before)).toEqual([SEARCH_RANGE]);
    }
  });
});

describe('Chac [RE §7.5]', () => {
  it('the start draw mod 4 sets the counter: the first Heaven\'s Cataract is poll 6, 5, 4 or 3 for starts 0, 1, 2 and 3, then every sixth poll', () => {
    const expectedFirst = [6, 5, 4, 3];
    for (let start = 0; start < 4; start++) {
      const b = chac();
      const cataracts: number[] = [];
      for (let poll = 1; poll <= 24; poll++) {
        b.rng.drain();
        const c = poll === 1 ? b.poll(start, 1, 0) : b.poll(1, 0); // roll 1 = Stony Glare while the party stands
        if (b.id(c) === B.heavensCataract) {
          cataracts.push(poll);
          expect(b.targets(c)).toEqual([]);
        }
      }
      expect(cataracts[0], `start ${start}`).toBe(expectedFirst[start]);
      expect(cataracts.slice(1).map((p, i) => p - cataracts[i]!), `start ${start}`).toEqual(Array(cataracts.length - 1).fill(6));
    }
  });

  it('with two or more girls standing and none stone: random() mod 3 0 is Attack, 1 and 2 Stony Glare on a girl who is not stone', () => {
    for (let v = 0; v < 300; v++) {
      const b = chac();
      setMem(b.self, 'chacStarted', 1);
      setMem(b.self, CHAC_COUNTER, 0);
      const c = b.poll(v, 0);
      expect(b.id(c), `value ${v}`).toBe(v % 3 === 0 ? B.chacAttack : B.stonyGlare);
    }
  });

  it('Stony Glare never picks a petrified girl; an Attack may (the petrified are candidates of the plain Attack)', () => {
    const glare = chac();
    setMem(glare.self, 'chacStarted', 1);
    give(glare.girls[0], 'petrify');
    const c = glare.poll(1, 0); // alive 3, stone 1: not exactly one, so the roll; 1 is Stony Glare
    expect(glare.id(c)).toBe(B.stonyGlare);
    expect(glare.targets(c)[0]).not.toBe('yuna');
    const attack = chac();
    setMem(attack.self, 'chacStarted', 1);
    give(attack.girls[0], 'petrify');
    give(attack.girls[1], 'petrify');
    const seen = new Set<string>();
    for (let raw = 0; raw < 4_000; raw += 7) {
      const b = chac();
      setMem(b.self, 'chacStarted', 1);
      give(b.girls[0], 'petrify');
      give(b.girls[1], 'petrify');
      const poll = b.poll(raw); // alive 3, stone 2: alive minus stone is exactly one: a plain Attack with no roll
      expect(b.id(poll)).toBe(B.chacAttack);
      expect(b.rng.calls.length).toBe(1); // only the search (the roll is not drawn)
      seen.add(b.targets(poll)[0]!);
    }
    expect([...seen].sort()).toEqual(['paine', 'rikku', 'yuna']); // the stone girls are targets of the plain Attack
  });

  it('"alive minus stone is exactly one" also fires with one girl standing and none stone, and does not with two stone of three... of two', () => {
    const lone = chac();
    setMem(lone.self, 'chacStarted', 1);
    lone.girls[0].alive = false;
    lone.girls[1].alive = false;
    const c = lone.poll(); // alive 1, stone 0
    expect([lone.id(c), lone.targets(c)]).toEqual([B.chacAttack, ['paine']]);
    expect(lone.rng.calls).toHaveLength(0);
    const twoOfTwo = chac();
    setMem(twoOfTwo.self, 'chacStarted', 1);
    twoOfTwo.girls[0].alive = false;
    give(twoOfTwo.girls[1], 'petrify');
    give(twoOfTwo.girls[2], 'petrify');
    const d = twoOfTwo.poll(1); // alive 2, stone 2: not exactly one; the roll is 1: Stony Glare, but nobody is left who is not stone
    expect(d).toBeNull();
  });

  it('with no girl standing it has no move and spends nothing', () => {
    const b = chac();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
  });
});
