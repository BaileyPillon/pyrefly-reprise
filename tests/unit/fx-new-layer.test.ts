/**
 * The spell layer with the new effects (motion pass, lane "fx"; Bailey 2026-10-22): the switch and the demo-chapter gate, the copies it starts (fresh or today's), the weapon and item
 * variants, the staggered columns, the guard's scale step and the chapter name it keeps while it lives. No GPU: the layer is driven through `land`, `update` and `drawList`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { SpellFxLayer, type SpellFxLayerOptions } from '../../src/engine/spellfx/SpellFxLayer.ts';
import { fxChapter, fxNewOn, setFxChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { FRESH_SPECS } from '../../src/engine/spellfx/SpellFxFresh.ts';
import { fxShare, HOLD, WINDOW } from '../../src/engine/spellfx/FxPerfGuard.ts';
import type { FreshWatch } from '../../src/engine/spellfx/SpellFxFreshLayer.ts';

afterEach(() => {
  setFxMode(null);
  setFxChapter(undefined);
  fxShare.particles = fxShare.trails = 1;
});

/** The party on the left, the foe on the right, 1600 x 900. */
const RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  tidus: { x: 300, y: 380, w: 160, h: 280 },
  yuna: { x: 480, y: 420, w: 150, h: 270 },
  kimahri: { x: 220, y: 450, w: 170, h: 290 },
  'seymour-flux': { x: 1000, y: 200, w: 300, h: 420 },
};

function makeLayer(extra: Partial<SpellFxLayerOptions> = {}, game: 'ffx' | 'ffx2' = 'ffx'): SpellFxLayer {
  return new SpellFxLayer({
    game,
    rectOf: (id) => RECTS[id] ?? null,
    view: () => ({ w: 1600, h: 900 }),
    quality: () => 'full',
    ...extra,
  });
}

const demo = (chapter = 'seymour-flux'): void => {
  setFxMode('new');
  setFxChapter(chapter);
};

describe('the layer with the new effects off', () => {
  it('draws today\'s effects and the old bloom for the buffs, with no painted finish', () => {
    setFxMode('today');
    setFxChapter('seymour-flux');
    const layer = makeLayer();
    expect(layer.resolve({ abilityId: 'haste' })).toBe('bloom');
    expect(layer.land('tidus', { abilityId: 'haste', action: 1, targets: ['tidus'] })).toBe(0);
    expect(layer.snapshot().running).toHaveLength(0);
    expect(layer.land('tidus', { abilityId: 'cure', action: 2, targets: ['tidus'], heal: true })).toBeGreaterThan(0);
    layer.update(0.3);
    const list = layer.drawList()!;
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.items.every((i) => !i.paint)).toBe(true);
    expect(layer.snapshot().running.every((r) => !r.fresh)).toBe(true);
    expect(layer.snapshot().fx.new).toBe(false);
  });

  it('is the same with the switch on in a chapter that is not a demo chapter', () => {
    demo('evrae');
    const layer = makeLayer();
    expect(fxNewOn()).toBe(false);
    expect(layer.resolve({ abilityId: 'protect' })).toBe('bloom');
    expect(layer.resolve({ abilityId: 'cure', heal: true })).toBe('cure');
    layer.land('tidus', { abilityId: 'cure', action: 1, targets: ['tidus'], heal: true });
    expect(layer.snapshot().running.every((r) => !r.fresh)).toBe(true);
  });
});

describe('the layer with the new effects on', () => {
  it('draws the buffs instead of the bloom, in both games, with the painted finish on every quad', () => {
    demo();
    const layer = makeLayer();
    for (const id of ['haste', 'shell', 'protect', 'reflect', 'dispel']) {
      const ms = layer.land('tidus', { abilityId: id, action: 10, targets: ['tidus'] });
      expect(ms, id).toBeGreaterThan(0);
      expect(ms, id).toBeLessThanOrEqual(900);
      layer.update(0.5);
      const list = layer.drawList()!;
      expect(list.items.length, id).toBeGreaterThan(0);
      expect(list.items.some((i) => (i.paint ?? 0) > 0), id).toBe(true);
      layer.clear();
    }
    demo('ffx2-bahamut');
    const x2 = makeLayer({}, 'ffx2');
    expect(x2.land('rikku', { abilityId: 'x2-white-mage-shell', action: 1, targets: ['rikku'] })).toBe(0); // rikku is not on this field
    RECTS['rikku'] = { x: 400, y: 400, w: 150, h: 270 };
    expect(x2.land('rikku', { abilityId: 'x2-white-mage-shell', action: 2, targets: ['rikku'] })).toBeGreaterThan(0);
    delete RECTS['rikku'];
  });

  it('a copy is fresh for life: switching off mid-effect does not change a copy already playing', () => {
    demo();
    const layer = makeLayer();
    layer.land('tidus', { abilityId: 'fire', action: 3, targets: ['tidus'] });
    setFxMode('today');
    layer.update(0.6);
    const list = layer.drawList()!;
    expect(layer.snapshot().running[0]!.fresh).toBe(true);
    expect(list.items.some((i) => (i.paint ?? 0) > 0)).toBe(true);
  });

  it('the numeral never waits longer than for today\'s effect (the mark, capped at the old 900 ms)', () => {
    demo();
    const layer = makeLayer();
    for (const [id, heal] of [['cure', true], ['fire', false], ['blizzard', false], ['thunder', false], ['haste', false], ['attack', false]] as const) {
      const ms = layer.land('seymour-flux', { abilityId: id, action: 40, targets: ['seymour-flux'], heal, sourceId: 'tidus' });
      expect(ms, id).toBeGreaterThan(0);
      expect(ms, id).toBeLessThanOrEqual(900);
      layer.clear();
    }
  });

  it('a blow carries the weapon of its striker and the way it goes', () => {
    demo();
    const kinds: Record<string, string | null> = { tidus: 'sword', kimahri: 'spear', yuna: 'staff' };
    const layer = makeLayer({ weaponOf: (id) => kinds[id] ?? null });
    layer.land('seymour-flux', { abilityId: 'attack', action: 5, targets: ['seymour-flux'], sourceId: 'kimahri', hitIndex: 0 });
    layer.land('seymour-flux', { abilityId: 'attack', action: 6, targets: ['seymour-flux'], sourceId: 'seymour-flux', hitIndex: 0 });
    layer.land('tidus', { abilityId: 'attack', action: 7, targets: ['tidus'], sourceId: 'seymour-flux', hitIndex: 0 });
    const run = layer.snapshot().running;
    expect(run.map((r) => r.variant)).toEqual(['spear', 'generic', 'generic']);
    expect(run.every((r) => r.id === 'hit' && r.fresh)).toBe(true);
    // the party stands left of the foe: the blow goes left to right; the foe's blow on a party member goes the other way
    const dirs = (layer as unknown as { running: Array<{ dir: number }> }).running.map((r) => r.dir);
    expect(dirs).toEqual([1, 1, -1]);
  });

  it('an item\'s heal is the small form of the column; a Phoenix Down the warm one', () => {
    demo();
    const layer = makeLayer();
    layer.land('tidus', { abilityId: 'potion', heal: true, item: true, action: 8, targets: ['tidus'] });
    layer.land('yuna', { abilityId: 'phoenix-down', heal: true, item: true, action: 9, targets: ['yuna'] });
    layer.land('kimahri', { abilityId: 'cure', heal: true, action: 10, targets: ['kimahri'] });
    expect(layer.snapshot().running.map((r) => r.variant)).toEqual(['potion', 'phoenix', '']);
  });

  it('a party-wide FFX Cure draws one column per character in turn; FFX-2\'s does not', () => {
    demo();
    const layer = makeLayer();
    layer.land('tidus', { abilityId: 'curaga', heal: true, action: 11, targets: ['tidus', 'yuna', 'kimahri'] });
    const t = layer.snapshot().running.map((r) => r.t);
    const s = FRESH_SPECS.cure!.staggerFor!('ffx');
    expect(t[0]).toBeCloseTo(0, 3);
    expect(t[1]).toBeCloseTo(-s, 3);
    expect(t[2]).toBeCloseTo(-2 * s, 3);
    // a copy that has not begun draws nothing yet: at 0.25 s the third (still at -0.11 s) is not up; 0.2 s later all three are
    layer.update(0.25);
    const two = layer.drawList()!.items.length;
    expect(two).toBeGreaterThan(0);
    layer.update(0.2);
    const live = (layer as unknown as { running: Array<{ t: number }> }).running;
    expect(live.every((r) => r.t >= 0)).toBe(true);
    expect(layer.drawList()!.items.length).toBeGreaterThan(two);
  });

  it('the debug trigger plays an effect in either mode and refuses ids it does not have', () => {
    demo();
    const layer = makeLayer();
    expect(layer.play('cure', 'tidus', 0.5, [], '')).toBe(true);
    expect(layer.play('haste', 'tidus', 0.3)).toBe(true);
    expect(layer.play('hit', 'seymour-flux', 0.34, ['tidus'], 'sword')).toBe(true);
    expect(layer.play('nope', 'tidus')).toBe(false);
    expect(layer.snapshot().running.map((r) => [r.id, r.variant])).toEqual([['cure', ''], ['haste', ''], ['hit', 'sword']]);
    setFxMode('today');
    expect(layer.play('haste', 'tidus', 0.3)).toBe(false); // the buffs exist only in the new set
    expect(layer.play('cure', 'tidus', 0.3)).toBe(true);
  });
});

describe('the layer\'s guard and chapter name', () => {
  it('names its chapter to the switch while it lives, and lets go when it is disposed', () => {
    setFxMode('new');
    const a = makeLayer({ chapterId: 'seymour-flux' });
    expect(fxChapter()).toBe('seymour-flux');
    expect(fxNewOn()).toBe(true);
    const b = makeLayer({ chapterId: 'ffx2-bahamut' }, 'ffx2'); // the next battle names its own before the last is disposed
    expect(fxChapter()).toBe('ffx2-bahamut');
    a.dispose();
    expect(fxChapter()).toBe('ffx2-bahamut'); // an older layer does not wipe the newer one's
    b.dispose();
    expect(fxChapter()).toBeUndefined();
    expect(fxNewOn()).toBe(false);
  });

  it('feeds the guard from the drawn frames, passes the scale step on once, and gives the scale back at the end', () => {
    demo();
    const calls: number[] = [];
    const layer = makeLayer({ scaleCut: (f) => void calls.push(f) });
    layer.land('seymour-flux', { abilityId: 'fire', action: 1, targets: ['seymour-flux'] });
    const scaleCut = (f: number): void => void calls.push(f);
    const watch = (now: number, busy: boolean): void => (layer as unknown as { watch: FreshWatch }).watch.frame(now, busy, scaleCut);
    let now = 1000;
    for (let i = 0; i < 60; i++) watch((now += 1000 / 120), false);
    expect(calls).toEqual([]);
    for (let i = 0; i < (WINDOW + HOLD) * 12; i++) watch((now += 1000 / 70), true);
    expect(calls).toEqual([0.9, 0.8]); // each step once, in order, nothing repeated
    expect(fxShare.particles).toBeLessThan(1);
    expect(layer.snapshot().fx.guard.level).toBe(2);
    layer.dispose();
    expect(calls).toEqual([0.9, 0.8, 1]);
    expect(fxShare.particles).toBe(1);
  });

  it('thins the particles it draws once the guard has stepped, and never draws more', () => {
    demo();
    const layer = makeLayer();
    layer.play('fire', 'seymour-flux', 0.9);
    layer.update(0);
    const before = layer.drawList()!.items.length;
    const g = (layer as unknown as { watch: FreshWatch }).watch.guard;
    for (let i = 0; i < 60; i++) g.frame(1000 / 120, false);
    for (let i = 0; i < (WINDOW + HOLD) * 3; i++) g.frame(1000 / 70, true);
    expect(g.level).toBe(2);
    const after = layer.drawList()!.items.length;
    expect(after).toBeLessThan(before);
  });
});
