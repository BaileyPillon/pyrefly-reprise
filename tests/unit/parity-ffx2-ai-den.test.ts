/**
 * **Re-parity AI lane C, the Den of Woe shades** (Chapter XV; **FFX-2 only**): the decision tables of
 * `research/re-ffx2-ai-leblanc-den-ixion.md` sections 4.2 to 4.4 (rows D1 to D12 of section 8), walked on the real
 * scripts with raw 16-bit rolls and checked against a poll's draw count.
 *
 * Reproduced from the note: Gippal's two regimes and their exact chances over the 65,536 roll values, the one-third
 * lines in integer arithmetic (4,932 turns Gippal, 4,072 Baralai), Baralai's two-command poll, the burst counter that
 * counts results and aims the Drill Shot at the latest attacker (himself after a Regen tick), and the Triple Attack's
 * fixed targets for every set of living girls. The engine-level block at the end runs the real resolver: results are
 * counted as the game counts them (one per landing strike, one per miss, never his own), the Triple Attack lands one
 * strike on each named girl, and Absorb takes 3/16 of both HP and MP.
 */

import { describe, expect, it, vi } from 'vitest';

// Some tests walk all 65,536 roll values; on a loaded machine they need more than the default 5 seconds.
vi.setConfig({ testTimeout: 60_000 });
import * as data from '../../src/data/ffx2/index.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { BARALAI_COUNT_SEVEN, DRILL_SHOT_AT, MEM, tripleAttackTargets } from '../../src/battle/ffx2/ai/den-of-woe.ts';
import { mem, setMem, type Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { takeResults } from '../../src/battle/ffx2/results-tally.ts';
import { resolveAbility } from '../../src/battle/ffx2/resolve.ts';
import { notifyEnemiesResults } from '../../src/battle/ffx2/engineHooks.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { accuracyFormula, resolveCommand } from '../../src/battle/ffx2/adapt/command.ts';
import { ability, ctxFor } from './helpers/fallenAeonsUnits.ts';
import { bench, enemy, type Bench } from './helpers/ffx2ScriptRig.ts';

const GIPPAL = 'shade-gippal';
const BARALAI = 'shade-baralai';
const NOOJ = 'shade-nooj';
const G = (what: string): string => `x2-den-gippal-${what}`;
const B = (what: string): string => `x2-den-baralai-${what}`;
const N = (what: string): string => `x2-den-nooj-${what}`;

const gippal = (hp = 14800): Bench => bench(enemy('shade-gippal', 14800, { mp: 235, hp }), GIPPAL);
const baralai = (hp = 12220, mp = 720): Bench => bench(enemy('shade-baralai', 12220, { mp, hp }), BARALAI);

// ---------------------------------------------------------------------------------------------------------------------
// Gippal
// ---------------------------------------------------------------------------------------------------------------------

describe('Gippal (m177): rows D8, D9, D10', () => {
  it('"below a third" is HP < max / 3 in integers: 4,933 keeps the cycle (a `% 16` roll), 4,932 turns to the `% 5` table (D8)', () => {
    const keep = gippal(4933);
    expect(keep.id(keep.poll(1, 0))).toBe(G('grinder'));
    expect(keep.rng.calls[0]).toEqual([0, 0xffff]);
    const turned = gippal(4932);
    expect(turned.id(turned.poll(0))).toBe(G('bullseye'));
    expect(turned.rng.calls).toEqual([[0, 0xffff]]); // a Bullseye needs no girl
  });

  it('above a third: 1 in 16 rolls a bomb, `% 2` Flash Bomb or Hush Grenade, and the cycle does not advance; otherwise the five-step cycle', () => {
    const b = gippal();
    expect(b.id(b.poll(0, 0))).toBe(G('flash-bomb'));
    expect(b.id(b.poll(16, 1))).toBe(G('hush-grenade'));
    expect(mem(b.self, MEM.cycle)).toBe(0);
    const order: Array<string | null> = [];
    for (let i = 0; i < 10; i++) { b.rng.drain(); order.push(b.id(b.poll(1, 0))); }
    expect(order).toEqual([G('grinder'), G('attack'), G('grinder'), G('attack'), G('bullseye'), G('grinder'), G('attack'), G('grinder'), G('attack'), G('bullseye')]);
  });

  it('below a third: `% 5` 0 Bullseye, 1 Grinder, 2 Attack on the lowest-HP girl, 3 Mortar, 4 then `% 3` Flash Bomb, Hush Grenade or Potion Plus (D9)', () => {
    const b = gippal(3000);
    b.girls[0]!.hp = 800; b.girls[1]!.hp = 300; b.girls[2]!.hp = 700;
    expect(b.id(b.poll(0))).toBe(G('bullseye'));
    expect(b.targets(b.poll(1, 2))).toEqual(['paine']); // Grinder: a uniform girl (index 2)
    const attack = b.poll(2, 0); // the pair: a discarded pick (index 0), then the single minimum is Rikku
    expect([b.id(attack), b.targets(attack)]).toEqual([G('attack'), ['rikku']]);
    expect(b.rng.calls.slice(-2)).toEqual([[0, 0xffff], [0, 2]]);
    expect(b.id(b.poll(3))).toBe(G('mortar'));
    expect([4, 5, 6].map((r3) => b.id(b.poll(4, r3 - 4)))).toEqual([G('flash-bomb'), G('hush-grenade'), G('potion-plus')]);
    // the cycle is not touched by any of it, and the counter survives into the other regime
    expect(mem(b.self, MEM.cycle)).toBe(0);
  });

  it('the lowest-HP Attack draws the discarded pick and, for a tie, the tie (the pair of searches)', () => {
    const b = gippal(3000);
    b.girls[0]!.hp = 300; b.girls[1]!.hp = 900; b.girls[2]!.hp = 300;
    b.rng.calls.length = 0;
    const attack = b.poll(2, 1, 1); // roll, the thrown-away pick, then the tie between Yuna and Paine (index 1)
    expect(b.targets(attack)).toEqual(['paine']);
    expect(b.rng.calls).toEqual([[0, 0xffff], [0, 2], [0, 1]]);
  });

  it('the chances: Bullseye, Grinder, Attack, Mortar 3 of the 15 (`% 5`, `% 3`) combinations each, Flash Bomb, Hush Grenade, Potion Plus 1 of 15 each', () => {
    const b = gippal(3000);
    const tally: Record<string, number> = {};
    for (let r5 = 0; r5 < 5; r5++) {
      for (let r3 = 0; r3 < 3; r3++) {
        b.rng.drain();
        const id = b.id(b.poll(r5, r5 === 4 ? r3 : 0, 0, 0))!; // `% 3` is rolled only after a 4
        tally[id] = (tally[id] ?? 0) + 1;
      }
    }
    expect(tally).toEqual({ [G('bullseye')]: 3, [G('grinder')]: 3, [G('attack')]: 3, [G('mortar')]: 3, [G('flash-bomb')]: 1, [G('hush-grenade')]: 1, [G('potion-plus')]: 1 });
    // The exact residue counts of `random() % 5` over the 65,536 values the script can draw:
    const five = [0, 0, 0, 0, 0];
    for (let v = 0; v <= 0xffff; v++) five[v % 5] = (five[v % 5] ?? 0) + 1;
    expect(five).toEqual([13108, 13107, 13107, 13107, 13107]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Baralai
// ---------------------------------------------------------------------------------------------------------------------

describe('Baralai (m176): rows D1 to D8, D10', () => {
  it('the one-third line is HP < max / 3 in integers: 4,073 rolls nothing, 4,072 rolls `% 4` first (D8)', () => {
    const above = baralai(4073);
    expect(above.id(above.poll(0))).toBe(B('attack'));
    expect(above.rng.calls).toEqual([[0, 2]]);
    const below = baralai(4072);
    expect(below.id(below.poll(1, 0))).toBe(B('attack')); // 1 % 4 : the low-HP move is not taken
    expect(below.rng.calls).toEqual([[0, 0xffff], [0, 2]]);
  });

  it('the cycle: Attack, Glint, Triple Attack (Attack with one girl left), Looming Glacier, Silence or Absorb under 20 MP, then again', () => {
    const b = baralai();
    const order: Array<string | null> = [];
    for (let i = 0; i < 10; i++) { b.rng.drain(); order.push(b.id(b.poll(0, 0))); }
    expect(order).toEqual([B('attack'), B('glint'), B('triple-attack'), B('looming-glacier'), B('silence'), B('attack'), B('glint'), B('triple-attack'), B('looming-glacier'), B('silence')]);
    const lone = baralai(12220, 19);
    lone.girls[1]!.alive = false; lone.girls[2]!.alive = false;
    expect([1, 2, 3, 4, 5].map(() => { lone.rng.drain(); return lone.id(lone.poll(0, 0)); })).toEqual([B('attack'), B('glint'), B('attack'), B('looming-glacier'), B('absorb')]);
  });

  it('below a third, a 1 in 4 roll queues the low-HP move AND the poll\'s normal move: Regen first, the cycle command at the next poll (D1, D2)', () => {
    const b = baralai(4000);
    const first = b.poll(0, 1); // 0 % 4 : Regen; then the cycle's Attack on a girl (index 1)
    expect([b.id(first), b.targets(first)]).toEqual([B('regen'), []]);
    expect(mem(b.self, MEM.cycle)).toBe(1); // the poll took its cycle step
    b.rng.calls.length = 0;
    const second = b.poll(); // the queued Attack: no roll, no draw
    expect([b.id(second), b.targets(second)]).toEqual([B('attack'), ['rikku']]);
    expect(b.rng.calls).toEqual([]);
    expect(b.id(b.poll(1))).toBe(B('glint')); // the next fresh poll is step 2
  });

  it('the low-HP move: Guard only if he has Reflect (nothing gives it), Absorb on the highest-MP girl below 60 MP, else Regen (D1)', () => {
    const reflect = baralai(4000);
    reflect.self.statuses.reflect = { id: 'reflect' } as never;
    expect(reflect.id(reflect.poll(0, 0))).toBe(B('not-so-mighty-guard'));
    const poor = baralai(4000, 59);
    poor.girls[0]!.mp = 10; poor.girls[1]!.mp = 80; poor.girls[2]!.mp = 40;
    const absorb = poor.poll(0, 1, 0); // roll, the pair's thrown-away pick, then the cycle's Attack girl
    expect([poor.id(absorb), poor.targets(absorb)]).toEqual([B('absorb'), ['rikku']]);
    const edge = baralai(4000, 60);
    expect(edge.id(edge.poll(0, 0))).toBe(B('regen')); // 60 MP is not below 60
  });

  it('the low-HP roll is `% 4 = 0`: 4 takes it and 5 does not, and exactly 16,384 of the 65,536 values do (D1)', () => {
    const b = baralai(4000);
    const rolled = (v: number): boolean => {
      setMem(b.self, MEM.cycle, 0);
      setMem(b.self, MEM.queued, '');
      b.rng.drain();
      return b.id(b.poll(v, 0, 0)) === B('regen');
    };
    expect(rolled(4)).toBe(true); // 4 % 4 = 0, but 4 % 5 = 4
    expect(rolled(5)).toBe(false); // 5 % 4 = 1, but 5 % 5 = 0
    let taken = 0;
    for (let v = 0; v <= 0xffff; v++) if (rolled(v)) taken += 1;
    expect(taken).toBe(16384);
  });

  it('the burst counter counts results: +1 each; at 8 the next poll is the Drill Shot on the latest attacker and takes no cycle step (D3, D4)', () => {
    const b = baralai();
    const script = aiScriptFor(BARALAI);
    script.onResults!(b.ctx, { count: 7, lastAttackerId: 'paine' });
    expect(mem(b.self, MEM.hits)).toBe(7);
    expect(b.id(b.poll(0))).toBe(B('attack')); // 7 is not 8
    script.onResults!(b.ctx, { count: 1, lastAttackerId: 'rikku' });
    const cycleBefore = mem(b.self, MEM.cycle);
    b.rng.calls.length = 0;
    const drill = b.poll();
    expect([b.id(drill), b.targets(drill)]).toEqual([B('drill-shot'), ['rikku']]);
    expect(b.rng.calls).toEqual([]);
    expect([mem(b.self, MEM.hits), mem(b.self, MEM.cycle)]).toEqual([0, cycleBefore]);
  });

  it('the Drill Shot goes to a living girl when the latest attacker is gone, and to himself after his own Regen tick (D4)', () => {
    const gone = baralai();
    const script = aiScriptFor(BARALAI);
    script.onResults!(gone.ctx, { count: 8, lastAttackerId: 'paine' });
    gone.girls[2]!.alive = false;
    const dead = gone.poll(1); // the near-weighted pick over the two living girls (index 1)
    expect([gone.id(dead), gone.targets(dead)]).toEqual([B('drill-shot'), ['rikku']]);

    const self = baralai();
    script.onResults!(self.ctx, { count: 8, lastAttackerId: 'rikku' });
    script.onRegen!(self.ctx, 360); // a Regen tick is applied with himself as the attacker: not counted, but the latest
    expect(mem(self.self, MEM.hits)).toBe(8);
    const drill = self.poll();
    expect([self.id(drill), self.targets(drill)]).toEqual([B('drill-shot'), [self.self.id]]);
  });

  it('the Drill Shot comes after the low-HP move in the same poll: Regen now, the Drill Shot next (D2)', () => {
    const b = baralai(4000);
    aiScriptFor(BARALAI).onResults!(b.ctx, { count: 8, lastAttackerId: 'yuna' });
    expect(b.id(b.poll(0))).toBe(B('regen'));
    expect(mem(b.self, MEM.cycle)).toBe(0); // no cycle step this poll
    const drill = b.poll();
    expect([b.id(drill), b.targets(drill)]).toEqual([B('drill-shot'), ['yuna']]);
  });

  it('the count-seven callout is emitted once, the first time the counter reaches 7 or more (presentation only)', () => {
    const b = baralai();
    const script = aiScriptFor(BARALAI);
    script.onResults!(b.ctx, { count: 6, lastAttackerId: 'yuna' });
    expect(b.events).toEqual([]);
    script.onResults!(b.ctx, { count: 3, lastAttackerId: 'yuna' }); // 6 -> 9 skips 7 and still calls it
    expect(b.events.map((e) => (e as { name?: string }).name)).toEqual([BARALAI_COUNT_SEVEN]);
    script.onResults!(b.ctx, { count: 1, lastAttackerId: 'yuna' });
    expect(b.events.length).toBe(1);
    expect(DRILL_SHOT_AT).toBe(8);
  });

  it('Triple Attack: three Chain Attacks at fixed girls, falling back as the script does (D5)', () => {
    const girls = [aiUnit('yuna', 'party', 1000, 0), aiUnit('rikku', 'party', 1000, 1), aiUnit('paine', 'party', 1000, 2)];
    const living = (...down: number[]): Ffx2Unit[] => girls.filter((_, i) => !down.includes(i));
    expect(tripleAttackTargets(living())).toEqual(['yuna', 'rikku', 'paine']);
    expect(tripleAttackTargets(living(0))).toEqual(['paine', 'rikku', 'paine']);
    expect(tripleAttackTargets(living(1))).toEqual(['yuna', 'paine', 'paine']);
    expect(tripleAttackTargets(living(2))).toEqual(['yuna', 'rikku', 'yuna']);
    const b = baralai();
    setMem(b.self, MEM.cycle, 2);
    const command = b.poll();
    expect([b.id(command), b.targets(command)]).toEqual([B('triple-attack'), ['yuna', 'rikku', 'paine']]);
    expect(b.rng.calls).toEqual([]); // fixed targets: no draw
  });

  it('Looming Glacier: the highest-MP girl not in Stop (ties drawn); every girl in Stop leaves the target to the engine (D6)', () => {
    const at = (mps: [number, number, number], stopped: number[] = []): [string | null, string[], number] => {
      const b = baralai();
      setMem(b.self, MEM.cycle, 3);
      b.girls.forEach((g, i) => { g.mp = mps[i]!; if (stopped.includes(i)) g.statuses.stop = { id: 'stop' } as never; });
      const command = b.poll(0, 0);
      return [b.id(command), b.targets(command), b.rng.calls.length];
    };
    expect(at([300, 100, 50])).toEqual([B('looming-glacier'), ['yuna'], 1]);
    expect(at([300, 100, 50], [0])).toEqual([B('looming-glacier'), ['rikku'], 1]);
    expect(at([300, 100, 50], [0, 1])).toEqual([B('looming-glacier'), ['paine'], 0]); // one candidate: nothing drawn
    expect(at([300, 100, 50], [0, 1, 2])).toEqual([B('looming-glacier'), [], 0]); // "nothing": the engine takes the nearest living girl
    expect(at([100, 100, 50])).toEqual([B('looming-glacier'), ['yuna'], 2]); // a tie for the highest: the discarded pick and the tie
  });

  it('step 5: Silence on the party at 20 MP or more, Absorb on the highest-MP girl below it; the counter goes back to 0', () => {
    const rich = baralai(12220, 20);
    setMem(rich.self, MEM.cycle, 4);
    expect([rich.id(rich.poll()), mem(rich.self, MEM.cycle)]).toEqual([B('silence'), 0]);
    const poor = baralai(12220, 19);
    setMem(poor.self, MEM.cycle, 4);
    poor.girls[0]!.mp = 5; poor.girls[1]!.mp = 6; poor.girls[2]!.mp = 90;
    const absorb = poor.poll(0);
    expect([poor.id(absorb), poor.targets(absorb)]).toEqual([B('absorb'), ['paine']]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Nooj
// ---------------------------------------------------------------------------------------------------------------------

describe('Nooj (m258): row D11, unchanged by the script', () => {
  it('Attack, Attack, Rippling Chroma on one girl, Attack, Greedy Aura on the party; Lightfall once at 2,999 or less without moving the cycle', () => {
    const b = bench(enemy('shade-nooj', 23800, { mp: 720 }), NOOJ);
    const got = [0, 1, 2, 3, 4].map((i) => { const c = b.poll(i % 3); return [b.id(c), b.targets(c)]; });
    expect(got.map((x) => x[0])).toEqual([N('attack'), N('attack'), N('rippling-chroma'), N('attack'), N('greedy-aura')]);
    expect(got[4]![1]).toEqual([]);
    b.rng.drain();
    b.self.hp = 3000;
    expect(b.id(b.poll(0))).toBe(N('attack'));
    b.self.hp = 2999;
    expect(b.id(b.poll())).toBe(N('lightfall'));
    expect(b.id(b.poll(0))).toBe(N('attack')); // the cycle resumes where it was
    expect(Array.from({ length: 12 }, () => { b.rng.drain(); return b.id(b.poll(0)); })).not.toContain(N('lightfall'));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The engine: results, the Triple Attack, Absorb
// ---------------------------------------------------------------------------------------------------------------------

describe('the resolver and the results Baralai and Ixion count (D3, D5, D7)', () => {
  const baralaiUnit = (): Ffx2Unit => {
    const u = aiUnit('shade-baralai', 'enemy', 12220, 0);
    u.level = 52;
    u.stats = { ...u.stats, str: 68, def: 0, mag: 67, mdef: 26, agi: 112, eva: 120, mp: 720, maxMp: 720 }; // a high Evasion: a two-hit command both lands and misses over the seeds
    u.mp = 720;
    return u;
  };
  const party = (): Ffx2Unit[] => ['yuna', 'rikku', 'paine'].map((id, i) => { const g = aiUnit(id, 'party', 5000, i); g.level = 40; return g; });

  it('Triple Attack lands one Chain Attack on each named girl, in the named order, and nothing at anyone else', () => {
    const b = baralaiUnit();
    const girls = party();
    const { ctx, events } = ctxFor([b, ...girls], 5);
    resolveAbility(ctx, b, ability('x2-den-baralai-triple-attack'), ['paine', 'yuna', 'paine']);
    const hits = events.filter((e) => e.type === 'damage') as Array<{ targetId: string; sourceId: string }>;
    expect(hits.map((h) => h.targetId)).toEqual(['paine', 'yuna', 'paine']);
    expect(hits.every((h) => h.sourceId === 'shade-baralai')).toBe(true);
    expect(girls[1]!.hp).toBe(5000); // Rikku untouched
    expect(events.filter((e) => e.type === 'miss')).toEqual([]); // Chain Attack never rolls to hit
  });

  it('Chain Attack and its two stages are the game\'s one row (0x4100): never rolls, physical, power 12, one hit', () => {
    for (const id of ['x2-den-baralai-triple-attack', 'x2-den-baralai-triple-attack-2', 'x2-den-baralai-triple-attack-3']) {
      expect(data.ABILITIES[id]!.ffx2Record).toMatchObject({ id: 0x4100, power: 12, hits: 1, accuracy: 0, formula: 0 });
    }
    expect(data.ABILITIES['x2-den-baralai-triple-attack']!.extra).toMatchObject({ sequenceTargets: true, sequence: ['x2-den-baralai-triple-attack-2', 'x2-den-baralai-triple-attack-3'] });
  });

  it('a landing hit is one result and a three-strike command that lands is three; a miss is one however many strikes it had', () => {
    const counts: number[] = [];
    for (let seed = 1; seed <= 24; seed++) {
      const b = baralaiUnit();
      const girl = aiUnit('rikku', 'party', 5000, 1);
      girl.level = 40;
      const { ctx, events } = ctxFor([b, girl], seed);
      resolveAbility(ctx, girl, ability('x2-logos-double-shot'), [b.id]); // 2 hits; accuracy byte 140
      const landed = events.filter((e) => e.type === 'damage').length;
      const missed = events.filter((e) => e.type === 'miss').length;
      const report = takeResults(b);
      expect(report?.count, `seed ${seed}`).toBe(landed + missed);
      expect(report?.lastAttackerId).toBe('rikku');
      counts.push(report?.count ?? 0);
    }
    expect(new Set(counts).size).toBeGreaterThan(1); // both a landed pair (2) and a miss (1) turned up
  });

  it('his own results, a stopped or sleeping monster and a party-side target are not counted (the reaction guard)', () => {
    const b = baralaiUnit();
    const girl = aiUnit('rikku', 'party', 5000, 1);
    const { ctx } = ctxFor([b, girl], 3);
    resolveAbility(ctx, b, ability('x2-den-baralai-regen'), []); // his own Regen: he is the attacker
    expect(takeResults(b)).toBeUndefined();
    b.statuses.stop = { id: 'stop' } as never;
    resolveAbility(ctx, girl, ability('x2-logos-double-shot'), [b.id]);
    expect(takeResults(b)).toBeUndefined();
    delete b.statuses.stop;
    resolveAbility(ctx, b, ability('x2-logos-double-shot'), [girl.id]);
    expect(takeResults(girl)).toBeUndefined(); // a girl is not an enemy
  });

  it('notifyEnemiesResults tells the script once and empties the tally, whether or not the script listens', () => {
    const b = baralaiUnit();
    b.enemy = { aiScriptId: BARALAI, formIndex: 0, forms: [], rewards: data.ENEMY_GROUPS_BY_ID['ffx2-den-baralai']!.enemies[0]!.rewards };
    const girl = aiUnit('yuna', 'party', 5000, 0);
    const { ctx } = ctxFor([b, girl], 3);
    const h = bench(b, BARALAI);
    resolveAbility(ctx, girl, ability('x2-logos-double-shot'), [b.id]);
    notifyEnemiesResults([b, girl], () => h.ctx);
    const first = mem(b, MEM.hits);
    expect(first).toBeGreaterThanOrEqual(1);
    notifyEnemiesResults([b, girl], () => h.ctx);
    expect(mem(b, MEM.hits)).toBe(first); // told once
    expect(b.aiMemory?.[MEM.lastAttacker]).toBe('yuna');
  });

  it('a Drill Shot he aims at himself does nothing: his record says he is immune to percentage-HP formulas (D4, the [M] of the note checked on the engine)', () => {
    const b = baralaiUnit();
    b.enemy = {
      aiScriptId: BARALAI, formIndex: 0, forms: [], rewards: data.ENEMY_GROUPS_BY_ID['ffx2-den-baralai']!.enemies[0]!.rewards,
      ffx2Record: data.ENEMY_GROUPS_BY_ID['ffx2-den-baralai']!.enemies[0]!.ffx2Record!,
    };
    b.hp = 9000;
    const { ctx, events } = ctxFor([b, ...party()], 3);
    resolveAbility(ctx, b, ability('x2-den-baralai-drill-shot'), [b.id]);
    expect(b.hp).toBe(9000);
    expect(events.filter((e) => e.type === 'damage' && (e as { amount: number }).amount > 0)).toEqual([]);
  });

  it('Absorb is the game\'s HP-and-MP row: 3/16 of the girl\'s current HP and MP into him (D7)', () => {
    const b = baralaiUnit();
    b.hp = 1000; b.mp = 100;
    const girl = aiUnit('rikku', 'party', 5000, 1);
    girl.hp = 4000; girl.mp = 800; girl.stats = { ...girl.stats, maxMp: 999 };
    const { ctx } = ctxFor([b, girl], 3);
    resolveAbility(ctx, b, ability('x2-den-baralai-absorb'), ['rikku']);
    expect(4000 - girl.hp).toBe(750); // 3/16 of 4,000: the percent formulas take no variance
    expect(800 - girl.mp).toBe(150); // 3/16 of 800
    expect([b.hp, b.mp]).toEqual([1750, 250]); // and both come to him
  });
});

describe('which shade moves roll to hit, and the classes of Absorb and Looming Glacier (H1, E4, D7; rows from W3)', () => {
  const user = aiUnit('probe', 'enemy');
  const formulaOf = (id: string): number => resolveCommand(data.ABILITIES[id]!, user).accuracyFormula;
  const rowOf = (id: string) => data.ABILITIES[id]!.ffx2Record!;

  it('only the plain Attacks roll to hit: Grinder, Mortar, Glint, Chain Attack, Drill Shot, Bullseye and every other special never do', () => {
    for (const id of [G('attack'), B('attack')]) expect(accuracyFormula(rowOf(id).flagsMisc), id).toBe(2); // the plain Attack: the monster own Accuracy
    expect(accuracyFormula(rowOf(N('attack')).flagsMisc)).toBe(1); // Nooj Attack (0x41e8) rolls on its own byte, 95
    for (const id of [G('grinder'), G('mortar'), G('bullseye'), B('glint'), B('triple-attack'), B('drill-shot'), B('looming-glacier'), N('lightfall'), N('greedy-aura')]) {
      expect(formulaOf(id), id).toBe(0);
    }
  });

  it('Drill Shot and Glint are physical (Protect halves them); Bullseye, Lightfall and Greedy Aura are untyped; Rippling Chroma is magical', () => {
    expect([rowOf(B('drill-shot')).flagsDamage & 3, rowOf(B('glint')).flagsDamage & 3]).toEqual([1, 1]);
    expect([G('bullseye'), N('lightfall'), N('greedy-aura')].map((id) => rowOf(id).flagsDamage & 3)).toEqual([0, 0, 0]);
    expect(rowOf(N('rippling-chroma')).flagsDamage & 3).toBe(2);
  });

  it('Looming Glacier is the MP-class row of the game (all of her maximum MP, then Stop); Absorb is HP-and-MP class with the absorb bit; Potion Plus heals 600', () => {
    expect(rowOf(B('looming-glacier'))).toMatchObject({ damageClass: 2, formula: 7, power: 16 });
    expect(rowOf(B('absorb'))).toMatchObject({ damageClass: 3, formula: 4, power: 3 });
    expect(rowOf(B('absorb')).flagsMisc & 0x100).toBe(0x100);
    expect(rowOf(G('potion-plus'))).toMatchObject({ formula: 5, power: 12 });
  });

  it('the steal bytes and Pilfer Gil figures are those of the rows (D12): 128 of 255 for all three shades, 300, 15,000 and 20,000 gil', () => {
    const e = (g: string) => data.ENEMY_GROUPS_BY_ID[g]!.enemies[0]!;
    expect([e('ffx2-den-baralai'), e('ffx2-den-gippal'), e('ffx2-den-nooj')].map((x) => [x.rewards.steal?.stealRate, x.rewards.stolenGil])).toEqual([[128, 300], [128, 15000], [128, 20000]]);
  });
});
