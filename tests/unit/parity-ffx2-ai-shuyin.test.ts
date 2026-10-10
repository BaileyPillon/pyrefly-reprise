/**
 * Re-parity AI lane FFX-2 a: Shuyin follows the game's own script (rows S1, S2 of `research/re-ffx2-ai-bahamut-vegnagun.md` section
 * 10). **FFX-2 only** (Chapter V, link 5). The decision table, row by row, on the shipped script with a scripted random stream.
 *
 * Reproduced from the note: the odds of the voice lines. With the gate open a poll flips `random() % 2`; on a heads it picks one
 * line of a pool by `random() % 5` (above half HP) or `random() % 7` (below), so a given unspoken line comes up with 1/10 and 1/14
 * of the open polls: counted here over every value of the pick, residue by residue.
 */

import { describe, expect, it } from 'vitest';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { sceneWeights, SCENES } from '../../src/battle/ffx2/ai/script-rolls.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { aimOf, RANDOM_MAX, scriptHarness, SEARCH_MAX, triggerNames, type ScriptHarness } from './helpers/ffx2AiScripted.ts';

const MAX_HP = 23850;
const shuyin = (hp = MAX_HP) => {
  const unit = aiUnit('shuyin', 'enemy', MAX_HP, 0);
  unit.hp = hp;
  return unit;
};
/** A fallback of 1: the voice gate's coin lands on tails, so no line is spoken unless a test feeds a heads. */
const harness = (hp = MAX_HP, values: readonly number[] = []) => scriptHarness(shuyin(hp), 'shuyin', [], values, 1);

const CYCLE = ['shuyin-attack', 'terror-of-zanarkand', 'shuyin-attack', 'run-and-slash', 'shuyin-attack', 'spin-cut', 'shuyin-attack', 'force-rain'];

const wear = (unit: Ffx2Unit, sphere: string): void => {
  (unit as { dresspheres?: unknown }).dresspheres = { current: sphere };
};

describe('the eight-turn cycle', () => {
  it('runs Attack, Terror of Zanarkand, Attack, Hit & Run, Attack, Spin Cut, Attack, Force Rain, for ever', () => {
    expect(harness().run(24)).toEqual([...CYCLE, ...CYCLE, ...CYCLE]);
  });

  it('aims Hit & Run and Force Rain at the whole party and the rest at one girl', () => {
    const h = harness();
    const commands = Array.from({ length: 8 }, () => h.poll());
    expect(commands.map((c) => aimOf(c).length)).toEqual([1, 1, 1, 0, 1, 1, 1, 0]);
  });

  it('telegraphs Terror of Zanarkand rather than landing nine hits unannounced', () => {
    const h = harness();
    h.run(2);
    const charge = h.emitted.find((e) => e.type === 'charge') as { name: string } | undefined;
    expect(charge?.name).toBe('Terror of Zanarkand');
  });
});

describe('S1: who he aims at', () => {
  it('picks the Attack of turn 1 and Terror of Zanarkand by the near-weighted search, and the other single targets uniformly', () => {
    const near = sceneWeights(SCENES.shuyin, [0, 1, 2]);
    const total = near.reduce((s, w) => s + w, 0);
    const turn = (n: number, raw: number): string | undefined => {
      const h = harness();
      h.run(n - 1);
      h.rng.reset();
      h.rng.feed(1, raw); // the gate's coin on tails, then the pick
      return aimOf(h.poll())[0];
    };
    expect(turn(1, 0)).toBe('yuna');
    expect(turn(1, total - 1)).toBe('paine');
    expect(turn(2, 0)).toBe('yuna');
    // Uniform: the (raw mod 3)-th girl, so raw 1 is Rikku whatever the weights are.
    expect(turn(3, 1)).toBe('rikku');
    expect(turn(5, 2)).toBe('paine');
    expect(turn(6, 1)).toBe('rikku'); // Spin Cut
    expect(turn(7, 4)).toBe('rikku');
  });

  it('has no rule that hunts Yuna: with her alive and nobody in a Special 1, Terror of Zanarkand goes where the search lands', () => {
    const total = sceneWeights(SCENES.shuyin, [0, 1, 2]).reduce((s, w) => s + w, 0);
    const h = harness();
    h.run(1);
    h.rng.reset();
    h.rng.feed(1, total - 1); // tails, then the search's last value
    expect(aimOf(h.poll())).toEqual(['paine']);
  });

  it('aims Terror of Zanarkand at the girl wearing her Special 1 dressphere, whatever the search picked', () => {
    const terror = (set: (g: Ffx2Unit[]) => void, raw = 0): string | undefined => {
      const h = harness();
      set(h.girls);
      h.run(1);
      h.rng.reset();
      h.rng.feed(1, raw);
      const c = h.poll();
      expect(c && 'id' in c ? c.id : null).toBe('terror-of-zanarkand');
      expect(h.rng.calls).toEqual([[0, RANDOM_MAX], [0, SEARCH_MAX]]); // the search is drawn first, the override follows
      return aimOf(c)[0];
    };
    expect(terror(() => undefined)).toBe('yuna'); // nobody wears one: the search's own pick, raw 0
    expect(terror((g) => wear(g[1]!, 'machina-maw'))).toBe('rikku');
    expect(terror((g) => wear(g[0]!, 'floral-fallal'), 1328)).toBe('yuna');
    expect(terror((g) => wear(g[2]!, 'full-throttle'))).toBe('paine');
  });

  it('lets a later check win: Paine over Yuna, Rikku over both', () => {
    const terror = (set: (g: Ffx2Unit[]) => void): string | undefined => {
      const h = harness();
      set(h.girls);
      h.run(1);
      return aimOf(h.poll())[0];
    };
    expect(terror((g) => { wear(g[0]!, 'floral-fallal'); wear(g[2]!, 'full-throttle'); })).toBe('paine');
    expect(terror((g) => { wear(g[0]!, 'floral-fallal'); wear(g[1]!, 'machina-maw'); })).toBe('rikku');
    expect(terror((g) => { wear(g[0]!, 'floral-fallal'); wear(g[1]!, 'machina-maw'); wear(g[2]!, 'full-throttle'); })).toBe('rikku');
  });

  it('wears a Special 1 only on the Terror turn: the other turns ignore it', () => {
    const h = harness();
    wear(h.girls[1]!, 'machina-maw');
    h.run(2);
    h.rng.reset();
    h.rng.feed(1, 0); // the gate's coin on tails, then the uniform pick of turn 3: raw 0
    expect(aimOf(h.poll())).toEqual(['yuna']);
  });
});

describe('S2: the voice lines', () => {
  const lineSpoken = (hp: number, pick: number, history: ScriptHarness | null = null) => {
    const h = history ?? harness(hp);
    h.rng.reset();
    h.rng.feed(0, pick); // a heads, then the pick
    const c = h.poll();
    const e = h.emitted.filter((x) => x.type === 'script-trigger').at(-1) as { payload?: { line?: string }; name?: string } | undefined;
    return { c, h, line: e?.payload?.line, name: e?.name };
  };

  it('flips random() % 2 on a poll with the gate open and speaks on a heads, with the poll ending there', () => {
    const { c, name, h } = lineSpoken(MAX_HP, 0);
    expect(c).toBeNull();
    expect(name).toBe('shuyin-taunt');
    expect(h.rng.calls).toEqual([[0, RANDOM_MAX], [0, RANDOM_MAX]]);
    expect(h.ctx.self.aiMemory?.['turn'] ?? 0).toBe(0); // the cycle did not move
  });

  it('does not flip on the poll after a heads: the gate is shut, the poll attacks', () => {
    const { h } = lineSpoken(MAX_HP, 0);
    h.rng.reset();
    const c = h.poll();
    expect(c && 'id' in c ? c.id : null).toBe('shuyin-attack');
    expect(h.rng.calls.filter(([, hi]) => hi === RANDOM_MAX)).toEqual([]); // no coin, no pick
  });

  it('picks the line of a pool of five above half HP and of seven below it, the half being strict', () => {
    expect(lineSpoken(MAX_HP, 0).line).toBe('jeck01');
    expect(lineSpoken(11925, 4).line).toBe('blaska02'); // 23,850 / 2 = 11,925: not below
    expect(lineSpoken(11924, 6).line).toBe('blaska04');
    expect(lineSpoken(11924, 0).name).toBe('shuyin-desperate');
  });

  it('says each line once: a spoken one falls through to the attack in the same poll, and the gate stays shut after it', () => {
    const first = lineSpoken(MAX_HP, 0);
    first.h.run(1); // the shut gate opens again with this attack
    const again = lineSpoken(MAX_HP, 0, first.h);
    expect(again.c).not.toBeNull(); // spent: the poll goes on to attack
    expect(first.h.ctx.self.aiMemory?.['gate']).toBe(1);
    first.h.rng.reset();
    first.h.poll();
    expect(first.h.rng.calls.filter(([, hi]) => hi === RANDOM_MAX)).toEqual([]); // no attempt on the next poll
  });

  it('reproduces the odds: counted over every pick, a given line is the next with 1/10 above half HP and 1/14 below', () => {
    const tally = (hp: number, pool: number): Record<string, number> => {
      const counts: Record<string, number> = {};
      for (let pick = 0; pick <= RANDOM_MAX; pick += 1) {
        const h = harness(hp);
        h.rng.feed(0, pick);
        h.poll();
        const e = h.emitted.find((x) => x.type === 'script-trigger') as { payload: { line: string } } | undefined;
        const line = e?.payload.line ?? 'none';
        counts[line] = (counts[line] ?? 0) + 1;
      }
      expect(Object.values(counts).reduce((s, c) => s + c, 0)).toBe(RANDOM_MAX + 1);
      expect(Object.keys(counts)).toHaveLength(pool);
      return counts;
    };
    // 65,536 = 5 x 13,107 + 1 = 7 x 9,362 + 2: the first residues own one extra value.
    expect(tally(MAX_HP, 5)).toEqual({ jeck01: 13108, alone01: 13107, alone02: 13107, blaska01: 13107, blaska02: 13107 });
    expect(tally(1000, 7)).toEqual({ jeck02: 9363, jeck03: 9363, jeck04: 9362, alone03: 9362, alone04: 9362, blaska03: 9362, blaska04: 9362 });
  });

  it('runs out of lines: five above half HP, and then it only attacks', () => {
    const h = harness(MAX_HP);
    for (let i = 0; i < 60; i++) {
      h.rng.reset();
      if ((h.ctx.self.aiMemory?.['gate'] ?? 0) === 0) h.rng.feed(0, i % 5); // a heads and a pick whenever the gate is open
      h.poll();
    }
    expect(triggerNames(h.emitted).filter((n) => n === 'shuyin-taunt')).toHaveLength(5);
    expect(triggerNames(h.emitted).filter((n) => n === 'shuyin-desperate')).toHaveLength(0);
  });
});
