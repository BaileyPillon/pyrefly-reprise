/**
 * The hidden Shinryu chapter's stage (FFX only; `src/scenes/shinryu.ts`, preflight SH3): the Via Purifico's stage on the submerged plate of release 76, with the dragon alone on the boss spot. The positions and heights
 * are `[estimate]`s; what is pinned is the shape: one mark for the one foe in formation order, taller than any foe of that room, inside the idle camera's frame, the Via Purifico's party arc and held party, the registry row
 * real, the scene key naming a backdrop, and no change to Chapter XIV's own scene or to the Flooded Ways'.
 */

import { describe, expect, it } from 'vitest';

import { FLOODED_WAYS_HEIGHTS, FLOODED_WAYS_SLOTS } from '../../../src/scenes/flooded-ways.ts';
import { SHINRYU_HEIGHTS, SHINRYU_SLOTS, SHINRYU_SPOTS } from '../../../src/scenes/shinryu.ts';
import { VIA_PURIFICO_SLOTS } from '../../../src/scenes/via-purifico.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { FLOODED_PLATES } from '../../../src/data/ffx/flooded-ways-ids.ts';
import { SHINRYU_ID, SHINRYU_PLATE } from '../../../src/data/ffx/shinryu-ids.ts';
import { shinryuGroup } from '../../../src/data/ffx/enemies/shinryu.ts';

describe('the stage', () => {
  it('stages the one foe on one mark, in formation order', () => {
    expect(SHINRYU_SLOTS.enemy).toHaveLength(VIA_PURIFICO_SLOTS.enemy.length);
    expect(Object.keys(SHINRYU_SPOTS)).toEqual(shinryuGroup.enemies.map((e) => e.id));
    expect(Object.keys(SHINRYU_SLOTS.enemySpots ?? {})).toEqual([SHINRYU_ID]);
  });

  it('the dragon stands taller than any foe of the Flooded Ways and fits the idle camera\'s frame (about 8.8 units high at that depth)', () => {
    const tallest = Math.max(...Object.values(FLOODED_WAYS_HEIGHTS));
    expect(SHINRYU_HEIGHTS[SHINRYU_ID]!).toBeGreaterThan(tallest);
    expect(SHINRYU_HEIGHTS[SHINRYU_ID]!).toBeLessThan(8.8);
  });

  it('keeps the Via Purifico\'s party arc and its held party; the registry row is real and is the scene key the chapter names', () => {
    expect(SHINRYU_SLOTS.party.map((s) => [...s])).toEqual(VIA_PURIFICO_SLOTS.party.map((s) => [...s]));
    expect(SHINRYU_SLOTS.party).toHaveLength(3);
    expect(SHINRYU_SLOTS.holdParty).toBe(true);
    expect(getScene('shinryu')?.slots).toBe(SHINRYU_SLOTS);
  });

  it('draws the Flooded Ways\' third-area plate, which exists in release 76\'s art (the scene key is a code key, not a file)', () => {
    expect(SHINRYU_PLATE).toBe(FLOODED_PLATES.area3);
    expect(backdropFileOf('shinryu')).toBe('via-purifico-flooded-3');
  });

  it('does not touch the Via Purifico\'s or the Flooded Ways\' own staging', () => {
    expect(Object.keys(FLOODED_WAYS_SLOTS.enemySpots ?? {}).sort()).toEqual(['evrae-altana', 'gate-lock-1', 'gate-lock-2', 'geosgaeno']);
    expect(Object.keys(VIA_PURIFICO_SLOTS.enemySpots ?? {}).sort()).toEqual(['grothia', 'isaaru', 'pterya', 'spathi']);
  });
});
