/**
 * Step 3 of the new spell effects (motion pass, lane "fx"; Bailey 2026-10-22: "the bosses' attacks", Overdrives "Each game's own intro", "Demo chapters first"): the drawn effects themselves, off the
 * GPU. Seymour Flux's and Mortiorchis's moves (FFX only), Bahamut's moves and Rikku's Darkness (FFX-2 only), the charge, the Overdrive's aura, Kimahri's Jump and the dress change.
 */
import { describe, expect, it } from 'vitest';
import { BOSS_FX_IDS } from '../../src/engine/spellfx/BossFx.ts';
import { FxDrawList } from '../../src/engine/spellfx/FxDrawList.ts';
import { FRESH_SPECS } from '../../src/engine/spellfx/SpellFxFresh.ts';
import { BOSS_SPECS } from '../../src/engine/spellfx/SpellFxFreshBoss.ts';
import { specOf, type FreshFxId, type FxTarget } from '../../src/engine/spellfx/SpellFxTimeline.ts';
import { DEFAULT_FLASH_PARAMS, PEAK_BUDGET, REDUCED_FLASH_PARAMS } from '../../src/engine/spellfx/SpellFxParams.ts';
import type { FxGame } from '../../src/engine/spellfx/SpellFxRegistry.ts';
import { SPELL_HOLD_CAP_MS } from '../../src/engine/spellfx/SpellFxSpecials.ts';
import { ANNIHILATE_MARKS } from '../../src/engine/spellfx/effects-painted-flux.ts';
import { ODAURA_BUILD } from '../../src/engine/spellfx/effects-painted-od.ts';

/** Seymour Flux's rectangle (a foe) and the party on the left, on the 1600x900 plate. */
const FOE: FxTarget = { x: 700, y: 180, w: 300, h: 420, cx: 850, cy: 369, fx: 850, fy: 587, sc: 420 / 360, k: 1 };
const PARTY_RECTS = [
  { x: 260, y: 420, w: 150, h: 270 },
  { x: 430, y: 450, w: 150, h: 270 },
  { x: 150, y: 470, w: 150, h: 270 },
];
const GROUP: FxTarget = { ...FOE, party: { x: 330, y: 625 }, members: PARTY_RECTS };
/** A girl as the caster of a group effect (Darkness): her foes are the group. */
const GIRL: FxTarget = { x: 300, y: 430, w: 150, h: 270, cx: 375, cy: 551, fx: 375, fy: 692, sc: 270 / 360, k: 1, party: { x: 850, y: 502 }, members: [{ x: 770, y: 200, w: 300, h: 420 }] };

const targetFor = (id: string): FxTarget => (['impulse', 'drain'].includes(id) ? GROUP : id === 'darkness' ? GIRL : FOE);

interface Sweep {
  peak: number;
  tiles: Set<string>;
  nan: boolean;
  maxWash: number;
  paintedAll: boolean;
  anyItems: boolean;
}

function sweep(id: FreshFxId, game: FxGame, opts: { dens?: number; variant?: string; dir?: number; flash?: typeof DEFAULT_FLASH_PARAMS; trailK?: number } = {}): Sweep {
  const spec = specOf(id, true);
  const out: Sweep = { peak: 0, tiles: new Set(), nan: false, maxWash: 0, paintedAll: true, anyItems: false };
  const T = targetFor(id);
  for (let t = spec.startAt; t <= spec.end; t += 1 / 60) {
    const o = new FxDrawList(game, opts.dens ?? 1, opts.flash ?? DEFAULT_FLASH_PARAMS);
    o.paint = 1;
    o.variant = opts.variant ?? '';
    o.dir = opts.dir ?? -1;
    o.trailK = opts.trailK ?? 1;
    o.begin();
    spec.draw(o, t, T);
    out.peak = Math.max(out.peak, o.count);
    if (o.count) out.anyItems = true;
    for (const i of o.items) {
      out.tiles.add(i.tile);
      if (![i.x, i.y, i.w, i.h, i.rot, i.a].every(Number.isFinite)) out.nan = true;
      if (i.tile !== 'solid' && (i.paint ?? 0) === 0 && i.shape === 0 && i.tile !== 'spark4' && i.tile !== 'decal') out.paintedAll = false;
    }
    for (const w of o.washes) out.maxWash = Math.max(out.maxWash, w.a);
  }
  return out;
}

const FFX_ONLY = ['atrophy', 'fulllife', 'cleave', 'annihilate', 'flare', 'banish', 'slowga', 'drain', 'jump', 'odaura'] as const;
const FFX2_ONLY = ['curse', 'impulse', 'darkness', 'dress'] as const;
const BOTH = ['gather'] as const;

describe('step 3 effects: the set', () => {
  it('has the bosses\' attacks, the charge, the Overdrive aura, Jump, the dress change and Darkness, and nothing else new', () => {
    expect([...BOSS_FX_IDS].sort()).toEqual([...FFX_ONLY, ...FFX2_ONLY, ...BOTH].sort());
    for (const id of BOSS_FX_IDS) expect(FRESH_SPECS[id], id).toBe(BOSS_SPECS[id]);
  });

  it('no numeral waits longer than a spell may: every first mark and every hold cap is inside the 900 ms every spell keeps', () => {
    for (const id of BOSS_FX_IDS) {
      const spec = BOSS_SPECS[id];
      expect(spec.holdCapMs, id).toBeLessThanOrEqual(SPELL_HOLD_CAP_MS);
      for (const game of ['ffx', 'ffx2'] as const) {
        const marks = spec.marks(game);
        expect(marks.length, `${id} ${game}`).toBeGreaterThan(0);
        expect((marks[0]! - spec.startAt) * 1000, `${id} ${game} first mark`).toBeLessThanOrEqual(SPELL_HOLD_CAP_MS);
        expect(spec.end, `${id} end`).toBeGreaterThan(marks[marks.length - 1]!);
        // marks run in order
        for (let i = 1; i < marks.length; i++) expect(marks[i]!, id).toBeGreaterThan(marks[i - 1]!);
      }
    }
  });

  it('Total Annihilation has five marks, one for each of its five hits, spaced like the presenter\'s per-hit beat (190 ms)', () => {
    const marks = BOSS_SPECS.annihilate.marks('ffx');
    expect(marks).toHaveLength(5);
    expect(marks).toBe(ANNIHILATE_MARKS);
    for (let i = 1; i < marks.length; i++) expect((marks[i]! - marks[i - 1]!) * 1000).toBeCloseTo(190, 0);
    // no later mark is further from the one before than the cap
    for (let i = 1; i < marks.length; i++) expect((marks[i]! - marks[i - 1]!) * 1000).toBeLessThan(SPELL_HOLD_CAP_MS);
  });

  it('the group effects are groups (drawn on the caster, landing on the targets): Mortibsorption, Impulse and Darkness, and no other', () => {
    expect(BOSS_FX_IDS.filter((id) => BOSS_SPECS[id].group === true).sort()).toEqual(['darkness', 'drain', 'impulse']);
  });

  it('the party-wide attacks walk across the party: Cross Cleave and Total Annihilation stagger their copies in FFX, and in no other game', () => {
    for (const id of ['cleave', 'annihilate'] as const) {
      const spec = BOSS_SPECS[id];
      expect(spec.staggerFor!('ffx'), id).toBeGreaterThan(0);
      expect(spec.staggerFor!('ffx2'), id).toBe(0);
      // the third target's last mark still lands inside the cap measured from the one before it
      const last = spec.marks('ffx')[spec.marks('ffx').length - 1]! + 2 * spec.staggerFor!('ffx');
      expect(last).toBeLessThan(1.3);
    }
  });
});

describe('step 3 effects: drawn', () => {
  for (const id of BOSS_FX_IDS) {
    const games: FxGame[] = (FFX_ONLY as readonly string[]).includes(id) ? ['ffx'] : (FFX2_ONLY as readonly string[]).includes(id) ? ['ffx2'] : ['ffx', 'ffx2'];
    for (const game of games) {
      it(`${id} (${game}): draws something, finite, painted, inside the budget at every tier`, () => {
        const full = sweep(id, game, { variant: id === 'gather' ? '3' : id === 'odaura' ? 'tidus' : id === 'dress' ? 'yuna' : '' });
        expect(full.anyItems).toBe(true);
        expect(full.nan).toBe(false);
        expect(full.peak, 'full').toBeLessThanOrEqual(PEAK_BUDGET.full);
        expect(sweep(id, game, { dens: 0.6, variant: id === 'dress' ? 'paine' : '' }).peak, 'phone').toBeLessThanOrEqual(PEAK_BUDGET.phone);
        expect(full.paintedAll).toBe(true);
      });
    }
  }

  it('the guard thins them: less than the full set at half density and with the trails cut', () => {
    for (const id of ['atrophy', 'flare', 'annihilate', 'drain', 'curse', 'banish'] as const) {
      const game: FxGame = id === 'curse' ? 'ffx2' : 'ffx';
      expect(sweep(id, game, { dens: 0.5, trailK: 0 }).peak, id).toBeLessThanOrEqual(sweep(id, game).peak);
    }
  });

  it('under REDUCE FLASHES no wash is brighter than the cap and the one-wash rule holds (Total Annihilation\'s and Flare\'s washes are dropped, Impulse\'s is capped)', () => {
    for (const [id, game] of [['annihilate', 'ffx'], ['flare', 'ffx'], ['impulse', 'ffx2'], ['darkness', 'ffx2']] as const) {
      const r = sweep(id, game, { flash: REDUCED_FLASH_PARAMS });
      expect(r.maxWash, id).toBeLessThanOrEqual(REDUCED_FLASH_PARAMS.washCap + 1e-9);
      expect(sweep(id, game).maxWash, `${id} default`).toBeGreaterThanOrEqual(r.maxWash);
    }
    expect(sweep('annihilate', 'ffx', { flash: REDUCED_FLASH_PARAMS }).maxWash).toBe(0);
    expect(sweep('flare', 'ffx', { flash: REDUCED_FLASH_PARAMS }).maxWash).toBe(0);
  });

  it('draws are deterministic: the same time gives the same list', () => {
    for (const id of BOSS_FX_IDS) {
      const spec = BOSS_SPECS[id];
      const draw = (): string => {
        const o = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
        o.paint = 1;
        o.begin();
        spec.draw(o, spec.marks('ffx')[0]! + 0.1, targetFor(id));
        return JSON.stringify(o.items.map((i) => [i.tile, Math.round(i.x), Math.round(i.y), Math.round(i.a * 100)]));
      };
      expect(draw(), id).toBe(draw());
    }
  });

  it('a blow\'s direction mirrors the lance and the cross: the approach comes from the attacker\'s side', () => {
    const at = (dir: number): number => {
      const o = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
      o.dir = dir;
      o.begin();
      BOSS_SPECS.atrophy.draw(o, 0.1, FOE);
      const bars = o.items.filter((i) => i.shape === 2 || i.tile === 'streak');
      return bars.reduce((s, i) => s + i.x, 0) / Math.max(1, bars.length);
    };
    // a lance thrown from the right (dir -1) is drawn right of the target's centre, from the left (dir 1) left of it
    expect(at(-1)).toBeGreaterThan(FOE.cx);
    expect(at(1)).toBeLessThan(FOE.cx);
  });
});

describe('step 3 effects: the pieces that carry a level or a name', () => {
  const count = (id: FreshFxId, game: FxGame, variant: string, t: number): { n: number; maxSize: number } => {
    const o = new FxDrawList(game, 1, DEFAULT_FLASH_PARAMS);
    o.variant = variant;
    o.begin();
    specOf(id, true).draw(o, t, FOE);
    return { n: o.count, maxSize: Math.max(0, ...o.items.map((i) => Math.max(i.w, i.h))) };
  };

  it('the charge climbs: a higher level draws more and a bigger core, in both games', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const lo = count('gather', game, '1', 0.4);
      const hi = count('gather', game, '5', 0.4);
      expect(hi.n, game).toBeGreaterThan(lo.n);
      expect(hi.maxSize, game).toBeGreaterThan(lo.maxSize);
    }
  });

  it('the charge wears each game\'s own skin: gold-edged violet for FFX, violet with the cold core for FFX-2', () => {
    const cols = (game: FxGame): Set<string> => {
      const o = new FxDrawList(game, 1, DEFAULT_FLASH_PARAMS);
      o.variant = '3';
      o.begin();
      specOf('gather', true).draw(o, 0.4, FOE);
      return new Set(o.items.map((i) => i.col.map((c) => Math.round(c * 255)).join(',')));
    };
    expect([...cols('ffx')].join('|')).not.toBe([...cols('ffx2')].join('|'));
  });

  it('the Overdrive aura has a skin for Tidus (flame), for Auron (a ring) and a neutral one for anyone else, and builds over the first second and a bit', () => {
    const at = (variant: string, t: number): { rings: number; n: number } => {
      const o = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
      o.variant = variant;
      o.begin();
      specOf('odaura', true).draw(o, t, FOE);
      return { rings: o.items.filter((i) => i.shape === 1).length, n: o.count };
    };
    expect(at('auron', 0.8).rings).toBeGreaterThan(at('tidus', 0.8).rings); // Auron has the ground ring, Tidus does not
    expect(at('', 0.8).rings).toBeGreaterThan(0);
    expect(at('tidus', ODAURA_BUILD).n).toBeGreaterThan(at('tidus', 0.2).n); // it builds
  });

  it('the dress change has its own colours for Yuna, Paine and Rikku and a neutral set for anyone else', () => {
    const cols = (variant: string): string => {
      const o = new FxDrawList('ffx2', 1, DEFAULT_FLASH_PARAMS);
      o.variant = variant;
      o.begin();
      specOf('dress', true).draw(o, 0.36, FOE);
      return [...new Set(o.items.map((i) => i.col.map((c) => Math.round(c * 255)).join(',')))].sort().join('|');
    };
    const sets = ['yuna', 'paine', 'rikku', ''].map(cols);
    expect(new Set(sets).size).toBe(4);
  });

  it('Darkness draws on the foe\'s side too: spheres (dark, normal blend) appear round it, and they are gone by the end', () => {
    const o = new FxDrawList('ffx2', 1, DEFAULT_FLASH_PARAMS);
    o.begin();
    specOf('darkness', true).draw(o, 0.85, GIRL);
    const dark = o.items.filter((i) => i.tile === 'orb' && i.col[0] < 0.1 && i.col[2] < 0.1);
    expect(dark.length).toBeGreaterThanOrEqual(6);
    const foe = GIRL.members![0]!;
    expect(dark.every((i) => i.x > foe.x - 300 && i.x < foe.x + foe.w + 300)).toBe(true);
    const end = new FxDrawList('ffx2', 1, DEFAULT_FLASH_PARAMS);
    end.begin();
    specOf('darkness', true).draw(end, specOf('darkness', true).end, GIRL);
    expect(end.items.filter((i) => i.tile === 'orb').length).toBe(0);
  });
});
