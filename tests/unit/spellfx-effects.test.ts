/**
 * B1 option B: the drawn effects themselves, off the GPU. Particle budgets per
 * quality tier, the two game skins, FFX-2 Holy's eight strikes against FFX's
 * one, and REDUCE FLASHES as parameters (accessibility-review §5.2).
 */
import { describe, expect, it } from 'vitest';
import { FxDrawList } from '../../src/engine/spellfx/FxDrawList.ts';
import { FX_SPECS, drawSpellFx, type FxTarget } from '../../src/engine/spellfx/SpellFxTimeline.ts';
import {
  DEFAULT_FLASH_PARAMS,
  PEAK_BUDGET,
  QUALITY_DENSITY,
  REDUCED_FLASH_PARAMS,
  capActor,
  filterWash,
  resolveFxQuality,
} from '../../src/engine/spellfx/SpellFxParams.ts';
import type { FxGame } from '../../src/engine/spellfx/SpellFxRegistry.ts';

/** Seymour Flux's rectangle on the 1600x900 plate the mock used. */
const T: FxTarget = { x: 700, y: 180, w: 300, h: 420, cx: 850, cy: 369, fx: 850, fy: 587, sc: 420 / 360, k: 1 };

function sweep(id: keyof typeof FX_SPECS, game: FxGame, dens: number, flash = DEFAULT_FLASH_PARAMS) {
  const spec = FX_SPECS[id];
  let peak = 0;
  const washIds = new Set<number>();
  const tiles = new Set<string>();
  let maxWash = 0;
  const washCols = new Set<string>();
  for (let t = 0; t <= spec.end; t += 1 / 60) {
    const out = new FxDrawList(game, dens, flash);
    drawSpellFx(id, out, t, T);
    peak = Math.max(peak, out.count);
    for (const w of out.washes) {
      washIds.add(w.id);
      maxWash = Math.max(maxWash, w.a);
      washCols.add(w.col);
    }
    for (const i of out.items) tiles.add(i.tile);
  }
  return { peak, washIds, tiles, maxWash, washCols };
}

const IDS = Object.keys(FX_SPECS) as Array<keyof typeof FX_SPECS>;

describe('spell effects (option B)', () => {
  it("has the seven approved effects, plus D-233's two special moments", () => {
    expect(IDS.sort()).toEqual(['cure', 'fire', 'hit', 'holy', 'ice', 'megaflare', 'spiral', 'thunder', 'water']);
  });

  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: every effect stays inside the particle budget at full and phone quality`, () => {
      for (const id of IDS) {
        expect(sweep(id, game, QUALITY_DENSITY.full).peak, `${id} full`).toBeLessThanOrEqual(PEAK_BUDGET.full);
        expect(sweep(id, game, QUALITY_DENSITY.phone).peak, `${id} phone`).toBeLessThanOrEqual(PEAK_BUDGET.phone);
      }
    });
  }

  it('the heavy effects reach the 200-particle floor at full quality', () => {
    for (const id of ['fire', 'water'] as const) expect(sweep(id, 'ffx', 1).peak, id).toBeGreaterThanOrEqual(200);
  });

  it('FFX draws round motes and an eight-point gold ring; FFX-2 draws four-point sparkles', () => {
    const ffx = sweep('fire', 'ffx', 1);
    const x2 = sweep('fire', 'ffx2', 1);
    expect(ffx.tiles.has('mote')).toBe(true);
    expect(ffx.tiles.has('spark4')).toBe(false);
    expect(x2.tiles.has('spark4')).toBe(true);
    expect(x2.tiles.has('mote')).toBe(false);
    const ring = (game: FxGame) => {
      const out = new FxDrawList(game, 1, DEFAULT_FLASH_PARAMS);
      drawSpellFx('fire', out, 0.4, T);
      const marks = out.items.filter((i) => i.tag === 'cast-point');
      return { n: marks.length, col: out.items.find((i) => i.tag === 'cast-ring')?.col };
    };
    expect(ring('ffx').n).toBe(8);
    expect(ring('ffx2').n).toBe(4);
    expect(ring('ffx').col).toEqual([0xe3 / 255, 0xb9 / 255, 0x4a / 255]);
    expect(ring('ffx2').col).toEqual([0xf7 / 255, 0xb6 / 255, 0xd9 / 255]);
  });

  it('Holy strikes once in FFX and eight times in FFX-2', () => {
    expect(FX_SPECS.holy.marks('ffx')).toHaveLength(1);
    expect(FX_SPECS.holy.marks('ffx2')).toHaveLength(8);
    expect(sweep('holy', 'ffx', 1).washIds.size).toBe(1);
    expect(sweep('holy', 'ffx2', 1).washIds.size).toBe(8);
  });

  it('under reduce flashes, FFX-2 Holy reads as one wash, capped and ivory', () => {
    const r = sweep('holy', 'ffx2', 1, REDUCED_FLASH_PARAMS);
    expect(r.washIds.size).toBe(1);
    expect(r.maxWash).toBeLessThanOrEqual(0.35);
    expect([...r.washCols]).toEqual(['#FFF1D6']);
    const t = sweep('thunder', 'ffx', 1, REDUCED_FLASH_PARAMS);
    expect(t.washIds.size).toBe(1);
  });
});

describe('flash parameters', () => {
  it('defaults change nothing', () => {
    expect(filterWash(DEFAULT_FLASH_PARAMS, 3, '#FFFFFF', 0.8)).toEqual({ col: '#FFFFFF', a: 0.8 });
    expect(capActor(DEFAULT_FLASH_PARAMS, 0.95)).toBe(0.95);
  });

  it('the reduced values are the §5.2 proposal', () => {
    expect(REDUCED_FLASH_PARAMS).toEqual({
      washCap: 0.35,
      whiteWashTo: '#FFF1D6',
      oneWashPerAction: true,
      actorCap: 0.35,
      singleBolt: true,
    });
    expect(filterWash(REDUCED_FLASH_PARAMS, 1, '#FFFFFF', 0.5)).toBeNull();
    expect(filterWash(REDUCED_FLASH_PARAMS, 0, '#FFFFFF', 0.5)).toEqual({ col: '#FFF1D6', a: 0.35 });
    expect(filterWash(REDUCED_FLASH_PARAMS, 0, '#FFB070', 0.2)).toEqual({ col: '#FFB070', a: 0.2 });
    expect(capActor(REDUCED_FLASH_PARAMS, 0.95)).toBe(0.35);
  });

  it('low effects and reduced motion keep the bloom; a phone gets the lighter tier', () => {
    expect(resolveFxQuality({ lowEffects: true, reduceMotion: false, width: 1600, height: 900 })).toBe('low');
    expect(resolveFxQuality({ lowEffects: false, reduceMotion: true, width: 1600, height: 900 })).toBe('low');
    expect(resolveFxQuality({ lowEffects: false, reduceMotion: false, width: 390, height: 844 })).toBe('phone');
    expect(resolveFxQuality({ lowEffects: false, reduceMotion: false, width: 1600, height: 900 })).toBe('full');
    expect(QUALITY_DENSITY.low).toBe(0);
  });
});
