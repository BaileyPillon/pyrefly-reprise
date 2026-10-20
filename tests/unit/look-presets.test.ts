import { describe, expect, it } from 'vitest';
import { FX_DIALS } from '../../src/engine/fx/EyeCandy.ts';
import { LOOKS, LOOK_NAMES, LOOK_QUALITIES, QUALITY_COST, nextLook, nextQuality, parseLook, type LookName } from '../../src/engine/look/LookConfig.ts';
import { ROOM_LOOKS, applyGrade, lutBytes, lutKey, recipeFor, sCurveAt } from '../../src/engine/look/LookGrades.ts';
import { LUT_SIZE } from '../../src/engine/fx/a/LookLut.ts';

/** Demo looks (dev flag only; both games): the address, the presets as data, the quality tiers and the grades. */
describe('parseLook', () => {
  it('is off with no flag and not armed', () => {
    expect(parseLook('')).toEqual({ armed: false, name: null, quality: 'high', debug: null });
    expect(parseLook('?fx=off&crisp=a2')).toMatchObject({ armed: false, name: null });
  });

  it('reads the three looks, any case, and the quality', () => {
    expect(parseLook('?look=hd2d')).toMatchObject({ armed: true, name: 'hd2d', quality: 'high' });
    expect(parseLook('?look=Cinematic&lookq=LOW')).toMatchObject({ armed: true, name: 'cinematic', quality: 'low' });
    expect(parseLook('?rig=on&look=anime&lookq=medium')).toMatchObject({ name: 'anime', quality: 'medium' });
  });

  it('arms the live keys for an unknown or off value but builds no look', () => {
    expect(parseLook('?look=off')).toMatchObject({ armed: true, name: null });
    expect(parseLook('?look=bogus&lookq=ultra')).toMatchObject({ armed: true, name: null, quality: 'high' });
    expect(parseLook('?look')).toMatchObject({ armed: true, name: null });
  });

  it('reads the mask view only when asked for exactly', () => {
    expect(parseLook('?look=anime&lookdebug=mask').debug).toBe('mask');
    expect(parseLook('?look=anime&lookdebug=other').debug).toBeNull();
  });
});

describe('the cycles', () => {
  it('F6 goes off, hd2d, cinematic, anime, off', () => {
    const seen: (LookName | null)[] = [];
    let cur: LookName | null = null;
    for (let i = 0; i < 5; i++) {
      cur = nextLook(cur);
      seen.push(cur);
    }
    expect(seen).toEqual(['hd2d', 'cinematic', 'anime', null, 'hd2d']);
  });

  it('F7 goes high, medium, low, high', () => {
    expect(nextQuality('high')).toBe('medium');
    expect(nextQuality('medium')).toBe('low');
    expect(nextQuality('low')).toBe('high');
  });
});

describe('the presets', () => {
  const eachNumber = (o: unknown, path: string, fn: (v: number, p: string) => void): void => {
    if (typeof o === 'number') fn(o, path);
    else if (Array.isArray(o)) o.forEach((x, i) => eachNumber(x, `${path}[${i}]`, fn));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (k !== 'policy') eachNumber(v, `${path}.${k}`, fn);
  };

  it('every number is finite and non-negative', () => {
    for (const n of LOOK_NAMES) eachNumber(LOOKS[n], n, (v, p) => expect(Number.isFinite(v) && v >= 0, p).toBe(true));
  });

  it('every sub-effect a look switches off and every dial it sets exists in the eye-candy state', () => {
    const subs = new Set(['dof', 'shafts', 'streaks', 'look', 'rim', 'focus', 'bloom', 'halo', 'flare', 'sway', 'shadow', 'reflect', 'plates', 'glow', 'drift', 'foil']);
    for (const n of LOOK_NAMES) {
      for (const id of LOOKS[n].policy.subOff) expect(subs.has(id), `${n}: ${id}`).toBe(true);
      for (const d of Object.keys(LOOKS[n].policy.dials)) expect((FX_DIALS as readonly string[]).includes(d), `${n}: ${d}`).toBe(true);
    }
  });

  it('each look has the effects the brief names and none of another look', () => {
    const { hd2d, cinematic, anime } = LOOKS;
    // hd2d: tilt-shift with bokeh, shafts, motes, no grain
    expect(hd2d.blur.far).toBeGreaterThan(5);
    expect(hd2d.blur.bokeh).toBeGreaterThan(0);
    expect(hd2d.shaft.gain).toBeGreaterThan(0);
    expect(hd2d.motes.gain).toBeGreaterThan(0);
    expect(hd2d.fog.density).toBe(0);
    expect(hd2d.outline.strength).toBe(0);
    // cinematic: fog, rim, grain, a trace of aberration, the deepest vignette
    expect(cinematic.fog.density).toBeGreaterThan(0);
    expect(cinematic.rim.gain).toBeGreaterThan(0);
    expect(cinematic.grade.grain).toBeGreaterThan(0);
    expect(cinematic.ca).toBeGreaterThan(0);
    expect(cinematic.ca).toBeLessThan(2.5);
    expect(cinematic.grade.vignetteAdd).toBeGreaterThan(hd2d.grade.vignetteAdd);
    expect(cinematic.blur.far).toBeLessThan(hd2d.blur.far);
    // anime: ink outline, sharpening, more saturation, no grain, no blur, bloom on effects only (a threshold above the painted range)
    expect(anime.outline.strength).toBeGreaterThan(0);
    expect(anime.outline.width).toBeGreaterThan(0);
    expect(anime.sharpen).toBeGreaterThan(0);
    expect(anime.grade.grain).toBe(0);
    expect(anime.blur.far).toBe(0);
    expect(anime.blur.near).toBe(0);
    expect(anime.bloom.threshold).toBeGreaterThanOrEqual(1);
    expect(anime.bloom.selective).toBe(false);
    const pal = { key: 0xcfe0ff, sky: 0x1a2f6e };
    const total = (n: LookName, g: typeof anime): number => g.grade.saturation * recipeFor(n, 'ffx', 'x', pal).sat;
    expect(total('anime', anime)).toBeGreaterThan(total('hd2d', hd2d)); // the LUT's own saturation counts too
    expect(total('cinematic', cinematic)).toBeLessThan(1); // the painterly look pulls the colour back
    expect(anime.fog.density).toBe(0);
    expect(anime.shaft.gain).toBe(0);
    expect(anime.motes.gain).toBe(0);
  });

  it('a look that blurs hands the depth of field to the mask-aware pass (the stock tilt-shift is off)', () => {
    for (const n of LOOK_NAMES) expect(LOOKS[n].tiltMaxBlur).toBe(0);
  });

  it('figures keep most of their own colour: the figure amount stays above 0.5 (they are drawn true since 39.1)', () => {
    for (const n of LOOK_NAMES) {
      expect(LOOKS[n].grade.figureTrue).toBeGreaterThanOrEqual(0.5);
      expect(LOOKS[n].grade.figureTrue).toBeLessThanOrEqual(1);
    }
  });
});

describe('the quality tiers', () => {
  it('cost falls from high to low in every field', () => {
    const [h, m, l] = LOOK_QUALITIES.map((q) => QUALITY_COST[q]) as [typeof QUALITY_COST.high, typeof QUALITY_COST.high, typeof QUALITY_COST.high];
    for (const k of ['blurTaps', 'shaftSamples', 'moteLayers', 'fogOctaves', 'edgeTaps'] as const) {
      expect(h[k]).toBeGreaterThanOrEqual(m[k]);
      expect(m[k]).toBeGreaterThanOrEqual(l[k]);
    }
    expect(l.blurTaps).toBe(0); // low hands the depth of field back to the stock tilt-shift
    expect(h.ca).toBe(true);
    expect(l.ca).toBe(false);
  });

  it('the shaft samples and the layers are loop bounds a shader can compile (at least 1)', () => {
    for (const q of LOOK_QUALITIES) {
      expect(QUALITY_COST[q].shaftSamples).toBeGreaterThanOrEqual(2);
      expect(QUALITY_COST[q].moteLayers).toBeGreaterThanOrEqual(1);
      expect(QUALITY_COST[q].edgeTaps % 2).toBe(0); // the edge ring alternates two radii
    }
  });
});

describe('the grades', () => {
  const pal = { key: 0xffd9a0, sky: 0x30405a };

  it('builds a full LUT for every look and both games', () => {
    for (const n of LOOK_NAMES) for (const g of ['ffx', 'ffx2'] as const) expect(lutBytes(n, g, 'test-room', pal).length).toBe(LUT_SIZE ** 3 * 4);
  });

  it('the looks differ from one another and the game flavours differ within a look', () => {
    const a = lutBytes('hd2d', 'ffx', 'r', pal);
    const b = lutBytes('cinematic', 'ffx', 'r', pal);
    const c = lutBytes('anime', 'ffx', 'r', pal);
    const f2 = lutBytes('cinematic', 'ffx2', 'r', pal);
    const diff = (x: Uint8Array, y: Uint8Array): number => {
      let d = 0;
      for (let i = 0; i < x.length; i += 4) d += Math.abs(x[i]! - y[i]!) + Math.abs(x[i + 1]! - y[i + 1]!) + Math.abs(x[i + 2]! - y[i + 2]!);
      return d / (x.length / 4);
    };
    expect(diff(a, b)).toBeGreaterThan(2);
    expect(diff(b, c)).toBeGreaterThan(2);
    expect(diff(a, c)).toBeGreaterThan(2);
    expect(diff(b, f2)).toBeGreaterThan(1);
  });

  it('keeps black and white where they are (a grade, not a fog): the LUT ends are near 0 and near white', () => {
    for (const n of LOOK_NAMES) {
      const t = lutBytes(n, 'ffx', 'r', pal);
      expect(t[0]! + t[1]! + t[2]!).toBeLessThan(30);
      const last = (LUT_SIZE ** 3 - 1) * 4;
      expect(t[last]! + t[last + 1]! + t[last + 2]!).toBeGreaterThan(560);
    }
  });

  it('a room override changes that room only', () => {
    const base = recipeFor('cinematic', 'ffx', 'nowhere', pal);
    (ROOM_LOOKS.cinematic as Record<string, unknown>)['__test-room'] = { recipe: { contrast: 0.9 }, shadow: [0.1, 0.2, 0.3] };
    try {
      const o = recipeFor('cinematic', 'ffx', '__test-room', pal);
      expect(o.contrast).toBe(0.9);
      expect(o.shadowHue).toEqual([0.1, 0.2, 0.3]);
      expect(recipeFor('cinematic', 'ffx', 'nowhere', pal)).toEqual(base);
    } finally {
      delete (ROOM_LOOKS.cinematic as Record<string, unknown>)['__test-room'];
    }
  });

  it('the cache key changes with the look, the game, the room and the palette', () => {
    const k = lutKey('hd2d', 'ffx', 'r', pal);
    expect(lutKey('anime', 'ffx', 'r', pal)).not.toBe(k);
    expect(lutKey('hd2d', 'ffx2', 'r', pal)).not.toBe(k);
    expect(lutKey('hd2d', 'ffx', 's', pal)).not.toBe(k);
    expect(lutKey('hd2d', 'ffx', 'r', { ...pal, key: 1 })).not.toBe(k);
    expect(lutKey('hd2d', 'ffx', 'r', pal)).toBe(k);
  });
});

describe('the tone curve', () => {
  it('keeps 0 and 1 fixed, darkens under the pivot and brightens over it', () => {
    expect(sCurveAt(0, 0.5, 0.3)).toBe(0);
    expect(sCurveAt(1, 0.5, 0.3)).toBe(1);
    expect(sCurveAt(0.1, 0.5, 0.3)).toBeLessThan(0.1);
    expect(sCurveAt(0.6, 0.5, 0.3)).toBeGreaterThan(0.6);
    expect(sCurveAt(0.3, 0.5, 0.3)).toBeCloseTo(0.3, 8);
  });

  it('is monotonic for every look (a grade never inverts a gradient)', () => {
    const pal = { key: 0xcfe0ff, sky: 0x1a2f6e };
    for (const n of LOOK_NAMES) {
      const r = recipeFor(n, 'ffx', 'x', pal);
      let prev = -1;
      for (let i = 0; i <= 20; i++) {
        const v = i / 10;
        const l = applyGrade([v, v, v], r)[1];
        expect(l).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = l;
      }
    }
  });

  it('hd2d and anime lift a mid tone (they are the bright looks), cinematic does not', () => {
    const pal = { key: 0xcfe0ff, sky: 0x1a2f6e };
    const mid = (n: LookName): number => applyGrade([0.2, 0.2, 0.2], recipeFor(n, 'ffx', 'x', pal))[1];
    expect(mid('hd2d')).toBeGreaterThan(0.2);
    expect(mid('anime')).toBeGreaterThan(0.2);
    expect(mid('cinematic')).toBeLessThanOrEqual(0.2);
  });
});
