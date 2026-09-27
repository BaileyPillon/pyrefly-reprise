/**
 * PR-0031 (FFX only): the TARGET plate sits top-centre as in the approved frames, but steps aside from
 * a HUD panel it would print over (Chapter III at 1600x900: the advisor card ran 405..780 px and the
 * centred plate 700..900 px covered its corner and the actor's name).
 */
import { describe, expect, it } from 'vitest';
import { plateLeft } from '../../src/ui/ffx/targetPlateFfx.ts';

const plate = { x: 700, y: 22, w: 200, h: 36 };

describe('plateLeft', () => {
  it('keeps the centred place when nothing is under it', () => {
    expect(plateLeft(plate, [{ x: 50, y: 90, w: 330, h: 180 }], 1600)).toBe(700);
  });
  it('steps right of a panel it would cover', () => {
    const x = plateLeft(plate, [{ x: 405, y: 20, w: 375, h: 215 }], 1600);
    expect(x).toBeGreaterThanOrEqual(780);
    expect(x + plate.w).toBeLessThanOrEqual(1600);
  });
  it('steps left when the right has no room', () => {
    const x = plateLeft(plate, [{ x: 650, y: 20, w: 940, h: 60 }], 1600);
    expect(x + plate.w).toBeLessThanOrEqual(650);
  });
  it('ignores a panel below its band', () => {
    expect(plateLeft(plate, [{ x: 405, y: 120, w: 375, h: 100 }], 1600)).toBe(700);
  });
});
