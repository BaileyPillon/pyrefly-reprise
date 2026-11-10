/**
 * The hidden Oblitzerator chapter on the real engine (FFX only), the opening and the clock: the menus (Use crane Tidus's alone, aimed at the crane; Escape a greyed row), the crane that takes no turns, Tidus's first-turn
 * line, the machine's first Rush after five to seven of the party's actions, the Rush end to end (ten balls over the living front line, 32 to 39 each, neither Protect, Shell nor Defend halves them, a Cheer does). The
 * counters, the crane line to its end and the speed-up are `oblitzerator-fight.test.ts`. Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';

import { rtOf } from '../../../src/battle/ffx/state.ts';
import { CRANE, OBLITZERATOR, actionList, actor, callouts, ctxOf, damages, flags, give, inputFor, log, newEngine, nextInput, passUntil, swing } from '../helpers/oblitzeratorDrive.ts';

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
