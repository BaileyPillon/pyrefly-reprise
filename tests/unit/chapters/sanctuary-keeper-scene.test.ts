/**
 * The hidden Sanctuary Keeper's stage (FFX only; `src/scenes/sanctuary-keeper.ts`): Chapter I's Mt. Gagazet scene with the Keeper staged. The stage is data here (the build itself needs a GPU): the slots, the pins, the
 * registry rows, the art-namespace row and the canon row, so a change to any of them is seen. The painting is Chapter I's plate (preflight SK4 (a)); nothing is written into the art mirror.
 */

import { describe, expect, it } from 'vitest';

import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { SANCTUARY_KEEPER_HEIGHT, SANCTUARY_KEEPER_SLOTS, SANCTUARY_KEEPER_STAGING } from '../../../src/scenes/sanctuary-keeper.ts';
import { SANCTUARY_KEEPER_ID, SANCTUARY_KEEPER_SCENE } from '../../../src/data/ffx/sanctuary-keeper-ids.ts';

describe('the summit stage', () => {
  it('is a real registered scene (not a placeholder), keyed by the chapter\'s scene key', () => {
    const entry = getScene(SANCTUARY_KEEPER_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots).toBe(SANCTUARY_KEEPER_SLOTS);
  });

  it('holds the party on Chapter I\'s three slots and puts the Keeper on Chapter I\'s boss spot, inside the HUD\'s right rail', () => {
    expect(SANCTUARY_KEEPER_STAGING.holdParty).toBe(true);
    expect(SANCTUARY_KEEPER_SLOTS.party).toEqual([[-1.31, 0, 1.55], [0.3, 0, 1.0], [-0.61, 0, -1.05]]);
    expect(SANCTUARY_KEEPER_STAGING.enemySpots[SANCTUARY_KEEPER_ID]).toEqual([1.95, 0, -2.45]);
    expect(SANCTUARY_KEEPER_SLOTS.enemy).toEqual([[1.95, 0, -2.45]]);
    expect(SANCTUARY_KEEPER_STAGING.figureHeights[SANCTUARY_KEEPER_ID]).toBe(SANCTUARY_KEEPER_HEIGHT);
    expect(SANCTUARY_KEEPER_HEIGHT).toBeGreaterThan(SANCTUARY_KEEPER_SLOTS.partyHeight! * 1.5); // a beast, not a person
    expect(SANCTUARY_KEEPER_HEIGHT).toBeLessThanOrEqual(SANCTUARY_KEEPER_SLOTS.enemyHeight! + 1e-9);
  });

  it('draws Chapter I\'s plate: the scene key stands for the `gagazet` backdrop file, so no file is written into the art mirror', () => {
    expect(backdropFileOf(SANCTUARY_KEEPER_SCENE)).toBe('gagazet');
  });

  it('has a canon row (FFX, the mountain\'s)', () => {
    expect(PYREFLY_CANON[SANCTUARY_KEEPER_SCENE]).toMatchObject({ game: 'ffx', verdict: 'unattested' });
  });

  it('does not carry Chapter I\'s staging (the giants\' pins, the folded guide)', () => {
    expect(Object.keys(SANCTUARY_KEEPER_STAGING).sort()).toEqual(['enemySpots', 'figureHeights', 'holdParty']);
    expect(Object.keys(SANCTUARY_KEEPER_STAGING.enemySpots)).toEqual([SANCTUARY_KEEPER_ID]);
  });
});
