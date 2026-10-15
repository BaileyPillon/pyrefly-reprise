/**
 * Angra Mainyu, Zarich and Tawrich (FFX-2 Chapter 5, the hidden chapter): the three scripts, poll by poll, on a stub context with exact draws. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/angra-mainyu.ts` is the game's own order (`m268`, `m269`, `m270`; `research/re-ffx2-angra-mainyu.md` §9.5, §9.7, §9.8). What this file pins, each fact tagged `[RE]` where the note gives it:
 *
 * 1. **The body's polls** [RE §9.5]: the Flame counter gains 1 first; the first poll is the opening Flame (HP at least 80 percent, integer arithmetic) or no command at all; Osmose below 200 MP; Full-Life on a fallen
 *    arm, Tawrich before Zarich; the Flame clock at 15; otherwise one roll `random() mod 5` (0 Flare, or Dispel when every living girl has Reflect; 1 Curaga on an arm after a second draw `mod 2`; 2 Bio; 3 and 4 Demi).
 *    With nothing intervening the Flames are polls 1, 8, 23, 38 and 53.
 * 2. **Zarich's polls** [RE §9.7]: one start draw `mod 4`, a cycle counter that starts at 10 (so her first poll is Glimmer of Despair), then six spells in the rotation and Glimmer again: a 7-poll cycle.
 * 3. **Tawrich's polls** [RE §9.8]: seven Punches, then Bloody Breath: an 8-poll cycle, no draw but the Punch's target.
 * 4. **The draws**: `random() mod n` is stream 2, one draw each; a target search is stream 4 and draws only with two or more candidates. The near-weighted pick (Flare, Punch) uses the scene's start positions
 *    (`SCENES.angra`, [RE §8]); Dispel and Zarich's spells are uniform. **`[inferred]`**: Tawrich's Punch is searched from the body's spot (the arms' own spots are unknown).
 * 5. **No hook**: nothing in the three scripts reacts to a hit.
 */
import { describe, expect, it } from 'vitest';

import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { AI_IDLE_STEPS, AI_REPOLL } from '../../../src/battle/ffx2/ai/idle.ts';
import { SCENES, pickIndexByWeights, sceneWeights } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import {
  ANGRA_ABILITY as A,
  ANGRA_MAINYU_SCRIPT,
  ANGRA_SCENE,
  ANGRA_UNIT,
  COMPANION_SEARCH_ORIGIN,
  FLAME_COUNTER,
  TAWRICH_SCENE,
  TAWRICH_SCRIPT,
  ZARICH_CYCLE,
  ZARICH_SCRIPT,
  ZARICH_SPELL_INDEX,
  angraMainyuScripts,
  openingFlameAllowed,
} from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { mem, setMem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const BODY_HP = 333_444;
const ROLL_RANGE: [number, number] = [0, 0xffff];
const SEARCH_RANGE: [number, number] = [0, 0x7fffffff];

/** Any 16-bit value whose residue mod 5 is `residue` (the body's roll). */
const roll = (residue: number): number => 500 + residue;

const arms = (): [Ffx2Unit, Ffx2Unit] => [enemy(ANGRA_UNIT.tawrich, 5440, { mp: 9999, slot: 1 }), enemy(ANGRA_UNIT.zarich, 5440, { mp: 9999, slot: 2 })];

/** A fresh bench: the body (slot 0) with its two arms, against Yuna, Rikku and Paine, on its script. */
function body(opts: { hp?: number; mp?: number } = {}): Bench {
  return bench(enemy(ANGRA_UNIT.angra, BODY_HP, { mp: opts.mp ?? 9999, ...(opts.hp !== undefined ? { hp: opts.hp } : {}) }), ANGRA_MAINYU_SCRIPT, arms());
}

/** The body after its opening Flame (the Flame counter at 8). */
function opened(opts: { hp?: number; mp?: number } = {}): Bench {
  const b = body(opts);
  expect(b.id(b.poll())).toBe(A.flame);
  return b;
}

function zarich(): Bench {
  return bench(enemy(ANGRA_UNIT.zarich, 5440, { mp: 9999, slot: 2 }), ZARICH_SCRIPT, [enemy(ANGRA_UNIT.angra, BODY_HP, { mp: 9999 }), enemy(ANGRA_UNIT.tawrich, 5440, { mp: 9999, slot: 1 })]);
}

function tawrich(): Bench {
  return bench(enemy(ANGRA_UNIT.tawrich, 5440, { mp: 9999, slot: 1 }), TAWRICH_SCRIPT, [enemy(ANGRA_UNIT.angra, BODY_HP, { mp: 9999 }), enemy(ANGRA_UNIT.zarich, 5440, { mp: 9999, slot: 2 })]);
}

function reflect(girl: Ffx2Unit): void {
  girl.statuses['reflect'] = { id: 'reflect', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
}

describe('the body: the opening poll and the Flame clock [RE §9.5]', () => {
  it('the first poll at full HP is Perdition\'s Flame on the whole party, no draw, and sets the counter to 8', () => {
    const b = body();
    const c = b.poll();
    expect(b.id(c)).toBe(A.flame);
    expect(b.targets(c)).toEqual([]);
    expect(b.rng.calls).toHaveLength(0);
    expect(mem(b.self, FLAME_COUNTER)).toBe(8);
  });

  it('with nothing intervening the Flames are polls 1, 8, 23, 38 and 53; a Flame draws nothing, every other poll draws exactly its roll (Demi on a roll of 3)', () => {
    const b = body();
    const flames: number[] = [];
    for (let poll = 1; poll <= 60; poll++) {
      b.rng.drain(); // a Flame draws nothing, so the roll queued for it would be left over
      const before = b.rng.calls.length;
      const c = b.poll(roll(3));
      const id = b.id(c)!;
      expect(b.targets(c), `poll ${poll}`).toEqual([]);
      if (id === A.flame) {
        flames.push(poll);
        expect(b.rng.calls.length - before, `poll ${poll}`).toBe(0);
      } else {
        expect(id, `poll ${poll}`).toBe(A.demi);
        expect(b.rng.calls.slice(before), `poll ${poll}`).toEqual([ROLL_RANGE]);
      }
    }
    expect(flames).toEqual([1, 8, 23, 38, 53]);
  });

  it('the opening Flame needs at least 80 percent of max HP, in integer arithmetic: 266,755 of 333,444 goes, 266,754 does not', () => {
    expect(Math.floor((BODY_HP * 8) / 10)).toBe(266_755);
    expect(openingFlameAllowed(266_755, BODY_HP)).toBe(true);
    expect(openingFlameAllowed(266_754, BODY_HP)).toBe(false);
    const ok = body({ hp: 266_755 });
    expect(ok.id(ok.poll())).toBe(A.flame);
  });

  it('below it the first poll is NOT a turn: no command, polled again on the very next step, the counter left at its +1; the Flames are then polls 15, 30 and 45', () => {
    const b = body({ hp: 266_754 });
    expect(b.poll()).toBeNull();
    expect(mem(b.self, AI_REPOLL)).toBe(1);
    expect(mem(b.self, AI_IDLE_STEPS)).toBe(1);
    expect(mem(b.self, FLAME_COUNTER)).toBe(1);
    expect(b.rng.calls).toHaveLength(0);
    const flames: number[] = [];
    for (let poll = 2; poll <= 50; poll++) {
      b.rng.drain();
      const c = b.poll(roll(3));
      expect(mem(b.self, AI_REPOLL), `poll ${poll}`).toBe(0);
      if (b.id(c) === A.flame) flames.push(poll);
    }
    expect(flames).toEqual([15, 30, 45]);
  });

  it('Osmose below 200 MP (199 yes, 200 no) draws nothing, and an Osmose poll counts toward the clock, so it delays a due Flame by one poll', () => {
    const b = opened();
    b.self.mp = 199;
    const draws = b.rng.calls.length;
    expect(b.id(b.poll())).toBe(A.osmose);
    expect(b.rng.calls.length).toBe(draws);
    expect(mem(b.self, FLAME_COUNTER)).toBe(9);
    b.self.mp = 200;
    expect(b.id(b.poll(roll(3)))).toBe(A.demi);
    setMem(b.self, FLAME_COUNTER, 14); // the next poll would be the 15th: due
    b.self.mp = 100;
    expect(b.id(b.poll())).toBe(A.osmose); // Osmose first, the counter at 15 but not reset
    expect(mem(b.self, FLAME_COUNTER)).toBe(15);
    b.self.mp = 9999;
    expect(b.id(b.poll())).toBe(A.flame);
    expect(mem(b.self, FLAME_COUNTER)).toBe(0);
  });

  it('a fallen arm is raised at once, Tawrich before Zarich, aimed by id with no draw; Osmose comes before it and it comes before the Flame clock', () => {
    const b = opened();
    const [tawrichUnit, zarichUnit] = b.others as [Ffx2Unit, Ffx2Unit];
    zarichUnit.alive = false;
    let c = b.poll();
    expect([b.id(c), b.targets(c)]).toEqual([A.fullLife, [ANGRA_UNIT.zarich]]);
    zarichUnit.alive = true;
    tawrichUnit.alive = false;
    c = b.poll();
    expect([b.id(c), b.targets(c)]).toEqual([A.fullLife, [ANGRA_UNIT.tawrich]]);
    zarichUnit.alive = false; // both down: Tawrich first, then (raised) Zarich
    c = b.poll();
    expect(b.targets(c)).toEqual([ANGRA_UNIT.tawrich]);
    tawrichUnit.alive = true;
    c = b.poll();
    expect([b.id(c), b.targets(c)]).toEqual([A.fullLife, [ANGRA_UNIT.zarich]]);
    expect(b.rng.calls).toHaveLength(0);
    zarichUnit.alive = true;
    // Osmose beats Full-Life; Full-Life beats the due Flame (which then goes on the next poll).
    tawrichUnit.alive = false;
    b.self.mp = 50;
    expect(b.id(b.poll())).toBe(A.osmose);
    b.self.mp = 9999;
    setMem(b.self, FLAME_COUNTER, 14);
    expect(b.id(b.poll())).toBe(A.fullLife);
    tawrichUnit.alive = true;
    expect(b.id(b.poll())).toBe(A.flame);
  });

  it('with no girl standing the script has no move and spends nothing (not even the counter)', () => {
    const b = opened();
    for (const girl of b.girls) girl.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
    expect(mem(b.self, FLAME_COUNTER)).toBe(8);
  });
});

describe('the body: the roll [RE §9.5 branch 6]', () => {
  it('random() mod 5: 0 Flare, 1 Curaga, 2 Bio, 3 and 4 Demi; over 500 consecutive values every residue comes up 100 times (Demi 200), and nobody has Reflect so Dispel never', () => {
    const b = opened();
    const count: Record<string, number> = {};
    const expected = [A.flare, A.curaga, A.bio, A.demi, A.demi];
    for (let v = 0; v < 500; v++) {
      setMem(b.self, FLAME_COUNTER, 0);
      b.rng.drain();
      const id = b.id(b.poll(v, 0, 0))!; // the extra values feed a Flare's search or a Curaga's second draw
      expect(id, `value ${v}`).toBe(expected[v % 5]);
      count[id] = (count[id] ?? 0) + 1;
    }
    expect(count).toEqual({ [A.flare]: 100, [A.curaga]: 100, [A.bio]: 100, [A.demi]: 200 });
  });

  it('Bio and Demi take the whole party (no target list) and draw only the roll', () => {
    for (const residue of [2, 3, 4]) {
      const b = opened();
      const before = b.rng.calls.length;
      const c = b.poll(roll(residue));
      expect(b.targets(c)).toEqual([]);
      expect(b.rng.calls.slice(before)).toEqual([ROLL_RANGE]);
    }
  });

  it('Curaga is aimed at an arm by a second draw mod 2 (0 Zarich, 1 Tawrich), two draws on the roll\'s stream, and it casts even with both arms at full health', () => {
    for (const [second, arm] of [[0, ANGRA_UNIT.zarich], [1, ANGRA_UNIT.tawrich], [2, ANGRA_UNIT.zarich], [3, ANGRA_UNIT.tawrich]] as const) {
      const b = opened();
      const before = b.rng.calls.length;
      const c = b.poll(roll(1), second);
      expect([b.id(c), b.targets(c)]).toEqual([A.curaga, [arm]]);
      expect(b.rng.calls.slice(before)).toEqual([ROLL_RANGE, ROLL_RANGE]);
    }
  });

  it('Flare goes to the near-weighted pick of the living girls from the body\'s spot (-45, -13): weights 269 / 391 / 278 over a draw, mod 938', () => {
    expect(ANGRA_SCENE).toBe(SCENES.angra);
    const weights = sceneWeights(ANGRA_SCENE, [0, 1, 2]);
    expect(weights).toEqual([269, 391, 278]);
    const cases = [[0, 'yuna'], [269, 'yuna'], [270, 'rikku'], [660, 'rikku'], [661, 'paine'], [937, 'paine'], [938, 'yuna'], [938 + 270, 'rikku']] as const;
    for (const [raw, who] of cases) {
      const b = opened();
      const before = b.rng.calls.length;
      const c = b.poll(roll(0), raw);
      expect([b.id(c), b.targets(c)], `draw ${raw}`).toEqual([A.flare, [who]]);
      expect(b.rng.calls.slice(before), `draw ${raw}`).toEqual([ROLL_RANGE, SEARCH_RANGE]);
      expect(['yuna', 'rikku', 'paine'][pickIndexByWeights(raw, weights)]).toBe(who);
    }
  });

  it('Flare skips a girl with Reflect (the weights of the others, no draw for a lone candidate), and a girl who is down', () => {
    const rest = sceneWeights(ANGRA_SCENE, [1, 2]); // Rikku and Paine: 391 / 278
    expect(rest).toEqual([391, 278]);
    const cases = [[0, 'rikku'], [391, 'rikku'], [392, 'paine'], [668, 'paine']] as const;
    for (const [raw, who] of cases) {
      const b = opened();
      reflect(b.girls[0]);
      expect(b.targets(b.poll(roll(0), raw)), `Yuna reflecting, draw ${raw}`).toEqual([who]);
      const d = opened();
      d.girls[0].alive = false;
      expect(d.targets(d.poll(roll(0), raw)), `Yuna down, draw ${raw}`).toEqual([who]);
    }
    const lone = opened();
    reflect(lone.girls[0]);
    reflect(lone.girls[1]);
    const before = lone.rng.calls.length;
    expect(lone.targets(lone.poll(roll(0)))).toEqual(['paine']);
    expect(lone.rng.calls.length - before, 'only the roll').toBe(1);
  });

  it('when every living girl has Reflect the roll of 0 is Dispel on one of them, picked uniformly (raw mod the count), none for a lone girl', () => {
    for (const [raw, who] of [[0, 'yuna'], [1, 'rikku'], [2, 'paine'], [3, 'yuna'], [5, 'paine']] as const) {
      const b = opened();
      b.girls.forEach(reflect);
      const before = b.rng.calls.length;
      const c = b.poll(roll(0), raw);
      expect([b.id(c), b.targets(c)], `draw ${raw}`).toEqual([A.dispel, [who]]);
      expect(b.rng.calls.slice(before)).toEqual([ROLL_RANGE, SEARCH_RANGE]);
    }
    const two = opened();
    two.girls.forEach(reflect);
    two.girls[0].alive = false;
    expect(two.targets(two.poll(roll(0), 1))).toEqual(['paine']); // 1 mod 2 of (Rikku, Paine)
    const one = opened();
    one.girls.forEach(reflect);
    one.girls[0].alive = false;
    one.girls[1].alive = false;
    const before = one.rng.calls.length;
    expect([one.id(one.poll(roll(0))), one.rng.calls.length - before]).toEqual([A.dispel, 1]);
  });
});

describe('Zarich [RE §9.7]', () => {
  const SPELLS = [A.firaga, A.waterga, A.thundaga, A.blizzaga];

  it('her first poll makes the start draw (random() mod 4, one draw) and is Glimmer of Despair; then six spells in the rotation and Glimmer again, a 7-poll cycle that goes on', () => {
    for (let start = 0; start < 4; start++) {
      const z = zarich();
      const first = z.poll(4 * 25 + start);
      expect([z.id(first), z.targets(first)], `start ${start}`).toEqual([A.glimmer, []]);
      expect(z.rng.calls, `start ${start}`).toEqual([ROLL_RANGE]);
      expect(mem(z.self, ZARICH_SPELL_INDEX)).toBe(start);
      expect(mem(z.self, ZARICH_CYCLE)).toBe(0);
      let spell = 0;
      for (let poll = 2; poll <= 35; poll++) {
        const before = z.rng.calls.length;
        const c = z.poll(0);
        if ((poll - 1) % 7 === 0) {
          expect(z.id(c), `start ${start} poll ${poll}`).toBe(A.glimmer);
          expect(z.rng.calls.length - before).toBe(0);
          z.rng.drain();
        } else {
          expect(z.id(c), `start ${start} poll ${poll}`).toBe(SPELLS[(start + spell++) % 4]);
          expect(z.rng.calls.slice(before)).toEqual([SEARCH_RANGE]);
        }
      }
    }
  });

  it('a spell goes to one living girl picked uniformly (raw mod the count; none drawn for a lone girl); Glimmer names no target', () => {
    for (const [raw, who] of [[0, 'yuna'], [1, 'rikku'], [2, 'paine'], [3, 'yuna']] as const) {
      const z = zarich();
      z.poll(0); // the start draw
      expect(z.targets(z.poll(raw)), `draw ${raw}`).toEqual([who]);
    }
    const z = zarich();
    z.poll(0);
    z.girls[0].alive = false;
    expect(z.targets(z.poll(1))).toEqual(['paine']); // 1 mod 2 of (Rikku, Paine)
    z.girls[1].alive = false;
    const before = z.rng.calls.length;
    expect(z.targets(z.poll())).toEqual(['paine']);
    expect(z.rng.calls.length).toBe(before);
  });

  it('MP below 100 is Glimmer at once and does not move the cycle (99 yes, 100 no)', () => {
    const z = zarich();
    z.poll(0);
    z.poll(0); // a spell: cycle 1
    const cycle = mem(z.self, ZARICH_CYCLE);
    z.self.mp = 99;
    expect(z.id(z.poll())).toBe(A.glimmer);
    expect(mem(z.self, ZARICH_CYCLE)).toBe(cycle);
    z.self.mp = 100;
    expect(SPELLS).toContain(z.id(z.poll(0)));
  });

  it('with no girl standing she has no move and the start draw is still to come', () => {
    const z = zarich();
    for (const girl of z.girls) girl.alive = false;
    expect(z.poll()).toBeNull();
    expect(z.rng.calls).toHaveLength(0);
    z.girls[0].alive = true;
    z.poll(2);
    expect(mem(z.self, ZARICH_SPELL_INDEX)).toBe(2);
  });
});

describe('Tawrich [RE §9.8]', () => {
  it('seven Punches then Bloody Breath, an 8-poll cycle: polls 8, 16, 24 and 32 are the Breath (the whole party, no draw); each Punch draws one search', () => {
    const t = tawrich();
    const breaths: number[] = [];
    for (let poll = 1; poll <= 33; poll++) {
      t.rng.drain();
      const before = t.rng.calls.length;
      const c = t.poll(0);
      if (t.id(c) === A.bloodyBreath) {
        breaths.push(poll);
        expect([t.targets(c), t.rng.calls.length - before], `poll ${poll}`).toEqual([[], 0]);
      } else {
        expect(t.id(c), `poll ${poll}`).toBe(A.punch);
        expect(t.rng.calls.slice(before)).toEqual([SEARCH_RANGE]);
      }
    }
    expect(breaths).toEqual([8, 16, 24, 32]);
  });

  it('the Punch is the near-weighted pick from the body\'s spot (one constant, [inferred]): the same 269 / 391 / 278 weights as the Flare; one candidate draws nothing', () => {
    expect(COMPANION_SEARCH_ORIGIN).toBe(SCENES.angra.boss);
    expect(TAWRICH_SCENE.boss).toBe(COMPANION_SEARCH_ORIGIN);
    expect(TAWRICH_SCENE.girls).toBe(SCENES.angra.girls);
    for (const [raw, who] of [[0, 'yuna'], [269, 'yuna'], [270, 'rikku'], [660, 'rikku'], [661, 'paine'], [937, 'paine']] as const) {
      const t = tawrich();
      expect(t.targets(t.poll(raw)), `draw ${raw}`).toEqual([who]);
    }
    const lone = tawrich();
    lone.girls[0].alive = false;
    lone.girls[1].alive = false;
    expect([lone.targets(lone.poll()), lone.rng.calls.length]).toEqual([['paine'], 0]);
  });

  it('with no girl standing he has no move', () => {
    const t = tawrich();
    for (const girl of t.girls) girl.alive = false;
    expect(t.poll()).toBeNull();
  });
});

describe('the scripts as registered', () => {
  it('the three ids resolve to the three scripts, and none defines a hook: nothing reacts to a hit', () => {
    expect(angraMainyuScripts.map((s) => s.id)).toEqual([ANGRA_MAINYU_SCRIPT, ZARICH_SCRIPT, TAWRICH_SCRIPT]);
    for (const script of angraMainyuScripts) {
      expect(aiScriptFor(script.id)).toBe(script);
      expect(Object.keys(script).sort(), script.id).toEqual(['decide', 'id']);
    }
  });
});
