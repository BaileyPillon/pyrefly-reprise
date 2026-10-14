/**
 * Re-parity AI lane FFX-2 a: the rolls and target searches the boss scripts use (`ai/script-rolls.ts`).
 * `research/re-ffx2-ai-bahamut-vegnagun.md` sections 1.3 and 1.4. **FFX-2 only.**
 *
 * Two of the note's tallies are reproduced here from the exe's own runs: the near-weighted search in two geometries (a boss at
 * (0, 30) facing the party head-on, 47.6 / 26.2 / 26.2 percent; facing away, 35.0 / 32.7 / 32.3), and the uniform search over
 * every value of the raw draw. The weights are enumerated over every `r` from 0 to W - 1, the way the interpreter counted.
 */

import { describe, expect, it } from 'vitest';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import {
  inSlotOrder,
  lacking,
  nearWeight,
  pickIndexByWeights,
  sceneWeights,
  SCENES,
  scriptMod,
  searchNear,
  searchUniform,
  spendSearchDraw,
} from '../../src/battle/ffx2/ai/script-rolls.ts';
import { NEAR_WEIGHTED_TARGET_SEARCH } from '../../src/battle/ffx2/index.ts';
import { giveStatus, RANDOM_MAX, ScriptedRng, SEARCH_MAX, threeGirls } from './helpers/ffx2AiScripted.ts';

/** How many values of `r` in `0 .. W - 1` each index owns, by running the pick over all of them. */
function tally(weights: readonly number[]): number[] {
  const total = weights.reduce((s, w) => s + w, 0);
  const counts = weights.map(() => 0);
  for (let r = 0; r < total; r++) counts[pickIndexByWeights(r, weights)] = (counts[pickIndexByWeights(r, weights)] ?? 0) + 1;
  return counts;
}

const percent = (n: number, of: number): number => Math.round((n / of) * 1000) / 10;

describe('the near-weighted search (searchr)', () => {
  it('weighs a candidate by 1 + floor(32768 / floor((1 + d)(1 + 2a) + 1))', () => {
    expect(nearWeight(50, 0)).toBe(1 + Math.floor(32768 / 52));
    expect(nearWeight(0, 0)).toBe(1 + 16384); // cost 1, floor(1 + 1) = 2
    expect(nearWeight(50, Math.PI)).toBe(1 + Math.floor(32768 / Math.floor(51 * (1 + 2 * Math.PI) + 1)));
  });

  it('reproduces the note\'s head-on tally, boss at (0, 30) facing the party: 47.6 / 26.2 / 26.2 percent', () => {
    const weights = sceneWeights(SCENES.bahamut, [0, 1, 2]);
    expect(weights).toEqual([631, 349, 349]);
    const counts = tally(weights);
    const total = counts.reduce((s, c) => s + c, 0);
    // The first slot owns one extra value (r <= sum), the last one fewer.
    expect(counts).toEqual([632, 349, 348]);
    // The note prints one decimal; these are 47.55 / 26.26 / 26.19 before rounding.
    const shares = counts.map((c) => percent(c, total));
    expect(Math.abs((shares[0] as number) - 47.6)).toBeLessThanOrEqual(0.15);
    expect(Math.abs((shares[1] as number) - 26.2)).toBeLessThanOrEqual(0.15);
    expect(Math.abs((shares[2] as number) - 26.2)).toBeLessThanOrEqual(0.15);
  });

  it('reproduces the note\'s facing-away tally: 35.0 / 32.7 / 32.3 percent', () => {
    // Facing away, the angle to the near girl is pi and to the other two about 2.842 (the direction behind the boss).
    const behind = Math.acos(-55 / Math.hypot(17, 55));
    const weights = [nearWeight(50, Math.PI), nearWeight(Math.hypot(17, 55), behind), nearWeight(Math.hypot(17, 55), behind)];
    const counts = tally(weights);
    const total = counts.reduce((s, c) => s + c, 0);
    const shares = counts.map((c) => percent(c, total));
    expect(shares).toEqual([35.0, 32.7, 32.3]);
  });

  it('runs a Bahamut Attack target over every value of r and gets the same counts through the script\'s own helper', () => {
    const girls = threeGirls();
    const total = 631 + 349 + 349;
    const picked: Record<string, number> = { yuna: 0, rikku: 0, paine: 0 };
    for (let r = 0; r < total; r++) {
      const rng = new ScriptedRng([r]);
      const who = searchNear(rng, girls, SCENES.bahamut);
      picked[who?.id ?? 'none'] = (picked[who?.id ?? 'none'] ?? 0) + 1;
      expect(rng.calls).toEqual([[0, SEARCH_MAX]]); // exactly one draw
    }
    expect(picked).toEqual({ yuna: 632, rikku: 349, paine: 348 });
  });

  it('weighs only the candidates it is given: a Rikku alone with Paine splits by their own weights', () => {
    const [, rikku, paine] = threeGirls() as [ReturnType<typeof aiUnit>, ReturnType<typeof aiUnit>, ReturnType<typeof aiUnit>];
    const weights = sceneWeights(SCENES.bahamut, [1, 2]);
    const counts = tally(weights);
    const total = weights[0]! + weights[1]!;
    let rikkuPicks = 0;
    for (let r = 0; r < total; r++) if (searchNear(new ScriptedRng([r]), [rikku, paine], SCENES.bahamut)?.id === 'rikku') rikkuPicks++;
    expect(rikkuPicks).toBe(counts[0]);
  });

  it('draws nothing with fewer than two candidates and answers nothing for none', () => {
    const rng = new ScriptedRng();
    const [yuna] = threeGirls();
    expect(searchNear(rng, [], SCENES.tail)).toBeUndefined();
    expect(searchNear(rng, [yuna!], SCENES.tail)).toBe(yuna);
    expect(searchUniform(rng, [])).toBeUndefined();
    expect(searchUniform(rng, [yuna!])).toBe(yuna);
    spendSearchDraw(rng, 1);
    expect(rng.calls).toEqual([]);
    spendSearchDraw(rng, 2);
    expect(rng.calls).toEqual([[0, SEARCH_MAX]]);
  });

  it('takes the candidates in slot order, whatever order they come in', () => {
    const [yuna, rikku, paine] = threeGirls() as [ReturnType<typeof aiUnit>, ReturnType<typeof aiUnit>, ReturnType<typeof aiUnit>];
    expect(inSlotOrder([paine, yuna, rikku]).map((u) => u.id)).toEqual(['yuna', 'rikku', 'paine']);
  });

  it('uses the scene start positions of each scene whose boss searches (numbers only)', () => {
    expect(Object.keys(SCENES)).toEqual(['bahamut', 'tail', 'leg', 'shuyin', 'besaid']); // besaid: Valefor's room, the hidden chapter (`pos_bsyt05_229`, the RE review of 2026-10-14)
    for (const scene of Object.values(SCENES)) {
      const weights = sceneWeights(scene, [0, 1, 2]);
      expect(weights.every((w) => w > 1)).toBe(true);
    }
    expect(NEAR_WEIGHTED_TARGET_SEARCH).toBe(true);
  });
});

describe('the uniform search (searchr_nop) and random()', () => {
  it('picks the (raw mod n)-th candidate, for every raw value', () => {
    const girls = threeGirls();
    const counts: Record<string, number> = { yuna: 0, rikku: 0, paine: 0 };
    for (let raw = 0; raw < 3 * 1000; raw++) {
      const who = searchUniform(new ScriptedRng([raw]), girls);
      counts[who?.id ?? 'none'] = (counts[who?.id ?? 'none'] ?? 0) + 1;
      expect(who?.id).toBe(['yuna', 'rikku', 'paine'][raw % 3]);
    }
    expect(counts).toEqual({ yuna: 1000, rikku: 1000, paine: 1000 });
  });

  it('draws one 31-bit value for a search and one 16-bit value for random()', () => {
    const rng = new ScriptedRng([40000]);
    expect(scriptMod(rng, 7)).toBe(40000 % 7);
    expect(rng.calls).toEqual([[0, RANDOM_MAX]]);
    const girls = threeGirls();
    const rng2 = new ScriptedRng();
    searchUniform(rng2, girls);
    searchNear(rng2, girls, SCENES.leg);
    expect(rng2.calls).toEqual([[0, SEARCH_MAX], [0, SEARCH_MAX]]);
  });

  it('keeps only the girls who lack the status', () => {
    const girls = threeGirls();
    giveStatus(girls[1]!, 'poison');
    expect(lacking(girls, 'poison').map((g) => g.id)).toEqual(['yuna', 'paine']);
    expect(lacking(girls, 'curse').map((g) => g.id)).toEqual(['yuna', 'rikku', 'paine']);
  });
});
