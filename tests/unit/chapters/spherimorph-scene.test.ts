/**
 * The hidden Spherimorph's stage (FFX only; `src/scenes/spherimorph.ts`): the Macalania Temple's scene with the guardian staged. The stage is data here (the build itself needs a GPU): the slots, the pins, the registry
 * rows, the art-namespace row and the canon row, so a change to any of them is seen. The painting is the Temple's plate (preflight SP4 (a)); nothing is written into the art mirror.
 */

import { describe, expect, it } from 'vitest';

import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { MACALANIA_TEMPLE_SLOTS } from '../../../src/scenes/macalania-temple.ts';
import { SPHERIMORPH_HEIGHT, SPHERIMORPH_SLOTS, SPHERIMORPH_STAGING } from '../../../src/scenes/spherimorph.ts';
import { SPHERIMORPH_ID, SPHERIMORPH_SCENE } from '../../../src/data/ffx/spherimorph-ids.ts';

describe('the spring stage', () => {
  it('is a real registered scene (not a placeholder), keyed by the chapter\'s scene key', () => {
    const entry = getScene(SPHERIMORPH_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots).toBe(SPHERIMORPH_SLOTS);
  });

  it('holds the party on the Temple\'s three slots and puts the guardian where the Temple\'s layout B pins Seymour, inside the HUD\'s right rail', () => {
    expect(SPHERIMORPH_STAGING.holdParty).toBe(true);
    expect(SPHERIMORPH_SLOTS.party).toEqual(MACALANIA_TEMPLE_SLOTS.party);
    expect(SPHERIMORPH_STAGING.enemySpots[SPHERIMORPH_ID]).toEqual([2.5, 0, -5.8]);
    expect(SPHERIMORPH_SLOTS.enemy).toEqual([[2.5, 0, -5.8]]);
    expect(SPHERIMORPH_STAGING.figureHeights[SPHERIMORPH_ID]).toBe(SPHERIMORPH_HEIGHT);
    expect(SPHERIMORPH_HEIGHT).toBeGreaterThan(SPHERIMORPH_SLOTS.partyHeight! * 1.5); // an orb carrying its spheres, not a person
    expect(SPHERIMORPH_HEIGHT).toBeLessThanOrEqual(SPHERIMORPH_SLOTS.enemyHeight! + 1e-9);
  });

  it('draws the Temple\'s plate: the scene key stands for the `macalania-temple` backdrop file, so no file is written into the art mirror', () => {
    expect(backdropFileOf(SPHERIMORPH_SCENE)).toBe('macalania-temple');
  });

  it('has a canon row (FFX, the Woods\' pyrefly-lit springs)', () => {
    expect(PYREFLY_CANON[SPHERIMORPH_SCENE]).toMatchObject({ game: 'ffx', verdict: 'attested' });
  });

  it('does not carry the Temple\'s staging (the Guardians\' and Seymour\'s pins)', () => {
    expect(Object.keys(SPHERIMORPH_STAGING).sort()).toEqual(['enemySpots', 'figureHeights', 'holdParty']);
    expect(Object.keys(SPHERIMORPH_STAGING.enemySpots)).toEqual([SPHERIMORPH_ID]);
  });
});
