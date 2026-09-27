// @vitest-environment jsdom
/**
 * FF7's effects (FF7 only; D-260 "Spectacle, built on A3 plus", D-244 B1's hit
 * flash and knock-back): every effect drawn off the GPU through the house
 * spell-FX list, inside the particle budget at full and phone quality, the calm
 * version (reduced motion) thinner with no wash, the lookup by FF7 ability id,
 * FFX and FFX-2 never drawing an FF7 effect, and the director's hit flash,
 * knock-back, cast light, shake and single flash frame.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FxDrawList } from '../../src/engine/spellfx/FxDrawList.ts';
import { FX_SPECS, drawSpellFx, type FxTarget } from '../../src/engine/spellfx/SpellFxTimeline.ts';
import { DEFAULT_FLASH_PARAMS, PEAK_BUDGET, QUALITY_DENSITY } from '../../src/engine/spellfx/SpellFxParams.ts';
import { resolveAbilityFx } from '../../src/engine/spellfx/SpellFxLookup.ts';
import { SpellFxLayer } from '../../src/engine/spellfx/SpellFxLayer.ts';
import { FF7_BIG_HITS, FF7_FX_IDS, ff7FxFor, type Ff7FxId } from '../../src/engine/spellfx/ff7/ff7FxSpecs.ts';
import { FF7_CALM_FLASH, Ff7FxDirector, flashFrame } from '../../src/app/screens/battleFf7Fx.ts';
import { FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

/** Guard Scorpion (tail down) and the two party members at 1600x900, as the Film layout stands them. */
const BOSS = { x: 860, y: 280, w: 700, h: 340 };
const CLOUD = { x: 380, y: 320, w: 150, h: 300 };
const BARRET = { x: 170, y: 250, w: 160, h: 318 };
const T = (r: { x: number; y: number; w: number; h: number }, members?: Array<typeof r>): FxTarget => ({
  ...r,
  cx: r.x + r.w / 2,
  cy: r.y + r.h * 0.45,
  fx: r.x + r.w / 2,
  fy: r.y + r.h * 0.97,
  sc: r.h / 360,
  k: 1,
  ...(members ? { members, party: { x: members[0]!.x + members[0]!.w / 2, y: members[0]!.y + members[0]!.h * 0.75 } } : {}),
});

/** Where each effect is drawn: on its target, or from its caster onto its targets. */
const FRAME: Record<Ff7FxId, FxTarget> = {
  'ff7-bolt': T(BOSS),
  'ff7-ice': T(BOSS),
  'ff7-cure': T(CLOUD),
  'ff7-slash': T(BOSS),
  'ff7-shot': T(BARRET, [BOSS]),
  'ff7-braver': T(BOSS),
  'ff7-bigshot': T(BARRET, [BOSS]),
  'ff7-scope': T(BOSS, [CLOUD]),
  'ff7-rifle': T(BOSS, [CLOUD]),
  'ff7-tail': T(BOSS, [BARRET]),
  'ff7-laser': T(BOSS, [BARRET, CLOUD]),
};

function sweep(id: Ff7FxId, dens: number, flash = DEFAULT_FLASH_PARAMS) {
  const spec = FX_SPECS[id];
  let peak = 0;
  let total = 0;
  let washes = 0;
  for (let t = 0; t <= spec.end; t += 1 / 60) {
    const out = new FxDrawList('ff7', dens, flash);
    drawSpellFx(id, out, t, FRAME[id]);
    peak = Math.max(peak, out.count);
    total += out.count;
    washes += out.washes.filter((w) => w.a > 0.003).length;
    for (const it of out.items) {
      expect(Number.isFinite(it.x) && Number.isFinite(it.y) && Number.isFinite(it.w), `${id} at ${t.toFixed(2)}: finite quads`).toBe(true);
    }
  }
  return { peak, total, washes };
}

describe('FF7 effects: Spectacle on A3 plus, through the house particle system', () => {
  it('draws the nine moves of the options round (and the two attacks), each with a mark inside its length', () => {
    expect([...FF7_FX_IDS].sort()).toEqual(['ff7-bigshot', 'ff7-bolt', 'ff7-braver', 'ff7-cure', 'ff7-ice', 'ff7-laser', 'ff7-rifle', 'ff7-scope', 'ff7-shot', 'ff7-slash', 'ff7-tail']);
    for (const id of FF7_FX_IDS) {
      const spec = FX_SPECS[id];
      const [mark] = spec.marks('ff7');
      expect(mark, id).toBeGreaterThan(spec.startAt);
      expect(mark!, id).toBeLessThan(spec.end);
    }
  });

  for (const id of FF7_FX_IDS) {
    it(`${id}: inside the peak budget at full and phone quality; the calm version is thinner and never washes`, () => {
      const full = sweep(id, QUALITY_DENSITY.full);
      const phone = sweep(id, QUALITY_DENSITY.phone);
      const calm = sweep(id, QUALITY_DENSITY.full, FF7_CALM_FLASH);
      expect(full.peak).toBeGreaterThan(8);
      expect(full.peak).toBeLessThanOrEqual(PEAK_BUDGET.full);
      expect(phone.peak).toBeLessThanOrEqual(PEAK_BUDGET.phone);
      expect(calm.total).toBeLessThan(full.total);
      expect(calm.washes).toBe(0);
    });
  }

  it('the lock-on is calm by design (no wash at full quality either); the two big hits are Tail Laser and Braver', () => {
    expect(sweep('ff7-scope', 1).washes).toBe(0);
    expect([...FF7_BIG_HITS].sort()).toEqual(['ff7-braver', 'ff7-laser']);
  });
});

describe('which effect an FF7 action draws', () => {
  it('by the engine ability id; Attack by who struck (Cloud slashes, Barret shoots); a heal draws Cure', () => {
    expect(ff7FxFor('bolt', 'cloud', false)).toBe('ff7-bolt');
    expect(ff7FxFor('tail-laser', 'guard-scorpion', false)).toBe('ff7-laser');
    expect(ff7FxFor('search-scope', 'guard-scorpion', false)).toBe('ff7-scope');
    expect(ff7FxFor('big-shot', 'barret', false)).toBe('ff7-bigshot');
    expect(ff7FxFor('attack', 'cloud', false)).toBe('ff7-slash');
    expect(ff7FxFor('attack', 'barret', false)).toBe('ff7-shot');
    expect(ff7FxFor('item:potion', 'cloud', true)).toBe('ff7-cure');
    expect(ff7FxFor('raise-tail', 'guard-scorpion', false)).toBe('bloom');
  });

  it('FF7 ids resolve only in FF7; FFX and FFX-2 never draw an FF7 effect (rule 14)', () => {
    expect(resolveAbilityFx('bolt', 'ff7')).toBe('ff7-bolt');
    expect(resolveAbilityFx('attack', 'ff7', undefined, false, 'barret')).toBe('ff7-shot');
    expect(resolveAbilityFx('thunder', 'ffx')).toBe('thunder');
    expect(resolveAbilityFx('cure', 'ffx')).toBe('cure');
    expect(resolveAbilityFx('x2-white-mage-cure', 'ffx2')).toBe('cure');
    for (const game of ['ffx', 'ffx2'] as const) {
      for (const id of ['bolt', 'ice', 'attack', 'tail-laser', 'search-scope', 'braver']) expect(resolveAbilityFx(id, game).startsWith('ff7-'), `${game} ${id}`).toBe(false);
    }
  });

  it('the layer sweeps Tail Laser as one copy over both members, and reports each landing', () => {
    const lands: Array<[string, string, number]> = [];
    const rects: Record<string, { x: number; y: number; w: number; h: number }> = { 'guard-scorpion': BOSS, cloud: CLOUD, barret: BARRET };
    const layer = new SpellFxLayer({ game: 'ff7', rectOf: (id) => rects[id] ?? null, view: () => ({ w: 1600, h: 900 }), onLand: (fx, target, ms) => lands.push([fx, target, ms]) });
    const o = { abilityId: 'tail-laser', targets: ['cloud', 'barret'], action: 7, sourceId: 'guard-scorpion' };
    const ms1 = layer.land('cloud', o);
    const ms2 = layer.land('barret', o);
    expect(ms1).toBeGreaterThan(500);
    expect(ms2).toBe(ms1);
    expect(layer.snapshot().running).toHaveLength(1);
    expect(lands.map((l) => l.slice(0, 2))).toEqual([['ff7-laser', 'cloud'], ['ff7-laser', 'barret']]);
  });
});

describe('the director: B1 hit flash and knock-back, cast light, shake and one flash frame', () => {
  function rig(calm = false) {
    const stage = new FakeStage(['cloud', 'barret'], ['guard-scorpion']);
    const timers: Array<() => void> = [];
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const d = new Ff7FxDirector(() => stage, () => 1, () => canvas, () => calm, (fn) => void timers.push(fn));
    return { stage, d, run: () => timers.splice(0).forEach((f) => f()), canvas };
  }

  it('Braver: a white flash and a knock-back on the boss, light on the party, a shake and one flash frame', () => {
    const { stage, d, run } = rig();
    d.onLand('ff7-braver', 'guard-scorpion', 400, { action: 3 });
    run();
    expect(stage.calls).toContain('flash:guard-scorpion');
    expect(stage.calls).toContain('lunge:guard-scorpion');
    expect(stage.calls).toContain('camera:shake');
    expect(d.played).toMatchObject({ flashFrames: 1, shakes: 1, hits: 1 });
    // A second landing in the same action does not flash again (never repeated).
    d.onLand('ff7-braver', 'guard-scorpion', 0, { action: 3 });
    run();
    expect(d.played.flashFrames).toBe(1);
  });

  it('the calm version: the hit flash stays (capped), no shake, no flash frame', () => {
    const { d, run } = rig(true);
    d.onLand('ff7-laser', 'cloud', 600, { action: 4 });
    run();
    expect(d.played).toMatchObject({ flashFrames: 0, shakes: 0, hits: 1 });
  });

  it('Search Scope lands nothing (no damage, no flash, no shake)', () => {
    const { d, run } = rig();
    d.onLand('ff7-scope', 'cloud', 0, { action: 5 });
    run();
    expect(d.played.hits).toBe(0);
  });

  it('the flash frame is one white layer beside the canvas, gone after the next painted frame', async () => {
    const host = document.createElement('div');
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    document.body.appendChild(host);
    flashFrame(canvas);
    expect(host.querySelectorAll('.ff7-flash-frame')).toHaveLength(1);
    await new Promise((r) => setTimeout(r, 120));
    expect(host.querySelectorAll('.ff7-flash-frame')).toHaveLength(0);
  });
});
