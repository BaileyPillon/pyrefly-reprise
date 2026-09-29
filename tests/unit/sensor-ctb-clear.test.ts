/**
 * PR-0233 (critic round 15), FFX only: the open enemy read-out covered the
 * turn list's longest names ("ortiorchis"). Numbers are the ones measured on
 * Chapter I's first menu at 2000x1012 before the fix (viewport px): plate
 * [1300, 467, 1633, 714]; names "Seymour Flux" [1600, 443..489] and
 * "Mortiorchis" [1595, 521..548]; "Tidus" [1680, 166..193] is above the plate.
 */
import { describe, expect, it } from 'vitest';
import { ctbClearShift } from '../../src/ui/ffx/sensorCtbClear.ts';

const plate = { left: 1300, right: 1633, top: 467, bottom: 714 };
const names = [
  { left: 1680, right: 1750, top: 166, bottom: 193 },
  { left: 1600, right: 1730, top: 443, bottom: 489 },
  { left: 1595, right: 1730, top: 521, bottom: 548 },
];

describe('ctbClearShift', () => {
  it('slides the plate left of every name in its rows, with the gap', () => {
    const gap = 4 * 2.811;
    const shift = ctbClearShift(plate, names, gap);
    expect(plate.right + shift).toBeLessThanOrEqual(1595 - gap + 0.001);
    expect(shift).toBeLessThan(0);
  });

  it('ignores names in other rows and never moves right', () => {
    expect(ctbClearShift(plate, [names[0]!], 10)).toBe(0);
    expect(ctbClearShift({ ...plate, right: 1500 }, names, 10)).toBe(0);
  });
});
