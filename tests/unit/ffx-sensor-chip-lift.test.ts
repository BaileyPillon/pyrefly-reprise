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
  it('a lift that lands on a taller enemy rises again (2560x1440: Pagoda B, then the Final Aeon)', () => {
    const dy = chipLiftDy(chip, [{ left: 470, right: 520, top: 150, bottom: 196 }, { left: 330, right: 480, top: 100, bottom: 150 }], 24);
    expect(chip.bottom + dy!).toBeLessThanOrEqual(98);
  });
  it('no enemy under it: stays', () => {
    expect(chipLiftDy(chip, [{ left: 100, right: 200, top: 80, bottom: 220 }], 24)).toBeNull();
  });
  it('P-01: with room to spare it clears a bracket it only grazed, then the name plate above it', () => {
    // Chapter III at 1600x900, aiming at the Final Aeon: the chip rested 2 grid px from the bracket's corner.
    const grazing = { left: 530, right: 624, top: 108, bottom: 118.7 };
    const aeon = { left: 354, right: 522, top: 99.6, bottom: 254.7 };
    expect(chipLiftDy(grazing, [aeon], 40)).toBeNull(); // no room kept: it stayed against the corner
    const dy = chipLiftDy(grazing, [aeon], 40, 2, 10);
    expect(grazing.bottom + dy!).toBeLessThanOrEqual(aeon.top - 10 - 2);
    const above = { left: 483, right: 577, top: 86.7, bottom: 97.3 };
    const plate = { left: 399, right: 478, top: 80.9, bottom: 96.9 };
    const dy2 = chipLiftDy(above, [aeon, plate], 40, 2, 10);
    expect(above.bottom + dy2!).toBeLessThanOrEqual(plate.top - 10 - 2);
  });
  it('never rises past the floor line', () => {
    const dy = chipLiftDy(chip, [{ left: 400, right: 500, top: 20, bottom: 220 }], 24);
    expect(chip.top + dy!).toBe(24);
  });
});
