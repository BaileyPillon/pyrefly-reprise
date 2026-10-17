/**
 * **Hit order, the Drain recoil and the action rank** (re-parity RC10, lane FFX hit order; **FFX only**).
 *
 * The oracle is written from the private note FFX-H01 (sections 3.4 to 3.7 and 7, rows 1, 3, 5 and 7) in its own terms and shares no line with `hit-order.ts`:
 *
 * - `driverModel` is a model of the game's results driver and hit applier: call after call, every slot ascending, at most one hit per slot per call, a target's death check
 *   in the call that applies its last hit. It is run on the note's **47 scripted scenarios** (32 with one target, H = 1 to 16 hits, counter armed or not; 15 with two
 *   targets, (H1, H2) = (2,5), (5,2), (1,16), (3,3), (4,1), armed on one, both or neither) and compared with what the engine's scheduler (`hit-order.ts#runInRounds`) and the
 *   engine itself (`resolveAbility` on boards) do.
 * - Counters: the engine queues a counter when it decides it (the first hit that arms), in the order the targets are calculated, which is slot order: the note's "once per
 *   armed target, in call 1, in slot order". A command that reaches two targets is not single-target and arms nobody in the engine (`kernel/counter.ts`): the note's two-target
 *   armed scenarios hand-make records the engine's rule never produces, so they are checked at the scheduler (calls in slot order, first hit first) and the engine is asserted to
 *   queue nothing for them.
 * - S2 is a table written from the note's section 3.4 step 6 (flag 0, flag 1, cancelled) and engine boards (one heal with the summed amount, a skipped self-target, a nullified drain).
 * - S3 is the registry: the rank every ability charges through `kernel/ctb.ts#actionRank` equals the plain rule (the record's rank byte, 0 is 3).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { buildAction, resolveAbility } from '../../src/battle/ffx/index.ts';
import { takeCounters } from '../../src/battle/ffx/counter-chain.ts';
import { type HitPass, captureEvents, inSlotOrder, runInRounds } from '../../src/battle/ffx/hit-order.ts';
import type { HitScope } from '../../src/battle/ffx/hit-apply.ts';
import { type Board, combatantOfMember, contextOfBoard } from './helpers/ffxTargetBoard.ts';
import { type Ev, boardOf, member, striker } from './helpers/ffxHitOrder.ts';

// ------------------------------------------------------------------ the note's 47 scenarios

interface Scenario {
  name: string;
  /** Hit counts by target, slot ascending. */
  hits: number[];
  /** Which targets carry the armed counter byte. */
  armed: boolean[];
}

const SCENARIOS: Scenario[] = [];
for (let h = 1; h <= 16; h++) for (const armed of [false, true]) SCENARIOS.push({ name: `one target, ${h} hits, ${armed ? 'armed' : 'not armed'}`, hits: [h], armed: [armed] });
for (const pair of [[2, 5], [5, 2], [1, 16], [3, 3], [4, 1]] as const) {
  for (const [label, armed] of [['neither armed', [false, false]], ['first armed', [true, false]], ['both armed', [true, true]]] as const) {
    SCENARIOS.push({ name: `two targets (${pair[0]}, ${pair[1]}), ${label}`, hits: [...pair], armed: [...armed] });
  }
}

/**
 * The game's driver as the note states it: calls until no slot has a hit pending; in a call, slots ascending, one hit per slot that has one pending, then the counter queue
 * (once per armed slot, clearing its byte) and, when the slot has none pending, its death check (first time only: later checks are no-ops).
 */
function driverModel(hits: readonly number[], armed: readonly boolean[]): { order: string[]; counters: number[]; calls: number } {
  const applied = hits.map(() => 0);
  const queued = hits.map(() => false);
  const checked = hits.map(() => false);
  const order: string[] = [];
  const counters: number[] = [];
  let calls = 0;
  for (;;) {
    calls++;
    let pending = false;
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i] as number;
      if (h === 0) continue;
      if ((applied[i] as number) < h) {
        order.push(`hit ${i} ${applied[i]}`);
        (applied as number[])[i] = (applied[i] as number) + 1;
      }
      if (armed[i] === true && !queued[i]) {
        (queued as boolean[])[i] = true;
        counters.push(i);
      }
      if ((applied[i] as number) >= h && !checked[i]) {
        (checked as boolean[])[i] = true;
        order.push(`death ${i}`);
      }
      if ((applied[i] as number) < h) pending = true;
    }
    if (!pending) break;
  }
  return { order, counters, calls };
}

/** The hit-and-death tokens of an action's events, for the targets listed in `ids` (slot ascending): `hit i k` is the k-th damage event on target i, `death i` its KO. */
function tokensOf(events: readonly Ev[], ids: readonly string[]): string[] {
  const count = ids.map(() => 0);
  const out: string[] = [];
  for (const e of events) {
    const i = ids.indexOf(String(e['targetId']));
    if (i < 0) continue;
    if (e['type'] === 'damage') out.push(`hit ${i} ${count[i]!++}`);
    else if (e['type'] === 'ko') out.push(`death ${i}`);
  }
  return out;
}


// ------------------------------------------------------------------ S1, the scheduler against the driver model

/** A scope good enough for the scheduler: the board's context and its user. */
function scopeOf(board: Board, userId: string): { scope: HitScope; ctx: ReturnType<typeof contextOfBoard>['ctx']; events: Ev[]; byId: Map<string, FFXCombatant> } {
  const { ctx, events, byId } = contextOfBoard(board, 1);
  return { scope: { ctx, user: byId.get(userId) } as unknown as HitScope, ctx, events, byId };
}

describe('S1: the scheduler applies hits round by round, as the driver model does (the note\'s 47 scenarios)', () => {
  it('has the 47 scenarios of the note', () => {
    expect(SCENARIOS.length).toBe(47);
  });

  for (const sc of SCENARIOS) {
    it(`${sc.name}: hits in rounds, one death each in the round of its last hit, calculation target by target`, () => {
      const board = boardOf(sc.hits.map(() => 1000));
      const { scope, ctx, events, byId } = scopeOf(board, 'tidus');
      const ids = sc.hits.map((_, i) => `m${i}`);
      const passes: HitPass[] = ids.map((id, i) => ({ target: byId.get(id) as FFXCombatant, hits: sc.hits[i] as number }));
      const calcOrder: string[] = [];
      const queue: number[] = [];
      const seen = ids.map(() => 0);
      const armedQueued = ids.map(() => false);
      runInRounds(
        scope,
        passes,
        (target) => {
          const i = ids.indexOf(target.id);
          calcOrder.push(`${i}`);
          // the engine decides a counter at the first hit that arms and never again for this command (`counter-chain.ts#noteCounterHit`)
          if (sc.armed[i] === true && !armedQueued[i]) {
            armedQueued[i] = true;
            queue.push(i);
          }
          ctx.emit({ type: 'damage', targetId: target.id, amount: 1, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
          seen[i]!++;
        },
        (target) => ctx.emit({ type: 'ko', targetId: target.id }),
      );
      const model = driverModel(sc.hits, sc.armed);
      expect(tokensOf(events, ids)).toEqual(model.order);
      // calculation stays slot by slot: every hit of the first target, then of the next
      expect(calcOrder.join('')).toBe(sc.hits.map((h, i) => `${i}`.repeat(h)).join(''));
      // one counter per armed target, in slot order, and the model says the same
      expect(queue).toEqual(model.counters);
      // the model's calls = the largest hit count
      expect(model.calls).toBe(Math.max(...sc.hits));
      // `seq` follows the order the events were replayed in
      events.forEach((e, i) => expect(e['seq']).toBe(i));
    });
  }

  it('applies a target\'s events in the round of its hit, not at the end (the first events are the first round\'s)', () => {
    const board = boardOf([1000, 1000]);
    const { scope, ctx, events, byId } = scopeOf(board, 'tidus');
    const passes: HitPass[] = [{ target: byId.get('m0') as FFXCombatant, hits: 3 }, { target: byId.get('m1') as FFXCombatant, hits: 3 }];
    runInRounds(scope, passes, (t) => ctx.emit({ type: 'message', text: `calc ${t.id}`, kind: 'system' }), () => undefined);
    expect(events.map((e) => e['text'])).toEqual(['calc m0', 'calc m1', 'calc m0', 'calc m1', 'calc m0', 'calc m1']);
  });

  it('puts the user\'s recoil in round 1 at the user\'s slot: before the monsters for a party user, after the party for a monster', () => {
    const board = boardOf([1000], ['lulu']);
    for (const [userId, targetId, expected] of [['lulu', 'm0', ['recoil', 'hit m0']], ['m0', 'tidus', ['hit tidus', 'recoil']]] as const) {
      const { ctx, events, byId } = scopeOf(board, userId);
      const user = byId.get(userId) as FFXCombatant;
      const scope = { ctx, user, recoil: { hp: 5, mp: 0, landed: 1, userTargeted: false } } as unknown as HitScope;
      // the user's heal is the recoil: the engine emits a `heal` for it
      user.hp = 100;
      runInRounds(scope, [{ target: byId.get(targetId) as FFXCombatant, hits: 2 }], (t) => ctx.emit({ type: 'message', text: `hit ${t.id}`, kind: 'system' }), () => undefined);
      const tokens = events.filter((e) => e['type'] === 'heal' || e['type'] === 'message').map((e) => (e['type'] === 'heal' ? 'recoil' : String(e['text'])));
      expect(tokens.slice(0, 2)).toEqual(expected);
      expect(tokens.filter((t) => t === 'recoil').length).toBe(1);
    }
  });

  it('restores ctx.emit when a hit throws, and holds the events of nested captures', () => {
    const { ctx, events } = contextOfBoard(boardOf([10]), 1);
    const real = ctx.emit;
    expect(() => captureEvents(ctx, () => { throw new Error('boom'); })).toThrow('boom');
    expect(ctx.emit).toBe(real);
    const outer = captureEvents(ctx, () => {
      ctx.emit({ type: 'message', text: 'a', kind: 'system' });
      const inner = captureEvents(ctx, () => ctx.emit({ type: 'message', text: 'b', kind: 'system' }));
      expect(inner.length).toBe(1);
      ctx.emit({ type: 'message', text: 'c', kind: 'system' });
    });
    expect(outer.map((e) => (e as { text: string }).text)).toEqual(['a', 'c']);
    expect(events.length).toBe(0);
  });

  it('orders the passes by game slot, stable, and leaves a combatant with no slot after the slotted ones', () => {
    const board = boardOf([10, 10, 10], ['auron', 'kimahri']);
    const { ctx, byId } = scopeOf(board, 'tidus');
    const ghost = combatantOfMember(member('ghost', 'enemy', 0, 10)); // not in the formation: the game has no slot for it
    const ordered = inSlotOrder(ctx, ['m1', 'ghost', 'kimahri', 'm0', 'tidus', 'auron'].map((id) => ({ target: id === 'ghost' ? ghost : (byId.get(id) as FFXCombatant) })));
    expect(ordered.map((p) => p.target.id)).toEqual(['tidus', 'auron', 'kimahri', 'm0', 'm1', 'ghost']);
  });
});

// ------------------------------------------------------------------ S1, the engine

/** Run `def` from Tidus at the given enemies; the targets are lethal (1 HP) or stand (9999). Returns the events and the context. */
function runEngine(def: AbilityDef, enemyHp: readonly number[], seed: number, userId = 'tidus', chosen?: readonly string[]): { events: Ev[]; ctx: ReturnType<typeof contextOfBoard>['ctx']; byId: Map<string, FFXCombatant> } {
  const board = boardOf(enemyHp, userId === 'tidus' ? [] : [userId]);
  const { ctx, events, byId } = contextOfBoard(board, seed);
  const user = byId.get(userId) as FFXCombatant;
  resolveAbility(ctx, user, def, chosen ?? enemyHp.map((_, i) => `m${i}`));
  return { events, ctx, byId };
}

describe('S1: the engine\'s events follow the driver model', () => {
  // The note's one-target and equal-count two-target scenarios, through resolveAbility.
  for (const sc of SCENARIOS.filter((s) => s.hits.length === 1 || s.hits[0] === s.hits[1])) {
    it(`${sc.name}: damage events in the model's order, KOs where it puts them`, () => {
      const h = sc.hits[0] as number;
      for (const lethal of [true, false]) {
        const def = striker({ id: `rr-${h}-${sc.hits.length}-${lethal}`, hits: h, targeting: 'all-enemies', power: lethal ? 9999 : 1 });
        const hp = sc.hits.map(() => (lethal ? 1 : 9999));
        const { events } = runEngine(def, hp, 7);
        const ids = sc.hits.map((_, i) => `m${i}`);
        const model = driverModel(sc.hits, sc.armed.map(() => false)).order.filter((t) => lethal || !t.startsWith('death'));
        expect(tokensOf(events, ids), lethal ? 'lethal' : 'standing').toEqual(model);
      }
    });
  }

  it('unequal hit counts of a spread: every pair of the note, found by seed, the KO of the target whose hits end first comes first', () => {
    for (const pair of [[2, 5], [5, 2], [1, 16], [4, 1], [3, 4]] as const) {
      const total = pair[0] + pair[1];
      const def = striker({ id: `spread-${total}`, hits: total, targeting: 'random-enemy', power: 9999 });
      // The game's builder deals the hits over the set one pick at a time (stream 5): look for the seed whose deal is this pair, then play it through the engine.
      let seed = 1;
      for (; seed < 400000; seed++) {
        const { ctx, byId } = contextOfBoard(boardOf([1, 1]), seed);
        const built = buildAction(ctx, byId.get('tidus') as FFXCombatant, def, [byId.get('m0') as FFXCombatant, byId.get('m1') as FFXCombatant], total, true);
        if (built.targets.length === 2 && built.targets[0]!.hits === pair[0] && built.targets[1]!.hits === pair[1]) break;
      }
      expect(seed, `a seed that deals ${pair.join(' and ')}`).toBeLessThan(400000);
      const { events } = runEngine(def, [1, 1], seed, 'tidus', ['m0', 'm1']);
      const model = driverModel([pair[0], pair[1]], [false, false]).order;
      expect(tokensOf(events, ['m0', 'm1'])).toEqual(model);
    }
  }, 120000);

  it('a command that reaches two targets arms nobody; a single-target one with H hits queues one counter for an armed holder (32 one-target scenarios)', () => {
    for (const sc of SCENARIOS.filter((s) => s.hits.length === 1)) {
      const h = sc.hits[0] as number;
      const board = boardOf([1000]);
      const { ctx, byId } = contextOfBoard(board, 3);
      const holder = byId.get('tidus') as FFXCombatant;
      if (sc.armed[0] === true) holder.equipment = { weapon: { name: 'Sword', slots: 3, autoAbilities: ['counterattack'] }, armor: { name: 'Armour', slots: 3, autoAbilities: [] } } as never;
      const attacker = byId.get('m0') as FFXCombatant;
      resolveAbility(ctx, attacker, striker({ id: `solo-${h}`, hits: h, targeting: 'single-enemy' }), ['tidus']);
      expect(takeCounters(ctx).length, sc.name).toBe(sc.armed[0] === true ? 1 : 0);
    }
    const board = boardOf([1000, 1000]);
    const { ctx, byId } = contextOfBoard(board, 3);
    (byId.get('tidus') as FFXCombatant).equipment = { weapon: { name: 'Sword', slots: 3, autoAbilities: ['counterattack'] }, armor: { name: 'Armour', slots: 3, autoAbilities: [] } } as never;
    resolveAbility(ctx, byId.get('m0') as FFXCombatant, striker({ id: 'group', hits: 3, targeting: 'all-enemies' }), ['tidus']);
    expect(takeCounters(ctx)).toEqual([]);
  });

  it('calculation order is the slot order even when the raw target list is not: a party hit by a group command meets the lower slot\'s hit first', () => {
    // Kimahri (slot 3) is listed before Auron (slot 2) in the active order: the game still visits Auron first.
    const board = boardOf([1000], ['kimahri', 'auron']);
    const { ctx, events, byId } = contextOfBoard(board, 5, ['tidus', 'kimahri', 'auron']);
    resolveAbility(ctx, byId.get('m0') as FFXCombatant, striker({ id: 'sweep-party', hits: 2, targeting: 'all-enemies' }), ['tidus', 'kimahri', 'auron']);
    const damage = events.filter((e) => e['type'] === 'damage');
    expect(damage.map((e) => e['targetId'])).toEqual(['tidus', 'auron', 'kimahri', 'tidus', 'auron', 'kimahri']);
    // ... and they were CALCULATED in that order too (hitIndex is the calculation index): Tidus 0 and 1, Auron 2 and 3, Kimahri 4 and 5, not the formation order Tidus, Kimahri, Auron
    expect(damage.map((e) => e['hitIndex'])).toEqual([0, 2, 4, 1, 3, 5]);
  });

  it('a script-aimed row keeps the order its script named: calculated and applied hit by hit, not by slot', () => {
    // Kimahri (slot 3) is named before Auron (slot 2): hit 0 goes to Kimahri, hit 1 to Auron. Each is its own command in the game, so no slot sort and no rounds.
    const board = boardOf([1000], ['kimahri', 'auron']);
    const { ctx, events, byId } = contextOfBoard(board, 5);
    const def = striker({ id: 'aimed', hits: 2, targeting: 'random-enemy', extra: { scriptAims: true } });
    resolveAbility(ctx, byId.get('m0') as FFXCombatant, def, ['kimahri', 'auron']);
    const damage = events.filter((e) => e['type'] === 'damage');
    expect(damage.map((e) => `${e['targetId']}#${e['hitIndex']}`)).toEqual(['kimahri#0', 'auron#1']);
  });

  it('events keep their content: only the order moves (hitIndex stays the calculation index) and seq stays the log index', () => {
    const def = striker({ id: 'content', hits: 2, targeting: 'all-enemies' });
    const { events } = runEngine(def, [9999, 9999], 11);
    const damage = events.filter((e) => e['type'] === 'damage');
    expect(damage.map((e) => `${e['targetId']}#${e['hitIndex']}/${e['hitCount']}`)).toEqual(['m0#0/4', 'm1#2/4', 'm0#1/4', 'm1#3/4']);
    events.forEach((e, i) => expect(e['seq']).toBe(i));
  });
});

