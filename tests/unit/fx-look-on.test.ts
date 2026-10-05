/**
 * A look turned back ON with every part under it OFF brings its parts back (judgment call L of critic round 21,
 * PR-0329; Bailey, 2026-10-04, "all your recommendations"). D-317 made each look the master of its parts, so a part
 * turned off stayed off when its look returned, and a save that had a look off upgraded with that look's new parts
 * OFF: turning the look ON switched it on over nothing, and the page showed no change at all. The rule now:
 *
 * - turned ON while EVERY part under it is OFF: its parts switch ON with it;
 * - a look with at least one part on keeps the player's choices;
 * - a part the player turns off afterwards stays off (a look turned OFF never rewrites its parts, as before);
 * - no new stored field, no new save version: the twelve fields are the ones D-317 already stores.
 *
 * "Under it" is the parts the page lists for the game being played (OVERDRIVE SHOT is FFX only, DRESSPHERE SHOT
 * FFX-2 only), so a player who only plays one game is never left staring at a no-op because of a part they cannot see.
 *
 * Game case: both (shared plumbing; the one game-specific part of each look is handled by the page's own list).
 */
import fs from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

import { applyComfort } from '../../src/app/applyComfort.ts';
import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { adjustSetting } from '../../src/app/screens/pause/settings.ts';
import { defaultFxLooks } from '../../src/app/fxLooks.ts';
import { FX_PARTS, FX_SWITCH_FIELDS, defaultFxParts, fxAllOnPatch, fxLookOnPatch, fxSwitchOn, type FxSwitchField } from '../../src/app/fxParts.ts';
import { eyeCandyOn } from '../../src/engine/fx/eyeCandyFlags.ts';

type Values = Record<FxSwitchField, boolean>;
const allOn = (): Values => ({ ...defaultFxLooks(), ...defaultFxParts() });
const partsOf = (look: string): FxSwitchField[] => FX_PARTS.filter((p) => p.look === look).map((p) => p.field);

function memoryStorage(seed?: Record<string, string>): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, String(v)), removeItem: (k) => void map.delete(k) };
}

afterEach(() => {
  applyComfort(fxAllOnPatch());
});

describe('fxLookOnPatch: what turning a look ON writes', () => {
  it('every part of the look OFF: the look and all its parts go ON', () => {
    const s = { ...allOn(), fxLight: false, fxDof: false, fxFog: false, fxEdges: false };
    expect(fxLookOnPatch(s, 'fxLight', 'ffx')).toEqual({ fxLight: true, fxDof: true, fxFog: true, fxEdges: true });
    expect(fxLookOnPatch(s, 'fxLight', 'ffx2')).toEqual({ fxLight: true, fxDof: true, fxFog: true, fxEdges: true });
    expect(fxLookOnPatch(s, 'fxLight')).toEqual({ fxLight: true, fxDof: true, fxFog: true, fxEdges: true });
  });

  it('at least one part already ON: only the look is written, the player\'s choices stay', () => {
    for (const on of ['fxDof', 'fxFog', 'fxEdges'] as const) {
      const s = { ...allOn(), fxLight: false, fxDof: false, fxFog: false, fxEdges: false, [on]: true };
      expect(fxLookOnPatch(s, 'fxLight', 'ffx'), on).toEqual({ fxLight: true });
    }
  });

  it('only the named look\'s parts are touched: another look\'s OFF parts stay OFF', () => {
    const s = { ...allOn(), fxLight: false, fxDof: false, fxFog: false, fxEdges: false, fxBreath: false, fxKo: false };
    const patch = fxLookOnPatch(s, 'fxLight', 'ffx');
    expect(Object.keys(patch).sort()).toEqual(['fxDof', 'fxEdges', 'fxFog', 'fxLight']);
    expect(patch).not.toHaveProperty('fxBreath');
  });

  it('a stored value that is not a boolean reads as ON (CHK-024), so it counts as a part that is on', () => {
    const s = { ...allOn(), fxLight: false, fxDof: false, fxFog: false, fxEdges: undefined } as unknown as Values;
    expect(fxLookOnPatch(s, 'fxLight', 'ffx')).toEqual({ fxLight: true });
  });

  describe('BATTLE SPECTACLE, whose parts differ by game', () => {
    const off = (extra: Partial<Values> = {}): Values => ({ ...allOn(), fxSpectacle: false, fxFraming: false, fxHero: false, fxSphere: false, fxSplash: false, ...extra });

    it('FFX page: its three parts OFF fires the rule, and the FFX-2 part comes on with the rest', () => {
      expect(fxLookOnPatch(off(), 'fxSpectacle', 'ffx')).toEqual({ fxSpectacle: true, fxFraming: true, fxHero: true, fxSphere: true, fxSplash: true });
    });

    it('FFX-2 page: its three parts OFF fires the rule too', () => {
      expect(fxLookOnPatch(off(), 'fxSpectacle', 'ffx2')).toEqual({ fxSpectacle: true, fxFraming: true, fxHero: true, fxSphere: true, fxSplash: true });
    });

    it('a part of the OTHER game that is ON does not hide the no-op: an FFX player with every FFX part off still gets them back', () => {
      expect(fxLookOnPatch(off({ fxSphere: true }), 'fxSpectacle', 'ffx')).toMatchObject({ fxSpectacle: true, fxFraming: true, fxHero: true, fxSplash: true });
      expect(fxLookOnPatch(off({ fxHero: true }), 'fxSpectacle', 'ffx2')).toMatchObject({ fxSpectacle: true, fxFraming: true, fxSphere: true, fxSplash: true });
    });

    it('a part of THIS game that is ON keeps the choices, even with the other game\'s part off', () => {
      expect(fxLookOnPatch(off({ fxSplash: true }), 'fxSpectacle', 'ffx')).toEqual({ fxSpectacle: true });
      expect(fxLookOnPatch(off({ fxHero: true }), 'fxSpectacle', 'ffx')).toEqual({ fxSpectacle: true });
    });

    it('with no game named, every part counts (the strict reading): one part on anywhere keeps the choices', () => {
      expect(fxLookOnPatch(off(), 'fxSpectacle')).toMatchObject({ fxSpectacle: true, fxSplash: true });
      expect(fxLookOnPatch(off({ fxSphere: true }), 'fxSpectacle')).toEqual({ fxSpectacle: true });
    });

    it('FF7 draws no eye candy and lists no part: only the look is written', () => {
      expect(fxLookOnPatch(off(), 'fxSpectacle', 'ff7')).toEqual({ fxSpectacle: true });
    });
  });

  it('does not change the settings it is given', () => {
    const s = { ...allOn(), fxLiving: false, fxBreath: false, fxKo: false };
    const copy = { ...s };
    fxLookOnPatch(s, 'fxLiving', 'ffx');
    expect(s).toEqual(copy);
  });
});

describe('adjustSetting on the real save: flipping a look ON, a part OFF, and the look again', () => {
  function store(settings: Partial<Values> = {}): SaveStore {
    const st = new SaveStore('fx-look-on', memoryStorage());
    st.setSettings(settings);
    return st;
  }
  const flip = (st: SaveStore, id: string, game: 'ffx' | 'ffx2' = 'ffx'): void => void adjustSetting(st, id, 1, true, game);

  it('CINEMA LIGHT on with its three parts off switches the three on; the page\'s own counts follow', () => {
    const st = store({ fxLight: false, fxDof: false, fxFog: false, fxEdges: false });
    flip(st, 'fxLight');
    expect(st.settings).toMatchObject({ fxLight: true, fxDof: true, fxFog: true, fxEdges: true });
    for (const f of ['fxLight', 'fxDof', 'fxFog', 'fxEdges'] as const) expect(fxSwitchOn(st.settings, f), f).toBe(true);
  });

  it('a part turned off afterwards stays off, through the look going off and on again', () => {
    const st = store({ fxLight: false, fxDof: false, fxFog: false, fxEdges: false });
    flip(st, 'fxLight'); // look ON: all three parts come on
    flip(st, 'fxFog'); // the player turns FOG off
    expect(st.settings.fxFog).toBe(false);
    flip(st, 'fxLight'); // look OFF: its parts are not rewritten
    expect(st.settings).toMatchObject({ fxLight: false, fxDof: true, fxFog: false, fxEdges: true });
    flip(st, 'fxLight'); // look ON again: two parts are on, so the player's choice (FOG off) is kept
    expect(st.settings).toMatchObject({ fxLight: true, fxDof: true, fxFog: false, fxEdges: true });
  });

  it('turning a look OFF never touches its parts (D-317 stands)', () => {
    const st = store({});
    flip(st, 'fxLiving');
    expect(st.settings).toMatchObject({ fxLiving: false, fxBreath: true, fxKo: true });
  });

  it('a part is a plain flip, with no effect on its look or its siblings', () => {
    const st = store({ fxLight: false, fxDof: false, fxFog: false, fxEdges: false });
    flip(st, 'fxDof'); // a part turned ON under a look that is OFF: only that part
    expect(st.settings).toMatchObject({ fxLight: false, fxDof: true, fxFog: false, fxEdges: false });
    flip(st, 'fxDof');
    expect(st.settings).toMatchObject({ fxLight: false, fxDof: false, fxFog: false, fxEdges: false });
  });

  it('all parts turned off by hand under a look that is still ON, then the look OFF and ON: the parts come back', () => {
    const st = store({});
    for (const f of partsOf('fxLight')) flip(st, f); // the player switches DEPTH OF FIELD, FOG, SMOOTH EDGES off
    expect(partsOf('fxLight').map((f) => st.settings[f as keyof typeof st.settings])).toEqual([false, false, false]);
    flip(st, 'fxLight');
    flip(st, 'fxLight');
    expect(st.settings).toMatchObject({ fxLight: true, fxDof: true, fxFog: true, fxEdges: true });
  });

  it('BATTLE SPECTACLE in FFX-2: DRESSPHERE SHOT is the listed part, OVERDRIVE SHOT comes along', () => {
    const st = store({ fxSpectacle: false, fxFraming: false, fxHero: false, fxSphere: false, fxSplash: false });
    flip(st, 'fxSpectacle', 'ffx2');
    expect(st.settings).toMatchObject({ fxSpectacle: true, fxFraming: true, fxSphere: true, fxSplash: true, fxHero: true });
  });

  it('the live seam follows: the parts play the moment the look is back (applyComfort runs on the write)', () => {
    const st = store({ fxSpectacle: false, fxFraming: false, fxHero: false, fxSphere: false, fxSplash: false });
    expect(eyeCandyOn('chapterFraming')).toBe(false);
    flip(st, 'fxSpectacle');
    expect(eyeCandyOn('battleSpectacle')).toBe(true);
    expect(eyeCandyOn('chapterFraming')).toBe(true);
    expect(eyeCandyOn('splashArt')).toBe(true);
    expect(eyeCandyOn('overdriveShot')).toBe(true);
  });
});

describe('no save-format change', () => {
  const fixture = JSON.parse(fs.readFileSync('tests/fixtures/saves/release-35.json', 'utf8')) as { localStorage: Record<string, string> };

  it('the release-35 save (BATTLE SPECTACLE off, no parts stored) turns the look on with its parts on, and the stored fields and version do not change', () => {
    const storage = memoryStorage(fixture.localStorage);
    const st = new SaveStore(SAVE_KEY, storage);
    expect(st.settings).toMatchObject({ fxSpectacle: false, fxFraming: false, fxHero: false, fxSphere: false, fxSplash: false });
    const keysBefore = Object.keys(st.settings).sort();
    adjustSetting(st, 'fxSpectacle', 1, true, 'ffx');
    expect(st.settings).toMatchObject({ fxSpectacle: true, fxFraming: true, fxHero: true, fxSphere: true, fxSplash: true });
    expect(Object.keys(st.settings).sort(), 'no field was added or dropped').toEqual(keysBefore);
    const written = JSON.parse(storage.getItem(SAVE_KEY) ?? '{}') as { version: number; settings: Record<string, unknown> };
    expect(written.version, 'SAVE_VERSION stays 1').toBe(1);
    expect(Object.keys(written.settings).sort()).toEqual(keysBefore);
    for (const f of FX_SWITCH_FIELDS) expect(typeof written.settings[f], f).toBe('boolean');
    // every other setting of that save is exactly as it was
    expect(st.settings).toMatchObject({ masterVolume: 0.7, textSize: 1.3, ffx2AtbSpeed: 'slow', fxLight: true, fxLiving: true });
  });
});
