/**
 * The hidden Spectral Keeper chapter on the real engine (FFX only; Tidus, Yuna and Auron on the glyph platforms, seeded): the rules of `research/re-ffx-spectral-keeper.md` as they play. Each case is an acceptance case of the
 * paper preflight (T11): First Strike, the switched-off commands, Move and the platforms, the sweep, the hit counter and the mines (lay, blast, fizzle, walking away). Aeon mode, the whole fight, determinism and a fork are in
 * `spectral-keeper-fight.test.ts`; the counter, the miss and the order of the aeon gains in `spectral-keeper-counter.test.ts`; the absence of all of it from another chapter's battle in `spectral-keeper-absence.test.ts`; winnability in `spectral-keeper-measure.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { armCircle, frontTrio, setHitCount, setMinesLive } from '../../../src/battle/ffx/platforms.ts';
import {
  KEEPER, actionList, actor, circleId, ctxOf, defend, events, flags, inputFor, invincible, keeperActions, lastSweep, move, newEngine, nextInput, party, platformOfId, row, swing, type Input,
} from '../helpers/keeperDrive.ts';

describe('the opening (RE 2.2)', () => {
  it('all three of the front line act before the Keeper does (First Strike), on platforms 1, 2 and 3', () => {
    const engine = newEngine(11);
    expect(party.map((id) => platformOfId(engine, id))).toEqual([1, 2, 3]);
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = nextInput(engine);
      seen.push(d.actorId);
      engine.submit(defend());
    }
    expect([...seen].sort()).toEqual([...party].sort());
    expect(keeperActions(engine)).toEqual([]);
    for (let i = 0; i < 12 && keeperActions(engine).length === 0; i++) {
      nextInput(engine);
      engine.submit(defend());
    }
    expect(keeperActions(engine).length).toBeGreaterThanOrEqual(1); // and then it does act
  });

  it('Escape, Flee, Guard and Sentinel are greyed for everyone and refused if submitted; Defend, Summon and Switch are not', () => {
    const engine = newEngine(12);
    const tidus = inputFor(engine, 'tidus');
    const greyed = (d: Input, label: string): boolean => d.commands.filter((c) => c.label === label).every((c) => !c.enabled);
    expect(greyed(tidus, 'Escape')).toBe(true);
    expect(greyed(tidus, 'Flee')).toBe(true);
    expect(tidus.commands.find((c) => c.command.kind === 'defend')?.enabled).toBe(true);
    expect(tidus.commands.some((c) => c.command.kind === 'switch' && c.enabled)).toBe(true);
    const before = events(engine).length;
    engine.submit({ kind: 'escape', targets: [], extra: { mode: 'single' } });
    expect(events(engine).length).toBe(before); // refused, the turn kept open

    const auron = inputFor(engine, 'auron');
    for (const label of ['Guard', 'Sentinel']) {
      const r = auron.commands.find((c) => c.label === label);
      expect(r, label).toBeDefined();
      expect(r!.enabled, label).toBe(false);
      expect(r!.disabledReason, label).toBeUndefined();
    }
    const b2 = events(engine).length;
    engine.submit({ kind: 'ability', id: 'guard', targets: [] });
    expect(events(engine).length).toBe(b2);
    expect(auron.commands.find((c) => c.label === 'Attack')?.enabled).toBe(true); // the rest of Auron's menu stands
  });

  it("a Circle's Agility is the record's 0 at the opening counters and the script's 8 afterwards, and the data is left as it was (the same fuse base in every battle)", () => {
    const first = newEngine(14);
    expect(actor(first, circleId(1)).stats.agi).toBe(8);
    expect(ENEMY_GROUPS_BY_ID['spectral-keeper']!.enemies[1]!.stats.agi).toBe(0);
    const base = (e: BattleEngine): number => (ctxOf(e).rt.actors.get(circleId(1)) as unknown as { icv: number }).icv;
    expect(base(newEngine(15))).toBe(base(first)); // the stored base does not depend on an earlier battle
    expect(base(first)).toBe(84); // [estimate]: three times the tick speed of the record's AGI 0 (RE 5.4)
  });

  it('no ordinary command can name a Circle: Attack lists the Keeper alone', () => {
    const engine = newEngine(13);
    const d = nextInput(engine);
    const attack = d.commands.find((c) => c.command.kind === 'attack')!;
    expect(attack.validTargets).toEqual([KEEPER]);
    for (const c of d.commands) if (c.command.kind !== 'trigger') expect(c.validTargets.some((id) => id.startsWith('spectral-circle')), c.label).toBe(false);
  });
});

describe('Move and the platforms (RE 3)', () => {
  it('Move is offered to the front line, lists the free ring platforms (4, 5 and 6 at the start), and takes a free one', () => {
    const engine = newEngine(21);
    const d = inputFor(engine, 'tidus');
    const row0 = d.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'move')!;
    expect(row0.enabled).toBe(true);
    expect(row0.validTargets).toEqual([circleId(4), circleId(5), circleId(6)]);
    expect(move(d, 1)).toBeNull(); // his own platform is not a target
    expect(move(d, 2)).toBeNull(); // nor is an occupied one

    const result = engine.submit(move(d, 5)!);
    const hop = result.find((e) => e.type === 'platform');
    expect(hop).toMatchObject({ type: 'platform', who: 'tidus', from: 1, to: 5 });
    expect(platformOfId(engine, 'tidus')).toBe(5);
    const next = inputFor(engine, 'yuna');
    const targets = next.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'move')!.validTargets;
    expect(targets).toContain(circleId(1)); // the vacated platform is free again
    expect(targets).not.toContain(circleId(5));
  });

  it('Move costs the character\'s turn at rank 3, the cost of a plain Attack', () => {
    const a = newEngine(22);
    const b = newEngine(22);
    const da = inputFor(a, 'tidus');
    const db = inputFor(b, 'tidus');
    a.submit(move(da, 4)!);
    b.submit(swing(db)!);
    const tidusTick = (e: ReturnType<typeof newEngine>): number => e.predictTurnOrder(12).find((p) => p.actorId === 'tidus')!.tickValue;
    expect(tidusTick(a)).toBe(tidusTick(b));
  });

  it('a Move onto a platform in a refused aim spends the turn and says so (the legality is the handler\'s)', () => {
    const engine = newEngine(23);
    const d = inputFor(engine, 'tidus');
    const bad: Command = { kind: 'trigger', id: 'move', targets: [circleId(2)] }; // Yuna stands on 2
    engine.submit(bad);
    expect(platformOfId(engine, 'tidus')).toBe(1);
    expect(events(engine).some((e) => e.type === 'message' && /cannot step there/.test(e.text))).toBe(true);
    expect(d.actorId).toBe('tidus');
  });

  it('a Switch hands the platform to the member coming in', () => {
    const engine = newEngine(24);
    const d = inputFor(engine, 'yuna');
    const sw = d.commands.find((c) => c.command.kind === 'switch' && c.command.extra.inId === 'wakka' && c.enabled)!;
    engine.submit(sw.command);
    expect(platformOfId(engine, 'wakka')).toBe(2);
    const wakka = nextInput(engine);
    expect(wakka.actorId).toBe('wakka');
    expect(wakka.commands.some((c) => c.command.kind === 'trigger' && c.command.id === 'move' && c.enabled)).toBe(true); // Move belongs to all seven
  });

  it('a KO keeps its platform; an Eject frees it', () => {
    const engine = newEngine(25);
    inputFor(engine, 'tidus');
    const tidus = actor(engine, 'tidus');
    tidus.statuses['ko'] = { id: 'ko', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    tidus.hp = 0;
    tidus.alive = false;
    const d1 = inputFor(engine, 'yuna');
    const t1 = d1.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'move')!.validTargets;
    expect(t1).not.toContain(circleId(1)); // his body still holds it
    tidus.statuses['eject'] = { id: 'eject', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    const d2 = inputFor(engine, 'auron');
    const t2 = d2.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'move')!.validTargets;
    expect(t2).toContain(circleId(1));
  });
});

describe('the sweep (RE 4.5)', () => {
  it('the front trios are the platform in front and its two neighbours, wrapping 6 to 1', () => {
    expect(frontTrio(1)).toEqual([1, 2, 6]);
    expect(frontTrio(2)).toEqual([2, 3, 1]);
    expect(frontTrio(3)).toEqual([3, 4, 2]);
    expect(frontTrio(4)).toEqual([4, 5, 3]);
    expect(frontTrio(5)).toEqual([5, 6, 4]);
    expect(frontTrio(6)).toEqual([6, 1, 5]);
  });

  it('after a damaging hit the Keeper sweeps exactly the living members standing on the three platforms in front, for each of the six fronts', () => {
    for (let front = 1; front <= 6; front++) {
      const engine = newEngine(30 + front);
      flags(engine)['plat.front'] = front;
      const d = nextInput(engine);
      engine.submit(swing(d)!);
      const zone = frontTrio(front);
      const expected = party.filter((id) => zone.includes(platformOfId(engine, id) ?? 0));
      expect([...lastSweep(engine)].sort(), `front ${front}`).toEqual([...expected].sort());
    }
  });

  it('a command that cannot change HP draws no sweep and counts for nothing (Provoke)', () => {
    const engine = newEngine(41);
    const d = nextInput(engine);
    const provoke = row(d, 'ability', 'provoke', KEEPER)!;
    expect(provoke).not.toBeNull();
    engine.submit(provoke);
    expect(lastSweep(engine)).toEqual([]);
    expect(flags(engine)['plat.count']).toBe(0);
  });

  it('a Provoked Keeper keeps its script: its tail goes to the Provoker, whoever else lives (RE 4.1)', () => {
    const engine = newEngine(44);
    const d = inputFor(engine, 'auron');
    engine.submit(row(d, 'ability', 'provoke', KEEPER) ?? defend()); // Auron has no Provoke: Tidus does
    const t = inputFor(engine, 'tidus');
    engine.submit(row(t, 'ability', 'provoke', KEEPER)!);
    expect(actor(engine, KEEPER).statuses['provoke']).toBeDefined();
    let tail: Extract<BattleEvent, { type: 'action-start' }> | undefined;
    for (let i = 0; i < 40 && !tail; i++) {
      nextInput(engine);
      engine.submit(defend());
      tail = events(engine).find((e): e is Extract<BattleEvent, { type: 'action-start' }> => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'keeper-berserk-tail');
    }
    expect(tail?.targets).toEqual(['tidus']);
    expect(flags(engine)['plat.front']).toBe(platformOfId(engine, 'tidus'));
  });

  it('an Overdrive is one hit event: one sweep, and the counter gains one', () => {
    const engine = newEngine(42);
    const tidus = inputFor(engine, 'tidus');
    const t = actor(engine, 'tidus');
    t.overdrive!.gauge = 100;
    const od = nextInput(engine, true);
    expect(od.actorId).toBe('tidus');
    const overdrive = od.commands.find((c) => c.command.kind === 'overdrive' && c.enabled);
    expect(overdrive, 'Tidus has an Overdrive ready').toBeDefined();
    const sweepsBefore = keeperActions(engine).filter((a) => a === 'keeper-attack-all').length;
    engine.submit({ ...overdrive!.command, targets: [KEEPER] } as never);
    expect(keeperActions(engine).filter((a) => a === 'keeper-attack-all').length - sweepsBefore).toBe(1);
    expect(flags(engine)['plat.count']).toBe(1);
    expect(tidus.actorId).toBe('tidus');
  });

  it('the Keeper\'s tail makes its target\'s platform the platform in front', () => {
    const engine = newEngine(43);
    let tail: BattleEvent | undefined;
    for (let i = 0; i < 40 && !tail; i++) {
      engine.submit(defend());
      nextInput(engine);
      tail = events(engine).find((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'keeper-berserk-tail');
    }
    expect(tail && tail.type === 'action-start').toBe(true);
    const victim = (tail as Extract<BattleEvent, { type: 'action-start' }>).targets[0]!;
    expect(flags(engine)['plat.front']).toBe(platformOfId(engine, victim));
  });
});

describe('the mines (RE 4.3, 5)', () => {
  it('the counter reaches 4, and on the Keeper\'s next turn it lays two mines instead of using the tail, resets the counter, and lights two distinct ring platforms', () => {
    const engine = newEngine(51);
    setHitCount(ctxOf(engine), 4);
    for (let i = 0; i < 12 && !keeperActions(engine).includes('keeper-glyph-mine'); i++) {
      nextInput(engine);
      engine.submit(defend());
    }
    const lay = events(engine).find((e) => e.type === 'action-start' && e.abilityId === 'keeper-glyph-mine');
    expect(lay && lay.type === 'action-start').toBe(true);
    const picked = (lay as Extract<BattleEvent, { type: 'action-start' }>).targets;
    expect(picked).toHaveLength(2);
    expect(new Set(picked).size).toBe(2);
    for (const id of picked) expect(/^spectral-circle-[1-6]$/.test(id)).toBe(true);
    expect(flags(engine)['plat.mines']).toBe(2);
    expect(flags(engine)['plat.count']).toBe(0);
    for (const id of picked) expect(flags(engine)[`plat.armed.${id}`]).toBe(true);
    expect(keeperActions(engine).indexOf('keeper-glyph-mine')).toBe(0); // the first Keeper turn after the counter was set
  });

  it('while a mine is live it lays no more, and the counter stays above 4 (it falls through to the tail)', () => {
    const engine = newEngine(52);
    const ctx = ctxOf(engine);
    armCircle(ctx, circleId(6));
    setMinesLive(ctx, 1);
    setHitCount(ctx, 9);
    const keeperTurns = (): number => keeperActions(engine).length;
    for (let i = 0; i < 12 && keeperTurns() < 1; i++) {
      nextInput(engine);
      engine.submit(defend());
    }
    expect(keeperActions(engine)[0]).toBe('keeper-berserk-tail');
    expect(flags(engine)['plat.count'] as number).toBeGreaterThanOrEqual(9); // not reset (a Berserk party member's own swing may add to it)
    expect(keeperActions(engine)).not.toContain('keeper-glyph-mine');
  });

  it('an armed Circle\'s own turn is the blast: it kills whoever stands on its platform at that moment (Death 255), then it is disarmed and the live count goes down', () => {
    const engine = newEngine(53);
    const ctx = ctxOf(engine);
    armCircle(ctx, circleId(3)); // Auron stands on 3
    setMinesLive(ctx, 1);
    let blasted = false;
    for (let i = 0; i < 80 && !blasted; i++) {
      invincible(engine);
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') engine.submit(defend());
      blasted = actionList(events(engine)).includes(`${circleId(3)}:keeper-mine-blast`);
    }
    expect(blasted).toBe(true);
    const ko = events(engine).find((e) => e.type === 'ko' && e.targetId === 'auron');
    expect(ko).toBeDefined();
    expect(actor(engine, 'auron').statuses['ko']).toBeDefined();
    expect(flags(engine)['plat.armed.' + circleId(3)]).toBe(false);
    expect(flags(engine)['plat.mines']).toBe(0);
  });

  it('walking away is the defence: a mine on an empty platform fizzles and nobody falls', () => {
    const engine = newEngine(54);
    const ctx = ctxOf(engine);
    armCircle(ctx, circleId(1)); // Tidus stands on 1
    setMinesLive(ctx, 1);
    const d = inputFor(engine, 'tidus');
    engine.submit(move(d, 5)!);
    let done = false;
    for (let i = 0; i < 80 && !done; i++) {
      invincible(engine);
      const n = engine.nextDecision();
      if (n.kind === 'battle-over') break;
      if (n.kind === 'player-input') engine.submit(defend());
      done = actionList(events(engine)).some((a) => a.startsWith(`${circleId(1)}:`));
    }
    expect(actionList(events(engine))).toContain(`${circleId(1)}:keeper-mine-fizzle`);
    expect(events(engine).some((e) => e.type === 'ko')).toBe(false);
    expect(flags(engine)['plat.mines']).toBe(0);
  });

  it('you can Move onto a ticking mine, and it kills you (RE 3 item 4)', () => {
    const engine = newEngine(55);
    const ctx = ctxOf(engine);
    armCircle(ctx, circleId(4));
    setMinesLive(ctx, 1);
    const d = inputFor(engine, 'tidus');
    expect(move(d, 4)).not.toBeNull();
    engine.submit(move(d, 4)!);
    let blasted = false;
    for (let i = 0; i < 80 && !blasted; i++) {
      invincible(engine);
      const n = engine.nextDecision();
      if (n.kind === 'battle-over') break;
      if (n.kind === 'player-input') engine.submit(defend());
      blasted = actionList(events(engine)).includes(`${circleId(4)}:keeper-mine-blast`);
    }
    expect(blasted).toBe(true);
    expect(events(engine).some((e) => e.type === 'ko' && e.targetId === 'tidus')).toBe(true);
  });

  it('an idle Circle is never on the turn list and never takes a turn; an armed one is and does', () => {
    const engine = newEngine(56);
    const d0 = nextInput(engine);
    expect(engine.predictTurnOrder(40).some((p) => p.actorId.startsWith('spectral-circle'))).toBe(false);
    expect(d0.actorId).toBeDefined();
    armCircle(ctxOf(engine), circleId(5));
    setMinesLive(ctxOf(engine), 1);
    expect(engine.predictTurnOrder(40).some((p) => p.actorId === circleId(5))).toBe(true);
  });
});
