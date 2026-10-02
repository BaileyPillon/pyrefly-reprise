/**
 * The MAX mix's switches (D-316, D-317): every part answers its EYE CANDY row (`eyeCandyOn`), its look
 * (both through the seam and as main reads the OPTIONS row today), REDUCE MOTION and the tier; the
 * Overdrive shot is FFX only and the dressphere shot FFX-2 only. Every part off through the seam is
 * today's look (the ON/OFF test's other half is the browser capture in docs/handoff/mix-build.md).
 * Game case: both (the per-game parts are pinned here).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { eyeCandyOn, setEyeCandyProvider, type EyeCandyKey } from '../../src/engine/fx/eyeCandyFlags.ts';
import { aaKind, LOOK_KEY, MIX_PARTS, PART_LOOK, partOn, partsOn, type GateEnv } from '../../src/engine/fx/mix/gates.ts';

const env = (o: Partial<GateEnv> = {}): GateEnv => ({ game: 'ffx', tier: 'full', reduceMotion: false, look: () => true, on: () => true, ...o });

afterEach(() => setEyeCandyProvider(null));

describe('the EYE CANDY seam', () => {
  it('is every look and part on until the settings layer installs a provider (D-297: default on)', () => {
    for (const k of ['cinemaLight', 'livingPaintings', 'battleSpectacle', ...MIX_PARTS] as EyeCandyKey[]) expect(eyeCandyOn(k)).toBe(true);
  });

  it('asks the provider once one is installed, and goes back to on when it is removed', () => {
    setEyeCandyProvider((k) => k !== 'fog');
    expect(eyeCandyOn('fog')).toBe(false);
    expect(eyeCandyOn('depthOfField')).toBe(true);
    setEyeCandyProvider(null);
    expect(eyeCandyOn('fog')).toBe(true);
  });
});

describe('partOn', () => {
  it('names the nine parts under their looks (D-317)', () => {
    expect(MIX_PARTS).toHaveLength(9);
    expect(PART_LOOK).toMatchObject({ depthOfField: 'a', fog: 'a', smoothEdges: 'a', breathing: 'b', koCollapse: 'b', chapterFraming: 'c', overdriveShot: 'c', dressphereShot: 'c', splashArt: 'c' });
    expect(LOOK_KEY).toEqual({ a: 'cinemaLight', b: 'livingPaintings', c: 'battleSpectacle' });
  });

  it('plays every part of the game by default; the Overdrive shot is FFX only, the dressphere shot FFX-2 only', () => {
    const ffx = partsOn(env({ game: 'ffx' }));
    const ffx2 = partsOn(env({ game: 'ffx2' }));
    expect(Object.values({ ...ffx, dressphereShot: true }).every(Boolean)).toBe(true);
    expect(ffx.dressphereShot).toBe(false);
    expect(ffx2.overdriveShot).toBe(false);
    expect(ffx2.dressphereShot).toBe(true);
  });

  it('a look turned off stops its parts, through the seam or the existing OPTIONS row', () => {
    const viaRow = partsOn(env({ look: (o) => o !== 'a' }));
    expect([viaRow.depthOfField, viaRow.fog, viaRow.smoothEdges]).toEqual([false, false, false]);
    expect(viaRow.breathing && viaRow.chapterFraming).toBe(true);
    const viaSeam = partsOn(env({ on: (k) => k !== 'battleSpectacle' }));
    expect([viaSeam.chapterFraming, viaSeam.overdriveShot, viaSeam.splashArt]).toEqual([false, false, false]);
    expect(viaSeam.fog).toBe(true);
  });

  it('a part turned off is off alone', () => {
    const p = partsOn(env({ on: (k) => k !== 'koCollapse' }));
    expect(p.koCollapse).toBe(false);
    expect(p.breathing).toBe(true);
  });

  it('every part off through the seam is today: nothing of the mix plays', () => {
    expect(Object.values(partsOn(env({ on: () => false }))).some(Boolean)).toBe(false);
    expect(Object.values(partsOn(env({ game: 'ffx2', on: () => false }))).some(Boolean)).toBe(false);
  });

  it('REDUCE MOTION stills the breathing and drops both held shots; the KO collapse stays (it becomes a cut)', () => {
    const p = partsOn(env({ reduceMotion: true }));
    expect(p.breathing).toBe(false);
    expect(p.overdriveShot).toBe(false);
    expect(partOn('dressphereShot', env({ game: 'ffx2', reduceMotion: true }))).toBe(false);
    expect(p.koCollapse).toBe(true);
    expect(p.chapterFraming && p.fog && p.depthOfField).toBe(true);
  });

  it('the phone drops the bokeh; LOW EFFECTS also drops the fog and the post pass', () => {
    expect(partsOn(env({ tier: 'phone' })).depthOfField).toBe(false);
    expect(partsOn(env({ tier: 'phone' })).fog).toBe(true);
    const low = partsOn(env({ tier: 'low' }));
    expect([low.depthOfField, low.fog]).toEqual([false, false]);
    expect(low.smoothEdges).toBe(true); // the defringe stays
    expect([aaKind('full'), aaKind('phone'), aaKind('low')]).toEqual(['smaa', 'fxaa', null]);
  });
});
