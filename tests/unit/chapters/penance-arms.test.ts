/**
 * The Right and Left Arms on the REAL engine (FFX only; the hidden Penance chapter; `research/re-ffx-penance.md` section 5.3), and what happens to them and to Penance when they die: the turn count and its writes, the roll,
 * the three moves of each, the death hook (Atrophy, the re-initialisation, the 12-tick return, the loot of every death, a Doom death), and Penance's own death taking both with it.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent } from '../../../src/battle/common/types.ts';
import { queueMembers } from '../../../src/battle/ffx/turnQueue.ts';
import { LEFT_ARM, PENANCE, RIGHT_ARM, actor, ctxOf, defend, flags, log, newEngine, nextInput, row, swing, turnClock } from '../helpers/penanceDrive.ts';

type Action = Extract<BattleEvent, { type: 'action-start' }>;
const startsOf = (e: BattleEngine, who: string): Action[] => log(e).filter((x): x is Action => x.type === 'action-start' && x.actorId === who);

/** Defend (warded party) until `who` has started `n` actions; the first `n` of them. */
function untilActs(e: BattleEngine, who: string, n: number, max = 600): Action[] {
  for (let i = 0; i < max && startsOf(e, who).length < n; i++) {
    nextInput(e);
    e.submit(defend());
  }
  if (startsOf(e, who).length < n) throw new Error(`${who} acted ${startsOf(e, who).length} times, not ${n}`);
  return startsOf(e, who).slice(0, n);
}

/** The same without the ward: the party stands as built (its statuses land, its HP is its own). */
function untilActsRaw(e: BattleEngine, who: string, n: number, max = 600): Action[] {
  for (let i = 0; i < max && startsOf(e, who).length < n; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') e.submit(defend());
  }
  if (startsOf(e, who).length < n) throw new Error(`${who} acted ${startsOf(e, who).length} times, not ${n}`);
  return startsOf(e, who).slice(0, n);
}

/** Tidus swings at `target` until it is no longer standing (the others defend). */
function strike(e: BattleEngine, target: string, max = 200): void {
  for (let i = 0; i < max && actor(e, target).alive; i++) {
    const d = nextInput(e);
    const c = d.actorId === 'tidus' ? swing(d, target) : null;
    if (c) e.submit(c);
    else e.submit(defend());
  }
  if (actor(e, target).alive) throw new Error(`${target} would not fall`);
}

describe('an arm\'s turn (RE 5.3)', () => {
  it('turn 1 writes Strength and Agility 255 before the action; Haste comes from turn 2 and lasts one turn', () => {
    const e = newEngine(11);
    expect([actor(e, RIGHT_ARM).stats.str, actor(e, RIGHT_ARM).stats.agi]).toEqual([200, 150]);
    untilActs(e, RIGHT_ARM, 1);
    expect([actor(e, RIGHT_ARM).stats.str, actor(e, RIGHT_ARM).stats.agi]).toEqual([255, 255]);
    const hastes = (): number => log(e).filter((x) => x.type === 'status-add' && x.targetId === RIGHT_ARM && x.status === 'haste').length;
    expect(hastes(), 'no Haste before the first action').toBe(0);
    untilActs(e, RIGHT_ARM, 4);
    expect(hastes(), 'one Haste per turn from the second: three for four actions').toBe(3);
    const grant = log(e).find((x) => x.type === 'status-add' && x.targetId === RIGHT_ARM && x.status === 'haste');
    expect(grant && grant.type === 'status-add' ? grant.instance.turnsRemaining : null).toBe(1);
  });

  it('the Right Arm\'s roll is one in three: Attack (Petrify), Calamity, Mighty Guard (300 seeds)', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 300; seed++) {
      const e = newEngine(seed);
      const first = untilActs(e, RIGHT_ARM, 1)[0]!;
      tally[first.abilityId ?? '?'] = (tally[first.abilityId ?? '?'] ?? 0) + 1;
    }
    expect(Object.keys(tally).sort()).toEqual(['dark-calamity', 'dark-sandy-attack', 'penance-mighty-guard']);
    for (const n of Object.values(tally)) {
      expect(n).toBeGreaterThan(70);
      expect(n).toBeLessThan(130);
    }
  });

  it('the Left Arm\'s roll is one in three: the dispelling Attack, Tera Graviton, Slowga (300 seeds)', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 300; seed++) {
      const e = newEngine(seed);
      const first = untilActs(e, LEFT_ARM, 1)[0]!;
      tally[first.abilityId ?? '?'] = (tally[first.abilityId ?? '?'] ?? 0) + 1;
    }
    expect(Object.keys(tally).sort()).toEqual(['dark-cindy-attack', 'penance-tera-graviton', 'slowga']);
    for (const n of Object.values(tally)) {
      expect(n).toBeGreaterThan(70);
      expect(n).toBeLessThan(130);
    }
  });

  it('the Right Arm does not cast a second Mighty Guard while Penance has Regen: Attack and Calamity only, two to one (300 seeds)', () => {
    const tally: Record<string, number> = {};
    for (let seed = 1; seed <= 300; seed++) {
      const e = newEngine(seed);
      actor(e, PENANCE).statuses['regen'] = { id: 'regen', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
      const first = untilActs(e, RIGHT_ARM, 1)[0]!;
      tally[first.abilityId ?? '?'] = (tally[first.abilityId ?? '?'] ?? 0) + 1;
    }
    expect(tally['penance-mighty-guard']).toBeUndefined();
    expect(tally['dark-sandy-attack']).toBeGreaterThan(160);
    expect(tally['dark-sandy-attack']).toBeLessThan(240);
    expect(tally['dark-calamity']).toBeGreaterThan(70);
    expect(tally['dark-calamity']).toBeLessThan(130);
  });

  it('Mighty Guard puts Shell and Regen on Penance, itself and the Left Arm (Protect on whichever lacks it); with the Left Arm down it reaches the other two', () => {
    let both: Action | undefined;
    let alone: Action | undefined;
    for (let seed = 1; seed <= 200 && (both === undefined || alone === undefined); seed++) {
      const e = newEngine(seed);
      const first = untilActs(e, RIGHT_ARM, 1)[0]!;
      if (first.abilityId === 'penance-mighty-guard' && both === undefined) {
        both = first;
        const statuses = (id: string): string[] => Object.keys(actor(e, id).statuses);
        for (const id of [PENANCE, RIGHT_ARM, LEFT_ARM]) expect(statuses(id), id).toEqual(expect.arrayContaining(['shell', 'regen', 'protect']));
        // a status spell: no damage event at all (a `magic` row of power 0 would draw a "0" numeral on each of the three)
        const at = log(e).findIndex((x) => x === first);
        const end = log(e).findIndex((x, i) => i > at && x.type === 'action-end');
        expect(log(e).slice(at, end < 0 ? at + 60 : end).filter((x) => x.type === 'damage'), 'Mighty Guard emits no damage event').toEqual([]);
      }
      const e2 = newEngine(seed);
      const left = actor(e2, LEFT_ARM); // the Left Arm is down (and stays down: no return armed), as the game's flag says
      left.hp = 0;
      left.alive = false;
      left.removed = true;
      const next = untilActs(e2, RIGHT_ARM, 1)[0]!;
      if (next.abilityId === 'penance-mighty-guard' && alone === undefined) alone = next;
    }
    expect(both).toBeDefined();
    expect([...both!.targets].sort()).toEqual([LEFT_ARM, PENANCE, RIGHT_ARM].sort());
    expect(alone).toBeDefined();
    expect([...alone!.targets].sort()).toEqual([PENANCE, RIGHT_ARM].sort());
  });

  it('Slowga is cast while a living member is not Slowed; with all three Slowed the roll-2 turn is the dispelling Attack instead', () => {
    const slowed = { id: 'slow', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as const;
    const tally = { free: {} as Record<string, number>, allSlowed: {} as Record<string, number> };
    for (let seed = 1; seed <= 300; seed++) {
      const a = newEngine(seed);
      tally.free[untilActs(a, LEFT_ARM, 1)[0]!.abilityId ?? '?'] = (tally.free[untilActs(a, LEFT_ARM, 1)[0]!.abilityId ?? '?'] ?? 0) + 1;
      const b = newEngine(seed);
      for (const id of b.state().activeIds) {
        delete actor(b, id).statuses['haste']; // a Slowed member has no Auto-Haste on
        actor(b, id).statuses['slow'] = { ...slowed };
      }
      const k = untilActs(b, LEFT_ARM, 1)[0]!.abilityId ?? '?';
      tally.allSlowed[k] = (tally.allSlowed[k] ?? 0) + 1;
    }
    expect(tally.free['slowga']).toBeGreaterThan(70);
    expect(tally.allSlowed['slowga']).toBeUndefined();
    expect(tally.allSlowed['dark-cindy-attack']).toBeGreaterThan(160); // two in three
    expect(tally.allSlowed['penance-tera-graviton']).toBeGreaterThan(70);
  });

  it('Tera Graviton takes three quarters of each member\'s maximum HP (7,499 of 9,999) and Dooms them; Sleep, Silence and Darkness land too', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const e = newEngine(seed);
      const first = untilActsRaw(e, LEFT_ARM, 1)[0]!;
      if (first.abilityId !== 'penance-tera-graviton') continue;
      const ev = log(e);
      const at = ev.indexOf(first);
      const mine = ev.slice(at, at + 40);
      const dmg = mine.filter((x): x is Extract<BattleEvent, { type: 'damage' }> => x.type === 'damage' && x.sourceId === LEFT_ARM);
      expect(dmg.map((x) => x.amount)).toEqual([7_499, 7_499, 7_499]);
      const got = new Set(mine.flatMap((x) => (x.type === 'status-add' && x.sourceId === undefined ? [x.status] : [])));
      for (const s of ['doom', 'sleep', 'silence', 'darkness']) expect(got.has(s as never), s).toBe(true);
      return;
    }
    throw new Error('no Tera Graviton in 100 seeds');
  });

  it('the Right Arm\'s Attack Petrifies, and a Petrified member is shattered by the next blow (Soft or Esuna has to come first)', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const e = newEngine(seed);
      const first = untilActsRaw(e, RIGHT_ARM, 1)[0]!;
      if (first.abilityId !== 'dark-sandy-attack') continue;
      const ev = log(e);
      const hit = ev.slice(ev.indexOf(first), ev.indexOf(first) + 30).find((x) => x.type === 'status-add' && x.status === 'petrify');
      expect(hit, 'petrified').toBeDefined();
      return;
    }
    throw new Error('no Attack in 100 seeds');
  });
});

describe('an arm\'s death and return (RE 5.3, derived: 12 ticks)', () => {
  it('it falls: Atrophy, off the field (hidden from the cursor and the clock), the return armed 12 ticks ahead at its full 500,000', () => {
    const e = newEngine(12);
    actor(e, RIGHT_ARM).hp = 50_000;
    const t0 = e.state().ticks;
    strike(e, RIGHT_ARM);
    const arm = actor(e, RIGHT_ARM);
    expect([arm.alive, arm.removed]).toEqual([false, true]);
    expect(log(e).some((x) => x.type === 'message' && x.text === 'Right Arm withers')).toBe(true);
    const pending = ctxOf(e).rt.pendingPartRevivals.filter((p) => p.id === RIGHT_ARM);
    expect(pending).toHaveLength(1);
    expect(pending[0]!.maxHp).toBe(500_000);
    expect(pending[0]!.atTicks - e.state().ticks).toBeLessThanOrEqual(12);
    expect(pending[0]!.atTicks).toBeGreaterThan(t0);
    expect(queueMembers(ctxOf(e)).map((c) => c.id)).not.toContain(RIGHT_ARM);
    const d = nextInput(e);
    for (const r of d.commands) expect(r.validTargets, `${r.command.kind}`).not.toContain(RIGHT_ARM);
  });

  it('it returns whole: 500,000 HP, no status, Strength 200 and Agility 150 again, its turn count 0, the clock having run 12 ticks from its death', () => {
    const e = newEngine(13);
    actor(e, RIGHT_ARM).hp = 50_000;
    untilActs(e, RIGHT_ARM, 2); // two actions: its buffs are on, Haste is granted
    strike(e, RIGHT_ARM);
    const death = e.state().ticks;
    const killedAt = log(e).length;
    for (let i = 0; i < 100 && !log(e).slice(killedAt).some((x) => x.type === 'part-restored'); i++) {
      nextInput(e);
      e.submit(defend());
    }
    const back = log(e).slice(killedAt).find((x) => x.type === 'part-restored');
    expect(back).toMatchObject({ partId: RIGHT_ARM, hp: 500_000 });
    const arm = actor(e, RIGHT_ARM);
    expect(arm.alive).toBe(true);
    expect(arm.hp).toBe(500_000);
    expect(Object.keys(arm.statuses)).toEqual([]);
    expect([arm.stats.str, arm.stats.agi]).toEqual([200, 150]);
    expect(e.state().ticks - death, 'back no earlier than 12 ticks after the death').toBeGreaterThanOrEqual(12);
    expect(ctxOf(e).rt.actors.get(RIGHT_ARM)?.ai['turns']).toBe(0);
    // its next action is its first again: the buffs come back, and there is no Haste before it
    const before = startsOf(e, RIGHT_ARM).length;
    const hastesBefore = log(e).filter((x) => x.type === 'status-add' && x.targetId === RIGHT_ARM && x.status === 'haste').length;
    untilActs(e, RIGHT_ARM, before + 1);
    expect([actor(e, RIGHT_ARM).stats.str, actor(e, RIGHT_ARM).stats.agi]).toEqual([255, 255]);
    expect(log(e).filter((x) => x.type === 'status-add' && x.targetId === RIGHT_ARM && x.status === 'haste').length, 'no Haste on the first action after the return').toBe(hastesBefore);
  });

  it('while it is down a Penance turn comes first sometimes and the arm second: the gap is 12 ticks, Penance\'s turn 9 (the clock is the same one)', () => {
    const e = newEngine(14);
    actor(e, RIGHT_ARM).hp = 50_000;
    strike(e, RIGHT_ARM);
    for (let i = 0; i < 60; i++) {
      nextInput(e);
      e.submit(defend());
    }
    const clock = turnClock(log(e));
    const penance = clock.filter((t) => t.actor === PENANCE).map((t) => t.tick);
    const gaps = penance.slice(1).map((t, i) => t - (penance[i] as number));
    expect(gaps.every((g) => g === 9)).toBe(true);
  });

  it('every death pays: the arm\'s AP (10,000) and its drop, again each time it falls', () => {
    const e = newEngine(15);
    const kills = (): number => ctxOf(e).rt.rewards?.kills ?? 0;
    const ap = (): number => ctxOf(e).rt.rewards?.baseAp ?? 0;
    actor(e, RIGHT_ARM).hp = 50_000;
    strike(e, RIGHT_ARM);
    expect([kills(), ap()], 'a capped Celestial blow is 99,999, the overkill threshold: 12,000 AP, not 10,000').toEqual([1, 12_000]);
    for (let i = 0; i < 100 && !actor(e, RIGHT_ARM).alive === true && ctxOf(e).rt.pendingPartRevivals.length > 0; i++) {
      nextInput(e);
      e.submit(defend());
    }
    expect(actor(e, RIGHT_ARM).alive).toBe(true);
    actor(e, RIGHT_ARM).hp = 50_000;
    strike(e, RIGHT_ARM);
    expect([kills(), ap()]).toEqual([2, 24_000]);
  });

  it('a Doom death is a death like any other: the arm falls at its own turn, pays, and returns', () => {
    const e = newEngine(16);
    actor(e, LEFT_ARM).statuses['doom'] = { id: 'doom', turnsRemaining: 1, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    for (let i = 0; i < 200 && actor(e, LEFT_ARM).alive; i++) {
      nextInput(e);
      e.submit(defend());
    }
    expect(actor(e, LEFT_ARM).alive).toBe(false);
    expect(ctxOf(e).rt.pendingPartRevivals.filter((p) => p.id === LEFT_ARM)).toHaveLength(1);
    expect(ctxOf(e).rt.rewards?.baseAp).toBe(10_000);
    for (let i = 0; i < 100 && !actor(e, LEFT_ARM).alive; i++) {
      nextInput(e);
      e.submit(defend());
    }
    expect(actor(e, LEFT_ARM).alive).toBe(true);
    expect(actor(e, LEFT_ARM).hp).toBe(500_000);
  });

  it('while an arm waits to return, a Phoenix Down cannot reach it (it is off the field)', () => {
    const e = newEngine(17);
    actor(e, RIGHT_ARM).hp = 50_000;
    strike(e, RIGHT_ARM);
    const d = nextInput(e);
    expect(row(d, 'item', 'phoenix-down', RIGHT_ARM)).toBeNull();
  });
});

describe('Penance falls (RE 5.2, 7)', () => {
  it('its death ends the battle in victory with both arms standing; the arms are taken off the field, do not return and are not paid again', () => {
    const e = newEngine(18);
    actor(e, PENANCE).hp = 1;
    let over = false;
    for (let i = 0; i < 80 && !over; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') {
        over = true;
        expect(d.result.outcome).toBe('victory');
        break;
      }
      if (d.kind !== 'player-input') continue;
      invincibleParty(e);
      const c = d.actorId === 'tidus' ? swing(d, PENANCE) : null;
      e.submit(c ?? defend());
    }
    expect(over).toBe(true);
    for (const id of [RIGHT_ARM, LEFT_ARM]) expect([actor(e, id).alive, actor(e, id).removed, actor(e, id).hp], id).toEqual([false, true, 0]);
    expect(ctxOf(e).rt.pendingPartRevivals).toEqual([]);
    expect(log(e).filter((x) => x.type === 'part-restored')).toEqual([]);
    expect(ctxOf(e).rt.rewards?.kills).toBe(1); // Penance alone
    expect(ctxOf(e).rt.rewards?.baseAp).toBeGreaterThanOrEqual(60_000);
    expect(flags(e)['pen.phase']).toBe(0);
  });

  it('an arm that is down when Penance falls stays down (Atrophy, no return)', () => {
    const e = newEngine(19);
    actor(e, RIGHT_ARM).hp = 50_000;
    strike(e, RIGHT_ARM);
    actor(e, PENANCE).hp = 1;
    for (let i = 0; i < 80; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      invincibleParty(e);
      const c = d.actorId === 'tidus' ? swing(d, PENANCE) : null;
      e.submit(c ?? defend());
    }
    expect(e.state().result?.outcome).toBe('victory');
    expect(ctxOf(e).rt.pendingPartRevivals).toEqual([]);
    expect(actor(e, RIGHT_ARM).alive, 'the arm that was down when Penance fell is still down').toBe(false);
    expect(actor(e, RIGHT_ARM).removed).toBe(true);
    expect(actor(e, LEFT_ARM).alive, 'the standing arm went with Penance').toBe(false);
  });
});

/** Keep the three in front alive and free of the statuses that would end a test about something else. */
function invincibleParty(e: BattleEngine): void {
  for (const id of e.state().activeIds) {
    const c = actor(e, id);
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
    for (const s of ['petrify', 'doom', 'armor-break'] as const) {
      c.immunities[s] = 255;
      delete c.statuses[s];
    }
  }
}
