/**
 * The hidden Sinspawn Gui chapter's scene (`src/scenes/mushroom-rock-road.ts`; FFX only): the two plates, the geometry that sets each plate's floor row on the floor, the staging of the four parts, and the
 * one optional hook the battle screen uses to put the second fight on the ruined plate (`EnemyGroupDef.plate`, `SceneBuild.swapBackdrop`).
 */

import { describe, expect, it } from 'vitest';

import { MUSHROOM_PLATE, MUSHROOM_PLATE_LOOK, MUSHROOM_SLOTS, plateGeometry } from '../../../src/scenes/mushroom-rock-road.ts';
import { sinspawnGuiGroup1, sinspawnGuiGroup2 } from '../../../src/data/ffx/enemies/sinspawn-gui.ts';
import { MUSHROOM_ROCK_RUINED_PLATE, MUSHROOM_ROCK_SCENE } from '../../../src/data/ffx/sinspawn-gui-ids.ts';

describe('the two plates', () => {
  it('each plate sets its own floor row on the floor (y 0): the row above shows, the row below is under the 3D floor', () => {
    for (const key of [MUSHROOM_ROCK_SCENE, MUSHROOM_ROCK_RUINED_PLATE]) {
      const plane = plateGeometry(key);
      const floorRow = MUSHROOM_PLATE_LOOK[key]!.floorRow;
      // y of a plate row r (0 = top) is centreY + height * (0.5 - r): at the floor row it is 0.
      expect(plane.centreY + plane.height * (0.5 - floorRow), key).toBeCloseTo(0, 9);
      expect(plane.width).toBe(34); // the painting plane is 34 wide at z -12, as every FFX scene's
      expect(plane.distance).toBe(-12);
      expect(plane.height).toBeCloseTo(34 / (MUSHROOM_PLATE.w / MUSHROOM_PLATE.h), 9);
    }
  });

  it('every sampled band is a row range inside the plate, the camp\'s floor row is its middle and the ruined camp\'s is lower', () => {
    for (const key of Object.keys(MUSHROOM_PLATE_LOOK)) {
      const look = MUSHROOM_PLATE_LOOK[key]!;
      for (const [name, band] of Object.entries(look.bands)) {
        const [a, b] = band as [number, number];
        expect(a, `${key} ${name}`).toBeGreaterThanOrEqual(0);
        expect(b, `${key} ${name}`).toBeLessThanOrEqual(1);
        expect(a, `${key} ${name}`).toBeLessThan(b);
      }
      expect(look.layer.from).toBeLessThan(look.layer.to);
    }
    expect(MUSHROOM_PLATE_LOOK[MUSHROOM_ROCK_SCENE]!.floorRow).toBeLessThan(MUSHROOM_PLATE_LOOK[MUSHROOM_ROCK_RUINED_PLATE]!.floorRow);
  });

  it('only the second fight names the ruined plate (the first opens on the scene\'s own), and the plate has a look', () => {
    expect(sinspawnGuiGroup1.plate).toBeUndefined();
    expect(sinspawnGuiGroup2.plate).toBe(MUSHROOM_ROCK_RUINED_PLATE);
    expect(MUSHROOM_PLATE_LOOK[sinspawnGuiGroup2.plate!]).toBeDefined();
  });
});

describe('the staging of the four parts', () => {
  const spots = MUSHROOM_SLOTS.enemySpots!;
  const heights = MUSHROOM_SLOTS.figureHeights!;
  const bodies = ['sinspawn-gui', 'sinspawn-gui-2'];
  const parts = ['sinspawn-gui-head', 'sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'];

  it('every combatant of both fights has a spot and a height, the two bodies on the same ground', () => {
    for (const id of [...bodies, ...parts]) {
      expect(spots[id], id).toBeDefined();
      expect(heights[id], id).toBeGreaterThan(0);
    }
    expect(spots['sinspawn-gui']).toEqual(spots['sinspawn-gui-2']);
    expect(heights['sinspawn-gui']).toBe(heights['sinspawn-gui-2']);
  });

  it('the body is the largest figure, the arms flank it, the head is above it and behind', () => {
    const [bx, , bz] = spots['sinspawn-gui']!;
    const [lx] = spots['sinspawn-gui-arm-left']!;
    const [rx] = spots['sinspawn-gui-arm-right']!;
    const [, hy, hz] = spots['sinspawn-gui-head']!;
    expect(lx).toBeLessThan(bx);
    expect(rx).toBeGreaterThan(bx);
    expect(hy).toBeGreaterThan(0);
    expect(hz).toBeLessThan(bz); // behind the body, so the body draws over the neck's base
    expect(heights['sinspawn-gui']!).toBeGreaterThan(heights['sinspawn-gui-head']!);
    expect(heights['sinspawn-gui']!).toBeGreaterThan(MUSHROOM_SLOTS.partyHeight!); // a colossus against the party's 1.75
  });
});
