/**
 * Limit Levels 2 and 3, the hit chains, the Attack critical bonus, the Limit gauge at the new levels, the Hi-Potion, and
 * the three-member party on the FF7 kernel (hidden chapter 44; FF7 only). Sources: LE party §9, §10; core §3.3, §7.
 */

import { describe, expect, it } from 'vitest';
import { damageRange, buildCommands, fillLimitGauge, limitUnitsGained } from '../../src/battle/ff7/index.ts';
import type { Ff7Combatant } from '../../src/battle/common/types.ts';
import { abilityDef } from '../../src/battle/ff7/internal.ts';
import { performAbility } from '../../src/battle/ff7/perform.ts';
import { JENOVA, JL_REG, jlEngine, jlEnv, ofType } from './helpers/jenova.ts';

/** The physical chain's range for one hit of `power` from `who` on Jenova, optionally a critical. */
function physRange(env: ReturnType<typeof jlEnv>['env'], who: Ff7Combatant, power: number, critical = false): { min: number; max: number } {
  const t = env.state.combatants[JENOVA] as Ff7Combatant;
  return damageRange({
    formula: 'physical', power, user: { level: 38, att: who.ff7.derived.att, mat: who.ff7.derived.mat },
    target: { def: t.ff7.derived.def, mdf: t.ff7.derived.mdf, hp: t.hp, maxHp: t.stats.maxHp }, elements: [], affinities: t.ff7.enemy?.elements ?? {},
    modifiers: { critical, rowHalves: false },
  });
}

describe('Cloud Level 2: Blade Beam and Climhazzard (LE party §9.1)', () => {
  for (const [id, power] of [['blade-beam', 56], ['climhazzard', 70]] as const) {
    it(`${id}: one hit of ${power / 16}x Base, inside the chain's range on every seed (a critical doubles it)`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const { env, events, u } = jlEnv(seed);
        performAbility(env, u('cloud'), abilityDef(env, id), [u(JENOVA)]);
        const hits = ofType(events, 'damage');
        expect(hits).toHaveLength(1);
        const r = physRange(env, u('cloud'), power, hits[0]?.crit === true);
        expect(hits[0]?.amount).toBeGreaterThanOrEqual(r.min);
        expect(hits[0]?.amount).toBeLessThanOrEqual(r.max);
      }
    });
  }
  it('Blade Beam, with one enemy on screen, counts as a magical attack: it sets off her Reflect; Climhazzard does not', () => {
    for (const [limit, reflects] of [['blade-beam', true], ['climhazzard', false]] as const) {
      const e = jlEngine(4);
      (e.state().combatants.cloud as Ff7Combatant).ff7.limit!.gauge = 255;
      const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
      jenova.mp = 300;
      for (let i = 0; i < 4000; i++) {
        const d = e.nextDecision();
        if (d.kind === 'waiting') e.tick(d.nextEventMs);
        else if (d.kind === 'player-input') {
          if (d.actorId === 'cloud') {
            expect(d.commands.filter((c) => c.command.kind === 'limit').map((c) => c.label)).toEqual(['Blade Beam', 'Climhazzard']);
            break;
          }
          e.submit({ kind: 'defend', targets: [] });
        }
      }
      const events = e.submit({ kind: 'limit', id: limit, targets: [JENOVA] });
      expect(ofType(events, 'counter').some((c) => c.abilityId === 'jenova-reflect')).toBe(reflects);
    }
  });
});

describe('Barret Level 3: Satellite Beam and Angermax (LE party §9.2)', () => {
  it('Satellite Beam is 2 3/16x on every enemy and an automatic critical: every hit is a critical, in the critical range', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { env, events, u } = jlEnv(seed);
      performAbility(env, u('barret'), abilityDef(env, 'satellite-beam'), [u(JENOVA)]);
      const hit = ofType(events, 'damage')[0]!;
      expect(hit.crit).toBe(true);
      const r = physRange(env, u('barret'), 35, true);
      expect(hit.amount).toBeGreaterThanOrEqual(r.min);
      expect(hit.amount).toBeLessThanOrEqual(r.max);
    }
  });
  it('Angermax is 18 hits of 1/2x, numbered 1 to 18 of 18, each its own number', () => {
    const { env, events, u } = jlEnv(5);
    performAbility(env, u('barret'), abilityDef(env, 'angermax'), [u(JENOVA)]);
    const hits = ofType(events, 'damage');
    expect(hits).toHaveLength(18);
    expect(hits.map((h) => h.hitIndex)).toEqual(Array.from({ length: 18 }, (_, i) => i));
    expect(new Set(hits.map((h) => h.hitCount))).toEqual(new Set([18]));
    expect(u(JENOVA).hp).toBe(10_000 - hits.reduce((s, h) => s + h.amount, 0));
  });
  it('a chain stops when its mark falls: later hits are not thrown at a corpse', () => {
    const { env, events, u } = jlEnv(5);
    u(JENOVA).hp = 300;
    const out = performAbility(env, u('barret'), abilityDef(env, 'angermax'), [u(JENOVA)]);
    const hits = ofType(events, 'damage');
    expect(hits.length).toBeLessThan(18);
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(out).toEqual([{ targetId: JENOVA, hit: true, killed: true }]);
    expect(ofType(events, 'ko')).toHaveLength(1);
  });
});

describe('Tifa Level 3: the chain, Beat Rush to Dolphin Blow, every reel a Hit (LE party §9.3; jl pick J7)', () => {
  it('five hits of 1 1/4x, 1 3/8x, 1 1/2x, 1 5/8x and 1 3/4x, each in its own range', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { env, events, u } = jlEnv(seed);
      performAbility(env, u('tifa'), abilityDef(env, 'dolphin-blow'), [u(JENOVA)]);
      const hits = ofType(events, 'damage');
      expect(hits).toHaveLength(5);
      [20, 22, 24, 26, 28].forEach((power, i) => {
        const r = physRange(env, u('tifa'), power, hits[i]?.crit === true);
        expect(hits[i]?.amount, `seed ${seed} hit ${i + 1}`).toBeGreaterThanOrEqual(r.min);
        expect(hits[i]?.amount, `seed ${seed} hit ${i + 1}`).toBeLessThanOrEqual(r.max);
        expect(hits[i]?.hitIndex).toBe(i);
        expect(hits[i]?.hitCount).toBe(5);
      });
    }
  });
});

describe('the Diamond Knuckle\'s +2% critical applies to the Attack command (core §3.3; LE party §3.2)', () => {
  it('Tifa crits about twice as often with it as without (4% against 2% at Lck 23, Lv 38 against Lv 50)', () => {
    const count = (bonus: number): number => {
      let crits = 0;
      for (let seed = 1; seed <= 3000; seed++) {
        const { env, events, u } = jlEnv(seed);
        env.rt.weapons['tifa'] = { ...env.rt.weapons['tifa']!, critBonus: bonus };
        performAbility(env, u('tifa'), abilityDef(env, 'attack'), [u(JENOVA)]);
        if (ofType(events, 'damage')[0]?.crit) crits++;
      }
      return crits;
    };
    const withBonus = count(2);
    const without = count(0);
    expect(withBonus).toBeGreaterThan(without * 1.4);
    expect(without).toBeGreaterThan(30);
    expect(withBonus / 3000).toBeGreaterThan(0.025);
    expect(withBonus / 3000).toBeLessThan(0.06);
  });
});

describe('the Limit gauge at the new levels (core §7.1; LE formulas 8.2)', () => {
  it('Cloud at Level 2 fills by LNum 324, Tifa at Level 3 by 509, Barret at Level 3 by 374', () => {
    for (const [id, lnum] of [['cloud', 324], ['tifa', 509], ['barret', 374]] as const) {
      const { env, events, u } = jlEnv(6);
      const who = u(id);
      expect(JL_REG.limits[id]?.lnum[who.ff7.limit!.level - 1]).toBe(lnum);
      performAbility(env, u(JENOVA), abilityDef(env, 'blue-flame'), [who]);
      const taken = who.stats.maxHp - who.hp;
      const gauge = ofType(events, 'limit-gauge').find((g) => g.actorId === id);
      expect(gauge?.value).toBe(limitUnitsGained(taken, who.stats.maxHp, lnum));
      expect(gauge?.level).toBe(who.ff7.limit!.level);
      expect(fillLimitGauge(0, taken, who.stats.maxHp, lnum, true)).toBe(gauge?.value);
    }
  });
});

describe('the Hi-Potion and the bag (LE party §7)', () => {
  it('a Hi-Potion restores 500 HP exactly (Fixed, 25 x 20) and a Potion 100; both never miss', () => {
    for (const [effect, amount] of [['item:hi-potion', 500], ['item:potion', 100]] as const) {
      const { env, events, u } = jlEnv(2);
      u('cloud').hp = 600;
      performAbility(env, u('tifa'), abilityDef(env, effect), [u('cloud')]);
      expect(u('cloud').hp).toBe(600 + amount);
      expect(ofType(events, 'damage')[0]?.amount).toBe(-amount);
    }
  });
});

describe('three members on the FF7 kernel', () => {
  it('Cloud\'s command window: Attack, ten spells, three item stacks, Change, Defend; Phoenix Down aims only at the fallen', () => {
    const e = jlEngine(2);
    const { env } = jlEnv(2);
    const cloud = e.state().combatants.cloud as Ff7Combatant;
    const rows = buildCommands(env, cloud);
    expect(rows.filter((r) => r.category === 'magic').map((r) => r.label)).toEqual(['Cure', 'Cure2', 'Regen', 'Bolt', 'Bolt2', 'Bolt3', 'Quake', 'Quake2', 'Barrier', 'MBarrier']);
    expect(rows.filter((r) => r.category === 'item').map((r) => r.label)).toEqual(['Potion x20', 'Hi-Potion x15', 'Phoenix Down x10']);
    expect(rows.find((r) => r.command.kind === 'item' && r.command.id === 'phoenix-down')?.enabled).toBe(false); // nobody is down: 'No target'
    (env.state.combatants.tifa as Ff7Combatant).alive = false;
    const again = buildCommands(env, cloud);
    expect(again.find((r) => r.command.kind === 'item' && r.command.id === 'phoenix-down')?.validTargets).toEqual(['tifa']);
    expect(again.find((r) => r.command.kind === 'ability' && r.command.id === 'cure2')?.validTargets).toEqual(['cloud', 'barret']);
  });
  it('the three Turn Timers fill and queue in the order they filled; a fallen member\'s menu is dropped', () => {
    const e = jlEngine(2, { atbMode: 'active' });
    (e.state().combatants[JENOVA] as Ff7Combatant).mp = 0;
    const order: string[] = [];
    for (let i = 0; i < 3000 && e.inputQueue().length < 3; i++) {
      e.tick(34, { throughInput: true });
      for (const id of e.inputQueue()) if (!order.includes(id)) order.push(id);
    }
    expect(e.inputQueue()).toHaveLength(3);
    expect([...e.inputQueue()]).toEqual(order); // first filled first
    const first = order[0]!;
    expect(e.inputValid(first)).toBe(true);
    (e.state().combatants[order[1]!] as Ff7Combatant).alive = false;
    expect(e.inputValid(order[1]!)).toBe(false);
  });
  it('Change swaps Barret to the front row and back again, each a spent turn', () => {
    const e = jlEngine(3, { atbMode: 'active' });
    (e.state().combatants[JENOVA] as Ff7Combatant).mp = 0;
    const barret = e.state().combatants.barret as Ff7Combatant;
    expect(barret.ff7.row).toBe('back');
    for (const want of ['front', 'back'] as const) {
      for (let i = 0; i < 4000; i++) {
        const d = e.nextDecision();
        if (d.kind === 'waiting') e.tick(d.nextEventMs);
        else if (d.kind === 'player-input') {
          if (d.actorId === 'barret') break;
          e.submit({ kind: 'defend', targets: [] }); // the others pass their turns
        }
      }
      e.submit({ kind: 'row-change', targets: [] });
      expect(barret.ff7.row).toBe(want);
      expect(barret.ff7.atb.turnTimer).toBe(0);
    }
  });
  it('Barret\'s Heavy Vulcan is Long Range: from the back row his Attack is not halved', () => {
    const { env, events, u } = jlEnv(3);
    expect(u('barret').ff7.row).toBe('back');
    performAbility(env, u('barret'), abilityDef(env, 'attack'), [u(JENOVA)]);
    const hit = ofType(events, 'damage')[0]!;
    const r = physRange(env, u('barret'), 16, hit.crit === true);
    expect(hit.amount).toBeGreaterThanOrEqual(r.min);
    expect(hit.amount).toBeLessThanOrEqual(r.max);
    expect(r.min).toBeGreaterThan(300); // halved from the back row it would be about 200
  });
});
