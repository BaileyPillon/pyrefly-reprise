/**
 * Eye-candy option C, "Spectacle Combat" (options round 2026-09-29, `?fx=c`): the pure parts.
 * Per-game rules (FFX gold and calm, FFX-2 pink and quick), the flash budget, the victory arc
 * (Chapter IV holds), the trauma camera and hit-stop clocks, the lightning paths, and the
 * presenter hooks being no-ops without the port (every build without `?fx=c` is main exactly).
 */

import { describe, expect, it } from 'vitest';
import { FlashBudget, planHit, planVictory, spellLayerOf, type HitInfo, type SpectacleFlags } from '../../src/engine/fx/c/SpectacleRules.ts';
import { HitStop, Trauma } from '../../src/engine/fx/c/Trauma.ts';
import { boltPath } from '../../src/engine/fx/c/Lightning.ts';
import { fxActionOpen, fxDissolve, fxHit, fxVictory } from '../../src/engine/fx/c/presenterHooks.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';

const flags = (o: Partial<SpectacleFlags> = {}): SpectacleFlags => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1, ...o });
const hit = (o: Partial<HitInfo> = {}): HitInfo => ({ crit: false, heavy: false, hitIndex: 0, hitCount: 1, big: false, speed: 'normal', ...o });

describe('option C rules', () => {
  it('FFX holds on every heavy blow; FFX-2 only on a crit, never on chain hits 2+', () => {
    expect(planHit('ffx', hit({ heavy: true }), flags()).freezeMs).toBe(85);
    expect(planHit('ffx2', hit({ heavy: true }), flags()).freezeMs).toBe(28); // the light first-hit hold only
    expect(planHit('ffx2', hit({ heavy: true, crit: true }), flags()).freezeMs).toBe(55);
    expect(planHit('ffx2', hit({ crit: true, heavy: true, hitIndex: 2, hitCount: 4 }), flags()).freezeMs).toBe(0);
  });

  it('never holds at fast or skip speed, nor under reduce motion', () => {
    expect(planHit('ffx', hit({ heavy: true, speed: 'fast' }), flags()).freezeMs).toBe(0);
    expect(planHit('ffx', hit({ heavy: true, speed: 'skip' }), flags()).freezeMs).toBe(0);
    const rm = planHit('ffx', hit({ heavy: true }), flags({ reduceMotion: true }));
    expect(rm.freezeMs).toBe(0);
    expect(rm.trauma).toBe(0);
    expect(rm.impactFrame).toBeNull();
    expect(rm.kick).toBe(0);
  });

  it('REDUCE FLASHES turns the impact frame soft; Low effects keeps today\'s burst and no spell layer', () => {
    expect(planHit('ffx', hit({ heavy: true }), flags()).impactFrame).toBe('full');
    expect(planHit('ffx', hit({ heavy: true }), flags({ reduceFlashes: true })).impactFrame).toBe('soft');
    const low = planHit('ffx', hit({ element: 'fire' }), flags({ tier: 'low' }));
    expect(low.streaks).toBe(0);
    expect(low.spell).toBeNull();
  });

  it('the phone tier draws 60 % of the streaks', () => {
    const full = planHit('ffx', hit(), flags()).streaks;
    const phone = planHit('ffx', hit(), flags({ tier: 'phone' })).streaks;
    expect(phone).toBe(Math.round(full * 0.6));
  });

  it('folds the engine elements onto the layers; non-elemental magic gets the nova', () => {
    expect(spellLayerOf('lightning')).toBe('thunder');
    expect(spellLayerOf('none')).toBeNull();
    expect(planHit('ffx', hit({ magic: true }), flags()).spell).toBe('nova');
    expect(planHit('ffx', hit({ magic: false }), flags()).spell).toBeNull();
  });

  it('the flash budget: one impact frame per action, three per second', () => {
    const b = new FlashBudget(3);
    expect(b.take(0, 1)).toBe(true);
    expect(b.take(10, 1)).toBe(false);
    expect(b.take(20, 2)).toBe(true);
    expect(b.take(30, 3)).toBe(true);
    expect(b.take(40, 4)).toBe(false);
    expect(b.take(1200, 5)).toBe(true);
  });

  it('the victory arc: 12 degrees (8 on the phone); Chapter IV holds with a push only; none under reduce motion', () => {
    expect(planVictory('ffx', 'pose', flags())?.yawDeg).toBe(12);
    expect(planVictory('ffx2', 'pose', flags())?.yawDeg).toBe(-12);
    expect(planVictory('ffx', 'pose', flags({ tier: 'phone' }))?.yawDeg).toBe(8);
    const hold = planVictory('ffx2', 'hold', flags());
    expect(hold?.yawDeg).toBe(0);
    expect(hold?.sparkleSweep).toBe(false);
    expect(planVictory('ffx', 'pose', flags({ reduceMotion: true }))).toBeNull();
  });
});

describe('option C clocks', () => {
  it('trauma decays and its offset scales with trauma squared', () => {
    const t = new Trauma({ max: 0.2, rollMaxDeg: 2, hz: 20, decay: 2 });
    t.add(1);
    t.update(0.1);
    expect(t.amount).toBeCloseTo(0.8, 5);
    const o = t.offset();
    expect(Math.abs(o.x)).toBeLessThanOrEqual(0.2 * 0.64 + 1e-9);
    t.update(1);
    expect(t.amount).toBe(0);
  });

  it('hit-stop holds the field for its length, then hands back the rest of the frame', () => {
    const s = new HitStop();
    s.freeze(40);
    expect(s.scale(1 / 60)).toBe(0);
    expect(s.scale(1 / 60)).toBe(0);
    expect(s.scale(1 / 60)).toBeCloseTo(3 / 60 - 0.04, 6);
    expect(s.frozen).toBe(false);
  });
});

describe('option C lightning', () => {
  it('keeps both endpoints and forks the requested branches', () => {
    let seed = 7;
    const rand = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const segs = boltPath([0, 9, 0], [1, 1, 0], { depth: 4, branches: 3, rand });
    const main = segs.filter((s) => s.weight === 1);
    expect(main).toHaveLength(16);
    expect(main[0]!.a).toEqual([0, 9, 0]);
    expect(main[main.length - 1]!.b).toEqual([1, 1, 0]);
    expect(segs.length).toBeGreaterThan(main.length);
  });
});

describe('option C presenter hooks without the port', () => {
  it('are no-ops, so the beats keep today\'s shake, hit-stop and victory', async () => {
    const ctx = { stage: {}, deps: {}, speed: () => 'normal' } as unknown as EventCtx;
    await fxActionOpen(ctx, { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' }, abilityName: 'Spiral Cut', targets: [] } as never);
    expect(fxHit(ctx, { type: 'damage', targetId: 'x', amount: 10, crit: true, hitIndex: 0, hitCount: 1 } as never, true)).toBeNull();
    expect(fxVictory(ctx, 'pose')).toBe(0);
    expect(() => fxDissolve(ctx, 'x')).not.toThrow();
  });

  it('are no-ops when the port is there but option C is switched off', () => {
    const ctx = { stage: { fx: { enabled: () => false, hit: () => ({ freezeMs: 99, shook: true }) } }, deps: {}, speed: () => 'normal' } as unknown as EventCtx;
    expect(fxHit(ctx, { type: 'damage', targetId: 'x', amount: 10, crit: true, hitIndex: 0, hitCount: 1 } as never, true)).toBeNull();
  });
});
