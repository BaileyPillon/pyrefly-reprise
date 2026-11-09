/**
 * The hidden Oblitzerator chapter's stage (FFX only; `src/scenes/luca-dock.ts`): the Mushroom Rock Road's scene with this fight's staging, the stand-in for the Luca dock until a plate is painted. The stage is data here (the
 * build itself needs a GPU): the slots, the pins, the heights, the registry rows, the art-namespace row and the canon row, so a change to any of them is seen. The painting is the road's plate; nothing is written into the
 * art mirror.
 */

import { describe, expect, it } from 'vitest';

import { backdropFileOf, SCENE_BACKDROP_FILE } from '../../../src/data/art/artNamespace.ts';
import { PYREFLY_CANON } from '../../../src/engine/pyreflyCanon.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { MUSHROOM_SLOTS } from '../../../src/scenes/mushroom-rock-road.ts';
import { LUCA_DOCK_HEIGHTS, LUCA_DOCK_SLOTS, LUCA_DOCK_STAGING } from '../../../src/scenes/luca-dock.ts';
import { LUCA_CRANE_ID, OBLITZERATOR_ID, OBLITZERATOR_SCENE } from '../../../src/data/ffx/oblitzerator-ids.ts';
import { oblitzeratorGroup } from '../../../src/data/ffx/enemies/oblitzerator.ts';

describe('the dock stage', () => {
  it('is a real registered scene (not a placeholder), keyed by the chapter\'s scene key', () => {
    const entry = getScene(OBLITZERATOR_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots).toBe(LUCA_DOCK_SLOTS);
  });

  it('keeps the road\'s party slots and holds the party on them', () => {
    expect(LUCA_DOCK_STAGING.holdParty).toBe(true);
    expect(LUCA_DOCK_SLOTS.party).toEqual(MUSHROOM_SLOTS.party);
    expect(LUCA_DOCK_SLOTS.partyHeight).toBe(MUSHROOM_SLOTS.partyHeight);
  });

  it('pins the two of the formation to two spots, in the formation\'s order (the slot index is the enemy\'s slot): the machine in front, the crane at the right and behind it', () => {
    expect(LUCA_DOCK_SLOTS.enemy).toEqual([[0.9, 0, -2.6], [4.8, 0, -4.2]]);
    expect(Object.keys(LUCA_DOCK_STAGING.enemySpots)).toEqual([OBLITZERATOR_ID, LUCA_CRANE_ID]);
    expect(oblitzeratorGroup.enemies.map((e) => e.id)).toEqual(Object.keys(LUCA_DOCK_STAGING.enemySpots));
    for (const e of oblitzeratorGroup.enemies) expect(LUCA_DOCK_SLOTS.enemy[e.slot], e.id).toEqual(LUCA_DOCK_STAGING.enemySpots[e.id]);
    const [machine, crane] = [LUCA_DOCK_STAGING.enemySpots[OBLITZERATOR_ID]!, LUCA_DOCK_STAGING.enemySpots[LUCA_CRANE_ID]!];
    expect(crane[0]).toBeGreaterThan(machine[0]); // the game's crane is to the party's right (RE 2)
    expect(crane[2]).toBeLessThan(machine[2]); // ... and a little behind the machine
    expect(crane[0]).toBeLessThan(6.2); // inside the HUD's safe area (the rail begins at about 0.79 of the width)
  });

  it('draws them at estimated heights (no stature row exists): the machine a little over the party, the crane a tower over it', () => {
    expect(LUCA_DOCK_HEIGHTS[OBLITZERATOR_ID]).toBeGreaterThan(LUCA_DOCK_SLOTS.partyHeight!);
    expect(LUCA_DOCK_HEIGHTS[LUCA_CRANE_ID]).toBeGreaterThan(LUCA_DOCK_HEIGHTS[OBLITZERATOR_ID]);
    expect(LUCA_DOCK_SLOTS.enemyHeight).toBe(LUCA_DOCK_HEIGHTS[OBLITZERATOR_ID]);
    expect(LUCA_DOCK_STAGING.figureHeights).toEqual({ ...LUCA_DOCK_HEIGHTS });
  });

  it('draws the Mushroom Rock Road\'s plate (no plate of its own; nothing is written into the art mirror), named in the namespace table', () => {
    expect(SCENE_BACKDROP_FILE[OBLITZERATOR_SCENE]).toBe('mushroom-rock-road');
    expect(backdropFileOf(OBLITZERATOR_SCENE)).toBe('mushroom-rock-road');
  });

  it('has a canon row (FFX; no source names pyreflies on the dock, so unattested)', () => {
    expect(PYREFLY_CANON[OBLITZERATOR_SCENE]).toMatchObject({ game: 'ffx', verdict: 'unattested' });
  });

  it('does not carry Sinspawn Gui\'s staging (the body, the head and the arms)', () => {
    expect(Object.keys(LUCA_DOCK_STAGING).sort()).toEqual(['enemySpots', 'figureHeights', 'holdParty']);
    for (const key of Object.keys(LUCA_DOCK_STAGING.enemySpots)) expect(key).not.toMatch(/sinspawn-gui/);
  });
});
