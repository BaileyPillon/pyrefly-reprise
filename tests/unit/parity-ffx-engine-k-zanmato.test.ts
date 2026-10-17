/**
 * The player's Zanmato in the engine (re-parity lane FFX-K, the Zanmato fix of 2026-10-15; **FFX only**): a landed Zanmato (command 0x30E2) hits EVERY legal enemy of one
 * group, whatever its Death resistance, and kills it. Source: `research/re-ffx-zanmato-and-orders.md` Part 1 (branch `re-ffx-zanmato-and-orders`), run on the game's own
 * code in the harness (16,384 full-cross vectors, 4,096 bit-flip pairs, 1,500 pick vectors, 0 mismatches).
 *
 * **Game case: FFX only.** FFX-2 has no player Yojimbo (his Zanmato there is a mission boss's row) and nothing here is read by `src/battle/ffx2/**`.
 *
 * The oracle (`helpers/ffxZanmatoOracle.ts`) is the note's prose written out again with no import of the kernels, the adapters or the engine. Every case runs a real Pay
 * of the player's Yojimbo through the engine (summon, his turn, the payment of 2^22 gil: a motivation of exactly 80 against monsters with no Zanmato byte, so the
 * first roll is Zanmato whatever the draw; compatibility 0 rules a free attack out), taps every draw of the game's generator, and compares what the engine did with what
 * the oracle says the game does: whom it hit, how many draws and on which streams, and the end state of every foe.
 *
 * What this pins that no test did before: against two or more foes the engine used to kill the FIRST only (`zanmato` said `single-enemy`, so the executor kept one
 * target of the list the pick returned); the pick now sees BattleDistance (a foe at 2 or 3 is out of the Zanmato's reach of 1).
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, EnemyDef } from '../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { buildPossessedAeonChain } from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { PAY, Rig, SUMMON, build, starts, yojimbo } from './helpers/ffxKRig.ts';
import { actionStreams, outcomeOf, pick } from './helpers/ffxZanmatoOracle.ts';
import { GIL, STATUS_STREAM, type Run, type Spec, defOf, groupDraw, kos, payForZanmato, types, withoutRewards, zanmatoTargets } from './helpers/ffxZanmatoRig.ts';

describe('a landed Zanmato hits every legal foe of the group (note section 2)', () => {
  for (const n of [1, 2, 3, 4, 8]) {
    it(`${n} foe${n === 1 ? '' : 's'} in one group, each with Death resistance 255: all of them die, the draws are Pay's 17, ONE group draw on stream 5, one status draw each`, () => {
      const specs: Spec[] = Array.from({ length: n }, (_, i) => ({ id: `f${i + 1}` }));
      const run = payForZanmato(specs, { seed: 1 });
      const want = pick(run.oracle, groupDraw(run)).members.map((f) => f.id);
      expect(want, 'the oracle says every foe').toEqual(specs.map((s) => s.id));
      expect(starts(run.events)).toEqual([['yojimbo', 'Pay'], ['yojimbo', 'zanmato']]);
      expect(zanmatoTargets(run.events)).toEqual(want); // the action keeps the WHOLE list, in ascending slot order
      expect(kos(run.events)).toEqual(want);
      // The draws: the script's roll, then the group draw, then one status draw per target on the user's own stream, and nothing else.
      expect(run.streams).toEqual([17, ...actionStreams(run.oracle, groupDraw(run), STATUS_STREAM)]);
      expect(run.streams.filter((s) => s === 5)).toHaveLength(1);
      expect(run.streams.filter((s) => s === STATUS_STREAM)).toHaveLength(n);
      for (const id of want) {
        const c = run.rig.fighter(id);
        expect([c.alive, c.hp, Object.keys(c.statuses)], id).toEqual([false, 0, ['ko']]);
      }
      expect(run.rig.state.result?.outcome).toBe('victory');
    });
  }

  it('three foes, seeds 1 to 12: all three die every time, with the same draws (the engine used to kill only the first)', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const specs: Spec[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const run = payForZanmato(specs, { seed });
      expect(kos(run.events), `seed ${seed}`).toEqual(['a', 'b', 'c']);
      expect(run.streams, `seed ${seed}`).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM, STATUS_STREAM]);
    }
  });

  it('no damage, no miss, no HP-to-1: a foe with 3,000,000 HP goes from full to 0 with no damage event (note section 4)', () => {
    const run = payForZanmato([{ id: 'big', hp: 3_000_000 }, { id: 'big2', hp: 1_600_000 }]);
    expect(types(run.events, 'damage', 'miss', 'heal')).toEqual([]);
    expect(kos(run.events)).toEqual(['big', 'big2']);
    expect(run.rig.fighter('big').hp).toBe(0);
    expect(run.rig.fighter('big2').hp).toBe(0);
  });
});

describe('Death resistance and the Dark Aeons\' immunity set change nothing (note section 3)', () => {
  it('three Dark Aeons (Death 255, every disabling status immune, Life, Sensor, Scan, CTB, Bribe, Doom, Eject and Auto-Life immune; no Slice field exists) all die', () => {
    const run = payForZanmato([{ id: 'dark-valefor', hp: 1_600_000, darkAeon: true }, { id: 'dark-ixion', hp: 2_000_000, darkAeon: true }, { id: 'dark-bahamut', hp: 3_000_000, darkAeon: true }]);
    expect(kos(run.events)).toEqual(['dark-valefor', 'dark-ixion', 'dark-bahamut']);
    expect(run.streams).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM, STATUS_STREAM]);
    expect(run.rig.state.result?.outcome).toBe('victory');
  });

  it('every Death resistance byte gives the same result: 0, 100, 254, 255 (a chance of 255 lands over all of them)', () => {
    for (const res of [0, 100, 254, 255]) {
      const run = payForZanmato([{ id: 'a', res }, { id: 'b', res: 255 }]);
      expect(kos(run.events), `resistance ${res}`).toEqual(['a', 'b']);
    }
  });

  it('a paired differential: the same seed with plain foes and with every immunity in place gives the SAME event log and the SAME draws', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const plain = payForZanmato([{ id: 'a', hp: 2_000_000, res: 0 }, { id: 'b', hp: 2_000_000, res: 0 }, { id: 'c', hp: 2_000_000, res: 0 }], { seed });
      const dark = payForZanmato([{ id: 'a', hp: 2_000_000, darkAeon: true }, { id: 'b', hp: 2_000_000, darkAeon: true }, { id: 'c', hp: 2_000_000, darkAeon: true }], { seed });
      expect(JSON.stringify(dark.events), `seed ${seed}`).toBe(JSON.stringify(plain.events));
      expect(dark.taps, `seed ${seed}`).toEqual(plain.taps);
    }
  });

  it('mixed states, like the harness\'s second family: living, Zombie, Doom, Scan and a Zombie that holds Auto-Life all die (the Auto-Life holder is revived at a quarter)', () => {
    const specs: Spec[] = [
      { id: 'live', res: 255 },
      { id: 'zom', res: 254, has: ['zombie'] },
      { id: 'doom', res: 100, has: ['doom'] },
      { id: 'scan', res: 0, has: ['scan'] },
      { id: 'zombie-life', res: 255, has: ['zombie'], autoLife: true, hp: 40_000 },
    ];
    const run = payForZanmato(specs);
    const outcomes = pick(run.oracle, groupDraw(run)).members.map(outcomeOf);
    expect(outcomes).toHaveLength(5);
    for (const o of outcomes) {
      const c = run.rig.fighter(o.id);
      expect([c.alive, c.hp], o.id).toEqual([o.alive, o.hp]);
      if (!o.alive) expect(Object.keys(c.statuses), o.id).toEqual(['ko']); // the KO reset: Zombie, Doom and Scan are gone
    }
    expect(run.streams).toEqual([17, 5, ...Array<number>(5).fill(STATUS_STREAM)]);
  });
});

describe('a Petrified foe (note section 3, step 3: Death is refused, the shatter chance of 100 on the row breaks the statue)', () => {
  it('the shatter roll is spent on it as a second status draw; a roll below 100 (of 0 to 100) ejects it, and the other foe still dies', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const run = payForZanmato([{ id: 'stone', has: ['petrify'] }, { id: 'plain' }], { seed });
      const status = run.taps.filter((t) => t.stream === STATUS_STREAM);
      expect(status, `seed ${seed}: two draws for the statue, one for the other`).toHaveLength(3);
      expect(run.streams, `seed ${seed}`).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM, STATUS_STREAM]);
      const broke = (status[1] as { value: number }).value % 101 < 100;
      const stone = run.rig.fighter('stone');
      expect([stone.removed, stone.alive], `seed ${seed}`).toEqual(broke ? [true, false] : [false, true]);
      expect(kos(run.events), `seed ${seed}`).toEqual(['plain']);
    }
  });
});

describe('Auto-Life is stripped (note section 3, step 4: the KO reset wipes it, the death check queues one revive per holder)', () => {
  it('a foe holding a cast Auto-Life loses it and is stood up at a quarter of its maximum HP with one revive event; a foe without it simply dies', () => {
    const run = payForZanmato([{ id: 'holder', hp: 40_000, autoLife: true }, { id: 'plain', hp: 40_000 }]);
    const holder = run.rig.fighter('holder');
    expect(holder.statuses['auto-life'], 'the status is gone').toBeUndefined();
    expect([holder.alive, holder.hp]).toEqual([true, 10_000]);
    const revives = types(run.events, 'revive');
    expect(revives).toHaveLength(1); // one per holder that died
    expect(revives[0]).toMatchObject({ type: 'revive', targetId: 'holder', hp: 10_000, cause: 'auto-life' });
    expect(run.rig.fighter('plain').alive).toBe(false);
    expect(kos(run.events)).toEqual(['plain']); // the holder's KO is undone inside the same death check, so only the plain foe shows a KO
    expect(run.streams).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM]); // both foes were targets and both took their status draw
  });
});

describe('a foe out of reach or untargetable is left alone (note section 2: legal = in battle, targetable, alive, distance 1 or less)', () => {
  const untouched = (run: Run, id: string): void => {
    const hit = run.events.filter((e) => ('targetId' in e && e.targetId === id) || (e.type === 'action-start' && e.targets.includes(id)));
    expect(hit, `${id} was touched`).toEqual([]);
    const c = run.rig.fighter(id);
    expect([c.alive, Object.keys(c.statuses).includes('ko')], id).toEqual([true, false]);
  };

  it('distance 0 and 1 are in reach (reach 1); distance 2 and 3 are out: they live, untouched, and take no status draw', () => {
    const specs: Spec[] = [{ id: 'near' }, { id: 'one', distance: 1 }, { id: 'two', distance: 2 }, { id: 'three', distance: 3 }];
    const run = payForZanmato(specs);
    expect(zanmatoTargets(run.events)).toEqual(['near', 'one']);
    expect(kos(run.events)).toEqual(['near', 'one']);
    untouched(run, 'two');
    untouched(run, 'three');
    expect(run.rig.fighter('two').hp).toBe(99_999);
    // ONE group draw (the legal set is not empty), two status draws (two targets).
    expect(run.streams).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM]);
    expect(run.rig.state.result?.outcome).toBeUndefined(); // two foes still stand
  });

  it('a pick of ONE legal foe beside a foe out of reach or untargetable: the list has one member and the others are still left alone', () => {
    for (const other of [{ id: 'far', distance: 2 }, { id: 'far3', distance: 3 }, { id: 'ghost', untargetable: true }, { id: 'hiding', hidden: true }] as const satisfies readonly Spec[]) {
      const run = payForZanmato([{ id: 'only' }, other]);
      expect(zanmatoTargets(run.events), other.id).toEqual(['only']);
      expect(kos(run.events), other.id).toEqual(['only']);
      untouched(run, other.id);
      expect(run.streams, other.id).toEqual([17, 5, STATUS_STREAM]);
    }
  });

  it('an untargetable foe, a hidden foe and a dead foe are not in the set either', () => {
    const specs: Spec[] = [{ id: 'live-a' }, { id: 'ghost', untargetable: true }, { id: 'hiding', hidden: true }, { id: 'gone', dead: true }, { id: 'live-b' }];
    const run = payForZanmato(specs);
    expect(zanmatoTargets(run.events)).toEqual(['live-a', 'live-b']);
    expect(kos(run.events)).toEqual(['live-a', 'live-b']);
    untouched(run, 'ghost');
    untouched(run, 'hiding');
    expect(run.streams).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM]);
    expect(run.rig.fighter('gone').alive).toBe(false); // it was dead before, and nothing happened to it
    expect(types(run.events, 'ko').filter((e) => e.type === 'ko' && e.targetId === 'gone')).toEqual([]);
  });

  it('with nobody legal there is no group draw at all, nothing is paid and the compatibility does not move (the script finds no target for Zanmato or for Wakizashi on all)', () => {
    const run = payForZanmato([{ id: 'far-a', distance: 2 }, { id: 'ghost', untargetable: true }, { id: 'far-b', distance: 3 }]);
    expect(run.streams).toEqual([17]); // only the script's roll
    expect(starts(run.events)).toEqual([['yojimbo', 'Pay']]);
    expect(run.rig.state.flags['yojimbo:gil']).toBe(GIL);
    expect(run.rig.state.flags['yojimbo:compatibility']).toBe(0);
    for (const id of ['far-a', 'ghost', 'far-b']) untouched(run, id);
  });
});

describe('a free Zanmato (the turn-start roll) is the same action', () => {
  it('at compatibility 255 against two foes with no Zanmato byte, every free Zanmato kills both and takes one group draw (seeds 1 to 60)', () => {
    let seen = 0;
    for (let seed = 1; seed <= 60 && seen < 3; seed++) {
      const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 255, hireAnswer: 1 }, gil: GIL }), [defOf({ id: 'a' }, 0), defOf({ id: 'b' }, 1)], seed);
      rig.until('yuna');
      rig.submit(SUMMON('yojimbo'));
      const from = rig.taps.length;
      try {
        rig.until('yojimbo'); // a free attack happens at the start of his turn, before any menu: what follows reads the log
      } catch {
        // the battle ended on a free Zanmato: his menu never opened
      }
      const log = starts(rig.events);
      const z = log.findIndex(([who, ability]) => who === 'yojimbo' && ability === 'zanmato');
      if (z < 0) continue;
      seen++;
      expect(rig.fighter('a').alive, `seed ${seed}`).toBe(false);
      expect(rig.fighter('b').alive, `seed ${seed}`).toBe(false);
      const draws = rig.taps.slice(from).map((t) => t.stream);
      expect(draws.filter((s) => s === 5), `seed ${seed}`).toHaveLength(1);
      expect(draws.filter((s) => s === STATUS_STREAM), `seed ${seed}`).toHaveLength(2);
    }
    expect(seen, 'the seeds drew a free Zanmato').toBeGreaterThanOrEqual(1);
  });
});

describe('chapter 28: a landed Zanmato against the Yu Pagodas, Braska Final Aeon and a possessed aeon (note section 4 and item 8)', () => {
  /** A Pay of every gil with a full gauge: against the byte 5 of Braska's chain it is a Zanmato on 24 draws in 64, so a seed from the first sixty rolls one. */
  function zanmatoOn(enemies: readonly EnemyDef[]): { rig: Rig; events: BattleEvent[]; streams: number[] } {
    for (let seed = 1; seed <= 60; seed++) {
      const rig = new Rig(build({ aeons: [yojimbo(100)], yojimbo: { compatibility: 0, hireAnswer: 1 }, gil: 99_999_999 }), [...enemies], seed);
      rig.until('yuna');
      rig.submit(SUMMON('yojimbo'));
      rig.until('yojimbo');
      const from = rig.taps.length;
      const before = rig.events.length;
      rig.submit(PAY(99_999_999));
      const events = rig.events.slice(before);
      if (starts(events)[1]?.[1] === 'zanmato') return { rig, events, streams: withoutRewards(rig.taps.slice(from).map((t) => t.stream)) };
    }
    throw new Error('no seed of the first sixty rolled a Zanmato');
  }
  const pending = (rig: Rig): Array<{ id: string; atTicks: number; maxHp: number }> =>
    (rig.engine as unknown as { ctx: { rt: { pendingPartRevivals: Array<{ id: string; atTicks: number; maxHp: number }> } } }).ctx.rt.pendingPartRevivals;
  const count = (events: readonly BattleEvent[], type: string, id: string): number =>
    events.filter((e) => e.type === type && (('targetId' in e && e.targetId === id) || ('partId' in e && e.partId === id))).length;

  it('Braska Final Aeon and his two Pagodas: one group draw, the first form resets to the second, each Pagoda is destroyed ONCE and its return is armed with the pool of a full life', () => {
    const group = ENEMY_GROUPS_BY_ID['braskas-final-aeon']!;
    const { rig, events, streams } = zanmatoOn(group.enemies);
    expect(zanmatoTargets(events)).toEqual(['braskas-final-aeon', 'yu-pagoda-left', 'yu-pagoda-right']);
    // BFA's status draw, then each Pagoda's status draw and the one script draw its on-hit takes (how many turns it stays hidden).
    expect(streams).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM, 2, STATUS_STREAM, 2]);
    expect(types(events, 'form-change')).toHaveLength(1);
    expect(rig.fighter('braskas-final-aeon').alive).toBe(true); // his second form stands
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) {
      expect(count(events, 'ko', id), `${id} ko events`).toBe(1);
      expect(count(events, 'part-destroyed', id), `${id} part-destroyed events`).toBe(1);
      expect([rig.fighter(id).alive, rig.fighter(id).removed]).toEqual([false, true]);
    }
    // A Zanmato sets a Pagoda's pool to its current maximum (5,000): that is what it returns with.
    expect(pending(rig).map((p) => [p.id, p.maxHp]).sort()).toEqual([['yu-pagoda-left', 5000], ['yu-pagoda-right', 5000]]);
    expect(rig.state.result?.outcome).toBeUndefined(); // the fight goes on
  });

  it('a possession link (the possessed Yojimbo and his two Pagodas): the aeon dies (its script has no reaction to the used command), the Pagodas are destroyed once each, the battle is won', () => {
    const link = buildPossessedAeonChain(['yojimbo'])[0]!;
    const enemies = link.enemies.map((e) => (e.id.startsWith('possessed-') ? { ...e, stats: { ...e.stats, hp: 90_000, maxHp: 90_000 }, hp: 90_000 } : e));
    const { rig, events, streams } = zanmatoOn(enemies);
    expect(zanmatoTargets(events)).toEqual(['possessed-yojimbo', 'yu-pagoda-left', 'yu-pagoda-right']);
    expect(streams).toEqual([17, 5, STATUS_STREAM, STATUS_STREAM, 2, STATUS_STREAM, 2]);
    expect(count(events, 'ko', 'possessed-yojimbo')).toBe(1);
    expect(rig.fighter('possessed-yojimbo').alive).toBe(false);
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) expect(count(events, 'ko', id), id).toBe(1);
    expect(rig.state.result?.outcome).toBe('victory');
  });
});
