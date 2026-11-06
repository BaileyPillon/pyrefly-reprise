/**
 * Penance's rules on the REAL engine (FFX only; the hidden Penance chapter; `research/re-ffx-penance.md` section 5): the seeded battle, the party's actions through the real menu, and the log read afterwards. Every rule has its
 * RE number beside it. The arms (their turns, death and return) are `penance-arms.test.ts`; the other formations' absence and determinism are `penance-absence.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../../src/battle/common/types.ts';
import {
  ARMS,
  LEFT_ARM,
  PENANCE,
  RIGHT_ARM,
  actionList,
  actions,
  actor,
  counter,
  ctxOf,
  defend,
  flags,
  invincible,
  log,
  newEngine,
  nextInput,
  penanceActionsWithArms,
  phase,
  row,
  swing,
  turnClock,
} from '../helpers/penanceDrive.ts';

/** One Tidus swing at Penance, the others defending, until it has been struck once (the party is untouchable for the mechanic). */
function oneSwing(e: ReturnType<typeof newEngine>, target: string = PENANCE, ward = true): void {
  for (let i = 0; i < 80; i++) {
    const d = nextInput(e, ward);
    const c = d.actorId === 'tidus' ? swing(d, target) : null;
    if (c) return void e.submit(c);
    e.submit(defend());
  }
  throw new Error('Tidus never had a turn');
}

/** Defend until Penance has taken `n` actions of its own (Separation excluded). */
function untilPenanceActs(e: ReturnType<typeof newEngine>, n: number, max = 400): void {
  const count = (): number => actions(log(e), PENANCE).filter((a) => a !== 'penance-separation').length;
  for (let i = 0; i < max && count() < n; i++) {
    nextInput(e);
    e.submit(defend());
  }
  if (count() < n) throw new Error(`Penance acted ${count()} times, not ${n}`);
}

describe('the opening', () => {
  it('Penance starts with Protect on, the phase and the counter at 0, 12,000,000 HP; the arms start with nothing', () => {
    const e = newEngine(1);
    expect(actor(e, PENANCE).hp).toBe(12_000_000);
    expect(Object.keys(actor(e, PENANCE).statuses)).toEqual(['protect']);
    expect([phase(e), counter(e)]).toEqual([0, 0]);
    for (const id of ARMS) {
      expect(actor(e, id).hp).toBe(500_000);
      expect(Object.keys(actor(e, id).statuses)).toEqual([]);
    }
  });

  it('the party is tidus, yuna and rikku at the caps with Luck 85, Auto-Haste and Auto-Protect on; the bench is auron, wakka, lulu, kimahri', () => {
    const e = newEngine(1);
    expect(e.state().activeIds).toEqual(['tidus', 'yuna', 'rikku']);
    expect(e.state().reserveIds).toEqual(['auron', 'wakka', 'lulu', 'kimahri']);
    for (const id of e.state().activeIds) {
      const c = actor(e, id);
      expect(c.stats).toMatchObject({ maxHp: 9_999, maxMp: 999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, luck: 85 });
      expect(Object.keys(c.statuses)).toEqual(expect.arrayContaining(['haste', 'protect']));
    }
  });

  it('no Escape (the pick P6) and no Flee: the row is greyed', () => {
    const e = newEngine(1);
    const d = nextInput(e, false);
    const escape = d.commands.find((c) => c.command.kind === 'escape');
    expect(escape?.enabled).toBe(false);
  });
});

describe('phase 1: Obliteration, and nothing else, on the whole front line (RE 5.2)', () => {
  it('twelve turns of Penance are twelve Obliterations, each aimed at all three, with no counter', () => {
    const e = newEngine(2);
    untilPenanceActs(e, 12);
    const ev = log(e);
    const own = ev.filter((x): x is Extract<BattleEvent, { type: 'action-start' }> => x.type === 'action-start' && x.actorId === PENANCE);
    expect(own.length).toBeGreaterThanOrEqual(12);
    for (const a of own) expect(a.abilityId).toBe('penance-obliteration');
    // each Obliteration lands on all three: three damage events, one per member, after its action-start
    for (const at of ev.flatMap((x, i) => (x.type === 'action-start' && x.actorId === PENANCE ? [i] : [])).slice(0, 10)) {
      const hit = ev.slice(at, at + 30).filter((x) => x.type === 'damage' && x.sourceId === PENANCE).map((x) => (x.type === 'damage' ? x.targetId : ''));
      expect([...new Set(hit)].sort()).toEqual(['rikku', 'tidus', 'yuna']);
    }
    expect([phase(e), counter(e)]).toEqual([0, 0]);
  });

  it('Obliteration is physical, so Auto-Protect halves it, and the Slow it carries does not land on Auto-Haste', () => {
    const e = newEngine(2);
    for (const id of e.state().activeIds) actor(e, id).hp = actor(e, id).stats.maxHp;
    untilPenanceActs(e, 1);
    const hits = log(e).filter((x) => x.type === 'damage' && x.sourceId === PENANCE);
    expect(hits.length).toBeGreaterThanOrEqual(3);
    for (const h of hits) if (h.type === 'damage') expect(h.amount, 'under Auto-Protect, 10,481 to 11,835 (RE 4.2), before any Defense +20 percent').toBeLessThan(12_000);
    for (const id of e.state().activeIds) expect(Object.keys(actor(e, id).statuses), id).not.toContain('slow');
  });
});

describe('the change: strictly below three quarters, on a damaging hit (RE 5.2)', () => {
  /** A fresh battle with Penance `hp` points above the line before ONE capped (99,999) hit lands on it. */
  function afterOneHit(seed: number, hpAfter: number): ReturnType<typeof newEngine> {
    const e = newEngine(seed);
    actor(e, PENANCE).hp = hpAfter + 99_999;
    oneSwing(e);
    return e;
  }

  it('9,000,001 left: nothing. Exactly 9,000,000: nothing (not below). 8,999,999: the change', () => {
    expect(actor(afterOneHit(3, 9_000_001), PENANCE).hp).toBe(9_000_001);
    expect(phase(afterOneHit(3, 9_000_001))).toBe(0);
    expect(phase(afterOneHit(3, 9_000_000))).toBe(0);
    expect(actor(afterOneHit(3, 9_000_000), PENANCE).hp).toBe(9_000_000);
    const e = afterOneHit(3, 8_999_999);
    expect(actor(e, PENANCE).hp).toBe(8_999_999);
    expect(phase(e)).toBe(1);
  });

  it('a hit that does no damage to it (Scan) changes nothing even when it is already under the line; the next damaging hit makes the change', () => {
    const e = newEngine(3);
    actor(e, PENANCE).hp = 8_000_000;
    let scanned = false;
    for (let i = 0; i < 40 && !scanned; i++) {
      const d = nextInput(e);
      const c = d.actorId === 'yuna' ? row(d, 'ability', 'scan', PENANCE) : null;
      if (c) {
        e.submit(c);
        scanned = true;
        continue;
      }
      e.submit(defend());
    }
    expect(scanned).toBe(true);
    expect(phase(e)).toBe(0);
    oneSwing(e);
    expect(phase(e)).toBe(1);
  });

  it('at the change: Separation on itself, Protect off, Haste for one turn, the split painting, exactly once', () => {
    const e = afterOneHit(4, 8_900_000);
    const ev = log(e);
    expect(actions(ev, PENANCE)).toContain('penance-separation');
    const sep = ev.find((x) => x.type === 'action-start' && x.abilityId === 'penance-separation');
    expect(sep && sep.type === 'action-start' ? [...sep.targets] : null).toEqual([PENANCE]);
    expect(Object.keys(actor(e, PENANCE).statuses)).not.toContain('protect');
    expect(ev.some((x) => x.type === 'status-remove' && x.targetId === PENANCE && x.status === 'protect')).toBe(true);
    const haste = ev.find((x) => x.type === 'status-add' && x.targetId === PENANCE && x.status === 'haste');
    expect(haste && haste.type === 'status-add' ? haste.instance.turnsRemaining : null).toBe(1);
    const changes = ev.filter((x) => x.type === 'form-change');
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ enemyId: PENANCE, spriteKey: 'penance-split' });
    expect(actor(e, PENANCE).spriteKey).toBe('penance-split');
    expect(actor(e, PENANCE).hp).toBe(8_900_000); // a scene, not a heal: the engine's own form change would have handed it fresh HP
    // more hits, more turns: still one change, one Separation
    untilPenanceActs(e, 6);
    oneSwing(e);
    expect(log(e).filter((x) => x.type === 'form-change')).toHaveLength(1);
    expect(actions(log(e), PENANCE).filter((a) => a === 'penance-separation')).toHaveLength(1);
  });

  it('the Haste lasts one turn: Penance\'s first turn after the change is shorter than the ones after it', () => {
    const e = afterOneHit(4, 8_900_000);
    untilPenanceActs(e, 5);
    const turns = turnClock(log(e)).filter((t) => t.actor === PENANCE);
    // the clock reading of each Penance turn: the gaps are what each turn cost it (the rank-3 cost at Agility 255 is 9 ticks, or 4 under Haste)
    const gaps = turns.slice(1).map((t, i) => t.tick - (turns[i] as { tick: number }).tick);
    expect(gaps.length).toBeGreaterThanOrEqual(3);
    expect(gaps.filter((g) => g < 9), 'exactly one shortened turn, and it is the first after the change').toEqual([4]);
    expect(gaps.findIndex((g) => g < 9)).toBe(0);
  });
});

describe('phase 2: Immolation on one living member, the counter, and Judgment Day (RE 5.2)', () => {
  /** A battle already in phase 2, the counter set, the party unkillable by anything short of Judgment Day. */
  function inPhase2(seed: number, startCounter = 0, ward = true): ReturnType<typeof newEngine> {
    const e = newEngine(seed);
    actor(e, PENANCE).hp = 8_900_000 + 99_999;
    oneSwing(e, PENANCE, ward);
    expect(phase(e)).toBe(1);
    flags(e)['pen.counter'] = startCounter;
    return e;
  }

  it('its turns are Immolations, each on ONE member, and the counter gains 1 for each of them', () => {
    const e = inPhase2(5);
    const before = actions(log(e), PENANCE).length;
    untilPenanceActs(e, 8);
    const turns = log(e).filter((x): x is Extract<BattleEvent, { type: 'action-start' }> => x.type === 'action-start' && x.actorId === PENANCE && x.abilityId === 'penance-immolation');
    expect(turns.length).toBeGreaterThanOrEqual(1);
    for (const t of turns) expect(t.targets).toHaveLength(1);
    expect(actions(log(e), PENANCE).slice(before).every((a) => a === 'penance-immolation')).toBe(true);
  });

  it('Immolation takes the member\'s MP and breaks its armour and its mind, in the same action', () => {
    const e = inPhase2(6, 0, false);
    for (const id of e.state().activeIds) {
      actor(e, id).stats.maxHp = 99_999;
      actor(e, id).hp = 99_999;
    }
    // no ward this time: the party stands as built, with room for the blow
    for (let i = 0; i < 200 && !actions(log(e), PENANCE).includes('penance-immolation'); i++) {
      const d = e.nextDecision();
      if (d.kind === 'player-input') e.submit(defend());
      if (d.kind === 'battle-over') break;
    }
    const ev = log(e);
    const at = ev.findIndex((x) => x.type === 'action-start' && x.abilityId === 'penance-immolation');
    expect(at).toBeGreaterThanOrEqual(0);
    const start = ev[at] as Extract<BattleEvent, { type: 'action-start' }>;
    const end = ev.findIndex((x, i) => i > at && x.type === 'action-end');
    const mine = ev.slice(at, end < 0 ? at + 40 : end);
    const victim = start.targets[0]!;
    expect(start.targets).toHaveLength(1);
    expect(mine.some((x) => x.type === 'mp-damage' && x.targetId === victim && x.amount > 0)).toBe(true);
    const got = mine.flatMap((x) => (x.type === 'status-add' && x.targetId === victim ? [x.status] : []));
    expect(got).toEqual(expect.arrayContaining(['armor-break', 'mental-break']));
  });

  it('every damaging action that reaches Penance adds 1 to the counter (a Scan adds nothing); the change\'s own hit added nothing', () => {
    const e = inPhase2(7);
    expect(counter(e)).toBe(0); // the hit that made the change did not count
    const c0 = counter(e);
    oneSwing(e);
    expect(counter(e) - c0, 'one swing, one point (plus any Penance turn taken meanwhile)').toBeGreaterThanOrEqual(1);
  });

  it('Judgment Day: with the counter at 19, the next Penance turn makes it 20 and, both arms up, is Judgment Day on all three: 99,999 HP and 999 MP each, Protect or no Protect; the counter goes to 0', () => {
    const e = inPhase2(8, 19);
    for (let i = 0; i < 200 && !actions(log(e), PENANCE).includes('penance-judgment-day'); i++) {
      for (const id of e.state().activeIds) {
        actor(e, id).stats.maxHp = 99_999;
        actor(e, id).hp = 99_999;
      }
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(defend());
    }
    const ev = log(e);
    expect(actions(ev, PENANCE)).toContain('penance-judgment-day');
    const jd = ev.findIndex((x) => x.type === 'action-start' && x.abilityId === 'penance-judgment-day');
    const after = ev.slice(jd, jd + 40);
    const dmg = after.filter((x): x is Extract<BattleEvent, { type: 'damage' }> => x.type === 'damage' && x.sourceId === PENANCE);
    expect(dmg.map((x) => x.targetId).sort()).toEqual(['rikku', 'tidus', 'yuna']);
    expect(dmg.map((x) => x.amount)).toEqual([99_999, 99_999, 99_999]);
    const mp = after.filter((x): x is Extract<BattleEvent, { type: 'mp-damage' }> => x.type === 'mp-damage' && x.sourceId === PENANCE);
    expect(mp.map((x) => x.amount)).toEqual([999, 999, 999]);
    expect(counter(e)).toBe(0);
  });

  it('with an arm down on that turn it is an Immolation and the counter is not spent; the first Penance turn with both arms up is the Judgment Day', () => {
    const e = inPhase2(9, 30);
    actor(e, RIGHT_ARM).hp = 1;
    oneSwing(e, RIGHT_ARM); // the arm falls (and will stand again 12 ticks later)
    expect(actor(e, RIGHT_ARM).alive).toBe(false);
    for (let i = 0; i < 300 && !actions(log(e), PENANCE).includes('penance-judgment-day'); i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') {
        invincible(e);
        e.submit(defend());
      }
    }
    const walk = penanceActionsWithArms(log(e));
    expect(walk.length).toBeGreaterThanOrEqual(1);
    for (const w of walk) {
      if (w.ability === 'penance-judgment-day') expect([w.right, w.left], 'Judgment Day with an arm down').toEqual([true, true]);
      if (!w.right || !w.left) expect(w.ability, 'a turn with an arm down').toBe('penance-immolation');
    }
    const jdAt = walk.findIndex((w) => w.ability === 'penance-judgment-day');
    expect(jdAt, 'it came as soon as both arms were up').toBeGreaterThanOrEqual(0);
    expect(walk.slice(0, jdAt).filter((w) => w.right && w.left)).toEqual([]);
  });

  it('over a long fight the rule holds on every Penance turn: Judgment Day only with both arms up, and never an Obliteration after the change', () => {
    const e = inPhase2(10, 10);
    for (let i = 0; i < 400; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      invincible(e);
      if (d.actorId === 'tidus' && (i % 3 === 0)) {
        const target = actor(e, RIGHT_ARM).alive ? RIGHT_ARM : actor(e, LEFT_ARM).alive ? LEFT_ARM : PENANCE;
        const c = swing(d, target);
        if (c) {
          e.submit(c);
          continue;
        }
      }
      e.submit(defend());
    }
    const walk = penanceActionsWithArms(log(e));
    expect(walk.length).toBeGreaterThan(5);
    for (const w of walk.filter((x) => x.ability !== 'penance-obliteration')) {
      if (w.ability === 'penance-judgment-day') expect([w.right, w.left]).toEqual([true, true]);
    }
    expect(actionList(log(e)).filter((a) => a === 'penance:penance-obliteration').length, 'Obliterations all came before the change').toBeLessThanOrEqual(actionList(log(e)).findIndex((a) => a === 'penance:penance-separation') + 1 || 99);
    expect(ctxOf(e).state.flags['pen.phase']).toBe(1);
  });
});
