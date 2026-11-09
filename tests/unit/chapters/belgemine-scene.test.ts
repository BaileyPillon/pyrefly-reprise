/**
 * The Remiem Temple's stage for the hidden Belgemine's Challenge (FFX only; `src/scenes/belgemine.ts`): the Mushroom Rock Road stage on the Cavern of the Stolen Fayth's plate, with Belgemine and her aeons staged. The stage
 * is data here (the build itself needs a GPU): the slots, the pins, the registry rows, the art-namespace row, the plate the formations name and the canon row, so a change to any of them is seen. The painting is an existing
 * approved plate (the preflight's `remiem-temple` plate is on the art list, owed); nothing is written into the art mirror.
 */

import { describe, expect, it } from 'vitest';

import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { MUSHROOM_PLATE_LOOK } from '../../../src/scenes/mushroom-rock-road.ts';
import { BELGEMINE_HEIGHTS, BELGEMINE_SLOTS, BELGEMINE_SPOTS } from '../../../src/scenes/belgemine.ts';
import { BELGEMINE_GROUPS } from '../../../src/data/ffx/enemies/belgemine.ts';
import { BELGEMINE_ID, BELGEMINE_SCENE, BELG_IDS, BELG_PLATE } from '../../../src/data/ffx/belgemine-ids.ts';

describe('the Remiem stage', () => {
  it('is a real registered scene (not a placeholder), keyed by the chapter\'s scene key', () => {
    const entry = getScene(BELGEMINE_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots).toBe(BELGEMINE_SLOTS);
  });

  it('holds the party on the Mushroom slots and stages every body of every act: a spot and a height each', () => {
    expect(BELGEMINE_SLOTS.holdParty).toBe(true);
    const bodies = new Set(BELGEMINE_GROUPS.flatMap((g) => g.enemies.map((e) => e.id)));
    expect([...bodies].sort()).toEqual([BELGEMINE_ID, ...Object.values(BELG_IDS)].sort());
    for (const id of bodies) {
      expect(BELGEMINE_SPOTS[id], id).toBeDefined();
      expect(BELGEMINE_HEIGHTS[id], id).toBeGreaterThan(0);
    }
  });

  it('every aeon stands on the one boss spot except the dog and the Sisters, who keep the Mirror Aeons\' places; Belgemine stands behind and to the left', () => {
    const boss = BELGEMINE_SPOTS[BELG_IDS.valefor];
    for (const id of [BELG_IDS.ifrit, BELG_IDS.ixion, BELG_IDS.shiva, BELG_IDS.bahamut, BELG_IDS.yojimbo, BELG_IDS.anima]) expect(BELGEMINE_SPOTS[id], id).toEqual(boss);
    expect(BELGEMINE_SPOTS[BELG_IDS.cindy]).toEqual([1.1, 0, -2.4]);
    expect(BELGEMINE_SPOTS[BELG_IDS.sandy]).toEqual([3.3, 0, -3.3]);
    expect(BELGEMINE_SPOTS[BELG_IDS.mindy]).toEqual([5.6, 0, -2.4]);
    expect(BELGEMINE_SPOTS[BELGEMINE_ID]![0]).toBeLessThan(boss![0]); // left of the aeon she calls
    expect(BELGEMINE_SPOTS[BELGEMINE_ID]![2]).toBeLessThan(boss![2]); // and farther back
    expect(BELGEMINE_HEIGHTS[BELGEMINE_ID]).toBeLessThan(BELGEMINE_HEIGHTS[BELG_IDS.valefor]!); // a woman beside her aeons
  });

  it('draws the Cavern of the Stolen Fayth\'s plate: the scene key stands for its file, every formation names it, and the plate\'s look is known to the stage', () => {
    expect(backdropFileOf(BELGEMINE_SCENE)).toBe(BELG_PLATE);
    expect(BELG_PLATE).toBe('cavern-stolen-fayth');
    for (const g of BELGEMINE_GROUPS) expect(g.plate, g.id).toBe(BELG_PLATE);
    expect(MUSHROOM_PLATE_LOOK[BELG_PLATE]).toBeDefined();
  });

  it('has a canon row (FFX, the Cavern\'s)', () => {
    expect(PYREFLY_CANON[BELGEMINE_SCENE]).toMatchObject({ game: 'ffx', verdict: 'unattested' });
  });
});
