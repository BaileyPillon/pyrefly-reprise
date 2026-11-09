/**
 * The hidden Oblitzerator chapter on the real engine (FFX only): the opening menus, the Rush end to end (ten balls over the living front line, 32 to 39 each, neither Protect, Shell nor Defend halves them), the counters
 * through the real damage path (a Blind Ball on a swing, a Mute Ball on a cast, none at the crane), the crane line to its end (three Thunder, Use crane, 5,625 off, no turns and no counters after, the win and what it pays),
 * the Thunder Fury shortcut, and the speed-up on the clock. Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { CRANE, OBLITZERATOR, actionList, actor, callouts, crane, ctxOf, defend, flags, give, has, inputFor, log, newEngine, nextInput, oblitzerator, row, spell, swing } from '../helpers/oblitzeratorDrive.ts';

type Dmg = { type: 'damage'; targetId: string; sourceId?: string; amount: number; hitIndex?: number; hitCount?: number; affinity?: string };
const damages = (events: readonly BattleEvent[], source: string): Dmg[] => events.filter((e): e is BattleEvent & Dmg => e.type === 'damage' && (e as Dmg).sourceId === source) as Dmg[];

/** Spend every turn on a Potion for oneself (harmless, and not a Defend) until `stop` holds; the front line is topped up each step. */
function passUntil(engine: ReturnType<typeof newEngine>, stop: (e: ReturnType<typeof newEngine>) => boolean, max = 400): void {
  for (let i = 0; i < max * 12; i++) {
    if (stop(engine)) return;
    const d = nextInput(engine, true);
    engine.submit(row(d, 'item', 'potion', d.actorId) ?? defend());
  }
  throw new Error('passUntil: the stop condition never held');
}

describe('the opening', () => {
  it('Tidus\'s first menu: Attack, Cheer, Haste, the items, Defend, Use crane (aimed at the crane); Escape is a greyed row; Lulu and Kimahri have no Use crane', () => {
    const engine = newEngine(1);
    const tidus = nextInput(engine);
    expect(tidus.actorId).toBe('tidus');
    const labels = tidus.commands.map((c) => `${c.command.kind}:${'id' in c.command ? c.command.id : ''}`);
    expect(labels).toEqual(expect.arrayContaining(['attack:', 'ability:cheer', 'ability:haste', 'defend:', 'trigger:use-crane', 'escape:']));
    const use = tidus.commands.find((c) => c.command.kind === 'trigger')!;
    expect(use).toMatchObject({ label: 'Use crane', enabled: true, validTargets: [CRANE], targeting: 'single-enemy' });
    const escape = tidus.commands.find((c) => c.command.kind === 'escape')!;
    expect(escape.enabled).toBe(false);
    for (const who of ['lulu', 'kimahri']) {
      const d = inputFor(engine, who);
      expect(d.commands.some((c) => c.command.kind === 'trigger'), who).toBe(false);
    }
  });

  it('Lulu has the four first-tier spells, and every one can name the machine or the crane', () => {
    const engine = newEngine(1);
    const d = inputFor(engine, 'lulu');
    for (const id of ['fire', 'blizzard', 'thunder', 'water']) {
      const r = d.commands.find((c) => c.command.kind === 'ability' && c.command.id === id);
      expect(r?.enabled, id).toBe(true);
      expect(r!.validTargets, id).toEqual(expect.arrayContaining([OBLITZERATOR, CRANE]));
    }
    expect(swing(d, CRANE)).not.toBeNull(); // the crane is a legal target of a plain blow too
  });

  it('the crane has no turns, is not in the turn queue, and is no part of the victory; Escape and Flee are off for everyone', () => {
    const engine = newEngine(1);
    const ctx = ctxOf(engine);
    expect(rtOf(ctx, CRANE).ordersOnly).toBe(true);
    expect(rtOf(ctx, CRANE).nonCombatant).toBe(true);
    expect(rtOf(ctx, OBLITZERATOR).ordersOnly).not.toBe(true);
    passUntil(engine, (e) => actionList(log(e)).length >= 30);
    expect(actionList(log(engine)).filter((a) => a.startsWith(`${CRANE}:`))).toEqual([]);
    expect(log(engine).some((e) => e.type === 'turn-start' && e.actorId === CRANE)).toBe(false);
    expect(flags(engine)['formation.cmdOff:*:12291']).toBe(true); // Escape 0x3003
    expect(flags(engine)['formation.cmdOff:*:12312']).toBe(true); // Flee 0x3018
  });

  it('Tidus points the crane out once, on his first turn, on every seed of 1 to 12', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const engine = newEngine(seed);
      passUntil(engine, (e) => actionList(log(e)).filter((a) => a.startsWith('tidus:')).length >= 3);
      expect(callouts(engine).filter((n) => n === 'oblitzerator-point'), `seed ${seed}`).toHaveLength(1);
      const events = log(engine);
      const at = events.findIndex((e) => e.type === 'script-trigger' && e.name === 'oblitzerator-point');
      const firstTidusTurn = events.findIndex((e) => e.type === 'turn-start' && e.actorId === 'tidus');
      expect(at, `seed ${seed}`).toBeGreaterThanOrEqual(firstTidusTurn - 2);
      expect(at, `seed ${seed}: before his first action`).toBeLessThan(events.findIndex((e) => e.type === 'action-start' && e.actorId === 'tidus'));
    }
  });
});

describe('the clock and the Rush (RE 4.1, 4.2, 5)', () => {
  it('the machine throws its first Rush after five to seven of the party\'s actions on every seed of 1 to 30 (one turn per about 5.8 of theirs: AGI 1, rank 3)', () => {
    const counts: number[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      const engine = newEngine(seed);
      passUntil(engine, (e) => actionList(log(e)).some((a) => a.startsWith(`${OBLITZERATOR}:`)));
      const list = actionList(log(engine));
      const first = list.findIndex((a) => a.startsWith(`${OBLITZERATOR}:`));
      counts.push(first);
      expect(list[first], `seed ${seed}`).toBe(`${OBLITZERATOR}:blitzball-rush`);
    }
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...counts)).toBeLessThanOrEqual(7);
  });

  it('a Rush is ten damage events numbered 0 to 9 of 10, each on a living member, 32 to 39 apiece, and the ten always land (no miss)', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const engine = newEngine(seed);
      passUntil(engine, (e) => actionList(log(e)).some((a) => a.startsWith(`${OBLITZERATOR}:`)));
      const start = log(engine).findIndex((e) => e.type === 'action-start' && e.actorId === OBLITZERATOR);
      const end = log(engine).findIndex((e, i) => i > start && e.type === 'action-end' && e.actorId === OBLITZERATOR);
      const hits = damages(log(engine).slice(start, end), OBLITZERATOR);
      expect(hits, `seed ${seed}`).toHaveLength(10);
      expect(hits.map((h) => h.hitIndex).sort(), `seed ${seed}`).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const h of hits) {
        expect(['tidus', 'lulu', 'kimahri'], `seed ${seed}`).toContain(h.targetId);
        expect(h.amount, `seed ${seed} ${h.targetId}`).toBeGreaterThanOrEqual(32);
        expect(h.amount, `seed ${seed} ${h.targetId}`).toBeLessThanOrEqual(39);
        seen.add(h.targetId);
      }
      expect(log(engine).slice(start, end).some((e) => e.type === 'miss')).toBe(false);
    }
    expect(seen).toEqual(new Set(['tidus', 'lulu', 'kimahri'])); // the balls are spread, not aimed at one
  });

  it('the balls spread over the three: no member takes all ten, and each takes about a third on average over 60 Rushes', () => {
    const tally = { tidus: 0, lulu: 0, kimahri: 0 };
    let rushes = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const engine = newEngine(seed);
      passUntil(engine, (e) => actionList(log(e)).some((a) => a.startsWith(`${OBLITZERATOR}:`)));
      const start = log(engine).findIndex((e) => e.type === 'action-start' && e.actorId === OBLITZERATOR);
      const end = log(engine).findIndex((e, i) => i > start && e.type === 'action-end' && e.actorId === OBLITZERATOR);
      const hits = damages(log(engine).slice(start, end), OBLITZERATOR);
      const per = { tidus: 0, lulu: 0, kimahri: 0 } as Record<string, number>;
      for (const h of hits) per[h.targetId] = (per[h.targetId] ?? 0) + 1;
      for (const k of Object.keys(tally) as Array<keyof typeof tally>) tally[k] += per[k] ?? 0;
      expect(Math.max(...Object.values(per)), `seed ${seed}`).toBeLessThan(10);
      rushes++;
    }
    for (const k of Object.keys(tally) as Array<keyof typeof tally>) {
      expect(tally[k] / (rushes * 10), k).toBeGreaterThan(0.25);
      expect(tally[k] / (rushes * 10), k).toBeLessThan(0.42);
    }
  });

  it('neither Protect, Shell nor Defend halves a ball (damage type 0): Tidus under all three still takes 32 to 39; a Cheer does (about 21 to 25 at five stacks)', () => {
    const engine = newEngine(2);
    const tidus = actor(engine, 'tidus');
    give(tidus, 'protect');
    give(tidus, 'shell');
    passUntil(engine, (e) => actionList(log(e)).some((a) => a.startsWith(`${OBLITZERATOR}:`)), 400);
    const onTidus = damages(log(engine), OBLITZERATOR).filter((h) => h.targetId === 'tidus');
    expect(onTidus.length).toBeGreaterThan(0);
    for (const h of onTidus) expect(h.amount).toBeGreaterThanOrEqual(32);
    // A Cheer (five stacks) on the target brings a ball down.
    const cheered = newEngine(2);
    (actor(cheered, 'tidus').statuses as Record<string, unknown>)['cheer'] = { id: 'cheer', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 5, permanent: false };
    passUntil(cheered, (e) => actionList(log(e)).some((a) => a.startsWith(`${OBLITZERATOR}:`)), 400);
    const lowered = damages(log(cheered), OBLITZERATOR).filter((h) => h.targetId === 'tidus');
    expect(lowered.length).toBeGreaterThan(0);
    for (const h of lowered) {
      expect(h.amount).toBeGreaterThanOrEqual(20);
      expect(h.amount).toBeLessThanOrEqual(26);
    }
  });

  it('with Lulu down the balls spread over the two who stand', () => {
    const engine = newEngine(3);
    const lulu = actor(engine, 'lulu');
    lulu.hp = 0;
    lulu.alive = false;
    passUntil(engine, (e) => actionList(log(e)).some((a) => a.startsWith(`${OBLITZERATOR}:`)), 400);
    const start = log(engine).findIndex((e) => e.type === 'action-start' && e.actorId === OBLITZERATOR);
    const targets = new Set(damages(log(engine).slice(start), OBLITZERATOR).map((h) => h.targetId));
    expect(targets.has('lulu')).toBe(false);
  });
});

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

  it('FINDING: in this engine the ball\'s status ticks off at the end of the very turn the counter lands in (reactions run before the end-of-turn tick, `engine-end.ts#afterAction`), so Darkness and Silence do not outlast the swing; whether the game orders it so is a live check', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const engine = newEngine(seed);
      engine.submit(swing(inputFor(engine, 'kimahri'))!);
      nextInput(engine, true);
      if (!log(engine).some((e) => e.type === 'counter' && e.actorId === OBLITZERATOR)) continue;
      const after = fromSwing(engine, 'kimahri');
      const types = after.filter((e) => (e.type === 'status-add' || e.type === 'status-tick' || e.type === 'status-remove') && (e as { targetId?: string }).targetId === 'kimahri').map((e) => e.type);
      expect(types.slice(0, 3)).toEqual(['status-add', 'status-tick', 'status-remove']);
      expect(has(actor(engine, 'kimahri'), 'darkness')).toBe(false);
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
  it('three Thunders wake it, Use crane takes 5,625 off 6,000, the machine takes no turn and answers nothing after, two blows end it, and the win pays 580 gil, 36 AP and an Elixir', () => {
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
      // Two blows end it: nothing answers.
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
