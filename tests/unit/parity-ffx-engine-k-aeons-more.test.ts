/**
 * **Engine-level parity, the player's Yojimbo and the Magus Sisters, part 2** (re-parity lane FFX-K; **FFX only**): the cases the mutation pass of the wiring found
 * no test for. `parity-ffx-engine-k-aeons.test.ts` is part 1 (the same rig, `helpers/ffxKRig.ts`; the same independent oracle, `helpers/ffxKOracle.ts`, no import of the
 * kernels or the adapters).
 *
 * - the monster penalty reads the highest Zanmato byte over EVERY monster still on the field (a Zanmato byte is the data's `zanmatoLevel` minus 1): not the first
 *   monster, not the living ones only, and not one that has left (research/re-ffx-last-summoning.md section 8.1);
 * - the free attack keeps the compatibility it changes, and is never Zanmato against a group with a Zanmato byte;
 * - a Cursed Yojimbo gets no full-gauge bonus; the whole of the gil may be paid;
 * - Combine powers whichever sister is asked, the counters with Haste and Slow, the menu's Repeat row, the Combine gate statuses, a recovering sister, a wipe;
 * - the menu builder sees a sister who is hurt.
 *
 * The test values (his compatibility, the Sisters' motivation, the test enemies) are the test's own; the real chapter's are its builder's.
 */

import { describe, expect, it } from 'vitest';
import type { EnemyDef, StatusId } from '../../src/battle/common/types.ts';
import { enemy, stats } from './ffx-fixtures.test.ts';
import { COMBINE, DISMISS, PAY, type Tap, Rig, SUMMON, build, ids, sisters, starts, yojimbo } from './helpers/ffxKRig.ts';
import { DELTA, freeAttack, payDecision, sisterMenu } from './helpers/ffxKOracle.ts';

/**
 * A monster with a great deal of HP and Death resistance 255, on its own formation slot. A landed Zanmato kills it all the same (the data's Zanmato ignores every
 * resistance), so a free Zanmato before the Pay would end the battle: the cases that start above compatibility 0 give the monsters a Zanmato byte (a free attack is then
 * never Zanmato) or start at 0. `zanmatoLevel` is the data's level, the game's Zanmato byte plus 1 (none = byte 0).
 */
const foe = (id: string, slot: number, zanmatoLevel?: number): EnemyDef =>
  enemy({ id, slot, stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }), immunities: { ko: 255 }, ...(zanmatoLevel === undefined ? {} : { zanmatoLevel }) });

/** Run one Pay from the start: summon, Yojimbo's turn, `prep`, the payment. Returns the rig, the draw/event positions and the compatibility he had when the menu opened. */
function payAgainst(
  foes: EnemyDef[],
  o: { amount: number; compat?: number; hire?: 0 | 1 | 2; gauge?: number; gil?: number; seed?: number; prep?: (rig: Rig) => void },
): { rig: Rig; from: number; before: number; compat: number } {
  const rig = new Rig(build({ aeons: [yojimbo(o.gauge ?? 0)], yojimbo: { compatibility: o.compat ?? 0, hireAnswer: o.hire ?? 1 }, gil: o.gil ?? 100_000 }), foes, o.seed ?? 3);
  rig.until('yuna');
  rig.submit(SUMMON('yojimbo'));
  rig.until('yojimbo');
  o.prep?.(rig);
  const from = rig.taps.length;
  const before = rig.events.length;
  const compat = rig.state.flags['yojimbo:compatibility'] as number;
  rig.submit(PAY(o.amount));
  return { rig, from, before, compat };
}

/** The command a Pay carried out (the second action of the log after the Pay itself). */
const carriedOut = (rig: Rig, before: number): string => starts(rig.events.slice(before))[1]![1];

describe('the monster penalty reads the highest Zanmato byte over every monster still on the field (note section 8.1 item 2)', () => {
  /**
   * Seeds 1 to 12: a Pay of 99,999,999 gil at compatibility 255 (a motivation of 121, where the byte changes the first roll's chance of Zanmato a great deal),
   * against the oracle that is told the byte `zan` it should find. Returns how many seeds took the second pass. With no byte on the field a free attack before
   * the Pay can be a Zanmato that ends the battle, so that case starts at compatibility 0 (no free attack can come).
   */
  function reads(foes: () => EnemyDef[], zan: number, prep?: (rig: Rig) => void, startsAt = 255): number {
    let secondPasses = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const o = { compat: startsAt, amount: 99_999_999, gil: 99_999_999, seed, ...(prep ? { prep } : {}) };
      const { rig, from, before, compat } = payAgainst(foes(), o);
      const y = rig.draws(from, 17);
      const want = payDecision({ payment: 99_999_999, gil: 99_999_999, compat, hire: 1, zan, gaugeFull: false }, y[0]!.value, y[1]?.value ?? 0);
      expect(y.length, `seed ${seed}: draws`).toBe(want.draws);
      expect(carriedOut(rig, before), `seed ${seed}: the command`).toBe(want.command);
      if (want.secondPass) secondPasses++;
    }
    return secondPasses;
  }

  it('a boss listed second counts: the first monster\'s byte of 0 does not hide it (byte 3, level 4)', () => {
    expect(reads(() => [foe('helper', 0), foe('boss', 1, 4)], 3)).toBeGreaterThan(0);
  });

  it('it is the HIGHEST of several bytes, in whatever order they stand (levels 2, 4 and 3 are bytes 1, 3 and 2)', () => {
    expect(reads(() => [foe('a', 0, 2), foe('b', 1, 4), foe('c', 2, 3)], 3)).toBeGreaterThan(0);
    expect(reads(() => [foe('a', 0, 4), foe('b', 1, 2), foe('c', 2, 3)], 3)).toBeGreaterThan(0);
  });

  it('a monster that has fallen but not left the field still counts', () => {
    expect(reads(() => [foe('helper', 0), foe('boss', 1, 4)], 3, (rig) => rig.knockOut('boss'))).toBeGreaterThan(0);
  });

  it('a monster that has left the field does not count (no byte left: one draw, no second pass)', () => {
    expect(reads(() => [foe('helper', 0), foe('boss', 1, 4)], 0, (rig) => void (rig.fighter('boss').removed = true))).toBe(0);
  });

  it('a monster with no byte at all is byte 0: one draw, no second pass', () => {
    expect(reads(() => [foe('helper', 0), foe('other', 1)], 0, undefined, 0)).toBe(0);
  });

  it('the data\'s level is the game\'s byte plus one: level 2 is byte 1, level 5 is byte 4 (the Dark Aeons and the Yu Pagodas)', () => {
    expect(reads(() => [foe('boss', 0, 2)], 1)).toBeGreaterThan(0);
    expect(reads(() => [foe('boss', 0, 5)], 4)).toBeGreaterThan(0);
  });
});

describe('the free attack', () => {
  /** Summon at `compat`, advance to Yojimbo's first decision, and report what happened at it: the stream-17 draws, his actions and the compatibility afterwards. */
  function firstTurn(compat: number, foes: EnemyDef[], seed: number): { draws: Tap[]; actions: Array<[string, string]>; compat: number } {
    const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: compat, hireAnswer: 1 } }), foes, seed);
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    const from = rig.taps.length;
    const eventsFrom = rig.events.length;
    for (let i = 0; i < 40; i++) {
      const d = rig.engine.nextDecision();
      if (d.kind === 'resolved') {
        rig.events.push(...d.events);
        if (d.events.some((e) => e.type === 'turn-start' && e.actorId === 'yojimbo')) break;
      } else if (d.kind === 'player-input') {
        if (d.actorId === 'yojimbo') break;
        rig.events.push(...rig.engine.submit({ kind: 'defend', targets: [] }));
      } else break;
    }
    return {
      draws: rig.draws(from, 17),
      actions: starts(rig.events.slice(eventsFrom)).filter(([who]) => who === 'yojimbo'),
      compat: rig.state.flags['yojimbo:compatibility'] as number,
    };
  }

  /** Seeds 1 to 80 against the oracle; returns how many free attacks came, and how many of them the group rule changed. */
  function sweep(compat: number, foes: () => EnemyDef[], zanGroup: number): { wins: number; changed: number; deltas: Set<number> } {
    let wins = 0;
    let changed = 0;
    const deltas = new Set<number>();
    for (let seed = 1; seed <= 80; seed++) {
      const r = firstTurn(compat, foes(), seed);
      const won = (r.draws[0]!.value & 0xff) < Math.floor(compat / 4);
      expect(r.actions.length > 0, `seed ${seed}: a free attack comes exactly when the turn-start draw wins`).toBe(won);
      if (!won) {
        expect(r.draws, `seed ${seed}`).toHaveLength(1);
        expect(r.compat, `seed ${seed}: a menu turn changes nothing`).toBe(compat);
        continue;
      }
      wins++;
      expect(r.draws, `seed ${seed}`).toHaveLength(2);
      const want = freeAttack(compat, r.draws[0]!.value, r.draws[1]!.value, zanGroup);
      expect(r.actions[0]![1], `seed ${seed}: the command`).toBe(want.command);
      if (want.command !== want.raw) changed++;
      const delta = DELTA[want.command]!;
      deltas.add(delta);
      expect(r.compat, `seed ${seed}: the compatibility after a ${want.command}`).toBe(Math.min(255, Math.max(0, compat + delta)));
    }
    return { wins, changed, deltas };
  }

  it('the compatibility it changes is the compatibility he keeps (compatibility 100: every command but Zanmato moves it by its own amount)', () => {
    const r = sweep(100, () => [foe('dummy', 0)], 0);
    expect(r.wins).toBeGreaterThan(3);
    expect([...r.deltas].some((d) => d !== 0)).toBe(true);
  });

  it('against a group with a Zanmato byte above 0 a free attack is never Zanmato: it is Wakizashi on all (+3, not +4)', () => {
    const r = sweep(200, () => [foe('dummy', 0), foe('boss', 1, 4)], 3);
    expect(r.wins).toBeGreaterThan(8);
    expect(r.changed).toBeGreaterThan(2); // the rule really changed a roll that would have been Zanmato
  });

  it('against monsters with no byte it can be Zanmato (+4)', () => {
    const r = sweep(200, () => [foe('dummy', 0)], 0);
    expect(r.deltas.has(4)).toBe(true);
    expect(r.changed).toBe(0);
  });
});

describe('Pay: the hire answer scales the motivation, whatever the draw', () => {
  it('answers 0, 1 and 2 each give the oracle\'s command on twelve seeds (answer 0 reads the SHARE of the gil that is paid; answer 2 is x0.8), and they do differ', () => {
    let differing = 0;
    for (const [amount, gil] of [[10_000, 100_000], [60_000, 100_000]] as const) {
      for (let seed = 1; seed <= 12; seed++) {
        const commands = ([0, 1, 2] as const).map((hire) => {
          const { rig, from, before, compat } = payAgainst([foe('dummy', 0)], { amount, gil, hire, seed });
          const y = rig.draws(from, 17);
          const want = payDecision({ payment: amount, gil, compat, hire, zan: 0, gaugeFull: false }, y[0]!.value, 0);
          expect(carriedOut(rig, before), `answer ${hire}, ${amount} of ${gil}, seed ${seed}`).toBe(want.command);
          return want.command;
        });
        if (new Set(commands).size > 1) differing++;
      }
    }
    expect(differing).toBeGreaterThan(5);
  });
});

describe('Pay: the Curse, and the whole of the gil', () => {
  it('a Cursed Yojimbo with a full gauge gets no bonus and spends none of his gauge', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { rig, from, before, compat } = payAgainst([foe('dummy', 0)], { amount: 100, gauge: 100, seed, prep: (r) => r.inflict('yojimbo', 'curse') });
      const y = rig.draws(from, 17);
      const want = payDecision({ payment: 100, gil: 100_000, compat, hire: 1, zan: 0, gaugeFull: true, cursed: true }, y[0]!.value, 0);
      expect(carriedOut(rig, before), `seed ${seed}`).toBe(want.command);
      expect(rig.fighter('yojimbo').overdrive!.gauge, `seed ${seed}: the gauge is untouched`).toBe(100);
    }
  });

  it('the same payment with a full gauge and no Curse is a different, higher roll and empties the gauge', () => {
    let different = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { rig, from, before, compat } = payAgainst([foe('dummy', 0)], { amount: 100, gauge: 100, seed });
      const y = rig.draws(from, 17);
      const want = payDecision({ payment: 100, gil: 100_000, compat, hire: 1, zan: 0, gaugeFull: true }, y[0]!.value, 0);
      const plain = payDecision({ payment: 100, gil: 100_000, compat, hire: 1, zan: 0, gaugeFull: false }, y[0]!.value, 0);
      expect(carriedOut(rig, before), `seed ${seed}`).toBe(want.command);
      expect(rig.fighter('yojimbo').overdrive!.gauge, `seed ${seed}: the whole gauge is spent`).toBeLessThan(100);
      if (want.command !== plain.command) different++;
    }
    expect(different).toBeGreaterThan(5);
  });

  it('a payment equal to all of the gil is allowed and leaves none (answer 0: the share of the gil is 1, a factor of 1.25)', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const { rig, from, before, compat } = payAgainst([foe('dummy', 0)], { amount: 100_000, gil: 100_000, hire: 0, seed });
      const y = rig.draws(from, 17);
      const want = payDecision({ payment: 100_000, gil: 100_000, compat, hire: 0, zan: 0, gaugeFull: false }, y[0]!.value, 0);
      expect(carriedOut(rig, before), `seed ${seed}`).toBe(want.command);
      expect(rig.state.flags['yojimbo:gil'], `seed ${seed}`).toBe(0);
    }
  });
});

describe('Combine powers, whichever sister is asked', () => {
  /** Motivation 60: 200 + 60 is above 255, so the roll cannot fail. */
  const sure = { sisters: { motivation: { cindy: 60, sandy: 60, mindy: 60 } } };
  const ring = (): Rig => {
    const rig = new Rig(build({ aeons: sisters(100), ...sure }), undefined, 3);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    return rig;
  };
  const ctbs = (rig: Rig): number[] => ['cindy', 'sandy', 'mindy'].map((id) => rig.rt.actors.get(id)!.ctb);

  for (const who of ['cindy', 'sandy', 'mindy'] as const) {
    it(`${who} orders it: Cindy still performs the Delta Attack, the counters are 35, 35 and 20, ${who} gains 10 motivation and the others none, and her next menu offers Repeat`, () => {
      const rig = ring();
      rig.until(who);
      const before = rig.events.length;
      rig.submit(COMBINE);
      const log = starts(rig.events.slice(before));
      expect(log[0]![0], 'the order is the asking sister\'s own action').toBe(who);
      expect(log.find(([, n]) => n === 'delta-attack')?.[0], 'Cindy performs the joint action whoever asked').toBe('cindy');
      expect(ctbs(rig)).toEqual([35, 35, 20]);
      for (const id of ['cindy', 'sandy', 'mindy']) expect(rig.fighter(id).overdrive!.gauge, `${id} paid the bar`).toBe(0);
      expect(rig.rt.sisters.motivation).toEqual({ cindy: 60, sandy: 60, mindy: 60, [who]: 70 });

      // Her next turn: the order she gave counts as an action she took, so the menu offers Repeat; a sister who has taken none is not offered it.
      const seen: Record<string, string[]> = {};
      for (let i = 0; i < 12; i++) {
        const d = rig.nextInput();
        seen[d.actorId] = ids(d.commands);
        if (d.actorId === who) break;
        rig.submit({ kind: 'defend', targets: [] });
      }
      expect(seen[who], `${who} had a next turn`).toBeDefined();
      expect(seen[who]).toContain('sister-order-repeat');
      for (const other of ['cindy', 'sandy', 'mindy'].filter((id) => id !== who)) if (seen[other]) expect(seen[other], `${other} has taken no action`).not.toContain('sister-order-repeat');
    });
  }

  it('each sister\'s own Haste and Slow count in the joint counters: Slow doubles Sandy\'s wait and Haste halves Mindy\'s', () => {
    const rig = ring();
    rig.until('cindy');
    rig.inflict('sandy', 'slow');
    rig.inflict('mindy', 'haste');
    rig.submit(COMBINE);
    expect(ctbs(rig)).toEqual([35, 70, 10]);
  });
});

describe('Combine powers needs all three ready', () => {
  const sure = { sisters: { motivation: { cindy: 60, sandy: 60, mindy: 60 } } };

  /** Cindy's first menu with `ready` done to Sandy first. */
  function menuAfter(ready: (rig: Rig) => void): string[] {
    const rig = new Rig(build({ aeons: sisters(100), ...sure }), undefined, 3);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    ready(rig);
    const d = rig.nextInput();
    expect(d.actorId).toBe('cindy'); // the one asked for acts next
    return ids(d.commands);
  }

  it('control: with all three full, alive and free to act it is offered', () => {
    expect(menuAfter(() => undefined)).toContain('sister-order-combine');
  });

  const gates: Array<[string, (rig: Rig) => void]> = [
    ['Curse', (rig) => rig.inflict('sandy', 'curse')],
    ['Confuse', (rig) => rig.inflict('sandy', 'confuse')],
    ['Berserk', (rig) => rig.inflict('sandy', 'berserk')],
    ['Provoke', (rig) => rig.inflict('sandy', 'provoke')],
    ['Threaten', (rig) => rig.inflict('sandy', 'threaten')],
    ['Sleep', (rig) => rig.inflict('sandy', 'sleep')],
    ['Petrify', (rig) => rig.inflict('sandy', 'petrify')],
    ['Eject', (rig) => rig.inflict('sandy', 'eject' as StatusId)],
    ['a knock-out', (rig) => rig.knockOut('sandy')],
    ['a gauge one point short', (rig) => void (rig.fighter('sandy').overdrive!.gauge = 95)],
  ];
  for (const [name, apply] of gates) {
    it(`a sister under ${name} takes Combine powers off the menu`, () => {
      expect(menuAfter(apply)).not.toContain('sister-order-combine');
    });
  }
});

describe('three aeons: who can be summoned, and the wipe', () => {
  const own = { sisters: { motivation: { cindy: 40, sandy: 40, mindy: 40 } } };

  it('with one sister still recovering no Summon row for the Sisters can be picked (it stays greyed since release 55: menu-draw parity item c), and a summon sent anyway brings nobody', () => {
    const rig = new Rig(build({ aeons: sisters(100), ...own }));
    rig.fighter('mindy').aeon!.reviveCountdown = 5;
    const d = rig.until('yuna');
    expect(d.commands.filter((c) => c.command.kind === 'summon' && c.enabled)).toEqual([]);
    rig.submit(SUMMON('cindy'));
    expect(rig.state.aeonId).toBeNull();
    expect(rig.state.aeonIds).toBeUndefined();
  });

  /** The Sisters out at full gauge; `down` are knocked out (hp 0, the KO status); returns after the next end-of-action check. */
  function withDown(down: string[]): Rig {
    const rig = new Rig(build({ aeons: sisters(100), ...own }), undefined, 5);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    for (const id of down) rig.knockOut(id);
    for (let i = 0; i < 4 && rig.state.aeonId !== null; i++) {
      const d = rig.engine.nextDecision();
      if (d.kind === 'player-input') rig.engine.submit({ kind: 'defend', targets: [] });
    }
    return rig;
  }

  it('the summon holds while any one sister stands: Cindy alone down, Sandy and Mindy down, or one of each pair', () => {
    for (const down of [['cindy'], ['sandy', 'mindy'], ['cindy', 'sandy'], ['cindy', 'mindy']]) {
      const rig = withDown(down);
      expect(rig.state.aeonId, `${down.join(' and ')} down`).toBe('cindy');
      expect(rig.state.aeonIds, `${down.join(' and ')} down`).toEqual(['cindy', 'sandy', 'mindy']);
    }
  });

  it('a wipe (all three down) empties all three gauges, starts each one\'s 30-battle recovery and gives the party back', () => {
    const rig = withDown(['cindy', 'sandy', 'mindy']);
    expect(rig.state.aeonId).toBeNull();
    expect(rig.state.aeonIds).toBeUndefined();
    for (const id of ['cindy', 'sandy', 'mindy']) {
      expect(rig.fighter(id).overdrive!.gauge, `${id}'s gauge`).toBe(0);
      expect(rig.fighter(id).aeon!.reviveCountdown, `${id}'s recovery`).toBe(31);
      expect(rig.fighter(id).removed, `${id} left the field`).toBe(true);
    }
    expect(rig.state.result).toBeNull();
  });

  it('Dismiss with two sisters fallen stands both up at 1 HP', () => {
    const rig = new Rig(build({ aeons: sisters(0), ...own }), undefined, 5);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    rig.knockOut('sandy');
    rig.knockOut('mindy');
    rig.until('cindy');
    rig.submit(DISMISS);
    expect(rig.state.aeonId).toBeNull();
    for (const id of ['sandy', 'mindy']) expect([rig.fighter(id).hp, rig.fighter(id).alive], id).toEqual([1, true]);
  });
});

describe('the menu builder sees how hurt the sisters are (property 281: HP below half of the maximum)', () => {
  const own = { sisters: { motivation: { cindy: 40, sandy: 40, mindy: 40 } } };

  /**
   * Hurt the sisters as `hurt` says (a fraction of each maximum), then open nine sister turns (each answered with Defend, which is not an order, so none has
   * "taken an action") and compare every menu with the oracle's: the draws it took on stream 18 and the number of orders it offered. Returns the sisters seen.
   */
  function opens(hurt: Record<string, number>, seed: number): Set<string> {
    const rig = new Rig(build({ aeons: sisters(0), ...own }), undefined, seed);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    for (const [id, fraction] of Object.entries(hurt)) rig.fighter(id).hp = Math.floor(rig.fighter(id).stats.maxHp * fraction);
    const seen = new Set<string>();
    for (let i = 0; i < 9; i++) {
      const from = rig.taps.length;
      const d = rig.nextInput();
      const who = d.actorId as 'cindy' | 'sandy' | 'mindy';
      const c = rig.fighter(who);
      const draws = rig.draws(from, 18).map((t) => t.value);
      const trio = ['cindy', 'sandy', 'mindy'].map((id) => rig.fighter(id));
      const want = sisterMenu(who, {
        turns: 0,
        motivation: 40,
        hp: c.hp,
        mp: c.mp,
        maxHp: c.stats.maxHp,
        maxMp: c.stats.maxMp,
        nearDeath: trio.filter((t) => t.hp < Math.floor(t.stats.maxHp / 2)).length,
        ready: 0,
      }, draws);
      expect(draws.length, `seed ${seed}, turn ${i} ${who}: draws`).toBe(want.used);
      expect(d.commands.flatMap((r) => (r.command.kind === 'ability' ? [r.command.id] : [])).length, `seed ${seed}, turn ${i} ${who}: orders offered`).toBe(want.offered.length - 1);
      seen.add(who);
      rig.submit({ kind: 'defend', targets: [] });
    }
    return seen;
  }

  const sweep = (hurt: Record<string, number>): void => {
    const all = new Set<string>();
    for (let seed = 1; seed <= 10; seed++) for (const who of opens(hurt, seed)) all.add(who);
    expect([...all].sort()).toEqual(['cindy', 'mindy', 'sandy']);
  };

  it('nobody below half: hurt but not that hurt is not "near death"', () => {
    sweep({ cindy: 0.7, sandy: 0.7, mindy: 0.7 });
  });

  it('someone below half: Sandy offers her support order whatever her roll says', () => {
    sweep({ cindy: 0.4, sandy: 0.7, mindy: 0.7 });
  });

  it('Mindy below a quarter rolls her drain order at 200; between a quarter and a half at 128', () => {
    sweep({ cindy: 1, sandy: 1, mindy: 0.2 });
    sweep({ cindy: 1, sandy: 1, mindy: 0.4 });
  });
});
