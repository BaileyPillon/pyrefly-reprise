/**
 * The hidden counter on the REAL engine, pinned to the number (FFX only; the hidden Penance chapter; `research/re-ffx-penance.md` section 5.2, "RE 5.2"). The counter decides the fight (Judgment Day comes the first Penance
 * turn on which it reads 20 or more with both arms up), and it is the one number the player never sees, so a test that only says "it grew" lets a threshold of 15 to 20, or a step of 2, pass. These tests read the exact
 * sequence of Penance's moves and the exact counter after them:
 *
 * - the threshold: from a start of 16, 17, 18, 19 or 20, Penance's moves up to and including the first Judgment Day are exactly the ones that a threshold of 20 and a step of 1 per turn give;
 * - the bookkeeping: at every point the counter is its start plus the Penance turns taken plus the damaging actions that reached it (never more, never fewer), over many seeds, with the arms' Mighty Guard in some of them
 *   (its group cast emits damage events of 0, which must add nothing);
 * - one action is one point, however many hits it has (Tidus's Slice & Dice has six on its one target);
 * - with an arm down on the turn the counter reaches 20 or more, there is no Judgment Day and the counter keeps growing;
 * - Judgment Day resets the counter to 0 (the party is given room to live through one, so the count after it can be read).
 *
 * The party here is the Penance party **without the Celestial weapons' own counters and formula** (the weapons' Evade & Counter and Magic Counter answer a blow with a 99,999 hit on whoever struck, Penance included,
 * which would add points of its own): the counter's rule is the engine's, the party is the test's.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { penanceBuild } from '../../../src/data/ffx/builds/penance.ts';
import { type Input, LEFT_ARM, PENANCE, RIGHT_ARM, actions, actor, counter, defend, flags, log, newEngine, phase, row, swing } from '../helpers/penanceDrive.ts';

/** The reaction abilities a Celestial weapon carries (they would strike Penance back on a blow it landed on a wielder). */
const COUNTERS: readonly string[] = ['counterattack', 'evade-and-counter', 'magic-counter'];

/** The Penance party with plain weapons (no counters, no Celestial formula), Tidus's Overdrive gauge full. */
function quietParty(): FFXPartyBuild {
  const party = structuredClone(penanceBuild);
  for (const m of party.members) {
    const weapon = { ...m.equipment.weapon, autoAbilities: m.equipment.weapon.autoAbilities.filter((a) => !COUNTERS.includes(a)) };
    delete weapon.weaponRow;
    m.equipment.weapon = weapon;
    if (m.id === 'tidus') m.overdrive = { ...m.overdrive, gauge: 100 };
  }
  return party;
}

/** Every one of the party stands again at `hp` (a number past Judgment Day's 99,999) and free of the statuses the enemy side inflicts. */
function ward(e: BattleEngine, hp = 99_999): void {
  for (const id of e.state().activeIds) {
    const c = actor(e, id);
    c.stats.maxHp = hp;
    c.hp = hp;
    for (const s of ['petrify', 'doom', 'armor-break', 'mental-break', 'power-break', 'magic-break', 'poison', 'curse', 'sleep', 'silence', 'darkness'] as const) {
      c.immunities[s] = 255;
      delete c.statuses[s];
    }
  }
}

/** The next decision; null when the battle is over. The ward is put up first, so a blow from the enemy side meets a standing party. */
function step(e: BattleEngine, hp?: number): Input | null {
  for (let i = 0; i < 1500; i++) {
    ward(e, hp);
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'player-input') return d;
  }
  throw new Error('no player input');
}

/** Take the arm off the field for good (no return armed): the game's "arm down" flag stays 1. */
function armDown(e: BattleEngine, id: string): void {
  const c = actor(e, id);
  c.hp = 0;
  c.alive = false;
  c.removed = true;
}

/** A battle in phase 2 (the change made by a real hit), the counter set to `start`, and the log marker after it. */
function inPhase2(seed: number, start: number): { e: BattleEngine; mark: number } {
  const e = newEngine(seed, quietParty());
  actor(e, PENANCE).hp = 8_990_000; // already under the line: the next damaging hit is the change
  for (let i = 0; i < 80 && phase(e) === 0; i++) {
    const d = step(e);
    if (!d) throw new Error('the battle ended before the change');
    const c = d.actorId === 'tidus' ? swing(d, PENANCE) : null;
    e.submit(c ?? defend());
  }
  expect(phase(e)).toBe(1);
  flags(e)['pen.counter'] = start;
  return { e, mark: actions(log(e), PENANCE).length };
}

/** Penance's moves since `mark` (the Separation of the change is before it). */
const moves = (e: BattleEngine, mark: number): string[] => actions(log(e), PENANCE).slice(mark);

const IMMOLATION = 'penance-immolation';
const JUDGMENT = 'penance-judgment-day';

type Start = Extract<BattleEvent, { type: 'action-start' }>;

/** The actions started in `events` that did damage (above 0) to `target`, counted once each however many hits they had. */
function damagingActionsOn(events: readonly BattleEvent[], target: string): number {
  let current: Start | null = null;
  const seen = new Set<Start>();
  for (const ev of events) {
    if (ev.type === 'action-start') current = ev;
    else if (ev.type === 'damage' && ev.targetId === target && ev.amount > 0 && current !== null && current.actorId !== target) seen.add(current);
  }
  return seen.size;
}

describe('the threshold: Judgment Day on the first Penance turn that finds the counter at 20 or more, with both arms up (RE 5.2)', () => {
  const sequences: Array<[number, string[]]> = [
    [16, [IMMOLATION, IMMOLATION, IMMOLATION, JUDGMENT]], // 17, 18, 19, then 20
    [17, [IMMOLATION, IMMOLATION, JUDGMENT]],
    [18, [IMMOLATION, JUDGMENT]],
    [19, [JUDGMENT]], // 19 + 1 = 20 on this very turn
    [20, [JUDGMENT]],
    [27, [JUDGMENT]],
  ];
  for (const [start, expected] of sequences) {
    it(`from a counter of ${start}: ${expected.map((m) => (m === JUDGMENT ? 'Judgment Day' : 'Immolation')).join(', ')} (3 seeds)`, () => {
      for (const seed of [21, 22, 23]) {
        const { e, mark } = inPhase2(seed, start);
        for (let i = 0; i < 400 && !moves(e, mark).includes(JUDGMENT); i++) {
          const d = step(e);
          if (!d) break;
          e.submit(defend());
        }
        expect(moves(e, mark), `seed ${seed}`).toEqual(expected);
        expect(counter(e), `seed ${seed}: Judgment Day spends the count`).toBe(0);
      }
    });
  }
});

describe('the bookkeeping: the counter is its start, plus Penance\'s turns, plus the damaging actions that reached it (RE 5.2)', () => {
  it('+1 for each Penance turn and nothing else when nobody strikes it: exact at every decision, with an arm\'s Mighty Guard in some seeds (its 0 damage adds nothing)', () => {
    let guarded = 0;
    for (let seed = 1; seed <= 16; seed++) {
      const { e, mark } = inPhase2(seed, 2);
      armDown(e, LEFT_ARM); // an arm down for good: no Judgment Day gets in the way, and the Right Arm alone casts
      for (let i = 0; i < 60 && counter(e) < 15; i++) {
        const d = step(e);
        if (!d) break;
        e.submit(defend());
        expect(counter(e), `seed ${seed}, decision ${i}`).toBe(2 + moves(e, mark).length);
      }
      expect(moves(e, mark).length, `seed ${seed}`).toBeGreaterThanOrEqual(5);
      if (actions(log(e), RIGHT_ARM).includes('penance-mighty-guard')) guarded++;
    }
    expect(guarded, 'some seed has the Right Arm cast Mighty Guard on Penance, so the zero damage events were exercised').toBeGreaterThanOrEqual(1);
  });

  it('+1 for each damaging action that reaches it: Tidus swings every turn he has, the others defend; the count matches the actions that did damage, exactly, at every decision', () => {
    for (const seed of [31, 32, 33]) {
      const { e, mark } = inPhase2(seed, 0);
      armDown(e, LEFT_ARM);
      armDown(e, RIGHT_ARM);
      const from = log(e).length;
      let swings = 0;
      for (let i = 0; i < 40; i++) {
        const d = step(e);
        if (!d) break;
        const c = d.actorId === 'tidus' ? swing(d, PENANCE) : null;
        if (c) swings++;
        e.submit(c ?? defend());
        const hits = damagingActionsOn(log(e).slice(from), PENANCE);
        expect(counter(e), `seed ${seed}, decision ${i}`).toBe(moves(e, mark).length + hits);
      }
      expect(swings, `seed ${seed}: Tidus swung`).toBeGreaterThanOrEqual(5);
      expect(damagingActionsOn(log(e).slice(from), PENANCE), `seed ${seed}: the swings landed`).toBeGreaterThanOrEqual(3);
    }
  });

  it('one action is one point however many hits it has: a Slice & Dice (six hits on its one target) adds exactly 1', () => {
    for (const seed of [41, 42]) {
      const { e, mark } = inPhase2(seed, 0);
      armDown(e, LEFT_ARM);
      armDown(e, RIGHT_ARM); // the only enemy left to choose is Penance
      let cast = false;
      for (let i = 0; i < 60 && !cast; i++) {
        const d = step(e);
        if (!d) break;
        const sd = d.actorId === 'tidus' ? row(d, 'overdrive', 'slice-and-dice') : null;
        if (sd) {
          const before = { counter: counter(e), turns: moves(e, mark).length, from: log(e).length };
          e.submit({ ...sd, targets: [] });
          cast = true;
          const ev = log(e).slice(before.from);
          const blows = ev.filter((x) => x.type === 'damage' && x.targetId === PENANCE && x.amount > 0).length;
          expect(blows, `seed ${seed}: the six hits landed`).toBeGreaterThanOrEqual(3);
          expect(damagingActionsOn(ev, PENANCE), `seed ${seed}: they are one action`).toBe(1);
          expect(counter(e) - before.counter - (moves(e, mark).length - before.turns), `seed ${seed}: one action, one point`).toBe(1);
        } else e.submit(defend());
      }
      expect(cast, `seed ${seed}: Tidus had the Overdrive`).toBe(true);
    }
  });
});

describe('an arm down, and the count after Judgment Day (RE 5.2)', () => {
  it('with an arm down at every turn the counter passes 20 and keeps growing, one a turn, and there is never a Judgment Day', () => {
    for (const seed of [51, 52, 53]) {
      const { e, mark } = inPhase2(seed, 18);
      armDown(e, RIGHT_ARM);
      for (let i = 0; i < 200 && moves(e, mark).length < 8; i++) {
        const d = step(e);
        if (!d) break;
        e.submit(defend());
        expect(counter(e), `seed ${seed}, decision ${i}`).toBe(18 + moves(e, mark).length);
      }
      expect(moves(e, mark).length, `seed ${seed}`).toBeGreaterThanOrEqual(8);
      expect(moves(e, mark).every((m) => m === IMMOLATION), `seed ${seed}: every turn an Immolation`).toBe(true);
      expect(counter(e)).toBeGreaterThanOrEqual(26);
    }
  });

  it('after Judgment Day the count is 0: the next nineteen turns are Immolations (the count reads 1 to 19), the twentieth is the next Judgment Day (a party with room to live through it)', () => {
    const { e, mark } = inPhase2(61, 19);
    const room = 400_000;
    for (let i = 0; i < 600 && moves(e, mark).filter((m) => m === JUDGMENT).length < 2; i++) {
      const d = step(e, room);
      if (!d) break;
      e.submit(defend());
    }
    const walk = moves(e, mark);
    expect(walk[0]).toBe(JUDGMENT);
    expect(walk.slice(1, 20)).toEqual(Array.from({ length: 19 }, () => IMMOLATION));
    expect(walk[20]).toBe(JUDGMENT);
    expect(walk).toHaveLength(21);
  });
});
