/**
 * The MAX mix's switches (D-316, D-317): every part answers its EYE CANDY row (`eyeCandyOn`), its look
 * (both through the seam and as main reads the OPTIONS row today), REDUCE MOTION and the tier; the
 * Overdrive shot is FFX only and the dressphere shot FFX-2 only. Every part off through the seam is
 * today's look (the ON/OFF test's other half is the browser capture in docs/handoff/mix-build.md).
 * Game case: both (the per-game parts are pinned here).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { eyeCandyOn, setEyeCandyProvider, type EyeCandyKey } from '../../src/engine/fx/eyeCandyFlags.ts';
import { aaKind, deviceCloses, deviceNote, fightFacts, LOOK_KEY, MIX_PARTS, PART_LOOK, partOn, partsOn, twirlKeysOn, type Device, type GateEnv } from '../../src/engine/fx/mix/gates.ts';

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

  it('REDUCE MOTION stills the breathing; both held shots stay (the approved page: ON · CUT, one static cut in and one back) and so does the KO collapse (it becomes a cut)', () => {
    const p = partsOn(env({ reduceMotion: true }));
    expect(p.breathing).toBe(false);
    expect(p.overdriveShot).toBe(true);
    expect(partOn('dressphereShot', env({ game: 'ffx2', reduceMotion: true }))).toBe(true);
    expect(p.dressphereShot, 'the other game’s shot is still never played').toBe(false);
    expect(p.koCollapse).toBe(true);
    expect(p.chapterFraming && p.fog && p.depthOfField).toBe(true);
  });

  it('the FFX-2 twirl keys play with DRESSPHERE SHOT but never under REDUCE MOTION (a twirl is motion; the shot is the one cut)', () => {
    expect(twirlKeysOn(env({ game: 'ffx2' }))).toBe(true);
    expect(twirlKeysOn(env({ game: 'ffx2', reduceMotion: true }))).toBe(false);
    expect(twirlKeysOn(env({ game: 'ffx' }))).toBe(false);
    expect(twirlKeysOn(env({ game: 'ffx2', on: (k) => k !== 'dressphereShot' }))).toBe(false);
    expect(twirlKeysOn(env({ game: 'ffx2', look: (o) => o !== 'c' }))).toBe(false);
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

/**
 * Release 36: what the device does to each part, whatever the switches say. The EYE CANDY page reads `deviceNote` to
 * show `ON · OFF HERE` / `ON · LESS HERE` (the saved value never changes) and the mix reads `deviceCloses` to hold the
 * shots on a phone held upright, so the page and the mix cannot disagree. Game case: both (the shots are per game).
 */
describe('deviceNote', () => {
  const dev = (tier: Device['tier'], phone = false): Device => ({ tier, phone });
  const notes = (d: Device): Record<string, string> => Object.fromEntries(MIX_PARTS.flatMap((p) => { const n = deviceNote(p, d); return n ? [[p, `${n.limit}:${n.why}`]] : []; }));

  it('a full-tier window closes and trims nothing', () => {
    expect(notes(dev('full'))).toEqual({});
  });

  it('a phone screen (the tier) closes DEPTH OF FIELD only: the scene keeps its own band', () => {
    expect(notes(dev('phone'))).toEqual({ depthOfField: 'off:phone' });
  });

  it('LOW EFFECTS closes DEPTH OF FIELD and FOG and leaves SMOOTH EDGES its defringe only', () => {
    expect(notes(dev('low'))).toEqual({ depthOfField: 'off:low', fog: 'off:low', smoothEdges: 'less:low' });
  });

  it('a phone held upright closes the Overdrive shot, trims the dressphere shot to its push-in, and trims CHAPTER FRAMING (the menu clearance stays, the colossus master and BOSS SCALE go)', () => {
    expect(notes(dev('phone', true))).toEqual({ depthOfField: 'off:phone', chapterFraming: 'less:phone', overdriveShot: 'off:phone', dressphereShot: 'less:phone' });
    expect(notes(dev('full', true)), 'the layout alone, on any tier').toEqual({ chapterFraming: 'less:phone', overdriveShot: 'off:phone', dressphereShot: 'less:phone' });
  });

  it('CHAPTER FRAMING is trimmed on a phone only where there is a colossus to scale: a fight with none loses nothing (unknown reads as a colossus)', () => {
    const phone = (colossus?: boolean | null): Device => ({ tier: 'phone', phone: true, ...(colossus === undefined ? {} : { colossus }) });
    expect(deviceNote('chapterFraming', phone(true))).toEqual({ limit: 'less', why: 'phone' });
    expect(deviceNote('chapterFraming', phone(false)), 'Chapter I: no colossus').toBeNull();
    expect(deviceNote('chapterFraming', phone(null))).toEqual({ limit: 'less', why: 'phone' });
    expect(deviceNote('chapterFraming', phone())).toEqual({ limit: 'less', why: 'phone' });
    expect(deviceNote('chapterFraming', { tier: 'full', phone: false, colossus: true }), 'a window that allows it').toBeNull();
    // the Overdrive shot is closed on a phone whatever the boss; the dressphere shot is trimmed to its push-in
    expect(deviceNote('overdriveShot', phone(false))).toEqual({ limit: 'off', why: 'phone' });
    expect(deviceNote('dressphereShot', phone(false)), 'FFX-2: the full close shot is off, the push-in fallback still plays (D-346)').toEqual({ limit: 'less', why: 'phone' });
  });

  it('fightFacts starts unknown (no battle bound)', () => {
    expect(fightFacts.colossus).toBeNull();
  });

  it('LOW EFFECTS on a phone held upright: the tier names LOW EFFECTS, the layout the phone', () => {
    expect(notes(dev('low', true))).toEqual({ depthOfField: 'off:low', fog: 'off:low', smoothEdges: 'less:low', chapterFraming: 'less:phone', overdriveShot: 'off:phone', dressphereShot: 'less:phone' });
  });

  it('BREATHING, KO COLLAPSE and SPLASH ART are the same on every device (a coarser grid, or a static splash line, is not a part closed)', () => {
    for (const tier of ['full', 'phone', 'low'] as const)
      for (const phone of [false, true]) for (const p of ['breathing', 'koCollapse', 'splashArt'] as const) expect(deviceNote(p, dev(tier, phone)), `${p} ${tier} ${phone}`).toBeNull();
  });

  it('deviceCloses is `off` only: a part that is trimmed still plays', () => {
    expect(deviceCloses('depthOfField', dev('phone'))).toBe(true);
    expect(deviceCloses('smoothEdges', dev('low'))).toBe(false);
    expect(deviceCloses('chapterFraming', dev('phone', true))).toBe(false);
    expect(deviceCloses('overdriveShot', dev('phone', true))).toBe(true);
    expect(deviceCloses('dressphereShot', dev('phone', true)), 'the push-in fallback still plays on a phone (D-346)').toBe(false);
  });

  it('the tier gates in partOn are the same rule: a part is off in the mix exactly when the device closes it (the layout, which only the DOM knows, aside)', () => {
    for (const tier of ['full', 'phone', 'low'] as const)
      for (const part of MIX_PARTS) {
        const game = part === 'dressphereShot' ? 'ffx2' : 'ffx';
        const closed = deviceCloses(part, dev(tier));
        expect(partOn(part, env({ game, tier })), `${part} on ${tier}`).toBe(!closed);
      }
  });
});
