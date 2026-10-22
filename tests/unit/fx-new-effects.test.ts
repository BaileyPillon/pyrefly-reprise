/**
 * The new spell effects (motion pass, lane "fx"; Bailey 2026-10-22: "Faithful shape, painted finish"): the drawn effects themselves, off the GPU. Budgets at every quality tier, the marks and holds
 * (a numeral never waits longer than it did), the two game skins, the weapon variants, REDUCE FLASHES, the buff spells, the painted finish on the list, the thinning by the guard.
 */
import { describe, expect, it } from 'vitest';
import { BOSS_FX_IDS } from '../../src/engine/spellfx/BossFx.ts';
import { FxDrawList } from '../../src/engine/spellfx/FxDrawList.ts';
import { FRESH_SPECS } from '../../src/engine/spellfx/SpellFxFresh.ts';
import { FX_SPECS, specOf, type FreshFxId, type FxTarget } from '../../src/engine/spellfx/SpellFxTimeline.ts';
import { DEFAULT_FLASH_PARAMS, PEAK_BUDGET, QUALITY_DENSITY, REDUCED_FLASH_PARAMS } from '../../src/engine/spellfx/SpellFxParams.ts';
import { BUFF_FX_IDS, type FxGame } from '../../src/engine/spellfx/SpellFxRegistry.ts';
import { SPARK_KINDS } from '../../src/engine/spellfx/effects-painted-hit.ts';
import { SPELL_HOLD_CAP_MS } from '../../src/engine/spellfx/SpellFxSpecials.ts';
import { CURE_MARK } from '../../src/engine/spellfx/effects-painted-cure.ts';
import { paintLevel } from '../../src/engine/spellfx/FxPaint.ts';

/** Seymour Flux's rectangle on the 1600x900 plate the mock used. */
const T: FxTarget = { x: 700, y: 180, w: 300, h: 420, cx: 850, cy: 369, fx: 850, fy: 587, sc: 420 / 360, k: 1 };

interface Sweep {
  peak: number;
  tiles: Set<string>;
  paintedAll: boolean;
  anyPaint: boolean;
  nan: boolean;
  maxWash: number;
}

function sweep(id: FreshFxId, game: FxGame, opts: { dens?: number; variant?: string; dir?: number; flash?: typeof DEFAULT_FLASH_PARAMS; paint?: number; trailK?: number } = {}): Sweep {
  const spec = specOf(id, true);
  const out: Sweep = { peak: 0, tiles: new Set(), paintedAll: true, anyPaint: false, nan: false, maxWash: 0 };
  for (let t = spec.startAt; t <= spec.end; t += 1 / 60) {
    const o = new FxDrawList(game, opts.dens ?? 1, opts.flash ?? DEFAULT_FLASH_PARAMS);
    o.paint = opts.paint ?? 1;
    o.variant = opts.variant ?? '';
    o.dir = opts.dir ?? 1;
    o.trailK = opts.trailK ?? 1;
    o.begin();
    spec.draw(o, t, T);
    out.peak = Math.max(out.peak, o.count);
    for (const i of o.items) {
      out.tiles.add(i.tile);
      if (![i.x, i.y, i.w, i.h, i.rot, i.a].every(Number.isFinite)) out.nan = true;
      if ((i.paint ?? 0) > 0) out.anyPaint = true;
    }
    for (const w of o.washes) out.maxWash = Math.max(out.maxWash, w.a);
  }
  return out;
}

const FRESH_IDS = Object.keys(FRESH_SPECS) as FreshFxId[];

describe('new spell effects: the clocks', () => {
  it('has the effects the brief names: Cure, the five buffs, the hit per weapon, Fire, Blizzard and Thunder', () => {
    // step 2's ten, and step 3's fifteen (`fx-boss-effects.test.ts`): the bosses' attacks, the charge, the Overdrive aura, Jump, the dress change, Darkness
    expect(FRESH_IDS.sort()).toEqual(['cure', 'dispel', 'fire', 'haste', 'hit', 'ice', 'protect', 'reflect', 'shell', 'thunder', ...BOSS_FX_IDS].sort());
    expect([...BUFF_FX_IDS].sort()).toEqual(['dispel', 'haste', 'protect', 'reflect', 'shell']);
  });

  it('no numeral waits longer than it did: every mark is today\'s or earlier, every hold cap is today\'s', () => {
    for (const id of FRESH_IDS) {
      const spec = FRESH_SPECS[id]!;
      expect(spec.holdCapMs, id).toBeLessThanOrEqual(SPELL_HOLD_CAP_MS);
      const today = id in FX_SPECS ? FX_SPECS[id as keyof typeof FX_SPECS] : undefined;
      for (const game of ['ffx', 'ffx2'] as const) {
        const marks = spec.marks(game);
        expect(marks.length, `${id} ${game}`).toBeGreaterThan(0);
        // an effect reaches its first mark well inside the numeral's wait: the clock starts at startAt, so the wait is mark - startAt
        expect((marks[0]! - spec.startAt) * 1000, `${id} ${game} first mark`).toBeLessThanOrEqual(SPELL_HOLD_CAP_MS);
        if (today) expect(marks[0], `${id} ${game} vs today`).toBeLessThanOrEqual(today.marks(game)[0]! + 1e-9);
      }
      expect(spec.end, `${id} end`).toBeGreaterThan(spec.marks('ffx')[0]!);
    }
  });

  it('a party-wide FFX Cure staggers its columns by less than the wait the third target can bear', () => {
    const spec = FRESH_SPECS.cure!;
    const stagger = spec.staggerFor!('ffx');
    expect(stagger).toBeGreaterThan(0);
    expect(spec.staggerFor!('ffx2')).toBe(0); // FFX-2's White Mage is a neutral version: no columns in turn
    // target 3 (index 2): its mark is CURE_MARK + 2 * stagger after the action starts; the numeral waits at most the hold cap
    expect((CURE_MARK + 2 * stagger) * 1000).toBeLessThan(SPELL_HOLD_CAP_MS);
  });

  it('specOf keeps today\'s spec for a copy that is not fresh, and for anything the new set lacks', () => {
    expect(specOf('cure', false)).toBe(FX_SPECS.cure);
    expect(specOf('hit', false)).toBe(FX_SPECS.hit);
    expect(specOf('holy', true)).toBe(FX_SPECS.holy);
    expect(specOf('megaflare', true)).toBe(FX_SPECS.megaflare);
    expect(specOf('cure', true)).toBe(FRESH_SPECS.cure);
  });
});

describe('new spell effects: the drawing', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: every new effect stays inside the quad budget at full and phone quality, with finite numbers`, () => {
      for (const id of FRESH_IDS) {
        const variants = id === 'hit' ? [...SPARK_KINDS] : id === 'cure' ? ['', 'potion', 'phoenix'] : [''];
        for (const variant of variants) {
          const full = sweep(id, game, { dens: QUALITY_DENSITY.full, variant });
          const phone = sweep(id, game, { dens: QUALITY_DENSITY.phone, variant, trailK: 0.6 });
          expect(full.peak, `${id}/${variant} full`).toBeLessThanOrEqual(PEAK_BUDGET.full);
          expect(phone.peak, `${id}/${variant} phone`).toBeLessThanOrEqual(PEAK_BUDGET.phone);
          expect(full.nan, `${id}/${variant} numbers`).toBe(false);
        }
      }
    });
  }

  it('every new effect carries the painted finish on its quads, and none without the switch', () => {
    for (const id of FRESH_IDS) {
      expect(sweep(id, 'ffx', { paint: 1, variant: id === 'hit' ? 'sword' : '' }).anyPaint, id).toBe(true);
      expect(sweep(id, 'ffx', { paint: 0, variant: id === 'hit' ? 'sword' : '' }).anyPaint, `${id} off`).toBe(false);
    }
    // washes and the solid tile never take it
    expect(paintLevel(0, 'solid', 1600, 900)).toBe(0);
    expect(paintLevel(2, 'solid', 40, 3)).toBe(0); // a thin bar (a bolt, a spark line) stays crisp
    expect(paintLevel(3, 'solid', 300, 300)).toBeGreaterThan(0.5); // the slash band is the brush stroke
  });

  it('FFX draws round motes and FFX-2 four-point sparkles in the buffs, as the old effects do', () => {
    const ffx = sweep('shell', 'ffx');
    const x2 = sweep('shell', 'ffx2');
    expect(ffx.tiles.has('mote')).toBe(true);
    expect(ffx.tiles.has('spark4')).toBe(false);
    expect(x2.tiles.has('spark4')).toBe(true);
    expect(x2.tiles.has('mote')).toBe(false);
  });

  it('FFX Cure is the column (facets, a dim, streaks); FFX-2 Cure is the neutral one (four-point sparkles, no column)', () => {
    const ffx = sweep('cure', 'ffx');
    const x2 = sweep('cure', 'ffx2');
    expect(ffx.tiles.has('facet')).toBe(true);
    expect(ffx.tiles.has('dim')).toBe(true);
    expect(ffx.tiles.has('streak')).toBe(true);
    expect(x2.tiles.has('facet')).toBe(false);
    expect(x2.tiles.has('dim')).toBe(false);
    expect(x2.tiles.has('spark4')).toBe(true);
  });

  it('an item\'s Cure is the small form: no dusk, fewer quads than the spell, a Phoenix Down warmer', () => {
    const spell = sweep('cure', 'ffx');
    const potion = sweep('cure', 'ffx', { variant: 'potion' });
    const phoenix = sweep('cure', 'ffx', { variant: 'phoenix' });
    expect(potion.tiles.has('dim')).toBe(false);
    expect(potion.peak).toBeLessThan(spell.peak);
    const warm = (variant: string): number => {
      const o = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
      o.variant = variant;
      o.begin();
      FRESH_SPECS.cure!.draw(o, 0.6, T);
      const glow = o.items.find((i) => i.tile === 'glow' && i.w > 100)!;
      return glow.col[0] - glow.col[2]; // red minus blue: warm is positive
    };
    expect(warm('phoenix')).toBeGreaterThan(warm('potion'));
    expect(phoenix.nan).toBe(false);
  });

  it('every weapon draws something different, and a blow from the left and from the right mirror each other', () => {
    const sig = (kind: string, dir = 1): string => {
      const o = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
      o.variant = kind;
      o.dir = dir;
      o.begin();
      FRESH_SPECS.hit!.draw(o, 0.34, T);
      return `${o.count}|${[...new Set(o.items.map((i) => i.tile + i.shape))].sort().join(',')}`;
    };
    const sigs = new Set(SPARK_KINDS.map((k) => sig(k)));
    expect(sigs.size).toBeGreaterThanOrEqual(7); // sword, katana, greatsword, dagger, spear, staff, blitzball, doll, claw, gun, generic: not one look
    const o1 = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
    const o2 = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
    for (const [o, dir] of [[o1, 1], [o2, -1]] as const) {
      o.variant = 'spear';
      o.dir = dir;
      o.begin();
      FRESH_SPECS.hit!.draw(o, 0.34, T);
    }
    const cx = (o: FxDrawList): number => o.items.filter((i) => i.tag === undefined && i.shape === 0 && i.tile === 'streak').reduce((s, i) => s + i.x, 0) / Math.max(1, o.items.filter((i) => i.tile === 'streak').length);
    expect(cx(o1)).toBeGreaterThan(T.cx - 50);
    expect(cx(o2)).toBeLessThan(T.cx + 50);
    expect(cx(o1)).not.toBeCloseTo(cx(o2), 0);
  });

  it('the hit keeps its clock: contact at the mark, the sparks begin there', () => {
    const spec = FRESH_SPECS.hit!;
    expect(spec.perHit).toBe(true);
    expect(spec.marks('ffx')).toEqual([0.3]);
    const before = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
    before.variant = 'sword';
    before.begin();
    spec.draw(before, 0.25, T);
    const after = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
    after.variant = 'sword';
    after.begin();
    spec.draw(after, 0.34, T);
    expect(after.count).toBeGreaterThan(before.count); // the sparks are born at contact
  });

  it('REDUCE FLASHES: the washes and the big glows are capped, and Thunder strikes once', () => {
    for (const id of FRESH_IDS) {
      const s = sweep(id, 'ffx', { flash: REDUCED_FLASH_PARAMS, variant: id === 'hit' ? 'greatsword' : '' });
      expect(s.maxWash, id).toBeLessThanOrEqual(REDUCED_FLASH_PARAMS.washCap + 1e-9);
    }
    const strikes = (flash: typeof DEFAULT_FLASH_PARAMS): number => {
      let n = 0;
      let was = 0;
      for (let t = 0.3; t < 1.2; t += 1 / 120) {
        const o = new FxDrawList('ffx', 1, flash);
        o.begin();
        FRESH_SPECS.thunder!.draw(o, t, T);
        const flashes = o.washes.length;
        if (flashes > 0 && was === 0) n++;
        was = flashes;
      }
      return n;
    };
    expect(strikes(DEFAULT_FLASH_PARAMS)).toBeGreaterThan(strikes(REDUCED_FLASH_PARAMS));
  });

  it('thinning: fewer particles and no trails when the guard asks, never more quads', () => {
    for (const id of ['fire', 'ice', 'thunder', 'cure', 'haste', 'protect', 'dispel'] as const) {
      const full = sweep(id, 'ffx', { dens: 1, trailK: 1 }).peak;
      const thin = sweep(id, 'ffx', { dens: 0.5, trailK: 0 }).peak;
      expect(thin, id).toBeLessThanOrEqual(full);
    }
    const o = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
    o.trailK = 0;
    expect(o.trail(10)).toBe(0);
    o.trailK = 0.5;
    expect(o.trail(10)).toBe(5);
    o.trailK = 1;
    expect(o.trail(1)).toBe(2); // a trail is two segments or none
  });

  it('is deterministic: the same time gives the same list, twice', () => {
    for (const id of FRESH_IDS) {
      const one = (): string => {
        const o = new FxDrawList('ffx2', 1, DEFAULT_FLASH_PARAMS);
        o.paint = 1;
        o.variant = id === 'hit' ? 'dagger' : '';
        o.begin();
        FRESH_SPECS[id]!.draw(o, 0.52, T);
        return JSON.stringify(o.items.map((i) => [i.tile, Math.round(i.x * 100), Math.round(i.y * 100), i.seed, i.paint]));
      };
      expect(one(), id).toBe(one());
    }
  });
});
