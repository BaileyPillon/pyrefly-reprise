/**
 * The frame-budget governor of the conference demo's conditional extras (lane "perf-trim", 2026-10-23; both games, shared plumbing; pure). It watches the 95th percentile of the frame interval over about
 * two seconds against the display's budget, takes the extras away in the driver's r63-play order (the scene a fifth smaller first, then the camera's soft background, then half the particles) with fades
 * and never a pop, and gives them back by probing, with a doubling wait after a failed probe.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULTS, FrameBudgetGovernor, LEVEL_TARGETS, STALL_MS, approach, percentile, type GovernorPlan } from '../../../src/engine/governor/FrameBudget.ts';

/** A deterministic frame stream: `miss` of every `of` frames takes 16.67 ms, the rest 8.33. */
function stream(g: FrameBudgetGovernor, t0: number, seconds: number, miss = 0, of = 20): { t: number; plans: GovernorPlan[] } {
  let t = t0;
  const plans: GovernorPlan[] = [];
  let n = 0;
  const end = t0 + seconds * 1000;
  while (t < end) {
    t += miss > 0 && n % of < miss ? 16.67 : 8.33;
    n++;
    plans.push({ ...g.frame(t) });
  }
  return { t, plans };
}

describe('the percentile helper and the approach step', () => {
  it('takes the p95 of a sorted list and moves a value by at most the step', () => {
    const a = Float64Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(a, 100, 0.95)).toBe(96);
    expect(percentile(a, 0, 0.95)).toBe(0);
    expect(approach(1, 0, 0.25)).toBe(0.75);
    expect(approach(0.1, 0, 0.25)).toBe(0);
    expect(approach(0, 1, 0.4)).toBe(0.4);
    expect(approach(0.5, 0.5, 1)).toBe(0.5);
  });
});

describe('a display that holds its refresh', () => {
  it('never leaves level 0 and every lever stays at 1', () => {
    const g = new FrameBudgetGovernor();
    const { plans } = stream(g, 1000, 30, 0);
    expect(plans.every((p) => p.level === 0 && p.soft === 1 && p.particles === 1 && p.heavy === 1 && !p.fading)).toBe(true);
    expect(g.log.length).toBe(0);
  });

  it('forgives a few missed frames (one in forty is p95 inside the budget)', () => {
    const g = new FrameBudgetGovernor();
    const { plans } = stream(g, 1000, 30, 1, 40);
    expect(plans.every((p) => p.level === 0)).toBe(true);
  });
});

describe('a display that misses its refresh', () => {
  it('takes the smaller scene first, then the soft background, then the particles, one full window apart', () => {
    const g = new FrameBudgetGovernor();
    const { plans } = stream(g, 1000, 14, 3, 20); // 15 % of the frames miss
    const firstAt = (level: number): number => plans.findIndex((p) => p.level >= level);
    expect(firstAt(1)).toBeGreaterThan(0);
    expect(firstAt(2)).toBeGreaterThan(firstAt(1));
    expect(firstAt(3)).toBeGreaterThan(firstAt(2));
    // from rest a full window (about two seconds of frames: over 150); once in trouble half a window of fresh evidence each (about a second: 60 to 150 frames)
    expect(firstAt(1)).toBeGreaterThan(150);
    expect(firstAt(2) - firstAt(1)).toBeGreaterThan(50);
    expect(firstAt(2) - firstAt(1)).toBeLessThan(150);
    expect(plans.at(-1)!.level).toBe(3);
    expect(g.log.map((l) => `${l[1]}>${l[2]}`)).toEqual(['0>1', '1>2', '2>3']);
  });

  it('never goes below level 3', () => {
    const g = new FrameBudgetGovernor();
    const { plans } = stream(g, 1000, 40, 5, 20);
    expect(Math.max(...plans.map((p) => p.level))).toBe(3);
  });

  it('fades every lever: no frame moves one by more than its share of the fade time (no pop)', () => {
    const g = new FrameBudgetGovernor();
    const { plans } = stream(g, 1000, 14, 3, 20);
    const maxStepSoft = 16.67 / DEFAULTS.fadeMs;
    const maxStepParticles = (16.67 / DEFAULTS.fadeMs) * 0.5;
    for (let i = 1; i < plans.length; i++) {
      expect(Math.abs(plans[i]!.soft - plans[i - 1]!.soft)).toBeLessThanOrEqual(maxStepSoft + 1e-9);
      expect(Math.abs(plans[i]!.particles - plans[i - 1]!.particles)).toBeLessThanOrEqual(maxStepParticles + 1e-9);
    }
    // and each lever does arrive
    expect(plans.at(-1)!.soft).toBe(0);
    expect(plans.at(-1)!.particles).toBe(0.5);
  });

  it('asks for the smaller scene at the first level, with the other levers still at rest, and keeps it for every level after', () => {
    const g = new FrameBudgetGovernor();
    const { plans } = stream(g, 1000, 16, 3, 20);
    const at1 = plans.findIndex((p) => p.level === 1);
    expect(at1).toBeGreaterThan(0);
    const half = plans.findIndex((p) => p.heavy === 0.8);
    expect(half).toBe(at1); // the same frame the level is reached
    expect(plans[half]).toMatchObject({ level: 1, soft: 1, particles: 1, fading: false }); // nothing else moves with it
    expect(plans.slice(half).every((p) => p.heavy === 0.8)).toBe(true); // levels 2 and 3 never give it back while they fade
    expect(plans.slice(0, half).every((p) => p.heavy === 1)).toBe(true);
    // the soft background goes at level 2 and the particles at level 3, not before
    expect(plans.filter((p) => p.level === 1).every((p) => p.soft === 1 && p.particles === 1)).toBe(true);
    expect(plans.filter((p) => p.level === 2).every((p) => p.particles === 1)).toBe(true);
    expect(plans.find((p) => p.level === 2 && p.fading)).toBeDefined();
  });

  it('the targets, level by level (the driver\'s order, 2026-10-23)', () => {
    expect(LEVEL_TARGETS).toEqual([
      { soft: 1, particles: 1, heavy: 1 },
      { soft: 1, particles: 1, heavy: 0.8 },
      { soft: 0, particles: 1, heavy: 0.8 },
      { soft: 0, particles: 0.5, heavy: 0.8 },
    ]);
  });
});

describe('readings that are not readings', () => {
  it('a stall (a tab coming back, a shader compile) is not a reading', () => {
    const g = new FrameBudgetGovernor();
    let t = 1000;
    for (let i = 0; i < 400; i++) g.frame((t += 8.33));
    for (let k = 0; k < 6; k++) g.frame((t += STALL_MS + 100)); // six stalls
    const { plans } = stream(g, t, 6, 0);
    expect(plans.every((p) => p.level === 0)).toBe(true);
  });

  it('a hold ignores the frames inside it', () => {
    const g = new FrameBudgetGovernor();
    g.hold(1000, 6000);
    const { plans } = stream(g, 1000, 5.5, 4, 20);
    expect(plans.every((p) => p.level === 0)).toBe(true);
  });

  it('too few frames in a window never judge (a 20 Hz page)', () => {
    const g = new FrameBudgetGovernor();
    let t = 0;
    for (let i = 0; i < 100; i++) g.frame((t += 50));
    expect(g.current).toBe(0);
  });
});

describe('recovery is a probe with a doubling wait', () => {
  /** Drive to level 3, then feed clean frames; returns the time of each step. */
  it('gives one level back after the clean wait, and the next after another', () => {
    const g = new FrameBudgetGovernor();
    let r = stream(g, 1000, 14, 3, 20);
    expect(g.current).toBe(3);
    r = stream(g, r.t, 40, 0);
    // clean frames: one level every (recoverAfterMs + a window) or so, down to 0
    expect(g.current).toBe(0);
    const ups = g.log.filter((l) => l[2] < l[1]);
    expect(ups.map((l) => `${l[1]}>${l[2]}`)).toEqual(['3>2', '2>1', '1>0']);
    expect(ups[1]![0] - ups[0]![0]).toBeGreaterThanOrEqual(DEFAULTS.recoverAfterMs);
    // the levers come back to 1
    expect(r.plans.at(-1)).toMatchObject({ level: 0, soft: 1, particles: 1, heavy: 1 });
  });

  it('a failed probe makes the next wait twice as long, up to the cap', () => {
    const g = new FrameBudgetGovernor();
    let t = 1000;
    let waits: number[] = [];
    for (let round = 0; round < 7; round++) {
      // an over-budget stretch brings it to level 1 (the first step of a fresh run), then a clean stretch long enough to probe, then over again
      const down = stream(g, t, 5, 3, 20);
      t = down.t;
      const before = g.log.length;
      let clean = 0;
      while (g.current > 0 && clean < 200) {
        const s = stream(g, t, 1, 0);
        t = s.t;
        clean++;
      }
      waits.push(g.report().recoverWaitMs);
      void before;
    }
    expect(waits[0]!).toBeGreaterThanOrEqual(DEFAULTS.recoverAfterMs);
    expect(waits.at(-1)!).toBeLessThanOrEqual(DEFAULTS.maxRecoverMs);
    // each failed probe doubled it (until the cap)
    for (let i = 1; i < waits.length; i++) expect(waits[i]!).toBeGreaterThanOrEqual(waits[i - 1]!);
    expect(Math.max(...waits)).toBeGreaterThan(DEFAULTS.recoverAfterMs);
  });
});

describe('determinism and the plan\'s shape', () => {
  it('the same intervals give the same plans', () => {
    const run = (): GovernorPlan[] => stream(new FrameBudgetGovernor(), 1000, 20, 3, 20).plans;
    expect(run()).toEqual(run());
  });

  it('level targets only ever take things away as the level rises', () => {
    for (let i = 1; i < LEVEL_TARGETS.length; i++) {
      expect(LEVEL_TARGETS[i]!.soft).toBeLessThanOrEqual(LEVEL_TARGETS[i - 1]!.soft);
      expect(LEVEL_TARGETS[i]!.particles).toBeLessThanOrEqual(LEVEL_TARGETS[i - 1]!.particles);
      expect(LEVEL_TARGETS[i]!.heavy).toBeLessThanOrEqual(LEVEL_TARGETS[i - 1]!.heavy);
    }
    expect(LEVEL_TARGETS[0]).toEqual({ soft: 1, particles: 1, heavy: 1 });
  });

  it('a 60 Hz display with a 16.67 ms budget holds at level 0 on its own refresh, and a 120 Hz budget on it would step down', () => {
    const g60 = new FrameBudgetGovernor({ budgetMs: 16.67 });
    let t = 1000;
    for (let i = 0; i < 1500; i++) g60.frame((t += 16.67));
    expect(g60.current).toBe(0);
    const g120 = new FrameBudgetGovernor();
    t = 1000;
    for (let i = 0; i < 1500; i++) g120.frame((t += 16.67));
    expect(g120.current).toBeGreaterThan(0);
  });

  it('release() takes the level to 0 so the levers fade back to 1; setBudget ignores nonsense', () => {
    const g = new FrameBudgetGovernor();
    const r = stream(g, 1000, 10, 3, 20);
    expect(g.current).toBeGreaterThan(0);
    g.release(r.t);
    const back = stream(g, r.t, 2, 0);
    expect(back.plans.at(-1)).toMatchObject({ level: 0, soft: 1, particles: 1 });
    g.setBudget(Number.NaN);
    g.setBudget(1000);
    expect(g.budgetMs).toBe(8.33);
    g.setBudget(16.67);
    expect(g.budgetMs).toBe(16.67);
  });
});

describe('a level held by hand (captures, the cost harness)', () => {
  it('pin() sets the level, the levers fade there, and the window never steps it again until the pin is lifted', () => {
    const g = new FrameBudgetGovernor();
    g.pin(2);
    expect(g.current).toBe(2);
    const { plans, t } = (() => {
      const r = stream(g, 1000, 6, 3, 20);
      return { plans: r.plans, t: r.t };
    })();
    expect(plans.at(-1)).toMatchObject({ level: 2, soft: 0, particles: 1, heavy: 0.8 });
    expect(g.current).toBe(2); // slow frames, but pinned: no step to 3
    g.pin(null);
    stream(g, t, 8, 3, 20);
    expect(g.current).toBe(3);
  });
});
