/**
 * PR-0186 (FFX only, Chapter III): the folded Sensor chip, while aiming, lifts clear above the
 * enemies under its resting place (the Final Aeon and Yu Pagoda B at 1600x900), in grid px.
 */
import { describe, expect, it } from 'vitest';
import { chipLiftDy } from '../../src/ui/ffx/sensorAimFold.ts';

const chip = { left: 436, right: 486, top: 166, bottom: 176 };

describe('chipLiftDy', () => {
  it('lifts the chip above the highest enemy it meets', () => {
    const dy = chipLiftDy(chip, [{ left: 330, right: 470, top: 88, bottom: 220 }, { left: 468, right: 520, top: 114, bottom: 196 }], 24);
    expect(dy).not.toBeNull();
    expect(chip.bottom + dy!).toBeLessThanOrEqual(88 - 2);
  });
  it('no enemy under it: stays', () => {
    expect(chipLiftDy(chip, [{ left: 100, right: 200, top: 80, bottom: 220 }], 24)).toBeNull();
  });
  it('never rises past the floor line', () => {
    const dy = chipLiftDy(chip, [{ left: 400, right: 500, top: 20, bottom: 220 }], 24);
    expect(chip.top + dy!).toBe(24);
  });
});
