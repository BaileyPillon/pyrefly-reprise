/**
 * Chapter XIII — Paragon and Trema (FFX-2): the data and the AI, pinned to
 * `research/ffx2-trema.md` §3, §4 and §5 and to Bailey's picks on
 * `docs/plans/chapter-trema-review.md` (TR2 a, TR3 a, TR4 b, TR7, TR8 a). **Game case: FFX-2
 * only** [AGENTS.md rule 14]. Every claim is run against the shipped records [hard rule 3].
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../../src/battle/common/types.ts';
import { dressphereStats } from '../../../src/battle/ffx2/dressphere-stats.ts';
import { hitPercent } from '../../../src/battle/ffx2/hit.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { tremaScript } from '../../../src/battle/ffx2/ai/trema.ts';
import { paragonScript } from '../../../src/battle/ffx2/ai/paragon.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { paragon } from '../../../src/data/ffx2/enemies/paragon.ts';
import { trema } from '../../../src/data/ffx2/enemies/trema.ts';
import { board } from '../helpers/tremaUnits.ts';

const idOf = (c: Command | null): string | null => (c && 'id' in c ? (c as { id: string }).id : null);

describe('Lv 99 dressphere rows (TR-G1; research §5, [single source])', () => {
  const rows: Array<[string, number[]]> = [
    ['dark-knight', [5355, 338, 175, 109, 151, 105, 42, 105, 3, 11]],
    ['warrior', [4122, 168, 168, 56, 132, 13, 54, 103, 6, 13]],
    ['alchemist', [2553, 107, 125, 29, 52, 35, 58, 124, 4, 12]],
    ['white-mage', [2294, 350, 20, 154, 21, 194, 55, 103, 7, 12]],
    ['gun-mage', [2523, 288, 152, 149, 51, 97, 59, 127, 4, 11]],
    // MDef 48, the growth algorithm's, not the wiki's duplicated 58 (combat-core §5.1a).
    ['gunner', [2837, 123, 137, 73, 58, 48, 57, 131, 4, 24]],
  ];
  for (const [id, want] of rows) {
    it(`${id} at Lv 99 equals the table`, () => {
      const s = dressphereStats(id, 99);
      expect([s.hp, s.mp, s.str, s.mag, s.def, s.mdef, s.agi, s.acc, s.eva, s.luck]).toEqual(want);
    });
  }

  it('changes nothing at the levels the shipped builds use (Lv 20 to 50)', () => {
    expect(dressphereStats('dark-knight', 50)).toMatchObject({ hp: 2931, str: 116, def: 139 });
    expect(dressphereStats('white-mage', 46)).toMatchObject({ hp: 1244, mag: 102 });
    expect(dressphereStats('gunner', 23)).toMatchObject({ hp: 969 });
  });
});

describe('the stat blocks (research §3)', () => {
  it('Trema: Lv 99, HP 999,999, MP 999, 255 x4, Agi 129, Eva 99, Luck 26, Spellspring, every status immune', () => {
    expect(trema.level).toBe(99);
    expect(trema.stats).toMatchObject({ maxHp: 999999, maxMp: 999, str: 255, mag: 255, def: 255, mdef: 255, agi: 129, eva: 99, luck: 26 });
    expect(trema.autoStatuses).toEqual(['spellspring']);
    for (const s of ['ko', 'poison', 'slow', 'stop', 'str-down', 'def-down', 'reflect', 'doom']) {
      expect(trema.immunities[s as keyof typeof trema.immunities], s).toBe(255);
    }
    expect(trema.affinities.gravity).toBe('immune');
  });

  it('Paragon: Lv 99, HP 200,000, TR8 a (Mag 244 / Def 88 / MDef 88), the same list without Reflect', () => {
    expect(paragon.stats).toMatchObject({ maxHp: 200000, maxMp: 9999, str: 244, mag: 244, def: 88, mdef: 88, agi: 188, luck: 13 });
    expect(paragon.immunities.reflect ?? 0).toBe(0);
    expect(paragon.immunities.stop).toBe(255);
  });

  it('Meteor is magical (TR3 a), 12 hits of 1/8 max HP, free; Flare 54 MP, Ultima 90, Demi 10', () => {
    const a = data.ABILITIES;
    expect(a['trema-meteor']).toMatchObject({ damageType: 'magical', hits: 12, power: 2, formula: 'percent-total', mpCost: 0, targeting: 'random-enemy' });
    expect(a['trema-flare']?.mpCost).toBe(54);
    expect(a['trema-ultima']?.mpCost).toBe(90);
    expect(a['trema-demi']?.mpCost).toBe(10);
    expect(a['paragon-big-bang']?.power).toBe(250);
  });
});

describe('Darkness against Evasion 99 (TR-G2, TR9 b; run, not read)', () => {
  it('0 % with no Rabite\'s Foot, 91 % with one, 100 % while his chain window is open', () => {
    const b = board('trema');
    const yuna = b.unit('yuna');
    const t = b.unit('trema');
    const darkness = data.ABILITIES['x2-dark-knight-darkness']!;
    expect(yuna.stats.luck).toBe(111); // 11 + Rabite's Foot's 100
    expect(hitPercent(yuna, t, darkness)).toBe(91);
    const bare = { ...yuna, stats: { ...yuna.stats, luck: 11 } };
    expect(hitPercent(bare, t, darkness)).toBe(0);
    // A chained target cannot evade (resolve.ts checks cannotEvade before the roll): with no
    // Rabite's Foot (0 %), Darkness still lands on every seed while his window is open.
    for (let seed = 1; seed <= 20; seed++) {
      t.chainWindowTicks = 100;
      const before = t.hp;
      resolveAbility(b.resolveCtx(seed), bare, darkness, []);
      expect(t.hp, `seed ${seed}`).toBeLessThan(before);
    }
  });
});

describe("Trema's AI (research §4.2, [SinirothX])", () => {
  it('the basic roll weighs 1/2 Dying Star, 1/8 Demi, 1/8 Flare, 1/12 each Mist, Mire, Moon', () => {
    const b = board('trema');
    const counts = new Map<string, number>();
    const N = 24000;
    for (let i = 0; i < N; i++) {
      b.unit('trema').aiMemory = {};
      const id = idOf(tremaScript.decide(b.ctx('trema', i + 1)))!;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const share = (id: string) => (counts.get(id) ?? 0) / N;
    expect(share('trema-dying-star')).toBeCloseTo(1 / 2, 1);
    expect(share('trema-demi')).toBeCloseTo(1 / 8, 1);
    expect(share('trema-flare')).toBeCloseTo(1 / 8, 1);
    for (const id of ['trema-choking-mist', 'trema-beguiling-mire', 'trema-waning-moon']) expect(share(id)).toBeCloseTo(1 / 12, 1);
  });

  it('Dying Star is followed by Falling Leaf, then Thundering Wave, each with its own target', () => {
    const b = board('trema');
    const t = b.unit('trema');
    let seed = 1;
    while (idOf(tremaScript.decide(b.ctx('trema', seed))) !== 'trema-dying-star') {
      t.aiMemory = {};
      seed += 1;
    }
    expect(idOf(tremaScript.decide(b.ctx('trema', 99)))).toBe('trema-falling-leaf');
    expect(idOf(tremaScript.decide(b.ctx('trema', 98)))).toBe('trema-thundering-wave');
    expect(idOf(tremaScript.decide(b.ctx('trema', 97)))).not.toMatch(/falling-leaf|thundering-wave/);
  });

  it('Meteor below 1/2, Meteor below 1/4, Ultima below 1/6: strict "<", each exactly once', () => {
    const b = board('trema');
    const t = b.unit('trema');
    const next = () => idOf(tremaScript.decide(b.ctx('trema', 5)));
    t.hp = 500000; // 999,999 / 2 = 499,999.5: 500,000 is not below it
    expect(next()).not.toBe('trema-meteor');
    t.aiMemory = {};
    t.hp = 499999;
    expect(next()).toBe('trema-meteor');
    expect(next()).not.toBe('trema-meteor');
    t.hp = 249999;
    expect(next()).toBe('trema-meteor');
    expect(next()).not.toBe('trema-meteor');
    t.hp = 166666;
    expect(next()).toBe('trema-ultima');
    for (let i = 0; i < 20; i++) expect(next()).not.toMatch(/meteor|ultima/);
  });

  it('TR4 b: below a spell\'s MP he cannot cast it, Spellspring or not; Meteor needs none', () => {
    const b = board('trema');
    const t = b.unit('trema');
    expect(t.statuses.spellspring).toBeDefined();
    t.mp = 53;
    let flareSeen = false;
    for (let s = 1; s <= 400; s++) {
      t.aiMemory = { tremaChain: 0 };
      const id = idOf(tremaScript.decide(b.ctx('trema', s)));
      expect(id).not.toBe('trema-flare');
      if (id === null) flareSeen = true;
    }
    expect(flareSeen).toBe(true);
    expect(b.events.some((e) => e.type === 'message' && /lacks the MP for Flare/.test(String(e['text'])))).toBe(true);
    t.mp = 0;
    t.aiMemory = {};
    t.hp = 400000;
    expect(idOf(tremaScript.decide(b.ctx('trema', 1)))).toBe('trema-meteor');
  });
});

describe("Paragon's AI (research §4.1, [SinirothX]; TR7 normal form, TR12 b)", () => {
  it('alternates a 1/4 Normal Attack 1-4 turn with a 1/2 Normal Attack 5 / 1/2 Genesis turn', () => {
    const b = board('paragon');
    const odd = new Map<string, number>();
    const even = new Map<string, number>();
    for (let s = 1; s <= 4000; s++) {
      b.unit('paragon').aiMemory = {};
      const first = idOf(paragonScript.decide(b.ctx('paragon', s)))!;
      const second = idOf(paragonScript.decide(b.ctx('paragon', s + 7777)))!;
      odd.set(first, (odd.get(first) ?? 0) + 1);
      even.set(second, (even.get(second) ?? 0) + 1);
    }
    expect([...odd.keys()].sort()).toEqual(['paragon-attack-confuse', 'paragon-attack-itchy', 'paragon-attack-pierce', 'paragon-attack-poison']);
    for (const n of odd.values()) expect(n / 4000).toBeCloseTo(0.25, 1);
    expect([...even.keys()].sort()).toEqual(['paragon-attack-drain', 'paragon-genesis']);
    expect((even.get('paragon-genesis') ?? 0) / 4000).toBeCloseTo(0.5, 1);
  });

  it('counters an unmitigable hit with Big Bang, and nothing else; not when drained (wiki, International / HD)', () => {
    const b = board('paragon');
    const ctx = b.ctx('paragon');
    const yuna = b.unit('yuna');
    expect(idOf(paragonScript.counter!(ctx, yuna, { amount: 5000, attackClass: 'none' }))).toBe('paragon-big-bang');
    expect(paragonScript.counter!(ctx, yuna, { amount: 5000, attackClass: 'protect-reducible' })).toBeNull();
    expect(paragonScript.counter!(ctx, yuna, { amount: 5000, attackClass: 'shell-reducible' })).toBeNull();
    b.unit('paragon').mp = 0;
    expect(paragonScript.counter!(ctx, yuna, { amount: 5000, attackClass: 'none' })).toBeNull();
  });

  it('both scripts are registered by the ids the records carry', () => {
    expect(aiScriptFor(paragon.aiScriptId).id).toBe('paragon');
    expect(aiScriptFor(trema.aiScriptId).id).toBe('trema');
  });
});
