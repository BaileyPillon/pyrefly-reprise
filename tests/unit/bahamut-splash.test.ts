/**
 * FFX-2 Bahamut's Mega Flare splash (Chapter IV; D-298, Bailey 2026-09-30: "all your recommendations, godspeed"):
 * `splashArtFor` returns the approved painting for his Special once the manifest lists it, and nothing (the slab,
 * lines and name only, as before) while it does not. FFX-2 only: FFX's Bahamut and every other splash are unchanged.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { splashArtFor } from '../../src/app/screens/battleSpectacle.ts';

function manifest(bahamut: string[]) {
  setArtManifest({
    version: 1, generatedAt: 't',
    subjects: { 'ffx2-bahamut': { states: bahamut }, 'x2-ixion': { states: ['idle', 'overdrive'] } },
    portraits: [], backdrops: [], pause: [], pause2x: [], title: [], title2x: [],
  } as never);
}

afterEach(() => resetArtManifest());

describe('the Mega Flare splash painting', () => {
  it('installed: his Special shows characters/ffx2-bahamut/splash.png', () => {
    manifest(['idle', 'hurt', 'ko', 'splash']);
    expect(splashArtFor('ffx2-bahamut', 'special', 'ffx2')).toMatch(/\/art\/characters\/ffx2-bahamut\/splash\.png$/);
  });

  it('not installed yet: no painting and no request (the slab, lines and name, as before)', () => {
    manifest(['idle', 'hurt', 'ko']);
    expect(splashArtFor('ffx2-bahamut', 'special', 'ffx2')).toBeNull();
  });

  it('only his Special; FFX and the other splashes are unchanged', () => {
    manifest(['idle', 'splash']);
    expect(splashArtFor('ffx2-bahamut', 'overdrive', 'ffx2')).toBeNull();
    expect(splashArtFor('bahamut', 'special', 'ffx')).toBeNull();
    expect(splashArtFor('x2-ixion', 'special', 'ffx2')).toMatch(/x2-ixion\/overdrive\.png$/);
    expect(splashArtFor('yuna-gunner', 'overdrive', 'ffx2')).toBeNull();
    expect(splashArtFor('tidus', 'overdrive', 'ffx')).toMatch(/characters\/tidus\/attack\.png$/);
  });
});
