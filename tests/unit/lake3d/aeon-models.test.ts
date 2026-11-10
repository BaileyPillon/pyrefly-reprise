/**
 * **The lake's four aeons and the game's own strike marks** (`src/data/ffx/lake-models.ts`; the hidden Wendigo chapter's finishing lane, 2026-11-09; FFX only): the aeons of the chapter's roster carry Meshy models skinned
 * to the real skeleton, stand at the game's scale law, and ship with the rest of the set; the Wendigo's and the Guardians' clips carry the game's effect-trigger marks.
 */
import { describe, expect, it } from 'vitest';
import { FFX_FIEND_STATURE } from '../../../src/data/ffx/fiend-stature.ts';
import { TIDUS_TOP } from '../../../src/data/ffx/party-stature.ts';
import { LAKE_AEONS, LAKE_AEON_METRES_PER_UNIT, LAKE_CAST, LAKE_FILES, LAKE_NATIVE_HEIGHT, LAKE_SHIPPED_FILES, LAKE_STRIKES } from '../../../src/data/ffx/lake-models.ts';

const TIDUS_M = LAKE_NATIVE_HEIGHT.tidus;

describe('the four aeons', () => {
  it('are the Macalania preset\'s Valefor, Ifrit, Ixion and Shiva (Bahamut is not owned at this point of the story)', () => {
    expect([...LAKE_AEONS]).toEqual(['valefor', 'ifrit', 'ixion', 'shiva']);
    expect((LAKE_CAST as readonly string[]).includes('bahamut')).toBe(false);
    for (const id of LAKE_AEONS) {
      expect(LAKE_CAST, id).toContain(id);
      expect(LAKE_FILES[id], id).toBe(`${id}.glb`);
      expect(LAKE_SHIPPED_FILES, id).toContain(`${id}.glb`);
    }
  });

  it('stand at the game\'s scale law: the bind-pose mesh height times the engine scale 4 on Tidus\'s 18.15, here Tidus\'s 1.75 m', () => {
    const metres = (gameUnits: number): number => (gameUnits / TIDUS_TOP) * TIDUS_M;
    expect(LAKE_NATIVE_HEIGHT.ifrit).toBeCloseTo(metres(FFX_FIEND_STATURE['grothia']!.height), 2); // s002, measured by the Isaaru chapter's lane
    expect(LAKE_NATIVE_HEIGHT.valefor).toBeLessThan(metres(FFX_FIEND_STATURE['pterya']!.height)); // s001: the law's figure is the silhouette with the wings spread (4.94 m), which crops the frame; the stage's pick is 3.4 m
    expect(LAKE_NATIVE_HEIGHT.valefor).toBeGreaterThan(LAKE_NATIVE_HEIGHT.ixion);
    expect(LAKE_NATIVE_HEIGHT.ixion).toBeCloseTo(metres(7.905 * 4), 1); // s003 and s004: the same reading of their HD files' bind pose (7.905 and 8.596 model units)
    expect(LAKE_NATIVE_HEIGHT.shiva).toBeCloseTo(metres(8.596 * 4), 1);
  });

  it('carry the metres of one model unit: 4 times the stage\'s metres per game unit', () => {
    expect(LAKE_AEON_METRES_PER_UNIT).toBeCloseTo(4 * (TIDUS_M / TIDUS_TOP), 3);
  });
});

describe('the game\'s own strike marks', () => {
  it('name clips a monster file has, as positive seconds, the same for the two Guardians', () => {
    expect(Object.keys(LAKE_STRIKES).sort()).toEqual(['lake-guardian-a', 'lake-guardian-b', 'wendigo']);
    for (const marks of Object.values(LAKE_STRIKES)) for (const [clip, at] of Object.entries(marks!)) expect(at, clip).toBeGreaterThan(0);
    expect(LAKE_STRIKES['lake-guardian-a']).toEqual(LAKE_STRIKES['lake-guardian-b']);
    expect(Object.keys(LAKE_STRIKES.wendigo!).sort()).toEqual(['attack', 'combo']);
    expect(Object.keys(LAKE_STRIKES['lake-guardian-a']!).sort()).toEqual(['cast', 'item']);
  });

  it('put the Double Punch\'s slam after its crouch and leap (the effect trigger is the last frame of the leap), and a spell\'s release after its wind-up', () => {
    const w = LAKE_STRIKES.wendigo!;
    expect(w['combo']!).toBeGreaterThan(w['attack']!); // sp3_00 (17 frames), sp3_01 (8), then the leap's trigger at frame 24 of 25: 0.5333 + 1/30 + 0.2333 + 1/30 + 0.8
    expect(w['attack']!).toBeCloseTo(18 / 30, 3); // attack1_00's trigger, frame 18 of 19
    const g = LAKE_STRIKES['lake-guardian-a']!;
    expect(g['cast']!).toBeCloseTo(1 + 18 / 30, 3); // magic2_00 and magic2_01 are 0.5 s each; magic2_02's trigger is at frame 18
    expect(g['item']!).toBeCloseTo(1 + 27 / 30, 3);
  });
});
