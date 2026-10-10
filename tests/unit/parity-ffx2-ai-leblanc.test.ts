/**
 * **Re-parity AI lane C, the Leblanc Syndicate** (Chapter VI, Acts I to III; **FFX-2 only**): the decision tables of
 * `research/re-ffx2-ai-leblanc-den-ixion.md` section 3 (rows O, L, G and K of section 8), walked on the real scripts.
 *
 * The rolls are fed as raw 16-bit values (`random() % n`), so each row's condition and its expression are checked as the
 * note writes them, and a poll's draw count is checked where the note says a search draws nothing (fewer than two
 * candidates) or draws twice (the pair of searches). Two of the note's tallies are reproduced: Leblanc's command order
 * (the deterministic walk of her counters, `MG A N - S L A M A S L N - ...`, No Love Lost on commands 3, 11, 19 ... and
 * Not-So-Mighty Guard on 1 and 29: `parity-ffx2-ai-leblanc-boss.test.ts`), and the exact residue counts of the scripts' `random() % n` over all 65,536 values.
 */

import { describe, expect, it } from 'vitest';
import * as data from '../../src/data/ffx2/index.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { mem, setMem } from '../../src/battle/ffx2/internal.ts';
import { enemy, bench, type Bench } from './helpers/ffx2ScriptRig.ts';

const ATTACK = 'x2-ormi-shield-bash';
const SUPERCOLLIDER = 'x2-ormi-supercollider';
const HUGGLES = 'x2-ormi-huggles';
const BLAST = 'x2-ormi-concussive-blast';

// ---------------------------------------------------------------------------------------------------------------------
// Ormi
// ---------------------------------------------------------------------------------------------------------------------

type Room = 'act1' | 'act2' | 'act3';

function ormiBench(room: Room, hp?: number): Bench {
  if (room === 'act1') {
    return bench(enemy('ormi-entrance', 1640, { mp: 40, ...(hp !== undefined ? { hp } : {}) }), 'ffx2-leblanc-ormi-act1', [enemy('fem-goon', 167, { slot: 1 }), enemy('dr-goon', 232, { slot: 2 })]);
  }
  if (room === 'act2') {
    return bench(enemy('ormi-logos-room', 1840, { mp: 42, ...(hp !== undefined ? { hp } : {}) }), 'ffx2-leblanc-ormi-act2', [enemy('logos-room', 1432, { slot: 1 })]);
  }
  return bench(enemy('ormi', 1344, { mp: 45, ...(hp !== undefined ? { hp } : {}) }), 'ffx2-leblanc-ormi', [enemy('leblanc', 1380, { slot: 1 }), enemy('logos', 989, { slot: 2 })]);
}

/** Take every ally of the bench out of the fight. */
function alone(b: Bench): void {
  for (const o of b.others) o.alive = false;
}

describe('Ormi (m243, m244, m245): rows O1 to O7', () => {
  for (const room of ['act1', 'act2', 'act3'] as const) {
    it(`${room}: counter 1 to 3 an Attack on a girl, counter 4 the Supercollider on the farthest girl, then the counter starts again (O5)`, () => {
      const b = ormiBench(room);
      expect(b.id(b.poll(1))).toBe(ATTACK);
      expect(b.targets(b.poll(1))).toEqual(['rikku']);
      expect(b.targets(b.poll(2))).toEqual(['paine']);
      b.rng.calls.length = 0;
      const fourth = b.poll();
      expect([b.id(fourth), b.targets(fourth)]).toEqual([SUPERCOLLIDER, ['paine']]); // the highest slot: owner-approved stand-in (D-018/q3)
      expect(b.rng.calls).toEqual([]); // one extreme draws nothing
      expect(mem(b.self, 'ormiTurn')).toBe(0);
      expect([b.id(b.poll(0)), b.id(b.poll(0)), b.id(b.poll(0)), b.id(b.poll())]).toEqual([ATTACK, ATTACK, ATTACK, SUPERCOLLIDER]);
    });
  }

  it('Acts I and II have no Concussive Blast at any HP; Act III rolls it below a quarter, and only then (O1)', () => {
    for (const room of ['act1', 'act2'] as const) {
      const b = ormiBench(room, 1);
      const command = b.poll(0); // one draw, for the Attack's girl: no `% 4` roll is made
      expect(b.id(command)).toBe(ATTACK);
      expect(b.rng.calls).toEqual([[0, 2]]);
    }
    // Act III: 1,344 / 4 = 336, so 335 or less rolls (strict), 336 does not.
    const above = ormiBench('act3', 336);
    expect(above.id(above.poll(0))).toBe(ATTACK);
    expect(above.rng.calls).toEqual([[0, 2]]);
    const below = ormiBench('act3', 335);
    const blast = below.poll(4); // 4 % 4 = 0 : the Blast, and the poll ends
    expect([below.id(blast), below.targets(blast)]).toEqual([BLAST, []]);
    expect(below.rng.calls).toEqual([[0, 0xffff]]);
    expect(mem(below.self, 'ormiTurn')).toBe(0); // the counter is not advanced by a Blast poll
    expect(below.id(below.poll(1, 0))).toBe(ATTACK); // 1 % 4 : goes on to the cycle, which counts this poll
    expect(mem(below.self, 'ormiTurn')).toBe(1);
  });

  it('the quarter line is integer: 1,343 / 4 = 335, so 335 HP is not below it and 334 is (O1)', () => {
    const odd = enemy('ormi', 1343, { mp: 45, hp: 335 });
    const b = bench(odd, 'ffx2-leblanc-ormi', [enemy('leblanc', 1380, { slot: 1 })]);
    expect(b.id(b.poll(0))).toBe(ATTACK);
    expect(b.rng.calls.length).toBe(1); // no roll
    odd.hp = 334;
    expect(b.id(b.poll(0))).toBe(BLAST);
  });

  it('the Blast roll costs the cycle nothing: the Blast polls never move the counter (O5)', () => {
    const b = ormiBench('act3', 100);
    expect(b.id(b.poll(1, 0))).toBe(ATTACK); // turn 1
    expect(b.id(b.poll(0))).toBe(BLAST);
    expect(b.id(b.poll(4))).toBe(BLAST);
    expect(b.id(b.poll(1, 0))).toBe(ATTACK); // turn 2
    expect(b.id(b.poll(1, 0))).toBe(ATTACK); // turn 3
    expect(b.id(b.poll(1))).toBe(SUPERCOLLIDER); // turn 4: the Blast polls in between did not shift it
  });

  it('either ally keeps the cycle going; alone, `random() % 4` picks Huggles, Supercollider or an Attack (O6)', () => {
    const act3 = ormiBench('act3');
    act3.others[0]!.alive = false; // Leblanc down, Logos stands
    expect(act3.id(act3.poll(0))).toBe(ATTACK);
    act3.others[1]!.alive = false; // both down
    act3.rng.calls.length = 0;
    const huggles = act3.poll(0, 1, 0); // `0 % 4`; the pair's first search draws (index 1) and is thrown away; HP is a three-way tie
    expect(act3.id(huggles)).toBe(HUGGLES);
    expect(act3.rng.calls).toEqual([[0, 0xffff], [0, 2], [0, 2]]);
    const act1 = ormiBench('act1');
    act1.others[0]!.alive = false; // Fem-Goon down, Dr. Goon stands
    expect(act1.id(act1.poll(0))).toBe(ATTACK);
    act1.others[1]!.alive = false;
    expect(act1.id(act1.poll(4, 0, 0))).toBe(HUGGLES); // 4 % 4 = 0 : the expression is the modulus, not a comparison
  });

  it('alone, the 65,536 values give Huggles 16,384, Supercollider 16,384 and an Attack 32,768 (the note: 25 / 25 / 50)', () => {
    const b = ormiBench('act1');
    alone(b);
    b.girls[0]!.mp = 10; b.girls[1]!.mp = 300; b.girls[2]!.mp = 50; // one highest-MP girl: the pair draws nothing for ties
    const tally: Record<string, number> = {};
    for (let v = 0; v <= 0xffff; v++) {
      b.rng.drain();
      const id = b.id(b.poll(v, 0, 0));
      tally[id!] = (tally[id!] ?? 0) + 1;
    }
    expect(tally).toEqual({ [HUGGLES]: 16384, [SUPERCOLLIDER]: 16384, [ATTACK]: 32768 });
  });

  it('Huggles goes to the girl with the highest MP in Acts I and II and the highest HP in Act III; ties are drawn (O2)', () => {
    for (const room of ['act1', 'act2'] as const) {
      const b = ormiBench(room);
      alone(b);
      b.girls[0]!.mp = 100; b.girls[1]!.mp = 300; b.girls[2]!.mp = 200;
      b.girls[0]!.hp = 900; b.girls[1]!.hp = 100; b.girls[2]!.hp = 500;
      expect(b.targets(b.poll(0, 2))).toEqual(['rikku']);
      b.girls[2]!.mp = 300; // a tie for the highest MP: the pick among the two is drawn
      b.rng.drain();
      expect(b.targets(b.poll(0, 0, 0))).toEqual(['rikku']); // Rikku and Paine tie; the draw takes the first
      expect(b.rng.calls.at(-1)).toEqual([0, 1]);
      b.rng.drain();
      expect(b.targets(b.poll(0, 0, 1))).toEqual(['paine']);
    }
    const act3 = ormiBench('act3');
    alone(act3);
    act3.girls[0]!.mp = 100; act3.girls[1]!.mp = 300; act3.girls[2]!.mp = 200;
    act3.girls[0]!.hp = 900; act3.girls[1]!.hp = 100; act3.girls[2]!.hp = 500;
    expect(act3.targets(act3.poll(0, 0))).toEqual(['yuna']);
  });

  it('a search over one candidate draws nothing: with one girl left the Attack and Huggles need no pick (script-rolls)', () => {
    const b = ormiBench('act3');
    b.girls[1]!.alive = false; b.girls[2]!.alive = false;
    const attack = b.poll();
    expect([b.id(attack), b.targets(attack)]).toEqual([ATTACK, ['yuna']]);
    expect(b.rng.calls).toEqual([]);
    alone(b);
    const huggles = b.poll(0);
    expect([b.id(huggles), b.targets(huggles)]).toEqual([HUGGLES, ['yuna']]);
    expect(b.rng.calls).toEqual([[0, 0xffff]]); // the `% 4`, nothing for either search
  });

  it('the script ids are one per room, and each room\'s enemy runs its own (O1, O7)', () => {
    const ids = [['ffx2-leblanc-entrance', 'ormi-entrance', 'ffx2-leblanc-ormi-act1'], ['ffx2-leblanc-logos-room', 'ormi-logos-room', 'ffx2-leblanc-ormi-act2'], ['ffx2-leblanc-last-room', 'ormi', 'ffx2-leblanc-ormi']] as const;
    for (const [group, id, script] of ids) {
      const e = data.ENEMY_GROUPS_BY_ID[group]!.enemies.find((x) => x.id === id)!;
      expect(e.aiScriptId).toBe(script);
      expect(aiScriptFor(script).id).toBe(script);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Logos
// ---------------------------------------------------------------------------------------------------------------------

describe('Logos (m249, m250): rows G1 to G3', () => {
  const PISTOL = 'x2-logos-double-shot';
  const ROULETTE = 'x2-logos-russian-roulette';
  const HAIL = 'x2-logos-hail-of-bullets';

  it('Act II: three Pistols, then Russian Roulette, then the counter starts again; never a Hail of Bullets (G1)', () => {
    const b = bench(enemy('logos-room', 1432, { mp: 64 }), 'ffx2-leblanc-logos-act2', [enemy('ormi-logos-room', 1840, { slot: 1 })]);
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) seen.push(b.id(b.poll(i % 3))!);
    expect(seen.slice(0, 8)).toEqual([PISTOL, PISTOL, PISTOL, ROULETTE, PISTOL, PISTOL, PISTOL, ROULETTE]);
    expect(seen).not.toContain(HAIL);
    expect(seen.filter((x) => x === ROULETTE).length).toBe(10); // one in four, the note's "Roulette on every 4th turn"
  });

  it('Act III: five turns of 25% Hail of Bullets on the party, else a Pistol, then Roulette (G1)', () => {
    for (let counter = 0; counter < 5; counter++) {
      const hail = bench(enemy('logos', 989, { mp: 70 }), 'ffx2-leblanc-logos', [enemy('ormi', 1344, { slot: 1 })]);
      setMem(hail.self, 'logosTurn', counter);
      const command = hail.poll(4); // 4 % 4 = 0
      expect([hail.id(command), hail.targets(command)]).toEqual([HAIL, []]);
      const pistol = bench(enemy('logos', 989, { mp: 70 }), 'ffx2-leblanc-logos', [enemy('ormi', 1344, { slot: 1 })]);
      setMem(pistol.self, 'logosTurn', counter);
      expect(pistol.id(pistol.poll(3, 2))).toBe(PISTOL);
    }
    const sixth = bench(enemy('logos', 989, { mp: 70 }), 'ffx2-leblanc-logos', [enemy('ormi', 1344, { slot: 1 })]);
    setMem(sixth.self, 'logosTurn', 5);
    expect(sixth.id(sixth.poll(1))).toBe(ROULETTE);
    expect(mem(sixth.self, 'logosTurn')).toBe(0);
  });

  it('Act III: the Hail takes 16,384 of the 65,536 values on every one of the five turns (25%)', () => {
    const b = bench(enemy('logos', 989, { mp: 70 }), 'ffx2-leblanc-logos', [enemy('ormi', 1344, { slot: 1 })]);
    for (let counter = 0; counter < 5; counter++) {
      let hails = 0;
      for (let v = 0; v <= 0xffff; v++) {
        setMem(b.self, 'logosTurn', counter);
        b.rng.drain();
        if (b.id(b.poll(v, 0)) === HAIL) hails += 1;
      }
      expect(hails, `counter ${counter + 1}`).toBe(16384);
    }
  });

  it('Russian Roulette is the engine\'s one pick of five rows, 1 in 5 each, Death and Petrify at 30 and no Eject (G2)', () => {
    const roulette = data.ABILITIES[ROULETTE]!.ffx2Record!;
    expect(roulette.pickOne?.map((row) => row.status1)).toEqual([{ 0: 30 }, { 8: 100 }, { 3: 100 }, { 1: 30 }, { 5: 100 }]);
    for (const row of roulette.pickOne ?? []) expect(row.status1?.[10], 'no row carries Eject (group-1 slot 10)').toBeUndefined();
  });

  it('every pick is a uniform girl; with one girl left nothing is drawn', () => {
    const b = bench(enemy('logos', 989, { mp: 70 }), 'ffx2-leblanc-logos', [enemy('ormi', 1344, { slot: 1 })]);
    b.girls[0]!.alive = false; b.girls[1]!.alive = false;
    const command = b.poll(3);
    expect([b.id(command), b.targets(command)]).toEqual([PISTOL, ['paine']]);
    expect(b.rng.calls).toEqual([[0, 0xffff]]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The goons
// ---------------------------------------------------------------------------------------------------------------------

describe('Dr. Goon (m135) and Fem-Goon (m138): rows K1 and K2', () => {
  const FAN = 'x2-leblanc-fan-slap';
  const fem = (mp = 270): Bench => bench(enemy('fem-goon', 167, { mp, slot: 1 }), 'ffx2-leblanc-fem-goon', [enemy('dr-goon', 232, { slot: 2 })]);

  it('Dr. Goon attacks a girl every poll and does nothing else', () => {
    const b = bench(enemy('dr-goon', 232, { mp: 41, slot: 2 }), 'ffx2-leblanc-dr-goon', [enemy('fem-goon', 167, { slot: 1 })]);
    for (let i = 0; i < 6; i++) expect(b.id(b.poll(i % 3))).toBe('x2-goon-strike');
  });

  it('Fem-Goon, in the script\'s order: `% 4 = 0` an Attack on an unpetrified girl (row 1)', () => {
    const b = fem();
    b.girls[0]!.statuses.petrify = { id: 'petrify' } as never;
    const command = b.poll(4, 0); // 4 % 4 = 0; the candidates are Rikku and Paine
    expect([b.id(command), b.targets(command)]).toEqual([FAN, ['rikku']]);
  });

  it('under 13 MP she Attacks instead of casting, 13 MP does not (row 2)', () => {
    const poor = fem(12);
    expect(poor.id(poor.poll(1, 0))).toBe(FAN);
    const ok = fem(13);
    expect(ok.id(ok.poll(1, 1, 0))).toBe('x2-fem-goon-fire');
  });

  it('with all three girls below half their maximum HP (a fallen girl counts) she casts a single-target spell on the lowest-HP girl (row 3)', () => {
    const b = fem();
    b.girls[0]!.hp = 499; b.girls[1]!.hp = 100; b.girls[2]!.hp = 0; b.girls[2]!.alive = false;
    // 1 % 4, then the pair over the two living girls (a discarded pick of index 1) and the spell index 2 = Watera
    const command = b.poll(1, 1, 2);
    expect([b.id(command), b.targets(command)]).toEqual(['x2-fem-goon-watera', ['rikku']]);
    b.girls[0]!.hp = 500; // exactly half is not below it: the ordinary rows
    b.rng.drain();
    expect(b.id(b.poll(1, 0, 0, 0))).toBe('x2-fem-goon-fira'); // `% 2 = 0`: the girl first (index 0), then the spell
  });

  it('otherwise `% 2` picks one single-target spell on a uniform girl or one party-wide base spell (rows 4, 5)', () => {
    const single = fem();
    const cast = single.poll(1, 0, 2, 1); // `% 4` 1, `% 2` 0, the girl (index 2), the spell (index 1)
    expect([single.id(cast), single.targets(cast)]).toEqual(['x2-fem-goon-thundara', ['paine']]);
    const party = fem();
    const spells = [0, 1, 2, 3].map((k) => party.id(party.poll(1, 1, k)));
    expect(spells).toEqual(['x2-fem-goon-fire', 'x2-fem-goon-thunder', 'x2-fem-goon-water', 'x2-fem-goon-blizzard']);
    expect(party.targets(party.poll(1, 1, 0))).toEqual([]);
  });

  it('overall 25% Attack, 37.5% one single-target spell and 37.5% one party-wide base spell (the note\'s tally)', () => {
    const tally = { attack: 0, single: 0, party: 0 };
    for (let a = 0; a < 4; a++) {
      for (let c = 0; c < 2; c++) {
        for (let k = 0; k < 4; k++) {
          const b = fem();
          const id = b.id(c === 0 ? b.poll(a, c, 0, k) : b.poll(a, c, k))!;
          if (id === FAN) tally.attack += 1;
          else if (['fira', 'thundara', 'watera', 'blizzara'].some((s) => id === `x2-fem-goon-${s}`)) tally.single += 1;
          else tally.party += 1;
        }
      }
    }
    expect(tally).toEqual({ attack: 8, single: 12, party: 12 }); // of 32 combinations of the three residues
  });
});
