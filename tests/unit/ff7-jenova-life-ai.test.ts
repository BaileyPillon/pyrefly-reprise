/**
 * Jenova LIFE's AI as pins (hidden chapter 44; FF7 only; `research/ff7-jenova-life.md` §5): the Count draw, the cycle,
 * the SpclChance dial at exactly 75, 50 and 25 percent, the double Blue Light, the Reflect counter's two conditions,
 * an unaffordable pick failing silently, and her MP over a fight. The engine-level cases drive the real engine.
 */

import { describe, expect, it } from 'vitest';
import { jenovaLifeScript, JENOVA_REFLECT_MP, spclChanceFor } from '../../src/battle/ff7/ai/jenova-life.ts';
import { makeAiApi, type Ff7AiApi } from '../../src/battle/ff7/ai/script.ts';
import { runFf7Battle, distractedPolicy, jenovaSensiblePolicy, sensibleQuakePolicy, summarizeJenovaRun } from '../../src/battle/ff7/index.ts';
import { living, type Ff7Env } from '../../src/battle/ff7/internal.ts';
import { applyStatus, hasStatus } from '../../src/battle/ff7/statuses.ts';
import type { BattleEvent, Command, Ff7Combatant } from '../../src/battle/common/types.ts';
import type { Ff7Engine } from '../../src/battle/ff7/index.ts';
import { JENOVA, JL_REG, jlEngine, jlEnv, jlSetup, ofType } from './helpers/jenova.ts';

const COUNT = `${JENOVA}:count`;
const DIAL = `${JENOVA}:spcl-chance`;

function apiOf(env: Ff7Env): Ff7AiApi {
  const self = env.state.combatants[JENOVA] as Ff7Combatant;
  return makeAiApi(env.state, self, env.rng, (e) => env.emit(e), () => living(env.state, 'party'));
}

describe('Setup: Count a uniform draw of 0..3, SpclChance 5 (jl §5)', () => {
  it('every Count 0, 1, 2 and 3 is reached over seeds, each seed always the same one, the dial starts at 5', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 80; seed++) {
      const { env } = jlEnv(seed);
      jenovaLifeScript.setup?.(apiOf(env));
      const c = env.state.flags[COUNT] as number;
      expect([0, 1, 2, 3]).toContain(c);
      expect(env.state.flags[DIAL]).toBe(5);
      seen.add(c);
      const again = jlEnv(seed);
      jenovaLifeScript.setup?.(apiOf(again.env));
      expect(again.env.state.flags[COUNT]).toBe(c);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });
  it('the engine runs Setup at battle start (the flags exist before any turn)', () => {
    const e = jlEngine(5);
    expect([0, 1, 2, 3]).toContain(e.state().flags[COUNT]);
    expect(e.state().flags[DIAL]).toBe(5);
  });
});

describe('Main: the cycle Blue Light, Blue Light, Blue Flame, and Aqualung one time in SpclChance (jl §5)', () => {
  it('Count 0 and 1 are Blue Light on one living opponent and add one to Count', () => {
    for (const count of [0, 1]) {
      const { env } = jlEnv(3);
      env.state.flags[COUNT] = count;
      env.state.flags[DIAL] = 5;
      const plan = jenovaLifeScript.main(apiOf(env));
      expect(plan).toMatchObject({ kind: 'ability', abilityId: 'blue-light' });
      expect(plan.kind === 'ability' && plan.targets).toHaveLength(1);
      expect(env.state.flags[COUNT]).toBe(count + 1);
    }
  });
  it('Count 2 is Blue Flame on one opponent, then Count is 3 or 0', () => {
    const next = new Set<unknown>();
    for (let seed = 1; seed <= 60; seed++) {
      const { env } = jlEnv(seed);
      env.state.flags[COUNT] = 2;
      env.state.flags[DIAL] = 5;
      const plan = jenovaLifeScript.main(apiOf(env));
      expect(plan).toMatchObject({ kind: 'ability', abilityId: 'blue-flame' });
      next.add(env.state.flags[COUNT]);
    }
    expect([...next].sort()).toEqual([0, 3]);
  });
  it('Count 3 is Aqualung on every living opponent, then Count 0; a fallen member is not a target', () => {
    const { env, u } = jlEnv(4);
    env.state.flags[COUNT] = 3;
    const all = jenovaLifeScript.main(apiOf(env));
    expect(all).toMatchObject({ kind: 'ability', abilityId: 'aqualung', targets: ['cloud', 'tifa', 'barret'] });
    expect(env.state.flags[COUNT]).toBe(0);
    u('tifa').alive = false;
    env.state.flags[COUNT] = 3;
    expect(jenovaLifeScript.main(apiOf(env))).toMatchObject({ targets: ['cloud', 'barret'] });
  });
  it('the dial: one in five at full health for the double Blue Light, one in two below a quarter', () => {
    const rate = (dial: number, count: number): { doubles: number; flames: number } => {
      let doubles = 0;
      let flames = 0;
      const { env } = jlEnv(21);
      for (let i = 0; i < 6000; i++) {
        env.state.flags[COUNT] = count;
        env.state.flags[DIAL] = dial;
        const plan = jenovaLifeScript.main(apiOf(env));
        if (count < 2 && plan.kind === 'ability' && plan.followUps?.length) doubles++;
        if (count === 2 && env.state.flags[COUNT] === 3) flames++;
      }
      return { doubles, flames };
    };
    const five = rate(5, 0);
    expect(five.doubles / 6000).toBeGreaterThan(0.17);
    expect(five.doubles / 6000).toBeLessThan(0.23);
    const two = rate(2, 0);
    expect(two.doubles / 6000).toBeGreaterThan(0.47);
    expect(two.doubles / 6000).toBeLessThan(0.53);
    const flame5 = rate(5, 2);
    expect(flame5.flames / 6000).toBeGreaterThan(0.17);
    expect(flame5.flames / 6000).toBeLessThan(0.23);
    const flame2 = rate(2, 2);
    expect(flame2.flames / 6000).toBeGreaterThan(0.47);
    expect(flame2.flames / 6000).toBeLessThan(0.53);
  });
  it('the second Blue Light picks another living opponent, or the same one when only one is left', () => {
    let seenOther = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { env } = jlEnv(seed);
      env.state.flags[COUNT] = 0;
      env.state.flags[DIAL] = 2;
      const plan = jenovaLifeScript.main(apiOf(env));
      if (plan.kind !== 'ability' || !plan.followUps?.length) continue;
      expect(plan.followUps[0]?.abilityId).toBe('blue-light');
      expect(plan.followUps[0]?.targets[0]).not.toBe(plan.targets[0]);
      seenOther++;
    }
    expect(seenOther).toBeGreaterThan(50);
    const { env, u } = jlEnv(9);
    u('tifa').alive = false;
    u('barret').alive = false;
    env.state.flags[COUNT] = 0;
    env.state.flags[DIAL] = 1; // a one-in-one roll always wins
    const plan = jenovaLifeScript.main(apiOf(env));
    expect(plan.kind === 'ability' && plan.followUps?.[0]?.targets).toEqual(['cloud']);
  });
});

describe('Counter, general: SpclChance by HP, inclusive at 75, 50 and 25 percent (jl §5)', () => {
  it('5 above 75%, 4 at 75% or less, 3 at 50% or less, 2 at 25% or less', () => {
    expect([10_000, 7501].map((hp) => spclChanceFor(hp, 10_000))).toEqual([5, 5]);
    expect([7500, 5001].map((hp) => spclChanceFor(hp, 10_000))).toEqual([4, 4]);
    expect([5000, 2501].map((hp) => spclChanceFor(hp, 10_000))).toEqual([3, 3]);
    expect([2500, 1, 0].map((hp) => spclChanceFor(hp, 10_000))).toEqual([2, 2, 2]);
  });
  it('the engine runs it after a party action against her, hit or miss, and it sets the dial and nothing else', () => {
    const e = jlEngine(6);
    const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
    jenova.hp = 5000;
    const events = playOne(e, 'cloud', { kind: 'attack', targets: [JENOVA] });
    const hurt = ofType(events, 'damage').find((d) => d.targetId === JENOVA);
    expect(e.state().flags[DIAL]).toBe(jenova.hp * 2 <= 10_000 ? 3 : 4);
    expect(hurt).toBeDefined();
    expect(ofType(events, 'counter')).toHaveLength(0); // the dial is a plan-less counter: nothing shows
  });
});

describe('Counter, magical: Reflect on herself when a magical attack hit her, with no Reflect and 30 MP (jl §5)', () => {
  it('the first magic hit lands; a moment later she casts Reflect and pays 30 MP', () => {
    const e = jlEngine(3);
    const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
    const mpBefore = jenova.mp;
    const hpBefore = jenova.hp;
    const events = playOne(e, 'cloud', { kind: 'ability', id: 'quake2', targets: [JENOVA] });
    expect(jenova.hp).toBeLessThan(hpBefore); // the spell resolved first
    const kinds = events.map((ev) => ev.type);
    expect(kinds.indexOf('damage')).toBeLessThan(kinds.indexOf('counter'));
    expect(ofType(events, 'counter')[0]).toMatchObject({ actorId: JENOVA, abilityId: 'jenova-reflect', cause: 'script' });
    expect(hasStatus(jenova, 'reflect')).toBe(true);
    expect(jenova.mp).toBe(mpBefore - JENOVA_REFLECT_MP);
  });
  it('every later reflectable spell turns back onto its caster and does not touch her; she casts Reflect once', () => {
    const e = jlEngine(3);
    const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
    playOne(e, 'cloud', { kind: 'ability', id: 'quake2', targets: [JENOVA] });
    toMenu(e, 'cloud'); // her own turns pass while the menu comes round; what matters is this one cast
    const hp = jenova.hp;
    const mp = jenova.mp;
    const events = e.submit({ kind: 'ability', id: 'bolt2', targets: [JENOVA] });
    expect(jenova.hp).toBe(hp);
    expect(ofType(events, 'damage').map((d) => d.targetId)).toEqual(['cloud']);
    expect(ofType(events, 'counter')).toHaveLength(0);
    expect(jenova.mp).toBe(mp);
  });
  it('she needs 30 MP in hand: at 29 the magic hit sets nothing off', () => {
    const e = jlEngine(3);
    const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
    jenova.mp = JENOVA_REFLECT_MP - 1;
    playOne(e, 'cloud', { kind: 'ability', id: 'quake2', targets: [JENOVA] });
    expect(hasStatus(jenova, 'reflect')).toBe(false);
    expect(jenova.mp).toBe(JENOVA_REFLECT_MP - 1);
  });
  it('Attack and Cure-type actions do not set it off; only a magical formula does (an attack with Reflect up still lands)', () => {
    const e = jlEngine(3);
    const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
    playOne(e, 'cloud', { kind: 'attack', targets: [JENOVA] });
    expect(hasStatus(jenova, 'reflect')).toBe(false);
    applyStatus(jenova, 'reflect');
    const hp = jenova.hp;
    playOne(e, 'tifa', { kind: 'attack', targets: [JENOVA] });
    expect(jenova.hp).toBeLessThan(hp); // Reflect turns spells, never a blow
  });
});

describe('an unaffordable pick fails silently (jl §6: the sources do not say; our estimate)', () => {
  it('below 8 MP her Blue Light does nothing: her turn passes with no action and no "Not enough MP" line', () => {
    const e = jlEngine(8);
    const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
    jenova.mp = 7;
    e.state().flags[COUNT] = 0;
    const events: BattleEvent[] = [];
    for (let i = 0; i < 400 && !events.some((ev) => ev.type === 'turn-start' && ev.actorId === JENOVA); i++) {
      const d = e.nextDecision();
      if (d.kind === 'waiting') events.push(...e.tick(d.nextEventMs));
      else if (d.kind === 'resolved') events.push(...d.events);
      else if (d.kind === 'player-input') e.submit({ kind: 'defend', targets: [] });
    }
    expect(events.some((ev) => ev.type === 'turn-start' && ev.actorId === JENOVA)).toBe(true);
    expect(events.filter((ev) => ev.type === 'action-start' && ev.actorId === JENOVA)).toHaveLength(0);
    expect(events.filter((ev) => ev.type === 'message')).toHaveLength(0);
    expect(jenova.mp).toBe(7);
    expect(e.state().flags[COUNT]).toBe(1); // the script still advanced
  });
});

describe('her MP over a fight (jl §4: 300 MP is the only budget she has)', () => {
  it('spent exactly as her actions are paid: 300 - 8 Blue Light - 12 Blue Flame - 34 Aqualung - 30 Reflect, never below 0', () => {
    for (const [name, policy] of [['sensible', () => jenovaSensiblePolicy], ['quake', () => sensibleQuakePolicy], ['distracted', (s: number) => distractedPolicy(s)]] as const) {
      for (let seed = 1; seed <= 12; seed++) {
        const run = runFf7Battle({ setup: jlSetup(seed), registry: JL_REG, policy: policy(seed) });
        const s = summarizeJenovaRun(run);
        const spent = 8 * s.blueLights + 12 * s.blueFlames + 34 * s.aqualungs + 30 * s.reflectsCast;
        expect(s.mpLeft, `${name} seed ${seed}`).toBe(300 - spent);
        expect(s.mpLeft).toBeGreaterThanOrEqual(0);
        expect(s.reflectsCast).toBeLessThanOrEqual(1); // the status is not spent, so she never needs a second
      }
    }
  });
  it('a long fight drains her: at 7 MP or less she can do nothing she scripts, and the party then wins at leisure', () => {
    const e = jlEngine(2);
    const jenova = e.state().combatants[JENOVA] as Ff7Combatant;
    jenova.mp = 7;
    let silent = 0;
    for (let i = 0; i < 3000 && !e.state().result; i++) {
      const d = e.nextDecision();
      if (d.kind === 'waiting') {
        for (const ev of e.tick(d.nextEventMs)) if (ev.type === 'turn-start' && ev.actorId === JENOVA) silent++;
      } else if (d.kind === 'resolved') {
        // a pass
      } else if (d.kind === 'player-input') e.submit({ kind: 'attack', targets: [JENOVA] });
    }
    expect(e.state().result?.outcome).toBe('victory');
    expect(silent).toBeGreaterThan(3);
    expect(jenova.mp).toBe(7);
    expect(Object.values(e.state().combatants).every((c) => (c as Ff7Combatant).alive || c.side === 'enemy')).toBe(true);
  });
});

/** Drive the engine to `actorId`'s open menu (the others Defend), without answering it. */
function toMenu(e: Ff7Engine, actorId: string): void {
  for (let i = 0; i < 4000; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') throw new Error('the battle ended before the menu');
    if (d.kind === 'waiting') e.tick(d.nextEventMs);
    else if (d.kind === 'player-input') {
      if (d.actorId === actorId) return;
      e.submit({ kind: 'defend', targets: [] });
    }
  }
  throw new Error('no menu');
}

/** Drive the engine to `actorId`'s menu, submit `command`, and return the events it produced. */
function playOne(e: Ff7Engine, actorId: string, command: Command): BattleEvent[] {
  toMenu(e, actorId);
  return e.submit(command);
}
