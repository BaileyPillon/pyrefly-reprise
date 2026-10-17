/**
 * **Doublecast as two picks, each cast paid at its own cost check** (re-parity RC10 lane FFX-N, rows N2 and N3; **FFX only**).
 *
 * The fact it stands on is a measurement on the Steam copy (`live/2026-10-17-live-session-4.md`, case 1; FFX-G07 finding 13): Lulu with Half MP chose Doublecast, then Fire, then
 * Firaga; her MP went 452 -> 450 as Fire was cast and 450 -> 442 about 4.6 s later as Firaga was cast. Each cast pays at its own cost check, at its own cost.
 *
 * The oracle is `helpers/ffxCommandRig.ts`, which restates the MP rule in its own terms and imports nothing from the kernels or the adapters. Nothing here reads
 * `doublecast.ts` to decide what is right: the expected payments, the final MP, which casts start, the order of the elements the hits carry and the brackets are worked out
 * from the ability data and the rule in words.
 *
 * 1. The live case, to the number (2 then 8 under Half MP; 4 then 16 without), and where each payment sits among the hits.
 * 2. 700 generated scenes: two spells, the caster's modifiers (Half, One MP, Magic Booster, Spellspring), Silence, MP around the thresholds.
 * 3. The marginal cases in words: the second spell can fail for lack of MP, and the order of the two spells decides it.
 * 4. The older shape (one spell on `wrappedId`, one target or two) is the same two casts: event for event.
 * 5. The brackets, a killed target, a bad pick, `casts` over `wrappedId`, and a real engine turn (Chapter XVIII).
 * 6. `doublecastPicks`: the second pick's rows with the first cast's cost as pending MP.
 */

import { describe, expect, it } from 'vitest';
import type { AutoAbilityId, Command, StatusId } from '../../src/battle/common/types.ts';
import { ABILITIES } from '../../src/data/ffx/index.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { doublecastPicks } from '../../src/battle/ffx/doublecast.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { type Who, lcg, oracleCategory, oracleGated, oracleMpCost, rigOf } from './helpers/ffxCommandRig.ts';

/** The twelve elemental spells: single target, no status, no special path. */
const POOL = ['fire', 'blizzard', 'thunder', 'water', 'fira', 'blizzara', 'thundara', 'watera', 'firaga', 'blizzaga', 'thundaga', 'waterga'] as const;
const LEARNED = ['doublecast', ...POOL];
type Ev = Record<string, unknown>;

interface Facts {
  half: boolean;
  one: boolean;
  booster: boolean;
  free: boolean;
}
const NONE: Facts = { half: false, one: false, booster: false, free: false };

const lulu = (mp: number, f: Facts = NONE, silenced = false, learned: string[] = LEARNED): Who => {
  const autos: AutoAbilityId[] = [];
  if (f.half) autos.push('half-mp-cost');
  if (f.one) autos.push('one-mp-cost');
  if (f.booster) autos.push('magic-booster');
  const statuses: StatusId[] = [];
  if (silenced) statuses.push('silence');
  if (f.free) statuses.push('mp-cost-zero');
  return { id: 'lulu', side: 'party', mp, autos, statuses, learned };
};
const boss = (over: Partial<Who> = {}): Who => ({ id: 'boss', side: 'enemy', hp: 9999, ...over });

function run(who: Who[], command: Command, seed = 20261017) {
  const rig = rigOf(who, seed);
  const user = rig.byId.get('lulu')!;
  rig.ctx.rt.currentActorId = 'lulu';
  const result = executeCommand(rig.ctx, user, command, true);
  return { rig, user, result, events: rig.events };
}

const two = (a: string, ta: string[], b: string, tb: string[]): Command => ({ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id: a, targets: ta }, { id: b, targets: tb }] });

/** What the events say: the payments in order, the elements of the hits in order, and the brackets. */
function reading(events: readonly Ev[]) {
  const pays: number[] = [];
  const hitElements: string[] = [];
  const starts: string[] = [];
  let ends = 0;
  // Per payment, how many hits landed before the next one (index 0 is before the first payment).
  const hitsAfterPayment: number[] = [0];
  for (const e of events) {
    if (e['type'] === 'mp-damage' && e['targetId'] === 'lulu') {
      pays.push(e['amount'] as number);
      hitsAfterPayment.push(0);
    } else if (e['type'] === 'damage' && e['sourceId'] === 'lulu') {
      hitElements.push(e['element'] as string);
      hitsAfterPayment[hitsAfterPayment.length - 1]! += 1;
    } else if (e['type'] === 'action-start') starts.push(e['abilityId'] as string);
    else if (e['type'] === 'action-end') ends += 1;
  }
  return { pays, hitElements, starts, ends, hitsAfterPayment };
}
const collapse = (xs: readonly string[]): string[] => xs.filter((x, i) => i === 0 || x !== xs[i - 1]);
const elementOf = (id: string): string => ABILITIES[id]!.element[0] as string;

/** The oracle for a pair: the payments, the casts that start, the MP left. Plain arithmetic from the rule, one cast at a time. */
function expectPair(mp0: number, ids: readonly [string, string], f: Facts, silenced: boolean) {
  let mp = mp0;
  const pays: number[] = [];
  const started: string[] = [];
  for (const id of ids) {
    const def = ABILITIES[id]!;
    const cost = oracleMpCost(def.mpCost, oracleCategory(def), f);
    if ((silenced && oracleGated(def)) || mp < cost) continue;
    mp -= cost;
    started.push(id);
    if (cost > 0) pays.push(cost);
  }
  return { pays, started, mp };
}

describe('the live case: Lulu with Half MP, Doublecast, Fire then Firaga (Steam copy, 2026-10-17)', () => {
  it('pays 2 and then 8: 452 -> 450 -> 442, the first before its hit and the second after the first cast\'s hit and before its own', () => {
    const { user, events } = run([lulu(452, { ...NONE, half: true }), boss()], two('fire', ['boss'], 'firaga', ['boss']));
    const r = reading(events);
    expect(r.pays).toEqual([2, 8]);
    expect(user.mp).toBe(442);
    expect(r.hitsAfterPayment[0]).toBe(0); // nothing lands before the first payment
    expect(r.hitsAfterPayment[1]).toBeGreaterThan(0); // Fire's hit lands between the two payments
    expect(r.hitsAfterPayment[2]).toBeGreaterThan(0); // Firaga's after the second
    expect(collapse(r.hitElements)).toEqual(['fire']); // both spells are fire
    expect(r.starts).toEqual(['fire', 'firaga']);
  });

  it('without Half MP it is 4 and then 16', () => {
    const { user, events } = run([lulu(452), boss()], two('fire', ['boss'], 'firaga', ['boss']));
    expect(reading(events).pays).toEqual([4, 16]);
    expect(user.mp).toBe(432);
  });

  it('the first cast pays the FIRST spell\'s cost and the second the SECOND\'s: Firaga then Fire is 16 then 4 (the order of the picks is the order of the payments)', () => {
    const { user, events } = run([lulu(452), boss()], two('firaga', ['boss'], 'fire', ['boss']));
    expect(reading(events).pays).toEqual([16, 4]);
    expect(user.mp).toBe(432);
  });

  it('two different elements: each cast carries its own spell\'s element, in pick order', () => {
    const { events } = run([lulu(452), boss()], two('blizzard', ['boss'], 'thunder', ['boss']));
    expect(collapse(reading(events).hitElements)).toEqual([elementOf('blizzard'), elementOf('thunder')]);
    expect(reading(events).pays).toEqual([4, 4]);
  });
});

describe('the second spell can fail for lack of MP, and the order of the two decides it', () => {
  const pay = (mp: number, a: string, b: string) => {
    const { user, events } = run([lulu(mp), boss()], two(a, ['boss'], b, ['boss']));
    return { mp: user.mp, pays: reading(events).pays, hits: reading(events).hitElements.length };
  };

  it('19 MP: Fire (4) then Firaga (16) leaves 15, so Firaga does not start and pays nothing; Firaga then Fire leaves 3, so Fire does not start', () => {
    expect(pay(19, 'fire', 'firaga')).toMatchObject({ mp: 15, pays: [4] });
    expect(pay(19, 'firaga', 'fire')).toMatchObject({ mp: 3, pays: [16] });
  });

  it('20 MP pays for both, in either order, and leaves 0', () => {
    expect(pay(20, 'fire', 'firaga')).toMatchObject({ mp: 0, pays: [4, 16] });
    expect(pay(20, 'firaga', 'fire')).toMatchObject({ mp: 0, pays: [16, 4] });
  });

  it('a cast that does not start has no hit: one cast\'s worth of hits where one starts, none where neither does', () => {
    const one = pay(19, 'fire', 'firaga');
    const both = pay(20, 'fire', 'firaga');
    expect(both.hits).toBe(one.hits * 2);
    expect(pay(3, 'fire', 'firaga')).toMatchObject({ mp: 3, pays: [], hits: 0 });
  });

  it('Silenced, neither cast starts and nothing is paid', () => {
    const { user, events } = run([lulu(452, NONE, true), boss()], two('fire', ['boss'], 'firaga', ['boss']));
    expect(reading(events)).toMatchObject({ pays: [], hitElements: [] });
    expect(user.mp).toBe(452);
  });
});

describe('700 generated scenes: two spells, modifiers, Silence and MP around the thresholds, against the oracle', () => {
  it('the payments, the casts that start, the elements of the hits, the MP left and the brackets all equal the oracle\'s', () => {
    const r = lcg(20261017);
    const seen = { both: 0, onlyFirst: 0, onlySecond: 0, neither: 0, mixed: 0, cheaper: 0, free: 0 };
    for (let i = 0; i < 700; i++) {
      const a = r.pick(POOL);
      const b = r.chance(0.25) ? a : r.pick(POOL);
      const f: Facts = { half: r.chance(0.4), one: r.chance(0.2), booster: r.chance(0.35), free: r.chance(0.07) };
      const silenced = r.chance(0.12);
      const costA = oracleMpCost(ABILITIES[a]!.mpCost, oracleCategory(ABILITIES[a]!), f);
      const costB = oracleMpCost(ABILITIES[b]!.mpCost, oracleCategory(ABILITIES[b]!), f);
      const mp = r.pick([0, costA - 1, costA, costA + costB - 1, costA + costB, costA + costB, costA + costB + 3, costB, costB - 1, 400].map((x) => Math.max(0, x)));
      const want = expectPair(mp, [a, b], f, silenced);
      const label = JSON.stringify({ a, b, f, silenced, mp });
      const { user, events } = run([lulu(mp, f, silenced), boss()], two(a, ['boss'], b, ['boss']), 100 + i);
      const got = reading(events);
      expect(got.pays, `payments ${label}`).toEqual(want.pays);
      expect(user.mp, `MP left ${label}`).toBe(want.mp);
      expect(collapse(got.hitElements), `elements ${label}`).toEqual(collapse(want.started.map(elementOf)));
      // The brackets: the first spell's, plus a second one only when the second started and is a different spell.
      const secondStarts = want.started.length === 2 || (want.started.length === 1 && want.started[0] === b && !(a === want.started[0]));
      const expectStarts = [a, ...(secondStarts && b !== a ? [b] : [])];
      expect(got.starts, `brackets ${label}`).toEqual(expectStarts);
      expect(got.ends, `closed ${label}`).toBe(expectStarts.length);
      // A payment is never separated from its cast's hits by another payment: a started cast is paid once and then hits.
      if (!f.free) for (const [k, n] of got.hitsAfterPayment.entries()) expect(n > 0 || k === 0, `hits after payment ${k} ${label}`).toBe(true);
      if (want.started.length === 2) seen.both += 1;
      else if (want.started.length === 0) seen.neither += 1;
      else if (want.started[0] === a && !(silenced && oracleGated(ABILITIES[a]!)) && costA <= mp) seen.onlyFirst += 1;
      else seen.onlySecond += 1;
      if (a !== b) seen.mixed += 1;
      if (costA !== ABILITIES[a]!.mpCost) seen.cheaper += 1;
      if (f.free) seen.free += 1;
    }
    expect(seen.both).toBeGreaterThan(150);
    expect(seen.onlyFirst).toBeGreaterThan(30);
    expect(seen.onlySecond).toBeGreaterThan(5);
    expect(seen.neither).toBeGreaterThan(30);
    expect(seen.mixed).toBeGreaterThan(400);
    expect(seen.cheaper).toBeGreaterThan(150);
    expect(seen.free).toBeGreaterThan(20);
  });
});

describe('the older shape is the same two casts, event for event', () => {
  const same = (a: Command, b: Command, who: () => Who[], seed: number) => {
    const x = run(who(), a, seed).events;
    const y = run(who(), b, seed).events;
    expect(JSON.stringify(y)).toBe(JSON.stringify(x));
    return x;
  };
  const board = (mp = 200, f: Facts = NONE) => (): Who[] => [lulu(mp, f), boss(), { id: 'e2', side: 'enemy', hp: 9999 }];

  it('one spell on a target: wrappedId + [t] is casts [{t}, {t}]', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const events = same({ kind: 'ability', id: 'doublecast', wrappedId: 'firaga', targets: ['boss'] }, two('firaga', ['boss'], 'firaga', ['boss']), board(), seed);
      expect(reading(events).pays).toEqual([16, 16]);
      expect(reading(events).starts).toEqual(['firaga']); // one bracket for one spell, as it always was
    }
  });

  it('one spell at two targets: wrappedId + [a, b] is one cast each', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const events = same({ kind: 'ability', id: 'doublecast', wrappedId: 'fire', targets: ['boss', 'e2'] }, two('fire', ['boss'], 'fire', ['e2']), board(60, { ...NONE, half: true }), seed);
      const hit = new Set(events.filter((e) => e['type'] === 'damage').map((e) => e['targetId']));
      expect([...hit].sort()).toEqual(['boss', 'e2']);
    }
  });

  it('too little MP, Silence and a killed target: the same refusals in both shapes', () => {
    same({ kind: 'ability', id: 'doublecast', wrappedId: 'firaga', targets: ['boss'] }, two('firaga', ['boss'], 'firaga', ['boss']), board(20), 3); // pays one Firaga
    same({ kind: 'ability', id: 'doublecast', wrappedId: 'firaga', targets: ['boss'] }, two('firaga', ['boss'], 'firaga', ['boss']), () => [lulu(200, NONE, true), boss()], 3);
    same({ kind: 'ability', id: 'doublecast', wrappedId: 'fire', targets: ['boss'] }, two('fire', ['boss'], 'fire', ['boss']), () => [lulu(200), boss({ hp: 1 }), { id: 'e2', side: 'enemy' }], 3);
  });

  it('a self-only placeholder aim: the older shape draws once for both casts, two picks draw once each, and neither ever aims a foe spell at the caster', () => {
    for (let seed = 1; seed <= 12; seed++) {
      for (const cmd of [
        { kind: 'ability', id: 'doublecast', wrappedId: 'firaga', targets: ['lulu'] } as Command,
        two('firaga', ['lulu'], 'fire', []),
      ]) {
        const { events } = run(board()(), cmd, seed);
        const targets = events.filter((e) => e['type'] === 'damage').map((e) => e['targetId']);
        expect(targets.length).toBeGreaterThan(0);
        expect(targets.every((t) => t === 'boss' || t === 'e2')).toBe(true);
      }
    }
  });

  it('with no usable spell the older shape falls back to the strongest the caster can pay for twice (it always did)', () => {
    const { events } = run(board(100)(), { kind: 'ability', id: 'doublecast', wrappedId: 'meteor-not-learned', targets: ['boss'] });
    const r = reading(events);
    expect(r.pays.length).toBe(2);
    expect(r.pays[0]).toBe(r.pays[1]);
    expect(Math.max(...r.pays)).toBe(Math.max(...POOL.filter((id) => ABILITIES[id]!.mpCost * 2 <= 100).map((id) => ABILITIES[id]!.mpCost)));
  });
});

describe('brackets, targets, bad picks and which shape wins', () => {
  it('two different spells open a bracket each (the presenter plays each spell\'s own effect); one spell twice keeps its single bracket', () => {
    const mixed = run([lulu(200), boss()], two('fire', ['boss'], 'firaga', ['boss']));
    expect(mixed.events.filter((e) => e['type'] === 'action-start').map((e) => [e['abilityId'], e['abilityName']])).toEqual([['fire', 'Doublecast: Fire'], ['firaga', 'Doublecast: Firaga']]);
    const order = mixed.events.filter((e) => e['type'] === 'action-start' || e['type'] === 'action-end').map((e) => e['type']);
    expect(order).toEqual(['action-start', 'action-end', 'action-start', 'action-end']);
    const same = run([lulu(200), boss()], two('fire', ['boss'], 'fire', ['boss']));
    expect(same.events.filter((e) => e['type'] === 'action-start').length).toBe(1);
    expect(same.events.filter((e) => e['type'] === 'action-start').map((e) => e['targets'])).toEqual([['boss']]); // announced once, not twice
  });

  it('a second cast that cannot start opens no bracket of its own', () => {
    const { events } = run([lulu(10), boss()], two('fire', ['boss'], 'firaga', ['boss']));
    expect(reading(events)).toMatchObject({ starts: ['fire'], ends: 1, pays: [4] });
  });

  it('each pick has its own target: Fire at the boss and Firaga at the second foe', () => {
    const { events } = run([lulu(200), boss(), { id: 'e2', side: 'enemy', hp: 9999 }], two('fire', ['boss'], 'firaga', ['e2']));
    const hits = events.filter((e) => e['type'] === 'damage').map((e) => e['targetId']);
    expect(hits.indexOf('boss')).toBeLessThan(hits.indexOf('e2'));
    expect(new Set(hits)).toEqual(new Set(['boss', 'e2']));
    expect(hits.slice(0, hits.indexOf('e2')).every((t) => t === 'boss')).toBe(true);
    // Each bracket announces its own cast's target.
    expect(events.filter((e) => e['type'] === 'action-start').map((e) => e['targets'])).toEqual([['boss'], ['e2']]);
  });

  it('a foe the first cast killed is not hit again, and the second cast (a different spell at the same foe) pays nothing', () => {
    const { user, events } = run([lulu(200), boss({ hp: 1 }), { id: 'e2', side: 'enemy', hp: 9999 }], two('fire', ['boss'], 'firaga', ['boss']));
    expect(reading(events).pays).toEqual([4]);
    expect(user.mp).toBe(196);
  });

  it('a pick that is not learned Black Magic is replaced by the strongest spell the caster can pay for twice; with none, the turn says so and pays nothing', () => {
    const fell = run([lulu(200), boss()], two('cure', ['boss'], 'fire', ['boss']));
    const r = reading(fell.events);
    expect(r.pays.length).toBe(2);
    expect(r.pays[1]).toBe(4); // the second pick was a real spell and keeps its own cost
    // Black Magic the caster has not learned is a bad pick too (Flare is real Black Magic, but Lulu here has only the twelve).
    const unlearned = run([lulu(200), boss()], two('flare', ['boss'], 'fire', ['boss']));
    expect(reading(unlearned.events).pays[0]).not.toBe(ABILITIES['flare']!.mpCost);
    expect(reading(unlearned.events).pays[1]).toBe(4);
    const none = run([lulu(3), boss()], two('cure', ['boss'], 'cure', ['boss']));
    expect(reading(none.events).pays).toEqual([]);
    expect(none.events.some((e) => e['type'] === 'message' && String(e['text']).includes('no spell to double'))).toBe(true);
    expect(none.result).toMatchObject({ rank: 3, damageDealt: 0 });
  });

  it('when a command carries both shapes the two picks win', () => {
    const cmd = { kind: 'ability', id: 'doublecast', wrappedId: 'fire', targets: ['boss'], casts: [{ id: 'firaga', targets: ['boss'] }, { id: 'blizzard', targets: ['boss'] }] } as Command;
    const { events } = run([lulu(200), boss()], cmd);
    expect(reading(events).pays).toEqual([16, 4]);
  });

  it('the turn costs one rank-3 recovery whichever shape asks', () => {
    expect(run([lulu(200), boss()], two('fire', ['boss'], 'firaga', ['boss'])).result.rank).toBe(3);
    expect(run([lulu(200), boss()], { kind: 'ability', id: 'doublecast', wrappedId: 'fire', targets: ['boss'] }).result.rank).toBe(3);
  });
});

describe('the picker\'s data: doublecastPicks, the second pick with the first cast\'s cost as pending MP', () => {
  const picks = (mp: number, f: Facts, silenced: boolean, firstId?: string) => {
    const rig = rigOf([lulu(mp, f, silenced), boss()]);
    return doublecastPicks(rig.ctx, rig.byId.get('lulu')!, firstId);
  };

  it('Half MP at 452: Fire shows 2 and Firaga 8; after Fire the second pick shows Firaga with 450 -> 442 left', () => {
    const rows = picks(452, { ...NONE, half: true }, false, 'fire');
    expect(rows.find((x) => x.id === 'fire')).toMatchObject({ mpCost: 2, first: { enabled: true } });
    expect(rows.find((x) => x.id === 'firaga')).toMatchObject({ mpCost: 8, second: { enabled: true, pendingMp: 2, mpAfter: 442 } });
  });

  it('the second pick is judged with the first cost as pending: first cost + this cost within the MP (checked against the oracle over every pair)', () => {
    const r = lcg(77);
    for (let i = 0; i < 300; i++) {
      const a = r.pick(POOL);
      const b = r.pick(POOL);
      const f: Facts = { half: r.chance(0.4), one: r.chance(0.2), booster: r.chance(0.3), free: r.chance(0.05) };
      const cost = (id: string) => oracleMpCost(ABILITIES[id]!.mpCost, oracleCategory(ABILITIES[id]!), f);
      const mp = r.pick([0, 3, cost(a), cost(a) + cost(b) - 1, cost(a) + cost(b), cost(a) + cost(b) + 1, 300]);
      const silenced = r.chance(0.1);
      const rows = picks(mp, f, silenced, a);
      const row = rows.find((x) => x.id === b)!;
      const label = JSON.stringify({ a, b, f, mp, silenced });
      expect(row.mpCost, label).toBe(cost(b));
      expect(row.first.enabled, label).toBe(!silenced && cost(b) <= mp);
      expect(row.second!.enabled, `second ${label}`).toBe(!silenced && cost(a) + cost(b) <= mp);
      expect(row.second!.pendingMp, label).toBe(cost(a));
      expect(row.second!.mpAfter, label).toBe(mp - cost(a) - cost(b));
      if (silenced) expect(row.first.reason).toBe('Silenced');
      else if (!row.first.enabled) expect(row.first.reason).toBe('Not enough MP');
    }
  });

  it('without a first pick there is no second pick; only Black Magic is listed', () => {
    const rows = picks(100, NONE, false);
    expect(rows.every((x) => x.second === undefined)).toBe(true);
    expect(rows.map((x) => x.id).sort()).toEqual([...POOL].sort());
  });
});

describe('a real turn: Lulu in Chapter XVIII picks two different spells and the engine plays it', () => {
  it('pays the menu\'s own cost for each spell at its own cast, charges one rank-3 turn and goes on', async () => {
    await registerBattleContent();
    const chapter = CHAPTERS.find((c) => c.id === 'sin-face')!;
    const e = new FFXEngine({ autoResolveMinigames: true });
    const setup = setupForChapter(chapter, 1);
    e.setSeed(setup.seed);
    e.init(setup);
    let seen = false;
    for (let i = 0; i < 5_000 && !seen; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      if (d.actorId === 'lulu') {
        const fire = d.commands.find((c) => c.label === 'Fire');
        const firaga = d.commands.find((c) => c.label === 'Firaga');
        expect(fire && firaga && d.commands.some((c) => c.label === 'Doublecast')).toBeTruthy();
        const lulu = e.state().combatants['lulu'] as { mp: number };
        const before = lulu.mp;
        const log = e.state().log.length;
        e.submit({ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id: 'fire', targets: ['overdrive-sin'] }, { id: 'firaga', targets: ['overdrive-sin'] }] });
        const mine = (e.state().log.slice(log) as Ev[]).filter((x) => x['type'] === 'mp-damage' && x['targetId'] === 'lulu').map((x) => x['amount']);
        expect(mine).toEqual([fire!.mpCost, firaga!.mpCost]);
        expect(lulu.mp).toBe(before - fire!.mpCost - firaga!.mpCost);
        seen = true;
        break;
      }
      e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? { kind: 'defend', targets: [] });
    }
    expect(seen).toBe(true);
    expect(e.nextDecision().kind).not.toBe('battle-over'); // the battle goes on from the next turn
  });
});
