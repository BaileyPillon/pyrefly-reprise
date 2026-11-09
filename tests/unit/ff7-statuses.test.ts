/**
 * The FF7 status layer and the Reflect bounce (hidden chapter 44, Jenova LIFE; FF7 only): Reflect, Barrier, MBarrier
 * and Regen on the V-Timer, the damage halving, the bounce's target, recompute, cap and the Water-absorb heal, and the
 * absence test (a fight that never applies a status never grows one).
 */

import { describe, expect, it } from 'vitest';
import { damageRange, FF7_POLICIES, runFf7Battle } from '../../src/battle/ff7/index.ts';
import type { Ff7Combatant } from '../../src/battle/common/types.ts';
import { ticksToMs } from '../../src/battle/ff7/clock.ts';
import { vTimerIncrease } from '../../src/battle/ff7/atb.ts';
import { abilityDef } from '../../src/battle/ff7/internal.ts';
import { knockOut, performAbility } from '../../src/battle/ff7/perform.ts';
import { REFLECT_MAX_BOUNCES } from '../../src/battle/ff7/reflect.ts';
import {
  applyStatus, hasStatus, removeStatus, statusShare, tickStatuses, ticksToNextStatusEvent, TIMED_STATUS_UNITS, V_UNIT,
} from '../../src/battle/ff7/statuses.ts';
import { gsSetup, REG as GS_REG } from './helpers/ff7.ts';
import { JENOVA, jlEngine, jlEnv, ofType } from './helpers/jenova.ts';

const V = vTimerIncrease(128); // 182 V-Timer points per tick at the default Battle Speed

describe('statuses: the V-Timer clock (core §2.2; LE formulas 1.9, 7.2)', () => {
  it('Barrier, MBarrier and Regen last 127 V-Units; Reflect has no end', () => {
    const { u } = jlEnv();
    const c = u('cloud');
    for (const id of ['barrier', 'mbarrier', 'regen'] as const) {
      expect(applyStatus(c, id)).toBe(true);
      expect(c.ff7.status?.[id]?.until).toBe(TIMED_STATUS_UNITS * V_UNIT);
      expect(c.ff7.status?.[id]?.span).toBe(127 * 8192);
    }
    expect(applyStatus(c, 'reflect')).toBe(true);
    expect(c.ff7.status?.reflect).toEqual({ until: null, span: null });
    expect(TIMED_STATUS_UNITS).toBe(127);
    expect(V_UNIT).toBe(8192);
  });

  it('ends on the exact tick: on at 5,716, off at 5,717 (182 points per tick)', () => {
    const { env, u } = jlEnv();
    const c = u('cloud');
    applyStatus(c, 'barrier');
    expect(ticksToNextStatusEvent([c], V)).toBe(Math.ceil((127 * 8192) / V)); // 5,717
    c.ff7.atb.vTimer += V * 5716;
    tickStatuses(env, [c]);
    expect(hasStatus(c, 'barrier')).toBe(true);
    c.ff7.atb.vTimer += V;
    tickStatuses(env, [c]);
    expect(hasStatus(c, 'barrier')).toBe(false);
    expect(ticksToNextStatusEvent([c], V)).toBe(Number.POSITIVE_INFINITY);
  });

  it('a recast starts the timer again; removeStatus takes one off and leaves the others', () => {
    const { u } = jlEnv();
    const c = u('cloud');
    applyStatus(c, 'barrier');
    applyStatus(c, 'mbarrier');
    c.ff7.atb.vTimer = 100_000;
    applyStatus(c, 'barrier');
    expect(c.ff7.status?.barrier?.until).toBe(100_000 + 127 * 8192);
    expect(statusShare(c, 'barrier')).toBe(1);
    expect(statusShare(c, 'mbarrier')).toBeLessThan(1);
    removeStatus(c, 'barrier');
    expect(hasStatus(c, 'barrier')).toBe(false);
    expect(hasStatus(c, 'mbarrier')).toBe(true);
  });

  it('a KO takes every status off (LE formulas 7.2: Death removes them)', () => {
    const { env, u } = jlEnv();
    const c = u('cloud');
    for (const id of ['reflect', 'barrier', 'mbarrier', 'regen'] as const) applyStatus(c, id);
    knockOut(env, c, JENOVA);
    expect(c.ff7.status).toBeUndefined();
    expect(applyStatus(c, 'barrier')).toBe(false); // a KO'd fighter takes none
  });

  it('Jenova resists none of the four (the immune list has no Reflect, Barrier, MBarrier or Regen)', () => {
    const { u } = jlEnv();
    expect(applyStatus(u(JENOVA), 'reflect')).toBe(true);
  });

  it('through the engine: Barrier ends on tick 5,717 of the clock, and Regen heals [MaxHP / 32] per 4 V-Units, 31 times', () => {
    const e = jlEngine(7, { atbMode: 'active' }); // Active has no grace pause, so a tick of the log is a tick of the V-Timer
    const st = e.state();
    const cloud = st.combatants.cloud as Ff7Combatant;
    (st.combatants[JENOVA] as Ff7Combatant).mp = 0; // she cannot pay for anything: the clock runs undisturbed
    cloud.hp = 50;
    applyStatus(cloud, 'barrier');
    applyStatus(cloud, 'regen');
    const t0 = st.ticks;
    let gone: number | null = null;
    const heals: number[] = [];
    while (st.ticks - t0 < 6200 && !st.result) {
      const events = e.tick(ticksToMs(1), { throughInput: true });
      for (const ev of events) if (ev.type === 'heal') heals.push(st.ticks - t0);
      if (gone === null && !hasStatus(cloud, 'barrier')) gone = st.ticks - t0;
    }
    // The step is bounded to land on the tick; the one-tick calls of this loop sometimes carry a second tick, so the first look is 0 or 1 late.
    expect(gone).toBeGreaterThanOrEqual(5717);
    expect(gone).toBeLessThanOrEqual(5718);
    expect(heals).toHaveLength(31); // 127 V-Units hold 31 whole 4-unit ticks
    expect(heals[0]).toBeGreaterThanOrEqual(Math.ceil((4 * 8192) / V)); // 181
    expect(heals[0]).toBeLessThanOrEqual(Math.ceil((4 * 8192) / V) + 1);
    expect(cloud.hp).toBe(50 + 31 * Math.trunc(cloud.stats.maxHp / 32));
    expect(hasStatus(cloud, 'regen')).toBe(false);
  });

  it('absence: a Guard Scorpion battle never creates a status on anyone', () => {
    for (const seed of [1, 2, 3]) {
      const run = runFf7Battle({ setup: gsSetup(seed), registry: GS_REG, policy: FF7_POLICIES.sensible });
      for (const c of Object.values(run.state.combatants)) expect((c as { ff7: { status?: unknown } }).ff7.status).toBeUndefined();
    }
  });
});

describe('Barrier and MBarrier halve what they should (core §4.5 step 9)', () => {
  /** Blue Light on `target` with the given statuses: the event amount against the chain's own range. */
  function blueLight(statuses: Array<'barrier' | 'mbarrier'>, seed = 4): { amount: number; plain: { min: number; max: number }; halved: { min: number; max: number } } {
    const { env, events, u } = jlEnv(seed);
    const cloud = u('cloud');
    for (const s of statuses) applyStatus(cloud, s);
    const ab = abilityDef(env, 'blue-light');
    performAbility(env, u(JENOVA), ab, [cloud]);
    const base = {
      formula: 'magical' as const, power: ab.power, user: { level: 50, att: 128, mat: 40 }, target: { def: cloud.ff7.derived.def, mdf: cloud.ff7.derived.mdf, hp: cloud.stats.maxHp, maxHp: cloud.stats.maxHp },
      elements: ['water' as const, 'shout' as const], affinities: {},
    };
    return {
      amount: ofType(events, 'damage')[0]?.amount ?? -1,
      plain: damageRange(base),
      halved: damageRange({ ...base, modifiers: { targetMBarrier: true } }),
    };
  }

  it('MBarrier halves a magical hit; Barrier does not', () => {
    const withMb = blueLight(['mbarrier']);
    expect(withMb.amount).toBeGreaterThanOrEqual(withMb.halved.min);
    expect(withMb.amount).toBeLessThanOrEqual(withMb.halved.max);
    expect(withMb.halved.max).toBeLessThan(withMb.plain.min);
    const withB = blueLight(['barrier']);
    expect(withB.amount).toBeGreaterThanOrEqual(withB.plain.min);
    expect(withB.amount).toBeLessThanOrEqual(withB.plain.max);
  });

  it('Barrier halves a physical hit (Tifa strikes Cloud through the Attack formula) and MBarrier does not', () => {
    for (const [status, halves] of [['barrier', true], ['mbarrier', false]] as const) {
      const { env, events, u } = jlEnv(5);
      const cloud = u('cloud');
      applyStatus(cloud, status);
      // A physical hit at Cloud from the boss's side: the Guard Scorpion's Rifle is not in this registry, so use Tifa's Attack on Cloud.
      performAbility(env, u('tifa'), abilityDef(env, 'attack'), [cloud]);
      const amount = ofType(events, 'damage')[0]?.amount ?? -1;
      const bare = jlEnv(5);
      performAbility(bare.env, bare.u('tifa'), abilityDef(bare.env, 'attack'), [bare.u('cloud')]);
      const plain = ofType(bare.events, 'damage')[0]?.amount ?? -1;
      // Same seed, same draws: the halved hit is the plain one cut in two (integer halving of the same pre-variance value).
      if (halves) expect(amount).toBeLessThan(plain);
      else expect(amount).toBe(plain);
    }
  });

  it('MBarrier halves Cure as well (core §4.5 step 9: Physical, Magical, Cure)', () => {
    const plainRun = jlEnv(6);
    plainRun.u('cloud').hp = 100;
    performAbility(plainRun.env, plainRun.u('tifa'), abilityDef(plainRun.env, 'cure2'), [plainRun.u('cloud')]);
    const halvedRun = jlEnv(6);
    halvedRun.u('cloud').hp = 100;
    applyStatus(halvedRun.u('cloud'), 'mbarrier');
    performAbility(halvedRun.env, halvedRun.u('tifa'), abilityDef(halvedRun.env, 'cure2'), [halvedRun.u('cloud')]);
    const plain = -(ofType(plainRun.events, 'damage')[0]?.amount ?? 0);
    const halved = -(ofType(halvedRun.events, 'damage')[0]?.amount ?? 0);
    expect(plain).toBeGreaterThan(1000);
    expect(halved).toBeLessThan(plain * 0.6);
    expect(halved).toBeGreaterThan(plain * 0.4);
  });
});

describe('Reflect: the bounce (LE formulas 6.6; chapter 44 note §6)', () => {
  it('a reflectable spell aimed at a Reflect holder lands on its caster, recomputed against the caster, an automatic hit', () => {
    const { env, events, u } = jlEnv(9);
    const jenova = u(JENOVA);
    const cloud = u('cloud');
    applyStatus(jenova, 'reflect');
    const hpBefore = jenova.hp;
    const out = performAbility(env, cloud, abilityDef(env, 'bolt2'), [jenova]);
    expect(jenova.hp).toBe(hpBefore);
    expect(out).toEqual([{ targetId: 'cloud', hit: true, killed: false }]);
    const hits = ofType(events, 'damage');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.targetId).toBe('cloud');
    expect(hits[0]?.sourceId).toBe(JENOVA); // the apparent source of the bounce is the holder
    const range = damageRange({
      formula: 'magical', power: 20, user: { level: 38, att: cloud.ff7.derived.att, mat: cloud.ff7.derived.mat },
      target: { def: cloud.ff7.derived.def, mdf: cloud.ff7.derived.mdf, hp: cloud.stats.maxHp, maxHp: cloud.stats.maxHp }, elements: ['lightning'], affinities: {},
    });
    expect(hits[0]?.amount).toBeGreaterThanOrEqual(range.min);
    expect(hits[0]?.amount).toBeLessThanOrEqual(range.max);
    expect(ofType(events, 'miss')).toHaveLength(0);
  });

  it('an action that is not reflectable lands on the holder as aimed (Attack; Reflect itself)', () => {
    const { env, events, u } = jlEnv(9);
    const jenova = u(JENOVA);
    applyStatus(jenova, 'reflect');
    performAbility(env, u('tifa'), abilityDef(env, 'attack'), [jenova]);
    expect(ofType(events, 'damage')[0]?.targetId).toBe(JENOVA);
    expect(abilityDef(env, 'jenova-reflect').reflectable).toBe(false);
  });

  it('Jenova\'s Aqualung turned by a party Reflect lands on her, and her Water absorb heals her', () => {
    const { env, events, u } = jlEnv(11);
    const jenova = u(JENOVA);
    jenova.hp = 5000;
    applyStatus(u('tifa'), 'reflect');
    performAbility(env, jenova, abilityDef(env, 'aqualung'), [u('cloud'), u('tifa'), u('barret')]);
    const hits = ofType(events, 'damage');
    expect(hits.map((h) => h.targetId).sort()).toEqual(['barret', 'cloud', JENOVA].sort());
    const healed = hits.find((h) => h.targetId === JENOVA);
    expect(healed?.amount).toBeLessThan(0); // healing is negative
    expect(healed?.affinity).toBe('absorb');
    expect(healed?.sourceId).toBe('tifa');
    expect(jenova.hp).toBeGreaterThan(5000);
    expect(u('tifa').hp).toBe(u('tifa').stats.maxHp); // Tifa took nothing
  });

  it('a spell an ally cast at a Reflect holder turns on a random living opponent of the holder (one draw)', () => {
    const { env, events, u } = jlEnv(12);
    applyStatus(u('tifa'), 'reflect');
    u(JENOVA).hp = 4000;
    performAbility(env, u('cloud'), abilityDef(env, 'cure'), [u('tifa')]);
    const hits = ofType(events, 'damage');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.targetId).toBe(JENOVA); // her only living opposing fighter
    expect(hits[0]?.amount).toBeLessThan(0); // Cure heals the boss: only undead take damage from it, and she is not
    expect(hits[0]?.sourceId).toBe('tifa');
  });

  it(`two Reflect holders ping-pong a spell at most ${REFLECT_MAX_BOUNCES} times, then it lands`, () => {
    const { env, events, u } = jlEnv(13);
    applyStatus(u(JENOVA), 'reflect');
    applyStatus(u('cloud'), 'reflect');
    const hp = u(JENOVA).hp;
    performAbility(env, u('cloud'), abilityDef(env, 'bolt3'), [u(JENOVA)]);
    const hits = ofType(events, 'damage');
    expect(REFLECT_MAX_BOUNCES).toBe(4);
    expect(hits).toHaveLength(1); // one landing, however many times it turned
    expect(hits[0]?.targetId).toBe(JENOVA); // aimed at her, turned to Cloud, her, Cloud, her: the fourth turn is the last
    expect(u(JENOVA).hp).toBeLessThan(hp);
    expect(hits[0]?.sourceId).toBe('cloud');
  });

  it('a status spell turns too: Barrier cast on a Reflect holder lands on a random opponent of the holder', () => {
    const { env, u } = jlEnv(14);
    applyStatus(u('tifa'), 'reflect');
    const out = performAbility(env, u('cloud'), abilityDef(env, 'barrier'), [u('tifa')]);
    expect(out[0]?.targetId).toBe(JENOVA);
    expect(hasStatus(u(JENOVA), 'barrier')).toBe(true);
    expect(hasStatus(u('tifa'), 'barrier')).toBe(false);
  });

  it('with no Reflect up, the first magic hit lands on her: Quake2 on the Earth weakness hits Jenova (x2) and nothing turns', () => {
    const { env, events, u } = jlEnv(15);
    const hp = u(JENOVA).hp;
    const out = performAbility(env, u('cloud'), abilityDef(env, 'quake2'), [u(JENOVA)]);
    expect(out).toEqual([{ targetId: JENOVA, hit: true, killed: false }]);
    const hits = ofType(events, 'damage');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.targetId).toBe(JENOVA);
    expect(hits[0]?.affinity).toBe('weak');
    expect(hits[0]?.sourceId).toBe('cloud');
    expect(u(JENOVA).hp).toBe(hp - (hits[0]?.amount ?? 0));
  });
});
