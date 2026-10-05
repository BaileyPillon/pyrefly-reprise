import { describe, expect, it } from 'vitest';
import { SCENE_LOOKS_A, sceneLookA } from '../../src/engine/fx/a/sceneLooks.ts';

/**
 * VP-1001-03 (FFX-2 only, Chapter XV): eye candy D's FFX-2 defaults turned the Den of Woe into a
 * navy void with four-point star flares; Bailey's O-3 A frame is a teal cave with round motes.
 * The room's own look entry switches the star streak off and lifts the grade.
 */
describe('the Den of Woe look', () => {
  const den = sceneLookA('den-of-woe', 'ffx2');

  it('is the room entry, not the FFX-2 default', () => {
    expect(den).toBe(SCENE_LOOKS_A['den-of-woe']);
    expect(den.game).toBe('ffx2');
  });

  it('draws no four-point star streak (the plate prompt excludes stars)', () => {
    expect(den.streak.gain).toBe(0);
    expect(den.shafts).toEqual([]);
  });

  it('lifts the grade toward the plate teal and calms the look and vignette', () => {
    expect(den.grade).toBeDefined();
    const g = den.grade!;
    expect(Math.min(...g.gain)).toBeGreaterThan(1);
    // Red lifts most: the split tone and the Pink Hour pushed the teal to navy.
    expect(g.gain[0]).toBeGreaterThanOrEqual(g.gain[2]);
    expect(g.shadowTintAmount).toBeLessThan(0.16);
    expect(den.look).toBeLessThan(1);
    expect(den.vignetteAdd).toBe(0);
  });

  it('leaves every other room without a grade correction', () => {
    for (const [key, look] of Object.entries(SCENE_LOOKS_A)) {
      if (key === 'den-of-woe') continue;
      expect(look.grade, key).toBeUndefined();
    }
    expect(sceneLookA('bevelle-underground', 'ffx2').streak.gain).toBeGreaterThan(0);
  });
});
