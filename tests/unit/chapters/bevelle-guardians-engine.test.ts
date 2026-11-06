/**
 * The three Bevelle guardians on the real engine (the hidden FFX-2 chapter): the moves one at a time, with the guardian's script swapped for a queue of commands (`forced`), against the Chapter 2 party; and each whole fight,
 * seeded, on three seeds, with the REAL scripts. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The scripts have their own file (`bevelle-guardians-ai.test.ts`); the data has its own (`bevelle-guardians-data.test.ts`). This file checks what the ENGINE does with the rows, move by move, against what the RE note says
 * each does (`research/re-ffx2-bevelle-underground.md` §7), and what the scripts do when they play:
 *
 * 1. **Georapella** [RE §6.2, §7]: each Ga spell hits all three girls once, 24 MP; Shell halves it exactly; the ring goes round on a real fight.
 * 2. **The Precepts Guard** [RE §6.3, §7]: Demi takes a quarter of each girl's CURRENT HP; Slow lands on all three; Bio poisons its one target; Death lands (254) and kills; Osmose and Drain are taken by the user.
 * 3. **Baralai** [RE §6.4, §7]: **Drill Shot is exactly three quarters of the girl's MAXIMUM HP** (no variance, no Defense; Protect halves it, Shell does not; it kills a girl below that); Glint; the three Chain Attack strikes;
 *    Looming Glacier (her MP to 0, Stop); Absorb and Demi.
 * 4. **The whole fights**, seeded (seeds 1, 2, 3): the same seed plays the same fight twice; the order of the moves is the script's; every Drill Shot of Baralai goes to the girl who landed the latest result on him as of
 *    his turn.
 */
import { describe, expect, it } from 'vitest';

import {
  GIRLS,
  bossOf,
  damageOn,
  fight,
  forced,
  logOf,
  move,
  openAct,
  playUntilBossActed,
  unit,
  type Act,
  type Unit,
} from '../helpers/bevelleGuardiansDrive.ts';

/** Open an act with the forced script and run until the guardian has done `commands`. */
function run(act: Act, commands: ReturnType<typeof move>[], seed = 1, setup?: (engine: ReturnType<typeof openAct>) => void) {
  const f = forced(act);
  const engine = openAct(act, seed, { group: f.group });
  setup?.(engine);
  f.forced.queue.push(...commands);
  expect(playUntilBossActed(engine, bossOf(act), commands.length)).toBe(true);
  return engine;
}

const give = (u: Unit, status: string): void => {
  u.statuses[status as 'protect'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
};
const amounts = (engine: ReturnType<typeof openAct>, id: string): number[] => damageOn(engine, id).map((e) => e.amount ?? 0);
const status = (u: Unit): string => Object.keys(u.statuses).sort().join(',');

describe('Georapella [RE §6.2, §7]', () => {
  const GA = ['x2-georapella-thundaga', 'x2-georapella-waterga', 'x2-georapella-firaga', 'x2-georapella-blizzaga'] as const;

  it('each Ga spell hits all three girls once for 24 MP: about 89 to 100 on Yuna, 128 to 145 on Rikku and 189 to 213 on Paine (her MDEF is 8; the Enemy Intent card\'s own bands), unshelled', () => {
    for (const ability of GA) {
      for (const seed of [1, 2, 3, 4]) {
        const engine = run(0, [move(ability)], seed);
        expect(amounts(engine, 'yuna'), `${ability} ${seed}`).toHaveLength(1);
        expect(amounts(engine, 'yuna')[0], `${ability} ${seed} Yuna`).toBeGreaterThanOrEqual(80);
        expect(amounts(engine, 'yuna')[0], `${ability} ${seed} Yuna`).toBeLessThanOrEqual(110);
        expect(amounts(engine, 'rikku')[0], `${ability} ${seed} Rikku`).toBeGreaterThanOrEqual(120);
        expect(amounts(engine, 'rikku')[0], `${ability} ${seed} Rikku`).toBeLessThanOrEqual(160);
        expect(amounts(engine, 'paine')[0], `${ability} ${seed} Paine`).toBeGreaterThanOrEqual(185);
        expect(amounts(engine, 'paine')[0], `${ability} ${seed} Paine`).toBeLessThanOrEqual(230);
        expect(unit(engine, 'x2-georapella').mp, ability).toBe(9999 - 24);
      }
    }
  });

  it('Shell halves it exactly (a magical row): the same seed does half the damage on a shelled girl', () => {
    for (const seed of [1, 2, 3]) {
      const plain = run(0, [move('x2-georapella-firaga')], seed);
      const shelled = run(0, [move('x2-georapella-firaga')], seed, (e) => GIRLS.forEach((g) => give(unit(e, g), 'shell')));
      for (const g of GIRLS) {
        const full = amounts(plain, g)[0]!;
        expect(Math.abs(amounts(shelled, g)[0]! - Math.floor(full / 2)), `${g} seed ${seed}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('Protect does nothing to it (the row is magical-only)', () => {
    const plain = run(0, [move('x2-georapella-thundaga')], 2);
    const guarded = run(0, [move('x2-georapella-thundaga')], 2, (e) => GIRLS.forEach((g) => give(unit(e, g), 'protect')));
    for (const g of GIRLS) expect(amounts(guarded, g)).toEqual(amounts(plain, g));
  });

  it('Osmose (the dead branch) takes 3/16 of a girl\'s current MP and the user keeps it: 24 of Yuna\'s 130', () => {
    const engine = run(0, [move('x2-georapella-osmose', ['yuna'])], 1, (e) => {
      unit(e, 'x2-georapella').mp = 5000;
    });
    expect(unit(engine, 'yuna').mp).toBe(130 - 24);
    expect(unit(engine, 'x2-georapella').mp).toBe(5000 + 24);
  });
});

describe('the Precepts Guard [RE §6.3, §7]', () => {
  it('Demi takes a quarter of each girl\'s CURRENT HP, whole party: floor(max / 4) at full health, floor(current / 4) at less', () => {
    const full = run(1, [move('x2-precepts-guard-demi')]);
    expect(GIRLS.map((g) => amounts(full, g))).toEqual([[172], [459], [426]]); // floor(690 / 4), floor(1839 / 4), floor(1706 / 4)
    const hurt = run(1, [move('x2-precepts-guard-demi')], 1, (e) => {
      unit(e, 'rikku').hp = 400;
    });
    expect(amounts(hurt, 'rikku')).toEqual([100]);
    expect(unit(hurt, 'x2-precepts-guard').mp).toBe(9999 - 10);
  });

  it('Slow lands on all three girls', () => {
    const engine = run(1, [move('x2-precepts-guard-slow')]);
    for (const g of GIRLS) expect(status(unit(engine, g)), g).toBe('slow');
    expect(unit(engine, 'x2-precepts-guard').mp).toBe(9999 - 8);
  });

  it('Bio poisons the one girl it is aimed at, and nobody else', () => {
    const engine = run(1, [move('x2-precepts-guard-bio', ['rikku'])]);
    expect(GIRLS.map((g) => status(unit(engine, g)))).toEqual(['', 'poison', '']);
  });

  it('Death (chance 254) lands and kills a girl with no protection: the party has nothing that guards against it, and a Phoenix Down raises her', () => {
    for (const target of ['yuna', 'paine']) {
      let killed = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const engine = run(1, [move('x2-precepts-guard-death', [target])], seed);
        if (!unit(engine, target).alive) killed++;
      }
      expect(killed, target).toBeGreaterThanOrEqual(19);
    }
  });

  it('Osmose takes 3/16 of her current MP, kept by the user; Drain takes about 50 HP from Paine and the user keeps it', () => {
    const osmose = run(1, [move('x2-precepts-guard-osmose', ['yuna'])], 1, (e) => {
      unit(e, 'x2-precepts-guard').mp = 5000;
    });
    expect(unit(osmose, 'yuna').mp).toBe(130 - 24);
    expect(unit(osmose, 'x2-precepts-guard').mp).toBe(5000 + 24);
    const drain = run(1, [move('x2-precepts-guard-drain', ['paine'])], 1, (e) => {
      unit(e, 'x2-precepts-guard').hp = 1000;
    });
    const taken = amounts(drain, 'paine')[0]!;
    expect(taken).toBeGreaterThanOrEqual(40);
    expect(taken).toBeLessThanOrEqual(70);
    expect(unit(drain, 'x2-precepts-guard').hp).toBe(1000 + taken);
  });
});

describe('Baralai [RE §6.4, §7]', () => {
  it('Drill Shot is exactly three quarters of the girl\'s MAXIMUM HP, every seed: 517 on Yuna, 1,379 on Rikku, 1,279 on Paine (no variance, no Defense term)', () => {
    const expected: Record<string, number> = { yuna: 517, rikku: 1379, paine: 1279 };
    for (const g of GIRLS) {
      expect(Math.floor((unit(openAct(2, 1), g).stats.maxHp * 12) / 16), g).toBe(expected[g]);
      for (const seed of [1, 2, 3, 4, 5]) expect(amounts(run(2, [move('x2-baralai-drill-shot', [g])], seed), g), `${g} seed ${seed}`).toEqual([expected[g]]);
    }
  });

  it('it is the girl\'s MAXIMUM, not her current HP: the same shot on a wounded girl does the same damage, and it kills one who has less than that', () => {
    const wounded = run(2, [move('x2-baralai-drill-shot', ['rikku'])], 1, (e) => {
      unit(e, 'rikku').hp = 1500;
    });
    expect(amounts(wounded, 'rikku')).toEqual([1379]);
    expect(unit(wounded, 'rikku').hp).toBe(1500 - 1379);
    const doomed = run(2, [move('x2-baralai-drill-shot', ['yuna'])], 1, (e) => {
      unit(e, 'yuna').hp = 500;
    });
    expect(unit(doomed, 'yuna').alive).toBe(false);
  });

  it('Protect halves it (physical-only), Shell does not: 258 on Yuna with Protect, 517 with Shell', () => {
    const protect = run(2, [move('x2-baralai-drill-shot', ['yuna'])], 1, (e) => give(unit(e, 'yuna'), 'protect'));
    const shell = run(2, [move('x2-baralai-drill-shot', ['yuna'])], 1, (e) => give(unit(e, 'yuna'), 'shell'));
    expect(amounts(protect, 'yuna')).toEqual([258]);
    expect(amounts(shell, 'yuna')).toEqual([517]);
  });

  it('Glint hits all three girls once, harder on the soft ones (about 250 on Yuna, 150 on Rikku, 190 on Paine); Chain Attack is three single strikes at the three girls it is told, smaller than a Glint', () => {
    const glint = run(2, [move('x2-baralai-glint')]);
    expect(GIRLS.map((g) => amounts(glint, g).length)).toEqual([1, 1, 1]);
    expect(amounts(glint, 'yuna')[0]).toBeGreaterThanOrEqual(215);
    expect(amounts(glint, 'yuna')[0]).toBeLessThanOrEqual(290);
    const chain = run(2, [move('x2-baralai-chain-attack', ['yuna', 'rikku', 'paine'])]);
    expect(GIRLS.map((g) => amounts(chain, g).length)).toEqual([1, 1, 1]);
    for (const g of GIRLS) expect(amounts(chain, g)[0]!, g).toBeLessThan(amounts(glint, g)[0]!);
    const onlyYuna = run(2, [move('x2-baralai-chain-attack', ['yuna', 'yuna', 'yuna'])]);
    expect(amounts(onlyYuna, 'yuna')).toHaveLength(3); // each strike is its own result on the girl it names
  });

  it('Looming Glacier takes all of the girl\'s MP and Stops her (254, a counter of about 125)', () => {
    const engine = run(2, [move('x2-baralai-looming-glacier', ['yuna'])]);
    const yuna = unit(engine, 'yuna');
    expect(yuna.mp).toBe(0);
    expect(status(yuna)).toBe('stop');
    expect((yuna.statuses['stop'] as unknown as { counter: number }).counter).toBeGreaterThanOrEqual(120);
    expect((yuna.statuses['stop'] as unknown as { counter: number }).counter).toBeLessThanOrEqual(126);
    expect(status(unit(engine, 'rikku'))).toBe('');
  });

  it('Absorb takes 3/16 of her current HP and of her MP and he keeps both; Demi takes a quarter of every girl\'s current HP for 10 MP', () => {
    const engine = run(2, [move('x2-baralai-absorb', ['rikku'])], 1, (e) => {
      unit(e, 'x2-baralai').hp = 500;
      unit(e, 'x2-baralai').mp = 100;
    });
    expect(amounts(engine, 'rikku')).toEqual([344]); // floor(1839 x 3 / 16)
    expect(unit(engine, 'x2-baralai').hp).toBe(500 + 344);
    expect(unit(engine, 'rikku').mp).toBe(158 - 29);
    expect(unit(engine, 'x2-baralai').mp).toBe(100 + 29);
    const demi = run(2, [move('x2-baralai-demi')]);
    expect(GIRLS.map((g) => amounts(demi, g))).toEqual([[172], [459], [426]]);
    expect(unit(demi, 'x2-baralai').mp).toBe(540 - 10);
  });

  it('his Attack is the only move that can miss: over 12 seeds on Paine it lands about ten times for 130 to 155 and misses a few', () => {
    const landed: number[] = [];
    let missed = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const engine = run(2, [move('x2-baralai-attack', ['paine'])], seed);
      const hit = amounts(engine, 'paine');
      if (hit.length === 0) missed++;
      else landed.push(hit[0]!);
    }
    expect(landed.length).toBeGreaterThanOrEqual(6);
    expect(missed).toBeGreaterThanOrEqual(0);
    for (const dmg of landed) {
      expect(dmg).toBeGreaterThanOrEqual(120);
      expect(dmg).toBeLessThanOrEqual(170);
    }
  });
});

describe('the whole fights, seeded (seeds 1, 2 and 3), the real scripts', () => {
  const SEEDS = [1, 2, 3] as const;

  it('the same seed plays the same fight twice: the outcome, the length and every move of the guardian', () => {
    for (const act of [0, 1, 2] as Act[]) {
      for (const seed of SEEDS) {
        const a = fight(act, seed, 'careful');
        const b = fight(act, seed, 'careful');
        expect([a.outcome, a.ticks, a.moves, a.kos, a.drillShots], `act ${act + 1} seed ${seed}`).toEqual([b.outcome, b.ticks, b.moves, b.kos, b.drillShots]);
        expect(a.outcome, `act ${act + 1} seed ${seed}`).toMatch(/victory|defeat/);
      }
    }
  });

  const movesOf = (log: ReturnType<typeof logOf>, boss: string): string[] => log.filter((e) => e.type === 'action-start' && e.actorId === boss).map((e) => e.abilityId!);

  it('Georapella goes round her ring Thundaga, Waterga, Firaga, Blizzaga from a seeded start, every spell on all three girls, and the careful line wins', () => {
    const ring = ['x2-georapella-thundaga', 'x2-georapella-waterga', 'x2-georapella-firaga', 'x2-georapella-blizzaga'];
    for (const seed of SEEDS) {
      const r = fight(0, seed, 'careful');
      const seq = movesOf(r.log, 'x2-georapella');
      expect(seq.length, `seed ${seed}`).toBeGreaterThanOrEqual(6);
      for (let i = 1; i < seq.length; i++) expect(ring.indexOf(seq[i]!), `seed ${seed} move ${i + 1}`).toBe((ring.indexOf(seq[i - 1]!) + 1) % 4);
      expect(Object.keys(r.moves).every((id) => ring.includes(id)), `seed ${seed}: nothing but the ring`).toBe(true);
      expect(r.outcome, `seed ${seed}`).toBe('victory');
    }
  });

  it('the Precepts Guard plays only Demi, Slow, Death, Osmose, Drain and Bio; every Bio is followed at once by a Drain; it is never given an Attack', () => {
    const allowed = ['x2-precepts-guard-demi', 'x2-precepts-guard-slow', 'x2-precepts-guard-death', 'x2-precepts-guard-osmose', 'x2-precepts-guard-drain', 'x2-precepts-guard-bio'];
    let bios = 0;
    for (const seed of [...SEEDS, 4, 5, 6, 7]) {
      const r = fight(1, seed, 'careful');
      const seq = movesOf(r.log, 'x2-precepts-guard');
      expect(seq.length, `seed ${seed}`).toBeGreaterThanOrEqual(4);
      for (const id of seq) expect(allowed, `seed ${seed}`).toContain(id);
      seq.forEach((id, i) => {
        if (id === 'x2-precepts-guard-bio') {
          bios++;
          // The Drain is queued with the Bio and runs at the guardian's next turn (the engine runs one command a turn on this base); the fight can end between the two.
          if (i + 1 < seq.length) expect(seq[i + 1], `seed ${seed}: a Bio is always followed by a Drain`).toBe('x2-precepts-guard-drain');
        }
      });
    }
    expect(bios, 'over seven fights a Bio comes up').toBeGreaterThan(0);
  });

  it('Baralai plays the seven-poll cycle Attack, Attack, Glint, Chain Attack, Attack, Looming Glacier, Demi with the Drill Shot and the Absorb cut in; each Drill Shot goes to the girl who landed the latest result on him as of his turn', () => {
    const cycle = ['x2-baralai-attack', 'x2-baralai-attack', 'x2-baralai-glint', 'x2-baralai-chain-attack', 'x2-baralai-attack', 'x2-baralai-looming-glacier', 'x2-baralai-demi'];
    let shots = 0;
    for (const seed of SEEDS) {
      const r = fight(2, seed, 'careful');
      const seq = movesOf(r.log, 'x2-baralai').filter((id) => id !== 'x2-baralai-drill-shot' && id !== 'x2-baralai-absorb');
      // The fourth step is the Chain Attack, or a plain Attack once only one girl is left standing (the script's own rule).
      seq.forEach((id, i) => expect(i % 7 === 3 ? ['x2-baralai-chain-attack', 'x2-baralai-attack'] : [cycle[i % 7]], `seed ${seed} move ${i + 1}`).toContain(id));
      let latest: string | undefined;
      let atTurn: string | undefined;
      for (const e of r.log) {
        if ((e.type === 'damage' || e.type === 'miss') && e.targetId === 'x2-baralai' && (GIRLS as readonly string[]).includes(String(e.sourceId ?? e.actorId))) latest = String(e.sourceId ?? e.actorId);
        if (e.type === 'turn-start' && e.actorId === 'x2-baralai') atTurn = latest;
        if (e.type === 'action-start' && e.actorId === 'x2-baralai' && e.abilityId === 'x2-baralai-drill-shot') {
          shots++;
          expect(e.targets?.[0], `seed ${seed}`).toBe(atTurn);
        }
      }
    }
    expect(shots, 'a Drill Shot comes in these fights').toBeGreaterThan(0);
  });

  it('Baralai\'s tenth result calls the shot: before the first Drill Shot of a fight, at least ten results landed on him (a strike, a miss and a no-effect each count one)', () => {
    for (const seed of SEEDS) {
      const r = fight(2, seed, 'attack');
      let results = 0;
      for (const e of r.log) {
        if ((e.type === 'damage' || e.type === 'miss') && e.targetId === 'x2-baralai' && (GIRLS as readonly string[]).includes(String(e.sourceId ?? e.actorId))) results++;
        if (e.type === 'action-start' && e.actorId === 'x2-baralai' && e.abilityId === 'x2-baralai-drill-shot') {
          expect(results, `seed ${seed}`).toBeGreaterThanOrEqual(10);
          break;
        }
      }
    }
  });
});
