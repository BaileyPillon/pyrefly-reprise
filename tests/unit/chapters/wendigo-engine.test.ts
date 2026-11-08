/**
 * The hidden Wendigo chapter on the real engine (FFX only): the opening order of the CTB start on 100 seeds (the preflight's open question 3), the fight played to its end on seeds 1 to 3 by the advisor and by the
 * careless line, what the win pays, and the engine facts the sourced line leans on (the Petrify Grenade reaches both Guardians; a Steal ends a Guardian's Eye Drops and potions; Provoke turns Wendigo's blow on the Provoker;
 * the stance walks a Berserk member into the counter). Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { LINES, play } from '../helpers/wendigoBot.ts';
import { GUARDIAN_A, GUARDIAN_B, WENDIGO, actionList, actor, ctxOf, flags, give, has, inputFor, log, newEngine, nextInput, row, runDefending, wendigo, wendigoActions } from '../helpers/wendigoDrive.ts';

describe('the opening: the CTB start on seeds 1 to 100 (open question 3 of the preflight)', () => {
  it('nobody has acted when the first menu opens, it is Rikku\'s (27 ticks a turn), Tidus (30) is next, and the Guardians (30) and Wendigo (33) come before Yuna (39)', () => {
    let first: string[] = [];
    const orders = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const engine = newEngine(seed);
      const d = nextInput(engine);
      first.push(d.actorId);
      expect(log(engine).filter((e) => e.type === 'action-start'), `seed ${seed}`).toHaveLength(0);
      // Everybody defends until Yuna's first menu opens; the order of the actions before it is the CTB start's.
      const before: string[] = [];
      for (let i = 0; i < 12; i++) {
        const input = nextInput(engine);
        if (input.actorId === 'yuna') break;
        engine.submit({ kind: 'defend', targets: [] });
      }
      for (const a of actionList(log(engine))) before.push(a.split(':')[0]!);
      orders.add(before.slice(0, 3).join(','));
    }
    expect(new Set(first)).toEqual(new Set(['rikku']));
    // Rikku and Tidus defend first; of the three monsters the Guardians' two turns (30 each) come before Wendigo's (33) in every seed.
    for (const o of orders) expect(o.startsWith('rikku,tidus'), o).toBe(true);
  });
});

describe('the fight to its end, seeds 1 to 3', () => {
  it('the advisor wins all three; Wendigo ends at 0, the party stands, and the win pays Wendigo\'s 3,000 gil and 2,000 AP plus both Guardians\' 480 and 290 (petrified or killed, they are defeated)', () => {
    for (const seed of [1, 2, 3]) {
      const engine = newEngine(seed);
      type Result = { outcome: string; gil: number; ap: number; drops: Array<{ itemId: string; count: number }> };
      const held: { result: Result | null } = { result: null };
      for (let i = 0; i < 8000 && held.result === null; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') held.result = d.result as unknown as Result;
        else if (d.kind === 'player-input') {
          // The line is the advisor's, driven by the bot's chooser through its public entry.
          engine.submit(chooseFor(engine, d));
        }
      }
      const result = held.result;
      expect(result?.outcome, `seed ${seed}`).toBe('victory');
      expect(wendigo(engine).hp).toBe(0);
      expect(result!.gil, `seed ${seed}`).toBeGreaterThanOrEqual(3_000 + 480 * 2);
      expect(result!.ap, `seed ${seed}`).toBeGreaterThanOrEqual(2_000 + 290 * 2);
      expect(result!.drops.some((d) => d.itemId === 'power-sphere')).toBe(true);
    }
  });

  it('the careless line (everyone Attacks Wendigo) loses all three, in under two hundred ticks, with Wendigo barely scratched', () => {
    for (const seed of [1, 2, 3]) {
      const r = play(seed, LINES['careless']!);
      expect(r.outcome, `seed ${seed}`).toBe('defeat');
      expect(r.ticks, `seed ${seed}`).toBeLessThan(200);
      expect(r.hp, `seed ${seed}`).toBeGreaterThan(15_000);
    }
  });

  it('the advisor\'s fights show the whole script: the Punch above half HP, the Double Punch, the arms going up and down, the Counter Punch, and the plain Attack under half', () => {
    const seen = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6]) for (const k of Object.keys(play(seed, LINES['advisor']!).wendigoActs)) seen.add(k);
    for (const k of ['wendigo-punch', 'wendigo-haymaker', 'wendigo-raise-arms', 'wendigo-lower-arms', 'wendigo-counter-punch', 'attack']) expect(seen.has(k), k).toBe(true);
  });
});

/** The advisor's decision for this menu (the bot's own chooser). */
import { choose } from '../helpers/wendigoBot.ts';
function chooseFor(engine: ReturnType<typeof newEngine>, d: Parameters<typeof choose>[1]): Command {
  return choose(engine, d, LINES['advisor']!);
}

describe('the Petrify Grenade reaches both Guardians (the engine fact the advisor\'s opening leans on)', () => {
  it('one grenade at one Guardian turns both to stone on at least 85 of 100 seeds, Wendigo (immune) untouched, and no last shield is cast', () => {
    let both = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const engine = newEngine(seed);
      const d = inputFor(engine, 'rikku');
      const grenade = row(d, 'item', 'petrify-grenade', GUARDIAN_A);
      expect(grenade, `seed ${seed}`).not.toBeNull();
      engine.submit(grenade!);
      if (has(actor(engine, GUARDIAN_A), 'petrify') && has(actor(engine, GUARDIAN_B), 'petrify')) both++;
      expect(has(wendigo(engine), 'petrify')).toBe(false);
      expect(actionList(log(engine)).some((a) => a.endsWith(':protect') || a.endsWith(':shell'))).toBe(false);
    }
    expect(both).toBeGreaterThanOrEqual(85);
  });
});

describe('a Steal ends a Guardian\'s Eye Drops and potions (RE 4.4 and GameFAQs; the engine\'s own rule for a monster\'s item after a Steal is unread, RE 8)', () => {
  it('a blind Wendigo is cured by a Guardian that has not been robbed, and by none once both are', () => {
    const open = newEngine(2);
    give(wendigo(open), 'darkness');
    runDefending(open, (e) => wendigoActions(e).length >= 2 || actionList(log(e)).some((a) => a.endsWith(':lake-eye-drops')), 100);
    expect(actionList(log(open)).some((a) => a.endsWith(':lake-eye-drops'))).toBe(true);
    expect(has(wendigo(open), 'darkness')).toBe(false);

    const robbed = newEngine(2);
    give(wendigo(robbed), 'darkness');
    for (const id of [GUARDIAN_A, GUARDIAN_B]) rtOf(ctxOf(robbed), id).stealCount = 1;
    runDefending(robbed, (e) => wendigoActions(e).length >= 6, 200);
    expect(actionList(log(robbed)).some((a) => a.endsWith(':lake-eye-drops'))).toBe(false);
    expect(has(wendigo(robbed), 'darkness')).toBe(true);
  });

  it('a Guardian that has been robbed drinks no potion when it is hit', () => {
    const engine = newEngine(4);
    rtOf(ctxOf(engine), GUARDIAN_A).stealCount = 1;
    inputFor(engine, 'tidus');
    engine.submit({ kind: 'attack', targets: [GUARDIAN_A] });
    expect(actionList(log(engine))).not.toContain(`${GUARDIAN_A}:lake-auto-potion`);
    expect(actor(engine, GUARDIAN_A).hp).toBeLessThan(1_200);
  });
});

describe('Provoke and the stance', () => {
  it('a Provoked Wendigo throws the plain Attack at the Provoker (its script is not run)', () => {
    const engine = newEngine(3);
    for (const id of [GUARDIAN_A, GUARDIAN_B]) give(actor(engine, id), 'petrify');
    const d = inputFor(engine, 'tidus');
    const provoke = row(d, 'ability', 'provoke', WENDIGO);
    expect(provoke).not.toBeNull();
    engine.submit(provoke!);
    runDefending(engine, (e) => wendigoActions(e).length >= 1, 100, false);
    const starts = (log(engine) as ReadonlyArray<{ type: string; actorId?: string; abilityId?: string; command?: { kind: string }; targets?: readonly string[] }>).filter((e) => e.type === 'action-start' && e.actorId === WENDIGO);
    expect(starts[0]?.command?.kind).toBe('attack');
    expect(starts[0]?.targets).toEqual(['tidus']);
  });

  it('while the arms are up the Guardians Berserk a party member; a Berserk member\'s forced swing at Wendigo is answered by the Counter Punch', () => {
    const engine = newEngine(5);
    flags(engine)['wendigo.arms'] = true;
    flags(engine)['wendigo.armTurns'] = 0;
    wendigo(engine).hp = 8_000;
    give(wendigo(engine), 'berserk');
    runDefending(engine, (e) => ['tidus', 'yuna', 'rikku'].some((id) => has(actor(e, id), 'berserk')), 100, true);
    const casts = actionList(log(engine)).filter((a) => a.endsWith(':lake-berserk'));
    expect(casts.length).toBeGreaterThanOrEqual(1);
    expect(['tidus', 'yuna', 'rikku'].some((id) => has(actor(engine, id), 'berserk'))).toBe(true);
    // The cast went to a party member, not to Wendigo (who was Berserk already): the stance rule outranks the Berserk rule.
    const berserkEvents = (log(engine) as ReadonlyArray<{ type: string; actorId?: string; abilityId?: string; targets?: readonly string[] }>).filter((e) => e.type === 'action-start' && e.abilityId === 'lake-berserk');
    expect(berserkEvents[0]?.targets?.[0]).not.toBe(WENDIGO);
  });
});
