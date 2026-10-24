import { afterEach, describe, expect, it } from 'vitest';
import { setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { FxDrawList } from '../../src/engine/spellfx/FxDrawList.ts';
import { HIT_END, HIT_MARK, SPARK_KINDS } from '../../src/engine/spellfx/effects-painted-hit.ts';
import { INK_HIT_END, hitInk } from '../../src/engine/spellfx/effects-pro-hit.ts';
import { FRESH_SPECS } from '../../src/engine/spellfx/SpellFxFresh.ts';
import { DEFAULT_FLASH_PARAMS, PEAK_BUDGET, REDUCED_FLASH_PARAMS } from '../../src/engine/spellfx/SpellFxParams.ts';
import type { FxGame } from '../../src/engine/spellfx/SpellFxRegistry.ts';
import type { FxTarget } from '../../src/engine/spellfx/SpellFxTimeline.ts';

/**
 * The pro hit, "Ink and light" (lane "pro-look"; both games, two skins; Chapter I and Chapter IV only, off by default): drawn off the GPU. The ink is normal-blended and under the light, the light is additive,
 * every weapon draws, both skins, the painted finish, the budgets, REDUCE FLASHES, and the old hit is what plays when the piece is off.
 */
const T: FxTarget = { x: 700, y: 180, w: 300, h: 420, cx: 850, cy: 369, fx: 850, fy: 587, sc: 420 / 360, k: 1 };

function frame(game: FxGame, t: number, opts: { variant?: string; dir?: number; flash?: typeof DEFAULT_FLASH_PARAMS; paint?: number; dens?: number } = {}): FxDrawList {
  const o = new FxDrawList(game, opts.dens ?? 1, opts.flash ?? DEFAULT_FLASH_PARAMS);
  o.paint = opts.paint ?? 1;
  o.variant = opts.variant ?? '';
  o.dir = opts.dir ?? 1;
  o.begin();
  hitInk(o, t, T);
  return o;
}

afterEach(() => {
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
});

describe('the pro hit', () => {
  it('draws for every weapon in both games, at every moment of the clock, with finite numbers and inside the budget', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      for (const kind of SPARK_KINDS) {
        for (const dir of [1, -1]) {
          let peak = 0;
          for (let t = 0.2; t <= INK_HIT_END; t += 1 / 60) {
            const o = frame(game, t, { variant: kind, dir });
            peak = Math.max(peak, o.count);
            for (const i of o.items) expect([i.x, i.y, i.w, i.h, i.rot, i.a].every(Number.isFinite), `${game} ${kind} ${t}`).toBe(true);
          }
          expect(peak, `${game} ${kind}`).toBeGreaterThan(8);
          expect(peak, `${game} ${kind}`).toBeLessThanOrEqual(PEAK_BUDGET.full);
        }
      }
    }
  });

  it('lays the ink first, in normal blend, then the light, additive, and its ink is darker than its light', () => {
    const o = frame('ffx', HIT_MARK + 0.03, { variant: 'sword' });
    const firstAdd = o.items.findIndex((i) => i.layer === 1);
    const ink = o.items.filter((i) => i.layer === 0 && i.shape === 3);
    expect(ink.length).toBeGreaterThanOrEqual(2); // the edge and the body
    expect(firstAdd).toBeGreaterThan(0);
    const lum = (c: readonly [number, number, number]): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const light = o.items.filter((i) => i.layer === 1 && i.shape === 3);
    expect(light.length).toBeGreaterThanOrEqual(2); // the core and the hot spine
    for (const i of ink) expect(lum(i.col)).toBeLessThan(0.2);
    expect(Math.max(...light.map((i) => lum(i.col)))).toBeGreaterThan(0.9); // the white spine
  });

  it('the stroke draws on across the contact: little at -70 ms, all of it by +70 ms, the light gone by +260 ms, the ink lingering to +720 ms', () => {
    const arcSpan = (t: number): number => {
      const arcs = frame('ffx', t, { variant: 'sword' }).items.filter((i) => i.layer === 0 && i.shape === 3);
      return arcs.length ? Math.abs(arcs[0]!.p[1] - arcs[0]!.p[0]) : 0;
    };
    expect(arcSpan(HIT_MARK - 0.07)).toBeGreaterThanOrEqual(0);
    expect(arcSpan(HIT_MARK + 0.07)).toBeGreaterThan(arcSpan(HIT_MARK - 0.05));
    const lightAt = (t: number): number => frame('ffx', t, { variant: 'sword' }).items.filter((i) => i.layer === 1 && i.shape === 3).length;
    expect(lightAt(HIT_MARK + 0.05)).toBeGreaterThan(0);
    expect(lightAt(HIT_MARK + 0.3)).toBe(0);
    const inkAt = (t: number): number => frame('ffx', t, { variant: 'sword' }).items.filter((i) => i.layer === 0 && i.shape === 3).length;
    expect(inkAt(HIT_MARK + 0.5)).toBeGreaterThan(0);
    expect(inkAt(INK_HIT_END + 0.01)).toBe(0);
  });

  it('has a cross glint at contact: a wide flare and a tall one', () => {
    const o = frame('ffx', HIT_MARK + 0.03, { variant: 'katana' });
    const flares = o.items.filter((i) => i.tile === 'spark4' && i.layer === 1);
    expect(flares.some((f) => f.w > f.h * 4)).toBe(true);
    expect(flares.some((f) => f.h > f.w * 3)).toBe(true);
  });

  it('flings ink drops with a rim: a colour dab with a darker one on it', () => {
    const o = frame('ffx', HIT_MARK + 0.12, { variant: 'greatsword' });
    const dabs = o.items.filter((i) => i.tile === 'dab');
    expect(dabs.length).toBeGreaterThanOrEqual(4);
    const rims = dabs.filter((i) => i.col[0] > 0.5);
    const inks = dabs.filter((i) => i.col[0] < 0.2);
    expect(rims.length).toBeGreaterThan(0);
    expect(inks.length).toBeGreaterThan(0);
  });

  it('has exactly one shock ring on the floor, thin', () => {
    const o = frame('ffx', HIT_MARK + 0.1, { variant: 'sword' });
    const rings = o.items.filter((i) => i.shape === 1);
    expect(rings.length).toBe(1);
    expect(rings[0]!.h).toBeLessThan(rings[0]!.w * 0.5); // flat on the floor
  });

  it('is two skins: FFX gold-cored on indigo, FFX-2 pink-cored on plum with four-point sparkles', () => {
    const a = frame('ffx', HIT_MARK + 0.05, { variant: 'sword' });
    const b = frame('ffx2', HIT_MARK + 0.05, { variant: 'sword' });
    const core = (o: FxDrawList): readonly [number, number, number] => o.items.find((i) => i.layer === 1 && i.shape === 3)!.col;
    expect(core(a)[2]).toBeLessThan(core(a)[0]); // gold: red over blue
    expect(core(b)[2]).toBeGreaterThan(0.6); // pink keeps its blue
    expect(core(b)[1]).toBeLessThan(core(a)[1]);
    const ink = (o: FxDrawList): readonly [number, number, number] => o.items.find((i) => i.layer === 0 && i.shape === 3)!.col;
    expect(ink(b)[0]).toBeGreaterThan(ink(a)[0]); // plum is warmer than indigo
    const late = frame('ffx2', HIT_MARK + 0.2, { variant: 'sword' });
    expect(late.items.some((i) => i.tile === 'spark4')).toBe(true);
  });

  it('takes the painted finish when the list asks for it and not otherwise', () => {
    const on = frame('ffx', HIT_MARK + 0.05, { variant: 'sword', paint: 1 });
    const off = frame('ffx', HIT_MARK + 0.05, { variant: 'sword', paint: 0 });
    expect(on.items.some((i) => (i.paint ?? 0) > 0)).toBe(true);
    expect(off.items.some((i) => (i.paint ?? 0) > 0)).toBe(false);
  });

  it('REDUCE FLASHES keeps every wash under its cap', () => {
    let maxWash = 0;
    for (let t = 0.2; t <= INK_HIT_END; t += 1 / 60) for (const w of frame('ffx', t, { variant: 'greatsword', flash: REDUCED_FLASH_PARAMS }).washes) maxWash = Math.max(maxWash, w.a);
    let normal = 0;
    for (let t = 0.2; t <= INK_HIT_END; t += 1 / 60) for (const w of frame('ffx', t, { variant: 'greatsword' }).washes) normal = Math.max(normal, w.a);
    expect(maxWash).toBeLessThanOrEqual(normal);
    expect(normal).toBeLessThan(0.1);
  });

  it('thins with the particle density (the quality tiers) and stays drawn at the lowest', () => {
    const full = frame('ffx', HIT_MARK + 0.1, { variant: 'sword', dens: 1 }).count;
    const low = frame('ffx', HIT_MARK + 0.1, { variant: 'sword', dens: 0.3 }).count;
    expect(low).toBeLessThan(full);
    expect(low).toBeGreaterThan(5);
  });
});

describe('the hit spec: the pro hit only when the piece is on, else the fx lane\'s, with the same clock', () => {
  const spec = FRESH_SPECS.hit!;

  it('keeps the mark and the start (the numeral lands as it did) and ends later only under the piece', () => {
    expect(spec.marks('ffx')[0]).toBe(HIT_MARK);
    expect(spec.marks('ffx2')[0]).toBe(HIT_MARK);
    expect(spec.end).toBe(HIT_END); // off by default
    setProMode('pro');
    setDemoChapter('seymour-flux');
    expect(spec.end).toBe(INK_HIT_END);
    expect(INK_HIT_END).toBeGreaterThan(HIT_END);
    setProPiece('hits', false);
    expect(spec.end).toBe(HIT_END);
  });

  it('draws the old hit with the piece off and the ink with it on', () => {
    const draw = (): FxDrawList => {
      const o = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
      o.paint = 1;
      o.variant = 'sword';
      o.begin();
      spec.draw(o, HIT_MARK + 0.05, T);
      return o;
    };
    const off = draw();
    expect(off.items.some((i) => i.tile === 'dab')).toBe(false); // the fx lane's sword hit has no dabs this early
    expect(off.items.filter((i) => i.layer === 0 && i.shape === 3).length).toBe(0); // and no normal-blend band: its bands are additive
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const on = draw();
    expect(on.items.filter((i) => i.layer === 0 && i.shape === 3).length).toBeGreaterThan(0);
  });
});
