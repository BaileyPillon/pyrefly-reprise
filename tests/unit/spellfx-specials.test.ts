/**
 * D-233 (Bailey, 2026-09-26: "i'll go with all of your recommends"): the two
 * special moments as particles in the option-B language. Spiral Cut is FFX only
 * (Tidus's Overdrive, the gold skin); Mega Flare is FFX-2 only (Bahamut's
 * special in Chapter IV, the pink skin). FFX's own Mega Flares (the aeon's and
 * Isaaru's Spathi) keep what they had: the pick does not carry over to them.
 *
 * Also the spell-effect minors from the iter2-spellfx-b check: the effect clock
 * follows the playback speed, and a crit keeps its 1.3x bloom.
 */
import { describe, expect, it } from 'vitest';
import { FxDrawList } from '../../src/engine/spellfx/FxDrawList.ts';
import { FX_SPECS, drawSpellFx, type FxTarget } from '../../src/engine/spellfx/SpellFxTimeline.ts';
import { DEFAULT_FLASH_PARAMS, PEAK_BUDGET, QUALITY_DENSITY } from '../../src/engine/spellfx/SpellFxParams.ts';
import { resolveAbilityFx } from '../../src/engine/spellfx/SpellFxLookup.ts';
import { SpellFxLayer } from '../../src/engine/spellfx/SpellFxLayer.ts';
import { SPECIAL_HOLD_CAP_MS, SPEED_RATE } from '../../src/engine/spellfx/SpellFxSpecials.ts';
import type { FxGame } from '../../src/engine/spellfx/SpellFxRegistry.ts';

const BAHAMUT: FxTarget = { x: 900, y: 120, w: 420, h: 560, cx: 1110, cy: 372, fx: 1110, fy: 663, sc: 560 / 360, k: 1, party: { x: 540, y: 700 } };

function sweep(id: 'spiral' | 'megaflare', game: FxGame, dens: number) {
  let peak = 0;
  const tiles = new Set<string>();
  const cols = new Set<string>();
  for (let t = 0; t <= FX_SPECS[id].end; t += 1 / 60) {
    const out = new FxDrawList(game, dens, DEFAULT_FLASH_PARAMS);
    drawSpellFx(id, out, t, BAHAMUT);
    peak = Math.max(peak, out.count);
    for (const i of out.items) {
      tiles.add(i.tile);
      cols.add(i.col.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join(''));
    }
  }
  return { peak, tiles, cols };
}

function layer(game: FxGame, rate = 1) {
  const rects: Record<string, { x: number; y: number; w: number; h: number }> = {
    tidus: { x: 380, y: 480, w: 160, h: 300 },
    yuna: { x: 540, y: 500, w: 150, h: 290 },
    auron: { x: 700, y: 470, w: 170, h: 310 },
    boss: { x: 900, y: 120, w: 420, h: 560 },
  };
  return new SpellFxLayer({ game, rectOf: (id) => rects[id] ?? null, view: () => ({ w: 1600, h: 900 }), rate: () => rate });
}

describe('special moments (D-233, option A)', () => {
  it('Spiral Cut draws the helix in FFX; Mega Flare draws its beam in FFX-2; each only in its own game', () => {
    expect(resolveAbilityFx('spiral-cut', 'ffx')).toBe('spiral');
    expect(resolveAbilityFx('mega-flare', 'ffx2')).toBe('megaflare');
    expect(resolveAbilityFx('x2-bahamut-mega-flare', 'ffx2')).toBe('megaflare');
    // FFX's aeon Bahamut and Isaaru's Spathi keep their old look (rule 14).
    expect(resolveAbilityFx('mega-flare', 'ffx')).not.toBe('megaflare');
    expect(resolveAbilityFx('spathi-mega-flare', 'ffx')).not.toBe('megaflare');
  });

  it('both land about 1.45 s in and last 3.1 s, as mocked', () => {
    expect(FX_SPECS.spiral.marks('ffx')).toEqual([1.43]);
    expect(FX_SPECS.megaflare.marks('ffx2')).toEqual([1.45]);
    expect(FX_SPECS.spiral.end).toBeCloseTo(3.1, 5);
    expect(FX_SPECS.megaflare.end).toBeCloseTo(3.1, 5);
  });

  it('stay inside the particle budget at full and phone quality', () => {
    for (const [id, game] of [['spiral', 'ffx'], ['megaflare', 'ffx2']] as const) {
      expect(sweep(id, game, QUALITY_DENSITY.full).peak, `${id} full`).toBeLessThanOrEqual(PEAK_BUDGET.full);
      expect(sweep(id, game, QUALITY_DENSITY.phone).peak, `${id} phone`).toBeLessThanOrEqual(PEAK_BUDGET.phone);
      expect(sweep(id, game, 1).peak, `${id} reads as a set piece`).toBeGreaterThanOrEqual(100);
    }
  });

  it('Spiral Cut ends on the gold slash with round motes; Mega Flare uses the pink four-point sparkles', () => {
    const s = sweep('spiral', 'ffx', 1);
    expect(s.cols.has('e3b94a')).toBe(true);
    expect(s.tiles.has('mote')).toBe(true);
    expect(s.tiles.has('spark4')).toBe(false);
    const m = sweep('megaflare', 'ffx2', 1);
    expect(m.tiles.has('spark4')).toBe(true);
    expect(m.cols.has('f7b6d9')).toBe(true);
    expect(m.tiles.has('mote')).toBe(false);
  });

  it('Mega Flare is one effect for the whole party, drawn from the caster to the party', () => {
    const l = layer('ffx2');
    const targets = ['tidus', 'yuna', 'auron'];
    const first = l.land('tidus', { abilityId: 'mega-flare', targets, action: 7, sourceId: 'boss' });
    l.land('yuna', { abilityId: 'mega-flare', targets, action: 7, sourceId: 'boss' });
    l.land('auron', { abilityId: 'mega-flare', targets, action: 7, sourceId: 'boss' });
    expect(l.snapshot().running).toHaveLength(1);
    expect(first).toBe(1450);
    expect(l.covers('auron')).toBe(true);
  });

  it('the numeral waits for the landing on the first play; a repeat starts later and adds at most 1.2 s', () => {
    const l = layer('ffx');
    const first = l.land('boss', { abilityId: 'spiral-cut', targets: ['boss'], action: 1 });
    expect(first).toBe(1430);
    expect(first).toBeLessThanOrEqual(SPECIAL_HOLD_CAP_MS);
    l.clear();
    const again = l.land('boss', { abilityId: 'spiral-cut', targets: ['boss'], action: 2 });
    // Today's Spiral Cut is the slash, which waits 100 ms.
    expect(again - 100).toBeLessThanOrEqual(1200);
    expect(again).toBeGreaterThan(0);
  });

  it('the effect clock follows the playback speed (held fast-forward)', () => {
    expect(SPEED_RATE('normal')).toBe(1);
    expect(SPEED_RATE('fast')).toBeCloseTo(1 / 0.32, 5);
    const l = layer('ffx', SPEED_RATE('fast'));
    l.land('boss', { abilityId: 'fire', targets: ['boss'], action: 1 });
    l.update(0.16);
    // 0.16 s of fast-forward is 0.5 s of effect: the column lands with its numeral.
    expect(l.snapshot().running[0]!.t).toBeCloseTo(0.5, 2);
  });

  it('a crit keeps the 1.3x bloom over the figure', () => {
    const glow = (crit: boolean) => {
      const l = layer('ffx');
      l.land('boss', { abilityId: 'attack', targets: ['boss'], action: 1, crit });
      l.update(0.2);
      const list = l.drawList()!;
      return Math.max(...list.items.filter((i) => i.tile === 'glow').map((i) => i.w));
    };
    expect(glow(true) / glow(false)).toBeCloseTo(1.3, 2);
  });
});
