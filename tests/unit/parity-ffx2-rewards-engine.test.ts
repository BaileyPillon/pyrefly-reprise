/**
 * FFX-2 kill rewards on the real engine (re-parity RC9, lane X2-C; **FFX-2 only**): what a knock-out pays, when, and into what.
 *
 * Source: FFX-2.exe, Steam build 25501027, the reward roll (0x006246d0) and the AP gain (0x00635590); note FFX2-G03 sections 4.1 to 4.9 and
 * 5.1. The expectations below are written from the note's rules and the monster rows' numbers (table 5.1), by hand, with the raw draws
 * read off the generator's tap: they import nothing of `kernel/kill-rewards.ts`, the ledger or the adapter, so a wrong wiring shows as a
 * difference. The rig knocks a unit out through the engine's own HP path (`applyHpDelta`), where the KO resolution and so the roll run.
 *
 * Mutation-checked by hand (scratch, one change at a time, each caught here): the roll not called; called after the chain breaks; a girl's
 * knock-out skipped; the victory paying every standing monster; the best chain not tracked; the draw order swapped; an owner counted twice;
 * the Pointless, ejected and fallen-girl rules dropped; the rollback sparing a Petrified girl; Steal Will and Bribe paying; a plain Eject
 * not paying; the ledger lost by the advisor's fork; the fallback for a monster with no row.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { GameStreams } from '../../src/battle/common/streams.ts';
import type { BattleEvent, Command, EnemyFields } from '../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { driveChapter5 } from './helpers/ffx2ChapterDrive.ts';
import { board, type RewardsProbe, type Tapped } from './helpers/ffx2RewardsRig.ts';

const ACT_I = 'ffx2-leblanc-entrance';

/** The note's table 5.1 rows used here (EXP, AP, gil, drop byte), written out by hand. */
const ORMI = { exp: 220, ap: 1, gil: 220 }; // Ormi, Act I: drop byte 255, Black Choker both slots

const dropIds = (p: RewardsProbe): string[] => p.result().drops.map((d) => d.itemId);
const word = (p: RewardsProbe, w0: number, w1: number, ids = ['yuna', 'rikku', 'paine']): void => {
  for (const id of ids) p.unit(id).autoWords = [w0, w1, 0];
};

describe('a knock-out pays at once (the KO resolution), not the victory', () => {
  it('Ormi in Act I pays 220 EXP, 1 AP, 220 gil and a Black Choker (255: the drop is certain, and both slots hold it)', () => {
    const p = board(ACT_I);
    p.kill(p.enemy('ormi-entrance'));
    const r = p.result();
    expect([r.exp, r.ap, r.gil]).toEqual([ORMI.exp, ORMI.ap, ORMI.gil]);
    expect(r.drops).toEqual([{ itemId: 'black-choker', count: 1 }]);
    expect(r.rewardsByMember).toEqual({ yuna: { exp: 220, ap: 1 }, rikku: { exp: 220, ap: 1 }, paine: { exp: 220, ap: 1 } }); // each girl gets the full EXP, not a share
    expect(p.rewardDraws.map((d) => d.stream)).toEqual([10, 11]); // one on stream 10 always, then one on stream 11 because the item dropped
  });

  it('a monster still standing when the battle is won pays nothing; the victory pays what was knocked out', () => {
    const p = board(ACT_I);
    p.kill(p.enemy('ormi-entrance'));
    const r = p.result();
    expect(r.exp).toBe(ORMI.exp); // the old victory paid 240 (Ormi 220, and the standing goons 10 each)
    expect(r.gil).toBe(ORMI.gil);
    expect(p.result('defeat')).toMatchObject({ exp: 0, ap: 0, gil: 0, drops: [] });
  });

  it('a battle with no knock-out has no ledger and pays nothing', () => {
    const p = board(ACT_I);
    expect(p.state().ffx2Rewards).toBeUndefined();
    expect(p.result()).toMatchObject({ exp: 0, ap: 0, gil: 0, drops: [] });
  });

  it('a monster killed twice (raised in between) pays twice', () => {
    const p = board(ACT_I);
    const ormi = p.enemy('ormi-entrance');
    p.kill(ormi);
    p.raise(ormi);
    p.kill(ormi);
    const r = p.result();
    expect([r.exp, r.gil, r.ap]).toEqual([440, 440, 2]);
    expect(r.drops).toEqual([{ itemId: 'black-choker', count: 2 }]);
    expect(p.rewardDraws.map((d) => d.stream)).toEqual([10, 11, 10, 11]);
  });

  it('every knock-out takes one draw on stream 10, a girl\'s too, and a girl pays nothing', () => {
    const p = board(ACT_I);
    p.kill(p.unit('yuna'));
    expect(p.rewardDraws.map((d) => d.stream)).toEqual([10]);
    p.kill(p.unit('rikku'));
    expect(p.rewardDraws.map((d) => d.stream)).toEqual([10, 10]);
    expect(p.result()).toMatchObject({ exp: 0, ap: 0, gil: 0, drops: [] });
  });

  it('the stream-10 draw of a kill is the next draw of that stream (a steal after it reads the one after)', () => {
    const a = board(ACT_I, 5);
    a.kill(a.enemy('dr-goon'));
    const first = a.rewardDraws[0]!;
    const b = board(ACT_I, 5);
    b.kill(b.unit('yuna'), 'dr-goon'); // a girl's knock-out takes the same first draw
    expect(b.rewardDraws[0]).toEqual(first);
  });
});

describe('the drop roll (4.7): the byte, the chains, Item Hunter, the rare slot', () => {
  /**
   * Kill Dr. Goon on `seed` after `hits` hits in a chain (and, when `then` is above 0, after the window ran out and `then` more hits made a new chain),
   * with the owners' words, and return what the engine dropped and the streams it drew.
   */
  function goon(seed: number, hits = 0, w1 = 0, then = 0): { items: string[]; counts: number[]; streams: number[] } {
    const p = board(ACT_I, seed);
    word(p, 0, w1);
    const drGoon = p.enemy('dr-goon');
    p.chained(drGoon, hits);
    if (then > 0) {
      p.expireChain(drGoon);
      p.chained(drGoon, then);
    }
    p.kill(drGoon);
    return { items: dropIds(p), counts: p.result().drops.map((d) => d.count), streams: p.rewardDraws.map((d) => d.stream) };
  }

  /**
   * The note's rule, written from the raw values the generator will hand out: the byte is 128; q = the stream-10 draw mod 255 must be below 128 + best + current
   * chain + 64 per Item Hunter owner; the stream-11 draw and 255 below 32 m + best + current chain picks the rare Grenade over the common Potion.
   */
  function oracle(seed: number, chains: number, hunters: number, m: number): { items: string[]; streams: number[] } {
    const p = board(ACT_I, seed);
    if (p.peek(10) % 255 >= 128 + chains + 64 * hunters) return { items: [], streams: [10] };
    return { items: [(p.peek(11) & 255) < 32 * m + chains ? 'x2-grenade' : 'x2-potion'], streams: [10, 11] };
  }

  it('a byte of 128 drops a Potion about half the time; the rare Grenade is one in eight of those', () => {
    let drops = 0;
    let rares = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const got = goon(seed);
      const want = oracle(seed, 0, 0, 1);
      expect({ items: got.items, streams: got.streams }, `seed ${seed}`).toEqual(want);
      if (got.items.length > 0) drops += 1;
      if (got.items[0] === 'x2-grenade') rares += 1;
    }
    expect(drops).toBeGreaterThan(40); // 50.2 percent of 120 is 60
    expect(drops).toBeLessThan(80);
    expect(rares).toBeGreaterThan(0);
    expect(rares).toBeLessThan(drops / 2);
  });

  it('the chain adds best + current to both tests: 20 hits make 40 more on the byte and 40 more on the rare share', () => {
    let drewMore = 0;
    let rareMore = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const got = goon(seed, 20);
      expect({ items: got.items, streams: got.streams }, `seed ${seed}`).toEqual(oracle(seed, 40, 0, 1)); // best 20 + current 20
      if (got.items.length > 0 && oracle(seed, 0, 0, 1).items.length === 0) drewMore += 1; // a seed that drops only because of the chain
      if (got.items[0] === 'x2-grenade' && oracle(seed, 0, 0, 1).items[0] === 'x2-potion') rareMore += 1; // a seed that is rare only because of the chain
    }
    expect(drewMore).toBeGreaterThan(0);
    expect(rareMore).toBeGreaterThan(0);
  });

  it('the best chain stays when the window runs out: 40 hits, the chain breaks, 2 more hits make best 40 + current 2', () => {
    let dearer = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const got = goon(seed, 40, 0, 2);
      expect({ items: got.items, streams: got.streams }, `seed ${seed}`).toEqual(oracle(seed, 42, 0, 1));
      if (got.items.length > 0 && oracle(seed, 4, 0, 1).items.length === 0) dearer += 1; // a seed that drops only because the best chain was remembered
    }
    expect(dearer).toBeGreaterThan(0);
  });

  it('Item Hunter adds 64 per owner to the byte, and never to the rare share; Butterfingers makes the rare slot certain and does not compound', () => {
    for (let seed = 1; seed <= 60; seed++) {
      expect(goon(seed, 0, 0x200), `hunter x3 seed ${seed}`).toMatchObject({ items: oracle(seed, 0, 3, 1).items }); // 128 + 192 = 320: every draw drops
      expect(goon(seed, 0, 0x02), `butterfingers seed ${seed}`).toMatchObject({ items: oracle(seed, 0, 0, 8).items }); // 8 x 32 = 256: a drop is always the Grenade
    }
    expect(goon(1, 0, 0x200).items.length).toBe(1);
    const sure = goon(2, 0, 0x02 | 0x200);
    expect(sure.items).toEqual(['x2-grenade']);
  });

  it('Double Items doubles a consumable once per owner', () => {
    let seed = 1;
    while (oracle(seed, 0, 0, 1).items[0] !== 'x2-potion') seed++; // a seed on which the Potion drops
    const p = board(ACT_I, seed);
    word(p, 0, 0x20, ['yuna', 'rikku']); // two owners
    p.kill(p.enemy('dr-goon'));
    expect(p.result().drops).toEqual([{ itemId: 'x2-potion', count: 4 }]);
    const q = board(ACT_I, 3);
    word(q, 0, 0x20);
    q.kill(q.enemy('ormi-entrance')); // a Black Choker is an accessory: never doubled
    expect(q.result().drops).toEqual([{ itemId: 'black-choker', count: 1 }]);
  });
});

describe('the owners (4.3): EXP, gil and AP per girl', () => {
  it('Gillionaire doubles once per owner (x8 for three), Double EXP only her own, Double and Triple AP only hers (x6 together)', () => {
    const p = board(ACT_I);
    p.unit('yuna').autoWords = [0, 0x10, 0];
    p.unit('rikku').autoWords = [0, 0x10 | 0x40, 0];
    p.unit('paine').autoWords = [0x3000, 0x10, 0];
    p.kill(p.enemy('ormi-entrance'));
    const r = p.result();
    expect(r.gil).toBe(ORMI.gil * 8);
    expect(r.exp).toBe(ORMI.exp); // the total on the screen is the plain sum
    expect(r.rewardsByMember).toEqual({ yuna: { exp: 220, ap: 1 }, rikku: { exp: 440, ap: 1 }, paine: { exp: 220, ap: 6 } });
    expect(r.ap).toBe(6);
  });

  it('a Pointless girl takes no EXP and no AP; her Gillionaire still counts', () => {
    const p = board(ACT_I);
    p.unit('rikku').autoWords = [0, 0x10, 0];
    p.status(p.unit('rikku'), 'pointless');
    p.kill(p.enemy('ormi-entrance'));
    const r = p.result();
    expect(r.rewardsByMember).toEqual({ yuna: { exp: 220, ap: 1 }, rikku: { exp: 0, ap: 0 }, paine: { exp: 220, ap: 1 } });
    expect(r.gil).toBe(ORMI.gil * 2);
  });

  it('an ejected girl is not an owner: no EXP, no AP, and her abilities do not count', () => {
    const p = board(ACT_I);
    p.unit('rikku').autoWords = [0x3000, 0x10, 0];
    p.unit('rikku').removed = true;
    p.kill(p.enemy('ormi-entrance'));
    const r = p.result();
    expect(r.rewardsByMember?.['rikku']).toEqual({ exp: 0, ap: 0 });
    expect(r.gil).toBe(ORMI.gil);
  });

  it('a girl who is down at the end loses her EXP and keeps her AP; one raised before the end keeps both of what she had', () => {
    const p = board(ACT_I);
    p.kill(p.enemy('ormi-entrance'));
    p.kill(p.unit('yuna'), 'dr-goon');
    p.status(p.unit('paine'), 'petrify');
    const r = p.result();
    expect(r.rewardsByMember).toEqual({ yuna: { exp: 0, ap: 1 }, rikku: { exp: 220, ap: 1 }, paine: { exp: 0, ap: 1 } });
    expect(r.exp).toBe(ORMI.exp); // the printed total does not change
    // she was down when the next monster fell: she takes its EXP, not its AP; raised, she keeps it
    const q = board(ACT_I);
    q.kill(q.unit('yuna'), 'dr-goon');
    q.kill(q.enemy('ormi-entrance'));
    q.raise(q.unit('yuna'));
    expect(q.result().rewardsByMember?.['yuna']).toEqual({ exp: 220, ap: 0 });
  });

  it('a girl is credited at most 99 AP in a battle, multipliers included', () => {
    const p = board('ffx2-cloister-trema'); // Trema: 50 AP a kill
    word(p, 0x3000, 0);
    const trema = p.enemy('trema');
    for (let i = 0; i < 3; i++) {
      p.kill(trema);
      p.raise(trema);
    }
    expect(p.result().rewardsByMember).toEqual({ yuna: { exp: 30000, ap: 99 }, rikku: { exp: 30000, ap: 99 }, paine: { exp: 30000, ap: 99 } });
    const q = board('ffx2-bahamut');
    q.unit('paine').autoWords = [0x3000, 0, 0];
    q.kill(q.enemy('bahamut')); // 15 AP, x6 for Paine
    expect(q.result().rewardsByMember).toEqual({ yuna: { exp: 1300, ap: 15 }, rikku: { exp: 1300, ap: 15 }, paine: { exp: 1300, ap: 90 } });
    expect(q.result().ap).toBe(90);
  });
});

describe('the results line and the other seams', () => {
  it('the gil Pilfer Gil took stays on the results line as today (a screen item), on a victory only', () => {
    const p = board(ACT_I);
    p.kill(p.enemy('ormi-entrance'));
    p.state().flags['stolenGil'] = 700;
    expect(p.result().gil).toBe(ORMI.gil + 700);
    expect(p.result('defeat').gil).toBe(0);
  });

  it('a monster with no row of the game pays its authored EXP, AP and gil and its authored drops, and still takes the stream-10 draw', () => {
    const p = board(ACT_I);
    const goonUnit = p.enemy('dr-goon');
    const fields = goonUnit.enemy as EnemyFields;
    goonUnit.enemy = { ...fields, rewards: { ...fields.rewards, exp: 7, ap: 3, gil: 9, drops: [{ itemId: 'x2-elixir', count: 2 }] } };
    delete goonUnit.enemy.ffx2Record;
    p.kill(goonUnit);
    expect(p.result()).toMatchObject({ exp: 7, ap: 3, gil: 9, drops: [{ itemId: 'x2-elixir', count: 2 }] });
    expect(p.rewardDraws.map((d) => d.stream)).toEqual([10]);
  });

  it('the advisor\'s fork carries the ledger: the copy and the original agree, and the copy\'s kills do not reach the original', () => {
    const p = board(ACT_I, 4);
    p.kill(p.enemy('ormi-entrance'));
    const f = p.fork(9);
    expect(f.state().ffx2Rewards).toEqual(p.state().ffx2Rewards);
    f.state().ffx2Rewards!.buffer.exp = 1; // the copy's ledger is its own
    expect(p.state().ffx2Rewards!.buffer.exp).toBe(ORMI.exp);
  });

  it('an Eject by a command other than Steal Will or a Bribe pays like a kill; by Steal Will it pays nothing (4.1)', () => {
    /** Find a seed on which the command lands the Eject on Dr. Goon (his resist byte cleared), then say what was paid. */
    function ejected(abilityId: string): { landed: boolean; paid: number } {
      for (let seed = 1; seed <= 300; seed++) {
        const p = board(ACT_I, seed);
        const target = p.enemy('dr-goon');
        target.immunities = {};
        p.act(p.unit('rikku'), { kind: 'ability', id: abilityId, targets: [target.id] } as Command);
        if (target.removed) return { landed: true, paid: p.rewardDraws.length };
      }
      return { landed: false, paid: -1 };
    }
    const eject = ejected('x2-berserker-eject');
    expect(eject.landed).toBe(true);
    expect(eject.paid).toBeGreaterThanOrEqual(1); // the roll ran: at least its stream-10 draw
    const steal = ejected('x2-thief-steal-will');
    expect(steal.landed).toBe(true);
    expect(steal.paid).toBe(0); // the pay flag is cleared: no roll, no draw
  });
});

describe('Chapter V\'s whole chain on the shipped line: the accounting oracle (the event log, the tapped draws and the reader\'s fixture)', () => {
  interface Row {
    exp: number;
    ap: number;
    gil: number;
    dropByte: number;
    drop: number[];
  }
  const ROWS = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/kill_reward_rows.json', import.meta.url)), 'utf8')) as Record<string, Row>;

  /** Every link's tapped draws: the engine's generator is replaced at each `init`, so the tap goes on right after it. */
  function chain(seed: number): { logs: BattleEvent[][]; taps: Tapped[][] } {
    const taps: Tapped[][] = [];
    const prepare = (e: FFX2Engine): void => {
      const init = e.init.bind(e);
      e.init = (setup): void => {
        init(setup);
        const t: Tapped[] = [];
        taps.push(t);
        (e as unknown as { rng: GameStreams }).rng.tap = (stream, value) => t.push({ stream, value });
      };
    };
    return { logs: driveChapter5(seed, 0, {}, prepare).logs, taps };
  }

  it('each link pays exactly the rows of the monsters that fell in it, the draws are one on stream 10 per knock-out and one on stream 11 per item, and the Nodes pay nothing', () => {
    let kos = 0;
    let bulwarkKos = 0;
    let nodeKos = 0;
    for (let seed = 1; seed <= 4; seed++) {
      const { logs, taps } = chain(seed);
      expect(logs.length, `seed ${seed}`).toBe(VEGNAGUN_CHAIN_ORDER.length);
      logs.forEach((log, i) => {
        const group = VEGNAGUN_CHAIN_ORDER[i]!;
        const label = `seed ${seed} link ${i + 1} (${group})`;
        const fell = log.filter((e): e is Extract<BattleEvent, { type: 'ko' }> => e.type === 'ko').map((e) => e.targetId);
        const paying = fell.filter((id) => ROWS[`${group}/${id}`] !== undefined).map((id) => ROWS[`${group}/${id}`]!);
        const victory = log.find((e): e is Extract<BattleEvent, { type: 'victory' }> => e.type === 'victory');
        expect(victory, label).toBeDefined();
        const r = victory!.result;
        // the totals: the rows of the fallen, nothing else (no ability on the shipped line, so no multiplier), and a girl is credited at most 99 AP in a battle
        // (the Head's two Redoubts fall again and again, ten AP each time)
        expect([r.exp, r.ap, r.gil], label).toEqual([paying.reduce((s, x) => s + x.exp, 0), Math.min(99, paying.reduce((s, x) => s + x.ap, 0)), paying.reduce((s, x) => s + x.gil, 0)]);
        // the draws: one on stream 10 for every knock-out (a girl's too) and one on stream 11 for every item that dropped; no theft in this line
        expect(log.some((e) => e.type === 'message' && /stole|pilfer|bribe/i.test(e.text)), label).toBe(false);
        const t = taps[i]!;
        expect(t.filter((d) => d.stream === 10).length, label).toBe(fell.length);
        const items = r.drops.reduce((s, d) => s + d.count, 0);
        expect(t.filter((d) => d.stream === 11).length, label).toBe(items);
        // the items: a 255 byte drops once, a 0 byte never, 128 at most once, each from the row's two slots
        const sure = paying.filter((x) => x.dropByte === 255).length;
        const maybe = paying.filter((x) => x.dropByte === 128).length;
        expect(items, label).toBeGreaterThanOrEqual(sure);
        expect(items, label).toBeLessThanOrEqual(sure + maybe);
        kos += fell.length;
        bulwarkKos += fell.filter((id) => id.startsWith('bulwark')).length;
        nodeKos += fell.filter((id) => id.startsWith('node-')).length;
      });
    }
    expect(kos).toBeGreaterThan(20);
    expect(nodeKos).toBe(0); // the three Nodes carry 300,000 HP and the fight never asks the party to kill them: they pay nothing now
    expect(bulwarkKos).toBeGreaterThanOrEqual(0);
  }, 300_000);
});
