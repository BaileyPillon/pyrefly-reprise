/**
 * The EYE CANDY page's model (D-317: Bailey, 2026-10-02, "all your recommendations, godspeed", option A):
 * nine parts under eye-candy D's three looks, every one default ON, and the look as the master of its
 * parts. A look turned off stops its parts; a part turned off stays off when its look returns; REDUCE
 * MOTION never flips a switch (it is applied where motion plays). The seam the MAX mix's looks read
 * (`engine/fx/eyeCandyFlags.ts`) answers the look for a look key and look AND part for a part key, from
 * the provider `applyComfort` installs at boot and on every settings write.
 *
 * Pure (no DOM). Game case: both; OVERDRIVE SHOT is FFX only, DRESSPHERE SHOT FFX-2 only.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { applyComfort } from '../../src/app/applyComfort.ts';
import { FX_LOOK_ROWS, defaultFxLooks } from '../../src/app/fxLooks.ts';
import {
  EYE_CANDY_KEYS,
  FX_PARTS,
  FX_SWITCH_FIELDS,
  defaultFxParts,
  eyeCandyProviderFor,
  fxAllOffPatch,
  fxAllOnPatch,
  fxAllState,
  fxCount,
  fxFieldOfKey,
  fxStoppedByLook,
  fxSummary,
  fxSwitchesFor,
  fxSwitchOn,
  isFxSwitchField,
  migrateFxParts,
  type FxSwitchField,
} from '../../src/app/fxParts.ts';
import { eyeCandyOn, setEyeCandyProvider, type EyeCandyKey } from '../../src/engine/fx/eyeCandyFlags.ts';
import { fxDebugHooks } from '../../src/engine/fx/fxDebugHooks.ts';

const ALL_ON = (): Record<FxSwitchField, boolean> => ({ ...defaultFxLooks(), ...defaultFxParts() });

afterEach(() => {
  applyComfort(fxAllOnPatch());
});

describe('the twelve switches', () => {
  it('are the three looks and nine parts, each part under one look, each seam key once', () => {
    expect(FX_LOOK_ROWS.map((r) => r.label)).toEqual(['CINEMA LIGHT', 'LIVING PAINTINGS', 'BATTLE SPECTACLE']);
    expect(FX_PARTS.map((p) => [p.label, p.look])).toEqual([
      ['DEPTH OF FIELD', 'fxLight'],
      ['FOG', 'fxLight'],
      ['SMOOTH EDGES', 'fxLight'],
      ['BREATHING', 'fxLiving'],
      ['KO COLLAPSE', 'fxLiving'],
      ['CHAPTER FRAMING', 'fxSpectacle'],
      ['OVERDRIVE SHOT', 'fxSpectacle'],
      ['DRESSPHERE SHOT', 'fxSpectacle'],
      ['SPLASH ART', 'fxSpectacle'],
    ]);
    expect(FX_SWITCH_FIELDS).toHaveLength(12);
    expect(new Set(EYE_CANDY_KEYS).size).toBe(12);
    const seamKeys: EyeCandyKey[] = [
      'cinemaLight', 'livingPaintings', 'battleSpectacle', 'depthOfField', 'fog', 'smoothEdges',
      'breathing', 'koCollapse', 'chapterFraming', 'overdriveShot', 'dressphereShot', 'splashArt',
    ];
    expect([...EYE_CANDY_KEYS].sort()).toEqual([...seamKeys].sort());
    for (const k of seamKeys) expect(isFxSwitchField(fxFieldOfKey(k)!), k).toBe(true);
  });

  it('are all ON for a new profile', () => {
    expect(Object.values(defaultFxParts())).toEqual(Array(9).fill(true));
    expect(fxAllState(ALL_ON(), 'ffx')).toBe('ALL ON');
  });

  it('list 11 per game: OVERDRIVE SHOT in FFX, DRESSPHERE SHOT in FFX-2, nothing in FF7', () => {
    const ffx = fxSwitchesFor('ffx').map((r) => r.field);
    const ffx2 = fxSwitchesFor('ffx2').map((r) => r.field);
    expect(ffx).toEqual(['fxLight', 'fxDof', 'fxFog', 'fxEdges', 'fxLiving', 'fxBreath', 'fxKo', 'fxSpectacle', 'fxFraming', 'fxHero', 'fxSplash']);
    expect(ffx2).toEqual(['fxLight', 'fxDof', 'fxFog', 'fxEdges', 'fxLiving', 'fxBreath', 'fxKo', 'fxSpectacle', 'fxFraming', 'fxSphere', 'fxSplash']);
    expect(fxSwitchesFor('ff7')).toEqual([]);
    expect(fxSwitchesFor('ffx').filter((r) => r.kind === 'look').map((r) => r.field)).toEqual(['fxLight', 'fxLiving', 'fxSpectacle']);
  });
});

describe('the look is the master of its parts', () => {
  it('a look turned off stops its parts, which keep their own values', () => {
    const s = { ...ALL_ON(), fxLiving: false };
    expect(fxSwitchOn(s, 'fxLiving')).toBe(false);
    expect(fxSwitchOn(s, 'fxBreath')).toBe(false);
    expect(fxSwitchOn(s, 'fxKo')).toBe(false);
    expect(s.fxBreath, 'its own value is untouched').toBe(true);
    expect(fxStoppedByLook(s, 'fxBreath')).toBe(true);
    expect(fxStoppedByLook(s, 'fxDof')).toBe(false);
    expect(fxStoppedByLook(s, 'fxLiving'), 'a look is never stopped by itself').toBe(false);
    expect(fxSwitchOn(s, 'fxDof'), 'another look’s part plays').toBe(true);
  });

  it('a part turned off stays off when its look returns', () => {
    const off = { ...ALL_ON(), fxFog: false, fxLight: false };
    const back = { ...off, fxLight: true };
    expect(fxSwitchOn(back, 'fxLight')).toBe(true);
    expect(fxSwitchOn(back, 'fxFog')).toBe(false);
    expect(fxSwitchOn(back, 'fxDof')).toBe(true);
  });

  it('the provider answers the look for a look key and look AND part for a part key', () => {
    const p = eyeCandyProviderFor({ ...ALL_ON(), fxSpectacle: false, fxDof: false });
    expect(p('battleSpectacle')).toBe(false);
    expect(p('chapterFraming')).toBe(false);
    expect(p('overdriveShot')).toBe(false);
    expect(p('dressphereShot')).toBe(false);
    expect(p('splashArt')).toBe(false);
    expect(p('cinemaLight')).toBe(true);
    expect(p('depthOfField')).toBe(false);
    expect(p('fog')).toBe(true);
    expect(p('livingPaintings')).toBe(true);
    expect(p('breathing')).toBe(true);
    expect(p('nothing-like-this' as EyeCandyKey), 'an unknown key reads ON, as the seam’s default').toBe(true);
  });

  it('the provider copies the values: a later write reaches the seam only through the next install', () => {
    const s = ALL_ON();
    const p = eyeCandyProviderFor(s);
    s.fxFog = false;
    expect(p('fog')).toBe(true);
    expect(eyeCandyProviderFor(s)('fog')).toBe(false);
  });
});

describe('the seam, installed by applyComfort', () => {
  it('answers every key from the settings at once; a missing field reads ON', () => {
    applyComfort({ fxLight: true, fxLiving: false, fxSpectacle: true, fxSplash: false });
    expect(eyeCandyOn('livingPaintings')).toBe(false);
    expect(eyeCandyOn('breathing')).toBe(false);
    expect(eyeCandyOn('koCollapse')).toBe(false);
    expect(eyeCandyOn('splashArt')).toBe(false);
    expect(eyeCandyOn('chapterFraming')).toBe(true);
    expect(eyeCandyOn('fog'), 'never stored: ON').toBe(true);
    applyComfort({ fxLiving: true });
    expect(eyeCandyOn('breathing')).toBe(true);
    expect(eyeCandyOn('splashArt')).toBe(true);
  });

  it('REDUCE MOTION and LOW EFFECTS never change what the seam answers (they apply where motion plays)', () => {
    applyComfort({ ...ALL_ON(), reduceMotion: true, lowEffects: true });
    for (const k of EYE_CANDY_KEYS) expect(eyeCandyOn(k), k).toBe(true);
    applyComfort({ ...ALL_ON(), fxKo: false, reduceMotion: true });
    expect(eyeCandyOn('koCollapse')).toBe(false);
    expect(eyeCandyOn('breathing')).toBe(true);
  });

  it('with no provider every key reads ON (D-297: default on)', () => {
    setEyeCandyProvider(null);
    for (const k of EYE_CANDY_KEYS) expect(eyeCandyOn(k), k).toBe(true);
  });

  it('`__pyrefly.fx.snapshot().flags` reads the seam (captures and checks only)', () => {
    applyComfort({ ...ALL_ON(), fxFraming: false });
    const flags = fxDebugHooks['flags']!.snapshot!() as Record<string, boolean>;
    expect(Object.keys(flags)).toEqual([...EYE_CANDY_KEYS]);
    expect(flags['chapterFraming']).toBe(false);
    expect(flags['splashArt']).toBe(true);
  });
});

describe('ALL LOOKS, the count and the OPTIONS row', () => {
  it('counts what plays of the 11 a game shows', () => {
    expect(fxCount(ALL_ON(), 'ffx')).toEqual({ on: 11, of: 11 });
    // The FFX-2 frame of the approved round: FOG off and LIVING PAINTINGS off read 7 OF 11.
    const frame = { ...ALL_ON(), fxFog: false, fxLiving: false };
    expect(fxCount(frame, 'ffx2')).toEqual({ on: 7, of: 11 });
    expect(fxAllState(frame, 'ffx2')).toBe('MIXED');
    expect(fxSummary(frame, 'ffx2')).toBe('7 OF 11');
    // The other game's shot is not counted.
    expect(fxSummary({ ...ALL_ON(), fxSphere: false }, 'ffx')).toBe('ALL ON');
    expect(fxSummary({ ...ALL_ON(), fxSphere: false }, 'ffx2')).toBe('10 OF 11');
  });

  it('ALL OFF turns the three looks off and leaves every part its own value; ALL ON turns all twelve on', () => {
    const custom = { ...ALL_ON(), fxFog: false, fxHero: false };
    const off = { ...custom, ...fxAllOffPatch() };
    expect(fxAllState(off, 'ffx')).toBe('ALL OFF');
    expect(fxSummary(off, 'ffx')).toBe('ALL OFF');
    expect([off.fxFog, off.fxHero, off.fxDof]).toEqual([false, false, true]);
    // A look brought back after ALL OFF plays its parts as they were.
    const lightBack = { ...off, fxLight: true };
    expect([fxSwitchOn(lightBack, 'fxDof'), fxSwitchOn(lightBack, 'fxFog')]).toEqual([true, false]);
    const on = { ...off, ...fxAllOnPatch() };
    expect(fxAllState(on, 'ffx')).toBe('ALL ON');
    expect(fxAllState(on, 'ffx2')).toBe('ALL ON');
    for (const f of FX_SWITCH_FIELDS) expect(on[f], f).toBe(true);
  });
});

describe('migrateFxParts (the upgrade rule, on its own)', () => {
  const upgrade = (looks: Partial<Record<'fxLight' | 'fxLiving' | 'fxSpectacle', unknown>>, raw: unknown) => {
    const s: Record<string, unknown> = { ...ALL_ON(), fxLight: true, fxLiving: true, fxSpectacle: true, ...looks };
    migrateFxParts(s, raw);
    return s;
  };

  it.each([
    [true, true, true],
    [false, true, true],
    [true, false, true],
    [true, true, false],
    [false, false, true],
    [false, true, false],
    [true, false, false],
    [false, false, false],
  ])('looks %p / %p / %p with no stored parts: every part takes its look', (light, living, spectacle) => {
    const s = upgrade({ fxLight: light, fxLiving: living, fxSpectacle: spectacle }, { fxLight: light, fxLiving: living, fxSpectacle: spectacle });
    const look = { fxLight: light, fxLiving: living, fxSpectacle: spectacle };
    for (const p of FX_PARTS) expect(s[p.field], p.field).toBe(look[p.look]);
  });

  it('a stored boolean part is kept, both ways (a part OFF under an ON look, a part ON under an OFF look)', () => {
    const s = upgrade({ fxLight: true, fxLiving: false }, { fxLight: true, fxLiving: false, fxFog: false, fxBreath: true });
    expect(s['fxFog']).toBe(false);
    expect(s['fxDof']).toBe(true);
    expect(s['fxBreath']).toBe(true);
    expect(s['fxKo'], 'not stored: follows its OFF look').toBe(false);
  });

  it.each([['off'], [0], [1], [null], ['false'], [Number.NaN], [{}]])('a stored %p part follows its look (CHK-024)', (v) => {
    const s = upgrade({ fxSpectacle: false }, { fxSpectacle: false, fxSplash: v, fxDof: v });
    expect(s['fxSplash']).toBe(false);
    expect(s['fxDof']).toBe(true);
  });

  it('a raw blob that is not an object (or absent) reads as no stored parts', () => {
    for (const raw of [undefined, null, 'x', 3]) {
      const s = upgrade({ fxLiving: false }, raw);
      expect([s['fxBreath'], s['fxKo'], s['fxDof']], String(raw)).toEqual([false, false, true]);
    }
  });
});
