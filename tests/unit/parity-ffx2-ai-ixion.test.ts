/**
 * **Re-parity AI lane C, Ixion at Djose** (Chapter XVI; **FFX-2 only**): the decision table of
 * `research/re-ffx2-ai-leblanc-den-ixion.md` section 5 (rows I1 to I5 of section 8), walked on the real script with raw
 * 16-bit rolls.
 *
 * Reproduced from the note: the no-hits timeline (AC after polls 3, 6, 9, 12 and 15 is 20, 40, 60, 80 and 100; the 16th
 * poll is Recharge and the 17th Thor's Hammer), the closed form `AC after n polls with r results = 5n + 5 floor(n / 3) +
 * 5r`, the cycle that Recharge and the Hammer leave alone, the 3 to 1 Attack-to-Thundara split over the 65,536 values, and
 * the reaction entry that adds 5 per result another character applies to him (and nothing for his own Recharge).
 */

import { describe, expect, it, vi } from 'vitest';

// Some tests walk all 65,536 roll values; on a loaded machine they need more than the default 5 seconds.
vi.setConfig({ testTimeout: 60_000 });
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { AC, acOf } from '../../src/battle/ffx2/ai/fallen-aeons.ts';
import { IXION_HAMMER_NEXT, IXION_RECHARGE_TRIGGER, IXION_STEP } from '../../src/battle/ffx2/ai/ixion.ts';
import { mem, setMem } from '../../src/battle/ffx2/internal.ts';
import { takeResults } from '../../src/battle/ffx2/results-tally.ts';
import { resolveAbility } from '../../src/battle/ffx2/resolve.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { ability, ctxFor } from './helpers/fallenAeonsUnits.ts';
import { bench, enemy, type Bench } from './helpers/ffx2ScriptRig.ts';

const ATTACK = 'x2-ixion-attack';
const THUNDARA = 'x2-ixion-thundara';
const AEROSPARK = 'x2-ixion-aerospark';
const RECHARGE = 'x2-ixion-recharge';
const HAMMER = 'x2-ixion-thors-hammer';

const ixion = (): Bench => bench(enemy('x2-ixion', 12380, { mp: 9999 }), 'x2-ixion');

describe('Ixion (m166): rows I1 to I5', () => {
  it('with no hits taken: AC is 20, 40, 60, 80, 100 after polls 3, 6, 9, 12, 15; Recharge on the 16th poll, Thor\'s Hammer on the 17th (the note\'s timeline)', () => {
    const b = ixion();
    const ac: number[] = [];
    const picks: Array<string | null> = [];
    for (let n = 1; n <= 17; n++) {
      b.rng.drain();
      picks.push(b.id(b.poll(1, 0))); // `1 % 4`: never Thundara; the girl: index 0
      ac.push(acOf(b.self));
    }
    expect([2, 5, 8, 11, 14].map((i) => picks[i])).toEqual([AEROSPARK, AEROSPARK, AEROSPARK, AEROSPARK, AEROSPARK]);
    expect([2, 5, 8, 11, 14].map((i) => ac[i])).toEqual([20, 40, 60, 80, 100]);
    expect(picks[15]).toBe(RECHARGE);
    expect(picks[16]).toBe(HAMMER);
    expect(ac[16]).toBe(0);
    expect(b.events.filter((e) => (e as { name?: string }).name === IXION_RECHARGE_TRIGGER)).toHaveLength(1);
  });

  it('AC after n polls with r results received is 5n + 5 floor(n / 3) + 5r (the note\'s closed form), until it reaches 100', () => {
    for (const results of [0, 1, 4, 9]) {
      const b = ixion();
      const script = aiScriptFor('x2-ixion');
      script.onResults!(b.ctx, { count: results, lastAttackerId: 'yuna' });
      for (let n = 1; n <= 40; n++) {
        const before = acOf(b.self);
        if (before >= 100) break;
        b.rng.drain();
        b.poll(1, 0);
        expect(acOf(b.self), `n=${n} r=${results}`).toBe(5 * n + 5 * Math.floor(n / 3) + 5 * results);
      }
    }
  });

  it('Recharge and the Hammer leave the cycle counter alone, so the cycle carries on from where it was (I2)', () => {
    const b = ixion();
    setMem(b.self, IXION_STEP, 1); // the next poll takes the counter to 2: an Attack or Thundara
    setMem(b.self, AC, 100);
    expect(b.id(b.poll())).toBe(RECHARGE);
    expect(mem(b.self, IXION_STEP)).toBe(1);
    expect(b.id(b.poll())).toBe(HAMMER);
    expect([mem(b.self, AC), mem(b.self, IXION_HAMMER_NEXT), mem(b.self, IXION_STEP)]).toEqual([0, 0, 1]);
    expect(b.id(b.poll(1, 0))).toBe(ATTACK); // counter 2: not step 1, as the earlier restart had it
    expect(b.id(b.poll(0))).toBe(AEROSPARK); // counter 3
  });

  it('the AC test comes first and reads the value before the poll\'s own gain: 95 plus a poll\'s 5 is read next poll (I1)', () => {
    const b = ixion();
    setMem(b.self, AC, 95);
    expect(b.id(b.poll(1, 0))).toBe(ATTACK); // 95 < 100 : an ordinary poll, which takes AC to 100
    expect(acOf(b.self)).toBe(100);
    expect(b.id(b.poll())).toBe(RECHARGE);
  });

  it('`random() % 4`: 0 Thundara on the party, else an Attack on a girl (3 to 1); over the 65,536 values 16,384 Thundara and 49,152 Attack (I3)', () => {
    const tally: Record<string, number> = {};
    const b = ixion();
    for (let v = 0; v <= 0xffff; v++) {
      setMem(b.self, IXION_STEP, 0);
      setMem(b.self, AC, 0);
      b.rng.drain();
      const id = b.id(b.poll(v, 0))!;
      tally[id] = (tally[id] ?? 0) + 1;
    }
    expect(tally).toEqual({ [THUNDARA]: 16384, [ATTACK]: 49152 });
    const t = ixion();
    expect([t.id(t.poll(8)), t.targets(t.poll(8))]).toEqual([THUNDARA, []]); // 8 % 4 = 0
  });

  it('Attack and Aerospark pick a living girl; one girl left needs no draw; the Hammer and Thundara aim at the party (I4)', () => {
    const b = ixion();
    b.girls[0]!.alive = false;
    const attack = b.poll(1, 0);
    expect([b.id(attack), b.rng.calls]).toEqual([ATTACK, [[0, 0xffff], [0, 1]]]); // the roll, then a pick over Rikku and Paine
    expect(b.targets(attack)).toEqual(['rikku']);
    setMem(b.self, IXION_STEP, 2);
    b.rng.calls.length = 0;
    b.rng.drain();
    const spark = b.poll(1);
    expect([b.id(spark), b.targets(spark), b.rng.calls]).toEqual([AEROSPARK, ['paine'], [[0, 1]]]);
    setMem(b.self, AC, 100);
    setMem(b.self, IXION_HAMMER_NEXT, 1);
    const hammer = b.poll();
    expect([b.id(hammer), b.targets(hammer)]).toEqual([HAMMER, []]);
  });

  it('the reaction entry: +5 per result another character applies, none for Recharge, the Hammer or a tick; hits between Recharge and the Hammer are lost with the reset (I1)', () => {
    const b = ixion();
    const script = aiScriptFor('x2-ixion');
    script.onResults!(b.ctx, { count: 3, lastAttackerId: 'rikku' });
    expect(acOf(b.self)).toBe(15);
    setMem(b.self, AC, 100);
    expect(b.id(b.poll())).toBe(RECHARGE);
    expect(acOf(b.self)).toBe(100); // Recharge adds nothing
    script.onResults!(b.ctx, { count: 2, lastAttackerId: 'yuna' });
    expect(acOf(b.self)).toBe(110);
    expect(b.id(b.poll())).toBe(HAMMER);
    expect(acOf(b.self)).toBe(0); // the 10 taken in between are gone
    script.onResults!(b.ctx, { count: 1, lastAttackerId: 'paine' });
    expect(acOf(b.self)).toBe(5); // hits after the Hammer's poll count towards the next cycle
  });
});

describe('the results Ixion counts, in the real resolver (I1)', () => {
  const target = () => {
    const u = aiUnit('x2-ixion', 'enemy', 12380, 0);
    u.level = 28;
    u.stats = { ...u.stats, str: 62, mag: 21, def: 106, mdef: 82, eva: 120 }; // a high Evasion, so a two-hit command both lands and misses over the seeds
    return u;
  };
  const girl = () => {
    const g = aiUnit('rikku', 'party', 5000, 1);
    g.level = 40;
    return g;
  };

  it('a two-hit command that lands is two results (10), a command that misses is one (5), whatever its hit count', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const ix = target();
      const { ctx, events } = ctxFor([ix, girl()], seed);
      resolveAbility(ctx, ctx.units[1]!, ability('x2-logos-double-shot'), [ix.id]); // a two-hit command, accuracy byte 140
      const landed = events.filter((e) => e.type === 'damage').length;
      const missed = events.filter((e) => e.type === 'miss').length;
      const report = takeResults(ix);
      expect(report?.count, `seed ${seed}`).toBe(landed + missed);
      expect([landed, missed]).not.toEqual([1, 1]);
      seen.add(report?.count ?? 0);
    }
    expect([...seen].sort()).toEqual([1, 2]);
  });

  it('a status move and an item count too; his own Recharge and a Regen-style self cast do not', () => {
    const ix = target();
    const g = girl();
    const { ctx } = ctxFor([ix, g], 4);
    resolveAbility(ctx, g, ability('x2-den-baralai-silence'), [ix.id]); // a status-only command on him: immune, still a result
    expect(takeResults(ix)?.count).toBe(1);
    resolveAbility(ctx, ix, ability(RECHARGE), [ix.id]);
    expect(takeResults(ix)).toBeUndefined();
  });

  it('the script\'s old per-action hooks are gone: aiming at him without a result adds nothing', () => {
    const script = aiScriptFor('x2-ixion');
    expect(script.onTargeted).toBeUndefined();
    expect(script.onDamaged).toBeUndefined();
    expect(script.onResults).toBeDefined();
  });
});

describe('the rows and records of Ixion (I5 and the rows W3 attached)', () => {
  it('Aerospark is 10/16 of current HP with no damage type, Thor Hammer power 30 magic without an element, Recharge 200 HP and MP; steal 128, Pilfer Gil 3,000', async () => {
    const data = await import('../../src/data/ffx2/index.ts');
    const row = (id: string) => data.ABILITIES[id]!.ffx2Record!;
    expect(row(AEROSPARK)).toMatchObject({ damageClass: 1, formula: 4, power: 10 });
    expect(row(AEROSPARK).flagsDamage & 3).toBe(0);
    expect(row(HAMMER)).toMatchObject({ formula: 2, power: 30, element: 0 });
    expect(row(RECHARGE)).toMatchObject({ damageClass: 3, formula: 5, power: 4 });
    const e = data.ENEMY_GROUPS_BY_ID['ffx2-djose-ixion']!.enemies[0]!;
    expect([e.rewards.steal?.stealRate, e.rewards.stolenGil, e.stats.acc]).toEqual([128, 3000, 95]);
  });
});
