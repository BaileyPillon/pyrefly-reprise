/**
 * **RE parity RC10, FFX-2 only: Lady Luck's dice kernel** (`src/battle/ffx2/kernel/die.ts`), against the vectors of the independent model of FFX2-H04.
 *
 * `tests/fixtures/parity/ffx2/dice_vectors.json` (numbers only) holds the first 4,000 values of the effect module's face generator from the cold state, the generator's
 * words at eleven checkpoints, and 2,400 die-result vectors. The note proved the model against the live FFX-2.exe: the generator on 200,000 emulated calls and the
 * die result on 10,000 emulated vectors, 0 mismatches each (FFX2-H04 section 6). Game case: FFX-2 only (Lady Luck).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DIE_CYCLE_LENGTH,
  DIE_ROWS,
  DIE_TRANSIENT_CALLS,
  coldDieGenerator,
  dieFace,
  dieGeneratorInCycle,
  dieResult,
  dieValue,
} from '../../src/battle/ffx2/kernel/die.ts';

interface Vectors {
  transient: number;
  cycleLength: number;
  cycleHistogram: number[];
  values: string;
  checkpoints: Record<string, { state: number; primed: boolean }>;
  dieResult: Array<{ faces: number[]; command: number; hits: number }>;
}

const VECTORS = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/dice_vectors.json', import.meta.url)), 'utf8')) as Vectors;

describe('the face generator equals the note\'s model call for call (FFX2-H04 3.9)', () => {
  it('the first 4,000 values from the cold state, and the generator\'s words at eleven calls', () => {
    const gen = coldDieGenerator();
    const got: string[] = [];
    for (let i = 1; i <= VECTORS.values.length; i++) {
      got.push(String(dieValue(gen)));
      const want = VECTORS.checkpoints[String(i)];
      if (want) expect({ call: i, state: gen.state, primed: gen.primed }).toEqual({ call: i, state: want.state, primed: want.primed });
    }
    expect(got.join('')).toBe(VECTORS.values);
    expect(Object.keys(VECTORS.checkpoints)).toHaveLength(11);
  });

  it('the cold generator starts at the float 1.0 with the first call unmade, and the first value is 0', () => {
    const gen = coldDieGenerator();
    expect(gen).toEqual({ state: 0x3f800000, primed: false });
    expect(dieValue(gen)).toBe(0);
    expect(gen.primed).toBe(true);
  });

  it('after a 1,412-call transient the walk repeats a 185-value cycle (33, 36, 38, 27, 19, 32 of the values 0 to 5)', () => {
    expect(DIE_TRANSIENT_CALLS).toBe(VECTORS.transient);
    expect(DIE_CYCLE_LENGTH).toBe(VECTORS.cycleLength);
    const gen = coldDieGenerator();
    const seq: number[] = [];
    for (let i = 0; i < 4000; i++) seq.push(dieValue(gen));
    for (let i = DIE_TRANSIENT_CALLS; i + DIE_CYCLE_LENGTH < seq.length; i++) expect(seq[i]).toBe(seq[i + DIE_CYCLE_LENGTH]);
    const cycle = seq.slice(DIE_TRANSIENT_CALLS, DIE_TRANSIENT_CALLS + DIE_CYCLE_LENGTH);
    expect([0, 1, 2, 3, 4, 5].map((v) => cycle.filter((x) => x === v).length)).toEqual([33, 36, 38, 27, 19, 32]);
    expect(VECTORS.cycleHistogram).toEqual([33, 36, 38, 27, 19, 32]);
    // and the transient is not part of it: the value 1,411 calls in does not recur 185 calls later
    const early = seq.slice(0, 600);
    expect(early.some((v, i) => i + DIE_CYCLE_LENGTH < early.length && v !== early[i + DIE_CYCLE_LENGTH])).toBe(true);
  });

  it('a face is the value plus one, 1 to 6, and the faces are not a fair die (17.8, 19.5, 20.5, 14.6, 10.3, 17.3 percent in the cycle)', () => {
    const gen = dieGeneratorInCycle(0);
    const count = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < DIE_CYCLE_LENGTH; i++) count[dieFace(gen) - 1]! += 1;
    expect(count.map((c) => Math.round((c / DIE_CYCLE_LENGTH) * 1000) / 10)).toEqual([17.8, 19.5, 20.5, 14.6, 10.3, 17.3]);
  });

  it('a generator placed at a position of the cycle follows the cold walk from call 1,412 plus that position', () => {
    const cold = coldDieGenerator();
    const walk: number[] = [];
    for (let i = 0; i < DIE_TRANSIENT_CALLS + 2 * DIE_CYCLE_LENGTH; i++) walk.push(dieValue(cold));
    for (const position of [0, 1, 17, 100, 184]) {
      const gen = dieGeneratorInCycle(position);
      const got: number[] = [];
      for (let i = 0; i < 40; i++) got.push(dieValue(gen));
      const at = DIE_TRANSIENT_CALLS + position;
      expect(got, `position ${position}`).toEqual(walk.slice(at, at + 40));
    }
    // a position wraps around the cycle
    expect(dieGeneratorInCycle(185)).toEqual(dieGeneratorInCycle(0));
    expect(dieGeneratorInCycle(-1)).toEqual(dieGeneratorInCycle(184));
  });
});

describe('the die result equals the note\'s oracle on 2,400 vectors (FFX2-H04 3.9)', () => {
  it('the command the dice swap to and the hit count they hand the hit determination', () => {
    for (const v of VECTORS.dieResult) expect(dieResult(v.faces), JSON.stringify(v.faces)).toEqual({ commandId: v.command, hits: v.hits });
    expect(VECTORS.dieResult.length).toBe(2400);
  });

  it('the cases the engine meets: two dice', () => {
    expect(dieResult([3, 5])).toEqual({ commandId: DIE_ROWS.twoDice, hits: 8 });
    expect(dieResult([4, 4])).toEqual({ commandId: DIE_ROWS.twoDicePair, hits: 8 });
    expect(dieResult([6, 6])).toEqual({ commandId: DIE_ROWS.twoDicePair, hits: 12 });
    expect(dieResult([2, 2])).toEqual({ commandId: DIE_ROWS.twoDicePair, hits: 4 });
    expect(dieResult([1, 1])).toEqual({ commandId: DIE_ROWS.twoDiceOnes, hits: 2 });
    expect(dieResult([1, 2])).toEqual({ commandId: DIE_ROWS.twoDice, hits: 3 });
  });

  it('four dice use the second set of rows (not wired in the engine: the game\'s source of Four Dice\'s faces was not found)', () => {
    expect(dieResult([1, 1, 1, 1])).toEqual({ commandId: DIE_ROWS.fourDiceOnes, hits: 4 });
    expect(dieResult([5, 5, 5, 5])).toEqual({ commandId: DIE_ROWS.fourDicePair, hits: 20 });
    expect(dieResult([1, 2, 3, 4])).toEqual({ commandId: DIE_ROWS.fourDice, hits: 10 });
  });
});
