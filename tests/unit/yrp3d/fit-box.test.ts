/**
 * **Which pose a model is fitted by** (`layout.ts` `fitBoxOf`; ch-yrp review MAJOR-4, 2026-11-02; FFX-2 only). A model is scaled and lifted so its box stands on the floor at its figure's height; the box is the default pose's,
 * unless the pose the model rests in stands somewhere else. The numbers below are the real files' (measured with three's loader in the game's units, the `.chr` scale applied): the girls' default poses stand on the floor, the
 * game's Bahamut's is centred on his middle. What it pins:
 *
 * 1. **The rule**: the girls keep their default box; Bahamut takes his idle's; the 5 percent edge; an empty, flat or non-finite posed box changes nothing.
 * 2. **The bug it fixes, in numbers**: fitted by his default pose at 5.0, his idle stood 3.2 world units off the floor; fitted by his idle at the staging height, it stands on it.
 *
 * (The real files, by every vertex, are in `real-boss-fit.test.ts`, skipped without the models.)
 */
import { describe, expect, it } from 'vitest';

import { BOSS_HEIGHT, fitBox, fitBoxOf, type BoxData } from '../../../src/engine/yrp3d/layout.ts';

const box = (min: [number, number, number], max: [number, number, number]): BoxData => ({ min, max });

const YUNA_DEFAULT = box([-5.97, 0, -4.53], [5.96, 16.5, 4.54]);
const YUNA_IDLE = box([-3.2, 0.01, -2.9], [3.17, 16.05, 2.9]);
const RIKKU_DEFAULT = box([-5.7, 0.03, -2.2], [5.71, 17.45, 2.23]);
const RIKKU_IDLE = box([-2.0, 0.02, -3.5], [2.05, 16.33, 3.4]);
const BAHAMUT_DEFAULT = box([-50.4, -57.18, -41.79], [50.4, 30.67, 6.64]);
const BAHAMUT_IDLE = box([-44.42, -0.26, -60.42], [44.55, 56.47, 6.96]);

describe('the rule', () => {
  it('keeps a girl\'s default box (her default pose stands on the floor, within a hundredth of her idle\'s lowest point)', () => {
    expect(fitBoxOf(YUNA_DEFAULT, YUNA_IDLE)).toBe(YUNA_DEFAULT);
    expect(fitBoxOf(RIKKU_DEFAULT, RIKKU_IDLE)).toBe(RIKKU_DEFAULT);
  });

  it('takes Bahamut\'s idle box (his default pose is centred on his middle, 57 below the floor his idle stands on)', () => {
    expect(fitBoxOf(BAHAMUT_DEFAULT, BAHAMUT_IDLE)).toBe(BAHAMUT_IDLE);
  });

  it('draws the line at 5 percent of the default box\'s height: at it the default stays, past it the posed box is taken', () => {
    const rest = box([0, 0, 0], [10, 100, 10]);
    expect(fitBoxOf(rest, box([0, 5, 0], [10, 90, 10]))).toBe(rest);
    expect(fitBoxOf(rest, box([0, 5.1, 0], [10, 90, 10])).min[1]).toBe(5.1);
    expect(fitBoxOf(rest, box([0, -5.1, 0], [10, 90, 10])).min[1]).toBe(-5.1); // below the floor is as far from it as above
  });

  it('changes nothing for no posed box, a flat one, or one with a non-finite corner', () => {
    expect(fitBoxOf(BAHAMUT_DEFAULT, null)).toBe(BAHAMUT_DEFAULT);
    expect(fitBoxOf(BAHAMUT_DEFAULT, box([0, 3, 0], [1, 3, 1]))).toBe(BAHAMUT_DEFAULT);
    expect(fitBoxOf(BAHAMUT_DEFAULT, box([0, Number.NaN, 0], [1, 9, 1]))).toBe(BAHAMUT_DEFAULT);
    expect(fitBoxOf(BAHAMUT_DEFAULT, box([0, 0, 0], [1, Number.POSITIVE_INFINITY, 1]))).toBe(BAHAMUT_DEFAULT);
  });
});

describe('the bug it fixes, in numbers', () => {
  /** Where the idle pose's lowest vertex ends up above the floor once the model is fitted by `fitted` to `height`. */
  const idleFeet = (fitted: BoxData, height: number): number => {
    const f = fitBox(fitted, height);
    return BAHAMUT_IDLE.min[1] * f.scale + f.offset[1];
  };

  it('fitted by his default pose at the old 5.0, his idle stood more than 3 world units in the air', () => {
    expect(idleFeet(BAHAMUT_DEFAULT, 5)).toBeGreaterThan(3);
  });

  it('fitted by the box the rule picks, at the staging height, his idle stands on the floor and is that tall', () => {
    const fitted = fitBoxOf(BAHAMUT_DEFAULT, BAHAMUT_IDLE);
    expect(Math.abs(idleFeet(fitted, BOSS_HEIGHT))).toBeLessThan(1e-9);
    const f = fitBox(fitted, BOSS_HEIGHT);
    expect((BAHAMUT_IDLE.max[1] - BAHAMUT_IDLE.min[1]) * f.scale).toBeCloseTo(BOSS_HEIGHT, 9);
  });

  it('leaves a girl exactly where the old fit put her', () => {
    const girl = fitBox(YUNA_DEFAULT, 1.9);
    const again = fitBox(fitBoxOf(YUNA_DEFAULT, YUNA_IDLE), 1.9);
    expect(again).toEqual(girl);
  });
});
