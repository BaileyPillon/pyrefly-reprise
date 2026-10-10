/**
 * **Engine-level parity, the FFX Overdrive gauge** (re-parity W5; **FFX only**).
 *
 * The kernel tests (`parity-ffx-overdrive.test.ts`) prove the gauge code against FFX.exe's machine code. This file proves
 * the WIRING: it drives the engine's own paths (`addGauge`, `resolveAbility`, the gauge API of `gauge.ts`) on a few hundred
 * generated situations and asserts that the gauges the engine leaves equal what the kernels produce for the same facts,
 * built again by an independent route (`helpers/ffxEngineGauge.ts`, which imports nothing from `adapt/` or `gauge.ts`):
 *
 * 1. the gauge add: the multipliers, Shield (zero) and Boost (double) on ANY character, Curse, a dead or Petrified one, and an
 *    aeon's bar of 20 points shown to the HUD as a percentage;
 * 2. every hit record of a real action, in the game's order: the hook before the HP changes (Stoic, Comrade, Healer, Warrior,
 *    the aeon's own gains), the outcome hook after (Dancer, Rook), the Healer reading the HP still missing;
 * 3. the turn, death, victory and escape hooks; Entrust; the cost of an Overdrive and a Grand Summon's held gauge;
 * 4. every change of a gauge is announced by one `overdrive-gauge` event whose `from` is the gauge as it stood.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { CORE_ABILITIES, addGauge, hitChance, resolveAbility, spendOverdrive } from '../../src/battle/ffx/index.ts';
import { gaugeOnDeath, gaugeOnEscape, gaugeOnTurn, gaugeOnVictory, gaugeTransfer } from '../../src/battle/ffx/gauge.ts';
import { koActor } from '../../src/battle/ffx/hp.ts';
import { critCheck } from '../../src/battle/ffx/kernel/crit.ts';
import { hitCheck, hitPlan } from '../../src/battle/ffx/kernel/hit.ts';
import { noStatusOutcome } from '../../src/battle/ffx/kernel/aftermath.ts';
import { calcHitDamage } from '../../src/battle/ffx/kernel/hitdamage.ts';
import { odAdd } from '../../src/battle/ffx/kernel/overdrive.ts';
import { odOnDeath, odOnEscape, odOnHpChange, odOnOutcome, odOnTurn, odOnVictory } from '../../src/battle/ffx/kernel/overdrive-hooks.ts';
import { odTransfer } from '../../src/battle/ffx/kernel/overdrive-cost.ts';
import { ScriptedRng, contextOf, makeRng, oracleInputs, wiringPool, type Situation } from './helpers/ffxEngineWiring.ts';
import {
  type Seat,
  aeonSeat,
  barOfKind,
  engineCombatant,
  enemySeat,
  oracleWorld,
  partySeat,
  unitOfKind,
} from './helpers/ffxEngineGauge.ts';

const POOL: AbilityDef[] = [...wiringPool(ALL_ABILITIES), ...wiringPool(CORE_ABILITIES.map((a) => ({ ...a })))];
const HITTERS = POOL.filter((a) => a.category !== 'enemy' && a.targeting === 'single-enemy' && (a.record!.flagsMisc & 0x01000000) !== 0);
const NON_CHARGING = POOL.filter((a) => a.category !== 'enemy' && a.targeting === 'single-enemy' && (a.record!.flagsMisc & 0x01000000) === 0);
const ENEMY_MOVES = POOL.filter((a) => a.category === 'enemy' && a.targeting === 'single-enemy');
const HEALS = POOL.filter((a) => a.category !== 'enemy' && a.targeting === 'single-ally' && a.flags.includes('heals'));

interface Built {
  ctx: ReturnType<typeof contextOf>['ctx'];
  events: Array<Record<string, unknown>>;
  by: Map<string, FFXCombatant>;
}

/** The engine's field for a list of seats: the first two seats are handed to `contextOf` as user and target, the rest follow in order. */
function engineField(seats: readonly Seat[], aeonOut: boolean, rng = new ScriptedRng([1])): Built {
  const combatants = seats.map(engineCombatant);
  const [a, b, ...rest] = combatants as [FFXCombatant, FFXCombatant, ...FFXCombatant[]];
  const built = contextOf(a, b, rng, 0, rest);
  if (aeonOut) built.ctx.state.aeonId = seats.find((s) => s.kind === 'aeon')!.id;
  return { ...built, by: new Map(combatants.map((c) => [c.id, c])) };
}

/** Every gauge of the field, in the engine's percent. */
function gaugesOf(b: Built, seats: readonly Seat[]): number[] {
  return seats.map((s) => b.by.get(s.id)?.overdrive?.gauge ?? 0);
}

/** The kernel's gauges for the same seats, shown in the engine's percent. */
function oracleGauges(w: ReturnType<typeof oracleWorld>, seats: readonly Seat[]): number[] {
  return seats.map((s) => (s.kind === 'enemy' ? 0 : w.slots[s.slot]!.gauge * unitOfKind(s.kind)));
}

/** Each `overdrive-gauge` event starts from the gauge as it stood, and the events add up to the change. */
function checkEvents(b: Built, seats: readonly Seat[], before: readonly number[], label: string): void {
  seats.forEach((s, i) => {
    if (s.kind === 'enemy') return;
    let running = before[i] as number;
    for (const e of b.events) {
      if (e['type'] !== 'overdrive-gauge' || e['who'] !== s.id) continue;
      expect(e['from'], `${label}: ${s.id} event starts from the gauge as it stood`).toBe(running);
      expect(e['to'], `${label}: ${s.id} event moves the gauge`).not.toBe(e['from']);
      running = e['to'] as number;
    }
    expect(running, `${label}: ${s.id} events add up`).toBe(b.by.get(s.id)!.overdrive!.gauge);
  });
}

describe('the gauge add (pp_BtlOdAdd), on generated characters', () => {
  it('600 situations: the engine adds what the kernel adds, on a 100-point bar and on an aeon\'s 20', () => {
    const rng = makeRng(20261010);
    const seen = { shield: 0, boost: 0, curse: 0, dead: 0, stoned: 0, hot: 0, ecc: 0, auto: 0, aeon: 0, capped: 0, moved: 0 };
    for (let i = 0; i < 600; i++) {
      const aeon = rng.next() < 0.4;
      const seat = aeon ? aeonSeat(rng, rng.int(0, 6)) : partySeat(rng, rng.int(0, 6));
      seat.curse = rng.next() < 0.08;
      seat.hotSpurs = rng.next() < 0.18;
      seat.eccentrick = rng.next() < 0.18;
      seat.dead = rng.next() < 0.05;
      seat.gaugeAuto = rng.pick([0, 0, 0, 1, 2, 4, 8]);
      seat.spec.shield = rng.next() < 0.12;
      seat.spec.boost = rng.next() < 0.15;
      seat.points = rng.next() < 0.2 ? barOfKind(seat.kind) - 1 : seat.points;
      const foe = enemySeat(rng, 0);
      const seats = [seat, foe];
      const b = engineField(seats, aeon);
      const before = gaugesOf(b, seats);
      const amount = rng.int(1, 40);
      addGauge(b.ctx, b.by.get(seat.id)!, amount, 'test');
      const w = oracleWorld(seats);
      odAdd(w, seat.slot, amount);
      expect(gaugesOf(b, seats), `situation ${i}: ${seat.id} mode ${seat.mode}`).toEqual(oracleGauges(w, seats));
      checkEvents(b, seats, before, `situation ${i}`);
      if (seat.spec.shield) seen.shield++;
      if (seat.spec.boost) seen.boost++;
      if (seat.curse) seen.curse++;
      if (seat.dead) seen.dead++;
      if (seat.spec.petrify) seen.stoned++;
      if (seat.hotSpurs) seen.hot++;
      if (seat.eccentrick) seen.ecc++;
      if (seat.gaugeAuto) seen.auto++;
      if (aeon) seen.aeon++;
      if (gaugesOf(b, seats)[0] === 100) seen.capped++;
      if (gaugesOf(b, seats)[0] !== before[0]) seen.moved++;
    }
    for (const [k, v] of Object.entries(seen)) expect(v, `the sample reached ${k}`).toBeGreaterThan(10);
  });

  it('anchors from the research note: Shield zeroes and Boost doubles a PARTY member\'s gain, an aeon\'s bar is 20 wide', () => {
    const rng = makeRng(3);
    const at = (kind: 'party' | 'aeon', over: (s: Seat) => void): number => {
      const seat = kind === 'aeon' ? aeonSeat(rng, 0) : partySeat(rng, 0);
      Object.assign(seat.spec, { shield: false, boost: false, petrify: false });
      seat.points = 0;
      over(seat);
      const b = engineField([seat, enemySeat(rng, 0)], kind === 'aeon');
      addGauge(b.ctx, b.by.get(seat.id)!, 4, 'anchor');
      return b.by.get(seat.id)!.overdrive!.gauge;
    };
    expect(at('party', () => {})).toBe(4);
    expect(at('party', (s) => { s.spec.shield = true; })).toBe(0);
    expect(at('party', (s) => { s.spec.boost = true; })).toBe(8);
    expect(at('aeon', () => {})).toBe(20); // 4 points of the aeon's 20 are a fifth of the bar
    expect(at('aeon', (s) => { s.spec.shield = true; })).toBe(0);
    expect(at('aeon', (s) => { s.spec.boost = true; })).toBe(40);
    expect(at('party', (s) => { s.gaugeAuto = 2; })).toBe(12); // Triple Overdrive
  });
});

/** One generated scenario around a single action. */
interface Scenario {
  label: string;
  def: AbilityDef;
  user: Seat;
  target: Seat;
  others: Seat[];
  aeonOut: boolean;
}

function scenarioOf(flavor: string, rng: ReturnType<typeof makeRng>): Scenario {
  const party = (n: number, hpSide = true): Seat => partySeat(rng, n, hpSide);
  const withParty = (...skip: number[]): Seat[] => [0, 1, 2].filter((n) => !skip.includes(n)).map((n) => {
    const s = party(n);
    s.dead = rng.next() < 0.1;
    s.spec.hp = Math.max(1, s.spec.hp);
    return s;
  });
  const lean = (seat: Seat, mode: number): Seat => { if (rng.next() < 0.6) seat.mode = mode; return seat; }; // the sample leans to the mode the flavor is about
  const parked = (seats: Seat[]): Seat[] => seats.map((s) => ({ ...s, inBattle: false }));
  switch (flavor) {
    case 'party-hits-enemy': {
      const u = lean(party(0), 0);
      return { label: flavor, def: rng.pick(HITTERS), user: u, target: enemySeat(rng, 0), others: withParty(0), aeonOut: false };
    }
    case 'party-uncharged-hits-enemy': {
      const u = party(0);
      return { label: flavor, def: rng.pick(NON_CHARGING), user: u, target: enemySeat(rng, 0), others: withParty(0), aeonOut: false };
    }
    case 'aeon-hits-enemy': {
      const u = aeonSeat(rng, rng.int(0, 6));
      return { label: flavor, def: rng.pick(HITTERS), user: u, target: enemySeat(rng, 0), others: parked(withParty()), aeonOut: true };
    }
    case 'enemy-hits-party': {
      const t = lean(party(rng.int(0, 2)), 2);
      const others = withParty(t.slot).map((o) => lean(o, 1));
      return { label: flavor, def: rng.pick(ENEMY_MOVES), user: enemySeat(rng, 0), target: t, others, aeonOut: false };
    }
    case 'enemy-hits-aeon': {
      const t = aeonSeat(rng, rng.int(0, 6));
      return { label: flavor, def: rng.pick(ENEMY_MOVES), user: enemySeat(rng, 0), target: t, others: parked(withParty()), aeonOut: true };
    }
    case 'party-heals-party': {
      const u = lean(party(0), 3);
      const t = party(1);
      return { label: flavor, def: rng.pick(HEALS), user: u, target: t, others: withParty(0, 1).concat([enemySeat(rng, 0)]), aeonOut: false };
    }
    default:
      throw new Error(flavor);
  }
}

/** The engine's run of a scenario, then the kernels' run for the same draws; returns both worlds' gauges and what happened. */
function runScenario(sc: Scenario, raws: number[]): { engine: Built; seats: Seat[]; oracle: number[]; died: boolean; moved: boolean; trace: string[] } {
  // (draw kinds are added to the trace for a failure message)
  const { def, user, target } = sc;
  const sit: Situation = { def, user: user.spec, target: target.spec, userSide: user.kind === 'enemy' ? 'enemy' : 'party', raws };
  const seats = [user, target, ...sc.others];
  const rng = new ScriptedRng(raws);
  const engine = engineField(seats, sc.aeonOut, rng);
  const before = gaugesOf(engine, seats);
  const userC = engine.by.get(user.id)!;
  resolveAbility(engine.ctx, userC, def, [target.id], { hits: def.hits });
  const died = seats.some((s) => !s.dead && engine.by.get(s.id)!.hp <= 0);

  // ---- the kernels, hit after hit, with the engine's own bookkeeping of the target's running HP between hits
  const w = oracleWorld(seats);
  let cursor = 0;
  const next = (): number => raws[cursor++ % raws.length] as number;
  const [u, t] = [user.slot, target.slot];
  const charges = (def.record!.flagsMisc & 0x01000000) !== 0 ? 1 : 0;
  let hp = target.spec.hp;
  let mp = target.spec.mp;
  let sleep = target.spec.sleep;
  const trace: string[] = [];
  const nul = [...target.spec.nul];
  for (let h = 0; h < def.hits; h++) {
    const inp = oracleInputs(sit, { hp, mp, ctb: 0, sleep });
    inp.input.record.nul = { blaze: nul[0] as number, frost: nul[1] as number, shock: nul[2] as number, tide: nul[3] as number };
    const out = calcHitDamage(inp.input, {
      draw: next,
      hit: () => hitCheck(inp.hit, next),
      crit: () => critCheck(inp.crit, 0, next).crit,
      status: () => {
        if (target.spec.petrify) next();
        return noStatusOutcome(inp.input.record.perm, inp.input.record.extra);
      },
    });
    nul[0] = out.nul.blaze; nul[1] = out.nul.frost; nul[2] = out.nul.shock; nul[3] = out.nul.tide;
    trace.push(`plan${JSON.stringify(hitPlan(inp.hit))} eng${hitChance(userC, engine.by.get(target.id)!, def)} ${out.outcome}:${out.amounts[0]}:base${out.unvariedHpBase}:byte${out.outcomeByte}:hp${hp}/${target.spec.maxHp}`);
    // pp_BtlOdOnHpChange runs for every record, BEFORE its HP changes
    w.slots[t]!.hp = hp;
    odOnHpChange(w, u, t, out.amounts[0], out.unvariedHpBase, charges);
    if (out.outcome === 'noEffect') continue;
    if (out.outcome === 'nullified' || out.outcome === 'miss') {
      odOnOutcome(w, u, t, 0, out.outcomeByte);
      continue;
    }
    const [a0, a1] = out.amounts;
    if ((def.record!.damageClass & 2) !== 0 && a1 !== 0) mp = Math.max(0, Math.min(target.spec.maxMp, mp - a1));
    if ((def.record!.damageClass & 1) !== 0 && a0 !== 0) {
      hp = Math.max(0, Math.min(target.spec.maxHp, hp - a0));
      if (def.damageType === 'physical' && a0 > 0) sleep = false;
    }
    w.slots[t]!.hp = hp;
    odOnOutcome(w, u, t, 0, out.outcomeByte);
  }
  trace.push(`engine draws ${rng.kinds()}`);
  const moved = gaugesOf(engine, seats).some((g, i) => g !== before[i]);
  checkEvents(engine, seats, before, sc.label);
  return { engine, seats, oracle: oracleGauges(w, seats), died, moved, trace };
}

describe('every hit record of a real action runs the gauge hooks in the game\'s order', () => {
  const FLAVORS = ['party-hits-enemy', 'party-uncharged-hits-enemy', 'aeon-hits-enemy', 'enemy-hits-party', 'enemy-hits-aeon', 'party-heals-party'] as const;
  it('1200 situations: the same gauges for everyone on the field, as the kernels leave them', () => {
    const rng = makeRng(20261011);
    const tally: Record<string, { run: number; moved: number; skipped: number }> = {};
    for (const f of FLAVORS) tally[f] = { run: 0, moved: 0, skipped: 0 };
    for (let i = 0; i < 1200; i++) {
      const flavor = FLAVORS[i % FLAVORS.length] as (typeof FLAVORS)[number];
      const sc = scenarioOf(flavor, rng);
      const raws = Array.from({ length: 24 }, () => rng.int(0, 0x7fffffff));
      const r = runScenario(sc, raws);
      const tl = tally[flavor]!;
      if (r.died) { tl.skipped++; continue; } // a KO takes the death path (tested below), which this oracle does not model
      expect(
        r.seats.map((s) => r.engine.by.get(s.id)!.overdrive?.gauge ?? 0),
        `situation ${i}: ${flavor} ${sc.def.id} (user mode ${sc.user.mode}, target mode ${sc.target.mode}) kernel ${r.trace.join(" | ")} engine ${JSON.stringify(r.engine.events.filter((e) => e["type"] === "damage" || e["type"] === "miss").map((e) => [e["type"], e["amount"], e["reason"]]))}`,
      ).toEqual(r.oracle);
      tl.run++;
      if (r.moved) tl.moved++;
    }
    for (const f of FLAVORS) {
      const tl = tally[f]!;
      expect(tl.run, `${f} ran`).toBeGreaterThan(100);
      expect(tl.skipped, `${f} skipped by a KO`).toBeLessThan(100);
    }
    // The sample reached the gains: a hit taken, a hit dealt, a heal and an aeon's gains all moved a gauge in many situations.
    expect(tally['party-hits-enemy']!.moved).toBeGreaterThan(10);
    expect(tally['aeon-hits-enemy']!.moved).toBeGreaterThan(60);
    expect(tally['enemy-hits-party']!.moved).toBeGreaterThan(30);
    expect(tally['enemy-hits-aeon']!.moved).toBeGreaterThan(60);
    expect(tally['party-heals-party']!.moved).toBeGreaterThan(8);
  });
});

describe('the turn, death, victory and escape hooks, and the Overdrive cost', () => {
  it('gauge hooks: 800 fields with 3 party members, an aeon or not, and 2 monsters', () => {
    const rng = makeRng(20261012);
    let moved = 0;
    for (let i = 0; i < 800; i++) {
      const aeonOut = rng.next() < 0.3;
      const party = [0, 1, 2].map((n) => {
        const s = partySeat(rng, n);
        s.dead = rng.next() < 0.15;
        s.spec.petrify = rng.next() < 0.08;
        s.inBattle = !aeonOut;
        s.points = rng.int(0, 90);
        return s;
      });
      const aeon = aeonSeat(rng, rng.int(0, 6));
      const foes = [enemySeat(rng, 0), enemySeat(rng, 1)];
      for (const f of foes) f.spec.maxHp = rng.pick([500, 4000, 25000, 60000]);
      // the first two seats of the list become `contextOf`'s user and target, so a party member and the first monster lead it
      const seats: Seat[] = [party[0]!, foes[0]!, party[1]!, party[2]!, foes[1]!, ...(aeonOut ? [aeon] : [])];
      const kind = i % 4;
      const b = engineField(seats, aeonOut);
      const before = gaugesOf(b, seats);
      const w = oracleWorld(seats);
      const actor = seats[rng.int(0, seats.length - 1)] as Seat;
      const pickedFoe = rng.pick(foes);
      const killer = rng.pick([...party, ...(aeonOut ? [aeon] : []), pickedFoe]);
      const victim = killer.kind === 'enemy' ? rng.pick([...party, ...(aeonOut ? [aeon] : [])]) : pickedFoe;
      if (kind === 0) {
        if (actor.kind === 'enemy') continue;
        gaugeOnTurn(b.ctx, b.by.get(actor.id)!);
        odOnTurn(w, actor.slot);
      } else if (kind === 1) {
        gaugeOnDeath(b.ctx, b.by.get(killer.id)!, b.by.get(victim.id)!);
        odOnDeath(w, killer.slot, victim.slot);
      } else if (kind === 2) {
        gaugeOnVictory(b.ctx);
        odOnVictory(w);
      } else {
        if (actor.kind === 'enemy') continue;
        gaugeOnEscape(b.ctx, b.by.get(actor.id)!);
        odOnEscape(w, actor.slot);
      }
      expect(gaugesOf(b, seats), `situation ${i} (hook ${kind})`).toEqual(oracleGauges(w, seats));
      checkEvents(b, seats, before, `hook ${kind}`);
      if (gaugesOf(b, seats).some((g, j) => g !== before[j])) moved++;
    }
    expect(moved, 'the sample moved gauges').toBeGreaterThan(50);
  });

  it('a monster that kills a character runs the death hook, a tick (Poison) too: Avenger +30 for every other member', () => {
    const rng = makeRng(8);
    const seats = [partySeat(rng, 0), enemySeat(rng, 0), partySeat(rng, 1), partySeat(rng, 2)];
    for (const s of seats) { s.dead = false; s.spec.petrify = false; s.curse = false; s.spec.shield = false; s.spec.boost = false; s.points = 10; s.gaugeAuto = 0; }
    seats[2]!.mode = 7; // Avenger
    seats[3]!.mode = 2;
    const b = engineField(seats, false);
    const victim = b.by.get('tidus')!;
    koActor(b.ctx, victim, 'foe-0');
    expect(b.by.get('yuna')!.overdrive!.gauge).toBe(40);
    expect(b.by.get('auron')!.overdrive!.gauge).toBe(10);
    // a tick kills with no source: the victim is its own killer, which is not a monster, so nothing is paid
    const b2 = engineField(seats, false);
    koActor(b2.ctx, b2.by.get('tidus')!);
    expect(b2.by.get('yuna')!.overdrive!.gauge).toBe(10);
  });

  it('Entrust moves the whole gauge to the target (clamped to its bar) and empties the user\'s', () => {
    const rng = makeRng(9);
    for (let i = 0; i < 60; i++) {
      const [a, c] = [partySeat(rng, 0), partySeat(rng, 1)];
      for (const s of [a, c]) { s.spec.petrify = rng.next() < 0.15; s.points = rng.int(0, 100); }
      const seats = [a, c];
      const b = engineField(seats, false, new ScriptedRng([1]));
      const w = oracleWorld(seats);
      gaugeTransfer(b.ctx, b.by.get(a.id)!, b.by.get(c.id)!);
      if (!c.spec.petrify) odTransfer(w.slots[a.slot]!, w.slots[c.slot]!);
      expect(gaugesOf(b, seats), `entrust ${i}`).toEqual(oracleGauges(w, seats));
    }
  });

  it('paying for an Overdrive empties the bar; a Grand Summon\'s held full gauge is spent and the aeon\'s own gauge comes back', () => {
    const rng = makeRng(10);
    const party = partySeat(rng, 0);
    party.points = 100;
    const bp = engineField([party, enemySeat(rng, 0)], false);
    spendOverdrive(bp.ctx, bp.by.get('tidus')!);
    expect(bp.by.get('tidus')!.overdrive!.gauge).toBe(0);

    const aeon = aeonSeat(rng, 0);
    aeon.points = 7;
    const b = engineField([aeon, enemySeat(rng, 0)], true);
    const v = b.by.get('valefor')!;
    v.aeon!.temporaryOverdrive = 100; // a Grand Summon holds the gauge at its maximum
    spendOverdrive(b.ctx, v);
    expect(v.aeon!.temporaryOverdrive).toBeNull();
    expect(v.overdrive!.gauge).toBe(35); // the 7 points it had are back, shown as 35 percent
    expect(b.events.some((e) => e['type'] === 'overdrive-gauge' && e['cause'] === 'grand-summon')).toBe(true);
  });
});
