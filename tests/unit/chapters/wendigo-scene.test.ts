/**
 * The hidden Wendigo chapter's stage (FFX only; `src/scenes/wendigo-lake.ts`): Chapter VII's Macalania Temple scene with this fight's staging, the stand-in the Meshy 3D stage replaces. The stage is data here (the build itself
 * needs a GPU): the slots, the pins, the heights, the registry rows, the art-namespace row and the canon row, so a change to any of them is seen. The painting is Chapter VII's plate; nothing is written into the art mirror.
 */

import { describe, expect, it } from 'vitest';

import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { MACALANIA_TEMPLE_SLOTS } from '../../../src/scenes/macalania-temple.ts';
import { GUARDIAN_OVER_TIDUS, LAKE_GUARDIAN_HEIGHT, WENDIGO_HEIGHT, WENDIGO_LAKE_SLOTS, WENDIGO_LAKE_STAGING, WENDIGO_OVER_TIDUS } from '../../../src/scenes/wendigo-lake.ts';
import { LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID, WENDIGO_ID, WENDIGO_SCENE } from '../../../src/data/ffx/wendigo-ids.ts';
import { wendigoGroup } from '../../../src/data/ffx/enemies/wendigo.ts';

describe('the lake stage', () => {
  it('is a real registered scene (not a placeholder), keyed by the chapter\'s scene key', () => {
    const entry = getScene(WENDIGO_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots).toBe(WENDIGO_LAKE_SLOTS);
  });

  it('keeps Chapter VII\'s picked party layout B (Bailey, 2026-09-25: the party stands clear of the command stack) and holds the party on it', () => {
    expect(WENDIGO_LAKE_STAGING.holdParty).toBe(true);
    expect(WENDIGO_LAKE_SLOTS.party).toEqual(MACALANIA_TEMPLE_SLOTS.party);
    expect(WENDIGO_LAKE_SLOTS.party.slice(0, 3)).toEqual([[0.0, 0, 1.8], [-0.9, 0, 0.2], [1.3, 0, 0.9]]);
  });

  it('pins the three of the formation to three spots, in the formation\'s order (the slot index is the enemy\'s slot): Guardian A, Wendigo on the focal point, Guardian B', () => {
    expect(WENDIGO_LAKE_SLOTS.enemy).toEqual([[1.0, 0, -3.6], [2.5, 0, -5.8], [3.6, 0, -1.8]]);
    expect(Object.keys(WENDIGO_LAKE_STAGING.enemySpots)).toEqual([LAKE_GUARDIAN_A_ID, WENDIGO_ID, LAKE_GUARDIAN_B_ID]);
    expect(wendigoGroup.enemies.map((e) => e.id)).toEqual(Object.keys(WENDIGO_LAKE_STAGING.enemySpots));
    for (const e of wendigoGroup.enemies) expect(WENDIGO_LAKE_SLOTS.enemy[e.slot], e.id).toEqual(WENDIGO_LAKE_STAGING.enemySpots[e.id]);
  });

  it('draws them at the game\'s measured heights: Wendigo 1.55 times Tidus, the Guardian 1.08 times (the size table\'s drawn heights)', () => {
    expect(WENDIGO_OVER_TIDUS).toBe(1.55);
    expect(GUARDIAN_OVER_TIDUS).toBe(1.08);
    expect(28.07 / 18.15).toBeCloseTo(WENDIGO_OVER_TIDUS, 2); // the size table's drawn heights (raw x scale), not the stored design heights 26.4 and 20.0
    expect(19.58 / 18.15).toBeCloseTo(GUARDIAN_OVER_TIDUS, 2);
    expect(WENDIGO_HEIGHT).toBeCloseTo(WENDIGO_LAKE_SLOTS.partyHeight! * 1.55, 1);
    expect(LAKE_GUARDIAN_HEIGHT).toBeCloseTo(WENDIGO_LAKE_SLOTS.partyHeight! * 1.08, 1);
    expect(WENDIGO_LAKE_STAGING.figureHeights[WENDIGO_ID]).toBe(WENDIGO_HEIGHT);
    expect(WENDIGO_HEIGHT).toBeGreaterThan(LAKE_GUARDIAN_HEIGHT);
    expect(WENDIGO_LAKE_SLOTS.enemyHeight).toBe(WENDIGO_HEIGHT);
  });

  it('draws Chapter VII\'s plate: the scene key stands for the `macalania-temple` backdrop file, so no file is written into the art mirror', () => {
    expect(backdropFileOf(WENDIGO_SCENE)).toBe('macalania-temple');
  });

  it('has a canon row (FFX; no source was read for the lake, so unattested)', () => {
    expect(PYREFLY_CANON[WENDIGO_SCENE]).toMatchObject({ game: 'ffx', verdict: 'unattested' });
  });

  it('does not carry Chapter VII\'s staging (Seymour\'s and the Temple Guardians\' pins)', () => {
    expect(Object.keys(WENDIGO_LAKE_STAGING).sort()).toEqual(['enemySpots', 'figureHeights', 'holdParty']);
    expect(Object.keys(WENDIGO_LAKE_STAGING.enemySpots)).not.toContain('seymour-macalania');
    expect(Object.keys(WENDIGO_LAKE_STAGING.enemySpots)).not.toContain('guado-guardian-a');
  });
});
