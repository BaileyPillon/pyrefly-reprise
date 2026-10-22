/**
 * DEMO MOTION, part 4 (`?motion=demo`; conference demo; both games): hit feel. The numbers (`motion/DemoHit.ts`), option C's plan with the demo flag (`fx/c/SpectacleRules.planHit`), the presenter's
 * two decisions at the beat (`motion/DemoHitBeat.ts`), and the HitStop clock that carries the stop.
 *
 * The timing contract: a stop only holds the PRESENTATION's field clock. `HitStop.scale` hands the stage a zero dt for its length and the rest of the frame after it; the engine, the RNG and the
 * ATB pump never see it (the unit tests of the engines read no clock of the presenter, and the three goldens stay byte for byte). Without the switch every number is today's.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import { planHit, type HitInfo, type SpectacleFlags } from '../../../src/engine/fx/c/SpectacleRules.ts';
import { HitStop } from '../../../src/engine/fx/c/Trauma.ts';
import { fxHit, type FxStagePort } from '../../../src/engine/fx/c/presenterHooks.ts';
import { DEMO_FLASH_MS, FLASH_AREA_BIG, FLASH_AREA_FULL, FLASH_PEAK_MIN, STOP_FINISHER, STOP_STRONG, STOP_WEAK_MAX, STOP_WEAK_MIN, TODAY_LIGHT_HOLD_MS, blowClass, demoFlashPeak, demoShakeAmplitude, demoStopMs, demoTrauma, hitPower, isMiddleHit, type BlowFacts } from '../../../src/engine/motion/DemoHit.ts';
import { blowFlash, holdBlow } from '../../../src/engine/motion/DemoHitBeat.ts';
import { setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';

afterEach(() => setDemoMotion(null));

const facts = (o: Partial<BlowFacts> = {}): BlowFacts => ({ crit: false, heavy: false, big: false, hitIndex: 0, hitCount: 1, last: true, power: 0.2, ...o });

describe('power: how hard a blow is', () => {
  it('is the damage over 4,000, or over 40 percent of the target\'s HP, whichever is more, up to 1.5', () => {
    expect(hitPower(0)).toBe(0);
    expect(hitPower(-5)).toBe(0);
    expect(hitPower(2000)).toBeCloseTo(0.5, 9);
    expect(hitPower(450, 1100)).toBeCloseTo(450 / 1100 / 0.4, 9); // a girl with 1,100 HP hit for 450 is hit hard
    expect(hitPower(4000, 60000)).toBeCloseTo(1, 9); // a boss with a 60,000 pool is still hit hard by 4,000
    expect(hitPower(99999, 1000)).toBe(1.5);
    expect(hitPower(300, 60000)).toBeLessThan(0.1);
  });
});

describe('the stop', () => {
  it('weak 17 to 30 ms (inside the 0 to 30 of the brief), strong 50 to 80, finisher 100 to 150, across the whole range of power', () => {
    for (let p = 0; p <= 1.5; p += 0.02) {
      const w = demoStopMs(facts({ power: p }));
      const cls = blowClass(facts({ power: p }));
      if (cls === 'weak') {
        expect(w).toBeGreaterThanOrEqual(STOP_WEAK_MIN);
        expect(w).toBeLessThanOrEqual(STOP_WEAK_MAX);
      } else {
        expect(cls).toBe('strong');
        expect(w).toBeGreaterThanOrEqual(STOP_STRONG.min);
        expect(w).toBeLessThanOrEqual(STOP_STRONG.max);
      }
      const f = demoStopMs(facts({ power: p, crit: true, heavy: true }));
      expect(blowClass(facts({ power: p, crit: true }))).toBe('finisher');
      expect(f).toBeGreaterThanOrEqual(STOP_FINISHER.min);
      expect(f).toBeLessThanOrEqual(STOP_FINISHER.max);
    }
    expect(demoStopMs(facts({ power: 0 }))).toBe(17); // a weak blow holds a frame at least
    expect(demoStopMs(facts({ power: 0.3 - 1e-9 }))).toBe(30);
    expect(demoStopMs(facts({ power: 0.3 }))).toBe(50);
    expect(demoStopMs(facts({ power: 0.7 }))).toBe(80);
    expect(demoStopMs(facts({ power: 1.5, crit: true }))).toBe(150);
  });

  it('a crit, an overkill, a capped blow and the last blow of an Overdrive or Special are finishers; the last of an ordinary flurry is not', () => {
    expect(blowClass(facts({ crit: true }))).toBe('finisher');
    expect(blowClass(facts({ heavy: true }))).toBe('finisher'); // overkill or capped
    expect(blowClass(facts({ big: true, last: true }))).toBe('finisher');
    expect(blowClass(facts({ big: true, last: false, hitIndex: 0, hitCount: 3 }))).not.toBe('finisher');
    expect(blowClass(facts({ hitCount: 3, hitIndex: 2, last: true, power: 0.2 }))).toBe('weak');
  });

  it('a multi-hit action stops on its first and last blow only: the middle ones stop for nothing, a crit among them included', () => {
    const flurry = (i: number, o: Partial<BlowFacts> = {}): BlowFacts => facts({ hitIndex: i, hitCount: 5, last: i === 4, power: 0.9, ...o });
    expect(demoStopMs(flurry(0))).toBeGreaterThanOrEqual(50);
    expect(demoStopMs(flurry(4))).toBeGreaterThanOrEqual(50);
    for (const i of [1, 2, 3]) {
      expect(isMiddleHit(flurry(i))).toBe(true);
      expect(demoStopMs(flurry(i))).toBe(0);
      expect(demoStopMs(flurry(i, { crit: true }))).toBe(0);
    }
    // the last blow SHOWN is what counts (FFX replays a spread round by round): index 2 told last is last, index 4 told not is a middle one
    expect(demoStopMs(facts({ hitIndex: 2, hitCount: 5, last: true, power: 0.9 }))).toBeGreaterThan(0);
    expect(demoStopMs(facts({ hitIndex: 4, hitCount: 5, last: false, power: 0.9 }))).toBe(0);
  });
});

describe('the shake', () => {
  it('grows with power, is more for a crit and an Overdrive\'s last blow, half for the middle of a flurry, and never past 1', () => {
    let prev = 0;
    for (let p = 0; p <= 1.5; p += 0.05) {
      const t = demoTrauma(facts({ power: p }));
      expect(t).toBeGreaterThanOrEqual(prev);
      expect(t).toBeLessThanOrEqual(1);
      prev = t;
    }
    const base = demoTrauma(facts({ power: 0.5 }));
    expect(demoTrauma(facts({ power: 0.5, crit: true }))).toBeGreaterThan(base);
    expect(demoTrauma(facts({ power: 0.5, big: true, last: true }))).toBeGreaterThan(base);
    expect(demoTrauma(facts({ power: 0.5, hitIndex: 1, hitCount: 4, last: false }))).toBeCloseTo(base * 0.5, 9);
    expect(demoTrauma(facts({ power: 0.01 }))).toBeGreaterThan(0.1);
  });

  it('the fallback camera shake (BATTLE SPECTACLE off) is in the old call\'s units: 0.06 to 0.2', () => {
    for (const p of [0, 0.3, 1, 1.5]) {
      const a = demoShakeAmplitude(facts({ power: p, crit: p > 1 }));
      expect(a).toBeGreaterThanOrEqual(0.06);
      expect(a).toBeLessThanOrEqual(0.2);
    }
  });
});

const flags = (o: Partial<SpectacleFlags> = {}): SpectacleFlags => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1, ...o });
const hit = (o: Partial<HitInfo> = {}): HitInfo => ({ crit: false, heavy: false, hitIndex: 0, hitCount: 1, big: false, speed: 'normal', ...o });

describe('option C\'s plan with the demo flag', () => {
  it('without it the plan is today\'s (85 ms on a heavy FFX blow, 28 ms for FFX-2\'s first light hit), whatever the power', () => {
    expect(planHit('ffx', hit({ heavy: true, power: 1.5 }), flags()).freezeMs).toBe(85);
    expect(planHit('ffx2', hit({ power: 1.5 }), flags()).freezeMs).toBe(28);
    expect(planHit('ffx', hit({ power: 0 }), flags({ demo: false })).freezeMs).toBe(40);
  });

  it('with it the stop and the trauma are the demo\'s, in both games, and grow with power', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const weak = planHit(game, hit({ power: 0.1 }), flags({ demo: true }));
      const strong = planHit(game, hit({ power: 0.5 }), flags({ demo: true }));
      const fin = planHit(game, hit({ power: 1, crit: true, heavy: true }), flags({ demo: true }));
      expect(weak.freezeMs).toBe(TODAY_LIGHT_HOLD_MS[game]); // release 60: never lighter than the game's own light hold today (FFX 40, FFX-2 28)
      expect(weak.freezeMs).toBeLessThan(strong.freezeMs);
      expect(strong.freezeMs).toBeGreaterThanOrEqual(50);
      expect(strong.freezeMs).toBeLessThanOrEqual(80);
      expect(fin.freezeMs).toBeGreaterThanOrEqual(100);
      expect(fin.freezeMs).toBeLessThanOrEqual(150);
      expect(weak.trauma).toBeLessThan(strong.trauma);
      expect(strong.trauma).toBeLessThan(fin.trauma);
    }
  });

  it('FFX-2 stops on a first light hit too (the demo\'s rule is the brief\'s, not the game\'s crit-only one); the middle of a flurry never stops', () => {
    expect(planHit('ffx2', hit({ power: 0.5 }), flags({ demo: true })).freezeMs).toBeGreaterThan(0);
    for (const game of ['ffx', 'ffx2'] as const) expect(planHit(game, hit({ hitIndex: 2, hitCount: 5, power: 1, crit: true, heavy: true, lastShown: false }), flags({ demo: true })).freezeMs).toBe(0);
  });

  it('FFX\'s finishing blow is the last one SHOWN (lastShown), exactly as without the flag', () => {
    const last = planHit('ffx', hit({ hitIndex: 4, hitCount: 7, big: true, lastShown: true, power: 1 }), flags({ demo: true }));
    const mid = planHit('ffx', hit({ hitIndex: 6, hitCount: 7, big: true, lastShown: false, power: 1 }), flags({ demo: true }));
    expect(last.freezeMs).toBeGreaterThanOrEqual(100);
    expect(mid.freezeMs).toBe(0);
  });

  it('holds nothing at fast or skip speed, nor under REDUCE MOTION, and keeps the dial', () => {
    expect(planHit('ffx', hit({ power: 1, crit: true, heavy: true, speed: 'fast' }), flags({ demo: true })).freezeMs).toBe(0);
    expect(planHit('ffx', hit({ power: 1, crit: true, heavy: true, speed: 'skip' }), flags({ demo: true })).freezeMs).toBe(0);
    const rm = planHit('ffx', hit({ power: 1, crit: true, heavy: true }), flags({ demo: true, reduceMotion: true }));
    expect(rm.freezeMs).toBe(0);
    expect(rm.trauma).toBe(0);
    expect(planHit('ffx', hit({ power: 1, crit: true, heavy: true }), flags({ demo: true, dial: (n) => (n === 'hitstop' ? 0 : 1) })).freezeMs).toBe(0);
  });
});

describe('release 60: an ordinary hit holds at least what the shipped game holds', () => {
  it('the floors are option C own light holds, FFX 40 ms and FFX-2 28 ms', () => {
    expect(TODAY_LIGHT_HOLD_MS).toEqual({ ffx: 40, ffx2: 28 });
    expect(planHit('ffx', hit({ power: 0 }), flags({ demo: false })).freezeMs).toBe(TODAY_LIGHT_HOLD_MS.ffx);
    expect(planHit('ffx2', hit({ power: 0 }), flags({ demo: false })).freezeMs).toBe(TODAY_LIGHT_HOLD_MS.ffx2);
  });

  it('across the whole range of power no demo blow of either game holds less than the shipped first light hit does', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const today = planHit(game, hit({ power: 0 }), flags({ demo: false })).freezeMs;
      for (let p = 0; p <= 1.5; p += 0.02) {
        const demo = planHit(game, hit({ power: p }), flags({ demo: true })).freezeMs;
        expect(demo).toBeGreaterThanOrEqual(today);
      }
      // a heavy blow today holds 85 (FFX) / crit-only 55 (FFX-2); the demo's finisher holds longer than either
      for (const crit of [true]) expect(planHit(game, hit({ power: 0.2, crit, heavy: crit }), flags({ demo: true })).freezeMs).toBeGreaterThanOrEqual(planHit(game, hit({ power: 0.2, crit, heavy: crit }), flags({ demo: false })).freezeMs);
    }
  });

  it('the demoStopMs floor lifts the weak class only: a strong blow, a finisher and the middle of a flurry are as they were', () => {
    expect(demoStopMs(facts({ power: 0 }), 40)).toBe(40);
    expect(demoStopMs(facts({ power: 0.29 }), 40)).toBe(40);
    expect(demoStopMs(facts({ power: 0 }), 28)).toBe(28);
    expect(demoStopMs(facts({ power: 0.28 }), 28)).toBe(29);
    expect(demoStopMs(facts({ power: 0.5 }), 40)).toBe(demoStopMs(facts({ power: 0.5 })));
    expect(demoStopMs(facts({ power: 1, crit: true }), 40)).toBe(demoStopMs(facts({ power: 1, crit: true })));
    expect(demoStopMs(facts({ hitIndex: 1, hitCount: 4, last: false }), 40)).toBe(0);
  });

  it('with BATTLE SPECTACLE off the beat sleeps at least the lower light hold on an ordinary blow (today it held nothing)', async () => {
    setDemoMotion(true);
    const sleeps: number[] = [];
    const ctx = { stage: { camera: { shake: () => undefined } }, sleep: async (ms: number) => void sleeps.push(ms), speed: () => 'normal', moments: { reducedMotion: false }, hpMaxOf: () => 90000 } as unknown as EventCtx;
    await holdBlow(ctx, { type: 'damage', seq: 1, targetId: 'm', sourceId: 't', amount: 148, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as never, false, null);
    expect(sleeps).toEqual([TODAY_LIGHT_HOLD_MS.ffx2]);
  });
});

describe('release 60: the white flash on a big figure, and REDUCE FLASHES', () => {
  it('is full strength on a party-sized figure, falls in a straight line, and is capped on a boss', () => {
    expect(demoFlashPeak(undefined)).toBe(1);
    expect(demoFlashPeak(2)).toBe(1);
    expect(demoFlashPeak(FLASH_AREA_FULL)).toBe(1);
    expect(demoFlashPeak(FLASH_AREA_BIG)).toBeCloseTo(FLASH_PEAK_MIN, 9);
    expect(demoFlashPeak(40)).toBeCloseTo(FLASH_PEAK_MIN, 9);
    let prev = 1;
    for (let a = 0; a <= 20; a += 0.25) {
      const p = demoFlashPeak(a);
      expect(p).toBeLessThanOrEqual(prev + 1e-12);
      expect(p).toBeGreaterThanOrEqual(FLASH_PEAK_MIN);
      prev = p;
    }
    expect(demoFlashPeak((FLASH_AREA_FULL + FLASH_AREA_BIG) / 2)).toBeCloseTo((1 + FLASH_PEAK_MIN) / 2, 9);
  });

  it('the beat flashes a big figure less than a small one, never more than before', () => {
    setDemoMotion(true);
    const flash = vi.fn();
    const event = { type: 'damage', seq: 1, targetId: 'b', sourceId: 't', amount: 900, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as never;
    blowFlash({ flash, poseSize: [1.2, 1.75] }, event); // a party figure: 2.1
    expect(flash).toHaveBeenLastCalledWith(0xffffff, DEMO_FLASH_MS, 1);
    blowFlash({ flash, poseSize: [4.5, 3.5] }, event); // Bahamut-sized: 15.75
    const [, , big] = flash.mock.calls[flash.mock.calls.length - 1]!;
    expect(big).toBeCloseTo(FLASH_PEAK_MIN, 9);
    expect(big).toBeLessThan(1);
    blowFlash({ flash, poseSize: [-4.5, 3.5] }, event); // a mirrored plane has a negative width: the same size
    expect(flash.mock.calls[flash.mock.calls.length - 1]![2]).toBeCloseTo(FLASH_PEAK_MIN, 9);
  });

  it('REDUCE FLASHES skips the white flash altogether under the demo motion; without the demo motion it is the warm flash of the shipped game either way', () => {
    const flash = vi.fn();
    const event = { type: 'damage', seq: 1, targetId: 'b', sourceId: 't', amount: 900, element: 'none', crit: true, hitIndex: 0, hitCount: 1 } as never;
    setDemoMotion(true);
    blowFlash({ flash }, event, true);
    expect(flash).not.toHaveBeenCalled();
    blowFlash({ flash }, event, false);
    expect(flash).toHaveBeenCalledTimes(1);
    setDemoMotion(false);
    blowFlash({ flash }, event, true); // today's path (the actor softens it itself)
    expect(flash).toHaveBeenLastCalledWith(0xffffff, 260, 1);
  });
});

describe('the stop holds the field clock and nothing else', () => {
  it('HitStop hands the stage a zero dt for its length and the rest of the frame after it, at any frame rate', () => {
    for (const fps of [30, 60, 144]) {
      const s = new HitStop();
      s.freeze(130);
      const dt = 1 / fps;
      let passed = 0;
      for (let i = 0; i < fps * 0.5; i++) passed += s.scale(dt);
      expect(s.frozen).toBe(false);
      expect(0.5 - passed).toBeCloseTo(0.13, 6); // the field fell behind real time by exactly the stop's length: the remainder of the frame it ended in is handed back, nothing is lost or invented
    }
  });
});

describe('the beat', () => {
  const dmg = (o: Partial<Extract<BattleEvent, { type: 'damage' }>> = {}): Extract<BattleEvent, { type: 'damage' }> =>
    ({ type: 'damage', seq: 1, targetId: 'seymour', sourceId: 'tidus', amount: 1800, element: 'none', crit: false, hitIndex: 0, hitCount: 1, ...o }) as never;

  function ctxOf(over: { reduced?: boolean; speed?: string; maxHp?: number; fx?: Partial<FxStagePort> | null } = {}): { ctx: EventCtx; shakes: Array<[number, number]>; sleeps: number[] } {
    const shakes: Array<[number, number]> = [];
    const sleeps: number[] = [];
    const ctx = {
      stage: { camera: { shake: (a: number, ms: number) => void shakes.push([a, ms]) }, ...(over.fx ? { fx: { enabled: () => true, ...over.fx } } : {}) },
      sleep: async (ms: number) => void sleeps.push(ms),
      speed: () => over.speed ?? 'normal',
      moments: { reducedMotion: over.reduced === true },
      hpMaxOf: over.maxHp === undefined ? undefined : () => over.maxHp,
    } as unknown as EventCtx;
    return { ctx, shakes, sleeps };
  }

  it('the flash: warm 200 ms (white 260 ms on a crit) as before; with the switch 0.08 s white at full strength for every blow', () => {
    const flash = vi.fn();
    blowFlash({ flash }, dmg());
    expect(flash).toHaveBeenLastCalledWith(0xffd0c0, 200, 0.8);
    blowFlash({ flash }, dmg({ crit: true }));
    expect(flash).toHaveBeenLastCalledWith(0xffffff, 260, 1);
    setDemoMotion(true);
    blowFlash({ flash }, dmg());
    expect(flash).toHaveBeenLastCalledWith(0xffffff, DEMO_FLASH_MS, 1);
    blowFlash({ flash }, dmg({ crit: true }));
    expect(flash).toHaveBeenLastCalledWith(0xffffff, 80, 1);
    expect(() => blowFlash(undefined, dmg())).not.toThrow();
  });

  it('without the switch the hold is what it was: a heavy blow shakes 0.16 and sleeps the longer of 85 and option C\'s wait, a first light hit shakes 0.08 and sleeps nothing', async () => {
    const a = ctxOf();
    await holdBlow(a.ctx, dmg({ crit: true }), true, null);
    expect(a.shakes).toEqual([[0.16, 340]]);
    expect(a.sleeps).toEqual([85]);
    const b = ctxOf();
    await holdBlow(b.ctx, dmg(), false, { waitMs: 0, shook: false });
    expect(b.shakes).toEqual([[0.08, 220]]);
    expect(b.sleeps).toEqual([]);
    const c = ctxOf();
    await holdBlow(c.ctx, dmg({ crit: true }), true, { waitMs: 120, shook: true });
    expect(c.shakes).toEqual([]);
    expect(c.sleeps).toEqual([120]);
  });

  it('with the switch and option C on, the beat waits out the stop C made and shakes nothing itself', async () => {
    setDemoMotion(true);
    const a = ctxOf();
    await holdBlow(a.ctx, dmg(), false, { waitMs: 70, shook: true });
    expect(a.sleeps).toEqual([70]);
    expect(a.shakes).toEqual([]);
    const b = ctxOf();
    await holdBlow(b.ctx, dmg(), false, { waitMs: 0, shook: true });
    expect(b.sleeps).toEqual([]);
  });

  it('with the switch and option C off, the beat shakes the camera by the blow and sleeps the stop; REDUCE MOTION and any speed but normal do neither', async () => {
    setDemoMotion(true);
    const strong = ctxOf({ maxHp: 3000 });
    await holdBlow(strong.ctx, dmg({ amount: 1800 }), false, null); // 1,800 of 3,000 is power 1.5: a strong blow
    expect(strong.shakes.length).toBe(1);
    expect(strong.shakes[0]![0]).toBeGreaterThan(0.12);
    expect(strong.sleeps.length).toBe(1);
    expect(strong.sleeps[0]!).toBeGreaterThanOrEqual(50);
    const weak = ctxOf({ maxHp: 90000 });
    await holdBlow(weak.ctx, dmg({ amount: 120 }), false, null);
    expect(weak.shakes[0]![0]).toBeLessThan(strong.shakes[0]![0]);
    expect(weak.sleeps[0] ?? 0).toBeLessThan(strong.sleeps[0]!);
    for (const quiet of [{ reduced: true }, { speed: 'fast' }, { speed: 'skip' }]) {
      const q = ctxOf(quiet);
      await holdBlow(q.ctx, dmg({ crit: true }), true, null);
      expect(q.shakes).toEqual([]);
      expect(q.sleeps).toEqual([]);
    }
  });

  it('with the switch and option C off, the middle of a flurry neither shakes nor stops', async () => {
    setDemoMotion(true);
    const m = ctxOf({ maxHp: 3000 });
    await holdBlow(m.ctx, dmg({ amount: 1800, hitIndex: 2, hitCount: 5 }), false, null);
    expect(m.shakes).toEqual([]);
    expect(m.sleeps).toEqual([]);
  });

  it('the hook hands option C the blow\'s power only under the switch, and its wait for every blow only under the switch', () => {
    const calls: Array<Parameters<NonNullable<FxStagePort['hit']>>[0]> = [];
    const fx: FxStagePort = { enabled: () => true, hit: (o) => (calls.push(o), { freezeMs: 60, shook: true }) };
    const { ctx } = ctxOf({ maxHp: 2000 });
    (ctx.stage as unknown as { fx: FxStagePort }).fx = fx;
    const off = fxHit(ctx, dmg({ amount: 1000 }), false);
    expect(calls[0]!.power).toBeUndefined();
    expect(off).toEqual({ waitMs: 0, shook: true }); // a light blow is never waited on without the switch
    setDemoMotion(true);
    const on = fxHit(ctx, dmg({ amount: 1000 }), false);
    expect(calls[1]!.power).toBeCloseTo(hitPower(1000, 2000), 9);
    expect(on).toEqual({ waitMs: 60, shook: true });
  });
});
