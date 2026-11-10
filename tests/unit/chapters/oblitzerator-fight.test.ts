/**
 * The hidden Oblitzerator chapter on the real engine (FFX only), the fight: the counters through the real damage path (a Blind Ball on a swing, a Mute Ball on a cast, none at the crane, and a ball's status that
 * outlasts the swing; its order against the tick is `oblitzerator-order.test.ts`), the crane line to its end on seeds 1 to 3 (three Thunder, Use crane, 5,625 off, no turns and no counters after, the win and what it pays), the slog to its end on seeds 1 to 3 (no
 * crane: the same payout, the crane untouched), the Thunder Fury shortcut, the speed-up on the clock, determinism and a lost fight. The opening and the Rush are `oblitzerator-engine.test.ts`. Rule 3: every claim is proved
 * by running the engine.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { rankOf } from '../../../src/battle/ffx/state.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { CRANE, OBLITZERATOR, actionList, actor, callouts, crane, damages, defend, flags, give, has, inputFor, log, newEngine, nextInput, oblitzerator, passUntil, row, spell, swing } from '../helpers/oblitzeratorDrive.ts';
import { LINES, play } from '../helpers/oblitzeratorBot.ts';

describe('the counters through the real damage path (RE 4.2)', () => {
  /** The events from the swing's `action-start` on: the swing, the ball it drew, the status the ball put on and the end-of-turn tick that took it off. */
  const fromSwing = (engine: ReturnType<typeof newEngine>, who: string): BattleEvent[] => {
    const events = log(engine);
    return events.slice(events.findIndex((e) => e.type === 'action-start' && e.actorId === who));
  };

  it('a swing at the machine draws a Blind Ball on the swinger about one time in three, for a ball\'s damage (power 10: about 80 to 100) and Darkness 254 for duration code 1 (seeds 1 to 150)', () => {
    let answered = 0;
    let verified = false;
    for (let seed = 1; seed <= 150; seed++) {
      const engine = newEngine(seed);
      const d = inputFor(engine, 'kimahri');
      engine.submit(swing(d)!);
      nextInput(engine, true);
      const events = log(engine);
      const balls = events.filter((e) => e.type === 'counter' && e.actorId === OBLITZERATOR);
      if (balls.length === 0) continue;
      answered += 1;
      expect(balls).toHaveLength(1);
      expect(balls[0]).toMatchObject({ abilityId: 'blind-ball', targetId: 'kimahri' });
      if (!verified) {
        verified = true;
        const after = fromSwing(engine, 'kimahri');
        const ball = damages(after, OBLITZERATOR).find((h) => h.targetId === 'kimahri')!;
        expect(ball.amount).toBeGreaterThanOrEqual(80);
        expect(ball.amount).toBeLessThanOrEqual(100);
        const added = after.find((e) => e.type === 'status-add' && e.targetId === 'kimahri' && e.status === 'darkness') as unknown as { instance: { turnsRemaining: number } };
        expect(added.instance.turnsRemaining).toBe(1); // duration code 1: the record's own byte
      }
    }
    expect(answered / 150).toBeGreaterThan(0.22);
    expect(answered / 150).toBeLessThan(0.45);
  });

  it('the ball\'s status outlasts the swing, as the game orders it (the ball runs after the swinger\'s end-of-turn tick: `oblitzerator-order.test.ts`): Darkness is added once in the swing\'s own events and is still on afterwards', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const engine = newEngine(seed);
      engine.submit(swing(inputFor(engine, 'kimahri'))!);
      nextInput(engine, true);
      if (!log(engine).some((e) => e.type === 'counter' && e.actorId === OBLITZERATOR)) continue;
      const after = fromSwing(engine, 'kimahri');
      const types = after.filter((e) => (e.type === 'status-add' || e.type === 'status-tick' || e.type === 'status-remove') && (e as { targetId?: string }).targetId === 'kimahri').map((e) => e.type);
      expect(types).toEqual(['status-add']);
      expect(has(actor(engine, 'kimahri'), 'darkness')).toBe(true);
      return;
    }
    throw new Error('no Blind Ball in 150 seeds');
  });

  it('a Thunder at the machine is its weakness (454 to 513 for Lulu at this build) and draws a Mute Ball about one time in three: a ball\'s damage (power 7) and Silence 254 for duration code 1 (seeds 1 to 150)', () => {
    let answered = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const engine = newEngine(seed);
      const d = inputFor(engine, 'lulu');
      engine.submit(spell(d, 'thunder', OBLITZERATOR)!);
      nextInput(engine, true);
      const events = log(engine);
      const hit = damages(events, 'lulu').find((h) => h.targetId === OBLITZERATOR)!;
      expect(hit.affinity).toBe('weak');
      expect(hit.amount, `seed ${seed}`).toBeGreaterThanOrEqual(454);
      expect(hit.amount, `seed ${seed}`).toBeLessThanOrEqual(513);
      const balls = events.filter((e) => e.type === 'counter' && e.actorId === OBLITZERATOR);
      if (balls.length === 0) continue;
      answered += 1;
      expect(balls[0]).toMatchObject({ abilityId: 'mute-ball', targetId: 'lulu' });
      const after = fromSwing(engine, 'lulu');
      const ball = damages(after, OBLITZERATOR).find((h) => h.targetId === 'lulu')!;
      expect(ball.amount).toBeGreaterThanOrEqual(55);
      expect(ball.amount).toBeLessThanOrEqual(75);
      expect(after.some((e) => e.type === 'status-add' && e.targetId === 'lulu' && e.status === 'silence')).toBe(true);
    }
    expect(answered / 150).toBeGreaterThan(0.22);
    expect(answered / 150).toBeLessThan(0.45);
  });

  it('a Silenced Lulu cannot cast and an Echo Screen cures it; Eye Drops cure Darkness (the rows work whenever the status is on)', () => {
    const engine = newEngine(1);
    give(actor(engine, 'lulu'), 'silence');
    give(actor(engine, 'kimahri'), 'darkness');
    const d = inputFor(engine, 'lulu');
    const thunder = d.commands.find((c) => c.command.kind === 'ability' && c.command.id === 'thunder')!;
    expect(thunder.enabled).toBe(false);
    expect(thunder.disabledReason).toBe('Silenced');
    engine.submit(row(d, 'item', 'echo-screen', 'lulu')!);
    nextInput(engine, true);
    expect(has(actor(engine, 'lulu'), 'silence')).toBe(false);
    const k = inputFor(engine, 'tidus');
    engine.submit(row(k, 'item', 'eye-drops', 'kimahri')!);
    nextInput(engine, true);
    expect(has(actor(engine, 'kimahri'), 'darkness')).toBe(false);
  });

  it('Fire, Blizzard and Water are resisted (151 to 171 for Lulu), and a cast at the CRANE draws nothing on any of 120 seeds', () => {
    const engine = newEngine(5);
    const d = inputFor(engine, 'lulu');
    engine.submit(spell(d, 'fire', OBLITZERATOR)!);
    nextInput(engine, true);
    const fire = damages(log(engine), 'lulu').find((h) => h.targetId === OBLITZERATOR)!;
    expect(fire.affinity).toBe('resist');
    expect(fire.amount).toBeGreaterThanOrEqual(151);
    expect(fire.amount).toBeLessThanOrEqual(171);
    for (let seed = 1; seed <= 120; seed++) {
      const e = newEngine(seed);
      const di = inputFor(e, 'lulu');
      e.submit(spell(di, 'thunder', CRANE)!);
      nextInput(e, true);
      expect(log(e).some((x) => x.type === 'counter' && x.actorId === OBLITZERATOR), `seed ${seed}`).toBe(false);
      expect(crane(e).hp, `seed ${seed}: the crane swallows Thunder`).toBe(65_535);
    }
  });
});

describe('the crane line to its end, seeds 1 to 3 (RE 4.5)', () => {
  it('three Thunders wake it, Use crane takes 5,625 off 6,000, the machine takes no turn and answers nothing after, a few blows end it, and the win pays 580 gil, 36 AP and an Elixir', () => {
    for (const seed of [1, 2, 3]) {
      const engine = newEngine(seed);
      for (let k = 1; k <= 3; k++) {
        const d = inputFor(engine, 'lulu');
        engine.submit(spell(d, 'thunder', CRANE)!);
        nextInput(engine, true);
        expect(flags(engine)['oblitzerator.thunders'], `seed ${seed} cast ${k}`).toBe(Math.min(k, 2));
        expect(flags(engine)['oblitzerator.crane'], `seed ${seed} cast ${k}`).toBe(k === 3 ? 1 : 0);
      }
      expect(callouts(engine).filter((n) => n !== 'oblitzerator-point')).toEqual(['oblitzerator-responds-1', 'oblitzerator-responds-2', 'oblitzerator-powered']);
      // Tidus uses the crane. The Oblitzerator has taken no blow, so it stands on its 6,000 unless a Rush has not been counted: it takes no damage from the party at all.
      const full = oblitzerator(engine).hp;
      expect(full).toBe(6_000);
      const d = inputFor(engine, 'tidus');
      const before = oblitzeratorActs(engine);
      engine.submit(row(d, 'trigger', 'use-crane', CRANE)!);
      nextInput(engine, true);
      expect(oblitzerator(engine).hp, `seed ${seed}`).toBe(375);
      const lift = damages(log(engine), CRANE);
      expect(lift).toHaveLength(1);
      expect(lift[0]).toMatchObject({ targetId: OBLITZERATOR, amount: 5_625 });
      expect(callouts(engine)).toContain('oblitzerator-lifted');
      expect(flags(engine)['oblitzerator.crane']).toBe(2);
      expect(crane(engine).flags.untargetable).toBe(true);
      // The key is spent, the crane can no longer be named, and the machine acts no more.
      const d2 = inputFor(engine, 'tidus');
      expect(d2.commands.some((c) => c.command.kind === 'trigger')).toBe(false);
      expect(d2.commands.find((c) => c.command.kind === 'attack')!.validTargets).toEqual([OBLITZERATOR]);
      passUntil(engine, (e) => actionList(log(e)).filter((a) => a.startsWith('tidus:') || a.startsWith('lulu:') || a.startsWith('kimahri:')).length >= 14 + 0 * seed, 400);
      expect(oblitzeratorActs(engine)).toBe(before);
      // A few blows end it: nothing answers.
      const finishing = row(inputFor(engine, 'kimahri'), 'attack', undefined, OBLITZERATOR)!;
      const mark = log(engine).length;
      engine.submit(finishing);
      type Result = { outcome: string; gil: number; ap: number; drops: Array<{ itemId: string; count: number }> };
      const held: { result: Result | null } = { result: null };
      for (let i = 0; i < 200 && held.result === null; i++) {
        const dd = engine.nextDecision();
        if (dd.kind === 'battle-over') held.result = dd.result as unknown as Result;
        else if (dd.kind === 'player-input') engine.submit(row(dd, 'attack', undefined, OBLITZERATOR) ?? defend());
      }
      const result = held.result;
      expect(log(engine).slice(mark).some((e) => e.type === 'counter' && e.actorId === OBLITZERATOR), `seed ${seed}: nothing answers`).toBe(false);
      expect(result?.outcome, `seed ${seed}`).toBe('victory');
      expect(oblitzerator(engine).hp).toBe(0);
      expect(crane(engine).hp, 'the crane is untouched and no part of the victory').toBe(65_535);
      expect(result!.gil).toBe(580);
      expect(result!.ap).toBe(36);
      expect(result!.drops.some((x) => x.itemId === 'elixir')).toBe(true);
    }
  });

  it('Use crane before the crane has power: the line, no damage, the turn spent, the key stays', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'tidus');
    const hpBefore = oblitzerator(engine).hp;
    engine.submit(row(d, 'trigger', 'use-crane', CRANE)!);
    nextInput(engine, true);
    expect(callouts(engine)).toContain('oblitzerator-no-power');
    expect(oblitzerator(engine).hp).toBe(hpBefore);
    expect(flags(engine)['oblitzerator.crane']).toBe(0);
    expect(log(engine).some((e) => e.type === 'action-start' && e.actorId === CRANE)).toBe(false);
    const again = inputFor(engine, 'tidus');
    expect(again.commands.some((c) => c.command.kind === 'trigger' && c.enabled)).toBe(true);
  });

  it('a Thunder Fury wakes the crane at once (16 hits spread over the machine and the crane; the hits that fall on the crane are what count)', () => {
    let powered = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const engine = newEngine(seed);
      const lulu = actor(engine, 'lulu');
      lulu.overdrive!.gauge = 100;
      const d = inputFor(engine, 'lulu');
      const fury = d.commands.find((c) => c.command.kind === 'overdrive' && c.command.id === 'thunder-fury');
      if (!fury) throw new Error('Lulu has no Thunder Fury row at a full gauge');
      engine.submit({ ...fury.command, targets: [OBLITZERATOR] } as never);
      nextInput(engine, true);
      const hitsOnCrane = damages(log(engine), 'lulu').filter((h) => h.targetId === CRANE).length;
      const events = log(engine);
      if (hitsOnCrane > 0 || events.some((e) => e.type === 'heal' && (e as { targetId?: string }).targetId === CRANE)) {
        expect(flags(engine)['oblitzerator.crane'], `seed ${seed}`).toBe(1);
        powered += 1;
      }
    }
    expect(powered).toBeGreaterThan(10);
  });

  it('killing the machine any other way wins the same: the crane is no part of the victory and untouched', () => {
    const engine = newEngine(4);
    oblitzerator(engine).hp = 100;
    const d = inputFor(engine, 'tidus');
    engine.submit(swing(d)!);
    const held: { result: { outcome: string } | null } = { result: null };
    for (let i = 0; i < 100 && held.result === null; i++) {
      const dd = engine.nextDecision();
      if (dd.kind === 'battle-over') held.result = dd.result as unknown as { outcome: string };
      else if (dd.kind === 'player-input') engine.submit(row(dd, 'attack', undefined, OBLITZERATOR) ?? defend());
    }
    expect(held.result?.outcome).toBe('victory');
    expect(flags(engine)['oblitzerator.crane']).toBe(0);
  });
});

describe('the speed-up on the clock (RE 4.2)', () => {
  it('under a third of its HP the machine acts about twice as often: more turns in the same ticks than at full health', () => {
    const turnsIn = (hp: number): number => {
      const engine = newEngine(6);
      oblitzerator(engine).hp = hp;
      // A hit that leaves it under the line steps its Agility (the script runs on the hit); the first blow is Kimahri's swing.
      let swung = false;
      for (let i = 0; i < 2000; i++) {
        const d = nextInput(engine, true);
        if (!swung && d.actorId === 'kimahri') {
          engine.submit(swing(d)!);
          swung = true;
        } else engine.submit(row(d, 'item', 'potion', d.actorId) ?? defend());
        if (engine.state().ticks > 1200) break;
      }
      return actionList(log(engine)).filter((a) => a.startsWith(`${OBLITZERATOR}:blitzball-rush`)).length;
    };
    const slow = turnsIn(5_000);
    const fast = turnsIn(1_800);
    expect(fast).toBeGreaterThan(slow * 1.5);
  });

  it('a hit that leaves it at 1,999 steps its Agility from 1 to 16; one that leaves it at 499 steps it again to 26 (on the engine\'s own clock)', () => {
    const engine = newEngine(7);
    const o = oblitzerator(engine);
    o.hp = 2_100;
    engine.submit(swing(inputFor(engine, 'kimahri'))!);
    nextInput(engine, true);
    expect(o.hp).toBeLessThan(2_000);
    expect(o.stats.agi).toBe(16);
    o.hp = 560;
    engine.submit(swing(inputFor(engine, 'tidus'))!);
    nextInput(engine, true);
    expect(o.hp).toBeLessThan(500);
    expect(o.stats.agi).toBe(26);
  });
});

/** The machine's own actions so far. */
function oblitzeratorActs(engine: ReturnType<typeof newEngine>): number {
  return actionList(log(engine)).filter((a) => a.startsWith(`${OBLITZERATOR}:`)).length;
}

describe('determinism and a lost fight', () => {
  it('the same seed gives the same log twice', () => {
    const run = (): string => {
      const engine = newEngine(11);
      passUntil(engine, (e) => actionList(log(e)).length >= 40);
      return JSON.stringify(log(engine).map((e) => [e.type, (e as { actorId?: string }).actorId, (e as { amount?: number }).amount]));
    };
    expect(run()).toBe(run());
  });

  it('a party left to the machine goes down (a defeat is the retry card), and the battle ends', () => {
    const engine = newEngine(8);
    let outcome: string | null = null;
    for (let i = 0; i < 4000 && outcome === null; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') outcome = d.result.outcome;
      else if (d.kind === 'player-input') engine.submit(defend());
    }
    expect(outcome).toBe('defeat');
  });
});

describe('the slog to its end, seeds 1 to 3, and what Use crane costs', () => {
  it('with no crane at all the machine is worn down by blows and Thunder, with the party healed: it wins every seed, the payout is the same 580 gil, 36 AP and an Elixir, and the crane is untouched and dark', () => {
    for (const seed of [1, 2, 3]) {
      const engine = newEngine(seed);
      type Result = { outcome: string; gil: number; ap: number; drops: Array<{ itemId: string; count: number }> };
      const held: { result: Result | null } = { result: null };
      for (let i = 0; i < 4000 && held.result === null; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') held.result = d.result as unknown as Result;
        else if (d.kind === 'player-input') engine.submit(slogChoice(engine, d));
      }
      const result = held.result;
      expect(result?.outcome, `seed ${seed}`).toBe('victory');
      expect(oblitzerator(engine).hp).toBe(0);
      expect(crane(engine).hp, 'the crane is untouched').toBe(65_535);
      expect(flags(engine)['oblitzerator.crane'], 'and dark').toBe(0);
      expect([result!.gil, result!.ap]).toEqual([580, 36]);
      expect(result!.drops.some((x) => x.itemId === 'elixir')).toBe(true);
      expect(actionList(log(engine)).filter((a) => a.startsWith(`${OBLITZERATOR}:`)).length, `seed ${seed}: it threw more than the one Rush the crane line takes`).toBeGreaterThan(1);
    }
  });

  it('the bench\'s slog line with the cures agrees: seeds 1 to 3 are victories (the slog without them is the bench\'s to report: a Silenced Lulu loses her Thunder for a turn)', () => {
    for (const seed of [1, 2, 3]) expect(play(seed, LINES['slog-cure']!).outcome).toBe('victory');
  });

  it('Use crane costs a rank-3 turn (the table has no rank byte for 0x3102, and the game then uses 3)', () => {
    const def = ALL_ABILITIES.find((a) => a.id === 'use-crane')!;
    expect(def.record?.rank).toBe(0);
    expect(rankOf(def)).toBe(3);
  });
});

/** The slog's choice: Lulu casts Thunder at the machine, the others swing, anyone under 45 percent gets a Potion (a fallen member a Phoenix Down), and a Silenced Lulu or a Darkened member gets the cure the guides name. */
function slogChoice(engine: ReturnType<typeof newEngine>, d: ReturnType<typeof inputFor>): import('../../../src/battle/common/types.ts').Command {
  const party = engine.state().activeIds.map((id) => actor(engine, id));
  const down = party.find((c) => !c.alive || c.hp <= 0);
  const hurt = party.filter((c) => c.hp < c.stats.maxHp * 0.45).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  const tended = down ? row(d, 'item', 'phoenix-down', down.id) : hurt ? row(d, 'item', 'potion', hurt.id) : null; // none left: the slog goes on without
  if (tended) return tended;
  const mute = party.find((c) => c.id === 'lulu' && has(c, 'silence'));
  const echo = mute ? row(d, 'item', 'echo-screen', mute.id) : null; // none left: the slog goes on without
  if (echo) return echo;
  const blind = party.find((c) => has(c, 'darkness'));
  const drops = blind ? row(d, 'item', 'eye-drops', blind.id) : null;
  if (drops) return drops;
  if (d.actorId === 'lulu') return spell(d, 'thunder', OBLITZERATOR) ?? swing(d) ?? defend();
  return swing(d) ?? defend();
}
