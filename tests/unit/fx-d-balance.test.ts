/**
 * Option D (A + B + C together, `?fx=d`), the eye-candy options round: the shared combat
 * energy that lets A's bloom yield to C's combat layers (`src/engine/fx/fxShared.ts`).
 * Game case: both (shared plumbing). Prototype branch only, not for main until Bailey picks.
 */
import { describe, expect, it } from 'vitest';
import { bloomUnderCombat, cEnergyBump, stepCEnergy } from '../../src/engine/fx/fxShared.ts';

describe('option D: A yields to C in combat', () => {
  it('weighs a Special above a spell above a heavy blow above a hit', () => {
    expect(cEnergyBump('big')).toBeGreaterThan(cEnergyBump('fire'));
    expect(cEnergyBump('fire')).toBeGreaterThan(cEnergyBump('heavy'));
    expect(cEnergyBump('heavy')).toBeGreaterThan(cEnergyBump('hit'));
  });

  it('decays to rest within a few seconds and never exceeds 1', () => {
    let e = stepCEnergy(0, 0, 1);
    e = stepCEnergy(e, 0, 1);
    expect(e).toBe(1);
    for (let i = 0; i < 180; i++) e = stepCEnergy(e, 1 / 60);
    expect(e).toBeLessThan(0.05);
    expect(stepCEnergy(0.5, 0)).toBe(0.5); // a frozen frame holds its energy
  });

  it('leaves the bloom whole at rest and keeps a tenth of it at a Special', () => {
    expect(bloomUnderCombat(0)).toEqual({ strength: 1, swell: 1 });
    const peak = bloomUnderCombat(1);
    expect(peak.strength).toBeCloseTo(0.1);
    expect(peak.swell).toBe(0);
    expect(bloomUnderCombat(7).strength).toBeCloseTo(0.1);
  });
});
