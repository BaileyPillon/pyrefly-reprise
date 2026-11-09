/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, the hidden chapter): his script, decision by decision. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/ifrit.ts` is **the game's own script, `m165`** (`research/re-ffx2-ifrit-kilika.md` §2 and §3). What this file pins, with a stub context and exact draws:
 *
 * 1. **The gauge and the marks**: +7 an ordinary action, the gauge read BEFORE the turn's own gain, the Meteor Strike and Hellfire turns add nothing; with nobody hitting him a cycle is 19 actions (the Meteors on the 6th, 11th and
 *    16th, the Hellfire on the 19th); a gauge that jumps gives its Meteors on consecutive turns; Hellfire resets the gauge and the Meteor count; every result applied to him adds 5.
 * 2. **The mix**: one in three ordinary actions is Firaga on everyone, two in three an Attack; one draw per ordinary action, none for a Meteor or a Hellfire.
 * 3. **The targets** (`pos_klyt11_229`): the Attack is near-weighted, the Meteor goes to the greatest ground distance.
 * 4. **The "battle too long" block**: live in this scene; counts only while no guest is present; the stages come on polls 181, 191, 196 and 201 and Time Up Meteor from poll 202, each announcement a turn of its own.
 */
import { describe, expect, it } from 'vitest';

import { mem, setMem } from '../../../src/battle/ffx2/internal.ts';
import { aiUnit } from '../../../src/battle/ffx2/fixtures.ts';
import { AC, acOf } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { SCENES, pickIndexByWeights, sceneWeights } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import {
  IFRIT_ABILITY, IFRIT_AC_PER_ACTION, IFRIT_AC_PER_RESULT, IFRIT_ANNOUNCEMENTS, IFRIT_FIRAGA_ROLL, IFRIT_METEORS_FIRED, IFRIT_METEORS_PER_CYCLE, IFRIT_METEOR_MARKS, IFRIT_ORDINARY_MODULUS, IFRIT_POLLS,
  IFRIT_SCENE, IFRIT_SCRIPT, IFRIT_STAGE, IFRIT_TOO_LONG_BLOCK_ON, IFRIT_TOO_LONG_POLLS, groundDistance, x2IfritScript,
} from '../../../src/battle/ffx2/ai/ifrit.ts';
import { IFRIT_ID } from '../../../src/data/ffx2/enemies/ifrit.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const ATTACK = IFRIT_ABILITY.attack;
const FIRAGA = IFRIT_ABILITY.firaga;
const METEOR = IFRIT_ABILITY.meteorStrike;
const HELLFIRE = IFRIT_ABILITY.hellfire;
const TIME_UP = IFRIT_ABILITY.timeUpMeteor;

/** A fresh bench: Ifrit (slot 0) against Yuna, Rikku and Paine, on his script. */
function ifrit(): Bench {
  return bench(enemy(IFRIT_ID, 8820, { mp: 9999 }), IFRIT_SCRIPT);
}

/** One ordinary poll that makes an Attack on Yuna: roll 1 (`1 mod 3`), target draw 0 (the first weight). */
const SWING: [number, number] = [1, 0];
/** One ordinary poll that makes a Firaga: roll 0, and no target draw. */
const FIRE: [number] = [0];

describe('the gauge and the marks (a stub context, exact draws) [script]', () => {
  it('the constants are the script\'s: +7 an ordinary action, +5 a result, Meteors at 30, 60 and 90 (three a cycle), Hellfire at 100, Firaga on roll 0 of 3', () => {
    expect([IFRIT_AC_PER_ACTION, IFRIT_AC_PER_RESULT]).toEqual([7, 5]);
    expect([...IFRIT_METEOR_MARKS]).toEqual([30, 60, 90]);
    expect(IFRIT_METEORS_PER_CYCLE).toBe(3);
    expect([IFRIT_ORDINARY_MODULUS, IFRIT_FIRAGA_ROLL]).toEqual([3, 0]);
    expect(IFRIT_TOO_LONG_POLLS).toEqual([180, 190, 195, 200]);
    expect(IFRIT_TOO_LONG_BLOCK_ON).toBe(true);
  });

  it('with nobody hitting him a cycle is 19 actions: the Meteors on his 6th, 11th and 16th, the Hellfire on his 19th, then the same again (25th, 30th, 35th, 38th); a Meteor or a Hellfire draws nothing, a swing draws the roll and the target', () => {
    const b = ifrit();
    const order: string[] = [];
    const gauge: number[] = [];
    for (let poll = 1; poll <= 38; poll++) {
      const draws = b.rng.calls.length;
      b.rng.drain(); // a Meteor or a Hellfire draws nothing, so the values queued for a swing would be left over
      const c = b.poll(...SWING);
      order.push(b.id(c)!);
      gauge.push(acOf(b.self));
      const special = ([METEOR, HELLFIRE] as string[]).includes(b.id(c)!);
      expect(b.rng.calls.length - draws, `poll ${poll} draws`).toBe(special ? 0 : 2);
    }
    const specialsAt = order.flatMap((id, i) => (id === METEOR || id === HELLFIRE ? [`${i + 1}:${id.replace('x2-ifrit-', '')}`] : []));
    expect(specialsAt).toEqual(['6:meteor-strike', '11:meteor-strike', '16:meteor-strike', '19:hellfire', '25:meteor-strike', '30:meteor-strike', '35:meteor-strike', '38:hellfire']);
    expect(order.filter((id) => id === ATTACK)).toHaveLength(38 - 8);
    // The gauge as the cycle describes it: 35 at the 6th (after five ordinary actions), 63 at the 11th, 91 at the 16th, 105 at the 19th; a Meteor or Hellfire turn leaves it where it was (Hellfire resets it).
    expect([gauge[4], gauge[5], gauge[9], gauge[10], gauge[14], gauge[15], gauge[17]]).toEqual([35, 35, 63, 63, 91, 91, 105]);
    expect(gauge[18]).toBe(0);
  });

  it('the gauge is read BEFORE the turn\'s own gain, and a Meteor or Hellfire turn adds nothing: at 30 the Meteor leaves it at 30; at 95 with all three fired the next turn gains to 102 and swings, and the turn after is the Hellfire', () => {
    const b = ifrit();
    setMem(b.self, AC, 30);
    expect(b.id(b.poll())).toBe(METEOR);
    expect(acOf(b.self)).toBe(30);
    expect(mem(b.self, IFRIT_METEORS_FIRED)).toBe(1);
    const c = ifrit();
    setMem(c.self, AC, 95);
    setMem(c.self, IFRIT_METEORS_FIRED, 3);
    expect(c.id(c.poll(...SWING))).toBe(ATTACK);
    expect(acOf(c.self)).toBe(102);
    expect(c.id(c.poll())).toBe(HELLFIRE);
    expect([acOf(c.self), mem(c.self, IFRIT_METEORS_FIRED)]).toEqual([0, 0]); // Hellfire resets the gauge and the Meteor count
    expect(c.targets(c.poll(...SWING))).toEqual(['yuna']);
    expect(acOf(c.self)).toBe(7);
  });

  it('a band whose quota is met is an ordinary turn, whatever the lower marks say: at 45 with one Meteor fired the gauge gains to 52; at 62 with one fired the second Meteor comes; at 88 with two fired it is ordinary to 95 and then the third Meteor', () => {
    const a = ifrit();
    setMem(a.self, AC, 45);
    setMem(a.self, IFRIT_METEORS_FIRED, 1);
    expect(a.id(a.poll(...SWING))).toBe(ATTACK);
    expect(acOf(a.self)).toBe(52);
    expect(mem(a.self, IFRIT_METEORS_FIRED)).toBe(1);
    const b = ifrit();
    setMem(b.self, AC, 62);
    setMem(b.self, IFRIT_METEORS_FIRED, 1);
    expect(b.id(b.poll())).toBe(METEOR);
    expect(mem(b.self, IFRIT_METEORS_FIRED)).toBe(2);
    expect(acOf(b.self)).toBe(62);
    const c = ifrit();
    setMem(c.self, AC, 88);
    setMem(c.self, IFRIT_METEORS_FIRED, 2);
    expect(c.id(c.poll(...SWING))).toBe(ATTACK);
    expect(acOf(c.self)).toBe(95);
    expect(c.id(c.poll())).toBe(METEOR);
    expect(mem(c.self, IFRIT_METEORS_FIRED)).toBe(3);
    expect(c.id(c.poll(...SWING))).toBe(ATTACK); // the quota of the 90 band is met: no fourth Meteor
    expect(acOf(c.self)).toBe(102);
  });

  it('a gauge that jumps past all three marks (a ten-hit volley) gives three Meteors on his next three turns, then an ordinary turn; the gauge itself does not move on the Meteor turns', () => {
    const b = ifrit();
    setMem(b.self, AC, 95);
    for (let n = 1; n <= 3; n++) {
      expect(b.id(b.poll())).toBe(METEOR);
      expect(mem(b.self, IFRIT_METEORS_FIRED)).toBe(n);
      expect(acOf(b.self)).toBe(95);
    }
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
    expect(acOf(b.self)).toBe(102);
  });

  it('at 100 or more Hellfire comes first, even with Meteors still owed (the Hellfire test is the first), and a gauge over 100 is reset to 0', () => {
    const b = ifrit();
    setMem(b.self, AC, 140);
    setMem(b.self, IFRIT_METEORS_FIRED, 0);
    expect(b.id(b.poll())).toBe(HELLFIRE);
    expect(acOf(b.self)).toBe(0);
  });

  it('draws nothing for a Meteor or a Hellfire, and no living girl means no move at all', () => {
    const b = ifrit();
    setMem(b.self, AC, 30);
    const before = b.rng.calls.length;
    expect(b.id(b.poll())).toBe(METEOR);
    expect(b.rng.calls.length).toBe(before);
    for (const girl of b.girls) girl.alive = false;
    expect(b.poll()).toBeNull();
  });
});

describe('the reaction entry: +5 for every result applied to him [script]', () => {
  it('each result from a girl adds 5; one from himself adds nothing', () => {
    const b = ifrit();
    const onResult = x2IfritScript.onResult!;
    for (let i = 1; i <= 4; i++) {
      onResult(b.ctx, b.girls[0], { id: 'attack' } as never);
      expect(acOf(b.self)).toBe(5 * i);
    }
    onResult(b.ctx, b.self, { id: ATTACK } as never);
    expect(acOf(b.self)).toBe(20);
  });

  it('a hit crosses a mark: from 28 one result makes 33, and his next turn is the Meteor (the gauge as it stands, 33), then a swing', () => {
    const b = ifrit();
    setMem(b.self, AC, 28);
    x2IfritScript.onResult!(b.ctx, b.girls[1], { id: 'x2-white-mage-cure' } as never);
    expect(acOf(b.self)).toBe(33);
    expect(b.id(b.poll())).toBe(METEOR);
    expect(acOf(b.self)).toBe(33);
    expect(b.id(b.poll(...SWING))).toBe(ATTACK);
    expect(acOf(b.self)).toBe(40);
  });

  it('the hits bring the cycle forward: with a result after every action (+12 a round while ordinary) the Meteors are his 4th, 7th and 10th actions and the Hellfire his 12th, against the 6th, 11th, 16th and 19th with nobody hitting him', () => {
    const b = ifrit();
    const order: string[] = [];
    for (let poll = 1; poll <= 12; poll++) {
      b.rng.drain();
      const c = b.poll(...SWING);
      order.push(b.id(c)!.replace('x2-ifrit-', ''));
      x2IfritScript.onResult!(b.ctx, b.girls[0], { id: 'attack' } as never);
    }
    const at = order.flatMap((id, n) => (id === 'meteor-strike' || id === 'hellfire' ? [`${n + 1}:${id}`] : []));
    expect(at).toEqual(['4:meteor-strike', '7:meteor-strike', '10:meteor-strike', '12:hellfire']);
  });
});

describe('the mix: one in three ordinary actions is Firaga, two in three an Attack [script]', () => {
  it('over 300 consecutive rolls (every residue 100 times) exactly 100 are Firaga on everyone with no draw for the target, and 200 are Attacks that draw the target', () => {
    const b = ifrit();
    let firaga = 0;
    for (let roll = 0; roll < 300; roll++) {
      setMem(b.self, AC, 0);
      setMem(b.self, IFRIT_METEORS_FIRED, 0);
      setMem(b.self, IFRIT_POLLS, 0); // 300 polls would run into the "battle too long" block, which has its own tests below
      b.rng.drain(); // Firaga uses one draw, so the target value queued for an Attack would be left over
      const before = b.rng.calls.length;
      const c = b.poll(roll, 0);
      if (b.id(c) === FIRAGA) {
        firaga++;
        expect(roll % 3).toBe(0);
        expect(b.targets(c), 'Firaga names no target: it reaches every living girl').toEqual([]);
        expect(b.rng.calls.length - before, 'the roll and nothing else').toBe(1);
      } else {
        expect(b.id(c)).toBe(ATTACK);
        expect(roll % 3).not.toBe(0);
        expect(b.rng.calls.length - before, 'the roll and the target').toBe(2);
      }
    }
    expect(firaga).toBe(100);
  });
});

describe('the targets, from the Kilika scene\'s start positions [script]', () => {
  it('the scene is the game\'s `pos_klyt11_229`: the boss at (0, 26), Yuna (0, -27), Rikku (-12, -25), Paine (12, -25)', () => {
    expect(IFRIT_SCENE).toBe(SCENES.kilika);
    expect(IFRIT_SCENE.boss).toEqual({ x: 0, z: 26 });
    expect(IFRIT_SCENE.girls).toEqual([{ x: 0, z: -27 }, { x: -12, z: -25 }, { x: 12, z: -25 }]);
    expect(groundDistance(0)).toBeCloseTo(53.0, 2);
    expect(groundDistance(1)).toBeCloseTo(52.39, 2);
    expect(groundDistance(2)).toBeCloseTo(52.39, 2);
  });

  it('the Attack\'s weights give Yuna 41.9 percent, Rikku 29.1 and Paine 29.0 (the whole range of one draw: 597, 415 and 414 of 1,426 values)', () => {
    const weights = sceneWeights(IFRIT_SCENE, [0, 1, 2]);
    expect(weights).toEqual([596, 415, 415]);
    const counts = [0, 0, 0];
    for (let raw = 0; raw < 1426; raw++) counts[pickIndexByWeights(raw, weights)]! += 1;
    expect(counts).toEqual([597, 415, 414]);
    expect(counts.map((n) => Math.round((1000 * n) / 1426) / 10)).toEqual([41.9, 29.1, 29.0]);
  });

  it('the Attack picks by those weights: the draws 0 and 596 are Yuna, 597 and 1,011 Rikku, 1,012 and 1,425 Paine; with one girl up it draws nothing for the target', () => {
    const picks = [0, 596, 597, 1011, 1012, 1425].map((raw) => {
      const b = ifrit();
      return b.targets(b.poll(1, raw))[0];
    });
    expect(picks).toEqual(['yuna', 'yuna', 'rikku', 'rikku', 'paine', 'paine']);
    const b = ifrit();
    b.girls[1].alive = false;
    b.girls[2].alive = false;
    const before = b.rng.calls.length;
    expect(b.targets(b.poll(1))).toEqual(['yuna']);
    expect(b.rng.calls.length - before).toBe(1); // the roll only
  });

  it('the Meteor Strike goes to the greatest ground distance: Yuna while she is up (no draw for the target); with Yuna down Rikku and Paine tie at 52.39 and the pick is near-weighted among the two (one draw)', () => {
    const up = ifrit();
    setMem(up.self, AC, 30);
    const before = up.rng.calls.length;
    expect(up.targets(up.poll())).toEqual(['yuna']);
    expect(up.rng.calls.length - before, 'a lone farthest girl draws nothing').toBe(0);
    const weights = sceneWeights(IFRIT_SCENE, [1, 2]);
    expect(weights).toEqual([415, 415]);
    const half = weights[0]!; // the first slot owns the extra value: raw mod 830 of 0..415 is Rikku, 416..829 Paine
    for (const [raw, who] of [[0, 'rikku'], [half, 'rikku'], [half + 1, 'paine'], [2 * half - 1, 'paine']] as const) {
      const b = ifrit();
      setMem(b.self, AC, 30);
      b.girls[0].alive = false;
      const draws = b.rng.calls.length;
      expect(b.targets(b.poll(raw)), `draw ${raw}`).toEqual([who]);
      expect(b.rng.calls.length - draws, 'one target draw among the tie, and no roll').toBe(1);
    }
    const lone = ifrit();
    setMem(lone.self, AC, 30);
    lone.girls[0].alive = false;
    lone.girls[1].alive = false;
    expect(lone.targets(lone.poll())).toEqual(['paine']); // one candidate left: no draw
    const removed = ifrit();
    setMem(removed.self, AC, 30);
    removed.girls[0].removed = true;
    removed.girls[2].alive = false;
    expect(removed.targets(removed.poll())).toEqual(['rikku']);
  });

  it('Firaga and Hellfire name no target: they reach every living girl, as the targeting says', () => {
    const b = ifrit();
    setMem(b.self, AC, 100);
    expect(b.id(b.poll())).toBe(HELLFIRE);
    expect(b.targets(b.poll(...FIRE))).toEqual([]);
  });
});

describe('the "battle too long" block: live in this scene [script]', () => {
  /** Run `polls` polls of a bench whose girls cannot be hurt (nothing applies a result to him), recording each poll's move. */
  function run(b: Bench, polls: number): string[] {
    const order: string[] = [];
    for (let poll = 1; poll <= polls; poll++) {
      b.rng.drain();
      const c = b.poll(...SWING);
      order.push(b.id(c)!.replace('x2-ifrit-', ''));
    }
    return order;
  }

  it('the stages come on polls 181, 191, 196 and 201, each its own turn; Time Up Meteor on 202 and every poll after; no stage before 181', () => {
    const b = ifrit();
    const order = run(b, 210);
    const stages = ['angry', 'furious', 'about-to-blow', 'ends-now'];
    stages.forEach((name, i) => expect(order[[180, 190, 195, 200][i]!], name).toBe(name));
    expect(order.slice(0, 180).some((id) => stages.includes(id) || id === 'time-up-meteor'), 'no stage before poll 181').toBe(false);
    for (let poll = 202; poll <= 210; poll++) expect(order[poll - 1], `poll ${poll}`).toBe('time-up-meteor');
    // between the stages the fight goes on as it was
    for (const poll of [182, 189, 192, 195, 197, 200]) expect(order[poll - 1], `poll ${poll}`).toMatch(/^(attack|meteor-strike|hellfire|firaga)$/);
    expect(mem(b.self, IFRIT_STAGE)).toBe(4);
    expect(mem(b.self, IFRIT_POLLS)).toBe(210);
  });

  it('the announcements are scripted turns on himself that change nothing: no draw, no change to the gauge or the Meteor count', () => {
    const b = ifrit();
    setMem(b.self, IFRIT_POLLS, 180);
    setMem(b.self, AC, 41);
    setMem(b.self, IFRIT_METEORS_FIRED, 1);
    const before = b.rng.calls.length;
    const c = b.poll();
    expect(b.id(c)).toBe(IFRIT_ANNOUNCEMENTS[0]);
    expect(b.targets(c)).toEqual([]);
    expect(b.rng.calls.length).toBe(before);
    expect([acOf(b.self), mem(b.self, IFRIT_METEORS_FIRED), mem(b.self, IFRIT_STAGE)]).toEqual([41, 1, 1]);
  });

  it('Time Up Meteor names no target (everyone) and draws nothing; it repeats every poll, and the girls\' state changes nothing about it', () => {
    const b = ifrit();
    setMem(b.self, IFRIT_POLLS, 201);
    setMem(b.self, IFRIT_STAGE, 4);
    for (let n = 0; n < 5; n++) {
      const before = b.rng.calls.length;
      const c = b.poll();
      expect(b.id(c)).toBe(TIME_UP);
      expect(b.targets(c)).toEqual([]);
      expect(b.rng.calls.length).toBe(before);
    }
  });

  it('the counter does not rise while a friendly guest stands with the girls (a party unit other than Yuna, Rikku and Paine): 400 polls with one present announce nothing', () => {
    const b = ifrit();
    b.ctx.units.push(aiUnit('guest', 'party', 1000, 3));
    const order = run(b, 400);
    expect(order.some((id) => id === 'angry' || id === 'time-up-meteor')).toBe(false);
    expect(mem(b.self, IFRIT_POLLS)).toBe(0);
  });

  it('the block comes before the gauge is read: a Hellfire due on poll 181 waits for the next poll, and the gauge is untouched', () => {
    const b = ifrit();
    setMem(b.self, IFRIT_POLLS, 180);
    setMem(b.self, AC, 100);
    expect(b.id(b.poll())).toBe(IFRIT_ANNOUNCEMENTS[0]);
    expect(acOf(b.self)).toBe(100);
    expect(b.id(b.poll())).toBe(HELLFIRE);
  });

  it('at 19 actions a cycle poll 180 is the tenth Hellfire: no ordinary fight comes near the block (the bench pins the longest fight it measured)', () => {
    const cycle = 19;
    expect(Math.ceil(IFRIT_TOO_LONG_POLLS[0] / cycle)).toBe(10);
  });
});
