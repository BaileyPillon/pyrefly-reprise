/**
 * Gullwings, Chapter 1 (FFX-2's four hotspot missions, the hidden chapter): the four scripts, decision by decision. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/gullwings-ch1.ts` is **the game's own scripts, `m132`, `m122`, `m162` and `m047`** (`research/re-ffx2-gullwings-chapter1.md` §3 and §5). What this file pins, with a stub context and exact draws:
 *
 * 1. **Boris**: three Spider Attacks, then Sticky End exactly once (the file's one-shot flag, not the guides' loop), then `random() mod 4` (0 Spider Bite, else Spider Attack) for ever; the picks are the near-weighted
 *    `searchr` of his own scene's start positions; Sticky End and the Bite's roll draw as the script draws.
 * 2. **The Flame Dragon**: Flame Breath on all three on its first poll, then Attack on the girl with the most current HP (a first search over the living thrown away, then the extreme), one more Flame Breath the first
 *    time its own HP is under 100, never a third.
 * 3. **The Guardian Beast**: a beat of four (Attack three times, then Curse on a girl who does not carry it); with every girl cursed the beat stays at 4 and only Attacks come; under a third of its maximum HP (under 962)
 *    the Curse becomes Damocles Photon on all three and the beat resets.
 * 4. **YSLS-Zero**: `random() mod 4` with the nested draws, the extreme-HP pairs, the farthest girl as a uniform pick (its scene ships no positions), the two Attack rows; the frequencies over many seeds are 55, 25 and 40 in 120.
 * 5. **The "battle too long" block** of each: live in every act, counts only while no guest is present, the stages come one turn each (Boris and YSLS-Zero on polls 136, 141, 146, 151 and Time Up Meteor from 152; the Dragon on 141,
 *    151, 156, 161 and 162; the Beast on 181, 191, 196, 201 and 202).
 */
import { describe, expect, it } from 'vitest';

import { mem, setMem } from '../../../src/battle/ffx2/internal.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { SCENES, pickIndexByWeights, sceneWeights } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import {
  BEAST_BEAT, BEAST_TURN, BORIS_BITE_ROLL, BORIS_DRAW_MODULUS, BORIS_OPENING_ATTACKS, BORIS_SCENE, BORIS_SCRIPT, BORIS_SPIDER_ATTACKS, BORIS_STICKY_USED, BORIS_TOO_LONG, DRAGON_BREATH_1, DRAGON_BREATH_2,
  DRAGON_SECOND_BREATH_BELOW_HP, FLAME_DRAGON_SCRIPT, FLAME_DRAGON_TOO_LONG, GUARDIAN_BEAST_SCRIPT, GUARDIAN_BEAST_TOO_LONG, GULLWINGS_ABILITY, GULLWINGS_ANNOUNCEMENTS, GULLWINGS_TOO_LONG_BLOCK_ON, GW_POLLS, GW_STAGE,
  YSLS_FIRST_MODULUS, YSLS_SECOND_MODULUS, YSLS_THIRD_MODULUS, YSLS_ZERO_SCRIPT, YSLS_ZERO_TOO_LONG,
} from '../../../src/battle/ffx2/ai/gullwings-ch1.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const A = GULLWINGS_ABILITY;
const boris = (): Bench => bench(enemy('x2-boris', 480), BORIS_SCRIPT);
const dragon = (hp = 980): Bench => bench(enemy('x2-flame-dragon', 980, { mp: 620, hp }), FLAME_DRAGON_SCRIPT);
const beast = (hp = 2886): Bench => bench(enemy('x2-guardian-beast', 2886, { mp: 1000, hp }), GUARDIAN_BEAST_SCRIPT);
const ysls = (): Bench => bench(enemy('x2-ysls-zero', 1935), YSLS_ZERO_SCRIPT);

/** The raw value of a near-weighted search over the three girls that picks girl `index` (0 Yuna, 1 Rikku, 2 Paine) in Boris's scene. */
function rawFor(index: 0 | 1 | 2): number {
  const weights = sceneWeights(BORIS_SCENE, [0, 1, 2]);
  for (let raw = 0; raw < 100_000; raw++) if (pickIndexByWeights(raw, weights) === index) return raw;
  throw new Error('no raw value picks that girl');
}

const curse = (u: Ffx2Unit): void => {
  (u.statuses as Record<string, unknown>)['curse'] = { duration: 0 };
};

describe('Boris (m132): three Spider Attacks, one Sticky End, then a draw in four for the Bite', () => {
  it('the constants are the script\'s: three opening Attacks, mod 4, the Bite on roll 0; the marks 135, 140, 145 and 150', () => {
    expect([BORIS_OPENING_ATTACKS, BORIS_DRAW_MODULUS, BORIS_BITE_ROLL]).toEqual([3, 4, 0]);
    expect([...BORIS_TOO_LONG]).toEqual([135, 140, 145, 150]);
    expect(GULLWINGS_TOO_LONG_BLOCK_ON).toBe(true);
  });

  it('polls 1 to 3 are Spider Attacks (one near-weighted search each, no `random()`), poll 4 is Sticky End on all three with no draw at all, and Sticky End is never used again over sixty polls', () => {
    const b = boris();
    const order: string[] = [];
    for (let poll = 1; poll <= 60; poll++) {
      b.rng.drain();
      const before = b.rng.calls.length;
      const c = poll <= 3 ? b.poll(rawFor(0)) : poll === 4 ? b.poll() : b.poll(1, rawFor(1)); // a roll of 1 mod 4 is an Attack
      order.push(b.id(c)!);
      const draws = b.rng.calls.length - before;
      if (poll <= 3) expect([draws, b.targets(c)], `poll ${poll}`).toEqual([1, ['yuna']]);
      if (poll === 4) expect([draws, b.targets(c)], 'Sticky End').toEqual([0, []]);
      if (poll > 4) expect(draws, `poll ${poll}`).toBe(2);
    }
    expect(order.slice(0, 4)).toEqual([A.spiderAttack, A.spiderAttack, A.spiderAttack, A.stickyEnd]);
    expect(order.filter((id) => id === A.stickyEnd)).toHaveLength(1);
    expect(order.slice(4).every((id) => id === A.spiderAttack)).toBe(true);
    expect(mem(b.self, BORIS_STICKY_USED)).toBe(1);
    expect(mem(b.self, BORIS_SPIDER_ATTACKS)).toBe(3);
  });

  it('from poll 5 on, a draw mod 4: 0 is Spider Bite, 1 to 3 Spider Attack; the draw is `int(0, 65535)` and the search `int(0, 2^31 - 1)`; the first draw is the roll', () => {
    const b = boris();
    setMem(b.self, BORIS_SPIDER_ATTACKS, 3);
    setMem(b.self, BORIS_STICKY_USED, 1);
    const seen: Record<number, string> = {};
    for (const roll of [0, 1, 2, 3, 4, 5, 8, 65_535, 65_532]) {
      const c = b.poll(roll, rawFor(2));
      seen[roll] = b.id(c)!;
      expect(b.targets(c), `roll ${roll}`).toEqual(['paine']);
    }
    expect(seen).toEqual({ 0: A.spiderBite, 1: A.spiderAttack, 2: A.spiderAttack, 3: A.spiderAttack, 4: A.spiderBite, 5: A.spiderAttack, 8: A.spiderBite, 65_535: A.spiderAttack, 65_532: A.spiderBite });
    expect(b.rng.calls.slice(0, 2)).toEqual([[0, 0xffff], [0, 0x7fffffff]]);
  });

  it('the targets are the near-weighted pick of Boris\'s own scene: the girls at (0, -45), (15, -45), (-15, -45), Boris at (0, 25); one girl alive, no search draw; none alive, no command', () => {
    expect(SCENES.boris).toBe(BORIS_SCENE);
    const b = boris();
    setMem(b.self, BORIS_SPIDER_ATTACKS, 3);
    setMem(b.self, BORIS_STICKY_USED, 1);
    expect(b.targets(b.poll(1, rawFor(1)))).toEqual(['rikku']);
    b.girls[0].alive = false;
    b.girls[1].alive = false;
    const before = b.rng.calls.length;
    const c = b.poll(1);
    expect([b.id(c), b.targets(c), b.rng.calls.length - before], 'only Paine is up: the roll is drawn, the search is not').toEqual([A.spiderAttack, ['paine'], 1]);
    b.girls[2].alive = false;
    expect(b.poll()).toBeNull();
  });
});

describe('the Flame Dragon (m122): a breath, then the healthiest girl, one more breath under 100 HP', () => {
  it('poll 1 is Flame Breath on all three with no draw; every poll after is an Attack on the girl with the most current HP', () => {
    const b = dragon();
    b.girls[0].hp = 700;
    b.girls[1].hp = 900;
    b.girls[2].hp = 800;
    const first = b.poll();
    expect([b.id(first), b.targets(first), b.rng.calls.length]).toEqual([A.flameBreath, [], 0]);
    expect(mem(b.self, DRAGON_BREATH_1)).toBe(1);
    // The first search over the living is made and its pick thrown away (one draw over three), then the extreme: a lone highest draws nothing.
    const c = b.poll(0);
    expect([b.id(c), b.targets(c), b.rng.calls.length]).toEqual([A.flameDragonAttack, ['rikku'], 1]);
    expect(b.rng.calls[0]).toEqual([0, 2]);
  });

  it('two girls tied for the most HP draw once more, among the tied (the first of the two with a draw of 0, the second with 1)', () => {
    const b = dragon();
    setMem(b.self, DRAGON_BREATH_1, 1);
    b.girls[0].hp = 900;
    b.girls[1].hp = 900;
    b.girls[2].hp = 100;
    expect(b.targets(b.poll(0, 0))).toEqual(['yuna']);
    expect(b.targets(b.poll(0, 1))).toEqual(['rikku']);
    expect(b.rng.calls.slice(-1)[0]).toEqual([0, 1]);
  });

  it('the first time its own HP is under 100 it breathes again, once; at exactly 100 it does not; never a third breath', () => {
    expect(DRAGON_SECOND_BREATH_BELOW_HP).toBe(100);
    const at100 = dragon(100);
    setMem(at100.self, DRAGON_BREATH_1, 1);
    expect(at100.id(at100.poll(0, 0))).toBe(A.flameDragonAttack); // three girls tied on HP: the discarded search, then the tie among the three
    const b = dragon(99);
    setMem(b.self, DRAGON_BREATH_1, 1);
    expect(b.id(b.poll())).toBe(A.flameBreath);
    expect(mem(b.self, DRAGON_BREATH_2)).toBe(1);
    for (let i = 0; i < 20; i++) expect(b.id(b.poll(0, 0)), `poll ${i + 3}`).toBe(A.flameDragonAttack);
  });
});

describe('the Guardian Beast (m162): a beat of four, a Curse on a girl without one, Damocles Photon under a third', () => {
  it('Attack, Attack, Attack, then Curse on a girl who does not carry it; the beat resets and runs again; a cursed girl is not cursed again while another is free', () => {
    const b = beast();
    const order: string[] = [];
    const victims: string[] = [];
    for (let poll = 1; poll <= 12; poll++) {
      b.rng.drain();
      const c = b.poll(0);
      order.push(b.id(c)!.replace('x2-guardian-beast-', ''));
      if (b.id(c) === A.curse) {
        const target = b.targets(c)[0]!;
        victims.push(target);
        curse(b.girls.find((g) => g.id === target)!);
      }
    }
    expect(order).toEqual(['attack', 'attack', 'attack', 'curse', 'attack', 'attack', 'attack', 'curse', 'attack', 'attack', 'attack', 'curse']);
    expect(new Set(victims).size).toBe(3);
  });

  it('with every girl cursed the beat stays at 4 or more and only Attacks come (no Curse, no Photon) until its HP falls under a third, when the very next poll is Damocles Photon', () => {
    const b = beast();
    for (const g of b.girls) curse(g);
    for (let poll = 1; poll <= 10; poll++) {
      b.rng.drain();
      expect(b.id(b.poll(0)), `poll ${poll}`).toBe(A.guardianBeastAttack);
    }
    expect(mem(b.self, BEAST_TURN)).toBe(10);
    b.self.hp = 961;
    b.rng.drain();
    const c = b.poll();
    expect([b.id(c), b.targets(c), mem(b.self, BEAST_TURN)]).toEqual([A.damoclesPhoton, [], 0]);
  });

  it('the line is hp < floor(max / 3) = 962: 962 is still the Curse\'s beat, 961 is the Photon\'s', () => {
    expect(BEAST_BEAT).toBe(4);
    const at962 = beast(962);
    setMem(at962.self, BEAST_TURN, 3);
    expect(at962.id(at962.poll(0))).toBe(A.curse);
    const at961 = beast(961);
    setMem(at961.self, BEAST_TURN, 3);
    expect(at961.id(at961.poll())).toBe(A.damoclesPhoton);
  });

  it('under a third the beat is three Attacks and a Photon, over and over (the Curse never returns), the Photon resetting the beat', () => {
    const b = beast(500);
    const order: string[] = [];
    for (let poll = 1; poll <= 12; poll++) {
      b.rng.drain();
      order.push(b.id(b.poll(0))!.replace('x2-guardian-beast-', ''));
    }
    expect(order).toEqual(['attack', 'attack', 'attack', 'damocles-photon', 'attack', 'attack', 'attack', 'damocles-photon', 'attack', 'attack', 'attack', 'damocles-photon']);
  });

  it('the Curse search draws among the uncursed girls (a uniform pick), the Attack among the living; none cursed, three candidates, `int(0, 2^31 - 1)`', () => {
    const b = beast();
    setMem(b.self, BEAST_TURN, 3);
    curse(b.girls[0]);
    const c = b.poll(1); // two candidates (Rikku, Paine): 1 mod 2 is the second
    expect([b.id(c), b.targets(c)]).toEqual([A.curse, ['paine']]);
    expect(b.rng.calls[0]).toEqual([0, 0x7fffffff]);
  });
});

describe('YSLS-Zero (m047): a draw in four, the nested draws, the extreme pairs', () => {
  it('the constants are the script\'s: mod 4, then mod 2 and mod 3', () => {
    expect([YSLS_FIRST_MODULUS, YSLS_SECOND_MODULUS, YSLS_THIRD_MODULUS]).toEqual([4, 2, 3]);
    expect([...YSLS_ZERO_TOO_LONG]).toEqual([135, 140, 145, 150]);
  });

  it('roll 0: Haymaker on the living girl with the LOWEST current HP (a discarded search over the three, then the extreme)', () => {
    const b = ysls();
    b.girls[0].hp = 500;
    b.girls[1].hp = 300;
    b.girls[2].hp = 900;
    const c = b.poll(0, 0);
    expect([b.id(c), b.targets(c)]).toEqual([A.haymaker, ['rikku']]);
    expect(b.rng.calls.map((x) => x[1])).toEqual([0xffff, 2]);
  });

  it('roll 1: a second draw; 0 is Blast Punch on the farthest girl (a discarded search, then a uniform pick of the three), 1 is Haymaker on the girl with the HIGHEST HP', () => {
    const punch = ysls();
    const c = punch.poll(1, 0, 0, 2); // roll 1, second draw 0, the discarded search, the farthest pick: Paine
    expect([punch.id(c), punch.targets(c), punch.rng.calls.length]).toEqual([A.blastPunch, ['paine'], 4]);
    const hay = ysls();
    hay.girls[0].hp = 300;
    hay.girls[1].hp = 1000;
    hay.girls[2].hp = 500;
    const d = hay.poll(1, 1, 0);
    expect([hay.id(d), hay.targets(d)]).toEqual([A.haymaker, ['rikku']]);
  });

  it('roll 2: a living girl is picked, then a third draw: 0 Blast Punch on the farthest, 1 Haymaker on the picked girl, 2 Attack (no cancel) on the picked girl', () => {
    const r0 = ysls();
    const a = r0.poll(2, 1, 0, 2); // roll 2, picked Rikku, third draw 0, the farthest pick: Paine
    expect([r0.id(a), r0.targets(a)]).toEqual([A.blastPunch, ['paine']]);
    const r1 = ysls();
    const b = r1.poll(2, 2, 1);
    expect([r1.id(b), r1.targets(b)]).toEqual([A.haymaker, ['paine']]);
    const r2 = ysls();
    const c = r2.poll(2, 0, 2);
    expect([r2.id(c), r2.targets(c)]).toEqual([A.yslsAttackNoCancel, ['yuna']]);
  });

  it('roll 3: the party-command Attack (row 0x4000) on a living girl', () => {
    const b = ysls();
    const c = b.poll(3, 1);
    expect([b.id(c), b.targets(c)]).toEqual([A.yslsAttack, ['rikku']]);
  });

  it('over every branch of the draws the moves come at 55 : 25 : 40 in 120 (Haymaker, Blast Punch, the two Attacks), the frequencies the nested draws make', () => {
    // Every (roll, second, third) path with its weight in 120ths: roll 0 is 30; roll 1 splits 15 and 15; roll 2 splits 10, 10 and 10; roll 3 is 30.
    const paths: Array<[number[], number]> = [[[0], 30], [[1, 0], 15], [[1, 1], 15], [[2, 0, 0], 10], [[2, 0, 1], 10], [[2, 0, 2], 10], [[3, 0], 30]];
    const tally: Record<string, number> = {};
    for (const [draws, weight] of paths) {
      const fresh = ysls();
      // Queue enough zeros after the roll and the branch's draws for the searches (every search takes the value 0, so the first candidate).
      const roll = draws[0]!;
      const queue = roll === 0 ? [0, 0, 0] : roll === 1 ? [1, draws[1]!, 0, 0, 0] : roll === 2 ? [2, 0, draws[2]!, 0, 0] : [3, 0];
      fresh.rng.push(...queue);
      const id = fresh.id(ysls_poll(fresh))!.replace('x2-ysls-zero-', '');
      const kind = id.startsWith('attack') ? 'attack' : id;
      tally[kind] = (tally[kind] ?? 0) + weight;
    }
    expect(tally).toEqual({ haymaker: 55, 'blast-punch': 25, attack: 40 });
  });
});

function ysls_poll(b: Bench) {
  return b.poll();
}

describe('the "battle too long" block, in every act', () => {
  const cases: Array<[string, () => Bench, readonly [number, number, number, number], (b: Bench) => void]> = [
    ['Boris', boris, BORIS_TOO_LONG, (b) => { setMem(b.self, BORIS_SPIDER_ATTACKS, 3); setMem(b.self, BORIS_STICKY_USED, 1); }],
    ['the Flame Dragon', () => dragon(), FLAME_DRAGON_TOO_LONG, (b) => setMem(b.self, DRAGON_BREATH_1, 1)],
    ['the Guardian Beast', () => beast(), GUARDIAN_BEAST_TOO_LONG, () => undefined],
    ['YSLS-Zero', ysls, YSLS_ZERO_TOO_LONG, () => undefined],
  ];

  it.each(cases)('%s: the stages come one poll each, past each mark, then Time Up Meteor on everyone every poll', (_name, make, marks, prime) => {
    const b = make();
    prime(b);
    setMem(b.self, GW_POLLS, marks[0] - 1);
    b.rng.drain();
    // Poll `marks[0]` is not past the first mark: an ordinary poll (it needs draws).
    b.rng.push(0, 0, 0, 0, 0, 0);
    expect(GULLWINGS_ANNOUNCEMENTS as readonly string[]).not.toContain(b.id(b.poll(0, 0, 0, 0, 0, 0)));
    expect(mem(b.self, GW_POLLS)).toBe(marks[0]);
    expect(mem(b.self, GW_STAGE)).toBe(0);
    // The announcement polls draw nothing: set the polls just under each mark and read the stage.
    const seen: string[] = [];
    for (const [stage, mark] of marks.entries()) {
      setMem(b.self, GW_POLLS, mark);
      b.rng.drain();
      const before = b.rng.calls.length;
      const c = b.poll();
      seen.push(b.id(c)!);
      expect(b.rng.calls.length - before, `stage ${stage + 1} draws nothing`).toBe(0);
      expect(b.targets(c)).toEqual([]);
      expect(mem(b.self, GW_STAGE)).toBe(stage + 1);
    }
    expect(seen).toEqual([...GULLWINGS_ANNOUNCEMENTS]);
    for (let i = 0; i < 5; i++) {
      const c = b.poll();
      expect([b.id(c), b.targets(c)], `Time Up Meteor ${i + 1}`).toEqual([A.timeUpMeteor, []]);
    }
  });

  it.each(cases)('%s: a friendly guest in the party stops the counter, so the block never starts', (_name, make, marks, prime) => {
    const b = make();
    prime(b);
    const guest = enemy('gippal', 1000, { slot: 3 });
    guest.side = 'party';
    b.ctx.units.push(guest);
    setMem(b.self, GW_POLLS, marks[3] + 50);
    for (let i = 0; i < 6; i++) {
      b.rng.drain();
      const c = b.poll(0, 0, 0, 0, 0, 0);
      expect(GULLWINGS_ANNOUNCEMENTS as readonly string[], `poll ${i}`).not.toContain(b.id(c));
      expect(b.id(c)).not.toBe(A.timeUpMeteor);
    }
    expect(mem(b.self, GW_POLLS)).toBe(marks[3] + 50);
  });

  it('the block is checked first: even on the Dragon\'s opening poll, a poll past the first mark announces instead of breathing', () => {
    const b = dragon();
    setMem(b.self, GW_POLLS, FLAME_DRAGON_TOO_LONG[0]);
    expect(b.id(b.poll())).toBe(GULLWINGS_ANNOUNCEMENTS[0]);
    expect(mem(b.self, DRAGON_BREATH_1)).toBe(0);
  });
});
