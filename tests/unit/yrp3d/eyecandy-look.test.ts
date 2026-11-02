import { describe, expect, it } from 'vitest';
import { SCENE_LOOKS_A, sceneLookA } from '../../../src/engine/fx/a/sceneLooks.ts';
import { EXP_YRP_SCENE } from '../../../src/data/yrp-ids.ts';
import { YRP_PALETTE } from '../../../src/engine/yrp3d/stageLook.ts';

/**
 * Bailey, 2026-10-21: "the color grade in the game currently doesnt work with this experimental chapter. the bold look makes things way oversaturated and bad."
 * The real-models chapter (FFX-2 only) carries its own neutral grade (`YRP_PALETTE`); the FFX-2 eye-candy defaults (Pink Hour LUT, bloom from 0.45 at x1.5, the violet
 * vignette, star glints) sat on top of it. Its room row keeps the palette's own numbers.
 */
describe('the real-models chapter under the eye-candy layer', () => {
  const look = sceneLookA(EXP_YRP_SCENE, 'ffx2');

  it('has its own row, an FFX-2 one, not the FFX-2 default', () => {
    expect(look).toBe(SCENE_LOOKS_A[EXP_YRP_SCENE]);
    expect(look.game).toBe('ffx2');
    expect(sceneLookA(EXP_YRP_SCENE, 'ffx')).not.toBe(look); // an FFX room asking for it gets the FFX default (the row is FFX-2's)
  });

  it('applies no Pink Hour look, no extra vignette, no stars and no shafts', () => {
    expect(look.look).toBe(0);
    expect(look.vignetteAdd).toBe(0);
    expect(look.streak.gain).toBe(0);
    expect(look.shafts).toEqual([]);
    expect(look.grade).toBeUndefined();
  });

  it('blooms exactly as the stage palette says (a faint bloom on the hottest light only)', () => {
    expect(look.bloom).toEqual({ threshold: YRP_PALETTE.bloomThreshold, strength: YRP_PALETTE.bloomStrength, radius: YRP_PALETTE.bloomRadius });
    expect(look.bloom.threshold).toBeGreaterThanOrEqual(0.9);
    expect(look.bloom.strength).toBeLessThanOrEqual(0.2);
  });

  it('keeps a near-neutral vignette tint (no violet)', () => {
    const n = parseInt(look.vignetteTint.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(12);
    expect(Math.max(r, g, b)).toBeLessThanOrEqual(40);
  });

  it('leaves Chapter IV and its Pink Hour alone', () => {
    const iv = sceneLookA('bevelle-underground', 'ffx2');
    expect(iv.look).toBe(1);
    expect(iv.bloom.strength).toBeGreaterThan(1);
    expect(iv.streak.gain).toBeGreaterThan(0);
  });
});
