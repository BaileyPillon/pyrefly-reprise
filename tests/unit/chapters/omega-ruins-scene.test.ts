/**
 * The hidden Omega Ruins' stage (FFX only; `src/scenes/omega-ruins.ts`): the Cavern of the Stolen Fayth's scene with the three bodies staged. The stage is data here (the build itself needs a GPU): the slots, the pins, the
 * registry rows, the art-namespace row and the canon row, so a change to any of them is seen. The painting is the Cavern's plate (preflight WP5 (a)); nothing is written into the art mirror.
 */

import { describe, expect, it } from 'vitest';

import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CAVERN_STOLEN_FAYTH_SLOTS } from '../../../src/scenes/cavern-stolen-fayth.ts';
import { OMEGA_RUINS_HEIGHTS, OMEGA_RUINS_SLOTS, OMEGA_RUINS_STAGING } from '../../../src/scenes/omega-ruins.ts';
import { NEMESIS_ID, OMEGA_RUINS_PLATE, OMEGA_RUINS_SCENE, OMEGA_WEAPON_ID, ULTIMA_WEAPON_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';

describe('the ruins stage', () => {
  it('is a real registered scene (not a placeholder), keyed by the chapter\'s scene key', () => {
    const entry = getScene(OMEGA_RUINS_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots).toBe(OMEGA_RUINS_SLOTS);
  });

  it('holds the party on the Cavern\'s three slots and puts all three bodies on one boss spot, each at its own estimated height, taller than a person', () => {
    expect(OMEGA_RUINS_STAGING.holdParty).toBe(true);
    expect(OMEGA_RUINS_SLOTS.party).toEqual(CAVERN_STOLEN_FAYTH_SLOTS.party);
    const spot = OMEGA_RUINS_STAGING.enemySpots[ULTIMA_WEAPON_ID]!;
    expect(OMEGA_RUINS_STAGING.enemySpots[OMEGA_WEAPON_ID]).toEqual(spot);
    expect(OMEGA_RUINS_STAGING.enemySpots[NEMESIS_ID]).toEqual(spot);
    expect(OMEGA_RUINS_SLOTS.enemy).toEqual([spot]);
    expect(OMEGA_RUINS_STAGING.figureHeights).toEqual(OMEGA_RUINS_HEIGHTS);
    for (const h of Object.values(OMEGA_RUINS_HEIGHTS)) expect(h).toBeGreaterThan(OMEGA_RUINS_SLOTS.partyHeight! * 1.5);
    expect(OMEGA_RUINS_SLOTS.enemyHeight).toBe(OMEGA_RUINS_HEIGHTS[NEMESIS_ID]);
    expect(OMEGA_RUINS_HEIGHTS[NEMESIS_ID]).toBeGreaterThan(OMEGA_RUINS_HEIGHTS[OMEGA_WEAPON_ID]);
    expect(OMEGA_RUINS_HEIGHTS[OMEGA_WEAPON_ID]).toBeGreaterThan(OMEGA_RUINS_HEIGHTS[ULTIMA_WEAPON_ID]);
  });

  it('draws the Cavern\'s plate: the scene key stands for the `cavern-stolen-fayth` backdrop file, so no file is written into the art mirror', () => {
    expect(OMEGA_RUINS_PLATE).toBe('cavern-stolen-fayth');
    expect(backdropFileOf(OMEGA_RUINS_SCENE)).toBe('cavern-stolen-fayth');
  });

  it('has a canon row (FFX, the Cavern\'s)', () => {
    expect(PYREFLY_CANON[OMEGA_RUINS_SCENE]).toMatchObject({ game: 'ffx', verdict: 'unattested' });
  });

  it('does not carry the Cavern\'s own staging (Yojimbo\'s, Daigoro\'s and Lady Ginnem\'s spots)', () => {
    expect(Object.keys(OMEGA_RUINS_STAGING).sort()).toEqual(['enemySpots', 'figureHeights', 'holdParty']);
    expect(Object.keys(OMEGA_RUINS_STAGING.enemySpots).sort()).toEqual([NEMESIS_ID, OMEGA_WEAPON_ID, ULTIMA_WEAPON_ID].sort());
  });
});
